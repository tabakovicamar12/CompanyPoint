FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
COPY .env ./
COPY server.js ./
COPY src/ ./src/

RUN npm install --legacy-peer-deps

EXPOSE 3000

CMD ["npm", "start"]
