# Build Stage - Use Node 22 for Vite 7 compatibility
FROM node:22-alpine AS build
WORKDIR /app

# Copy dependency files
COPY package*.json ./

# 1. Force install dependencies
# 2. Specifically install the missing Rollup binary for Alpine Linux
RUN npm install --force && \
    npm install @rollup/rollup-linux-x64-musl --force

# Copy the rest of the code
COPY . .

# Run the build
RUN npm run build

# Production Stage - Serve with Nginx
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
