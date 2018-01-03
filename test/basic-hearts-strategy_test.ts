import basicStrategy from '../src/basic-hearts-strategy';
import * as hearts from '../src/hearts';
import { Board, parsePBN, parseCard, play } from '../src/cards';
import { makePlay } from '../src/hearts';
import { expect } from 'chai';

// hands are in N, W, E, S order, using PBN for each.
// tricks are an array of space-delimited card names.
function makeBoard(hands: string[], strTricks: string[]): Board {
  const [n, w, e, s] = hands;
  const hand = parsePBN(`N:${n} ${e} ${s} ${w}`);
  let board = hearts.makeBoard(hand);

  for (const strTrick of strTricks) {
    const cards = strTrick.split(' ').map(parseCard);
    for (const card of cards) {
      board = play(board, card);
    }
  }
  return board;
}

describe('basic hearts strategy', () => {
  const initBoard = makeBoard([
             '68.56K.248.23479',
    '245A.38.3J.58TJK', '39K.279QA.57KA.Q',
             '7TJQ.4TJ.69TQ.6A'
  ], []);

  it('should lead the 2C', () => {
    expect(makePlay(initBoard, basicStrategy)).to.deep.equal({
      card: {
        rank: 2,
        suit: 'C',
      },
      player: 'N',
    });
  });
});
