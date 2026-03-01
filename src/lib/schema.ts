import { z } from "zod";

export const ErrorAnnotationSchema = z.object({
  original: z.string(),
  issue: z.string(),
  suggestion: z.string(),
  error_type: z.enum(["grammar", "vocabulary", "structure", "coherence", "punctuation", "spelling"])
});

export const ImprovementNoteSchema = z.object({
  type: z.enum([
    "vocabulary_upgrade",
    "restructure",
    "formality_adjustment",
    "conciseness",
    "coherence_link",
    "task_fulfilment",
    "data_precision"
  ]),
  before: z.string(),
  after: z.string(),
  reason: z.string()
});

export const PillarScoreSchema = z.object({
  score: z.number().min(0).max(9),
  feedback: z.string()
});

export const PillarsSchema = z.object({
  task_achievement: PillarScoreSchema.optional(),
  task_response: PillarScoreSchema.optional(),
  coherence_cohesion: PillarScoreSchema,
  lexical_resource: PillarScoreSchema,
  grammatical_range_accuracy: PillarScoreSchema
});

export const GradingResponseSchema = z.object({
  task_type: z.enum(["task1", "task2"]),
  overall_band_score: z.number().min(0).max(9),
  justification: z.string(),
  pillars: PillarsSchema,
  errors: z.array(ErrorAnnotationSchema),
  improvement_notes: z.array(ImprovementNoteSchema),
  improved_version: z.string(),
  self_check: z.string()
});

export type GradingResponse = z.infer<typeof GradingResponseSchema>;
export type ErrorAnnotation = z.infer<typeof ErrorAnnotationSchema>;
export type ImprovementNote = z.infer<typeof ImprovementNoteSchema>;
