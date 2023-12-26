# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

"""Installation script for Oppia third-party libraries."""

from __future__ import annotations

import argparse
import contextlib
import io
import json
import os
import subprocess
import sys
import tarfile
import urllib
import zipfile

from core import utils
from scripts import install_dependencies_json_packages
from typing import Dict, Final, List, Literal, Optional, TypedDict, cast

from . import common
from . import install_python_prod_dependencies

TOOLS_DIR: Final = os.path.join('..', 'oppia_tools')
THIRD_PARTY_DIR: Final = os.path.join('.', 'third_party')
THIRD_PARTY_STATIC_DIR: Final = os.path.join(THIRD_PARTY_DIR, 'static')
DEPENDENCIES_FILE_PATH: Final = os.path.join(os.getcwd(), 'dependencies.json')

# Place to download zip files for temporary storage.
TMP_UNZIP_PATH: Final = os.path.join('.', 'tmp_unzip.zip')


# Check that the current directory is correct.
common.require_cwd_to_be_oppia(allow_deploy_dir=True)

TARGET_DOWNLOAD_DIRS: Final = {
    'proto': THIRD_PARTY_DIR,
    'frontend': THIRD_PARTY_STATIC_DIR,
    'oppiaTools': TOOLS_DIR
}

_DOWNLOAD_FORMAT_ZIP: Final = 'zip'
_DOWNLOAD_FORMAT_TAR: Final = 'tar'
_DOWNLOAD_FORMAT_FILES: Final = 'files'

DownloadFormatType = Literal['zip', 'files', 'tar']


class DownloadFormatToDependenciesKeysDict(TypedDict):
    """TypeDict for download format to dependencies keys dict."""

    mandatory_keys: List[str]
    optional_key_pairs: List[List[str]]


DOWNLOAD_FORMATS_TO_DEPENDENCIES_KEYS: Dict[
    DownloadFormatType, DownloadFormatToDependenciesKeysDict
] = {
    'zip': {
        'mandatory_keys': ['version', 'url', 'downloadFormat'],
        'optional_key_pairs': [
            ['rootDir', 'rootDirPrefix'], ['targetDir', 'targetDirPrefix']]
    },
    'files': {
        'mandatory_keys': [
            'version', 'url', 'files',
            'targetDirPrefix', 'downloadFormat'],
        'optional_key_pairs': []
    },
    'tar': {
        'mandatory_keys': [
            'version', 'url', 'tarRootDirPrefix',
            'targetDirPrefix', 'downloadFormat'],
        'optional_key_pairs': []
    }
}

_PARSER = argparse.ArgumentParser(
    description="""
Installation script for Oppia third-party libraries.
""")


# Here we use total=False since some fields in this dict
# is optional/not required. There are possibilities that some fields
# can be present or not. In some cases, either one of the 2 fields
# should be present. However, we do have validation for this in code over
# here in test_dependencies_syntax() function.
class DependencyDict(TypedDict, total=False):
    """Dict representation of dependency."""

    version: str
    downloadFormat: DownloadFormatType
    url: str
    rootDirPrefix: str
    rootDir: str
    targetDirPrefix: str
    targetDir: str
    tarRootDirPrefix: str
    files: List[str]
    bundle: Dict[str, List[str]]


class DependenciesDict(TypedDict):
    """Dict representation of dependencies."""

    dependencies: Dict[str, Dict[str, DependencyDict]]


def download_files(
    source_url_root: str,
    target_dir: str,
    source_filenames: List[str]
) -> None:
    """Downloads a group of files and saves them to a given directory.

    Each file is downloaded only if it does not already exist.

    Args:
        source_url_root: str. The URL to prepend to all the filenames.
        target_dir: str. The directory to save the files to.
        source_filenames: list(str). Each filename is appended to the
            end of the source_url_root in order to give the URL from which to
            download the file. The downloaded file is then placed in target_dir,
            and retains the same filename.
    """
    assert isinstance(source_filenames, list), (
        'Expected list of filenames, got \'%s\'' % source_filenames)
    common.ensure_directory_exists(target_dir)
    for filename in source_filenames:
        if not os.path.exists(os.path.join(target_dir, filename)):
            print('Downloading file %s to %s ...' % (filename, target_dir))
            common.url_retrieve(
                '%s/%s' % (source_url_root, filename),
                os.path.join(target_dir, filename))

            print('Download of %s succeeded.' % filename)


