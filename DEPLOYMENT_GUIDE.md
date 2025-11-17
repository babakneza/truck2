# Chat System Deployment Guide

## Overview

This guide covers building and deploying the Truck2 chat system using Docker. The system consists of three main services:
1. **Frontend** - React app served by Nginx
2. **Socket Server** - Real-time messaging via Socket.io
3. **Redis** - Message persistence and pub/sub

---

## Prerequisites

- Docker & Docker Compose installed
- Git repository cloned
- Environment variables configured
- SSL/TLS certificates (for production)

---

## Local Development Setup

### 1. Start Development Services

```bash
# Build Docker images
docker-compose build

# Start all services (Redis, Socket Server, Frontend)
docker-compose up -d

# View logs
docker-compose logs -f socket-server
docker-compose logs -f frontend
docker-compose logs -f redis
```

### 2. Access Services

- **Frontend**: http://localhost (Nginx)
- **Socket Server**: ws://localhost:3001
- **Redis CLI**: `docker-compose exec redis redis-cli`

### 3. Stop Services

```bash
docker-compose down
docker-compose down -v  # Also remove volumes
```

---

## Production Deployment

### 1. Build Images Locally

```bash
# Build all images
docker-compose build --no-cache

# Or build specific service
docker build -f docker/frontend/Dockerfile -t truck2-frontend:latest .
docker build -f docker/socket-server/Dockerfile -t truck2-socket-server:latest .
```

### 2. Push to Registry (Optional)

```bash
# Tag images
docker tag truck2-frontend:latest your-registry/truck2-frontend:latest
docker tag truck2-socket-server:latest your-registry/truck2-socket-server:latest

# Push to registry
docker push your-registry/truck2-frontend:latest
docker push your-registry/truck2-socket-server:latest
```

### 3. Deploy to VPS

```bash
# SSH into VPS
ssh root@your-vps-ip

# Clone repository
git clone https://github.com/your-repo/truck2.git
cd truck2

# Create .env files
cat > .env.production << EOF
NODE_ENV=production
DIRECTUS_URL=https://admin.itboy.ir
REDIS_URL=redis://redis:6379
JWT_SECRET=your-secure-secret-key-here
ALLOWED_ORIGINS=https://yourdomain.com
EOF

# Create docker-compose override for production
cat > docker-compose.override.yml << EOF
version: '3.9'
services:
  frontend:
    environment:
      - NGINX_HOST=yourdomain.com
      - NGINX_PORT=443
    ports:
      - "443:443"
  
  socket-server:
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=warn
      - JWT_SECRET=${JWT_SECRET}
EOF

# Build and start
docker-compose build
docker-compose up -d
```

### 4. SSL/TLS Setup with Let's Encrypt

```bash
# Install Certbot
apt-get update
apt-get install certbot python3-certbot-nginx

# Get certificate
certbot certonly --standalone -d yourdomain.com

# Update Nginx config to use SSL
# (Update docker/frontend/nginx.conf with SSL paths)

# Restart frontend
docker-compose restart frontend
```

---

## Configuration

### Environment Variables

#### Development (.env.development)
```env
VITE_API_URL=https://admin.itboy.ir/api
VITE_SOCKET_URL=http://localhost:3001
VITE_DEBUG_MODE=true
```

#### Production (docker-compose)
```env
NODE_ENV=production
DIRECTUS_URL=https://admin.itboy.ir
REDIS_URL=redis://redis:6379
LOG_LEVEL=info
JWT_SECRET=your-secret-key
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Socket Server Configuration

File: `docker/socket-server/.env.production`

```env
SOCKET_PORT=3001
DIRECTUS_URL=https://admin.itboy.ir
NODE_ENV=production
REDIS_URL=redis://redis:6379
LOG_LEVEL=info
JWT_SECRET=your-jwt-secret-key
ALLOWED_ORIGINS=https://yourdomain.com
```

---

## Health Checks

### Frontend Health
```bash
curl http://localhost/health
# Response: OK
```

### Socket Server Health
```bash
curl http://localhost:3001/health
# Response: {"status":"OK"}
```

### Redis Health
```bash
docker-compose exec redis redis-cli ping
# Response: PONG
```

---

## Monitoring & Logs

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f socket-server
docker-compose logs -f frontend
docker-compose logs -f redis

# Last 100 lines
docker-compose logs --tail=100 socket-server
```

### Monitor Resource Usage

```bash
# View container stats
docker stats

# Or specific container
docker stats truck2-socket-server
```

### Storage Information

```bash
# View volume usage
docker volume ls
docker volume inspect truck2_redis-data

# View image sizes
docker images | grep truck2
```

---

## Troubleshooting

