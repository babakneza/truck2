# Socket Server Docker Image

## GitHub Actions (Recommended)

The Docker image is automatically built and pushed to GitHub Container Registry (ghcr.io) on every push to `master/main` branch or when the socket server code changes.

### Pull Image

```bash
docker pull ghcr.io/babakneza/truck2/socket-server:latest
```

### Run Container

```bash
docker run -d \
  --name truck2-socket \
  -p 3001:3001 \
  -e SOCKET_PORT=3001 \
  -e DIRECTUS_URL=https://admin.itboy.ir \
  ghcr.io/babakneza/truck2/socket-server:latest
```

### Check Logs

```bash
docker logs truck2-socket
```

## Local Development

### Build Locally

```bash
docker build -t truck2-socket:latest ./server
```

### Run with Docker Compose

```bash
docker-compose -f docker-compose.socket.yml up -d
```

### Stop Container

```bash
docker-compose -f docker-compose.socket.yml down
```

## Environment Variables

- **SOCKET_PORT**: Port for socket server (default: 3001)
- **DIRECTUS_URL**: Directus API URL (default: https://admin.itboy.ir)
- **NODE_ENV**: Environment (development/production)

## Available Image Tags

- `latest` - Latest stable build from master branch
- `master-<sha>` - Specific commit hash
- `<branch-name>` - Branch-specific builds
- `v1.0.0` - Semantic version tags (when using git tags)

## Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: socket-server
spec:
  replicas: 2
  selector:
    matchLabels:
      app: socket-server
  template:
    metadata:
      labels:
        app: socket-server
    spec:
      containers:
      - name: socket-server
        image: ghcr.io/babakneza/truck2/socket-server:latest
        ports:
        - containerPort: 3001
        env:
        - name: SOCKET_PORT
          value: "3001"
        - name: DIRECTUS_URL
          value: "https://admin.itboy.ir"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: socket-server-service
spec:
  selector:
    app: socket-server
  type: LoadBalancer
  ports:
  - protocol: TCP
    port: 3001
    targetPort: 3001
```

## Deployment Status

Check workflow status: Go to GitHub Actions tab → "Build Socket Server Docker Image"

## Troubleshooting

**Image not found?**
- Wait 5-10 minutes for workflow to complete
- Check GitHub Actions tab for build status
- Verify you're authenticated: `docker login ghcr.io`

**Container won't start?**
- Check logs: `docker logs truck2-socket`
- Verify DIRECTUS_URL is accessible
- Ensure port 3001 is not in use

**CORS errors?**
- Update socket server code to allow your domain in CORS settings
- Rebuild image: workflow will auto-trigger on push
