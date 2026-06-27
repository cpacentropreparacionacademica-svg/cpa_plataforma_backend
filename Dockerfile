FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN node ./node_modules/@nestjs/cli/bin/nest.js build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache bash postgresql-client
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/docs ./docs
COPY --from=build /app/scripts ./scripts
EXPOSE 3000
CMD ["node", "dist/main.js"]
