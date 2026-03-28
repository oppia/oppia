#!/usr/bin/env python
#
# Author: Mike McKerns (mmckerns @caltech and @uqfoundation)
# Copyright (c) 2018-2019 The Uncertainty Quantification Foundation.
# License: 3-clause BSD.  The full license text is available at:
#  - https://github.com/uqfoundation/dill/blob/master/LICENSE

from __future__ import print_function
import glob
import os
try:
    import pox
    python = pox.which_python(version=True, fullpath=False) or 'python'
except ImportError:
    python = 'python'

suite = os.path.dirname(__file__) or os.path.curdir
tests = glob.glob(suite + os.path.sep + 'test_*.py')


if __name__ == '__main__':

    for test in tests:
        print('.', end='')
        os.system('{0} {1}'.format(python, test))
    print('')

