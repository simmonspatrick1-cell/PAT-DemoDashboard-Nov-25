#!/bin/bash

###############################################################################
# NetSuite OAuth 2.0 M2M Certificate Generation Script
#
# This script automates the creation of RSA keypairs and X.509 certificates
# required for NetSuite OAuth 2.0 Machine-to-Machine authentication.
#
# WHAT THIS SCRIPT DOES:
# 1. Generates a 4096-bit RSA private key
# 2. Creates a self-signed X.509 certificate valid for 2 years
# 3. Saves both files to ./certificates/ directory
# 4. Provides step-by-step instructions for NetSuite configuration
#
# USAGE:
#   chmod +x scripts/setup-oauth-m2m.sh
#   ./scripts/setup-oauth-m2m.sh
#
# OUTPUT FILES:
#   - certificates/private_key.pem (KEEP SECRET - store in .env)
#   - certificates/certificate.pem (upload to NetSuite)
#
# SECURITY NOTES:
# - NEVER commit private_key.pem to version control
# - Store private key in environment variables or secrets manager
# - Rotate certificates every 2 years (before expiration)
#
###############################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   NetSuite OAuth 2.0 M2M Certificate Generation Script        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Create certificates directory
CERT_DIR="./certificates"
if [ ! -d "$CERT_DIR" ]; then
  echo -e "${YELLOW}Creating certificates directory...${NC}"
  mkdir -p "$CERT_DIR"
fi

# Check if files already exist
if [ -f "$CERT_DIR/private_key.pem" ] || [ -f "$CERT_DIR/certificate.pem" ]; then
  echo -e "${YELLOW}⚠️  Existing certificate files detected!${NC}"
  read -p "Do you want to overwrite them? (yes/no): " -r
  if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo -e "${RED}Aborted.${NC}"
    exit 1
  fi
  rm -f "$CERT_DIR/private_key.pem" "$CERT_DIR/certificate.pem"
fi

# Step 1: Generate Private Key (4096-bit RSA)
echo -e "${GREEN}Step 1: Generating 4096-bit RSA private key...${NC}"
openssl genrsa -out "$CERT_DIR/private_key.pem" 4096

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Private key generated successfully${NC}"
else
  echo -e "${RED}✗ Failed to generate private key${NC}"
  exit 1
fi

# Step 2: Generate Self-Signed Certificate (2 years validity)
echo ""
echo -e "${GREEN}Step 2: Generating X.509 certificate...${NC}"
echo -e "${YELLOW}Please provide certificate details (or press Enter for defaults):${NC}"

openssl req -new -x509 \
  -key "$CERT_DIR/private_key.pem" \
  -out "$CERT_DIR/certificate.pem" \
  -days 730 \
  -subj "/C=US/ST=California/L=San Francisco/O=Your Company/OU=IT/CN=NetSuite Integration"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Certificate generated successfully${NC}"
else
  echo -e "${RED}✗ Failed to generate certificate${NC}"
  exit 1
fi

# Step 3: Display certificate details
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Certificate Generation Complete!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Show certificate info
echo -e "${YELLOW}Certificate Information:${NC}"
openssl x509 -in "$CERT_DIR/certificate.pem" -noout -subject -dates

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}📋 NEXT STEPS - NetSuite Configuration${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

echo "1. Upload Certificate to NetSuite:"
echo "   a. Login to NetSuite"
echo "   b. Go to: Setup > Company > OAuth 2.0 Client Credentials (M2M) Setup"
echo "   c. Click 'New' under Certificates"
echo "   d. Upload file: $CERT_DIR/certificate.pem"
echo "   e. Save and note the Certificate ID (you'll need this)"
echo ""

echo "2. Create Integration Record:"
echo "   a. Go to: Setup > Integration > Manage Integrations"
echo "   b. Click 'New'"
echo "   c. Name: 'Demo Dashboard OAuth M2M'"
echo "   d. Check: 'Token-Based Authentication' (OAuth 2.0)"
echo "   e. Check: 'OAuth 2.0 Client Credentials (M2M)'"
echo "   f. Scopes: Select 'REST Web Services' and 'RESTlets'"
echo "   g. Certificate: Select the certificate you just uploaded"
echo "   h. Save and note the Client ID"
echo ""

echo "3. Configure Role Permissions:"
echo "   a. Go to: Setup > Users/Roles > Manage Roles"
echo "   b. Edit the role you'll use for integration"
echo "   c. Permissions tab > Setup subtab"
echo "   d. Add: 'Log in using OAuth 2.0 Access Tokens' (Full access)"
echo "   e. Add: 'REST Web Services' (Full access)"
echo "   f. Add: 'RESTlets' (Full access)"
echo "   g. Save"
echo ""

echo "4. Update Environment Variables:"
echo "   Copy these values to your .env file:"
echo ""
echo "   NETSUITE_ACCOUNT_ID=td3049589"
echo "   NETSUITE_CLIENT_ID=<from_integration_record>"
echo "   NETSUITE_CERT_ID=<from_certificate_upload>"
echo "   NETSUITE_PRIVATE_KEY=\"\$(cat $CERT_DIR/private_key.pem)\""
echo ""

echo -e "${RED}⚠️  SECURITY WARNING:${NC}"
echo "   - NEVER commit private_key.pem to Git"
echo "   - Store private key in .env (already in .gitignore)"
echo "   - For production, use secrets manager (AWS Secrets, Vercel Env Vars)"
echo "   - Rotate certificates before 2-year expiration"
echo ""

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Files Created:${NC}"
echo "   Private Key: $CERT_DIR/private_key.pem (KEEP SECRET)"
echo "   Certificate: $CERT_DIR/certificate.pem (upload to NetSuite)"
echo ""
echo -e "${GREEN}Ready to configure NetSuite! Follow the steps above.${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
