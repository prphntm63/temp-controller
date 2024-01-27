# Use an official Node.js runtime as the base image
FROM node:18

# Set the working directory in the container
WORKDIR /usr/src

# Copy package.json and package-lock.json to the container
COPY . .

# Install app dependencies
RUN npm install

# Expose the port that your app will run on
EXPOSE 3000

# Define the command to start your application
CMD ["npm", "start"]