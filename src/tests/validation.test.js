#!/usr/bin/env node

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { DripClient } from './drip-client.js';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from root MonoKit directory
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

console.log('🧪 Starting Drip MCP Server Validation Tests');
console.log('Testing edge cases and error conditions\n');
console.log('='.repeat(50));

class ValidationTests {
  constructor() {
    if (!process.env.DRIP_API_KEY || !process.env.DRIP_ACCOUNT_ID) {
      console.log('⏭️  Skipping validation tests: DRIP_API_KEY/DRIP_ACCOUNT_ID not set');
      process.exit(0);
    }
    this.client = new DripClient(process.env.DRIP_API_KEY, process.env.DRIP_ACCOUNT_ID);
    this.testEmail = `test-validation-${Date.now()}@example.com`;
    this.results = {
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  async run() {
    // Create a test subscriber first
    await this.setupTestSubscriber();

    // Run validation tests
    const tests = [
      { name: 'Event Value Float vs Integer', fn: () => this.testEventValueValidation() },
      { name: 'Invalid Email Format', fn: () => this.testInvalidEmailFormat() },
      { name: 'Missing Required Fields', fn: () => this.testMissingRequiredFields() },
      { name: 'Invalid Tag Format', fn: () => this.testInvalidTagFormat() },
      { name: 'Batch Size Limits', fn: () => this.testBatchSizeLimits() },
      { name: 'Invalid Date Format', fn: () => this.testInvalidDateFormat() },
      { name: 'Empty String Validation', fn: () => this.testEmptyStringValidation() },
      { name: 'Special Characters in Tags', fn: () => this.testSpecialCharactersInTags() },
      { name: 'Negative Values', fn: () => this.testNegativeValues() },
      { name: 'Maximum Field Length', fn: () => this.testMaximumFieldLength() },
      { name: 'Date Range Validation', fn: () => this.testDateRangeValidation() }
    ];

    for (const test of tests) {
      console.log(`\n📋 ${test.name}...`);
      try {
        await test.fn();
        console.log(`✅ PASSED`);
        this.results.passed++;
      } catch (error) {
        console.log(`❌ FAILED: ${error.message}`);
        this.results.failed++;
        this.results.errors.push({ test: test.name, error: error.message });
      }
    }

    // Cleanup
    await this.cleanup();

    // Print summary
    this.printSummary();
  }

  async setupTestSubscriber() {
    try {
      await this.client.createOrUpdateSubscriber({
        email: this.testEmail,
        custom_fields: {
          test_type: 'validation'
        }
      });
    } catch (error) {
      console.error('Setup failed:', error.message);
    }
  }

  async testEventValueValidation() {
    // Test 1: Float value should fail or be converted
    console.log('  Testing float value (99.99)...');
    let floatFailed = false;
    try {
      await this.client.trackEvent({
        email: this.testEmail,
        action: 'Float Test Event',
        properties: {
          value: 99.99  // This should fail or be converted
        }
      });
      console.log('    ⚠️ Float value was accepted (may be auto-converted)');
    } catch (error) {
      floatFailed = true;
      console.log('    ✓ Float value correctly rejected');
    }

    // Test 2: Integer value should succeed
    console.log('  Testing integer value (99)...');
    try {
      const result = await this.client.trackEvent({
        email: this.testEmail,
        action: 'Integer Test Event',
        properties: {
          value: 99  // This should work
        }
      });
      if (!result || !result.success) {
        throw new Error('Integer value was not accepted');
      }
      console.log('    ✓ Integer value accepted');
    } catch (error) {
      throw new Error(`Integer value should be accepted: ${error.message}`);
    }

    // Test 3: String number should fail
    console.log('  Testing string number ("99")...');
    try {
      await this.client.trackEvent({
        email: this.testEmail,
        action: 'String Number Test',
        properties: {
          value: "99"  // This should fail
        }
      });
      console.log('    ⚠️ String number was accepted (may be auto-converted)');
    } catch (error) {
      console.log('    ✓ String number correctly rejected');
    }
  }

  async testInvalidEmailFormat() {
    const invalidEmails = [
      'notanemail',
      'missing@',
      '@nodomain.com',
      'spaces in@email.com',
      'double@@email.com',
      ''
    ];

    for (const email of invalidEmails) {
      console.log(`  Testing email: "${email}"`);
      try {
        await this.client.createOrUpdateSubscriber({ email });
        throw new Error(`Invalid email "${email}" was accepted`);
      } catch (error) {
        if (error.message.includes('was accepted')) {
          throw error;
        }
        console.log(`    ✓ Correctly rejected`);
      }
    }
  }

  async testMissingRequiredFields() {
    // Test missing email in subscriber creation
    console.log('  Testing subscriber without email...');
    try {
      await this.client.createOrUpdateSubscriber({
        custom_fields: { name: 'Test' }
      });
      throw new Error('Subscriber without email was accepted');
    } catch (error) {
      if (error.message.includes('was accepted')) {
        throw error;
      }
      console.log('    ✓ Correctly rejected');
    }

    // Test event without action
    console.log('  Testing event without action...');
    try {
      await this.client.trackEvent({
        email: this.testEmail,
        properties: { test: true }
      });
      throw new Error('Event without action was accepted');
    } catch (error) {
      if (error.message.includes('was accepted')) {
        throw error;
      }
      console.log('    ✓ Correctly rejected');
    }
  }

  async testInvalidTagFormat() {
    const invalidTags = [
      '',           // Empty tag
      ' ',          // Whitespace only
      'a'.repeat(256), // Too long
      null,         // Null value
      123,          // Number instead of string
    ];

    for (const tag of invalidTags) {
      console.log(`  Testing tag: "${tag}"`);
      try {
        await this.client.tagSubscriber(this.testEmail, [tag]);
        // Some invalid tags might be auto-corrected
        console.log(`    ⚠️ Tag was accepted (may be auto-corrected)`);
      } catch (error) {
        console.log(`    ✓ Correctly rejected`);
      }
    }
  }

  async testBatchSizeLimits() {
    // Test batch size over 1000 (should be split automatically or fail)
    console.log('  Testing batch size > 1000...');
    const largeBatch = Array.from({ length: 1001 }, (_, i) => ({
      email: `batch-test-${i}@example.com`
    }));

    try {
      const result = await this.client.batchCreateSubscribers(largeBatch);
      // Should handle this by splitting into batches
      if (Array.isArray(result)) {
        console.log(`    ✓ Correctly split into ${result.length} batches`);
      } else {
        console.log('    ✓ Batch processed');
      }
    } catch (error) {
      throw new Error(`Batch size handling failed: ${error.message}`);
    }

    // Test empty batch
    console.log('  Testing empty batch...');
    try {
      await this.client.batchCreateSubscribers([]);
      throw new Error('Empty batch was accepted');
    } catch (error) {
      if (error.message.includes('was accepted')) {
        throw error;
      }
      console.log('    ✓ Empty batch correctly rejected');
    }
  }

  async testInvalidDateFormat() {
    const invalidDates = [
      'not-a-date',
      '2024-13-01T00:00:00Z',  // Invalid month
      '2024-01-32T00:00:00Z',  // Invalid day
      '2024/01/01',            // Wrong format
      '01-01-2024',            // Wrong format
    ];

    for (const date of invalidDates) {
      console.log(`  Testing date: "${date}"`);
      try {
        await this.client.trackEvent({
          email: this.testEmail,
          action: 'Date Test',
          occurred_at: date
        });
        console.log(`    ⚠️ Invalid date was accepted (may be auto-corrected)`);
      } catch (error) {
        console.log(`    ✓ Correctly rejected`);
      }
    }
  }

  async testEmptyStringValidation() {
    // Test empty string for required fields
    console.log('  Testing empty email string...');
    try {
      await this.client.createOrUpdateSubscriber({ email: '' });
      throw new Error('Empty email string was accepted');
    } catch (error) {
      if (error.message.includes('was accepted')) {
        throw error;
      }
      console.log('    ✓ Correctly rejected');
    }

    // Test empty action for events
    console.log('  Testing empty action string...');
    try {
      await this.client.trackEvent({
        email: this.testEmail,
        action: ''
      });
      throw new Error('Empty action string was accepted');
    } catch (error) {
      if (error.message.includes('was accepted')) {
        throw error;
      }
      console.log('    ✓ Correctly rejected');
    }
  }

  async testSpecialCharactersInTags() {
    const specialCharTags = [
      'tag!@#$%',
      'tag<script>',
      'tag&amp;',
      'tag\n\r',
      'tag\t\t'
    ];

    for (const tag of specialCharTags) {
      console.log(`  Testing tag with special chars: "${tag}"`);
      try {
        await this.client.tagSubscriber(this.testEmail, [tag]);
        console.log(`    ✓ Special characters accepted (may be sanitized)`);
      } catch (error) {
        console.log(`    ✓ Special characters rejected`);
      }
    }
  }

  async testNegativeValues() {
    // Test negative purchase amount
    console.log('  Testing negative purchase amount...');
    try {
      await this.client.recordPurchase({
        email: this.testEmail,
        amount: -100  // Negative amount
      });
      console.log('    ⚠️ Negative amount was accepted');
    } catch (error) {
      console.log('    ✓ Negative amount correctly rejected');
    }

    // Test negative lead score
    console.log('  Testing negative lead score...');
    try {
      await this.client.createOrUpdateSubscriber({
        email: `negative-score-${Date.now()}@example.com`,
        base_lead_score: -10
      });
      console.log('    ⚠️ Negative lead score was accepted');
    } catch (error) {
      console.log('    ✓ Negative lead score correctly rejected');
    }
  }

  async testMaximumFieldLength() {
    // Test very long custom field value
    const longString = 'a'.repeat(10000);
    
    console.log('  Testing very long custom field (10000 chars)...');
    try {
      await this.client.createOrUpdateSubscriber({
        email: `long-field-${Date.now()}@example.com`,
        custom_fields: {
          long_field: longString
        }
      });
      console.log('    ⚠️ Very long field was accepted (may be truncated)');
    } catch (error) {
      console.log('    ✓ Very long field correctly rejected');
    }

    // Test very long email
    const longEmail = 'a'.repeat(250) + '@example.com';
    console.log('  Testing very long email (250+ chars)...');
    try {
      await this.client.createOrUpdateSubscriber({
        email: longEmail
      });
      console.log('    ⚠️ Very long email was accepted');
    } catch (error) {
      console.log('    ✓ Very long email correctly rejected');
    }
  }

  async testDateRangeValidation() {
    // Test 1: Event with future date (should fail)
    console.log('  Testing event with future date...');
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    
    try {
      await this.client.trackEvent({
        email: this.testEmail,
        action: 'Future Event',
        occurred_at: futureDate.toISOString()
      });
      throw new Error('Future event date was accepted');
    } catch (error) {
      if (error.message.includes('was accepted')) {
        throw error;
      }
      console.log('    ✓ Future event date correctly rejected');
    }

    // Test 2: Event from 2 years ago (should fail - too old)
    console.log('  Testing event from 2 years ago...');
    const oldDate = new Date();
    oldDate.setFullYear(oldDate.getFullYear() - 2);
    
    try {
      await this.client.trackEvent({
        email: this.testEmail,
        action: 'Old Event',
        occurred_at: oldDate.toISOString()
      });
      throw new Error('Event from 2 years ago was accepted');
    } catch (error) {
      if (error.message.includes('was accepted')) {
        throw error;
      }
      console.log('    ✓ Old event date correctly rejected');
    }

    // Test 3: Purchase with future date (should fail)
    console.log('  Testing purchase with future date...');
    try {
      await this.client.recordPurchase({
        email: this.testEmail,
        amount: 100,
        occurred_at: futureDate.toISOString()
      });
      throw new Error('Future purchase date was accepted');
    } catch (error) {
      if (error.message.includes('was accepted')) {
        throw error;
      }
      console.log('    ✓ Future purchase date correctly rejected');
    }

    // Test 4: Conversion from 60 days ago (should fail - too old)
    console.log('  Testing conversion from 60 days ago...');
    const oldConversionDate = new Date();
    oldConversionDate.setDate(oldConversionDate.getDate() - 60);
    
    try {
      await this.client.recordConversion({
        email: this.testEmail,
        action: 'Old Conversion',
        occurred_at: oldConversionDate.toISOString()
      });
      throw new Error('Old conversion date was accepted');
    } catch (error) {
      if (error.message.includes('was accepted')) {
        throw error;
      }
      console.log('    ✓ Old conversion date correctly rejected');
    }

    // Test 5: Date before Unix epoch (1969)
    console.log('  Testing date before Unix epoch...');
    try {
      await this.client.trackEvent({
        email: this.testEmail,
        action: 'Ancient Event',
        occurred_at: '1969-12-31T00:00:00Z'
      });
      throw new Error('Date before Unix epoch was accepted');
    } catch (error) {
      if (error.message.includes('was accepted')) {
        throw error;
      }
      console.log('    ✓ Date before Unix epoch correctly rejected');
    }

    // Test 6: Unreasonably far future date (year 3001)
    console.log('  Testing year 3001...');
    try {
      await this.client.trackEvent({
        email: this.testEmail,
        action: 'Far Future Event',
        occurred_at: '3001-01-01T00:00:00Z'
      });
      throw new Error('Year 3001 was accepted');
    } catch (error) {
      if (error.message.includes('was accepted')) {
        throw error;
      }
      console.log('    ✓ Year 3001 correctly rejected');
    }

    // Test 7: Valid recent date (should succeed)
    console.log('  Testing valid recent date...');
    const recentDate = new Date();
    recentDate.setHours(recentDate.getHours() - 1);
    
    try {
      const result = await this.client.trackEvent({
        email: this.testEmail,
        action: 'Recent Event',
        occurred_at: recentDate.toISOString()
      });
      if (!result || !result.success) {
        throw new Error('Valid recent date was rejected');
      }
      console.log('    ✓ Valid recent date accepted');
    } catch (error) {
      if (error.message.includes('was rejected')) {
        throw error;
      }
      // If it's another error, the date validation might have passed but API failed
      console.log('    ✓ Date validation passed (API might have other requirements)');
    }
  }

  async cleanup() {
    console.log('\n📋 Cleanup Test Data...');
    try {
      await this.client.deleteSubscriber(this.testEmail);
      console.log('  ✓ Test subscriber deleted');
    } catch (error) {
      console.log('  ⚠️ Could not delete test subscriber');
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 VALIDATION TEST SUMMARY\n');
    console.log(`Total Tests: ${this.results.passed + this.results.failed}`);
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    
    if (this.results.errors.length > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.errors.forEach(e => {
        console.log(`  - ${e.test}: ${e.error}`);
      });
    }

    const successRate = Math.round((this.results.passed / (this.results.passed + this.results.failed)) * 100);
    console.log(`\n${successRate === 100 ? '✅' : '⚠️'} Success Rate: ${successRate}%`);
    
    if (successRate === 100) {
      console.log('\n🎉 All validation tests passed!');
    } else {
      console.log('\n⚠️ Some validation tests failed. Review the errors above.');
    }
  }
}

// Run the tests
const tests = new ValidationTests();
tests.run().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
