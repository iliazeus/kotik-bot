FROM node:22-bookworm as build
WORKDIR /app
COPY ./package*.json ./
RUN npm ci
COPY ./ ./
RUN ./scripts/build.sh

FROM gcr.io/distroless/nodejs22-debian12
WORKDIR /app
COPY --from=build /app/dist/main.js ./main.js
CMD ["/app/main.js"]
