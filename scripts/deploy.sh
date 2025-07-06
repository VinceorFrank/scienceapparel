#!/bin/bash

# Comprehensive Deployment Script
# Supports multiple environments with safety checks and rollback capabilities

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEPLOYMENT_TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Default values
ENVIRONMENT="staging"
NAMESPACE="staging"
IMAGE_TAG="latest"
DRY_RUN=false
ROLLBACK=false
FORCE=false

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Deploy the ecommerce backend application

OPTIONS:
    -e, --environment ENV    Deployment environment (staging|production) [default: staging]
    -t, --tag TAG           Docker image tag [default: latest]
    -n, --namespace NS      Kubernetes namespace [default: staging]
    -d, --dry-run          Perform a dry run without actual deployment
    -r, --rollback         Rollback to previous deployment
    -f, --force            Force deployment without confirmation
    -h, --help             Show this help message

EXAMPLES:
    $0 -e staging -t v1.0.0
    $0 -e production -t v1.0.0 -f
    $0 -e production -r
EOF
}

# Function to parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -t|--tag)
                IMAGE_TAG="$2"
                shift 2
                ;;
            -n|--namespace)
                NAMESPACE="$2"
                shift 2
                ;;
            -d|--dry-run)
                DRY_RUN=true
                shift
                ;;
            -r|--rollback)
                ROLLBACK=true
                shift
                ;;
            -f|--force)
                FORCE=true
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
}

# Function to validate environment
validate_environment() {
    case $ENVIRONMENT in
        staging|production)
            print_status "Environment: $ENVIRONMENT"
            ;;
        *)
            print_error "Invalid environment: $ENVIRONMENT"
            print_error "Valid environments: staging, production"
            exit 1
            ;;
    esac
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if kubectl is installed
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed"
        exit 1
    fi
    
    # Check if docker is installed
    if ! command -v docker &> /dev/null; then
        print_error "docker is not installed"
        exit 1
    fi
    
    # Check kubectl context
    if ! kubectl cluster-info &> /dev/null; then
        print_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    # Check if namespace exists
    if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
        print_warning "Namespace $NAMESPACE does not exist, creating..."
        if [[ "$DRY_RUN" == false ]]; then
            kubectl create namespace "$NAMESPACE"
        fi
    fi
    
    print_success "Prerequisites check passed"
}

# Function to backup current deployment
backup_deployment() {
    print_status "Creating backup of current deployment..."
    
    BACKUP_DIR="$PROJECT_ROOT/backups/$DEPLOYMENT_TIMESTAMP"
    mkdir -p "$BACKUP_DIR"
    
    if kubectl get deployment ecommerce-backend -n "$NAMESPACE" &> /dev/null; then
        kubectl get deployment ecommerce-backend -n "$NAMESPACE" -o yaml > "$BACKUP_DIR/deployment.yaml"
        kubectl get service ecommerce-backend-service -n "$NAMESPACE" -o yaml > "$BACKUP_DIR/service.yaml" 2>/dev/null || true
        kubectl get ingress ecommerce-backend-ingress -n "$NAMESPACE" -o yaml > "$BACKUP_DIR/ingress.yaml" 2>/dev/null || true
        
        print_success "Backup created in $BACKUP_DIR"
    else
        print_warning "No existing deployment found to backup"
    fi
}

# Function to update deployment manifests
update_manifests() {
    print_status "Updating deployment manifests..."
    
    MANIFEST_DIR="$PROJECT_ROOT/k8s/$ENVIRONMENT"
    
    if [[ ! -d "$MANIFEST_DIR" ]]; then
        print_error "Manifest directory not found: $MANIFEST_DIR"
        exit 1
    fi
    
    # Update image tag in deployment
    if [[ "$DRY_RUN" == false ]]; then
        sed -i.bak "s|image: .*|image: ghcr.io/your-org/ecommerce-backend:$IMAGE_TAG|g" "$MANIFEST_DIR/deployment.yaml"
        rm -f "$MANIFEST_DIR/deployment.yaml.bak"
    fi
    
    print_success "Manifests updated"
}

# Function to deploy application
deploy_application() {
    print_status "Deploying application to $ENVIRONMENT..."
    
    MANIFEST_DIR="$PROJECT_ROOT/k8s/$ENVIRONMENT"
    
    if [[ "$DRY_RUN" == true ]]; then
        print_status "DRY RUN: Would apply manifests from $MANIFEST_DIR"
        kubectl apply -f "$MANIFEST_DIR" --dry-run=client -n "$NAMESPACE"
        return
    fi
    
    # Apply manifests
    kubectl apply -f "$MANIFEST_DIR" -n "$NAMESPACE"
    
    # Wait for deployment to be ready
    print_status "Waiting for deployment to be ready..."
    kubectl rollout status deployment/ecommerce-backend -n "$NAMESPACE" --timeout=300s
    
    print_success "Application deployed successfully"
}

