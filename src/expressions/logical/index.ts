import {
  PlainData,
  PlainDataArr,
  SYMBOL_AND,
  SYMBOL_NOT,
  SYMBOL_OR,
} from '../type';

import { LogicalParams } from './type';

const logical = (...params: LogicalParams): PlainData => {
  const [operator, data] = params;

  if (operator === 'and') return [SYMBOL_AND, data];
  if (operator === 'or') return [SYMBOL_OR, data];
  return [SYMBOL_NOT, data as PlainData];
};

export default logical;
export const AND = (data: PlainDataArr) => logical('and', data);
export const OR = (data: PlainDataArr) => logical('or', data);
export const NOT = (data: PlainData) => logical('not', data);

export * from './type';
