// Code - https://pencilcode.net/lib/pencilcodeembed.js
// Type definitions are only added for PencilCodeEmbed class since it is the
// only class exported by the library.

interface SetupCode {
  code: string;
  type: string;
}

declare class PencilCodeEmbed {
  div: Object;
  updatedCode: string;
  callbacks: Object;
  requests: Object;

  // Hook up noop event handlers.
  on: (tag: string, callback: Function) => void;

  // Send messages to the remote iframe.
  invokeRemote: (
    method: string, args: Object[], callback: Function) => PencilCodeEmbed;

  beginLoad: (code: string) => PencilCodeEmbed;

  // Used to define supplementary scripts to run in the preview pane:
  // script is an array of objects that may have "src" or
  // "code" attributes (and "type" attributes) to define script tags
  // to insert into the preview pane.  For example, the following sets
  // up the embedded PencilCode so that the coffeescript code to write
  // "welcome" is run before user code in the preview pane.
  // pce.setupScript([{code: 'write "welcome"', type: 'text/coffeescript'}])
  setupScript: (setup: SetupCode[]) => PencilCodeEmbed;

  // Sets code into the editor.
  setCode: (code: string) => PencilCodeEmbed;

  // Gets code from the editor.
  getCode: () => string;

  // Starts running.
  beginRun: () => PencilCodeEmbed;

  // Interrupts a run in progress.
  stopRun: () => PencilCodeEmbed;

  // Brings up save UI.
  save: () => PencilCodeEmbed;

  // Makes editor editable.
  setEditable: () => PencilCodeEmbed;

  // Makes editor read only.
  setReadOnly: () => PencilCodeEmbed;

  // Hides editor.
  hideEditor: () => PencilCodeEmbed;

  // Shows editor.
  showEditor: () => PencilCodeEmbed;

  // Hides middle button.
  hideMiddleButton: () => PencilCodeEmbed;

  // Shows middle button.
  showMiddleButton: () => PencilCodeEmbed;

  // Hides toggle button.
  hideToggleButton: () => PencilCodeEmbed;

  // Shows toggle button.
  showToggleButton: () => PencilCodeEmbed;

  // Show butter bar notification.
  showNotification: (message: string) => PencilCodeEmbed;

  // Hides butter bar notification.
  hideNotification: () => PencilCodeEmbed;

  // Shows block mode.
  setBlockMode: (showBlocks: Object) => PencilCodeEmbed;

  // Shows block mode.
  setBlockOptions: (palette: Object, options: Object) => PencilCodeEmbed;

  eval: (code: string, callback: Function, raw: Object) => PencilCodeEmbed;

  constructor(div: Object);
}
