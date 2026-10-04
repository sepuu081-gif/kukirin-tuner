from pathlib import Path
s=(Path(__file__).parent/'fix-v40.py').read_text(encoding='utf-8')
exec(s.split("edit('src/pages/TelemetryRace.jsx'")[0]+"edit('src/pages/CityRide.jsx'"+s.split("edit('src/pages/CityRide.jsx'",1)[1])
