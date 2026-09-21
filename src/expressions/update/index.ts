import { BSet, NSet, SSet, Unmarshalled } from '../../type';
import { Expressions } from '../type';
import { addAttr, addNameAttr } from '../utils/index';

import {
  SetFuncParams,
  SetFuncResult,
  SetParams,
  SYMBOL_IF_NOT_EXISTS,
  SYMBOL_LIST_APPEND,
  SYMBOL_PATH,
  UpdateFuncParams,
  UpdateParams,
  UpdateResult,
} from './type';

const appendUpdated = (
  expression: Expressions,
  updater: 'set' | 'remove' | 'add' | 'delete',
  str: string,
) => {
  expression.updated = {
    ...expression.updated,
    [updater]: [...(expression.updated?.[updater] || []), str],
  };
};

const setFunc = (...params: SetFuncParams): SetFuncResult => {
  const [func, name1, value] = params;

  if (func === 'if_not_exists') return [SYMBOL_IF_NOT_EXISTS, name1, value];
  if (func === 'list_append') return [SYMBOL_LIST_APPEND, name1, value];
  return [SYMBOL_PATH, name1];
};
export const IF_NOT_EXISTS = (name1: string, value: Unmarshalled) =>
  setFunc('if_not_exists', name1, value);
export const LIST_APPEND = (
  name1: string,
  value: [Unmarshalled, ...Unmarshalled[]],
) => setFunc('list_append', name1, value);
export const PATH = (name1: string) => setFunc('path', name1);

const updateFunc = (...params: UpdateFuncParams): void => {
  const [expressions, updater, name, value] = params;

  const nameAttr = addNameAttr(expressions, name);
  let valueAttr = '';
  if (value !== undefined) {
    if (Array.isArray(value) && typeof value[0] === 'symbol') {
      if (value[0].description === 'path') {
        const name1Attr = addNameAttr(expressions, value[1] as string);

        appendUpdated(expressions, 'set', `${nameAttr} = ${name1Attr}`);
      } else {
        const name1Attr = addNameAttr(expressions, value[1] as string);
        valueAttr = addAttr(
          expressions,
          value[2] as Unmarshalled | [Unmarshalled, ...Unmarshalled[]],
          'value',
        );

        appendUpdated(
          expressions,
          'set',
          `${nameAttr} = ${value[0].description}(${name1Attr}, ${valueAttr})`,
        );
      }
      return;
    } else {
      valueAttr = addAttr(expressions, value as Unmarshalled, 'value');
    }
  }

  if (updater === 'set') {
    appendUpdated(expressions, 'set', `${nameAttr} = ${valueAttr}`);
  } else if (updater === 'remove') {
    appendUpdated(expressions, 'remove', nameAttr);
  } else {
    appendUpdated(expressions, updater, `${nameAttr} ${valueAttr}`);
  }
};

const update = (...params: UpdateParams): UpdateResult => {
  const [updater, value] = params;

  return (expressions: Expressions, name: string) => {
    const funcParams = [expressions, updater, name, value] as UpdateFuncParams;
    return updateFunc(...funcParams);
  };
};

export default update;
export const SET = (value: SetParams) => update('set', value);
export const REMOVE = () => update('remove');
export const ADD = (value: number | BSet | NSet | SSet) => update('add', value);
export const DELETE = (value: BSet | NSet | SSet) => update('delete', value);

export { SetParams, UpdateParams, UpdateResult } from './type';
