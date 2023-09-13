FROM node:20.5.0-alpine

WORKDIR /app

COPY ./package*.json ./
RUN npm ci
COPY ./ ./

CMD ["npm", "start"]
