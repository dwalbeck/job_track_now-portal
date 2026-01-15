FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
#RUN npm ci --only=production
RUN npm install

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Create directory and copy built app
RUN mkdir -p /var/www/jobtracker/build
COPY --from=build /app/build /var/www/jobtracker/build

# Copy nginx configuration
COPY docker/nginx/portal.jobtracknow.com.conf /etc/nginx/conf.d/
COPY docker/nginx/portal.jobtracknow.com-ssl.conf /etc/nginx/conf.d/
COPY docker/ssl/* /etc/nginx/ssl/

# Expose ports
EXPOSE 3000
EXPOSE 443
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
