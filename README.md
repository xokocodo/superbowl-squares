# Superbowl Squares

Lightweight Superbowl squares board with a sleek UI, printable PDF view, and optional shared backend for read‑only viewing with admin‑only edits.

## How the game works
- 10x10 grid of squares.
- Each square is assigned to a participant.
- After all squares are filled, digits 0–9 are randomized for rows and columns.
- The last digit of each team’s score determines the winning square:
  - **Halftime**: uses the halftime digit set.
  - **Final**: uses the final digit set.

## Features
- Assign squares by selecting a participant and clicking on squares.
- Quick picks (1/5/10 random squares) for faster assignment.
- Randomize digits (locked after randomization; admin can re‑randomize).
- Payout split (default 30% halftime / 70% final).
- Live score auto‑fetch (ESPN) with manual fallback.
- Current winner + scenario outcomes (+3/+7 for each team).
- Likelihood model for square/user win odds (heuristic).
- Print‑friendly PDF view.
- Optional shared state backend (Cloudflare Pages Functions + KV).

## Settings
In **Settings & admin**:
- **Price per square**: sets the cost for each square.
- **Payout ratio**: halftime vs final percentage.
- **Super Bowl name / teams / logos**: customize the display.
- **Admin key**: enables write access and backend syncing.
- **Re‑randomize / Clear board**: admin‑only actions.

## Authentication (admin‑only)
This app supports a lightweight admin model:
- **Public users** can view the board (read‑only).
- **Admins** paste the **Admin key** in Settings to enable editing and syncing.

The admin key is stored in the browser’s local storage and sent only to the backend for write operations.

## Likelihood model (heuristic)
The app estimates square win likelihoods using a simple, transparent model:
- **Score + time remaining** determine expected future scoring pace.
- Each team’s remaining points are modeled as a distribution of scoring events.
- Those outcomes are converted into **last‑digit probabilities** for each team.
- Historical NFL **last‑digit priors** bias digits toward common outcomes (0/7/3/1).
- All square probabilities are normalized to **sum to 1**.

This produces:
- Per‑square probabilities (tooltip on hover).
- Per‑user total odds (sum of their squares’ probabilities).

## Backend (optional)
The app can run fully client‑side. For shared state:
- **Cloudflare Pages + Functions**
- **Cloudflare KV** for storage
- `GET /api/board` → public read
- `POST /api/board` → admin write

Environment variables/bindings:
- `BOARD_KV` (KV namespace binding)
- `ADMIN_KEY` (secret)

## Development
This is a static app. Open `index.html` in a browser:

```
open index.html
```

## Deployment (Cloudflare Pages)
1. Connect GitHub repo to Pages.
2. Build settings:
   - Build command: *(empty)*
   - Output directory: `.`
3. Add bindings:
   - KV: `BOARD_KV`
   - Secret: `ADMIN_KEY`

## Notes
- API score fetch depends on the ESPN public endpoint and may be limited by CORS or availability.
- PDF export uses a dedicated print‑only layout for clarity.

