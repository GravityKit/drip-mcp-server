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

console.log('🧪 Testing Drip Unsubscribe Tracking\n');
console.log('='.repeat(50));

async function testUnsubscribeTracking() {
  const client = new DripClient(process.env.DRIP_API_KEY, process.env.DRIP_ACCOUNT_ID);
  
  try {
    // Test 1: Get recent unsubscribes (last 30 days)
    console.log('\n📋 Fetching recent unsubscribes (last 30 days)...');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentUnsubscribes = await client.getRecentUnsubscribes({
      since: thirtyDaysAgo.toISOString(),
      per_page: 10
    });
    
    console.log(`  Found ${recentUnsubscribes.subscribers.length} unsubscribes`);
    
    if (recentUnsubscribes.subscribers.length > 0) {
      console.log('\n  Recent unsubscribes:');
      recentUnsubscribes.subscribers.slice(0, 5).forEach(sub => {
        console.log(`    - ${sub.email}`);
        console.log(`      Unsubscribed: ${sub.unsubscribe_info.unsubscribed_at}`);
      });
    }
    
    // Test 2: Get unsubscribe statistics
    console.log('\n📊 Getting unsubscribe statistics...');
    const stats = await client.getUnsubscribeStats({
      since: thirtyDaysAgo.toISOString()
    });
    
    console.log(`  Total unsubscribes: ${stats.total}`);
    console.log(`  Date range: ${stats.date_range.start || 'N/A'} to ${stats.date_range.end || 'N/A'}`);
    console.log(`  Daily average: ${stats.daily_average}`);
    
    // Show recent days with unsubscribes
    const recentDates = Object.keys(stats.by_date).sort().slice(-7);
    if (recentDates.length > 0) {
      console.log('\n  Unsubscribes by date (last 7 days with activity):');
      recentDates.forEach(date => {
        console.log(`    ${date}: ${stats.by_date[date].count} unsubscribes`);
      });
    }
    
    // Test 3: Compare with standard method
    console.log('\n🔍 Comparing methods...');
    
    // Standard method (what MCP currently does)
    const standardMethod = await client.listSubscribers({
      status: 'unsubscribed',
      sort: 'created_at',
      direction: 'desc',
      per_page: 10
    });
    
    console.log(`  Standard method (sorted by created_at): ${standardMethod.subscribers.length} results`);
    if (standardMethod.subscribers.length > 0) {
      const oldestDate = new Date(standardMethod.subscribers[standardMethod.subscribers.length - 1].created_at);
      const newestDate = new Date(standardMethod.subscribers[0].created_at);
      console.log(`    Date range: ${oldestDate.toISOString().split('T')[0]} to ${newestDate.toISOString().split('T')[0]}`);
    }
    
    // New method (sorted by updated_at)
    const newMethod = await client.getRecentUnsubscribes({
      per_page: 10
    });
    
    console.log(`  New method (sorted by updated_at): ${newMethod.subscribers.length} results`);
    if (newMethod.subscribers.length > 0) {
      const dates = newMethod.subscribers
        .map(s => s.unsubscribe_info.unsubscribed_at)
        .filter(d => d && !isNaN(new Date(d).getTime()));
      
      if (dates.length > 0) {
        const oldestDate = new Date(dates[dates.length - 1]);
        const newestDate = new Date(dates[0]);
        console.log(`    Date range: ${oldestDate.toISOString().split('T')[0]} to ${newestDate.toISOString().split('T')[0]}`);
      }
    }
    
    // Test 4: Check for recent broadcast unsubscribes
    console.log('\n📧 Checking for recent broadcast unsubscribes...');
    
    // Get unsubscribes from the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentBroadcastUnsubscribes = await client.getRecentUnsubscribes({
      since: sevenDaysAgo.toISOString(),
      per_page: 100
    });
    
    console.log(`  Unsubscribes in last 7 days: ${recentBroadcastUnsubscribes.subscribers.length}`);
    
    // Group by day to identify spikes (which might indicate a broadcast)
    const dailyCounts = {};
    recentBroadcastUnsubscribes.subscribers.forEach(sub => {
      const date = new Date(sub.unsubscribe_info.unsubscribed_at).toISOString().split('T')[0];
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });
    
    const sortedDays = Object.entries(dailyCounts).sort((a, b) => b[1] - a[1]);
    if (sortedDays.length > 0) {
      console.log('\n  Days with most unsubscribes:');
      sortedDays.slice(0, 3).forEach(([date, count]) => {
        console.log(`    ${date}: ${count} unsubscribes ${count > 5 ? '⚠️ (possible broadcast)' : ''}`);
      });
    }
    
    console.log('\n✅ Unsubscribe tracking test complete!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

// Run the test
testUnsubscribeTracking();