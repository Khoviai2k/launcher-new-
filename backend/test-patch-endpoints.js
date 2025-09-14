const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3000/api';
let authToken = '';

// Test data
const testGame = {
  _id: '730', // CS:GO App ID
  name: 'Counter-Strike: Global Offensive'
};

const testPatch = {
  appid: '730',
  author: 'Test Author',
  description: 'Test patch for CS:GO',
  size: 1024000, // 1MB
  download_url: 'https://example.com/patch.zip',
  version: '1.0.0',
  requires_vip: true,
  is_free: false
};

// Helper functions
async function makeRequest(method, url, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`Error ${method} ${url}:`, error.response?.data || error.message);
    return null;
  }
}

// Test functions
async function testAuth() {
  console.log('\n=== Testing Authentication ===');
  
  // Register test user
  const registerData = {
    username: 'testuser',
    password: 'testpass123',
    email: 'test@example.com'
  };
  
  const registerResult = await makeRequest('POST', '/auth/register', registerData);
  if (registerResult?.success) {
    console.log('✅ User registration successful');
    authToken = registerResult.data.tokens.access_token;
  } else {
    console.log('❌ User registration failed');
    return false;
  }
  
  return true;
}

async function testPatchEndpoints() {
  console.log('\n=== Testing Patch Endpoints ===');
  
  const headers = {
    'Authorization': `Bearer ${authToken}`
  };
  
  // Test 1: Get patches for a game (should return empty array initially)
  console.log('\n1. Testing GET /api/patches/:appid');
  const getPatchesResult = await makeRequest('GET', `/patches/${testGame._id}`, null, headers);
  if (getPatchesResult?.success) {
    console.log('✅ Get patches endpoint working');
    console.log(`   Found ${getPatchesResult.data.patches.length} patches`);
  } else {
    console.log('❌ Get patches endpoint failed');
  }
  
  // Test 2: Create a patch (admin only - should fail for regular user)
  console.log('\n2. Testing POST /api/patches (should fail - not admin)');
  const createPatchResult = await makeRequest('POST', '/patches', testPatch, headers);
  if (createPatchResult?.success) {
    console.log('❌ Create patch should have failed for non-admin user');
  } else {
    console.log('✅ Create patch correctly rejected for non-admin user');
  }
  
  // Test 3: Search patches (admin only - should fail for regular user)
  console.log('\n3. Testing GET /api/patches/search (should fail - not admin)');
  const searchPatchesResult = await makeRequest('GET', '/patches/search', null, headers);
  if (searchPatchesResult?.success) {
    console.log('❌ Search patches should have failed for non-admin user');
  } else {
    console.log('✅ Search patches correctly rejected for non-admin user');
  }
  
  // Test 4: Test patch access with VIP requirement
  console.log('\n4. Testing patch access permissions');
  const testPatchDetail = await makeRequest('GET', `/patches/${testGame._id}/nonexistent`, null, headers);
  if (testPatchDetail?.success) {
    console.log('❌ Should not find non-existent patch');
  } else {
    console.log('✅ Correctly handled non-existent patch');
  }
}

async function runTests() {
  console.log('🚀 Starting Patch Endpoints Test Suite');
  console.log('=====================================');
  
  try {
    // Test authentication first
    const authSuccess = await testAuth();
    if (!authSuccess) {
      console.log('❌ Authentication failed, stopping tests');
      return;
    }
    
    // Test patch endpoints
    await testPatchEndpoints();
    
    console.log('\n🎉 Test suite completed!');
    console.log('========================');
    
  } catch (error) {
    console.error('💥 Test suite failed:', error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  testAuth,
  testPatchEndpoints,
  runTests
};