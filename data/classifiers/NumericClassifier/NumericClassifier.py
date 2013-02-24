import numbers


def Number(val):
    """The given value should be a number."""
    try:
        val = float(val)
        assert isinstance(val, numbers.Number)
    except:
        return None
    return val


def Real(val):
    """The given value should be a real number."""
    try:
        val = float(val)
        assert isinstance(val, numbers.Real)
    except:
        return None
    return val


def equals(val, x):
    """The given value should be equal to {{x}}."""
    return val == x


def is_less_than(val, x):
    """The given value should be less than {{x}}."""
    return val < x


def is_greater_than(val, x):
    """The given value should be greater than {{x}}."""
    return val > x


def is_less_than_or_equal_to(val, x):
    """The given value should be less than or equal to {{x}}."""
    return val <= x


def is_greater_than_or_equal_to(val, x):
    """The given value should be greater than or equal to {{x}}."""
    return val >= x


def is_inclusively_between(val, a, b):
    """The given value should be between {{a}} and {{b}}, inclusive."""
    return val >= a and val <= b


def is_within_tolerance(val, x, tol):
    """The given value should be within {{tol}} of {{x}}, inclusive."""
    return is_inclusively_between(val, x - tol, x + tol)
