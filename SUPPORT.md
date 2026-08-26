# Support

Restructure is a local/repository marketplace package. Support starts
with the text-only workflow because it works even when the optional MCP card
cannot load.

## Before reporting an issue

Record:

- Restructure release and host surface.
- Operating system and host version, if known.
- Whether explicit skill invocation worked.
- Whether the text review appeared.
- Whether the problem affected the MCP card, the follow-up action, or both.
- The exact command or sanitized reproduction steps.

Never attach raw prompts, conversation transcripts, access tokens, uploaded
files, or private repository content unless they have been redacted.

## Common recovery

Restart the host, install from the repository marketplace again, and start a
new conversation. Confirm that the checkout contains the bundled mcp/dist
artifacts. If the card is unavailable, continue with the text fallback.

## Contact process

Maintainers should configure the repository's GitHub Issues link and a
security contact before public release. Until that is configured, use the
repository maintainers' normal private channel. This document intentionally
does not fabricate an email address, owner, domain, or URL.
