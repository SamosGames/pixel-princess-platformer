// insertCoin.js — the "Insert Coin" death overlay.
//
// Pure DOM: the spec requires an HTML overlay sovrapposto al canvas, NOT a Kaplay
// object, so it stays out of the game's collision/render tree entirely. The game scene
// calls showInsertCoin(onContinue) when the heroine fails; pressing "Inserisci Coin"
// hides the overlay and runs the callback (which banks 500 Coccoline and restarts the
// level). Markup lives in index.html; this module just toggles + wires it.

import { isYandexPlatform, showRewarded } from "../platform/yandex.js";
import { t } from "../i18n/index.js";

let overlay = null;
let button = null;
let adButton = null;
let adStatus = null;
let livesEl = null;

function els() {
  overlay ||= document.getElementById("coin-overlay");
  button ||= document.getElementById("coin-btn");
  adButton ||= document.getElementById("coin-ad-btn");
  adStatus ||= document.getElementById("coin-ad-status");
  livesEl ||= document.getElementById("coin-lives-count");
}

/**
 * Show the death overlay (only while the heroine still has lives left). `lives` is the count
 * remaining after this death; `onContinue` runs once, when the player inserts the coin.
 */
export function showInsertCoin(lives, onContinue) {
  els();
  if (!overlay || !button) return;
  if (livesEl) livesEl.textContent = String(lives);
  if (adStatus) adStatus.textContent = "";
  if (adButton) {
    adButton.hidden = !isYandexPlatform();
    adButton.disabled = false;
  }
  overlay.hidden = false;
  // Assign (not addEventListener) so repeated deaths never stack handlers.
  button.onclick = () => {
    hideInsertCoin();
    // Hand keyboard focus back to the canvas: clicking this DOM button took it, and without
    // restoring it the keys would be dead after respawn (the game scene also re-focuses).
    document.getElementById("game")?.focus();
    onContinue?.();
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
      hideInsertCoin();
      document.getElementById("game")?.focus();
      onContinue?.();
    };
  }
}

/** Hide the overlay (also called defensively when entering other scenes). */
export function hideInsertCoin() {
  els();
  if (overlay) overlay.hidden = true;
  if (adStatus) adStatus.textContent = "";
}
