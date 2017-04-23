import sys
import os

parent_path = os.path.abspath(os.path.join(os.path.split(__file__)[0], ".."))

if not parent_path in sys.path:
    sys.path.insert(0, parent_path)
del parent_path

from runtests import buildTestSuite

import support
