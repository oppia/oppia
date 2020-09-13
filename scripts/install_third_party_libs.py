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
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import argparse
import os
import subprocess
import sys

TOOLS_DIR = os.path.join(os.pardir, 'oppia_tools')

# These libraries need to be installed before running or importing any script.

PREREQUISITES = [
    ('pyyaml', '5.1.2', os.path.join(TOOLS_DIR, 'pyyaml-5.1.2')),
    ('future', '0.17.1', os.path.join(
        'third_party', 'python_libs')),
]

for package_name, version_number, target_path in PREREQUISITES:
    if not os.path.exists(target_path):
        command_text = [
            sys.executable, '-m', 'pip', 'install', '%s==%s'
            % (package_name, version_number), '--target', target_path]
        uextention_text = ['--user', '--prefix=', '--system']
        current_process = subprocess.Popen(
            command_text, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        output_stderr = current_process.communicate()[1]
        if 'can\'t combine user with prefix' in output_stderr:
            subprocess.check_call(command_text + uextention_text)


import python_utils  # isort:skip   pylint: disable=wrong-import-position, wrong-import-order

from . import common  # isort:skip  pylint: disable=wrong-import-position, wrong-import-order
from . import install_backend_python_libs  # isort:skip  pylint: disable=wrong-import-position, wrong-import-order
from . import install_third_party  # isort:skip  pylint: disable=wrong-import-position, wrong-import-order
from . import pre_commit_hook  # isort:skip  pylint: disable=wrong-import-position, wrong-import-order
from . import pre_push_hook  # isort:skip  pylint: disable=wrong-import-position, wrong-import-order
from . import setup  # isort:skip  pylint: disable=wrong-import-position, wrong-import-order
from . import setup_gae  # isort:skip  pylint: disable=wrong-import-position, wrong-import-order

_PARSER = argparse.ArgumentParser(
    description="""
Installation script for Oppia third-party libraries.
""")

PYLINT_CONFIGPARSER_FILEPATH = os.path.join(
    common.OPPIA_TOOLS_DIR, 'pylint-%s' % common.PYLINT_VERSION,
    'configparser.py')
PQ_CONFIGPARSER_FILEPATH = os.path.join(
    common.OPPIA_TOOLS_DIR, 'pylint-quotes-%s' % common.PYLINT_QUOTES_VERSION,
    'configparser.py')

# Download locations for prototool binary.
PROTOTOOL_LINUX_BIN_URL = (
    'https://github.com/uber/prototool/releases/download/v1.10.0/'
    'prototool-Linux-x86_64')

PROTOTOOL_DARWIN_BIN_URL = (
    'https://github.com/uber/prototool/releases/download/v1.10.0/'
    'prototool-Darwin-x86_64')

# Path of the prototool executable.
PROTOTOOL_DIR = os.path.join(
    common.OPPIA_TOOLS_DIR, 'prototool-%s' % common.PROTOTOOL_VERSION)
PROTOTOOL_BIN_PATH = os.path.join(PROTOTOOL_DIR, 'prototool')
# Path of files which needs to be compiled by protobuf.
PROTO_FILES_PATHS = [
    os.path.join(common.THIRD_PARTY_DIR, 'oppia-ml-proto-0.0.0'),
    os.path.join('core', 'domain', 'proto')]


def tweak_yarn_executable():
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


def get_yarn_command():
    """Get the executable file for yarn."""
    if common.is_windows_os():
        return 'yarn.cmd'
    return 'yarn'


def install_prototool():
    """Installs prototool for Linux or Darwin, depending upon the platform."""
    if os.path.exists(PROTOTOOL_BIN_PATH):
        return

    prototool_url = PROTOTOOL_LINUX_BIN_URL
    if common.is_mac_os():
        prototool_url = PROTOTOOL_DARWIN_BIN_URL

    common.ensure_directory_exists(PROTOTOOL_DIR)
    python_utils.url_retrieve(prototool_url, filename=PROTOTOOL_BIN_PATH)
    common.recursive_chmod(PROTOTOOL_BIN_PATH, 0o744)


def compile_protobuf_files(proto_files_paths):
    """Compiles protobuf files using prototool.

    Raises:
        Exception. If there is any error in compiling the proto files.
    """
    for path in proto_files_paths:
        command = [
            PROTOTOOL_BIN_PATH, 'generate', path]
        process = subprocess.Popen(
            command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        stdout, stderr = process.communicate()
        if process.returncode == 0:
            python_utils.PRINT(stdout)
        else:
            python_utils.PRINT(stderr)
            raise Exception('Error compiling proto files at %s' % path)


def ensure_pip_library_is_installed(package, version, path):
    """Installs the pip library after ensuring its not already installed.

    Args:
        package: str. The package name.
        version: str. The package version.
        path: str. The installation path for the package.
    """
    python_utils.PRINT(
        'Checking if %s is installed in %s' % (package, path))

    exact_lib_path = os.path.join(path, '%s-%s' % (package, version))
    if not os.path.exists(exact_lib_path):
        python_utils.PRINT('Installing %s' % package)
        install_backend_python_libs.pip_install(
            package, version, exact_lib_path)


def main():
    """Install third-party libraries for Oppia."""
    setup.main(args=[])
    setup_gae.main(args=[])
    pip_dependencies = [
        ('coverage', common.COVERAGE_VERSION, common.OPPIA_TOOLS_DIR),
        ('pylint', common.PYLINT_VERSION, common.OPPIA_TOOLS_DIR),
        ('Pillow', common.PILLOW_VERSION, common.OPPIA_TOOLS_DIR),
        ('pylint-quotes', common.PYLINT_QUOTES_VERSION, common.OPPIA_TOOLS_DIR),
        ('webtest', common.WEBTEST_VERSION, common.OPPIA_TOOLS_DIR),
        ('isort', common.ISORT_VERSION, common.OPPIA_TOOLS_DIR),
        ('pycodestyle', common.PYCODESTYLE_VERSION, common.OPPIA_TOOLS_DIR),
        ('esprima', common.ESPRIMA_VERSION, common.OPPIA_TOOLS_DIR),
        ('PyGithub', common.PYGITHUB_VERSION, common.OPPIA_TOOLS_DIR),
        ('protobuf', common.PROTOBUF_VERSION, common.OPPIA_TOOLS_DIR),
        ('psutil', common.PSUTIL_VERSION, common.OPPIA_TOOLS_DIR),
        ('pip-tools', common.PIP_TOOLS_VERSION, common.OPPIA_TOOLS_DIR)
    ]

    for package, version, path in pip_dependencies:
        ensure_pip_library_is_installed(package, version, path)

    # Do a little surgery on configparser in pylint-1.9.4 to remove dependency
    # on ConverterMapping, which is not implemented in some Python
    # distributions.
    pylint_newlines = []
    with python_utils.open_file(PYLINT_CONFIGPARSER_FILEPATH, 'r') as f:
        for line in f.readlines():
            if line.strip() == 'ConverterMapping,':
                continue
            if line.strip().endswith('"ConverterMapping",'):
                pylint_newlines.append(
                    line[:line.find('"ConverterMapping"')] + '\n')
            else:
                pylint_newlines.append(line)
    with python_utils.open_file(PYLINT_CONFIGPARSER_FILEPATH, 'w+') as f:
        f.writelines(pylint_newlines)

    # Do similar surgery on configparser in pylint-quotes-0.1.8 to remove
    # dependency on ConverterMapping.
    pq_newlines = []
    with python_utils.open_file(PQ_CONFIGPARSER_FILEPATH, 'r') as f:
        for line in f.readlines():
            if line.strip() == 'ConverterMapping,':
                continue
            if line.strip() == '"ConverterMapping",':
                continue
            pq_newlines.append(line)
    with python_utils.open_file(PQ_CONFIGPARSER_FILEPATH, 'w+') as f:
        f.writelines(pq_newlines)

    # Download and install required JS and zip files.
    python_utils.PRINT('Installing third-party JS libraries and zip files.')
    install_third_party.main(args=[])

    # Compile protobuf files.
    python_utils.PRINT('Installing Prototool.')
    install_prototool()
    python_utils.PRINT('Compiling protobuf files.')
    compile_protobuf_files(PROTO_FILES_PATHS)

    if common.is_windows_os():
        tweak_yarn_executable()

    # Install third-party node modules needed for the build process.
    subprocess.check_call([get_yarn_command(), 'install', '--pure-lockfile'])

    # Install pre-commit script.
    python_utils.PRINT('Installing pre-commit hook for git')
    pre_commit_hook.main(args=['--install'])

    # TODO(#8112): Once pre_commit_linter is working correctly, this
    # condition should be removed.
    if not common.is_windows_os():
        # Install pre-push script.
        python_utils.PRINT('Installing pre-push hook for git')
        pre_push_hook.main(args=['--install'])


# The 'no coverage' pragma is used as this line is un-testable. This is because
# it will only be called when install_third_party_libs.py is used as a script.
if __name__ == '__main__': # pragma: no cover
    main()
