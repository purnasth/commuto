#!/bin/bash

BASE_URL="http://localhost:3000"

echo "🧪 Testing DTO Implementation..."
echo "================================"

# Test 1: Get rides (public endpoint - no auth needed)
echo "\n✅ Test 1: GET /rides (public - should show filtered user data)"
curl -s "$BASE_URL/rides" | jq '.rides[0]' 2>/dev/null || echo "No rides in database yet"

# Test 2: Login to get token (CHANGE THESE CREDENTIALS!)
echo "\n✅ Test 2: Login to get JWT token"
echo "⚠️  Edit this script and add your email/password first!"
# LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
#   -H "Content-Type: application/json" \
#   -d '{
#     "email": "your-email@example.com",
#     "password": "your-password",
#     "recaptchaToken": "dev"
#   }')
# 
# TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.accessToken')
# 
# echo "Login response (check if password is hidden):"
# echo $LOGIN_RESPONSE | jq '.user'

# Test 3: Check validation works
echo "\n✅ Test 3: POST with invalid data (should get validation errors)"
echo "Expected: 400 Bad Request with validation messages"
curl -s -X POST "$BASE_URL/rides" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer fake-token" \
  -d '{"from":"","role":"invalid_role"}' | jq '.'

echo "\n================================"
echo "✅ Basic tests complete!"
echo "\n📝 Next steps:"
echo "1. Uncomment the login section and add your credentials"
echo "2. Test with real authentication"
echo "3. Check that no passwords/emails appear in responses"