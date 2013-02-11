def Equals(answer, x):
    """Answer is equal to {{x}}."""
    return answer == x


def StartsWith(answer, x):
    """Answer starts with {{x}}."""
    return answer.startswith(x)


def Contains(answer, x):
    """Answer contains {{x}}."""
    return answer.find(x) != -1
