import { Marshalled } from '../type';

import { OperateResult } from './operate/type';
import { SetParams, UpdateResult } from './update/type';

export type Expressions = {
  ConditionExpression?: string;
  counter?: number; // Would be omitted when returned.
  ExpressionAttributeNames?: { [key: string]: string };
  ExpressionAttributeValues?: { [key: string]: Marshalled };
  extraReservedWords?: string[]; // Would be omitted when returned.
  FilterExpression?: string;
  KeyConditionExpression?: string;
  ProjectionExpression?: string;
  updated?: {
    set?: string[];
    remove?: string[];
    add?: string[];
    delete?: string[];
  }; // Would be omitted when returned.
  UpdateExpression?: string;
};

type NonEmptyArr<T> = [T, ...T[]];

export type PlainValues = Uint8Array | boolean | number | null | string;
export type PlainValuesArr = NonEmptyArr<PlainValues>;

export const SYMBOL_AND: unique symbol = Symbol.for('AND');
export const SYMBOL_OR: unique symbol = Symbol.for('OR');
export const SYMBOL_NOT: unique symbol = Symbol.for('NOT');

export type PlainData =
  | { [name: string]: PlainValues | OperateResult }
  | [typeof SYMBOL_AND, PlainDataArr]
  | [typeof SYMBOL_OR, PlainDataArr]
  | [typeof SYMBOL_NOT, PlainData];

export type PlainDataArr = NonEmptyArr<PlainData>;

type UpdateValues = SetParams | UpdateResult;

export type UpdateData = {
  [name: string]: UpdateValues;
};

export type DataSetToExpressionsParams = {
  condition?: PlainData;
  extraReservedWords?: string[];
  filter?: PlainData;
  keyCondition?: PlainData;
  projection?: string[];
  update?: UpdateData;
};

export type DataSetToExpressionsResult = Omit<
  Expressions,
  'counter' | 'extraReservedWords' | 'updated'
>;
