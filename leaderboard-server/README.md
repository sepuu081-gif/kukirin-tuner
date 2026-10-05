# Shared leaderboard server

This is a real shared API backed by SQLite. It is not hosted yet. Run it on a persistent Node.js 24 server or Docker host with HTTPS. All players must use the same public URL, configured on the game's leaderboard page or with VITE_LEADERBOARD_URL at build time.

```sh
npm start
```

Default port: 8787. Set PORT and DATA_DIR if needed. Keep DATA_DIR on a persistent disk; back up scores.sqlite. Local game queues retry on the next connection. GET /scores?mode=drag|speed|delivery lists the best 50 records. POST /scores accepts a result; IDs prevent duplicate uploads. GET /health checks readiness.

Docker: build this directory, publish port 8787, mount a persistent volume at /data, and put HTTPS in front. Example: `docker build -t kukirin-leaderboard .` then `docker run -d -p 8787:8787 -v kukirin-scores:/data kukirin-leaderboard`.

The casual leaderboard stores only rider name, vehicle, result and timestamp. Names are not verified accounts; client scores can be modified. Basic size, value and request limits are present. It is not suitable for competitive prizes without server-authoritative races and authentication. No API secret is embedded in the game.

## Connection page and public hosting

The server now serves its own leaderboard and copy-address page at `/`. `/health` identifies the API as `kukirin-leaderboard`, version 1. The game checks this before storing a connection or uploading queued results.

For public hosting with a persistent database and a free-plan option, see [Cloudflare Workers + D1](cloudflare/README.md). Deployment still requires your Cloudflare account. Keep the Node/Docker version on a persistent disk; free Render web services do not preserve their local SQLite files across restarts.