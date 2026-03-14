# syntax=docker/dockerfile:1
ARG NODE_VERSION=22.18.0
FROM node:${NODE_VERSION}-alpine AS base
WORKDIR /usr/src/app

################################################################################
FROM base AS deps
# Add build tools for SQLite native compilation (better-sqlite3 needs these)
RUN apk add --no-cache python3 make g++

RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

################################################################################
FROM deps AS build
# Re-install devDependencies for the build (TypeScript compiler)
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci

COPY . .
RUN npm run build

################################################################################
FROM base AS final
ENV NODE_ENV=production

# Create data directory and ensure 'node' user owns it for SQLite writes
RUN mkdir -p /usr/src/app/data && chown -R node:node /usr/src/app/data

USER node

COPY package.json .
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist

EXPOSE 3400

# Path inside the container for your SQLite file
ENV DATABASE_URL=/usr/src/app/data/db.sqlite

CMD ["npm", "start"]