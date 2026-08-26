import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { UI_RESOURCE_MIME, UI_RESOURCE_URI, renderPromptReview, renderPromptReviewInputSchema, renderPromptReviewOutputSchema } from './tools/render-prompt-review.js';
import { conciseError } from './errors.js';
import reviewHtml from '../public/prompt-review.html';

export const SERVER_NAME = 'prompt-compiler';
export const SERVER_VERSION = '1.0.0';

export { renderPromptReview, UI_RESOURCE_URI, UI_RESOURCE_MIME } from './tools/render-prompt-review.js';
export { actionMessage, renderTextFallback, promptHash } from './review-fallback.js';

export async function createPromptCompilerServer(): Promise<McpServer> {
  const server = new McpServer({ name: SERVER_NAME, version: SERVER_VERSION });
  server.registerResource(
    'prompt-review-ui',
    UI_RESOURCE_URI,
    {
      description: 'Prompt Compiler review interface',
      mimeType: UI_RESOURCE_MIME,
    },
    async (uri) => ({
      contents: [{
        uri: uri.href,
        mimeType: UI_RESOURCE_MIME,
        text: reviewHtml,
        _meta: { ui: { prefersBorder: true, csp: { connectDomains: [], resourceDomains: [] } } },
      }],
    }),
  );

  server.registerTool(
    'render_prompt_review',
    {
      title: 'Render Prompt Compiler review',
      description: 'Validate and render a closed-world Prompt Compiler review. This tool never executes or sends the reviewed prompt.',
      inputSchema: renderPromptReviewInputSchema,
      outputSchema: renderPromptReviewOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
      _meta: {
        ui: { resourceUri: UI_RESOURCE_URI },
        'openai/outputTemplate': UI_RESOURCE_URI,
      },
    },
    async (input: unknown) => {
      try {
        return renderPromptReview(input);
      } catch (error) {
        return {
          isError: true,
          content: [{ type: 'text' as const, text: conciseError(error) }],
        };
      }
    },
  );
  return server;
}
