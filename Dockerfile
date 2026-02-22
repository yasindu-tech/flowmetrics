# Start with a lightweight Node.js image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of your app's code
COPY . .

# Expose the port your app runs on
EXPOSE 8080

# Command to run your app
CMD [ "npm", "start" ]
