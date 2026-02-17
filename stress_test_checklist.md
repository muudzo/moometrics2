## MooMetrics Mobile Stress Testing Checklist (48 Hours)

### 1. Objectives & Scope

- **Goal**: Validate MooMetrics behavior on **low-memory Android devices under poor network conditions** over a continuous **48-hour period**, with emphasis on:
  - **Offline animal recording** and **delayed synchronization** via `offline_service`.
  - **Data integrity** (no loss, no unintended duplication, predictable conflict handling).
  - **Resilience** to intermittent connectivity (including **Airplane mode toggling** triggering the `online` listener in `AnimalContext`).
  - **Stability and performance** (cold start, memory usage, sync duration, crash/ANR behavior).

---

### 2. Test Environment Configuration

- **Devices**
  - **Android OS versions**: 10, 11, 12, 13, 14 (minimum: cover at least 10 + 13 or 14).
  - **RAM**: 2–3 GB class devices (or emulator profiles configured to 2–3 GB).
  - **Storage**: Ensure at least 2 GB free before test start.
  - **Battery**: Run at least one device on battery only to observe power-related throttling; others may be on power but allow thermal buildup.

- **App Configuration**
  - **Build**: Latest production-equivalent build (same backend, feature flags, and tracking as production).
  - **Logging**:
    - Enable client logging to include:
      - Offline queue events (`enqueueMutation`, `attemptSync`, `processMutation` outcomes).
      - Network state changes (especially `window.addEventListener('online', ...)` firing).
    - Ensure logs include **timestamps** and **mutation IDs** where possible.
  - **Analytics / Crash Reporting**:
    - Verify `Analytics` and `Crashlytics` are pointing to test environments (where applicable).
    - Confirm visibility of:
      - `sync_success`, `queue_conflict_detected`, `sync_failed` events from `offline_service`.
      - `animal_added`, `animal_updated` events from `AnimalContext`.

- **Backend & Data**
  - Use a **stable backend environment** with:
    - Realistic farm and animal data sets.
    - Conflict scenarios enabled (e.g., edits from another client/API to trigger **409 conflicts**).
  - Ensure **authentication** is functional; `user.username` should be present for proper `Analytics.identifyUser`.

---

### 3. Network Condition Profiles

Use Android Emulator network settings, device lab tools, or an on-device proxy (e.g., Charles, Proxyman) to emulate:

- **Profile N1 – Good 4G Baseline**
  - Bandwidth: ~10–20 Mbps down, 5–10 Mbps up.
  - Latency: 30–60 ms.
  - Packet loss: 0–0.5%.
  - Purpose: Baseline performance and stability.

- **Profile N2 – 3G / HSPA**
  - Bandwidth: 1–3 Mbps down, 0.5–1 Mbps up.
  - Latency: 150–250 ms.
  - Packet loss: 1–2%.
  - Purpose: Primary **realistic field** profile.

- **Profile N3 – 2G / GPRS**
  - Bandwidth: 0.05–0.2 Mbps down, 0.02–0.1 Mbps up.
  - Latency: 400–800 ms.
  - Packet loss: 2–5%.
  - Purpose: Worst-case but realistic low bandwidth.

- **Profile N4 – Flaky / Intermittent**
  - Latency: 300–600 ms variable.
  - Packet loss: 5–10% bursts; random complete drops for 10–60 seconds.
  - Purpose: Stress **retryable** vs **non-retryable** error paths and queue behavior.

- **Profile N5 – Offline / Airplane Mode**
  - Device in **Airplane mode** or network disabled.
  - Periodic toggling to **online** to ensure `window.addEventListener('online', handleOnline)` in `AnimalContext` fires and invokes `syncData()` → `offlineService.attemptSync()`.

---

### 4. Key Metrics & Measurement Methods

- **Cold Start Time**
  - Definition: Time from tapping app icon to first usable **Animals list / dashboard** being interactive.
  - Measurement:
    - Use `adb shell am start -W` to measure `ThisTime` and `TotalTime`.
    - Cross-check using Android Studio Profiler or on-device video capture with timestamps.

- **Memory Usage**
  - Definition: Resident memory (PSS) and heap usage under:
    - Idle conditions.
    - Continuous offline recording.
    - During and after large sync operations.
  - Measurement:
    - Android Studio Profiler (Memory).
    - `adb shell dumpsys meminfo <app_package>` snapshots every 2–4 hours.

