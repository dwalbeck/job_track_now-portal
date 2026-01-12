#!/bin/bash
set -e

# Build the React app
cd /var/www/jobtracker
npm run start

# Start nginx in foreground
exec nginx -g 'daemon off;'
