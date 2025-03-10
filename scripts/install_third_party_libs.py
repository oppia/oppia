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

"""Setup script for Oppia developers.

This setup script does three things:

1. It installs developer dependencies and tools, starting with Python dev
   dependencies at the top, and then all tools in the ../oppia_tools directory.

2. It activates the pre-commit and pre-push hooks.

3. Finally, it installs third-party dependencies that are needed in production
   to the third_party/ and node_modules/ directories.
"""

from __future__ import annotations

import argparse
import contextlib
import os
import pathlib
import shutil
import subprocess
import sys
import tarfile

from core import feconf

from typing import Final

from scripts import install_python_dev_dependencies  # isort:skip   pylint: disable=wrong-import-position, wrong-import-order

if not feconf.OPPIA_IS_DOCKERIZED:
    install_python_dev_dependencies.main(['--assert_compiled'])
    from . import pre_commit_hook  # isort:skip  pylint: disable=wrong-import-position, wrong-import-order
    from . import pre_push_hook  # isort:skip  pylint: disable=wrong-import-position, wrong-import-order

from . import clean  # isort:skip  pylint: disable=wrong-import-position, wrong-import-order
from . import common  # isort:skip  pylint: disable=wrong-import-position, wrong-import-order

from core import utils  # isort:skip   pylint: disable=wrong-import-position, wrong-import-order
from scripts import install_dependencies_json_packages  # isort:skip   pylint: disable=wrong-import-position, wrong-import-order
from scripts import install_python_prod_dependencies  # isort:skip   pylint: disable=wrong-import-position, wrong-import-order

# Place to download zip files for temporary storage.
TMP_UNZIP_PATH: Final = os.path.join('.', 'tmp_unzip.zip')

_PARSER: Final = argparse.ArgumentParser(
    description='Installation script for Oppia third-party libraries.')


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


def clean_pyc_files() -> None:
    """Cleans up old *.pyc files."""
    for directory, _, files in os.walk('.'):
        for file_name in files:
            if file_name.endswith('.pyc'):
                filepath = os.path.join(directory, file_name)
                os.remove(filepath)


def test_python_version() -> None:
    """Checks whether the Python version matches an expected prefix.

    Raises:
        Exception. The Python version does not match the expected prefix.
    """
    running_python_version = '{0[0]}.{0[1]}.{0[2]}'.format(sys.version_info)
    if running_python_version != '3.9.20':
        print('Please use Python 3.9.20. Exiting...')
        raise Exception('No suitable python version found.')


def download_and_install_package(url_to_retrieve: str, filename: str) -> None:
    """Downloads and installs package in Oppia tools directory.

    Args:
        url_to_retrieve: string. The url from which package is to be
            downloaded.
        filename: string. The name of the tar file.
    """
    common.url_retrieve(url_to_retrieve, filename)
    tar = tarfile.open(name=filename)
    # TODO(#21906): Add parameter filter = 'data'
    # after updating to Python 3.12.
    tar.extractall(path=common.OPPIA_TOOLS_DIR)
    tar.close()
    rename_yarn_folder(filename, common.OPPIA_TOOLS_DIR)
    os.remove(filename)


def rename_yarn_folder(filename: str, path: str) -> None:
    """Removes the `v` from the yarn folder name.

    Args:
        filename: string. The name of the tar file.
        path: string. The path of the yarn file.
    """
    if 'yarn' in filename:
        old_name = filename.split('.tar.gz')[0]
        new_name = ''.join(old_name.split('v'))
        os.rename(path + '/' + old_name, path + '/' + new_name)


