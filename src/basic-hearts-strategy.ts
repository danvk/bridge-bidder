import * as cards from './cards';
import { Strategy, GameState, QUEEN_OF_SPADES, pointsForTrick, pointsForCard } from './hearts';
import * as _ from 'lodash';
import { compareCards } from './cards';

/**
 * A straightforward hearts strategy.
 *
 * Passing:
 * - Always pass the Queen of Spades if you have it.
 * - Always pass Ace & King of Spades.
 * - Pass your highest cards, prefering to pass Hearts, then your shortest suit.
 *
 * Playing:
 * - Leading
 *   - If someone else has the queen, play our highest low spade.
 *   - Play the lowest legal card, preferring your shortest suit.
 * - Following
 *   - In fourth seat, play the highest card which will take a point-free trick.
 *   - In fourth seat, play the highest card which does not take a point-ful trick.
 *   - Play the lowest legal card.
 * - Discarding
 *   - If you have the queen and can legally play it, do so.
 *   - If you can dump a heart, dump the highest one.
 *   - Dump your highest card, using lowest card as a tie-breaker.
 */

function getShortestSuit(hand: cards.Hand): cards.Suit {
  return _.minBy(_.keys(hand).filter(suit => !_.isEmpty(hand[suit])),
                 suit => _.size(hand[suit])) as cards.Suit;
}

const strategy: Strategy = {
  pass(hand: cards.Hand, player: cards.Player): cards.Card[] {
    const shortestSuit = getShortestSuit(hand);
    const allCards = cards.flattenHand(hand);
    const ordered = _.sortBy(allCards, card => {
      if (cards.compareCards(card, QUEEN_OF_SPADES)) return 1000;
      if (card.suit === 'S' && card.rank > 12) return 500;
      let score = card.rank;
      if (card.suit === shortestSuit) score += 50;
      if (card.suit === 'H') score += 100;
    });

    return ordered.slice(-3);
  },

  lead(hand: cards.Hand, currentTrick: cards.InProgressTrick, state: GameState, candidates: cards.Hand): cards.Card {
    // If the queen is still out, play our highest low spade.
    const haveQueen = !!_.find(hand.S, c => c.rank === 12);
    if (!state.isQueenPlayed && !haveQueen) {
      const minSpade = _.minBy(hand.S, 'rank');
      if (minSpade && minSpade.rank < 12) {
        const highestLowSpade = _.maxBy(hand.S, c => c.rank >= 12 ? -1 : c.rank);
        if (!highestLowSpade) throw new Error('impossible');
        return highestLowSpade;
      }
    }

    // Play the lowest legal card, preferring your shortest suit.
    const shortestSuit = getShortestSuit(hand);
    const allCards = cards.flattenHand(hand);
    return _.minBy(allCards, card => card.rank * 10 + (card.suit === shortestSuit ? -1 : 0)) as cards.Card;
  },

  follow(hand: cards.Hand, currentTrick: cards.InProgressTrick, state: GameState, candidates: cards.Card[]): cards.Card {
    const {trick} = currentTrick;
    const points = pointsForTrick(currentTrick.trick);
    const ledSuit = trick.plays[0].card.suit;
    const highRank = _.max(currentTrick.trick.plays.filter(c => c.card.suit === ledSuit).map(c => c.card.rank)) as number;
    const highest = _.last(_.filter(candidates, c => compareCards(c, QUEEN_OF_SPADES) !== 0));
    const duck = _.last(_.filter(candidates, c => c.rank < highRank));
    const lowest = candidates[0];

    if (currentTrick.trick.plays.length === 3) {
      // We're in fourth seat.
      // Play the highest card which will take a point-free trick.
      // or the highest card which does not take a point-ful trick if possible.
      if (points === 0 && highest) {
        return highest;
      } else {
        return duck || lowest;
      }
    } else {
      // Duck if possible, otherwise play the lowest card.
      return duck || lowest;
    }
  },

  discard(hand: cards.Hand, currentTrick: cards.InProgressTrick, state: GameState, candidates: cards.Hand): cards.Card {
    // If you have the queen and can legally play it, do so.
    // If you can dump a heart, dump the highest one.
    // Dump your highest card, using lowest card in the suit as a tie-breaker.
    const allCards = cards.flattenHand(hand);

    const hasQueen = _.find(allCards, card => cards.compareCards(card, QUEEN_OF_SPADES) === 0);
    if (hasQueen) {
      return QUEEN_OF_SPADES;
    }

    if (hand.H.length) {
      // Play our highest heart.
      return _.last(hand.H) as cards.Card;
    }

    // Dump the highest card, using lowest card in the suit as a tie-breaker.
    return _.maxBy(allCards, card => (100 * card.rank - hand[card.suit][0].rank)) as cards.Card;
  }
};

export default strategy;
