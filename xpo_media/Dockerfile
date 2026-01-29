# Build Stage
FROM node:22-alpine AS build
WORKDIR /app

# Set Node options to increase memory limit to 2GB (or 1.5GB)
ENV NODE_OPTIONS="--max-old-space-size=2048"

COPY package*.json ./
RUN npm install --force && \
    npm install @rollup/rollup-linux-x64-musl --force

COPY . .

# Run build with increased memory
RUN npm run build

# Production Stage
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
