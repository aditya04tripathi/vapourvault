#!/bin/bash
set -e

API_URL="http://localhost:3000"

parse_json() {
  echo "$1" | node -e "const fs = require('fs'); const stdin = fs.readFileSync(0, 'utf-8'); try { const json = JSON.parse(stdin); console.log(json.data ? json.data['$2'] : json['$2']); } catch (e) { console.error('Error parsing JSON'); }"
}

echo "1. Getting Presigned URL..."
PRESIGN_RESPONSE=$(curl -s -X POST "$API_URL/files/presign-upload" \
  -H "Content-Type: application/json" \
  -d '{"fileName": "test.txt", "mimeType": "text/plain", "size": 12}')

echo "Response: $PRESIGN_RESPONSE"
FILE_ID=$(parse_json "$PRESIGN_RESPONSE" "fileId")
UPLOAD_URL=$(parse_json "$PRESIGN_RESPONSE" "uploadUrl")
UPLOAD_KEY=$(parse_json "$PRESIGN_RESPONSE" "uploadKey")

echo "File ID: $FILE_ID"
echo "Upload Key: $UPLOAD_KEY"

if [ -z "$FILE_ID" ] || [ "$FILE_ID" == "undefined" ]; then
    echo "Failed to get File ID"
    exit 1
fi

echo "2. Uploading file to MinIO..."
# curl might fail if url is not reachable, but assuming localhost
curl -s -X PUT "$UPLOAD_URL" -H "Content-Type: text/plain" -d "Hello World!"

echo "3. Completing Upload..."
COMPLETE_RESPONSE=$(curl -s -X POST "$API_URL/files/complete-upload" \
  -H "Content-Type: application/json" \
  -d "{\"fileId\": \"$FILE_ID\", \"uploadKey\": \"$UPLOAD_KEY\"}")

echo "Response: $COMPLETE_RESPONSE"

echo "4. Checking Status and Waiting for Processing..."
for i in {1..5}; do
    STATUS_RESPONSE=$(curl -s "$API_URL/files/$FILE_ID/status")
    STATUS=$(parse_json "$STATUS_RESPONSE" "status")
    JOB_STATUS=$(parse_json "$STATUS_RESPONSE" "jobStatus")
    echo "Attempt $i: Status=$STATUS, JobStatus=$JOB_STATUS"
    
    if [ "$STATUS" == "COMPLETED" ]; then
        break
    fi
    sleep 2
done

echo "5. Getting Download URL..."
DOWNLOAD_RESPONSE=$(curl -s "$API_URL/files/$FILE_ID/download")
echo "Download Response: $DOWNLOAD_RESPONSE"
DOWNLOAD_URL=$(parse_json "$DOWNLOAD_RESPONSE" "url")

if [ -n "$DOWNLOAD_URL" ] && [ "$DOWNLOAD_URL" != "undefined" ]; then
    echo "6. Downloading file..."
    CONTENT=$(curl -s "$DOWNLOAD_URL")
    echo "Downloaded Content: $CONTENT"
    if [ "$CONTENT" == "Hello World!" ]; then
        echo "SUCCESS: Content matches!"
    else
        echo "FAILURE: Content mismatch!"
        exit 1
    fi
else
    echo "Download URL not available."
    exit 1
fi