def install_node() -> None:
    """Download and install node to Oppia tools directory."""
    if not os.path.exists(common.NODE_PATH):
        print(
            'Node package not found in Oppia tools directory. '
            'Installing Node.js...')

        outfile_name = 'node-download'
        if common.is_x64_architecture():
            if common.is_mac_os():
                node_file_name = 'node-v%s-darwin-x64' % common.NODE_VERSION
            elif common.is_linux_os():
                node_file_name = 'node-v%s-linux-x64' % common.NODE_VERSION
            else:
                raise Exception('System\'s Operating System is not compatible.')
        else:
            node_file_name = 'node-v%s' % common.NODE_VERSION

        download_and_install_package(
            'https://nodejs.org/dist/v%s/%s.tar.gz' % (
                common.NODE_VERSION, node_file_name),
            outfile_name)
        os.rename(
            os.path.join(common.OPPIA_TOOLS_DIR, node_file_name),
            common.NODE_PATH)
        if node_file_name == 'node-v%s' % common.NODE_VERSION:
            with common.CD(common.NODE_PATH):
                subprocess.check_call(['./configure'])
                subprocess.check_call(['make'])

    print('Node is installed.')


def install_yarn() -> None:
    """Download and install yarn to Oppia tools directory."""
    if not os.path.exists(common.YARN_PATH):
        print(
            'Yarn package not found in Oppia tools directory. '
            'Installing yarn...')
        print('Removing package-lock.json')
        clean.delete_file('package-lock.json')

        yarn_file_name = 'yarn-v%s.tar.gz' % common.YARN_VERSION
        download_and_install_package(
            'https://github.com/yarnpkg/yarn/releases/download/v%s/%s'
            % (common.YARN_VERSION, yarn_file_name), yarn_file_name)

    print('Yarn is installed.')


def install_gcloud_sdk() -> None:
    """Download and install Google Cloud SDK to Oppia tools directory."""
    if not os.path.exists(common.GOOGLE_CLOUD_SDK_HOME):
        print('Google Cloud SDK package not found in Oppia tools directory.')
        print('Downloading Google Cloud SDK (this may take a little while)...')
        os.makedirs(common.GOOGLE_CLOUD_SDK_HOME)
        try:
            # If the google cloud version is updated here, the corresponding
            # lines (GAE_DIR and GCLOUD_PATH) in assets/release_constants.json
            # should also be updated.
            common.url_retrieve(
                'https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/'
                'google-cloud-sdk-500.0.0-linux-x86_64.tar.gz',
                'gcloud-sdk.tar.gz')
        except Exception as e:
            print('Error downloading Google Cloud SDK. Exiting.')
            raise Exception('Error downloading Google Cloud SDK.') from e

        print('Download complete. Installing Google Cloud SDK...')
        tar = tarfile.open(name='gcloud-sdk.tar.gz')
        # TODO(#21906): Add parameter filter = 'data'
        # after updating to Python 3.12.
        tar.extractall(path=os.path.join(
            common.OPPIA_TOOLS_DIR, 'google-cloud-sdk-500.0.0/'))
        tar.close()

        os.remove('gcloud-sdk.tar.gz')

        # Install specific google cloud components for the Google Cloud SDK. The
        # --quiet flag specifically tells the gcloud program to autofill all
        # prompts with default values. In this case, that means accepting all
        # installations of gcloud packages.
        subprocess.run([
            common.GCLOUD_PATH, 'components', 'install', 'beta',
            'cloud-datastore-emulator', 'app-engine-python',
            'app-engine-python-extras', '--quiet',
        ], check=True)

        # Address the problem of multiple google paths confusing the python
        # interpreter. Namely, there are two modules named google/, one that is
        # installed with google cloud libraries and another that comes with the
        # Google Cloud SDK. Python cannot import from both paths simultaneously
        # so we must combine the two modules into one. We solve this by copying
        # the Google Cloud SDK libraries that we need into the correct google
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

        # Populate all google modules with the correct __init__.py files if
        # they do not exist. This solves the bug mentioned below where
        # namespace packages sometimes install modules without __init__.py
        # files (python requires modules to have __init__.py files in in order
        # to recognize them as modules and import them):
        # https://github.com/googleapis/python-ndb/issues/518
        make_google_module_importable_by_python(correct_google_path)

    sys.path.append('.')
    sys.path.append(common.GOOGLE_APP_ENGINE_SDK_HOME)

    print('Google Cloud SDK is installed.')


