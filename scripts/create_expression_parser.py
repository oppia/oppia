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

"""This script produces the expression parser."""

from __future__ import annotations

import argparse
import os
import subprocess
from typing import Optional, Sequence

from . import common
from . import setup

_PARSER = argparse.ArgumentParser(
    description="""
Run this script from the oppia root folder:
    python -m scripts.create_expression_parser
The root folder MUST be named 'oppia'.
""")


def main(args: Optional[Sequence[str]] = None) -> None:
    """Produces the expression parser."""
    unused_parsed_args = _PARSER.parse_args(args=args)
    setup.main(args=[])

    expression_parser_definition = os.path.join(
        'core', 'templates', 'expressions', 'parser.pegjs')
    expression_parser_js = os.path.join(
        'core', 'templates', 'expressions', 'parser.js')

    common.install_npm_library('pegjs', '0.8.0', common.OPPIA_TOOLS_DIR)

    subprocess.check_call([
        os.path.join(common.NODE_MODULES_PATH, 'pegjs', 'bin', 'pegjs'),
        expression_parser_definition, expression_parser_js])

    print('Done!')


if __name__ == '__main__':  # pragma: no cover
    main()
