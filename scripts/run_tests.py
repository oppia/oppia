# Copyright 2019 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""This script runs all the tests, in this order:
- Frontend Karma unit tests
- Backend Python tests
- End-to-end Protractor tests

If any of these tests result in errors, this script will terminate.

Note: The test scripts are arranged in increasing order of time taken. This
enables a broken build to be detected as quickly as possible.
"""

from __future__ import annotations

import argparse
import subprocess
from typing import Optional, Sequence

from . import run_backend_tests
from . import run_frontend_tests
from . import setup
from . import setup_gae

_PARSER = argparse.ArgumentParser(
    description="""
Run this script from the oppia root folder:
    python -m scripts.run_tests
This script runs all the tests, in this order:
- Frontend Karma unit tests
- Backend Python tests
- End-to-end Protractor tests
""")


def main(args: Optional[Sequence[str]] = None) -> None:
    """Run all the tests."""
    unused_parsed_args = _PARSER.parse_args(args=args)

    setup.main(args=[])
    setup_gae.main(args=[])

    # Run frontend unit tests.
    print('Running frontend unit tests')
    run_frontend_tests.main(args=[])
    print('Frontend tests passed.')

    # Run backend tests.
    print('Running backend tests')
    run_backend_tests.main(args=[])  # type: ignore[no-untyped-call]
    print('Backend tests passed.')

    # Run end-to-end tests.
    print('Running end-to-end tests')
    subprocess.Popen('bash scripts/run_e2e_tests.sh', shell=True)

    print('SUCCESS    All frontend, backend and end-to-end tests passed!')


if __name__ == '__main__':  # pragma: no cover
    main()
