# syntax=docker/dockerfile:1

FROM node:24.21.0 AS builder
WORKDIR /workspace
COPY contracts ./contracts
COPY revision-service/package.json revision-service/package-lock.json ./revision-service/
WORKDIR /workspace/revision-service
RUN npm ci
WORKDIR /workspace
COPY revision-service ./revision-service
WORKDIR /workspace/revision-service
RUN npm run build
RUN npm prune --omit=dev

FROM node:24.21.0 AS runtime
ENV NODE_ENV=production
WORKDIR /workspace/revision-service
COPY --from=builder /workspace/contracts /workspace/contracts
COPY --from=builder /workspace/revision-service/dist ./dist
COPY --from=builder /workspace/revision-service/node_modules ./node_modules
COPY --from=builder /workspace/revision-service/package.json ./package.json
EXPOSE 3000
CMD ["node", "dist/main.js"]
