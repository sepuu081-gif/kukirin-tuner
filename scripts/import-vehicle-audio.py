"""Import short mechanical sound references. Preserve provenance, never invent licenses."""
import concurrent.futures
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RESEARCH = ROOT / 'audio-research'
RAW = RESEARCH / 'raw'
RAW.mkdir(exist_ok=True)
DEST = ROOT / 'public/assets/sounds/vehicles'
DEST.mkdir(exist_ok=True)
YTDLP = Path('C:/Users/sebas/Documents/ChatGPT/test/video-loop-tools/yt-dlp.exe')
FFMPEG = Path('C:/Users/sebas/Documents/ChatGPT/test/video-loop-tools/ffmpeg-9.0.2-essentials_build/bin/ffmpeg.exe')
plan = json.loads((RESEARCH / 'audio-import-plan.json').read_text(encoding='utf-8'))
references = json.loads((RESEARCH / 'youtube-sound-references.json').read_text(encoding='utf-8'))

def pick(vid, video_id):
    record = next(v for v in references['vehicles'] if v['vehicleId'] == vid)
    clip = next((c for c in record['candidates'] if c['id'] == video_id), None)
    if clip:
        plan[vid] = clip

pick('g2_2026', 'NuaZ1v54cho')
pick('g4', 'LgdyNOc4CQ4')
# Avoid introductory/promo clips and tutorials, rather than pretending they are motor recordings.
for vid in ['inmotion_rs', 'g4_max', 'g2_pro_vmp', 'xm_ultra4', 'xm_4ultra', 'joyor_t10', 'nb_f40']:
    plan.pop(vid, None)
for vid in ['sebius_g2_wrapped', 'sebius_redbull_g2', 'g2_vmp', 'g2_dgt']:
    plan[vid] = plan['g2_2026']

def run(args, timeout=180):
    return subprocess.run([str(a) for a in args], cwd=ROOT, stdout=subprocess.PIPE,
                          stderr=subprocess.PIPE, timeout=timeout)

def seconds(duration):
    parts = re.findall(r'\d+', duration)
    return sum(int(n) * 60 ** i for i, n in enumerate(reversed(parts)))

def convert(item):
    video_id, clip = item
    filename = video_id + '.mp3'
    dest = DEST / filename
    start = min(150, max(20, int(seconds(clip['duration']) * .35)))
    if seconds(clip['duration']) < 40:
        start = max(1, int(seconds(clip['duration']) * .2))
    start = clip.get('startSeconds', start)
    source = None
    metadata = None
    try:
        if not dest.exists():
            result = run([YTDLP, '--js-runtimes', 'node', '--no-playlist', '--no-progress',
                '--quiet', '--force-overwrites', '-f', 'bestaudio', '--download-sections', f'*{start}-{start+16}',
                '--ffmpeg-location', FFMPEG.parent, '--write-info-json',
                '-o', RAW / (video_id + '.%(ext)s'), clip['url']])
            if result.returncode:
                return video_id, {'error':'YouTube audio retrieval failed'}
            metadata = json.loads((RAW / (video_id + '.info.json')).read_text(encoding='utf-8'))
            source = next(p for p in RAW.glob(video_id + '.*') if p.suffix in ['.webm', '.m4a', '.mp4', '.opus'])
            result = run([FFMPEG, '-v', 'error', '-y', '-i', source, '-vn', '-t', '12',
                '-af', 'highpass=f=90,lowpass=f=2400,loudnorm=I=-24:TP=-3:LRA=7',
                '-ac', '1', '-ar', '44100', '-codec:a', 'libmp3lame', '-b:a', '96k', dest])
            if result.returncode:
                return video_id, {'error':'Audio encoding failed'}
        meta_path = RAW / (video_id + '.info.json')
        if meta_path.exists():
            metadata = json.loads(meta_path.read_text(encoding='utf-8'))
        probe = run([FFMPEG, '-v', 'error', '-i', dest, '-f', 'null', '-'])
        if probe.returncode or dest.stat().st_size < 5000:
            dest.unlink(missing_ok=True)
            return video_id, {'error':'Audio decode check failed'}
        return video_id, {'file':'/assets/sounds/vehicles/'+filename,
            'sourceUrl':clip['url'], 'title':clip['title'],
            'creator':(metadata or {}).get('uploader') or clip['channel'],
            'license':(metadata or {}).get('license') or 'Not declared by source',
            'sourceStartSeconds':start, 'processing':'12-second mono mechanical loop; filtered and normalized',
            'auditioned':False}
    except Exception as error:
        return video_id, {'error':type(error).__name__}

unique = {c['id']:c for c in plan.values()}
only = set(sys.argv[1:])
if only:
    extra = RESEARCH / 'audio-extra-plan.json'
    if extra.exists():
        plan.update(json.loads(extra.read_text(encoding='utf-8')))
    plan = {vid:clip for vid,clip in plan.items() if vid in only}
    unique = {c['id']:c for c in plan.values()}
outputs = {}
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
    for video_id, result in pool.map(convert, unique.items()):
        outputs[video_id] = result
        print(video_id, 'OK' if 'file' in result else result['error'], flush=True)

manifest_path = ROOT / 'src/lib/vehicleAudioManifest.json'
manifest = json.loads(manifest_path.read_text(encoding='utf-8')) if only else {}
for vid, clip in plan.items():
    result = outputs[clip['id']]
    if 'file' in result:
        manifest[vid] = {**result, 'referenceModel':vid}
donors = {'sebius_g2_wrapped':'g2_2026', 'sebius_redbull_g2':'g2_2026',
          'g2_vmp':'g2_2026', 'g2_dgt':'g2_2026', 'sebius_g2pro_wrapped':'g2_pro_2023',
          'sebius_g3_wrapped':'g3', 'g2_pro_2026':'g2_pro_2023'}
for vid, donor in donors.items():
    if vid in manifest:
        manifest[vid]['referenceModel'] = donor
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
(RESEARCH / 'audio-import-results.json').write_text(json.dumps(outputs, ensure_ascii=False, indent=2), encoding='utf-8')
print('Imported models:',len(manifest),'unique recordings:',len({v['file'] for v in manifest.values()}), flush=True)
