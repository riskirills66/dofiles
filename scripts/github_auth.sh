#!/bin/bash

# GitHub Authentication Script
# This script helps you set up GitHub authentication for pulling and pushing

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Function to check if git is installed
check_git() {
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed. Please install git first."
        exit 1
    fi
    print_success "Git is installed"
}

# Function to check if GitHub CLI is installed
check_gh_cli() {
    if command -v gh &> /dev/null; then
        print_success "GitHub CLI is installed"
        return 0
    else
        print_warning "GitHub CLI is not installed. You can install it for easier authentication."
        print_status "You can install it with: sudo pacman -S github-cli (on Arch) or visit https://cli.github.com/"
        return 1
    fi
}

# Function to authenticate with GitHub CLI
authenticate_with_gh_cli() {
    print_status "Authenticating with GitHub CLI..."
    if gh auth login; then
        print_success "Successfully authenticated with GitHub CLI"
        return 0
    else
        print_error "Failed to authenticate with GitHub CLI"
        return 1
    fi
}

# Function to set up SSH key authentication
setup_ssh_auth() {
    print_status "Setting up SSH key authentication..."
    
    # Check if SSH key exists
    if [ -f ~/.ssh/id_rsa ] || [ -f ~/.ssh/id_ed25519 ]; then
        print_success "SSH key found"
    else
        print_status "No SSH key found. Generating a new one..."
        read -p "Enter your GitHub email: " email
        ssh-keygen -t ed25519 -C "$email" -f ~/.ssh/id_ed25519 -N ""
        print_success "SSH key generated"
    fi
    
    # Start SSH agent and add key
    eval "$(ssh-agent -s)"
    if [ -f ~/.ssh/id_ed25519 ]; then
        ssh-add ~/.ssh/id_ed25519
    elif [ -f ~/.ssh/id_rsa ]; then
        ssh-add ~/.ssh/id_rsa
    fi
    
    # Display public key
    print_status "Your public key:"
    echo "----------------------------------------"
    if [ -f ~/.ssh/id_ed25519.pub ]; then
        cat ~/.ssh/id_ed25519.pub
    elif [ -f ~/.ssh/id_rsa.pub ]; then
        cat ~/.ssh/id_rsa.pub
    fi
    echo "----------------------------------------"
    print_warning "Please add this key to your GitHub account at: https://github.com/settings/keys"
    read -p "Press Enter after adding the key to GitHub..."
    
    # Test SSH connection
    print_status "Testing SSH connection to GitHub..."
    if ssh -T git@github.com 2>&1 | grep -q "successfully authenticated"; then
        print_success "SSH authentication successful!"
        return 0
    else
        print_error "SSH authentication failed"
        return 1
    fi
}

# Function to set up HTTPS authentication with token
setup_https_auth() {
    print_status "Setting up HTTPS authentication with personal access token..."
    print_warning "You'll need to create a Personal Access Token at: https://github.com/settings/tokens"
    print_status "Required scopes: repo, workflow, write:packages, delete:packages"
    
    read -p "Enter your GitHub username: " username
    read -s -p "Enter your Personal Access Token: " token
    echo
    
    # Configure git credentials
    git config --global credential.helper store
    echo "https://$username:$token@github.com" > ~/.git-credentials
    chmod 600 ~/.git-credentials
    
    print_success "HTTPS authentication configured"
    return 0
}

# Function to configure git user info
configure_git_user() {
    print_status "Configuring git user information..."
    
    read -p "Enter your GitHub username: " username
    read -p "Enter your email: " email
    
    git config --global user.name "$username"
    git config --global user.email "$email"
    
    print_success "Git user information configured"
}

# Function to test authentication
test_authentication() {
    print_status "Testing authentication..."
    
    # Check if we're in a git repository
    if [ ! -d .git ]; then
        print_warning "Not in a git repository. Testing with a test repository..."
        # Try to clone a public repository
        if git clone https://github.com/octocat/Hello-World.git /tmp/test-repo 2>/dev/null; then
            print_success "Authentication test successful!"
            rm -rf /tmp/test-repo
        else
            print_error "Authentication test failed"
            return 1
        fi
    else
        # Test with current repository
        if git fetch origin 2>/dev/null; then
            print_success "Authentication test successful!"
        else
            print_error "Authentication test failed"
            return 1
        fi
    fi
}

# Main function
main() {
    echo "=========================================="
    echo "    GitHub Authentication Setup Script"
    echo "=========================================="
    echo
    
    # Check prerequisites
    check_git
    echo
    
    # Configure git user info
    configure_git_user
    echo
    
    # Check if GitHub CLI is available
    if check_gh_cli; then
        echo
        read -p "Do you want to use GitHub CLI for authentication? (y/n): " use_gh_cli
        if [[ $use_gh_cli =~ ^[Yy]$ ]]; then
            if authenticate_with_gh_cli; then
                print_success "GitHub authentication completed!"
                test_authentication
                exit 0
            fi
        fi
    fi
    
    echo
    print_status "Choose authentication method:"
    echo "1) SSH Key Authentication (recommended)"
    echo "2) HTTPS with Personal Access Token"
    read -p "Enter your choice (1 or 2): " choice
    
    case $choice in
        1)
            if setup_ssh_auth; then
                print_success "SSH authentication setup completed!"
            else
                print_error "SSH authentication setup failed"
                exit 1
            fi
            ;;
        2)
            if setup_https_auth; then
                print_success "HTTPS authentication setup completed!"
            else
                print_error "HTTPS authentication setup failed"
                exit 1
            fi
            ;;
        *)
            print_error "Invalid choice"
            exit 1
            ;;
    esac
    
    echo
    test_authentication
    
    echo
    print_success "GitHub authentication setup completed!"
    print_status "You can now pull and push to GitHub repositories."
}

# Run main function
main "$@"