- **Sync Duration**
  - Definition: Time from network becoming **online** (or manual sync trigger) to:
    - Offline queue emptied (`getQueue()` length near zero).
    - Local data and server data converging for animals (no pending mutations).
  - Measurement:
    - Log timestamps at:
      - Enqueue (`enqueueMutation`).
      - Sync start (`attemptSync` log).
      - Per-mutation result (`processMutation` results, `sync_success`).
    - Measure wall-clock time for large batches (e.g., 100–500 mutations).

- **Crash / ANR Rate**
  - Definition: Number of app crashes, unhandled exceptions, and ANRs during the 48-hour window.
  - Measurement:
    - `Crashlytics` dashboard.
    - `adb logcat` filtered by app process.
    - Android Studio Run/Logcat for emulator sessions.

- **Data Integrity**
  - Definition:
    - No lost animal records.
    - No unintended duplicates from retries.
    - Predictable handling of **409 conflicts** (server-authoritative behavior).
  - Measurement:
    - Compare:
      - Local `animals` state vs. backend records at checkpoints.
      - Queue length and log events (`queue_conflict_detected`, `sync_failed`) vs. expected outcomes.

---

### 5. 48-Hour Stress Test Schedule (High-Level)

> All times are relative to **T0 = test start**. For each block, record **network profile**, **device**, **build**, and whether on **battery or power**.

- **Block 1: T0–T+2h – Baseline Usage (N1 Good 4G)**
  - [ ] Install/update app, clear previous data.
  - [ ] Perform 10–20 **online** animal CRUD operations:
    - Add, update, delete animals across multiple types and health statuses.
  - [ ] Measure **cold start** (5 runs).
  - [ ] Capture **baseline memory** via `dumpsys meminfo`.

- **Block 2: T+2h–T+6h – Moderate Offline Recording (N2 3G → N5 Offline)**
  - [ ] Start in N2, navigate to animal recording.
  - [ ] Switch to **Airplane mode (N5)**; confirm `navigator.onLine` is false.
  - [ ] Record 50–100 new animals offline over 4 hours:
    - Mix ADD and UPDATE (e.g., update health status, vaccination, notes).
  - [ ] Periodically (every ~30 min) **kill and relaunch** the app to:
    - Validate `loadInitialData()` restoring `animals` from IndexedDB via `offlineService.getData`.
    - Observe cold start and memory.

- **Block 3: T+6h–T+10h – Flaky Network Sync (N4 Flaky)**
  - [ ] Toggle Airplane mode OFF; enable N4.
  - [ ] Observe logs for:
    - `Network restored. Triggering sync...` (from `handleOnline` in `AnimalContext`).
    - `Attempting to sync X mutations...` from `offlineService.attemptSync`.
  - [ ] Allow app to remain in foreground for at least 1 hour of active sync attempts.
  - [ ] Intentionally move app to **background and foreground** several times to ensure sync continues when online.
  - [ ] Capture **sync duration** for the offline queue (expected: all ADD/UPDATE/DELETE processed or appropriately failed).

- **Block 4: T+10h–T+18h – Heavy Mixed Usage (N2 / N3 / N4 Rotation)**
  - [ ] Rotate profiles every hour: N2 → N3 → N4 → N2.
  - [ ] Perform continuous:
    - Animal ADD/UPDATE/DELETE (5–10 per hour).
    - Navigation through different screens.
  - [ ] Introduce **backend edits** (from another client or admin UI) on subset of animals to trigger **409 conflicts**:
    - Verify `queue_conflict_detected` events and that corresponding local mutations are discarded.
  - [ ] Take **memory snapshots** every 2 hours.

- **Block 5: T+18h–T+24h – Overnight Idle (N2 Stable)**
  - [ ] Leave app **in background** with N2 network.
  - [ ] At midway (~T+21h), bring app briefly to foreground:
    - Confirm app is still responsive.
    - Check for pending sync work (queue size, logs).
  - [ ] At T+24h, perform:
    - Cold start measurement.
    - Memory snapshot.

- **Block 6: T+24h–T+32h – Intensive Offline Recording (N5 Offline)**
  - [ ] Switch to **Airplane mode**.
  - [ ] Over 8 hours, record 150–300 animals:
    - High-frequency entries (every 1–2 minutes).
    - Frequent updates to existing entries (e.g., health status, notes).
  - [ ] Periodically:
    - Force-stop the app and relaunch.
    - Reboot the device once.
  - [ ] Log perceived performance (lag, UI freezes).

