// gameOver.js — the "Game Over" overlay, shown when the heroine loses her last life.
//
// Pure DOM (like insertCoin.js): an HTML overlay over the canvas, never a Kaplay object, so it
// stays out of the game's render/collision tree. Markup lives in index.html; this module just
// toggles + wires it. A rewarded video can continue the current run from its checkpoint.

import { isYandexPlatform, showRewarded } from "../platform/yandex.js";
import { t } from "../i18n/index.js";

let overlay = null;
let button = null;
let adButton = null;
let adStatus = null;

function els() {
  overlay ||= document.getElementById("gameover-overlay");
  button ||= document.getElementById("gameover-btn");
  adButton ||= document.getElementById("gameover-ad-btn");
  adStatus ||= document.getElementById("gameover-ad-status");
}

/** Show Game Over. `onContinue` is available only after a rewarded video completes. */
export function showGameOver(onRestart, onContinue) {
  els();
  if (!overlay || !button) return;
  if (adStatus) adStatus.textContent = "";
  if (adButton) {
    adButton.hidden = !isYandexPlatform();
    adButton.disabled = false;
  }
  overlay.hidden = false;
  // Assign (not addEventListener) so repeated game-overs never stack handlers.
  button.onclick = () => {
    hideGameOver();
    // Hand keyboard focus back to the canvas (clicking this DOM button took it).
    document.getElementById("game")?.focus();
    onRestart?.();
  };
  if (adButton) {
    adButton.onclick = async () => {
      adButton.disabled = true;
      if (adStatus) adStatus.textContent = t("coin.adLoading");
      const rewarded = await showRewarded();
      if (!rewarded) {
        if (adStatus) adStatus.textContent = t("coin.adUnavailable");
        adButton.disabled = false;
        return;
      }
      hideGameOver();
      document.getElementById("game")?.focus();
      onContinue?.();
    };
  }
}

/** Hide the overlay (also called defensively when entering other scenes). */
export function hideGameOver() {
  els();
  if (overlay) overlay.hidden = true;
  if (adStatus) adStatus.textContent = "";
}
