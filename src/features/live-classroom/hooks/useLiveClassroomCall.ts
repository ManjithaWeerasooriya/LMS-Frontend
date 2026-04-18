'use client';

import type {
  Call,
  CallAgent,
  CallClient,
  CallState,
  DeviceManager,
  LocalVideoStream,
  RemoteParticipant,
  RemoteVideoStream,
  VideoDeviceInfo,
  VideoStreamRenderer,
  VideoStreamRendererView,
} from '@azure/communication-calling';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { LiveClassroomJoinToken } from '@/features/live-classroom/api';
import { getLiveClassroomErrorMessage } from '@/features/live-classroom/api';

export type LiveClassroomVideoTile = {
  id: string;
  participantId: string;
  displayName: string;
  target: HTMLElement;
  mediaStreamType: string;
  isReceiving: boolean;
};

type UseLiveClassroomCallOptions = {
  joinToken: LiveClassroomJoinToken | null;
  autoPrepareLocalPreview?: boolean;
};

type CallingSdkModule = typeof import('@azure/communication-calling');
type CommonSdkModule = typeof import('@azure/communication-common');

type UseLiveClassroomCallResult = {
  isInitializing: boolean;
  isJoining: boolean;
  callState: 'idle' | CallState;
  isConnected: boolean;
  isReconnecting: boolean;
  localPreview: LiveClassroomVideoTile | null;
  remoteTiles: LiveClassroomVideoTile[];
  isMuted: boolean;
  isCameraOn: boolean;
  supportsJoining: boolean;
  error: string | null;
  clearError: () => void;
  prepareLocalPreview: () => Promise<void>;
  joinCall: (options?: { withVideo?: boolean; startMuted?: boolean }) => Promise<boolean>;
  leaveCall: () => Promise<void>;
  toggleMicrophone: () => Promise<void>;
  toggleCamera: () => Promise<void>;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readIdentifierRawId = (identifier: unknown): string => {
  if (!isRecord(identifier)) {
    return '';
  }

  if (typeof identifier.rawId === 'string') {
    return identifier.rawId;
  }

  const communicationUser = identifier.communicationUser;
  if (isRecord(communicationUser) && typeof communicationUser.id === 'string') {
    return communicationUser.id;
  }

  return '';
};

const buildLocator = (
  joinToken: LiveClassroomJoinToken,
): { locator: { roomId: string } | { groupId: string }; type: 'room' | 'group' } | null => {
  if (joinToken.acsRoomId) {
    return {
      locator: { roomId: joinToken.acsRoomId },
      type: 'room',
    };
  }

  const rawLocator = joinToken.acsCallLocator?.trim();
  if (!rawLocator) {
    return null;
  }

  if (rawLocator.toLowerCase().startsWith('group:')) {
    return {
      locator: { groupId: rawLocator.slice('group:'.length).trim() },
      type: 'group',
    };
  }

  if (rawLocator.toLowerCase().startsWith('groupid:')) {
    return {
      locator: { groupId: rawLocator.slice('groupid:'.length).trim() },
      type: 'group',
    };
  }

  if (rawLocator.toLowerCase().startsWith('room:')) {
    return {
      locator: { roomId: rawLocator.slice('room:'.length).trim() },
      type: 'room',
    };
  }

  if (rawLocator.toLowerCase().startsWith('roomid:')) {
    return {
      locator: { roomId: rawLocator.slice('roomid:'.length).trim() },
      type: 'room',
    };
  }

  if (UUID_PATTERN.test(rawLocator)) {
    return {
      locator: { groupId: rawLocator },
      type: 'group',
    };
  }

  return null;
};

export function useLiveClassroomCall({
  joinToken,
  autoPrepareLocalPreview = false,
}: UseLiveClassroomCallOptions): UseLiveClassroomCallResult {
  const sdkRef = useRef<CallingSdkModule | null>(null);
  const commonSdkRef = useRef<CommonSdkModule | null>(null);
  const callClientRef = useRef<CallClient | null>(null);
  const callAgentRef = useRef<CallAgent | null>(null);
  const deviceManagerRef = useRef<DeviceManager | null>(null);
  const callRef = useRef<Call | null>(null);
  const localVideoStreamRef = useRef<LocalVideoStream | null>(null);
  const localPreviewRendererRef = useRef<VideoStreamRenderer | null>(null);
  const localPreviewViewRef = useRef<VideoStreamRendererView | null>(null);
  const remoteRendererEntriesRef = useRef<
    Map<string, { renderer: VideoStreamRenderer; view: VideoStreamRendererView }>
  >(new Map());
  const remoteStreamCleanupRef = useRef<Map<string, () => void>>(new Map());
  const participantCleanupRef = useRef<Map<string, () => void>>(new Map());
  const callCleanupRef = useRef<(() => void) | null>(null);
  const hasBeenConnectedRef = useRef(false);
  const disposedRef = useRef(false);

  const [isInitializing, setIsInitializing] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [callState, setCallState] = useState<'idle' | CallState>('idle');
  const [localPreview, setLocalPreview] = useState<LiveClassroomVideoTile | null>(null);
  const [remoteTiles, setRemoteTiles] = useState<LiveClassroomVideoTile[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const disposeRemoteTile = useCallback((key: string) => {
    const cleanup = remoteStreamCleanupRef.current.get(key);
    if (cleanup) {
      cleanup();
      remoteStreamCleanupRef.current.delete(key);
    }

    const entry = remoteRendererEntriesRef.current.get(key);
    if (entry) {
      entry.view.dispose();
      entry.renderer.dispose();
      remoteRendererEntriesRef.current.delete(key);
    }

    setRemoteTiles((current) => current.filter((tile) => tile.id !== key));
  }, []);

  const disposeAllRemoteTiles = useCallback(() => {
    for (const key of [...remoteStreamCleanupRef.current.keys()]) {
      const cleanup = remoteStreamCleanupRef.current.get(key);
      cleanup?.();
    }
    remoteStreamCleanupRef.current.clear();

    for (const entry of remoteRendererEntriesRef.current.values()) {
      entry.view.dispose();
      entry.renderer.dispose();
    }
    remoteRendererEntriesRef.current.clear();
    setRemoteTiles([]);
  }, []);

  const disposeLocalPreview = useCallback(() => {
    localPreviewViewRef.current?.dispose();
    localPreviewRendererRef.current?.dispose();
    localPreviewViewRef.current = null;
    localPreviewRendererRef.current = null;
    setLocalPreview(null);
  }, []);

  const ensureSdkLoaded = useCallback(async () => {
    if (sdkRef.current && commonSdkRef.current) {
      return;
    }

    const [callingSdk, commonSdk] = await Promise.all([
      import('@azure/communication-calling'),
      import('@azure/communication-common'),
    ]);

    sdkRef.current = callingSdk;
    commonSdkRef.current = commonSdk;
  }, []);

  const ensureAgent = useCallback(async () => {
    if (!joinToken) {
      throw new Error('A secure join token is required to initialize the classroom.');
    }

    await ensureSdkLoaded();

    if (!sdkRef.current || !commonSdkRef.current) {
      throw new Error('Azure Communication Services failed to load.');
    }

    if (callAgentRef.current && deviceManagerRef.current) {
      return {
        callAgent: callAgentRef.current,
        deviceManager: deviceManagerRef.current,
      };
    }

    const { CallClient } = sdkRef.current;
    const { AzureCommunicationTokenCredential } = commonSdkRef.current;
    const callClient = new CallClient();
    const credential = new AzureCommunicationTokenCredential(joinToken.token);
    const callAgent = await callClient.createCallAgent(credential, {
      displayName: joinToken.displayName,
    });
    const deviceManager = await callClient.getDeviceManager();

    callClientRef.current = callClient;
    callAgentRef.current = callAgent;
    deviceManagerRef.current = deviceManager;

    return { callAgent, deviceManager };
  }, [ensureSdkLoaded, joinToken]);

  const renderLocalPreview = useCallback(async () => {
    if (!sdkRef.current || !localVideoStreamRef.current) {
      return;
    }

    if (localPreviewViewRef.current) {
      setLocalPreview((current) =>
        current
          ? {
              ...current,
              target: localPreviewViewRef.current?.target ?? current.target,
            }
          : current,
      );
      return;
    }

    const { VideoStreamRenderer } = sdkRef.current;
    const renderer = new VideoStreamRenderer(localVideoStreamRef.current);
    const view = await renderer.createView();

    localPreviewRendererRef.current = renderer;
    localPreviewViewRef.current = view;
    setLocalPreview({
      id: 'local-preview',
      participantId: 'local-preview',
      displayName: 'Local preview',
      target: view.target,
      mediaStreamType: 'Video',
      isReceiving: true,
    });
  }, []);

  const ensureLocalPreview = useCallback(async () => {
    const { deviceManager } = await ensureAgent();

    await deviceManager.askDevicePermission({ audio: true, video: true });
    const cameras = await deviceManager.getCameras();
    const firstCamera = cameras[0] as VideoDeviceInfo | undefined;

    if (!firstCamera) {
      throw new Error('No camera device is available for local preview.');
    }

    await ensureSdkLoaded();
    if (!sdkRef.current) {
      throw new Error('Azure Communication Services video renderer is unavailable.');
    }

    if (!localVideoStreamRef.current) {
      const { LocalVideoStream } = sdkRef.current;
      localVideoStreamRef.current = new LocalVideoStream(firstCamera);
    }

    await renderLocalPreview();
  }, [ensureAgent, ensureSdkLoaded, renderLocalPreview]);

  const syncParticipantTile = useCallback(
    async (participant: RemoteParticipant, stream: RemoteVideoStream) => {
      if (!sdkRef.current) return;

      const participantId = readIdentifierRawId(participant.identifier) || participant.displayName || 'participant';
      const tileId = `${participantId}:${stream.id}:${stream.mediaStreamType}`;

      if (!stream.isAvailable) {
        disposeRemoteTile(tileId);
        return;
      }

      let existing = remoteRendererEntriesRef.current.get(tileId);
      if (!existing) {
        const { VideoStreamRenderer } = sdkRef.current;
        const renderer = new VideoStreamRenderer(stream);
        const view = await renderer.createView();
        existing = { renderer, view };
        remoteRendererEntriesRef.current.set(tileId, existing);
      }

      setRemoteTiles((current) => {
        const nextTile: LiveClassroomVideoTile = {
          id: tileId,
          participantId,
          displayName: participant.displayName?.trim() || 'Participant',
          target: existing.view.target,
          mediaStreamType: stream.mediaStreamType,
          isReceiving: stream.isReceiving,
        };

        const currentIndex = current.findIndex((tile) => tile.id === tileId);
        if (currentIndex === -1) {
          return [...current, nextTile];
        }

        const next = [...current];
        next[currentIndex] = nextTile;
        return next;
      });
    },
    [disposeRemoteTile],
  );

  const subscribeToRemoteStream = useCallback(
    async (participant: RemoteParticipant, stream: RemoteVideoStream) => {
      const participantId = readIdentifierRawId(participant.identifier) || participant.displayName || 'participant';
      const tileId = `${participantId}:${stream.id}:${stream.mediaStreamType}`;

      const handleAvailabilityChanged = () => {
        void syncParticipantTile(participant, stream);
      };

      const handleReceivingChanged = () => {
        void syncParticipantTile(participant, stream);
      };

      stream.on('isAvailableChanged', handleAvailabilityChanged);
      stream.on('isReceivingChanged', handleReceivingChanged);

      remoteStreamCleanupRef.current.set(tileId, () => {
        stream.off('isAvailableChanged', handleAvailabilityChanged);
        stream.off('isReceivingChanged', handleReceivingChanged);
      });

      await syncParticipantTile(participant, stream);
    },
    [syncParticipantTile],
  );

  const subscribeToParticipant = useCallback(
    async (participant: RemoteParticipant) => {
      const participantId = readIdentifierRawId(participant.identifier) || participant.displayName || 'participant';

      for (const stream of participant.videoStreams) {
        await subscribeToRemoteStream(participant, stream);
      }

      const handleVideoStreamsUpdated = (event: {
        added: RemoteVideoStream[];
        removed: RemoteVideoStream[];
      }) => {
        for (const removedStream of event.removed) {
          disposeRemoteTile(`${participantId}:${removedStream.id}:${removedStream.mediaStreamType}`);
        }

        for (const addedStream of event.added) {
          void subscribeToRemoteStream(participant, addedStream);
        }
      };

      const handleDisplayNameChanged = () => {
        setRemoteTiles((current) =>
          current.map((tile) =>
            tile.participantId === participantId
              ? {
                  ...tile,
                  displayName: participant.displayName?.trim() || tile.displayName,
                }
              : tile,
          ),
        );
      };

      participant.on('videoStreamsUpdated', handleVideoStreamsUpdated);
      participant.on('displayNameChanged', handleDisplayNameChanged);

      participantCleanupRef.current.set(participantId, () => {
        participant.off('videoStreamsUpdated', handleVideoStreamsUpdated);
        participant.off('displayNameChanged', handleDisplayNameChanged);

        for (const stream of participant.videoStreams) {
          disposeRemoteTile(`${participantId}:${stream.id}:${stream.mediaStreamType}`);
        }
      });
    },
    [disposeRemoteTile, subscribeToRemoteStream],
  );

  const detachCallListeners = useCallback(() => {
    callCleanupRef.current?.();
    callCleanupRef.current = null;
  }, []);

  const cleanupParticipants = useCallback(() => {
    for (const cleanup of participantCleanupRef.current.values()) {
      cleanup();
    }
    participantCleanupRef.current.clear();
    disposeAllRemoteTiles();
  }, [disposeAllRemoteTiles]);

  const attachCall = useCallback(
    async (call: Call) => {
      detachCallListeners();
      cleanupParticipants();

      callRef.current = call;
      setCallState(call.state);
      setIsMuted(call.isMuted);
      setIsCameraOn(call.isLocalVideoStarted || Boolean(localVideoStreamRef.current));
      hasBeenConnectedRef.current = hasBeenConnectedRef.current || call.state === 'Connected';

      for (const participant of call.remoteParticipants) {
        await subscribeToParticipant(participant);
      }

      const handleStateChanged = () => {
        if (disposedRef.current) return;

        setCallState(call.state);
        setIsMuted(call.isMuted);
        setIsCameraOn(call.isLocalVideoStarted || Boolean(localVideoStreamRef.current));

        if (call.state === 'Connected') {
          hasBeenConnectedRef.current = true;
        }

        if (call.state === 'Disconnected') {
          cleanupParticipants();
        }
      };

      const handleMutedChanged = () => {
        if (disposedRef.current) return;
        setIsMuted(call.isMuted);
      };

      const handleLocalVideoChanged = () => {
        if (disposedRef.current) return;
        setIsCameraOn(call.isLocalVideoStarted || Boolean(localVideoStreamRef.current));
      };

      const handleRemoteParticipantsUpdated = (event: {
        added: RemoteParticipant[];
        removed: RemoteParticipant[];
      }) => {
        for (const removedParticipant of event.removed) {
          const participantId =
            readIdentifierRawId(removedParticipant.identifier) ||
            removedParticipant.displayName ||
            'participant';
          const cleanup = participantCleanupRef.current.get(participantId);
          cleanup?.();
          participantCleanupRef.current.delete(participantId);
        }

        for (const addedParticipant of event.added) {
          void subscribeToParticipant(addedParticipant);
        }
      };

      call.on('stateChanged', handleStateChanged);
      call.on('isMutedChanged', handleMutedChanged);
      call.on('isLocalVideoStartedChanged', handleLocalVideoChanged);
      call.on('remoteParticipantsUpdated', handleRemoteParticipantsUpdated);

      callCleanupRef.current = () => {
        call.off('stateChanged', handleStateChanged);
        call.off('isMutedChanged', handleMutedChanged);
        call.off('isLocalVideoStartedChanged', handleLocalVideoChanged);
        call.off('remoteParticipantsUpdated', handleRemoteParticipantsUpdated);
      };
    },
    [cleanupParticipants, detachCallListeners, subscribeToParticipant],
  );

  const joinCall = useCallback(
    async (options?: { withVideo?: boolean; startMuted?: boolean }) => {
      if (!joinToken) {
        setError('A secure join token is required before joining the classroom.');
        return false;
      }

      const locatorConfig = buildLocator(joinToken);
      if (!locatorConfig) {
        setError(
          'This live session is not configured for ACS joining yet. Add an ACS room or supported call locator on the backend first.',
        );
        return false;
      }

      setIsJoining(true);
      setError(null);
      hasBeenConnectedRef.current = false;

      try {
        const { callAgent } = await ensureAgent();

        if (options?.withVideo) {
          await ensureLocalPreview();
        }

        const joinOptions =
          options?.withVideo && localVideoStreamRef.current
            ? {
                audioOptions: { muted: options?.startMuted ?? false },
                videoOptions: { localVideoStreams: [localVideoStreamRef.current] },
              }
            : { audioOptions: { muted: options?.startMuted ?? false } };

        let call: Call;

        if (locatorConfig.type === 'room') {
          const roomLocator = locatorConfig.locator as { roomId: string };
          call = callAgent.join({ roomId: roomLocator.roomId }, joinOptions);
        } else {
          const groupLocator = locatorConfig.locator as { groupId: string };
          call = callAgent.join({ groupId: groupLocator.groupId }, joinOptions);
        }

        await attachCall(call);
        return true;
      } catch (joinError) {
        setError(
          getLiveClassroomErrorMessage(joinError, 'Unable to connect to the live classroom.'),
        );
        return false;
      } finally {
        setIsJoining(false);
      }
    },
    [attachCall, ensureAgent, ensureLocalPreview, joinToken],
  );

  const leaveCall = useCallback(async () => {
    const call = callRef.current;
    if (!call) {
      return;
    }

    try {
      await call.hangUp();
    } catch {
      // No-op. UI state is reset below.
    } finally {
      detachCallListeners();
      cleanupParticipants();
      callRef.current = null;
      hasBeenConnectedRef.current = false;
      setCallState('idle');
      setIsMuted(false);
      setIsCameraOn(Boolean(localVideoStreamRef.current));
    }
  }, [cleanupParticipants, detachCallListeners]);

  const toggleMicrophone = useCallback(async () => {
    const call = callRef.current;
    if (!call) {
      return;
    }

    setError(null);

    try {
      if (call.isMuted) {
        await call.unmute();
      } else {
        await call.mute();
      }
      setIsMuted(call.isMuted);
    } catch (muteError) {
      setError(
        getLiveClassroomErrorMessage(muteError, 'Unable to update microphone state.'),
      );
    }
  }, []);

  const toggleCamera = useCallback(async () => {
    const call = callRef.current;
    setError(null);

    try {
      if (!localVideoStreamRef.current) {
        await ensureLocalPreview();
      }

      if (!localVideoStreamRef.current) {
        return;
      }

      if (!call) {
        await renderLocalPreview();
        setIsCameraOn(true);
        return;
      }

      if (call.isLocalVideoStarted) {
        await call.stopVideo(localVideoStreamRef.current);
        setIsCameraOn(false);
      } else {
        await call.startVideo(localVideoStreamRef.current);
        setIsCameraOn(true);
      }
    } catch (cameraError) {
      setError(getLiveClassroomErrorMessage(cameraError, 'Unable to update camera state.'));
    }
  }, [ensureLocalPreview, renderLocalPreview]);

  useEffect(() => {
    if (!joinToken || !autoPrepareLocalPreview) {
      return;
    }

    let cancelled = false;

    const initializePreview = async () => {
      setIsInitializing(true);
      setError(null);

      try {
        await ensureLocalPreview();
      } catch (previewError) {
        if (!cancelled) {
          setError(
            getLiveClassroomErrorMessage(
              previewError,
              'Unable to prepare the local classroom preview.',
            ),
          );
        }
      } finally {
        if (!cancelled) {
          setIsInitializing(false);
        }
      }
    };

    void initializePreview();

    return () => {
      cancelled = true;
    };
  }, [autoPrepareLocalPreview, ensureLocalPreview, joinToken]);

  useEffect(() => {
    return () => {
      disposedRef.current = true;
      void leaveCall();
      cleanupParticipants();
      disposeLocalPreview();
      localVideoStreamRef.current = null;
      void callAgentRef.current?.dispose();
      void callClientRef.current?.dispose();
    };
  }, [cleanupParticipants, disposeLocalPreview, leaveCall]);

  const supportsJoining = useMemo(() => Boolean(joinToken && buildLocator(joinToken)), [joinToken]);

  return {
    isInitializing,
    isJoining,
    callState,
    isConnected: callState === 'Connected',
    isReconnecting: hasBeenConnectedRef.current && callState === 'Connecting',
    localPreview,
    remoteTiles,
    isMuted,
    isCameraOn,
    supportsJoining,
    error,
    clearError,
    prepareLocalPreview: ensureLocalPreview,
    joinCall,
    leaveCall,
    toggleMicrophone,
    toggleCamera,
  };
}
