var config = {
  baseBet: { value: 100, type: "balance", label: "base bet" },
  payout: { value: 2, type: "multiplier" },
  stop: { value: 1e8, type: "balance", label: "stop if bet >" },
  loss: { value: "increase", type: "radio", label: "On Loss", options: { increase: { value: 2, type: "multiplier", label: "Increase bet by" },},},
  win: { value: "base", type: "radio", label: "On Win", options: { base: { type: "noop", label: "Return to base bet" },},},
};

log("PocketAces V1 - Bustabit Script");

var currentBet = config.baseBet.value;
var lastGame = engine.history.first();
var cashedAtGame = new Array();
// Add-on VARS
var streakStop = 2;
var losingStreak = 0;
var redStreak = 0;
var redStreakWait = 3; 

// Restart bet were we left after waiting the red streak
function againStart() {
    if (redStreak == redStreakWait) {
        log('Betting restarted, current bet: ', currentBet / 100, 'bits @ ',config.payout.value,'x');
        engine.removeListener('GAME_ENDED', againStart);
        engine.on('GAME_STARTING', onGameStarted);
    } else {
        log('Looking for a redstreak of [',redStreakWait,'] games, current red streak is [',redStreak,'] games ..');
    }
}

// Always try to bet when script is started
engine.bet(roundBit(currentBet), config.payout.value);
log ('Show started with' ,currentBet / 100,' bits @ ' ,config.payout.value,'x ')
engine.on("GAME_STARTING", onGameStarted);
engine.once("GAME_STARTING", () => engine.on("GAME_ENDED", onGameEnded));

function onGameStarted() {
  engine.bet(roundBit(currentBet), config.payout.value);
}

function onGameEnded() {
  var lastGame = engine.history.first();
  if (lastGame.bust >= 2) {
    redStreak = 0;
    } else {
    redStreak ++;
    }

  // If we wagered, it means we played ..
  if (!lastGame.wager) {
    return;
  }

  // At a win ..
  if (lastGame.cashedAt) {
      currentBet = config.baseBet.value;
      losingStreak = 0;
      redStreak = 0;
      log ('[WON] - Proceed with base bet: ',currentBet / 100,' bits @ ',config.payout.value,'x');
  } else {
    // If we did not win, we lost (Obv.)
      if (losingStreak < streakStop) {
        console.assert(config.loss.value === "increase");
        currentBet *= config.loss.options.increase.value;
        losingStreak ++;
        redStreak = 0;
        log ('LOSS [',losingStreak,'] - Start martingale, bet: ',currentBet / 100,' bits @ ',config.payout.value,'x');
      } else {
        engine.removeListener('GAME_STARTING', onGameStarted);
        engine.on('GAME_ENDED', againStart);
        console.assert(config.loss.value === "increase");
        currentBet *= config.loss.options.increase.value;
        log('Waiting on a red streak of ',redStreakWait,' games before resuming martingale ...')
        losingStreak = 0;
        redStreak = 0;
      }
    }
  }


function roundBit(bet) {
  return Math.round(bet / 100) * 100;
}
