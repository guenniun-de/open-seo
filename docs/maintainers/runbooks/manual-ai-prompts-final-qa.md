# PR #1: abschließende Qualitätssicherung und Merge-Vorbereitung

Prüfung am 2026-11-03 in der isolierten Cloud-Entwicklungsumgebung. Keine
produktiven Änderungen, kein Merge, kein Deployment und keine Provider-Aufrufe
mit realen API-Zugängen.

## Geprüfter Stand

- Repository: `guenniun-de/open-seo`, PR #1.
- Entwicklungsbranch: `feature/manual-ai-prompts-review`.
- **Tatsächlich getesteter Commit:** `807b1ba97241bb481abf414a004d9e2ab793503b`.
- Zielbranch: `feature/manual-ai-visibility-setup`.
- Geprüfter Zielcommit: `c8f0167afff445744202d70559bc0dfd7d9df60e`.
- `src`-Baum des getesteten Commits: `067dbf8931ed03b22dcd353da52210d05b023c23`.
- Node auf dem Host: `v24.22.1`; pnpm: `10.30.1`.
- Docker: `29.9.2`, lokaler Cloud-Daemon, Storage-Treiber `vfs`, Buildplattform
  `linux/amd64`. Es wurde kein entfernter Docker-Kontext verwendet.

Der nachfolgende Commit fügt ausschließlich diesen Prüfbericht und seinen Link
im Runbook hinzu. Er ändert weder Anwendungscode noch Tests, Lockdatei oder
Dockerfile. Die Ergebnisse beziehen sich ausdrücklich auf den obigen
Anwendungsstand; ein Dokumentationscommit wird nicht als erneut getesteter
Anwendungsstand ausgegeben.

## Merge-Status und konkrete Befunde

Die aktuellen Branches sind konfliktfrei. Ein tatsächlicher Merge wurde nicht
ausgeführt; folgende lesenden Prüfungen bzw. Simulationen wurden ausgeführt:

```sh
git fetch origin \
  refs/heads/feature/manual-ai-visibility-setup:refs/remotes/origin/feature/manual-ai-visibility-setup \
  refs/heads/feature/manual-ai-prompts-review:refs/remotes/origin/feature/manual-ai-prompts-review
git merge-base --is-ancestor origin/feature/manual-ai-visibility-setup HEAD
git merge-tree --write-tree HEAD origin/feature/manual-ai-visibility-setup
git fetch origin refs/pull/1/merge:refs/remotes/origin/pr1-merge
git show -s --format='%H%n%P%n%T' origin/pr1-merge
git rev-parse HEAD^{tree}
```

Ergebnisse:

- Der Zielcommit ist Vorfahr des Quellcommits; der Quellbranch liegt drei
  Anwendungscommits voraus. Kein Konflikt und keine Konfliktauflösung nötig.
- Die Merge-Simulation endet mit Exitcode 0 und dem Baum
  `b2b78e86cc6f4204733974fcb2dcfcc08b1797ea`.
- GitHub stellt den Test-Merge `9b9d6b44d11840353d90b215f077f801e1d48271`
  mit exakt den oben genannten Base-/Head-Eltern bereit. Sein Baum entspricht
  exakt diesem Baum und dem PR-HEAD-Baum.
- Die öffentliche Branch-Seite meldet für den Zielbranch
  `protectedByBranchProtections=false`, `rulesetsPath=null` und
  `mergeQueueEnabled=false`. Die öffentliche Ruleset-Seite liefert
  `rulesets=[]` und `matchingRulesets=[]`.
- Die öffentliche Checks-Seite für `807b1ba` meldet ausdrücklich:
  **“There are no checks for this commit.”** Es sind damit keine fehlgeschlagenen
  Checks sichtbar. Fehlende Checks werden hier nicht als erfolgreiche Checks
  dargestellt. In den öffentlich sichtbaren Regeln sind keine Pflichtchecks
  festgelegt.

