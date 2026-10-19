FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm install --no-audit --no-fund --ignore-scripts
COPY index.html tsconfig.json vite.config.mjs ./
COPY src ./src
COPY server ./server
COPY tests ./tests
RUN npm run build

FROM node:22-alpine
ENV NODE_ENV=production HOST=0.0.0.0 PORT=5317
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY server ./server
RUN mkdir -p public/game public/mods && chown -R node:node /app
USER node
EXPOSE 5317
CMD ["node", "server/index.mjs"]
