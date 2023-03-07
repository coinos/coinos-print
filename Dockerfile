FROM node:18

COPY . /app
WORKDIR /app

RUN npm i

CMD ["node", "index.js"]
