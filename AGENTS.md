# AGENTS.md — Drip MCP Server

This file contains guidance for agents and contributors working within the `drip-mcp-server` package. Its scope is this directory and all subfolders.

## Project Overview

The Drip MCP Server is a Model Context Protocol implementation that provides AI assistants with access to the Drip email marketing platform API. It enables subscriber management, campaign automation, workflow control, and analytics tracking through standardized MCP tools.

## Core Principles

- **Portability First**: Avoid absolute paths; prefer relative paths from the package root and dynamic path resolution
- **Security by Default**: Never commit secrets; read environment from `.env` or the host MCP client
- **Minimal Dependencies**: Keep the server lean; rely on Drip's API and standard Node libraries
- **Clear Errors**: All tool failures should include actionable messages with remediation steps
- **User-Friendly**: Automatic field mapping, rate limiting, and error recovery

## Tech Stack

- **Runtime**: Node.js 20+ (ESM only)
- **HTTP Client**: `axios` ^1.7.9 for Drip API communication
- **MCP SDK**: `@modelcontextprotocol/sdk` ^1.0.0 for protocol implementation
- **Environment**: `dotenv` ^16.4.7 for local environment loading (optional)
- **Testing**: Native Node.js test runner with custom test framework

## Architecture

```
drip-mcp-server/
├── src/
│   ├── index.js           # MCP server implementation & tool handlers
│   ├── drip-client.js     # Drip API client with rate limiting
│   └── tests/             # Comprehensive test suites
│       ├── run.js         # Test runner with fallback support
│       ├── drip-client.test.js    # Unit tests for API client
│       ├── server-tools.test.js   # Tool validation tests
│       └── server-e2e.test.js     # End-to-end integration tests
├── package.json           # Dependencies and scripts
├── mcp.json              # MCP Inspector configuration
├── .env.example          # Environment template
├── CLAUDE.md             # This file - agent guidance
├── LICENSE               # MIT license
└── README.md             # Public documentation
```

## Available Tools (28 total)

### Subscriber Management (9 tools)
- `drip_create_subscriber` - Create/update with automatic field mapping
- `drip_list_subscribers` - Paginated listing with filters
- `drip_get_subscriber` - Fetch by ID or email
- `drip_delete_subscriber` - Permanent deletion
- `drip_unsubscribe` - Manage subscription status
- `drip_tag_subscriber` - Apply tags for segmentation
- `drip_remove_tag` - Remove specific tags
- `drip_search_subscribers` - Advanced multi-criteria search
- `drip_batch_create_subscribers` - Bulk operations (up to 1000)

### Campaign & Workflow (8 tools)
- `drip_list_campaigns` - List all campaigns with status
- `drip_subscribe_to_campaign` - Enroll subscribers
- `drip_list_workflows` - List automation workflows
- `drip_activate_workflow` - Enable workflow
- `drip_pause_workflow` - Pause workflow
- `drip_start_workflow` - Start for specific subscriber
- `drip_remove_from_workflow` - Remove subscriber from workflow
- `drip_batch_unsubscribe` - Bulk unsubscribe operations

### Analytics & Tracking (5 tools)
- `drip_track_event` - Custom event tracking
- `drip_record_conversion` - Conversion tracking
- `drip_record_purchase` - E-commerce purchase tracking
- `drip_recent_unsubscribes` - Recent unsubscribe analysis
- `drip_unsubscribe_stats` - Unsubscribe statistics

### Content & Forms (4 tools)
- `drip_list_forms` - List all forms
- `drip_get_form` - Get form details
- `drip_list_broadcasts` - List broadcasts (read-only)
- `drip_get_broadcast` - Get broadcast details (read-only)

### Account Management (2 tools)
- `drip_get_account` - Account information
- `drip_list_custom_fields` - Custom field definitions

## Development Conventions

### Code Style
- **Module System**: ES modules only (no CommonJS)
- **Async/Await**: Prefer over callbacks/promises
- **Error Handling**: Try-catch with descriptive messages
- **Naming**: Descriptive function names, camelCase for variables
- **Comments**: JSDoc for public APIs, inline for complex logic

### Field Mapping Intelligence
The server automatically handles Drip's field requirements:

```javascript
// Input (simplified for users)
{
  email: "user@example.com",
  first_name: "John",        // Standard field
  company: "Acme Corp"       // Custom field
}

// Output (properly formatted for API)
{
  email: "user@example.com",
  first_name: "John",         // Stays at root
  custom_fields: {
    company: "Acme Corp"      // Moved automatically
  }
}
```

Standard fields: `email`, `first_name`, `last_name`, `user_id`, `time_zone`, `eu_consent`
All others → `custom_fields`

