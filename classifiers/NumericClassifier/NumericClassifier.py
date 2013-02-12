import numbers


def IsNumber(val):
    """The given value should be a number."""
    return isinstance(val, numbers.Number)


def IsReal(val):
    """The given value should be a real number."""
    return isinstance(val, numbers.Real)


def Equals(val, x):
    """The given value should be equal to {{x}}."""
    return val == x


def IsLessThan(val, x):
    """The given value should be less than {{x}}."""
    return val < x


def IsGreaterThan(val, x):
    """The given value should be greater than {{x}}."""
    return val > x


def IsLessThanOrEqualTo(val, x):
    """The given value should be less than or equal to {{x}}."""
    return val <= x


def IsGreaterThanOrEqualTo(val, x):
    """The given value should be greater than or equal to {{x}}."""
    return val >= x


def IsInclusivelyBetween(val, a, b):
    """The given value should be between {{a}} and {{b}}, inclusive."""
    return val >= a and val <= b


def IsWithinTolerance(val, tol, x):
    """The given value should be within {{tol}} of {{x}}, inclusive."""
    return IsInclusivelyBetween(val, tol - x, tol + x)
