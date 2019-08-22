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

import StringIO
import argparse
import contextlib
import fileinput
import os
import shutil
import subprocess
import sys

from . import install_third_party
from . import setup

OPPIA_DIR = os.getcwd()


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
        print 'Checking if pip is installed on the local machine'
        import pip
    except ImportError:
        print (
            'Pip is required to install Oppia dependencies, but pip wasn\'t '
            'found')
        print 'on your local machine.'
        print ''
        print (
            'Please see \'Installing Oppia\' on the Oppia developers\' wiki '
            'page:')

        os_info = os.uname()
        if os_info[0] != 'Darwin':
            print(
                'https://github.com/oppia/oppia/wiki/Installing-Oppia-%28Mac-'
                'OS%29')
        elif os_info[0] != 'Linux':
            print(
                'https://github.com/oppia/oppia/wiki/Installing-Oppia-%28Linux'
                '%29')
        else:
            print(
                'https://github.com/oppia/oppia/wiki/Installing-Oppia-%28'
                'Windows%29')
        sys.exit(1)

    if hasattr(pip, 'main'):
        pip.main(['install', package])
    else:
        import pip._internal
        pip._internal.main(args=[  # pylint: disable=protected-access
            'install', '%s==%s' % (package, version), '--target', install_path])


def main():
    """Install third-party libraries for Oppia."""

    _parser = argparse.ArgumentParser()
    _parser.add_argument(
        '--nojsrepl',
        help='optional; if specified, skips installation of skulpt.',
        action='store_true')
    _parser.add_argument(
        '--noskulpt',
        help='optional; if specified, skips installation of skulpt.',
        action='store_true')

    setup.main()

    # Download and install required JS and zip files.
    print 'Installing third-party JS libraries and zip files.'
    install_third_party.install_third_party_libs()

    curr_dir = os.path.abspath(os.getcwd())
    oppia_tools_dir = os.path.join(curr_dir, '..', 'oppia_tools')
    node_path = os.path.join(oppia_tools_dir, 'node-10.15.3')
    third_party_dir = os.path.join('.', 'third_party')

    # Install third-party node modules needed for the build process.
    subprocess.call(('%s/bin/npm install --only=dev' % node_path).split())
    # This line removes the 'npm ERR! missing:' messages. For reference, see
    # this thread: https://github.com/npm/npm/issues/19393#issuecomment-
    # 374076889.
    subprocess.call(('%s/bin/npm dedupe' % node_path).split())

    # Download and install Skulpt. Skulpt is built using a Python script
    # included within the Skulpt repository (skulpt.py). This script normally
    # requires GitPython, however the patches to it below
    # (with the sed operations) lead to it no longer being required. The Python
    # script is used to avoid having to manually recreate the Skulpt dist build
    # process in install_third_party.py. Note that skulpt.py will issue a
    # warning saying its dist command will not work properly without GitPython,
    # but it does actually work due to the patches.

    # We use parse_known_args() to ignore the extra arguments which maybe used
    # while calling this method from other Python scripts.
    parsed_args, _ = _parser.parse_known_args()
    no_skulpt = parsed_args.nojsrepl or parsed_args.noskulpt

    print 'Checking whether Skulpt is installed in third_party'
    if not os.path.exists(
            os.path.join(
                third_party_dir, 'static/skulpt-0.10.0')) and not no_skulpt:
        if not os.path.exists(os.path.join(oppia_tools_dir, 'skulpt-0.10.0')):
            print 'Downloading Skulpt'
            os.chdir(oppia_tools_dir)
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

            print 'Compiling Skulpt'
            target_stdout = StringIO.StringIO()
            # The Skulpt setup function needs to be tweaked. It fails without
            # certain third party commands. These are only used for unit tests
            # and generating documentation and are not necessary when building
            # Skulpt.
            for line in fileinput.input(
                    files=os.path.join(
                        oppia_tools_dir, 'skulpt-0.10.0/skulpt/skulpt.py')):
                # Inside this loop the STDOUT will be redirected to the file.
                # The comma after each print statement is needed to avoid double
                # line breaks.
                with _redirect_stdout(target_stdout):
                    print line.replace('ret = test()', 'ret = 0'),
                    print line.replace('  doc()', '  pass#doc()'),
                    # This and the next command disable unit and compressed unit
                    # tests for the compressed distribution of Skulpt. These
                    # tests don't work on some Ubuntu environments and cause a
                    # libreadline dependency issue.
                    print line.replace(
                        'ret = os.system(\'{0}', 'ret = 0 #os.system(\'{0}'),
                    print line.replace('ret = rununits(opt=True)', 'ret = 0'),

            temp_file_content = target_stdout.getvalue()
            with open(tmp_file, 'w') as f:
                f.write(temp_file_content)

            shutil.move(
                tmp_file, os.path.join(
                    oppia_tools_dir, 'skulpt-0.10.0/skulpt/skulpt.py'))
            subprocess.call(
                'python $oppia_tools_dir/skulpt-0.10.0/skulpt/skulpt.py dist'
                .split())

            # Return to the Oppia root folder.
            os.chdir(OPPIA_DIR)

            # Move the build directory to the static resources folder.
            os.makedirs(os.path.join(third_party_dir, 'static/skulpt-0.10.0'))
            shutil.copytree(
                os.path.join(oppia_tools_dir, 'skulpt-0.10.0/skulpt/dist/'),
                os.path.join(third_party_dir, 'static/skulpt-0.10.0'))

    print 'Checking if pylint is installed in %s' % oppia_tools_dir
    if not os.path.exists(os.path.join(oppia_tools_dir, 'pylint-1.9.4')):
        print 'Installing Pylint'
        pip_install(
            'pylint', '1.9.4', os.path.join(oppia_tools_dir, 'pylint-1.9.4'))

    print 'Checking if Pillow is installed in %s' % oppia_tools_dir
    if not os.path.exists(os.path.join(oppia_tools_dir, 'Pillow-6.0.0')):
        print 'Installing Pillow'
        pip_install(
            'Pillow', '6.0.0', os.path.join(oppia_tools_dir, 'Pillow-6.0.0'))

    print 'Checking if pylint-quotes is installed in %s' % oppia_tools_dir
    if not os.path.exists(os.path.join(oppia_tools_dir, 'pylint-quotes-0.2.1')):
        print 'Installing pylint-quotes'
        pip_install(
            'pylint-quotes', '0.2.1',
            os.path.join(oppia_tools_dir, 'pylint-quotes-0.2.1'))

    # Install webtest.
    print 'Checking if webtest is installed in %s' % third_party_dir
    if not os.path.exists(os.path.join(oppia_tools_dir, 'webtest-2.0.33')):
        print 'Installing webtest framework'
        pip_install(
            'webtest', '2.0.33',
            os.path.join(oppia_tools_dir, 'webtest-2.0.33'))

    # Install isort.
    print 'Checking if isort is installed in %s' % third_party_dir
    if not os.path.exists(os.path.join(oppia_tools_dir, 'isort-4.3.20')):
        print 'Installing isort'
        pip_install(
            'isort', '4.3.20', os.path.join(oppia_tools_dir, 'isort-4.3.20'))

    # Install pycodestyle.
    print 'Checking if pycodestyle is installed in %s' % third_party_dir
    if not os.path.exists(os.path.join(oppia_tools_dir, 'pycodestyle-2.5.0')):
        print 'Installing pycodestyle'
        pip_install(
            'pycodestyle', '2.5.0',
            os.path.join(oppia_tools_dir, 'pycodestyle-2.5.0'))

    # Install esprima.
    print 'Checking if esprima is installed in %s' % third_party_dir
    if not os.path.exists(os.path.join(oppia_tools_dir, 'esprima-4.0.1')):
        print 'Installing esprima'
        pip_install(
            'esprima', '4.0.1', os.path.join(oppia_tools_dir, 'esprima-4.0.1'))

    # Python API for browsermob-proxy.
    print 'Checking if browsermob-proxy is installed in %s' % oppia_tools_dir
    if not os.path.exists(
            os.path.join(oppia_tools_dir, 'browsermob-proxy-0.8.0')):
        print 'Installing browsermob-proxy'
        pip_install(
            'browsermob-proxy', '0.8.0',
            os.path.join(oppia_tools_dir, 'browsermob-proxy-0.8.0'))

    print 'Checking if selenium is installed in %s' % oppia_tools_dir
    if not os.path.exists(os.path.join(oppia_tools_dir, 'selenium-3.13.0')):
        print 'Installing selenium'
        pip_install(
            'selenium', '3.13.0',
            os.path.join(oppia_tools_dir, 'selenium-3.13.0'))

    print 'Checking if PyGithub is installed in %s' % oppia_tools_dir
    if not os.path.exists(os.path.join(oppia_tools_dir, 'PyGithub-1.43.7')):
        print 'Installing PyGithub'
        pip_install(
            'PyGithub', '1.43.7',
            os.path.join(oppia_tools_dir, 'PyGithub-1.43.7'))

    # Install pre-commit script.
    print 'Installing pre-commit hook for git'
    subprocess.call('python scripts/pre_commit_hook.py --install'.split())

    # Install pre-push script.
    print 'Installing pre-push hook for git'
    subprocess.call('python scripts/pre_push_hook.py --install'.split())


if __name__ == '__main__':
    main()