### Error Handling Pattern
```javascript
try {
  const result = await dripClient.method(args);
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
} catch (error) {
  const status = error.response?.status;
  const message = status === 401 ? 'Invalid API key. Check DRIP_API_KEY.' :
                  status === 403 ? 'Permission denied. Check API key permissions.' :
                  status === 422 ? `Validation error: ${error.response?.data?.errors}` :
                  status === 429 ? 'Rate limited. Will retry automatically.' :
                  error.message;
  throw new Error(message);
}
```

## Testing Strategy

### Test Suites
1. **Unit Tests** (`npm run test:unit`)
   - No network required
   - Mock API responses
   - Test field mapping logic
   - Validate error handling

2. **Integration Tests** (`npm test`)
   - Requires API credentials
   - Tests actual Drip API
   - Validates real responses
   - Skips if no credentials

3. **Validation Tests** (`npm run test:validation`)
   - Input validation
   - Schema compliance
   - Edge cases

4. **Specialized Tests**
   - `npm run test:names` - Name field handling
   - `npm run test:unsubscribes` - Unsubscribe tracking

### Running Tests
```bash
# All tests
npm run test:all

# Specific suites
npm run test:unit          # No network needed
npm test                   # Integration (needs credentials)
npm run test:validation    # Input validation
```

## Environment Configuration

### Required Variables
```bash
DRIP_API_KEY=abc_your_api_key_here_xyz
DRIP_ACCOUNT_ID=12345678
```

### Optional Configuration
```bash
# For debugging
DEBUG=drip:*

# For Node.js options
NODE_OPTIONS=--env-file=.env
```

### Security Checklist
- ✅ Never log API keys or sensitive data
- ✅ Use `.env` files (gitignored)
- ✅ Validate all input before API calls
- ✅ Handle rate limits gracefully
- ✅ Provide clear error messages without exposing secrets
- ✅ Use HTTPS only for API communication

## MCP Inspector Integration

The server includes MCP Inspector support for debugging:

```bash
# Launch interactive debugging UI
npm run inspect
```

Features available:
- View all 28 tools with schemas
- Test tool calls interactively
- Monitor messages in real-time
- Validate request/response format

Access at `http://localhost:5173` after launching.

## Release Process

### Pre-Release Checklist
- [ ] Version bumped in `package.json` (SemVer)
- [ ] All tests passing (`npm run test:all`)
- [ ] README updated with any new features
- [ ] CHANGELOG updated with version notes
- [ ] No absolute paths in code or docs
- [ ] `.env.example` reflects all required variables
- [ ] License file present (MIT)
- [ ] No secrets committed

### Versioning Guidelines
- **Major** (1.0.0): Breaking API changes
- **Minor** (0.1.0): New features, backward compatible
- **Patch** (0.0.1): Bug fixes, documentation

### Commit Convention
Use Conventional Commits:
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation only
- `test:` Test additions/changes
- `chore:` Maintenance tasks
- `refactor:` Code restructuring

## API Rate Limits

Drip enforces these limits:
- **Individual requests**: 3,600/hour
- **Batch operations**: 50,000 updates/hour
- **Concurrent requests**: 50 simultaneous

The server automatically:
- Retries with exponential backoff
- Queues requests when approaching limits
- Provides clear feedback on rate limit hits

## Common Issues & Solutions

### Authentication (401)
- **Cause**: Invalid API key
- **Fix**: Verify key in Drip settings, check `.env` file

### Permissions (403)
- **Cause**: API key lacks permissions
- **Fix**: Generate new key with required scopes

### Validation (422)
- **Cause**: Invalid field data
- **Fix**: Check field names, data types, required fields

### Rate Limiting (429)
- **Cause**: Too many requests
- **Fix**: Server auto-retries; reduce frequency if persistent

## Best Practices

### For Development
1. Use `npm run dev` for watch mode
2. Test with `npm run inspect` before committing
3. Write tests for new features
4. Document API changes in README
5. Follow existing code patterns

### For Production
1. Use environment variables for secrets
2. Monitor rate limit usage
3. Implement proper error handling
4. Log errors but not sensitive data
5. Keep dependencies updated

## Support Resources

### This Project
- Repository: https://github.com/gravitykit/drip-mcp-server
- Issues: GitHub Issues for bug reports
- Discussions: GitHub Discussions for questions

### Drip API
- Documentation: https://developer.drip.com/
- Status: https://status.drip.com/
- Support: https://www.drip.com/support

### MCP Protocol
- Specification: https://modelcontextprotocol.io/
- SDK Docs: https://github.com/modelcontextprotocol/sdk
- Community: MCP Discord/Forums

## Notes for AI Agents

When working with this codebase:

1. **Field Mapping**: Let the server handle standard vs. custom fields automatically
2. **Rate Limits**: Don't implement retry logic; it's built-in
3. **Error Messages**: Always provide actionable next steps
4. **Testing**: Run tests before suggesting changes
5. **Documentation**: Update README for user-facing changes
6. **Security**: Never expose API keys in logs or errors
7. **Commits**: Use conventional commit format
8. **Paths**: Keep everything relative for portability

## License

MIT License - See LICENSE file for details