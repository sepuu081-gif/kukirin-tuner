# v74 — Windows installer and automatic updates

Players download one KuKirin-Tuner-Setup-1.0.74.exe file. The per-user NSIS installer creates the game shortcuts. No ZIP/folder management is required.

The desktop application checks the public GitHub release feed after startup and every four hours. Available stable updates download in the background; ready updates install on a normal game exit. The Updates menu shows progress and allows a confirmed restart after finishing a ride. Automatic installation is disabled when Windows signals shutdown/logoff. Offline/network failures keep the game running. Downgrades and prereleases are disabled.

Account, garage, career and other browser storage retain the same kukirin://game origin and AppData/Roaming/KuKirin Tuner profile. AppId remains stable for future installer releases. Uninstall preserves app data. Old ZIP builds require this installer once before automatic updates are available.

The build generates the EXE, SHA512 updater manifest latest.yml and EXE blockmap. GitHub Actions uploads every file into a draft release before publishing, so the public feed never points to an incomplete upload. Increase package.json version for each new release. No APK was built.

Validation completed:
- Lint and web build.
- Updater state tests: single-flight checking, progress, deferred install, cancelled/confirmed restart, offline handling, no downgrade/prerelease, shutdown guard and development guard.
- Real NSIS installation into an isolated QA folder, real electron-updater download through a local test feed, actual normal-quit upgrade from 1.0.73 to 1.0.74 and relaunch of the upgraded executable. QA uses a separate installer identity/profile/cache; production data was not touched.
- Exact account, garage, career and REP storage equality after upgrade.
- Native game render screenshot and ready-update menu state.
- Installer size/SHA512 matched latest.yml; private Zepu account key was absent from packaged app resources.

Runtime evidence: qa-v74/report.json and qa-v74/updated-app.png in the user's workspace. The full update test uses a local feed; the public GitHub feed is additionally checked after publication.
