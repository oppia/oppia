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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import argparse
import contextlib
import json
import os
import subprocess
import sys
import tarfile
import zipfile

import python_utils

from . import common

TOOLS_DIR = os.path.join('..', 'oppia_tools')
THIRD_PARTY_DIR = os.path.join('.', 'third_party')
THIRD_PARTY_STATIC_DIR = os.path.join(THIRD_PARTY_DIR, 'static')
MANIFEST_FILE_PATH = os.path.join(os.getcwd(), 'manifest.json')

# Place to download zip files for temporary storage.
TMP_UNZIP_PATH = os.path.join('.', 'tmp_unzip.zip')


# Check that the current directory is correct.
common.require_cwd_to_be_oppia(allow_deploy_dir=True)

TARGET_DOWNLOAD_DIRS = {
    'frontend': THIRD_PARTY_STATIC_DIR,
    'backend': THIRD_PARTY_DIR,
    'oppiaTools': TOOLS_DIR
}

_DOWNLOAD_FORMAT_ZIP = 'zip'
_DOWNLOAD_FORMAT_TAR = 'tar'
_DOWNLOAD_FORMAT_FILES = 'files'

DOWNLOAD_FORMATS_TO_MANIFEST_KEYS = {
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


def download_files(source_url_root, target_dir, source_filenames):
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
            python_utils.PRINT(
                'Downloading file %s to %s ...' % (filename, target_dir))
            python_utils.url_retrieve(
                '%s/%s' % (source_url_root, filename),
                filename=os.path.join(target_dir, filename))

            python_utils.PRINT('Download of %s succeeded.' % filename)


def download_and_unzip_files(
        source_url, target_parent_dir, zip_root_name, target_root_name):
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
        python_utils.PRINT('Downloading and unzipping file %s to %s ...' % (
            zip_root_name, target_parent_dir))
        common.ensure_directory_exists(target_parent_dir)

        python_utils.url_retrieve(source_url, filename=TMP_UNZIP_PATH)

        try:
            with zipfile.ZipFile(TMP_UNZIP_PATH, 'r') as zfile:
                zfile.extractall(path=target_parent_dir)
            os.remove(TMP_UNZIP_PATH)
        except Exception:
            if os.path.exists(TMP_UNZIP_PATH):
                os.remove(TMP_UNZIP_PATH)

            # Some downloads (like jqueryui-themes) may require a user-agent.
            req = python_utils.url_request(source_url, None, {})
            req.add_header('User-agent', 'python')
            # This is needed to get a seekable filestream that can be used
            # by zipfile.ZipFile.
            file_stream = python_utils.string_io(
                buffer_value=python_utils.url_open(req).read())
            with zipfile.ZipFile(file_stream, 'r') as zfile:
                zfile.extractall(path=target_parent_dir)

        # Rename the target directory.
        os.rename(
            os.path.join(target_parent_dir, zip_root_name),
            os.path.join(target_parent_dir, target_root_name))

        python_utils.PRINT('Download of %s succeeded.' % zip_root_name)


def download_and_untar_files(
        source_url, target_parent_dir, tar_root_name, target_root_name):
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
        python_utils.PRINT('Downloading and untarring file %s to %s ...' % (
            tar_root_name, target_parent_dir))
        common.ensure_directory_exists(target_parent_dir)

        python_utils.url_retrieve(source_url, filename=TMP_UNZIP_PATH)
        with contextlib.closing(tarfile.open(
            name=TMP_UNZIP_PATH, mode='r:gz')) as tfile:
            tfile.extractall(target_parent_dir)
        os.remove(TMP_UNZIP_PATH)

        # Rename the target directory.
        os.rename(
            os.path.join(target_parent_dir, tar_root_name),
            os.path.join(target_parent_dir, target_root_name))

        python_utils.PRINT('Download of %s succeeded.' % tar_root_name)


def get_file_contents(filepath, mode='r'):
    """Gets the contents of a file, given a relative filepath from oppia/."""
    with python_utils.open_file(filepath, mode) as f:
        return f.read().decode('utf-8')


def return_json(filepath):
    """Return json object when provided url

    Args:
        filepath: str. The path to the json file.

    Returns:
        *. A parsed json object. Actual conversion is different based on input
        to json.loads. More details can be found here:
            https://docs.python.org/3/library/json.html#encoders-and-decoders
    """
    response = get_file_contents(filepath)
    return json.loads(response)


def test_manifest_syntax(dependency_type, dependency_dict):
    """This checks syntax of the manifest.json dependencies.
    Display warning message when there is an error and terminate the program.

    Args:
        dependency_type: str. Dependency download format.
        dependency_dict: dict. A manifest.json dependency dict.
    """
    keys = list(dependency_dict.keys())
    mandatory_keys = DOWNLOAD_FORMATS_TO_MANIFEST_KEYS[
        dependency_type]['mandatory_keys']
    # Optional keys requires exactly one member of the pair
    # to be available as a key in the dependency_dict.
    optional_key_pairs = DOWNLOAD_FORMATS_TO_MANIFEST_KEYS[
        dependency_type]['optional_key_pairs']
    for key in mandatory_keys:
        if key not in keys:
            python_utils.PRINT('------------------------------------------')
            python_utils.PRINT('There is syntax error in this dependency')
            python_utils.PRINT(dependency_dict)
            python_utils.PRINT('This key is missing or misspelled: "%s".' % key)
            python_utils.PRINT('Exiting')
            sys.exit(1)
    if optional_key_pairs:
        for optional_keys in optional_key_pairs:
            optional_keys_in_dict = [
                key for key in optional_keys if key in keys]
            if len(optional_keys_in_dict) != 1:
                python_utils.PRINT('------------------------------------------')
                python_utils.PRINT('There is syntax error in this dependency')
                python_utils.PRINT(dependency_dict)
                python_utils.PRINT(
                    'Only one of these keys pair must be used: "%s".'
                    % ', '.join(optional_keys))
                python_utils.PRINT('Exiting')
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
        python_utils.PRINT('------------------------------------------')
        python_utils.PRINT('There is syntax error in this dependency')
        python_utils.PRINT(dependency_dict)
        python_utils.PRINT('This url %s is invalid for %s file format.' % (
            dependency_url, dependency_type))
        python_utils.PRINT('Exiting.')
        sys.exit(1)


def validate_manifest(filepath):
    """This validates syntax of the manifest.json

    Args:
        filepath: str. The path to the json file.
    """
    manifest_data = return_json(filepath)
    dependencies = manifest_data['dependencies']
    for _, dependency in dependencies.items():
        for _, dependency_contents in dependency.items():
            if 'downloadFormat' not in dependency_contents:
                raise Exception(
                    'downloadFormat not specified in %s' %
                    dependency_contents)
            download_format = dependency_contents['downloadFormat']
            test_manifest_syntax(download_format, dependency_contents)


def download_manifest_files(filepath):
    """This download all files to the required folders

    Args:
        filepath: str. The path to the json file.
    """
    validate_manifest(filepath)
    manifest_data = return_json(filepath)
    dependencies = manifest_data['dependencies']
    for data, dependency in dependencies.items():
        for _, dependency_contents in dependency.items():
            dependency_rev = dependency_contents['version']
            dependency_url = dependency_contents['url']
            download_format = dependency_contents['downloadFormat']
            if download_format == _DOWNLOAD_FORMAT_FILES:
                dependency_files = dependency_contents['files']
                target_dirname = (
                    dependency_contents['targetDirPrefix'] + dependency_rev)
                dependency_dst = os.path.join(
                    TARGET_DOWNLOAD_DIRS[data], target_dirname)
                download_files(dependency_url, dependency_dst, dependency_files)

            elif download_format == _DOWNLOAD_FORMAT_ZIP:
                if 'rootDir' in dependency_contents:
                    dependency_zip_root_name = dependency_contents['rootDir']
                else:
                    dependency_zip_root_name = (
                        dependency_contents['rootDirPrefix'] + dependency_rev)

                if 'targetDir' in dependency_contents:
                    dependency_target_root_name = (
                        dependency_contents['targetDir'])
                else:
                    dependency_target_root_name = (
                        dependency_contents['targetDirPrefix'] + dependency_rev)
                download_and_unzip_files(
                    dependency_url, TARGET_DOWNLOAD_DIRS[data],
                    dependency_zip_root_name, dependency_target_root_name)

            elif download_format == _DOWNLOAD_FORMAT_TAR:
                dependency_tar_root_name = (
                    dependency_contents['tarRootDirPrefix'] + dependency_rev)
                dependency_target_root_name = (
                    dependency_contents['targetDirPrefix'] + dependency_rev)
                download_and_untar_files(
                    dependency_url, TARGET_DOWNLOAD_DIRS[data],
                    dependency_tar_root_name, dependency_target_root_name)

def install_redis_cli():
    # We need to install redis-cli separately from using manifest.json since it
    # is a system program and we need to install it after the library is
    # untarred.
    try:
        # Pipe output to /dev/null for silence in console.
        null = python_utils.open_file('/dev/null', 'w')
        subprocess.call([
            './third_party/redis-cli-6.0.6/src/redis-cli', '--version'])
        null.close()
        python_utils.PRINT('Redis-cli is already installed.')
    except OSError:
        # Redis-cli is not installed, run the script to install it.
        # NOTE: These should be constants but not sure where to put them since
        # if they go in manifest.json they'll be automatically installed using
        # the default installation pathway(e.g pip if it is under backend)
        # but we need to install it using make.
        python_utils.PRINT('Installing redis-cli...')

        download_and_untar_files(
            'http://download.redis.io/releases/redis-6.0.6.tar.gz',
            TARGET_DOWNLOAD_DIRS['backend'],
            'redis-6.0.6', 'redis-cli-6.0.6')

        # Temporarily change the working directory to redis-cli-6.0.6 so we can
        # build the source code.
        with python_utils.change_directory('third_party/redis-cli-6.0.6/'):
            # Build the scripts necessary to start the redis server.
            subprocess.call(['make'])

        # Make the scripts executable.
        subprocess.call([
            'chmod', '+x', 'third_party/redis-cli-6.0.6/src/redis-cli'])
        subprocess.call([
            'chmod', '+x', 'third_party/redis-cli-6.0.6/src/redis-server'])

        python_utils.PRINT('Redis-cli installed successfully.')

def main(args=None):
    """Installs all the third party libraries."""
    unused_parsed_args = _PARSER.parse_args(args=args)
    download_manifest_files(MANIFEST_FILE_PATH)
    install_redis_cli()


# The 'no coverage' pragma is used as this line is un-testable. This is because
# it will only be called when install_third_party.py is used as a script.
if __name__ == '__main__': # pragma: no cover
    main()
