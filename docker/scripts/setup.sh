#!/bin/bash
#
# Crystal Forge Docker Environment Setup Script
#
# Builds and starts all Docker containers with sample data.
#
# Usage:
#   ./setup.sh           # Start environment (build if needed)
#   ./setup.sh --build   # Force rebuild all images
#   ./setup.sh --help    # Show help
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

show_help() {
    echo "Crystal Forge Docker Setup Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --build     Force rebuild all Docker images"
    echo "  --no-cache  Rebuild without using cache"
    echo "  --help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0              # Start environment (uses existing images)"
    echo "  $0 --build      # Force rebuild images"
    echo "  $0 --no-cache   # Full rebuild without cache"
}

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Parse arguments
FORCE_BUILD=false
NO_CACHE=""

for arg in "$@"; do
    case $arg in
        --build)
            FORCE_BUILD=true
            ;;
        --no-cache)
            FORCE_BUILD=true
            NO_CACHE="--no-cache"
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            log_error "Unknown option: $arg"
            show_help
            exit 1
            ;;
    esac
done

# Change to project root
cd "$PROJECT_ROOT"

echo "============================================================"
echo "Crystal Forge Docker Setup"
echo "============================================================"
echo ""

# Check if Docker is running
log_step "Checking Docker..."
if ! docker info > /dev/null 2>&1; then
    log_error "Docker is not running. Please start Docker and try again."
    exit 1
fi
log_info "Docker is running"

# Check if containers are already running
if docker compose ps -q 2>/dev/null | grep -q .; then
    log_warn "Containers are already running"
    echo ""
    read -p "Do you want to restart them? (y/N) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Stopping existing containers..."
        docker compose down
    else
        log_info "Keeping existing containers"
        echo ""
        echo "Access points:"
        echo "  Crystal Forge UI: http://localhost:3000"
        echo "  OpenSearch API: http://localhost:9200"
        echo "  OpenSearch Dashboards: http://localhost:5601"
        exit 0
    fi
fi

# Build if needed
if [ "$FORCE_BUILD" = true ]; then
    log_step "Building Docker images..."
    docker compose build $NO_CACHE
    log_info "Build complete"
fi

# Start containers
log_step "Starting Docker containers..."
docker compose up -d

# Wait for OpenSearch to be healthy
log_step "Waiting for OpenSearch to be ready..."
RETRIES=30
until docker compose exec -T opensearch curl -s http://localhost:9200/_cluster/health > /dev/null 2>&1; do
    RETRIES=$((RETRIES - 1))
    if [ $RETRIES -eq 0 ]; then
        log_error "OpenSearch failed to start. Check logs with: docker compose logs opensearch"
        exit 1
    fi
    echo -n "."
    sleep 2
done
echo ""
log_info "OpenSearch is healthy"

# Wait for data loader to complete
log_step "Waiting for sample data to load..."
RETRIES=30
while docker compose ps data-loader --status running -q 2>/dev/null | grep -q .; do
    RETRIES=$((RETRIES - 1))
    if [ $RETRIES -eq 0 ]; then
        log_warn "Data loader is taking longer than expected"
        break
    fi
    echo -n "."
    sleep 1
done
echo ""

# Check if data was loaded successfully
DATA_LOADER_EXIT=$(docker inspect data-loader --format='{{.State.ExitCode}}' 2>/dev/null || echo "1")
if [ "$DATA_LOADER_EXIT" = "0" ]; then
    log_info "Sample data loaded successfully"
else
    log_warn "Data loader may have encountered issues. Check logs with: docker compose logs data-loader"
fi

# Verify index exists
log_step "Verifying opensearch-demo index..."
if curl -s http://localhost:9200/opensearch-demo/_count 2>/dev/null | grep -q '"count"'; then
    DOC_COUNT=$(curl -s http://localhost:9200/opensearch-demo/_count 2>/dev/null | grep -o '"count":[0-9]*' | cut -d: -f2)
    log_info "Index 'opensearch-demo' contains $DOC_COUNT documents"
else
    log_warn "Could not verify index. It may still be loading."
fi

# Final summary
echo ""
echo "============================================================"
echo "Setup Complete!"
echo "============================================================"
echo ""
echo "Access points:"
echo "  Crystal Forge UI:      http://localhost:3000"
echo "  OpenSearch API:        http://localhost:9200"
echo "  OpenSearch Dashboards: http://localhost:5601"
echo ""
echo "Quick start:"
echo "  1. Open http://localhost:3000"
echo "  2. Click 'Connect' and enter http://localhost:9200"
echo "  3. Select the 'opensearch-demo' index"
echo "  4. Start building queries!"
echo ""
echo "To stop the environment:"
echo "  docker compose down"
echo "  # or: ./docker/scripts/teardown.sh"
echo ""
