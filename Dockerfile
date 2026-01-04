# Use Node.js LTS (Long Term Support)
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first for caching
COPY package*.json ./

# Install dependencies (including devDependencies for build)
RUN npm install

# Copy source code
COPY . .

# Build the React application
RUN npm run build

# Expose port (Render sets this env var automatically, but good for doc)
EXPOSE 3001

# Start the server
CMD ["node", "server/index.js"]
