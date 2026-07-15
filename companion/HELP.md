# LivePlay

Controls LivePlay audio playout software over its REST + WebSocket external-control API.

## Requirements

- LivePlay server **v2.3.5 or later** with external-control (Companion) support.
- The LivePlay API has **no authentication** — only use this module on a trusted network.

## Configuration

| Setting              | Description                                       |
| -------------------- | ------------------------------------------------- |
| Server IP / hostname | The machine running the LivePlay server.          |
| Port                 | The LivePlay REST/WebSocket port. Default `4480`. |

## Addressing items: UUID vs index path

Most item-level actions take the item's **UUID** from the LivePlay project. UUIDs are stable across playlist edits, so prefer them for fixed buttons.

Actions that take an **index path** use comma-separated, 0-based child indices descending into groups — `1,11` means the 2nd top-level item's 12th child, matching what the LivePlay client shows. Index paths shift when the playlist is edited; they suit "play position 1"-style workflows.

Cart slots are numbered **1–64** here, matching the LivePlay UI.

## Actions

- **GO** — plays the armed Up Next item, or the target derived from the playing item's end behavior (same as LivePlay's GO button).
- **Play / Stop / Pause / Resume / Toggle pause item** — by UUID.
- **Play item by index path**
- **Seek item** — jump to a position in seconds.
- **Stop all** — with an optional fade in ms (blank uses the project's Stop All fade).
- **Panic** — instant stop all.
- **Trigger cart slot** — slots 1–64.
- **Master gain: set / adjust** — absolute dB or relative step (applied server-side, race-free).
- **Master limiter** — toggle / on / off.
- **Arm Up Next** — arm an item for GO (blank clears the override).
- **Preview item / Stop preview** — pre-listen without going to air.
- **Load / Close project** — the path is resolved on the server machine.

## Feedbacks

- **Connected to LivePlay**
- **Project loaded**
- **Item is playing** (sounding) / **Item is paused**
- **Anything is playing**
- **Cart slot is playing**
- **Limiter enabled** / **Limiter engaged** (actively reducing gain)
- **Preview active**

## Variables

| Variable                            | Description                                     |
| ----------------------------------- | ----------------------------------------------- |
| `project_name`, `item_count`        | Open project info                               |
| `current_item`, `current_item_uuid` | First actively-sounding item                    |
| `elapsed`, `remaining`, `duration`  | Current item times (`mm:ss`, updated 2 Hz)      |
| `next_name`, `next_uuid`            | Effective Up Next (armed override or derived)   |
| `master_gain`, `limiter`            | Master section state                            |
| `lufs_m`, `lufs_s`                  | Master K-weighted momentary/short-term loudness |
| `playing_count`, `server_version`   | Misc status                                     |
| `item_name_<uuid>`                  | Name of a specific item, by UUID                |
| `item_name_at_<index>`              | Name of a specific item, by index path          |

A pair of name variables is created for every item in the open project, so any button can show an item's name whether you address it by UUID or by position. For example `$(liveplay:item_name_at_0)` is the name of the first top-level item, `$(liveplay:item_name_at_1_11)` the name at index path `1,11`, and `$(liveplay:item_name_e8eaa079-...)` the name of that specific item wherever it moves. These update automatically when the playlist is edited. (Cart-only items get a UUID variable but no index variable.)

## Notes

- Playing an item may stop others — LivePlay's default ducking mode is _stop-all_. That is LivePlay behavior, not a module bug.
- Right after loading a project, cues may still be loading; play requests during that window fail with _item not loaded into engine_ and are logged as warnings.
