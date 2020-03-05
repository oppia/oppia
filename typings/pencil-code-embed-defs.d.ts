// Code - https://pencilcode.net/lib/pencilcodeembed.js
// As only one class is exported in the library, so type definitions
// for that class are defined only.

interface SetupCode {
  code: String,
  type: String
}

class PencilCodeEmbed {
  div: Object;
  updatedCode: String;
  callbacks: Object;
  requests: Object;

  // hook up noop event handlers
  on: (tag: String, callback: Function) => void;

  // send messages to the remote iframe
  invokeRemote: (
    method: String, args: Array<Object>, callback: Function) => PencilCodeEmbed;

  beginLoad: (code: String) => PencilCodeEmbed;

  // Used to define supplementary scripts to run in the preview pane:
  // script is an array of objects that may have "src" or
  // "code" attributes (and "type" attributes) to define script tags
  // to insert into the preview pane.  For example, the following sets
  // up the embedded PencilCode so that the coffeescript code to write
  // "welcome" is run before user code in the preview pane.
  // pce.setupScript([{code: 'write "welcome"', type: 'text/coffeescript'}])
  setupScript: (setup: SetupCode[]) => PencilCodeEmbed;

  // sets code into the editor
  setCode: (code: String) => PencilCodeEmbed;

  // gets code from the editor
  getCode: () => String;

  // starts running
  beginRun: () => PencilCodeEmbed;

  // interrupts a run in progress
  stopRun: () => PencilCodeEmbed;

  // brings up save UI
  save: () => PencilCodeEmbed;

  // makes editor editable
  setEditable: () => PencilCodeEmbed;

  // makes editor read only
  setReadOnly: () => PencilCodeEmbed;

  // hides editor
  hideEditor: () => PencilCodeEmbed;

  // shows editor
  showEditor: () => PencilCodeEmbed;

  // hides middle button
  hideMiddleButton: () => PencilCodeEmbed;

  // shows middle button
  showMiddleButton: () => PencilCodeEmbed;

  // hides toggle button
  hideToggleButton: () => PencilCodeEmbed;

  // shows toggle button
  showToggleButton: () => PencilCodeEmbed;

  // show butter bar notification
  showNotification: (message: String) => PencilCodeEmbed;

  // hides butter bar notification
  hideNotification: () => PencilCodeEmbed;

  // shows block mode
  setBlockMode: (showBlocks: Object) => PencilCodeEmbed;

  // shows block mode
  setBlockOptions: (palette: Object, options: Object) => PencilCodeEmbed;

  eval: (code: String, callback: Function, raw: Object) => PencilCodeEmbed;

  constructor(div: Object);
}
