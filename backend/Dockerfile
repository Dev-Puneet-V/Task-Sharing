# Use official Node.js image
FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm install --omit=dev

# Copy the rest of the application code
COPY . .

# Expose the port for both HTTP and WebSocket
EXPOSE 5000

# Run the backend
CMD ["npm", "start"]
