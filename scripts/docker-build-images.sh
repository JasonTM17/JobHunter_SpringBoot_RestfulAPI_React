#!/usr/bin/env bash
# Build Jobhunter backend + frontend images.
# Usage:
#   ./scripts/docker-build-images.sh                    # local: jobhunter-backend:latest, jobhunter-frontend:latest
#   ./scripts/docker-build-images.sh mydockerhub        # mydockerhub/jobhunter-backend:latest
#   ./scripts/docker-build-images.sh mydockerhub v1.0.0 # ...:v1.0.0
set -euo pipefail

DOCKERHUB_USERNAME="${1:-}"
IMAGE_TAG="${2:-latest}"
NEXT_PUBLIC_API_BASE_URL="${NEXT_PUBLIC_API_BASE_URL:-http://localhost:8080}"
NEXT_PUBLIC_STORAGE_BASE_URL="${NEXT_PUBLIC_STORAGE_BASE_URL:-http://localhost:8080}"
INTERNAL_API_BASE_URL="${INTERNAL_API_BASE_URL:-http://backend:8080}"
INTERNAL_STORAGE_BASE_URL="${INTERNAL_STORAGE_BASE_URL:-http://backend:8080}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_CTX="$ROOT/backend"
FRONTEND_CTX="$ROOT/frontend"

if [[ -z "$DOCKERHUB_USERNAME" ]]; then
  BACKEND_IMAGE="jobhunter-backend:$IMAGE_TAG"
  FRONTEND_IMAGE="jobhunter-frontend:$IMAGE_TAG"
else
  BACKEND_IMAGE="$DOCKERHUB_USERNAME/jobhunter-backend:$IMAGE_TAG"
  FRONTEND_IMAGE="$DOCKERHUB_USERNAME/jobhunter-frontend:$IMAGE_TAG"
fi

echo "Building backend: $BACKEND_IMAGE"
docker build -f "$BACKEND_CTX/Dockerfile" -t "$BACKEND_IMAGE" "$BACKEND_CTX"

echo "Building frontend: $FRONTEND_IMAGE"
docker build -f "$FRONTEND_CTX/Dockerfile" \
  --build-arg "NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL" \
  --build-arg "NEXT_PUBLIC_STORAGE_BASE_URL=$NEXT_PUBLIC_STORAGE_BASE_URL" \
  --build-arg "INTERNAL_API_BASE_URL=$INTERNAL_API_BASE_URL" \
  --build-arg "INTERNAL_STORAGE_BASE_URL=$INTERNAL_STORAGE_BASE_URL" \
  -t "$FRONTEND_IMAGE" \
  "$FRONTEND_CTX"

echo "Done. Images:"
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | grep -E "jobhunter-(backend|frontend)|REPOSITORY" || true
