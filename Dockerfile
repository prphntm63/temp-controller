# Use an official Node.js runtime as the base image
FROM node:16

# Set the working directory in the container
WORKDIR /usr/src

# Copy package.json and package-lock.json to the container
COPY . .

ENV npm_config_cache /home/node/app/.npm

# Install app dependencies
RUN npm install

# Install Python and required packages
RUN apt-get update
RUN apt-get install -y python3 python3-pip
RUN python3 -m pip config set global.break-system-packages true
RUN python3 -m pip install RPi.GPIO python-dotenv HX711

# Expose the port that your app will run on
EXPOSE 3000

# RUN chown -R 1000:1000 "/root/.npm"

# Define the command to start your application
CMD ["npm", "start"]