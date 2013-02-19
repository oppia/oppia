def IsList(val):
    """The given value should be a list."""
    return isinstance(val, list)


def Equals(val, x):
    """The given value and {{x}} should be equal."""
    return val == x


def DoesNotEqual(val, x):
    """The given value and {{x}} should not be equal.

    Returns additional data:
    - index: the first position at which the two lists differ.
    - value: the value of {{val}} at this position (None if non-existent).
    - len_diff: a boolean value stating whether the lengths of both lists
        differ.
    """
    data = {
        'index': None,
        'value': None,
        'len_diff': len(val) != len(x),
    }

    def update_data(data, index, value):
        data['index'] = index
        data['value'] = value
        return data

    i = 0
    while True:
        if i >= len(val) and i >= len(x):
            if val[i] != x[i]:
                return True, update_data(data, i, val[i])
            else:
                # The two lists are equal.
                return False, data
        elif i >= len(val):
            return True, update_data(data, i, None)
            return True, data
        elif i >= len(x) or val[i] != x[i]:
            return True, update_data(data, i, val[i])

        i += 1


def HasNonemptyCommonPrefix(val, x):
    """The given value and {{x}} should have a non-empty common prefix."""
    return len(x) > 0 and len(val) > 0 and x[0] == val[0]
