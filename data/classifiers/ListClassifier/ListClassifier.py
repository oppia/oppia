def IsList(val):
    """The given value should be a list."""
    return isinstance(val, list)


def HasNonemptyCommonPrefix(val, x):
    """The given value and {{x}} should have a non-empty common prefix."""
    return len(x) > 0 and len(val) > 0 and x[0] == val[0]
