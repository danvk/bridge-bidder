/**
 * General types and functions for card games.
 */

import * as _ from 'lodash';

export type Suit = 'C' | 'D' | 'H' | 'S';
export type Player = 'N' | 'E' | 'S' | 'W';

export interface Card {
  rank: number;  // 2-14 (11=J, 12=Q, 13=K, 14=A)
  suit: Suit;
}

export function textToRank(txt: string): number {
  if (txt.length != 1) {
    throw 'Invalid card symbol: ' + txt;
  }
  if (txt >= '2' && txt <= '9') return Number(txt);
  if (txt == 'T') return 10;
  if (txt == 'J') return 11;
  if (txt == 'Q') return 12;
  if (txt == 'K') return 13;
  if (txt == 'A') return 14;
  throw 'Invalid card symbol: ' + txt;
}

export function rankToText(rank: number): string {
  if (rank < 10) return String(rank);
  else if (rank == 10) return 'T';
  else if (rank == 11) return 'J';
  else if (rank == 12) return 'Q';
  else if (rank == 13) return 'K';
  else if (rank == 14) return 'A';
  throw 'Invalid card rank: ' + rank;
}

/** Returns a 2-character string like "QD" or "TH" */
export function formatCard(card: Card): string {
  return rankToText(card.rank) + card.suit;
}

/** Parse a 2-character card like 'QD' or 'TH'. */
export function parseCard(text: string): Card {
  return {
    rank: textToRank(text.charAt(0)),
    suit: text.charAt(1) as Suit,
  };
}

// play goes in clockwise order
const NEXT_PLAYER: {[player: string]: Player} = {
  N: 'E',
  E: 'S',
  S: 'W',
  W: 'N'
};

const SUIT_SYMBOLS = {
  S: '♠',
  H: '♥',
  D: '♦',
  C: '♣'
};

const SUIT_RANKS = {S: 0, H: 1, D: 2, C: 3};

// Comparator for card ranks.
export function compareCards(a: Card, b: Card): number {
  if (a.suit !== b.suit) {
    return SUIT_RANKS[a.suit] - SUIT_RANKS[b.suit];
  } else {
    return a.rank - b.rank;
  }
}

export interface Hand {
  [suit: string]: Card[];  // suit in Suit
}

export interface Deal {
  N: Hand;
  E: Hand;
  S: Hand;
  W: Hand;
}

interface PBNDeal {
  N: string;
  E: string;
  S: string;
  W: string;
}

// Given a PBN string, return a player -> string holding mapping, e.g.
// {N: 'AKQJ.984...', ...}
function parsePBNStrings(pbn: string): PBNDeal {
  const parts = pbn.split(' ');
  if (parts.length !== 4) {
    throw new Error(`PBN must have four hands (got ${parts.length})`);
  }

  const m = parts[0].match(/^([NSEW]):/);
  if (!m) {
    throw 'PBN must start with either "N:", "S:", "E:" or "W:"';
  }
  parts[0] = parts[0].slice(2);
  let player = m[1] as Player;
  var hands: Partial<PBNDeal> = {};
  parts.forEach((txt, i) => {
    hands[player] = txt;
    player = NEXT_PLAYER[player];
  });
  return hands as any;  // We asserted four parts, so the deal must be complete.
}

export function parsePBN(pbn: string): Deal {
  var pbnDeal = parsePBNStrings(pbn);

  return _.mapValues(pbnDeal, (pbnHand, player) => {
    const suits = pbnHand.split('.');
    if (suits.length !== 4) {
      throw `${player} must have four suits, got ${suits.length}: ${pbnHand}`;
    }
    return _.mapValues(SUIT_RANKS, (index, suit) => suits[index].split('').map((card: string) => {
      return { suit, rank: textToRank(card) } as Card;
    }));
  });
}

/** Group cards into suits, sorted in ascending order. */
export function assembleHand(cards: Card[]): Hand {
  const hand: Hand = {C: [], D: [], H: [], S: []};
  for (const card of cards) {
    hand[card.suit].push(card);
  }
  _.forEach(hand, holding => {
    holding.sort(compareCards);
  });
  return hand;
}

