import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createPromptCompilerServer } from './create-server.js';

const server = await createPromptCompilerServer();
const transport = new StdioServerTransport();
await server.connect(transport);
