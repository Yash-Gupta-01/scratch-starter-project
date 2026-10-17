# Scratch Visual Coding Playground — Juspay ReactJS Challenge

A high-fidelity, web-based visual coding environment modeled after **MIT Scratch 3.0**, built with **React 17**, **Tailwind CSS**, and pure **Functional Programming (FP)** principles.

Developed for the **Juspay ReactJS Hiring Challenge**.

---

## 🚀 Live Demo & Deliverables

- **Live Deployed App:** *(Deploy via Vercel / Netlify — points to `public/` directory)*
- **GitHub Repository:** `https://github.com/your-username/scratch-starter-project`
- **Video Walkthrough (1–2 min):** Demonstrating block drag-and-drop, parameter editing, Cat & Horse sprites, concurrent Play execution, and the Hero Collision Swap.

---

## 📋 Features Implemented

### 1. Motion Category Blocks (4 Functionalities)
- **`Move [steps] steps`**: Moves the sprite forward along its current angle using trigonometric vector math ($\Delta x = \text{steps} \cdot \cos\theta, \Delta y = -\text{steps} \cdot \sin\theta$).
- **`Turn [degrees] degrees`**: Implemented with both **Turn Clockwise** (`↻`) and **Turn Counter-Clockwise** (`↺`) directional variants.
- **`Go to x: [x] y: [y]`**: Moves the sprite directly to absolute stage coordinates with boundary clamping.
- **`Repeat [count] times`**: Control container block executing its nested child blocks sequentially $N$ times (capped at 1 level of nesting; empty loop guards against freezing).

### 2. Looks Category Blocks (2 Functionalities)
- **`Say [text] for [duration] secs`**: Displays a comic-style speech bubble with pointer triangle above the sprite, blocking execution for $T$ seconds before auto-dismissing.
- **`Think [text] for [duration] secs`**: Displays a comic-style thought bubble with trailing circles above the sprite, blocking execution for $T$ seconds before auto-dismissing.
- *Upright Guarantee:* Speech and thought bubbles sit on the unrotated coordinate wrapper, ensuring text remains perfectly upright regardless of sprite rotation angle.

### 3. Drag-and-Drop Workspace (`MidArea`)
- **Native HTML5 Drag-and-Drop:** Drag blocks from the `Sidebar` palette directly into the active sprite's workspace.
- **Inline Parameter Editing:** Interactive white pill input fields for steps, degrees, coordinates, text, duration, and repeat counts.
- **Block Reordering & Deletion:** Reorder blocks within the stack, delete via trash icon, or drag a block onto the `Sidebar` palette to delete it (Scratch convention).
- **Edit Guard:** MidArea editing is safely locked while scripts are running to prevent mid-run state inconsistency.

### 4. Multiple Sprites Management (`PreviewArea` & `SpriteSelector`)
- **Cat & Horse Sprites:** Ships out-of-the-box with the official MIT Scratch Cat SVG and a matching Scratch-styled Horse SVG.
- **Independent Script Stacks:** Selecting a sprite in the bottom dock switches the workspace to display and edit that sprite's own independent block stack.
- **Dynamic Creation & Deletion:** "+ Add Sprite" spawns new sprites off the collision lane; individual "×" button safely deletes sprites (guarded when only 1 remains).
- **Global Play / Reset:**
  - **Go (Play):** Triggers all sprites to execute their scripts concurrently.
  - **Reset:** Instantly cancels running timeouts via ref tokens, dismisses bubbles, and restores initial coordinates.

---

## ⚡ The Mandatory "Hero Feature" — Collision-Based Script Swap

Continuous collision detection between sprites in the preview stage with runtime animation swapping:

```
┌────────────────────────────────────────────────────────┐
│ Cat (x: -80)   ───[Move 10 steps]───►                  │
│                                       ◄───[-10 steps]── Horse (x: +80)
│                                                        │
│                    ⚡ COLLISION AT TICK 6               │
│                  (d < 55px at x ≈ ±20px)               │
│                                                        │
│ Cat inherits:   ◄───[-10 steps]                         │
│ Horse inherits:                 ───[Move 10 steps]───► │
└────────────────────────────────────────────────────────┘
```

### Deterministic Collision Architecture:
1. **Unrotated AABB Detection:** Evaluated every frame via `requestAnimationFrame` (`|s1.x - s2.x| < 55 && |s1.y - s2.y| < 55`).
2. **Edge-Triggered:** Swaps fire strictly on the `false → true` transition (entering collision). Resets only when sprites separate (`!isColliding`), eliminating step-size sensitivity.
3. **700ms Cooldown Lock:** Prevents rapid-fire oscillation while sprites pass through each other.
4. **Atomic Central State Swap:** Dispatches `SWAP_SCRIPTS` on state (`state.sprites['sprite-1'].script` ⇄ `state.sprites['sprite-2'].script`). Visibly updates in `MidArea`!
5. **Script Versioning & Revival:** Increments `scriptVersion`. Active loops detect the version change and restart from block 0 of the inherited script. Sprites whose scripts had already finished are automatically revived.

