# Use the desired Node.js base image
FROM node:16.20-bullseye

# Set the working directory inside the container
WORKDIR /app

# Install the application dependencies
COPY package.json ./
RUN yarn install

# Copy the application code into the container
COPY . .

# Mount the current directory as a volume
VOLUME ["/app"]

# Build the Electron application
CMD yarn buildClient