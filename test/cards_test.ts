import {expect} from 'chai';

import * as cards from '../src/cards';

describe('cards', () => {
  describe('findWinner', () => {
    const {findWinner} = cards;

    it('should find the winner without trump', () => {
      expect(findWinner({
        leader: 'N',
        plays: [
          {player: 'N', card: {rank: 2, suit: 'C'}}
        ]
      })).to.equal('N');
      expect(findWinner({
        leader: 'N',
        plays: [
          {player: 'N', card: {rank: 2, suit: 'C'}},
          {player: 'E', card: {rank: 3, suit: 'C'}}  // followed suit, won.
        ]
      })).to.equal('E');
      expect(findWinner({
        leader: 'N',
        plays: [
          {player: 'N', card: {rank: 2, suit: 'C'}},
          {player: 'E', card: {rank: 3, suit: 'D'}}  // did not follow suit.
        ]
      })).to.equal('N');
    });

    it('should find the winner with trump', () => {
      expect(findWinner({
        leader: 'N',
        plays: [
          {player: 'N', card: {rank: 2, suit: 'C'}}
        ]
      }, 'H')).to.equal('N');
      expect(findWinner({
        leader: 'N',
        plays: [
          {player: 'N', card: {rank: 2, suit: 'C'}},
          {player: 'E', card: {rank: 3, suit: 'C'}}  // followed suit, won.
        ]
      }, 'H')).to.equal('E');
      expect(findWinner({
        leader: 'N',
        plays: [
          {player: 'N', card: {rank: 2, suit: 'C'}},
          {player: 'E', card: {rank: 3, suit: 'D'}}  // did not follow suit, lost.
        ]
      }, 'H')).to.equal('N');
      expect(findWinner({
        leader: 'N',
        plays: [
          {player: 'N', card: {rank: 5, suit: 'C'}},
          {player: 'E', card: {rank: 2, suit: 'H'}}  // did not follow suit, won.
        ]
      }, 'H')).to.equal('E');
      expect(findWinner({
        leader: 'N',
        plays: [
          {player: 'N', card: {rank: 5, suit: 'C'}},
          {player: 'E', card: {rank: 2, suit: 'H'}},
          {player: 'S', card: {rank: 3, suit: 'H'}}  // over-trump
        ]
      }, 'H')).to.equal('S');
    });
  });

  describe('play', () => {
    const c = cards.parseCard;
    it('should play through a trick', () => {
      const c2 = c('2C');
      const c5 = c('5C');
      const c3 = c('3C');
      const ca = c('AC');
      const initBoard: cards.Board = {
        completedTricks: [],
        currentPlay: { trick: { leader: 'N', plays: [] }, player: 'N' },
        hands: {
          N: { C: [c2], D: [], H: [], S: [] },
          E: { C: [c5], D: [], H: [], S: [] },
          S: { C: [c3], D: [], H: [], S: [] },
          W: { C: [ca], D: [], H: [], S: [] },
        },
        cardsTaken: {N: [], S: [], E: [], W: []},
      };

      const board2 = cards.play(initBoard, c2);
      expect(board2).to.deep.equal({
        completedTricks: [],
        currentPlay: {
          trick: {
            leader: 'N',
            plays: [
              {player: 'N', card: c2},
            ]
          },
          player: 'E'
        },
        hands: {
          N: { C: [], D: [], H: [], S: [] },
          E: { C: [c5], D: [], H: [], S: [] },
          S: { C: [c3], D: [], H: [], S: [] },
          W: { C: [ca], D: [], H: [], S: [] },
        },
        cardsTaken: {N: [], S: [], E: [], W: []},
      });

      const board3 = cards.play(board2, c5);
      expect(board3).to.deep.equal({
        completedTricks: [],
        currentPlay: {
          trick: {
            leader: 'N',
            plays: [
              {player: 'N', card: c2},
              {player: 'E', card: c5},
            ]
          },
          player: 'S'
        },
        hands: {
          N: { C: [], D: [], H: [], S: [] },
          E: { C: [], D: [], H: [], S: [] },
          S: { C: [c3], D: [], H: [], S: [] },
          W: { C: [ca], D: [], H: [], S: [] },
        },
        cardsTaken: {N: [], S: [], E: [], W: []},
      });

      const board4 = cards.play(board3, c3);
      expect(board4).to.deep.equal({
        completedTricks: [],
        currentPlay: {
          trick: {
            leader: 'N',
            plays: [
              {player: 'N', card: c2},
              {player: 'E', card: c5},
              {player: 'S', card: c3},
            ]
          },
          player: 'W'
        },
        hands: {
          N: { C: [], D: [], H: [], S: [] },
          E: { C: [], D: [], H: [], S: [] },
          S: { C: [], D: [], H: [], S: [] },
          W: { C: [ca], D: [], H: [], S: [] },
        },
        cardsTaken: {N: [], S: [], E: [], W: []},
      });

      const boardNext = cards.play(board4, ca);
      expect(boardNext).to.deep.equal({
        completedTricks: [{
          leader: 'N',
          plays: [
            {player: 'N', card: c2},
            {player: 'E', card: c5},
            {player: 'S', card: c3},
            {player: 'W', card: ca},
          ],
          winner: 'W',
        }],
        currentPlay: {
          trick: {
            leader: 'W',
            plays: [],
          },
          player: 'W'
        },
        hands: {
          N: { C: [], D: [], H: [], S: [] },
          E: { C: [], D: [], H: [], S: [] },
          S: { C: [], D: [], H: [], S: [] },
          W: { C: [], D: [], H: [], S: [] },
        },
        cardsTaken: {N: [], S: [], E: [], W: [c2, c5, c3, ca]},
      });
    });
  });
});
