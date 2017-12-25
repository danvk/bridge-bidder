/**
 * General types and functions for card games.
 */

import * as _ from 'lodash';

export enum Suit {
  CLUBS = 'C',
  DIAMONDS = 'D',
  HEARTS = 'H',
  SPADES = 'S',
}

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
