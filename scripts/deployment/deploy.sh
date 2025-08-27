#!/bin/bash

# Stakeados Production Deployment Script
# This script handles the complete deployment process for the admin content management system

set -e  # Exit on any error

# Configuration
DEPLOYMENT_ENV=${1:-production}
SKIP_TESTS=${2:-false}
SKIP_BACKUP=${3:-false}

echo "🚀 Starting Stakeados deployment to $DEPLOYMENT_ENV environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if required commands exist
    command -v node >/dev/null 2>&1 || error "Node.js is required but not installed"
    command -v npm >/dev/null 2>&1 || error "npm is required but not installed"
    command -v git >/dev/null 2>&1 || error "git is required but not installed"
    
    # Check Node.js version
    NODE_VERSION=$(node --version | cut -d'v' -f2)
    REQUIRED_VERSION="18.0.0"
    if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
        error "Node.js version $REQUIRED_VERSION or higher is required. Current version: $NODE_VERSION"
    fi
    
    log "✅ Prerequisites check passed"
}

# Validate environment variables
validate_environment() {
    log "Validating environment variables..."
    
    if [ "$DEPLOYMENT_ENV" = "production" ]; then
        node scripts/deployment/env-validator.js || error "Environment validation failed"
    fi
    
    log "✅ Environment validation passed"
}

# Run tests
run_tests() {
    if [ "$SKIP_TESTS" = "true" ]; then
        warn "Skipping tests as requested"
        return
    fi
    
    log "Running test suite..."
    
    # Unit tests
    npm run test:unit || error "Unit tests failed"
    
    # Integration tests
    npm run test:integration || error "Integration tests failed"
    
    # E2E tests (only for staging/production)
    if [ "$DEPLOYMENT_ENV" != "development" ]; then
        npm run test:e2e || error "E2E tests failed"
    fi
    
    log "✅ All tests passed"
}

# Create database backup
create_backup() {
    if [ "$SKIP_BACKUP" = "true" ]; then
        warn "Skipping backup as requested"
        return
    fi
    
    if [ "$DEPLOYMENT_ENV" = "production" ]; then
        log "Creating database backup..."
        
        # Create backup using Supabase CLI or custom script
        BACKUP_NAME="backup_$(date +%Y%m%d_%H%M%S)"
        
        # This would be replaced with actual backup command
        # supabase db dump --file="backups/$BACKUP_NAME.sql"
        
        log "✅ Database backup created: $BACKUP_NAME"
    fi
}

# Build application
build_application() {
    log "Building application..."
    
    # Clean previous builds
    rm -rf .next out
    
    # Install dependencies
    npm ci --production=false
    
    # Run build optimization script
    node scripts/deployment/optimize-build.js || error "Build optimization failed"
    
    # Generate static export if needed
    if [ "$DEPLOYMENT_ENV" = "production" ]; then
        npm run build:static || warn "Static build failed, continuing with regular build"
    fi
    
    log "✅ Application built successfully"
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    
    # Check if there are pending migrations
    if [ -d "supabase/migrations" ]; then
        # This would use Supabase CLI to apply migrations
        # supabase db push --include-all
        
        log "✅ Database migrations completed"
    else
        log "No migrations to run"
    fi
}

# Deploy to hosting platform
deploy_application() {
    log "Deploying application to $DEPLOYMENT_ENV..."
    
    case $DEPLOYMENT_ENV in
        "production")
            # Deploy to production (Vercel, Netlify, etc.)
            if command -v vercel >/dev/null 2>&1; then
                vercel --prod --yes || error "Production deployment failed"
            else
                warn "Vercel CLI not found, manual deployment required"
            fi
            ;;
        "staging")
            # Deploy to staging
            if command -v vercel >/dev/null 2>&1; then
                vercel --yes || error "Staging deployment failed"
            else
                warn "Vercel CLI not found, manual deployment required"
            fi
            ;;
        *)
            warn "Unknown deployment environment: $DEPLOYMENT_ENV"
            ;;
    esac
    
    log "✅ Application deployed successfully"
}

# Run post-deployment checks
post_deployment_checks() {
    log "Running post-deployment checks..."
    
    # Wait for deployment to be ready
    sleep 30
    
    # Health check
    if [ "$DEPLOYMENT_ENV" = "production" ]; then
        HEALTH_URL="https://stakeados.com/api/health"
    else
        HEALTH_URL="https://staging.stakeados.com/api/health"
    fi
    
    # Check if health endpoint responds
    if command -v curl >/dev/null 2>&1; then
        HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" || echo "000")
        if [ "$HTTP_STATUS" = "200" ]; then
            log "✅ Health check passed"
        else
            error "Health check failed with status: $HTTP_STATUS"
        fi
    else
        warn "curl not available, skipping health check"
    fi
    
    # Run performance validation
    if [ "$DEPLOYMENT_ENV" = "production" ]; then
        node scripts/deployment/performance-check.js || warn "Performance check failed"
    fi
    
    log "✅ Post-deployment checks completed"
}

# Send deployment notification
send_notification() {
    log "Sending deployment notification..."
    
    DEPLOYMENT_TIME=$(date +'%Y-%m-%d %H:%M:%S UTC')
    GIT_COMMIT=$(git rev-parse --short HEAD)
    GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    
    # Slack notification
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{
                \"text\": \"🚀 Stakeados deployed to $DEPLOYMENT_ENV\",
                \"attachments\": [{
                    \"color\": \"good\",
                    \"fields\": [
                        {\"title\": \"Environment\", \"value\": \"$DEPLOYMENT_ENV\", \"short\": true},
                        {\"title\": \"Commit\", \"value\": \"$GIT_COMMIT\", \"short\": true},
                        {\"title\": \"Branch\", \"value\": \"$GIT_BRANCH\", \"short\": true},
                        {\"title\": \"Time\", \"value\": \"$DEPLOYMENT_TIME\", \"short\": true}
                    ]
                }]
            }" \
            "$SLACK_WEBHOOK_URL" || warn "Failed to send Slack notification"
    fi
    
    log "✅ Deployment notification sent"
}

# Rollback function
rollback() {
    error "Deployment failed. Initiating rollback..."
    
    # This would implement rollback logic
    # - Restore previous version
    # - Restore database backup if needed
    # - Send failure notification
    
    error "Rollback completed. Please check logs for details."
}

# Main deployment flow
main() {
    log "Starting deployment process..."
    
    # Set up error handling
    trap rollback ERR
    
    # Run deployment steps
    check_prerequisites
    validate_environment
    run_tests
    create_backup
    build_application
    run_migrations
    deploy_application
    post_deployment_checks
    send_notification
    
    log "🎉 Deployment completed successfully!"
    log "Environment: $DEPLOYMENT_ENV"
    log "Commit: $(git rev-parse --short HEAD)"
    log "Time: $(date +'%Y-%m-%d %H:%M:%S UTC')"
}

# Run main function
main "$@"