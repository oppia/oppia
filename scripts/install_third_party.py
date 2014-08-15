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

import itertools
import os
import shutil
import tarfile
import urllib
import zipfile

import common

TOOLS_DIR = os.path.join('..', 'oppia_tools')
THIRD_PARTY_DIR = os.path.join('.', 'third_party')
THIRD_PARTY_STATIC_DIR = os.path.join(THIRD_PARTY_DIR, 'static')

# Place to download zip files for temporary storage.
TMP_UNZIP_PATH = os.path.join('.', 'tmp_unzip.zip')


# Check that the current directory is correct.
common.require_cwd_to_be_oppia()


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
        with zipfile.ZipFile(TMP_UNZIP_PATH, 'r') as z:
            z.extractall(target_parent_dir)
        os.remove(TMP_UNZIP_PATH)

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
        with tarfile.open(TMP_UNZIP_PATH, 'r:gz') as t:
            t.extractall(target_parent_dir)
        os.remove(TMP_UNZIP_PATH)

        # Rename the target directory.
        os.rename(
            os.path.join(target_parent_dir, tar_root_name),
            os.path.join(target_parent_dir, target_root_name))


# Download all the standalone files.
YUICOMPRESSOR_REV = '2.4.8'
YUICOMPRESSOR_FILENAME = 'yuicompressor-%s' % YUICOMPRESSOR_REV
YUICOMPRESSOR_URL = (
    'https://github.com/yui/yuicompressor/releases/download/v%s'
    % YUICOMPRESSOR_REV)
YUICOMPRESSOR_DST = os.path.join(TOOLS_DIR, YUICOMPRESSOR_FILENAME)
YUICOMPRESSOR_FILES = ['%s.jar' % YUICOMPRESSOR_FILENAME]

UI_BOOTSTRAP_REV = '0.10.0'
UI_BOOTSTRAP_URL = (
    'https://raw.githubusercontent.com/angular-ui/bootstrap/gh-pages')
UI_BOOTSTRAP_DST = os.path.join(
    THIRD_PARTY_STATIC_DIR, 'ui-bootstrap-%s' % UI_BOOTSTRAP_REV)
UI_BOOTSTRAP_FILES = [
    'ui-bootstrap-tpls-%s.%s' % (UI_BOOTSTRAP_REV, suffix)
    for suffix in ['js', 'min.js']]

JQUERY_REV = '2.0.3'
JQUERY_URL = 'https://ajax.googleapis.com/ajax/libs/jquery/%s' % JQUERY_REV
JQUERY_DST = os.path.join(THIRD_PARTY_STATIC_DIR, 'jquery-%s' % JQUERY_REV)
JQUERY_FILES = ['jquery.%s' % suffix for suffix in ['js', 'min.js', 'min.map']]

JQUERYUI_REV = '1.10.3'
JQUERYUI_URL = (
    'https://ajax.googleapis.com/ajax/libs/jqueryui/%s' % JQUERYUI_REV)
JQUERYUI_DST = os.path.join(
    THIRD_PARTY_STATIC_DIR, 'jqueryui-%s' % JQUERYUI_REV)
JQUERYUI_FILES = ['jquery-ui.min.js']

ANGULAR_REV = '1.2.0-rc.3'
ANGULAR_URL = (
    'https://ajax.googleapis.com/ajax/libs/angularjs/%s' % ANGULAR_REV)
ANGULAR_TEST_URL = 'http://code.angularjs.org/%s' % ANGULAR_REV
ANGULAR_DST = os.path.join(
    THIRD_PARTY_STATIC_DIR, 'angularjs-%s' % ANGULAR_REV)
ANGULAR_FILES = [
    'angular%s.%s' % (part1, part2) for (part1, part2) in itertools.product(
        ['', '-resource', '-route', '-sanitize'],
        ['js', 'min.js', 'min.js.map'])]
ANGULAR_TEST_FILES = ['angular-mocks.js', 'angular-scenario.js']

D3_REV = '3.2.8'
D3_URL = 'https://raw.github.com/mbostock/d3/v%s' % D3_REV
D3_DST = os.path.join(THIRD_PARTY_STATIC_DIR, 'd3js-%s' % D3_REV)
D3_FILES = ['d3.min.js']

