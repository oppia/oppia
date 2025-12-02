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

"""This script starts up a development server running Oppia. It installs any
missing third-party dependencies and starts up a local GAE development
server.
"""

from __future__ import annotations

import argparse
import sys

from core.constants import (  # pylint: disable=wrong-import-position, wrong-import-order
    constants,
)
from scripts import start_utils

from typing import Optional, Sequence

# Do not import any Oppia modules here,
# import them below the "install_third_party_libs.main()" line.

_PARSER = argparse.ArgumentParser(
    description="""
Run the script from the oppia root folder:
    python -m scripts.start
Note that the root folder MUST be named 'oppia'.
"""
)

_PARSER.add_argument(
    '--save_datastore',
    help='optional; if specified, does not clear the datastore.',
    action='store_true',
)
_PARSER.add_argument(
    '--disable_host_checking',
    help='optional; if specified, disables host checking so that the dev '
    'server can be accessed by any device on the same network using the '
    'host device\'s IP address. DO NOT use this flag if you\'re running '
    'on an untrusted network.',
    action='store_true',
)
_PARSER.add_argument(
    '--prod_env',
    help='optional; if specified, runs Oppia in a production environment.',
    action='store_true',
)
_PARSER.add_argument(
    '--maintenance_mode',
    help='optional; if specified, puts Oppia into maintenance mode.',
    action='store_true',
)
_PARSER.add_argument(
    '--no_browser',
    help='optional; if specified, does not open a browser.',
    action='store_true',
)
_PARSER.add_argument(
    '--no_auto_restart',
    help='optional; if specified, does not automatically restart when files '
    'are changed.',
    action='store_true',
)
_PARSER.add_argument(
    '--source_maps',
    help='optional; if specified, build webpack with source maps.',
    action='store_true',
)
_PARSER.add_argument(
    '--skip-install',
    help='optional; if specified, skips the installation of '
    'third party libraries',
    action='store_true',
)
_PARSER.add_argument(
    '--verify-imports',
    help='optional; if specified, verifies that all dependencies can be '
    'imported and then exits.',
    action='store_true',
)

PORT_NUMBER_FOR_GAE_SERVER = 8181


def main(args: Optional[Sequence[str]] = None) -> None:
    """Starts up a development server running Oppia."""
    parsed_args = _PARSER.parse_args(args=args)

    if parsed_args.verify_imports:
        # This flag is used to verify that all dependencies can be imported
        # correctly. This is useful for CI to catch missing dependencies
        # without starting the full server.
        # IMPORTANT: We must NOT import _start_main here as it has top-level
        # imports that may have side effects.
        print('Verifying imports...')
        try:
            # Import core dependencies that start.py needs
            start_utils.lazy_import('scripts.install_third_party_libs')
            
            # Import heavy modules that would normally be needed
            # These are the ones that caused issues previously
            start_utils.lazy_import('scripts.build')
            start_utils.lazy_import('scripts.common')
            start_utils.lazy_import('scripts.servers')
            start_utils.lazy_import('scripts.extend_index_yaml')
            start_utils.lazy_import('core.utils')
            start_utils.lazy_import('filetype')
            start_utils.lazy_import('certifi')
            start_utils.lazy_import('xmltodict')
            
            print('Imports verified successfully.')
            sys.exit(0)
        except Exception as e:
            print(f'Import verification failed: {e}')
            sys.exit(1)

    if start_utils.is_port_in_use(PORT_NUMBER_FOR_GAE_SERVER):
        start_utils.print_each_string_after_two_new_lines(
            [
                'WARNING',
                'Could not start new server. There is already an existing server '
                'running at port %s.' % PORT_NUMBER_FOR_GAE_SERVER,
            ]
        )

    if not parsed_args.skip_install:
        # This installs third party libraries before
        # importing other files or importing
        # libraries that use the builtins python module (e.g. build).
        from . import install_third_party_libs
        install_third_party_libs.main()

    # Import the main logic after installation
    from . import _start_main
    _start_main.main(parsed_args)


if __name__ == '__main__':  # pragma: no cover
    main()
