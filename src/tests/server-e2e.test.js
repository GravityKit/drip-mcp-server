#!/usr/bin/env node
import { DripMCPServer } from '../index.js';
import { assert } from './helpers.js';

class FakeDripClient {
  constructor() { this.calls = []; }
  createOrUpdateSubscriber(d) { this.calls.push(['createOrUpdateSubscriber', d]); return Promise.resolve({ id: 's1', email: d.email }); }
  listSubscribers(p) { this.calls.push(['listSubscribers', p]); return Promise.resolve({ subscribers: [{ email: 'e@example.com' }], meta: {} }); }
  getSubscriber(id) { this.calls.push(['getSubscriber', id]); return Promise.resolve({ id: 's1', email: id }); }
  deleteSubscriber(id) { this.calls.push(['deleteSubscriber', id]); return Promise.resolve(true); }
  unsubscribeSubscriber(id, c) { this.calls.push(['unsubscribeSubscriber', id, c]); return Promise.resolve({ ok: true }); }
  tagSubscriber(email, tags) { this.calls.push(['tagSubscriber', email, tags]); return Promise.resolve({ ok: true }); }
  removeTag(email, tag) { this.calls.push(['removeTag', email, tag]); return Promise.resolve({ ok: true }); }
  trackEvent(d) { this.calls.push(['trackEvent', d]); return Promise.resolve({ success: true }); }
  listCampaigns(p) { this.calls.push(['listCampaigns', p]); return Promise.resolve({ campaigns: [] }); }
  subscribeToCampaign(d) { this.calls.push(['subscribeToCampaign', d]); return Promise.resolve({ ok: true }); }
  batchCreateSubscribers(subs) { this.calls.push(['batchCreateSubscribers', subs]); return Promise.resolve({ ok: true }); }
  searchSubscribers(p) { this.calls.push(['searchSubscribers', p]); return Promise.resolve({ subscribers: [], meta: {} }); }
  batchUnsubscribe(subs) { this.calls.push(['batchUnsubscribe', subs]); return Promise.resolve({ ok: true }); }
  getRecentUnsubscribes(p) { this.calls.push(['getRecentUnsubscribes', p]); return Promise.resolve({ subscribers: [], meta: {} }); }
  getUnsubscribeStats(p) { this.calls.push(['getUnsubscribeStats', p]); return Promise.resolve({ total: 0, by_date: {} }); }
  listWorkflows(p) { this.calls.push(['listWorkflows', p]); return Promise.resolve({ workflows: [] }); }
  activateWorkflow(id) { this.calls.push(['activateWorkflow', id]); return Promise.resolve({ ok: true }); }
  pauseWorkflow(id) { this.calls.push(['pauseWorkflow', id]); return Promise.resolve({ ok: true }); }
  startWorkflowForSubscriber(id, email) { this.calls.push(['startWorkflowForSubscriber', id, email]); return Promise.resolve({ ok: true }); }
  removeFromWorkflow(id, email) { this.calls.push(['removeFromWorkflow', id, email]); return Promise.resolve({ success: true }); }
  listForms(p) { this.calls.push(['listForms', p]); return Promise.resolve({ forms: [] }); }
  getForm(id) { this.calls.push(['getForm', id]); return Promise.resolve({ form: {} }); }
  listBroadcasts(p) { this.calls.push(['listBroadcasts', p]); return Promise.resolve({ broadcasts: [] }); }
  getBroadcast(id) { this.calls.push(['getBroadcast', id]); return Promise.resolve({ broadcast: {} }); }
  recordConversion(d) { this.calls.push(['recordConversion', d]); return Promise.resolve({ success: true }); }
  recordPurchase(d) { this.calls.push(['recordPurchase', d]); return Promise.resolve({ success: true }); }
  getAccount() { this.calls.push(['getAccount']); return Promise.resolve({ account: { id: 'acc' } }); }
  listCustomFields() { this.calls.push(['listCustomFields']); return Promise.resolve({ identifiers: [] }); }
}

async function run() {
  const fake = new FakeDripClient();
  const server = new DripMCPServer({ dripClient: fake });

  // Minimal smoke tests for a representative set of tools
  const cases = [
    ['drip_create_subscriber', { email: 'a@b.com' }],
    ['drip_list_subscribers', { per_page: 1 }],
    ['drip_get_subscriber', { subscriber_id: 'a@b.com' }],
    ['drip_delete_subscriber', { subscriber_id: 'a@b.com' }],
    ['drip_unsubscribe', { subscriber_id: 'a@b.com' }],
    ['drip_tag_subscriber', { email: 'a@b.com', tags: ['x'] }],
    ['drip_remove_tag', { email: 'a@b.com', tag: 'x' }],
    ['drip_track_event', { email: 'a@b.com', action: 'X' }],
    ['drip_list_campaigns', {}],
    ['drip_subscribe_to_campaign', { campaign_id: 'c1', email: 'a@b.com' }],
    ['drip_batch_create_subscribers', { subscribers: [{ email: 'a@b.com' }] }],
    ['drip_search_subscribers', { email: 'a' }],
    ['drip_batch_unsubscribe', { subscribers: ['a@b.com'] }],
    ['drip_recent_unsubscribes', {}],
    ['drip_unsubscribe_stats', {}],
    ['drip_list_workflows', {}],
    ['drip_activate_workflow', { workflow_id: 'w1' }],
    ['drip_pause_workflow', { workflow_id: 'w1' }],
    ['drip_start_workflow', { workflow_id: 'w1', email: 'a@b.com' }],
    ['drip_remove_from_workflow', { workflow_id: 'w1', email: 'a@b.com' }],
    ['drip_list_forms', {}],
    ['drip_get_form', { form_id: 'f1' }],
    ['drip_list_broadcasts', {}],
    ['drip_get_broadcast', { broadcast_id: 'b1' }],
    ['drip_record_conversion', { email: 'a@b.com', action: 'Converted' }],
    ['drip_record_purchase', { email: 'a@b.com', amount: 1 }],
    ['drip_get_account', {}],
    ['drip_list_custom_fields', {}],
  ];

  for (const [tool, args] of cases) {
    const res = await server.callTool(tool, args);
    assert(res && res.content && Array.isArray(res.content), `No content for ${tool}`);
    assert(typeof res.content[0].text === 'string', `No text content for ${tool}`);
  }

  // All server e2e handler tests passed
}

run().catch((e) => { console.error(e); process.exit(1); });

