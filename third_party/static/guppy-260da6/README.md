## Synopsis

Guppy is a Javascript-based WYSIWYG editor for mathematics whose
content is stored in an XML format that makes Guppy mathematical
expressions **searchable**, **parseable**, and **renderable**.

The content of the editor can easily be extracted in a very flexible
XML format (for searching or otherwise manipulating), LaTeX (for
rendering), or a plaintext format (for parsing).

## Demo

A live demo can be found at 
[http://daniel3735928559.github.io/guppy/](http://daniel3735928559.github.io/guppy/)

## Code example

A stripped-down version of the demo page would look like:

```
<html>
  <head>
    <link rel="stylesheet" href="build/guppy.min.css">
    <script type="text/javascript" src="build/guppy.min.js"></script>
  </head>
  <body>
    <div id="guppy_div" style="width:400px;height:100px;"></div>
    
    <script>
        Guppy.get_symbols(["builtins","sym/symbols.json"]);
        new Guppy("guppy_div");
    </script>
    <button onclick="alert(Guppy.instances.guppy_div.get_content('xml'))">See XML</button>
    <button onclick="alert(Guppy.instances.guppy_div.get_content('latex'))">See LaTeX</button>
    <button onclick="alert(Guppy.instances.guppy_div.get_content('text'))">See ASCII</button>
  </body>
</html>
```

## Installation and deployment

* Download the `build` and `sym` folders.

* Include the `build/guppy.min.js` and `build/guppy.min.css` files in
  your page.

* Pass a list of paths to various symbol definition files (several of
  which are in `sym/`) as well as the string `"builtins"` (if you want
  the built-in symbols, such as Greek letters) to `Guppy.get_symbols`
  as in the example above.  This only needs to happen once per page.
  Symbol names from files that appear later in the list will override
  symbol names from files earlier in the list.

* For each div that you want turned into a Guppy instance, call `new
  Guppy()` passing in as the first argument either the Element object
  for that div or its ID.

## Editor usage

The editor has many of the usual keyboard text-editing features:
Navigation with the arrow keys, backspace, home, end, selection with
shift-left/right, mod-z/x/c/v for undo, cut, copy, paste
(respectively).  Using the mouse to navigate and select is also
supported.

If you type the name of a mathematical object such as `sqrt`, the
editor will automatically replace that entered text with the
corresponding object.  The list of symbols supported by default is
documented in index.html (or just see the demo page).  Further symbols
can be added by modifying `symbols.json`.

## Further documentation

* [The Javascript API for controlling the editor](doc/api.md)
* [The JSON specification used to describe available symbols](doc/symbols.md)
* [The XML format used to represent expressions](doc/format.md)
* [Editor internals](doc/internals.md)

## Tests

The tests can be run by opening /test/test.html in a browser, for
example, by going to
[http://daniel3735928559.github.io/guppy/test/test.html](http://daniel3735928559.github.io/guppy/test/test.html)

## License

Guppy is licensed under the [MIT License](http://opensource.org/licenses/MIT).
