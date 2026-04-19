import { z } from 'zod';

export const liveSessionEditorSchema = z.object({
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
});

export type LiveSessionEditorValues = z.infer<typeof liveSessionEditorSchema>;

export const defaultLiveSessionEditorValues: LiveSessionEditorValues = {
  title: '',
  description: '',
  startTimeLocal: '',
  durationMinutes: 60,
  recordingEnabled: false,
  playbackEnabled: false,
};
