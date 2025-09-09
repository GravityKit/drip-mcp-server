# Drip MCP Server

[![npm version](https://img.shields.io/npm/v/@gravitykit/drip-mcp-server.svg)](https://www.npmjs.com/package/@gravitykit/drip-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/@gravitykit/drip-mcp-server.svg)](https://nodejs.org)
[![MCP Protocol](https://img.shields.io/badge/MCP-1.0.0-blue)](https://modelcontextprotocol.io)

A Model Context Protocol (MCP) server that provides seamless integration with the [Drip](https://www.drip.com) email marketing automation platform. This server enables AI assistants like Claude to interact with Drip's API for subscriber management, campaign automation, and analytics tracking.

## 🌟 Features

### Core Capabilities

- **🧑‍🤝‍🧑 Subscriber Management** - Create, update, delete, and search subscribers with full custom field support
- **🏷️ Tag Operations** - Apply and remove tags for segmentation and automation
- **📧 Campaign Management** - List campaigns and manage subscriber enrollments
- **🔄 Workflow Automation** - Control workflows and subscriber participation
- **📊 Event Tracking** - Track custom events for behavioral automation
- **💰 E-commerce Integration** - Record purchases and conversions
- **📝 Form & Broadcast Access** - Retrieve forms and broadcast information
- **⚡ Batch Operations** - Efficiently handle bulk subscriber operations
- **🔍 Advanced Search** - Find subscribers using complex filter criteria

### Technical Features

- **🛡️ Automatic Rate Limiting** - Handles Drip's API limits with exponential backoff
- **🔧 Smart Field Mapping** - Automatically organizes standard and custom fields
- **🎯 Error Handling** - Detailed error messages for debugging
- **🧪 Comprehensive Testing** - Unit and integration test suites included
- **🔍 MCP Inspector Support** - Built-in debugging interface for development

## 📦 Installation

### Prerequisites

- Node.js 20.0.0 or higher
- npm or yarn package manager
- Drip account with API access
- MCP-compatible client (e.g., [Claude Desktop](https://claude.ai/download))

### Package Installation

```bash
# Using npm
npm install @gravitykit/drip-mcp-server

# Using yarn
yarn add @gravitykit/drip-mcp-server

# For global installation
npm install -g @gravitykit/drip-mcp-server
```

### From Source

```bash
# Clone the repository
git clone https://github.com/GravityKit/drip-mcp-server.git
cd drip-mcp-server

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials
```

## 🔑 Configuration

### Getting Your API Credentials

1. **API Key**:
   - Log in to your [Drip account](https://www.getdrip.com)
   - Navigate to **Settings** → **My User Settings** → **API**
   - Copy your API Key
   - Direct link: https://www.getdrip.com/user/edit

2. **Account ID**:
   - Found in **Settings** → **General Info**
   - Also visible in your Drip dashboard URL
   - Format: Numeric ID (e.g., `12345678`)

### Environment Variables

Create a `.env` file in the project root:

```bash
DRIP_API_KEY=your_api_key_here
DRIP_ACCOUNT_ID=your_account_id_here
```

### Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "drip": {
      "command": "npx",
      "args": ["@gravitykit/drip-mcp-server"],
      "env": {
        "DRIP_API_KEY": "your_api_key_here",
        "DRIP_ACCOUNT_ID": "your_account_id_here"
      }
    }
  }
}
```

### Alternative: Using Local Installation

```json
{
  "mcpServers": {
    "drip": {
      "command": "node",
      "args": ["/path/to/drip-mcp-server/src/index.js"],
      "env": {
        "DRIP_API_KEY": "your_api_key_here",
        "DRIP_ACCOUNT_ID": "your_account_id_here"
      }
    }
  }
}
```

## 🚀 Usage

### Quick Start

Once configured, the MCP server exposes Drip functionality through standardized tools. Your AI assistant can use natural language to interact with these tools.

#### Example Prompts for AI Assistants

```text
"Add john@example.com to my Drip subscribers with the tag 'customer'"

"Find all subscribers tagged as 'vip' who joined this month"

"Track a 'Product Viewed' event for user@example.com with product_id ABC123"

"Start the 'Welcome Series' workflow for new@subscriber.com"

"Show me the last 10 unsubscribes and their reasons"
```

### Available Tools

#### Subscriber Management

| Tool | Description |
|------|-------------|
| `drip_create_subscriber` | Create or update a subscriber |
| `drip_list_subscribers` | List all subscribers with pagination |
| `drip_get_subscriber` | Get a specific subscriber by ID or email |
| `drip_delete_subscriber` | Permanently delete a subscriber |
| `drip_search_subscribers` | Advanced search with filters |
| `drip_batch_create_subscribers` | Bulk create/update (up to 1000) |

#### Tags & Segmentation

| Tool | Description |
|------|-------------|
| `drip_tag_subscriber` | Apply tags to a subscriber |
| `drip_remove_tag` | Remove a tag from a subscriber |

#### Campaigns & Workflows

| Tool | Description |
|------|-------------|
| `drip_list_campaigns` | List all campaigns |
| `drip_subscribe_to_campaign` | Add subscriber to campaign |
| `drip_list_workflows` | List all workflows |
| `drip_activate_workflow` | Activate a workflow |
| `drip_pause_workflow` | Pause a workflow |
| `drip_start_workflow` | Start workflow for subscriber |
| `drip_remove_from_workflow` | Remove subscriber from workflow |

#### Analytics & Tracking

| Tool | Description |
|------|-------------|
| `drip_track_event` | Track custom events |
| `drip_record_conversion` | Record a conversion |
| `drip_record_purchase` | Record a purchase |
| `drip_recent_unsubscribes` | Get recent unsubscribes |
| `drip_unsubscribe_stats` | Get unsubscribe statistics |

#### Forms & Broadcasts

| Tool | Description |
|------|-------------|
| `drip_list_forms` | List all forms |
| `drip_get_form` | Get specific form details |
| `drip_list_broadcasts` | List all broadcasts |
| `drip_get_broadcast` | Get specific broadcast details |

### Code Examples

#### Creating a Subscriber

```javascript
{
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "tags": ["customer", "newsletter"],
  "custom_fields": {
    "company": "Acme Corp",
    "plan": "premium"
  },
  "time_zone": "America/New_York",
  "eu_consent": "granted"
}
```

#### Tracking an Event

```javascript
{
  "email": "user@example.com",
  "action": "Viewed Product",
  "properties": {
    "product_id": "SKU-12345",
    "product_name": "Premium Widget",
    "price": 99.99,
    "category": "Widgets"
  },
  "occurred_at": "2024-01-15T10:30:00Z"
}
```

#### Advanced Search

```javascript
{
  "tags": ["vip", "customer"],
  "created_after": "2024-01-01T00:00:00Z",
  "custom_field_filters": {
    "lifetime_value": { "greater_than": 1000 },
    "plan": "premium"
  },
  "status": "active",
  "per_page": 100
}
```

## 🧪 Development

### Running in Development Mode

```bash
# Watch mode with auto-restart
npm run dev

# Standard mode
npm start
```

### Using the MCP Inspector

The MCP Inspector provides a web-based UI for testing and debugging:

```bash
# Launch the inspector
npm run inspect
```

Features:
- Interactive tool testing
- Real-time message monitoring
- Schema validation
- Request/response inspection

Access the inspector at `http://localhost:5173` after running the command.

### Testing

```bash
# Run all tests
npm run test:all

# Run specific test suites
npm test                    # Core functionality
npm run test:unit          # Unit tests (no network)
npm run test:validation    # Input validation
npm run test:names         # Field handling
npm run test:unsubscribes  # Unsubscribe tracking
```

### Project Structure

```
drip-mcp-server/
├── src/
│   ├── index.js           # MCP server implementation
│   ├── drip-client.js     # Drip API client wrapper
│   └── tests/             # Test suites
│       ├── run.js         # Test runner
│       ├── drip-client.test.js
│       ├── server-tools.test.js
│       └── server-e2e.test.js
├── package.json
├── mcp.json              # MCP Inspector config
├── .env.example          # Environment template
├── LICENSE               # MIT license
└── README.md             # Documentation
```

## 🔒 Security Best Practices

1. **API Key Management**
   - Never commit API keys to version control
   - Use environment variables or secure key management
   - Rotate API keys regularly
   - Use least-privilege API keys when possible

2. **Data Protection**
   - Handle subscriber data according to privacy regulations (GDPR, CCPA)
   - Implement proper consent management
   - Use secure connections (HTTPS) only

3. **Rate Limiting**
   - Respect Drip's API limits (3,600 requests/hour)
   - Implement exponential backoff for retries
   - Monitor API usage to avoid limit violations

## 🐛 Troubleshooting

### Common Issues

#### Authentication Errors (401)
- **Cause**: Invalid API key or account ID
- **Solution**: Verify credentials in Drip settings and environment variables

#### Permission Errors (403)
- **Cause**: API key lacks required permissions
- **Solution**: Check API key permissions in Drip account settings

#### Rate Limiting (429)
- **Cause**: Exceeding API rate limits
- **Solution**: Server automatically retries with backoff; reduce request frequency if persistent

#### Field Mapping Issues
- **Cause**: Incorrect field placement (standard vs. custom)
- **Solution**: Server handles automatically; check field names match Drip configuration

### Debug Mode

Enable detailed logging:

```bash
DEBUG=* npm start
```

## 📚 API Documentation

### Field Types

#### Standard Fields (Root Level)
- `email` (required)
- `first_name`
- `last_name`
- `user_id`
- `time_zone`
- `eu_consent`
- `eu_consent_message`

#### Custom Fields (Nested)
All other fields are automatically placed in `custom_fields`:
- `company`
- `phone`
- `address1`, `address2`
- `city`, `state`, `zip`, `country`
- Any custom data fields

### Rate Limits

| Operation Type | Limit | Window |
|---------------|-------|--------|
| Individual Requests | 3,600 | Per hour |
| Batch Operations | 50,000 | Per hour |
| Concurrent Requests | 50 | Simultaneous |

### Error Responses

| Status Code | Description | Action Required |
|------------|-------------|-----------------|
| 401 | Unauthorized | Check API credentials |
| 403 | Forbidden | Verify permissions |
| 422 | Validation Error | Fix request parameters |
| 429 | Rate Limited | Wait and retry |
| 500 | Server Error | Contact support if persistent |

## ❓ Frequently Asked Questions

### Can I create broadcasts through the API?
No, the Drip API provides read-only access to broadcasts. Use the Drip web interface to create broadcasts.

### How do I handle EU consent?
Use the `eu_consent` field with values: `granted`, `denied`, or `pending`. Include `eu_consent_message` for audit trails.

### What's the difference between campaigns and workflows?
- **Campaigns**: Email series with fixed timing
- **Workflows**: Automated sequences triggered by events or conditions

### Can I bulk delete subscribers?
No, Drip requires individual deletion for data safety. Use `drip_delete_subscriber` for each subscriber.

### How do I track revenue?
Use `drip_record_purchase` with the `value` field in cents (e.g., `9999` for $99.99).

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the repository** and create a feature branch
2. **Write tests** for new functionality
3. **Follow the code style** (ESM, async/await, clear naming)
4. **Update documentation** for API changes
5. **Submit a pull request** with a clear description

### Development Guidelines

- Use Node.js 20+ with ES modules
- Maintain test coverage above 80%
- Follow semantic versioning
- Write descriptive commit messages
- Keep dependencies minimal

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### For This MCP Server
- 📧 Email: support@gravitykit.com
- 🐛 Issues: [GitHub Issues](https://github.com/GravityKit/drip-mcp-server/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/GravityKit/drip-mcp-server/discussions)

### For Drip API
- 📚 [Drip API Documentation](https://developer.drip.com/)
- 💬 [Drip Support](https://www.drip.com/support)
- 🎓 [Drip Academy](https://www.drip.com/learn)

### For MCP Protocol
- 📚 [MCP Documentation](https://modelcontextprotocol.io/)
- 💬 [MCP Community](https://github.com/modelcontextprotocol/discussions)

## 🙏 Acknowledgments

- Built with the [Model Context Protocol SDK](https://github.com/modelcontextprotocol/sdk)
- Powered by [Drip](https://www.drip.com) email marketing platform
- Developed by [GravityKit](https://www.gravitykit.com)

---

**Made with ❤️ by GravityKit**