download_files(YUICOMPRESSOR_URL, YUICOMPRESSOR_DST, YUICOMPRESSOR_FILES)
download_files(UI_BOOTSTRAP_URL, UI_BOOTSTRAP_DST, UI_BOOTSTRAP_FILES)
download_files(JQUERY_URL, JQUERY_DST, JQUERY_FILES)
download_files(JQUERYUI_URL, JQUERYUI_DST, JQUERYUI_FILES)
download_files(ANGULAR_URL, ANGULAR_DST, ANGULAR_FILES)
download_files(ANGULAR_TEST_URL, ANGULAR_DST, ANGULAR_TEST_FILES)
download_files(D3_URL, D3_DST, D3_FILES)


# Download all the frontend library zip files.

SELECT2_REV = '3.4.1'
SELECT2_ZIP_URL = (
    'https://github.com/ivaynberg/select2/archive/%s.zip' % SELECT2_REV)
SELECT2_ZIP_ROOT_NAME = 'select2-%s' % SELECT2_REV
SELECT2_TARGET_ROOT_NAME = 'select2-%s' % SELECT2_REV

JWYSIWYG_REV = '496497b0772067a0064b627c02893d989ccc7cc9'
JWYSIWYG_ZIP_URL = (
    'https://github.com/jwysiwyg/jwysiwyg/archive/%s.zip' % JWYSIWYG_REV)
JWYSIWYG_ZIP_ROOT_NAME = 'jwysiwyg-%s' % JWYSIWYG_REV
JWYSIWYG_TARGET_ROOT_NAME = 'jwysiwyg-496497'

JQUERYUI_FILENAME = 'jquery-ui-themes-%s' % JQUERYUI_REV
JQUERYUI_THEMES_SRC = (
    'http://jqueryui.com/resources/download/%s.zip' % JQUERYUI_FILENAME)
JQUERYUI_THEMES_ZIP_ROOT_NAME = JQUERYUI_FILENAME
JQUERYUI_THEMES_TARGET_ROOT_NAME = JQUERYUI_FILENAME

CODEMIRROR_REV = '3.19.0'
CODEMIRROR_ZIP_URL = 'https://github.com/marijnh/CodeMirror/archive/3.19.0.zip'
CODEMIRROR_ZIP_ROOT_NAME = 'CodeMirror-%s' % CODEMIRROR_REV
CODEMIRROR_TARGET_ROOT_NAME = 'code-mirror-%s' % CODEMIRROR_REV

UI_CODEMIRROR_REV = '0.1.2'
UI_CODEMIRROR_ZIP_URL = (
    'https://github.com/angular-ui/ui-codemirror/archive/src%s.zip'
    % UI_CODEMIRROR_REV)
UI_CODEMIRROR_ZIP_ROOT_NAME = 'ui-codemirror-src%s' % UI_CODEMIRROR_REV
UI_CODEMIRROR_TARGET_ROOT_NAME = 'ui-codemirror-%s' % UI_CODEMIRROR_REV

MIDI_JS_REV = '09335aa7078be606f6d2389a3defb6d616db9ff7'
MIDI_JS_ZIP_URL = (
    'https://github.com/mudcube/MIDI.js/archive/%s.zip' % MIDI_JS_REV)
MIDI_JS_ZIP_ROOT_NAME = 'MIDI.js-%s' % MIDI_JS_REV
MIDI_JS_TARGET_ROOT_NAME = 'midi-js-09335a'

UI_MAP_REV = '0.5.0'
UI_MAP_ROOT_NAME = 'ui-map-%s' % UI_MAP_REV
UI_MAP_ZIP_URL = (
    'https://github.com/angular-ui/ui-map/archive/v%s.zip' % UI_MAP_REV)
UI_MAP_ZIP_ROOT_NAME = UI_MAP_ROOT_NAME
UI_MAP_TARGET_ROOT_NAME = UI_MAP_ROOT_NAME

