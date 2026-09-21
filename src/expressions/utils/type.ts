import { Unmarshalled } from '../../type';
import { Expressions } from '../type';

export type AddAttrParams =
  [Expressions, string] | [Expressions, Unmarshalled, 'value'];
