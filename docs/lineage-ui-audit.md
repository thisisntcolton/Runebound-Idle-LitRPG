# Lineage interface audit and navigation map

Lineage separates state and local save migration (`core/`), simulation and lifecycle (`systems/`), content definitions (`data/`), and the renderer and delegated controls (`ui/`). The existing renderer calls simulation functions directly; it also invokes initialization helpers while rendering. Preserve these contracts and the `lifesim-save-v1` key during the redesign.

| Existing destination or action | Planned location |
| --- | --- |
| Life log, yearly events, sagas and ongoing chapters | Life timeline and event presentation |
| Yearly energy actions, routines, home, school, career, clinic and town districts | Activities, with the town as an optional secondary view |
| People, romance and family interactions | People |
| Finances, housing, vehicles, investments, business and creative assets | Assets |
| Character, skills, education, career and paths | Character profile and contextual Activities screens |
| Family tree, export/import, reset and Hub link | Secondary menu |
| Death summary and heir selection | End-of-life flow |

The current navigation includes Life, Town, Character, People and Assets. Most ordinary activities are reachable through the town or home; the life panel and log also present overlapping story information. Some screen routing and state initialization are intertwined, so a navigation rewrite needs action-by-action checks before old views are removed. Existing tests (`node test/webshire-regression.mjs`) passed before changes.

Design direction: forest green `#294D3C`, sage `#789681`, parchment `#F5EFE3`, gold `#B6955C`, charcoal `#343C36`; serif headings and readable sans-serif body text. The life story should be primary, with four persistent destinations and no simulation or save changes. Existing scene artwork can remain optional; compact portrait artwork and coherent icons need further assessment.
