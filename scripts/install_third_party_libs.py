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

"""Installation script for Oppia third-party libraries."""

from __future__ import annotations

import argparse
import os
import shutil
import subprocess

from core import feconf
from scripts import install_python_dev_dependencies

from typing import Final

if not feconf.OPPIA_IS_DOCKERIZED:
    install_python_dev_dependencies.main(['--assert_compiled'])

    from . import install_third_party  # isort:skip  pylint: disable=wrong-import-position, wrong-import-order
    from . import pre_commit_hook  # isort:skip  pylint: disable=wrong-import-position, wrong-import-order
    from . import pre_push_hook  # isort:skip  pylint: disable=wrong-import-position, wrong-import-order
    from . import setup  # isort:skip  pylint: disable=wrong-import-position, wrong-import-order
    from . import setup_gae  # isort:skip  pylint: disable=wrong-import-position, wrong-import-order

from . import common  # isort:skip  pylint: disable=wrong-import-position, wrong-import-order

from core import utils  # isort:skip   pylint: disable=wrong-import-position, wrong-import-order

_PARSER: Final = argparse.ArgumentParser(
    description="""
Installation script for Oppia third-party libraries.
""")


def tweak_yarn_executable() -> None:
    """When yarn is run on Windows, the file yarn will be executed by default.
    However, this file is a bash script, and can't be executed directly on
    Windows. So, to prevent Windows automatically executing it by default
    (while preserving the behavior on other systems), we rename it to yarn.sh
    here.
    """
    origin_file_path = os.path.join(common.YARN_PATH, 'bin', 'yarn')
    if os.path.isfile(origin_file_path):
        renamed_file_path = os.path.join(common.YARN_PATH, 'bin', 'yarn.sh')
        os.rename(origin_file_path, renamed_file_path)


def get_yarn_command() -> str:
    """Get the executable file for yarn."""
    if common.is_windows_os():
        return 'yarn.cmd'
    return 'yarn'


def make_google_module_importable_by_python(google_module_path: str) -> None:
    """Adds an empty __init__.py file to the google module if they do not
    exist. This solves the bug mentioned below where namespace packages
    sometimes install modules without __init__.py files (python requires
    modules to have __init__.py files in order to recognize them as modules
    and import them):
    https://github.com/googleapis/python-ndb/issues/518

    Args:
        google_module_path: str. The path to the google module.
    """
    print(
        'Checking that all google library modules contain __init__.py files...')
    for path_list in os.walk(google_module_path):
        root_path = path_list[0]
        if not root_path.endswith('__pycache__'):
            with utils.open_file(
                os.path.join(root_path, '__init__.py'), 'a'):
                # If the file doesn't exist, it is created. If it does exist,
                # this open does nothing.
                pass


def main() -> None:
    """Install third-party libraries for Oppia."""
    if feconf.OPPIA_IS_DOCKERIZED:
        make_google_module_importable_by_python(
            google_module_path='/app/oppia/third_party/python_libs/google')
        return

    setup.main(args=[])
    setup_gae.main(args=[])

    # Download and install required JS and zip files.
    print('Installing third-party JS libraries and zip files.')
    install_third_party.main(args=[])

    # The following steps solves the problem of multiple google paths confusing
    # the python interpreter. Namely, there are two modules named google/, one
    # that is installed with google cloud libraries and another that comes with
    # the Google Cloud SDK. Python cannot import from both paths simultaneously
    # so we must combine the two modules into one. We solve this by copying the
    # Google Cloud SDK libraries that we need into the correct google
    # module directory in the 'third_party/python_libs' directory.
    print('Copying Google Cloud SDK modules to third_party/python_libs...')
    correct_google_path = os.path.join(
        common.THIRD_PARTY_PYTHON_LIBS_DIR, 'google')
    if not os.path.isdir(correct_google_path):
        os.mkdir(correct_google_path)

    if not os.path.isdir(os.path.join(correct_google_path, 'appengine')):
        shutil.copytree(
            os.path.join(
                common.GOOGLE_APP_ENGINE_SDK_HOME, 'google', 'appengine'),
            os.path.join(correct_google_path, 'appengine'))

    if not os.path.isdir(os.path.join(correct_google_path, 'pyglib')):
        shutil.copytree(
            os.path.join(
                common.GOOGLE_APP_ENGINE_SDK_HOME, 'google', 'pyglib'),
            os.path.join(correct_google_path, 'pyglib'))

    # The following function populates all of the google modules with
    # the correct __init__.py files if they do not exist. This solves the bug
    # mentioned below where namespace packages sometimes install modules without
    # __init__.py files (python requires modules to have __init__.py files in
    # in order to recognize them as modules and import them):
    # https://github.com/googleapis/python-ndb/issues/518
    make_google_module_importable_by_python(correct_google_path)

    if common.is_windows_os():
        tweak_yarn_executable()

    # Install third-party node modules needed for the build process.
    subprocess.check_call([get_yarn_command(), 'install', '--pure-lockfile'])

    # Install pre-commit script.
    print('Installing pre-commit hook for git')
    pre_commit_hook.main(args=['--install'])

    # TODO(#8112): Once run_lint_checks is working correctly, this
    # condition should be removed.
    if not common.is_windows_os():
        # Install pre-push script.
        print('Installing pre-push hook for git')
        pre_push_hook.main(args=['--install'])


# The 'no coverage' pragma is used as this line is un-testable. This is because
# it will only be called when install_third_party_libs.py is used as a script.
if __name__ == '__main__': # pragma: no cover
    main()
