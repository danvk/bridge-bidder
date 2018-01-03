import * as _ from 'lodash';

import * as cards from './cards';

// Who's got the two of clubs?
export function makeBoard(deal: cards.Deal): cards.Board {
  const leader = cards.findCard(deal, {suit: 'C', rank: 2});
  if (!leader) {
    throw new Error('Unable to locate two of clubs on board');
  }
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

export interface GameState {
  isHeartsBroken: boolean;
  isQueenPlayed: boolean;
  // pointsTaken: {[k in keyof cards.Deal]: number};
}

export const QUEEN_OF_SPADES: cards.Card = { suit: 'S', rank: 12 };

function getGameState(board: cards.Board): GameState {
  return {
    isHeartsBroken: isHeartsBroken(board),
    isQueenPlayed: cards.findCard(board.hands, QUEEN_OF_SPADES) === null,
  };
}

function pointsForCard(card: cards.Card): number {
  if (card.suit === 'H') return 1;
  if (cards.compareCards(card, QUEEN_OF_SPADES) === 0) return 13;
  return 0;
}

export function pointsForTrick(trick: cards.Trick): number {
  return _.sum(trick.plays.map(play => pointsForCard(play.card)));
}

// Get a list of legal plays, grouped by suit.
// TODO(danvk): move most of this logic into cards.ts.
function legalPlays(board: cards.Board): cards.Hand {
  const {currentPlay} = board;
  if (!currentPlay) {
    throw new Error(`Tried to play on a completed board.`);
  }
  const {player, trick} = currentPlay;
  const fullHand = board.hands[player];
  const type = cards.getPlayType(board);

  if (type === 'lead') {
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
    if (!isHeartsBroken(board) && cards.numCardsInHand(hand) !== _.size(hand.H)) {
      // You can't lead a heard unless hearts has been broken or you have no choice.
      hand.H = [];
    }
    return hand;
  } else if (type === 'on-suit') {
    // If we can follow suit, we must.
    const ledSuit = trick.plays[0].card.suit
    const followCards = fullHand[ledSuit];
    return {C: [], D: [], H: [], S: [], [ledSuit]: followCards.slice()};
  } else {
    // Otherwise, everything is fair game!
    // TODO(danvk): no blood on first trick.
    return _.mapValues(fullHand, cards => cards.slice());
  }
}

export interface Strategy {
  pass(hand: cards.Hand, player: cards.Player): cards.Card[];
  lead(hand: cards.Hand, currentTrick: cards.InProgressTrick, state: GameState, candidates: cards.Hand): cards.Card;
  follow(hand: cards.Hand, currentTrick: cards.InProgressTrick, state: GameState, candidates: cards.Card[]): cards.Card;
  discard(hand: cards.Hand, currentTrick: cards.InProgressTrick, state: GameState, candidates: cards.Hand): cards.Card;
}

export function makePlay(board: cards.Board, strategy: Strategy): cards.Play {
  if (!board.currentPlay) {
    throw new Error('No current play!');
  }
  const {player} = board.currentPlay;
  const candidates = legalPlays(board);
  const state = getGameState(board);
  const type = cards.getPlayType(board);

  // Make any trivial plays without consulting the strategy.
  if (cards.numCardsInHand(candidates) === 1) {
    const card = cards.flattenHand(candidates)[0];
    return {
      player,
      card,
    };
  }

  const hand = board.hands[player];
  const trick = board.currentPlay;
  return {
    player,
    card: type === 'lead' ? strategy.lead(hand, trick, state, candidates) :
          type === 'on-suit' ? strategy.follow(hand, trick, state, _.sortBy(cards.flattenHand(candidates), c => c.rank)) :
          strategy.discard(hand, trick, state, candidates),
  };
}
