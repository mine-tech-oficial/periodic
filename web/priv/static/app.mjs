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
    let length2 = 0;
    for (let _ of this)
      length2++;
    return length2;
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
  byteAt(index3) {
    return this.buffer[index3];
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
  sliceAfter(index3) {
    const buffer = new Uint8Array(
      this.buffer.buffer,
      this.buffer.byteOffset + index3,
      this.buffer.byteLength - index3
    );
    return new _BitArray(buffer);
  }
};
function byteArrayToInt(byteArray, start3, end, isBigEndian, isSigned) {
  const byteSize = end - start3;
  if (byteSize <= 6) {
    let value2 = 0;
    if (isBigEndian) {
      for (let i = start3; i < end; i++) {
        value2 = value2 * 256 + byteArray[i];
      }
    } else {
      for (let i = end - 1; i >= start3; i--) {
        value2 = value2 * 256 + byteArray[i];
      }
    }
    if (isSigned) {
      const highBit = 2 ** (byteSize * 8 - 1);
      if (value2 >= highBit) {
        value2 -= highBit * 2;
      }
    }
    return value2;
  } else {
    let value2 = 0n;
    if (isBigEndian) {
      for (let i = start3; i < end; i++) {
        value2 = (value2 << 8n) + BigInt(byteArray[i]);
      }
    } else {
      for (let i = end - 1; i >= start3; i--) {
        value2 = (value2 << 8n) + BigInt(byteArray[i]);
      }
    }
    if (isSigned) {
      const highBit = 1n << BigInt(byteSize * 8 - 1);
      if (value2 >= highBit) {
        value2 -= highBit * 2n;
      }
    }
    return Number(value2);
  }
}
function byteArrayToFloat(byteArray, start3, end, isBigEndian) {
  const view2 = new DataView(byteArray.buffer);
  const byteSize = end - start3;
  if (byteSize === 8) {
    return view2.getFloat64(start3, !isBigEndian);
  } else if (byteSize === 4) {
    return view2.getFloat32(start3, !isBigEndian);
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
  constructor(value2) {
    super();
    this[0] = value2;
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

// build/dev/javascript/gleam_stdlib/gleam/float.mjs
function negate(x) {
  return -1 * x;
}
function round2(x) {
  let $ = x >= 0;
  if ($) {
    return round(x);
  } else {
    return 0 - round(negate(x));
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
function replace(string4, pattern, substitute) {
  let _pipe = string4;
  let _pipe$1 = identity(_pipe);
  let _pipe$2 = string_replace(_pipe$1, pattern, substitute);
  return identity(_pipe$2);
}
function concat2(strings) {
  let _pipe = strings;
  let _pipe$1 = concat(_pipe);
  return identity(_pipe$1);
}
function drop_start(loop$string, loop$num_graphemes) {
  while (true) {
    let string4 = loop$string;
    let num_graphemes = loop$num_graphemes;
    let $ = num_graphemes > 0;
    if (!$) {
      return string4;
    } else {
      let $1 = pop_grapheme(string4);
      if ($1.isOk()) {
        let string$1 = $1[0][1];
        loop$string = string$1;
        loop$num_graphemes = num_graphemes - 1;
      } else {
        return string4;
      }
    }
  }
}

// build/dev/javascript/gleam_stdlib/gleam/result.mjs
function map2(result, fun) {
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
      return map(_capture, f);
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
      let decoder2 = decoders.head;
      let decoders$1 = decoders.tail;
      let $ = decoder2(data);
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
  let decoder2 = do_any(
    toList([
      decode_string,
      (x) => {
        return map2(decode_int(x), to_string);
      }
    ])
  );
  let name$2 = (() => {
    let $ = decoder2(name$1);
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
  return (value2) => {
    let missing_field_error = new DecodeError("field", "nothing", toList([]));
    return try$(
      decode_field(value2, name),
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
      const code2 = o.hashCode(o);
      if (typeof code2 === "number") {
        return code2;
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
function cloneAndSet(arr, at, val) {
  const len = arr.length;
  const out = new Array(len);
  for (let i = 0; i < len; ++i) {
    out[i] = arr[i];
  }
  out[at] = val;
  return out;
}
function spliceIn(arr, at, val) {
  const len = arr.length;
  const out = new Array(len + 1);
  let i = 0;
  let g = 0;
  while (i < at) {
    out[g++] = arr[i++];
  }
  out[g++] = val;
  while (i < len) {
    out[g++] = arr[i++];
  }
  return out;
}
function spliceOut(arr, at) {
  const len = arr.length;
  const out = new Array(len - 1);
  let i = 0;
  let g = 0;
  while (i < at) {
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
function assoc(root, shift, hash, key, val, addedLeaf) {
  switch (root.type) {
    case ARRAY_NODE:
      return assocArray(root, shift, hash, key, val, addedLeaf);
    case INDEX_NODE:
      return assocIndex(root, shift, hash, key, val, addedLeaf);
    case COLLISION_NODE:
      return assocCollision(root, shift, hash, key, val, addedLeaf);
  }
}
function assocArray(root, shift, hash, key, val, addedLeaf) {
  const idx = mask(hash, shift);
  const node = root.array[idx];
  if (node === void 0) {
    addedLeaf.val = true;
    return {
      type: ARRAY_NODE,
      size: root.size + 1,
      array: cloneAndSet(root.array, idx, { type: ENTRY, k: key, v: val })
    };
  }
  if (node.type === ENTRY) {
    if (isEqual(key, node.k)) {
      if (val === node.v) {
        return root;
      }
      return {
        type: ARRAY_NODE,
        size: root.size,
        array: cloneAndSet(root.array, idx, {
          type: ENTRY,
          k: key,
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
        createNode(shift + SHIFT, node.k, node.v, hash, key, val)
      )
    };
  }
  const n = assoc(node, shift + SHIFT, hash, key, val, addedLeaf);
  if (n === node) {
    return root;
  }
  return {
    type: ARRAY_NODE,
    size: root.size,
    array: cloneAndSet(root.array, idx, n)
  };
}
function assocIndex(root, shift, hash, key, val, addedLeaf) {
  const bit = bitpos(hash, shift);
  const idx = index(root.bitmap, bit);
  if ((root.bitmap & bit) !== 0) {
    const node = root.array[idx];
    if (node.type !== ENTRY) {
      const n = assoc(node, shift + SHIFT, hash, key, val, addedLeaf);
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
    if (isEqual(key, nodeKey)) {
      if (val === node.v) {
        return root;
      }
      return {
        type: INDEX_NODE,
        bitmap: root.bitmap,
        array: cloneAndSet(root.array, idx, {
          type: ENTRY,
          k: key,
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
        createNode(shift + SHIFT, nodeKey, node.v, hash, key, val)
      )
    };
  } else {
    const n = root.array.length;
    if (n >= MAX_INDEX_NODE) {
      const nodes = new Array(32);
      const jdx = mask(hash, shift);
      nodes[jdx] = assocIndex(EMPTY, shift + SHIFT, hash, key, val, addedLeaf);
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
        k: key,
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
function assocCollision(root, shift, hash, key, val, addedLeaf) {
  if (hash === root.hash) {
    const idx = collisionIndexOf(root, key);
    if (idx !== -1) {
      const entry = root.array[idx];
      if (entry.v === val) {
        return root;
      }
      return {
        type: COLLISION_NODE,
        hash,
        array: cloneAndSet(root.array, idx, { type: ENTRY, k: key, v: val })
      };
    }
    const size = root.array.length;
    addedLeaf.val = true;
    return {
      type: COLLISION_NODE,
      hash,
      array: cloneAndSet(root.array, size, { type: ENTRY, k: key, v: val })
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
    key,
    val,
    addedLeaf
  );
}
function collisionIndexOf(root, key) {
  const size = root.array.length;
  for (let i = 0; i < size; i++) {
    if (isEqual(key, root.array[i].k)) {
      return i;
    }
  }
  return -1;
}
function find(root, shift, hash, key) {
  switch (root.type) {
    case ARRAY_NODE:
      return findArray(root, shift, hash, key);
    case INDEX_NODE:
      return findIndex(root, shift, hash, key);
    case COLLISION_NODE:
      return findCollision(root, key);
  }
}
function findArray(root, shift, hash, key) {
  const idx = mask(hash, shift);
  const node = root.array[idx];
  if (node === void 0) {
    return void 0;
  }
  if (node.type !== ENTRY) {
    return find(node, shift + SHIFT, hash, key);
  }
  if (isEqual(key, node.k)) {
    return node;
  }
  return void 0;
}
function findIndex(root, shift, hash, key) {
  const bit = bitpos(hash, shift);
  if ((root.bitmap & bit) === 0) {
    return void 0;
  }
  const idx = index(root.bitmap, bit);
  const node = root.array[idx];
  if (node.type !== ENTRY) {
    return find(node, shift + SHIFT, hash, key);
  }
  if (isEqual(key, node.k)) {
    return node;
  }
  return void 0;
}
function findCollision(root, key) {
  const idx = collisionIndexOf(root, key);
  if (idx < 0) {
    return void 0;
  }
  return root.array[idx];
}
function without(root, shift, hash, key) {
  switch (root.type) {
    case ARRAY_NODE:
      return withoutArray(root, shift, hash, key);
    case INDEX_NODE:
      return withoutIndex(root, shift, hash, key);
    case COLLISION_NODE:
      return withoutCollision(root, key);
  }
}
function withoutArray(root, shift, hash, key) {
  const idx = mask(hash, shift);
  const node = root.array[idx];
  if (node === void 0) {
    return root;
  }
  let n = void 0;
  if (node.type === ENTRY) {
    if (!isEqual(node.k, key)) {
      return root;
    }
  } else {
    n = without(node, shift + SHIFT, hash, key);
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
function withoutIndex(root, shift, hash, key) {
  const bit = bitpos(hash, shift);
  if ((root.bitmap & bit) === 0) {
    return root;
  }
  const idx = index(root.bitmap, bit);
  const node = root.array[idx];
  if (node.type !== ENTRY) {
    const n = without(node, shift + SHIFT, hash, key);
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
  if (isEqual(key, node.k)) {
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
function withoutCollision(root, key) {
  const idx = collisionIndexOf(root, key);
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
  get(key, notFound) {
    if (this.root === void 0) {
      return notFound;
    }
    const found = find(this.root, 0, getHash(key), key);
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
  set(key, val) {
    const addedLeaf = { val: false };
    const root = this.root === void 0 ? EMPTY : this.root;
    const newRoot = assoc(root, 0, getHash(key), key, val, addedLeaf);
    if (newRoot === this.root) {
      return this;
    }
    return new _Dict(newRoot, addedLeaf.val ? this.size + 1 : this.size);
  }
  /**
   * @param {K} key
   * @returns {Dict<K,V>}
   */
  delete(key) {
    if (this.root === void 0) {
      return this;
    }
    const newRoot = without(this.root, 0, getHash(key), key);
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
  has(key) {
    if (this.root === void 0) {
      return false;
    }
    return find(this.root, 0, getHash(key), key) !== void 0;
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
function to_string(term) {
  return term.toString();
}
function float_to_string(float4) {
  const string4 = float4.toString().replace("+", "");
  if (string4.indexOf(".") >= 0) {
    return string4;
  } else {
    const index3 = string4.indexOf("e");
    if (index3 >= 0) {
      return string4.slice(0, index3) + ".0" + string4.slice(index3);
    } else {
      return string4 + ".0";
    }
  }
}
function string_replace(string4, target, substitute) {
  if (typeof string4.replaceAll !== "undefined") {
    return string4.replaceAll(target, substitute);
  }
  return string4.replace(
    // $& means the whole matched string
    new RegExp(target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
    substitute
  );
}
var segmenter = void 0;
function graphemes_iterator(string4) {
  if (globalThis.Intl && Intl.Segmenter) {
    segmenter ||= new Intl.Segmenter();
    return segmenter.segment(string4)[Symbol.iterator]();
  }
}
function pop_grapheme(string4) {
  let first3;
  const iterator = graphemes_iterator(string4);
  if (iterator) {
    first3 = iterator.next().value?.segment;
  } else {
    first3 = string4.match(/./su)?.[0];
  }
  if (first3) {
    return new Ok([first3, string4.slice(first3.length)]);
  } else {
    return new Error(Nil);
  }
}
function concat(xs) {
  let result = "";
  for (const x of xs) {
    result = result + x;
  }
  return result;
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
function round(float4) {
  return Math.round(float4);
}
function new_map() {
  return Dict.new();
}
function map_to_list(map5) {
  return List.fromArray(map5.entries());
}
function map_get(map5, key) {
  const value2 = map5.get(key, NOT_FOUND);
  if (value2 === NOT_FOUND) {
    return new Error(Nil);
  }
  return new Ok(value2);
}
function map_insert(key, value2, map5) {
  return map5.set(key, value2);
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
function decode_field(value2, name) {
  const not_a_map_error = () => decoder_error("Dict", value2);
  if (value2 instanceof Dict || value2 instanceof WeakMap || value2 instanceof Map) {
    const entry = map_get(value2, name);
    return new Ok(entry.isOk() ? new Some(entry[0]) : new None());
  } else if (value2 === null) {
    return not_a_map_error();
  } else if (Object.getPrototypeOf(value2) == Object.prototype) {
    return try_get_field(value2, name, () => new Ok(new None()));
  } else {
    return try_get_field(value2, name, not_a_map_error);
  }
}
function try_get_field(value2, field2, or_else) {
  try {
    return field2 in value2 ? new Ok(new Some(value2[field2])) : or_else();
  } catch {
    return or_else();
  }
}

// build/dev/javascript/gleam_stdlib/gleam/dict.mjs
function insert(dict2, key, value2) {
  return map_insert(key, value2, dict2);
}
function reverse_and_concat(loop$remaining, loop$accumulator) {
  while (true) {
    let remaining = loop$remaining;
    let accumulator = loop$accumulator;
    if (remaining.hasLength(0)) {
      return accumulator;
    } else {
      let first3 = remaining.head;
      let rest = remaining.tail;
      loop$remaining = rest;
      loop$accumulator = prepend(first3, accumulator);
    }
  }
}
function do_keys_loop(loop$list, loop$acc) {
  while (true) {
    let list2 = loop$list;
    let acc = loop$acc;
    if (list2.hasLength(0)) {
      return reverse_and_concat(acc, toList([]));
    } else {
      let key = list2.head[0];
      let rest = list2.tail;
      loop$list = rest;
      loop$acc = prepend(key, acc);
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
function reverse(list2) {
  return reverse_and_prepend(list2, toList([]));
}
function filter_loop(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list2 = loop$list;
    let fun = loop$fun;
    let acc = loop$acc;
    if (list2.hasLength(0)) {
      return reverse(acc);
    } else {
      let first$1 = list2.head;
      let rest$1 = list2.tail;
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
function filter(list2, predicate) {
  return filter_loop(list2, predicate, toList([]));
}
function map_loop(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list2 = loop$list;
    let fun = loop$fun;
    let acc = loop$acc;
    if (list2.hasLength(0)) {
      return reverse(acc);
    } else {
      let first$1 = list2.head;
      let rest$1 = list2.tail;
      loop$list = rest$1;
      loop$fun = fun;
      loop$acc = prepend(fun(first$1), acc);
    }
  }
}
function map(list2, fun) {
  return map_loop(list2, fun, toList([]));
}
function fold(loop$list, loop$initial, loop$fun) {
  while (true) {
    let list2 = loop$list;
    let initial = loop$initial;
    let fun = loop$fun;
    if (list2.hasLength(0)) {
      return initial;
    } else {
      let first$1 = list2.head;
      let rest$1 = list2.tail;
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
    let index3 = loop$index;
    if (over.hasLength(0)) {
      return acc;
    } else {
      let first$1 = over.head;
      let rest$1 = over.tail;
      loop$over = rest$1;
      loop$acc = with$(acc, first$1, index3);
      loop$with = with$;
      loop$index = index3 + 1;
    }
  }
}
function index_fold(list2, initial, fun) {
  return index_fold_loop(list2, initial, fun, 0);
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
var Element = class extends CustomType {
  constructor(key, namespace, tag, attrs, children2, self_closing, void$) {
    super();
    this.key = key;
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
var Event = class extends CustomType {
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
function do_element_list_handlers(elements2, handlers2, key) {
  return index_fold(
    elements2,
    handlers2,
    (handlers3, element2, index3) => {
      let key$1 = key + "-" + to_string(index3);
      return do_handlers(element2, handlers3, key$1);
    }
  );
}
function do_handlers(loop$element, loop$handlers, loop$key) {
  while (true) {
    let element2 = loop$element;
    let handlers2 = loop$handlers;
    let key = loop$key;
    if (element2 instanceof Text) {
      return handlers2;
    } else if (element2 instanceof Map2) {
      let subtree = element2.subtree;
      loop$element = subtree();
      loop$handlers = handlers2;
      loop$key = key;
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
            return insert(handlers3, key + "-" + name, handler);
          } else {
            return handlers3;
          }
        }
      );
      return do_element_list_handlers(children2, handlers$1, key);
    }
  }
}
function handlers(element2) {
  return do_handlers(element2, new_map(), "0");
}

// build/dev/javascript/lustre/lustre/attribute.mjs
function attribute(name, value2) {
  return new Attribute(name, identity(value2), false);
}
function on(name, handler) {
  return new Event("on" + name, handler);
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

// build/dev/javascript/lustre/lustre/element.mjs
function element(tag, attrs, children2) {
  if (tag === "area") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "base") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "br") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "col") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "embed") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "hr") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "img") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "input") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "link") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "meta") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "param") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "source") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "track") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "wbr") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else {
    return new Element("", "", tag, attrs, children2, false, false);
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
var Event2 = class extends CustomType {
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
    const value2 = attr[1];
    if (attr.as_property) {
      if (el[name] !== value2)
        el[name] = value2;
      if (canMorph)
        prevAttributes.delete(name);
    } else if (name.startsWith("on")) {
      const eventName = name.slice(2);
      const callback = dispatch(value2, eventName === "input");
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
      el.setAttribute(name, value2);
      if (canMorph) {
        prevHandlers.delete(eventName);
        prevAttributes.delete(name);
      }
    } else if (name.startsWith("delegate:data-") || name.startsWith("delegate:aria-")) {
      el.setAttribute(name, value2);
      delegated.push([name.slice(10), value2]);
    } else if (name === "class") {
      className = className === null ? value2 : className + " " + value2;
    } else if (name === "style") {
      style3 = style3 === null ? value2 : style3 + value2;
    } else if (name === "dangerous-unescaped-html") {
      innerHTML = value2;
    } else {
      if (el.getAttribute(name) !== value2)
        el.setAttribute(name, value2);
      if (name === "value" || name === "selected")
        el[name] = value2;
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
        for (const [name, value2] of delegated) {
          if (!child.hasAttribute(name)) {
            child.setAttribute(name, value2);
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
  const target = event2.currentTarget;
  if (!registeredHandlers.has(target)) {
    target.removeEventListener(event2.type, lustreGenericEventHandler);
    return;
  }
  const handlersForEventTarget = registeredHandlers.get(target);
  if (!handlersForEventTarget.has(event2.type)) {
    target.removeEventListener(event2.type, lustreGenericEventHandler);
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
      const key = child?.key || child?.getAttribute?.("data-lustre-key");
      if (key)
        keyedChildren.set(key, child);
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
  static start({ init: init3, update: update2, view: view2 }, selector, flags) {
    if (!is_browser())
      return new Error(new NotABrowser());
    const root = selector instanceof HTMLElement ? selector : document.querySelector(selector);
    if (!root)
      return new Error(new ElementNotFound(selector));
    const app = new _LustreClientApplication(root, init3(flags), update2, view2);
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
  constructor(root, [init3, effects], update2, view2) {
    this.root = root;
    this.#model = init3;
    this.#update = update2;
    this.#view = view2;
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
  static start({ init: init3, update: update2, view: view2, on_attribute_change }, flags) {
    const app = new _LustreServerApplication(
      init3(flags),
      update2,
      view2,
      on_attribute_change
    );
    return new Ok((action) => app.send(action));
  }
  constructor([model, effects], update2, view2, on_attribute_change) {
    this.#model = model;
    this.#update = update2;
    this.#view = view2;
    this.#html = view2(model);
    this.#onAttributeChange = on_attribute_change;
    this.#renderers = /* @__PURE__ */ new Map();
    this.#handlers = handlers(this.#html);
    this.#tick(effects.all.toArray());
  }
  send(action) {
    if (action instanceof Attrs) {
      for (const attr of action[0]) {
        const decoder2 = this.#onAttributeChange.get(attr[0]);
        if (!decoder2)
          continue;
        const msg = decoder2(attr[1]);
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
    } else if (action instanceof Event2) {
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
  constructor(init3, update2, view2, on_attribute_change) {
    super();
    this.init = init3;
    this.update = update2;
    this.view = view2;
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
function application(init3, update2, view2) {
  return new App(init3, update2, view2, new None());
}
function simple(init3, update2, view2) {
  let init$1 = (flags) => {
    return [init3(flags), none()];
  };
  let update$1 = (model, msg) => {
    return [update2(model, msg), none()];
  };
  return application(init$1, update$1, view2);
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
      return map2(_pipe, msg);
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
  constructor(base, primary, secondary, success, warning, danger) {
    super();
    this.base = base;
    this.primary = primary;
    this.secondary = secondary;
    this.success = success;
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
  constructor(heading, body, code2) {
    super();
    this.heading = heading;
    this.body = body;
    this.code = code2;
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
    let value2 = selector[1];
    return "[data-" + name + "=" + value2 + "]";
  }
}
function to_css_rgb(colour) {
  let $ = to_rgba(colour);
  let r = $[0];
  let g = $[1];
  let b = $[2];
  let r$1 = (() => {
    let _pipe = round2(r * 255);
    return to_string(_pipe);
  })();
  let g$1 = (() => {
    let _pipe = round2(g * 255);
    return to_string(_pipe);
  })();
  let b$1 = (() => {
    let _pipe = round2(b * 255);
    return to_string(_pipe);
  })();
  return r$1 + " " + g$1 + " " + b$1;
}
function var$(name) {
  return "--lustre-ui-" + name;
}
function to_css_variable(name, value2) {
  return var$(name) + ":" + value2 + ";";
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
function inject(theme, view2) {
  return fragment(toList([to_style(theme), view2()]));
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
function padding(x, y) {
  return style(toList([["--padding-x", x], ["--padding-y", y]]));
}
function radius2(value2) {
  return style(toList([["--radius", value2]]));
}
function round3() {
  return radius2(radius.md);
}

// build/dev/javascript/lustre_ui/lustre/ui/input.mjs
function input2(attributes) {
  return input(
    prepend(class$("lustre-ui-input"), attributes)
  );
}

// build/dev/javascript/app/app.mjs
var Task = class extends CustomType {
  constructor(name) {
    super();
    this.name = name;
  }
};
var Model2 = class extends CustomType {
  constructor(tasks, task_menu_open, task_input) {
    super();
    this.tasks = tasks;
    this.task_menu_open = task_menu_open;
    this.task_input = task_input;
  }
};
var UserOpenedTaskMenu = class extends CustomType {
};
var UserClosedTaskMenu = class extends CustomType {
};
var UserUpdatedInput = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var UserAddedTask = class extends CustomType {
};
var UserDeletedTask = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
function init2(_) {
  return new Model2(toList([]), false, "");
}
function update(model, msg) {
  if (msg instanceof UserOpenedTaskMenu) {
    let _record = model;
    return new Model2(_record.tasks, true, _record.task_input);
  } else if (msg instanceof UserClosedTaskMenu) {
    let _record = model;
    return new Model2(_record.tasks, false, _record.task_input);
  } else if (msg instanceof UserUpdatedInput) {
    let input$1 = msg[0];
    let _record = model;
    return new Model2(_record.tasks, _record.task_menu_open, input$1);
  } else if (msg instanceof UserAddedTask) {
    return new Model2(
      prepend(new Task(model.task_input), model.tasks),
      false,
      ""
    );
  } else {
    let task = msg[0];
    let _record = model;
    return new Model2(
      filter(model.tasks, (t) => {
        return !isEqual(t, task);
      }),
      _record.task_menu_open,
      _record.task_input
    );
  }
}
function view(model) {
  return div(
    toList([]),
    prepend(
      h1(toList([]), toList([text2("Periodic")])),
      prepend(
        div(
          toList([]),
          map(
            model.tasks,
            (task) => {
              return card(
                toList([
                  round3(),
                  padding(spacing.md, spacing.md)
                ]),
                toList([
                  content(
                    toList([]),
                    toList([
                      text2(task.name),
                      button2(
                        toList([
                          on_click(new UserDeletedTask(task)),
                          icon()
                        ]),
                        toList([text2("x")])
                      )
                    ])
                  )
                ])
              );
            }
          )
        ),
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
                        return new UserUpdatedInput(var0);
                      }
                    )
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
      )
    )
  );
}
function main2() {
  let app = simple(
    init2,
    update,
    (model) => {
      return inject(default$(), () => {
        return view(model);
      });
    }
  );
  let $ = start2(app, "#app", void 0);
  if (!$.isOk()) {
    throw makeError(
      "let_assert",
      "app",
      33,
      "main",
      "Pattern match failed, no pattern matched the value.",
      { value: $ }
    );
  }
  return void 0;
}

// build/.lustre/entry.mjs
main2();
