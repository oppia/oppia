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

"""Script to generate a deterministic compiled requirements file.

This needs to be a separate script because the cli used to compile the
requirements file stops python execution after completion. If this functionality
is included in the 'install_backend_python_libs' script, the execution of the
installation will also exit as soon as the cli finishes running.
"""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os
import re
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
    # python system path directories so that the pip-compile script can import
    # scripts.compile correctly. However, since we are installing piptools to a
    # local directory, the pip-compile script will not be able to find the
    # pip tools python packages. Therefore, we need to write our own and
    # manually add our local pip-tools directory to the system path in order to
    # import their libraries correctly.
    sys.argv[0] = re.sub(
        r'(-script\.pyw|\.exe)?$', '',
        common.PRE_COMPILED_REQUIREMENTS_FILE_PATH)
    compile.cli() # pylint: disable=no-value-for-parameter


# The 'no coverage' pragma is used as this line is un-testable. This is because
# it will only be called when install_third_party_libs.py is used as a script.
if __name__ == '__main__': # pragma: no cover
    main()