def download_and_unzip_files(
    source_url: str,
    target_parent_dir: str,
    zip_root_name: str,
    target_root_name: str
) -> None:
    """Downloads a zip file, unzips it, and saves the result in a given dir.

    The download occurs only if the target directory that the zip file unzips
    to does not exist.

    NB: This function assumes that the root level of the zip file has exactly
    one folder.

    Args:
        source_url: str. The URL from which to download the zip file.
        target_parent_dir: str. The directory to save the contents of the zip
            file to.
        zip_root_name: str. The name of the top-level folder in the zip
            directory.
        target_root_name: str. The name that the top-level folder should be
            renamed to in the local directory.
    """
    if not os.path.exists(os.path.join(target_parent_dir, target_root_name)):
        print('Downloading and unzipping file %s to %s ...' % (
            zip_root_name, target_parent_dir))
        common.ensure_directory_exists(target_parent_dir)

        common.url_retrieve(source_url, TMP_UNZIP_PATH)

        try:
            with zipfile.ZipFile(TMP_UNZIP_PATH, 'r') as zfile:
                zfile.extractall(path=target_parent_dir)
            os.remove(TMP_UNZIP_PATH)
        except Exception:
            if os.path.exists(TMP_UNZIP_PATH):
                os.remove(TMP_UNZIP_PATH)

            # Some downloads (like jqueryui-themes) may require a user-agent.
            req = urllib.request.Request(source_url, None, {})
            req.add_header('User-agent', 'python')
            # This is needed to get a seekable filestream that can be used
            # by zipfile.ZipFile.
            file_stream = io.BytesIO(utils.url_open(req).read())
            with zipfile.ZipFile(file_stream, 'r') as zfile:
                zfile.extractall(path=target_parent_dir)

        # Rename the target directory.
        os.rename(
            os.path.join(target_parent_dir, zip_root_name),
            os.path.join(target_parent_dir, target_root_name))

        print('Download of %s succeeded.' % zip_root_name)


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
            tfile.extractall(target_parent_dir)
        os.remove(TMP_UNZIP_PATH)

        # Rename the target directory.
        os.rename(
            os.path.join(target_parent_dir, tar_root_name),
            os.path.join(target_parent_dir, target_root_name))

        print('Download of %s succeeded.' % tar_root_name)


def get_file_contents(filepath: str, mode: utils.TextModeTypes = 'r') -> str:
    """Gets the contents of a file, given a relative filepath from oppia/."""
    with utils.open_file(filepath, mode) as f:
        return f.read()


def return_json(filepath: str) -> DependenciesDict:
    """Return json object when provided url

    Args:
        filepath: str. The path to the json file.

    Returns:
        *. A parsed json object. Actual conversion is different based on input
        to json.loads. More details can be found here:
            https://docs.python.org/3/library/json.html#encoders-and-decoders.
    """
    response = get_file_contents(filepath)
    # Here we use cast because we are narrowing down the type from to
    # DependenciesDict since we know the type of dependencies
    # as it is the content of the file dependencies.json.
    return cast(
        DependenciesDict,
        json.loads(response)
    )


