# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Script to generate a deterministic compiled requirements file."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from scripts import common
import collections
import os
import sys
import python_utils
import re


sys.path.insert(0, os.path.join(
    common.OPPIA_TOOLS_DIR, 'pip-tools-%s' % common.PIP_TOOLS_VERSION))

def main():
    from piptools.scripts.compile import cli

    sys.argv[0] = re.sub(
        r'(-script\.pyw|\.exe)?$', '',
        common.PRE_COMPILED_REQUIREMENTS_FILE_PATH)
    cli()

main()
