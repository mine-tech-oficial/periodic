// build/dev/javascript/prelude.mjs
var CustomType = class {
  withFields(fields) {
    let properties = Object.keys(this).map(
      (label) => label in fields ? fields[label] : this[label]
    );
    return new this.constructor(...properties);
  }
};
var List = class {
  static fromArray(array3, tail) {
    let t = tail || new Empty();
    for (let i = array3.length - 1; i >= 0; --i) {
      t = new NonEmpty(array3[i], t);
    }
    return t;
  }
  [Symbol.iterator]() {
    return new ListIterator(this);
  }
  toArray() {
    return [...this];
  }
  // @internal
  atLeastLength(desired) {
    for (let _ of this) {
      if (desired <= 0)
        return true;
      desired--;
    }
    return desired <= 0;
  }
  // @internal
  hasLength(desired) {
    for (let _ of this) {
      if (desired <= 0)
        return false;
      desired--;
    }
    return desired === 0;
  }
  // @internal
  countLength() {
    let length4 = 0;
    for (let _ of this)
      length4++;
    return length4;
  }
};
function prepend(element2, tail) {
  return new NonEmpty(element2, tail);
}
function toList(elements2, tail) {
  return List.fromArray(elements2, tail);
}
var ListIterator = class {
  #current;
  constructor(current) {
    this.#current = current;
  }
  next() {
    if (this.#current instanceof Empty) {
      return { done: true };
    } else {
      let { head, tail } = this.#current;
      this.#current = tail;
      return { value: head, done: false };
    }
  }
};
var Empty = class extends List {
};
var NonEmpty = class extends List {
  constructor(head, tail) {
    super();
    this.head = head;
    this.tail = tail;
  }
};
var BitArray = class _BitArray {
  constructor(buffer) {
    if (!(buffer instanceof Uint8Array)) {
      throw "BitArray can only be constructed from a Uint8Array";
    }
    this.buffer = buffer;
  }
  // @internal
  get length() {
    return this.buffer.length;
  }
  // @internal
  byteAt(index5) {
    return this.buffer[index5];
  }
  // @internal
  floatFromSlice(start3, end, isBigEndian) {
    return byteArrayToFloat(this.buffer, start3, end, isBigEndian);
  }
  // @internal
  intFromSlice(start3, end, isBigEndian, isSigned) {
    return byteArrayToInt(this.buffer, start3, end, isBigEndian, isSigned);
  }
  // @internal
  binaryFromSlice(start3, end) {
    const buffer = new Uint8Array(
      this.buffer.buffer,
      this.buffer.byteOffset + start3,
      end - start3
    );
    return new _BitArray(buffer);
  }
  // @internal
  sliceAfter(index5) {
    const buffer = new Uint8Array(
      this.buffer.buffer,
      this.buffer.byteOffset + index5,
      this.buffer.byteLength - index5
    );
    return new _BitArray(buffer);
  }
};
var UtfCodepoint = class {
  constructor(value3) {
    this.value = value3;
  }
};
function byteArrayToInt(byteArray, start3, end, isBigEndian, isSigned) {
  const byteSize = end - start3;
  if (byteSize <= 6) {
    let value3 = 0;
    if (isBigEndian) {
      for (let i = start3; i < end; i++) {
        value3 = value3 * 256 + byteArray[i];
      }
    } else {
      for (let i = end - 1; i >= start3; i--) {
        value3 = value3 * 256 + byteArray[i];
      }
    }
    if (isSigned) {
      const highBit = 2 ** (byteSize * 8 - 1);
      if (value3 >= highBit) {
        value3 -= highBit * 2;
      }
    }
    return value3;
  } else {
    let value3 = 0n;
    if (isBigEndian) {
      for (let i = start3; i < end; i++) {
        value3 = (value3 << 8n) + BigInt(byteArray[i]);
      }
    } else {
      for (let i = end - 1; i >= start3; i--) {
        value3 = (value3 << 8n) + BigInt(byteArray[i]);
      }
    }
    if (isSigned) {
      const highBit = 1n << BigInt(byteSize * 8 - 1);
      if (value3 >= highBit) {
        value3 -= highBit * 2n;
      }
    }
    return Number(value3);
  }
}
function byteArrayToFloat(byteArray, start3, end, isBigEndian) {
  const view3 = new DataView(byteArray.buffer);
  const byteSize = end - start3;
  if (byteSize === 8) {
    return view3.getFloat64(start3, !isBigEndian);
  } else if (byteSize === 4) {
    return view3.getFloat32(start3, !isBigEndian);
  } else {
    const msg = `Sized floats must be 32-bit or 64-bit on JavaScript, got size of ${byteSize * 8} bits`;
    throw new globalThis.Error(msg);
  }
}
var Result = class _Result extends CustomType {
  // @internal
  static isResult(data) {
    return data instanceof _Result;
  }
};
var Ok = class extends Result {
  constructor(value3) {
    super();
    this[0] = value3;
  }
  // @internal
  isOk() {
    return true;
  }
};
var Error = class extends Result {
  constructor(detail) {
    super();
    this[0] = detail;
  }
  // @internal
  isOk() {
    return false;
  }
};
function isEqual(x, y) {
  let values2 = [x, y];
  while (values2.length) {
    let a2 = values2.pop();
    let b = values2.pop();
    if (a2 === b)
      continue;
    if (!isObject(a2) || !isObject(b))
      return false;
    let unequal = !structurallyCompatibleObjects(a2, b) || unequalDates(a2, b) || unequalBuffers(a2, b) || unequalArrays(a2, b) || unequalMaps(a2, b) || unequalSets(a2, b) || unequalRegExps(a2, b);
    if (unequal)
      return false;
    const proto = Object.getPrototypeOf(a2);
    if (proto !== null && typeof proto.equals === "function") {
      try {
        if (a2.equals(b))
          continue;
        else
          return false;
      } catch {
      }
    }
    let [keys2, get] = getters(a2);
    for (let k of keys2(a2)) {
      values2.push(get(a2, k), get(b, k));
    }
  }
  return true;
}
function getters(object3) {
  if (object3 instanceof Map) {
    return [(x) => x.keys(), (x, y) => x.get(y)];
  } else {
    let extra = object3 instanceof globalThis.Error ? ["message"] : [];
    return [(x) => [...extra, ...Object.keys(x)], (x, y) => x[y]];
  }
}
function unequalDates(a2, b) {
  return a2 instanceof Date && (a2 > b || a2 < b);
}
function unequalBuffers(a2, b) {
  return a2.buffer instanceof ArrayBuffer && a2.BYTES_PER_ELEMENT && !(a2.byteLength === b.byteLength && a2.every((n, i) => n === b[i]));
}
function unequalArrays(a2, b) {
  return Array.isArray(a2) && a2.length !== b.length;
}
function unequalMaps(a2, b) {
  return a2 instanceof Map && a2.size !== b.size;
}
function unequalSets(a2, b) {
  return a2 instanceof Set && (a2.size != b.size || [...a2].some((e) => !b.has(e)));
}
function unequalRegExps(a2, b) {
  return a2 instanceof RegExp && (a2.source !== b.source || a2.flags !== b.flags);
}
function isObject(a2) {
  return typeof a2 === "object" && a2 !== null;
}
function structurallyCompatibleObjects(a2, b) {
  if (typeof a2 !== "object" && typeof b !== "object" && (!a2 || !b))
    return false;
  let nonstructural = [Promise, WeakSet, WeakMap, Function];
  if (nonstructural.some((c) => a2 instanceof c))
    return false;
  return a2.constructor === b.constructor;
}
function remainderInt(a2, b) {
  if (b === 0) {
    return 0;
  } else {
    return a2 % b;
  }
}
function divideInt(a2, b) {
  return Math.trunc(divideFloat(a2, b));
}
function divideFloat(a2, b) {
  if (b === 0) {
    return 0;
  } else {
    return a2 / b;
  }
}
function makeError(variant, module, line, fn, message, extra) {
  let error = new globalThis.Error(message);
  error.gleam_error = variant;
  error.module = module;
  error.line = line;
  error.function = fn;
  error.fn = fn;
  for (let k in extra)
    error[k] = extra[k];
  return error;
}

// build/dev/javascript/gleam_stdlib/gleam/order.mjs
var Lt = class extends CustomType {
};
var Eq = class extends CustomType {
};
var Gt = class extends CustomType {
};

// build/dev/javascript/gleam_stdlib/gleam/option.mjs
var Some = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var None = class extends CustomType {
};
function to_result(option, e) {
  if (option instanceof Some) {
    let a2 = option[0];
    return new Ok(a2);
  } else {
    return new Error(e);
  }
}
function map(option, fun) {
  if (option instanceof Some) {
    let x = option[0];
    return new Some(fun(x));
  } else {
    return new None();
  }
}
function flatten(option) {
  if (option instanceof Some) {
    let x = option[0];
    return x;
  } else {
    return new None();
  }
}

// build/dev/javascript/gleam_stdlib/gleam/dict.mjs
function insert(dict2, key2, value3) {
  return map_insert(key2, value3, dict2);
}
function reverse_and_concat(loop$remaining, loop$accumulator) {
  while (true) {
    let remaining = loop$remaining;
    let accumulator = loop$accumulator;
    if (remaining.hasLength(0)) {
      return accumulator;
    } else {
      let first4 = remaining.head;
      let rest = remaining.tail;
      loop$remaining = rest;
      loop$accumulator = prepend(first4, accumulator);
    }
  }
}
function do_keys_loop(loop$list, loop$acc) {
  while (true) {
    let list4 = loop$list;
    let acc = loop$acc;
    if (list4.hasLength(0)) {
      return reverse_and_concat(acc, toList([]));
    } else {
      let key2 = list4.head[0];
      let rest = list4.tail;
      loop$list = rest;
      loop$acc = prepend(key2, acc);
    }
  }
}
function keys(dict2) {
  return do_keys_loop(map_to_list(dict2), toList([]));
}

// build/dev/javascript/gleam_stdlib/gleam/list.mjs
function reverse_and_prepend(loop$prefix, loop$suffix) {
  while (true) {
    let prefix = loop$prefix;
    let suffix = loop$suffix;
    if (prefix.hasLength(0)) {
      return suffix;
    } else {
      let first$1 = prefix.head;
      let rest$1 = prefix.tail;
      loop$prefix = rest$1;
      loop$suffix = prepend(first$1, suffix);
    }
  }
}
function reverse(list4) {
  return reverse_and_prepend(list4, toList([]));
}
function contains(loop$list, loop$elem) {
  while (true) {
    let list4 = loop$list;
    let elem = loop$elem;
    if (list4.hasLength(0)) {
      return false;
    } else if (list4.atLeastLength(1) && isEqual(list4.head, elem)) {
      let first$1 = list4.head;
      return true;
    } else {
      let rest$1 = list4.tail;
      loop$list = rest$1;
      loop$elem = elem;
    }
  }
}
function filter_loop(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list4 = loop$list;
    let fun = loop$fun;
    let acc = loop$acc;
    if (list4.hasLength(0)) {
      return reverse(acc);
    } else {
      let first$1 = list4.head;
      let rest$1 = list4.tail;
      let new_acc = (() => {
        let $ = fun(first$1);
        if ($) {
          return prepend(first$1, acc);
        } else {
          return acc;
        }
      })();
      loop$list = rest$1;
      loop$fun = fun;
      loop$acc = new_acc;
    }
  }
}
function filter(list4, predicate) {
  return filter_loop(list4, predicate, toList([]));
}
function map_loop(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list4 = loop$list;
    let fun = loop$fun;
    let acc = loop$acc;
    if (list4.hasLength(0)) {
      return reverse(acc);
    } else {
      let first$1 = list4.head;
      let rest$1 = list4.tail;
      loop$list = rest$1;
      loop$fun = fun;
      loop$acc = prepend(fun(first$1), acc);
    }
  }
}
function map2(list4, fun) {
  return map_loop(list4, fun, toList([]));
}
function try_map_loop(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list4 = loop$list;
    let fun = loop$fun;
    let acc = loop$acc;
    if (list4.hasLength(0)) {
      return new Ok(reverse(acc));
    } else {
      let first$1 = list4.head;
      let rest$1 = list4.tail;
      let $ = fun(first$1);
      if ($.isOk()) {
        let first$2 = $[0];
        loop$list = rest$1;
        loop$fun = fun;
        loop$acc = prepend(first$2, acc);
      } else {
        let error = $[0];
        return new Error(error);
      }
    }
  }
}
function try_map(list4, fun) {
  return try_map_loop(list4, fun, toList([]));
}
function append_loop(loop$first, loop$second) {
  while (true) {
    let first4 = loop$first;
    let second2 = loop$second;
    if (first4.hasLength(0)) {
      return second2;
    } else {
      let first$1 = first4.head;
      let rest$1 = first4.tail;
      loop$first = rest$1;
      loop$second = prepend(first$1, second2);
    }
  }
}
function append(first4, second2) {
  return append_loop(reverse(first4), second2);
}
function fold(loop$list, loop$initial, loop$fun) {
  while (true) {
    let list4 = loop$list;
    let initial = loop$initial;
    let fun = loop$fun;
    if (list4.hasLength(0)) {
      return initial;
    } else {
      let first$1 = list4.head;
      let rest$1 = list4.tail;
      loop$list = rest$1;
      loop$initial = fun(initial, first$1);
      loop$fun = fun;
    }
  }
}
function index_fold_loop(loop$over, loop$acc, loop$with, loop$index) {
  while (true) {
    let over = loop$over;
    let acc = loop$acc;
    let with$ = loop$with;
    let index5 = loop$index;
    if (over.hasLength(0)) {
      return acc;
    } else {
      let first$1 = over.head;
      let rest$1 = over.tail;
      loop$over = rest$1;
      loop$acc = with$(acc, first$1, index5);
      loop$with = with$;
      loop$index = index5 + 1;
    }
  }
}
function index_fold(list4, initial, fun) {
  return index_fold_loop(list4, initial, fun, 0);
}
function any(loop$list, loop$predicate) {
  while (true) {
    let list4 = loop$list;
    let predicate = loop$predicate;
    if (list4.hasLength(0)) {
      return false;
    } else {
      let first$1 = list4.head;
      let rest$1 = list4.tail;
      let $ = predicate(first$1);
      if ($) {
        return true;
      } else {
        loop$list = rest$1;
        loop$predicate = predicate;
      }
    }
  }
}

// build/dev/javascript/gleam_stdlib/gleam/result.mjs
function map3(result, fun) {
  if (result.isOk()) {
    let x = result[0];
    return new Ok(fun(x));
  } else {
    let e = result[0];
    return new Error(e);
  }
}
function map_error(result, fun) {
  if (result.isOk()) {
    let x = result[0];
    return new Ok(x);
  } else {
    let error = result[0];
    return new Error(fun(error));
  }
}
function try$(result, fun) {
  if (result.isOk()) {
    let x = result[0];
    return fun(x);
  } else {
    let e = result[0];
    return new Error(e);
  }
}
function then$(result, fun) {
  return try$(result, fun);
}
function unwrap(result, default$2) {
  if (result.isOk()) {
    let v = result[0];
    return v;
  } else {
    return default$2;
  }
}

// build/dev/javascript/gleam_stdlib/gleam/dynamic.mjs
var DecodeError = class extends CustomType {
  constructor(expected, found, path) {
    super();
    this.expected = expected;
    this.found = found;
    this.path = path;
  }
};
function map_errors(result, f) {
  return map_error(
    result,
    (_capture) => {
      return map2(_capture, f);
    }
  );
}
function string(data) {
  return decode_string(data);
}
function do_any(decoders) {
  return (data) => {
    if (decoders.hasLength(0)) {
      return new Error(
        toList([new DecodeError("another type", classify_dynamic(data), toList([]))])
      );
    } else {
      let decoder4 = decoders.head;
      let decoders$1 = decoders.tail;
      let $ = decoder4(data);
      if ($.isOk()) {
        let decoded = $[0];
        return new Ok(decoded);
      } else {
        return do_any(decoders$1)(data);
      }
    }
  };
}
function push_path(error, name) {
  let name$1 = identity(name);
  let decoder4 = do_any(
    toList([
      decode_string,
      (x) => {
        return map3(decode_int(x), to_string);
      }
    ])
  );
  let name$2 = (() => {
    let $ = decoder4(name$1);
    if ($.isOk()) {
      let name$22 = $[0];
      return name$22;
    } else {
      let _pipe = toList(["<", classify_dynamic(name$1), ">"]);
      let _pipe$1 = concat(_pipe);
      return identity(_pipe$1);
    }
  })();
  let _record = error;
  return new DecodeError(
    _record.expected,
    _record.found,
    prepend(name$2, error.path)
  );
}
function field(name, inner_type) {
  return (value3) => {
    let missing_field_error = new DecodeError("field", "nothing", toList([]));
    return try$(
      decode_field(value3, name),
      (maybe_inner) => {
        let _pipe = maybe_inner;
        let _pipe$1 = to_result(_pipe, toList([missing_field_error]));
        let _pipe$2 = try$(_pipe$1, inner_type);
        return map_errors(
          _pipe$2,
          (_capture) => {
            return push_path(_capture, name);
          }
        );
      }
    );
  };
}

