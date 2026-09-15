// leaderboard.js — native Yandex Games leaderboard client.
//
// The old implementation depended on a Vercel/Upstash endpoint, which cannot execute inside the
// static archive uploaded to Yandex Games. The platform adapter keeps the local test path as a
// graceful `null` while production uses the configured native time leaderboard.

import {
  fetchLeaderboard,
  isYandexPlatform,
  submitLeaderboard,
} from "./platform/yandex.js";

export async function fetchTop() {
  if (!isYandexPlatform()) return null;
  return fetchLeaderboard();
}

export async function submitScore({ score, timeMs }) {
  if (!isYandexPlatform()) return null;
  return submitLeaderboard({ score, timeMs });
}
