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

console.log('🧪 Testing Drip Name Field Handling\n');
console.log('='.repeat(50));

async function testNameFields() {
  if (!process.env.DRIP_API_KEY || !process.env.DRIP_ACCOUNT_ID) {
    console.log('⏭️  Skipping name field tests: DRIP_API_KEY/DRIP_ACCOUNT_ID not set');
    process.exit(0);
  }
  const client = new DripClient(process.env.DRIP_API_KEY, process.env.DRIP_ACCOUNT_ID);
  const timestamp = Date.now();
  let testPassed = 0;
  let testFailed = 0;
  
  try {
    // Test 1: Create subscriber with first_name and last_name at root level
    console.log('\n📋 Test 1: Creating subscriber with root-level name fields...');
    const testEmail1 = `test-name-${timestamp}-1@example.com`;
    
    const subscriber1 = await client.createOrUpdateSubscriber({
      email: testEmail1,
      first_name: 'Floaty',
      last_name: 'Katz',
      company: 'GravityKit',
      tags: ['test-name-fields']
    });
    
    console.log('  Created subscriber:', subscriber1.email);
    
    // Verify the name fields were set at root level (per Drip API)
    if (subscriber1.first_name === 'Floaty') {
      console.log('  ✅ first_name correctly set at root level');
      testPassed++;
    } else {
      console.log(`  ❌ first_name not set correctly: ${subscriber1.first_name}`);
      testFailed++;
    }
    
    if (subscriber1.last_name === 'Katz') {
      console.log('  ✅ last_name correctly set at root level');
      testPassed++;
    } else {
      console.log(`  ❌ last_name not set correctly: ${subscriber1.last_name}`);
      testFailed++;
    }
    
    if (subscriber1.custom_fields?.company === 'GravityKit') {
      console.log('  ✅ company correctly set in custom_fields');
      testPassed++;
    } else {
      console.log(`  ❌ company not set correctly: ${subscriber1.custom_fields?.company}`);
      testFailed++;
    }
    
    // Test 2: Create subscriber with name fields at root level
    console.log('\n📋 Test 2: Creating subscriber with name fields at root...');
    const testEmail2 = `test-name-${timestamp}-2@example.com`;
    
    const subscriber2 = await client.createOrUpdateSubscriber({
      email: testEmail2,
      first_name: 'Test',
      last_name: 'User',
      custom_fields: {
        job_title: 'Developer'
      },
      tags: ['test-name-fields']
    });
    
    console.log('  Created subscriber:', subscriber2.email);
    
    if (subscriber2.first_name === 'Test') {
      console.log('  ✅ first_name correctly set at root level');
      testPassed++;
    } else {
      console.log(`  ❌ first_name not set correctly: ${subscriber2.first_name}`);
      testFailed++;
    }
    
    if (subscriber2.last_name === 'User') {
      console.log('  ✅ last_name correctly set at root level');
      testPassed++;
    } else {
      console.log(`  ❌ last_name not set correctly: ${subscriber2.last_name}`);
      testFailed++;
    }
    
    if (subscriber2.custom_fields?.job_title === 'Developer') {
      console.log('  ✅ additional custom field correctly set');
      testPassed++;
    } else {
      console.log(`  ❌ job_title not set correctly: ${subscriber2.custom_fields?.job_title}`);
      testFailed++;
    }
    
    // Test 3: Update existing subscriber with name fields
    console.log('\n📋 Test 3: Updating subscriber name fields...');
    
    const updatedSubscriber = await client.createOrUpdateSubscriber({
      email: testEmail1,
      first_name: 'UpdatedFloaty',
      last_name: 'UpdatedKatz',
      phone: '+1234567890',
      city: 'San Francisco',
      state: 'CA'
    });
    
    console.log('  Updated subscriber:', updatedSubscriber.email);
    
    if (updatedSubscriber.first_name === 'UpdatedFloaty') {
      console.log('  ✅ first_name correctly updated at root level');
      testPassed++;
    } else {
      console.log(`  ❌ first_name not updated: ${updatedSubscriber.first_name}`);
      testFailed++;
    }
    
    if (updatedSubscriber.custom_fields?.phone === '+1234567890') {
      console.log('  ✅ phone correctly added to custom_fields');
      testPassed++;
    } else {
      console.log(`  ❌ phone not set: ${updatedSubscriber.custom_fields?.phone}`);
      testFailed++;
    }
    
    if (updatedSubscriber.custom_fields?.city === 'San Francisco') {
      console.log('  ✅ city correctly added to custom_fields');
      testPassed++;
    } else {
      console.log(`  ❌ city not set: ${updatedSubscriber.custom_fields?.city}`);
      testFailed++;
    }
    
    // Test 4: Mixed root and custom_fields (custom_fields should take precedence)
    console.log('\n📋 Test 4: Testing field precedence...');
    const testEmail4 = `test-name-${timestamp}-4@example.com`;
    
    const subscriber4 = await client.createOrUpdateSubscriber({
      email: testEmail4,
      first_name: 'RootLevel',  // This should go to root level
      last_name: 'CustomField',  // This should also go to root level
      custom_fields: {
        department: 'Engineering'
      },
      tags: ['test-name-fields']
    });
    
    console.log('  Created subscriber:', subscriber4.email);
    
    if (subscriber4.first_name === 'RootLevel') {
      console.log('  ✅ first_name correctly set at root level');
      testPassed++;
    } else {
      console.log(`  ❌ first_name not handled correctly: ${subscriber4.first_name}`);
      testFailed++;
    }
    
    if (subscriber4.last_name === 'CustomField') {
      console.log('  ✅ last_name correctly merged from custom_fields');
      testPassed++;
    } else {
      console.log(`  ❌ last_name not preserved: ${subscriber4.last_name}`);
      testFailed++;
    }
    
    // Test 5: Verify address fields are moved to custom_fields
    console.log('\n📋 Test 5: Testing address field handling...');
    const testEmail5 = `test-name-${timestamp}-5@example.com`;
    
    const subscriber5 = await client.createOrUpdateSubscriber({
      email: testEmail5,
      address1: '123 Main St',
      address2: 'Suite 100',
      city: 'San Francisco',
      state: 'CA',
      zip: '94105',
      country: 'USA',
      tags: ['test-name-fields']
    });
    
    console.log('  Created subscriber:', subscriber5.email);
    
    const addressFields = ['address1', 'address2', 'city', 'state', 'zip', 'country'];
    const expectedValues = {
      address1: '123 Main St',
      address2: 'Suite 100',
      city: 'San Francisco',
      state: 'CA',
      zip: '94105',
      country: 'USA'
    };
    
    addressFields.forEach(field => {
      if (subscriber5.custom_fields?.[field] === expectedValues[field]) {
        console.log(`  ✅ ${field} correctly moved to custom_fields`);
        testPassed++;
      } else {
        console.log(`  ❌ ${field} not set correctly: ${subscriber5.custom_fields?.[field]}`);
        testFailed++;
      }
    });
    
    // Cleanup: Delete test subscribers
    console.log('\n🧹 Cleaning up test subscribers...');
    const testEmails = [testEmail1, testEmail2, testEmail4, testEmail5];
    
    for (const email of testEmails) {
      try {
        await client.deleteSubscriber(email);
        console.log(`  ✓ Deleted ${email}`);
      } catch (error) {
        console.log(`  ⚠️ Could not delete ${email}`);
      }
    }
    
    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST SUMMARY\n');
    console.log(`Total Tests: ${testPassed + testFailed}`);
    console.log(`✅ Passed: ${testPassed}`);
    console.log(`❌ Failed: ${testFailed}`);
    
    const successRate = Math.round((testPassed / (testPassed + testFailed)) * 100);
    console.log(`\n${successRate === 100 ? '✅' : '⚠️'} Success Rate: ${successRate}%`);
    
    if (successRate === 100) {
      console.log('\n🎉 All name field tests passed!');
    } else {
      console.log('\n⚠️ Some tests failed. Review the errors above.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
testNameFields();
