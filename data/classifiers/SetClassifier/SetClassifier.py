def Set(val):
    """The given value should be a list with unique elements."""
    try:
        assert isinstance(val, list)
        assert len(set(val)) == len(val)
    except:
        return None
    return val


def equals(val, x):
    """The given value should be equal to {{x}}."""
    return val == x


def is_subset_of(val, x):
    """The given value should be a proper subset of {{x}}."""
    return val < x


def is_superset_pf(val, x):
    """The given value should be a proper superset of {{x}}."""
    return val > x


def has_elements_not_in(val, x):
    """The given value should have elements not in {{x}}."""
    return bool(val - x)


def omits_elements_in(val, x):
    """The given value should omit some elements in {{x}}."""
    return bool(x - val)


def is_disjoint_from(val, x):
    """The given value should have no elements in common with {{x}}."""
    return not bool(val.intersection(x))
