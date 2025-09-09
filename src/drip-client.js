import axios from 'axios';

export class DripClient {
  constructor(apiKey, accountId, options = {}) {
    if (!apiKey || !accountId) {
      throw new Error('Drip API key and account ID are required');
    }

    this.apiKey = apiKey;
    this.accountId = accountId;
    this.baseUrl = `https://api.getdrip.com/v2/${accountId}`;
    this.axiosModule = options.axiosModule || axios;
    
    // Email validation regex
    this.emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    // Create axios instance with default config
    // Drip uses Basic auth with API key as username and empty password
    this.client = options.httpClient || this.axiosModule.create({
      baseURL: this.baseUrl,
      auth: {
        username: apiKey,
        password: ''
      },
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'MonoKit MCP Server (https://github.com/monokit)'
      },
      timeout: 30000,
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          const errorMessage = this.formatError(error.response);
          throw new Error(errorMessage);
        }
        throw error;
      }
    );
  }

  formatError(response) {
    const { status, data } = response;
    let message = `API Error (${status}): `;

    if (data && data.errors) {
      if (Array.isArray(data.errors)) {
        message += data.errors.map(e => e.message || e).join(', ');
      } else if (typeof data.errors === 'object') {
        message += Object.entries(data.errors)
          .map(([field, errors]) => `${field}: ${errors.join(', ')}`)
          .join('; ');
      } else {
        message += data.errors;
      }
    } else if (data && data.message) {
      message += data.message;
    } else {
      message += 'Unknown error occurred';
    }

    return message;
  }

  // === Validation Methods ===

  validateEmail(email) {
    if (!email || typeof email !== 'string') {
      throw new Error('Email is required and must be a string');
    }
    if (email.trim() === '') {
      throw new Error('Email cannot be empty');
    }
    if (!this.emailRegex.test(email)) {
      throw new Error(`Invalid email format: ${email}`);
    }
    if (email.length > 254) {
      throw new Error('Email address is too long (max 254 characters)');
    }
    return email.toLowerCase().trim();
  }

  validateTags(tags) {
    if (!Array.isArray(tags)) {
      tags = [tags];
    }
    
    const validTags = [];
    for (const tag of tags) {
      if (tag === null || tag === undefined) {
        continue;
      }
      
      const tagStr = String(tag).trim();
      
      if (tagStr === '') {
        throw new Error('Tag cannot be empty');
      }
      if (tagStr.length > 255) {
        throw new Error(`Tag is too long (max 255 characters): ${tagStr.substring(0, 50)}...`);
      }
      // Remove special characters that might cause issues
      const cleanTag = tagStr.replace(/[<>\"'&\n\r\t]/g, '');
      if (cleanTag !== tagStr) {
        throw new Error(`Tag contains invalid characters: ${tagStr}`);
      }
      
      validTags.push(tagStr);
    }
    
    return validTags;
  }

  validateEventProperties(properties) {
    if (!properties || typeof properties !== 'object') {
      return {};
    }
    
    const validated = {};
    for (const [key, value] of Object.entries(properties)) {
      // Check for 'value' property specifically - must be integer
      if (key === 'value') {
        if (typeof value !== 'number' || !Number.isInteger(value)) {
          throw new Error('Event property "value" must be an integer, not a float or string');
        }
      }
      validated[key] = value;
    }
    
    return validated;
  }

  validateDate(date, options = {}) {
    if (!date) {
      return new Date().toISOString();
    }
    
    // Try to parse the date
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) {
      throw new Error(`Invalid date format: ${date}`);
    }
    
    const now = new Date();
    
    // Default options for date range validation
    const {
      maxPastDays = 3650,  // 10 years default
      maxFutureDays = 365, // 1 year default
      allowFuture = true,
      allowPast = true,
      fieldName = 'Date'
    } = options;
    
    // Check if date is too far in the past
    if (allowPast && maxPastDays > 0) {
      const minDate = new Date();
      minDate.setDate(minDate.getDate() - maxPastDays);
      if (parsed < minDate) {
        throw new Error(`${fieldName} cannot be more than ${maxPastDays} days in the past`);
      }
    }
    
    // Check if date is in the future when not allowed
    if (!allowFuture && parsed > now) {
      throw new Error(`${fieldName} cannot be in the future`);
    }
    
    // Check if date is too far in the future
    if (allowFuture && maxFutureDays > 0) {
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + maxFutureDays);
      if (parsed > maxDate) {
        throw new Error(`${fieldName} cannot be more than ${maxFutureDays} days in the future`);
      }
    }
    
    // Check for dates before Unix epoch (1970)
    if (parsed.getTime() < 0) {
      throw new Error(`${fieldName} cannot be before January 1, 1970`);
    }
    
    // Check for unreasonable future dates (year 3000+)
    if (parsed.getFullYear() > 3000) {
      throw new Error(`${fieldName} year is unreasonably far in the future`);
    }
    
    return parsed.toISOString();
  }

  validateAmount(amount) {
    if (typeof amount !== 'number') {
      throw new Error('Amount must be a number');
    }
    if (amount < 0) {
      throw new Error('Amount cannot be negative');
    }
    // Drip expects amounts in cents as integers
    return Math.round(amount * 100);
  }

  // === Subscriber Methods ===

  async createOrUpdateSubscriber(subscriberData) {
    // Validate email if provided
    if (subscriberData.email) {
      subscriberData.email = this.validateEmail(subscriberData.email);
    }
    
    const payload = {
      subscribers: [this.formatSubscriberData(subscriberData)],
    };

    const response = await this.client.post('/subscribers', payload);
    return response.data.subscribers?.[0] || response.data;
  }

  async listSubscribers(params = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.per_page) queryParams.append('per_page', Math.min(params.per_page, 1000));
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.direction) queryParams.append('direction', params.direction);
    if (params.status) queryParams.append('status', params.status);
    if (params.tags) queryParams.append('tags', params.tags);

    const response = await this.client.get(`/subscribers?${queryParams.toString()}`);
    return response.data;
  }

  async getSubscriber(subscriberId) {
    // subscriberId can be either an ID or email address
    const identifier = encodeURIComponent(subscriberId);
    const response = await this.client.get(`/subscribers/${identifier}`);
    return response.data.subscribers?.[0] || response.data;
  }

  async deleteSubscriber(subscriberId) {
    const identifier = encodeURIComponent(subscriberId);
    const response = await this.client.delete(`/subscribers/${identifier}`);
    return response.status === 204;
  }

  async unsubscribeSubscriber(subscriberId, campaignId = null) {
    const identifier = encodeURIComponent(subscriberId);
    let endpoint = '';
    let response;
    if (campaignId) {
      // Remove from a specific Email Series Campaign
      endpoint = `/subscribers/${identifier}/remove`;
      const qp = new URLSearchParams({ campaign_id: String(campaignId) }).toString();
      response = await this.client.post(`${endpoint}?${qp}`);
    } else {
      // Unsubscribe from all mailings
      endpoint = `/subscribers/${identifier}/unsubscribe_all`;
      response = await this.client.post(endpoint);
    }
    return response.data.subscribers?.[0] || response.data;
  }

  async tagSubscriber(email, tags) {
    // Validate email and tags
    email = this.validateEmail(email);
    const validatedTags = this.validateTags(tags);
    
    if (validatedTags.length === 0) {
      throw new Error('At least one valid tag is required');
    }
    
    const identifier = encodeURIComponent(email);
    const payload = {
      tags: validatedTags,
    };

    const response = await this.client.post(`/subscribers/${identifier}/tags`, payload);
    return response.data;
  }

  async removeTag(email, tag) {
    const identifier = encodeURIComponent(email);
    const tagName = encodeURIComponent(tag);
    
    // DELETE request with tag in the URL path, no body needed
    const response = await this.client.delete(`/subscribers/${identifier}/tags/${tagName}`);
    return response.status === 204 ? { success: true } : response.data;
  }

  // === Event Tracking ===

  async trackEvent(eventData) {
    // Validate required fields
    const email = this.validateEmail(eventData.email);
    
    if (!eventData.action || typeof eventData.action !== 'string' || eventData.action.trim() === '') {
      throw new Error('Event action is required and cannot be empty');
    }
    
    // Validate event properties (especially 'value' must be integer)
    const properties = this.validateEventProperties(eventData.properties);
    
    // Validate date - events shouldn't be too far in the past or future
    const occurred_at = this.validateDate(eventData.occurred_at, {
      maxPastDays: 365,     // Events older than 1 year might not be processed
      maxFutureDays: 1,     // Events should not be in the future
      allowFuture: false,   // Events must have already occurred
      fieldName: 'Event occurred_at'
    });
    
    const payload = {
      events: [{
        email: email,
        action: eventData.action.trim(),
        properties: properties,
        occurred_at: occurred_at,
      }],
    };

    const response = await this.client.post('/events', payload);
    // Events endpoint returns 204 No Content on success
    return response.status === 204 ? { success: true } : response.data;
  }

  // === Campaign Methods ===

  async listCampaigns(params = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.status) queryParams.append('status', params.status);
    if (params.page) queryParams.append('page', params.page);
    if (params.per_page) queryParams.append('per_page', params.per_page);

    const response = await this.client.get(`/campaigns?${queryParams.toString()}`);
    return response.data;
  }

  async subscribeToCampaign(data) {
    const { campaign_id, ...subscriberData } = data;
    
    const payload = {
      subscribers: [this.formatSubscriberData(subscriberData)],
    };

    const response = await this.client.post(`/campaigns/${campaign_id}/subscribers`, payload);
    return response.data.subscribers?.[0] || response.data;
  }

  // === Batch Operations ===

  async batchCreateSubscribers(subscribers) {
    if (!Array.isArray(subscribers) || subscribers.length === 0) {
      throw new Error('Subscribers must be a non-empty array');
    }

    // Validate all emails first
    const validatedSubscribers = subscribers.map(sub => {
      if (sub.email) {
        return { ...sub, email: this.validateEmail(sub.email) };
      }
      return sub;
    });

    // Drip Batch API requires /subscribers/batches with wrapper
    const batchSize = 1000;
    const results = [];

    for (let i = 0; i < validatedSubscribers.length; i += batchSize) {
      const batch = validatedSubscribers.slice(i, i + batchSize);
      const payload = {
        batches: [
          {
            subscribers: batch.map(sub => this.formatSubscriberData(sub)),
          },
        ],
      };
      const response = await this.client.post('/subscribers/batches', payload);
      results.push(response.data);
    }

    return results.length === 1 ? results[0] : results;
  }

  async batchUnsubscribe(subscribers) {
    if (!Array.isArray(subscribers) || subscribers.length === 0) {
      throw new Error('Subscribers must be a non-empty array');
    }

    const payload = {
      batches: [
        {
          subscribers: subscribers.map(sub => ({ email: sub.email || sub })),
        },
      ],
    };

    const response = await this.client.post('/unsubscribes/batches', payload);
    return response.data;
  }

  // === Search Methods ===

  async searchSubscribers(params = {}) {
    // Note: The standard /subscribers endpoint has limited filtering
    // For advanced search, you might need to fetch all and filter client-side
    const queryParams = new URLSearchParams();
    
    // Standard pagination parameters
    if (params.page) queryParams.append('page', params.page);
    if (params.per_page) queryParams.append('per_page', Math.min(params.per_page || 100, 1000));
    
    // Status filter (active, unsubscribed, all)
    if (params.status) queryParams.append('status', params.status);
    
    // Sort parameters
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.direction) queryParams.append('direction', params.direction);

    const response = await this.client.get(`/subscribers?${queryParams.toString()}`);
    
    // Client-side filtering for additional parameters
    let subscribers = response.data.subscribers || [];
    
    // Filter by email (partial match)
    if (params.email) {
      subscribers = subscribers.filter(sub => 
        sub.email.toLowerCase().includes(params.email.toLowerCase())
      );
    }
    
    // Filter by tags
    if (params.tags && params.tags.length > 0) {
      subscribers = subscribers.filter(sub => {
        const subTags = sub.tags || [];
        return params.tags.every(tag => subTags.includes(tag));
      });
    }
    
    return {
      ...response.data,
      subscribers
    };
  }

  // === Unsubscribe Tracking ===

  async getRecentUnsubscribes(params = {}) {
    // Fetch unsubscribed subscribers sorted by most recent
    const queryParams = new URLSearchParams();
    
    // Always filter for unsubscribed status
    queryParams.append('status', 'unsubscribed');
    
    // Sort by created_at descending to get most recently unsubscribed
    // Note: Drip API doesn't expose unsubscribed_at directly in sorting
    queryParams.append('sort', params.sort || 'created_at');
    queryParams.append('direction', params.direction || 'desc');
    
    // Pagination
    if (params.page) queryParams.append('page', params.page);
    queryParams.append('per_page', Math.min(params.per_page || 100, 1000));
    
    const response = await this.client.get(`/subscribers?${queryParams.toString()}`);
    
    // If date filtering is requested, filter client-side
    let subscribers = response.data.subscribers || [];
    
    if (params.since) {
      const sinceDate = new Date(params.since);
      subscribers = subscribers.filter(sub => {
        const unsubscribedAt = new Date(sub.unsubscribed_at || sub.updated_at);
        return unsubscribedAt >= sinceDate;
      });
    }
    
    if (params.before) {
      const beforeDate = new Date(params.before);
      subscribers = subscribers.filter(sub => {
        const unsubscribedAt = new Date(sub.unsubscribed_at || sub.updated_at);
        return unsubscribedAt <= beforeDate;
      });
    }
    
    // Include unsubscribe metadata if available
    const enrichedSubscribers = subscribers.map(sub => ({
      ...sub,
      unsubscribe_info: {
        unsubscribed_at: sub.unsubscribed_at || sub.updated_at || sub.created_at,
        status: sub.status,
        email: sub.email,
        // These fields might be available depending on your Drip plan
        unsubscribe_reason: sub.custom_fields?.unsubscribe_reason,
        last_campaign_id: sub.custom_fields?.last_campaign_id
      }
    }));
    
    return {
      ...response.data,
      subscribers: enrichedSubscribers,
      meta: {
        ...response.data.meta,
        filtered_count: enrichedSubscribers.length,
        date_range: {
          since: params.since || null,
          before: params.before || null
        }
      }
    };
  }

  async getUnsubscribeStats(params = {}) {
    // Get unsubscribe statistics for a date range
    const unsubscribes = await this.getRecentUnsubscribes(params);
    
    // Group by date
    const statsByDate = {};
    unsubscribes.subscribers.forEach(sub => {
      const date = new Date(sub.unsubscribed_at || sub.updated_at);
      const dateKey = date.toISOString().split('T')[0];
      
      if (!statsByDate[dateKey]) {
        statsByDate[dateKey] = {
          count: 0,
          subscribers: []
        };
      }
      
      statsByDate[dateKey].count++;
      statsByDate[dateKey].subscribers.push({
        email: sub.email,
        unsubscribed_at: sub.unsubscribed_at || sub.updated_at
      });
    });
    
    // Calculate totals
    const totalUnsubscribes = unsubscribes.subscribers.length;
    const dateRange = Object.keys(statsByDate).sort();
    
    return {
      total: totalUnsubscribes,
      date_range: {
        start: dateRange[0] || null,
        end: dateRange[dateRange.length - 1] || null
      },
      by_date: statsByDate,
      daily_average: dateRange.length > 0 ? (totalUnsubscribes / dateRange.length).toFixed(2) : 0
    };
  }

  // === Workflows ===

  async listWorkflows(params = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.status) queryParams.append('status', params.status);
    if (params.page) queryParams.append('page', params.page);
    if (params.per_page) queryParams.append('per_page', params.per_page);

    const response = await this.client.get(`/workflows?${queryParams.toString()}`);
    return response.data;
  }

  async activateWorkflow(workflowId) {
    const response = await this.client.post(`/workflows/${workflowId}/activate`);
    return response.data;
  }

  async pauseWorkflow(workflowId) {
    const response = await this.client.post(`/workflows/${workflowId}/pause`);
    return response.data;
  }

  async startWorkflowForSubscriber(workflowId, email) {
    const payload = {
      subscribers: [{
        email: email,
      }],
    };

    const response = await this.client.post(`/workflows/${workflowId}/subscribers`, payload);
    return response.data;
  }

  async removeFromWorkflow(workflowId, email) {
    const identifier = encodeURIComponent(email);
    const response = await this.client.delete(`/workflows/${workflowId}/subscribers/${identifier}`);
    return response.status === 204 ? { success: true } : response.data;
  }

  // === Forms ===

  async listForms(params = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.per_page) queryParams.append('per_page', params.per_page);

    const response = await this.client.get(`/forms?${queryParams.toString()}`);
    return response.data;
  }

  async getForm(formId) {
    const response = await this.client.get(`/forms/${formId}`);
    return response.data;
  }

  // === Broadcasts ===

  async listBroadcasts(params = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.status) queryParams.append('status', params.status);
    if (params.page) queryParams.append('page', params.page);
    if (params.per_page) queryParams.append('per_page', params.per_page);

    const response = await this.client.get(`/broadcasts?${queryParams.toString()}`);
    return response.data;
  }

  async getBroadcast(broadcastId) {
    const response = await this.client.get(`/broadcasts/${broadcastId}`);
    return response.data;
  }

  // === Conversions ===

  async recordConversion(data) {
    // Validate email
    const email = this.validateEmail(data.email);
    
    if (!data.action || typeof data.action !== 'string' || data.action.trim() === '') {
      throw new Error('Conversion action is required and cannot be empty');
    }
    
    // Validate date - conversions should be recent
    const occurred_at = this.validateDate(data.occurred_at, {
      maxPastDays: 30,      // Conversions older than 30 days are unusual
      maxFutureDays: 0,     // Conversions cannot be in the future
      allowFuture: false,
      fieldName: 'Conversion occurred_at'
    });
    
    const payload = {
      conversions: [{
        email: email,
        action: data.action.trim(),
        occurred_at: occurred_at,
        properties: data.properties || {},
      }],
    };

    const response = await this.client.post('/conversions', payload);
    // Conversions endpoint may return 204 No Content on success
    return response.status === 204 ? { success: true } : response.data;
  }

  // === Purchases ===

  async recordPurchase(data) {
    // Validate email
    const email = this.validateEmail(data.email);
    
    // Validate and convert amount (Drip expects cents)
    const amount = this.validateAmount(data.amount);
    
    // Validate date - purchases should be recent
    const occurred_at = this.validateDate(data.occurred_at, {
      maxPastDays: 90,      // Purchases older than 90 days are unusual for tracking
      maxFutureDays: 0,     // Purchases cannot be in the future
      allowFuture: false,
      fieldName: 'Purchase occurred_at'
    });
    
    const payload = {
      purchases: [{
        email: email,
        amount: amount,
        occurred_at: occurred_at,
        properties: data.properties || {},
        items: data.items || [],
      }],
    };

    const response = await this.client.post('/purchases', payload);
    // Purchases endpoint may return 204 No Content on success
    return response.status === 204 ? { success: true } : response.data;
  }

  // === Helper Methods ===

  formatSubscriberData(data) {
    const formatted = {
      email: data.email,
    };

    // Standard fields that go at the root level (per Drip API docs)
    if (data.first_name) formatted.first_name = data.first_name;
    if (data.last_name) formatted.last_name = data.last_name;
    if (data.user_id) formatted.user_id = data.user_id;
    if (data.time_zone) formatted.time_zone = data.time_zone;
    
    // Initialize custom_fields for additional data
    let customFields = data.custom_fields ? { ...data.custom_fields } : {};
    
    // These fields should go in custom_fields
    const customFieldsList = [
      'company', 'phone', 'address1', 'address2', 
      'city', 'state', 'zip', 'country',
      'name', 'full_name' // These are custom, not standard Drip fields
    ];
    
    customFieldsList.forEach(field => {
      if (data[field]) {
        customFields[field] = data[field];
      }
    });
    
    // Validate and add custom fields if we have any
    if (Object.keys(customFields).length > 0) {
      // Validate custom fields aren't too long
      const validatedFields = {};
      for (const [key, value] of Object.entries(customFields)) {
        if (typeof value === 'string' && value.length > 5000) {
          throw new Error(`Custom field "${key}" is too long (max 5000 characters)`);
        }
        validatedFields[key] = value;
      }
      formatted.custom_fields = validatedFields;
    }
    
    if (data.tags) {
      formatted.tags = this.validateTags(data.tags);
    }
    if (data.prospect !== undefined) formatted.prospect = data.prospect;
    if (data.base_lead_score !== undefined) {
      if (typeof data.base_lead_score === 'number' && data.base_lead_score < 0) {
        throw new Error('Base lead score cannot be negative');
      }
      formatted.base_lead_score = data.base_lead_score;
    }
    if (data.eu_consent) formatted.eu_consent = data.eu_consent;
    if (data.eu_consent_message) formatted.eu_consent_message = data.eu_consent_message;
    if (data.reactivate_if_removed !== undefined) {
      formatted.reactivate_if_removed = data.reactivate_if_removed;
    }

    return formatted;
  }

  // === Account Information ===

  async getAccount() {
    // The /accounts endpoint lists all accounts; filter to configured account
    const accountsUrl = `https://api.getdrip.com/v2/accounts`;
    const response = await (this.axiosModule || axios).get(accountsUrl, {
      auth: {
        username: this.apiKey,
        password: ''
      },
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'MonoKit MCP Server (https://github.com/monokit)'
      }
    });
    const data = response.data;
    if (data && Array.isArray(data.accounts)) {
      const match = data.accounts.find(a => String(a.id) === String(this.accountId));
      return match ? { account: match } : data;
    }
    return data;
  }

  // === Custom Fields ===

  async listCustomFields() {
    const response = await this.client.get('/custom_field_identifiers');
    return response.data;
  }
}
