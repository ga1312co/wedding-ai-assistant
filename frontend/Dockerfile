# Build Stage
FROM node:20-alpine as build

WORKDIR /app

COPY package.json ./
COPY build.js ./
COPY index.html styles.css app.js ./
COPY assets ./assets
COPY public ./public

ARG VITE_BACKEND_URL
ENV VITE_BACKEND_URL=${VITE_BACKEND_URL}

RUN node build.js

# Serve Stage
FROM nginx:stable-alpine

# Copy the built frontend from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx configuration and use envsubst for dynamic variables
COPY nginx.conf /etc/nginx/templates/default.conf.template

EXPOSE 80

CMD ["/bin/sh", "-c", "envsubst '$$VITE_BACKEND_URL' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]