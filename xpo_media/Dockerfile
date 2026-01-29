# Build Stage - Use Node 22 for Vite 7 compatibility
FROM node:22-alpine AS build
WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Use --force to handle React 19 peer dependency conflicts
RUN npm install --force

# Copy the rest of the code and build
COPY . .
RUN npm run build

# Production Stage - Serve with Nginx
FROM nginx:stable-alpine
# Vite 7 builds into the 'dist' folder by default
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
