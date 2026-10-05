FROM node:24-alpine
WORKDIR /app
COPY package.json server.mjs protocol.mjs ./
ENV PORT=8787 DATA_DIR=/data
EXPOSE 8787
VOLUME ["/data"]
CMD ["node", "server.mjs"]
