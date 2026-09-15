// yandex.js — the small platform adapter used by the game and its local test fallback.
//
// The Yandex Games archive is a static site: there is no Vercel function behind it. Keeping all
// SDK calls here gives gameplay a boring, synchronous fallback when the game runs locally and
// keeps auth, ads, cloud saves, and leaderboards from leaking into scene code.

const LEADERBOARD_NAME = "pixel_princess_time";

let sdk = null;
let player = null;
let initPromise = null;
let gameplayActive = false;
let gameReady = false;
const SDK_TIMEOUT = 8000;

function withTimeout(promise, fallback) {
  return new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      resolve(fallback);
    }, SDK_TIMEOUT);
    Promise.resolve(promise).then(
      (value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(fallback);
      },
    );
  });
}

function baseLanguage(value) {
  const code = String(value || "").toLowerCase().split(/[-_]/)[0];
  return ["ru", "en", "it"].includes(code) ? code : null;
}

async function callAvailable(method) {
  if (!sdk?.isAvailableMethod) return true;
  try {
    return await sdk.isAvailableMethod(method);
  } catch {
    return false;
  }
}

/** Initialize SDK once. Local development deliberately resolves with no SDK. */
export function initYandex() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const YaGames = typeof window === "undefined" ? null : window.YaGames;
    if (typeof YaGames?.init !== "function") return null;
    try {
      sdk = await withTimeout(YaGames.init(), null);
      return sdk;
    } catch {
      sdk = null;
      return null;
    }
  })();
  return initPromise;
}

export function whenYandexReady() {
  return initPromise || Promise.resolve(null);
}

export function isYandexPlatform() {
  return !!sdk;
}

export function getPlatformLanguage() {
  return baseLanguage(sdk?.environment?.i18n?.lang || sdk?.environment?.i18n?.locale);
}

export function markGameReady() {
  if (gameReady || !sdk) return;
  gameReady = true;
  try {
    const LoadingAPI = sdk.features?.LoadingAPI;
    if (typeof LoadingAPI?.ready === "function") LoadingAPI.ready();
  } catch {
    // A missing optional feature must never stop the game from starting.
  }
}

export function gameplayStart() {
  if (!sdk || gameplayActive) return;
  gameplayActive = true;
  try {
    sdk.features?.GameplayAPI?.start?.();
  } catch {
    // Metrics are optional; gameplay is not.
  }
}

export function gameplayStop() {
  if (!sdk || !gameplayActive) return;
  gameplayActive = false;
  try {
    sdk.features?.GameplayAPI?.stop?.();
  } catch {
    // Metrics are optional; gameplay is not.
  }
}

export function isGameplayActive() {
  return gameplayActive;
}

/**
 * Report a product event when the host exposes an analytics bridge.
 *
 * Yandex has changed the optional stats surface between SDK revisions, so this deliberately
 * probes the supported shapes and keeps a local DOM event for QA. A missing bridge is fine: the
 * game must never make analytics a dependency of play.
 */
export function trackEvent(name, params = {}) {
  const safeName = String(name || "event").slice(0, 64);
  const safeParams = params && typeof params === "object" ? { ...params } : {};
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent("pj:analytics", { detail: { name: safeName, params: safeParams } }));
    } catch {
      // CustomEvent is only a local QA hook; ignore old embedded browsers.
    }
  }
  try {
    sdk?.appMetrica?.reportEvent?.(safeName, safeParams);
    sdk?.stats?.reportEvent?.(safeName, safeParams);
    const stats = sdk?.getStats?.();
    if (stats && typeof stats.then === "function") {
      void stats.then((bridge) => bridge?.reportEvent?.(safeName, safeParams)).catch(() => {});
    } else {
      stats?.reportEvent?.(safeName, safeParams);
    }
  } catch {
    // Optional platform telemetry must never stop gameplay.
  }
}

async function getPlayer(scopes = false) {
  if (!sdk?.getPlayer) return null;
  if (player && (!scopes || player.__scoped)) return player;
  try {
    player = await sdk.getPlayer({ scopes });
  } catch {
    try {
      player = await sdk.getPlayer();
    } catch {
      player = null;
    }
  }
  if (player && scopes) player.__scoped = true;
  return player;
}

