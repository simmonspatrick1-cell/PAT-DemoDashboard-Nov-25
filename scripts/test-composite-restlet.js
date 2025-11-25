#!/usr/bin/env node

/**
 * Test Script for Composite RESTlet
 *
 * This script tests the composite project + tasks creation endpoint.
 *
 * Prerequisites:
 * - RESTlet deployed in NetSuite
 * - OAuth 2.0 M2M configured
 * - Environment variables set in .env
 *
 * Usage:
 *   node scripts/test-composite-restlet.js
 */

import dotenv from 'dotenv';
import { getAccessToken } from '../api/netsuite/_oauth-m2m.js';

// Load environment variables
dotenv.config();

const RESTLET_URL = process.env.NETSUITE_RESTLET_COMPOSITE_PROJECT_URL;

if (!RESTLET_URL) {
  console.error('❌ Error: NETSUITE_RESTLET_COMPOSITE_PROJECT_URL not set in .env');
  console.log('\nAdd this to your .env file:');
  console.log('NETSUITE_RESTLET_COMPOSITE_PROJECT_URL=https://XXXXXX.restlets.api.netsuite.com/...');
  process.exit(1);
}

/**
 * Test data for project creation
 */
const TEST_PROJECT = {
  project: {
    name: 'Test Project - Composite RESTlet',
    entityid: `TEST-COMP-${Date.now()}`,
    customerId: 3161, // Change to a valid customer ID in your account
    startDate: '2025-01-15',
    endDate: '2025-06-30',
    status: 'OPEN',
    description: 'Automated test of composite project creation with rollback'
  },
  tasks: [
    {
      name: 'Discovery & Planning',
      plannedWork: 40,
      estimatedHours: 40,
      status: 'Not Started',
      resource: '', // Empty = unassigned
      serviceItem: 'PS - Discovery & Design Strategy',
      billingClass: '1',
      unitCost: 150
    },
    {
      name: 'Implementation Phase 1',
      plannedWork: 80,
      estimatedHours: 80,
      status: 'Not Started',
      resource: '',
      serviceItem: 'SVC_PR_Development',
      billingClass: '1',
      unitCost: 175
    },
    {
      name: 'Testing & QA',
      plannedWork: 32,
      estimatedHours: 32,
      status: 'Not Started',
      resource: '',
      serviceItem: 'SVC_PR_Testing',
      billingClass: '1',
      unitCost: 150
    }
  ]
};

/**
 * Call the composite RESTlet
 */
