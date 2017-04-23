## Symbol definition reference

`symbols.json` is a dictionary whose keys are the symbol names
(i.e. the strings that will get auto-replaced by the symbol in the
editor) and whose values are dictionaries with the following keys:

* `output`: A dictionary with keys `latex`, `text`, and an optional
  `small_latex`.  The values are strings which will comprise the
  LaTeX, ASCII, or small LaTeX (respectively) representations of the
  symbol.  A symbol may have editable components, the ith of which is
  represented by `{$i}` appearing in the string.  For example, the
  LaTeX representation of the `sqrt` symbol is `"\\sqrt{{$1}}"`,
  indicating that it has one editable component, namely the inside of
  the square root.

* `type`: A string name for the symbol (will appear in the XML and can
  used for searching).

* `current`: If this is non-zero, then if the symbol is inserted while
  something is selected, then that selection will become this
  component of the symbol.  For example, if the current state is
  `x+1+2` and you select `x+1` and press `^`, then because the
  exponent symbol has `"current":1`, the selection will become
  component 1 of the exponent (i.e. the base) and you will get
  `(x+1)^{}+2`.

* [optional] `current_type`: If this is `"token"` and current is
  non-zero, then when the symbol is inserted, the first token to the
  left of the cursor when the symbol is inserted will become the
  component specified in `current`.  For example, the exponent symbol
  has `"current":1,"current_type":"token"`, so if the current state of
  the editor is `pi+sin(x)` and the cursor is just after the pi, then
  if `^` is pressed, the state will become `{pi}^{}+sin(x)`.  

* [optional] `attrs`: This is a dictionary describing the XML
  attributes that will be given to each of the symbol's editable
  components.  That is, each key is an attribute name, and each value
  is a list of strings, the ith of which will be the value of the
  attribute for the ith component (attribute will be excluded if the
  value is 0).  For example, if the `attrs` dictionary has entry
  `"size":[0,0,"s"]`, then the first and second components will not
  get a size attribute, and the third will get an attribute
  `size="s"`.  You can include whatever attribute names you want, but
  the following names are treated specially in Guppy if they are
  present:
  
  * `mode`: This should be set to "text" for any components that
    should be rendered as text (rather than in math mode).  
  
  * `up`: Which component to jump to when the up arrow key is pressed
    (or 0 for the default behaviour).  For example, in a definite
    integral, we want the up arrow key to take us from the integrand
    or the variable of integration directly to the upper limit.  Since
    the upper limit of integration is component 2, we use
    `"up":[2,2,2,2]`.
  
  * `down`: Which component to jump to when the down arrow key is
    pressed (or 0 for the default behaviour).
  
  * `delete`: The index of which component should be used to replace
    the entire symbol if the backspace key is pressed when the cursor
    is at the start of this component.  If 0 or absent, then the
    default backspace behaviour will be used (namely, that it behaves
    like the left arrow when at the start of any component except the
    first, where it deletes the entire symbol).  For example, in an
    exponent such as `x^2`, we want a backspace from just before the 2
    to delete just the exponent, leaving the base.  That is, we want
    component number 1 to be left.  However, if backspace is used in
    the base, we want the default behaviour.  So we use
    `"delete":[0,1]` to get the default behaviour in the first
    component, and deleting the second component to leave us with the
    first only.  

  * `bracket`: If `bracket` is `"yes"`, then this component will be
    surrounded in parentheses if it contains more than one character
    in it.  For example, the first component of an exponent has
    `bracket="yes"`, so will render as `x^{y}` if the first component is
    `x` and the second `y`, but will render as `(x+1)^{y+2}` if the first
    component is `x+1` and the second `y+2`.  
  
  * `size`: If `size` is `"s"`, then when rendering to LaTeX, anything
    in this component will be rendered using its `small_latex` output
    mode if available.  For example, an exponent has
    `"small":[0,"s"]`, so the second component (the thing in the
    exponent) is marked as being small.  Thus, for instance, fractions
    and integrals (to name two) that appear inside that exponent will
    not render at their normal, large size.