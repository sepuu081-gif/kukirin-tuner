"""Collect public YouTube search references, never label them cleared audio assets."""
import concurrent.futures
import datetime
import html
import json
import re
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'audio-research'
OUT.mkdir(exist_ok=True)
source = (ROOT / 'src/lib/vehicleData.js').read_text(encoding='utf-8').split('export const FAILURE_CODES')[0]
vehicles = re.findall(r"id:\s*['\"]([^'\"]+)['\"],\s*name:\s*['\"]([^'\"]+)['\"]", source)

def text(value):
    return value.get('simpleText') or ''.join(r.get('text', '') for r in value.get('runs', []))

def walk(value):
    if isinstance(value, dict):
        if 'videoRenderer' in value:
            yield value['videoRenderer']
        for child in value.values():
            yield from walk(child)
    elif isinstance(value, list):
        for child in value:
            yield from walk(child)

def model_name(vid, name):
    # Regulatory and fictional wrapped variants share their physical donor.
    donors = {'sebius_g2_wrapped':'KuKirin G2', 'sebius_redbull_g2':'KuKirin G2',
              'sebius_g2pro_wrapped':'KuKirin G2 Pro', 'sebius_g3_wrapped':'KuKirin G3',
              'g2_vmp':'KuKirin G2', 'g2_dgt':'KuKirin G2',
              'g2_pro_vmp':'KuKirin G2 Pro VMP', 'g2_pro_abe':'KuKirin G2 Pro ABE'}
    if vid in donors:
        return donors[vid]
    name = re.sub(r'\s*\([^)]*\)', '', name)
    if not re.search(r'Kukirin|Xiaomi|Ninebot|Segway|Dualtron|Kaabo|Nami|Joyor|Rion|INMOTION|Sur-Ron|Stark', name, re.I):
        name = 'KuKirin ' + name
    return name

def matches_model(vid, model, title):
    strict = {
        'dt_city':r'\bDualtron\s+City\b',
        'rion_2':r'\bRion\s*2\b',
        'rion_re':r'\bRion\s*RE\s*(?:60)?\b',
        'kaabo_wkgtr':r'\bWolf\s*King\s*GTR\b',
        'nb_max_g30':r'\bG30\b',
        'dt_thunder':r'\bThunder\b(?!\s*(?:[23]|II|III)\b)',
    }
    if vid in strict:
        return bool(re.search(strict[vid], title, re.I))
    def compact(value):
        value = re.sub(r'electric|kickscooter|scooter|kugoo|kukirin|ninebot|segway|xiaomi|dualtron|kaabo|inmotion|sur-ron|surron|stark|nami|joyor|rion', '', value.lower())
        return re.sub(r'[^a-z0-9]', '', value)
    aliases = {'dt_city':['city2','city'], 'dt_victor_limited':['victorlimited','victorltd'],
        'dt_new_storm':['newstorm','storm2024','storm2025'], 'xm_ultra4':['4ultra'],
        'xm_4pro_600w':['4pro'], 'xm_s2_pro2':['pro2'], 'xm_s2_pro3':['pro3'],
        'xm_mi3':['mi3','3'], 'xm_3pro':['3pro'], 'surron_ultra_bee':['ultrabee'],
        'stark_varg_mx':['varg'], 'x1':['x1'], 'nb_zt3_pro':['zt3pro'],
        'joyor_s10sz':['s10sz','s10sz'], 'nami_burne_max':['burnemax'],
        'nami_burne2':['burne2max'], 'rion_2':['2'], 'dt_x_ltd':['xlimited','xltd']}
    cores = aliases.get(vid, [compact(model)])
    target = compact(title)
    brands = re.search(r'kukirin|kugoo|ninebot|segway|xiaomi|dualtron|kaabo|inmotion|sur.?ron|stark|nami|joyor|rion', title, re.I)
    return bool(brands and any(re.search(re.escape(core) + r'(?!pro|lite|max|master|ultra|[0-9])', target) for core in cores))

cache_file = OUT / 'youtube-sound-references.json'
cached = {r['vehicleId']: r for r in json.loads(cache_file.read_text(encoding='utf-8'))['vehicles']} if cache_file.exists() else {}

