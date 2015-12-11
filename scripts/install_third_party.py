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

import contextlib
import itertools
import json
import os
import shutil
import StringIO
import tarfile
import urllib
import urllib2
import zipfile

import common

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
            print 'Downloading file %s to %s' % (filename, target_dir)
            urllib.urlretrieve(
                '%s/%s' % (source_url_root, filename),
                os.path.join(target_dir, filename))


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
        print 'Downloading and unzipping file %s to %s' % (
            zip_root_name, target_parent_dir)
        common.ensure_directory_exists(target_parent_dir)

        urllib.urlretrieve(source_url, TMP_UNZIP_PATH)

        try:
            with zipfile.ZipFile(TMP_UNZIP_PATH, 'r') as z:
                z.extractall(target_parent_dir)
            os.remove(TMP_UNZIP_PATH)
        except:
            if os.path.exists(TMP_UNZIP_PATH):
                os.remove(TMP_UNZIP_PATH)

            # Some downloads (like jqueryui-themes) may require a user-agent.
            req = urllib2.Request(source_url)
            req.add_header('User-agent', 'python')
            # This is needed to get a seekable filestream that can be used
            # by zipfile.ZipFile.
            file_stream = StringIO.StringIO(urllib2.urlopen(req).read())
            with zipfile.ZipFile(file_stream, 'r') as z:
                z.extractall(target_parent_dir)

        # Rename the target directory.
        os.rename(
            os.path.join(target_parent_dir, zip_root_name),
            os.path.join(target_parent_dir, target_root_name))


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
        print 'Downloading and untarring file %s to %s' % (
            tar_root_name, target_parent_dir)
        common.ensure_directory_exists(target_parent_dir)

        urllib.urlretrieve(source_url, TMP_UNZIP_PATH)
        with contextlib.closing(tarfile.open(TMP_UNZIP_PATH, 'r:gz')) as t:
            t.extractall(target_parent_dir)
        os.remove(TMP_UNZIP_PATH)

        # Rename the target directory.
        os.rename(
            os.path.join(target_parent_dir, tar_root_name),
            os.path.join(target_parent_dir, target_root_name))


def get_file_contents(filepath, mode='r'):
    """Gets the contents of a file, given a relative filepath from oppia/."""
    with open(filepath, mode) as f:
        return f.read().decode('utf-8')


def return_json(source_url):
    """Return json object when provided url
    Args:
        source_url: the URL of the json file.
    Return:
        a parsed json objects
    """
    response = get_file_contents(source_url)
    return json.loads(response)


def download_manifest_files(source_url):
    """This download all files to the required folders
    Args:
      source_url: the URL fof the json file.
    """
    manifest_data = return_json(source_url)
    dependencies = manifest_data['dependencies']
    for data in dependencies:
        dependency = dependencies[data]
        for dependency_id in dependency:
            dependency_contents = dependency[dependency_id]
            if 'srcUrl' in dependency_contents:
                DEPENDENCY_REV = dependency_contents['version']
                DEPENDENCY_URL = dependency_contents['srcUrl']
                DEPENDENCY_FILES = dependency_contents['files']
                TARGET_DIRNAME = (
                    dependency_contents['targetDirPrefix'] + DEPENDENCY_REV)
                DEPENDENCY_DST = os.path.join(
                    TARGET_DOWNLOAD_DIRS[data], TARGET_DIRNAME)
                download_files(DEPENDENCY_URL, DEPENDENCY_DST, DEPENDENCY_FILES)

            elif 'zipUrl' in dependency_contents:
                DEPENDENCY_REV = dependency_contents['version']
                DEPENDENCY_URL = dependency_contents['zipUrl']
                if 'rootDir' in dependency_contents:
                    DEPENDENCY_ZIP_ROOT_NAME = dependency_contents['rootDir']
                else:
                    DEPENDENCY_ZIP_ROOT_NAME = (
                        dependency_contents['rootDirPrefix'] + DEPENDENCY_REV)

                if 'targetDir' in dependency_contents:
                    DEPENDENCY_TARGET_ROOT_NAME = (
                        dependency_contents['targetDir'])
                else:
                    DEPENDENCY_TARGET_ROOT_NAME = (
                        dependency_contents['targetDirPrefix'] + DEPENDENCY_REV)
                download_and_unzip_files(
                    DEPENDENCY_URL, TARGET_DOWNLOAD_DIRS[data],
                    DEPENDENCY_ZIP_ROOT_NAME, DEPENDENCY_TARGET_ROOT_NAME)

            elif 'tarUrl' in dependency_contents:
                DEPENDENCY_REV = dependency_contents['version']
                DEPENDENCY_URL = dependency_contents['tarUrl']
                DEPENDENCY_TAR_ROOT_NAME = (
                    dependency_contents['tarRootDirPrefix'] + DEPENDENCY_REV)
                DEPENDENCY_TARGET_ROOT_NAME = (
                    dependency_contents['targetDirPrefix'] + DEPENDENCY_REV)
                download_and_untar_files(
                    DEPENDENCY_URL, TARGET_DOWNLOAD_DIRS[data],
                    DEPENDENCY_TAR_ROOT_NAME, DEPENDENCY_TARGET_ROOT_NAME)


download_manifest_files(MANIFEST_FILE_PATH)

MATHJAX_REV = '2.4-latest'
MATHJAX_ROOT_NAME = 'MathJax-%s' % MATHJAX_REV
MATHJAX_ZIP_URL = (
    'https://github.com/mathjax/MathJax/archive/v%s.zip' % MATHJAX_REV)
MATHJAX_ZIP_ROOT_NAME = MATHJAX_ROOT_NAME
MATHJAX_TARGET_ROOT_NAME = MATHJAX_ROOT_NAME

# MathJax is too big. Remove many unneeded files by following these
# instructions:
#   https://github.com/mathjax/MathJax/wiki/Shrinking-MathJax-for-%22local%22-installation
MATHJAX_DIR_PREFIX = os.path.join(
    THIRD_PARTY_STATIC_DIR, MATHJAX_TARGET_ROOT_NAME)
MATHJAX_SUBDIRS_TO_REMOVE = [
    'unpacked', os.path.join('fonts', 'HTML-CSS', 'TeX', 'png')]
for subdir in MATHJAX_SUBDIRS_TO_REMOVE:
    full_dir = os.path.join(MATHJAX_DIR_PREFIX, subdir)
    if os.path.isdir(full_dir):
        print 'Removing unnecessary MathJax directory \'%s\'' % subdir
        shutil.rmtree(full_dir)
