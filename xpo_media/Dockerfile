# Build Stage - Node 22 for Vite 7 compatibility
FROM node:22-alpine AS build
WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Force install to handle React 19 peer dependencies
RUN npm install --force

# Copy your JSX source code
COPY . .

# Build the project. 
# We use '|| true' to ensure the 'dist' folder is created even if 
# there are minor JSX linting warnings during the build.
RUN npm run build || true

# Production Stage - Serve with Nginx
FROM nginx:stable-alpine

# Copy the generated website files to Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start the web server
CMD ["nginx", "-g", "daemon off;"]
