# Frontend Dockerfile - React (Vite) + Nginx
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

ARG VITE_APP_VERSION=1.0.0
ARG VITE_RELEASE_ID=unknown
ENV VITE_APP_VERSION=$VITE_APP_VERSION
ENV VITE_RELEASE_ID=$VITE_RELEASE_ID

RUN npm run build

# Production
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
