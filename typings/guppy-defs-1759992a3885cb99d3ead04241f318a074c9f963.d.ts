/* eslint-disable camelcase */
// Code - third_party/static/guppy-175999/src/guppy.js
// This guppy version corresponds to the commit on June 15 2020. 
// For reference, visit:
// https://github.com/daniel3735928559/guppy/tree/1759992a3885cb99d3ead04241f318a074c9f963

interface GuppyConfig {
  events?: Object;
  settings?: Object;
}

interface GuppyInitConfig {
  symbols?: string[];
  path?: string;
  osk?: Object;
  events?: {
    ready?: Function;
    change?: Function;
    left_end?: Function;
    done?: Function;
    completion?: Function;
    debug?: Function;
    error?: Function;
    focus?: Function;
  }
  settings?: {
    xml_content?: string;
    autoreplace?: string;
    blank_caret?: string;
    empty_content?: string;
    blacklist?: string[];
    buttons?: string[];
    cliptype?: string;
  }
  callback?: Function;
}

interface GuppySymbols {
  symbols?: Object;
  templates?: Object;
  validate: Function;
  symbol_to_node: Function;
  split_output: Function;
  make_template_symbol: Function;
  lookup_type: Function;
  eval_template: Function;
  add_symbols: Function;
  add_blanks: Function;
}

class Guppy {
  activate: () => void;
  asciimath: () => void;
  configure: () => void;
  deactivate: () => void;
  doc: () => Object;
  equations: () => Array<Object>;
  evaluate: (evaluators?: Object) => Object;
  event: (name: string, handler: Function) => void;
  func: (evaluators?: Object) => Function;
  import_latex: (text: string) => void;
  import_syntax_tree: (tree: Object) => void;
  import_text: (text: string) => void;
  import_xml: (xml: string) => void;
  is_changed: () => boolean;
  latex: () => string;
  recompute_locations_paths: () => void;
  render: (updated?: boolean) => void;
  render_node: (t: string) => string;
  select_to: (x: number, y: number, mouse: Object) => void;
  symbols_used: (groups?: Array<String>) => string[];
  syntax_tree: () => Object;
  text: () => string;
  vars: () => string[];
  xml: () => string;

  constructor(id: string, config: GuppyConfig);
}

class GuppyOSK {
  attach: (guppy?: Guppy) => void;
  detach: () => void;

  constructor(config: Object);
}

namespace Guppy {
  export function init(config: GuppyInitConfig): void;
  export let instances: Object;
  export let active_guppy: Object;
  export let Symbols: GuppySymbols;
  export let Doc: Function;
  export function add_global_symbol(
    name: string, symbol: Object, template?: string): void;
  export function get_loc(
    x: number, y: number, current_node?: Object, current_caret?: Object): {
      current: Object,
      caret: number,
      pos: string
    };
  export let kb: Object;
  export function make_button(url: string, cb: Function): HTMLImageElement;
  export function mouse_down(e: Object): void;
  export function mouse_move(e: Object): void;
  export function mouse_up(): void;
  export let ready: boolean;
  export function register_keyboard_handlers(): void;
  export function remove_global_symbol(name: string): void;
  export function use_osk(osk: GuppyOSK): void;
  export function event(name: string, handler: Function): void;
  export function configure(name: string, val: Object): void;
}
