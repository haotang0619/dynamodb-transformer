import marshaler from '../../marshaler';
import RESERVED_WORDS from '../reserved_words';
import { Expressions } from '../type';

import { AddAttrParams } from './type';

export const addAttr = (...params: AddAttrParams): string => {
  const [expressions, nameVal, type = 'name'] = params;

  let { counter = 0 } = expressions;
  let key: string;

  if (type === 'name') {
    key = `#n_${counter++}`;
    (expressions.ExpressionAttributeNames as any)[key] = nameVal;
  } else {
    key = `:v_${counter++}`;
    expressions.ExpressionAttributeValues = {
      ...expressions.ExpressionAttributeValues,
      ...marshaler({ [key]: nameVal }),
    };
  }

  expressions.counter = counter;
  return key;
};

const addNameAttrOfEach = (
  expressions: Expressions,
  name: string,
  word: string,
): string => {
  if (!word) return name;

  let newName = name;
  let nameAttr: string;

  const nameSegment = name.split(word);
  if (nameSegment.length > 1) {
    newName = nameSegment.reduce((acc, cur, idx) => {
      if (idx === 0) return cur;
      const prev = nameSegment[idx - 1];
      if (
        /^$|\.$/.test(prev) &&
        /^$|^\.|^\[0\]|^\[[1-9]\d*\]/.test(cur) // Array syntax regex: /(\[0\]|\[[1-9]\d*\])/
      ) {
        nameAttr = nameAttr || addAttr(expressions, word);
        return `${acc}${nameAttr}${cur}`;
      }
      return `${acc}${word}${cur}`;
    }, '');
  }

  return newName;
};

export const addNameAttr = (expressions: Expressions, name: string): string => {
  // Step 1 ~ replace "extraReservedWords":
  const { extraReservedWords = [] } = expressions;
  let newName = name;
  extraReservedWords.forEach((word) => {
    newName = addNameAttrOfEach(expressions, newName, word);
  });

  // Step 2 ~ split by ".":
  newName = newName
    .split('.')
    .map((nameSegment) => {
      // Array syntax regex: /(\[0\]|\[[1-9]\d*\])/
      // => spl[0] would be the name (of an array)
      const spl = nameSegment.split(/(\[0\]|\[[1-9]\d*\])/);
      if (
        RESERVED_WORDS.includes(spl[0].toLocaleUpperCase()) ||
        /[0-9]/.test(spl[0][0]) ||
        /[ .-]/.test(spl[0])
      ) {
        const nameAttr = addAttr(expressions, spl[0]);
        spl[0] = nameAttr;
      }
      return spl.join('');
    })
    .join('.');

  return newName;
};
