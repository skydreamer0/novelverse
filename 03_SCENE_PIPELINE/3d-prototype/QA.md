# Chapter 1 Maintenance and Mothership Reveal QA

> Date: 2026-07-14
> Browser: Codex in-app Chromium
> Runtime: Vite development server at http://127.0.0.1:4173/

## Verification commands

Run from 03_SCENE_PIPELINE/3d-prototype/:

~~~powershell
npm test
npm run build
git diff --check
git status --short -- novel
~~~

Expected results:

- Every Node test passes.
- Vite creates the production bundle.
- The whitespace check prints no errors.
- The novel status command prints nothing.
- Vite may report the accepted Three.js single-chunk size warning described below.

## Deterministic QA scenes

Maintenance scenes:

- ?qa=maintenance-locate
- ?qa=maintenance-weld
- ?qa=maintenance-valve
- ?qa=maintenance-complete
- ?qa=maintenance-wrong-cable
- ?qa=maintenance-overheat
- ?qa=maintenance-assisted

Exterior reveal scenes:

- ?qa=reveal-sealed
- ?qa=reveal-pressure
- ?qa=reveal-slit
- ?qa=reveal-hull
- ?qa=reveal-d9
- ?qa=reveal-fracture
- Add &quality=low to force the low-quality exterior.

The presets advance through normal chapter actions and the real reveal timeline. They do not add reader-facing story events.

## Browser evidence

### Start and controls

- The 1280×720 start screen renders without overflow.
- The start control is a semantic button; Tab is no longer intercepted before gameplay or while an interactive control owns focus.
- Pointer Lock activation succeeds in the in-app browser. The guarded rejection path and drag-look fallback remain present.
- High-contrast, reduced-motion, and mute controls toggle their pressed state.
- Reduced motion updates the live fracture shader speed and flash contrast, not only CSS transitions.

### Maintenance loop

- A deterministic ideal run completes in 180–300 seconds; exploration and recoverable mistakes extend it within the intended three-to-five-minute band.
- Locate, sustained weld, braced valve, and complete states render with distinct controls and instrument meters.
- maintenance-wrong-cable trips the breaker, preserves the locate phase, changes oxygen/load, and shows recovery guidance long enough to read.
- maintenance-overheat preserves the weld phase and exposes the same recoverable guidance.
- maintenance-assisted widens the safe window and displays the assistance message after repeated mistakes.
- maintenance-complete reaches the public-terminal objective through the normal challenge completion path.
- Mistakes lower oxygen and repair quality and raise prosthetic load without blocking completion.
- Near-to-far power lights, pressure fog, weld heat, valve angle, fan speed, and camera impulse react to challenge state.

### Chapter transitions

- The terminal scene displays resident D9-4417, debt 27 + 9, survival contribution 40, and deadline 72 hours.
- The black-market scene exposes pay, intelligence, and medicine choices and states that the mission remains mandatory.
- The ending scene remains reachable only after the fracture becomes traversable.

### Mothership exterior

- Sealed, pressure, slit, hull, D9, and fracture-active checkpoints were inspected independently.
- The airlock opens over time; pressure fog clears into a low-density vacuum instead of leaving interior fog over the exterior.
- Foreground crew and umbilicals, midground service train/pods/work lights, and far-hull armor/power band remain readable.
- The D9 power band appears on the underside of the hull and lights progressively.
- Stars become visible as vacuum mix increases, establishing open space around the service gantry.
- The fracture is a tall asymmetric wound: its opaque near-black core hides stars, two emissive edge layers sit at different depths, and sparse arc particles move around it.
- A forced low-quality fracture scene retains all three scale layers and the same wound bounds while reducing geometry and particles.

### Compact layout

A temporary same-origin iframe harness gave each scene a real 390×844 layout viewport:

| Scene | Client width | Scroll width | Result |
| --- | ---: | ---: | --- |
| Start | 390 | 390 | Pass |
| Maintenance weld | 390 | 390 | Pass |
| Black market | 390 | 390 | Pass |

The black-market choices stack vertically, the maintenance tool remains inside the viewport, and the start action stays visible. The temporary harness was removed after inspection.

### Console and shader

- Fresh default, maintenance, reveal, and forced-low app tabs report no application errors or shader warnings.
- WebGL compiles the fracture material in both high and low profiles.
- The in-app browser reports only Vite connection messages on clean app tabs.

## Accepted limitations

- Characters, carrier, service train, and hull machinery remain procedural Three.js proxies; authored GLB animation is outside this vertical slice.
- The fracture uses an SDF shader, layered depth, particles, and beam geometry but does not refract a captured scene-color buffer.
- Vite reports a production chunk a little above 500 kB before gzip because Three.js is bundled with the prototype. The build succeeds; code splitting is deferred until more scenes share runtime modules.
