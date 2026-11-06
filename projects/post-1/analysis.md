# Reference analysis

Source: 15.49 s, 1080×1920, 30 fps, portrait, original audio 44.1 kHz stereo. The source is moving footage, not still photos; the same hands appear before and after nail work. Scene detection finds a cut at 6.833–6.867 s. Frames were inspected as a 1 fps overview and 8 fps sheets around the opening, cut and outro.

| Slot | Reference entry | Position / scale / motion | Hold and text | Exit / transition |
|---|---|---|---|---|
| 1, natural nails | About 0.13–0.8 s fade in from black, fixed position | Full-frame vertical live close-up, hands central; slight natural motion, no significant rotation or intentional translation | ~0.8–6.7 s. Existing title already at top from 0 s; brand mark near bottom and small Instagram mark. No per-slot writing animation. | Brief defocus/zoom-like change at ~6.75–6.87 s; cut at 6.833–6.867. |
| 2, finished nails | ~6.83–7.05 s blur resolves after cut | Same full-frame close-up composition; moving hands and camera, no deliberate pan | ~7.05–10.8 s; same existing title and branding. | ~10.8–11.5 s fade to black. |
| Outro | ~11.5–12.2 s Instagram mark and handle appear | Small centered logo on black; old title and bottom logo faintly remain | Remains through 15.49 s | End. |

Reference typography is a white Persian headline near the top and tiny white logos on the lower area; no user caption supplied, so these reference words and logos are not reused. This means the reference has a hook immediately, but its wording is intentionally omitted. Our own handle replaces the logo. User image is landscape after privacy crop; it is fitted across the central region rather than cropped to the narrow full-frame portrait, to keep the nail work visible. Chalkboard, a chalk frame and simple linework replace the reference's filmed background.

## Music / beat alignment

Librosa estimates 136 BPM; typical spacing 0.418–0.441 s, corresponding to ~136–143 BPM, not an obvious half/double-tempo error. The reference cut at 6.833 s falls midway between detected beats 6.618 and 7.082 s. Exact ±0.1 s cut matching and ±1 frame beat alignment cannot both be met. Prioritise the requested beat alignment: start our blurred change at 6.618 s (0.215 s early), finish by 7.082 s. First photo entry 0.116 s (beat); second photo entrance/first exit 6.618 s (beat); photo exit 11.053 s (beat); outro entry 11.889 s (beat). All event starts are within one frame of their nearest detected beat. First photo is still ~0.8–6.618 s; second holds still 7.082–11.053 s; outro holds >1.5 s.

Librosa finds no beats after 11.889 s; avoid inventing beat-driven actions after it. Loudest window starts at 11.84 s, near the 11.889 s outro entrance; the reference uses a restrained logo, so it is revealed rather than adding a larger pop not present in the reference.

## Known limits

The single photograph is repeated: the original before/after change and the hands' organic motion cannot be reconstructed truthfully. The transition's brief defocus is approximated with CSS blur, opacity and scale. The reference's overlay typography is omitted because no finished caption was provided; the full-bleed composition is adapted to accommodate the landscape, privacy-cropped photograph. The logo is redrawn as chalk. The black reference background becomes chalkboard green.
