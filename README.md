# DynamoDB Transformer

> Plenty of handy functions that help you deal with DynamoDB schema & expressions easily.

## Installation

```sh
npm install dynamodb-transformer
# or
yarn add dynamodb-transformer
```

## Features

- `marshaler` & `unmarshaler`: transform between **json** & **DynamoDB json** easily, support all data types.
- `dataSetToExpressions`: input **json**, output **all kinds of expressions**.
  - Add expression attribute names automatically when needed.
  - Add expression attribute values automatically.
  - You can provide **custom reserved words**, which will also be transformed as expression attribute names. (e.g: `Safety.Warning`)
  - All comparators / functions / logical operations could be applied by **TypeScript functions**.

## Documentation

### `marshaler` & `unmarshaler`

```typescript
import { marshaler, unmarshaler } from 'dynamodb-transformer';
```

Besides, there are 3 classes (`BSet`, `NSet`, and `SSet`) available to indicate `BS`, `NS` & `SS` data types:

```typescript
import { BSet, NSet, SSet } from 'dynamodb-transformer';
```

- `marshaler`: takes a plain json as input and returns a DynamoDB json.

  ```typescript
  import { BSet, marshaler, NSet, SSet } from 'dynamodb-transformer';

  console.log(
    marshaler({
      // For B, please use Uint8Array.
      nameB: new Uint8Array([65, 66]),
      nameBool: true,
      // For BS, please use BSet.
      nameBSet: new BSet([new Uint8Array([65, 66]), new Uint8Array([67, 68])]),
      nameList: [123, 'abc'],
      nameMapping: { map1: 456, map2: 'def' },
      nameNum: 789,
      // For NS, please use NSet.
      nameNumSet: new NSet([1, 2, 3]),
      nameNull: null,
      nameStr: 'ghi',
      // For SS, please use SSet.
      nameStrSet: new SSet(['1', '2', '3']),
    }),
  );

  // {
  //   nameB: { B: Uint8Array(2) [ 65, 66 ] },
  //   nameBool: { BOOL: true },
  //   nameBSet: {
  //     BS: [Uint8Array(2) [ 65, 66 ], Uint8Array(2) [ 67, 68 ]],
  //   },
  //   nameList: { L: [{ N: '123' }, { S: 'abc' }] },
  //   nameMapping: { M: { map1: { N: '456' }, map2: { S: 'def' } } },
  //   nameNum: { N: '789' },
  //   nameNumSet: { NS: ['1', '2', '3'] },
  //   nameNull: { NULL: true },
  //   nameStr: { S: 'ghi' },
  //   nameStrSet: { SS: ['1', '2', '3'] },
  // }
  ```

- `unmarshaler`: takes a DynamoDB json as input and returns a plain json.

  ```typescript
  import { unmarshaler } from 'dynamodb-transformer';

  console.log(
    unmarshaler({
      nameB: { B: new Uint8Array([65, 66]) },
      nameBool: { BOOL: true },
      nameBSet: {
        BS: [new Uint8Array([65, 66]), new Uint8Array([67, 68])],
      },
      nameList: { L: [{ N: '123' }, { S: 'abc' }] },
      nameMapping: { M: { map1: { N: '456' }, map2: { S: 'def' } } },
      nameNum: { N: '789' },
      nameNumSet: { NS: ['1', '2', '3'] },
      nameNull: { NULL: true },
      nameStr: { S: 'ghi' },
      nameStrSet: { SS: ['1', '2', '3'] },
    }),
  );

  // returns the original json
  ```

### `dataSetToExpressions`

```typescript
import { dataSetToExpressions } from 'dynamodb-transformer';
```

- Input schema:
  ```typescript
  {
      condition?: PlainData; // For ConditionExpression.
      extraReservedWords?: string[]; // Custom reserved words.
      filter?: PlainData; // For FilterExpression.
      keyCondition?: PlainData; // For KeyConditionExpression.
      projection?: string[]; // For ProjectionExpression.
      update?: UpdateData; // For UpdateExpression.
  }
  ```
- Output schema:
  ```typescript
  {
      ConditionExpression?: string;
      ExpressionAttributeNames?: { [key: string]: string };
      ExpressionAttributeValues?: { [key: string]: Marshalled };
      FilterExpression?: string;
      KeyConditionExpression?: string;
      ProjectionExpression?: string;
      UpdateExpression?: string;
  }
  ```
