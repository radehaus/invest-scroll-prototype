# Allianz Invest — lokaler Prototyp

Statische Seite, kein Build-Schritt, keine Abhängigkeiten:

    python3 -m http.server 8080     # → http://localhost:8080

## Der Scroll-Accordion

Die Scrollposition steuert die Animation **nicht** direkt. Sie legt nur fest,
*welches* Element offen sein soll — eine ganze Zahl. Eine kritisch gedämpfte
Feder trägt dann einen kontinuierlichen Wert `pos` dorthin, und daraus fällt
pro Element ab:

    --open = clamp(1 - |pos - i|, 0, 1)

Genau diese Zwischenschicht macht das Gefühl aus: eine scroll-gekoppelte
Animation klebt am Finger und kann nie schwer wirken. Eine Feder hat Masse,
legt sich in die Bewegung und läuft aus ihr aus.

Weil sich Nachbarn die Strecke teilen, gilt immer `open(i) + open(i+1) = 1` —
zu jedem Zeitpunkt exakt eine Panelhöhe im Layout, also nie ein Sprung.

    assets/js/accordion.js   → die Feder, schreibt --open, --vel, --speed
    assets/css/style.css     → was eine gegebene Öffnung aussieht

### Das Gefühl einstellen

Oben in `accordion.js`, das sind die vier Zahlen, die die Persönlichkeit machen:

| Konstante    | jetzt | Wirkung                                        |
|--------------|-------|------------------------------------------------|
| `K`          | 32    | Federhärte — kleiner = schwerer, träger        |
| `MASS`       | 1.35  | Masse — größer = widerwilliger Start           |
| `DAMPING`    | krit. | aus K und MASS; setzt sich, wackelt nie nach   |
| `HYSTERESIS` | 0.55  | wie weit über die Mitte, bis es umschaltet     |
| `DRAG`       | 34 px | wie weit das Bild hinterherhängt bei Vollspeed |

`--vel` (vorzeichenbehaftet) lässt Bild, Copy und Bubbles unterschiedlich weit
nachhängen, `--speed` (Betrag) legt eine leichte Bewegungsunschärfe aufs Foto.
Beides zusammen liest sich als Gewicht.

### Die Geometrie einstellen

In `:root` in `style.css`:

| Variable            | jetzt  | Wirkung                                     |
|---------------------|--------|---------------------------------------------|
| `--panel-fill`      | `.92`  | wie viel vom freien Raum der Teaser nimmt — `1` = randvoll |
| `--row-h`           | ~50px  | geschlossene Zeile                          |
| `--row-h-open`      | ~64px  | aktive Zeile (Höhe *und* Schriftgrad wachsen mit `--open`) |
| `--scroll-per-item` | 105vh  | Scrollweg pro Teaser                        |

Der Teaser bekommt `(100svh - Zeilen) * --panel-fill`, aktuell rund 68 % der
Bildschirmhöhe.

## Barrierefreiheit

Bei `prefers-reduced-motion: reduce` fällt Pinning und Feder komplett weg, alle
Teaser stehen offen im normalen Fluss. Titelzeilen sind klickbar und scrollen
den zugehörigen Zustand an.

## Assets

Fotos liegen als JPEG (q82) in `assets/img/`. Logo, Pfeil und Sparkle sind ein
Inline-SVG-Sprite oben in `index.html`.
**Offen:** „Term life protection" hat noch kein Foto und zeigt einen Verlauf
mit dem Hinweis „Foto folgt".