def download_and_untar_files(
    source_url: str,
    target_parent_dir: str,
    tar_root_name: str,
    target_root_name: str
) -> None:
    """Downloads a tar file, untars it, and saves the result in a given dir.

    The download occurs only if the target directory that the tar file untars
    to does not exist.

    NB: This function assumes that the root level of the tar file has exactly
    one folder.

    Args:
        source_url: str. The URL from which to download the tar file.
        target_parent_dir: str. The directory to save the contents of the tar
            file to.
        tar_root_name: str. The name of the top-level folder in the tar
            directory.
        target_root_name: str. The name that the top-level folder should be
            renamed to in the local directory.
    """
    if not os.path.exists(os.path.join(target_parent_dir, target_root_name)):
        print('Downloading and untarring file %s to %s ...' % (
            tar_root_name, target_parent_dir))
        common.ensure_directory_exists(target_parent_dir)

        common.url_retrieve(source_url, TMP_UNZIP_PATH)
        with contextlib.closing(tarfile.open(
            name=TMP_UNZIP_PATH, mode='r:gz')) as tfile:
            # TODO(#21906): Add parameter filter = 'data'
            # after updating to Python 3.12.
            tfile.extractall(target_parent_dir)
        os.remove(TMP_UNZIP_PATH)

        # Rename the target directory.
        os.rename(
            os.path.join(target_parent_dir, tar_root_name),
            os.path.join(target_parent_dir, target_root_name))

        print('Download of %s succeeded.' % tar_root_name)


def install_redis_cli() -> None:
    """This installs the redis-cli to the local oppia third_party directory so
    that development servers and backend tests can make use of a local redis
    cache. Redis-cli installed here (redis-cli-6.0.6) is different from the
    redis package installed in dependencies.json (redis-3.5.3). The redis-3.5.3
    package detailed in dependencies.json is the Python library that allows
    users to communicate with any Redis cache using Python. The redis-cli-6.0.6
    package installed in this function contains C++ scripts for the redis-cli
    and redis-server programs detailed below.

    The redis-cli program is the command line interface that serves up an
    interpreter that allows users to connect to a redis database cache and
    query the cache using the Redis CLI API. It also contains functionality to
    shutdown the redis server. We need to install redis-cli separately from the
    default installation of backend libraries since it is a system program and
    we need to build the program files after the library is untarred.

    The redis-server starts a Redis database on the local machine that can be
    queried using either the Python redis library or the redis-cli interpreter.
    """
    try:
        subprocess.call(
            [common.REDIS_SERVER_PATH, '--version'],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE)
        print('Redis-cli is already installed.')
    except OSError:
        # The redis-cli is not installed, run the script to install it.
        # NOTE: We do the installation here since we need to use make.
        print('Installing redis-cli...')

        download_and_untar_files(
            ('https://download.redis.io/releases/redis-%s.tar.gz') %
            common.REDIS_CLI_VERSION,
            common.OPPIA_TOOLS_DIR,
            'redis-%s' % common.REDIS_CLI_VERSION,
            'redis-cli-%s' % common.REDIS_CLI_VERSION)

        # Temporarily change the working directory to redis-cli-6.0.6 so we can
        # build the source code.
        with common.CD(
            os.path.join(
                common.OPPIA_TOOLS_DIR,
                'redis-cli-%s' % common.REDIS_CLI_VERSION)):
            # Build the scripts necessary to start the redis server.
            # The make command only builds the C++ files in the src/ folder
            # without modifying anything outside of the oppia root directory.
            # It will build the redis-cli and redis-server files so that we can
            # run the server from inside the oppia folder by executing the
            # script src/redis-cli and src/redis-server.
            subprocess.call(['make'])

        # Make the scripts executable.
        subprocess.call([
            'chmod', '+x', common.REDIS_SERVER_PATH])
        subprocess.call([
            'chmod', '+x', common.REDIS_CLI_PATH])

        print('Redis-cli installed successfully.')


