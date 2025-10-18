# 🌐 Domain Setup Guide

Setup subdomain `api.zaldee.app` dengan Nginx reverse proxy dan SSL certificate.

---

## 📋 Prerequisites

- ✅ VPS sudah running dengan Docker
- ✅ Domain `zaldee.app` sudah terdaftar
- ✅ API backend sudah deploy di VPS (port 3002)

---

## 🎯 Step 1: DNS Configuration

### Option A: Cloudflare

1. Login ke Cloudflare Dashboard
2. Pilih domain `zaldee.app`
3. Go to: **DNS → Records**
4. Add A Record:
   ```
   Type: A
   Name: api
   IPv4 address: YOUR_VPS_IP
   Proxy status: DNS only (🔴 grey cloud)
   TTL: Auto
   ```
5. Click **Save**

### Option B: DNS Provider Lain

Tambahkan A record:
```
Hostname: api
Type: A
Value: YOUR_VPS_IP
TTL: 300 (or Auto)
```

### Verify DNS

Tunggu beberapa menit (propagation), lalu verify:

```bash
# Check DNS
nslookup api.zaldee.app

# Or
dig api.zaldee.app
```

Expected output:
```
api.zaldee.app.  300  IN  A  YOUR_VPS_IP
```

---

## 🎯 Step 2: Install Nginx & Setup SSL

### Method 1: Using Setup Script (Recommended)

1. **Copy script to VPS:**
   ```bash
   scp scripts/setup-nginx.sh root@YOUR_VPS_IP:/tmp/
   ```

2. **SSH to VPS:**
   ```bash
   ssh root@YOUR_VPS_IP
   ```

3. **Run setup script:**
   ```bash
   chmod +x /tmp/setup-nginx.sh
   /tmp/setup-nginx.sh
   ```

