# Builder
FROM node:10 as builder
WORKDIR /app
COPY ./ /app
RUN npm install --unsafe-perm --production

# Service
FROM nginx:1.13
COPY ./etc/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/html /usr/share/nginx/html
