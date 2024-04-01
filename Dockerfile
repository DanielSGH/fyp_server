FROM node:alpine

WORKDIR /usr/src/app

COPY ./package*.json ./
RUN npm install
COPY . .
EXPOSE 43808
CMD [ "npm", "run", "docker" ]