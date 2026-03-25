# Step 1: Build
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install
COPY . .
RUN yarn build

# Step 2: Serve
FROM nginx:stable-alpine
# We use /app/build because that is where your Vite logs showed the files were
COPY --from=build /app/build /usr/share/nginx/html
# Overwrite the default Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]