Die Seiten `/pull/1`, `/pull/1/checks`, `/branches` und `/rules` wurden über
GitHub selbst gelesen und ihre eingebetteten Metadaten ausgewertet.
Der direkte API-Aufruf `gh api repos/guenniun-de/open-seo/pulls/1` scheitert in
dieser Umgebung weiterhin mit `Forbidden` am Netzwerkzugriff auf
`api.github.com`. Der aktuelle native API-Wert `mergeable` ist deshalb nicht
neu auslesbar. Das früher gemeldete `mergeable: false` ist im aktuellen
Git-Zustand nicht reproduzierbar; seine historische Ursache lässt sich nicht
nachträglich belegen. Sie wird insbesondere nicht ohne Beleg einer
Branch-Protection-Regel oder einem Konflikt zugeschrieben.

**Aktuell kein nachweisbarer technischer Merge-Blocker. Empfehlung:
READY FOR MERGE nach dem ausdrücklich gewünschten abschließenden Review.**
Dies ist keine Merge-Ausführung und keine Produktionsfreigabe. Wenn sich Base
oder Head ändern, sind diese Aussagen erneut zu prüfen.

## Tatsächlich ausgeführte Installation, Tests und Builds

Arbeitsverzeichnis war `/workspace/open-seo`, Arbeitsbaum vor den Prüfungen
sauber auf dem oben genannten Commit. Aktivierung in den Test-Shells:

```sh
export COREPACK_HOME=/workspace/.cache/corepack
export PATH=/workspace/.local/bin:$PATH
pnpm --version
pnpm install --frozen-lockfile
pnpm run types:check
pnpm exec vitest run src/client/layout/AppShell.test.ts \
  src/client/features/ai-visibility \
  src/server/features/ai-visibility/services --maxWorkers=3
pnpm run build
```

| Prüfung                               | Tatsächliches Ergebnis                                                                                                                                                       | Exitcode |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Frozen-Lockfile-Installation          | Lockdatei aktuell, Auflösung übersprungen, vorhandene Abhängigkeiten wiederverwendet; keine Lockdateiänderung                                                                | 0        |
| TypeScript                            | `tsc --noEmit`, keine Fehler                                                                                                                                                 | 0        |
| Relevante Vitest-Suite                | **23 Dateien und 142 Tests bestanden, 0 fehlgeschlagen**, keine als übersprungen gemeldeten Tests                                                                            | 0        |
| Vollständiger Projekt-Build           | Report-Widgets samt eigener Typprüfung, Vite-Client, Haupt-Worker, Audit-Worker und abschließendes `tsc --noEmit` erfolgreich                                                | 0        |
| Vollständiger Standalone-Docker-Build | Build- und Runtime-Stufe erfolgreich; `pnpm build:standalone` einschließlich Client, Server und celld-Paket ausgeführt; gültige Abhängigkeits-/Runtime-Layer wiederverwendet | 0        |
| Zusätzlicher Image-Smoke-Test         | celld 0.5.1, App-Artefakte, lesbare Startskripte und deren Syntax als Benutzer `node` geprüft; kein Netzwerk, keine Volumes                                                  | 0        |

Auszüge der tatsächlich erzeugten Ausgaben:

```text
Lockfile is up to date, resolution step is skipped
Already up to date

Test Files  23 passed (23)
Tests       142 passed (142)

celld 0.5.1
standalone-image-smoke-ok
```

Die vollständige Vitest-Suite mit früher dokumentierten 1.887 Tests wurde in
**diesem** abschließenden Lauf nicht erneut ausgeführt. Diese frühere Zahl wird
nicht als neues Prüfergebnis ausgegeben. GitHub-Actions-Checks wurden weder
erzeugt noch als Ersatz für diese lokalen Ergebnisse ausgegeben.

## Docker-Build: genauer Umfang und Umgebungsanpassungen

Ausgangspunkt war ausschließlich `git archive` des exakten Testcommits, ohne
lokale `.env.local`, `.dev.vars` oder produktive Konfiguration. Die
Repository-Datei `deploy/standalone/Dockerfile` blieb unverändert:

