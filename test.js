import admin from "firebase-admin";
import fetch from "node-fetch";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();
const firebaseConfig ={
    "type": "service_account",
    "project_id": "auth-aadf1",
    "private_key_id": "12a5e65fdfe7b6fdb2a982cfac4f9b00004d72b1",
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDXbhbr0Kjyg56L\n0J34DmDnrN3QSvcQceteB50EZFcc1UXpwAzb8n0igCZ3rbIUjZ12BpgnlDl4eMnK\nN7Hh60dyDnVEOc1pEWg9z8HTdad8LEXY207aOxOXWac6/8XqJtIUnjNxLBPT7dSu\nBBRbjGBp7OVVXjcRWVsbTfiMkL3ZUKSJ6fwnq+RH77ZgKgp/R/JRyyfk0KCP7Z4H\n1nxWBvFHNEt3sMaYHSMTs5lPy22TKds/TVUwnBsO2gWeVKwSPh5jc8W7UFHhTyaE\nmpJGKzj9N6S+9I0E4tLaptoUbi3Jdk4+n4g2XV+Q5GCWIh7QeBJTCsob3FXIRxJ5\nDUNUx5kNAgMBAAECggEACfjc82zaP+JF1t+roE2SFhyou+Psdy9pdMB8zTTpL2V+\nnKkOL1Q/OfdH+zw9b7l1HinZ+zhfnKsCtECgaakeyockIyoFzyTwzVkDoN/jsS90\nyuqum2gmqlffvNnAIJb2xzY3grfxRwXNqtciK3FeY9OFHiQuqmKXgWEPmKTOlPOS\nnFt46RY5mwuA5GRLnrIX0oesOD2i/sP347KH38LA6UkqtfEr2bfjs53vrcqyOjoC\nsWr+0zG1y6Q4+Up7fvfEVdryz4bZKEK9ZtiPzO7WwdQEw+QjGuCHfPfT/bUWM/y6\nWmeG0MeCRWs98KF7n/ie8ryt+cMTbErZkmFc83kOoQKBgQDr3mfrAqh9ZHdlcR/R\neGiWf4OEwSrHkQv0DhNprUp+gHXqlYFVpaHQlm+SJJ0StbtWJ0nzsITHJEU5ldQ7\n+Q9u2CZ6TXWxRjo2Ro1+CjlFSF5lXDvVq4aqU2W24pAeoHuRKjzpPaN4c+OLZ+wn\n49gZGZMlZdMs3WlIzBWW2n2N9QKBgQDp0Rv3DNbX/+1WUK/tq6zS5OpiJBT26zj6\nB7wTrN/VehYOX2V+fIgV23F8veWyWhtD97gzRM6ICZPfguEw066eMUQRhzLdqgbf\n2aJqmqD+0TiqpfUjG/Ul5gWQbg5ywgF9KO3sm/yB6Xv6dj203iVd85lIEumj1lZj\nJ6uytT8XuQKBgAWTKyed13enQT8vjk34J5ivCN/BZQ50ejDZiFHuG52j0aWqxPTO\nRmXUuGxe2yuPCg9+PDw7RtgiHlS/GtYUC+5Vw4sOe6KmA0g3IK8C9NmTXU/N/0gM\nltE9yWCqODfRGTqUIf5tS4jUTGOGIEnNE9V8CkNPBc/Ap/VlhXkcTu1lAoGAAPLy\nVBxfOt01D2agcCyENQ7szJ0s4JuvzYP+hW3sMqeeM0y70rmaq8wKN+Flb0XiWnJE\n8yBSXkb7rKqRU2toiAfXKOMNl8y63mm5uQkLoj0jJ74oso3IfvDiEOYBdQHIk8N4\nw78WVUinUirssTE9oZX9h0dcX2fdTeW5Uq5dpTECgYB84U2xXsgvi4ZLJvst6x7Q\ncW8NOhPfdYS4g+Z7InNstsSylsZ4AquD0QiDqLW+L7EeUcsvq10n2QcQ7NMCb2nP\njCrAlvNnMIZnDByGiVCQquFcZlOxiPDaWtSIy9kRvgb0uwKER09kBVrafkIRUGvM\nPAAhDUZsYMSSMM20XI21FQ==\n-----END PRIVATE KEY-----\n",
    "client_email": "firebase-adminsdk-fbsvc@auth-aadf1.iam.gserviceaccount.com",
    "client_id": "103317287781496172995",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40auth-aadf1.iam.gserviceaccount.com",
    "universe_domain": "googleapis.com"
  }
  

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(firebaseConfig)
});

// API base URL (assuming your server runs locally on port 3000)
const API_BASE_URL = "http://localhost:3000";

// Store tokens for use across test functions
let idToken;
let backendToken;

