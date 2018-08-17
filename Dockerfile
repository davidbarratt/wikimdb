FROM node:10

WORKDIR /app

ENV NODE_ENV production

EXPOSE 80

COPY ./ /app

RUN npm install --unsafe-perm

CMD ["npm", "start"]
