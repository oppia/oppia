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
import shutil
import subprocess
import sys

TOOLS_DIR = os.path.join(os.pardir, 'oppia_tools')

# These libraries need to be installed before running or importing any script.

PREREQUISITES = [
    ('pyyaml', '5.1.2', os.path.join(TOOLS_DIR, 'pyyaml-5.1.2')),
    ('future', '0.18.2', os.path.join(
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


def ensure_pip_library_is_installed(package, version, path):
    """Installs the pip library after ensuring its not already installed.

    Args:
        package: str. The package name.
        version: str. The package version.
        path: str or None. The installation path for the package.
    """
    if path is not None:
        python_utils.PRINT(
            'Checking if %s is installed in %s' % (package, path))

        exact_lib_path = os.path.join(path, '%s-%s' % (package, version))
        if not os.path.exists(exact_lib_path):
            python_utils.PRINT('Installing %s' % package)
            install_backend_python_libs.pip_install(
                package, version, exact_lib_path)
    else:
        install_backend_python_libs.pip_install(
            package, version, None)


def ensure_system_python_libraries_are_installed(package, version):
    """Installs the pip library with the corresponding version to the system
    globally. This is necessary because the development application server
    requires certain libraries on the host machine.

    Args:
        package: str. The package name.
        version: str. The package version.
    """
    python_utils.PRINT(
        'Checking if %s is installed.' % (package))
    install_backend_python_libs.pip_install_to_system(package, version)


def main():
    """Install third-party libraries for Oppia."""
    setup.main(args=[])
    setup_gae.main(args=[])
    # These system python libraries are REQUIRED to start the development server
    # and cannot be added to oppia_tools because the dev_appserver python script
    # looks for them in the default system paths when it is run. Therefore, we
    # must install these libraries to the developer's computer.
    system_pip_dependencies = [
        ('enum34', common.ENUM_VERSION),
        ('protobuf', common.PROTOBUF_VERSION)
    ]
    local_pip_dependencies = [
        ('coverage', common.COVERAGE_VERSION, common.OPPIA_TOOLS_DIR),
        ('pylint', common.PYLINT_VERSION, common.OPPIA_TOOLS_DIR),
        ('Pillow', common.PILLOW_VERSION, common.OPPIA_TOOLS_DIR),
        ('pylint-quotes', common.PYLINT_QUOTES_VERSION, common.OPPIA_TOOLS_DIR),
        ('webtest', common.WEBTEST_VERSION, common.OPPIA_TOOLS_DIR),
        ('isort', common.ISORT_VERSION, common.OPPIA_TOOLS_DIR),
        ('pycodestyle', common.PYCODESTYLE_VERSION, common.OPPIA_TOOLS_DIR),
        ('esprima', common.ESPRIMA_VERSION, common.OPPIA_TOOLS_DIR),
        ('PyGithub', common.PYGITHUB_VERSION, common.OPPIA_TOOLS_DIR),
        ('psutil', common.PSUTIL_VERSION, common.OPPIA_TOOLS_DIR),
        ('pip-tools', common.PIP_TOOLS_VERSION, common.OPPIA_TOOLS_DIR),
        ('protobuf', common.PROTOBUF_VERSION, None),
        ('google-auth', common.GOOGLE_AUTH_VERSION, common.OPPIA_TOOLS_DIR),
        (
            'google-api-core', common.GOOGLE_API_CORE_VERSION,
            common.OPPIA_TOOLS_DIR),
        (
            'google-auth-httplib2', common.GOOGLE_AUTH_HTTPLIB2_VERSION,
            common.OPPIA_TOOLS_DIR),
        (
            'google-api-python-client', common.GOOGLE_API_PYTHON_CLIENT_VERSION,
            common.OPPIA_TOOLS_DIR),
        (
            'google-auth-oauthlib', common.GOOGLE_AUTH_OAUTHLIB_VERSION,
            common.OPPIA_TOOLS_DIR),
        (
            'simple-crypt', common.SIMPLE_CRYPT_VERSION,
            common.OPPIA_TOOLS_DIR),
        ('setuptools', common.SETUPTOOLS_VERSION, common.OPPIA_TOOLS_DIR),
    ]

    for package, version, path in local_pip_dependencies:
        ensure_pip_library_is_installed(package, version, path)

    for package, version in system_pip_dependencies:
        ensure_system_python_libraries_are_installed(package, version)
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

    # The following steps solves the problem of multiple google paths confusing
    # the python interpreter. Namely, there are two modules named google/, one
    # that is installed with google cloud libraries and another that comes with
    # the Google Cloud SDK. Python cannot import from both paths simultaneously
    # so we must combine the two modules into one. We solve this by copying the
    # Google Cloud SDK libraries that we need into the correct google
    # module directory in the 'third_party/python_libs' directory.
    python_utils.PRINT(
        'Copying Google Cloud SDK modules to third_party/python_libs...')
    correct_google_path = os.path.join(
        common.THIRD_PARTY_PYTHON_LIBS_DIR, 'google')
    if not os.path.isdir(correct_google_path):
        os.mkdir(correct_google_path)

    if not os.path.isdir(os.path.join(correct_google_path, 'appengine')):
        shutil.copytree(
            os.path.join(
                common.GOOGLE_APP_ENGINE_SDK_HOME, 'google', 'appengine'),
            os.path.join(correct_google_path, 'appengine'))

    if not os.path.isdir(os.path.join(correct_google_path, 'net')):
        shutil.copytree(
            os.path.join(
                common.GOOGLE_APP_ENGINE_SDK_HOME, 'google', 'net'),
            os.path.join(correct_google_path, 'net'))

    if not os.path.isdir(os.path.join(correct_google_path, 'pyglib')):
        shutil.copytree(
            os.path.join(
                common.GOOGLE_APP_ENGINE_SDK_HOME, 'google', 'pyglib'),
            os.path.join(correct_google_path, 'pyglib'))

    # The following for loop populates all of the google modules with
    # the correct __init__.py files if they do not exist. This solves the bug
    # mentioned below where namespace packages sometimes install modules without
    # __init__.py files (python requires modules to have __init__.py files in
    # in order to recognize them as modules and import them):
    # https://github.com/googleapis/python-ndb/issues/518
    python_utils.PRINT(
        'Checking that all google library modules contain __init__.py files...')
    for path_list in os.walk(
            correct_google_path):
        root_path = path_list[0]
        if not root_path.endswith('__pycache__'):
            with python_utils.open_file(
                os.path.join(root_path, '__init__.py'), 'a'):
                # If the file doesn't exist, it is created. If it does exist,
                # this open does nothing.
                pass

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
