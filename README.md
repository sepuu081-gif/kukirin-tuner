# KuKirin Tuner

A game about tuning KuKirin, Xiaomi, Ninebot and other electric scooters, with riding, wheelie practice, a stunt park, career progression and simulated VESC settings. Includes English and Estonian language choices.

## Windows app

Download the **KuKirin-Tuner-Setup-*.exe** installer from [Releases](https://github.com/sepuu081-gif/kukirin-tuner/releases/latest) and open it. It installs for your Windows user and creates the game shortcut. No ZIP extraction is needed. Windows 64-bit is supported.

W = throttle, S = rear brake, Space = wheelie, Q/E = training balance, F11 = fullscreen, Alt+Left = back. Touch/mouse controls also remain available. Riding and bundled assets work offline; network multiplayer needs a connection. Desktop saves are separate from browser and Android saves.

Every release must increase package.json version. A push to main builds the EXE and publishes the installer and updater metadata together. The installed game checks GitHub automatically, downloads updates in the background and installs on a normal game close. Use Uuendused → Paigalda ja taaskäivita to apply a ready update immediately after your ride. Windows shutdown defers installation; saved data remains in the same AppData profile. Older ZIP versions need the installer once. See [build progress](https://github.com/sepuu081-gif/kukirin-tuner/actions/workflows/windows.yml).

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

The EXE installer, latest.yml updater feed and blockmap are generated in `desktop-release/setup`. The Electron shell loads packaged local files; it does not need the development server.

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
## v60 — public cloud leaderboard

The shared leaderboard is deployed at https://kukirin-leaderboard.sepuu081-kukirin.workers.dev. Cloudflare Workers serves the API and web leaderboard; D1 persists results. No player's PC has to stay on or host the server.

New installs connect automatically. Earlier localhost:8787 settings migrate once to the cloud server. Custom server addresses and an explicit Disconnect remain unchanged. Offline scores remain queued and retry when connected.
## v61 — model recordings and electric drive audio

41 distinct short riding recordings cover 48 vehicle entries, including shared donor recordings for wrapped and regulatory variants. The remaining 37 entries retain an explicit generic sample; they are not labelled as recorded models. Provenance is in public/assets/sounds/vehicles/SOURCES.txt and src/lib/vehicleAudioManifest.json. Automatic Silero speech screening rejected speech-heavy or silent clips; this is not a human listening or music-free guarantee.

Decoded samples have a blended loop seam, speed-dependent rate and load-dependent level. Motor upgrades affect the torque layer. Stationary vehicles are silent, gas/brake buttons no longer beep, and the petrol-like starting effect is removed. The same audio system is active in telemetry, city rides and AI/career/online drag races. Rapid restart and mute/unmute no longer kill the next ride’s audio.

Validation: 390px phone ride produced a non-silent output signal; every included recording decoded and started offline from local assets. Restart, mute/unmute, stationary silence and drag audio were checked in Chrome. Subjective audio fidelity has not been independently auditioned.

## Previous update: v72

Custom Parts now supports selecting and swapping individual battery cells, motor internals and controller packages, with removal/install animations, comparison, undo and persistent builds. Component ratings are virtual game models. See [workshop update](UPDATE-V72-CUSTOM-BUILDER.md). This update publishes a Windows build; no new Android APK has been built or included.


## Previous update: v73

Unique online rider names, private account recovery keys and a 20,000 W regular-account limit for custom motors. Zepu has a server-provisioned owner account. Existing garage and career saves remain; no APK was built. See UPDATE-V73-ACCOUNTS.md.


## Latest update: v74

One Windows installer EXE with background updates from GitHub. Existing accounts, garage and career saves use the same Windows profile. APK was not built. See desktop/release-notes.md.
