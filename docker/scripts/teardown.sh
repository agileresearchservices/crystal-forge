#!/bin/bash
#
# Crystal Forge Docker Environment Teardown Script
#
# Stops all containers and optionally removes volumes and generated data.
#
# Usage:
#   ./teardown.sh           # Stop containers, keep data
#   ./teardown.sh --clean   # Stop containers and remove all data
#   ./teardown.sh --help    # Show help
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

show_help() {
    echo "Crystal Forge Docker Teardown Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --clean     Remove all data including Docker volumes and generated files"
    echo "  --volumes   Remove Docker volumes only (keeps generated files)"
    echo "  --help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0              # Stop containers, preserve all data"
    echo "  $0 --clean      # Full cleanup including volumes and generated data"
    echo "  $0 --volumes    # Stop containers and remove volumes"
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

# Parse arguments
CLEAN_ALL=false
REMOVE_VOLUMES=false

for arg in "$@"; do
    case $arg in
        --clean)
            CLEAN_ALL=true
            REMOVE_VOLUMES=true
            ;;
        --volumes)
            REMOVE_VOLUMES=true
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
echo "Crystal Forge Docker Teardown"
echo "============================================================"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    log_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Stop and remove containers
log_info "Stopping Docker containers..."
if docker compose ps -q 2>/dev/null | grep -q .; then
    docker compose down
    log_info "Containers stopped and removed"
else
    log_warn "No running containers found"
fi

# Remove volumes if requested
if [ "$REMOVE_VOLUMES" = true ]; then
    log_info "Removing Docker volumes..."
    docker compose down -v 2>/dev/null || true

    # Also try to remove the specific volume if it exists
    if docker volume ls -q | grep -q "crystal-forge_opensearch-data"; then
        docker volume rm crystal-forge_opensearch-data 2>/dev/null || true
        log_info "Removed opensearch-data volume"
    fi

    log_info "Docker volumes removed"
fi

# Clean generated files if requested
if [ "$CLEAN_ALL" = true ]; then
    log_info "Removing generated files..."

    # Remove generated documents file
    if [ -f "$SCRIPT_DIR/generated_documents.json" ]; then
        rm -f "$SCRIPT_DIR/generated_documents.json"
        log_info "Removed generated_documents.json"
    fi

    log_info "Generated files removed"
fi

# Show remaining resources
echo ""
echo "============================================================"
echo "Teardown Complete"
echo "============================================================"

if [ "$REMOVE_VOLUMES" = true ]; then
    echo "- Containers: Removed"
    echo "- Volumes: Removed"
else
    echo "- Containers: Removed"
    echo "- Volumes: Preserved (use --volumes to remove)"
fi

if [ "$CLEAN_ALL" = true ]; then
    echo "- Generated files: Removed"
else
    echo "- Generated files: Preserved (use --clean to remove)"
fi

echo ""
echo "To restart the environment, run:"
echo "  docker compose up -d"
echo ""
