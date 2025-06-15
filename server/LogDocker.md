# Logging System Documentation

## Important: Running Docker/ELK for Logging & Kibana

- **You must run Docker Compose (`docker-compose.elk.yml`) to start Elasticsearch and Kibana whenever you want to view or analyze logs in the Kibana dashboard.**
- This is required in all environments (local, staging, production) unless you have Elasticsearch and Kibana running elsewhere (e.g., managed cloud service).
- The backend and frontend apps do not need to run inside Docker, but they must be able to connect to the running Elasticsearch service (default: `localhost:9200`).
- If Docker/ELK is not running, logs will not be visible in Kibana, but file-based logs will still be written.

### Typical Workflow

- **For local development:**

  1. Start Docker Compose for ELK:  
     `docker compose -f docker-compose.elk.yml up -d`
  2. Run backend and frontend as usual.
  3. Access Kibana at [http://localhost:5601](http://localhost:5601) or via `/logs-dashboard`.

- **For production/staging:**
  - Ensure Elasticsearch and Kibana are running and accessible to your backend.
  - Update logger config if using remote/cloud ELK endpoints.

---

## Overview

This project uses a robust logging system for the backend (NestJS + TypeScript) that provides:

- **File-based logging** (with daily rotation)
- **Centralized log storage and analytics** via Elasticsearch and Kibana (ELK stack)
- **Visual, web-based dashboard** for log viewing and analytics, embeddable in the frontend
- **Structured, context-rich log entries** (e.g., user info, ride info, tags)
- **Filtering** to exclude NestJS internal/system logs from file and Elasticsearch logs

---

## How It Works

### 1. File Logging

- Uses [winston](https://github.com/winstonjs/winston), [nest-winston](https://github.com/gremo/nest-winston), and [winston-daily-rotate-file](https://github.com/winstonjs/winston-daily-rotate-file).
- Logs are written to daily-rotated files in the `/server/logs/` directory.
- Only custom application logs (with a `tag` property, e.g., `auth`, `ride`, `error`) are written to file.

### 2. Elasticsearch Logging

- Uses [winston-elasticsearch](https://github.com/vanthome/winston-elasticsearch) to ship logs to Elasticsearch.
- Logs are indexed for search, filtering, and analytics in Kibana.
- Only custom application logs (with a `tag` property) are sent to Elasticsearch.

### 3. Kibana Dashboard

- [Kibana](https://www.elastic.co/kibana/) provides a web UI for searching, filtering, and visualizing logs.
- The dashboard is accessible at [http://localhost:5601](http://localhost:5601) when Docker is running.
- The dashboard is also embedded in the frontend at `/logs-dashboard` via an iframe.

---

## Running the Logging Stack (ELK)

### 1. Start Elasticsearch and Kibana

From the `/server` directory, run:

```sh
docker compose -f docker-compose.elk.yml up -d
```

- This starts Elasticsearch (port 9200) and Kibana (port 5601) in the background.
- **You must have Docker installed and running.**
- You only need to run this command when you want to view logs in Kibana.

### 2. Stopping the Stack

```sh
docker compose -f docker-compose.elk.yml down
```

---

## Accessing the Log Dashboard

- **Directly:** Open [http://localhost:5601](http://localhost:5601) in your browser.
- **From the Frontend:** Go to `/logs-dashboard` in your app (embeds Kibana via iframe).

---

## Environment Variables & Configuration

- **Elasticsearch URL:** The backend logger is configured to send logs to `http://localhost:9200` by default. If you deploy elsewhere, update the Elasticsearch transport config in `logger.config.ts`.
- **Log file location:** `/server/logs/` (configurable in `logger.config.ts`).
- **Kibana URL:** [http://localhost:5601](http://localhost:5601)

---

## How to Use Logging in Code

- Use the injected logger in your controllers/services:

```ts
this.logger.log({
  level: 'info',
  message: 'User logged in',
  tag: 'auth',
  userId: user.id,
  email: user.email,
  // ...other context
});
```

- Only logs with a `tag` property are written to file and Elasticsearch.
- Add relevant context (user, ride, etc.) to log entries for better analytics.

---

## Embedding/Extending the Dashboard in the Frontend

- The frontend embeds Kibana at `/logs-dashboard` using an iframe.
- You can customize the Kibana dashboard (create visualizations, filters, etc.) and save them for team use.
- For advanced embedding, see [Kibana documentation](https://www.elastic.co/guide/en/kibana/current/dashboard.html#dashboard-share) for sharing dashboards.

---

## Troubleshooting

### Docker/Kibana/Elasticsearch Issues

- **Kibana UI errors (e.g., `TypeError: Cannot read properties of null`):**
  - Make sure Elasticsearch is running and healthy.
  - Check Docker logs: `docker compose -f docker-compose.elk.yml logs`.
  - Ensure your log entries have required fields (e.g., `@timestamp`, `message`, `tag`).
  - If Kibana can't find logs, create a data view in Kibana for the correct index pattern (e.g., `log-*`).
- **Port conflicts:** Make sure ports 9200 (Elasticsearch) and 5601 (Kibana) are free.
- **Performance:** For large log volumes, consider externalizing Elasticsearch/Kibana or using managed services.

### Log Not Appearing

- Ensure your log calls include a `tag` property.
- Check file permissions for `/server/logs/`.
- Check Elasticsearch/Kibana status in Docker.

---

## Advanced

- You can add more Winston transports (e.g., for cloud logging) in `logger.config.ts`.
- You can further filter or enrich logs by customizing the log format and filters.

---

## References

- [Winston](https://github.com/winstonjs/winston)
- [nest-winston](https://github.com/gremo/nest-winston)
- [winston-daily-rotate-file](https://github.com/winstonjs/winston-daily-rotate-file)
- [winston-elasticsearch](https://github.com/vanthome/winston-elasticsearch)
- [Kibana](https://www.elastic.co/kibana/)
- [Elasticsearch](https://www.elastic.co/elasticsearch/)

---

For further help, see the code in `server/src/logger.config.ts` and the Docker Compose file `server/docker-compose.elk.yml`.
