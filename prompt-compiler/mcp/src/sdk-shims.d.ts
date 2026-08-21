declare module '@modelcontextprotocol/sdk/server/mcp.js' {
  export class McpServer {
    constructor(info: { name: string; version: string });
    registerResource(name: string, uri: string, metadata: Record<string, unknown>, callback: (uri: URL) => Promise<unknown>): void;
    registerTool(name: string, metadata: Record<string, unknown>, callback: (input: unknown) => Promise<unknown>): any;
    connect(transport: unknown): Promise<void>;
  }
}

declare module '@modelcontextprotocol/sdk/server/stdio.js' {
  export class StdioServerTransport {
    constructor();
  }
}
