from pathlib import Path
s=(Path(__file__).parent/'update-v41.py').read_text(encoding='utf-8')
exec(s.split("edit('src/lib/buildState.js'")[0]+"edit('src/components/VehicleRideArt.jsx'"+s.split("edit('src/components/VehicleRideArt.jsx'",1)[1])
