# LivePlay

Controls LivePlay audio playout software over its REST + WebSocket external-control API.

## Requirements

- LivePlay server **v2.4.0 or later**.
- The LivePlay API has **no authentication** — only use this module on a trusted network.

## Configuration

| Setting              | Description                                       |
| -------------------- | ------------------------------------------------- |
| Server IP / hostname | The machine running the LivePlay server.          |
| Port                 | The LivePlay REST/WebSocket port. Default `4480`. |

## Addressing items: UUID vs index path

Most item-level actions take the item's **UUID** from the LivePlay project. UUIDs are stable across playlist edits, so prefer them for fixed buttons.

Actions that take an **index path** use comma-separated, 0-based child indices descending into groups — `1,11` means the 2nd top-level item's 12th child, matching what the LivePlay client shows. Index paths shift when the playlist is edited; they suit "play position 1"-style workflows.

Cart slots are numbered **1–64** here, matching the LivePlay UI. The cart wall itself has 16 slots, and those get ready-made presets and variables.

## Running a show from Companion

The module mirrors LivePlay's own operator state, so a Stream Deck can drive a whole show without touching the screen:

1. **Select ▲ / ▼** move the selection in the LivePlay playlist itself — the highlight moves on screen, and the selected item's name and colour appear on the surface.
2. **Set As Next** arms the selected item for GO.
3. **GO** fires it. The GO button carries the armed item's own colour, so you can see what is about to go to air before you press it.
4. The **now-playing** button shows the most recently triggered cue in its colour, counting down, flashing yellow at 30 s, orange at 10 s and red at 5 s — the same thresholds and blink rates as the on-screen cue card.

Selection and Show Mode are held by the **server**, not by each client, so Companion, a touch tablet and the operator's laptop always agree.

## Actions

**Transport**

- **GO** — plays the armed Up Next item, or the target derived from the playing item's end behavior (same as LivePlay's GO button).
- **Play / Stop / Pause / Resume / Toggle pause item** — by UUID.
- **Pause / resume on-air items** — one button: resumes everything paused, otherwise pauses everything sounding.
- **Play item by index path**
- **Seek item** — jump to a position in seconds.
- **Stop all** — with an optional fade in ms (blank uses the project's Stop All fade).
- **Panic** — instant stop all.
- **Trigger cart slot** — slots 1–64.

**Selection & Show Mode**

- **Select next / previous item** — walks the flattened playlist (groups, then their children) and stops at the ends rather than wrapping.
- **Select item by UUID / by index path**
- **Arm selected as Up Next**
- **Play selected item**
- **Preview selected item**
- **Show Mode** — toggle / on / off. Applies to every connected LivePlay client.

**Master & project**

- **Master gain: set / adjust** — absolute dB or relative step (applied server-side, race-free).
- **Master limiter** — toggle / on / off.
- **Arm Up Next** — arm an item by UUID (blank clears the override).
- **Preview item / Stop preview** — pre-listen without going to air.
- **Load / Close project** — the path is resolved on the server machine.

## Feedbacks

**Boolean** (apply a style when true)

- **Connected to LivePlay**, **Project loaded**
- **Item is playing** (sounding) / **Item is paused**
- **Anything is playing**
- **Cart slot is playing**
- **Limiter enabled** / **Limiter engaged** (actively reducing gain)
- **Preview active**
- **Show Mode is on**
- **Item is selected** / **Item is armed as Up Next**

**Colour mirrors** (paint the button from the item's own colour)

LivePlay operators read cues by colour first and name second, so these take the colour authored in the project and put it on the button, choosing black or white text for whatever colour that turns out to be.

- **Up Next item colour** — for GO buttons.
- **Selected item colour** — for the arm / play-selected buttons.
- **Playing item colour (with end-of-cue flash)** — the most recently triggered on-air cue. With the flash enabled it cross-fades to yellow / orange / red at 30 s / 10 s / 5 s remaining, blinking at 2 s / 1 s / 0.5 s to match the client. Paused cues do not flash.
- **Cart slot colour** — the loaded cue's colour, dimmed while idle and full while firing.
- **Item colour by UUID** — same treatment for any specific item.

Each takes a **Background when empty** colour used when there is no item to draw from.

## Variables

| Variable                                             | Description                                       |
| ---------------------------------------------------- | ------------------------------------------------- |
| `project_name`, `item_count`                         | Open project info                                 |
| `current_item`, `current_item_uuid`, `current_color` | Most recently triggered on-air item               |
| `current_state`                                      | Its transport state, in LivePlay's language       |
| `elapsed`, `remaining`, `duration`                   | Current item times (`mm:ss`, updated 4 Hz)        |
| `warn_level`                                         | `yellow` / `orange` / `red`, blank when clear     |
| `next_name`, `next_uuid`, `next_color`, `next_index` | Effective Up Next (armed override or derived)     |
| `next_source`                                        | `override` or `auto`                              |
| `selected_*`                                         | Name, UUID, colour and index of the selected item |
| `show_mode`, `locale`                                | Shared operator UI state                          |
| `master_gain`, `limiter`                             | Master section state                              |
| `lufs_m`, `lufs_s`                                   | Master K-weighted momentary/short-term loudness   |
| `playing_count`, `server_version`                    | Misc status                                       |
| `cart_<n>_name`, `cart_<n>_uuid`, `cart_<n>_color`   | Cart slots 1–16                                   |
| `item_name_<uuid>`                                   | Name of a specific item, by UUID                  |
| `item_name_at_<index>`                               | Name of a specific item, by index path            |

A pair of name variables is created for every item in the open project, so any button can show an item's name whether you address it by UUID or by position. For example `$(liveplay:item_name_at_0)` is the name of the first top-level item, `$(liveplay:item_name_at_1_11)` the name at index path `1,11`, and `$(liveplay:item_name_e8eaa079-...)` the name of that specific item wherever it moves. These update automatically when the playlist is edited. (Cart-only items get a UUID variable but no index variable.)

## Button language

Preset button labels are written in whatever language LivePlay is currently displaying. The strings come from LivePlay's own translation files, so a Companion button and the on-screen control it mirrors are worded identically. Changing the language in LivePlay re-publishes the presets in the new language.

`GO`, `PANIC` and `LIMITER` stay in English deliberately — they are the terms operators look for, and they fit a button in a way the translated phrases do not.

Buttons you have already placed on a page keep the text you gave them; only the presets in the sidebar are relabelled. Re-drag a preset to pick up the new wording.

To regenerate the label table after LivePlay adds a locale:

```
python tools/gen-locale.py <path-to>/liveplay/client/locales
```

## Notes

- Playing an item may stop others — LivePlay's default ducking mode is _stop-all_. That is LivePlay behavior, not a module bug.
- Right after loading a project, cues may still be loading; play requests during that window fail with _item not loaded into engine_ and are logged as warnings.
- "Currently playing" means the **most recently triggered** cue, not the topmost one in the playlist. With a bed under a stinger, the button follows what you fired last.
