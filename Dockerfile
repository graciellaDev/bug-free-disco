FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY bug-free-disco/package.json bug-free-disco/package-lock.json* ./

# Copy extension-placeholder for file: dependency
COPY extension-placeholder /extension-placeholder

RUN npm ci || npm install

COPY bug-free-disco/ .

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
