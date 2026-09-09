# Card Viewer Implementation Plan

## Goal

Rebuild the `cards-ai-trial` work as a sequence of small, independently reviewable pull requests. Each PR should be runnable, testable, and narrow enough for a reviewer to understand without needing to review the entire feature at once.

Keep the existing `cards-ai-trial` branch as a reference while rebuilding the feature. Do not delete it until all useful code and assets have been transferred.

## What the existing branch does

The current branch adds a full-screen 3D card viewer at `/home/cards`.

It includes:

- Three.js/WebGL card rendering.
- Custom GLSL holographic effects.
- Three display modes:
  - **Fan:** browse cards horizontally and select one to inspect.
  - **Stack:** swipe through a pile and flip the top card.
  - **Single:** inspect, flip, and navigate one card at a time.
- Pointer tilt, scrolling, dragging, swiping, clicking, and keyboard controls.
- A static card manifest at `public/cards/manifest.json`.
- Rarity-based shader selection.
- Texture caching and WebGL resource cleanup.
- Desktop and mobile-specific defaults.

The feature exists to provide a polished, interactive card-collection experience instead of displaying collectible cards as static images.

## Why we are rebuilding it incrementally

The current branch contains one large feature commit with approximately 5,900 added lines across 94 files. The application logic, animation systems, shaders, configuration, and binary assets are all mixed together.

That makes it difficult to review:

- The core rendering lifecycle is obscured by thousands of shader lines.
- Several interaction systems must be understood simultaneously.
- Binary assets cannot be meaningfully reviewed as code.
- A regression is difficult to isolate.
- It is hard to distinguish required infrastructure from optional visual polish.

The replacement should introduce one working capability at a time.

## Branching strategy

There is no need to rebase the existing feature branch if we are starting again.

Use this process:

1. Update local `main` from `origin/main`.
2. Create the first implementation branch directly from `main`.
3. Copy or rewrite only the code required for PR 1.
4. Open PR 1 against `main`.
5. Create the PR 2 branch from the PR 1 branch.
6. Open PR 2 against the PR 1 branch while PR 1 is under review.
7. Continue this pattern for later PRs.
8. After a lower PR merges, rebase the next branch onto the updated `main` and change its PR base to `main`.

Example branch stack:

```text
main
└── cards/01-single-viewer
    └── cards/02-manifest-navigation
        └── cards/03-fan-mode
            └── cards/04-stack-mode
                └── cards/05-holo-effects
                    └── cards/06-backend-integration
```

Do not merge the old `cards-ai-trial` commit into these branches. Treat it only as a source of reference code.

## Architecture to use

Avoid recreating the existing 832-line `CardScene.ts` as one monolithic controller. Separate shared scene responsibilities from mode-specific behavior.

Suggested structure:

```text
src/cards/
├── CardScene.ts                 # Renderer, camera, lifecycle and shared state
├── manifest.ts                  # Card data loading and validation
├── types.ts
├── input/
│   ├── PointerTilt.ts
│   └── SpringValue.ts
├── modes/
│   ├── SingleMode.ts
│   ├── FanMode.ts
│   └── StackMode.ts
├── three/
│   ├── buildCard.ts
│   ├── buildRoom.ts
│   ├── dims.ts
│   ├── textures.ts
│   └── Tween.ts
└── shaders/
    ├── index.ts
    ├── presets.ts
    ├── common/
    └── styles/
```

Each mode should own its layout, animation state, and mode-specific input behavior. `CardScene` should coordinate modes rather than contain all of their implementation.

All Three.js resources must have clear ownership. Geometry, materials, textures, event listeners, animation frames, resize observers, and the renderer must be disposed when no longer needed.

## PR 1 — Minimal single-card viewer

### Objective

Prove the basic Next.js and Three.js integration with one working card.

### Scope

- Add `three` and `@types/three`.
- Add only the shader-loading dependency/configuration needed by the selected implementation.
- Add `/home/cards`.
- Add a small client component that dynamically imports the Three.js scene with SSR disabled.
- Create a renderer, scene, camera, and one card mesh.
- Render one front image and one back image.
- Add resize handling.
- Add card flipping.
- Add basic pointer tilt.
- Add loading and error states.
- Dispose all resources on unmount.
- Include only one card and the minimum visual assets.

### Important implementation notes

- Keep the route page as a Server Component.
- Put `next/dynamic({ ssr: false })` inside a Client Component; current Next.js does not support `ssr: false` in a Server Component.
- Keep browser-dependent Three.js imports behind that client-only boundary.
- Cap renderer pixel ratio, for example at `2`, to avoid excessive GPU work on high-density screens.
- Do not add fan mode, stack mode, rarity mapping, or the full shader catalogue yet.

### Acceptance criteria

- `/home/cards` loads without server-rendering errors.
- One card appears and maintains the correct aspect ratio.
- Clicking or tapping the card flips it.
- Pointer movement tilts the card and it returns smoothly to rest.
- Resizing the viewport keeps the card visible and correctly proportioned.
- Navigating away stops the animation loop and removes listeners/resources.
- The page has a visible loading state and useful failure message.

