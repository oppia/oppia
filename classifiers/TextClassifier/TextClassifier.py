def norm(x):
    """Removes spaces and makes all characters of a string lowercase."""
    return x.replace(' ', '').lower()


def Equals(val, x):
    """The given value should be equal to {{x}}."""
    return norm(val) == norm(x)


def StartsWith(val, x):
    """The given string should start with {{x}}."""
    return norm(val).startswith(norm(x))


def Contains(val, x):
    """The given string should contain {{x}}."""
    return norm(val).find(norm(x)) != -1
