FROM node:20.5.0-alpine as build
WORKDIR /app
COPY ./package*.json ./
RUN npm ci
COPY ./ ./
RUN ./scripts/build.sh

FROM gcr.io/distroless/nodejs20-debian12
WORKDIR /app
COPY --from=build /app/dist/main.js ./main.js
CMD ["./main.js"]