4. **Follow prompts:**
   - Enter domain: `api.zaldee.app`
   - Enter email: `your-email@example.com` (for Let's Encrypt)

5. **Done!** 🎉

### Method 2: Manual Setup

<details>
<summary>Click to expand manual setup instructions</summary>

#### 1. SSH to VPS
```bash
ssh root@YOUR_VPS_IP
```

#### 2. Install Nginx
```bash
sudo apt update
sudo apt install -y nginx
```

#### 3. Install Certbot (for SSL)
```bash
sudo apt install -y certbot python3-certbot-nginx
```

#### 4. Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/book-backend
```

Paste this configuration:
```nginx
server {
    listen 80;
    listen [::]:80;
    
    server_name api.zaldee.app;
    
    # Logging
    access_log /var/log/nginx/book-backend-access.log;
    error_log /var/log/nginx/book-backend-error.log;
    
    # Proxy to Docker container
    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        
        # Headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Cache
        proxy_cache_bypass $http_upgrade;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Client body size
    client_max_body_size 10M;
}
```

#### 5. Enable Site
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/book-backend /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

#### 6. Setup SSL Certificate
```bash
sudo certbot --nginx -d api.zaldee.app --non-interactive --agree-tos -m your-email@example.com --redirect
```

#### 7. Setup Auto-Renewal
```bash
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

</details>

---

## 🎯 Step 3: Update Application (Already Done)

✅ CORS configuration sudah diupdate untuk allow `https://api.zaldee.app`
✅ Swagger docs sudah include production server

Perubahan akan deploy otomatis saat push ke `main`.

---

## 🧪 Step 4: Testing

### Test Health Endpoint
```bash
curl https://api.zaldee.app/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-10-18T12:34:56.789Z"
}
```

### Test API Documentation
Open in browser:
```
https://api.zaldee.app/docs
```

### Test Authentication
```bash
curl -X POST https://api.zaldee.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer1@example.com",
    "password": "customer123"
  }'
```

---

## 🔧 Useful Commands

### Nginx Commands
```bash
# Check status
sudo systemctl status nginx

# Restart Nginx
sudo systemctl restart nginx

# Reload config (no downtime)
sudo systemctl reload nginx

# Test configuration
sudo nginx -t

# View error logs
sudo tail -f /var/log/nginx/book-backend-error.log

# View access logs
sudo tail -f /var/log/nginx/book-backend-access.log
```

### SSL Certificate Commands
```bash
# Test auto-renewal
sudo certbot renew --dry-run

# Manually renew
sudo certbot renew

# List certificates
sudo certbot certificates

# Check renewal timer
sudo systemctl status certbot.timer
```

### Docker Commands
```bash
# Check API container
cd /opt/book-backend
docker compose ps

# View API logs
docker compose logs -f api

# Restart API
docker compose restart
```

---

## 🔒 Security Checklist

After setup, verify security:

### SSL/TLS
- [ ] HTTPS working
- [ ] HTTP redirects to HTTPS
- [ ] Valid SSL certificate
- [ ] SSL auto-renewal enabled

### Headers
- [ ] Security headers present
- [ ] CORS configured correctly
- [ ] Rate limiting active

### Test SSL Rating
```bash
# Online SSL test
https://www.ssllabs.com/ssltest/analyze.html?d=api.zaldee.app
```

Expected: **A** or **A+** rating

---

## 🚦 Cloudflare Proxy (Optional)

After SSL is setup and working, you can enable Cloudflare proxy for additional security and CDN:

1. Go to Cloudflare Dashboard
2. DNS → Records
3. Click on `api` A record
4. Toggle Proxy status to **Proxied** (🟠 orange cloud)
5. Go to SSL/TLS settings
6. Set SSL/TLS encryption mode to **Full (strict)**

Benefits:
- ✅ DDoS protection
- ✅ CDN caching
- ✅ Additional firewall rules
- ✅ Analytics

---

## 📊 Production URLs

After setup complete:

| Service | URL |
|---------|-----|
| API Base | `https://api.zaldee.app` |
| Health Check | `https://api.zaldee.app/health` |
| API Docs | `https://api.zaldee.app/docs` |
| Auth Endpoints | `https://api.zaldee.app/auth/*` |
| Books | `https://api.zaldee.app/books` |
| Cart | `https://api.zaldee.app/cart` |
| Orders | `https://api.zaldee.app/orders` |
| Payments | `https://api.zaldee.app/payments` |
| Admin | `https://api.zaldee.app/admin/*` |

---

## 🐛 Troubleshooting

### Issue: DNS not resolving

**Solution:**
```bash
# Clear local DNS cache (macOS)
sudo dscacheutil -flushcache

# Check DNS propagation
https://dnschecker.org/#A/api.zaldee.app
```

### Issue: 502 Bad Gateway

**Causes:**
1. Docker container not running
2. Wrong port in Nginx config
3. Firewall blocking connection

**Solution:**
```bash
# Check container
docker compose ps
docker compose logs api

# Check port
sudo netstat -tlnp | grep 3002

# Test local connection
curl http://localhost:3002/health
```

### Issue: SSL certificate failed

**Causes:**
1. DNS not propagated yet
2. Port 80/443 blocked
3. Domain not pointing to VPS

**Solution:**
```bash
# Check DNS
nslookup api.zaldee.app

# Check ports
sudo netstat -tlnp | grep -E ':80|:443'

# Manual SSL setup
sudo certbot certonly --standalone -d api.zaldee.app
```

### Issue: CORS errors

**Solution:**
1. Check `allowedOrigins` in `src/app.ts`
2. Verify frontend URL matches exactly
3. Check Nginx headers configuration
4. Rebuild and redeploy

---

## ✅ Checklist

- [ ] DNS A record created
- [ ] DNS propagated (verify with `nslookup`)
- [ ] Nginx installed
- [ ] Nginx configuration created
- [ ] SSL certificate obtained
- [ ] SSL auto-renewal enabled
- [ ] HTTPS working
- [ ] API responding at `https://api.zaldee.app`
- [ ] Swagger docs accessible
- [ ] CORS allowing frontend domain
- [ ] (Optional) Cloudflare proxy enabled

---

## 🎉 Success!

Your API is now live at:
# 🌐 https://api.zaldee.app

Next steps:
1. Update frontend to use production API URL
2. Monitor logs and performance
3. Setup monitoring/alerting (optional)
4. Configure additional security (firewall, fail2ban)

