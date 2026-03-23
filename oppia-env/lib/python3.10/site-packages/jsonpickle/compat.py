import queue  # noqa
import sys
from collections.abc import Iterator as abc_iterator  # noqa

PY_MAJOR = sys.version_info[0]

class_types = (type,)
iterator_types = (type(iter('')),)

string_types = (str,)
numeric_types = (int, float)
ustr = str


def iterator(class_):
    # TODO: Replace all instances of this
    return class_