export async function loadCloudProgress() {
  if (!(await withTimeout(whenYandexReady(), null))) return null;
  const current = await withTimeout(getPlayer(), null);
  if (!current?.getData) return null;
  return withTimeout(Promise.resolve().then(() => current.getData()), null);
}

export async function saveCloudProgress(data) {
  if (!(await withTimeout(whenYandexReady(), null))) return false;
  const current = await withTimeout(getPlayer(), null);
  if (!current?.setData) return false;
  return (await withTimeout(Promise.resolve().then(() => current.setData(data)), false)) !== false;
}

function runAd(method, onRewarded) {
  if (!sdk?.adv?.[method]) return Promise.resolve(false);
  trackEvent("ad_requested", { format: method === "showRewardedVideo" ? "rewarded" : "fullscreen" });
  const resume = gameplayActive;
  gameplayStop();
  return new Promise((resolve) => {
    let settled = false;
    let rewarded = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      if (resume) gameplayStart();
      resolve(rewarded);
    };
    try {
      sdk.adv[method]({
        callbacks: {
          onRewarded: () => {
            if (rewarded) return;
            rewarded = true;
            trackEvent("ad_rewarded", { format: method === "showRewardedVideo" ? "rewarded" : "fullscreen" });
            onRewarded?.();
          },
          onClose: finish,
          onError: finish,
        },
      });
    } catch {
      finish();
    }
  });
}

export function showRewarded(onRewarded) {
  return runAd("showRewardedVideo", onRewarded);
}

export function showFullscreen() {
  return runAd("showFullscreenAdv");
}

async function authorize() {
  if (!sdk) return null;
  try {
    if (sdk.auth?.openAuthDialog) await sdk.auth.openAuthDialog();
  } catch {
    return null;
  }
  return getPlayer(true);
}

function parseExtraData(value) {
  const score = Number(value);
  return Number.isFinite(score) && score >= 0 ? score : 0;
}

function mapEntries(data) {
  const rows = (data?.entries || []).map((entry, index) => ({
    id: entry.player?.uniqueID || null,
    name: entry.player?.publicName || "Player",
    time: Number(entry.score) || 0,
    score: parseExtraData(entry.extraData),
    rank: Number(entry.rank) || index + 1,
  }));
  return { rows, total: rows.length, offset: 0, limit: rows.length || 20 };
}

export async function fetchLeaderboard({ authorizePlayer = false } = {}) {
  if (!sdk?.leaderboards || !(await callAvailable("leaderboards.getEntries"))) return null;
  if (authorizePlayer && !(await authorize())) return null;
  try {
    const data = await sdk.leaderboards.getEntries(LEADERBOARD_NAME, {
      includeUser: authorizePlayer,
      quantityTop: 20,
      quantityAround: authorizePlayer ? 5 : 1,
    });
    return mapEntries(data);
  } catch {
    return null;
  }
}

export async function submitLeaderboard({ timeMs, score }) {
  const current = await authorize();
  if (!current || !sdk?.leaderboards || !(await callAvailable("leaderboards.setScore"))) return null;
  try {
    await sdk.leaderboards.setScore(LEADERBOARD_NAME, Math.max(0, Math.round(timeMs)), String(Math.max(0, Math.round(score))));
    let rank = null;
    let entry = null;
    if (sdk.leaderboards.getPlayerEntry && (await callAvailable("leaderboards.getPlayerEntry"))) {
      try {
        entry = await sdk.leaderboards.getPlayerEntry(LEADERBOARD_NAME);
        rank = entry?.rank ?? null;
      } catch {
        // The score was submitted; a missing rank should not erase that success.
      }
    }
    const page = await fetchLeaderboard();
    const id = entry?.player?.uniqueID || current.uniqueID || null;
    return page ? { ...page, rank, id } : { rows: [], total: 0, offset: 0, limit: 20, rank, id };
  } catch {
    return null;
  }
}

export { LEADERBOARD_NAME };