### Socket Server Won't Start

```bash
# Check logs
docker-compose logs socket-server

# Common issues:
# 1. Port 3001 already in use
#    Solution: Change port mapping in docker-compose.yml

# 2. Redis connection error
#    Solution: Check Redis is running and healthy

# 3. JWT_SECRET not set
#    Solution: Set JWT_SECRET in environment
```

### Frontend Not Loading

```bash
# Check Nginx logs
docker-compose logs frontend

# Test Nginx config
docker-compose exec frontend nginx -t

# Rebuild and restart
docker-compose up -d --build frontend
```

### Redis Connection Issues

```bash
# Check Redis is running
docker-compose ps | grep redis

# Connect to Redis CLI
docker-compose exec redis redis-cli

# Common commands
redis-cli ping
redis-cli keys '*'
redis-cli flushdb  # Clear all data
```

### High Memory Usage

```bash
# Check container memory
docker stats truck2-redis

# Options:
# 1. Increase maxmemory in Redis config
# 2. Enable Redis eviction policy
# 3. Clear old messages from database
```

---

## Performance Tuning

### Redis Configuration

```bash
# Optimize Redis for high throughput
docker-compose exec redis redis-cli CONFIG SET maxmemory-policy allkeys-lru
docker-compose exec redis redis-cli CONFIG SET tcp-keepalive 60
```

### Nginx Performance

Edit `docker/frontend/nginx.conf`:
```nginx
worker_processes auto;
worker_connections 2000;

# Enable caching
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m;
proxy_cache api_cache;
proxy_cache_valid 200 1m;
```

### Socket.io Optimization

The Socket.io server in `docker/socket-server/server/server.js` already includes:
- Connection pooling
- Redis adapter for horizontal scaling
- Proper timeout settings
- Health check endpoints

---

## Backup & Recovery

### Backup Redis Data

```bash
# Create backup
docker-compose exec redis redis-cli BGSAVE

# Copy backup file
docker cp truck2-redis:/data/dump.rdb ./redis-backup.rdb
```

### Restore from Backup

```bash
# Copy backup to container
docker cp ./redis-backup.rdb truck2-redis:/data/dump.rdb

# Restart Redis
docker-compose restart redis
```

### Database Backup (Directus)

```bash
# Backup Directus database
# (Follow Directus documentation for your database)
```

---

## Scaling

### Horizontal Scaling

For multiple Socket.io instances behind a load balancer:

1. Ensure Redis is configured (already done)
2. Build multiple socket-server instances
3. Use load balancer (e.g., Nginx, HAProxy)

```bash
# Update docker-compose.yml for multiple instances
version: '3.9'
services:
  socket-server-1:
    # ... existing config ...
  socket-server-2:
    # ... duplicate with different name/port ...
```

### Vertical Scaling

Increase resource limits in `docker-compose.yml`:

```yaml
services:
  socket-server:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G
```

---

## Security Best Practices

### Secrets Management

```bash
# Use Docker secrets (Swarm) or environment files
# Never commit secrets to git

# Use .env files (add to .gitignore)
echo ".env.production" >> .gitignore

# Or use environment variables
export JWT_SECRET=$(openssl rand -base64 32)
```

### Network Security

```bash
# Use internal network for services
# Only expose frontend to internet
docker network create truck2-network --driver bridge
```

### Updates & Patches

```bash
# Keep base images updated
docker pull node:22-alpine
docker pull redis:7-alpine
docker pull nginx:alpine

# Rebuild images periodically
docker-compose build --no-cache --pull
```

---

## Maintenance

### Regular Tasks

```bash
# Daily: Check logs for errors
docker-compose logs --tail=100 | grep -i error

# Weekly: Monitor resource usage
docker stats

# Monthly: Update base images and rebuild
docker-compose build --no-cache --pull
docker-compose up -d
```

### Cleanup

```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove unused networks
docker network prune

# Full cleanup (caution!)
docker system prune -a
```

---

## Support & Resources

- **Socket.io Documentation**: https://socket.io/docs/
- **Docker Documentation**: https://docs.docker.com/
- **Nginx Documentation**: https://nginx.org/
- **Redis Documentation**: https://redis.io/documentation
- **Directus Documentation**: https://docs.directus.io/

---

## Deployment Checklist

- [ ] All environment variables configured
- [ ] SSL/TLS certificates ready
- [ ] Firewall rules configured
- [ ] Database backups enabled
- [ ] Logging configured
- [ ] Monitoring setup
- [ ] Health checks verified
- [ ] Load balancer configured (if needed)
- [ ] Documentation updated
- [ ] Team trained on deployment

---

**Last Updated**: November 15, 2025