---

## 🛠️ Architecture & Functional Programming Decisions

### 1. Zero New Dependencies
- **Shipped with standard package:** React 17.0.2, Tailwind CSS 2.0.1, Webpack 5.112.0.
- **No external animation libs (`framer-motion`):** "Motion" in Scratch is a block category, not a UI transition library. Movement is powered by coordinate state updates translated into hardware-accelerated CSS transforms:
  ```css
  transform: translate3d(${screenX}px, ${screenY}px, 0);
  transition: transform 0.15s ease-out;
  ```
  This guarantees 60fps smoothness with 100% mathematical determinism for collision checks.

### 2. Pure FP State Store (`ScratchContext.js`)
- Single source of truth using `useReducer` and React Context.
- Predictable, immutable state updates (pure reducer functions, shallow object spreads).
- `stateRef` synchronization via `useLayoutEffect` to eliminate closure staleness during asynchronous execution loops.

### 3. Language Decision: JavaScript (ES6+) over ReScript
- The starter repository is built on React 17 + Babel + Webpack.
- The assignment brief states: *"Prefer using ReScript React; alternatively, JavaScript/TypeScript is acceptable."*
- Sticking to clean JavaScript with strict Functional Programming satisfies Juspay's FP philosophy while eliminating build/interop compilation overhead.

---

## 📦 Project Structure

```
src/
├── index.js                    # Entry point & Tailwind styles
├── App.js                      # Root container & ScratchProvider
├── state/
│   └── ScratchContext.js       # Central useReducer store, actions & types
├── engine/
│   └── runner.js               # Async script executor & rAF collision loop
└── components/
    ├── Sidebar.js              # Block palette & drop-to-delete target
    ├── MidArea.js              # Workspace canvas with DnD stack & reordering
    ├── BlockItem.js            # Editable block chip with white pill inputs
    ├── PreviewArea.js          # 480x360 Stage canvas & Play/Reset controls
    ├── SpriteRenderer.js       # Positioned sprite with upright speech bubbles
    ├── SpriteSelector.js       # Interactive sprite dock & manager
    ├── CatSprite.js            # 1:1 official Scratch Cat SVG
    ├── HorseSprite.js          # Matching Scratch-styled Horse SVG
    └── Icon.js                 # SVG Icon helper
```

---

## 💻 Local Setup & Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/scratch-starter-project.git
   cd scratch-starter-project
   ```

2. **Install dependencies:**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Start local development server:**
   ```bash
   npm start
   ```
   Open your browser at **`http://localhost:3000`**.

4. **Production Build:**
   ```bash
   npm run build
   ```
   Webpack compiles assets into the **`public/`** folder (`public/app.js`, `public/app.css`).

---

## 🚀 Deployment (Vercel)

1. Import the repository into [Vercel](https://vercel.com).
2. The project includes a configured `vercel.json`:
   ```json
   {
     "outputDirectory": "public"
   }
   ```
3. Deploy! Vercel will build with `npm run build` and serve from `public/`.

---

## 🎬 1–2 Minute Walkthrough Video Script

1. **Introduction (15s):**
   - Show layout: Sidebar (Palette), MidArea (Workspace), PreviewArea (Stage + Sprite Dock).
2. **Drag-and-Drop & Parameter Editing (25s):**
   - Drag `Move 10 steps` and `Say Hello! for 2 secs` into Cat's workspace.
   - Edit parameters (e.g. change steps to 20 or speech text to "Hi Juspay!").
   - Drag a block over the Sidebar to show drag-to-delete.
3. **Multi-Sprite Switching (20s):**
   - Click **Horse** in the bottom dock; show how MidArea switches to Horse's independent workspace.
   - Click **Cat**; show Cat's script is preserved.
4. **Hero Feature Demo (30s):**
   - Click the **"⚡ Load Hero Demo"** button (Cat gets `Repeat 10 [Move 10 steps]`, Horse gets `Repeat 10 [Move -10 steps]`).
   - Click **"Go (Play)"**:
     - Both sprites march toward each other.
     - At tick 6 ($x \approx \pm 20\text{px}$), they collide!
     - The script swap triggers: Cat reverses and marches left; Horse reverses and marches right.
     - Switch to MidArea to show the scripts have physically swapped in state!
5. **Reset & Conclusion (10s):**
   - Click **"Reset"**: Sprites return immediately to initial positions.
