## Internals

The majority of the code in Guppy is implementing the logic involved
with modifying the XML tree (described above) via an editor which
displays a kind of flattened version of this tree to the user.
Specifically, the functions that contribute many of the lines are
`left`, `right`, `sel_left`, `sel_right`, `sel_cut`, `sel_copy`,
`sel_paste`, `backspace`, and `insert_symbol` functions.

These fall into two major categories: Moving the cursor around within
the tree, and adding/removing/changing fragments of the tree.  We'll
discuss a few examples of each:

### Cursor functions

In Guppy, the cursor is only allowed to be inside `<e>` nodes.  Since
these only contain text, we can describe the cursor position by a
reference to an `<e>` node within the tree, (`this.current` in the
code), and a numerical offset indicating where the cursor sits within
the text (`this.caret` in the code).

We outline here the basic flow of two of the cursor-related functions:

* `left`: First, since this is not a selection operation, this should
  clear the current selection no matter what.  Then, if the
  `this.caret` is bigger than 0, then we're not at the left of the
  current `<e>` node and so can just decrement `this.caret` and be
  done.  If, on the other hand, `this.caret` is 0, then we need to
  jump to the previous `<e>` node, whatever that is.  So we set
  `this.current` to be that `<e>` node, and `this.caret` to be the
  length of that node's text (as we should start out at the very
  right-most position in that node).

  All the work, then, is in finding this "previous `<e>` node", which
  basically amounts to looking for the one right before us in document
  order.  Ideally, we could use the XPath `preceding` axis, but this
  did not seem to work.  However, there are only a few possible
  situations for the current `<e>` node:

  * `<m><e>current</e>...</m>`: If it is the first child of its parent
    and its parent is an `<m>` node, then we're at the beginning and
    should call `this.left_callback`.

  * `<e>target</e><f><b/><b/><c><e>current</e></c><c/>...</f>`:
    If it is the first child of its parent and its parent is a `<c>`
    node which is also the first child of its parent `<f> node, then
    we need to move to the `<c>` node immediately before that `<f>`
    node.
    
  * `<f><b/><b/><c>...<e>target</e></c><c><e>current</e></c><c/>...</f>`:
    If it is the first child of its parent and its parent is a `<c>`
    node which is not the first child of its parent `<f> node, then
    we need to move to the last `<e>` node in the previous `<c>` node.
    
  * `<f><b/><b/>...<c>...<e>target</e></c></f><e>current</e>`:
    If it follows an `<f>` node, and that `<f>` node has editable components
    (i.e. `<c>` children), then we need to move to the last node of the last
    `<c> child of that `<f>` node.
    
  * `<e>target</e><f><b/><b/></f><e>current</e>`: If it
    follows an `<f>` node, and that `<f>` node has no editable
    components (i.e. no `<c>` children), then we need to move the
    `<e>` node immediately preceding that `<f>` node.

* `sel_left`: When we are selecting (e.g. holding shift and pressing
  arrow keys), we are moving the cursor around, but somewhere else is
  the "start of selection" cursor, so that the selection is the region
  between the current cursor and this selection-start cursor.  For
  sanity, we want to require that these two cursors always be in the
  same level of the tree.

  `sel_left`, therefore, will first check if the "start of selection"
  cursor is present, and if not, it will place it at the current
  cursor location.  Then, it will move the cursor to the left as
  before, but keeping it at the same level of the tree with the
  selection cursor and normal cursor always having the same immediate
  parent.  If we're not at the beginning of an `<e>` node, this is
  still easy.  If we are at the beginning, then there are again cases:

  * `<m><e>current</e>...</m>`: If it is the first child of its parent
    and its parent is an `<m>` node, then we're at the beginning and
    should again call `this.left_callback`.

  * `<c><e>current</e></c>`: If it is the first child of its parent
    and its parent is a `<c>` node, then we cannot go left without
    leaving our current level in the tree, so we do not go anywhere.
    
  * `<e>target</e><f>...</f><e>current</e>`: If it follows an `<f>`
    node, and that `<f>` node, then we need to move the `<e>` node
    immediately preceding that `<f>` node.

### Editing functions

* `backspace`: Again, if the cursor is in the middle of an `<e>` node,
  this is easy.  If the cursor is at the beginning of an `<e>` node,
  then we simply choose to have the backspace operation move the
  cursor left as described above.

* `sel_cut`: Because the selection can only be from somewhere in one
  `<e>` node to somewhere in another _sibling_ `<e>` node, we need
  only to understand what fragment we're cutting out and what we
  should be left with.  This can be visualised thus:

  ```<m>...<e>stuff1 [sel_start] stuff2</e>...more stuff...<e>stuff3 [sel_end] stuff4</e>...</m>```

  should transform to:

  ```<m>...<e>stuff1 stuff4</e>...</m>```

  with the clipboard containing the fragment: 

  ```<e>stuff2</e>...more stuff...<e>stuff3</e>```

  There is another simpler case in which the selection start and end
  are in the same `<e>` node, but this is much easier.

* `sel_paste`: If the clipboard contains a fragment like

  ```<e>stuff2</e>...more stuff...<e>stuff3</e>```

  then when we paste, the cursor will be in the middle of an `<e>` node, such as:

  ```<m>...<e>stuff1 [cursor] stuff4</e>...</m>```

  So the basic idea will be to merge the stuff to the left of the
  cursor (stuff1), with the first `<e>` node of the fragment, and
  merge the stuff to the right of the cursor (stuff2) with the last
  `<e>` node of the fragment, resulting in:  

  ```<m>...<e>stuff1 stuff2</e>...more stuff...<e>stuff3 [cursor] stuff4</e>...</m>```
