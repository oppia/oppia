def Equals(val, x):
    """The given value should be equal to {{x}}."""
    return val == x


def StartsWith(val, x):
    """The given string should start with {{x}}."""
    return val.startswith(x)


def Contains(val, x):
    """The given string should contain {{x}}."""
    return val.find(x) != -1
