#!/bin/bash

# Script de test pour le webhook Manychat
# Usage: ./test-manychat-webhook.sh

echo "🧪 Testing Manychat webhook..."
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/api/webhooks/manychat \
  -H "Content-Type: application/json" \
  -H "x-manychat-secret: manychat_webhook_secret_2026_mirroreffect" \
  -d '{
    "subscriber_id": "test_subscriber_123_'$(date +%s)'",
    "first_name": "Test",
    "last_name": "User",
    "email": "test-manychat@example.com",
    "phone": "+32123456789",
    "custom_fields": {
      "event_type": "mariage",
      "event_date": "2026-06-15",
      "address": "Bruxelles",
      "guest_count": "50"
    }
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "HTTP Status: $HTTP_CODE"
echo ""
echo "Response:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Webhook test PASSED!"
  echo ""
  echo "Next step: Check Supabase to verify the lead was created"
  echo "SQL: SELECT * FROM leads WHERE utm_source = 'manychat' ORDER BY created_at DESC LIMIT 1;"
else
  echo "❌ Webhook test FAILED!"
  echo "Check the server logs for errors"
fi
