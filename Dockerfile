# Stage 1: Build Stage
FROM node:14 AS build

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if available) to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Build the client and server
RUN npm run build:client && npm run build:server

# Stage 2: Production Stage
FROM node:14-alpine AS production

# Set the working directory inside the container
WORKDIR /app

# Copy only the necessary files from the build stage
COPY --from=build /app/package*.json ./
COPY --from=build /app/server ./server
COPY --from=build /app/client ./client
COPY --from=build /app/utils ./utils
COPY --from=build /app/node_modules ./node_modules

# Expose the port that the server will run on
EXPOSE 3000

# Set environment variables
ENV HOST=server

# Start the application
CMD ["npm", "start"]
