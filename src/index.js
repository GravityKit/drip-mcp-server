#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { DripClient } from './drip-client.js';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from root MonoKit directory
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export class DripMCPServer {
  constructor(options = {}) {
    this.server = new Server(
      {
        name: 'drip-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize Drip client (allow injection for testing)
    this.dripClient = options.dripClient || new DripClient(
      process.env.DRIP_API_KEY,
      process.env.DRIP_ACCOUNT_ID
    );

    this.setupHandlers();
  }

  // Test helper to execute a tool without stdio transport
  async callTool(name, args = {}) {
    try {
      switch (name) {
        // Subscriber operations
        case 'drip_create_subscriber':
          return await this.handleCreateSubscriber(args);
        case 'drip_list_subscribers':
          return await this.handleListSubscribers(args);
        case 'drip_get_subscriber':
          return await this.handleGetSubscriber(args);
        case 'drip_delete_subscriber':
          return await this.handleDeleteSubscriber(args);
        case 'drip_unsubscribe':
          return await this.handleUnsubscribe(args);
        case 'drip_tag_subscriber':
          return await this.handleTagSubscriber(args);
        case 'drip_remove_tag':
          return await this.handleRemoveTag(args);
        case 'drip_track_event':
          return await this.handleTrackEvent(args);
        case 'drip_list_campaigns':
          return await this.handleListCampaigns(args);
        case 'drip_subscribe_to_campaign':
          return await this.handleSubscribeToCampaign(args);
        case 'drip_batch_create_subscribers':
          return await this.handleBatchCreateSubscribers(args);
        case 'drip_search_subscribers':
          return await this.handleSearchSubscribers(args);
        // Batch operations
        case 'drip_batch_unsubscribe':
          return await this.handleBatchUnsubscribe(args);
        // Unsubscribes analytics
        case 'drip_recent_unsubscribes':
          return await this.handleRecentUnsubscribes(args);
        case 'drip_unsubscribe_stats':
          return await this.handleUnsubscribeStats(args);
        // Workflows
        case 'drip_list_workflows':
          return await this.handleListWorkflows(args);
        case 'drip_activate_workflow':
          return await this.handleActivateWorkflow(args);
        case 'drip_pause_workflow':
          return await this.handlePauseWorkflow(args);
        case 'drip_start_workflow':
          return await this.handleStartWorkflow(args);
        case 'drip_remove_from_workflow':
          return await this.handleRemoveFromWorkflow(args);
        // Forms
        case 'drip_list_forms':
          return await this.handleListForms(args);
        case 'drip_get_form':
          return await this.handleGetForm(args);
        // Broadcasts
        case 'drip_list_broadcasts':
          return await this.handleListBroadcasts(args);
        case 'drip_get_broadcast':
          return await this.handleGetBroadcast(args);
        // Conversions & Purchases
        case 'drip_record_conversion':
          return await this.handleRecordConversion(args);
        case 'drip_record_purchase':
          return await this.handleRecordPurchase(args);
        // Account & Custom fields
        case 'drip_get_account':
          return await this.handleGetAccount();
        case 'drip_list_custom_fields':
          return await this.handleListCustomFields();
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
    }
  }

  setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        // Subscriber Tools
        {
          name: 'drip_create_subscriber',
          description: 'Create or update a subscriber in Drip',
          inputSchema: {
            type: 'object',
            properties: {
              email: {
                type: 'string',
                description: 'Email address of the subscriber',
              },
              user_id: {
                type: 'string',
                description: 'Unique identifier for the subscriber',
              },
              time_zone: {
                type: 'string',
                description: 'Time zone of the subscriber (e.g., America/New_York)',
              },
              custom_fields: {
                type: 'object',
                description: 'Custom field values for the subscriber',
              },
              tags: {
                type: 'array',
                items: { type: 'string' },
                description: 'Tags to apply to the subscriber',
              },
              prospect: {
                type: 'boolean',
                description: 'Whether the subscriber is a prospect',
              },
              base_lead_score: {
                type: 'number',
                description: 'Base lead score for the subscriber',
              },
              eu_consent: {
                type: 'string',
                enum: ['granted', 'denied', 'unknown'],
                description: 'EU consent status',
              },
              eu_consent_message: {
                type: 'string',
                description: 'Message explaining how consent was obtained',
              },
            },
            required: ['email'],
          },
        },
        {
          name: 'drip_list_subscribers',
          description: 'List all subscribers in your Drip account',
          inputSchema: {
            type: 'object',
            properties: {
              page: {
                type: 'number',
                description: 'Page number for pagination',
              },
              per_page: {
                type: 'number',
                description: 'Number of subscribers per page (max 1000)',
              },
              sort: {
                type: 'string',
                enum: ['created_at', 'updated_at'],
                description: 'Field to sort by',
              },
              direction: {
                type: 'string',
                enum: ['asc', 'desc'],
                description: 'Sort direction',
              },
              status: {
                type: 'string',
                enum: ['active', 'unsubscribed', 'all'],
                description: 'Filter by subscriber status',
              },
              tags: {
                type: 'string',
                description: 'Comma-separated list of tags to filter by',
              },
            },
          },
        },
        {
          name: 'drip_get_subscriber',
          description: 'Fetch a specific subscriber by ID or email',
          inputSchema: {
            type: 'object',
            properties: {
              subscriber_id: {
                type: 'string',
                description: 'Subscriber ID or email address',
              },
            },
            required: ['subscriber_id'],
          },
        },
        {
          name: 'drip_delete_subscriber',
          description: 'Delete a subscriber from your Drip account',
          inputSchema: {
            type: 'object',
            properties: {
              subscriber_id: {
                type: 'string',
                description: 'Subscriber ID or email address',
              },
            },
            required: ['subscriber_id'],
          },
        },
        {
          name: 'drip_unsubscribe',
          description: 'Unsubscribe a subscriber from all emails',
          inputSchema: {
            type: 'object',
            properties: {
              subscriber_id: {
                type: 'string',
                description: 'Subscriber ID or email address',
              },
              campaign_id: {
                type: 'string',
                description: 'Optional campaign ID to unsubscribe from',
              },
            },
            required: ['subscriber_id'],
          },
        },
        {
          name: 'drip_tag_subscriber',
          description: 'Apply tags to a subscriber',
          inputSchema: {
            type: 'object',
            properties: {
              email: {
                type: 'string',
                description: 'Email address of the subscriber',
              },
              tags: {
                type: 'array',
                items: { type: 'string' },
                description: 'Tags to apply',
              },
            },
            required: ['email', 'tags'],
          },
        },
        {
          name: 'drip_remove_tag',
          description: 'Remove tags from a subscriber',
          inputSchema: {
            type: 'object',
            properties: {
              email: {
                type: 'string',
                description: 'Email address of the subscriber',
              },
              tag: {
                type: 'string',
                description: 'Tag to remove',
              },
            },
            required: ['email', 'tag'],
          },
        },
        {
          name: 'drip_track_event',
          description: 'Track a custom event for a subscriber',
          inputSchema: {
            type: 'object',
            properties: {
              email: {
                type: 'string',
                description: 'Email address of the subscriber',
              },
              action: {
                type: 'string',
                description: 'Name of the event',
              },
              properties: {
                type: 'object',
                description: 'Event properties',
              },
              occurred_at: {
                type: 'string',
                description: 'ISO 8601 timestamp when the event occurred',
              },
            },
            required: ['email', 'action'],
          },
        },
        {
          name: 'drip_list_campaigns',
          description: 'List all campaigns in your Drip account',
          inputSchema: {
            type: 'object',
            properties: {
              status: {
                type: 'string',
                enum: ['active', 'draft', 'paused', 'all'],
                description: 'Filter by campaign status',
              },
              page: {
                type: 'number',
                description: 'Page number for pagination',
              },
              per_page: {
                type: 'number',
                description: 'Number of campaigns per page',
              },
            },
          },
        },
        {
          name: 'drip_subscribe_to_campaign',
          description: 'Subscribe a user to a campaign',
          inputSchema: {
            type: 'object',
            properties: {
              campaign_id: {
                type: 'string',
                description: 'Campaign ID',
              },
              email: {
                type: 'string',
                description: 'Email address of the subscriber',
              },
              user_id: {
                type: 'string',
                description: 'Optional user ID',
              },
              time_zone: {
                type: 'string',
                description: 'Time zone of the subscriber',
              },
              custom_fields: {
                type: 'object',
                description: 'Custom field values',
              },
              tags: {
                type: 'array',
                items: { type: 'string' },
                description: 'Tags to apply',
              },
              reactivate_if_removed: {
                type: 'boolean',
                description: 'Whether to reactivate if previously removed',
              },
              prospect: {
                type: 'boolean',
                description: 'Whether the subscriber is a prospect',
              },
              base_lead_score: {
                type: 'number',
                description: 'Base lead score',
              },
            },
            required: ['campaign_id', 'email'],
          },
        },
        {
          name: 'drip_batch_create_subscribers',
          description: 'Create or update multiple subscribers at once',
          inputSchema: {
            type: 'object',
            properties: {
              subscribers: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    email: { type: 'string' },
                    user_id: { type: 'string' },
                    time_zone: { type: 'string' },
                    custom_fields: { type: 'object' },
                    tags: {
                      type: 'array',
                      items: { type: 'string' },
                    },
                  },
                  required: ['email'],
                },
                description: 'Array of subscriber objects to create/update',
              },
            },
            required: ['subscribers'],
          },
        },
        {
          name: 'drip_search_subscribers',
          description: 'Search for subscribers using various filters',
          inputSchema: {
            type: 'object',
            properties: {
              email: { type: 'string', description: 'Partial email match' },
              tags: { type: 'array', items: { type: 'string' }, description: 'Must include all tags' },
              custom_field_filters: { type: 'object', description: 'Custom field equals filters' },
              created_after: { type: 'string', description: 'ISO 8601 lower bound' },
              created_before: { type: 'string', description: 'ISO 8601 upper bound' },
              page: { type: 'number' },
              per_page: { type: 'number' },
              status: { type: 'string', enum: ['active', 'unsubscribed', 'all'] },
              sort: { type: 'string', enum: ['created_at', 'updated_at'] },
              direction: { type: 'string', enum: ['asc', 'desc'] },
            },
          },
        },
        {
          name: 'drip_batch_unsubscribe',
          description: 'Unsubscribe multiple subscribers at once',
          inputSchema: {
            type: 'object',
            properties: {
              subscribers: {
                type: 'array',
                description: 'Emails or objects {email}',
                items: {
                  anyOf: [
                    { type: 'string' },
                    { type: 'object', properties: { email: { type: 'string' } }, required: ['email'] },
                  ],
                },
              },
            },
            required: ['subscribers'],
          },
        },
        {
          name: 'drip_recent_unsubscribes',
          description: 'List recent unsubscribes with optional date bounds',
          inputSchema: {
            type: 'object',
            properties: {
              since: { type: 'string' },
              before: { type: 'string' },
              page: { type: 'number' },
              per_page: { type: 'number' },
              sort: { type: 'string', enum: ['updated_at'] },
              direction: { type: 'string', enum: ['asc', 'desc'] },
            },
          },
        },
        {
          name: 'drip_unsubscribe_stats',
          description: 'Aggregate unsubscribe stats by date',
          inputSchema: {
            type: 'object',
            properties: {
              since: { type: 'string' },
              before: { type: 'string' },
              page: { type: 'number' },
              per_page: { type: 'number' },
            },
          },
        },
        {
          name: 'drip_list_workflows',
          description: 'List workflows',
          inputSchema: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['active', 'paused', 'draft', 'all'] },
              page: { type: 'number' },
              per_page: { type: 'number' },
            },
          },
        },
        {
          name: 'drip_activate_workflow',
          description: 'Activate a workflow by ID',
          inputSchema: { type: 'object', properties: { workflow_id: { type: 'string' } }, required: ['workflow_id'] },
        },
        {
          name: 'drip_pause_workflow',
          description: 'Pause a workflow by ID',
          inputSchema: { type: 'object', properties: { workflow_id: { type: 'string' } }, required: ['workflow_id'] },
        },
        {
          name: 'drip_start_workflow',
          description: 'Start a workflow for a subscriber',
          inputSchema: { type: 'object', properties: { workflow_id: { type: 'string' }, email: { type: 'string' } }, required: ['workflow_id','email'] },
        },
        {
          name: 'drip_remove_from_workflow',
          description: 'Remove a subscriber from a workflow',
          inputSchema: { type: 'object', properties: { workflow_id: { type: 'string' }, email: { type: 'string' } }, required: ['workflow_id','email'] },
        },
        {
          name: 'drip_list_forms',
          description: 'List forms',
          inputSchema: { type: 'object', properties: { page: { type: 'number' }, per_page: { type: 'number' } } },
        },
        {
          name: 'drip_get_form',
          description: 'Get form by ID',
          inputSchema: { type: 'object', properties: { form_id: { type: 'string' } }, required: ['form_id'] },
        },
        {
          name: 'drip_list_broadcasts',
          description: 'List broadcasts',
          inputSchema: { type: 'object', properties: { status: { type: 'string', enum: ['draft','scheduled','sent','all'] }, page: { type: 'number' }, per_page: { type: 'number' } } },
        },
        {
          name: 'drip_get_broadcast',
          description: 'Get broadcast by ID',
          inputSchema: { type: 'object', properties: { broadcast_id: { type: 'string' } }, required: ['broadcast_id'] },
        },
        {
          name: 'drip_record_conversion',
          description: 'Record a conversion event',
          inputSchema: { type: 'object', properties: { email: { type: 'string' }, action: { type: 'string' }, occurred_at: { type: 'string' }, properties: { type: 'object' } }, required: ['email','action'] },
        },
        {
          name: 'drip_record_purchase',
          description: 'Record a purchase for a subscriber',
          inputSchema: { type: 'object', properties: { email: { type: 'string' }, amount: { type: 'number' }, occurred_at: { type: 'string' }, properties: { type: 'object' }, items: { type: 'array', items: { type: 'object' } } }, required: ['email','amount'] },
        },
        {
          name: 'drip_get_account',
          description: 'Get Drip account details',
          inputSchema: { type: 'object', properties: {} },
        },
        {
          name: 'drip_list_custom_fields',
          description: 'List custom field identifiers',
          inputSchema: { type: 'object', properties: {} },
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          // Subscriber operations
          case 'drip_create_subscriber':
            return await this.handleCreateSubscriber(args);
          case 'drip_list_subscribers':
            return await this.handleListSubscribers(args);
          case 'drip_get_subscriber':
            return await this.handleGetSubscriber(args);
          case 'drip_delete_subscriber':
            return await this.handleDeleteSubscriber(args);
          case 'drip_unsubscribe':
            return await this.handleUnsubscribe(args);
          case 'drip_tag_subscriber':
            return await this.handleTagSubscriber(args);
          case 'drip_remove_tag':
            return await this.handleRemoveTag(args);
          case 'drip_track_event':
            return await this.handleTrackEvent(args);
          case 'drip_list_campaigns':
            return await this.handleListCampaigns(args);
          case 'drip_subscribe_to_campaign':
            return await this.handleSubscribeToCampaign(args);
          case 'drip_batch_create_subscribers':
            return await this.handleBatchCreateSubscribers(args);
          case 'drip_search_subscribers':
            return await this.handleSearchSubscribers(args);
          // Batch operations
          case 'drip_batch_unsubscribe':
            return await this.handleBatchUnsubscribe(args);
          // Unsubscribes analytics
          case 'drip_recent_unsubscribes':
            return await this.handleRecentUnsubscribes(args);
          case 'drip_unsubscribe_stats':
            return await this.handleUnsubscribeStats(args);
          // Workflows
          case 'drip_list_workflows':
            return await this.handleListWorkflows(args);
          case 'drip_activate_workflow':
            return await this.handleActivateWorkflow(args);
          case 'drip_pause_workflow':
            return await this.handlePauseWorkflow(args);
          case 'drip_start_workflow':
            return await this.handleStartWorkflow(args);
          case 'drip_remove_from_workflow':
            return await this.handleRemoveFromWorkflow(args);
          // Forms
          case 'drip_list_forms':
            return await this.handleListForms(args);
          case 'drip_get_form':
            return await this.handleGetForm(args);
          // Broadcasts
          case 'drip_list_broadcasts':
            return await this.handleListBroadcasts(args);
          case 'drip_get_broadcast':
            return await this.handleGetBroadcast(args);
          // Conversions & Purchases
          case 'drip_record_conversion':
            return await this.handleRecordConversion(args);
          case 'drip_record_purchase':
            return await this.handleRecordPurchase(args);
          // Account & Custom fields
          case 'drip_get_account':
            return await this.handleGetAccount();
          case 'drip_list_custom_fields':
            return await this.handleListCustomFields();
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
        };
      }
    });
  }

  // Subscriber handlers
  async handleCreateSubscriber(args) {
    const result = await this.dripClient.createOrUpdateSubscriber(args);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  async handleListSubscribers(args) {
    const result = await this.dripClient.listSubscribers(args);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  async handleGetSubscriber(args) {
    const result = await this.dripClient.getSubscriber(args.subscriber_id);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  async handleDeleteSubscriber(args) {
    const result = await this.dripClient.deleteSubscriber(args.subscriber_id);
    return {
      content: [
        {
          type: 'text',
          text: result ? 'Subscriber deleted successfully' : 'Failed to delete subscriber',
        },
      ],
    };
  }

  async handleUnsubscribe(args) {
    const result = await this.dripClient.unsubscribeSubscriber(
      args.subscriber_id,
      args.campaign_id
    );
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  async handleTagSubscriber(args) {
    const result = await this.dripClient.tagSubscriber(args.email, args.tags);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  async handleRemoveTag(args) {
    const result = await this.dripClient.removeTag(args.email, args.tag);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  async handleTrackEvent(args) {
    const result = await this.dripClient.trackEvent(args);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  async handleListCampaigns(args) {
    const result = await this.dripClient.listCampaigns(args);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  async handleSubscribeToCampaign(args) {
    const result = await this.dripClient.subscribeToCampaign(args);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  async handleBatchCreateSubscribers(args) {
    const result = await this.dripClient.batchCreateSubscribers(args.subscribers);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  async handleSearchSubscribers(args) {
    const result = await this.dripClient.searchSubscribers(args);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  // Batch operations
  async handleBatchUnsubscribe(args) {
    const result = await this.dripClient.batchUnsubscribe(args.subscribers);
    return {
      content: [
        { type: 'text', text: JSON.stringify(result, null, 2) },
      ],
    };
  }

  // Unsubscribe analytics
  async handleRecentUnsubscribes(args) {
    const result = await this.dripClient.getRecentUnsubscribes(args);
    return {
      content: [
        { type: 'text', text: JSON.stringify(result, null, 2) },
      ],
    };
  }

  async handleUnsubscribeStats(args) {
    const result = await this.dripClient.getUnsubscribeStats(args);
    return {
      content: [
        { type: 'text', text: JSON.stringify(result, null, 2) },
      ],
    };
  }

  // Workflows
  async handleListWorkflows(args) {
    const result = await this.dripClient.listWorkflows(args);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
  async handleActivateWorkflow(args) {
    const result = await this.dripClient.activateWorkflow(args.workflow_id);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
  async handlePauseWorkflow(args) {
    const result = await this.dripClient.pauseWorkflow(args.workflow_id);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
  async handleStartWorkflow(args) {
    const result = await this.dripClient.startWorkflowForSubscriber(args.workflow_id, args.email);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
  async handleRemoveFromWorkflow(args) {
    const result = await this.dripClient.removeFromWorkflow(args.workflow_id, args.email);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  // Forms
  async handleListForms(args) {
    const result = await this.dripClient.listForms(args);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
  async handleGetForm(args) {
    const result = await this.dripClient.getForm(args.form_id);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  // Broadcasts
  async handleListBroadcasts(args) {
    const result = await this.dripClient.listBroadcasts(args);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
  async handleGetBroadcast(args) {
    const result = await this.dripClient.getBroadcast(args.broadcast_id);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  // Conversions & Purchases
  async handleRecordConversion(args) {
    const result = await this.dripClient.recordConversion(args);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
  async handleRecordPurchase(args) {
    const result = await this.dripClient.recordPurchase(args);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  // Account & Custom Fields
  async handleGetAccount() {
    const result = await this.dripClient.getAccount();
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
  async handleListCustomFields() {
    const result = await this.dripClient.listCustomFields();
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Drip MCP server running on stdio');
  }
}

// Start the server if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new DripMCPServer();
  server.run().catch(console.error);
}
