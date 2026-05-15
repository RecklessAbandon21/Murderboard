#!/usr/bin/env bash
set -euo pipefail

# Normalizes a git remote URL to https://github.com/org/repo (no .git suffix)
normalize_repo_url() {
  local url="$1"
  url="${url%.git}"
  if [[ "$url" =~ ^git@github\.com:(.+)$ ]]; then
    url="https://github.com/${BASH_REMATCH[1]}"
  fi
  echo "$url"
}

IMAGE="${IMAGE:-murderboard-backend}"
PUSH="${PUSH:-false}"

APP_VERSION=$(node -p "require('./package.json').version")
GIT_COMMIT_SHA=$(git rev-parse HEAD)
GIT_COMMIT_SHORT=$(git rev-parse --short HEAD)
RAW_REMOTE=$(git remote get-url origin 2>/dev/null || echo "")
PUBLIC_REPO_URL=$(normalize_repo_url "$RAW_REMOTE")
BUILD_TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")

echo "Building ${IMAGE}"
echo "  APP_VERSION      = ${APP_VERSION}"
echo "  GIT_COMMIT_SHA   = ${GIT_COMMIT_SHA}"
echo "  GIT_COMMIT_SHORT = ${GIT_COMMIT_SHORT}"
echo "  PUBLIC_REPO_URL  = ${PUBLIC_REPO_URL}"
echo "  BUILD_TIMESTAMP  = ${BUILD_TIMESTAMP}"

docker build \
  --build-arg APP_VERSION="${APP_VERSION}" \
  --build-arg GIT_COMMIT_SHA="${GIT_COMMIT_SHA}" \
  --build-arg GIT_COMMIT_SHORT="${GIT_COMMIT_SHORT}" \
  --build-arg PUBLIC_REPO_URL="${PUBLIC_REPO_URL}" \
  --build-arg BUILD_TIMESTAMP="${BUILD_TIMESTAMP}" \
  -f Dockerfile.backend \
  -t "${IMAGE}:${GIT_COMMIT_SHORT}" \
  -t "${IMAGE}:latest" \
  .

echo "Built ${IMAGE}:${GIT_COMMIT_SHORT} and ${IMAGE}:latest"

if [ "${PUSH}" = "true" ]; then
  docker push "${IMAGE}:${GIT_COMMIT_SHORT}"
  docker push "${IMAGE}:latest"
  echo "Pushed ${IMAGE}:${GIT_COMMIT_SHORT} and ${IMAGE}:latest"
fi
