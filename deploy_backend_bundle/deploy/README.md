# Production Deployment

This directory contains the production Docker Compose setup for the backend, PostgreSQL, and Redis.

## Files

- `docker-compose.prod.yml`: production service orchestration
- `.env.example`: environment variable template

## Typical server-side steps

1. Copy the repository to the server.
2. Copy `.env.example` to `.env` and fill in real secrets.
3. Run `docker compose --env-file .env -f docker-compose.prod.yml up -d --build` in this directory.
4. Put Nginx in front of `127.0.0.1:8080` for HTTPS and domain access.