// build/dev/javascript/gleam_stdlib/dict.mjs
var referenceMap = /* @__PURE__ */ new WeakMap();
var tempDataView = new DataView(new ArrayBuffer(8));
var referenceUID = 0;
function hashByReference(o) {
  const known = referenceMap.get(o);
  if (known !== void 0) {
    return known;
  }
  const hash = referenceUID++;
  if (referenceUID === 2147483647) {
    referenceUID = 0;
  }
  referenceMap.set(o, hash);
  return hash;
}
function hashMerge(a2, b) {
  return a2 ^ b + 2654435769 + (a2 << 6) + (a2 >> 2) | 0;
}
function hashString(s) {
  let hash = 0;
  const len = s.length;
  for (let i = 0; i < len; i++) {
    hash = Math.imul(31, hash) + s.charCodeAt(i) | 0;
  }
  return hash;
}
function hashNumber(n) {
  tempDataView.setFloat64(0, n);
  const i = tempDataView.getInt32(0);
  const j = tempDataView.getInt32(4);
  return Math.imul(73244475, i >> 16 ^ i) ^ j;
}
function hashBigInt(n) {
  return hashString(n.toString());
}
function hashObject(o) {
  const proto = Object.getPrototypeOf(o);
  if (proto !== null && typeof proto.hashCode === "function") {
    try {
      const code3 = o.hashCode(o);
      if (typeof code3 === "number") {
        return code3;
      }
    } catch {
    }
  }
  if (o instanceof Promise || o instanceof WeakSet || o instanceof WeakMap) {
    return hashByReference(o);
  }
  if (o instanceof Date) {
    return hashNumber(o.getTime());
  }
  let h = 0;
  if (o instanceof ArrayBuffer) {
    o = new Uint8Array(o);
  }
  if (Array.isArray(o) || o instanceof Uint8Array) {
    for (let i = 0; i < o.length; i++) {
      h = Math.imul(31, h) + getHash(o[i]) | 0;
    }
  } else if (o instanceof Set) {
    o.forEach((v) => {
      h = h + getHash(v) | 0;
    });
  } else if (o instanceof Map) {
    o.forEach((v, k) => {
      h = h + hashMerge(getHash(v), getHash(k)) | 0;
    });
  } else {
    const keys2 = Object.keys(o);
    for (let i = 0; i < keys2.length; i++) {
      const k = keys2[i];
      const v = o[k];
      h = h + hashMerge(getHash(v), hashString(k)) | 0;
    }
  }
  return h;
}
function getHash(u) {
  if (u === null)
    return 1108378658;
  if (u === void 0)
    return 1108378659;
  if (u === true)
    return 1108378657;
  if (u === false)
    return 1108378656;
  switch (typeof u) {
    case "number":
      return hashNumber(u);
    case "string":
      return hashString(u);
    case "bigint":
      return hashBigInt(u);
    case "object":
      return hashObject(u);
    case "symbol":
      return hashByReference(u);
    case "function":
      return hashByReference(u);
    default:
      return 0;
  }
}
var SHIFT = 5;
var BUCKET_SIZE = Math.pow(2, SHIFT);
var MASK = BUCKET_SIZE - 1;
var MAX_INDEX_NODE = BUCKET_SIZE / 2;
var MIN_ARRAY_NODE = BUCKET_SIZE / 4;
var ENTRY = 0;
var ARRAY_NODE = 1;
var INDEX_NODE = 2;
var COLLISION_NODE = 3;
var EMPTY = {
  type: INDEX_NODE,
  bitmap: 0,
  array: []
};
function mask(hash, shift) {
  return hash >>> shift & MASK;
}
function bitpos(hash, shift) {
  return 1 << mask(hash, shift);
}
function bitcount(x) {
  x -= x >> 1 & 1431655765;
  x = (x & 858993459) + (x >> 2 & 858993459);
  x = x + (x >> 4) & 252645135;
  x += x >> 8;
  x += x >> 16;
  return x & 127;
}
function index(bitmap, bit) {
  return bitcount(bitmap & bit - 1);
}
function cloneAndSet(arr, at2, val) {
  const len = arr.length;
  const out = new Array(len);
  for (let i = 0; i < len; ++i) {
    out[i] = arr[i];
  }
  out[at2] = val;
  return out;
}
function spliceIn(arr, at2, val) {
  const len = arr.length;
  const out = new Array(len + 1);
  let i = 0;
  let g = 0;
  while (i < at2) {
    out[g++] = arr[i++];
  }
  out[g++] = val;
  while (i < len) {
    out[g++] = arr[i++];
  }
  return out;
}
function spliceOut(arr, at2) {
  const len = arr.length;
  const out = new Array(len - 1);
  let i = 0;
  let g = 0;
  while (i < at2) {
    out[g++] = arr[i++];
  }
  ++i;
  while (i < len) {
    out[g++] = arr[i++];
  }
  return out;
}
function createNode(shift, key1, val1, key2hash, key2, val2) {
  const key1hash = getHash(key1);
  if (key1hash === key2hash) {
    return {
      type: COLLISION_NODE,
      hash: key1hash,
      array: [
        { type: ENTRY, k: key1, v: val1 },
        { type: ENTRY, k: key2, v: val2 }
      ]
    };
  }
  const addedLeaf = { val: false };
  return assoc(
    assocIndex(EMPTY, shift, key1hash, key1, val1, addedLeaf),
    shift,
    key2hash,
    key2,
    val2,
    addedLeaf
  );
}
function assoc(root, shift, hash, key2, val, addedLeaf) {
  switch (root.type) {
    case ARRAY_NODE:
      return assocArray(root, shift, hash, key2, val, addedLeaf);
    case INDEX_NODE:
      return assocIndex(root, shift, hash, key2, val, addedLeaf);
    case COLLISION_NODE:
      return assocCollision(root, shift, hash, key2, val, addedLeaf);
  }
}
function assocArray(root, shift, hash, key2, val, addedLeaf) {
  const idx = mask(hash, shift);
  const node = root.array[idx];
  if (node === void 0) {
    addedLeaf.val = true;
    return {
      type: ARRAY_NODE,
      size: root.size + 1,
      array: cloneAndSet(root.array, idx, { type: ENTRY, k: key2, v: val })
    };
  }
  if (node.type === ENTRY) {
    if (isEqual(key2, node.k)) {
      if (val === node.v) {
        return root;
      }
      return {
        type: ARRAY_NODE,
        size: root.size,
        array: cloneAndSet(root.array, idx, {
          type: ENTRY,
          k: key2,
          v: val
        })
      };
    }
    addedLeaf.val = true;
    return {
      type: ARRAY_NODE,
      size: root.size,
      array: cloneAndSet(
        root.array,
        idx,
        createNode(shift + SHIFT, node.k, node.v, hash, key2, val)
      )
    };
  }
  const n = assoc(node, shift + SHIFT, hash, key2, val, addedLeaf);
  if (n === node) {
    return root;
  }
  return {
    type: ARRAY_NODE,
    size: root.size,
    array: cloneAndSet(root.array, idx, n)
  };
}
function assocIndex(root, shift, hash, key2, val, addedLeaf) {
  const bit = bitpos(hash, shift);
  const idx = index(root.bitmap, bit);
  if ((root.bitmap & bit) !== 0) {
    const node = root.array[idx];
    if (node.type !== ENTRY) {
      const n = assoc(node, shift + SHIFT, hash, key2, val, addedLeaf);
      if (n === node) {
        return root;
      }
      return {
        type: INDEX_NODE,
        bitmap: root.bitmap,
        array: cloneAndSet(root.array, idx, n)
      };
    }
    const nodeKey = node.k;
    if (isEqual(key2, nodeKey)) {
      if (val === node.v) {
        return root;
      }
      return {
        type: INDEX_NODE,
        bitmap: root.bitmap,
        array: cloneAndSet(root.array, idx, {
          type: ENTRY,
          k: key2,
          v: val
        })
      };
    }
    addedLeaf.val = true;
    return {
      type: INDEX_NODE,
      bitmap: root.bitmap,
      array: cloneAndSet(
        root.array,
        idx,
        createNode(shift + SHIFT, nodeKey, node.v, hash, key2, val)
      )
    };
  } else {
    const n = root.array.length;
    if (n >= MAX_INDEX_NODE) {
      const nodes = new Array(32);
      const jdx = mask(hash, shift);
      nodes[jdx] = assocIndex(EMPTY, shift + SHIFT, hash, key2, val, addedLeaf);
      let j = 0;
      let bitmap = root.bitmap;
      for (let i = 0; i < 32; i++) {
        if ((bitmap & 1) !== 0) {
          const node = root.array[j++];
          nodes[i] = node;
        }
        bitmap = bitmap >>> 1;
      }
      return {
        type: ARRAY_NODE,
        size: n + 1,
        array: nodes
      };
    } else {
      const newArray = spliceIn(root.array, idx, {
        type: ENTRY,
        k: key2,
        v: val
      });
      addedLeaf.val = true;
      return {
        type: INDEX_NODE,
        bitmap: root.bitmap | bit,
        array: newArray
      };
    }
  }
}
function assocCollision(root, shift, hash, key2, val, addedLeaf) {
  if (hash === root.hash) {
    const idx = collisionIndexOf(root, key2);
    if (idx !== -1) {
      const entry = root.array[idx];
      if (entry.v === val) {
        return root;
      }
      return {
        type: COLLISION_NODE,
        hash,
        array: cloneAndSet(root.array, idx, { type: ENTRY, k: key2, v: val })
      };
    }
    const size = root.array.length;
    addedLeaf.val = true;
    return {
      type: COLLISION_NODE,
      hash,
      array: cloneAndSet(root.array, size, { type: ENTRY, k: key2, v: val })
    };
  }
  return assoc(
    {
      type: INDEX_NODE,
      bitmap: bitpos(root.hash, shift),
      array: [root]
    },
    shift,
    hash,
    key2,
    val,
    addedLeaf
  );
}
function collisionIndexOf(root, key2) {
  const size = root.array.length;
  for (let i = 0; i < size; i++) {
    if (isEqual(key2, root.array[i].k)) {
      return i;
    }
  }
  return -1;
}
function find(root, shift, hash, key2) {
  switch (root.type) {
    case ARRAY_NODE:
      return findArray(root, shift, hash, key2);
    case INDEX_NODE:
      return findIndex(root, shift, hash, key2);
    case COLLISION_NODE:
      return findCollision(root, key2);
  }
}
function findArray(root, shift, hash, key2) {
  const idx = mask(hash, shift);
  const node = root.array[idx];
  if (node === void 0) {
    return void 0;
  }
  if (node.type !== ENTRY) {
    return find(node, shift + SHIFT, hash, key2);
  }
  if (isEqual(key2, node.k)) {
    return node;
  }
  return void 0;
}
function findIndex(root, shift, hash, key2) {
  const bit = bitpos(hash, shift);
  if ((root.bitmap & bit) === 0) {
    return void 0;
  }
  const idx = index(root.bitmap, bit);
  const node = root.array[idx];
  if (node.type !== ENTRY) {
    return find(node, shift + SHIFT, hash, key2);
  }
  if (isEqual(key2, node.k)) {
    return node;
  }
  return void 0;
}
function findCollision(root, key2) {
  const idx = collisionIndexOf(root, key2);
  if (idx < 0) {
    return void 0;
  }
  return root.array[idx];
}
function without(root, shift, hash, key2) {
  switch (root.type) {
    case ARRAY_NODE:
      return withoutArray(root, shift, hash, key2);
    case INDEX_NODE:
      return withoutIndex(root, shift, hash, key2);
    case COLLISION_NODE:
      return withoutCollision(root, key2);
  }
}
function withoutArray(root, shift, hash, key2) {
  const idx = mask(hash, shift);
  const node = root.array[idx];
  if (node === void 0) {
    return root;
  }
  let n = void 0;
  if (node.type === ENTRY) {
    if (!isEqual(node.k, key2)) {
      return root;
    }
  } else {
    n = without(node, shift + SHIFT, hash, key2);
    if (n === node) {
      return root;
    }
  }
  if (n === void 0) {
    if (root.size <= MIN_ARRAY_NODE) {
      const arr = root.array;
      const out = new Array(root.size - 1);
      let i = 0;
      let j = 0;
      let bitmap = 0;
      while (i < idx) {
        const nv = arr[i];
        if (nv !== void 0) {
          out[j] = nv;
          bitmap |= 1 << i;
          ++j;
        }
        ++i;
      }
      ++i;
      while (i < arr.length) {
        const nv = arr[i];
        if (nv !== void 0) {
          out[j] = nv;
          bitmap |= 1 << i;
          ++j;
        }
        ++i;
      }
      return {
        type: INDEX_NODE,
        bitmap,
        array: out
      };
    }
    return {
      type: ARRAY_NODE,
      size: root.size - 1,
      array: cloneAndSet(root.array, idx, n)
    };
  }
  return {
    type: ARRAY_NODE,
    size: root.size,
    array: cloneAndSet(root.array, idx, n)
  };
}
function withoutIndex(root, shift, hash, key2) {
  const bit = bitpos(hash, shift);
  if ((root.bitmap & bit) === 0) {
    return root;
  }
  const idx = index(root.bitmap, bit);
  const node = root.array[idx];
  if (node.type !== ENTRY) {
    const n = without(node, shift + SHIFT, hash, key2);
    if (n === node) {
      return root;
    }
    if (n !== void 0) {
      return {
        type: INDEX_NODE,
        bitmap: root.bitmap,
        array: cloneAndSet(root.array, idx, n)
      };
    }
    if (root.bitmap === bit) {
      return void 0;
    }
    return {
      type: INDEX_NODE,
      bitmap: root.bitmap ^ bit,
      array: spliceOut(root.array, idx)
    };
  }
  if (isEqual(key2, node.k)) {
    if (root.bitmap === bit) {
      return void 0;
    }
    return {
      type: INDEX_NODE,
      bitmap: root.bitmap ^ bit,
      array: spliceOut(root.array, idx)
    };
  }
  return root;
}
function withoutCollision(root, key2) {
  const idx = collisionIndexOf(root, key2);
  if (idx < 0) {
    return root;
  }
  if (root.array.length === 1) {
    return void 0;
  }
  return {
    type: COLLISION_NODE,
    hash: root.hash,
    array: spliceOut(root.array, idx)
  };
}
function forEach(root, fn) {
  if (root === void 0) {
    return;
  }
  const items = root.array;
  const size = items.length;
  for (let i = 0; i < size; i++) {
    const item = items[i];
    if (item === void 0) {
      continue;
    }
    if (item.type === ENTRY) {
      fn(item.v, item.k);
      continue;
    }
    forEach(item, fn);
  }
}
var Dict = class _Dict {
  /**
   * @template V
   * @param {Record<string,V>} o
   * @returns {Dict<string,V>}
   */
  static fromObject(o) {
    const keys2 = Object.keys(o);
    let m = _Dict.new();
    for (let i = 0; i < keys2.length; i++) {
      const k = keys2[i];
      m = m.set(k, o[k]);
    }
    return m;
  }
  /**
   * @template K,V
   * @param {Map<K,V>} o
   * @returns {Dict<K,V>}
   */
  static fromMap(o) {
    let m = _Dict.new();
    o.forEach((v, k) => {
      m = m.set(k, v);
    });
    return m;
  }
  static new() {
    return new _Dict(void 0, 0);
  }
  /**
   * @param {undefined | Node<K,V>} root
   * @param {number} size
   */
  constructor(root, size) {
    this.root = root;
    this.size = size;
  }
  /**
   * @template NotFound
   * @param {K} key
   * @param {NotFound} notFound
   * @returns {NotFound | V}
   */
  get(key2, notFound) {
    if (this.root === void 0) {
      return notFound;
    }
    const found = find(this.root, 0, getHash(key2), key2);
    if (found === void 0) {
      return notFound;
    }
    return found.v;
  }
  /**
   * @param {K} key
   * @param {V} val
   * @returns {Dict<K,V>}
   */
  set(key2, val) {
    const addedLeaf = { val: false };
    const root = this.root === void 0 ? EMPTY : this.root;
    const newRoot = assoc(root, 0, getHash(key2), key2, val, addedLeaf);
    if (newRoot === this.root) {
      return this;
    }
    return new _Dict(newRoot, addedLeaf.val ? this.size + 1 : this.size);
  }
  /**
   * @param {K} key
   * @returns {Dict<K,V>}
   */
  delete(key2) {
    if (this.root === void 0) {
      return this;
    }
    const newRoot = without(this.root, 0, getHash(key2), key2);
    if (newRoot === this.root) {
      return this;
    }
    if (newRoot === void 0) {
      return _Dict.new();
    }
    return new _Dict(newRoot, this.size - 1);
  }
  /**
   * @param {K} key
   * @returns {boolean}
   */
  has(key2) {
    if (this.root === void 0) {
      return false;
    }
    return find(this.root, 0, getHash(key2), key2) !== void 0;
  }
  /**
   * @returns {[K,V][]}
   */
  entries() {
    if (this.root === void 0) {
      return [];
    }
    const result = [];
    this.forEach((v, k) => result.push([k, v]));
    return result;
  }
  /**
   *
   * @param {(val:V,key:K)=>void} fn
   */
  forEach(fn) {
    forEach(this.root, fn);
  }
  hashCode() {
    let h = 0;
    this.forEach((v, k) => {
      h = h + hashMerge(getHash(v), getHash(k)) | 0;
    });
    return h;
  }
  /**
   * @param {unknown} o
   * @returns {boolean}
   */
  equals(o) {
    if (!(o instanceof _Dict) || this.size !== o.size) {
      return false;
    }
    try {
      this.forEach((v, k) => {
        if (!isEqual(o.get(k, !v), v)) {
          throw unequalDictSymbol;
        }
      });
      return true;
    } catch (e) {
      if (e === unequalDictSymbol) {
        return false;
      }
      throw e;
    }
  }
};
var unequalDictSymbol = Symbol();

// build/dev/javascript/gleam_stdlib/gleam_stdlib.mjs
var Nil = void 0;
var NOT_FOUND = {};
function identity(x) {
  return x;
}
function parse_int(value3) {
  if (/^[-+]?(\d+)$/.test(value3)) {
    return new Ok(parseInt(value3));
  } else {
    return new Error(Nil);
  }
}
function to_string(term) {
  return term.toString();
}
function float_to_string(float4) {
  const string5 = float4.toString().replace("+", "");
  if (string5.indexOf(".") >= 0) {
    return string5;
  } else {
    const index5 = string5.indexOf("e");
    if (index5 >= 0) {
      return string5.slice(0, index5) + ".0" + string5.slice(index5);
    } else {
      return string5 + ".0";
    }
  }
}
function string_replace(string5, target2, substitute) {
  if (typeof string5.replaceAll !== "undefined") {
    return string5.replaceAll(target2, substitute);
  }
  return string5.replace(
    // $& means the whole matched string
    new RegExp(target2.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
    substitute
  );
}
function string_length(string5) {
  if (string5 === "") {
    return 0;
  }
  const iterator = graphemes_iterator(string5);
  if (iterator) {
    let i = 0;
    for (const _ of iterator) {
      i++;
    }
    return i;
  } else {
    return string5.match(/./gsu).length;
  }
}
function graphemes(string5) {
  const iterator = graphemes_iterator(string5);
  if (iterator) {
    return List.fromArray(Array.from(iterator).map((item) => item.segment));
  } else {
    return List.fromArray(string5.match(/./gsu));
  }
}
var segmenter = void 0;
function graphemes_iterator(string5) {
  if (globalThis.Intl && Intl.Segmenter) {
    segmenter ||= new Intl.Segmenter();
    return segmenter.segment(string5)[Symbol.iterator]();
  }
}
function pop_grapheme(string5) {
  let first4;
  const iterator = graphemes_iterator(string5);
  if (iterator) {
    first4 = iterator.next().value?.segment;
  } else {
    first4 = string5.match(/./su)?.[0];
  }
  if (first4) {
    return new Ok([first4, string5.slice(first4.length)]);
  } else {
    return new Error(Nil);
  }
}
function split(xs, pattern) {
  return List.fromArray(xs.split(pattern));
}
function join(xs, separator) {
  const iterator = xs[Symbol.iterator]();
  let result = iterator.next().value || "";
  let current = iterator.next();
  while (!current.done) {
    result = result + separator + current.value;
    current = iterator.next();
  }
  return result;
}
function concat(xs) {
  let result = "";
  for (const x of xs) {
    result = result + x;
  }
  return result;
}
function string_slice(string5, idx, len) {
  if (len <= 0 || idx >= string5.length) {
    return "";
  }
  const iterator = graphemes_iterator(string5);
  if (iterator) {
    while (idx-- > 0) {
      iterator.next();
    }
    let result = "";
    while (len-- > 0) {
      const v = iterator.next().value;
      if (v === void 0) {
        break;
      }
      result += v.segment;
    }
    return result;
  } else {
    return string5.match(/./gsu).slice(idx, idx + len).join("");
  }
}
function contains_string(haystack, needle) {
  return haystack.indexOf(needle) >= 0;
}
function ends_with(haystack, needle) {
  return haystack.endsWith(needle);
}
var unicode_whitespaces = [
  " ",
  // Space
  "	",
  // Horizontal tab
  "\n",
  // Line feed
  "\v",
  // Vertical tab
  "\f",
  // Form feed
  "\r",
  // Carriage return
  "\x85",
  // Next line
  "\u2028",
  // Line separator
  "\u2029"
  // Paragraph separator
].join("");
var trim_start_regex = new RegExp(`^[${unicode_whitespaces}]*`);
var trim_end_regex = new RegExp(`[${unicode_whitespaces}]*$`);
function trim_start(string5) {
  return string5.replace(trim_start_regex, "");
}
function trim_end(string5) {
  return string5.replace(trim_end_regex, "");
}
function print_debug(string5) {
  if (typeof process === "object" && process.stderr?.write) {
    process.stderr.write(string5 + "\n");
  } else if (typeof Deno === "object") {
    Deno.stderr.writeSync(new TextEncoder().encode(string5 + "\n"));
  } else {
    console.log(string5);
  }
}
function round2(float4) {
  return Math.round(float4);
}
function codepoint(int4) {
  return new UtfCodepoint(int4);
}
function string_to_codepoint_integer_list(string5) {
  return List.fromArray(Array.from(string5).map((item) => item.codePointAt(0)));
}
function utf_codepoint_to_int(utf_codepoint) {
  return utf_codepoint.value;
}
function new_map() {
  return Dict.new();
}
function map_to_list(map8) {
  return List.fromArray(map8.entries());
}
function map_get(map8, key2) {
  const value3 = map8.get(key2, NOT_FOUND);
  if (value3 === NOT_FOUND) {
    return new Error(Nil);
  }
  return new Ok(value3);
}
function map_insert(key2, value3, map8) {
  return map8.set(key2, value3);
}
function classify_dynamic(data) {
  if (typeof data === "string") {
    return "String";
  } else if (typeof data === "boolean") {
    return "Bool";
  } else if (data instanceof Result) {
    return "Result";
  } else if (data instanceof List) {
    return "List";
  } else if (data instanceof BitArray) {
    return "BitArray";
  } else if (data instanceof Dict) {
    return "Dict";
  } else if (Number.isInteger(data)) {
    return "Int";
  } else if (Array.isArray(data)) {
    return `Tuple of ${data.length} elements`;
  } else if (typeof data === "number") {
    return "Float";
  } else if (data === null) {
    return "Null";
  } else if (data === void 0) {
    return "Nil";
  } else {
    const type = typeof data;
    return type.charAt(0).toUpperCase() + type.slice(1);
  }
}
function decoder_error(expected, got) {
  return decoder_error_no_classify(expected, classify_dynamic(got));
}
function decoder_error_no_classify(expected, got) {
  return new Error(
    List.fromArray([new DecodeError(expected, got, List.fromArray([]))])
  );
}
function decode_string(data) {
  return typeof data === "string" ? new Ok(data) : decoder_error("String", data);
}
function decode_int(data) {
  return Number.isInteger(data) ? new Ok(data) : decoder_error("Int", data);
}
function decode_field(value3, name) {
  const not_a_map_error = () => decoder_error("Dict", value3);
  if (value3 instanceof Dict || value3 instanceof WeakMap || value3 instanceof Map) {
    const entry = map_get(value3, name);
    return new Ok(entry.isOk() ? new Some(entry[0]) : new None());
  } else if (value3 === null) {
    return not_a_map_error();
  } else if (Object.getPrototypeOf(value3) == Object.prototype) {
    return try_get_field(value3, name, () => new Ok(new None()));
  } else {
    return try_get_field(value3, name, not_a_map_error);
  }
}
function try_get_field(value3, field3, or_else) {
  try {
    return field3 in value3 ? new Ok(new Some(value3[field3])) : or_else();
  } catch {
    return or_else();
  }
}
function inspect(v) {
  const t = typeof v;
  if (v === true)
    return "True";
  if (v === false)
    return "False";
  if (v === null)
    return "//js(null)";
  if (v === void 0)
    return "Nil";
  if (t === "string")
    return inspectString(v);
  if (t === "bigint" || Number.isInteger(v))
    return v.toString();
  if (t === "number")
    return float_to_string(v);
  if (Array.isArray(v))
    return `#(${v.map(inspect).join(", ")})`;
  if (v instanceof List)
    return inspectList(v);
  if (v instanceof UtfCodepoint)
    return inspectUtfCodepoint(v);
  if (v instanceof BitArray)
    return inspectBitArray(v);
  if (v instanceof CustomType)
    return inspectCustomType(v);
  if (v instanceof Dict)
    return inspectDict(v);
  if (v instanceof Set)
    return `//js(Set(${[...v].map(inspect).join(", ")}))`;
  if (v instanceof RegExp)
    return `//js(${v})`;
  if (v instanceof Date)
    return `//js(Date("${v.toISOString()}"))`;
  if (v instanceof Function) {
    const args = [];
    for (const i of Array(v.length).keys())
      args.push(String.fromCharCode(i + 97));
    return `//fn(${args.join(", ")}) { ... }`;
  }
  return inspectObject(v);
}
function inspectString(str) {
  let new_str = '"';
  for (let i = 0; i < str.length; i++) {
    let char = str[i];
    switch (char) {
      case "\n":
        new_str += "\\n";
        break;
      case "\r":
        new_str += "\\r";
        break;
      case "	":
        new_str += "\\t";
        break;
      case "\f":
        new_str += "\\f";
        break;
      case "\\":
        new_str += "\\\\";
        break;
      case '"':
        new_str += '\\"';
        break;
      default:
        if (char < " " || char > "~" && char < "\xA0") {
          new_str += "\\u{" + char.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0") + "}";
        } else {
          new_str += char;
        }
    }
  }
  new_str += '"';
  return new_str;
}
function inspectDict(map8) {
  let body2 = "dict.from_list([";
  let first4 = true;
  map8.forEach((value3, key2) => {
    if (!first4)
      body2 = body2 + ", ";
    body2 = body2 + "#(" + inspect(key2) + ", " + inspect(value3) + ")";
    first4 = false;
  });
  return body2 + "])";
}
function inspectObject(v) {
  const name = Object.getPrototypeOf(v)?.constructor?.name || "Object";
  const props = [];
  for (const k of Object.keys(v)) {
    props.push(`${inspect(k)}: ${inspect(v[k])}`);
  }
  const body2 = props.length ? " " + props.join(", ") + " " : "";
  const head = name === "Object" ? "" : name + " ";
  return `//js(${head}{${body2}})`;
}
function inspectCustomType(record) {
  const props = Object.keys(record).map((label) => {
    const value3 = inspect(record[label]);
    return isNaN(parseInt(label)) ? `${label}: ${value3}` : value3;
  }).join(", ");
  return props ? `${record.constructor.name}(${props})` : record.constructor.name;
}
function inspectList(list4) {
  return `[${list4.toArray().map(inspect).join(", ")}]`;
}
function inspectBitArray(bits) {
  return `<<${Array.from(bits.buffer).join(", ")}>>`;
}
function inspectUtfCodepoint(codepoint2) {
  return `//utfcodepoint(${String.fromCodePoint(codepoint2.value)})`;
}

