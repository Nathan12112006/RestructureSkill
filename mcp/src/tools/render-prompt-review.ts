import { z } from 'zod';
import { conciseError, PromptReviewValidationError } from '../errors.js';
import { renderTextFallback } from '../review-fallback.js';
import { promptReviewSchema, validatePromptReview, type PromptReview } from '../schema.js';

export const UI_RESOURCE_URI = 'ui://restructure/prompt-review-v1.html';
export const UI_RESOURCE_MIME = 'text/html;profile=mcp-app';

export type RenderedPromptReview = {
  structuredContent: {
    review: PromptReview;
    fallback_text: string;
    ui_resource_uri: string;
  };
  content: Array<{
    type: 'text' | 'resource_link';
    text?: string;
    uri?: string;
    name?: string;
    mimeType?: string;
  }>;
};

// Pass the strict object itself to the SDK so unknown payload fields are not
// silently stripped at the protocol boundary.
export const renderPromptReviewInputSchema = promptReviewSchema;
export const renderPromptReviewOutputSchema = z.object({
  review: promptReviewSchema,
  fallback_text: z.string(),
  ui_resource_uri: z.string(),
}).strict();

export function renderPromptReview(input: unknown): RenderedPromptReview {
  let review: PromptReview;
  try {
    review = validatePromptReview(input);
  } catch (error) {
    throw new PromptReviewValidationError(conciseError(error));
  }
  const fallback = renderTextFallback(review);
  return {
    structuredContent: {
      review,
      fallback_text: fallback,
      ui_resource_uri: UI_RESOURCE_URI,
    },
    content: [
      { type: 'text', text: fallback },
      {
        type: 'resource_link',
        uri: UI_RESOURCE_URI,
        name: 'Restructure review interface',
        mimeType: UI_RESOURCE_MIME,
      },
    ],
  };
}
