#!/usr/bin/env bash
set -euo pipefail

APP_URL="${APP_URL:-http://localhost:3000}"

echo "== Debug env =="
curl -s "${APP_URL}/api/_debug/env" | sed 's/.*/&/'
echo

echo "== Public availability =="
curl -s "${APP_URL}/api/public/availability?date=2025-01-15"
echo

echo "== Public checkout =="
CHECKOUT_RESPONSE="$(curl -s -X POST "${APP_URL}/api/public/checkout" \
  -H "Content-Type: application/json" \
  -d '{
    "language": "fr",
    "client_name": "Test Client",
    "client_email": "test@example.com",
    "client_phone": "+32470000000",
    "event_date": "2025-01-15",
    "zone_code": "BE",
    "pack_code": "DISCOVERY",
    "options": []
  }')"

echo "${CHECKOUT_RESPONSE}"
echo

echo "== Next step (webhook) =="
echo "Copy mollie_payment_id from the checkout response and call:"
echo "curl -X POST \"${APP_URL}/api/webhooks/mollie\" \\"
echo "  -H \"x-webhook-secret: \$MOLLIE_WEBHOOK_SECRET\" \\"
echo "  -H \"Content-Type: application/x-www-form-urlencoded\" \\"
echo "  -d \"id=tr_xxx\""
