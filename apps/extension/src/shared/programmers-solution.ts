import { z } from "zod";

import {
  solutionLanguageSchema,
  solutionRecordPayloadSchema,
  type SolutionRecordPayload,
} from "@programmers-badge/shared-types";

const solutionCaptureSchema = z.strictObject({
  problemId: z.string().regex(/^\d+$/).max(32),
  problemName: z.string().trim().min(1).max(200),
  difficulty: z.string().trim().min(1).max(40),
  problemUrl: z.url(),
  language: solutionLanguageSchema,
  sourceCode: z.string().min(1).max(1_000_000).refine((value) => value.trim().length > 0),
  resultSummary: z.string().trim().min(1).max(200),
  performanceSummary: z.string().trim().max(500).nullable(),
  description: z.string().trim().max(20_000),
  constraints: z.string().trim().max(20_000),
  examplesMarkdown: z.string().trim().max(20_000),
});

export type ProgrammersSolutionCapture = z.infer<typeof solutionCaptureSchema>;

export const parseProgrammersSolutionCapture = (input: unknown): ProgrammersSolutionCapture =>
  solutionCaptureSchema.parse(input);

export const createSolutionRecordPayload = ({
  capture,
  submissionId,
  submittedAt,
}: {
  capture: ProgrammersSolutionCapture;
  submissionId: string;
  submittedAt: string;
}): SolutionRecordPayload =>
  solutionRecordPayloadSchema.parse({
    ...capture,
    submissionId,
    submittedAt,
  });