// build/dev/javascript/gleam_stdlib/gleam/float.mjs
function negate(x) {
  return -1 * x;
}
function round(x) {
  let $ = x >= 0;
  if ($) {
    return round2(x);
  } else {
    return 0 - round2(negate(x));
  }
}
function divide(a2, b) {
  if (b === 0) {
    return new Error(void 0);
  } else {
    let b$1 = b;
    return new Ok(divideFloat(a2, b$1));
  }
}

// build/dev/javascript/gleam_stdlib/gleam/int.mjs
function absolute_value(x) {
  let $ = x >= 0;
  if ($) {
    return x;
  } else {
    return x * -1;
  }
}
function min(a2, b) {
  let $ = a2 < b;
  if ($) {
    return a2;
  } else {
    return b;
  }
}
function max(a2, b) {
  let $ = a2 > b;
  if ($) {
    return a2;
  } else {
    return b;
  }
}

// build/dev/javascript/gleam_stdlib/gleam/string.mjs
function replace(string5, pattern, substitute) {
  let _pipe = string5;
  let _pipe$1 = identity(_pipe);
  let _pipe$2 = string_replace(_pipe$1, pattern, substitute);
  return identity(_pipe$2);
}
function slice(string5, idx, len) {
  let $ = len < 0;
  if ($) {
    return "";
  } else {
    let $1 = idx < 0;
    if ($1) {
      let translated_idx = string_length(string5) + idx;
      let $2 = translated_idx < 0;
      if ($2) {
        return "";
      } else {
        return string_slice(string5, translated_idx, len);
      }
    } else {
      return string_slice(string5, idx, len);
    }
  }
}
function drop_end(string5, num_graphemes) {
  let $ = num_graphemes < 0;
  if ($) {
    return string5;
  } else {
    return slice(string5, 0, string_length(string5) - num_graphemes);
  }
}
function concat2(strings) {
  let _pipe = strings;
  let _pipe$1 = concat(_pipe);
  return identity(_pipe$1);
}
function repeat_loop(loop$string, loop$times, loop$acc) {
  while (true) {
    let string5 = loop$string;
    let times = loop$times;
    let acc = loop$acc;
    let $ = times <= 0;
    if ($) {
      return acc;
    } else {
      loop$string = string5;
      loop$times = times - 1;
      loop$acc = acc + string5;
    }
  }
}
function repeat(string5, times) {
  return repeat_loop(string5, times, "");
}
function padding(size, pad_string) {
  let pad_string_length = string_length(pad_string);
  let num_pads = divideInt(size, pad_string_length);
  let extra = remainderInt(size, pad_string_length);
  return repeat(pad_string, num_pads) + slice(pad_string, 0, extra);
}
function pad_start(string5, desired_length, pad_string) {
  let current_length = string_length(string5);
  let to_pad_length = desired_length - current_length;
  let $ = to_pad_length <= 0;
  if ($) {
    return string5;
  } else {
    return padding(to_pad_length, pad_string) + string5;
  }
}
function pad_end(string5, desired_length, pad_string) {
  let current_length = string_length(string5);
  let to_pad_length = desired_length - current_length;
  let $ = to_pad_length <= 0;
  if ($) {
    return string5;
  } else {
    return string5 + padding(to_pad_length, pad_string);
  }
}
function trim(string5) {
  let _pipe = string5;
  let _pipe$1 = trim_start(_pipe);
  return trim_end(_pipe$1);
}
function drop_start(loop$string, loop$num_graphemes) {
  while (true) {
    let string5 = loop$string;
    let num_graphemes = loop$num_graphemes;
    let $ = num_graphemes > 0;
    if (!$) {
      return string5;
    } else {
      let $1 = pop_grapheme(string5);
      if ($1.isOk()) {
        let string$1 = $1[0][1];
        loop$string = string$1;
        loop$num_graphemes = num_graphemes - 1;
      } else {
        return string5;
      }
    }
  }
}
function split2(x, substring) {
  if (substring === "") {
    return graphemes(x);
  } else {
    let _pipe = x;
    let _pipe$1 = identity(_pipe);
    let _pipe$2 = split(_pipe$1, substring);
    return map2(_pipe$2, identity);
  }
}
function do_to_utf_codepoints(string5) {
  let _pipe = string5;
  let _pipe$1 = string_to_codepoint_integer_list(_pipe);
  return map2(_pipe$1, codepoint);
}
function to_utf_codepoints(string5) {
  return do_to_utf_codepoints(string5);
}
function first(string5) {
  let $ = pop_grapheme(string5);
  if ($.isOk()) {
    let first$1 = $[0][0];
    return new Ok(first$1);
  } else {
    let e = $[0];
    return new Error(e);
  }
}
function inspect2(term) {
  let _pipe = inspect(term);
  return identity(_pipe);
}

// build/dev/javascript/gleam_stdlib/gleam_stdlib_decode_ffi.mjs
function index2(data, key2) {
  const int4 = Number.isInteger(key2);
  if (data instanceof Dict || data instanceof WeakMap || data instanceof Map) {
    const token = {};
    const entry = data.get(key2, token);
    if (entry === token)
      return new Ok(new None());
    return new Ok(new Some(entry));
  }
  if ((key2 === 0 || key2 === 1 || key2 === 2) && data instanceof List) {
    let i = 0;
    for (const value3 of data) {
      if (i === key2)
        return new Ok(new Some(value3));
      i++;
    }
    return new Error("Indexable");
  }
  if (int4 && Array.isArray(data) || data && typeof data === "object" || data && Object.getPrototypeOf(data) === Object.prototype) {
    if (key2 in data)
      return new Ok(new Some(data[key2]));
    return new Ok(new None());
  }
  return new Error(int4 ? "Indexable" : "Dict");
}
function list(data, decode5, pushPath, index5, emptyList) {
  if (!(data instanceof List || Array.isArray(data))) {
    let error = new DecodeError2("List", classify_dynamic(data), emptyList);
    return [emptyList, List.fromArray([error])];
  }
  const decoded = [];
  for (const element2 of data) {
    const layer = decode5(element2);
    const [out, errors] = layer;
    if (errors instanceof NonEmpty) {
      const [_, errors2] = pushPath(layer, index5.toString());
      return [emptyList, errors2];
    }
    decoded.push(out);
    index5++;
  }
  return [List.fromArray(decoded), emptyList];
}
function int(data) {
  if (Number.isInteger(data))
    return new Ok(data);
  return new Error(0);
}
function string2(data) {
  if (typeof data === "string")
    return new Ok(data);
  return new Error(0);
}

// build/dev/javascript/gleam_stdlib/gleam/dynamic/decode.mjs
var DecodeError2 = class extends CustomType {
  constructor(expected, found, path) {
    super();
    this.expected = expected;
    this.found = found;
    this.path = path;
  }
};
var Decoder = class extends CustomType {
  constructor(function$) {
    super();
    this.function = function$;
  }
};
function run(data, decoder4) {
  let $ = decoder4.function(data);
  let maybe_invalid_data = $[0];
  let errors = $[1];
  if (errors.hasLength(0)) {
    return new Ok(maybe_invalid_data);
  } else {
    return new Error(errors);
  }
}
function success(data) {
  return new Decoder((_) => {
    return [data, toList([])];
  });
}
function map4(decoder4, transformer) {
  return new Decoder(
    (d) => {
      let $ = decoder4.function(d);
      let data = $[0];
      let errors = $[1];
      return [transformer(data), errors];
    }
  );
}
function then$2(decoder4, next) {
  return new Decoder(
    (dynamic_data) => {
      let $ = decoder4.function(dynamic_data);
      let data = $[0];
      let errors = $[1];
      let decoder$1 = next(data);
      let $1 = decoder$1.function(dynamic_data);
      let layer = $1;
      let data$1 = $1[0];
      if (errors.hasLength(0)) {
        return layer;
      } else {
        return [data$1, errors];
      }
    }
  );
}
function run_decoders(loop$data, loop$failure, loop$decoders) {
  while (true) {
    let data = loop$data;
    let failure = loop$failure;
    let decoders = loop$decoders;
    if (decoders.hasLength(0)) {
      return failure;
    } else {
      let decoder4 = decoders.head;
      let decoders$1 = decoders.tail;
      let $ = decoder4.function(data);
      let layer = $;
      let errors = $[1];
      if (errors.hasLength(0)) {
        return layer;
      } else {
        loop$data = data;
        loop$failure = failure;
        loop$decoders = decoders$1;
      }
    }
  }
}
function one_of(first4, alternatives) {
  return new Decoder(
    (dynamic_data) => {
      let $ = first4.function(dynamic_data);
      let layer = $;
      let errors = $[1];
      if (errors.hasLength(0)) {
        return layer;
      } else {
        return run_decoders(dynamic_data, layer, alternatives);
      }
    }
  );
}
function run_dynamic_function(data, name, f) {
  let $ = f(data);
  if ($.isOk()) {
    let data$1 = $[0];
    return [data$1, toList([])];
  } else {
    let zero = $[0];
    return [
      zero,
      toList([new DecodeError2(name, classify_dynamic(data), toList([]))])
    ];
  }
}
function decode_int2(data) {
  return run_dynamic_function(data, "Int", int);
}
var int2 = /* @__PURE__ */ new Decoder(decode_int2);
function decode_string2(data) {
  return run_dynamic_function(data, "String", string2);
}
var string3 = /* @__PURE__ */ new Decoder(decode_string2);
function list2(inner) {
  return new Decoder(
    (data) => {
      return list(
        data,
        inner.function,
        (p, k) => {
          return push_path2(p, toList([k]));
        },
        0,
        toList([])
      );
    }
  );
}
function push_path2(layer, path) {
  let decoder4 = one_of(
    string3,
    toList([
      (() => {
        let _pipe = int2;
        return map4(_pipe, to_string);
      })()
    ])
  );
  let path$1 = map2(
    path,
    (key2) => {
      let key$1 = identity(key2);
      let $ = run(key$1, decoder4);
      if ($.isOk()) {
        let key$2 = $[0];
        return key$2;
      } else {
        return "<" + classify_dynamic(key$1) + ">";
      }
    }
  );
  let errors = map2(
    layer[1],
    (error) => {
      let _record = error;
      return new DecodeError2(
        _record.expected,
        _record.found,
        append(path$1, error.path)
      );
    }
  );
  return [layer[0], errors];
}
function index3(loop$path, loop$position, loop$inner, loop$data, loop$handle_miss) {
  while (true) {
    let path = loop$path;
    let position = loop$position;
    let inner = loop$inner;
    let data = loop$data;
    let handle_miss = loop$handle_miss;
    if (path.hasLength(0)) {
      let _pipe = inner(data);
      return push_path2(_pipe, reverse(position));
    } else {
      let key2 = path.head;
      let path$1 = path.tail;
      let $ = index2(data, key2);
      if ($.isOk() && $[0] instanceof Some) {
        let data$1 = $[0][0];
        loop$path = path$1;
        loop$position = prepend(key2, position);
        loop$inner = inner;
        loop$data = data$1;
        loop$handle_miss = handle_miss;
      } else if ($.isOk() && $[0] instanceof None) {
        return handle_miss(data, prepend(key2, position));
      } else {
        let kind = $[0];
        let $1 = inner(data);
        let default$2 = $1[0];
        let _pipe = [
          default$2,
          toList([new DecodeError2(kind, classify_dynamic(data), toList([]))])
        ];
        return push_path2(_pipe, reverse(position));
      }
    }
  }
}
function subfield(field_path, field_decoder, next) {
  return new Decoder(
    (data) => {
      let $ = index3(
        field_path,
        toList([]),
        field_decoder.function,
        data,
        (data2, position) => {
          let $12 = field_decoder.function(data2);
          let default$2 = $12[0];
          let _pipe = [
            default$2,
            toList([new DecodeError2("Field", "Nothing", toList([]))])
          ];
          return push_path2(_pipe, reverse(position));
        }
      );
      let out = $[0];
      let errors1 = $[1];
      let $1 = next(out).function(data);
      let out$1 = $1[0];
      let errors2 = $1[1];
      return [out$1, append(errors1, errors2)];
    }
  );
}
function at(path, inner) {
  return new Decoder(
    (data) => {
      return index3(
        path,
        toList([]),
        inner.function,
        data,
        (data2, position) => {
          let $ = inner.function(data2);
          let default$2 = $[0];
          let _pipe = [
            default$2,
            toList([new DecodeError2("Field", "Nothing", toList([]))])
          ];
          return push_path2(_pipe, reverse(position));
        }
      );
    }
  );
}
function field2(field_name, field_decoder, next) {
  return subfield(toList([field_name]), field_decoder, next);
}

// build/dev/javascript/gleam_json/gleam_json_ffi.mjs
function decode(string5) {
  try {
    const result = JSON.parse(string5);
    return new Ok(result);
  } catch (err) {
    return new Error(getJsonDecodeError(err, string5));
  }
}
function getJsonDecodeError(stdErr, json) {
  if (isUnexpectedEndOfInput(stdErr))
    return new UnexpectedEndOfInput();
  return toUnexpectedByteError(stdErr, json);
}
function isUnexpectedEndOfInput(err) {
  const unexpectedEndOfInputRegex = /((unexpected (end|eof))|(end of data)|(unterminated string)|(json( parse error|\.parse)\: expected '(\:|\}|\])'))/i;
  return unexpectedEndOfInputRegex.test(err.message);
}
function toUnexpectedByteError(err, json) {
  let converters = [
    v8UnexpectedByteError,
    oldV8UnexpectedByteError,
    jsCoreUnexpectedByteError,
    spidermonkeyUnexpectedByteError
  ];
  for (let converter of converters) {
    let result = converter(err, json);
    if (result)
      return result;
  }
  return new UnexpectedByte("", 0);
}
function v8UnexpectedByteError(err) {
  const regex = /unexpected token '(.)', ".+" is not valid JSON/i;
  const match = regex.exec(err.message);
  if (!match)
    return null;
  const byte = toHex(match[1]);
  return new UnexpectedByte(byte, -1);
}
function oldV8UnexpectedByteError(err) {
  const regex = /unexpected token (.) in JSON at position (\d+)/i;
  const match = regex.exec(err.message);
  if (!match)
    return null;
  const byte = toHex(match[1]);
  const position = Number(match[2]);
  return new UnexpectedByte(byte, position);
}
function spidermonkeyUnexpectedByteError(err, json) {
  const regex = /(unexpected character|expected .*) at line (\d+) column (\d+)/i;
  const match = regex.exec(err.message);
  if (!match)
    return null;
  const line = Number(match[2]);
  const column = Number(match[3]);
  const position = getPositionFromMultiline(line, column, json);
  const byte = toHex(json[position]);
  return new UnexpectedByte(byte, position);
}
function jsCoreUnexpectedByteError(err) {
  const regex = /unexpected (identifier|token) "(.)"/i;
  const match = regex.exec(err.message);
  if (!match)
    return null;
  const byte = toHex(match[2]);
  return new UnexpectedByte(byte, 0);
}
function toHex(char) {
  return "0x" + char.charCodeAt(0).toString(16).toUpperCase();
}
function getPositionFromMultiline(line, column, string5) {
  if (line === 1)
    return column - 1;
  let currentLn = 1;
  let position = 0;
  string5.split("").find((char, idx) => {
    if (char === "\n")
      currentLn += 1;
    if (currentLn === line) {
      position = idx + column;
      return true;
    }
    return false;
  });
  return position;
}

// build/dev/javascript/gleam_json/gleam/json.mjs
var UnexpectedEndOfInput = class extends CustomType {
};
var UnexpectedByte = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var UnableToDecode = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
function do_parse(json, decoder4) {
  return then$(
    decode(json),
    (dynamic_value) => {
      let _pipe = run(dynamic_value, decoder4);
      return map_error(
        _pipe,
        (var0) => {
          return new UnableToDecode(var0);
        }
      );
    }
  );
}
function parse(json, decoder4) {
  return do_parse(json, decoder4);
}

// build/dev/javascript/gleam_stdlib/gleam/io.mjs
function debug(term) {
  let _pipe = term;
  let _pipe$1 = inspect2(_pipe);
  print_debug(_pipe$1);
  return term;
}

// build/dev/javascript/gleam_stdlib/gleam/bool.mjs
function guard(requirement, consequence, alternative) {
  if (requirement) {
    return consequence;
  } else {
    return alternative();
  }
}

// build/dev/javascript/lustre/lustre/effect.mjs
var Effect = class extends CustomType {
  constructor(all) {
    super();
    this.all = all;
  }
};
function none() {
  return new Effect(toList([]));
}

// build/dev/javascript/lustre/lustre/internals/vdom.mjs
var Text = class extends CustomType {
  constructor(content2) {
    super();
    this.content = content2;
  }
};
var Element2 = class extends CustomType {
  constructor(key2, namespace, tag, attrs, children2, self_closing, void$) {
    super();
    this.key = key2;
    this.namespace = namespace;
    this.tag = tag;
    this.attrs = attrs;
    this.children = children2;
    this.self_closing = self_closing;
    this.void = void$;
  }
};
var Map2 = class extends CustomType {
  constructor(subtree) {
    super();
    this.subtree = subtree;
  }
};
var Attribute = class extends CustomType {
  constructor(x0, x1, as_property) {
    super();
    this[0] = x0;
    this[1] = x1;
    this.as_property = as_property;
  }
};
var Event2 = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
function attribute_to_event_handler(attribute2) {
  if (attribute2 instanceof Attribute) {
    return new Error(void 0);
  } else {
    let name = attribute2[0];
    let handler = attribute2[1];
    let name$1 = drop_start(name, 2);
    return new Ok([name$1, handler]);
  }
}
function do_element_list_handlers(elements2, handlers2, key2) {
  return index_fold(
    elements2,
    handlers2,
    (handlers3, element2, index5) => {
      let key$1 = key2 + "-" + to_string(index5);
      return do_handlers(element2, handlers3, key$1);
    }
  );
}
function do_handlers(loop$element, loop$handlers, loop$key) {
  while (true) {
    let element2 = loop$element;
    let handlers2 = loop$handlers;
    let key2 = loop$key;
    if (element2 instanceof Text) {
      return handlers2;
    } else if (element2 instanceof Map2) {
      let subtree = element2.subtree;
      loop$element = subtree();
      loop$handlers = handlers2;
      loop$key = key2;
    } else {
      let attrs = element2.attrs;
      let children2 = element2.children;
      let handlers$1 = fold(
        attrs,
        handlers2,
        (handlers3, attr) => {
          let $ = attribute_to_event_handler(attr);
          if ($.isOk()) {
            let name = $[0][0];
            let handler = $[0][1];
            return insert(handlers3, key2 + "-" + name, handler);
          } else {
            return handlers3;
          }
        }
      );
      return do_element_list_handlers(children2, handlers$1, key2);
    }
  }
}
function handlers(element2) {
  return do_handlers(element2, new_map(), "0");
}

// build/dev/javascript/lustre/lustre/attribute.mjs
function attribute(name, value3) {
  return new Attribute(name, identity(value3), false);
}
function on(name, handler) {
  return new Event2("on" + name, handler);
}
function map5(attr, f) {
  if (attr instanceof Attribute) {
    let name$1 = attr[0];
    let value$1 = attr[1];
    let as_property = attr.as_property;
    return new Attribute(name$1, value$1, as_property);
  } else {
    let on$1 = attr[0];
    let handler = attr[1];
    return new Event2(on$1, (e) => {
      return map3(handler(e), f);
    });
  }
}
function style(properties) {
  return attribute(
    "style",
    fold(
      properties,
      "",
      (styles, _use1) => {
        let name$1 = _use1[0];
        let value$1 = _use1[1];
        return styles + name$1 + ":" + value$1 + ";";
      }
    )
  );
}
function class$(name) {
  return attribute("class", name);
}
function role(name) {
  return attribute("role", name);
}
function type_(name) {
  return attribute("type", name);
}

