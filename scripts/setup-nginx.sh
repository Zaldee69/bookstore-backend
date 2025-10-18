#!/bin/bash

# Book Backend - Nginx Setup Script
# Usage: Run this script on your VPS

set -e

echo "🚀 Setting up Nginx for Book Backend API"
echo "========================================"

# Variables
DOMAIN="api.zaldee.app"
API_PORT="3002"
EMAIL="your-email@example.com"  # Change this!

echo ""
read -p "Enter your domain (default: api.zaldee.app): " input_domain
DOMAIN="${input_domain:-$DOMAIN}"

echo ""
read -p "Enter your email for SSL certificate: " input_email
EMAIL="${input_email:-$EMAIL}"

echo ""
echo "Configuration:"
echo "  Domain: $DOMAIN"
echo "  API Port: $API_PORT"
echo "  Email: $EMAIL"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Install Nginx
echo ""
echo "📦 Installing Nginx..."
sudo apt update
sudo apt install -y nginx

# Install Certbot for SSL
echo ""
echo "📦 Installing Certbot..."
sudo apt install -y certbot python3-certbot-nginx

# Create Nginx config
echo ""
echo "⚙️  Creating Nginx configuration..."
sudo tee /etc/nginx/sites-available/book-backend << EOF
server {
    listen 80;
    listen [::]:80;
    
    server_name $DOMAIN;
    
    # Logging
    access_log /var/log/nginx/book-backend-access.log;
    error_log /var/log/nginx/book-backend-error.log;
    
    # Proxy to Docker container
    location / {
        proxy_pass http://localhost:$API_PORT;
        proxy_http_version 1.1;
        
        # Headers
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Cache
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Client body size
    client_max_body_size 10M;
}
EOF

# Enable site
echo ""
echo "✅ Enabling site..."
sudo ln -sf /etc/nginx/sites-available/book-backend /etc/nginx/sites-enabled/

# Remove default site if exists
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx config
echo ""
echo "🧪 Testing Nginx configuration..."
sudo nginx -t

# Restart Nginx
echo ""
echo "🔄 Restarting Nginx..."
sudo systemctl restart nginx
sudo systemctl enable nginx

# Setup SSL with Certbot
echo ""
echo "🔒 Setting up SSL certificate..."
sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m $EMAIL --redirect

# Setup auto-renewal
echo ""
echo "⏰ Setting up SSL auto-renewal..."
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Show status
echo ""
echo "✅ Setup complete!"
echo ""
echo "📊 Status:"
sudo systemctl status nginx --no-pager -l | head -n 10
echo ""
echo "🌐 Your API is now available at:"
echo "   https://$DOMAIN"
echo ""
echo "📝 Useful commands:"
echo "   sudo systemctl status nginx     # Check Nginx status"
echo "   sudo systemctl restart nginx    # Restart Nginx"
echo "   sudo nginx -t                   # Test config"
echo "   sudo certbot renew --dry-run    # Test SSL renewal"
echo "   sudo tail -f /var/log/nginx/book-backend-error.log  # View logs"
echo ""

