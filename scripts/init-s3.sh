#!/bin/bash
aws --endpoint-url=http://localhost:4566 s3api create-bucket --bucket vimslides-assets-local 2>/dev/null || true

aws --endpoint-url=http://localhost:4566 s3api put-bucket-cors --bucket vimslides-assets-local --cors-configuration '{
  "CORSRules": [
    {
      "AllowedOrigins": ["http://localhost:3000", "http://localhost:3001"],
      "AllowedMethods": ["GET", "PUT", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}'