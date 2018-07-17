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

import StringIO
import contextlib
import json
import os
import shutil
import sys
import tarfile
import urllib
import urllib2
import zipfile

import common  # pylint: disable=relative-import

#These two lines prevent a "IOError: [Errno socket error]
#[Errno -2] Name or service not known" error
# in urllib.urlretrieve, if the user is behind a proxy.
if 'VAGRANT' in os.environ:
    os.environ['http_proxy'] = ''

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


def download_files(source_url_root, target_dir, source_filenames):
    """Downloads a group of files and saves them to a given directory.

    Each file is downloaded only if it does not already exist.

    Args:
      source_url_root: the URL to prepend to all the filenames.
      target_dir: the directory to save the files to.
      source_filenames: a list of filenames. Each filename is appended to the
        end of the source_url_root in order to give the URL from which to
        download the file. The downloaded file is then placed in target_dir,
        and retains the same filename.
    """
    assert isinstance(source_filenames, list)
    common.ensure_directory_exists(target_dir)
    for filename in source_filenames:
        if not os.path.exists(os.path.join(target_dir, filename)):
            print 'Downloading file %s to %s ...' % (filename, target_dir)
            urllib.urlretrieve(
                '%s/%s' % (source_url_root, filename),
                filename=os.path.join(target_dir, filename))

            print 'Download of %s succeeded.' % filename


def download_and_unzip_files(
        source_url, target_parent_dir, zip_root_name, target_root_name):
    """Downloads a zip file, unzips it, and saves the result in a given dir.

    The download occurs only if the target directory that the zip file unzips
    to does not exist.

    NB: This function assumes that the root level of the zip file has exactly
    one folder.

    Args:
      source_url: the URL from which to download the zip file.
      target_parent_dir: the directory to save the contents of the zip file to.
      zip_root_name: the name of the top-level folder in the zip directory.
      target_root_name: the name that the top-level folder should be renamed to
        in the local directory.
    """
    if not os.path.exists(os.path.join(target_parent_dir, target_root_name)):
        print 'Downloading and unzipping file %s to %s ...' % (
            zip_root_name, target_parent_dir)
        common.ensure_directory_exists(target_parent_dir)

        urllib.urlretrieve(source_url, filename=TMP_UNZIP_PATH)

        try:
            with zipfile.ZipFile(TMP_UNZIP_PATH, 'r') as zfile:
                zfile.extractall(path=target_parent_dir)
            os.remove(TMP_UNZIP_PATH)
        except Exception:
            if os.path.exists(TMP_UNZIP_PATH):
                os.remove(TMP_UNZIP_PATH)

            # Some downloads (like jqueryui-themes) may require a user-agent.
            req = urllib2.Request(source_url)
            req.add_header('User-agent', 'python')
            # This is needed to get a seekable filestream that can be used
            # by zipfile.ZipFile.
            file_stream = StringIO.StringIO(urllib2.urlopen(req).read())
            with zipfile.ZipFile(file_stream, 'r') as zfile:
                zfile.extractall(path=target_parent_dir)

        # Rename the target directory.
        os.rename(
            os.path.join(target_parent_dir, zip_root_name),
            os.path.join(target_parent_dir, target_root_name))

        print 'Download of %s succeeded.' % zip_root_name


def download_and_untar_files(
        source_url, target_parent_dir, tar_root_name, target_root_name):
    """Downloads a tar file, untars it, and saves the result in a given dir.

    The download occurs only if the target directory that the tar file untars
    to does not exist.

    NB: This function assumes that the root level of the tar file has exactly
    one folder.

    Args:
      source_url: the URL from which to download the tar file.
      target_parent_dir: the directory to save the contents of the tar file to.
      tar_root_name: the name of the top-level folder in the tar directory.
      target_root_name: the name that the top-level folder should be renamed to
        in the local directory.
    """
    if not os.path.exists(os.path.join(target_parent_dir, target_root_name)):
        print 'Downloading and untarring file %s to %s ...' % (
            tar_root_name, target_parent_dir)
        common.ensure_directory_exists(target_parent_dir)

        urllib.urlretrieve(source_url, filename=TMP_UNZIP_PATH)
        with contextlib.closing(tarfile.open(
            name=TMP_UNZIP_PATH, mode='r:gz')) as tfile:
            tfile.extractall(target_parent_dir)
        os.remove(TMP_UNZIP_PATH)

        # Rename the target directory.
        os.rename(
            os.path.join(target_parent_dir, tar_root_name),
            os.path.join(target_parent_dir, target_root_name))

        print 'Download of %s succeeded.' % tar_root_name


