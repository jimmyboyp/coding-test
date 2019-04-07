FROM node:10.15.3-alpine

WORKDIR /app

COPY package.json .
COPY yarn.lock .

RUN yarn install

COPY . .

EXPOSE 5000

CMD [ "yarn", "start" ]
