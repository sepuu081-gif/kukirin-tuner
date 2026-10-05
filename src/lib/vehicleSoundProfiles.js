import recordings from './vehicleAudioManifest.json';

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

// Unrecorded vehicles use an explicitly generic electric-scooter sample.
export function getVehicleSoundProfile(vehicle, stats = {}) {
  const spec = typeof vehicle === 'string' ? { id: vehicle } : vehicle || {};
  const id = spec.id || '';
  const motorcycle = ['MOTO', 'SURRON', 'STARK'].includes(spec.series) || /surron|stark|wish|^x1$/.test(id);
  const power = Math.max(100, stats.watts || spec.watts || 800);
  const stockPower = Math.max(100, spec.watts || power);
  const wheel = stats.tireSize || spec.tireSize || 10;
  const motors = stats.motorCount || spec.motorCount || 1;
  const recording = recordings[id];
  return {
    id, motorcycle, motors, wheel,
    pitch: clamp(10 / wheel, .55, 1.35),
    power: clamp(Math.sqrt(power / stockPower), .65, 1.65),
    topSpeed: Math.max(20, spec.topSpeed || 50),
    file: recording?.file || '/assets/sounds/electric-scooter-wheel.mp3',
    recorded: Boolean(recording),
    referenceModel: recording?.referenceModel || null,
    sourceUrl: recording?.sourceUrl || null,
    key: `${id}:${power}:${motors}:${wheel}`,
  };
}
