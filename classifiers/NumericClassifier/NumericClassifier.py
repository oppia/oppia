def Equals(_answer, x):
    """Answer is equal to {{x}}."""
    return _answer == x


def LessThan(_answer, x):
    """Answer is less than {{x}}."""
    return _answer < x


def GreaterThan(_answer, x):
    """Answer is greater than {{x}}."""
    return _answer > x


def LessThanOrEqualTo(_answer, x):
    """Answer is less than or equal to {{x}}."""
    return _answer <= x


def GreaterThanOrEqualTo(_answer, x):
    """Answer is greater than or equal to {{x}}."""
    return _answer >= x


def InclusiveBetween(_answer, a, b):
    """Answer is between {{a}} and {{b}}, inclusive."""
    return _answer >= a and _answer <= b