/** Returns a new 52-element array of cards, in compareCards order. */
export function fullDeck(): Card[] {
  return _.flatMap(_.keys(SUIT_RANKS), suit => {
    return _.range(2, 15).map((rank): Card => ({suit: suit as Suit, rank}));
  })
}

export function randomDeal(): Deal {
  const deck = _.shuffle(fullDeck());
  return {
    N: assembleHand(deck.slice(0, 13 * 1)),
    S: assembleHand(deck.slice(13 * 1, 13 * 2)),
    E: assembleHand(deck.slice(13 * 2, 13 * 3)),
    W: assembleHand(deck.slice(13 * 3)),
  };
}

export function formatDeal(deal: Deal): string {
  return _.map(deal as any, (hand: Hand, player: string) => {
    const handStr = _.flatten(_.values(hand)).map(formatCard).join(', ');
    return `${player}: ${handStr}`;
  }).join('\n');
}

export interface Play {
  card: Card;
  player: Player;
}

export interface Trick {
  leader: Player;
  plays: Play[];
}

export interface CompleteTrick extends Trick {
  winner: Player;
}

/** A deal which is either being played or has been completed. */
export interface Board {
  trump?: Suit;
  completedTricks: CompleteTrick[];
  currentPlay?: {
    trick: Trick;
    player: Player;
  }
  /** Remaining cards */
  hands: Deal;
  /* Can be derived from completedTricks */
  cardsTaken: {[k in keyof Deal]: Card[]};
}

export function findWinner(trick: Trick, trump?: Suit): Player {
  let winner = trick.leader;
  let winningCard = trick.plays[0].card;
  const suitLed = winningCard.suit;

  for (const play of trick.plays.slice(1)) {
    const {card, player} = play;
    if (
      // Higher play, on-suit.
      (suitLed === card.suit && winningCard.suit === card.suit && card.rank > winningCard.rank) ||
      // Trump play.
      (card.suit === trump && (card.rank > winningCard.rank || card.suit !== winningCard.suit))
     ) {
      winningCard = card;
      winner = player;
    }
  }
  return winner;
}

/** Move the currentPlay into completedTricks, awarding cards. Returns a new board. */
function sweepTrick(board: Board): Board {
  const {currentPlay} = board;
  if (!currentPlay) {
    throw new Error(`Cannot sweep a board without an in-progress trick.`);
  }
  const {trick} = currentPlay;
  const winner = findWinner(trick, board.trump);

  const newBoard = { ...board };
  newBoard.completedTricks = board.completedTricks.concat([{...trick, winner}]);
  newBoard.currentPlay = isComplete(newBoard) ? undefined : {
    player: winner,
    trick: {leader: winner, plays: []}
  };
  newBoard.cardsTaken[winner] = board.cardsTaken[winner].concat(trick.plays.map(play => play.card));
  return newBoard;
}

/** Play the given card, completing the trick if appropriate. */
export function play(board: Board, card: Card): Board {
  const {currentPlay} = board;
  if (!currentPlay) {
    throw new Error(`Cannot play on a board without an in-progress trick.`);
  }

  const {trick, player} = currentPlay;
  const cardIndex = board.hands[player][card.suit].indexOf(card);
  if (cardIndex === -1) {
    throw new Error(`Tried to play ${formatCard(card)} which was not ${player}'s card to play.`);
  }

  const newTrick: Trick = {
    plays: trick.plays.concat([{card, player}]),
    leader: trick.leader
  };

  const newBoard = { ...board };
  newBoard.currentPlay = {
    trick: newTrick,
    player: NEXT_PLAYER[player],
  };
  newBoard.hands = {
    ...board.hands,
    [player]: {
      ...board.hands[player],
      [card.suit]: _.without(board.hands[player][card.suit], card)
    }
  }
  if (newTrick.plays.length === 4) {
    return sweepTrick(newBoard);
  }
  return newBoard;
}

export function isComplete(board: Board) {
  return board.completedTricks.length >= 13;
}

export function formatBoard(board: Board): string {
  return JSON.stringify({
    ...board,
    hands: formatDeal(board.hands),
  }, null, 2);
}