# ui-utils contains ui-event, which is needed for ui-map.
UI_UTILS_REV = '0.1.1'
UI_UTILS_ROOT_NAME = 'ui-utils-%s' % UI_UTILS_REV
UI_UTILS_ZIP_URL = (
    'https://github.com/angular-ui/ui-utils/archive/v%s.zip' % UI_UTILS_REV)
UI_UTILS_ZIP_ROOT_NAME = UI_UTILS_ROOT_NAME
UI_UTILS_TARGET_ROOT_NAME = UI_UTILS_ROOT_NAME

UI_SORTABLE_REV = '0.12.6'
UI_SORTABLE_ZIP_URL = (
    'https://github.com/angular-ui/ui-sortable/archive/src%s.zip'
    % UI_SORTABLE_REV)
UI_SORTABLE_ZIP_ROOT_NAME = 'ui-sortable-src%s' % UI_SORTABLE_REV
UI_SORTABLE_TARGET_ROOT_NAME = 'ui-sortable-%s' % UI_SORTABLE_REV

BOOTSTRAP_REV = '3.1.1'
BOOTSTRAP_ROOT_NAME = 'bootstrap-%s-dist' % BOOTSTRAP_REV
BOOTSTRAP_ZIP_URL = (
    'https://github.com/twbs/bootstrap/releases/download/v3.1.1/%s.zip'
    % BOOTSTRAP_ROOT_NAME)
BOOTSTRAP_ZIP_ROOT_NAME = BOOTSTRAP_ROOT_NAME
BOOTSTRAP_TARGET_ROOT_NAME = 'bootstrap-%s' % BOOTSTRAP_REV

MATHJAX_REV = '2.4-latest'
MATHJAX_ROOT_NAME = 'MathJax-%s' % MATHJAX_REV
MATHJAX_ZIP_URL = (
    'https://github.com/mathjax/MathJax/archive/v%s.zip' % MATHJAX_REV)
MATHJAX_ZIP_ROOT_NAME = MATHJAX_ROOT_NAME
MATHJAX_TARGET_ROOT_NAME = MATHJAX_ROOT_NAME

download_and_unzip_files(
    SELECT2_ZIP_URL, THIRD_PARTY_STATIC_DIR,
    SELECT2_ZIP_ROOT_NAME, SELECT2_TARGET_ROOT_NAME)
download_and_unzip_files(
    JWYSIWYG_ZIP_URL, THIRD_PARTY_STATIC_DIR,
    JWYSIWYG_ZIP_ROOT_NAME, JWYSIWYG_TARGET_ROOT_NAME)
download_and_unzip_files(
    JQUERYUI_THEMES_SRC,
    os.path.join(THIRD_PARTY_STATIC_DIR, 'jqueryui-%s' % JQUERYUI_REV),
    JQUERYUI_THEMES_ZIP_ROOT_NAME, JQUERYUI_THEMES_TARGET_ROOT_NAME)
download_and_unzip_files(
    CODEMIRROR_ZIP_URL, THIRD_PARTY_STATIC_DIR,
    CODEMIRROR_ZIP_ROOT_NAME, CODEMIRROR_TARGET_ROOT_NAME)
download_and_unzip_files(
    UI_CODEMIRROR_ZIP_URL, THIRD_PARTY_STATIC_DIR,
    UI_CODEMIRROR_ZIP_ROOT_NAME, UI_CODEMIRROR_TARGET_ROOT_NAME)
download_and_unzip_files(
    MIDI_JS_ZIP_URL, THIRD_PARTY_STATIC_DIR,
    MIDI_JS_ZIP_ROOT_NAME, MIDI_JS_TARGET_ROOT_NAME)
download_and_unzip_files(
    UI_MAP_ZIP_URL, THIRD_PARTY_STATIC_DIR,
    UI_MAP_ZIP_ROOT_NAME, UI_MAP_TARGET_ROOT_NAME)
download_and_unzip_files(
    UI_UTILS_ZIP_URL, THIRD_PARTY_STATIC_DIR,
    UI_UTILS_ZIP_ROOT_NAME, UI_UTILS_TARGET_ROOT_NAME)
download_and_unzip_files(
    UI_SORTABLE_ZIP_URL, THIRD_PARTY_STATIC_DIR,
    UI_SORTABLE_ZIP_ROOT_NAME, UI_SORTABLE_TARGET_ROOT_NAME)
