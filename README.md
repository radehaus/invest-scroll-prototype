# Allianz Invest — lokaler Prototyp

Statische Seite, kein Build-Schritt, keine Abhängigkeiten:

    python3 -m http.server 8080     # → http://localhost:8080

## Zwei Versionen

Dieselbe Seite, zwei Modi — über `?v=` vor dem ersten Paint gesetzt, damit
keiner von beiden aufblitzt:

| URL              | Was                                                        |
|------------------|------------------------------------------------------------|
| `/`              | Scroll-Accordion: ein Teaser zur Zeit, gepinnt, federgetrieben |
| `/?v=open`       | Alle Teaser offen im normalen Fluss, mit mitlaufendem Prompt   |
| `/?v=open&ai=1`  | AI mode, direkt in die Konversation                            |

Copy, Bilder und Layout liegen nur einmal vor; die Variante schaltet über
`data-variant` am `<html>` um. `accordion.js` steigt in `open` sofort aus,
`dock.js` läuft nur dort.

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
    assets/js/dock.js        → der mitlaufende Prompt (nur ?v=open)
    assets/js/chat.js        → AI mode: Übergabe und Antworten (nur ?v=open)
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
| `--nav-h`           | 38–46px| die sticky Utility-Leiste — wird überall abgezogen |
| `--panel-fill`      | `.92`  | wie viel vom freien Raum der Teaser nimmt — `1` = randvoll |
| `--row-h`           | 32–56px| geschlossene Zeile                          |
| `--row-h-open`      | 42–74px| aktive Zeile (Höhe *und* Schriftgrad wachsen mit `--open`) |
| `--scroll-per-item` | 105vh  | Scrollweg pro Teaser                        |

Der Teaser bekommt `(100svh - --nav-h - Zeilen) * --panel-fill`.

### Warum überall ein `vh`-Term steht

Die Copy wurde ursprünglich nur über `vw` dimensioniert, der Platz kommt aber
aus der Höhe. Auf einem breiten, flachen Fenster hieß das: 42-px-Überschriften
in einer 255-px-Box, und `overflow:hidden` kappte den Button. Jetzt trägt jede
Größe einen Höhen-Term neben dem Breiten-Term, `min()` nimmt den knapperen.

Die Panel-Typografie leitet sich dabei aus `--panel-h` ab statt aus `vh` — aus
der Box, in die sie passen muss. Die hat `--nav-h` und die Zeilenköpfe schon
abgezogen, also rechnet sich beides automatisch mit durch. Auf jedem normal
hohen Fenster gewinnt weiterhin der `vw`-Term, die Grade sind dort
unverändert.

Unter 760 px Höhe kommen zwei Notventile dazu: `--panel-fill` geht auf `1`
(der Luftrand um die Bühne ist das Erste, was gehen darf), und das Satzmaß
weitet sich von 38ch auf 54ch. Letzteres klingt nach einer Verschlimmerung,
ist aber das Gegenteil: die Copy-Spalte ist ~490 px breit, der Lead brach in
266 px davon auf **vier** Zeilen um. Eine schmale Spalte gibt dort die knappe
Ressource aus, um die im Überfluss vorhandene zu sparen.

## Die offene Version (`?v=open`)

Der ganze Apparat des Accordions — der hohe Track, die gepinnte Bühne, die
Feder — existiert, um *einen* Teaser zu zeigen. Hier stehen alle offen, also
wird jeder dieser Mechanismen abgeschaltet statt umgangen. `--open` auf 1 zu
nageln erledigt das meiste von selbst: das `translate` des Panels, die
Opacity-Rampen von Copy und Bild und die Bewegungsunschärfe sind alle
Funktionen von `--open` und `--vel` und landen auf ihren Ruhewerten, sobald
die beiden feststehen.

### Der mitlaufende Prompt

**Die Bar bewegt sich nie.** Sie steht ab dem ersten Frame fest auf genau der
Stelle, die die Bühnen-Bar bei Scroll 0 einnimmt — gemessen an dieser, nicht
geraten. Die Bühnen-Bar selbst bleibt als unsichtbarer Platzhalter in der
Komposition des Heros stehen: sie hält ihren Raum und leiht ihre Position.
Oben decken sich die beiden also exakt, und danach scrollt die Seite unter
einer Bar weg, die sich nicht gerührt hat.

Damit gibt es kein Auftauchen, kein Verschwinden und keine Übergabe — und
damit auch nichts, was daran schiefgehen könnte. Nachgemessen über die ganze
Seite: **eine** einzige Position, 409 px, an jeder Scrollposition.

Fällt der Hero höher aus als das Fenster, würde die gemessene Stelle unter dem
unteren Rand liegen; die Ruheposition wird deshalb zwischen Utility-Leiste und
Fensterunterkante eingeklemmt.

