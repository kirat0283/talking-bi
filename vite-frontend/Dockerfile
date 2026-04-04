FROM node:22

WORKDIR /app

COPY package*.json ./
RUN npm install

# copy env FIRST
COPY .env .env

# copy project
COPY . .

RUN npm run build

RUN npm install -g serve

CMD ["serve", "-s", "dist", "-l", "3000"]