- **Block 7: T+32h–T+40h – Bulk Sync Recovery (N3 then N2)**
  - [ ] Turn **Airplane mode OFF**, begin with N3, then switch to N2 after 1–2 hours.
  - [ ] Observe:
    - Time to start syncing after going online.
    - Whether any UI is blocked by network operations.
  - [ ] Verify:
    - All queued mutations are processed (queue length eventually zero or stable).
    - No duplicate animal records created.
    - Conflict handling for animals modified server-side during offline period.

- **Block 8: T+40h–T+48h – Stability Wrap-Up (N2 / N1)**
  - [ ] Run final 20–30 CRUD operations under N2 and N1.
  - [ ] Re-measure **cold start** (5 runs).
  - [ ] Capture final **memory snapshot** and verify no monotonic growth compared to early test.
  - [ ] Export final logs and Crashlytics data for analysis.

---

### 6. Structured Test Matrix – Offline Animal Recording & Sync

> Use this table as a checklist. Each row represents a **scenario** combining offline usage, sync, and conflict behavior.

| ID | Network Profile | Precondition | Actions (AnimalContext / offline_service) | Expected Result | Metrics / Evidence | PASS/FAIL |
|----|-----------------|-------------|-------------------------------------------|-----------------|--------------------|-----------|
| M1 | N5 → N2        | Empty DB    | Offline ADD 10 animals, go online         | All 10 synced successfully, no duplicates; `sync_success` events logged, queue empties | Queue length before/after; server list; logs | [ ] |
| M2 | N5 → N3        | Some animals exist on server | Offline ADD 20 animals, then UPDATE 5 existing ones, then go online | All mutations applied in **enqueue order**; server state matches local expectations | Compare local vs server; mutation timestamps | [ ] |
| M3 | N5 → N4        | Concurrent remote edits to 5 animals | Offline UPDATE those 5 animals, go online under flaky network | For conflicts, local mutations discarded as per 409 handling; `queue_conflict_detected` events present; no infinite retries | Logs (`queue_conflict_detected`), server data, queue length | [ ] |
| M4 | N5 → N2        | 100+ mutations queued | Toggle online; allow `attemptSync` to run fully | All non-conflict, non-400 mutations eventually succeed; retryable failures cause temporary pause but resume on next `attemptSync` | Logs (`sync_failed` with `retryable_failure`), observed retries | [ ] |
| M5 | N5 → N4        | 30 DELETE mutations queued | Offline DELETE, go online under flaky network | Deletions applied without leaving ghost entries; non-retryable errors removed from queue with logged error | Server list; queue length; error logs | [ ] |
| M6 | N2 → N5 → N2   | App backgrounded during sync | Begin sync, then go offline, then back online while app is backgrounded and then foregrounded | Queue processing resumes when connection is restored and app is foregrounded; no crashes/ANRs | Logs around `attemptSync`; Crashlytics; UI behavior | [ ] |
| M7 | N5 → N2        | Device reboot while offline mutations exist | Queue mutations, reboot, reopen app, go online | Offline queue preserved across reboot; data restored by `loadInitialData`; sync proceeds without data loss | Queue size pre/post reboot; server comparison | [ ] |
| M8 | N2 / N3        | Long-running session (24h+) | Continuous ADD/UPDATE every 10–15 minutes | No unbounded memory growth; no degradation in sync times; zero crashes | Memory snapshots; sync duration over time | [ ] |

---

### 7. PASS / FAIL Criteria

- **Cold Start**
  - **PASS**:
    - On low-memory devices under N1/N2, median cold start \(T_{cold}\) ≤ **3 seconds**; worst-case ≤ **5 seconds**.
    - Under N3/N4, core screens (animal list/entry) still render without blocking on network.
  - **FAIL**:
    - Median \(T_{cold}\) > **5 seconds** or any consistent startup > **8 seconds** on low-memory targets.

- **Memory Usage**
  - **PASS**:
    - No OOMs or repeated GC thrashing.
    - Long session (≥ 24 hours) shows **no monotonic growth** exceeding +25% of baseline PSS.
  - **FAIL**:
    - Any OOM crash or repeated ANRs attributed to memory.
    - Memory grows steadily across snapshots without plateau.

