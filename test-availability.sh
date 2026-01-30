#!/bin/bash

# Script de test pour l'endpoint availability Manychat
# Usage: ./test-availability.sh

echo "🧪 Testing Manychat availability endpoint..."
echo ""

# Test 1: Date disponible (format YYYY-MM-DD)
echo "Test 1: Checking availability for 2026-06-15 (YYYY-MM-DD format)..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/api/manychat/availability \
  -H "Content-Type: application/json" \
  -d '{"date": "2026-06-15"}')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "HTTP Status: $HTTP_CODE"
echo "Response:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

# Test 2: Date avec format DD/MM/YYYY
echo "Test 2: Checking availability for 15/06/2026 (DD/MM/YYYY format)..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/api/manychat/availability \
  -H "Content-Type: application/json" \
  -d '{"date": "15/06/2026"}')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "HTTP Status: $HTTP_CODE"
echo "Response:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

# Test 3: Date invalide
echo "Test 3: Testing invalid date format..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/api/manychat/availability \
  -H "Content-Type: application/json" \
  -d '{"date": "invalid-date"}')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "HTTP Status: $HTTP_CODE"
echo "Response:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

# Test 4: Missing date parameter
echo "Test 4: Testing missing date parameter..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/api/manychat/availability \
  -H "Content-Type: application/json" \
  -d '{}')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "HTTP Status: $HTTP_CODE"
echo "Response:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

echo "✅ Tests completed!"
echo ""
echo "Next steps:"
echo "1. Verify the responses above are correct"
echo "2. Check Supabase to verify date bookings match the 'booked' count"
echo "3. Update your Manychat flow to use this endpoint"