def test_dependencies_syntax(
    dependency_type: DownloadFormatType,
    dependency_dict: DependencyDict
) -> None:
    """This checks syntax of the dependencies.json dependencies.
    Display warning message when there is an error and terminate the program.

    Args:
        dependency_type: DownloadFormatType. Dependency download format.
        dependency_dict: dict. A dependencies.json dependency dict.
    """
    keys = list(dependency_dict.keys())
    mandatory_keys = DOWNLOAD_FORMATS_TO_DEPENDENCIES_KEYS[
        dependency_type]['mandatory_keys']
    # Optional keys requires exactly one member of the pair
    # to be available as a key in the dependency_dict.
    optional_key_pairs = DOWNLOAD_FORMATS_TO_DEPENDENCIES_KEYS[
        dependency_type]['optional_key_pairs']
    for key in mandatory_keys:
        if key not in keys:
            print('------------------------------------------')
            print('There is syntax error in this dependency')
            print(dependency_dict)
            print('This key is missing or misspelled: "%s".' % key)
            print('Exiting')
            sys.exit(1)
    if optional_key_pairs:
        for optional_keys in optional_key_pairs:
            optional_keys_in_dict = [
                key for key in optional_keys if key in keys]
            if len(optional_keys_in_dict) != 1:
                print('------------------------------------------')
                print('There is syntax error in this dependency')
                print(dependency_dict)
                print(
                    'Only one of these keys pair must be used: "%s".'
                    % ', '.join(optional_keys))
                print('Exiting')
                sys.exit(1)

    # Checks the validity of the URL corresponding to the file format.
    dependency_url = dependency_dict['url']
    if '#' in dependency_url:
        dependency_url = dependency_url.rpartition('#')[0]
    is_zip_file_format = dependency_type == _DOWNLOAD_FORMAT_ZIP
    is_tar_file_format = dependency_type == _DOWNLOAD_FORMAT_TAR
    if (dependency_url.endswith('.zip') and not is_zip_file_format or
            is_zip_file_format and not dependency_url.endswith('.zip') or
            dependency_url.endswith('.tar.gz') and not is_tar_file_format or
            is_tar_file_format and not dependency_url.endswith('.tar.gz')):
        print('------------------------------------------')
        print('There is syntax error in this dependency')
        print(dependency_dict)
        print('This url %s is invalid for %s file format.' % (
            dependency_url, dependency_type))
        print('Exiting.')
        sys.exit(1)


def validate_dependencies(filepath: str) -> None:
    """This validates syntax of the dependencies.json

    Args:
        filepath: str. The path to the json file.

    Raises:
        Exception. The 'downloadFormat' not specified.
    """
    dependencies_data = return_json(filepath)
    dependencies = dependencies_data['dependencies']
    for _, dependency in dependencies.items():
        for _, dependency_contents in dependency.items():
            if 'downloadFormat' not in dependency_contents:
                raise Exception(
                    'downloadFormat not specified in %s' %
                    dependency_contents)
            download_format = dependency_contents['downloadFormat']
            test_dependencies_syntax(download_format, dependency_contents)


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
        file_ext = 'tar.gz'
        def download_and_extract(*args: str) -> None:
            """This downloads and extracts the elasticsearch files."""
            download_and_untar_files(*args)
    elif common.is_windows_os():
        file_ext = 'zip'
        def download_and_extract(*args: str) -> None:
            """This downloads and extracts the elasticsearch files."""
            download_and_unzip_files(*args)
    else:
        raise Exception('Unrecognized or unsupported operating system.')

    download_and_extract(
        'https://artifacts.elastic.co/downloads/elasticsearch/' +
        'elasticsearch-%s-%s-x86_64.%s' % (
            common.ELASTICSEARCH_VERSION,
            common.OS_NAME.lower(),
            file_ext
        ),
        TARGET_DOWNLOAD_DIRS['oppiaTools'],
        'elasticsearch-%s' % common.ELASTICSEARCH_VERSION,
        'elasticsearch-%s' % common.ELASTICSEARCH_VERSION
    )
    print('ElasticSearch installed successfully.')


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
            TARGET_DOWNLOAD_DIRS['oppiaTools'],
            'redis-%s' % common.REDIS_CLI_VERSION,
            'redis-cli-%s' % common.REDIS_CLI_VERSION)

        # Temporarily change the working directory to redis-cli-6.0.6 so we can
        # build the source code.
        with common.CD(
            os.path.join(
                TARGET_DOWNLOAD_DIRS['oppiaTools'],
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


def main(args: Optional[List[str]] = None) -> None:
    """Installs all the third party libraries."""
    if common.is_windows_os():
        # The redis cli is not compatible with Windows machines.
        raise Exception(
            'The redis command line interface will not be installed because '
            'your machine is on the Windows operating system.')
    unused_parsed_args = _PARSER.parse_args(args=args)
    install_python_prod_dependencies.main()
    install_dependencies_json_packages.download_all_dependencies(
        DEPENDENCIES_FILE_PATH)
    install_redis_cli()
    install_elasticsearch_dev_server()


# The 'no coverage' pragma is used as this line is un-testable. This is because
# it will only be called when install_third_party.py is used as a script.
if __name__ == '__main__': # pragma: no cover
    main()
