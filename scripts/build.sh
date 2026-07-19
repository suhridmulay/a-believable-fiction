#!/usr/bin/env bash

# Add opengraph metadata to all weeknotes
for file in ./src/posts/weeknotes/*.md; do
    node "./scripts/og.js" --paths $file
done

# Build the actual app
npx @11ty/eleventy
