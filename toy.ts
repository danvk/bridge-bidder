import * as _ from 'lodash';

import {randomDeal, formatCard, formatDeal, formatPBN} from './src/cards';

const deal = randomDeal();
console.log(formatPBN(deal));
// console.log(_.mapValues(deal, hand => _.mapValues(hand, holding => _.map(holding, formatCard))));
// console.log(JSON.stringify(deal, null, 2));
