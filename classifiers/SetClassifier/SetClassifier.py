def IsSet(val):
    """The given value should be a list with unique elements."""
    if not isinstance(val, list) and not isinstance(val, tuple):
        return False
    if len(set(val)) != len(val):
        return False
    return True


def Equals(val, x):
    """The given value should be equal to {{x}}."""
    return val == x


def IsSubsetOf(val, x):
    """The given value should be a proper subset of {{x}}."""
    return val < x


def IsSupersetOf(val, x):
    """The given value should be a proper superset of {{x}}."""
    return val > x


def HasElementsNotIn(val, x):
    """The given value should have elements not in {{x}}."""
    return bool(val - x)


def OmitsElementsIn(val, x):
    """The given value should omit some elements in {{x}}."""
    return bool(x - val)


def IsDisjointFrom(val, x):
    """The given value should have no elements in common with {{x}}."""
    return not bool(intersection(val, x))
