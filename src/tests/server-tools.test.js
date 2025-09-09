#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { assert } from './helpers.js';

const filePath = path.join(process.cwd(), 'src', 'index.js');
const content = fs.readFileSync(filePath, 'utf8');

const expectedTools = [
  // Subscribers
  'drip_create_subscriber', 'drip_list_subscribers', 'drip_get_subscriber', 'drip_delete_subscriber',
  'drip_unsubscribe', 'drip_tag_subscriber', 'drip_remove_tag', 'drip_track_event',
  // Campaigns & batch
  'drip_list_campaigns', 'drip_subscribe_to_campaign', 'drip_batch_create_subscribers', 'drip_search_subscribers',
  'drip_batch_unsubscribe',
  // Unsubscribes analytics
  'drip_recent_unsubscribes', 'drip_unsubscribe_stats',
  // Workflows
  'drip_list_workflows', 'drip_activate_workflow', 'drip_pause_workflow', 'drip_start_workflow', 'drip_remove_from_workflow',
  // Forms & broadcasts
  'drip_list_forms', 'drip_get_form', 'drip_list_broadcasts', 'drip_get_broadcast',
  // Conversions & purchases
  'drip_record_conversion', 'drip_record_purchase',
  // Account & fields
  'drip_get_account', 'drip_list_custom_fields',
];

// Verify tool names are present in the tools list definition
for (const name of expectedTools) {
  assert(content.includes(`name: '${name}'`), `Tool not found in index.js: ${name}`);
}

// Verify handlers exist in switch
for (const name of expectedTools) {
  assert(content.includes(`case '${name}':`), `Handler switch case missing for: ${name}`);
}

// All server-tools tests passed
