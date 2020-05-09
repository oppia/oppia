/* eslint-disable camelcase */
// Code - third_party/static/guppy-b5055b/src/guppy.js

interface GuppyConfig {
  events?: Object;
  settings?: Object;
}

class Guppy {
  activate: () => void;
  asciimath: () => void;
  deactivate: () => void;
  doc: (doc?: string) => Object;
  equations: () => Array<Object>;
  evaluate: (evaluators?: Object) => Object;
  func: (evaluators?: Object) => Function;
  import_latex: (text: string) => void;
  import_syntax_tree: (tree: Object) => void;
  import_text: (text: string) => void;
  import_xml: (text: string) => void;
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