// build/dev/javascript/lustre/lustre/element.mjs
function element(tag, attrs, children2) {
  if (tag === "area") {
    return new Element2("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "base") {
    return new Element2("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "br") {
    return new Element2("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "col") {
    return new Element2("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "embed") {
    return new Element2("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "hr") {
    return new Element2("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "img") {
    return new Element2("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "input") {
    return new Element2("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "link") {
    return new Element2("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "meta") {
    return new Element2("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "param") {
    return new Element2("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "source") {
    return new Element2("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "track") {
    return new Element2("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "wbr") {
    return new Element2("", "", tag, attrs, toList([]), false, true);
  } else {
    return new Element2("", "", tag, attrs, children2, false, false);
  }
}
function text(content2) {
  return new Text(content2);
}
function fragment(elements2) {
  return element(
    "lustre-fragment",
    toList([style(toList([["display", "contents"]]))]),
    elements2
  );
}
function map6(element2, f) {
  if (element2 instanceof Text) {
    let content2 = element2.content;
    return new Text(content2);
  } else if (element2 instanceof Map2) {
    let subtree = element2.subtree;
    return new Map2(() => {
      return map6(subtree(), f);
    });
  } else {
    let key2 = element2.key;
    let namespace = element2.namespace;
    let tag = element2.tag;
    let attrs = element2.attrs;
    let children2 = element2.children;
    let self_closing = element2.self_closing;
    let void$ = element2.void;
    return new Map2(
      () => {
        return new Element2(
          key2,
          namespace,
          tag,
          map2(
            attrs,
            (_capture) => {
              return map5(_capture, f);
            }
          ),
          map2(children2, (_capture) => {
            return map6(_capture, f);
          }),
          self_closing,
          void$
        );
      }
    );
  }
}

// build/dev/javascript/gleam_stdlib/gleam/set.mjs
var Set2 = class extends CustomType {
  constructor(dict2) {
    super();
    this.dict = dict2;
  }
};
function new$2() {
  return new Set2(new_map());
}

// build/dev/javascript/lustre/lustre/internals/patch.mjs
var Diff = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Emit = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var Init = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
function is_empty_element_diff(diff2) {
  return isEqual(diff2.created, new_map()) && isEqual(
    diff2.removed,
    new$2()
  ) && isEqual(diff2.updated, new_map());
}

// build/dev/javascript/lustre/lustre/internals/runtime.mjs
var Attrs = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Batch = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var Debug = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Dispatch = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Emit2 = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var Event3 = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var Shutdown = class extends CustomType {
};
var Subscribe = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var Unsubscribe = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var ForceModel = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};

// build/dev/javascript/lustre/vdom.ffi.mjs
if (globalThis.customElements && !globalThis.customElements.get("lustre-fragment")) {
  globalThis.customElements.define(
    "lustre-fragment",
    class LustreFragment extends HTMLElement {
      constructor() {
        super();
      }
    }
  );
}
function morph(prev, next, dispatch) {
  let out;
  let stack = [{ prev, next, parent: prev.parentNode }];
  while (stack.length) {
    let { prev: prev2, next: next2, parent } = stack.pop();
    while (next2.subtree !== void 0)
      next2 = next2.subtree();
    if (next2.content !== void 0) {
      if (!prev2) {
        const created = document.createTextNode(next2.content);
        parent.appendChild(created);
        out ??= created;
      } else if (prev2.nodeType === Node.TEXT_NODE) {
        if (prev2.textContent !== next2.content)
          prev2.textContent = next2.content;
        out ??= prev2;
      } else {
        const created = document.createTextNode(next2.content);
        parent.replaceChild(created, prev2);
        out ??= created;
      }
    } else if (next2.tag !== void 0) {
      const created = createElementNode({
        prev: prev2,
        next: next2,
        dispatch,
        stack
      });
      if (!prev2) {
        parent.appendChild(created);
      } else if (prev2 !== created) {
        parent.replaceChild(created, prev2);
      }
      out ??= created;
    }
  }
  return out;
}
function createElementNode({ prev, next, dispatch, stack }) {
  const namespace = next.namespace || "http://www.w3.org/1999/xhtml";
  const canMorph = prev && prev.nodeType === Node.ELEMENT_NODE && prev.localName === next.tag && prev.namespaceURI === (next.namespace || "http://www.w3.org/1999/xhtml");
  const el = canMorph ? prev : namespace ? document.createElementNS(namespace, next.tag) : document.createElement(next.tag);
  let handlersForEl;
  if (!registeredHandlers.has(el)) {
    const emptyHandlers = /* @__PURE__ */ new Map();
    registeredHandlers.set(el, emptyHandlers);
    handlersForEl = emptyHandlers;
  } else {
    handlersForEl = registeredHandlers.get(el);
  }
  const prevHandlers = canMorph ? new Set(handlersForEl.keys()) : null;
  const prevAttributes = canMorph ? new Set(Array.from(prev.attributes, (a2) => a2.name)) : null;
  let className = null;
  let style3 = null;
  let innerHTML = null;
  if (canMorph && next.tag === "textarea") {
    const innertText = next.children[Symbol.iterator]().next().value?.content;
    if (innertText !== void 0)
      el.value = innertText;
  }
  const delegated = [];
  for (const attr of next.attrs) {
    const name = attr[0];
    const value3 = attr[1];
    if (attr.as_property) {
      if (el[name] !== value3)
        el[name] = value3;
      if (canMorph)
        prevAttributes.delete(name);
    } else if (name.startsWith("on")) {
      const eventName = name.slice(2);
      const callback = dispatch(value3, eventName === "input");
      if (!handlersForEl.has(eventName)) {
        el.addEventListener(eventName, lustreGenericEventHandler);
      }
      handlersForEl.set(eventName, callback);
      if (canMorph)
        prevHandlers.delete(eventName);
    } else if (name.startsWith("data-lustre-on-")) {
      const eventName = name.slice(15);
      const callback = dispatch(lustreServerEventHandler);
      if (!handlersForEl.has(eventName)) {
        el.addEventListener(eventName, lustreGenericEventHandler);
      }
      handlersForEl.set(eventName, callback);
      el.setAttribute(name, value3);
      if (canMorph) {
        prevHandlers.delete(eventName);
        prevAttributes.delete(name);
      }
    } else if (name.startsWith("delegate:data-") || name.startsWith("delegate:aria-")) {
      el.setAttribute(name, value3);
      delegated.push([name.slice(10), value3]);
    } else if (name === "class") {
      className = className === null ? value3 : className + " " + value3;
    } else if (name === "style") {
      style3 = style3 === null ? value3 : style3 + value3;
    } else if (name === "dangerous-unescaped-html") {
      innerHTML = value3;
    } else {
      if (el.getAttribute(name) !== value3)
        el.setAttribute(name, value3);
      if (name === "value" || name === "selected")
        el[name] = value3;
      if (canMorph)
        prevAttributes.delete(name);
    }
  }
  if (className !== null) {
    el.setAttribute("class", className);
    if (canMorph)
      prevAttributes.delete("class");
  }
  if (style3 !== null) {
    el.setAttribute("style", style3);
    if (canMorph)
      prevAttributes.delete("style");
  }
  if (canMorph) {
    for (const attr of prevAttributes) {
      el.removeAttribute(attr);
    }
    for (const eventName of prevHandlers) {
      handlersForEl.delete(eventName);
      el.removeEventListener(eventName, lustreGenericEventHandler);
    }
  }
  if (next.tag === "slot") {
    window.queueMicrotask(() => {
      for (const child of el.assignedElements()) {
        for (const [name, value3] of delegated) {
          if (!child.hasAttribute(name)) {
            child.setAttribute(name, value3);
          }
        }
      }
    });
  }
  if (next.key !== void 0 && next.key !== "") {
    el.setAttribute("data-lustre-key", next.key);
  } else if (innerHTML !== null) {
    el.innerHTML = innerHTML;
    return el;
  }
  let prevChild = el.firstChild;
  let seenKeys = null;
  let keyedChildren = null;
  let incomingKeyedChildren = null;
  let firstChild = children(next).next().value;
  if (canMorph && firstChild !== void 0 && // Explicit checks are more verbose but truthy checks force a bunch of comparisons
  // we don't care about: it's never gonna be a number etc.
  firstChild.key !== void 0 && firstChild.key !== "") {
    seenKeys = /* @__PURE__ */ new Set();
    keyedChildren = getKeyedChildren(prev);
    incomingKeyedChildren = getKeyedChildren(next);
    for (const child of children(next)) {
      prevChild = diffKeyedChild(
        prevChild,
        child,
        el,
        stack,
        incomingKeyedChildren,
        keyedChildren,
        seenKeys
      );
    }
  } else {
    for (const child of children(next)) {
      stack.unshift({ prev: prevChild, next: child, parent: el });
      prevChild = prevChild?.nextSibling;
    }
  }
  while (prevChild) {
    const next2 = prevChild.nextSibling;
    el.removeChild(prevChild);
    prevChild = next2;
  }
  return el;
}
var registeredHandlers = /* @__PURE__ */ new WeakMap();
function lustreGenericEventHandler(event2) {
  const target2 = event2.currentTarget;
  if (!registeredHandlers.has(target2)) {
    target2.removeEventListener(event2.type, lustreGenericEventHandler);
    return;
  }
  const handlersForEventTarget = registeredHandlers.get(target2);
  if (!handlersForEventTarget.has(event2.type)) {
    target2.removeEventListener(event2.type, lustreGenericEventHandler);
    return;
  }
  handlersForEventTarget.get(event2.type)(event2);
}
function lustreServerEventHandler(event2) {
  const el = event2.currentTarget;
  const tag = el.getAttribute(`data-lustre-on-${event2.type}`);
  const data = JSON.parse(el.getAttribute("data-lustre-data") || "{}");
  const include = JSON.parse(el.getAttribute("data-lustre-include") || "[]");
  switch (event2.type) {
    case "input":
    case "change":
      include.push("target.value");
      break;
  }
  return {
    tag,
    data: include.reduce(
      (data2, property) => {
        const path = property.split(".");
        for (let i = 0, o = data2, e = event2; i < path.length; i++) {
          if (i === path.length - 1) {
            o[path[i]] = e[path[i]];
          } else {
            o[path[i]] ??= {};
            e = e[path[i]];
            o = o[path[i]];
          }
        }
        return data2;
      },
      { data }
    )
  };
}
function getKeyedChildren(el) {
  const keyedChildren = /* @__PURE__ */ new Map();
  if (el) {
    for (const child of children(el)) {
      const key2 = child?.key || child?.getAttribute?.("data-lustre-key");
      if (key2)
        keyedChildren.set(key2, child);
    }
  }
  return keyedChildren;
}
function diffKeyedChild(prevChild, child, el, stack, incomingKeyedChildren, keyedChildren, seenKeys) {
  while (prevChild && !incomingKeyedChildren.has(prevChild.getAttribute("data-lustre-key"))) {
    const nextChild = prevChild.nextSibling;
    el.removeChild(prevChild);
    prevChild = nextChild;
  }
  if (keyedChildren.size === 0) {
    stack.unshift({ prev: prevChild, next: child, parent: el });
    prevChild = prevChild?.nextSibling;
    return prevChild;
  }
  if (seenKeys.has(child.key)) {
    console.warn(`Duplicate key found in Lustre vnode: ${child.key}`);
    stack.unshift({ prev: null, next: child, parent: el });
    return prevChild;
  }
  seenKeys.add(child.key);
  const keyedChild = keyedChildren.get(child.key);
  if (!keyedChild && !prevChild) {
    stack.unshift({ prev: null, next: child, parent: el });
    return prevChild;
  }
  if (!keyedChild && prevChild !== null) {
    const placeholder = document.createTextNode("");
    el.insertBefore(placeholder, prevChild);
    stack.unshift({ prev: placeholder, next: child, parent: el });
    return prevChild;
  }
  if (!keyedChild || keyedChild === prevChild) {
    stack.unshift({ prev: prevChild, next: child, parent: el });
    prevChild = prevChild?.nextSibling;
    return prevChild;
  }
  el.insertBefore(keyedChild, prevChild);
  stack.unshift({ prev: keyedChild, next: child, parent: el });
  return prevChild;
}
function* children(element2) {
  for (const child of element2.children) {
    yield* forceChild(child);
  }
}
function* forceChild(element2) {
  if (element2.subtree !== void 0) {
    yield* forceChild(element2.subtree());
  } else {
    yield element2;
  }
}

// build/dev/javascript/lustre/lustre.ffi.mjs
var LustreClientApplication = class _LustreClientApplication {
  /**
   * @template Flags
   *
   * @param {object} app
   * @param {(flags: Flags) => [Model, Lustre.Effect<Msg>]} app.init
   * @param {(msg: Msg, model: Model) => [Model, Lustre.Effect<Msg>]} app.update
   * @param {(model: Model) => Lustre.Element<Msg>} app.view
   * @param {string | HTMLElement} selector
   * @param {Flags} flags
   *
   * @returns {Gleam.Ok<(action: Lustre.Action<Lustre.Client, Msg>>) => void>}
   */
  static start({ init: init4, update: update3, view: view3 }, selector, flags) {
    if (!is_browser())
      return new Error(new NotABrowser());
    const root = selector instanceof HTMLElement ? selector : document.querySelector(selector);
    if (!root)
      return new Error(new ElementNotFound(selector));
    const app = new _LustreClientApplication(root, init4(flags), update3, view3);
    return new Ok((action) => app.send(action));
  }
  /**
   * @param {Element} root
   * @param {[Model, Lustre.Effect<Msg>]} init
   * @param {(model: Model, msg: Msg) => [Model, Lustre.Effect<Msg>]} update
   * @param {(model: Model) => Lustre.Element<Msg>} view
   *
   * @returns {LustreClientApplication}
   */
  constructor(root, [init4, effects], update3, view3) {
    this.root = root;
    this.#model = init4;
    this.#update = update3;
    this.#view = view3;
    this.#tickScheduled = window.setTimeout(
      () => this.#tick(effects.all.toArray(), true),
      0
    );
  }
  /** @type {Element} */
  root;
  /**
   * @param {Lustre.Action<Lustre.Client, Msg>} action
   *
   * @returns {void}
   */
  send(action) {
    if (action instanceof Debug) {
      if (action[0] instanceof ForceModel) {
        this.#tickScheduled = window.clearTimeout(this.#tickScheduled);
        this.#queue = [];
        this.#model = action[0][0];
        const vdom = this.#view(this.#model);
        const dispatch = (handler, immediate = false) => (event2) => {
          const result = handler(event2);
          if (result instanceof Ok) {
            this.send(new Dispatch(result[0], immediate));
          }
        };
        const prev = this.root.firstChild ?? this.root.appendChild(document.createTextNode(""));
        morph(prev, vdom, dispatch);
      }
    } else if (action instanceof Dispatch) {
      const msg = action[0];
      const immediate = action[1] ?? false;
      this.#queue.push(msg);
      if (immediate) {
        this.#tickScheduled = window.clearTimeout(this.#tickScheduled);
        this.#tick();
      } else if (!this.#tickScheduled) {
        this.#tickScheduled = window.setTimeout(() => this.#tick());
      }
    } else if (action instanceof Emit2) {
      const event2 = action[0];
      const data = action[1];
      this.root.dispatchEvent(
        new CustomEvent(event2, {
          detail: data,
          bubbles: true,
          composed: true
        })
      );
    } else if (action instanceof Shutdown) {
      this.#tickScheduled = window.clearTimeout(this.#tickScheduled);
      this.#model = null;
      this.#update = null;
      this.#view = null;
      this.#queue = null;
      while (this.root.firstChild) {
        this.root.firstChild.remove();
      }
    }
  }
  /** @type {Model} */
  #model;
  /** @type {(model: Model, msg: Msg) => [Model, Lustre.Effect<Msg>]} */
  #update;
  /** @type {(model: Model) => Lustre.Element<Msg>} */
  #view;
  /** @type {Array<Msg>} */
  #queue = [];
  /** @type {number | undefined} */
  #tickScheduled;
  /**
   * @param {Lustre.Effect<Msg>[]} effects
   */
  #tick(effects = []) {
    this.#tickScheduled = void 0;
    this.#flush(effects);
    const vdom = this.#view(this.#model);
    const dispatch = (handler, immediate = false) => (event2) => {
      const result = handler(event2);
      if (result instanceof Ok) {
        this.send(new Dispatch(result[0], immediate));
      }
    };
    const prev = this.root.firstChild ?? this.root.appendChild(document.createTextNode(""));
    morph(prev, vdom, dispatch);
  }
  #flush(effects = []) {
    while (this.#queue.length > 0) {
      const msg = this.#queue.shift();
      const [next, effect] = this.#update(this.#model, msg);
      effects = effects.concat(effect.all.toArray());
      this.#model = next;
    }
    while (effects.length > 0) {
      const effect = effects.shift();
      const dispatch = (msg) => this.send(new Dispatch(msg));
      const emit2 = (event2, data) => this.root.dispatchEvent(
        new CustomEvent(event2, {
          detail: data,
          bubbles: true,
          composed: true
        })
      );
      const select = () => {
      };
      const root = this.root;
      effect({ dispatch, emit: emit2, select, root });
    }
    if (this.#queue.length > 0) {
      this.#flush(effects);
    }
  }
};
var start = LustreClientApplication.start;
var LustreServerApplication = class _LustreServerApplication {
  static start({ init: init4, update: update3, view: view3, on_attribute_change }, flags) {
    const app = new _LustreServerApplication(
      init4(flags),
      update3,
      view3,
      on_attribute_change
    );
    return new Ok((action) => app.send(action));
  }
  constructor([model, effects], update3, view3, on_attribute_change) {
    this.#model = model;
    this.#update = update3;
    this.#view = view3;
    this.#html = view3(model);
    this.#onAttributeChange = on_attribute_change;
    this.#renderers = /* @__PURE__ */ new Map();
    this.#handlers = handlers(this.#html);
    this.#tick(effects.all.toArray());
  }
  send(action) {
    if (action instanceof Attrs) {
      for (const attr of action[0]) {
        const decoder4 = this.#onAttributeChange.get(attr[0]);
        if (!decoder4)
          continue;
        const msg = decoder4(attr[1]);
        if (msg instanceof Error)
          continue;
        this.#queue.push(msg);
      }
      this.#tick();
    } else if (action instanceof Batch) {
      this.#queue = this.#queue.concat(action[0].toArray());
      this.#tick(action[1].all.toArray());
    } else if (action instanceof Debug) {
    } else if (action instanceof Dispatch) {
      this.#queue.push(action[0]);
      this.#tick();
    } else if (action instanceof Emit2) {
      const event2 = new Emit(action[0], action[1]);
      for (const [_, renderer] of this.#renderers) {
        renderer(event2);
      }
    } else if (action instanceof Event3) {
      const handler = this.#handlers.get(action[0]);
      if (!handler)
        return;
      const msg = handler(action[1]);
      if (msg instanceof Error)
        return;
      this.#queue.push(msg[0]);
      this.#tick();
    } else if (action instanceof Subscribe) {
      const attrs = keys(this.#onAttributeChange);
      const patch = new Init(attrs, this.#html);
      this.#renderers = this.#renderers.set(action[0], action[1]);
      action[1](patch);
    } else if (action instanceof Unsubscribe) {
      this.#renderers = this.#renderers.delete(action[0]);
    }
  }
  #model;
  #update;
  #queue;
  #view;
  #html;
  #renderers;
  #handlers;
  #onAttributeChange;
  #tick(effects = []) {
    this.#flush(effects);
    const vdom = this.#view(this.#model);
    const diff2 = elements(this.#html, vdom);
    if (!is_empty_element_diff(diff2)) {
      const patch = new Diff(diff2);
      for (const [_, renderer] of this.#renderers) {
        renderer(patch);
      }
    }
    this.#html = vdom;
    this.#handlers = diff2.handlers;
  }
  #flush(effects = []) {
    while (this.#queue.length > 0) {
      const msg = this.#queue.shift();
      const [next, effect] = this.#update(this.#model, msg);
      effects = effects.concat(effect.all.toArray());
      this.#model = next;
    }
    while (effects.length > 0) {
      const effect = effects.shift();
      const dispatch = (msg) => this.send(new Dispatch(msg));
      const emit2 = (event2, data) => this.root.dispatchEvent(
        new CustomEvent(event2, {
          detail: data,
          bubbles: true,
          composed: true
        })
      );
      const select = () => {
      };
      const root = null;
      effect({ dispatch, emit: emit2, select, root });
    }
    if (this.#queue.length > 0) {
      this.#flush(effects);
    }
  }
};
var start_server_application = LustreServerApplication.start;
var is_browser = () => globalThis.window && window.document;

// build/dev/javascript/lustre/lustre.mjs
var App = class extends CustomType {
  constructor(init4, update3, view3, on_attribute_change) {
    super();
    this.init = init4;
    this.update = update3;
    this.view = view3;
    this.on_attribute_change = on_attribute_change;
  }
};
var ElementNotFound = class extends CustomType {
  constructor(selector) {
    super();
    this.selector = selector;
  }
};
var NotABrowser = class extends CustomType {
};
function application(init4, update3, view3) {
  return new App(init4, update3, view3, new None());
}
function start2(app, selector, flags) {
  return guard(
    !is_browser(),
    new Error(new NotABrowser()),
    () => {
      return start(app, selector, flags);
    }
  );
}

// build/dev/javascript/lustre/lustre/element/html.mjs
function text2(content2) {
  return text(content2);
}
function style2(attrs, css) {
  return element("style", attrs, toList([text2(css)]));
}
function article(attrs, children2) {
  return element("article", attrs, children2);
}
function h1(attrs, children2) {
  return element("h1", attrs, children2);
}
function main(attrs, children2) {
  return element("main", attrs, children2);
}
function div(attrs, children2) {
  return element("div", attrs, children2);
}
function button(attrs, children2) {
  return element("button", attrs, children2);
}
function input(attrs) {
  return element("input", attrs, toList([]));
}

// build/dev/javascript/lustre/lustre/event.mjs
function on2(name, handler) {
  return on(name, handler);
}
function on_click(msg) {
  return on2("click", (_) => {
    return new Ok(msg);
  });
}
function value(event2) {
  let _pipe = event2;
  return field("target", field("value", string))(
    _pipe
  );
}
function on_input(msg) {
  return on2(
    "input",
    (event2) => {
      let _pipe = value(event2);
      return map3(_pipe, msg);
    }
  );
}

// build/dev/javascript/gleam_community_colour/gleam_community/colour.mjs
var Rgba = class extends CustomType {
  constructor(r, g, b, a2) {
    super();
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a2;
  }
};
function valid_colour_value(c) {
  let $ = c > 1 || c < 0;
  if ($) {
    return new Error(void 0);
  } else {
    return new Ok(c);
  }
}
function hue_to_rgb(hue, m1, m2) {
  let h = (() => {
    if (hue < 0) {
      return hue + 1;
    } else if (hue > 1) {
      return hue - 1;
    } else {
      return hue;
    }
  })();
  let h_t_6 = h * 6;
  let h_t_2 = h * 2;
  let h_t_3 = h * 3;
  if (h_t_6 < 1) {
    return m1 + (m2 - m1) * h * 6;
  } else if (h_t_2 < 1) {
    return m2;
  } else if (h_t_3 < 2) {
    return m1 + (m2 - m1) * (divideFloat(2, 3) - h) * 6;
  } else {
    return m1;
  }
}
function hsla_to_rgba(h, s, l, a2) {
  let m2 = (() => {
    let $ = l <= 0.5;
    if ($) {
      return l * (s + 1);
    } else {
      return l + s - l * s;
    }
  })();
  let m1 = l * 2 - m2;
  let r = hue_to_rgb(h + divideFloat(1, 3), m1, m2);
  let g = hue_to_rgb(h, m1, m2);
  let b = hue_to_rgb(h - divideFloat(1, 3), m1, m2);
  return [r, g, b, a2];
}
function from_rgb255(red2, green2, blue2) {
  return then$(
    (() => {
      let _pipe = red2;
      let _pipe$1 = identity(_pipe);
      let _pipe$2 = divide(_pipe$1, 255);
      return then$(_pipe$2, valid_colour_value);
    })(),
    (r) => {
      return then$(
        (() => {
          let _pipe = green2;
          let _pipe$1 = identity(_pipe);
          let _pipe$2 = divide(_pipe$1, 255);
          return then$(_pipe$2, valid_colour_value);
        })(),
        (g) => {
          return then$(
            (() => {
              let _pipe = blue2;
              let _pipe$1 = identity(_pipe);
              let _pipe$2 = divide(_pipe$1, 255);
              return then$(_pipe$2, valid_colour_value);
            })(),
            (b) => {
              return new Ok(new Rgba(r, g, b, 1));
            }
          );
        }
      );
    }
  );
}
function to_rgba(colour) {
  if (colour instanceof Rgba) {
    let r = colour.r;
    let g = colour.g;
    let b = colour.b;
    let a2 = colour.a;
    return [r, g, b, a2];
  } else {
    let h = colour.h;
    let s = colour.s;
    let l = colour.l;
    let a2 = colour.a;
    return hsla_to_rgba(h, s, l, a2);
  }
}

// build/dev/javascript/lustre_ui/lustre/ui/colour.mjs
var ColourPalette = class extends CustomType {
  constructor(base, primary, secondary, success2, warning, danger) {
    super();
    this.base = base;
    this.primary = primary;
    this.secondary = secondary;
    this.success = success2;
    this.warning = warning;
    this.danger = danger;
  }
};
var ColourScale = class extends CustomType {
  constructor(bg, bg_subtle, tint, tint_subtle, tint_strong, accent, accent_subtle, accent_strong, solid, solid_subtle, solid_strong, solid_text, text3, text_subtle) {
    super();
    this.bg = bg;
    this.bg_subtle = bg_subtle;
    this.tint = tint;
    this.tint_subtle = tint_subtle;
    this.tint_strong = tint_strong;
    this.accent = accent;
    this.accent_subtle = accent_subtle;
    this.accent_strong = accent_strong;
    this.solid = solid;
    this.solid_subtle = solid_subtle;
    this.solid_strong = solid_strong;
    this.solid_text = solid_text;
    this.text = text3;
    this.text_subtle = text_subtle;
  }
};
function rgb(r, g, b) {
  let r$1 = min(255, max(0, r));
  let g$1 = min(255, max(0, g));
  let b$1 = min(255, max(0, b));
  let $ = from_rgb255(r$1, g$1, b$1);
  if (!$.isOk()) {
    throw makeError(
      "let_assert",
      "lustre/ui/colour",
      63,
      "rgb",
      "Pattern match failed, no pattern matched the value.",
      { value: $ }
    );
  }
  let colour = $[0];
  return colour;
}
function slate() {
  return new ColourScale(
    rgb(252, 252, 253),
    rgb(249, 249, 251),
    rgb(232, 232, 236),
    rgb(240, 240, 243),
    rgb(224, 225, 230),
    rgb(205, 206, 214),
    rgb(217, 217, 224),
    rgb(185, 187, 198),
    rgb(139, 141, 152),
    rgb(150, 152, 162),
    rgb(128, 131, 141),
    rgb(255, 255, 255),
    rgb(28, 32, 36),
    rgb(96, 100, 108)
  );
}
function red() {
  return new ColourScale(
    rgb(255, 252, 252),
    rgb(255, 247, 247),
    rgb(255, 219, 220),
    rgb(254, 235, 236),
    rgb(255, 205, 206),
    rgb(244, 169, 170),
    rgb(253, 189, 190),
    rgb(235, 142, 144),
    rgb(229, 72, 77),
    rgb(236, 83, 88),
    rgb(220, 62, 66),
    rgb(255, 255, 255),
    rgb(100, 23, 35),
    rgb(206, 44, 49)
  );
}
function plum() {
  return new ColourScale(
    rgb(254, 252, 255),
    rgb(253, 247, 253),
    rgb(247, 222, 248),
    rgb(251, 235, 251),
    rgb(242, 209, 243),
    rgb(222, 173, 227),
    rgb(233, 194, 236),
    rgb(207, 145, 216),
    rgb(171, 74, 186),
    rgb(177, 85, 191),
    rgb(161, 68, 175),
    rgb(255, 255, 255),
    rgb(83, 25, 93),
    rgb(149, 62, 163)
  );
}
function blue() {
  return new ColourScale(
    rgb(251, 253, 255),
    rgb(244, 250, 255),
    rgb(213, 239, 255),
    rgb(230, 244, 254),
    rgb(194, 229, 255),
    rgb(142, 200, 246),
    rgb(172, 216, 252),
    rgb(94, 177, 239),
    rgb(0, 144, 255),
    rgb(5, 148, 260),
    rgb(5, 136, 240),
    rgb(255, 255, 255),
    rgb(17, 50, 100),
    rgb(13, 116, 206)
  );
}
function green() {
  return new ColourScale(
    rgb(251, 254, 252),
    rgb(244, 251, 246),
    rgb(214, 241, 223),
    rgb(230, 246, 235),
    rgb(196, 232, 209),
    rgb(142, 206, 170),
    rgb(173, 221, 192),
    rgb(91, 185, 139),
    rgb(48, 164, 108),
    rgb(53, 173, 115),
    rgb(43, 154, 102),
    rgb(255, 255, 255),
    rgb(25, 59, 45),
    rgb(33, 131, 88)
  );
}
function yellow() {
  return new ColourScale(
    rgb(253, 253, 249),
    rgb(254, 252, 233),
    rgb(255, 243, 148),
    rgb(255, 250, 184),
    rgb(255, 231, 112),
    rgb(228, 199, 103),
    rgb(243, 215, 104),
    rgb(213, 174, 57),
    rgb(255, 230, 41),
    rgb(255, 234, 82),
    rgb(255, 220, 0),
    rgb(71, 59, 31),
    rgb(71, 59, 31),
    rgb(158, 108, 0)
  );
}
function default_light_palette() {
  return new ColourPalette(slate(), blue(), plum(), green(), yellow(), red());
}
function slate_dark() {
  return new ColourScale(
    rgb(24, 25, 27),
    rgb(17, 17, 19),
    rgb(39, 42, 45),
    rgb(33, 34, 37),
    rgb(46, 49, 53),
    rgb(67, 72, 78),
    rgb(54, 58, 63),
    rgb(90, 97, 105),
    rgb(105, 110, 119),
    rgb(91, 96, 105),
    rgb(119, 123, 132),
    rgb(255, 255, 255),
    rgb(237, 238, 240),
    rgb(176, 180, 186)
  );
}
function red_dark() {
  return new ColourScale(
    rgb(32, 19, 20),
    rgb(25, 17, 17),
    rgb(80, 15, 28),
    rgb(59, 18, 25),
    rgb(97, 22, 35),
    rgb(140, 51, 58),
    rgb(114, 35, 45),
    rgb(181, 69, 72),
    rgb(229, 72, 77),
    rgb(220, 52, 57),
    rgb(236, 93, 94),
    rgb(255, 255, 255),
    rgb(255, 209, 217),
    rgb(255, 149, 146)
  );
}
function plum_dark() {
  return new ColourScale(
    rgb(32, 19, 32),
    rgb(24, 17, 24),
    rgb(69, 29, 71),
    rgb(53, 26, 53),
    rgb(81, 36, 84),
    rgb(115, 64, 121),
    rgb(94, 48, 97),
    rgb(146, 84, 156),
    rgb(171, 74, 186),
    rgb(154, 68, 167),
    rgb(182, 88, 196),
    rgb(255, 255, 255),
    rgb(244, 212, 244),
    rgb(231, 150, 243)
  );
}
function blue_dark() {
  return new ColourScale(
    rgb(17, 25, 39),
    rgb(13, 21, 32),
    rgb(0, 51, 98),
    rgb(13, 40, 71),
    rgb(0, 64, 116),
    rgb(32, 93, 158),
    rgb(16, 77, 135),
    rgb(40, 112, 189),
    rgb(0, 144, 255),
    rgb(0, 110, 195),
    rgb(59, 158, 255),
    rgb(255, 255, 255),
    rgb(194, 230, 255),
    rgb(112, 184, 255)
  );
}
function green_dark() {
  return new ColourScale(
    rgb(18, 27, 23),
    rgb(14, 21, 18),
    rgb(17, 59, 41),
    rgb(19, 45, 33),
    rgb(23, 73, 51),
    rgb(40, 104, 74),
    rgb(32, 87, 62),
    rgb(47, 124, 87),
    rgb(48, 164, 108),
    rgb(44, 152, 100),
    rgb(51, 176, 116),
    rgb(255, 255, 255),
    rgb(177, 241, 203),
    rgb(61, 214, 140)
  );
}
function yellow_dark() {
  return new ColourScale(
    rgb(27, 24, 15),
    rgb(20, 18, 11),
    rgb(54, 43, 0),
    rgb(45, 35, 5),
    rgb(67, 53, 0),
    rgb(102, 84, 23),
    rgb(82, 66, 2),
    rgb(131, 106, 33),
    rgb(255, 230, 41),
    rgb(250, 220, 0),
    rgb(255, 255, 87),
    rgb(27, 24, 15),
    rgb(246, 238, 180),
    rgb(245, 225, 71)
  );
}
function default_dark_palette() {
  return new ColourPalette(
    slate_dark(),
    blue_dark(),
    plum_dark(),
    green_dark(),
    yellow_dark(),
    red_dark()
  );
}

// build/dev/javascript/lustre_ui/lustre/ui/theme.mjs
var Theme = class extends CustomType {
  constructor(id, selector, font, radius3, space, light, dark) {
    super();
    this.id = id;
    this.selector = selector;
    this.font = font;
    this.radius = radius3;
    this.space = space;
    this.light = light;
    this.dark = dark;
  }
};
var Fonts = class extends CustomType {
  constructor(heading, body2, code3) {
    super();
    this.heading = heading;
    this.body = body2;
    this.code = code3;
  }
};
var SizeScale = class extends CustomType {
  constructor(xs, sm, md, lg, xl, xl_2, xl_3) {
    super();
    this.xs = xs;
    this.sm = sm;
    this.md = md;
    this.lg = lg;
    this.xl = xl;
    this.xl_2 = xl_2;
    this.xl_3 = xl_3;
  }
};
var Global = class extends CustomType {
};
var Class = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var DataAttribute = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var SizeVariables = class extends CustomType {
  constructor(xs, sm, md, lg, xl, xl_2, xl_3) {
    super();
    this.xs = xs;
    this.sm = sm;
    this.md = md;
    this.lg = lg;
    this.xl = xl;
    this.xl_2 = xl_2;
    this.xl_3 = xl_3;
  }
};
function perfect_fifth(base) {
  return new SizeScale(
    divideFloat(divideFloat(divideFloat(base, 1.5), 1.5), 1.5),
    divideFloat(divideFloat(base, 1.5), 1.5),
    base,
    base * 1.5,
    base * 1.5 * 1.5,
    base * 1.5 * 1.5 * 1.5,
    base * 1.5 * 1.5 * 1.5 * 1.5
  );
}
function golden_ratio(base) {
  return new SizeScale(
    divideFloat(divideFloat(divideFloat(base, 1.618), 1.618), 1.618),
    divideFloat(divideFloat(base, 1.618), 1.618),
    base,
    base * 1.618,
    base * 1.618 * 1.618,
    base * 1.618 * 1.618 * 1.618,
    base * 1.618 * 1.618 * 1.618 * 1.618
  );
}
function to_css_selector(selector) {
  if (selector instanceof Global) {
    return "";
  } else if (selector instanceof Class) {
    let class$2 = selector[0];
    return "." + class$2;
  } else if (selector instanceof DataAttribute && selector[1] === "") {
    let name = selector[0];
    return "[data-" + name + "]";
  } else {
    let name = selector[0];
    let value3 = selector[1];
    return "[data-" + name + "=" + value3 + "]";
  }
}
function to_css_rgb(colour) {
  let $ = to_rgba(colour);
  let r = $[0];
  let g = $[1];
  let b = $[2];
  let r$1 = (() => {
    let _pipe = round(r * 255);
    return to_string(_pipe);
  })();
  let g$1 = (() => {
    let _pipe = round(g * 255);
    return to_string(_pipe);
  })();
  let b$1 = (() => {
    let _pipe = round(b * 255);
    return to_string(_pipe);
  })();
  return r$1 + " " + g$1 + " " + b$1;
}
function var$(name) {
  return "--lustre-ui-" + name;
}
function to_css_variable(name, value3) {
  return var$(name) + ":" + value3 + ";";
}
function to_colour_scale_variables(scale, name) {
  return concat2(
    toList([
      to_css_variable(name + "-bg", to_css_rgb(scale.bg)),
      to_css_variable(name + "-bg-subtle", to_css_rgb(scale.bg_subtle)),
      to_css_variable(name + "-tint", to_css_rgb(scale.tint)),
      to_css_variable(name + "-tint-subtle", to_css_rgb(scale.tint_subtle)),
      to_css_variable(name + "-tint-strong", to_css_rgb(scale.tint_strong)),
      to_css_variable(name + "-accent", to_css_rgb(scale.accent)),
      to_css_variable(name + "-accent-subtle", to_css_rgb(scale.accent_subtle)),
      to_css_variable(name + "-accent-strong", to_css_rgb(scale.accent_strong)),
      to_css_variable(name + "-solid", to_css_rgb(scale.solid)),
      to_css_variable(name + "-solid-subtle", to_css_rgb(scale.solid_subtle)),
      to_css_variable(name + "-solid-strong", to_css_rgb(scale.solid_strong)),
      to_css_variable(name + "-solid-text", to_css_rgb(scale.solid_text)),
      to_css_variable(name + "-text", to_css_rgb(scale.text)),
      to_css_variable(name + "-text-subtle", to_css_rgb(scale.text_subtle)),
      "& ." + name + ', [data-scale="' + name + '"] {',
      "--lustre-ui-bg: var(--lustre-ui-" + name + "-bg);",
      "--lustre-ui-bg-subtle: var(--lustre-ui-" + name + "-bg-subtle);",
      "--lustre-ui-tint: var(--lustre-ui-" + name + "-tint);",
      "--lustre-ui-tint-subtle: var(--lustre-ui-" + name + "-tint-subtle);",
      "--lustre-ui-tint-strong: var(--lustre-ui-" + name + "-tint-strong);",
      "--lustre-ui-accent: var(--lustre-ui-" + name + "-accent);",
      "--lustre-ui-accent-subtle: var(--lustre-ui-" + name + "-accent-subtle);",
      "--lustre-ui-accent-strong: var(--lustre-ui-" + name + "-accent-strong);",
      "--lustre-ui-solid: var(--lustre-ui-" + name + "-solid);",
      "--lustre-ui-solid-subtle: var(--lustre-ui-" + name + "-solid-subtle);",
      "--lustre-ui-solid-strong: var(--lustre-ui-" + name + "-solid-strong);",
      "--lustre-ui-solid-text: var(--lustre-ui-" + name + "-solid-text);",
      "--lustre-ui-text: var(--lustre-ui-" + name + "-text);",
      "--lustre-ui-text-subtle: var(--lustre-ui-" + name + "-text-subtle);",
      "}"
    ])
  );
}
function to_color_palette_variables(palette, scheme) {
  return concat2(
    toList([
      to_css_variable("color-scheme", scheme),
      to_colour_scale_variables(palette.base, "base"),
      to_colour_scale_variables(palette.primary, "primary"),
      to_colour_scale_variables(palette.secondary, "secondary"),
      to_colour_scale_variables(palette.success, "success"),
      to_colour_scale_variables(palette.warning, "warning"),
      to_colour_scale_variables(palette.danger, "danger"),
      "--lustre-ui-bg: var(--lustre-ui-base-bg);",
      "--lustre-ui-bg-subtle: var(--lustre-ui-base-bg-subtle);",
      "--lustre-ui-tint: var(--lustre-ui-base-tint);",
      "--lustre-ui-tint-subtle: var(--lustre-ui-base-tint-subtle);",
      "--lustre-ui-tint-strong: var(--lustre-ui-base-tint-strong);",
      "--lustre-ui-accent: var(--lustre-ui-base-accent);",
      "--lustre-ui-accent-subtle: var(--lustre-ui-base-accent-subtle);",
      "--lustre-ui-accent-strong: var(--lustre-ui-base-accent-strong);",
      "--lustre-ui-solid: var(--lustre-ui-base-solid);",
      "--lustre-ui-solid-subtle: var(--lustre-ui-base-solid-subtle);",
      "--lustre-ui-solid-strong: var(--lustre-ui-base-solid-strong);",
      "--lustre-ui-solid-text: var(--lustre-ui-base-solid-text);",
      "--lustre-ui-text: var(--lustre-ui-base-text);",
      "--lustre-ui-text-subtle: var(--lustre-ui-base-text-subtle);"
    ])
  );
}
function to_css_variables(theme) {
  return concat2(
    toList([
      to_css_variable("id", theme.id),
      to_css_variable("font-heading", theme.font.heading),
      to_css_variable("font-body", theme.font.body),
      to_css_variable("font-code", theme.font.code),
      to_css_variable("radius-xs", float_to_string(theme.radius.xs) + "rem"),
      to_css_variable("radius-sm", float_to_string(theme.radius.sm) + "rem"),
      to_css_variable("radius-md", float_to_string(theme.radius.md) + "rem"),
      to_css_variable("radius-lg", float_to_string(theme.radius.lg) + "rem"),
      to_css_variable("radius-xl", float_to_string(theme.radius.xl) + "rem"),
      to_css_variable(
        "radius-xl-2",
        float_to_string(theme.radius.xl_2) + "rem"
      ),
      to_css_variable(
        "radius-xl-3",
        float_to_string(theme.radius.xl_3) + "rem"
      ),
      to_css_variable("spacing-xs", float_to_string(theme.space.xs) + "rem"),
      to_css_variable("spacing-sm", float_to_string(theme.space.sm) + "rem"),
      to_css_variable("spacing-md", float_to_string(theme.space.md) + "rem"),
      to_css_variable("spacing-lg", float_to_string(theme.space.lg) + "rem"),
      to_css_variable("spacing-xl", float_to_string(theme.space.xl) + "rem"),
      to_css_variable(
        "spacing-xl-2",
        float_to_string(theme.space.xl_2) + "rem"
      ),
      to_css_variable(
        "spacing-xl-3",
        float_to_string(theme.space.xl_3) + "rem"
      ),
      to_color_palette_variables(theme.light, "light")
    ])
  );
}
var sans = 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"';
var code = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
var stylesheet_global_light_no_dark = "\nbody {\n  ${rules}\n\n  background-color: rgb(var(--lustre-ui-bg));\n  color: rgb(var(--lustre-ui-text));\n  font-family: ${fonts.body}\n}\n\nh1, h2, h3, h4, h5, h6 {\n  font-family: ${fonts.heading}\n}\n\npre, code, kbd, samp {\n  font-family: ${fonts.code}\n}\n";
var stylesheet_global_light_global_dark = "\nbody {\n  ${rules}\n\n  background-color: rgb(var(--lustre-ui-bg));\n  color: rgb(var(--lustre-ui-text));\n  font-family: ${fonts.body}\n}\n\nh1, h2, h3, h4, h5, h6 {\n  font-family: ${fonts.heading}\n}\n\npre, code, kbd, samp {\n  font-family: ${fonts.code}\n}\n\n@media (prefers-color-scheme: dark) {\n  body {\n    ${dark_rules}\n  }\n}\n";
var stylesheet_global_light_scoped_dark = "\nbody {\n  ${rules}\n\n  background-color: rgb(var(--lustre-ui-bg));\n  color: rgb(var(--lustre-ui-text));\n  font-family: ${fonts.body}\n}\n\nh1, h2, h3, h4, h5, h6 {\n  font-family: ${fonts.heading}\n}\n\npre, code, kbd, samp {\n  font-family: ${fonts.code}\n}\n\nbody${dark_selector}, body ${dark_selector} {\n  ${dark_rules}\n}\n\n@media (prefers-color-scheme: dark) {\n  body {\n    ${dark_rules}\n  }\n}\n";
var stylesheet_scoped_light_no_dark = "\n${selector} {\n  ${rules}\n\n  background-color: rgb(var(--lustre-ui-bg));\n  color: rgb(var(--lustre-ui-text));\n  font-family: ${fonts.body}\n}\n\n${selector} :is(h1, h2, h3, h4, h5, h6) {\n  font-family: ${fonts.heading}\n}\n\n${selector} :is(pre, code, kbd, samp) {\n  font-family: ${fonts.code}\n}\n";
var stylesheet_scoped_light_global_dark = "\n${selector} {\n  ${rules}\n\n  background-color: rgb(var(--lustre-ui-bg));\n  color: rgb(var(--lustre-ui-text));\n  font-family: ${fonts.body}\n}\n\n${selector} :is(h1, h2, h3, h4, h5, h6) {\n  font-family: ${fonts.heading}\n}\n\n${selector} :is(pre, code, kbd, samp) {\n  font-family: ${fonts.code}\n}\n\n@media (prefers-color-scheme: dark) {\n  ${selector} {\n    ${dark_rules}\n  }\n}\n";
var stylesheet_scoped_light_scoped_dark = "\n${selector} {\n  ${rules}\n\n  background-color: rgb(var(--lustre-ui-bg));\n  color: rgb(var(--lustre-ui-text));\n  font-family: ${fonts.body}\n}\n\n${selector} :is(h1, h2, h3, h4, h5, h6) {\n  font-family: ${fonts.heading}\n}\n\n${selector} :is(pre, code, kbd, samp) {\n  font-family: ${fonts.code}\n}\n\n${selector}${dark_selector}, ${selector} ${dark_selector} {\n  ${dark_rules}\n}\n\n@media (prefers-color-scheme: dark) {\n  ${selector} {\n    ${dark_rules}\n  }\n}\n";
function to_style(theme) {
  let data_attr = attribute("data-lustre-ui-theme", theme.id);
  let $ = theme.selector;
  let $1 = theme.dark;
  if ($ instanceof Global && $1 instanceof None) {
    let _pipe = stylesheet_global_light_no_dark;
    let _pipe$1 = replace(_pipe, "${rules}", to_css_variables(theme));
    let _pipe$2 = replace(
      _pipe$1,
      "${fonts.heading}",
      theme.font.heading
    );
    let _pipe$3 = replace(_pipe$2, "${fonts.body}", theme.font.body);
    let _pipe$4 = replace(_pipe$3, "${fonts.code}", theme.font.code);
    return ((_capture) => {
      return style2(toList([data_attr]), _capture);
    })(
      _pipe$4
    );
  } else if ($ instanceof Global && $1 instanceof Some && $1[0][0] instanceof Global) {
    let dark_palette = $1[0][1];
    let _pipe = stylesheet_global_light_global_dark;
    let _pipe$1 = replace(_pipe, "${rules}", to_css_variables(theme));
    let _pipe$2 = replace(
      _pipe$1,
      "${dark_rules}",
      to_color_palette_variables(dark_palette, "dark")
    );
    let _pipe$3 = replace(
      _pipe$2,
      "${fonts.heading}",
      theme.font.heading
    );
    let _pipe$4 = replace(_pipe$3, "${fonts.body}", theme.font.body);
    let _pipe$5 = replace(_pipe$4, "${fonts.code}", theme.font.code);
    return ((_capture) => {
      return style2(toList([data_attr]), _capture);
    })(
      _pipe$5
    );
  } else if ($ instanceof Global && $1 instanceof Some) {
    let dark_selector = $1[0][0];
    let dark_palette = $1[0][1];
    let _pipe = stylesheet_global_light_scoped_dark;
    let _pipe$1 = replace(_pipe, "${rules}", to_css_variables(theme));
    let _pipe$2 = replace(
      _pipe$1,
      "${dark_selector}",
      to_css_selector(dark_selector)
    );
    let _pipe$3 = replace(
      _pipe$2,
      "${dark_rules}",
      to_color_palette_variables(dark_palette, "dark")
    );
    let _pipe$4 = replace(
      _pipe$3,
      "${fonts.heading}",
      theme.font.heading
    );
    let _pipe$5 = replace(_pipe$4, "${fonts.body}", theme.font.body);
    let _pipe$6 = replace(_pipe$5, "${fonts.code}", theme.font.code);
    return ((_capture) => {
      return style2(toList([data_attr]), _capture);
    })(
      _pipe$6
    );
  } else if ($1 instanceof None) {
    let selector = $;
    let _pipe = stylesheet_scoped_light_no_dark;
    let _pipe$1 = replace(
      _pipe,
      "${selector}",
      to_css_selector(selector)
    );
    let _pipe$2 = replace(_pipe$1, "${rules}", to_css_variables(theme));
    let _pipe$3 = replace(
      _pipe$2,
      "${fonts.heading}",
      theme.font.heading
    );
    let _pipe$4 = replace(_pipe$3, "${fonts.body}", theme.font.body);
    let _pipe$5 = replace(_pipe$4, "${fonts.code}", theme.font.code);
    return ((_capture) => {
      return style2(toList([data_attr]), _capture);
    })(
      _pipe$5
    );
  } else if ($1 instanceof Some && $1[0][0] instanceof Global) {
    let selector = $;
    let dark_palette = $1[0][1];
    let _pipe = stylesheet_scoped_light_global_dark;
    let _pipe$1 = replace(
      _pipe,
      "${selector}",
      to_css_selector(selector)
    );
    let _pipe$2 = replace(_pipe$1, "${rules}", to_css_variables(theme));
    let _pipe$3 = replace(
      _pipe$2,
      "${dark_rules}",
      to_color_palette_variables(dark_palette, "dark")
    );
    let _pipe$4 = replace(
      _pipe$3,
      "${fonts.heading}",
      theme.font.heading
    );
    let _pipe$5 = replace(_pipe$4, "${fonts.body}", theme.font.body);
    let _pipe$6 = replace(_pipe$5, "${fonts.code}", theme.font.code);
    return ((_capture) => {
      return style2(toList([data_attr]), _capture);
    })(
      _pipe$6
    );
  } else {
    let selector = $;
    let dark_selector = $1[0][0];
    let dark_palette = $1[0][1];
    let _pipe = stylesheet_scoped_light_scoped_dark;
    let _pipe$1 = replace(
      _pipe,
      "${selector}",
      to_css_selector(selector)
    );
    let _pipe$2 = replace(_pipe$1, "${rules}", to_css_variables(theme));
    let _pipe$3 = replace(
      _pipe$2,
      "${dark_selector}",
      to_css_selector(dark_selector)
    );
    let _pipe$4 = replace(
      _pipe$3,
      "${dark_rules}",
      to_color_palette_variables(dark_palette, "dark")
    );
    let _pipe$5 = replace(
      _pipe$4,
      "${fonts.heading}",
      theme.font.heading
    );
    let _pipe$6 = replace(_pipe$5, "${fonts.body}", theme.font.body);
    let _pipe$7 = replace(_pipe$6, "${fonts.code}", theme.font.code);
    return ((_capture) => {
      return style2(toList([data_attr]), _capture);
    })(
      _pipe$7
    );
  }
}
function inject(theme, view3) {
  return fragment(toList([to_style(theme), view3()]));
}
var spacing = /* @__PURE__ */ new SizeVariables(
  "var(--lustre-ui-spacing-xs)",
  "var(--lustre-ui-spacing-sm)",
  "var(--lustre-ui-spacing-md)",
  "var(--lustre-ui-spacing-lg)",
  "var(--lustre-ui-spacing-xl)",
  "var(--lustre-ui-spacing-xl-2)",
  "var(--lustre-ui-spacing-xl-3)"
);
var radius = /* @__PURE__ */ new SizeVariables(
  "var(--lustre-ui-radius-xs)",
  "var(--lustre-ui-radius-sm)",
  "var(--lustre-ui-radius-md)",
  "var(--lustre-ui-radius-lg)",
  "var(--lustre-ui-radius-xl)",
  "var(--lustre-ui-radius-xl-2)",
  "var(--lustre-ui-radius-xl-3)"
);
function default$() {
  let id = "lustre-ui-default";
  let font$1 = new Fonts(sans, sans, code);
  let radius$1 = perfect_fifth(0.75);
  let space = golden_ratio(0.75);
  let light = default_light_palette();
  let dark = default_dark_palette();
  return new Theme(
    id,
    new Global(),
    font$1,
    radius$1,
    space,
    light,
    new Some([new Class("dark"), dark])
  );
}

// build/dev/javascript/lustre_ui/lustre/ui/button.mjs
function of(element2, attributes, children2) {
  return element2(
    prepend(
      class$("lustre-ui-button"),
      prepend(role("button"), attributes)
    ),
    children2
  );
}
function button2(attributes, children2) {
  return of(
    button,
    prepend(attribute("tabindex", "0"), attributes),
    children2
  );
}
function icon() {
  return class$("button-icon");
}

// build/dev/javascript/lustre_ui/lustre/ui/card.mjs
function of2(element2, attributes, children2) {
  return element2(
    prepend(class$("lustre-ui-card"), attributes),
    children2
  );
}
function card(attributes, children2) {
  return of2(article, attributes, children2);
}
function content(attributes, children2) {
  return main(
    prepend(class$("card-content"), attributes),
    children2
  );
}
function padding2(x, y) {
  return style(toList([["--padding-x", x], ["--padding-y", y]]));
}
function radius2(value3) {
  return style(toList([["--radius", value3]]));
}
function round3() {
  return radius2(radius.md);
}

// build/dev/javascript/plinth/document_ffi.mjs
function querySelector(query) {
  let found = document.querySelector(query);
  if (!found) {
    return new Error();
  }
  return new Ok(found);
}

// build/dev/javascript/plinth/element_ffi.mjs
function innerText(element2) {
  return element2.innerText;
}

// build/dev/javascript/gleam_regexp/gleam_regexp_ffi.mjs
function compile(pattern, options) {
  try {
    let flags = "gu";
    if (options.case_insensitive)
      flags += "i";
    if (options.multi_line)
      flags += "m";
    return new Ok(new RegExp(pattern, flags));
  } catch (error) {
    const number = (error.columnNumber || 0) | 0;
    return new Error(new CompileError(error.message, number));
  }
}
function split3(regex, string5) {
  return List.fromArray(
    string5.split(regex).map((item) => item === void 0 ? "" : item)
  );
}
function scan(regex, string5) {
  const matches = Array.from(string5.matchAll(regex)).map((match) => {
    const content2 = match[0];
    return new Match(content2, submatches(match.slice(1)));
  });
  return List.fromArray(matches);
}
function submatches(groups) {
  const submatches2 = [];
  for (let n = groups.length - 1; n >= 0; n--) {
    if (groups[n]) {
      submatches2[n] = new Some(groups[n]);
      continue;
    }
    if (submatches2.length > 0) {
      submatches2[n] = new None();
    }
  }
  return List.fromArray(submatches2);
}

// build/dev/javascript/gleam_regexp/gleam/regexp.mjs
var Match = class extends CustomType {
  constructor(content2, submatches2) {
    super();
    this.content = content2;
    this.submatches = submatches2;
  }
};
var CompileError = class extends CustomType {
  constructor(error, byte_index) {
    super();
    this.error = error;
    this.byte_index = byte_index;
  }
};
var Options2 = class extends CustomType {
  constructor(case_insensitive, multi_line) {
    super();
    this.case_insensitive = case_insensitive;
    this.multi_line = multi_line;
  }
};
function compile2(pattern, options) {
  return compile(pattern, options);
}
function from_string(pattern) {
  return compile2(pattern, new Options2(false, false));
}
function split4(regexp, string5) {
  return split3(regexp, string5);
}
function scan2(regexp, string5) {
  return scan(regexp, string5);
}

// build/dev/javascript/gleam_stdlib/gleam/function.mjs
function identity3(x) {
  return x;
}

// build/dev/javascript/birl/birl/duration.mjs
var Duration = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var MicroSecond = class extends CustomType {
};
var MilliSecond = class extends CustomType {
};
var Second = class extends CustomType {
};
var Minute = class extends CustomType {
};
var Hour = class extends CustomType {
};
var Day = class extends CustomType {
};
var Week = class extends CustomType {
};
var Month = class extends CustomType {
};
var Year = class extends CustomType {
};
function extract(duration, unit_value) {
  return [divideInt(duration, unit_value), remainderInt(duration, unit_value)];
}
var milli_second = 1e3;
var second = 1e6;
var minute = 6e7;
var hour = 36e8;
var day = 864e8;
function days(value3) {
  return new Duration(value3 * day);
}
var week = 6048e8;
var month = 2592e9;
var year = 31536e9;
function new$3(values2) {
  let _pipe = values2;
  let _pipe$1 = fold(
    _pipe,
    0,
    (total, current) => {
      if (current[1] instanceof MicroSecond) {
        let amount = current[0];
        return total + amount;
      } else if (current[1] instanceof MilliSecond) {
        let amount = current[0];
        return total + amount * milli_second;
      } else if (current[1] instanceof Second) {
        let amount = current[0];
        return total + amount * second;
      } else if (current[1] instanceof Minute) {
        let amount = current[0];
        return total + amount * minute;
      } else if (current[1] instanceof Hour) {
        let amount = current[0];
        return total + amount * hour;
      } else if (current[1] instanceof Day) {
        let amount = current[0];
        return total + amount * day;
      } else if (current[1] instanceof Week) {
        let amount = current[0];
        return total + amount * week;
      } else if (current[1] instanceof Month) {
        let amount = current[0];
        return total + amount * month;
      } else {
        let amount = current[0];
        return total + amount * year;
      }
    }
  );
  return new Duration(_pipe$1);
}
function decompose(duration) {
  let value3 = duration[0];
  let absolute_value2 = absolute_value(value3);
  let $ = extract(absolute_value2, year);
  let years$1 = $[0];
  let remaining = $[1];
  let $1 = extract(remaining, month);
  let months$1 = $1[0];
  let remaining$1 = $1[1];
  let $2 = extract(remaining$1, week);
  let weeks$1 = $2[0];
  let remaining$2 = $2[1];
  let $3 = extract(remaining$2, day);
  let days$1 = $3[0];
  let remaining$3 = $3[1];
  let $4 = extract(remaining$3, hour);
  let hours$1 = $4[0];
  let remaining$4 = $4[1];
  let $5 = extract(remaining$4, minute);
  let minutes$1 = $5[0];
  let remaining$5 = $5[1];
  let $6 = extract(remaining$5, second);
  let seconds$1 = $6[0];
  let remaining$6 = $6[1];
  let $7 = extract(remaining$6, milli_second);
  let milli_seconds$1 = $7[0];
  let remaining$7 = $7[1];
  let _pipe = toList([
    [years$1, new Year()],
    [months$1, new Month()],
    [weeks$1, new Week()],
    [days$1, new Day()],
    [hours$1, new Hour()],
    [minutes$1, new Minute()],
    [seconds$1, new Second()],
    [milli_seconds$1, new MilliSecond()],
    [remaining$7, new MicroSecond()]
  ]);
  let _pipe$1 = filter(_pipe, (item) => {
    return item[0] > 0;
  });
  return map2(
    _pipe$1,
    (item) => {
      let $8 = value3 < 0;
      if ($8) {
        return [-1 * item[0], item[1]];
      } else {
        return item;
      }
    }
  );
}

// build/dev/javascript/birl/birl/zones.mjs
var list3 = /* @__PURE__ */ toList([
  ["Africa/Abidjan", 0],
  ["Africa/Algiers", 3600],
  ["Africa/Bissau", 0],
  ["Africa/Cairo", 7200],
  ["Africa/Casablanca", 3600],
  ["Africa/Ceuta", 3600],
  ["Africa/El_Aaiun", 3600],
  ["Africa/Johannesburg", 7200],
  ["Africa/Juba", 7200],
  ["Africa/Khartoum", 7200],
  ["Africa/Lagos", 3600],
  ["Africa/Maputo", 7200],
  ["Africa/Monrovia", 0],
  ["Africa/Nairobi", 10800],
  ["Africa/Ndjamena", 3600],
  ["Africa/Sao_Tome", 0],
  ["Africa/Tripoli", 7200],
  ["Africa/Tunis", 3600],
  ["Africa/Windhoek", 7200],
  ["America/Adak", -36e3],
  ["America/Anchorage", -32400],
  ["America/Araguaina", -10800],
  ["America/Argentina/Buenos_Aires", -10800],
  ["America/Argentina/Catamarca", -10800],
  ["America/Argentina/Cordoba", -10800],
  ["America/Argentina/Jujuy", -10800],
  ["America/Argentina/La_Rioja", -10800],
  ["America/Argentina/Mendoza", -10800],
  ["America/Argentina/Rio_Gallegos", -10800],
  ["America/Argentina/Salta", -10800],
  ["America/Argentina/San_Juan", -10800],
  ["America/Argentina/San_Luis", -10800],
  ["America/Argentina/Tucuman", -10800],
  ["America/Argentina/Ushuaia", -10800],
  ["America/Asuncion", -14400],
  ["America/Bahia", -10800],
  ["America/Bahia_Banderas", -21600],
  ["America/Barbados", -14400],
  ["America/Belem", -10800],
  ["America/Belize", -21600],
  ["America/Boa_Vista", -14400],
  ["America/Bogota", -18e3],
  ["America/Boise", -25200],
  ["America/Cambridge_Bay", -25200],
  ["America/Campo_Grande", -14400],
  ["America/Cancun", -18e3],
  ["America/Caracas", -14400],
  ["America/Cayenne", -10800],
  ["America/Chicago", -21600],
  ["America/Chihuahua", -21600],
  ["America/Ciudad_Juarez", -25200],
  ["America/Costa_Rica", -21600],
  ["America/Cuiaba", -14400],
  ["America/Danmarkshavn", 0],
  ["America/Dawson", -25200],
  ["America/Dawson_Creek", -25200],
  ["America/Denver", -25200],
  ["America/Detroit", -18e3],
  ["America/Edmonton", -25200],
  ["America/Eirunepe", -18e3],
  ["America/El_Salvador", -21600],
  ["America/Fort_Nelson", -25200],
  ["America/Fortaleza", -10800],
  ["America/Glace_Bay", -14400],
  ["America/Goose_Bay", -14400],
  ["America/Grand_Turk", -18e3],
  ["America/Guatemala", -21600],
  ["America/Guayaquil", -18e3],
  ["America/Guyana", -14400],
  ["America/Halifax", -14400],
  ["America/Havana", -18e3],
  ["America/Hermosillo", -25200],
  ["America/Indiana/Indianapolis", -18e3],
  ["America/Indiana/Knox", -21600],
  ["America/Indiana/Marengo", -18e3],
  ["America/Indiana/Petersburg", -18e3],
  ["America/Indiana/Tell_City", -21600],
  ["America/Indiana/Vevay", -18e3],
  ["America/Indiana/Vincennes", -18e3],
  ["America/Indiana/Winamac", -18e3],
  ["America/Inuvik", -25200],
  ["America/Iqaluit", -18e3],
  ["America/Jamaica", -18e3],
  ["America/Juneau", -32400],
  ["America/Kentucky/Louisville", -18e3],
  ["America/Kentucky/Monticello", -18e3],
  ["America/La_Paz", -14400],
  ["America/Lima", -18e3],
  ["America/Los_Angeles", -28800],
  ["America/Maceio", -10800],
  ["America/Managua", -21600],
  ["America/Manaus", -14400],
  ["America/Martinique", -14400],
  ["America/Matamoros", -21600],
  ["America/Mazatlan", -25200],
  ["America/Menominee", -21600],
  ["America/Merida", -21600],
  ["America/Metlakatla", -32400],
  ["America/Mexico_City", -21600],
  ["America/Miquelon", -10800],
  ["America/Moncton", -14400],
  ["America/Monterrey", -21600],
  ["America/Montevideo", -10800],
  ["America/New_York", -18e3],
  ["America/Nome", -32400],
  ["America/Noronha", -7200],
  ["America/North_Dakota/Beulah", -21600],
  ["America/North_Dakota/Center", -21600],
  ["America/North_Dakota/New_Salem", -21600],
  ["America/Nuuk", -7200],
  ["America/Ojinaga", -21600],
  ["America/Panama", -18e3],
  ["America/Paramaribo", -10800],
  ["America/Phoenix", -25200],
  ["America/Port-au-Prince", -18e3],
  ["America/Porto_Velho", -14400],
  ["America/Puerto_Rico", -14400],
  ["America/Punta_Arenas", -10800],
  ["America/Rankin_Inlet", -21600],
  ["America/Recife", -10800],
  ["America/Regina", -21600],
  ["America/Resolute", -21600],
  ["America/Rio_Branco", -18e3],
  ["America/Santarem", -10800],
  ["America/Santiago", -14400],
  ["America/Santo_Domingo", -14400],
  ["America/Sao_Paulo", -10800],
  ["America/Scoresbysund", -7200],
  ["America/Sitka", -32400],
  ["America/St_Johns", -12600],
  ["America/Swift_Current", -21600],
  ["America/Tegucigalpa", -21600],
  ["America/Thule", -14400],
  ["America/Tijuana", -28800],
  ["America/Toronto", -18e3],
  ["America/Vancouver", -28800],
  ["America/Whitehorse", -25200],
  ["America/Winnipeg", -21600],
  ["America/Yakutat", -32400],
  ["Antarctica/Casey", 28800],
  ["Antarctica/Davis", 25200],
  ["Antarctica/Macquarie", 36e3],
  ["Antarctica/Mawson", 18e3],
  ["Antarctica/Palmer", -10800],
  ["Antarctica/Rothera", -10800],
  ["Antarctica/Troll", 0],
  ["Antarctica/Vostok", 18e3],
  ["Asia/Almaty", 18e3],
  ["Asia/Amman", 10800],
  ["Asia/Anadyr", 43200],
  ["Asia/Aqtau", 18e3],
  ["Asia/Aqtobe", 18e3],
  ["Asia/Ashgabat", 18e3],
  ["Asia/Atyrau", 18e3],
  ["Asia/Baghdad", 10800],
  ["Asia/Baku", 14400],
  ["Asia/Bangkok", 25200],
  ["Asia/Barnaul", 25200],
  ["Asia/Beirut", 7200],
  ["Asia/Bishkek", 21600],
  ["Asia/Chita", 32400],
  ["Asia/Colombo", 19800],
  ["Asia/Damascus", 10800],
  ["Asia/Dhaka", 21600],
  ["Asia/Dili", 32400],
  ["Asia/Dubai", 14400],
  ["Asia/Dushanbe", 18e3],
  ["Asia/Famagusta", 7200],
  ["Asia/Gaza", 7200],
  ["Asia/Hebron", 7200],
  ["Asia/Ho_Chi_Minh", 25200],
  ["Asia/Hong_Kong", 28800],
  ["Asia/Hovd", 25200],
  ["Asia/Irkutsk", 28800],
  ["Asia/Jakarta", 25200],
  ["Asia/Jayapura", 32400],
  ["Asia/Jerusalem", 7200],
  ["Asia/Kabul", 16200],
  ["Asia/Kamchatka", 43200],
  ["Asia/Karachi", 18e3],
  ["Asia/Kathmandu", 20700],
  ["Asia/Khandyga", 32400],
  ["Asia/Kolkata", 19800],
  ["Asia/Krasnoyarsk", 25200],
  ["Asia/Kuching", 28800],
  ["Asia/Macau", 28800],
  ["Asia/Magadan", 39600],
  ["Asia/Makassar", 28800],
  ["Asia/Manila", 28800],
  ["Asia/Nicosia", 7200],
  ["Asia/Novokuznetsk", 25200],
  ["Asia/Novosibirsk", 25200],
  ["Asia/Omsk", 21600],
  ["Asia/Oral", 18e3],
  ["Asia/Pontianak", 25200],
  ["Asia/Pyongyang", 32400],
  ["Asia/Qatar", 10800],
  ["Asia/Qostanay", 18e3],
  ["Asia/Qyzylorda", 18e3],
  ["Asia/Riyadh", 10800],
  ["Asia/Sakhalin", 39600],
  ["Asia/Samarkand", 18e3],
  ["Asia/Seoul", 32400],
  ["Asia/Shanghai", 28800],
  ["Asia/Singapore", 28800],
  ["Asia/Srednekolymsk", 39600],
  ["Asia/Taipei", 28800],
  ["Asia/Tashkent", 18e3],
  ["Asia/Tbilisi", 14400],
  ["Asia/Tehran", 12600],
  ["Asia/Thimphu", 21600],
  ["Asia/Tokyo", 32400],
  ["Asia/Tomsk", 25200],
  ["Asia/Ulaanbaatar", 28800],
  ["Asia/Urumqi", 21600],
  ["Asia/Ust-Nera", 36e3],
  ["Asia/Vladivostok", 36e3],
  ["Asia/Yakutsk", 32400],
  ["Asia/Yangon", 23400],
  ["Asia/Yekaterinburg", 18e3],
  ["Asia/Yerevan", 14400],
  ["Atlantic/Azores", -3600],
  ["Atlantic/Bermuda", -14400],
  ["Atlantic/Canary", 0],
  ["Atlantic/Cape_Verde", -3600],
  ["Atlantic/Faroe", 0],
  ["Atlantic/Madeira", 0],
  ["Atlantic/South_Georgia", -7200],
  ["Atlantic/Stanley", -10800],
  ["Australia/Adelaide", 34200],
  ["Australia/Brisbane", 36e3],
  ["Australia/Broken_Hill", 34200],
  ["Australia/Darwin", 34200],
  ["Australia/Eucla", 31500],
  ["Australia/Hobart", 36e3],
  ["Australia/Lindeman", 36e3],
  ["Australia/Lord_Howe", 37800],
  ["Australia/Melbourne", 36e3],
  ["Australia/Perth", 28800],
  ["Australia/Sydney", 36e3],
  ["Etc/GMT", 0],
  ["Etc/GMT+1", -3600],
  ["Etc/GMT+10", -36e3],
  ["Etc/GMT+11", -39600],
  ["Etc/GMT+12", -43200],
  ["Etc/GMT+2", -7200],
  ["Etc/GMT+3", -10800],
  ["Etc/GMT+4", -14400],
  ["Etc/GMT+5", -18e3],
  ["Etc/GMT+6", -21600],
  ["Etc/GMT+7", -25200],
  ["Etc/GMT+8", -28800],
  ["Etc/GMT+9", -32400],
  ["Etc/GMT-1", 3600],
  ["Etc/GMT-10", 36e3],
  ["Etc/GMT-11", 39600],
  ["Etc/GMT-12", 43200],
  ["Etc/GMT-13", 46800],
  ["Etc/GMT-14", 50400],
  ["Etc/GMT-2", 7200],
  ["Etc/GMT-3", 10800],
  ["Etc/GMT-4", 14400],
  ["Etc/GMT-5", 18e3],
  ["Etc/GMT-6", 21600],
  ["Etc/GMT-7", 25200],
  ["Etc/GMT-8", 28800],
  ["Etc/GMT-9", 32400],
  ["Etc/UTC", 0],
  ["Europe/Andorra", 3600],
  ["Europe/Astrakhan", 14400],
  ["Europe/Athens", 7200],
  ["Europe/Belgrade", 3600],
  ["Europe/Berlin", 3600],
  ["Europe/Brussels", 3600],
  ["Europe/Bucharest", 7200],
  ["Europe/Budapest", 3600],
  ["Europe/Chisinau", 7200],
  ["Europe/Dublin", 3600],
  ["Europe/Gibraltar", 3600],
  ["Europe/Helsinki", 7200],
  ["Europe/Istanbul", 10800],
  ["Europe/Kaliningrad", 7200],
  ["Europe/Kirov", 10800],
  ["Europe/Kyiv", 7200],
  ["Europe/Lisbon", 0],
  ["Europe/London", 0],
  ["Europe/Madrid", 3600],
  ["Europe/Malta", 3600],
  ["Europe/Minsk", 10800],
  ["Europe/Moscow", 10800],
  ["Europe/Paris", 3600],
  ["Europe/Prague", 3600],
  ["Europe/Riga", 7200],
  ["Europe/Rome", 3600],
  ["Europe/Samara", 14400],
  ["Europe/Saratov", 14400],
  ["Europe/Simferopol", 10800],
  ["Europe/Sofia", 7200],
  ["Europe/Tallinn", 7200],
  ["Europe/Tirane", 3600],
  ["Europe/Ulyanovsk", 14400],
  ["Europe/Vienna", 3600],
  ["Europe/Vilnius", 7200],
  ["Europe/Volgograd", 10800],
  ["Europe/Warsaw", 3600],
  ["Europe/Zurich", 3600],
  ["Indian/Chagos", 21600],
  ["Indian/Maldives", 18e3],
  ["Indian/Mauritius", 14400],
  ["Pacific/Apia", 46800],
  ["Pacific/Auckland", 43200],
  ["Pacific/Bougainville", 39600],
  ["Pacific/Chatham", 45900],
  ["Pacific/Easter", -21600],
  ["Pacific/Efate", 39600],
  ["Pacific/Fakaofo", 46800],
  ["Pacific/Fiji", 43200],
  ["Pacific/Galapagos", -21600],
  ["Pacific/Gambier", -32400],
  ["Pacific/Guadalcanal", 39600],
  ["Pacific/Guam", 36e3],
  ["Pacific/Honolulu", -36e3],
  ["Pacific/Kanton", 46800],
  ["Pacific/Kiritimati", 50400],
  ["Pacific/Kosrae", 39600],
  ["Pacific/Kwajalein", 43200],
  ["Pacific/Marquesas", -34200],
  ["Pacific/Nauru", 43200],
  ["Pacific/Niue", -39600],
  ["Pacific/Norfolk", 39600],
  ["Pacific/Noumea", 39600],
  ["Pacific/Pago_Pago", -39600],
  ["Pacific/Palau", 32400],
  ["Pacific/Pitcairn", -28800],
  ["Pacific/Port_Moresby", 36e3],
  ["Pacific/Rarotonga", -36e3],
  ["Pacific/Tahiti", -36e3],
  ["Pacific/Tarawa", 43200],
  ["Pacific/Tongatapu", 46800]
]);

// build/dev/javascript/birl/birl_ffi.mjs
function now() {
  return Date.now() * 1e3;
}
function local_offset() {
  const date = /* @__PURE__ */ new Date();
  return -date.getTimezoneOffset();
}
function local_timezone() {
  return new Some(Intl.DateTimeFormat().resolvedOptions().timeZone);
}
function monotonic_now() {
  return Math.floor(globalThis.performance.now() * 1e3);
}
function to_parts(timestamp, offset) {
  const date = new Date((timestamp + offset) / 1e3);
  return [
    [date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()],
    [
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
      date.getUTCMilliseconds()
    ]
  ];
}
function from_parts(parts, offset) {
  const date = new Date(
    Date.UTC(
      parts[0][0],
      parts[0][1] - 1,
      parts[0][2],
      parts[1][0],
      parts[1][1],
      parts[1][2],
      parts[1][3]
    )
  );
  return date.getTime() * 1e3 - offset;
}

// build/dev/javascript/birl/birl.mjs
var Time = class extends CustomType {
  constructor(wall_time, offset, timezone, monotonic_time) {
    super();
    this.wall_time = wall_time;
    this.offset = offset;
    this.timezone = timezone;
    this.monotonic_time = monotonic_time;
  }
};
var Day2 = class extends CustomType {
  constructor(year2, month2, date) {
    super();
    this.year = year2;
    this.month = month2;
    this.date = date;
  }
};
var TimeOfDay = class extends CustomType {
  constructor(hour2, minute2, second2, milli_second2) {
    super();
    this.hour = hour2;
    this.minute = minute2;
    this.second = second2;
    this.milli_second = milli_second2;
  }
};
function compare3(a2, b) {
  let wta = a2.wall_time;
  let mta = a2.monotonic_time;
  let wtb = b.wall_time;
  let mtb = b.monotonic_time;
  let $ = (() => {
    if (mta instanceof Some && mtb instanceof Some) {
      let ta2 = mta[0];
      let tb2 = mtb[0];
      return [ta2, tb2];
    } else {
      return [wta, wtb];
    }
  })();
  let ta = $[0];
  let tb = $[1];
  let $1 = ta === tb;
  let $2 = ta < tb;
  if ($1) {
    return new Eq();
  } else if ($2) {
    return new Lt();
  } else {
    return new Gt();
  }
}
function add3(value3, duration) {
  let wt = value3.wall_time;
  let o = value3.offset;
  let timezone = value3.timezone;
  let mt = value3.monotonic_time;
  let duration$1 = duration[0];
  if (mt instanceof Some) {
    let mt$1 = mt[0];
    return new Time(
      wt + duration$1,
      o,
      timezone,
      new Some(mt$1 + duration$1)
    );
  } else {
    return new Time(wt + duration$1, o, timezone, new None());
  }
}
function parse_offset(offset) {
  return guard(
    contains(toList(["Z", "z"]), offset),
    new Ok(0),
    () => {
      let $ = from_string("([+-])");
      if (!$.isOk()) {
        throw makeError(
          "let_assert",
          "birl",
          1332,
          "",
          "Pattern match failed, no pattern matched the value.",
          { value: $ }
        );
      }
      let re = $[0];
      return then$(
        (() => {
          let $1 = split4(re, offset);
          if ($1.hasLength(3) && $1.head === "" && $1.tail.head === "+") {
            let offset$1 = $1.tail.tail.head;
            return new Ok([1, offset$1]);
          } else if ($1.hasLength(3) && $1.head === "" && $1.tail.head === "-") {
            let offset$1 = $1.tail.tail.head;
            return new Ok([-1, offset$1]);
          } else if ($1.hasLength(1)) {
            return new Ok([1, offset]);
          } else {
            return new Error(void 0);
          }
        })(),
        (_use0) => {
          let sign = _use0[0];
          let offset$1 = _use0[1];
          let $1 = split2(offset$1, ":");
          if ($1.hasLength(2)) {
            let hour_str = $1.head;
            let minute_str = $1.tail.head;
            return then$(
              parse_int(hour_str),
              (hour2) => {
                return then$(
                  parse_int(minute_str),
                  (minute2) => {
                    return new Ok(sign * (hour2 * 60 + minute2) * 60 * 1e6);
                  }
                );
              }
            );
          } else if ($1.hasLength(1)) {
            let offset$2 = $1.head;
            let $2 = string_length(offset$2);
            if ($2 === 1) {
              return then$(
                parse_int(offset$2),
                (hour2) => {
                  return new Ok(sign * hour2 * 3600 * 1e6);
                }
              );
            } else if ($2 === 2) {
              return then$(
                parse_int(offset$2),
                (number) => {
                  let $3 = number < 14;
                  if ($3) {
                    return new Ok(sign * number * 3600 * 1e6);
                  } else {
                    return new Ok(
                      sign * (divideInt(number, 10) * 60 + remainderInt(
                        number,
                        10
                      )) * 60 * 1e6
                    );
                  }
                }
              );
            } else if ($2 === 3) {
              let $3 = first(offset$2);
              if (!$3.isOk()) {
                throw makeError(
                  "let_assert",
                  "birl",
                  1362,
                  "",
                  "Pattern match failed, no pattern matched the value.",
                  { value: $3 }
                );
              }
              let hour_str = $3[0];
              let minute_str = slice(offset$2, 1, 2);
              return then$(
                parse_int(hour_str),
                (hour2) => {
                  return then$(
                    parse_int(minute_str),
                    (minute2) => {
                      return new Ok(
                        sign * (hour2 * 60 + minute2) * 60 * 1e6
                      );
                    }
                  );
                }
              );
            } else if ($2 === 4) {
              let hour_str = slice(offset$2, 0, 2);
              let minute_str = slice(offset$2, 2, 2);
              return then$(
                parse_int(hour_str),
                (hour2) => {
                  return then$(
                    parse_int(minute_str),
                    (minute2) => {
                      return new Ok(
                        sign * (hour2 * 60 + minute2) * 60 * 1e6
                      );
                    }
                  );
                }
              );
            } else {
              return new Error(void 0);
            }
          } else {
            return new Error(void 0);
          }
        }
      );
    }
  );
}
function set_offset(value3, new_offset) {
  return then$(
    parse_offset(new_offset),
    (new_offset_number) => {
      {
        let t = value3.wall_time;
        let timezone = value3.timezone;
        let mt = value3.monotonic_time;
        let _pipe = new Time(t, new_offset_number, timezone, mt);
        return new Ok(_pipe);
      }
    }
  );
}
function generate_offset(offset) {
  return guard(
    offset === 0,
    new Ok("Z"),
    () => {
      let $ = (() => {
        let _pipe = toList([[offset, new MicroSecond()]]);
        let _pipe$1 = new$3(_pipe);
        return decompose(_pipe$1);
      })();
      if ($.hasLength(2) && $.head[1] instanceof Hour && $.tail.head[1] instanceof Minute) {
        let hour2 = $.head[0];
        let minute2 = $.tail.head[0];
        let _pipe = toList([
          (() => {
            let $1 = hour2 > 0;
            if ($1) {
              return concat2(
                toList([
                  "+",
                  (() => {
                    let _pipe2 = hour2;
                    let _pipe$12 = to_string(_pipe2);
                    return pad_start(_pipe$12, 2, "0");
                  })()
                ])
              );
            } else {
              return concat2(
                toList([
                  "-",
                  (() => {
                    let _pipe2 = hour2;
                    let _pipe$12 = absolute_value(_pipe2);
                    let _pipe$2 = to_string(_pipe$12);
                    return pad_start(_pipe$2, 2, "0");
                  })()
                ])
              );
            }
          })(),
          (() => {
            let _pipe2 = minute2;
            let _pipe$12 = absolute_value(_pipe2);
            let _pipe$2 = to_string(_pipe$12);
            return pad_start(_pipe$2, 2, "0");
          })()
        ]);
        let _pipe$1 = join(_pipe, ":");
        return new Ok(_pipe$1);
      } else if ($.hasLength(1) && $.head[1] instanceof Hour) {
        let hour2 = $.head[0];
        let _pipe = toList([
          (() => {
            let $1 = hour2 > 0;
            if ($1) {
              return concat2(
                toList([
                  "+",
                  (() => {
                    let _pipe2 = hour2;
                    let _pipe$12 = to_string(_pipe2);
                    return pad_start(_pipe$12, 2, "0");
                  })()
                ])
              );
            } else {
              return concat2(
                toList([
                  "-",
                  (() => {
                    let _pipe2 = hour2;
                    let _pipe$12 = absolute_value(_pipe2);
                    let _pipe$2 = to_string(_pipe$12);
                    return pad_start(_pipe$2, 2, "0");
                  })()
                ])
              );
            }
          })(),
          "00"
        ]);
        let _pipe$1 = join(_pipe, ":");
        return new Ok(_pipe$1);
      } else {
        return new Error(void 0);
      }
    }
  );
}
function get_offset(value3) {
  let offset = value3.offset;
  let $ = generate_offset(offset);
  if (!$.isOk()) {
    throw makeError(
      "let_assert",
      "birl",
      1208,
      "get_offset",
      "Pattern match failed, no pattern matched the value.",
      { value: $ }
    );
  }
  let offset$1 = $[0];
  return offset$1;
}
function is_invalid_date(date) {
  let _pipe = date;
  let _pipe$1 = to_utf_codepoints(_pipe);
  let _pipe$2 = map2(_pipe$1, utf_codepoint_to_int);
  return any(
    _pipe$2,
    (code3) => {
      if (code3 === 45) {
        return false;
      } else if (code3 >= 48 && code3 <= 57) {
        return false;
      } else {
        return true;
      }
    }
  );
}
function is_invalid_time(time) {
  let _pipe = time;
  let _pipe$1 = to_utf_codepoints(_pipe);
  let _pipe$2 = map2(_pipe$1, utf_codepoint_to_int);
  return any(
    _pipe$2,
    (code3) => {
      if (code3 >= 48 && code3 <= 58) {
        return false;
      } else {
        return true;
      }
    }
  );
}
function parse_section(section, pattern_string, default$2) {
  let $ = from_string(pattern_string);
  if (!$.isOk()) {
    throw makeError(
      "let_assert",
      "birl",
      1527,
      "parse_section",
      "Pattern match failed, no pattern matched the value.",
      { value: $ }
    );
  }
  let pattern = $[0];
  let $1 = scan2(pattern, section);
  if ($1.hasLength(1) && $1.head instanceof Match && $1.head.submatches.hasLength(1) && $1.head.submatches.head instanceof Some) {
    let major = $1.head.submatches.head[0];
    return toList([parse_int(major), new Ok(default$2), new Ok(default$2)]);
  } else if ($1.hasLength(1) && $1.head instanceof Match && $1.head.submatches.hasLength(2) && $1.head.submatches.head instanceof Some && $1.head.submatches.tail.head instanceof Some) {
    let major = $1.head.submatches.head[0];
    let middle = $1.head.submatches.tail.head[0];
    return toList([parse_int(major), parse_int(middle), new Ok(default$2)]);
  } else if ($1.hasLength(1) && $1.head instanceof Match && $1.head.submatches.hasLength(3) && $1.head.submatches.head instanceof Some && $1.head.submatches.tail.head instanceof Some && $1.head.submatches.tail.tail.head instanceof Some) {
    let major = $1.head.submatches.head[0];
    let middle = $1.head.submatches.tail.head[0];
    let minor = $1.head.submatches.tail.tail.head[0];
    return toList([parse_int(major), parse_int(middle), parse_int(minor)]);
  } else {
    return toList([new Error(void 0)]);
  }
}
function parse_date_section(date) {
  return guard(
    is_invalid_date(date),
    new Error(void 0),
    () => {
      let _pipe = (() => {
        let $ = contains_string(date, "-");
        if ($) {
          let $1 = from_string(
            "(\\d{4})(?:-(1[0-2]|0?[0-9]))?(?:-(3[0-1]|[1-2][0-9]|0?[0-9]))?"
          );
          if (!$1.isOk()) {
            throw makeError(
              "let_assert",
              "birl",
              1447,
              "",
              "Pattern match failed, no pattern matched the value.",
              { value: $1 }
            );
          }
          let dash_pattern = $1[0];
          let $2 = scan2(dash_pattern, date);
          if ($2.hasLength(1) && $2.head instanceof Match && $2.head.submatches.hasLength(1) && $2.head.submatches.head instanceof Some) {
            let major = $2.head.submatches.head[0];
            return toList([parse_int(major), new Ok(1), new Ok(1)]);
          } else if ($2.hasLength(1) && $2.head instanceof Match && $2.head.submatches.hasLength(2) && $2.head.submatches.head instanceof Some && $2.head.submatches.tail.head instanceof Some) {
            let major = $2.head.submatches.head[0];
            let middle = $2.head.submatches.tail.head[0];
            return toList([parse_int(major), parse_int(middle), new Ok(1)]);
          } else if ($2.hasLength(1) && $2.head instanceof Match && $2.head.submatches.hasLength(3) && $2.head.submatches.head instanceof Some && $2.head.submatches.tail.head instanceof Some && $2.head.submatches.tail.tail.head instanceof Some) {
            let major = $2.head.submatches.head[0];
            let middle = $2.head.submatches.tail.head[0];
            let minor = $2.head.submatches.tail.tail.head[0];
            return toList([
              parse_int(major),
              parse_int(middle),
              parse_int(minor)
            ]);
          } else {
            return toList([new Error(void 0)]);
          }
        } else {
          return parse_section(
            date,
            "(\\d{4})(1[0-2]|0?[0-9])?(3[0-1]|[1-2][0-9]|0?[0-9])?",
            1
          );
        }
      })();
      return try_map(_pipe, identity3);
    }
  );
}
function parse_time_section(time) {
  return guard(
    is_invalid_time(time),
    new Error(void 0),
    () => {
      let _pipe = parse_section(
        time,
        "(2[0-3]|1[0-9]|0?[0-9])([1-5][0-9]|0?[0-9])?([1-5][0-9]|0?[0-9])?",
        0
      );
      return try_map(_pipe, identity3);
    }
  );
}
function utc_now() {
  let now$1 = now();
  let monotonic_now$1 = monotonic_now();
  return new Time(
    now$1,
    0,
    new Some("Etc/UTC"),
    new Some(monotonic_now$1)
  );
}
function to_parts2(value3) {
  {
    let t = value3.wall_time;
    let o = value3.offset;
    let $ = to_parts(t, o);
    let date = $[0];
    let time = $[1];
    let $1 = generate_offset(o);
    if (!$1.isOk()) {
      throw makeError(
        "let_assert",
        "birl",
        1324,
        "to_parts",
        "Pattern match failed, no pattern matched the value.",
        { value: $1 }
      );
    }
    let offset = $1[0];
    return [date, time, offset];
  }
}
function get_day(value3) {
  let $ = to_parts2(value3);
  let year2 = $[0][0];
  let month$1 = $[0][1];
  let day2 = $[0][2];
  return new Day2(year2, month$1, day2);
}
function get_time_of_day(value3) {
  let $ = to_parts2(value3);
  let hour2 = $[1][0];
  let minute2 = $[1][1];
  let second2 = $[1][2];
  let milli_second2 = $[1][3];
  return new TimeOfDay(hour2, minute2, second2, milli_second2);
}
function from_parts2(date, time, offset) {
  return then$(
    parse_offset(offset),
    (offset_number) => {
      let _pipe = from_parts([date, time], offset_number);
      let _pipe$1 = new Time(
        _pipe,
        offset_number,
        new None(),
        new None()
      );
      return new Ok(_pipe$1);
    }
  );
}
function parse4(value3) {
  let $ = from_string("(.*)([+|\\-].*)");
  if (!$.isOk()) {
    throw makeError(
      "let_assert",
      "birl",
      298,
      "parse",
      "Pattern match failed, no pattern matched the value.",
      { value: $ }
    );
  }
  let offset_pattern = $[0];
  let value$1 = trim(value3);
  return then$(
    (() => {
      let $1 = split2(value$1, "T");
      let $2 = split2(value$1, "t");
      let $3 = split2(value$1, " ");
      if ($1.hasLength(2)) {
        let day_string = $1.head;
        let time_string = $1.tail.head;
        return new Ok([day_string, time_string]);
      } else if ($2.hasLength(2)) {
        let day_string = $2.head;
        let time_string = $2.tail.head;
        return new Ok([day_string, time_string]);
      } else if ($3.hasLength(2)) {
        let day_string = $3.head;
        let time_string = $3.tail.head;
        return new Ok([day_string, time_string]);
      } else if ($1.hasLength(1) && $2.hasLength(1) && $3.hasLength(1)) {
        return new Ok([value$1, "00"]);
      } else {
        return new Error(void 0);
      }
    })(),
    (_use0) => {
      let day_string = _use0[0];
      let offsetted_time_string = _use0[1];
      let day_string$1 = trim(day_string);
      let offsetted_time_string$1 = trim(offsetted_time_string);
      return then$(
        (() => {
          let $1 = ends_with(offsetted_time_string$1, "Z") || ends_with(
            offsetted_time_string$1,
            "z"
          );
          if ($1) {
            return new Ok(
              [
                day_string$1,
                drop_end(offsetted_time_string$1, 1),
                "+00:00"
              ]
            );
          } else {
            let $2 = scan2(offset_pattern, offsetted_time_string$1);
            if ($2.hasLength(1) && $2.head instanceof Match && $2.head.submatches.hasLength(2) && $2.head.submatches.head instanceof Some && $2.head.submatches.tail.head instanceof Some) {
              let time_string = $2.head.submatches.head[0];
              let offset_string = $2.head.submatches.tail.head[0];
              return new Ok([day_string$1, time_string, offset_string]);
            } else {
              let $3 = scan2(offset_pattern, day_string$1);
              if ($3.hasLength(1) && $3.head instanceof Match && $3.head.submatches.hasLength(2) && $3.head.submatches.head instanceof Some && $3.head.submatches.tail.head instanceof Some) {
                let day_string$2 = $3.head.submatches.head[0];
                let offset_string = $3.head.submatches.tail.head[0];
                return new Ok([day_string$2, "00", offset_string]);
              } else {
                return new Error(void 0);
              }
            }
          }
        })(),
        (_use02) => {
          let day_string$2 = _use02[0];
          let time_string = _use02[1];
          let offset_string = _use02[2];
          let time_string$1 = replace(time_string, ":", "");
          return then$(
            (() => {
              let $1 = split2(time_string$1, ".");
              let $2 = split2(time_string$1, ",");
              if ($1.hasLength(1) && $2.hasLength(1)) {
                return new Ok([time_string$1, new Ok(0)]);
              } else if ($1.hasLength(2) && $2.hasLength(1)) {
                let time_string$2 = $1.head;
                let milli_seconds_string = $1.tail.head;
                return new Ok(
                  [
                    time_string$2,
                    (() => {
                      let _pipe = milli_seconds_string;
                      let _pipe$1 = slice(_pipe, 0, 3);
                      let _pipe$2 = pad_end(_pipe$1, 3, "0");
                      return parse_int(_pipe$2);
                    })()
                  ]
                );
              } else if ($1.hasLength(1) && $2.hasLength(2)) {
                let time_string$2 = $2.head;
                let milli_seconds_string = $2.tail.head;
                return new Ok(
                  [
                    time_string$2,
                    (() => {
                      let _pipe = milli_seconds_string;
                      let _pipe$1 = slice(_pipe, 0, 3);
                      let _pipe$2 = pad_end(_pipe$1, 3, "0");
                      return parse_int(_pipe$2);
                    })()
                  ]
                );
              } else {
                return new Error(void 0);
              }
            })(),
            (_use03) => {
              let time_string$2 = _use03[0];
              let milli_seconds_result = _use03[1];
              if (milli_seconds_result.isOk()) {
                let milli_seconds = milli_seconds_result[0];
                return then$(
                  parse_date_section(day_string$2),
                  (day2) => {
                    if (!day2.hasLength(3)) {
                      throw makeError(
                        "let_assert",
                        "birl",
                        370,
                        "",
                        "Pattern match failed, no pattern matched the value.",
                        { value: day2 }
                      );
                    }
                    let year2 = day2.head;
                    let month$1 = day2.tail.head;
                    let date = day2.tail.tail.head;
                    return then$(
                      parse_time_section(time_string$2),
                      (time_of_day) => {
                        if (!time_of_day.hasLength(3)) {
                          throw makeError(
                            "let_assert",
                            "birl",
                            373,
                            "",
                            "Pattern match failed, no pattern matched the value.",
                            { value: time_of_day }
                          );
                        }
                        let hour2 = time_of_day.head;
                        let minute2 = time_of_day.tail.head;
                        let second2 = time_of_day.tail.tail.head;
                        return from_parts2(
                          [year2, month$1, date],
                          [hour2, minute2, second2, milli_seconds],
                          offset_string
                        );
                      }
                    );
                  }
                );
              } else {
                return new Error(void 0);
              }
            }
          );
        }
      );
    }
  );
}
function set_day(value3, day2) {
  let $ = to_parts2(value3);
  let time = $[1];
  let offset = $[2];
  let year2 = day2.year;
  let month$1 = day2.month;
  let date = day2.date;
  let $1 = from_parts2([year2, month$1, date], time, offset);
  if (!$1.isOk()) {
    throw makeError(
      "let_assert",
      "birl",
      1215,
      "set_day",
      "Pattern match failed, no pattern matched the value.",
      { value: $1 }
    );
  }
  let new_value = $1[0];
  return new Time(
    new_value.wall_time,
    new_value.offset,
    value3.timezone,
    value3.monotonic_time
  );
}
function set_time_of_day(value3, time) {
  let $ = to_parts2(value3);
  let date = $[0];
  let offset = $[2];
  let hour2 = time.hour;
  let minute2 = time.minute;
  let second2 = time.second;
  let milli_second2 = time.milli_second;
  let $1 = from_parts2(date, [hour2, minute2, second2, milli_second2], offset);
  if (!$1.isOk()) {
    throw makeError(
      "let_assert",
      "birl",
      1233,
      "set_time_of_day",
      "Pattern match failed, no pattern matched the value.",
      { value: $1 }
    );
  }
  let new_value = $1[0];
  return new Time(
    new_value.wall_time,
    new_value.offset,
    value3.timezone,
    value3.monotonic_time
  );
}
function now2() {
  let now$1 = now();
  let offset_in_minutes = local_offset();
  let monotonic_now$1 = monotonic_now();
  let timezone = local_timezone();
  return new Time(
    now$1,
    offset_in_minutes * 6e7,
    (() => {
      let _pipe = map(
        timezone,
        (tz) => {
          let $ = any(list3, (item) => {
            return item[0] === tz;
          });
          if ($) {
            return new Some(tz);
          } else {
            return new None();
          }
        }
      );
      return flatten(_pipe);
    })(),
    new Some(monotonic_now$1)
  );
}
var unix_epoch = /* @__PURE__ */ new Time(
  0,
  0,
  /* @__PURE__ */ new None(),
  /* @__PURE__ */ new None()
);

// build/dev/javascript/shared/shared/datetime.mjs
var DateTime = class extends CustomType {
  constructor(time) {
    super();
    this.time = time;
  }
};
function now3() {
  return new DateTime(now2());
}
function parse_localized_datetime(datetime) {
  let _pipe = parse4(datetime + get_offset(now2()));
  return map3(_pipe, (var0) => {
    return new DateTime(var0);
  });
}
function to_utc(datetime) {
  return new DateTime(
    unwrap(set_offset(datetime.time, "Z"), datetime.time)
  );
}
function to_localized(datetime) {
  return new DateTime(
    unwrap(
      set_offset(datetime.time, get_offset(now2())),
      datetime.time
    )
  );
}
function to_string4(datetime) {
  let $ = get_day(datetime.time);
  let year2 = $.year;
  let month2 = $.month;
  let day2 = $.date;
  let $1 = get_time_of_day(datetime.time);
  let hour2 = $1.hour;
  let minute2 = $1.minute;
  let day$1 = (() => {
    let _pipe = day2;
    let _pipe$1 = to_string(_pipe);
    return pad_start(_pipe$1, 2, "0");
  })();
  let month$1 = (() => {
    let _pipe = month2;
    let _pipe$1 = to_string(_pipe);
    return pad_start(_pipe$1, 2, "0");
  })();
  let year$1 = (() => {
    let _pipe = year2;
    let _pipe$1 = to_string(_pipe);
    return pad_start(_pipe$1, 4, "0");
  })();
  let hour$1 = (() => {
    let _pipe = hour2;
    let _pipe$1 = to_string(_pipe);
    return pad_start(_pipe$1, 2, "0");
  })();
  let minute$1 = (() => {
    let _pipe = minute2;
    let _pipe$1 = to_string(_pipe);
    return pad_start(_pipe$1, 2, "0");
  })();
  return day$1 + "/" + month$1 + "/" + year$1 + " " + hour$1 + ":" + minute$1;
}
function next_period(loop$date, loop$period) {
  while (true) {
    let date = loop$date;
    let period = loop$period;
    let $ = compare3(date.time, utc_now());
    if ($ instanceof Lt) {
      loop$date = new DateTime(add3(date.time, days(period)));
      loop$period = period;
    } else {
      return date;
    }
  }
}
function erlang_datetime_decoder() {
  return field2(
    0,
    field2(
      0,
      int2,
      (a2) => {
        return field2(
          1,
          int2,
          (b) => {
            return field2(
              2,
              int2,
              (c) => {
                return success([a2, b, c]);
              }
            );
          }
        );
      }
    ),
    (a2) => {
      return field2(
        1,
        field2(
          0,
          int2,
          (a3) => {
            return field2(
              1,
              int2,
              (b) => {
                return field2(
                  2,
                  int2,
                  (c) => {
                    return success([a3, b, c]);
                  }
                );
              }
            );
          }
        ),
        (b) => {
          return success([a2, b]);
        }
      );
    }
  );
}
function decoder2() {
  return then$2(
    erlang_datetime_decoder(),
    (erlang_datetime) => {
      let date = erlang_datetime[0];
      let time = erlang_datetime[1];
      let datetime = (() => {
        let _pipe = unix_epoch;
        let _pipe$1 = set_day(
          _pipe,
          new Day2(date[0], date[1], date[2])
        );
        return set_time_of_day(
          _pipe$1,
          new TimeOfDay(time[0], time[1], time[2], 0)
        );
      })();
      return success(new DateTime(datetime));
    }
  );
}

// build/dev/javascript/shared/shared/task.mjs
var Task = class extends CustomType {
  constructor(name, time, period) {
    super();
    this.name = name;
    this.time = time;
    this.period = period;
  }
};
function decoder3() {
  return field2(
    "name",
    string3,
    (name) => {
      return field2(
        "time",
        decoder2(),
        (time) => {
          return field2(
            "period",
            int2,
            (period) => {
              return success(new Task(name, time, period));
            }
          );
        }
      );
    }
  );
}

// build/dev/javascript/lustre_ui/lustre/ui/input.mjs
function input2(attributes) {
  return input(
    prepend(class$("lustre-ui-input"), attributes)
  );
}

// build/dev/javascript/web/web/task_input.mjs
var Model2 = class extends CustomType {
  constructor(task_menu_open, task_name, task_time, task_period) {
    super();
    this.task_menu_open = task_menu_open;
    this.task_name = task_name;
    this.task_time = task_time;
    this.task_period = task_period;
  }
};
var UserOpenedTaskMenu = class extends CustomType {
};
var UserClosedTaskMenu = class extends CustomType {
};
var UserUpdatedTaskName = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var UserUpdatedTaskTime = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var UserUpdatedTaskPeriod = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var UserAddedTask = class extends CustomType {
};
function init2() {
  return new Model2(false, "", now3(), 0);
}
function update(model, msg) {
  if (msg instanceof UserOpenedTaskMenu) {
    let _record = model;
    return new Model2(
      true,
      _record.task_name,
      _record.task_time,
      _record.task_period
    );
  } else if (msg instanceof UserClosedTaskMenu) {
    let _record = model;
    return new Model2(
      false,
      _record.task_name,
      _record.task_time,
      _record.task_period
    );
  } else if (msg instanceof UserUpdatedTaskName) {
    let input$1 = msg[0];
    let _record = model;
    return new Model2(
      _record.task_menu_open,
      input$1,
      _record.task_time,
      _record.task_period
    );
  } else if (msg instanceof UserUpdatedTaskTime) {
    let input$1 = msg[0];
    let _record = model;
    return new Model2(
      _record.task_menu_open,
      _record.task_name,
      unwrap(
        map3(
          parse_localized_datetime(input$1),
          to_utc
        ),
        now3()
      ),
      _record.task_period
    );
  } else if (msg instanceof UserUpdatedTaskPeriod) {
    let input$1 = msg[0];
    let _record = model;
    return new Model2(
      _record.task_menu_open,
      _record.task_name,
      _record.task_time,
      unwrap(parse_int(input$1), 0)
    );
  } else {
    return new Model2(false, "", now3(), 0);
  }
}
function view(model) {
  return div(
    toList([]),
    prepend(
      button2(
        toList([on_click(new UserOpenedTaskMenu()), icon()]),
        toList([text2("+")])
      ),
      (() => {
        let $ = model.task_menu_open;
        if ($) {
          return toList([
            input2(
              toList([
                on_input(
                  (var0) => {
                    return new UserUpdatedTaskName(var0);
                  }
                )
              ])
            ),
            input2(
              toList([
                on_input(
                  (var0) => {
                    return new UserUpdatedTaskTime(var0);
                  }
                ),
                type_("datetime-local")
              ])
            ),
            input2(
              toList([
                on_input(
                  (var0) => {
                    return new UserUpdatedTaskPeriod(var0);
                  }
                ),
                type_("number")
              ])
            ),
            button2(
              toList([on_click(new UserAddedTask())]),
              toList([text2("Add")])
            )
          ]);
        } else {
          return toList([]);
        }
      })()
    )
  );
}

// build/dev/javascript/web/web.mjs
var Model3 = class extends CustomType {
  constructor(tasks, task_input) {
    super();
    this.tasks = tasks;
    this.task_input = task_input;
  }
};
var TaskInputMsg = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var UserDeletedTask = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var ServerReturnedTasks = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
function init3(flags) {
  return [new Model3(flags, init2()), none()];
}
function update2(model, msg) {
  if (msg instanceof TaskInputMsg && msg[0] instanceof UserAddedTask) {
    return [
      new Model3(
        prepend(
          new Task(
            model.task_input.task_name,
            next_period(
              model.task_input.task_time,
              model.task_input.task_period
            ),
            model.task_input.task_period
          ),
          model.tasks
        ),
        update(model.task_input, new UserAddedTask())
      ),
      none()
    ];
  } else if (msg instanceof TaskInputMsg) {
    let msg$1 = msg[0];
    return [
      (() => {
        let _record = model;
        return new Model3(
          _record.tasks,
          update(model.task_input, msg$1)
        );
      })(),
      none()
    ];
  } else if (msg instanceof UserDeletedTask) {
    let task = msg[0];
    return [
      (() => {
        let _record = model;
        return new Model3(
          filter(model.tasks, (t) => {
            return !isEqual(t, task);
          }),
          _record.task_input
        );
      })(),
      none()
    ];
  } else if (msg instanceof ServerReturnedTasks && msg[0].isOk()) {
    let tasks = msg[0][0];
    return [
      (() => {
        let _record = model;
        return new Model3(tasks, _record.task_input);
      })(),
      none()
    ];
  } else {
    return [
      (() => {
        let _record = model;
        return new Model3(toList([]), _record.task_input);
      })(),
      none()
    ];
  }
}
function view2(model) {
  return inject(
    default$(),
    () => {
      return div(
        toList([]),
        toList([
          h1(toList([]), toList([text2("Periodic")])),
          div(
            toList([]),
            map2(
              model.tasks,
              (task) => {
                return card(
                  toList([
                    round3(),
                    padding2(spacing.md, spacing.md)
                  ]),
                  toList([
                    content(
                      toList([]),
                      toList([
                        text2(task.name),
                        text2(
                          to_string4(
                            to_localized(
                              next_period(task.time, task.period)
                            )
                          )
                        ),
                        button2(
                          toList([
                            on_click(new UserDeletedTask(task)),
                            icon()
                          ]),
                          toList([text2("x")])
                        ),
                        map6(
                          view(model.task_input),
                          (var0) => {
                            return new TaskInputMsg(var0);
                          }
                        )
                      ])
                    )
                  ])
                );
              }
            )
          )
        ])
      );
    }
  );
}
function main2() {
  let json = (() => {
    let _pipe = querySelector("#model");
    return map3(_pipe, innerText);
  })();
  let flags = (() => {
    let $2 = parse(
      unwrap(json, ""),
      at(toList(["tasks"]), list2(decoder3()))
    );
    if ($2.isOk()) {
      let tasks = $2[0];
      return tasks;
    } else {
      return toList([]);
    }
  })();
  debug(flags);
  let app = application(init3, update2, view2);
  let $ = start2(app, "#app", flags);
  if (!$.isOk()) {
    throw makeError(
      "let_assert",
      "web",
      47,
      "main",
      "Pattern match failed, no pattern matched the value.",
      { value: $ }
    );
  }
  return void 0;
}

// build/.lustre/entry.mjs
main2();
