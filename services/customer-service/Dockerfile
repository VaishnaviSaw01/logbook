FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

# Run as a non-root user for defense in depth
USER node

EXPOSE 3002

CMD ["node", "server.js"]
