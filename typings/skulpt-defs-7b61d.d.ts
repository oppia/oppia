// Code - third_party/static/skulpt-dist-1.1.0/skulpt.js

interface SkulptOpMap {
  [op: string]: number;
}

interface SkulptAsserts {
  ENABLE_ASSERTS?: boolean;

  assert: (condition: Object, message?: string) => Object;
  fail: (message: string) => void;
}

interface SkulptPython {
  print_function: boolean;
  division: boolean;
  absolute_import: null;
  unicode_literals: boolean;
  set_repr: boolean;
  class_repr: boolean;
  inherit_from_object: boolean;
  super_args: boolean;
  octal_number_literal: boolean;
  bankers_rounding: boolean;
  python_version: boolean;
  dunder_next: boolean;
  dunder_round: boolean;
  exceptions: boolean;
  no_long_type: boolean;
  ceil_floor_int: boolean;
}

interface SkulptMappings {
  round$: {
    classes: Object[];
    2: null;
    3: string;
  };
  next$: {
    classes: Object[];
    2: string;
    3: string;
  };
}

interface SkulptKeywords {
  [keyword: string]: number;
}

interface SkulptNumber2Symbol {
  [number: number]: string;
}

interface SkulptSymbols {
  [sym: string]: number;
}

interface SkulptTokens {
  [x: number]: string;
}

interface SkulptParseTables {
  dfas: Object;
  keywords: SkulptKeywords;
  labels: Object[];
  number2symbol: SkulptNumber2Symbol;
  start: number;
  states: Object;
  sym: SkulptSymbols;
  tokens: SkulptTokens;
}

interface SYMTAB_CONSTS {
  [constant: string]: number;
}

interface SkulptAstNodes {
  [key: string]: Function;
}

interface SkulptBuiltin {
  [key: string]: Function;
}

interface SkulptFiles {
  [file: string]: string;
}

interface SkulptBuiltinFiles {
  files: SkulptFiles;
}

interface SkulptCompiled {
  funcname: string;
  code: string;
}

interface SkulptDunderToSkulpt {
  __eq__: 'ob$eq';
  __ne__: 'ob$ne';
  __lt__: 'ob$lt';
  __le__: 'ob$le';
  __gt__: 'ob$gt';
  __ge__: 'ob$ge';
  __hash__: 'tp$hash';
  __abs__: 'nb$abs';
  __neg__: 'nb$negative';
  __pos__: 'nb$positive';
  __int__: 'nb$int_';
  __long__: 'nb$lng';
  __float__: 'nb$float_';
  __add__: 'nb$add';
  __radd__: 'nb$reflected_add';
  __sub__: 'nb$subtract';
  __rsub__: 'nb$reflected_subtract';
  __mul__: 'nb$multiply';
  __rmul__: 'nb$reflected_multiply';
  __div__: 'nb$divide';
  __rdiv__: 'nb$reflected_divide';
  __floordiv__: 'nb$floor_divide';
  __rfloordiv__: 'nb$reflected_floor_divide';
  __mod__: 'nb$remainder';
  __rmod__: 'nb$reflected_remainder';
  __divmod__: 'nb$divmod';
  __rdivmod__: 'nb$reflected_divmod';
  __pow__: 'nb$power';
  __rpow__: 'nb$reflected_power';
  __contains__: 'sq$contains';
  __len__: ['sq$length', 1];
  __get__: ['tp$descr_get', 3];
  __set__: ['tp$descr_set', 3];
}

interface SkulptFFI {
  basicwrap: Function;
  callback: Function;
  remapToJs: Function;
  remapToPy: Function;
  stdwrap: Function;
  unwrapn: Function;
  unwrapo: Function;
}

interface SkulptInternalPy {
  files: {
    'src/classmethod.py': string;
    'src/property.py': string;
    'src/staticmethod.py': string;
  };
}

interface SkulptMisceval {
  [func: string]: Function;
}

interface Skulpt {
  abstr: Object;
  asserts: SkulptAsserts;
  astnodes: SkulptAstNodes;
  builtin: SkulptBuiltin;
  builtins: Object;
  builtinFiles: SkulptBuiltinFiles;
  dunderToSkulpt: SkulptDunderToSkulpt;
  execLimit: number;
  ffi: SkulptFFI;
  gensymcount: number;
  global: Object;
  inBrowser: boolean;
  internalPy: SkulptInternalPy;
  misceval: SkulptMisceval;
  OpMap: SkulptOpMap;
  ParseTables: SkulptParseTables;
  python2: SkulptPython;
  python3: SkulptPython;
  SYMTAB_CONSTS: SYMTAB_CONSTS;
  sysargv: Object[];
  syspath: Object[];
  sysmodules: Object;
  yieldLimit: number;

  astDump: (node: Object) => string;
  astFromParse: (n: Object, filename: string, cFlags: number) => Object;
  bool_check: (object: Object, name: string) => void;
  compile: (
    source: string,
    filename: string,
    mode: string,
    canSuspend: boolean
  ) => SkulptCompiled;
  configure: (options: Object) => void;
  debugout: (args: Object) => void;
  doOneTimeInitialization: (canSuspend: boolean) => undefined;
  dumpSymtab: (st: Object) => string;
  exportSymbol: (name: string, object: Object) => Object;
  fixReservedNames: (name: string) => string;
  fixReservedWords: (name: string) => string;
  getSysArgv: () => Object[];
  importBuiltinWithBody: (
    name: string,
    dumpJS: boolean,
    body: string,
    canSuspend: boolean
  ) => Object;
  importMain: (name: string, dumpJS: boolean, canSuspend: boolean) => Object;
  importMainWithBody: (
    name: string,
    dumpJS: boolean,
    body: string,
    canSuspend: boolean
  ) => Object;
  importModule: (name: string, dumpJS: boolean, canSuspend: boolean) => Object;
  importModuleInternal_: (
    name: string,
    dumpJS: boolean,
    modname: string,
    suppliedPyBody: string,
    relativeToPackage: Object,
    returnUndefinedOnTopLevelNotFound: boolean,
    canSuspend: boolean
  ) => Object;
  importSearchPathForName: (
    name: string,
    ext: string,
    searchPath: Object
  ) => Object;
  importSetUpPath: (canSuspend: boolean) => void;
  importStar: (module: Object, loc: Object, global: Object) => void;
  inputfun: (args: Object) => string;
  isArrayLike: (object: Object) => boolean;
  js_beautify: (x: Object) => Object;
  longFromStr: (s: string, b: number) => Object;
  mangleName: (priv: Object, ident: Object) => string;
  output: (x: Object) => void;
  parse: (filename: string, input: string) => Object;
  Parser: Function;
  parseTreeDump: (n: Object, indent: string) => string;
  resetCompiler: () => void;
  read: (x: Object) => void;
  setup_method_mappings: () => SkulptMappings;
  str2number: (
    s: string,
    base: number,
    parser: Function,
    negater: Function,
    fname: string
  ) => number;
  switch_version: (methodToMap: string, python3: SkulptPython) => void;
  symboltable: (ast: Object, filename: string) => Object;
  timeoutMsg: () => string;
  Tokenizer: Function;
  uncaughtException: (err: Error) => never;
  unfixReserved: (name: string) => string;
}

declare var Sk: Skulpt;
