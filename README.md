# Frostbyte: Alien Defense — 2nd Anniversary

A tiny 2D pixel shooter made for [Frostbyte](https://www.frostbyte.art/)'s 2nd anniversary.
Aliens crashed the birthday party: drag (or use arrow keys) to move, snowballs fire automatically.

- Green saucers take 1 hit, red saucers take 2 and shoot back.
- Don't let aliens land, because each one that does costs a heart.
- Pickups: 🎂 party cake = triple snowballs, ❄️ snowflake = frost shield, ❤️ = extra heart.
- Every 4th wave a **boss** shows up. Beat it to trigger the birthday celebration:
  1. **Mothership** (wave 4): sweeps side to side, fires spreads, drops saucers.
  2. **Cake Snatcher** (wave 8): swoops in a figure-eight with the stolen cake, fires aimed
     shots, and lines up a big beam on you (red dotted line = move!).
  3. **Alien Overlord** (wave 12): shielded by orbiting orbs that block snowballs, fires ring
     bursts, and adds a spiral stream below half HP.
  From then on the Overlord keeps coming back (LV2, LV3, …) with more HP and faster attacks.
- **Pick your Frostbyte** on the title screen: **Santa** or **Hoodie** (tap one, or ←/→ then
  Space). Both are pixel-for-pixel from the Frostbyte reference art, and the choice is remembered.
  Rename them in `CHARS`.
- **Art style**: every sprite follows the Frostbyte references: an outline in a dark tint of its
  own color, flat colors with a darker right/bottom shade, and a soft 1px drop shadow on the right.
  `sprite(rows, map, { trim, shade, outline, shadow })` applies these automatically.
- **Agent Delta**, your ally from Planet Delta, flies in on a delta hoverboard for every boss
  fight. They shoot at the boss, drop supplies (a heart when you're low), warn you when the
  Cake Snatcher lines up its beam, and fire homing Delta Pulses that pop the Overlord's orbs.
- **Story**: a narrated intro on your first game, plus boss taunts and Agent Delta's lines
  (intro, halfway, victory) in a typewriter dialogue box with portraits. The game keeps
  running during dialogue. Rename the ally with `ALLY_NAME`; lines live in `bossIntro`,
  `bossHalfway` and `bossOutro`.
- The sky changes every **100 points**, cycling through 7 themes (Midnight Snow, Aurora Sky,
  Cosmic Nebula, Synth Sunset, Alien World, Fireworks, Balloon Party) with a pixel-dither dissolve.
  Tweak `THEME_EVERY` in `index.html` to change the interval.
- Game over screen has a **Share score on X** button.

It's one self-contained file (`index.html`): no build step, no dependencies, no external requests.

## Controls

| Input | Action |
| --- | --- |
| Drag / mouse | Move |
| ← → or A D | Move |
| Space / Enter / tap | Start, retry |
| P / Esc | Pause |
| M or speaker icon | Mute |

## Playing it inside an X post (player card)

`index.html` already includes the `twitter:card = player` meta tags, so a post with the game's link
shows it as a playable embed (480×480):

1. The game is hosted on **Vercel** at `https://frostbyte-anniversary-game.vercel.app/`.
   The Vercel project is linked to this repo, so every push to `main` deploys to production.
   (GitHub Pages also still serves a copy at `https://delgersaikhannn.github.io/frostbyte-anniversary-game/`.)
2. When you move to a custom domain (or another host), replace the URL in the `twitter:player`,
   `twitter:image`, `og:url`, `og:image` meta tags and in `GAME_URL` inside the script.
3. Post the link on X. X shows `card.png` as the preview and runs the game inline where
   player cards are supported (on some clients it opens in X's in-app browser instead).

The host must allow framing (no `X-Frame-Options: DENY`). Vercel and GitHub Pages are both fine.

## Local testing

Serve the folder with any static server and open `http://localhost:<port>/`.
Add `?debug` to the URL to get a `window.__fb` handle for jumping to the boss or game-over screens.
