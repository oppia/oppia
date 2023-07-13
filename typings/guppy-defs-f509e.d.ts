// Code - third_party/static/guppy-f509e1/src/guppy.js
// This guppy version corresponds to the commit on Aug 19 2020.
// For reference, visit:
// https://github.com/oppia/guppy/tree/f509e155dc66f6310737c328cbfbc35b85194be2

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
  };
  settings?: {
    xml_content?: string;
    autoreplace?: string;
    blank_caret?: string;
    empty_content?: string;
    blacklist?: string[];
    buttons?: string[];
    cliptype?: string;
  };
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

declare class Guppy {
  activate: () => void;
  asciimath: () => string;
  configure: (arg0: string, arg1: string) => void;
  deactivate: () => void;
  doc: () => Object;
  equations: () => Object[];
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
  symbols_used: (groups?: string[]) => string[];
  syntax_tree: () => Object;
  text: () => string;
  vars: () => string[];
  xml: () => string;
  engine: {
    insert_string: (arg0: string) => void;
    insert_symbol: (arg0: string) => void;
    backspace: () => void;
    left: () => void;
    right: () => void;
    end: () => void;
  };
  constructor(id: string, config: GuppyConfig);
}

declare class GuppyOSK {
  attach: (guppy?: Guppy) => void;
  detach: () => void;

  constructor(config: Object);
}

declare namespace Guppy {
  export function init(config: GuppyInitConfig): void;
  export let instances: Object;
  export let active_guppy: Object;
  export let Symbols: GuppySymbols;
  export let Doc: Function;
  export function add_global_symbol(
    name: string, symbol: Object, template?: string): void;
  export function get_loc(
    x: number, y: number, current_node?: Object, current_caret?: Object): {
      current: Object;
      caret: number;
      pos: string;
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
