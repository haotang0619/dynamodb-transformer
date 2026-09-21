import {
  BSet,
  MarshalerOfEachResult,
  MarshalerParams,
  MarshalerResult,
  NSet,
  SSet,
  Unmarshalled,
} from './type';

const marshalerOfEach = <T extends Unmarshalled>(
  value: T,
): MarshalerOfEachResult<T> => {
  // undefined is filtered out by callers (marshaler / the L branch below);
  // this just narrows the type for the recursive M-branch call below.
  if (value === undefined) return undefined as MarshalerOfEachResult<T>;

  // B
  if (value instanceof Uint8Array) {
    return { B: value } as MarshalerOfEachResult<T>;
  }

  // BOOL
  if (typeof value === 'boolean') {
    return { BOOL: value } as MarshalerOfEachResult<T>;
  }

  // BS
  if (value instanceof BSet) {
    return { BS: [...value] } as MarshalerOfEachResult<T>;
  }

  // L
  if (Array.isArray(value)) {
    return {
      L: value.filter((v) => v !== undefined).map((v) => marshalerOfEach(v)),
    } as MarshalerOfEachResult<T>;
  }

  // M is the last
  // N
  if (typeof value === 'number') {
    return { N: String(value) } as MarshalerOfEachResult<T>;
  }

  // NS
  if (value instanceof NSet) {
    return { NS: [...value].map(String) } as MarshalerOfEachResult<T>;
  }

  // NULL
  if (value === null) {
    return { NULL: true } as MarshalerOfEachResult<T>;
  }

  // S
  if (typeof value === 'string') {
    return { S: value } as MarshalerOfEachResult<T>;
  }

  // SS
  if (value instanceof SSet) {
    return { SS: [...value] } as MarshalerOfEachResult<T>;
  }

  // M
  return { M: marshaler(value) } as MarshalerOfEachResult<T>;
};

const marshaler = <T extends MarshalerParams>(data: T): MarshalerResult<T> => {
  return Object.entries(data).reduce((acc, [name, value]) => {
    // Skip undefined values instead of crashing on Object.entries(undefined)
    // once marshalerOfEach falls through to the M branch.
    if (value === undefined) return acc;
    return { ...acc, [name]: marshalerOfEach(value) };
  }, {}) as MarshalerResult<T>;
};

export default marshaler;
