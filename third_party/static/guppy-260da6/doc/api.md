## API reference

The primary useful items in the Guppy object are:

* `new Guppy(guppy_div, properties)`: `guppy_div` is either the div
  ID or the actual div object that you want turned into a Guppy editor
  (e.g. `document.getElementById('my_div1')`).  `properties` is a
  dictionary that can be null or empty, but may contain the following
  keys:

  * `xml_content`: An XML string with which to initialise the editor's
  state.  Defaults to `<m><e/></m>` (the blank expression).
  
  * `blacklist`: A list of string symbol names, corresponding to
    symbols from `symbols.json` that should not be allowed in this
    instance of the editor.  Defaults to `[]` (nothing blacklisted).

  * `ready_callback`: A function to be called when the instance is
    ready to render things.  

  * `right_callback`: A function to be called when the cursor is at
    the right-most point and a command is received to move the cursor
    to the right (e.g., via the right arrow key).

  * `left_callback`: A function to be called when the cursor is at
    the left-most point and a command is received to move the cursor
    to the right (e.g., via the left arrow key).

  * `done_callback`: A function to be called when Ctrl-Enter is
    pressed in the instance.

  * `debug`: Specifies what debug messages you want logged.  Can be
    any of `Guppy.logging.NONE`, `Guppy.logging.ERROR`,
    `Guppy.logging.WARN`, `Guppy.logging.INFO`, `Guppy.logging.DEBUG`.
    A later value implies all earlier values.  Defaults to
    `Guppy.logging.NONE`.
    
  * `blank_caret`: A LaTeX string that specifies what the caret should
    look like when in a blank spot.  If left unspecified, defaults to
    the normal vertical bar caret.
    
  * `empty_content`: A LaTeX string that will be displayed when the
    editor is both inactive and blank.  Defaults to
    `\color{red}{[?]}`.
    
  This function should be called for each div that you want to turn
  into a Guppy instance.

* `Guppy.get_symbols(symbol_files, callback)`: `symbol_files` is a
  list of paths to JSON files of further symbols that should be
  accepted by Guppy.  The special string `"builtins"` may also be
  included in the list to get Guppy's built-in symbol definitions
  (Greek letters, etc.).

  This function should only be called once per page.

  If the same symbol is defined in multiple files in the list, the
  definition that is used is from whichever file appears later in the
  `symbol_files` list. Once all files are loaded, `callback` will be
  called if it was passed.

* `Guppy.prototype.get_content(type)`: `type` can be `"xml"`, `"latex"`,
  or `"text"`, and the function will return (respectively) the XML,
  LaTeX, or ASCII representation of the instance's content.
  
* `Guppy.prototype.set_content(xml_data)`: `xml_data` is a string
  containing XML that describes a valid Guppy editor state (e.g. one
  returned by `get_content("xml")`).  This resets the state of the
  editor.
  
* `Guppy.prototype.activate()`: Gives the editor focus.

* `Guppy.prototype.deactivate()`: Unfocuses the editor.

* `Guppy.instances`: This is a dictionary that contains all Guppy
  objects on the page , indexed by div ID.  So you can access the
  Guppy object with `Guppy.instances.guppy_div_id`.  If the div did
  not have an ID, the div will be given one by new Guppy() that is
  unique on the page, and will be accessible from that object by, for
  example, `new Guppy(...).editor.id`.  

There are other instance-level functions that may be of use in some
circumstances (e.g. for creating a browser-button-based interface):

* `left()` and `right()` will move the cursor left and right
  (respectively).
  
* `sel_left()` and `sel_right()` will move the cursor left and right
  (respectively) while selecting (the equivalent of using the left and
  right arrows while also holding down shift).
  
* `sel_cut()`, `sel_copy()` and `sel_paste()` cut, copy, and paste
  (respectively) the current selection, if any.

* `backspace()` will do the same thing as hitting the backspace button.

* `undo()` and `redo()` will undo and redo the previous operation
  (respectively).

* `insert_string(s)` will insert the string `s` it at the current
  cursor position.
  
* `insert_symbol(sym_name)` will take the string name of a symbol from
  `symbols.json` and insert it at the current cursor position.
