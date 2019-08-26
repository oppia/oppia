# Copyright 2019 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the 'License');
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an 'AS-IS' BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""This file should not be invoked directly, but sourced from other sh scripts.

Creates a lockfile to help with new user confusion when launching a vagrant
vm. See https://github.com/oppia/oppia/pull/2749 for details.

It can be overridden by passing --nolock to start.sh.
"""
from __future__ import absolute_import  # pylint: disable=import-only-modules

import argparse
import os
import sys

import python_utils

from . import clean


def main(argv):
    """Creates a lockfile."""
    vagrant_lock_file = './.lock'

    _parser = argparse.ArgumentParser()
    _parser.add_argument(
        '--nolock',
        help='optional; if specified, skips creation of lockfile',
        action='store_true')
    parsed_args, _ = _parser.parse_known_args(args=argv)
    if parsed_args.nolock:
        clean.delete_file(vagrant_lock_file)
        sys.exit(0)

    if os.path.isfile(vagrant_lock_file):
        python_utils.PRINT('')
        python_utils.PRINT('Another setup instance is already running')
        python_utils.PRINT('')
        python_utils.PRINT(
            'Please wait for that instance to complete or terminate it')
        python_utils.PRINT('')
        python_utils.PRINT(
            'If you ran $0 twice on purpose, you can override this with '
            '--nolock')
        python_utils.PRINT('')
        sys.exit(1)
    else:
        os.utime(vagrant_lock_file, None)
        clean.delete_file(vagrant_lock_file)


if __name__ == '__main__':
    main(sys.argv)
