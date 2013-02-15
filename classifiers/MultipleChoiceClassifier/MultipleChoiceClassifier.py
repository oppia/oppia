def IsNonnegativeInt(val):
    """The given value should be a non-negative integer."""
    return isinstance(val, int) and val >= 0


def Equals(val, x):
    """The given value should be equal to {{x}}."""
    return val == x