- `condition`, `filter` & `keyCondition`:

  - Several functions are available from `dynamodb-transformer` as follow:
    - `EQ`(`=`), `NE`(`<>`), `LE`(`<=`), `LT`(`<`), `GE`(`>=`), `GT`(`>`),
    - `BETWEEN`, `IN`,
    - `ATTRIBUTE_EXISTS`, `ATTRIBUTE_NOT_EXISTS`, `ATTRIBUTE_TYPE`, `BEGINS_WITH`, `CONTAINS`, `SIZE`
  - Properties provided in the same object would be concatenated by **`AND`**.
  - `EQ` can be omitted by passing the value directly.
  - Each function is well-typed.
  - Example:

    ```typescript
    import {
      dataSetToExpressions,
      ATTRIBUTE_EXISTS,
      GE,
    } from 'dynamodb-transformer';

    console.log(
      dataSetToExpressions({
        condition: { attr: GE(0), col: ATTRIBUTE_EXISTS(), row: 'test' },
      }),
    );

    // {
    //   // 'row' is a reserved word.
    //   ExpressionAttributeNames: { '#n_1': 'row' },
    //   ExpressionAttributeValues: { ':v_0': { N: '0' }, ':v_2': { S: 'test' } },
    //   ConditionExpression: 'attr >= :v_0 AND attribute_exists(col) AND #n_1 = :v_2',
    // }
    ```

  - **Logical** functions are available from `dynamodb-transformer` as follow:
    - `AND`, `OR`, `NOT`
  - `AND` & `OR` accept **an array of objects**, and join each element with the logical operator.
  - Each element would be **enclosed by parentheses** before joined.
  - `NOT` accepts a single object, and wrap it with the NOT expression.
  - Example:

    ```typescript
    import {
      dataSetToExpressions,
      ATTRIBUTE_EXISTS,
      NE,
      NOT,
      OR,
    } from 'dynamodb-transformer';

    console.log(
      dataSetToExpressions({
        condition: OR([
          { abc: '123', def: 0 },
          NOT({ abc: NE(null), 'name.ghi': ATTRIBUTE_EXISTS() }),
        ]),
      }),
    );

    // {
    //   ExpressionAttributeNames: { '#n_3': 'name' },
    //   ExpressionAttributeValues: {
    //     ':v_0': { S: '123' },
    //     ':v_1': { N: '0' },
    //     ':v_2': { NULL: true },
    //   },
    //   ConditionExpression:
    //     '(abc = :v_0 AND def = :v_1) OR (NOT (abc <> :v_2 AND attribute_exists(#n_3.ghi)))',
    // }
    ```

- `projection`:
  - Accepts an array of strings, returns a single string joined by `, `.
  - `['uuid.abc', 'def.name[0]', 'ghi']` => `ProjectionExpression: '#n_0.abc, def.#n_1[0], ghi'`
- `update`:

  - 4 functions are available from `dynamodb-transformer` as follow:
    - `SET`, `REMOVE`, `ADD`, `DELETE`
  - `SET` can be omitted by passing the value directly.
  - 3 other functions are available for special expressions of `SET`:
    - `IF_NOT_EXISTS`, `LIST_APPEND`, `PATH`
  - Example:

    ```typescript
    import {
      dataSetToExpressions,
      ADD,
      IF_NOT_EXISTS,
      PATH,
    } from 'dynamodb-transformer';

    console.log(
      dataSetToExpressions({
        extraReservedWords: ['name.child'], // custom reserved words
        update: {
          'name.child[2]': ADD(10),
          abc: PATH('def'),
          ghi: IF_NOT_EXISTS('ghi', 20),
          jkl: '100',
        },
      }),
    );

    // {
    //   ExpressionAttributeNames: { '#n_0': 'name.child' },
    //   ExpressionAttributeValues: {
    //     ':v_1': { N: '10' },
    //     ':v_2': { N: '20' },
    //     ':v_3': { S: '100' },
    //   },
    //   UpdateExpression:
    //     'ADD #n_0[2] :v_1 SET abc = def, ghi = if_not_exists(ghi, :v_2), jkl = :v_3',
    // }
    ```

- All expressions could (and should) be generated by a single `dataSetToExpressions` call.
- Example:

  ```typescript
  import {
    dataSetToExpressions,
    ADD,
    ATTRIBUTE_EXISTS,
    NE,
    NOT,
    OR,
    PATH,
  } from 'dynamodb-transformer';

  console.log(
    dataSetToExpressions({
      condition: OR([
        { abc: '123', def: 0 },
        NOT({ abc: NE(null), 'name.ghi': ATTRIBUTE_EXISTS() }),
      ]),
      extraReservedWords: ['name.ghi'],
      projection: ['abc', 'def', 'name.ghi'],
      update: { 'name.ghi[2]': ADD(1), abc: PATH('def') },
    }),
  );

  // {
  //   ExpressionAttributeNames: {
  //     '#n_3': 'name.ghi',
  //     '#n_4': 'name.ghi',
  //     '#n_5': 'name.ghi',
  //   },
  //   ExpressionAttributeValues: {
  //     ':v_0': { S: '123' },
  //     ':v_1': { N: '0' },
  //     ':v_2': { NULL: true },
  //     ':v_6': { N: '1' },
  //   },
  //   ConditionExpression:
  //     '(abc = :v_0 AND def = :v_1) OR (NOT (abc <> :v_2 AND attribute_exists(#n_3)))',
  //   ProjectionExpression: 'abc, def, #n_4',
  //   UpdateExpression: 'ADD #n_5[2] :v_6 SET abc = def',
  // }
  ```
