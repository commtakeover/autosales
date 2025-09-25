#!/bin/bash

echo "🧹 Starting cleanup process..."

# Stop all containers
echo "🛑 Stopping all containers..."
docker-compose down

# Remove all containers
echo "🗑️  Removing all containers..."
docker rm -f $(docker ps -aq) 2>/dev/null || true

# Remove all volumes
echo "🗑️  Removing all volumes..."
docker volume rm $(docker volume ls -q) 2>/dev/null || true

# Remove the db_data directory
echo "🗑️  Removing db_data directory..."
rm -rf ./db_data

# Remove the wal directory
echo "🗑️  Removing wal directory..."
rm -rf ./wal

# Remove all images
echo "🗑️  Removing all images..."
docker rmi -f $(docker images -q) 2>/dev/null || true

# Remove any dangling volumes
echo "🗑️  Removing dangling volumes..."
docker volume prune -f

# Remove any dangling networks
echo "🗑️  Removing dangling networks..."
docker network prune -f

echo "✨ Cleanup completed! You can now start fresh with 'docker-compose up'" 