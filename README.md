# KuKirin Tuner

A game about tuning KuKirin, Xiaomi, Ninebot and other electric scooters, with riding, wheelie practice, a stunt park, career progression and simulated VESC settings. Includes English and Estonian language choices.

## Windows app

Download **KuKirin-Tuner-Windows.zip** from [Releases](https://github.com/sepuu081-gif/kukirin-tuner/releases/latest), extract the entire folder, and open **KuKirin Tuner.exe**. Keep the folder contents together. Windows 64-bit is supported.

W = throttle, S = rear brake, Space = wheelie, Q/E = training balance, F11 = fullscreen, Alt+Left = back. Touch/mouse controls also remain available. Riding and bundled assets work offline; network multiplayer needs a connection. Desktop saves are separate from browser and Android saves.

Every push to main builds the Windows app and publishes a download. See [build progress](https://github.com/sepuu081-gif/kukirin-tuner/actions/workflows/windows.yml).

## Run or build from source

Requires Node.js 24 and npm.

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. No Base44 account or environment file is required for this local game.

```sh
npm run lint
npm run build
npm run desktop:build
```

The Windows app is generated in `desktop-release/KuKirin Tuner-win32-x64`. The Electron shell loads packaged local files; it does not need the development server.

## Android

Requires JDK 21 and the Android SDK. Configure JAVA_HOME and ANDROID_HOME, then run:

```sh
npm run android:apk
```

The debug APK is generated at `android/app/build/outputs/apk/debug/app-debug.apk`.

## Assets and simulation

Asset credits are included beside the media in `public/assets`, including the video, workshop photo and sound credits. The stunt bar uses the supplied T2U photograph. Vehicle tuning, VESC detection and performance are game simulations, not a connection to a physical controller. Vehicle brands belong to their respective owners.

## v57

Full-body paint across riding modes, full-black preset, optional fender removal, live career/drag preview, Estonian police van photograph, first-launch rider name, and Uber Eats style in-game deliveries with a saved euro wallet. The private fender code is intentionally excluded from the displayed code list and UNLOCKALL.

The shared leaderboard client and SQLite server are included in `leaderboard-server`. No public server has been deployed yet. Configure a persistent HTTPS server URL on the leaderboard screen. Results queue offline and send when configured; no fake global scores are shown.

## v58

The ride camera follows your scooter while photo scenery and road texture move past at different speeds. Motion follows actual speed and pauses at a stop. Longer rides cycle through downtown, Tallinn suburbs and Ruhnu forest; City Ride scenery follows the district. All scenery assets are bundled for offline use; credits are in Settings and public/assets/scenery/CREDITS.txt.

Build Shop > Appearance > Rider now offers motocross, open-face and full-face helmets. Each vehicle saves its own helmet shape and colour, and the rider preview shows the helmet before riding.

The homepage has a labelled Leaderboard button. Shared leaderboards still require a hosted HTTPS leaderboard-server; no public server is configured by this update.
## v59

Leaderboard now has a visible server connection card: checks the API before saving, shows connection state and pending score count, remembers the address, and supports disconnecting. The server has its own web leaderboard with a copy-address button. Node/Docker hosting is retained; an optional Cloudflare Workers + D1 server and deployment guide are included. No public hosting account or default public server is configured yet.