```text
Dockerfile SHA256: 67ac5e113f9f9717af1d612f0f1315b9f87ab0192ff824bb53c2378c57258705
Lockdatei SHA256:  a5c02ed7ee99a84b6fdeab4a417e715c78afac0cbf4cd8d3d348d0b2ce47be4e
```

In der **temporären Kopie** wurden die RUN-Schritte um eine BuildKit-Secret-
Einbindung der öffentlichen Cloud-CA-Kette ergänzt. `NODE_EXTRA_CA_CERTS` und
`CURL_CA_BUNDLE` verweisen nur während dieser Schritte auf
`/run/secrets/proxy_ca`. Die eigentlichen Build-Befehle, gepinnten Images,
Abhängigkeiten und celld-Prüfsummen bleiben unverändert. TLS-, Paket- und
Prüfsummenprüfungen wurden nicht deaktiviert; die CA wird nicht ins Runtime-
Image kopiert.

Ausgeführter vollständiger Build, mit `qa_context` als temporärer Kopie:

```sh
env -u DOCKER_HOST -u DOCKER_CONTEXT -u DOCKER_TLS \
  -u DOCKER_TLS_VERIFY -u DOCKER_CERT_PATH \
  docker --host=unix:///var/run/docker.sock build \
  --platform linux/amd64 --progress=plain \
  --secret id=proxy_ca,src=/etc/ssl/certs/ca-certificates.crt \
  --file "$qa_context/deploy/standalone/Dockerfile" \
  --tag openseo-pr1-final:807b1ba9 "$qa_context"
```

Eine restriktive Shell-umask hatte beim lokalen Entpacken die archivierten
Dateirechte auf `0600` eingeschränkt. Der erste zusätzliche Image-Smoke-Test
scheiterte deshalb mit `EACCES` beim Lesen von `configure.mjs`. Dies wurde nicht
als Anwendungserfolg gewertet. Die Dateien wurden **nur im temporären Kontext**
an die gespeicherten Git-Modi `100644`/`100755` angeglichen; danach wurden der
vollständige Docker-Build und der Smoke-Test erfolgreich wiederholt. Beim
Entpacken eines Archivs ist die umask zu beachten; direktes Weiterreichen von
`git archive` an `docker build` wie im Runbook vermeidet diesen Extraktionsschritt.

Ergebnis des abschließenden Builds:

```text
Lokaler Tag: openseo-pr1-final:807b1ba9
Image-ID: sha256:08db59977c3697d5a1612f2d3513ed0b4579926302b54c788ab2a602a2028270
Plattform: linux/amd64
```

Dies ist eine lokale Image-ID, kein Registry-Digest und kein Deployment.
Der Smoke-Test startete nur einen kurzlebigen Container mit
`--rm --network none --entrypoint sh`, ohne Bind-Mounts oder Volumes. Er prüfte
App-Bundle, Wrangler-Konfiguration, Assets und Migrationen auf Vorhandensein,
führte `celld --version` sowie `node --check` für `configure.mjs` und
`crawl-gateway.mjs` aus und bestätigte das Fehlen von `.dev.vars` im App-Paket
und des CA-Secret-Mounts im Runtime-Image.

## Abschließende Codeprüfung und abgedeckte Invarianten

Die genannten Dateien wurden erneut gelesen; keine notwendige funktionale
Korrektur und kein Konflikt festgestellt:

- `AppShell.tsx` / `AppShell.test.ts`: Providerwarnungen nur auf tatsächlich
  abhängigen Routen bzw. bei aktivem Tracker; GSC/GA4 und Integrationen bleiben
  auch bei fehlendem Schlüssel und Providerstatus-Fehler ohne diese Warnungen.
- `TrackerPromptFields.tsx` / Test: pausierte Tracker erhalten keine Zusage
  automatischer Ausführung; neue Prompts aktivieren keine alten pausierten Prompts.