def install_elasticsearch_dev_server() -> None:
    """This installs a local ElasticSearch server to the oppia_tools
    directory to be used by development servers and backend tests.
    """
    try:
        subprocess.call(
            ['%s/bin/elasticsearch' % common.ES_PATH, '--version'],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            # Set the minimum heap size to 100 MB and maximum to 500 MB.
            env={'ES_JAVA_OPTS': '-Xms100m -Xmx500m'}
        )
        print('ElasticSearch is already installed.')
        return
    except OSError:
        print('Installing ElasticSearch...')

    if common.is_mac_os() or common.is_linux_os():
        download_and_untar_files(
            'https://artifacts.elastic.co/downloads/elasticsearch/' +
            'elasticsearch-%s-%s-x86_64.tar.gz' % (
                common.ELASTICSEARCH_VERSION,
                common.OS_NAME.lower()
            ),
            common.OPPIA_TOOLS_DIR,
            'elasticsearch-%s' % common.ELASTICSEARCH_VERSION,
            'elasticsearch-%s' % common.ELASTICSEARCH_VERSION
        )

    else:
        raise Exception('Unrecognized or unsupported operating system.')

    print('ElasticSearch installed successfully.')


def main() -> None:
    """Set up GAE and install third-party libraries for Oppia."""
    print('Running install_third_party_libs script...')

    if feconf.OPPIA_IS_DOCKERIZED:
        make_google_module_importable_by_python(
            google_module_path='/app/oppia/third_party/python_libs/google')
        return

    if common.is_windows_os():
        raise Exception(
            'Installation of Oppia is not supported on Windows OS. Please use '
            'the Windows Subsystem for Linux (WSL) instead.')
    common.require_cwd_to_be_oppia()
    test_python_version()
    clean_pyc_files()

    # Create OPPIA_TOOLS_DIR and THIRD_PARTY_DIR if either doesn't exist. Note
    # that THIRD_PARTY_DIR is needed by install_gcloud_sdk().
    pathlib.Path(common.OPPIA_TOOLS_DIR).mkdir(exist_ok=True)
    pathlib.Path(common.THIRD_PARTY_DIR).mkdir(exist_ok=True)

    install_node()
    install_yarn()
    install_redis_cli()
    install_elasticsearch_dev_server()

    # Install pre-commit and pre-push scripts.
    common.print_each_string_after_two_new_lines([
        'Installing pre-commit hook for git'])
    pre_commit_hook.main(args=['--install'])
    print('Installing pre-push hook for git')
    pre_push_hook.main(args=['--install'])

    # Install third-party libraries in third_party/ directory. Files in this
    # directory will be deployed to production.
    common.print_each_string_after_two_new_lines([
        'Installing third-party Python and JS libs in third_party directory'])
    common.create_readme(
        common.THIRD_PARTY_DIR,
        'This folder contains third-party libraries used in Oppia codebase.\n'
        'You can regenerate this folder by deleting it and then running '
        'the start.py script.\n')
    install_python_prod_dependencies.main()
    install_dependencies_json_packages.main()

    # The install_gcloud_sdk() function needs the Python third-party libs
    # "google" folder to exist first, so we only do the installation here after
    # the Python dependencies are installed.
    install_gcloud_sdk()

    # Install third-party node modules in node_modules/ directory, to be used
    # when generating files in the build process.
    common.print_each_string_after_two_new_lines([
        'Installing third-party Node modules in node_modules directory'])
    pathlib.Path(common.NODE_MODULES_PATH).mkdir(exist_ok=True)
    common.recursive_chown(common.NODE_MODULES_PATH, os.getuid(), -1)
    common.recursive_chmod(common.NODE_MODULES_PATH, 0o744)
    common.create_readme(
        common.NODE_MODULES_PATH,
        'This folder contains node utilities used in Oppia codebase.\n'
        'You can regenerate this folder by deleting it and then running '
        'the start.py script.\n')
    subprocess.check_call(['yarn', 'install', '--pure-lockfile'])


# The 'no coverage' pragma is used as this line is un-testable. This is because
# it will only be called when this Python file is used as a script.
if __name__ == '__main__': # pragma: no cover
    main()
