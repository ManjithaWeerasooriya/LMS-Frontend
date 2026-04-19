import { z } from 'zod';

import { LIVE_SESSION_MEETING_TYPE } from '@/features/teacher/live-sessions/api';

export const liveSessionEditorSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required.').max(200),
    description: z.string().trim().max(4000, 'Description must be 4000 characters or less.'),
    startTimeLocal: z
      .string()
      .trim()
      .min(1, 'Start date and time is required.')
      .refine((value) => !Number.isNaN(new Date(value).getTime()), 'Enter a valid date and time.'),
    durationMinutes: z.number().int().min(1, 'Duration must be at least 1 minute.').max(1440),
    recordingEnabled: z.boolean(),
    playbackEnabled: z.boolean(),
    meetingType: z.union([
      z.literal(LIVE_SESSION_MEETING_TYPE.room),
      z.literal(LIVE_SESSION_MEETING_TYPE.group),
      z.literal(LIVE_SESSION_MEETING_TYPE.teams),
    ]),
    roomId: z.string().trim().max(200, 'Room ID must be 200 characters or less.'),
    groupId: z.string().trim().max(100, 'Group ID must be 100 characters or less.'),
    meetingLink: z.string().trim().max(1000, 'Meeting link must be 1000 characters or less.'),
    meetingId: z.string().trim().max(200, 'Meeting ID must be 200 characters or less.'),
    passcode: z.string().trim().max(200, 'Passcode must be 200 characters or less.'),
  })
  .superRefine((values, context) => {
    if (values.meetingType === LIVE_SESSION_MEETING_TYPE.room && !values.roomId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Room ID is required for room sessions.',
        path: ['roomId'],
      });
    }

    if (values.meetingType === LIVE_SESSION_MEETING_TYPE.group && !values.groupId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Group ID is required for group sessions.',
        path: ['groupId'],
      });
    }

    if (values.meetingType !== LIVE_SESSION_MEETING_TYPE.teams) {
      return;
    }

    if (values.meetingLink) {
      return;
    }

    if (!values.meetingId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Meeting link or meeting ID is required for Teams sessions.',
        path: ['meetingId'],
      });
    }

    if (!values.meetingId && values.passcode) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Meeting ID is required when passcode is provided.',
        path: ['meetingId'],
      });
    }

    if (values.meetingId && !values.passcode) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Passcode is required when using a Teams meeting ID.',
        path: ['passcode'],
      });
    }
  });

export type LiveSessionEditorValues = z.infer<typeof liveSessionEditorSchema>;

export const defaultLiveSessionEditorValues: LiveSessionEditorValues = {
  title: '',
  description: '',
  startTimeLocal: '',
  durationMinutes: 60,
  recordingEnabled: false,
  playbackEnabled: false,
  meetingType: LIVE_SESSION_MEETING_TYPE.room,
  roomId: '',
  groupId: '',
  meetingLink: '',
  meetingId: '',
  passcode: '',
};