async function testCompositeRESTlet() {
  console.log('🚀 Testing Composite Project + Tasks RESTlet\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // Step 1: Get OAuth token
    console.log('Step 1: Getting OAuth 2.0 access token...');
    const accessToken = await getAccessToken();
    console.log('✓ Token obtained\n');

    // Step 2: Prepare request
    console.log('Step 2: Preparing test data...');
    console.log(`Project: ${TEST_PROJECT.project.name}`);
    console.log(`Entity ID: ${TEST_PROJECT.project.entityid}`);
    console.log(`Customer ID: ${TEST_PROJECT.project.customerId}`);
    console.log(`Tasks: ${TEST_PROJECT.tasks.length}\n`);

    // Step 3: Call RESTlet
    console.log('Step 3: Calling NetSuite RESTlet...');
    console.log(`URL: ${RESTLET_URL}\n`);

    const startTime = Date.now();

    const response = await fetch(RESTLET_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(TEST_PROJECT)
    });

    const duration = Date.now() - startTime;

    // Step 4: Parse response
    const responseText = await response.text();

    console.log('Step 4: Response received');
    console.log(`Duration: ${duration}ms`);
    console.log(`Status: ${response.status} ${response.statusText}\n`);

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error('❌ Failed to parse response as JSON:');
      console.error(responseText);
      process.exit(1);
    }

    // Step 5: Analyze result
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('📊 RESULT:\n');

    if (result.success) {
      console.log('✅ SUCCESS - Project and tasks created!\n');
      console.log('Project Details:');
      console.log(`  - Project ID: ${result.data.projectId}`);
      console.log(`  - Entity ID: ${result.data.entityid}`);
      console.log(`  - Tasks Created: ${result.data.taskCount}`);
      console.log(`  - Task IDs: ${result.data.taskIds.join(', ')}\n`);

      console.log('🔍 Verify in NetSuite:');
      console.log('  1. Go to Lists > Relationships > Projects');
      console.log(`  2. Search for: ${result.data.entityid}`);
      console.log('  3. Open project and check Project Tasks subtab\n');

      console.log('═══════════════════════════════════════════════════════════\n');
      console.log('✓ Test PASSED\n');

    } else {
      console.log('❌ FAILURE - Operation failed\n');
      console.log('Error Details:');
      console.log(`  - Code: ${result.error.code}`);
      console.log(`  - Message: ${result.error.message}`);

      if (result.error.details) {
        console.log(`  - Details:`, result.error.details);
      }

      console.log('\n═══════════════════════════════════════════════════════════\n');
      console.log('✗ Test FAILED\n');
      console.log('💡 Troubleshooting Tips:');
      console.log('  - Verify customer ID exists');
      console.log('  - Check service item names are valid');
      console.log('  - Ensure billing class IDs are correct');
      console.log('  - Review NetSuite Execution Log\n');

      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Test failed with error:\n');
    console.error(error.message);
    console.error('\n' + error.stack);

    console.log('\n💡 Common Issues:');
    console.log('  1. OAuth token expired or invalid');
    console.log('  2. RESTlet URL incorrect');
    console.log('  3. Network connectivity issue');
    console.log('  4. Role permissions missing\n');

    process.exit(1);
  }
}

/**
 * Test rollback functionality
 */
async function testRollback() {
  console.log('\n🔄 Testing Rollback Functionality\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  const INVALID_TEST = {
    project: {
      name: 'Rollback Test Project',
      entityid: `TEST-ROLLBACK-${Date.now()}`,
      customerId: 3161
    },
    tasks: [
      {
        name: 'Valid Task',
        plannedWork: 10,
        serviceItem: 'PS - Discovery & Design Strategy',
        billingClass: '1',
        unitCost: 100
      },
      {
        name: 'Invalid Task (Bad Service Item)',
        plannedWork: 10,
        serviceItem: 'INVALID_ITEM_DOES_NOT_EXIST_999',
        billingClass: '1',
        unitCost: 100
      }
    ]
  };

  try {
    console.log('Sending request with invalid task to trigger rollback...\n');

    const accessToken = await getAccessToken();

    const response = await fetch(RESTLET_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(INVALID_TEST)
    });

    const result = await response.json();

    console.log('Response received:\n');

    if (!result.success) {
      console.log('✅ Rollback test PASSED\n');
      console.log('Expected behavior:');
      console.log('  - Operation failed (as intended)');
      console.log('  - Error message received');
      console.log('  - No orphaned project created\n');

      console.log('Error Details:');
      console.log(`  - Code: ${result.error.code}`);
      console.log(`  - Message: ${result.error.message}\n`);

      if (result.error.details && result.error.details.projectId) {
        console.log('⚠️  Note: A project was created but should have been deleted');
        console.log(`    Project ID: ${result.error.details.projectId}`);
        console.log('    Verify it does NOT exist in NetSuite\n');
      }

      console.log('═══════════════════════════════════════════════════════════\n');

    } else {
      console.log('❌ Rollback test FAILED\n');
      console.log('Unexpected: Request succeeded when it should have failed');
      console.log('Check that service item validation is working\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Rollback test error:', error.message);
    process.exit(1);
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   Composite RESTlet Test Suite                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n');

  // Test 1: Normal creation
  await testCompositeRESTlet();

  // Test 2: Rollback (optional - comment out if you don't want to test)
  const testRollbackEnabled = process.argv.includes('--rollback');

  if (testRollbackEnabled) {
    await testRollback();
  } else {
    console.log('ℹ️  Skipping rollback test (add --rollback flag to enable)\n');
  }

  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('✅ All tests completed successfully!\n');
}

// Run tests
runTests().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
