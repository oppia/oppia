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
from __future__ import absolute_import  # pylint: disable=import-only-modules

import argparse
import contextlib
import fileinput
import os
import shutil
import subprocess
import sys

import python_utils

from . import common
from . import install_third_party
from . import setup

_PARSER = argparse.ArgumentParser()
_PARSER.add_argument(
    '--nojsrepl',
    help='optional; if specified, skips installation of skulpt.',
    action='store_true')
_PARSER.add_argument(
    '--noskulpt',
    help='optional; if specified, skips installation of skulpt.',
    action='store_true')


@contextlib.contextmanager
def _redirect_stdout(new_target):
    """Redirect stdout to the new target.

    Args:
        new_target: TextIOWrapper. The new target to which stdout is redirected.

    Yields:
        TextIOWrapper. The new target.
    """
    old_target = sys.stdout
    sys.stdout = new_target
    try:
        yield new_target
    finally:
        sys.stdout = old_target


def pip_install(package, version, install_path):
    """Installs third party libraries with pip.

    Args:
        package: str. The package name.
        version: str. The package version.
        install_path: str. The installation path for the package.
    """
    try:
        python_utils.PRINT('Checking if pip is installed on the local machine')
        import pip
    except ImportError:
        python_utils.PRINT(
            'Pip is required to install Oppia dependencies, but pip wasn\'t '
            'found')
        python_utils.PRINT('on your local machine.')
        python_utils.PRINT('')
        python_utils.PRINT(
            'Please see \'Installing Oppia\' on the Oppia developers\' wiki '
            'page:')

        os_info = os.uname()
        if os_info[0] != 'Darwin':
            python_utils.PRINT(
                'https://github.com/oppia/oppia/wiki/Installing-Oppia-%28Mac-'
                'OS%29')
        elif os_info[0] != 'Linux':
            python_utils.PRINT(
                'https://github.com/oppia/oppia/wiki/Installing-Oppia-%28Linux'
                '%29')
        else:
            python_utils.PRINT(
                'https://github.com/oppia/oppia/wiki/Installing-Oppia-%28'
                'Windows%29')
        sys.exit(1)

    if hasattr(pip, 'main'):
        pip.main(['install', package])
    else:
        import pip._internal
        pip._internal.main(args=[  # pylint: disable=protected-access
            'install', '%s==%s' % (package, version), '--target', install_path])


def install_skulpt():
    """Download and install Skulpt. Skulpt is built using a Python script
    included within the Skulpt repository (skulpt.py). This script normally
    requires GitPython, however the patches to it below
    (with the sed operations) lead to it no longer being required. The Python
    script is used to avoid having to manually recreate the Skulpt dist build
    process in install_third_party.py. Note that skulpt.py will issue a
    warning saying its dist command will not work properly without GitPython,
    but it does actually work due to the patches.
    """

    # We use parse_known_args() to ignore the extra arguments which maybe used
    # while calling this method from other Python scripts.
    parsed_args, _ = _PARSER.parse_known_args()
    no_skulpt = parsed_args.nojsrepl or parsed_args.noskulpt

    python_utils.PRINT('Checking whether Skulpt is installed in third_party')
    if not os.path.exists(
            os.path.join(
                common.THIRD_PARTY_DIR,
                'static/skulpt-0.10.0')) and not no_skulpt:
        if not os.path.exists(
                os.path.join(common.OPPIA_TOOLS_DIR, 'skulpt-0.10.0')):
            python_utils.PRINT('Downloading Skulpt')
            os.chdir(common.OPPIA_TOOLS_DIR)
            os.mkdir('skulpt-0.10.0')
            os.chdir('skulpt-0.10.0')
            subprocess.call(
                'git clone https://github.com/skulpt/skulpt'.split())
            os.chdir('skulpt')

            # Use a specific Skulpt release.
            subprocess.call('git checkout 0.10.0'.split())

            # Add a temporary backup file so that this script works on both
            # Linux and Mac.
            tmp_file = '/tmp/backup.XXXXXXXXXX'

            python_utils.PRINT('Compiling Skulpt')
            target_stdout = python_utils.string_io()
            # The Skulpt setup function needs to be tweaked. It fails without
            # certain third party commands. These are only used for unit tests
            # and generating documentation and are not necessary when building
            # Skulpt.
            for line in fileinput.input(
                    files=[os.path.join(
                        common.OPPIA_TOOLS_DIR,
                        'skulpt-0.10.0/skulpt/skulpt.py')]):
                # Inside this loop the STDOUT will be redirected to the file.
                # The comma after each python_utils.PRINT statement is needed to
                #  avoid double line breaks.
                with _redirect_stdout(target_stdout):
                    python_utils.PRINT(
                        line.replace('ret = test()', 'ret = 0'),
                        end='')
                    python_utils.PRINT(
                        line.replace('  doc()', '  pass#doc()'),
                        end='')
                    # This and the next command disable unit and compressed unit
                    # tests for the compressed distribution of Skulpt. These
                    # tests don't work on some Ubuntu environments and cause a
                    # libreadline dependency issue.
                    python_utils.PRINT(
                        line.replace(
                            'ret = os.system(\'{0}',
                            'ret = 0 #os.system(\'{0}'),
                        end='')
                    python_utils.PRINT(
                        line.replace('ret = rununits(opt=True)', 'ret = 0'),
                        end='')

            temp_file_content = target_stdout.getvalue()
            with python_utils.open_file(tmp_file, 'w') as f:
                f.write(temp_file_content)

            shutil.move(
                tmp_file, os.path.join(
                    common.OPPIA_TOOLS_DIR, 'skulpt-0.10.0/skulpt/skulpt.py'))
            subprocess.call(
                'python $common.OPPIA_TOOLS_DIR/skulpt-0.10.0/skulpt/skulpt.py '
                'dist'.split())

            # Return to the Oppia root folder.
            os.chdir(common.CURR_DIR)

            # Move the build directory to the static resources folder.
            os.makedirs(
                os.path.join(common.THIRD_PARTY_DIR, 'static/skulpt-0.10.0'))
            shutil.copytree(
                os.path.join(
                    common.OPPIA_TOOLS_DIR, 'skulpt-0.10.0/skulpt/dist/'),
                os.path.join(common.THIRD_PARTY_DIR, 'static/skulpt-0.10.0'))


