import {
  BSet,
  Marshalled,
  NSet,
  SSet,
  UnmarshalerOfEachResult,
  UnmarshalerParams,
  UnmarshalerResult,
} from './type';

// Number(raw) (unlike parseInt) doesn't truncate decimals, but it can still
// silently lose precision on integers past Number.MAX_SAFE_INTEGER, so guard
// that case explicitly instead of returning a corrupted value.
const parseNumber = (raw: string): number => {
  const num = Number(raw);
  if (Number.isInteger(num) && !Number.isSafeInteger(num)) {
    throw new RangeError(
      `unmarshaler: number "${raw}" exceeds Number.MAX_SAFE_INTEGER and cannot be represented exactly as a JS number.`,
    );
  }
  return num;
};

const unmarshalerOfEach = <T extends Marshalled>(
  value: T,
): UnmarshalerOfEachResult<T> => {
  // B
  if (value.B !== undefined) {
    return value.B as UnmarshalerOfEachResult<T>;
  }

  // BOOL
  if (value.BOOL !== undefined) {
    return value.BOOL as UnmarshalerOfEachResult<T>;
  }

  // BS
  if (value.BS !== undefined) {
    return new BSet(value.BS) as UnmarshalerOfEachResult<T>;
  }

  // L
  if (value.L !== undefined) {
    return value.L.map(unmarshalerOfEach) as UnmarshalerOfEachResult<T>;
  }

  // M
  if (value.M !== undefined) {
    return unmarshaler(value.M) as UnmarshalerOfEachResult<T>;
  }

  // N
  if (value.N !== undefined) {
    return parseNumber(value.N) as UnmarshalerOfEachResult<T>;
  }

  // NS
  if (value.NS !== undefined) {
    return new NSet(value.NS.map(parseNumber)) as UnmarshalerOfEachResult<T>;
  }

  // NULL
  if (value.NULL !== undefined) {
    return null as UnmarshalerOfEachResult<T>;
  }

  // S
  if (value.S !== undefined) {
    return value.S as UnmarshalerOfEachResult<T>;
  }

  // SS
  return new SSet(value.SS) as UnmarshalerOfEachResult<T>;
};

const unmarshaler = <T extends UnmarshalerParams>(
  data: T,
): UnmarshalerResult<T> => {
  return Object.entries(data || ({} as Marshalled)).reduce(
    (acc, [name, value]) => ({ ...acc, [name]: unmarshalerOfEach(value) }),
    {},
  ) as UnmarshalerResult<T>;
};

export default unmarshaler;
