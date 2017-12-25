import * as _ from 'lodash';

import * as cards from './cards';

// Who's got the two of clubs?
function makeBoard(deal: cards.Deal): cards.Board {
  const leader = cards.findCard(deal, {suit: 'C', rank: 2});
  return {
    cardsTaken: {N: [], S: [], E: [], W: []},
    completedTricks: [],
    currentPlay: {
      player: leader,
      trick: {
        plays: [],
        leader,
      },
    },
    hands: deal,
  };
}

function isHeartsBroken(board: cards.Board) {
  const playedCards = cards.playedCards(board);
  for (const card of playedCards) {
    if (card.suit === 'H') return true;
  }
  return false;
}

// Get a list of legal plays, grouped by suit.
function legalPlays(board: cards.Board): cards.Hand {
  const {currentPlay} = board;
  if (!currentPlay) {
    throw new Error(`Tried to play on a completed board.`);
  }
  const {player, trick} = currentPlay;
  const fullHand = board.hands[player];

  if (trick.plays.length === 0) {
    // Is this the first play? If so, we must play the two of clubs!
    if (board.completedTricks.length === 0) {
      const twoClubs: cards.Card = {suit: 'C', rank: 2};
      if (cards.findCard(board.hands, twoClubs) !== player) {
        throw new Error(`${player} is first to play but does not have 2C.`);
      }
      return {C: [twoClubs], D: [], H: [], S: []};
    }

    // We're leading.
    const hand = _.mapValues(fullHand, cards => cards.slice());
    if (!isHeartsBroken(board)) {
      hand.H = [];
    }
    return hand;
  } else {
    // Can we follow suit?
    const ledSuit = trick.plays[0].card.suit
    const followCards = fullHand[ledSuit];
    if (followCards.length > 0) {
      // If so, we must.
      return {C: [], D: [], H: [], S: [], [ledSuit]: followCards.slice()};
    } else {
      // Otherwise, everything is fair game!
      return _.mapValues(fullHand, cards => cards.slice());
    }
  }
}

const board = makeBoard(cards.randomDeal());
console.log(cards.formatBoard(board));
const plays = legalPlays(board);
console.log(cards.formatHand(plays));
const board2 = cards.play(board, plays.C[0]);
console.log(legalPlays(board2));
