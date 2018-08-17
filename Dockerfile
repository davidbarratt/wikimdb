FROM node:10

WORKDIR /app

ENV NODE_ENV production

COPY ./ /app

RUN npm install --unsafe-perm --production

CMD ["npm", "start"]
