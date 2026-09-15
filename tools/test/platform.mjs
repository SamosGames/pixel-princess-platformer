import assert from "node:assert/strict";

const calls = [];
let saved = null;
const player = {
  uniqueID: "player-1",
  publicName: "Princess",
  getData: async () => ({ unlockedLevel: 3 }),
  setData: async (data) => { saved = data; },
};
const sdk = {
  environment: { i18n: { lang: "ru-RU" } },
  features: {
    LoadingAPI: { ready: () => calls.push("ready") },
    GameplayAPI: {
      start: () => calls.push("start"),
      stop: () => calls.push("stop"),
    },
  },
  getPlayer: async ({ scopes } = {}) => {
    calls.push(scopes ? "player:scoped" : "player");
    return player;
  },
  isAvailableMethod: async () => true,
  auth: { openAuthDialog: async () => calls.push("auth") },
  adv: {
    showRewardedVideo: ({ callbacks }) => {
      calls.push("rewarded");
      callbacks.onRewarded();
      callbacks.onClose();
    },
    showFullscreenAdv: ({ callbacks }) => {
      calls.push("fullscreen");
      callbacks.onClose();
    },
  },
  leaderboards: {
    getEntries: async () => ({
      entries: [{ player: { uniqueID: "runner-2", publicName: "Runner" }, score: "1234", extraData: "80", rank: 1 }],
    }),
    setScore: async (...args) => calls.push(["setScore", ...args]),
    getPlayerEntry: async () => ({ rank: 2 }),
  },
};

global.window = { YaGames: { init: async () => sdk } };
const platform = await import("../../src/platform/yandex.js?platform-test");

assert.equal(await platform.initYandex(), sdk);
assert.equal(platform.isYandexPlatform(), true);
assert.equal(platform.getPlatformLanguage(), "ru");
platform.markGameReady();
platform.gameplayStart();
platform.gameplayStop();
assert.deepEqual(await platform.loadCloudProgress(), { unlockedLevel: 3 });
assert.equal(await platform.saveCloudProgress({ unlockedLevel: 4 }), true);
assert.deepEqual(saved, { unlockedLevel: 4 });

let rewarded = false;
assert.equal(await platform.showRewarded(() => { rewarded = true; }), true);
assert.equal(rewarded, true);
assert.equal(await platform.showFullscreen(), false);

const board = await platform.fetchLeaderboard();
assert.equal(board.rows[0].id, "runner-2");
assert.equal(board.rows[0].time, 1234);
assert.equal(board.rows[0].score, 80);
const submitted = await platform.submitLeaderboard({ timeMs: 9876, score: 321 });
assert.equal(submitted.rank, 2);
assert.equal(submitted.id, "player-1");
assert.deepEqual(calls.filter((value) => typeof value === "string"), [
  "ready", "start", "stop", "player", "rewarded", "fullscreen", "auth", "player:scoped",
]);
assert.deepEqual(calls.find((value) => Array.isArray(value)), ["setScore", "pixel_princess_time", 9876, "321"]);
console.log("platform adapter: ok");
