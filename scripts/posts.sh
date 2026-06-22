#!/usr/bin/env bash
set -e

CURRENT_SCRIPT_FOLDER=$(dirname ${BASH_SOURCE[0]})

# Set up constants and config
BASE_GIT_BRANCH=main
POSTS_DIR=src/posts/longforms
POSTS_TEMPLATE_PATH="$CURRENT_SCRIPT_FOLDER/templates/posts.template.md"

# If the user is on main branch warn the user and exit
BRANCH=$(git branch --show-current)
if [[ "$BRANCH" == "$BASE_GIT_BRANCH" ]]; then
    echo "[ERROR] it is inadvisable to push posts from main."
    echo "[ERROR] not creating blog. Please switch branch."
    exit 1
fi

# Check for correct title from user
export POST_TITLE=$1
if [ -z "$POST_TITLE" ]; then
  echo "usage $0 [title of the post] [optional description]"
  exit 1
fi
TITLE_SLUG=$(echo $POST_TITLE | tr -d "'" | sed -E 's/[^a-zA-Z0-9]+/-/g' | sed -E 's/^-+|-+$//g' | tr "[:upper:]" "[:lower:]")

FILENAME="$TITLE_SLUG.md"
FILEPATH="$POSTS_DIR/$FILENAME"

export DESCRIPTION=$2
if [ -z "$DESCRIPTION" ]; then
    echo "[WARNING] you have not provided a description"
fi

if [ ! -f "$FILEPATH" ]; then
    echo "[INFO] creating post with title $POST_TITLE at $FILEPATH"
    envsubst < $POSTS_TEMPLATE_PATH > $FILEPATH
fi;

echo "[INFO] done"
