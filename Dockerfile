FROM node:20-bookworm AS build

ENV TZ=Europe/London

WORKDIR /app

# Copy only package files first for better caching
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

# Copy application files
COPY . .

# Ensure proper permissions for agent and instruction directories
RUN mkdir -p /app/agents && \
    mkdir -p /app/shared-instructions && \
    chmod -R 755 /app

EXPOSE 3000
ENV NODE_ENV=production

CMD ["npm", "start"]

