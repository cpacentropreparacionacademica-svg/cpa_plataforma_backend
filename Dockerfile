FROM node:22-alpine AS dependencies
WORKDIR /app
RUN corepack enable
COPY package.json yarn.lock .yarnrc.yml ./
RUN yarn install --immutable

FROM dependencies AS build
WORKDIR /app
COPY . .
RUN yarn build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000
RUN apk add --no-cache dumb-init postgresql-client \
    && corepack enable
COPY --from=build --chown=node:node /app/package.json /app/yarn.lock /app/.yarnrc.yml ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/docs ./docs
COPY --from=build --chown=node:node /app/scripts ./scripts
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health/live >/dev/null || exit 1
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
