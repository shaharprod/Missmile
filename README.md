# SafeTime — מנבא בטיחות חכם 🛡️

Real-time safety prediction and alert monitoring app for Israeli citizens during active security operations.

## What is SafeTime?

SafeTime aggregates real-time alert data from multiple official sources to help civilians make informed safety decisions. It provides:

- **Live alert feed** — Real-time rocket, missile, and UAV alerts via WebSocket connection to Tzeva Adom
- **Safety meter** — Statistical safety score based on historical attack patterns (not a real-time guarantee)
- **Activity recommendations** — How safe common activities are right now, ranked by risk
- **Daily intensity breakdown** — Per-day attack waves, missiles, UAVs, interceptions, casualties
- **Hourly heatmap** — Historical attack intensity by hour across all days
- **Alert timeline** — Chronological list of all verified Pikud HaOref alerts with locations

## Screenshot

Open `index.html` in any modern browser — no build step required.

## Data Sources

| Source | What it provides |
|--------|-----------------|
| **Pikud HaOref** (oref.org.il) | Official Home Front Command alerts |
| **Tzeva Adom** (tzevaadom.co.il) | Real-time WebSocket alert stream + REST API |
| **IDF Spokesperson** | Launch counts, interception data |
| **Alma Research Center** | Threat analysis |
| **Times of Israel / Al Jazeera** | Verified event timelines |

## Tech Stack

- **Single HTML file** — zero dependencies, zero build step
- **Vanilla JavaScript** — no frameworks
- **CSS custom properties** — dark theme, RTL layout
- **WebSocket + REST polling** — dual-channel real-time updates with automatic fallback
- **Google Fonts** — Heebo (Hebrew) + Share Tech Mono (monospace)
- **LocalStorage** — persists alert history between sessions

## How It Works

1. On load, seed alerts are populated from verified historical data per day
2. A WebSocket connection to Tzeva Adom streams live alerts
3. If WebSocket disconnects, a backup REST API polls every 3 seconds
4. Alerts are deduplicated by `notificationId` (last 100 tracked)
5. Safety score is calculated from hourly intensity patterns of previous days
6. UTF-8 BOM is stripped from Oref API responses; category 10/13 ("all clear") alerts are filtered out

## Usage

```bash
# Just open it
open index.html
# Or serve locally
python -m http.server 8080
```

No API keys needed. All data sources are publicly accessible.

## Important Disclaimer

> ⚠️ **This tool does NOT replace the official Pikud HaOref app.**
> Safety percentages are statistical estimates based on past days — they do not guarantee safety.
> Always follow Home Front Command instructions immediately during an alert.
> Missiles can arrive at any moment regardless of the displayed safety score.

## Data Integrity

This project follows strict data safety rules:
- **No fabricated data** — every alert is cross-referenced with official sources
- **No future data** — no entries for days or hours that haven't occurred yet
- **Verified sources only** — Pikud HaOref, IDF, Tzeva Adom API
- **"Updating" label** — used when data is incomplete rather than guessing

## License

This project is provided as-is for civilian safety during emergency situations.
