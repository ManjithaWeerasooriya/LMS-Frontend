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

type NormalizedJoinLocator =
  {
    type: 'room';
    locator: { roomId: string };
    backendField: 'roomId';
  };

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

const normalizeLocatorValue = (value: string | null | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

export const buildLocator = (joinToken: LiveClassroomJoinToken): NormalizedJoinLocator | null => {
  const roomId = normalizeLocatorValue(joinToken.roomId);
  return roomId
    ? {
        type: 'room',
        locator: { roomId },
        backendField: 'roomId',
      }
    : null;
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
  const disposedRef = useRef(false);
  const runtimeVersionRef = useRef(0);
  const agentKeyRef = useRef<string | null>(null);

  const [isInitializing, setIsInitializing] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [callState, setCallState] = useState<'idle' | CallState>('idle');
  const [localPreview, setLocalPreview] = useState<LiveClassroomVideoTile | null>(null);
  const [remoteTiles, setRemoteTiles] = useState<LiveClassroomVideoTile[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [hasBeenConnected, setHasBeenConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const isRuntimeCurrent = useCallback(
    (version: number) => !disposedRef.current && version === runtimeVersionRef.current,
    [],
  );

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

  const resetCallState = useCallback(
    async (options?: {
      hangUp?: boolean;
      disposeAgent?: boolean;
      disposePreview?: boolean;
      disposeLocalStream?: boolean;
      clearError?: boolean;
    }) => {
      runtimeVersionRef.current += 1;

      const shouldHangUp = options?.hangUp ?? false;
      const shouldDisposeAgent = options?.disposeAgent ?? false;
      const shouldDisposePreview = options?.disposePreview ?? true;
      const shouldDisposeLocalStream = options?.disposeLocalStream ?? shouldDisposePreview;

      const call = callRef.current;
      callRef.current = null;

      const callCleanup = callCleanupRef.current;
      callCleanupRef.current = null;

      const participantCleanups = [...participantCleanupRef.current.values()];
      participantCleanupRef.current.clear();

      const remoteStreamCleanups = [...remoteStreamCleanupRef.current.values()];
      remoteStreamCleanupRef.current.clear();

      const remoteRendererEntries = [...remoteRendererEntriesRef.current.values()];
      remoteRendererEntriesRef.current.clear();

      const previewView = localPreviewViewRef.current;
      const previewRenderer = localPreviewRendererRef.current;

      if (shouldDisposePreview) {
        localPreviewViewRef.current = null;
        localPreviewRendererRef.current = null;
      }

      const localVideoStream = localVideoStreamRef.current;
      if (shouldDisposeLocalStream) {
        localVideoStreamRef.current = null;
      }

      const callAgent = shouldDisposeAgent ? callAgentRef.current : null;
      const callClient = shouldDisposeAgent ? callClientRef.current : null;

      if (shouldDisposeAgent) {
        callAgentRef.current = null;
        callClientRef.current = null;
        deviceManagerRef.current = null;
        agentKeyRef.current = null;
      }

      callCleanup?.();
      participantCleanups.forEach((cleanup) => cleanup());
      remoteStreamCleanups.forEach((cleanup) => cleanup());
      remoteRendererEntries.forEach((entry) => {
        entry.view.dispose();
        entry.renderer.dispose();
      });

      if (shouldDisposePreview) {
        previewView?.dispose();
        previewRenderer?.dispose();
        setLocalPreview(null);
      }

      if (shouldDisposeLocalStream) {
        localVideoStream?.dispose();
      }

      setHasBeenConnected(false);
      setIsInitializing(false);
      setIsJoining(false);
      setCallState('idle');
      setRemoteTiles([]);
      setIsMuted(false);
      setIsCameraOn(
        !shouldDisposePreview &&
          !shouldDisposeLocalStream &&
          Boolean(localVideoStreamRef.current || localVideoStream),
      );

      if (options?.clearError) {
        setError(null);
      }

      if (shouldHangUp && call) {
        try {
          await call.hangUp();
        } catch {
          // No-op. Runtime refs and state are already cleared.
        }
      }

      if (shouldDisposeAgent) {
        try {
          await callAgent?.dispose();
        } catch {
          // No-op. A failed dispose should not block recreation.
        }

        try {
          await callClient?.dispose();
        } catch {
          // No-op. A failed dispose should not block recreation.
        }
      }
    },
    [],
  );

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

    const joinTokenKey = JSON.stringify({
      sessionId: joinToken.session.id,
      userId: joinToken.acsUserId,
      token: joinToken.token,
      displayName: joinToken.displayName,
    });

    if (
      callAgentRef.current &&
      deviceManagerRef.current &&
      agentKeyRef.current === joinTokenKey
    ) {
      return {
        callAgent: callAgentRef.current,
        deviceManager: deviceManagerRef.current,
      };
    }

    await resetCallState({
      hangUp: true,
      disposeAgent: true,
      disposePreview: false,
      disposeLocalStream: false,
      clearError: false,
    });

    const runtimeVersion = runtimeVersionRef.current;
    const { CallClient } = sdkRef.current;
    const { AzureCommunicationTokenCredential } = commonSdkRef.current;
    const callClient = new CallClient();
    const credential = new AzureCommunicationTokenCredential(joinToken.token);
    const callAgent = await callClient.createCallAgent(credential, {
      displayName: joinToken.displayName,
    });
    const deviceManager = await callClient.getDeviceManager();

    if (!isRuntimeCurrent(runtimeVersion)) {
      try {
        await callAgent.dispose();
      } catch {
        // No-op.
      }

      try {
        await callClient.dispose();
      } catch {
        // No-op.
      }

      throw new Error('Azure Communication Services initialization was reset before completion.');
    }

    callClientRef.current = callClient;
    callAgentRef.current = callAgent;
    deviceManagerRef.current = deviceManager;
    agentKeyRef.current = joinTokenKey;

    return { callAgent, deviceManager };
  }, [ensureSdkLoaded, isRuntimeCurrent, joinToken, resetCallState]);

  const renderLocalPreview = useCallback(
    async (expectedRuntimeVersion = runtimeVersionRef.current) => {
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
      const localVideoStream = localVideoStreamRef.current;
      const renderer = new VideoStreamRenderer(localVideoStream);
      const view = await renderer.createView();

      if (
        !isRuntimeCurrent(expectedRuntimeVersion) ||
        localVideoStreamRef.current !== localVideoStream
      ) {
        view.dispose();
        renderer.dispose();
        return;
      }

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
    },
    [isRuntimeCurrent],
  );

  const ensureLocalPreview = useCallback(async () => {
    const { deviceManager } = await ensureAgent();
    const runtimeVersion = runtimeVersionRef.current;

    await deviceManager.askDevicePermission({ audio: true, video: true });
    const cameras = await deviceManager.getCameras();
    const firstCamera = cameras[0] as VideoDeviceInfo | undefined;

    if (!isRuntimeCurrent(runtimeVersion)) {
      return;
    }

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

    await renderLocalPreview(runtimeVersion);
  }, [ensureAgent, ensureSdkLoaded, isRuntimeCurrent, renderLocalPreview]);

  const syncParticipantTile = useCallback(
    async (
      participant: RemoteParticipant,
      stream: RemoteVideoStream,
      expectedRuntimeVersion = runtimeVersionRef.current,
    ) => {
      if (!sdkRef.current || !isRuntimeCurrent(expectedRuntimeVersion)) return;

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

        if (!isRuntimeCurrent(expectedRuntimeVersion)) {
          view.dispose();
          renderer.dispose();
          return;
        }

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
    [disposeRemoteTile, isRuntimeCurrent],
  );

  const subscribeToRemoteStream = useCallback(
    async (
      participant: RemoteParticipant,
      stream: RemoteVideoStream,
      expectedRuntimeVersion = runtimeVersionRef.current,
    ) => {
      if (!isRuntimeCurrent(expectedRuntimeVersion)) {
        return;
      }

      const participantId = readIdentifierRawId(participant.identifier) || participant.displayName || 'participant';
      const tileId = `${participantId}:${stream.id}:${stream.mediaStreamType}`;

      const handleAvailabilityChanged = () => {
        void syncParticipantTile(participant, stream, expectedRuntimeVersion);
      };

      const handleReceivingChanged = () => {
        void syncParticipantTile(participant, stream, expectedRuntimeVersion);
      };

      stream.on('isAvailableChanged', handleAvailabilityChanged);
      stream.on('isReceivingChanged', handleReceivingChanged);

      remoteStreamCleanupRef.current.set(tileId, () => {
        stream.off('isAvailableChanged', handleAvailabilityChanged);
        stream.off('isReceivingChanged', handleReceivingChanged);
      });

      await syncParticipantTile(participant, stream, expectedRuntimeVersion);
    },
    [isRuntimeCurrent, syncParticipantTile],
  );

  const subscribeToParticipant = useCallback(
    async (participant: RemoteParticipant, expectedRuntimeVersion = runtimeVersionRef.current) => {
      if (!isRuntimeCurrent(expectedRuntimeVersion)) {
        return;
      }

      const participantId = readIdentifierRawId(participant.identifier) || participant.displayName || 'participant';

      for (const stream of participant.videoStreams) {
        await subscribeToRemoteStream(participant, stream, expectedRuntimeVersion);
      }

      const handleVideoStreamsUpdated = (event: {
        added: RemoteVideoStream[];
        removed: RemoteVideoStream[];
      }) => {
        for (const removedStream of event.removed) {
          disposeRemoteTile(`${participantId}:${removedStream.id}:${removedStream.mediaStreamType}`);
        }

        for (const addedStream of event.added) {
          void subscribeToRemoteStream(participant, addedStream, expectedRuntimeVersion);
        }
      };

      const handleDisplayNameChanged = () => {
        if (!isRuntimeCurrent(expectedRuntimeVersion)) {
          return;
        }

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
    [disposeRemoteTile, isRuntimeCurrent, subscribeToRemoteStream],
  );

  const attachCall = useCallback(
    async (call: Call) => {
      await resetCallState({
        hangUp: false,
        disposeAgent: false,
        disposePreview: false,
        disposeLocalStream: false,
        clearError: false,
      });

      const runtimeVersion = runtimeVersionRef.current;

      if (!isRuntimeCurrent(runtimeVersion)) {
        return;
      }

      callRef.current = call;
      setCallState(call.state);
      setIsMuted(call.isMuted);
      setIsCameraOn(call.isLocalVideoStarted || Boolean(localVideoStreamRef.current));
      setHasBeenConnected((current) => current || call.state === 'Connected');

      for (const participant of call.remoteParticipants) {
        await subscribeToParticipant(participant, runtimeVersion);
      }

      const handleStateChanged = () => {
        if (disposedRef.current) return;

        setCallState(call.state);
        setIsMuted(call.isMuted);
        setIsCameraOn(call.isLocalVideoStarted || Boolean(localVideoStreamRef.current));

        if (call.state === 'Connected') {
          setHasBeenConnected(true);
        }

        if (call.state === 'Disconnected') {
          void resetCallState({
            hangUp: false,
            disposeAgent: false,
            disposePreview: false,
            disposeLocalStream: false,
            clearError: false,
          });
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
          void subscribeToParticipant(addedParticipant, runtimeVersion);
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
    [isRuntimeCurrent, resetCallState, subscribeToParticipant],
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
          'This live session is not configured for ACS joining yet. The backend must provide a valid meeting type and matching locator field.',
        );
        return false;
      }

      setIsJoining(true);
      setError(null);
      setHasBeenConnected(false);

      try {
        await resetCallState({
          hangUp: true,
          disposeAgent: false,
          disposePreview: false,
          disposeLocalStream: false,
          clearError: false,
        });

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

        console.info('[LiveClassroomCall] ACS join locator', {
          sessionId: joinToken.session.id,
          locatorType: locatorConfig.type,
          backendField: locatorConfig.backendField,
          locator: locatorConfig.locator,
        });

        const call = callAgent.join(locatorConfig.locator, joinOptions);

        await attachCall(call);
        return true;
      } catch (joinError) {
        await resetCallState({
          hangUp: true,
          disposeAgent: false,
          disposePreview: false,
          disposeLocalStream: false,
          clearError: false,
        });
        setError(
          getLiveClassroomErrorMessage(joinError, 'Unable to connect to the live classroom.'),
        );
        return false;
      } finally {
        setIsJoining(false);
      }
    },
    [attachCall, ensureAgent, ensureLocalPreview, joinToken, resetCallState],
  );

  const leaveCall = useCallback(async () => {
    await resetCallState({
      hangUp: true,
      disposeAgent: false,
      disposePreview: false,
      disposeLocalStream: false,
      clearError: false,
    });
  }, [resetCallState]);

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
    disposedRef.current = false;

    return () => {
      disposedRef.current = true;
    };
  }, []);

  useEffect(() => {
    void resetCallState({
      hangUp: true,
      disposeAgent: true,
      disposePreview: true,
      disposeLocalStream: true,
      clearError: true,
    });

    return () => {
      void resetCallState({
        hangUp: true,
        disposeAgent: true,
        disposePreview: true,
        disposeLocalStream: true,
        clearError: false,
      });
    };
  }, [
    joinToken?.roomId,
    joinToken?.acsUserId,
    joinToken?.displayName,
    joinToken?.session.id,
    joinToken?.token,
    resetCallState,
  ]);

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

  const supportsJoining = useMemo(() => Boolean(joinToken && buildLocator(joinToken)), [joinToken]);

  return {
    isInitializing,
    isJoining,
    callState,
    isConnected: callState === 'Connected',
    isReconnecting: hasBeenConnected && callState === 'Connecting',
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
