def String(x):
    """Removes spaces and makes all characters of a string lowercase."""
    try:
        return unicode(x).replace(' ', '').lower()
    except:
        return None


def equals(val, x):
    """The given value should be equal to {{x}}."""
    return String(val) == String(x)


def starts_with(val, x):
    """The given string should start with {{x}}."""
    return String(val).startswith(String(x))


def contains(val, x):
    """The given string should contain {{x}}."""
    return String(val).find(String(x)) != -1
