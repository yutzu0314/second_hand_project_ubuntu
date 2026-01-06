FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

# 把 backend 其他程式碼（models/routes/controllers 等）一起帶進去
COPY . .

EXPOSE 3000
CMD ["npm", "start"]
