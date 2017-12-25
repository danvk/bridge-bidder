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
});
