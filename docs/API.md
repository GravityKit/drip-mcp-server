# Drip MCP Server API Documentation

Complete reference for all available Drip MCP server tools and their parameters.

## Table of Contents

- [Subscriber Management](#subscriber-management)
- [Event Tracking](#event-tracking)
- [Campaign Management](#campaign-management)
- [Workflow Automation](#workflow-automation)
- [Forms & Broadcasts](#forms--broadcasts)
- [Batch Operations](#batch-operations)
- [Search & Filtering](#search--filtering)
- [Unsubscribe Analytics](#unsubscribe-analytics)
- [Conversions & Purchases](#conversions--purchases)
- [Account & Custom Fields](#account--custom-fields)

## Subscriber Management

### drip_create_subscriber

Create or update a subscriber in your Drip account.

**Parameters:**
- `email` (string, required): Email address of the subscriber
- `first_name` (string): Subscriber's first name
- `last_name` (string): Subscriber's last name
- `user_id` (string): Unique identifier for the subscriber in your system
- `time_zone` (string): Time zone (e.g., "America/New_York")
- `custom_fields` (object): Key-value pairs of custom field data (company, phone, address, etc.)
- `tags` (array): Tags to apply to the subscriber
- `prospect` (boolean): Whether the subscriber is a prospect (default: true)
- `base_lead_score` (number): Base lead score (default: 30)
- `eu_consent` (string): EU consent status ("granted", "denied", "unknown")
- `eu_consent_message` (string): How consent was obtained

**Example:**
```json
{
  "email": "john@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "user_id": "user_123",
  "time_zone": "America/New_York",
  "custom_fields": {
    "company": "Acme Corp",
    "phone": "+1234567890",
    "city": "New York"
  },
  "tags": ["customer", "premium"],
  "prospect": false,
  "base_lead_score": 50
}
```

### drip_list_subscribers

List all subscribers with pagination and filtering options.

**Parameters:**
- `page` (number): Page number for pagination
- `per_page` (number): Number of results per page (max: 1000)
- `sort` (string): Sort field ("created_at", "updated_at")
- `direction` (string): Sort direction ("asc", "desc")
- `status` (string): Filter by status ("active", "unsubscribed", "all")
- `tags` (string): Comma-separated list of tags to filter by

**Example:**
```json
{
  "page": 1,
  "per_page": 50,
  "sort": "created_at",
  "direction": "desc",
  "status": "active",
  "tags": "customer,premium"
}
```

### drip_get_subscriber

Fetch a specific subscriber by ID or email address.

**Parameters:**
- `subscriber_id` (string, required): Subscriber ID or email address

**Example:**
```json
{
  "subscriber_id": "john@example.com"
}
```

### drip_delete_subscriber

Permanently delete a subscriber from your Drip account.

**Parameters:**
- `subscriber_id` (string, required): Subscriber ID or email address

**Example:**
```json
{
  "subscriber_id": "john@example.com"
}
```

### drip_unsubscribe

Unsubscribe a subscriber from all emails (unsubscribe_all) or remove them from a specific Email Series Campaign.

**Parameters:**
- `subscriber_id` (string, required): Subscriber ID or email address
- `campaign_id` (string): Optional Email Series Campaign ID to remove from

To unsubscribe from all mailings:
```json
{
  "subscriber_id": "john@example.com"
}
```

Underlying calls:
- All mailings: `POST /v2/:account_id/subscribers/:id_or_email/unsubscribe_all`
- Specific campaign: `POST /v2/:account_id/subscribers/:id_or_email/remove?campaign_id=:campaign_id`

### drip_tag_subscriber

Apply one or more tags to a subscriber.

**Parameters:**
- `email` (string, required): Email address of the subscriber
- `tags` (array, required): Tags to apply

**Example:**
```json
{
  "email": "john@example.com",
  "tags": ["vip", "early-adopter"]
}
```

### drip_remove_tag

Remove a specific tag from a subscriber.

**Parameters:**
- `email` (string, required): Email address of the subscriber
- `tag` (string, required): Tag to remove

**Example:**
```json
{
  "email": "john@example.com",
  "tag": "prospect"
}
```

## Event Tracking

### drip_track_event

Track custom events for behavioral automation and analytics.

**Parameters:**
- `email` (string, required): Email address of the subscriber
- `action` (string, required): Name of the event
- `properties` (object): Event properties/metadata
- `occurred_at` (string): ISO 8601 timestamp when the event occurred

**Example:**
```json
{
  "email": "john@example.com",
  "action": "Viewed Product",
  "properties": {
    "product_id": "SKU-123",
    "product_name": "Premium Widget",
    "price": 99.99,
    "category": "Widgets"
  },
  "occurred_at": "2024-01-15T10:30:00Z"
}
```

## Campaign Management

### drip_list_campaigns

List all campaigns in your Drip account.

**Parameters:**
- `status` (string): Filter by status ("active", "draft", "paused", "all")
- `page` (number): Page number for pagination
- `per_page` (number): Number of results per page

**Example:**
```json
{
  "status": "active",
  "page": 1,
  "per_page": 20
}
```

### drip_subscribe_to_campaign

Subscribe a user to a specific campaign.

**Parameters:**
- `campaign_id` (string, required): Campaign ID
- `email` (string, required): Email address of the subscriber
- `first_name` (string): Subscriber's first name
- `last_name` (string): Subscriber's last name
- `user_id` (string): Unique user identifier
- `time_zone` (string): Time zone
- `custom_fields` (object): Custom field values
- `tags` (array): Tags to apply
- `reactivate_if_removed` (boolean): Reactivate if previously removed
- `prospect` (boolean): Whether the subscriber is a prospect
- `base_lead_score` (number): Base lead score

**Example:**
```json
{
  "campaign_id": "campaign_123",
  "email": "john@example.com",
  "tags": ["campaign-subscriber"],
  "reactivate_if_removed": true
}
```

## Batch Operations

### drip_batch_create_subscribers

Create or update multiple subscribers using the Batch API (up to 1000 per batch).

**Parameters:**
- `subscribers` (array, required): Array of subscriber objects

Underlying endpoint: `POST /v2/:account_id/subscribers/batches`

**Example:**
```json
{
  "batches": [
    {
      "subscribers": [
        {
          "email": "user1@example.com",
          "tags": ["batch-import"],
          "custom_fields": {
            "source": "import-2024"
          }
        },
        {
          "email": "user2@example.com",
          "tags": ["batch-import"],
          "custom_fields": {
            "source": "import-2024"
          }
        }
      ]
    }
  ]
}
```

### drip_batch_unsubscribe

Unsubscribe multiple subscribers in a single request.

**Parameters:**
- `subscribers` (array, required): Emails or objects containing `email`

Underlying endpoint: `POST /v2/:account_id/unsubscribes/batches`

**Example:**
```json
{
  "batches": [
    {
      "subscribers": [
        { "email": "user1@example.com" },
        { "email": "user2@example.com" }
      ]
    }
  ]
}
```

## Search & Filtering

### drip_search_subscribers

Search for subscribers using various filters.

**Parameters:**
- `email` (string): Email address to search for (partial match)
- `tags` (array): Filter by tags (must have all)
- `custom_field_filters` (object): Filter by custom field values
- `created_after` (string): ISO 8601 timestamp - only return subscribers created after
- `created_before` (string): ISO 8601 timestamp - only return subscribers created before
- `page` (number): Page number for pagination
- `per_page` (number): Number of results per page

**Example:**
```json
{
  "tags": ["customer"],
  "custom_field_filters": {
    "plan": "premium",
    "status": "active"
  },
  "created_after": "2024-01-01T00:00:00Z",
  "page": 1,
  "per_page": 100
}
```

## Unsubscribe Analytics

### drip_recent_unsubscribes

List recent unsubscribes with optional date range filtering.

**Parameters:**
- `since` (string): ISO 8601 timestamp lower bound
- `before` (string): ISO 8601 timestamp upper bound
- `page` (number): Page number
- `per_page` (number): Results per page (<= 1000)
- `sort` (string): Sort field (default: `updated_at`)
- `direction` (string): `asc` or `desc`

### drip_unsubscribe_stats

Aggregate unsubscribe counts by date for a given range.

**Parameters:**
- `since` (string): ISO 8601 timestamp lower bound
- `before` (string): ISO 8601 timestamp upper bound
- `page` (number)
- `per_page` (number)

**Response:**
```json
{
  "total": 12,
  "date_range": { "start": "2025-09-01", "end": "2025-09-07" },
  "by_date": { "2025-09-05": { "count": 5, "subscribers": [] } },
  "daily_average": 1.71
}
```

## Workflow Automation

### drip_list_workflows
List workflows with optional status and pagination.

### drip_activate_workflow
Activate a workflow by ID.

### drip_pause_workflow
Pause a workflow by ID.

### drip_start_workflow
Start a workflow for a subscriber email.

### drip_remove_from_workflow
Remove a subscriber from a workflow.

**Parameters:**
- `workflow_id` (string, required)
- `email` (string, required)

## Forms & Broadcasts

### drip_list_forms / drip_get_form
List forms or fetch a form by ID.

### drip_list_broadcasts / drip_get_broadcast
List broadcasts or fetch a broadcast by ID. Creation/editing is not supported via API.

## Conversions & Purchases

### drip_record_conversion
Record a conversion event.

**Parameters:**
- `email` (string, required)
- `action` (string, required)
- `occurred_at` (string)
- `properties` (object)

### drip_record_purchase
Record a purchase for a subscriber.

**Parameters:**
- `email` (string, required)
- `amount` (number, required): In dollars; converted to cents
- `occurred_at` (string)
- `properties` (object)
- `items` (array)

## Account & Custom Fields

### drip_get_account
Get account details for the configured account.

### drip_list_custom_fields
List custom field identifiers.

## Response Formats

### Successful Response

All successful responses return JSON with the requested data:

```json
{
  "subscribers": [
    {
      "id": "subscriber_123",
      "email": "john@example.com",
      "status": "active",
      "created_at": "2024-01-15T10:30:00Z",
      "custom_fields": {
        "first_name": "John"
      },
      "tags": ["customer"]
    }
  ],
  "meta": {
    "page": 1,
    "count": 50,
    "total_pages": 10,
    "total_count": 500
  }
}
```

### Error Response

Errors are returned with descriptive messages:

```json
{
  "errors": [
    {
      "code": "validation_error",
      "message": "Email is required",
      "attribute": "email"
    }
  ]
}
```

## Rate Limiting

The Drip API has the following rate limits:

- **Individual requests**: 3,600 per hour
- **Batch operations**: 50,000 updates per hour

When rate limits are exceeded, the server will automatically retry with exponential backoff.

## Best Practices

1. **Use batch operations** when creating/updating multiple subscribers
2. **Include time zones** for accurate email delivery timing
3. **Use custom fields** to store additional subscriber data
4. **Apply tags** for segmentation and automation
5. **Track events** to trigger behavioral automations
6. **Handle EU consent** properly for GDPR compliance
7. **Use pagination** for large data sets
8. **Implement error handling** for failed requests

## API Limitations

### Broadcast Creation Not Supported
The Drip API provides read-only access to broadcasts (single-email campaigns). You can:
- ✅ List existing broadcasts
- ✅ Retrieve broadcast details
- ❌ Create new broadcasts (must use Drip web interface)
- ❌ Edit existing broadcasts (must use Drip web interface)

To create broadcasts, you must use the Drip web interface at https://www.getdrip.com/

## Webhooks

While this MCP server doesn't directly handle webhooks, you can configure webhooks in your Drip account to notify your application of events like:

- Subscriber created/updated
- Subscriber unsubscribed
- Tag applied/removed
- Campaign subscription
- Custom events
- Purchases/conversions

Configure webhooks at: https://www.getdrip.com/ACCOUNT_ID/settings/webhooks

## Further Resources

- [Drip API Documentation](https://developer.drip.com/)
- [Drip Knowledge Base](https://help.drip.com/)
- [API Status Page](https://status.drip.com/)
