#!/bin/bash
# Exit on error
set -e

# Configuration
BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="backup_${TIMESTAMP}.sql"
GZ_FILENAME="${FILENAME}.gz"

echo "Starting database backup at $(date)"

# Ensure backup directory exists
mkdir -p "${BACKUP_DIR}"

# Run pg_dump
# Note: PGPASSWORD should be provided via environment variable
pg_dump -h db -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" > "${BACKUP_DIR}/${FILENAME}"

# Compress the backup
gzip "${BACKUP_DIR}/${FILENAME}"

echo "Backup completed successfully: ${BACKUP_DIR}/${GZ_FILENAME}"

# Optional: Cleanup backups older than 7 days
find "${BACKUP_DIR}" -type f -name "*.sql.gz" -mtime +7 -delete
echo "Old backups cleaned up."
