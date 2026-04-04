FROM node:22

WORKDIR /app

COPY dist ./dist

RUN npm install -g serve

CMD ["serve", "-s", "dist", "-l", "3000"]