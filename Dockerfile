# Use the official Node.js 20 image as the base
FROM node:20

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install dependencies in the container
RUN npm install

# Copy the entire project to the container, excluding node_modules
COPY . .

# Build the TypeScript code
RUN npm run compile

# Expose the port your app uses
EXPOSE 8250

# Start the application
CMD ["npm", "run", "start"]
