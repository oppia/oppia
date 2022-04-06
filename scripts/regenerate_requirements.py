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

"""Script to compile a deterministic 'requirements.txt' file.

This needs to be a separate script because the python function that regenerates
the requirements file is a command-line interface (CLI) script. Once the CLI
finishes execution, it forces itself and any python scripts in the current
callstack to exit.
Therefore, in order to allow continued execution after the requirements
file is generated, we must call the CLI in a separate process.
"""

from __future__ import annotations

import os
import sys

from scripts import common

PIP_TOOLS_PATH = os.path.join(
    common.OPPIA_TOOLS_DIR, 'pip-tools-%s' % common.PIP_TOOLS_VERSION)
sys.path.insert(0, PIP_TOOLS_PATH)
from piptools.scripts import compile  # isort:skip pylint: disable=redefined-builtin, wrong-import-position, wrong-import-order


def main():
    """Regenerates the 'requirements.txt' file using the 'requirements.in'
    file to produce a deterministic list of all the dependencies that should be
    in the 'third_party/python_libs' folder.
    """
    # This code is copied from the pip-compile script. We cannot use the
    # pip-compile script because we installed pip-tools to our own local
    # oppia_tools directory.
    #
    # In a normal installation, piptools adds the pip-compile script to the
    # user's bin directory and the pip-tools libraries to one of the default
    # python system path directories. When the pip-compile script executes, it
    # can import 'scripts.compile' correctly from the default sys.path. However,
    # since we are installing piptools to a local directory, the pip-compile
    # script will not be able to find the pip tools python packages. Therefore,
    # we need to write our own script and manually add our local pip-tools
    # directory to the python system path in order to import the required
    # libraries correctly.
    print('\n\n\n\n\n\n regenerate pip file seems to be failing ', sys.path)
    compile.cli() # pylint: disable=no-value-for-parameter


# The 'no coverage' pragma is used as this line is un-testable. This is because
# it will only be called when install_third_party_libs.py is used as a script.
if __name__ == '__main__': # pragma: no cover
    main()
