"""Conservative speech screening and steady mechanical-loop selection (not human audition)."""
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RESEARCH = ROOT / 'audio-research'
sys.path.insert(0, str(RESEARCH / 'python-tools'))
import numpy as np
import onnxruntime as ort

FFMPEG = 'C:/Users/sebas/Documents/ChatGPT/test/video-loop-tools/ffmpeg-9.0.2-essentials_build/bin/ffmpeg.exe'
opts = ort.SessionOptions()
opts.intra_op_num_threads = opts.inter_op_num_threads = 1
session = ort.InferenceSession(str(RESEARCH / 'silero_vad.onnx'), opts, providers=['CPUExecutionProvider'])
manifest_path = ROOT / 'src/lib/vehicleAudioManifest.json'
manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
files = {value['file'] for value in manifest.values()}
only = set(sys.argv[1:])
if only:
    files = {f for f in files if Path(f).stem in only}
results = {}
for filename in sorted(files):
    path = ROOT / 'public' / filename.lstrip('/')
    video_id = path.stem
    source = next((p for p in (RESEARCH / 'raw').glob(video_id + '.*') if p.suffix in ['.webm', '.m4a', '.mp4', '.opus']), path)
    decoded = subprocess.run([FFMPEG, '-v', 'error', '-i', str(source), '-t', '16', '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True, check=True)
    samples = np.frombuffer(decoded.stdout, dtype=np.float32)
    state = np.zeros((2, 1, 128), dtype=np.float32)
    context = np.zeros((1, 64), dtype=np.float32)
    probabilities = []
    for offset in range(0, len(samples) - 512, 512):
        chunk = samples[offset:offset+512].reshape(1, 512)
        x = np.concatenate([context, chunk], axis=1)
        out, state = session.run(None, {'input':x, 'state':state, 'sr':np.array(16000, dtype=np.int64)})
        probabilities.append(float(out[0, 0]))
        context = x[:, -64:]
    probabilities = np.array(probabilities)
    # Scan six-second windows; reject speech instead of looping someone talking.
    windows = []
    for start in np.arange(0, max(.1, len(samples)/16000 - 6), .5):
        probs = probabilities[int(start/.032):int((start+6)/.032)]
        audio = samples[int(start*16000):int((start+6)*16000)]
        rms = float(np.sqrt(np.mean(audio**2)))
        speech = float(np.mean(probs > .5))
        windows.append((speech, float(np.mean(probs)), start, rms))
    best = min(windows)
    speech, mean_prob, start, rms = best
    accepted = speech <= .015 and mean_prob < .1 and rms > .0005
    results[filename] = {'accepted':accepted, 'speechFrameFraction':speech,
        'meanSpeechProbability':mean_prob, 'loopStartWithinClip':float(start), 'rms':rms,
        'method':'Silero VAD; conservative automatic screening, not human listening'}
    if accepted:
        subprocess.run([FFMPEG, '-v', 'error', '-y', '-ss', str(start), '-i', str(source), '-t', '6', '-vn',
            '-af', 'highpass=f=90,lowpass=f=2400,loudnorm=I=-24:TP=-3:LRA=7',
            '-ac', '1', '-ar', '44100', '-codec:a', 'libmp3lame', '-b:a', '96k', str(path)], check=True)
    print(video_id, 'KEEP' if accepted else 'REJECT_SPEECH_OR_SILENCE', flush=True)

kept = {}
for vid, entry in manifest.items():
    result = results.get(entry['file'])
    if result is None:
        kept[vid] = entry
        continue
    if result['accepted']:
        previous_offset = entry.get('screening', {}).get('loopStartWithinClip', 0)
        entry['sourceStartSeconds'] = entry['sourceStartSeconds'] - previous_offset + result['loopStartWithinClip']
        entry['processing'] = '6-second mechanical loop; filtered, normalized, crossfaded during playback'
        entry['screening'] = result
        kept[vid] = entry
manifest_path.write_text(json.dumps(kept, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
(RESEARCH / 'audio-speech-screening.json').write_text(json.dumps(results, indent=2), encoding='utf-8')
# Only retain approved assets in the game package. Raw references remain outside it.
for filename, result in results.items():
    if not result['accepted']:
        (ROOT / 'public' / filename.lstrip('/')).unlink()
print('Final models:', len(kept), 'Recordings:', len({v['file'] for v in kept.values()}), flush=True)
