export class PromptReviewValidationError extends Error {
  readonly code = 'INVALID_PROMPT_REVIEW';

  constructor(message: string) {
    super(message);
    this.name = 'PromptReviewValidationError';
  }
}

export function conciseError(error: unknown): string {
  if (error instanceof Error) return error.message.slice(0, 4_000);
  return 'Invalid prompt review';
}
