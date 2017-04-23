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

  * `debug`: A boolean saying whether guppy should log debug data to
    the console.  Defaults to `false`.

  This function should be called for each div that you want to turn
  into a Guppy instance.

* `Guppy.guppy_init(xsl_path, symbols_path)`: `xsl_path` is the path
  to `src/transform.xsl`, `symbols_path` is the path to
  `src/symbols.json`.  This function should only be called once per
  page.  If `xsl_path` is `null`, then Guppy will default to a
  non-XSLT rendering method.

* `Guppy.get_symbols(symbols_path, callback)`: `symbols_path` is the
  path to a JSON file of further symbols that should be accepted by
  Guppy.  This function should only be called once Guppy is
  initialised (e.g. inside the `ready_callback` function passed to the
  Guppy constructor).  Any symbols defined by this file with the same
  name as symbols already defined will override those older
  definitions.  Once the file is loaded, `callback` will be called if
  it was passed.

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