- **Sync Behavior**
  - **PASS**:
    - For queues of up to **300 mutations** under N2/N3, full sync completes within **10 minutes** of stable connectivity.
    - Retryable errors (`sync_failed` with `retryable_failure`) do not block subsequent successful mutations indefinitely (i.e., queue drains or stabilizes upon next good connection).
  - **FAIL**:
    - Queue remains non-empty and **stuck** for > **30 minutes** under good network without operator intervention.
    - Sync operations consistently block main UI thread, causing visible freezes (> 1 second).

- **Data Integrity**
  - **PASS**:
    - No confirmed **lost** animal records after sync.
    - No **unintended duplicates** due to retries.
    - Conflict handling conforms to design: **server authoritative** on 409 (local mutation discarded, user data refreshed).
  - **FAIL**:
    - Any confirmed data loss, misapplied mutation, or duplicate creation attributable to sync logic.

- **Stability**
  - **PASS**:
    - **0 crashes** or ANRs from normal intended use flows in the 48-hour window.
  - **FAIL**:
    - Any reproducible crash or ANR triggered by typical user flows (animal recording, viewing lists, syncing).

---

### 8. Immediate STOP-SHIP Conditions

If any of the following are observed during the 48-hour test, **stop the release** and file **P0** issues:

- **Data Loss / Corruption**
  - [ ] Recorded animals present locally never appear on the server after multiple successful sync attempts.
  - [ ] Animals become **corrupted** (e.g., wrong health status, wrong tag number) due to ordering or conflict issues.
  - [ ] Deleting animals results in inconsistent state (e.g., ghost entries, partial deletion).

- **Sync Deadlocks / Stalls**
  - [ ] Sync queue remains non-empty and **never progresses** despite stable N1/N2 connectivity for > 30 minutes.
  - [ ] Repeated `sync_failed` events with no recovery path until manual intervention (e.g., uninstall).

- **Crashes / ANRs**
  - [ ] Any crash or ANR reproducibly triggered by:
    - Going online from offline (especially after long offline periods).
    - Toggling Airplane mode repeatedly.
    - Performing basic animal add/update/delete flows.

- **Severe Performance Regressions**
  - [ ] Cold start consistently > 8 seconds on 2–3 GB devices.
  - [ ] UI freezes > 2 seconds during normal offline or sync operations.

- **Security / Privacy Issues**
  - [ ] Sensitive tokens or user identifiers are logged in plaintext in shared logs.

---

### 9. Verification Plan (Implementation Alignment)

- **Against `AnimalContext.tsx`**
  - [ ] Confirm that:
    - `loadInitialData()` correctly restores animals from `offlineService.getData('animals')` on startup after crashes/reboots.
    - `syncData()` is invoked during:
      - Initial mount.
      - After each `addAnimal`, `updateAnimal`, and `deleteAnimal`.
      - When `window` fires the `online` event (`handleOnline`).
  - [ ] Specifically validate that **Airplane mode toggling**:
    - Causes the browser environment to switch `navigator.onLine` from false → true.
    - Triggers `handleOnline` and subsequently `syncData()` → `offlineService.attemptSync()`.

- **Against `offline_service.ts`**
  - [ ] Verify coverage of edge cases:
    - Multiple mutations for the same animal in a queue (ADD → UPDATE → DELETE) preserve **order**.
    - `processMutation` response handling for:
      - `response.ok` (success).
      - `409` conflicts (local mutation discarded, conflict logged).
      - 4xx and 5xx distinction (**retryable** vs **non-retryable** failures).
      - Network failures (retryable).
  - [ ] Confirm metrics and logs are sufficient for the checklist:
    - `Analytics.trackEvent('sync_success' | 'queue_conflict_detected' | 'sync_failed')`.
    - `Crashlytics.logError('Unexpected sync error', error)` for unexpected sync failures.

- **Tooling Verification**
  - [ ] Validate that:
    - **Cold start** can be measured via `adb shell am start -W` on all test devices/emulators.
    - **Memory** can be profiled with Android Studio and `dumpsys meminfo`.
    - **Sync duration** is derivable from logs with timestamps and mutation IDs.
    - **Crash rate** is visible in Crashlytics and/or logcat.

---

### 10. Test Exit Checklist

- [ ] All blocks in the **48-hour schedule** completed on at least one 2–3 GB device per targeted OS version.
- [ ] All rows in the **offline animal recording test matrix** executed and marked PASS/FAIL with notes.
- [ ] No **STOP-SHIP** conditions observed or all such issues have been fixed and re-validated.
- [ ] Final report created summarizing:
  - Key metrics (cold start, memory, sync duration, crash/ANR count).
  - Any deviations from expected behavior and mitigations.

