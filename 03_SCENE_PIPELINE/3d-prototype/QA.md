# Chapter 1 Mothership Prologue QA

> Date: 2026-07-13  
> Browser: Codex in-app browser  
> Runtime: Vite development server at `http://127.0.0.1:4173/`

## Automated checks

- `npm test`: passes all state, interaction, director, reader-safe copy, quality, audio, QA preset, and world-manifest tests.
- `npm run build`: creates the production bundle successfully.
- Chapter order is enforced by `PrologueState`: maintenance, terminal, black market, deployment, exterior reveal, fracture entry.
- Retired fragment collection, pollution meter, red chasing enemies, and third-person runtime modules are absent.

## Browser flow checks

### Start and controls

- Start screen renders at the default desktop viewport without overflow.
- Clicking the start button enters the scene.
- Pointer Lock rejection is caught without console errors.
- Drag-look fallback activates automatically and keeps WASD movement available.
- A clean tab reports no browser console errors or warnings after fallback activation.

### Maintenance bay

- Curved hull ribs cross the corridor in the correct plane.
- The central aisle remains readable between life-support pipe banks.
- Grated floor, maintenance abyss, repair slot, status lights, and the first short-circuit target render.
- The wristband begins with oxygen and prosthetic load visible; debt fields remain locked.

### Public terminal

- The audit overlay displays resident `D9-4417` and exact chapter 1 values:
  - historical debt: twenty-seven points;
  - war surcharge: nine points;
  - minimum survival contribution: forty points;
  - deadline: seventy-two hours.
- The recovery-sequence threat renders as the primary red warning.
- Clicking the dismissal button closes the overlay and exposes the black-market objective.

### Black market

- All three benefits render: pay, intelligence, or medicine.
- At 390 x 844 the choices stack vertically with no horizontal overflow.
- Clicking intelligence closes the modal, accepts the mandatory mission, and advances to the deployment-belt objective.

### Deployment and exterior reveal

- The airlock opens only after mission acceptance.
- Exterior composition contains a grated platform, sparse stars, blue-white fracture, and nine large hull armor strips.
- Curved armor strips, longitudinal seams, reflected maintenance lights, trusses, and navigation lights make the mothership larger than the visible platform.
- The hull occupies the upper portion of the frame while space remains visible around its edges.

### Ending

- Fracture entry reaches the chapter-complete screen.
- Ending copy is chapter-safe and points only to chapter 2 by title.
- Restart control is visible and keyboard focusable.

## Responsive and accessibility checks

- Start screen at 390 x 844 has `scrollWidth === clientWidth`.
- Black-market overlay at 390 x 844 has `scrollWidth === clientWidth` and all three choices remain visible.
- High-contrast, reduced-motion, and mute controls are present.
- Interactive controls expose button roles and visible keyboard focus states.
- Temporary viewport override was reset after QA.

## Accepted limitations

- Geometry and characters remain procedural proxies; authored GLB character animation is outside this vertical slice.
- The fracture uses layered geometry and emissive animation rather than a ray-marched distortion shader.
- Vite reports the normal Three.js single-chunk size warning; runtime loading succeeds and the warning does not block the prototype.

