FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install --omit=dev && npx prisma generate

COPY collaboration-server ./collaboration-server
COPY src/lib ./src/lib

EXPOSE 1234

ENV NODE_ENV=production
ENV COLLAB_PORT=1234
ENV COLLAB_HOST=0.0.0.0

CMD ["node", "collaboration-server/server.js"]