- `aiVisibilitySetup.ts` / Test: neue manuelle Tracker werden ausschließlich mit
  `enabled=false` und `nextCheckAt=null` persistiert. Kein Run, keine Baseline,
  keine fällige Planung, keine Workflow-Erstellung und kein DataForSEO-Fetch.
  Bestehende Tracker behalten ihre vollständige gespeicherte Konfiguration.
- `useTrackerSetupSave` / Test: selbst eine widersprüchliche
  `scheduleWeekly=true`-Eingabe kann bei `startPaused=true` kein Scheduling aufrufen.
- `aiPromptSuggestions` / Test: deutsche Entwürfe und `openrouter/free`-Modellauswahl
  werden mit **simuliertem** OpenRouter-Modell geprüft. Das ist kein Live-Aufruf.
- Das Runbook wurde auf Trennung von Generierung, Speicherung und Datenerhebung,
  sichere Build-Kontexte, Backup und Rollback geprüft. OAuth-Code wurde nicht
  verändert. Es wird keine DataForSEO-Pflicht eingeführt.

## Verbleibende Warnungen und Prüfungen vor Deployment

- pnpm meldet die gemäß Repository-Konfiguration nicht freigegebenen Install-
  Skripte von `@mongodb-js/zstd`, `core-js-pure`, `core-js`, `msgpackr-extract`
  und `node-liblzma`. Diese wurden nicht pauschal freigeschaltet. Die angeforderten
  Tests und Builds sind mit der vorhandenen Freigabeliste erfolgreich.
- Wrangler meldet die vorhandenen Proxy-Variablen. BuildKit warnt heuristisch
  wegen des Namens `AUTH_MODE` in `ENV AUTH_MODE=password`; der Wert bezeichnet
  den Authentifizierungsmodus und enthält kein Passwort/API-Secret.
- Keine ausdrücklich bereitgestellten OpenRouter- oder Google-Testzugänge in
  dieser Umgebung. **Keine echten Provider-Aufrufe und keine Browser-E2E-Tests
  ausgeführt.** Die UI-Tests verwenden serverseitiges React-Rendering und
  simulierte Serverfunktionen; die Service-Persistenztests verwenden echte
  SQLite-Migrationen und Repository-Abfragen, aber simulierte Providerzugriffe.
- Vor produktivem Deployment bleiben echte Staging-Prüfungen offen:
  OpenRouter-Generierung → Bearbeiten → Review → Speichern → Reload, unveränderte
  Run-Anzahl/kein Schedulerauftrag sowie GSC-/GA4-Abfragen mit Testkonten.
  Zusätzlich ist der komplette Standalone-Dienst mit isoliertem S3-Testzustand,
  Initialisierung und Healthcheck zu prüfen. Der Image-Smoke-Test ersetzt dies nicht.
- ARM64, Postgres, zusätzliche Website-/BadSEO-Projekte und produktive
  Infrastruktur wurden in diesem Auftrag nicht geprüft oder verändert.
- Das vorhandene [Runbook](./manual-ai-prompts.md) bleibt für Backup,
  Freigabe, Image-Pinning, Deployment und Rollback maßgeblich. Kein produktiver
  Container, kein Volume, kein API-Key und keine Google-OAuth-Verbindung wurden
  angefasst. Der Merge erfordert weiterhin die ausdrückliche Freigabe des Nutzers.

## Veröffentlichung des Abschlusskommentars

Der Prüfbericht wird im bestehenden PR-Branch versioniert. Der zusätzliche
GitHub-Abschlusskommentar benötigt Zugriff auf `api.github.com`; diese Domain ist
bereits im Umgebungsentwurf vorgesehen, aber in der laufenden Umgebung noch
nicht freigeschaltet. API-Reads liefern `Forbidden`; die öffentliche PR-Ansicht
meldet `canComment=false`. Ein vorbereiteter Kommentar wird nicht als
veröffentlicht dargestellt. Änderungen an Branch-Protection, Credentials,
Workflow-Dateien oder der Merge-Schaltfläche sind dafür nicht zulässig und
wurden nicht vorgenommen.
