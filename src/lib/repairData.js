// Repair flow definitions — each part type has its own steps, tools, and scene
// No more "open deck cover to fix a tire" — repairs are part-specific

export const REPAIR_TOOLS = [
  { id: "wrench",     label: "Wrench",    icon: "wrench" },
  { id: "allen",      label: "Allen Key", icon: "allen" },
  { id: "pliers",     label: "Pliers",    icon: "pliers" },
  { id: "driver",     label: "Driver",    icon: "driver" },
  { id: "drill",      label: "Drill",     icon: "drill" },
  { id: "levers",     label: "Tire Levers",icon: "levers" },
  { id: "welder",     label: "Welder",    icon: "welder" },
  { id: "grinder",    label: "Grinder",   icon: "grinder" },
  { id: "brush",      label: "Wire Brush",icon: "brush" },
  { id: "hands",      label: "Hands",     icon: "hands" },
  { id: "paste",      label: "Paste",     icon: "paste" },
];

// Each step: { id, label, tool, target, count, hint }
// target = which interactive element(s) in the scene to click
// count = how many clicks needed
export const REPAIR_FLOWS = {
  // ── EXTERNAL: Wheel / Tire ─────────────────────────────────
  wheel: {
    label: "Wheel / Tire Change",
    scene: "wheel",
    color: "text-purple-400",
    cost: 30,
    steps: [
      { id: "jack",      label: "Jack up scooter",            tool: "hands",   target: "jack",   count: 1, hint: "Click the jack stand to lift the scooter" },
      { id: "axle",      label: "Remove axle nut",            tool: "wrench",  target: "axle",   count: 1, hint: "Use the wrench, click the axle nut" },
      { id: "pull",      label: "Pull wheel off",             tool: "hands",   target: "wheel",  count: 1, hint: "Click the wheel to slide it off the axle" },
      { id: "tire",      label: "Remove old tire",           tool: "levers",  target: "tire",   count: 3, hint: "Use tire levers, pry the tire off (3 prys)" },
      { id: "newtire",   label: "Install new tire",          tool: "levers",  target: "newtire",count: 3, hint: "Seat the new tire on the rim (3 pushes)" },
      { id: "mount",     label: "Mount wheel back",           tool: "hands",   target: "wheel",  count: 1, hint: "Click to slide the wheel onto the axle" },
      { id: "tighten",   label: "Tighten axle nut",           tool: "wrench",  target: "axle",   count: 1, hint: "Use the wrench, tighten the axle nut" },
      { id: "lower",     label: "Lower the jack",             tool: "hands",   target: "jack",   count: 1, hint: "Click the jack to lower the scooter" },
      { id: "test",      label: "Spin test",                 tool: "hands",   target: "test",   count: 1, hint: "Click to test the wheel spin" },
    ],
  },

  // ── EXTERNAL: Hub Motor ─────────────────────────────────────
  motor: {
    label: "Hub Motor Swap",
    scene: "hub",
    color: "text-primary",
    cost: 50,
    steps: [
      { id: "jack",      label: "Jack up scooter",            tool: "hands",   target: "jack",   count: 1, hint: "Click the jack stand to lift the scooter" },
      { id: "phase1",    label: "Disconnect phase cables",    tool: "pliers",  target: "cables", count: 3, hint: "Use pliers to disconnect 3 phase cables (click each)" },
      { id: "axle",      label: "Remove axle nut",            tool: "wrench",  target: "axle",   count: 1, hint: "Use the wrench, remove the axle nut" },
      { id: "pull",      label: "Pull hub motor off",         tool: "hands",   target: "hub",    count: 1, hint: "Click the hub motor to slide it off" },
      { id: "install",   label: "Install new hub motor",      tool: "hands",   target: "newhub", count: 1, hint: "Click to slide the new hub motor onto the axle" },
      { id: "reconnect", label: "Reconnect phase cables",    tool: "pliers",  target: "cables", count: 3, hint: "Reconnect the 3 phase cables (click each)" },
      { id: "tighten",   label: "Tighten axle nut",           tool: "wrench",  target: "axle",   count: 1, hint: "Use the wrench, tighten the axle nut" },
      { id: "lower",     label: "Lower the jack",             tool: "hands",   target: "jack",   count: 1, hint: "Click the jack to lower the scooter" },
      { id: "test",      label: "Motor test",                 tool: "hands",   target: "test",   count: 1, hint: "Click to test the motor" },
    ],
  },

  // ── EXTERNAL: Steering Damper ───────────────────────────────
  damper: {
    label: "Steering Damper Swap",
    scene: "stem",
    color: "text-yellow-400",
    cost: 40,
    steps: [
      { id: "bolt1",     label: "Loosen clamp bolts",         tool: "allen",   target: "bolts",  count: 2, hint: "Use the allen key to loosen 2 clamp bolts" },
      { id: "remove",    label: "Remove old damper",          tool: "hands",   target: "damper", count: 1, hint: "Click the damper to remove it" },
      { id: "install",   label: "Install new damper",         tool: "hands",   target: "newdamper",count:1, hint: "Click to place the new damper" },
      { id: "tighten",   label: "Tighten clamp bolts",       tool: "allen",   target: "bolts",  count: 2, hint: "Use the allen key to tighten 2 clamp bolts" },
      { id: "test",      label: "Steering test",              tool: "hands",   target: "test",   count: 1, hint: "Click to test the steering" },
    ],
  },

  // ── WELD: Chassis / Frame ───────────────────────────────────
  chassis: {
    label: "Frame Weld Repair",
    scene: "frame",
    color: "text-orange-400",
    cost: 60,
    steps: [
      { id: "clean",     label: "Clean the crack",            tool: "brush",   target: "crack",  count: 1, hint: "Use the wire brush to clean the crack area" },
      { id: "tack",      label: "Tack weld (3 points)",       tool: "welder",  target: "tacks",  count: 3, hint: "Use the welder to place 3 tack welds" },
      { id: "weld",      label: "Full weld pass",             tool: "welder",  target: "weld",   count: 1, hint: "Run a full weld bead along the crack" },
      { id: "grind",     label: "Grind weld smooth",          tool: "grinder", target: "grind",  count: 1, hint: "Use the grinder to smooth the weld" },
      { id: "test",      label: "Stress test",                tool: "hands",   target: "test",   count: 1, hint: "Click to test the frame integrity" },
    ],
  },

  // ── INTERNAL: VESC Controller ───────────────────────────────
  controller: {
    label: "VESC Controller Swap",
    scene: "deck",
    color: "text-accent",
    cost: 80,
    steps: [
      { id: "screws",    label: "Remove deck screws",         tool: "drill",   target: "screws", count: 6, hint: "Use the drill to remove 6 deck screws" },
      { id: "panel",     label: "Lift deck panel",            tool: "hands",   target: "panel",  count: 1, hint: "Click to lift the deck panel off" },
      { id: "cables",    label: "Disconnect VESC cables",    tool: "pliers",  target: "cables", count: 3, hint: "Use pliers to disconnect 3 cables (Phase, Hall, Temp)" },
      { id: "vscrews",   label: "Unscrew VESC mount",        tool: "driver",  target: "vscrews",count: 4, hint: "Use the driver to remove 4 VESC mounting screws" },
      { id: "remove",    label: "Remove VESC",               tool: "hands",   target: "vesc",   count: 1, hint: "Click to remove the blown VESC" },
      { id: "install",   label: "Install new VESC",          tool: "hands",   target: "newvesc",count: 1, hint: "Click to place the new VESC" },
      { id: "paste",     label: "Apply thermal paste",       tool: "paste",   target: "paste",  count: 1, hint: "Apply thermal paste to the VESC" },
      { id: "vscrew2",   label: "Screw in VESC",             tool: "driver",  target: "vscrews",count: 4, hint: "Use the driver to install 4 mounting screws" },
      { id: "reconnect", label: "Reconnect cables",          tool: "pliers",  target: "cables", count: 3, hint: "Reconnect the 3 cables (Phase, Hall, Temp)" },
      { id: "panel2",    label: "Close deck panel",           tool: "hands",   target: "panel",  count: 1, hint: "Click to place the deck panel back" },
      { id: "screws2",   label: "Screw deck shut",            tool: "drill",   target: "screws", count: 6, hint: "Use the drill to install 6 deck screws" },
      { id: "test",      label: "Power on test",              tool: "hands",   target: "test",   count: 1, hint: "Click to power on and test" },
    ],
  },

  // ── INTERNAL: Battery Pack ──────────────────────────────────
  battery: {
    label: "Battery Pack Swap",
    scene: "deck",
    color: "text-green-400",
    cost: 100,
    steps: [
      { id: "screws",    label: "Remove deck screws",         tool: "drill",   target: "screws", count: 6, hint: "Use the drill to remove 6 deck screws" },
      { id: "panel",     label: "Lift deck panel",            tool: "hands",   target: "panel",  count: 1, hint: "Click to lift the deck panel off" },
      { id: "bms",       label: "Disconnect BMS connector",  tool: "pliers",  target: "bms",    count: 1, hint: "Use pliers to disconnect the BMS lead" },
      { id: "bscrews",   label: "Unscrew battery pack",       tool: "driver",  target: "bscrews",count: 2, hint: "Use the driver to remove 2 pack screws" },
      { id: "remove",    label: "Remove battery pack",        tool: "hands",   target: "battery",count: 1, hint: "Click to remove the old battery pack" },
      { id: "install",   label: "Install new battery pack",   tool: "hands",   target: "newbatt",count: 1, hint: "Click to place the new battery pack" },
      { id: "bscrew2",   label: "Screw in battery pack",     tool: "driver",  target: "bscrews",count: 2, hint: "Use the driver to install 2 pack screws" },
      { id: "reconnect", label: "Reconnect BMS",             tool: "pliers",  target: "bms",    count: 1, hint: "Reconnect the BMS lead" },
      { id: "panel2",    label: "Close deck panel",           tool: "hands",   target: "panel",  count: 1, hint: "Click to place the deck panel back" },
      { id: "screws2",   label: "Screw deck shut",            tool: "drill",   target: "screws", count: 6, hint: "Use the drill to install 6 deck screws" },
      { id: "test",      label: "Power on test",              tool: "hands",   target: "test",   count: 1, hint: "Click to power on and test" },
    ],
  },

  // ── INTERNAL: Electronics / Display ──────────────────────────
  electronics: {
    label: "Electronics Module Swap",
    scene: "deck",
    color: "text-cyan-400",
    cost: 35,
    steps: [
      { id: "screws",    label: "Remove deck screws",         tool: "drill",   target: "screws", count: 6, hint: "Use the drill to remove 6 deck screws" },
      { id: "panel",     label: "Lift deck panel",            tool: "hands",   target: "panel",  count: 1, hint: "Click to lift the deck panel off" },
      { id: "cables",    label: "Disconnect module cables",  tool: "pliers",  target: "cables", count: 2, hint: "Use pliers to disconnect 2 module cables" },
      { id: "escrews",   label: "Unscrew module",            tool: "driver",  target: "escrews",count: 2, hint: "Use the driver to remove 2 module screws" },
      { id: "remove",    label: "Remove module",             tool: "hands",   target: "module", count: 1, hint: "Click to remove the old module" },
      { id: "install",   label: "Install new module",        tool: "hands",   target: "newmod", count: 1, hint: "Click to place the new module" },
      { id: "escrew2",   label: "Screw in module",          tool: "driver",  target: "escrews",count: 2, hint: "Use the driver to install 2 module screws" },
      { id: "reconnect", label: "Reconnect cables",          tool: "pliers",  target: "cables", count: 2, hint: "Reconnect the 2 module cables" },
      { id: "panel2",    label: "Close deck panel",           tool: "hands",   target: "panel",  count: 1, hint: "Click to place the deck panel back" },
      { id: "screws2",   label: "Screw deck shut",            tool: "drill",   target: "screws", count: 6, hint: "Use the drill to install 6 deck screws" },
      { id: "test",      label: "Power on test",              tool: "hands",   target: "test",   count: 1, hint: "Click to power on and test" },
    ],
  },
};

export function getRepairFlow(partType) {
  return REPAIR_FLOWS[partType] || REPAIR_FLOWS.electronics;
}

export function getRepairCost(partType) {
  return REPAIR_FLOWS[partType]?.cost || 40;
}