FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --legacy-peer-deps

COPY . .

EXPOSE 5000

CMD ["node", "index.js"]
