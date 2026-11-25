#!/bin/bash
awslocal s3api create-bucket --bucket vimslides-assets-local

awslocal s3api put-bucket-cors --bucket vimslides-assets-local --cors-configuration '{
  "CORSRules": [
    {
      "AllowedOrigins": ["http://localhost:3000"],
      "AllowedMethods": ["GET", "PUT", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}'#!/bin/bash
awslocal s3api create-bucket --bucket vimslides-assets-local

awslocal s3api put-bucket-cors --bucket vimslides-assets-local --cors-configuration '{
  "CORSRules": [
    {
      "AllowedOrigins": ["http://localhost:3000"],
      "AllowedMethods": ["GET", "PUT", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}'#!/bin/bash
awslocal s3api create-bucket --bucket vimslides-assets-local

awslocal s3api put-bucket-cors --bucket vimslides-assets-local --cors-configuration '{
  "CORSRules": [
    {
      "AllowedOrigins": ["http://localhost:3000"],
      "AllowedMethods": ["GET", "PUT", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}'#!/bin/bash
awslocal s3api create-bucket --bucket vimslides-assets-local

awslocal s3api put-bucket-cors --bucket vimslides-assets-local --cors-configuration '{
  "CORSRules": [
    {
      "AllowedOrigins": ["http://localhost:3000"],
      "AllowedMethods": ["GET", "PUT", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}'#!/bin/bash
awslocal s3api create-bucket --bucket vimslides-assets-local

awslocal s3api put-bucket-cors --bucket vimslides-assets-local --cors-configuration '{
  "CORSRules": [
    {
      "AllowedOrigins": ["http://localhost:3000"],
      "AllowedMethods": ["GET", "PUT", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}'