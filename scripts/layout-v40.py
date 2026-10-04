from pathlib import Path
root=Path(__file__).resolve().parent.parent
p=root/'src/pages/TelemetryRace.jsx';s=p.read_text(encoding='utf-8')
start=s.index('          <div className="upgrade-card ride-training-strip">')
end=s.index('          <RideRoadPreview',start)
strip=s[start:end]
bs=strip.index("            {practice === 'training' &&")
be=strip.index('            <progress',bs)
balance=strip[bs:be]
strip=strip[:bs]+strip[be:]
s=s[:start]+s[end:]
place=s.index('          <div className="upgrade-actions ride-steering">')
s=s[:place]+strip+s[place:]
s=s.replace('            balance={balance}\n', "            balance={balance}\n            sessionLabel={isPractice ? `${tr(isTrial ? 'Garage test track' : 'Riding training')} · ${Math.max(0,practiceDuration-rideSeconds)} s` : null}\n")
row='            {[["walk","🚶 Walk","blue"],["drive","D Drive","primary"],["sport","S Sport ⚡","red"]].map'
assert row in s
s=s.replace(row, "            {practice === 'training' ? <div className=\"training-balance-console\"><label>{tr('Balance')}<meter aria-label=\"Wheelie balance\" min=\"-1\" max=\"1\" low=\"-.65\" high=\".65\" optimum=\"0\" value={balance}/></label><div>{[[-1,'Body forward'],[1,'Body back']].map(([direction,label]) => <button key={direction} onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); balanceInput.current=direction; }} onPointerUp={() => { balanceInput.current=0; }} onPointerCancel={() => { balanceInput.current=0; }} onLostPointerCapture={() => { balanceInput.current=0; }}>{tr(label)}</button>)}</div></div> : [[\"walk\",\"🚶 Walk\",\"blue\"],[\"drive\",\"D Drive\",\"primary\"],[\"sport\",\"S Sport ⚡\",\"red\"]].map")
# Balance controls share the mode row in the fixed console.
s=s.replace('if (m === "walk") return 8;', 'if (m === "walk") return 8;\n    if (practice === \'training\') return Math.min(30, stats?.topSpeed || 30);')
p.write_text(s,encoding='utf-8')
p=root/'src/components/RideRoadPreview.jsx';s=p.read_text(encoding='utf-8').replace('  balance = 0,','  sessionLabel = null,\n  balance = 0,').replace("{vehicle?.name || 'E-RIDE'} · {mode.toUpperCase()} · {weather.icon} {weather.label}","{sessionLabel || `${vehicle?.name || 'E-RIDE'} · ${mode.toUpperCase()} · ${weather.icon} ${weather.label}`} ");p.write_text(s,encoding='utf-8')
with (root/'src/index.css').open('a',encoding='utf-8') as f:f.write('''
.part-comparison { position:fixed; z-index:80; left:max(12px,calc((100vw - 600px)/2)); right:max(12px,calc((100vw - 600px)/2)); bottom:max(12px,env(safe-area-inset-bottom)); max-height:70svh; overflow:auto; box-shadow:0 0 0 100vmax #020812b8; font-size:13px; }
.training-balance-console { width:100%; display:flex; gap:8px; align-items:center; }
.training-balance-console label { width:65px; flex-shrink:0; color:#93d8ff; font-size:10px; }
.training-balance-console meter { display:block; width:65px; height:8px; }
.training-balance-console > div { display:flex; gap:6px; flex:1; }
.training-balance-console button { border-radius:10px; background:#102e45; border:1px solid #287598; color:#bceaff; padding:4px 8px; min-height:35px; touch-action:none; font:600 11px system-ui; }
''')
print('Phone layout improved: comparison sheet, visible preview, thumb balance controls.')
