import { NSet, Unmarshalled } from '../type';
import unmarshaler from '../unmarshaler';

test('unmarshler', () => {
  expect(
    unmarshaler({
      nameBool: { BOOL: true },
      nameList: { L: [{ N: '789' }, { S: 'abc' }] },
      nameNumSet: { NS: ['1', '2', '3'] },
      nameNum: { N: '456' },
      nameStr: { S: '123' },
    }),
  ).toStrictEqual<Unmarshalled>({
    nameBool: true,
    nameList: [789, 'abc'],
    nameNumSet: new NSet([1, 2, 3]),
    nameNum: 456,
    nameStr: '123',
  });
});

test('unmarshler keeps decimal precision instead of truncating', () => {
  expect(unmarshaler({ nameNum: { N: '12.5' } })).toStrictEqual<Unmarshalled>({
    nameNum: 12.5,
  });
});

test('unmarshler throws on numbers beyond Number.MAX_SAFE_INTEGER', () => {
  expect(() => unmarshaler({ nameNum: { N: '9007199254740993' } })).toThrow(
    RangeError,
  );
});
