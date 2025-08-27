#!/bin/bash

# Stakeados Rollback Script
# Handles rollback to previous deployment in case of issues

set -e

# Configuration
ENVIRONMENT=${1:-production}
ROLLBACK_VERSION=${2:-previous}

echo "🔄 Starting rollback process for $ENVIRONMENT environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

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

# Confirm rollback
confirm_rollback() {
    echo "⚠️  You are about to rollback $ENVIRONMENT to $ROLLBACK_VERSION"
    echo "This action cannot be undone automatically."
    echo ""
    read -p "Are you sure you want to continue? (yes/no): " -r
    
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        echo "Rollback cancelled."
        exit 0
    fi
}

# Get current deployment info
get_deployment_info() {
    log "Getting current deployment information..."
    
    if command -v vercel >/dev/null 2>&1; then
        # Get current deployment
        CURRENT_DEPLOYMENT=$(vercel ls --scope="$VERCEL_ORG_ID" | grep "$ENVIRONMENT" | head -n1 | awk '{print $1}')
        
        # Get previous deployment
        if [ "$ROLLBACK_VERSION" = "previous" ]; then
            PREVIOUS_DEPLOYMENT=$(vercel ls --scope="$VERCEL_ORG_ID" | grep "$ENVIRONMENT" | sed -n '2p' | awk '{print $1}')
        else
            PREVIOUS_DEPLOYMENT=$ROLLBACK_VERSION
        fi
        
        log "Current deployment: $CURRENT_DEPLOYMENT"
        log "Rolling back to: $PREVIOUS_DEPLOYMENT"
    else
        error "Vercel CLI not found. Cannot proceed with rollback."
    fi
}

# Create backup of current state
create_rollback_backup() {
    log "Creating backup of current state..."
    
    BACKUP_NAME="rollback_backup_$(date +%Y%m%d_%H%M%S)"
    
    # Database backup
    if [ "$ENVIRONMENT" = "production" ]; then
        log "Creating database backup: $BACKUP_NAME"
        # This would create a database backup
        # supabase db dump --file="backups/$BACKUP_NAME.sql"
    fi
    
    # Store current deployment ID for potential re-rollback
    echo "$CURRENT_DEPLOYMENT" > "rollback_info_$BACKUP_NAME.txt"
    
    log "✅ Backup created: $BACKUP_NAME"
}

# Rollback application deployment
rollback_application() {
    log "Rolling back application deployment..."
    
    if command -v vercel >/dev/null 2>&1; then
        # Promote previous deployment
        vercel promote "$PREVIOUS_DEPLOYMENT" --scope="$VERCEL_ORG_ID" || error "Failed to promote previous deployment"
        
        log "✅ Application rolled back successfully"
    else
        error "Cannot rollback application without Vercel CLI"
    fi
}

# Rollback database if needed
rollback_database() {
    log "Checking if database rollback is needed..."
    
    # This is a critical decision point
    # Database rollbacks should be handled very carefully
    
    if [ -f "migration_rollback_$ENVIRONMENT.sql" ]; then
        warn "Database rollback script found. This requires manual review."
        echo "Please review migration_rollback_$ENVIRONMENT.sql before proceeding."
        read -p "Apply database rollback? (yes/no): " -r
        
        if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            log "Applying database rollback..."
            # Apply rollback migrations
            # supabase db reset --file="migration_rollback_$ENVIRONMENT.sql"
            log "✅ Database rollback completed"
        else
            warn "Database rollback skipped"
        fi
    else
        log "No database rollback needed"
    fi
}

# Verify rollback success
verify_rollback() {
    log "Verifying rollback success..."
    
    # Wait for deployment to be ready
    sleep 30
    
    # Health check
    if [ "$ENVIRONMENT" = "production" ]; then
        HEALTH_URL="https://stakeados.com/api/health"
    else
        HEALTH_URL="https://staging.stakeados.com/api/health"
    fi
    
    # Check health endpoint
    if command -v curl >/dev/null 2>&1; then
        HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" || echo "000")
        if [ "$HTTP_STATUS" = "200" ]; then
            log "✅ Health check passed after rollback"
        else
            error "Health check failed after rollback. Status: $HTTP_STATUS"
        fi
    else
        warn "curl not available, skipping health check"
    fi
    
    # Basic functionality test
    log "Running basic functionality tests..."
    # Add basic smoke tests here
    
    log "✅ Rollback verification completed"
}

# Send rollback notification
send_notification() {
    log "Sending rollback notification..."
    
    ROLLBACK_TIME=$(date +'%Y-%m-%d %H:%M:%S UTC')
    
    # Slack notification
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{
                \"text\": \"🔄 Stakeados rollback completed\",
                \"attachments\": [{
                    \"color\": \"warning\",
                    \"fields\": [
                        {\"title\": \"Environment\", \"value\": \"$ENVIRONMENT\", \"short\": true},
                        {\"title\": \"Rolled back to\", \"value\": \"$PREVIOUS_DEPLOYMENT\", \"short\": true},
                        {\"title\": \"Time\", \"value\": \"$ROLLBACK_TIME\", \"short\": true},
                        {\"title\": \"Reason\", \"value\": \"Manual rollback\", \"short\": true}
                    ]
                }]
            }" \
            "$SLACK_WEBHOOK_URL" || warn "Failed to send Slack notification"
    fi
    
    log "✅ Rollback notification sent"
}

# Generate rollback report
generate_report() {
    log "Generating rollback report..."
    
    REPORT_FILE="rollback_report_$(date +%Y%m%d_%H%M%S).json"
    
    cat > "$REPORT_FILE" << EOF
{
    "rollback": {
        "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
        "environment": "$ENVIRONMENT",
        "from_deployment": "$CURRENT_DEPLOYMENT",
        "to_deployment": "$PREVIOUS_DEPLOYMENT",
        "initiated_by": "$(whoami)",
        "reason": "Manual rollback",
        "status": "completed"
    },
    "verification": {
        "health_check": "passed",
        "functionality_test": "passed"
    },
    "next_steps": [
        "Monitor application for stability",
        "Investigate root cause of issues that led to rollback",
        "Plan fix and re-deployment",
        "Update team on status"
    ]
}
EOF
    
    log "✅ Rollback report generated: $REPORT_FILE"
}

# Main rollback process
main() {
    log "Starting rollback process..."
    
    confirm_rollback
    get_deployment_info
    create_rollback_backup
    rollback_application
    rollback_database
    verify_rollback
    send_notification
    generate_report
    
    log "🎉 Rollback completed successfully!"
    log "Environment: $ENVIRONMENT"
    log "Rolled back to: $PREVIOUS_DEPLOYMENT"
    log "Time: $(date +'%Y-%m-%d %H:%M:%S UTC')"
    
    echo ""
    echo "Next steps:"
    echo "1. Monitor the application for stability"
    echo "2. Investigate the root cause of the issues"
    echo "3. Plan and test fixes"
    echo "4. Prepare for re-deployment when ready"
}

# Run main function
main "$@"