# Function to run health checks
run_health_checks() {
    print_status "Running health checks..."
    
    # Get service URL
    SERVICE_URL=$(kubectl get service ecommerce-backend-service -n "$NAMESPACE" -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
    
    if [[ -z "$SERVICE_URL" ]]; then
        print_warning "Service URL not available, skipping health checks"
        return
    fi
    
    # Health check endpoints
    ENDPOINTS=(
        "/api/health"
        "/api/products"
        "/api/categories"
    )
    
    for endpoint in "${ENDPOINTS[@]}"; do
        print_status "Checking $endpoint..."
        if curl -f -s "http://$SERVICE_URL$endpoint" > /dev/null; then
            print_success "$endpoint is healthy"
        else
            print_error "$endpoint is not responding"
            return 1
        fi
    done
    
    print_success "All health checks passed"
}

# Function to rollback deployment
rollback_deployment() {
    print_status "Rolling back deployment..."
    
    # Get previous deployment
    PREVIOUS_REVISION=$(kubectl rollout history deployment/ecommerce-backend -n "$NAMESPACE" --output=jsonpath='{.items[1].revision}')
    
    if [[ -z "$PREVIOUS_REVISION" ]]; then
        print_error "No previous deployment found"
        exit 1
    fi
    
    if [[ "$DRY_RUN" == true ]]; then
        print_status "DRY RUN: Would rollback to revision $PREVIOUS_REVISION"
        return
    fi
    
    kubectl rollout undo deployment/ecommerce-backend -n "$NAMESPACE" --to-revision="$PREVIOUS_REVISION"
    
    # Wait for rollback to complete
    kubectl rollout status deployment/ecommerce-backend -n "$NAMESPACE" --timeout=300s
    
    print_success "Rollback completed successfully"
}

# Function to show deployment status
show_deployment_status() {
    print_status "Deployment status:"
    
    echo "=== Pods ==="
    kubectl get pods -n "$NAMESPACE" -l app=ecommerce-backend
    
    echo "=== Services ==="
    kubectl get services -n "$NAMESPACE" -l app=ecommerce-backend
    
    echo "=== Ingress ==="
    kubectl get ingress -n "$NAMESPACE" -l app=ecommerce-backend 2>/dev/null || echo "No ingress found"
    
    echo "=== HPA ==="
    kubectl get hpa -n "$NAMESPACE" -l app=ecommerce-backend 2>/dev/null || echo "No HPA found"
}

# Function to cleanup old backups
cleanup_backups() {
    print_status "Cleaning up old backups..."
    
    BACKUP_DIR="$PROJECT_ROOT/backups"
    
    # Keep only last 5 backups
    if [[ -d "$BACKUP_DIR" ]]; then
        cd "$BACKUP_DIR"
        ls -t | tail -n +6 | xargs -r rm -rf
        print_success "Old backups cleaned up"
    fi
}

# Function to send notifications
send_notification() {
    local status="$1"
    local message="$2"
    
    # Example: Send to Slack, email, etc.
    print_status "Sending notification: $message"
    
    # Add your notification logic here
    # Example: curl -X POST -H 'Content-type: application/json' --data "{\"text\":\"$message\"}" $SLACK_WEBHOOK_URL
}

# Main deployment function
main() {
    print_status "Starting deployment process..."
    print_status "Environment: $ENVIRONMENT"
    print_status "Namespace: $NAMESPACE"
    print_status "Image tag: $IMAGE_TAG"
    print_status "Dry run: $DRY_RUN"
    
    # Parse arguments
    parse_arguments "$@"
    
    # Validate environment
    validate_environment
    
    # Check prerequisites
    check_prerequisites
    
    # Confirm deployment (unless forced)
    if [[ "$FORCE" == false && "$DRY_RUN" == false ]]; then
        echo
        read -p "Are you sure you want to deploy to $ENVIRONMENT? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Deployment cancelled"
            exit 0
        fi
    fi
    
    # Create backup
    backup_deployment
    
    # Update manifests
    update_manifests
    
    # Deploy or rollback
    if [[ "$ROLLBACK" == true ]]; then
        rollback_deployment
    else
        deploy_application
    fi
    
    # Run health checks
    if [[ "$DRY_RUN" == false ]]; then
        run_health_checks
    fi
    
    # Show deployment status
    show_deployment_status
    
    # Cleanup old backups
    cleanup_backups
    
    # Send notification
    if [[ "$DRY_RUN" == false ]]; then
        if [[ "$ROLLBACK" == true ]]; then
            send_notification "success" "Rollback completed successfully for $ENVIRONMENT"
        else
            send_notification "success" "Deployment completed successfully for $ENVIRONMENT (tag: $IMAGE_TAG)"
        fi
    fi
    
    print_success "Deployment process completed"
}

# Run main function with all arguments
main "$@" 