def get_file_contents(filepath, mode='r'):
    """Gets the contents of a file, given a relative filepath from oppia/."""
    with open(filepath, mode) as f:
        return f.read().decode('utf-8')


def return_json(filepath):
    """Return json object when provided url
    Args:
        filepath: the path to the json file.
    Return:
        a parsed json objects.
    """
    response = get_file_contents(filepath)
    return json.loads(response)


def test_manifest_syntax(dependency_type, dependency_dict):
    """This checks syntax of the manifest.json dependencies.

    Display warning message when there is an error and terminate the program.
    Args:
      dependency_type: str. Dependency download format.
      dependency_dict: dict. manifest.json dependency dict.
    """
    keys = dependency_dict.keys()
    mandatory_keys = DOWNLOAD_FORMATS_TO_MANIFEST_KEYS[
        dependency_type]['mandatory_keys']
    # Optional keys requires exactly one member of the pair
    # to be available as a key in the dependency_dict.
    optional_key_pairs = DOWNLOAD_FORMATS_TO_MANIFEST_KEYS[
        dependency_type]['optional_key_pairs']
    for key in mandatory_keys:
        if key not in keys:
            print '------------------------------------------'
            print 'There is syntax error in this dependency'
            print dependency_dict
            print 'This key is missing or misspelled: "%s".' % key
            print 'Exiting'
            sys.exit(1)
    if optional_key_pairs:
        for optional_keys in optional_key_pairs:
            optional_keys_in_dict = [
                key for key in optional_keys if key in keys]
            if len(optional_keys_in_dict) != 1:
                print '------------------------------------------'
                print 'There is syntax error in this dependency'
                print dependency_dict
                print (
                    'Only one of these keys pair must be used: "%s".'
                    % str(optional_keys))
                print 'Exiting'
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
        print '------------------------------------------'
        print 'There is syntax error in this dependency'
        print dependency_dict
        print 'This url  %s is invalid for %s file format.' % (
            dependency_url, dependency_type)
        print 'Exiting.'
        sys.exit(1)


def validate_manifest(filepath):
    """This validates syntax of the manifest.json
    Args:
      filepath: the path to the json file.
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
      filepath: the path to the json file.
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


MATHJAX_REV = '2.6.0'
MATHJAX_ROOT_NAME = 'MathJax-%s' % MATHJAX_REV
MATHJAX_TARGET_ROOT_NAME = MATHJAX_ROOT_NAME
MATHJAX_DIR_PREFIX = os.path.join(
    THIRD_PARTY_STATIC_DIR, MATHJAX_TARGET_ROOT_NAME)
MATHJAX_SUBDIRS_TO_REMOVE = [
    'unpacked', os.path.join('fonts', 'HTML-CSS', 'TeX', 'png')]


def _install_third_party_libs():
    download_manifest_files(MANIFEST_FILE_PATH)

    # MathJax is too big. Remove many unneeded files by following these
    # instructions:
    # https://github.com/mathjax/MathJax/wiki/Shrinking-MathJax-for-%22local%22-installation pylint: disable=line-too-long
    for subdir in MATHJAX_SUBDIRS_TO_REMOVE:
        full_dir = os.path.join(MATHJAX_DIR_PREFIX, subdir)
        if os.path.isdir(full_dir):
            print 'Removing unnecessary MathJax directory \'%s\'' % subdir
            shutil.rmtree(full_dir)


if __name__ == '__main__':
    _install_third_party_libs()
