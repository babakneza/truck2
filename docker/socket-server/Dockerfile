FROM node:22-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY package.json package-lock.json ./

RUN npm install

COPY server/ ./server/

ENV NODE_ENV=production
ENV SOCKET_PORT=3001

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["npm", "run", "socket"]
