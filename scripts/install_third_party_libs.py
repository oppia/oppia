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
import pathlib
import shutil
import subprocess
import zipfile

from core import feconf
from scripts import install_python_dev_dependencies

from typing import Final, List

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

# Download locations for buf binary.
BUF_BASE_URL: Final = (
    'https://github.com/bufbuild/buf/releases/download/v0.29.0/')

BUF_LINUX_FILES: Final = [
    'buf-Linux-x86_64', 'protoc-gen-buf-check-lint-Linux-x86_64',
    'protoc-gen-buf-check-breaking-Linux-x86_64']
BUF_DARWIN_FILES: Final = [
    'buf-Darwin-x86_64', 'protoc-gen-buf-check-lint-Darwin-x86_64',
    'protoc-gen-buf-check-breaking-Darwin-x86_64']

# Download URL of protoc compiler.
PROTOC_URL: Final = (
    'https://github.com/protocolbuffers/protobuf/releases/download/v%s' %
    common.PROTOC_VERSION)
PROTOC_LINUX_FILE: Final = 'protoc-%s-linux-x86_64.zip' % (
    common.PROTOC_VERSION
)
PROTOC_DARWIN_FILE: Final = 'protoc-%s-osx-x86_64.zip' % (
    common.PROTOC_VERSION
)

# Path of the buf executable.
BUF_DIR: Final = os.path.join(
    common.OPPIA_TOOLS_DIR, 'buf-%s' % common.BUF_VERSION)
PROTOC_DIR: Final = os.path.join(BUF_DIR, 'protoc')
# Path of files which needs to be compiled by protobuf.
PROTO_FILES_PATHS: Final = [
    os.path.join(common.THIRD_PARTY_DIR, 'oppia-ml-proto-0.0.0')]
# Path to typescript plugin required to compile ts compatible files from proto.
PROTOC_GEN_TS_PATH: Final = os.path.join(
    common.NODE_MODULES_PATH, 'protoc-gen-ts'
)


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


def install_buf_and_protoc() -> None:
    """Installs buf and protoc for Linux or Darwin, depending upon the
    platform.
    """
    buf_files = BUF_DARWIN_FILES if common.is_mac_os() else BUF_LINUX_FILES
    protoc_file = (
        PROTOC_DARWIN_FILE if common.is_mac_os() else PROTOC_LINUX_FILE)
    buf_path = os.path.join(BUF_DIR, buf_files[0])
    protoc_path = os.path.join(PROTOC_DIR, 'bin', 'protoc')

    if os.path.isfile(buf_path) and os.path.isfile(protoc_path):
        return

    common.ensure_directory_exists(BUF_DIR)
    for bin_file in buf_files:
        common.url_retrieve('%s/%s' % (
            BUF_BASE_URL, bin_file), os.path.join(BUF_DIR, bin_file))
    common.url_retrieve('%s/%s' % (
        PROTOC_URL, protoc_file), os.path.join(BUF_DIR, protoc_file))
    try:
        with zipfile.ZipFile(os.path.join(BUF_DIR, protoc_file), 'r') as zfile:
            zfile.extractall(path=PROTOC_DIR)
        os.remove(os.path.join(BUF_DIR, protoc_file))
    except Exception as e:
        raise Exception('Error installing protoc binary') from e
    common.recursive_chmod(buf_path, 0o744)
    common.recursive_chmod(protoc_path, 0o744)


def compile_protobuf_files(proto_files_paths: List[str]) -> None:
    """Compiles protobuf files using buf.

    Raises:
        Exception. If there is any error in compiling the proto files.
    """
    proto_env = os.environ.copy()
    proto_env['PATH'] += '%s%s/bin' % (os.pathsep, PROTOC_DIR)
    proto_env['PATH'] += '%s%s/bin' % (os.pathsep, PROTOC_GEN_TS_PATH)
    buf_path = os.path.join(
        BUF_DIR,
        BUF_DARWIN_FILES[0] if common.is_mac_os() else BUF_LINUX_FILES[0])
    for path in proto_files_paths:
        command = [
            buf_path, 'generate', path]
        process = subprocess.Popen(
            command, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
            env=proto_env)
        stdout, stderr = process.communicate()
        if process.returncode == 0:
            print(stdout)
        else:
            print(stderr)
            raise Exception('Error compiling proto files at %s' % path)

    # Since there is no simple configuration for imports when using protobuf to
    # generate Python files we need to manually fix the imports.
    # See: https://github.com/protocolbuffers/protobuf/issues/1491
    compiled_protobuf_dir = (
        pathlib.Path(os.path.join(common.CURR_DIR, 'proto_files')))
    for p in compiled_protobuf_dir.iterdir():
        if p.suffix == '.py':
            common.inplace_replace_file(
                p.absolute().as_posix(),
                r'^import (\w*_pb2 as)', r'from proto_files import \1')


def main() -> None:
    """Install third-party libraries for Oppia."""
    if feconf.OPPIA_IS_DOCKERIZED:
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
    print(
        'Checking that all google library modules contain __init__.py files...')
    for path_list in os.walk(correct_google_path):
        root_path = path_list[0]
        if not root_path.endswith('__pycache__'):
            with utils.open_file(
                os.path.join(root_path, '__init__.py'), 'a'):
                # If the file doesn't exist, it is created. If it does exist,
                # this open does nothing.
                pass

    if common.is_windows_os():
        tweak_yarn_executable()

    # Install third-party node modules needed for the build process.
    subprocess.check_call([get_yarn_command(), 'install', '--pure-lockfile'])

    # Compile protobuf files.
    print('Installing buf and protoc binary.')
    install_buf_and_protoc()
    print('Compiling protobuf files.')
    compile_protobuf_files(PROTO_FILES_PATHS)

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
