/* eslint-disable camelcase */
// Code - third_party/static/guppy-b5055b/src/guppy.js

interface GuppyConfig {
  events?: Object;
  settings?: Object;
}

class GuppyEngine {
  add_symbol: (name: string, symbol: Object, template?: string) => void;
  backspace: () => void;
  delete_key: () => void;
  done: () => void;
  down: () => void;
  end: () => void;
  get_content: (t: string) => void;
  home: () => void;
  insert_doc: (doc: GuppyDoc) => void;
  insert_string: (s: string) => void;
  insert_symbol: (sym_name: string) => void;
  left: () => void;
  list_extend: (direction: string, copy: boolean) => void;
  list_remove: () => void;
  list_remove_col: () => void;
  list_remove_row: () => void;
  list_vertical_move: (down: boolean) => void;
  redo: () => void;
  remove_symbol: (name: string) => void;
  right: () => void;
  sel_all: () => void;
  sel_clear: () => void;
  sel_copy: () => void;
  sel_cut: () => void;
  sel_delete: () => void;
  sel_left: () => void;
  sel_paste: () => void;
  sel_right: (name: string) => void;
  set_content: (xml_data: string) => void;
  set_doc: (doc: GuppyDoc) => void;
  spacebar: () => void;
  tab: () => void;
  undo: () => void;
  up: () => void;
}

interface GuppyDoc {
  get_content: (t: string) => string;
  get_symbols: (groups?: string[]) => string[];
  evaluate: (evaluators: Object) => Object;
  render: (doc: string, target_id: string) => void;
  root: () => Element;
  set_content: (xml_data: string) => void;
}

interface GuppySymbol {
  output: Object;
  keys: Array<Object>;
  attrs: {
    type: string;
    group: string;
  }
  input?: Object;
  ast?: {
    type?: Object;
  }
  args?: {
    down?: string;
    up?: string;
    small?: string;
    name?: string;
    bracket?: string;
    delete?: string;
    mode?: string;
    is_bracket?: string;
  }[];
}

class GuppyOsk {
  attach: (guppy?: Guppy) => void;
  detach: () => void;

  constructor(config?: {
    goto_tab?: string;
    attach?: string;
  });
}

class Guppy {
  engine: GuppyEngine;

  add_global_symbol: (
    name: string, symbol: GuppySymbol, template?: string) => void;
  configure: (name: string, val: Object) => void;
  event: (name: string, handler: Function) => void;
  remove_global_symbol: (name: string) => void;
  render_all: (type: string, delim?: string, root_node?: string) => void;
  use_osk: (osk?: GuppyOsk) => void;
  activate: () => void;
  asciimath: () => void;
  deactivate: () => void;
  equations: () => Array<Object>;
  evaluate: (evaluators?: Object) => Object;
  func: (evaluators?: Object) => Function;
  import_latex: (text: string) => void;
  import_syntax_tree: (tree: Object) => void;
  import_text: (text: string) => void;
  import_xml: (text: string) => void;
  latex: () => string;
  render: (updated?: boolean) => void;
  symbols_used: (groups?: Array<String>) => string[];
  syntax_tree: () => Object;
  text: () => string;
  vars: () => string[];
  xml: () => string;
  doc: (doc?: string) => GuppyDoc;

  constructor(id: string, config: GuppyConfig);
}
