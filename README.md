# companion-module-liveplay

Control **LivePlay** audio playout software from a Stream Deck (or any other surface) using [Bitfocus Companion](https://bitfocus.io/companion).

## Requirements

- **LivePlay server v2.3.5 or later** with external-control (Companion) support.
- **Bitfocus Companion v4 or later.**
- Network access from the Companion machine to the LivePlay server (default port `4480`).

> The LivePlay API has **no authentication**. Anyone on the network who can reach the port can control playback — only use this on a trusted network.

## Status

This module is **not yet part of the official Companion module registry** — it is still being tested in the field. Once it has had more real-world testing it will be submitted through the formal [Bitfocus module PR process](https://github.com/bitfocus/companion-module-requests). Until then, install it manually from a release (below).

## Installation

Each [release](https://github.com/aspinwalld/companion-module-liveplay/releases) includes a ready-to-import module package (`liveplay-x.y.z.tgz`).

1. Download the `.tgz` from the latest release.
2. Open the Companion web UI (default `http://localhost:8000`), go to the **Modules** tab, click **Import custom module**, and select the downloaded `.tgz`.
3. Add a new connection and search for **LivePlay**.
4. Enter the IP/hostname of the machine running LivePlay and the port (default `4480`).
5. Drag presets from the **Presets** tab onto buttons, or build your own from the actions below.

## What you get

### Actions

| Action                                           | Notes                                                                                                                       |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| GO                                               | Plays the armed Up Next item, or the item derived from the playing item's end behavior — identical to LivePlay's GO button |
| Play / Stop / Pause / Resume / Toggle pause item | Addressed by item UUID                                                                                                      |
| Play item by index path                          | e.g. `0` or `1,11` (0-based, matches the LivePlay UI)                                                                       |
| Seek item                                        | Jump to a position in seconds                                                                                               |
| Stop all                                         | Optional fade in ms; blank uses the project default                                                                         |
| Panic                                            | Instant stop-all                                                                                                            |
| Trigger cart slot                                | Slots 1–64                                                                                                                  |
| Master gain set / adjust                         | Absolute dB, or a ± step applied server-side (race-free)                                                                    |
| Master limiter                                   | Toggle / on / off                                                                                                           |
| Arm Up Next                                      | Blank clears the override                                                                                                   |
| Preview / stop preview                           | Pre-listen without going to air                                                                                             |
| Load / close project                             | Path is resolved on the server machine                                                                                      |

### Feedbacks

Connection OK · project loaded · item playing · item paused · anything playing · cart slot active · limiter enabled · limiter engaged (actively reducing) · preview active.

### Variables

`project_name`, `current_item`, `elapsed`, `remaining`, `duration`, `next_name`, `master_gain`, `limiter`, `lufs_m`, `lufs_s`, `playing_count`, `item_count`, `server_version` and more — see the connection's Variables tab.

Every item in the open project also gets a pair of **name variables** so buttons can show an item's name addressed either way: `$(liveplay:item_name_<uuid>)` (stable across playlist edits) and `$(liveplay:item_name_at_<index>)` (e.g. `item_name_at_0`, or `item_name_at_1_11` for index path `1,11`). These update automatically when the playlist changes.

### Presets

Ready-made buttons for GO (shows the Up Next name), a now-playing display with countdown, stop all, panic, cart slots 1–8, master gain ±1 dB, a limiter toggle that turns red while limiting, and a connection status tile.

## Tips

- **Prefer UUIDs for fixed buttons.** Item UUIDs stay stable when the playlist is edited; index paths shift.
- Playing an item may stop others — LivePlay's default ducking mode is _stop-all_. That's LivePlay behavior, not a module bug.
- Right after a project loads, cues may still be loading audio; plays during that window fail with _item not loaded into engine_ (logged as a warning in Companion).

## Development

```bash
corepack enable
yarn install
yarn build        # compile to dist/
yarn dev          # watch mode
yarn lint         # eslint
yarn package      # build a distributable .tgz via companion-module-build
```

## License

[MIT](LICENSE)
