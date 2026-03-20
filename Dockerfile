# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /usr/src/app

# Copy package files
COPY package.json yarn.lock* ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy the rest of the code
COPY . .

# CRITICAL: Use 'yarn build' instead of any npx/npm command
RUN yarn build

# Stage 2: Production
FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /usr/src/app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]