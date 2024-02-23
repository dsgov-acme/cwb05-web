FROM node:16-alpine as BUILDER

RUN apk add g++ make py3-pip
WORKDIR /builder
COPY . .
RUN yarn install --frozen-lockfile
