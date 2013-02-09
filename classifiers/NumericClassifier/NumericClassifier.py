def Equals(answer, x):
    """Answer is equal to {{x}}."""
    return answer == x


def IsLessThan(answer, x):
    """Answer is less than {{x}}."""
    return answer < x


def IsGreaterThan(answer, x):
    """Answer is greater than {{x}}."""
    return answer > x


def IsLessThanOrEqualTo(answer, x):
    """Answer is less than or equal to {{x}}."""
    return answer <= x


def IsGreaterThanOrEqualTo(answer, x):
    """Answer is greater than or equal to {{x}}."""
    return answer >= x


def IsInclusivelyBetween(answer, a, b):
    """Answer is between {{a}} and {{b}}, inclusive."""
    return answer >= a and answer <= b


def IsWithinTolerance(answer, tol, x):
    """Answer is within {{tol}} of {{x}}, inclusive."""
    return IsInclusivelyBetween(answer, tol - x, tol + x)