**Die Frage darin gehört zum Abschnitt, den man gerade ansieht.** Genommen
wird der, dessen Mitte der Bildschirmmitte am nächsten ist — nicht der erste,
der sich überschneidet, sonst wechselte sie einen Bildschirm zu früh.

Die Bühne trägt dabei ein eigenes `data-ask` wie jeder andere Abschnitt, sie
ist kein Rückfall. Auf einem hohen Fenster lugt ihr erster Teaser unten schon
herein, während man noch auf der Bühne steht — als einziger sich
überschneidender Abschnitt hätte er kampflos gewonnen, und genau deshalb
zeigte die Bühne die Frage des ersten Teasers.

Der Wechsel blendet den Text aus und wieder ein, 220 ms pro Richtung, nie
mitten im Lesen. Die
Fragen stehen als `data-ask` am jeweiligen `.acc__item`, also direkt neben
dem Inhalt, zu dem sie gehören:

| Abschnitt                   | Frage                                                    |
|-----------------------------|----------------------------------------------------------|
| Bühne (`.stage`)            | I'm 40 — where should I start?                           |
| Insurance-based investing   | How do I take part in the markets without risking my foundation? |
| Wealth management           | Who manages my portfolio, and how?                       |
| State-subsidized retirement | How much would the state add to my pension?              |
| Term life protection        | How much cover would my family need?                     |
| Saving for your kids        | How early should I start saving for my kids?             |

### Die Fotos ohne Kasten

Aus dem Figma, Node `4120:3915`. Der Designer maskiert dort gar nichts: an
jeder Kante des Fotos liegen **zwei überlappende Rechtecke**, gefüllt mit
einem Verlauf von der Hintergrundfarbe nach transparent. Dass es zwei statt
einem sind, ist der Punkt — zusammen ergeben sie eine Ease statt einer
Rampe, schnell an der Kante, langsam beim Ankommen.

Hier ist es stattdessen eine **Maske**. Ein Overlay müsste exakt die Farbe
von dem haben, was dahinterliegt; hinter unseren Fotos liegt aber ein
getönter Teaser, nicht das flache `#F4F4F4` des Boards. Eine Maske macht das
Foto an den Kanten wirklich transparent und stimmt damit auf jedem Grund.

Die Rampen des Boards, als Anteil seines 1280 × 688-Frames — die kürzere
jedes Paares ist, wo die Kante fertig angekommen ist:

| Kante  | Rechtecke  | fertig bei |
|--------|------------|------------|
| links  | 832 / 586  | 46 %       |
| rechts | 302 / 254  | 20 %       |
| unten  | 299 / 233  | 34 %       |
| oben   | 171 / 142  | 21 %       |

Der linke Verlauf ist der eigentliche Trick: das Bild hat nie eine linke
Kante, es hört irgendwo unter dem Text einfach auf, da zu sein. Deshalb
spannt das Foto über das **ganze** Panel, Copy eingeschlossen.

Die einzige Zahl, die nicht direkt übernommen ist, ist die linke. Das Board
legt eigentlich fest, wo der Verlauf *relativ zum Text* landet: seine Copy
ist 33 % des Frames breit, der Verlauf endet bei 46 % — er räumt den Text um
gut die Hälfte. Unsere Copy-Spalte ist mit 42 % breiter, 46 % würden also
fast auf ihr enden und die kleine graue Notiz auf offenem Foto liegen
lassen. Auf dem Verhältnis des Boards gehalten sind es 58 %.

`mask-composite: intersect` ist nötig, weil vier getrennte Kanten sich
multiplizieren müssen. Auf dem voreingestellten `add` würden sie sich zu
einer fast blickdichten Maske vereinigen — also wieder zum harten Rechteck.
Ein altes Safari verliert damit den Effekt, aber nichts weiter.

### AI mode — die Übergabe

Der eigentliche CTA. Die Bar ist scharf: man tippt, drückt Absenden und landet
unter dem Navigationspunkt **AI mode** — wo die eigene Frage, in den eigenen
Worten, schon oben steht und beantwortet wird. Drückt man ab, ohne etwas zu
tippen, gilt die Frage, die die Bar gerade anbietet; der Platzhalter ist ein
echtes Angebot, keine Dekoration.

Gebaut ist der **Übergang**, nicht der Chatbot. Überzeugen muss der Moment
zwischen den beiden Bildschirmen; ob ein echtes Modell die Antwort geschrieben
hat, prüft eine ganz andere These. Auf GitHub Pages ginge es ohnehin nicht:
statische Auslieferung, kein Server, der einen API-Schlüssel verstecken könnte.
Dafür bräuchte es einen kleinen Proxy davor (Cloudflare Worker) — dann aber
gleich mit echtem Passwortschutz statt des Schaufenster-Passworts.

