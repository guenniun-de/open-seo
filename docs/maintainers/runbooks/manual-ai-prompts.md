# Manuelle AI-Prompts im Fork

Der [abschließende Prüfbericht für PR #1](./manual-ai-prompts-final-qa.md) nennt
den exakt getesteten Commit, die tatsächlich ausgeführten Befehle und den
aktuellen technischen Merge-Befund.

## Verhalten und Grenzen

Der manuelle Einstieg unter AI Visibility → „Manage prompts without tracking“
verwendet OpenRouter für bearbeitbare Entwürfe. Im Editor können Texte auch von Hand eingegeben werden; der bestehende
Zugang zum AI-Visibility-Bereich verlangt derzeit dennoch eine OpenRouter-
Konfiguration. „Generate“ erzeugt nur Entwürfe; erst „Review
prompts“ und „Save prompts without tracking“ speichern sie dauerhaft.

Ein neuer manueller Tracker hat `enabled=false` und `nextCheckAt=null`. Speichern
startet weder Baseline noch Workflow noch DataForSEO-Aufruf. Die Bestätigung
zeigt keine hypothetischen Tracking-Kosten und bietet keine Tracking-Aktion.
Der Speicher-Hook verhindert Scheduling auch bei widersprüchlichen UI-Eingaben.
Die Tracking-Kostenschätzung entfällt in diesem Ablauf.

Provider-Hinweise folgen der tatsächlich ausgeführten Funktion: Im manuellen
Editor und Review erscheint „Prompts werden über OpenRouter generiert und ohne
automatisches Tracking gespeichert.“ statt einer DataForSEO-Setup-Warnung.
Die globalen Banner und das Setup-Modal stammen aus `AppShell.tsx`
(`AuthenticatedAppLayout` → `SeoApiStatusBanners` / `MissingSeoSetupModal` in
`AppShellParts.tsx`). Statusprüfung, Banner und Setup-Modal werden nur für die
abhängigen Bereiche Keyword Research, Domain Overview, Backlinks, Rank Tracking,
Local SEO, Brand Lookup, Prompt Explorer und Prompt Research aktiviert. Auf
Prompt-Verwaltungs- und Detailseiten gelten sie nur bei aktivem Tracker.
GSC-/GA4-Auswertungen unter `search-performance`, Integrationen, Einstellungen,
Reports, Kontext, Dashboard, Site Audit und SAM haben keine globale DataForSEO-
Voraussetzung. Einzelne optionale Funktionen können weiterhin eigene Provider-
Voraussetzungen prüfen. Solange der Tracker geladen
wird, wird dort keine Provider-Voraussetzung unterstellt. Manuelle Dialoge
unterdrücken die globalen Hinweise während ihrer Lebensdauer zusätzlich über
einen React-Kontext, auch beim Laden oder bei Fehlern. Die Auswahl des manuellen
Einstiegs ersetzt die kostenpflichtige Einrichtungsansicht. Es wird kein CSS zum
Verstecken von Warnungen verwendet.

Bei aktiven Trackern sowie auf Keyword-, Prompt-Research- und Prompt-Explorer-
Seiten bleiben die globalen Hinweise erhalten. Tracking-Einstellungen zeigen
weiterhin die lokale DataForSEO-Warnung, wenn der Schlüssel fehlt. Bereits
konfigurierte DataForSEO-Installationen behalten ihren bisherigen Ablauf. Ohne Provider wird auch
beim späteren Hinzufügen von Prompts zu einem pausierten Tracker dieser Ablauf
verwendet. Der nicht angeschlossene Tracking-Einstellungen-Link im manuellen
Einstieg entfällt.

Die vorhandene Prompt-Tracking-Seite zeigt gespeicherte Prompts nach dem
Speichern und Neuladen an. Dort lassen sie sich bearbeiten, Themen zuordnen und
archivieren. Eine Textänderung archiviert wie bisher die alte Fassung und legt
eine neue an; vorhandene Antworten behalten ihren historischen Wortlaut.
Ohne DataForSEO bleiben „Run now“ und das Aktivieren von Tracking gesperrt.
Es entstehen keine Antworten, Erwähnungen, Zitate oder Sichtbarkeitsmetriken.
OpenRouter-Generierung kann unabhängig davon Gebühren bzw. Rate Limits haben;
`openrouter/free` garantiert keine Verfügbarkeit oder dauerhaft gleiche Modelle.

`startPaused` gilt nur beim erstmaligen Anlegen. Bestehende aktive oder pausierte
Tracker behalten ihren Zeitplan. Insbesondere pausiert ein manueller Aufruf
keinen bereits aktiven Tracker (auch nicht bei paralleler Einrichtung in einem
anderen Tab). Vorhandene aktive Zeitpläne müssen bei Bedarf ausdrücklich in den
Tracking-Einstellungen pausiert werden. Die Einrichtung mit DataForSEO, die
explizite Aktivierung inklusive Baseline und die regulären Scheduler bleiben
unverändert. GSC und GA4 OAuth werden nicht geändert. Keine SQL-Migration wird
für diese Änderung hinzugefügt.

## Umgebungsvariablen

- `OPENROUTER_API_KEY`: für die Generierung; nur über den vorhandenen sicheren
  Laufzeit-Konfigurationsweg setzen, niemals ins Image oder Repository schreiben.
- `OPENROUTER_MODEL=openrouter/free`: vorhandene Modellauswahl beibehalten oder
  bewusst ein anderes OpenRouter-Modell wählen.
- `DATAFORSEO_API_KEY`: für manuelles Generieren und Speichern nicht erforderlich.
  Bestehende Werte anderer Installationen nicht entfernen. Erst für kostenpflichtige
  Erfassung erforderlich.
- Projektland und Sprache bestimmen die Generierung. Für deutsche Fragen das
  Projekt auf Deutsch einstellen; `startPaused` ändert diese Einstellungen nicht.
- Authentifizierung, `BETTER_AUTH_SECRET`, Google-OAuth-Werte und bestehende
  Speicher-/Datenbankkonfiguration unverändert übernehmen. `local_noauth` ist
  ausschließlich hinter einer vertrauenswürdigen Zugriffskontrolle geeignet.

OpenRouter muss vom App-Container über HTTPS erreichbar sein. Für die lokale
Entwicklung liest die App `.env.local`; für Docker die vorhandene externe
Laufzeitkonfiguration verwenden. Keine produktiven Dateien in den Build-Kontext
kopieren. Für den Build ausschließlich den versionierten Kontext über `git archive`
verwenden und die Dockerfile-spezifischen Ignore-Dateien unter `deploy/docker/` bzw.
`deploy/standalone/` beachten. Keine Secrets als
Build-Argumente übergeben und kein `docker compose config` mit Secrets in Logs
oder PRs veröffentlichen.

## Prüfungen vor Freigabe

Im Checkout mit der gepinnten pnpm-Version:

```sh
pnpm install --frozen-lockfile
pnpm run types:check
pnpm exec vitest run src/client/layout/AppShell.test.ts src/client/features/ai-visibility src/server/features/ai-visibility/services --maxWorkers=3
pnpm run build
```

Zusätzlich in einer isolierten Staging-Installation mit leerer DataForSEO-
Konfiguration und eigenem Testprojekt prüfen:

1. Deutsche Prompts generieren, verändern, prüfen und manuell speichern.
2. Keine Tracking-Aktion und keine Tracking-Preise im manuellen Review; während
   des Speicherns keine Doppelbedienung. Fehler anzeigen und erneutes Speichern
   ermöglichen, ohne Tracking zu aktivieren.
3. Neu laden, Prompts bearbeiten, erneut laden. Healthcheck und Logs auf Fehler
   prüfen. Tracker deaktiviert, nächster Check leer, keine neuen Runs.
4. Mit separatem DataForSEO-Testzugang den normalen Review und die ausdrücklich
   bestätigte Aktivierung prüfen. Dies kann Gebühren verursachen und gehört
   nicht zum automatischen Testlauf.

Vitest verwendet für Generierung einen simulierten OpenRouter-Aufruf; echte
Provider-Gebühren werden dabei nicht ausgelöst. Persistenz- und Scheduler-Tests
nutzen SQLite mit den echten Migrationen und Repository-Abfragen. Postgres wird
nicht in diesen Tests gestartet; die Änderung fügt keine Dialekt-spezifische
Abfrage hinzu.

## Eigenes Docker-Image bauen

Erst nach Code-Review einen vollständigen Commit als unveränderlichen Image-Tag
verwenden. Auf einer Build-Maschine aus einem sauberen Checkout ohne lokale
Secrets bauen, nicht aus dem produktiven Konfigurationsverzeichnis. Aktuelle
Installation und Runtime vorab feststellen: Legacy-Worker-Image und neues
Standalone-Image haben verschiedene Speicherformate. Bei diesem Feature die
Runtime nicht nebenbei wechseln.

Legacy (`deploy/docker/Dockerfile`, Volume unter `/app/.wrangler`):

```sh
git rev-parse HEAD
git archive HEAD | docker build -f deploy/docker/Dockerfile -t registry.example.com/guenniun/open-seo:COMMIT -
docker push registry.example.com/guenniun/open-seo:COMMIT
```

Standalone (celld, nur für bereits darauf laufende Installationen):

```sh
git archive HEAD | docker build -f deploy/standalone/Dockerfile -t registry.example.com/guenniun/open-seo-standalone:COMMIT -
docker push registry.example.com/guenniun/open-seo-standalone:COMMIT
```

`COMMIT` und die Beispiel-Registry ersetzen. Image in Staging mit derselben
Runtime und einer **Kopie** des Backups prüfen. Niemals die produktiven Volumes
an die Staging-Instanz hängen. Nach dem Push den Image-Digest festhalten und für
das Deployment pinnen. Der Docker-Build und ein echter OpenRouter-Aufruf sind
separate Prüfungen; TypeScript/Vitest belegen sie nicht.

## Backup, Deployment und Rollback

Diese Schritte sind eine Anleitung für die spätere Freigabe, kein automatischer
Deployment-Auftrag.

1. Aktuellen Commit, Image-Digest, Compose-Dateien, Auth-Modus, Volume-Namen und
   Datenbank-/Speicher-Backend inventarisieren. Laufzeitkonfiguration mit Secrets
   separat verschlüsselt sichern, nicht im Repository. Altes Image verfügbar
   halten. Restore vorab in isolierter Umgebung testen.
2. Vor dem Austausch konsistentes Backup erstellen: Schreibzugriffe und App
   stoppen, dann das vollständige persistente Volume sichern, nicht nur einzelne
   SQLite-Dateien. Bei Legacy gehört der komplette `.wrangler`-Zustand inklusive
   SQLite/WAL/SHM und KV/DO-Daten dazu. Bei Postgres zusätzlich einen konsistenten
   Datenbankdump erstellen. Bei Standalone das zum alten Image gehörende
   [Backup-Verfahren](../../../docs/SELF_HOSTING_DOCKER.md) für S3-Zustand,
   Runtime- und Konfigurationsvolumes verwenden. Backup-Ziel außerhalb der
   produktiven Volumes und mit restriktiven Berechtigungen wählen. Keine
   `down -v`-/Volume-Löschbefehle verwenden.
3. In der **bestehenden** Compose-Konfiguration ausschließlich das App-Image
   ersetzen: Legacy `OPEN_SEO_IMAGE`, Standalone `OPENSEO_IMAGE` (für alle
   App-Dienste einschließlich init/crawl-gateway). Ports, Volumes, Auth und
   OAuth-Konfiguration beibehalten. Exakte Compose-Dateien und Projektname des
   Betriebs verwenden. Bei Legacy beispielsweise nach Freigabe
   `docker compose pull open-seo` und `docker compose up -d --no-deps open-seo`.
   Standalone nach dessen bestehendem Update-Verfahren einschließlich init
   aktualisieren. Keine Migration zwischen den beiden Laufzeiten durchführen.
4. Healthcheck, Logs und die manuellen Staging-Prüfschritte wiederholen. Prüfen,
   dass keine neuen Runs entstanden sind. Bestehende aktivierte Tracker laufen
   weiterhin nach ihrem vorhandenen Zeitplan.
5. Bei Fehlern App stoppen und den alten Image-Digest wieder einsetzen. Falls
   Startmigrationen oder Schreibzugriffe den Datenbestand verändert haben,
   konsistentes Backup zusammen mit altem Image und passender Konfiguration
   wiederherstellen. Ein Restore verwirft Änderungen seit dem Backup; diesen
   Datenverlust vorab berücksichtigen. Anschließend erneut Healthcheck und
   Lesetest ausführen. Nicht blind ein altes Image gegen neu migrierte Daten
   starten, auch wenn dieses Feature selbst keine Migration enthält.

## Neue Upstream-Versionen übernehmen

Upstream zunächst in einen eigenen Integrationsbranch übernehmen und den
Fork-Feature-Commit darauf rebasen oder mergen. Besonders `TrackerEditor`,
`TrackerSetupReview`, `useTrackerSetupSave`, Setup-Gate, Save-Schema und
`saveTracker` auf geänderte Verträge prüfen. Die Tests für deaktiviertes Anlegen,
keine Scheduling-Aufrufe und Erhalt bestehender Zeitpläne müssen weiter bestehen.
Anschließend Typprüfung, relevante Tests, Image-Build und Staging mit wieder-
hergestelltem Backup ausführen. Neu auftauchende Migrationen vor dem Upgrade
bewerten. Erst nach Review einen neuen Image-Digest ausrollen; den vorherigen
Tag und das Backup für den Rollback aufbewahren.

## Review-Nachweise für PR #1 (2026-11-03)

Die Review-Korrekturen auf `feature/manual-ai-prompts-review` betreffen:

- Globale DataForSEO-Hinweise werden nach tatsächlicher Funktionsabhängigkeit
  aktiviert. GSC/GA4 (`search-performance`), Integrationen und allgemeine Seiten
  bleiben auch bei fehlendem Schlüssel oder fehlgeschlagener Providerstatus-
  Prüfung ohne DataForSEO-Banner und -Setup-Modal. Die abhängigen SEO-Bereiche
  behalten ihre Hinweise. Google-OAuth-Code und Verbindungen werden nicht geändert.
- Bei vollständig pausierten Themen beschreibt der Editor neue Prompts nur bei
  aktivem Tracker als Teil künftiger geplanter Checks. Bei deaktiviertem Tracker
  nennt er ausdrücklich Speicherung ohne automatische Erfassung. Bestehende
  pausierte Prompts werden durch das Hinzufügen nicht aktiviert.
- Tests bestätigen, dass manuelles Speichern keine Workflow-Erstellung, keine
  Runs und keine fällige Planung erzeugt. Für vorhandene Tracker wird die
  gesamte gespeicherte Tracker-Konfiguration verglichen, einschließlich eines
  individuellen pausierten Monatsplans, des nächsten Checks und der Engines.

Tatsächlich lokal in dieser Cloud-Entwicklungsumgebung ausgeführt:

| Prüfung                                                              | Ergebnis                                                                                                                           |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm run types:check`                                               | Erfolgreich                                                                                                                        |
| Relevante Vitest-Suite aus dem Abschnitt oben                        | 23 Dateien, 142 Tests bestanden                                                                                                    |
| `pnpm run test:ci --maxWorkers=3`                                    | 275 Dateien, 1.887 Tests bestanden; einschließlich vorhandener GSC-/GA4-Tests                                                      |
| Typbewusster Oxlint für geänderte TypeScript-Dateien                 | Keine Fehler oder Warnungen                                                                                                        |
| Vollständiger Standalone-Docker-Build, `linux/amd64`                 | Erfolgreich bis zum Runtime-Image; beide Stufen, Widgets, Client, Server und celld-Paket gebaut                                    |
| Image-Smoke-Test als Benutzer `node`, ohne Netzwerk und ohne Volumes | celld 0.5.1, App-Artefakte und lesbare Startskripte geprüft; Syntaxprüfung von `configure.mjs` und `crawl-gateway.mjs` erfolgreich |

Das lokale Testimage heißt `openseo-pr1-review:local`; seine Image-ID lautet
`sha256:08db59977c3697d5a1612f2d3513ed0b4579926302b54c788ab2a602a2028270`.
Dies ist eine lokale Image-ID, kein veröffentlichter Registry-Digest. Es wurde
kein Image in eine Registry gepusht und keine Anwendung ausgerollt.

Der unveränderte Build scheiterte zunächst beim Corepack-Download in der
Cloud-Proxy-Umgebung. Für den erfolgreichen Build wurde nur in einer temporären
Dockerfile-Kopie außerhalb des Repositorys die vorhandene öffentliche CA-Kette
als BuildKit-Secret eingebunden: `NODE_EXTRA_CA_CERTS` und `CURL_CA_BUNDLE`
verwiesen während der RUN-Schritte auf `/run/secrets/proxy_ca`. Die produktive
Dockerfile blieb unverändert; TLS-, Paket- und celld-Prüfsummenprüfungen blieben
aktiv. Die CA-Datei wurde nicht ins Runtime-Image übernommen.

Ein erster Image-Smoke-Test deckte außerdem restriktive Cloud-Checkout-Modi
(`0600`) in einem aus Arbeitsdateien erzeugten temporären Kontext auf. Nach
Angleichung an die gespeicherten Git-Modi (`100644`/`100755`) wurden der
**vollständige Build und der Smoke-Test erneut erfolgreich** ausgeführt. Deshalb
für eigene Builds den oben gezeigten `git archive`-Kontext verwenden: Er
übernimmt die Git-Dateimodi und enthält keine unversionierten lokalen Secrets.
Der BuildKit-Hinweis zu `ENV AUTH_MODE=password` ist eine heuristische Warnung
zum Variablennamen; der Wert ist der Authentifizierungsmodus, kein Passwort.

Nicht nachgewiesen und vor produktiver Freigabe weiterhin in isoliertem Staging
zu erledigen: echter OpenRouter-Durchlauf „Generieren → Bearbeiten → Review →
Speichern → Reload“, Prüfung unveränderter Run-Anzahl sowie echte GSC-/GA4-
Abfragen mit verbundenen Testkonten. In dieser Cloud-Umgebung sind weder
OpenRouter- noch Google-Testzugänge konfiguriert. Die Generierung ist in Vitest
simuliert, während Persistenz und Scheduling mit echten SQLite-Abfragen geprüft
werden. Der Image-Smoke-Test ist kein vollständiger Standalone-Dienstetest mit
S3-Speicher, Healthcheck und Browser. ARM64, Postgres und GitHub-Actions-Statuschecks
wurden für diese Review-Korrekturen nicht separat verifiziert.

Die Backup-, Freigabe-, Deployment- und Rollback-Schritte oben bleiben
verbindlich. Insbesondere ersetzen lokale Testergebnisse weder das Review noch
den Staging-Test. Keine produktiven Container, Volumes, Zugangsdaten oder
OAuth-Verbindungen wurden für diese Prüfungen angefasst.
