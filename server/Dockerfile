FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

EXPOSE 3001

ENV SOCKET_PORT=3001
ENV DIRECTUS_URL=https://admin.itboy.ir

CMD ["node", "socket-server.js"]
