FROM node:22-alpine
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --production

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start backend with 200MB memory limit enforced by V8
CMD ["node", "--max-old-space-size=200", "src/app.js"]
