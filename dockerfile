# Use a Debian base image
FROM node:16.20-bullseye

# Set the working directory
WORKDIR /app

COPY . /app
# Install dependencies using Yarn

RUN yarn install

# Build the Electron app
RUN yarn workspace nt-app electron:build

# ENV OUTPUT_DIR=/out
# Set the output directory

# Create the output directory
# RUN mkdir -p $OUTPUT_DIR

# Copy the builded files to the output directory
# RUN cp -R /app/nt-app/dist_electron/* $OUTPUT_DIR

# Output the build to the specified directory
CMD ["cp", "-R", "/app/nt-app/dist_electron/*", "/out"]