download_and_unzip_files(
    BOOTSTRAP_ZIP_URL, THIRD_PARTY_STATIC_DIR,
    BOOTSTRAP_ZIP_ROOT_NAME, BOOTSTRAP_TARGET_ROOT_NAME)
download_and_unzip_files(
    MATHJAX_ZIP_URL, THIRD_PARTY_STATIC_DIR,
    MATHJAX_ZIP_ROOT_NAME, MATHJAX_TARGET_ROOT_NAME)
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


# Download all the backend (Python) library zip files.

BLEACH_REV = '1.2.2'
BLEACH_ROOT_NAME = 'bleach-%s' % BLEACH_REV
BLEACH_ZIP_URL = (
    'https://github.com/jsocol/bleach/archive/v%s.zip' % BLEACH_REV)
BLEACH_ZIP_ROOT_NAME = BLEACH_ROOT_NAME
BLEACH_TARGET_ROOT_NAME = BLEACH_ROOT_NAME

HTML5LIB_REV = '0.95'
HTML5LIB_ROOT_NAME = 'html5lib-python-%s' % HTML5LIB_REV
HTML5LIB_ZIP_URL = (
    'https://github.com/html5lib/html5lib-python/archive/%s.zip'
    % HTML5LIB_REV)
HTML5LIB_ZIP_ROOT_NAME = HTML5LIB_ROOT_NAME
HTML5LIB_TARGET_ROOT_NAME = HTML5LIB_ROOT_NAME

download_and_unzip_files(
    BLEACH_ZIP_URL, THIRD_PARTY_DIR,
    BLEACH_ZIP_ROOT_NAME, BLEACH_TARGET_ROOT_NAME)
download_and_unzip_files(
    HTML5LIB_ZIP_URL, THIRD_PARTY_DIR,
    HTML5LIB_ZIP_ROOT_NAME, HTML5LIB_TARGET_ROOT_NAME)


# Download all the tar files.

GAE_MAPREDUCE_REV = '1.9.0.0'
GAE_MAPREDUCE_ROOT_NAME = 'gae-mapreduce-%s' % GAE_MAPREDUCE_REV
GAE_MAPREDUCE_TAR_URL = (
    'https://pypi.python.org/packages/source/G/GoogleAppEngineMapReduce/'
    'GoogleAppEngineMapReduce-%s.tar.gz' % GAE_MAPREDUCE_REV)
GAE_MAPREDUCE_TAR_ROOT_NAME = 'GoogleAppEngineMapReduce-%s' % GAE_MAPREDUCE_REV
GAE_MAPREDUCE_TARGET_ROOT_NAME = GAE_MAPREDUCE_ROOT_NAME

GAE_CLOUD_STORAGE_REV = '1.9.0.0'
GAE_CLOUD_STORAGE_ROOT_NAME = 'gae-cloud-storage-%s' % GAE_CLOUD_STORAGE_REV
GAE_CLOUD_STORAGE_TAR_URL = (
    'https://pypi.python.org/packages/source/G/'
    'GoogleAppEngineCloudStorageClient/'
    'GoogleAppEngineCloudStorageClient-%s.tar.gz' % GAE_CLOUD_STORAGE_REV)
GAE_CLOUD_STORAGE_TAR_ROOT_NAME = (
    'GoogleAppEngineCloudStorageClient-%s' % GAE_MAPREDUCE_REV)
GAE_CLOUD_STORAGE_TARGET_ROOT_NAME = GAE_CLOUD_STORAGE_ROOT_NAME


download_and_untar_files(
    GAE_MAPREDUCE_TAR_URL, THIRD_PARTY_DIR,
    GAE_MAPREDUCE_TAR_ROOT_NAME, GAE_MAPREDUCE_TARGET_ROOT_NAME)
download_and_untar_files(
    GAE_CLOUD_STORAGE_TAR_URL, THIRD_PARTY_DIR,
    GAE_CLOUD_STORAGE_TAR_ROOT_NAME, GAE_CLOUD_STORAGE_TARGET_ROOT_NAME)
