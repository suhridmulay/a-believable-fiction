#!/usr/bin/env bash

# Add opengraph metadata to all weeknotes
for file in ./src/posts/weeknotes/*.md; do
    node "./scripts/og.js" --paths $file
done

# Build the actual app
BASE_URL=$BASE_URL npx @11ty/eleventy
