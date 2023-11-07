# Use an official Node.js runtime as the base image
FROM node:18

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy your project files to the container
COPY . .

# Install project dependencies using npm
RUN npm install

# Build your project (you may need to adjust this based on your project's build process)
RUN npm run build

# Specify the command to run your application (e.g., your server or app)
CMD [ "node", "index.js" ]

