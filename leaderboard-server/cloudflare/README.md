# Public leaderboard on Cloudflare Workers + D1

The live game server is https://kukirin-leaderboard.sepuu081-kukirin.workers.dev. v60 connects automatically. The following steps are only for deploying your own separate server. A Cloudflare account must own the deployment. Workers and D1 have free plans with usage limits. This option preserves results in D1 when the Worker restarts; unlike a free Render web service's ephemeral filesystem, it does not keep SQLite in a temporary app directory.

Official instructions: https://developers.cloudflare.com/d1/get-started/

From this directory:

1. `npx wrangler login` — sign in with your own Cloudflare account. Do not send passwords or API secrets in chat.
2. `npx wrangler d1 create kukirin-scores`
3. Copy the returned database ID into `wrangler.jsonc`, replacing the existing `database_id` value with your own ID. This database ID is not a secret.
4. `npx wrangler d1 execute kukirin-scores --remote --file=schema.sql`
5. `npx wrangler deploy`

Wrangler prints your actual HTTPS `workers.dev` URL. Open it to view the server page and copy its address. In the game: **Leaderboard → Server address → Check & connect**. Share that same address with every player. The game saves it and uploads queued results after checking `/health`.

For a default server on new game installs, set `VITE_LEADERBOARD_URL` before building the app. The address is public. No database credentials belong in the game.

For a local Cloudflare-runtime check after configuring D1: `npx wrangler d1 execute kukirin-scores --local --file=schema.sql`, then `npx wrangler dev`.

This is a casual guest leaderboard. Nicknames are not authenticated identities and submitted game scores are not server-authoritative. The Worker includes request size/value validation and a per-isolate burst limit. For a busy public server, add Cloudflare's edge rate limiting and account-based game authentication. Deployment is not considered complete until the real public endpoint is tested from two players.

## Publisher app-ads.txt

The public `/app-ads.txt` route serves the user-supplied Start.io seller list from `appAds.mjs`, with matching source in `public/app-ads.txt`. It works without D1, supports GET/HEAD and preserves seller IDs. Register `https://kukirin-leaderboard.sepuu081-kukirin.workers.dev/app-ads.txt` in the Start.io portal. The Start.io publisher ID (194751889) differs from the native SDK App ID (209307351).
