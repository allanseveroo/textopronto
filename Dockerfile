# 1. Base Image: Use a lightweight Node.js image
FROM node:18-alpine AS base

# 2. Set Working Directory
WORKDIR /app

# 3. Install Dependencies
# Copy package.json and lock file
COPY package*.json ./
# Install dependencies
RUN npm install

# 4. Copy Application Code
COPY . .

# 5. Build the Application
# Set NEXT_TELEMETRY_DISABLED to 1 to prevent Next.js from collecting telemetry data during the build
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV=production
RUN npm run build

# 6. Production Image: Create a smaller image for production
FROM node:18-alpine AS runner
WORKDIR /app

# Copy built app from the 'base' stage
COPY --from=base /app/.next ./.next
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/public ./public

# 7. Configure Environment
ENV NODE_ENV=production
# Next.js server runs on port 3000 by default. Expose it.
EXPOSE 3000
# The HOSTNAME environment variable is often used by hosting providers.
ENV HOSTNAME 0.0.0.0

# 8. Start Command
# The "start" script in package.json runs "next start"
CMD ["npm", "start"]
