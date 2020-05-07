/* eslint-disable camelcase */
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
    classes: Object[],
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

interface SkulptParseTables{
  dfas: Object;
  keywords: SkulptKeywords;
  labels: Array<Object>;
  number2symbol: SkulptNumber2Symbol;
  start: number;
  states: Object;
  sym: SkulptSymbols;
  tokens: SkulptTokens;
}

interface SYMTAB_CONSTS {
  [constant: string]: number;
}

interface Skulpt {
  OpMap: SkulptOpMap;
  ParseTables: SkulptParseTables;
  SYMTAB_CONSTS: SYMTAB_CONSTS;
  Parser: Object;
  abstr: Object;
  asserts: SkulptAsserts;
  python2: SkulptPython;
  python3: SkulptPython;
  global: Object;
  builtIn: Object;
  dunderToSkulpt: Object;
  execLimit: number;
  inBrowser: boolean;
  yieldLimit: number;

  configure: (options: Object) => void;
  exportSymbol: (name: string, object: Object) => Object;
  isArrayLike: (object: Object) => boolean;
  js_beautify: (x: Object) => Object;
  bool_check: (object: Object, name: string) => void;
  uncaughtException: (err: Error) => never;
  timeoutMsg: () => string;
  output: (x: Object) => void;
  read: (x: Object) => void;
  getSysArgv: () => Array<Object>;
  debugout: (args: Object) => void;
  inputfun: (args: Object) => string;
  setup_method_mappings: () => SkulptMappings;
  switch_version: (method_to_map: string, python3: SkulptPython) => void;
}

declare var Sk: Skulpt;
