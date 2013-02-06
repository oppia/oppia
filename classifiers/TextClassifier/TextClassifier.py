def Equals(_answer, x):
    """Answer is equal to {{x}}."""
    return _answer == x


def StartsWith(_answer, x):
    """Answer starts with {{x}}."""
    return _answer.startswith(x)


def Contains(_answer, x):
    """Answer contains {{x}}."""
    return _answer.find(x) != -1