### Verification

```bash
pnpm typecheck
pnpm lint
pnpm build
```

Also test manually in desktop Chrome and one mobile browser.

## PR 2 — Manifest and single-card navigation

### Objective

Move from one hard-coded card to a small data-driven card collection while keeping the UI in single-card mode.

### Scope

- Define `CardManifestEntry` and related card types.
- Add manifest loading and runtime validation.
- Resolve relative asset paths consistently.
- Add a small set of test cards.
- Add previous/next navigation.
- Add wheel, horizontal swipe, and left/right keyboard controls.
- Display the focused card name.
- Add a texture cache with explicit acquire/release behavior.
- Handle empty manifests, malformed entries, and image-load failures.

### Data contract

At minimum, each card should support:

```ts
interface CardManifestEntry {
  id: string;
  name: string;
  image: string;
  back?: string;
}
```

Rarity, masks, and shader styles should not be introduced until they are needed.

### Acceptance criteria

- Cards are loaded from data rather than imported individually in scene code.
- Invalid entries are rejected or skipped with a clear diagnostic.
- Users can navigate in both directions.
- Navigation wraps or stops consistently at collection boundaries; document which behavior is intended.
- Rapid navigation does not show stale textures or leak GPU resources.
- Loading an empty collection produces an intentional empty state.

### Tests

Add focused tests for:

- Manifest validation.
- Relative and absolute URL handling.
- Missing required fields.
- Empty manifests.
- Navigation index behavior.

## PR 3 — Fan mode

### Objective

Add desktop-oriented browsing without affecting single-card behavior.

### Scope

- Add `FanMode` and its layout calculations.
- Add fan intro and movement animations.
- Add horizontal dragging, wheel movement, and keyboard navigation.
- Add velocity decay and snapping.
- Add hover feedback.
- Add click-to-inspect and click-outside/Escape-to-return behavior.
- Load full-resolution textures only for cards near the visible fan window.
- Preserve the current card when switching between single and fan modes.

### Acceptance criteria

- The fan remains centred and usable at common desktop viewport sizes.
- Drag and wheel input feel consistent and cannot scroll permanently beyond the collection.
- Scrolling settles on a card.
- Selecting a card opens an inspect view.
- Escape and background click return to the fan.
- Off-screen card textures are released.
- Single mode continues to work unchanged.

### Review focus

Reviewers should focus on:

- Layout calculations.
- Animation state transitions.
- Texture-window boundaries.
- Race conditions when textures finish loading after a mode change.
- Input conflicts between dragging and clicking.

## PR 4 — Stack mode and responsive behavior

### Objective

Add the mobile-oriented stack experience and complete mode switching.

### Scope

- Add `StackMode` and its layout calculations.
- Animate the top card leaving and returning to the bottom.
- Reuse card objects where practical without displaying stale content.
- Add vertical swipe and wheel navigation.
- Allow the top card to flip.
- Add UI controls for fan, stack, and single modes.
- Default to stack on touch-focused mobile devices and fan on desktop.
- Keep the focused card consistent when switching modes.

### Acceptance criteria

- Vertical swipes reliably advance the stack.
- A swipe cannot start another transition while one is active.
- The top card can flip without accidentally triggering a swipe.
- Collections smaller than the normal stack size work correctly.
- A one-card collection works correctly.
- Mode changes during texture loading or animation do not create orphaned objects.
- The mode controls are keyboard accessible.

### Review focus

Reviewers should focus on:

- Gesture thresholds.
- Animation locking.
- Card recycling and texture reassignment.
- Mobile detection and responsive fallback behavior.
- State preservation between modes.

## PR 5 — Advanced holographic effects

### Objective

Add visual polish only after the viewer and interactions are stable.

### Scope

- Add shared GLSL chunks.
- Add shader compilation/include resolution.
- Add foil, glitter, noise, grain, and iridescence textures.
- Add shader presets.
- Add optional foil masks.
- Add rarity types and rarity-to-shader mappings.
- Add advanced shader styles in small, logical groups.
- Add rounded-corner clipping if the source art does not contain suitable alpha.

Suggested shader subgroups:

1. Regular and reverse holo.
2. Illustration and double rare.
3. Rainbow and ultra rare.
4. Special, shiny, tera, and master-ball effects.

If this PR becomes large, make each subgroup a separate PR.

### Determinism

During development, assign a shader explicitly in the manifest or derive it deterministically from the card ID and rarity. Avoid selecting a new random shader on every page load because it makes bugs and visual comparisons difficult to reproduce.

### Acceptance criteria

- Every shader compiles in development and production builds.
- Missing optional textures have safe fallbacks.
- Missing masks produce a documented default effect.
- Shader errors display a useful fallback instead of leaving a blank screen.
- Effects remain usable on representative desktop and mobile hardware.
- Visual output is deterministic for a given card.

### Attribution and licensing

Before merging:

- Record the original source of every adapted shader and texture.
- Confirm that its licence allows inclusion and modification.
- Preserve required notices.
- Explain meaningful modifications in a short source note.

## PR 6 — Product and backend integration

