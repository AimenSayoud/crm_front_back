FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files
COPY rec_front/package.json rec_front/package-lock.json ./

# Install dependencies
RUN npm ci

# Copy application code
COPY rec_front/ ./

# Build the application
RUN npm run build

# Stage 2: Run
FROM node:20-alpine AS runner

# Set working directory
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production

# Copy built assets from the build stage
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/package-lock.json ./package-lock.json

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]