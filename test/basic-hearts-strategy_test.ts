import basicStrategy from '../src/basic-hearts-strategy';
import * as hearts from '../src/hearts';
import { Board, parsePBN, parseCard, play, Play, numCardsInHand, formatCard, formatBoard } from '../src/cards';
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

function playTrick(hands: string[], strTricks: string[]): string {
  let board = makeBoard(hands, strTricks);
  const plays: Play[] = [];
  const numCompleteTricks = board.completedTricks.length;
  while (board.completedTricks.length === numCompleteTricks) {
    const p = makePlay(board, basicStrategy);
    plays.push(p);
    board = play(board, p.card);
  }
  return plays[0].player + ':' + plays.map(p => formatCard(p.card)).join(' ');
}

describe('basic hearts strategy', () => {
  const hands = [
            '68.56K.248.23479',
  '245A.38.3J.58TJK', '39K.279QA.57KA.Q',
            '7TJQ.4TJ.69TQ.6A'
  ];
  const initBoard = makeBoard(hands, []);

  it('should lead the 2C', () => {
    expect(makePlay(initBoard, basicStrategy)).to.deep.equal({
      card: {
        rank: 2,
        suit: 'C',
      },
      player: 'N',
    });
  });

  it('should play the first trick as expected', () => {
    expect(makePlay(makeBoard(hands, ['2C']), basicStrategy)).to.deep.equal({
      player: 'E', card: { rank: 12, suit: 'C' },  // only legal play
    });

    expect(makePlay(makeBoard(hands, ['2C QC']), basicStrategy)).to.deep.equal({
      player: 'S', card: { rank: 6, suit: 'C' },  // duck
    });

    expect(makePlay(makeBoard(hands, ['2C QC 6C']), basicStrategy)).to.deep.equal({
      player: 'W', card: { rank: 13, suit: 'C' },  // take a safe trick
    });
  });

  it('should continue second hand as expected', () => {
    let trick: string;
    const plays = ['2C QC 6C KC'];

    const script = [
      //  W  N  E  S  W  N  E
      'W:5S 6S 3S JS',           // lead a low spade, ducking through to the J.
               'S:6D 3D 4D AD',  // lead low from D suit to the Ace
            'E:9S 7S 4S 8S',     // lead a low spade to the 8.
         'N:2D 5D 9D JD',        // lead low diamond from shortest suit.
    ];

    //          .56K.8.23479
    // 2A.38..58TJK    K.279QA.7K.Q
    //          TQ.4TJ.TQ.6A

    for (let i = 0; i < script.length; i++) {
      trick = playTrick(hands, plays);
      expect(trick).to.equal(script[i]);
      plays.push(trick.slice(2));
    }
  });
});
