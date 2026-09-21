import { Unmarshalled } from '../type';

import operate from './operate/index';
import {
  DataSetToExpressionsParams,
  DataSetToExpressionsResult,
  Expressions,
  PlainData,
  PlainDataArr,
  PlainValues,
  UpdateData,
} from './type';
import update from './update/index';
import { addNameAttr } from './utils/index';

const getExpressions = (expressions: Expressions, data: PlainData): string => {
  if (Array.isArray(data)) {
    if (data[0].description === 'AND') {
      return (data[1] as PlainDataArr)
        .map((d) => `(${getExpressions(expressions, d)})`)
        .join(' AND ');
    }
    if (data[0].description === 'OR') {
      return (data[1] as PlainDataArr)
        .map((d) => `(${getExpressions(expressions, d)})`)
        .join(' OR ');
    }
    return `NOT (${getExpressions(expressions, data[1] as PlainData)})`;
  }

  const expressionStrings = Object.entries(data).map(([name, op]) => {
    let opFunc = op;
    if (typeof opFunc !== 'function') {
      opFunc = operate('=', op as PlainValues);
    }

    return opFunc(expressions, name);
  });

  return expressionStrings.join(' AND ');
};

const getUpdateExpression = (
  expressions: Expressions,
  data: UpdateData,
): string => {
  Object.entries(data).map(([name, up]) => {
    let upFunc = up;
    if (typeof upFunc !== 'function') {
      upFunc = update('set', up as Unmarshalled);
    }

    upFunc(expressions, name);
  });

  return Object.entries(expressions.updated || {})
    .map(
      ([updater, strArr]) =>
        `${updater.toLocaleUpperCase()} ${strArr.join(', ')}`,
    )
    .join(' ');
};

const dataSetToExpressions = (
  dataSet: DataSetToExpressionsParams,
): DataSetToExpressionsResult => {
  const { extraReservedWords = [] } = dataSet;

  const expressions: Expressions = {
    counter: 0,
    ExpressionAttributeNames: {},
    ExpressionAttributeValues: {},
    extraReservedWords,
    updated: {},
  };

  if (!!dataSet.condition) {
    expressions.ConditionExpression = getExpressions(
      expressions,
      dataSet.condition,
    );
  }

  if (!!dataSet.filter) {
    expressions.FilterExpression = getExpressions(expressions, dataSet.filter);
  }

  if (!!dataSet.keyCondition) {
    expressions.KeyConditionExpression = getExpressions(
      expressions,
      dataSet.keyCondition,
    );
  }

  if (!!dataSet.projection) {
    expressions.ProjectionExpression = dataSet.projection
      .map((proj) => addNameAttr(expressions, proj))
      .join(', ');
  }

  if (!!dataSet.update) {
    expressions.UpdateExpression = getUpdateExpression(
      expressions,
      dataSet.update,
    );
  }

  delete expressions.counter;
  delete expressions.extraReservedWords;
  delete expressions.updated;
  Object.keys(expressions).forEach((exp) => {
    if (!expressions[exp] || Object.keys(expressions[exp])?.length === 0) {
      delete expressions[exp];
    }
  });

  return expressions;
};

export default dataSetToExpressions;

export {
  DataSetToExpressionsParams,
  DataSetToExpressionsResult,
  PlainData,
  PlainDataArr,
  PlainValues,
  PlainValuesArr,
  UpdateData,
} from './type';
