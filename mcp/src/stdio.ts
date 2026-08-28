import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createRestructureServer } from './create-server.js';

const server = await createRestructureServer();
const transport = new StdioServerTransport();
await server.connect(transport);
