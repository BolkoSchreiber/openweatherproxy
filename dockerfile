FROM node:14-alpine
WORKDIR /src/app
COPY . .
RUN npm install
EXPOSE 3000
ENTRYPOINT [ "node", "index.js" ]