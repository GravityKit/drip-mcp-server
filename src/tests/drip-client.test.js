#!/usr/bin/env node
import { DripClient } from '../drip-client.js';
import { FakeAxios, assert, lastCall } from './helpers.js';

async function run() {
  const fx = new FakeAxios();
  const apiKey = 'test_key';
  const accountId = '123';
  const client = new DripClient(apiKey, accountId, { httpClient: fx.create({ baseURL: `https://api.getdrip.com/v2/${accountId}` }), axiosModule: fx });

  // Subscribers
  fx.on('POST', '/subscribers', () => ({ status: 200, data: { subscribers: [{ id: 'id1', email: 'a@b.com' }] } }));
  await client.createOrUpdateSubscriber({ email: 'a@b.com' });
  assert(lastCall(fx, 'post', '/subscribers'), 'POST /subscribers not called');

  fx.on('GET', '/subscribers?per_page=10', () => ({ status: 200, data: { subscribers: [], meta: {} } }));
  await client.listSubscribers({ per_page: 10 });
  assert(lastCall(fx, 'get', '/subscribers?per_page=10'), 'GET /subscribers with params not called');

  fx.on('GET', '/subscribers/a%40b.com', () => ({ status: 200, data: { subscribers: [{ email: 'a@b.com' }] } }));
  await client.getSubscriber('a@b.com');
  assert(lastCall(fx, 'get', '/subscribers/a%40b.com'), 'GET /subscribers/:id not called');

  fx.on('DELETE', '/subscribers/a%40b.com', () => ({ status: 204, data: {} }));
  await client.deleteSubscriber('a@b.com');
  assert(lastCall(fx, 'delete', '/subscribers/a%40b.com'), 'DELETE /subscribers/:id not called');

  fx.on('POST', '/subscribers/a%40b.com/unsubscribe_all', () => ({ status: 200, data: {} }));
  await client.unsubscribeSubscriber('a@b.com');
  assert(lastCall(fx, 'post', '/subscribers/a%40b.com/unsubscribe_all'), 'POST unsubscribe_all not called');

  fx.on('POST', '/campaigns/c1/subscribers', () => ({ status: 200, data: { subscribers: [{}] } }));
  await client.subscribeToCampaign({ campaign_id: 'c1', email: 'a@b.com' });
  assert(lastCall(fx, 'post', '/campaigns/c1/subscribers'), 'POST campaign subscribe not called');

  fx.on('POST', '/subscribers/a%40b.com/tags', () => ({ status: 200, data: {} }));
  await client.tagSubscriber('a@b.com', ['x']);
  assert(lastCall(fx, 'post', '/subscribers/a%40b.com/tags').data.tags[0] === 'x', 'Tag payload incorrect');

  fx.on('DELETE', '/subscribers/a%40b.com/tags/y', () => ({ status: 204, data: {} }));
  await client.removeTag('a@b.com', 'y');
  assert(lastCall(fx, 'delete', '/subscribers/a%40b.com/tags/y'), 'DELETE tag not called');

  // Events
  fx.on('POST', '/events', () => ({ status: 204, data: {} }));
  await client.trackEvent({ email: 'a@b.com', action: 'Did X', properties: { value: 1 }, occurred_at: new Date().toISOString() });
  assert(lastCall(fx, 'post', '/events'), 'POST /events not called');

  // Conversions
  fx.on('POST', '/conversions', () => ({ status: 204, data: {} }));
  await client.recordConversion({ email: 'a@b.com', action: 'Purchased', occurred_at: new Date().toISOString() });
  assert(lastCall(fx, 'post', '/conversions'), 'POST /conversions not called');

  // Purchases
  fx.on('POST', '/purchases', () => ({ status: 204, data: {} }));
  await client.recordPurchase({ email: 'a@b.com', amount: 12.34, occurred_at: new Date().toISOString() });
  assert(lastCall(fx, 'post', '/purchases'), 'POST /purchases not called');

  // Campaigns
  fx.on('GET', '/campaigns?page=1&per_page=5', () => ({ status: 200, data: { campaigns: [] } }));
  await client.listCampaigns({ page: 1, per_page: 5 });
  assert(lastCall(fx, 'get', '/campaigns?page=1&per_page=5'), 'GET /campaigns not called');

  // Batch
  fx.on('POST', '/unsubscribes/batches', () => ({ status: 200, data: { ok: true } }));
  await client.batchUnsubscribe(['a@b.com']);
  assert(lastCall(fx, 'post', '/unsubscribes/batches'), 'POST batch unsubscribes not called');

  fx.on('POST', '/subscribers/batches', () => ({ status: 200, data: { ok: true } }));
  await client.batchCreateSubscribers([{ email: 'a@b.com' }]);
  assert(lastCall(fx, 'post', '/subscribers/batches'), 'POST batch subscribers not called');

  // Unsubscribe analytics
  fx.on('GET', '/subscribers?status=unsubscribed&sort=updated_at&direction=desc&per_page=100', () => ({ status: 200, data: { subscribers: [], meta: {} } }));
  await client.getRecentUnsubscribes({ per_page: 100 });
  assert(lastCall(fx, 'get', '/subscribers?status=unsubscribed'), 'GET recent unsubscribes not called');

  // Workflows
  fx.on('GET', '/workflows?page=1&per_page=5', () => ({ status: 200, data: { workflows: [] } }));
  await client.listWorkflows({ page: 1, per_page: 5 });
  assert(lastCall(fx, 'get', '/workflows?page=1&per_page=5'), 'GET /workflows not called');

  fx.on('POST', '/workflows/w1/activate', () => ({ status: 200, data: {} }));
  await client.activateWorkflow('w1');
  assert(lastCall(fx, 'post', '/workflows/w1/activate'), 'POST activate workflow not called');

  fx.on('POST', '/workflows/w1/pause', () => ({ status: 200, data: {} }));
  await client.pauseWorkflow('w1');
  assert(lastCall(fx, 'post', '/workflows/w1/pause'), 'POST pause workflow not called');

  fx.on('POST', '/workflows/w1/subscribers', () => ({ status: 200, data: {} }));
  await client.startWorkflowForSubscriber('w1', 'a@b.com');
  assert(lastCall(fx, 'post', '/workflows/w1/subscribers'), 'POST workflow subscriber not called');

  fx.on('DELETE', '/workflows/w1/subscribers/a%40b.com', () => ({ status: 204, data: {} }));
  await client.removeFromWorkflow('w1', 'a@b.com');
  assert(lastCall(fx, 'delete', '/workflows/w1/subscribers/a%40b.com'), 'DELETE workflow subscriber not called');

  // Forms
  fx.on('GET', '/forms?page=1&per_page=10', () => ({ status: 200, data: { forms: [] } }));
  await client.listForms({ page: 1, per_page: 10 });
  assert(lastCall(fx, 'get', '/forms?page=1&per_page=10'), 'GET /forms not called');

  fx.on('GET', '/forms/f1', () => ({ status: 200, data: { form: {} } }));
  await client.getForm('f1');
  assert(lastCall(fx, 'get', '/forms/f1'), 'GET /forms/:id not called');

  // Broadcasts
  fx.on('GET', '/broadcasts?page=1&per_page=10', () => ({ status: 200, data: { broadcasts: [] } }));
  await client.listBroadcasts({ page: 1, per_page: 10 });
  assert(lastCall(fx, 'get', '/broadcasts?page=1&per_page=10'), 'GET /broadcasts not called');

  fx.on('GET', '/broadcasts/b1', () => ({ status: 200, data: { broadcast: {} } }));
  await client.getBroadcast('b1');
  assert(lastCall(fx, 'get', '/broadcasts/b1'), 'GET /broadcasts/:id not called');

  // Account
  fx.on('GET', 'https://api.getdrip.com/v2/accounts', () => ({ status: 200, data: { accounts: [{ id: '123' }] } }));
  await client.getAccount();
  assert(fx.calls.find(c => c.url === 'https://api.getdrip.com/v2/accounts'), 'GET accounts not called');

  // Unsubscribe from a campaign (remove)
  fx.on('POST', '/subscribers/a%40b.com/remove?campaign_id=c1', () => ({ status: 200, data: {} }));
  await client.unsubscribeSubscriber('a@b.com', 'c1');
  assert(lastCall(fx, 'post', '/subscribers/a%40b.com/remove?campaign_id=c1'), 'POST remove from campaign not called');

  // Custom fields
  fx.on('GET', '/custom_field_identifiers', () => ({ status: 200, data: { identifiers: [] } }));
  await client.listCustomFields();
  assert(lastCall(fx, 'get', '/custom_field_identifiers'), 'GET custom fields not called');

  // Validation: event value must be integer
  let threw = false;
  try {
    await client.trackEvent({ email: 'a@b.com', action: 'X', properties: { value: 1.23 } });
  } catch (e) { threw = true; }
  assert(threw, 'trackEvent should throw for non-integer value');

  // All drip-client unit tests passed
}

run().catch((e) => { console.error(e); process.exit(1); });