def main():
    """Install third-party libraries for Oppia."""
    pip_dependencies = [
        ('future', '0.17.1', common.THIRD_PARTY_DIR),
        ('pylint', '1.9.4', common.OPPIA_TOOLS_DIR),
        ('Pillow', '6.0.0', common.OPPIA_TOOLS_DIR),
        ('pylint-quotes', '0.2.1', common.OPPIA_TOOLS_DIR),
        ('webtest', '2.0.33', common.OPPIA_TOOLS_DIR),
        ('isort', '4.3.20', common.OPPIA_TOOLS_DIR),
        ('pycodestyle', '2.5.0', common.OPPIA_TOOLS_DIR),
        ('esprima', '4.0.1', common.OPPIA_TOOLS_DIR),
        ('browsermob-proxy', '0.8.0', common.OPPIA_TOOLS_DIR),
        ('selenium', '3.13.0', common.OPPIA_TOOLS_DIR),
        ('PyGithub', '1.43.7', common.OPPIA_TOOLS_DIR),
        ('psutil', '5.6.3', common.OPPIA_TOOLS_DIR),
    ]

    for package, version, path in pip_dependencies:
        python_utils.PRINT(
            'Checking if %s is installed in %s' % (package, path))

        exact_lib_path = os.path.join(path, '%s-%s' % (package, version))
        if not os.path.exists(exact_lib_path):
            python_utils.PRINT('Installing %s' % package)
            pip_install(package, version, exact_lib_path)

    setup.main()

    # Download and install required JS and zip files.
    python_utils.PRINT('Installing third-party JS libraries and zip files.')
    install_third_party.main()

    # Install third-party node modules needed for the build process.
    subprocess.call((
        '%s/bin/npm install --only=dev' % common.NODE_PATH).split())
    # This line removes the 'npm ERR! missing:' messages. For reference, see
    # this thread: https://github.com/npm/npm/issues/19393#issuecomment-
    # 374076889.
    subprocess.call(('%s/bin/npm dedupe' % common.NODE_PATH).split())

    install_skulpt()
    # Install pre-commit script.
    python_utils.PRINT('Installing pre-commit hook for git')
    subprocess.call('python -m scripts.pre_commit_hook --install'.split())

    # Install pre-push script.
    python_utils.PRINT('Installing pre-push hook for git')
    subprocess.call('python -m scripts.pre_push_hook --install'.split())


if __name__ == '__main__':
    main()