> **Achtung, Prototyp-Copy.** Sämtliche Antworten in `assets/js/chat.js` sind
> erfunden und illustrativ. Keine Zahl darin ist durch Produkt oder Compliance
> gegangen. Vor jeder Vorführung außerhalb des Teams gegenlesen lassen.

Es ist ein View, keine eigene Seite: der Header bleibt stehen, alles darunter
wird getauscht. So liest es sich, als antworte dieselbe Seite, statt als Sprung
woandershin. `?v=open&ai=1` ist ein Deep Link, der Zurück-Button funktioniert.

**Wer antwortet auf was.** Eine Frage, die aus einem Abschnitt stammt, bringt
ihr Thema mit — geraten wird nur bei Freitext. Wichtig dabei: welchen Abschnitt
man gerade ansieht, entscheidet **nur** `dock.js`, und die Bar veröffentlicht
das Ergebnis als `data-topic`. Erst hatten Bar und AI mode das getrennt
gemessen, und prompt stand über einer Kids-Antwort die Stage-Frage.

Freitext wird nach Wortüberschneidung zugeordnet: der Abschnitt beschreibt sich
über seine eigene Überschrift, Frage und Copy — das braucht keine Pflege, kennt
aber nur die Wörter, die der Texter zufällig benutzt hat. Niemand tippt
„children", wenn er seine Tochter meint. Deshalb nennt jedes Thema zusätzlich
die Handvoll Wörter, die es eindeutig benennen, und die zählen doppelt: eines
davon genügt. Trifft nichts, sagt die Antwort das und bietet einen Berater an —
was zugleich der CTA des Schlussabschnitts ist.

Gegen zehn Testfragen geprüft, alle zehn richtig zugeordnet, „what is the
weather tomorrow" korrekt als *keine* Zuordnung.

### Wo sie sich zurückzieht

Zwei Stellen, an denen die Bar nichts zu suchen hat:

**Am Schluss.** „There is always a person behind Allianz Invest" bittet darum,
einen Menschen anzurufen — darüber darf keine KI-Zeile liegen, und im Footer
fängt niemand ein Gespräch an. Sie blendet aus, sobald der Abschnitt ihre
eigene Linie erreicht, nicht schon wenn er ins Bild kommt: sonst verschwände
sie, während der letzte Teaser noch das Wort hat. Sie geht mit der Frage, die
sie zuletzt gestellt bekam, statt hinter der eigenen Blende noch auf den
Rückfalltext zu wechseln. Nur Opacity — sie zu bewegen würde den ganzen Punkt
des Festnagelns wieder aufgeben.

**Die Bubbles auf den Fotos entfallen hier.** Sie stellten die Fragen, als es
keinen anderen Ort dafür gab. Das tut jetzt die Bar darüber, und zwar mit
denselben Sätzen — zwei Stimmen, die sich über einem Foto wiederholen. In der
Accordion-Version bleiben sie, dort gibt es die Bar nicht.

## Barrierefreiheit

Bei `prefers-reduced-motion: reduce` fällt Pinning und Feder komplett weg, alle
Teaser stehen offen im normalen Fluss. Titelzeilen sind klickbar und scrollen
den zugehörigen Zustand an.

## Assets

Fotos liegen als JPEG (q82) in `assets/img/`. Logo, Sparkle und Pfeil sind ein
Inline-SVG-Sprite oben in `index.html`. Alle fünf Teaser haben ein Foto.

## Veröffentlichen

Liegt auf GitHub Pages: **https://radehaus.github.io/invest-scroll-prototype/**
Passwort: `allianz` (gilt pro Browser-Tab, `sessionStorage`).

Änderungen gehen live mit:

    git add -A && git commit -m "..." && git push

Der Pages-Build braucht danach ein bis zwei Minuten.

### Was das Passwort ist und was nicht

Es hält zufällige Besucher ab, mehr nicht. GitHub Pages liefert statische
Dateien aus, es gibt keinen Server, der etwas prüfen könnte: `index.html`,
das CSS und alle Fotos bleiben per Direkt-URL abrufbar, und das Repo ist
öffentlich (Pages aus privaten Repos gibt es im Free-Plan nicht). Das
Passwort liegt als SHA-256-Digest in `assets/js/gate.js` — das hält es nur
aus dem Blickfeld, ein Wörterbuchangriff hat es sofort.

Falls der Inhalt später wirklich dicht sein muss, gibt es zwei Wege:
die Seite verschlüsselt ausliefern (AES-GCM, entschlüsselt erst im Browser),
oder auf einen Hoster mit echtem serverseitigem Schutz wechseln
(Cloudflare Worker mit Basic Auth, kostenlos).

### Passwort ändern

    printf 'neuespasswort' | shasum -a 256

Den Hash in `assets/js/gate.js` bei `DIGEST` eintragen.
