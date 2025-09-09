#!/usr/bin/env node

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from root MonoKit directory
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

console.log('🔍 Drip MCP Server - Environment Check\n');
console.log('='.repeat(50));

// Check API Key
if (process.env.DRIP_API_KEY) {
  const key = process.env.DRIP_API_KEY;
  const masked = key.substring(0, 4) + '*'.repeat(Math.max(0, key.length - 8)) + key.substring(key.length - 4);
  console.log(`✅ DRIP_API_KEY found: ${masked}`);
  console.log(`   Length: ${key.length} characters`);
} else {
  console.log('❌ DRIP_API_KEY not found in environment');
}

// Check Account ID
if (process.env.DRIP_ACCOUNT_ID) {
  console.log(`✅ DRIP_ACCOUNT_ID found: ${process.env.DRIP_ACCOUNT_ID}`);
} else {
  console.log('❌ DRIP_ACCOUNT_ID not found in environment');
}

console.log('\n' + '='.repeat(50));
console.log('\n📝 Notes:');
console.log('1. Get your API key from: https://www.getdrip.com/user/edit');
console.log('2. Your account ID is in the URL when logged into Drip');
console.log('3. The account ID is usually a number (e.g., 12345678)');
console.log('4. Make sure credentials are in the root MonoKit .env file');
console.log('\nExample .env format:');
console.log('DRIP_API_KEY=abc123def456...');
console.log('DRIP_ACCOUNT_ID=12345678');