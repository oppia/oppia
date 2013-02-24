def NonnegativeInt(val):
    """The given value should be a non-negative integer."""
    try:
        val = int(val)
        assert val >= 0
    except:
        return None
    return val


def equals(val, x):
    """The given value should be equal to {{x}}."""
    return NonnegativeInt(val) == NonnegativeInt(x)
