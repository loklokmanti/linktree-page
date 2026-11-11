# Coffee bean interaction — revision 3

A local recreation study of the Oryzo footer by Lusion. Uses a continuous diagonal spiral stream, velocity-aligned rotations, neighbour separation, pointer momentum, a pointer-following point light,  depth-dependent lens blur. 1,024 beans on desktop; 576 on phones.

Run `python3 -m http.server 8765` in this directory, then open http://localhost:8765.

Move the pointer to sweep the light and disturb the stream. Beans carry that momentum downstream before returning to the path. Pause is keyboard accessible. Reduced-motion preference starts paused. The scene-only page has a collapsible tuning panel. Blur defaults off; controls tune focus, sharp depth range, strength, radius cap, edge protection, light, surface texture, motion, pointer forces, and bean size. Settings persist in localStorage. Press H or use Hide to hide the panel; the gear reopens it. Reset restores defaults.

## Integration

Import `createCoffeeBeans` from `beans.js` and **await** it with a sized container. It returns `togglePause()`, `scatter()`, `paused`, and `dispose()`. Keep `assets/` and `vendor/` beside the module. Decorative HTML above the scene should use pointer-events:none; buttons should use pointer-events:auto.

## Reference and attribution

The bean mesh and color/height textures in assets/ are downloaded from https://oryzo.ai/ by Lusion for this local reference study:
- https://oryzo.ai/models/COFFEE_BEAN.buf
- https://oryzo.ai/textures/coffeeBean/DIFF.webp
- https://oryzo.ai/textures/coffeeBean/HEIGHT.webp

These reference assets are not original Coffee Black Cat assets. The demo, decoder, CPU simulation, spatial hashing, and rendering integration are local implementation. Neighbour shadows and their occupancy-sampling pass have been removed. Framing is adapted to the demo. Three.js is MIT licensed; see vendor/LICENSE.

Highlight strength controls reflected shine independently of diffuse light (0 removes specular shine). Highlight sharpness controls highlight width: lower is softer/broader, higher is tighter. Default highlight strength is 0.45 versus the original 1.0.

## Site integration
Mounted behind the existing flavour track in #taste .taste-window by taste.js. No tuning panel. Blur off, highlight strength 0.35, no neighbour shadows. Lazy initialization and offscreen suspension. Wide stage uses adapted camera framing. Integration source and dist copies are synchronized.
