# v73 — rider accounts and custom motor limits

- Regular accounts: maximum 20,000 W custom motor rating, including internal upgrades.
- Zepu owner account: higher custom power, including 50,000 W. The owner role is provisioned in the server database; entering the name or UNLOCKALL does not grant it.
- Names are registered centrally, normalized for whitespace, letter case and Unicode compatibility forms. A duplicate registration or rename is rejected.
- Account keys are private recovery credentials. Profile exposes the key only after explicitly selecting Show account key. Never publish a real key.
- Existing garage/career data is preserved. Legacy custom motors above the account limit are retained and their effective power capped. Factory vehicles and catalog parts retain their existing ratings.
- Returning registered players can play offline. Owner power above 20,000 W requires verification with the server after starting the game. Offline unregistered play cannot submit scores or reserve a name.
- Scores now require account authentication; the server derives the display name from the account. Older app versions must update to upload new scores. Existing leaderboard rows remain.
- This is a casual client simulation, not server-authoritative anti-cheat.

Validation: real SQLite handler tests for duplicate names/renames, reserved Zepu, spoofed score name/role, key authentication and power rejection; desktop and 390x844 touch browser tests for registration, internal-upgrade limits, owner 50kW save/reload, legacy power cap and retained local progress. Lint and web build passed. No physical Android device test or APK build.