// Function to generate a Firebase ID token for testing
async function generateIdToken(uid) {
    try {
      console.log(`\n🔑 Generating Firebase ID token for user: ${uid}`);
      
      // First, ensure the test user exists in Firebase Auth
      let userRecord;
      try {
        // Try to get the user first
        userRecord = await admin.auth().getUser(uid);
        console.log(`✅ Test user exists: ${uid}`);
      } catch (error) {
        // User doesn't exist, create a new one
        userRecord = await admin.auth().createUser({
          uid: uid,
          email: `${uid}@example.com`,
          displayName: `Test User ${uid}`
        });
        console.log(`✅ Created test user: ${uid}`);
      }
      
      // Create a custom token for this user
      const customToken = await admin.auth().createCustomToken(uid);
      
      // In a real scenario, we would exchange this for an ID token on the client side
      // For testing purposes, we'll use the Firebase Auth REST API to do this exchange
      
      // To use the REST API, we need a Firebase Web API key
      // You can get this from your Firebase console > Project Settings > General
      const apiKey = "AIzaSyBhAPDOiN_BZTBggOhNwVrot9L-ly8eQnQ"; // Replace with your actual Web API Key
      
      const response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            token: customToken,
            returnSecureToken: true
          })
        }
      );
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(`Error exchanging custom token: ${JSON.stringify(data)}`);
      }
      
      // Set the ID token to use in our tests
      idToken = data.idToken;
      console.log(`✅ ID token generated successfully: ${idToken}`);
      
      return idToken;
    } catch (error) {
      console.error('❌ Error generating ID token:', error);
      throw error;
    }
  }

// Test Step 1: Authenticate with backend
async function testAuthenticate() {
  try {
    console.log("\n📡 TESTING /api/users/authenticate");
    
    const response = await fetch(`${API_BASE_URL}/api/users/authenticate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log("✅ Authentication successful");
      console.log(`🔑 Customer ID: ${data.customerId}`);
      console.log(`🔑 Access Token: ${data.accessToken.substring(0, 20)}...`);
      backendToken = data.accessToken;
    } else {
      console.log(`❌ Authentication failed: ${JSON.stringify(data)}`);
    }
    
    return data;
  } catch (error) {
    console.error("❌ Error testing authentication:", error);
    throw error;
  }
}

// Test Step 2: Validate token
async function testValidateToken() {
  try {
    console.log("\n📡 TESTING /api/auth/validate-token");
    
    const response = await fetch(`${API_BASE_URL}/api/auth/validate-token`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${backendToken}`,
        "Content-Type": "application/json"
      }
    });
    
    const data = await response.json();
    console.log(`✅ Token validation result: ${JSON.stringify(data)}`);
    return data;
  } catch (error) {
    console.error("❌ Error testing token validation:", error);
    throw error;
  }
}

// Test Step 3: Refresh token
async function testRefreshToken() {
  try {
    console.log("\n📡 TESTING /api/auth/refresh-token");
    
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh-token`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${backendToken}`,
        "Content-Type": "application/json"
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ Token refreshed successfully`);
      console.log(`🔑 New Access Token: ${data.accessToken.substring(0, 20)}...`);
      // Update the token for subsequent tests
      backendToken = data.accessToken;
    } else {
      console.log(`❌ Token refresh failed: ${JSON.stringify(data)}`);
    }
    
    return data;
  } catch (error) {
    console.error("❌ Error testing token refresh:", error);
    throw error;
  }
}

// Test Step 4: Logout
async function testLogout() {
  try {
    console.log("\n📡 TESTING /api/auth/logout");
    
    const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${backendToken}`,
        "Content-Type": "application/json"
      }
    });
    
    const data = await response.json();
    console.log(`✅ Logout result: ${JSON.stringify(data)}`);
    
    // Verify token is invalidated
    console.log("\n🔍 Verifying token invalidation...");
    const validationResponse = await fetch(`${API_BASE_URL}/api/auth/validate-token`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${backendToken}`,
        "Content-Type": "application/json"
      }
    });
    
    const validationData = await validationResponse.json();
    console.log(`✅ Invalidated token check: ${JSON.stringify(validationData)}`);
    
    return data;
  } catch (error) {
    console.error("❌ Error testing logout:", error);
    throw error;
  }
}

// Run all tests in sequence
async function runAllTests() {
  try {
    console.log("🚀 STARTING AUTHENTICATION FLOW TESTS");
    
    // Generate Firebase ID token
    await generateIdToken("test-user-123");
    
    // Step 1: Authenticate with backend
    await testAuthenticate();
    
    // Step 2: Validate token
    await testValidateToken();
    
    // Step 3: Refresh token
    await testRefreshToken();
    
    // Step 4: Logout
    await testLogout();
    
    console.log("\n✨ ALL TESTS COMPLETED");
  } catch (error) {
    console.error("\n❌ TEST SUITE FAILED:", error);
  }
}

// Execute tests
runAllTests();