def fetch(item):
    vid, name = item
    model = model_name(vid, name)
    previous = cached.get(vid)
    if previous:
        previous['candidates'] = [c for c in previous['candidates'] if matches_model(vid, model, c['title'])]
        if previous['candidates']:
            previous['status'] = 'Title matches model; audio and reuse rights require review'
            return previous
    query = '"' + model + '" ride'
    url = 'https://www.youtube.com/results?' + urllib.parse.urlencode({'search_query': query})
    result = {'vehicleId':vid, 'name':name, 'query':query, 'searchUrl':url,
              'license':'Not verified for reuse', 'audioAuditioned':False, 'candidates':[]}
    try:
        request = urllib.request.Request(url, headers={'User-Agent':'Mozilla/5.0'})
        page = urllib.request.urlopen(request, timeout=25).read().decode()
        match = re.search(r'(?:var ytInitialData\s*=|window\["ytInitialData"\]\s*=)\s*', page)
        if not match:
            raise ValueError('YouTube search data absent')
        data, _ = json.JSONDecoder().raw_decode(page[match.end():])
        seen = set()
        for entry in walk(data):
            video_id = entry.get('videoId')
            if not video_id or video_id in seen:
                continue
            seen.add(video_id)
            if not matches_model(vid, model, text(entry.get('title',{}))):
                continue
            result['candidates'].append({'id':video_id,'url':'https://www.youtube.com/watch?v='+video_id,
                'title':text(entry.get('title',{})), 'channel':text(entry.get('ownerText',{})),
                'duration':text(entry.get('lengthText',{}))})
            if len(result['candidates']) == 5:
                break
        result['status'] = 'Title matches model; audio and reuse rights require review' if result['candidates'] else 'No matching model reference found'
    except Exception as error:
        result['status'] = str(error)
    return result

with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    results = list(pool.map(fetch, vehicles))
report = {'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),
          'note':'Search references only. No video audio has been imported or auditioned. Search ranking does not prove an exact model match.',
          'vehicles':results}
(OUT / 'youtube-sound-references.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
rows = []
for record in results:
    links = ''.join('<li><a target="_blank" rel="noopener" href="'+html.escape(v['url'])+'">'+html.escape(v['title'])+'</a><small> '+html.escape(v['channel'])+' · '+html.escape(v['duration'])+'</small></li>' for v in record['candidates'])
    status = 'Videoviited leitud; heli vajab kuulamist ja kasutusõiguse kontrolli.' if links else 'Selle mudeli sobivat videoviidet ei leidnud. Teise mudeli heli pole asenduseks märgitud.'
    rows.append('<section><h2>'+html.escape(record['name'])+'</h2><p>'+status+'</p><p><a href="'+html.escape(record['searchUrl'])+'">Ava mudeli YouTube’i otsing</a></p><ul>'+links+'</ul></section>')
page = '''<!doctype html><html lang="et"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>KuKirin Tuner – heliotsing</title><style>body{background:#081421;color:#e3edf9;font:16px system-ui;max-width:1000px;margin:24px auto;padding:0 16px}a{color:#61c5ff}section{border:1px solid #29425b;border-radius:14px;padding:16px;margin:16px 0}h2{margin:0}li{margin:14px 0}small{display:block;color:#9baec5}input{width:100%;box-sizing:border-box;padding:14px;background:#142639;color:white;border:1px solid #35536e;border-radius:10px}</style><h1>Tõukside päris heli: YouTube’i viited</h1><p>Otsing tehtud kõigile mängu mudelitele. Need on kandidaadid: heli puhtust, täpset mudelivastavust ja mängus kasutamise luba pole veel kinnitatud. Ühtegi neist helidest ei ole mängu lisatud. Sebiuse ja piiratud mudelite puhul otsitakse baasmudelit.</p><input id="filter" placeholder="Otsi mudelit…">''' + ''.join(rows) + '''<script>document.querySelector('#filter').addEventListener('input',e=>document.querySelectorAll('section').forEach(s=>s.hidden=!s.textContent.toLowerCase().includes(e.target.value.toLowerCase())))</script></html>'''
(OUT / 'youtube-sound-references.html').write_text(page, encoding='utf-8')
print(json.dumps({'models':len(results),'withCandidates':sum(bool(r['candidates']) for r in results),'errors':[(r['vehicleId'],r['status']) for r in results if not r['candidates']]}, ensure_ascii=False))