### Objective

Replace the static demonstration collection with the authenticated user's actual cards.

### Scope

- Integrate with the pack-opening and card-generation work already on `main`.
- Define a server-side card data shape for the viewer.
- Fetch only cards belonging to the authenticated user.
- Convert backend card data into the viewer's client-facing data contract.
- Add navigation to `/home/cards` from the appropriate home screen.
- Add product-level loading, empty, and error states.
- Decide how card images are delivered from R2 and whether URLs need signing.
- Decide whether rarity and shader style are stored or derived.

### Security requirements

- Do not trust a user ID supplied by the client.
- Resolve ownership from the authenticated session on the server.
- Do not expose private bucket credentials or internal storage details.
- Validate all URLs and card metadata before passing them to the viewer.
- Confirm that users cannot request another user's cards by changing route or request data.

### Acceptance criteria

- A signed-in user sees only their own cards.
- New cards appear after a successful pack opening.
- A user with no cards gets a useful empty state and next action.
- Backend failures do not crash the WebGL scene.
- Static demo data is removed or clearly isolated as development-only data.

## Asset strategy

The existing branch duplicates card artwork under both `pokecards/` and `public/cards/`. Do not carry both copies into the replacement implementation.

Recommended approach:

- Put runtime-served assets under `public/cards/` only if they are genuinely static application assets.
- Use R2 URLs for generated or user-owned card images.
- Keep conversion scripts in a clearly named tooling directory only if they are still used.
- Do not commit test images, masks, or intermediate conversion output without a clear purpose.
- Optimize image dimensions and compression before committing.
- Include only the assets required by each PR.

Binary assets should generally be reviewed separately from application logic. Include an asset inventory in PR descriptions with source, purpose, dimensions, and approximate file size.

## Error handling requirements

The final viewer should intentionally handle:

- WebGL unavailable or renderer creation failure.
- Manifest/data request failure.
- Empty collections.
- Invalid card entries.
- Front texture load failure.
- Back texture load failure.
- FX texture load failure.
- Shader compilation failure.
- Component unmount while asynchronous loading is in progress.
- Mode changes while card textures are loading.

A failed optional effect should fall back to a simpler card where possible. It should not leave the entire viewer blank.

## Performance requirements

Track performance from the first PR rather than treating it as final polish.

- Cap device pixel ratio.
- Avoid loading every full-resolution card at once.
- Cache shared textures.
- Dispose unused textures, materials, geometries, and renderers.
- Keep only one `requestAnimationFrame` loop active.
- Stop work when the component unmounts.
- Consider pausing or reducing rendering when the page is hidden.
- Test with a large collection, not only the 16 demo cards.
- Test on a mid-range mobile device.
- Measure initial JavaScript and asset payload after adding Three.js and shaders.

## Accessibility and UX requirements

WebGL content still needs an accessible surrounding interface.

- Mode controls must be real buttons with visible focus states.
- All actions must have keyboard equivalents.
- Instructions should change based on the current mode.
- Respect `prefers-reduced-motion` by reducing or disabling non-essential animation.
- Do not rely only on hover, colour, or visual effects to convey state.
- Provide readable card names outside the canvas.
- Ensure loading, empty, and error states are available to assistive technology.
- Provide an alternative card list or fallback if the WebGL experience is not usable.

## Testing plan

### Automated checks for every PR

```bash
pnpm typecheck
pnpm lint
pnpm build
```

Add unit tests for pure logic such as:

- Manifest validation.
- Index wrapping and clamping.
- Fan and stack layout calculations.
- Gesture threshold decisions.
- Rarity-to-shader mapping.
- Shader include resolution.

### Manual test matrix

At minimum, test:

- Desktop Chrome.
- Desktop Safari or Firefox.
- One iOS or Android browser.
- Mouse input.
- Touch input.
- Trackpad and wheel input.
- Keyboard-only input.
- One-card, small, and large collections.
- Slow network conditions.
- Failed image requests.
- Repeated route entry and exit.
- Rapid mode switching.
- High-DPI and narrow screens.
- Reduced-motion preference.

## Pull request expectations

Every PR should include:

- A short statement of what the PR adds.
- Explicit non-goals.
- A list of important design decisions.
- Screenshots or a short recording for visual changes.
- Exact manual test steps.
- Automated check results.
- Known limitations and follow-up work.
- Asset and third-party attribution when applicable.

Keep refactoring separate from new behavior where practical. If code from `cards-ai-trial` is copied, simplify it to the current PR's scope instead of copying all future functionality behind unused abstractions.

## Definition of done

The complete card viewer is done when:

- Users can access their own card collection from the application UI.
- Single, fan, and stack modes work on supported devices.
- Cards flip and holographic effects respond to movement.
- Loading, empty, error, and WebGL fallback states are intentional.
- All resources are cleaned up correctly.
- The experience performs acceptably on representative mobile hardware.
- Keyboard and reduced-motion behavior are supported.
- Shader and asset licensing is documented.
- Static prototype data and duplicate assets have been removed.
- Type checking, linting, tests, and the production build pass.
