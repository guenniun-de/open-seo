# Manuelle AI-Prompts im Fork

## Verhalten und Grenzen

Der manuelle Einstieg unter AI Visibility → „Manage prompts without tracking“
verwendet OpenRouter für bearbeitbare Entwürfe. Eigene Texte können auch ohne
OpenRouter eingegeben werden. „Generate“ erzeugt nur Entwürfe; erst „Review
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
`AppShellParts.tsx`). Ihre Statusprüfung und Anzeige werden auf Prompt-Verwaltungs-
und Detailseiten ohne aktiven Tracker ausgenommen. Solange der Tracker geladen
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
pnpm exec vitest run src/client/features/ai-visibility src/server/features/ai-visibility/services --maxWorkers=3
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
