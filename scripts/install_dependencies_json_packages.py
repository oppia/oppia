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

"""Installation script for Oppia frontend prod dependencies from
dependencies.json.
"""

from __future__ import annotations

from http import client
import io
import json
import os
import pathlib
import ssl
import sys
import urllib
from urllib import error as urlerror
from urllib import request as urlrequest
import zipfile

import certifi
from typing import (
    BinaryIO, Dict, Final, List, Literal, TextIO, TypedDict,
    Union, cast, overload
)

DEPENDENCIES_FILE_PATH: Final = os.path.join(os.getcwd(), 'dependencies.json')
TOOLS_DIR: Final = os.path.join('..', 'oppia_tools')
THIRD_PARTY_DIR: Final = os.path.join('.', 'third_party')
THIRD_PARTY_STATIC_DIR: Final = os.path.join(THIRD_PARTY_DIR, 'static')

# Place to download zip files for temporary storage.
TMP_UNZIP_PATH: Final = os.path.join('.', 'tmp_unzip.zip')

_DOWNLOAD_FORMAT_ZIP: Final = 'zip'
_DOWNLOAD_FORMAT_FILES: Final = 'files'

DownloadFormatType = Literal['zip', 'files']


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
    }
}

TextModeTypes = Literal['r', 'w', 'a', 'x', 'r+', 'w+', 'a+']
BinaryModeTypes = Literal['rb', 'wb', 'ab', 'xb', 'r+b', 'w+b', 'a+b', 'x+b']


def url_retrieve(
        url: str, output_path: str, max_attempts: int = 2,
        enforce_https: bool = True
) -> None:
    """Retrieve a file from a URL and write the file to the file system.

    Note that we use Python's recommended default settings for verifying SSL
    connections, which are documented here:
    https://docs.python.org/3/library/ssl.html#best-defaults.

    Args:
        url: str. The URL to retrieve the data from.
        output_path: str. Path to the destination file where the data from the
            URL will be written.
        max_attempts: int. The maximum number of attempts that will be made to
            download the data. For failures before the maximum number of
            attempts, a message describing the error will be printed. Once the
            maximum is hit, any errors will be raised.
        enforce_https: bool. Whether to require that the provided URL starts
            with 'https://' to ensure downloads are secure.

    Raises:
        Exception. Raised when the provided URL does not use HTTPS but
            enforce_https is True.
    """
    failures = 0
    success = False
    if enforce_https and not url.startswith('https://'):
        raise Exception(
            'The URL %s should use HTTPS.' % url)
    while not success and failures < max_attempts:
        try:
            with urlrequest.urlopen(
                url, context=ssl.create_default_context()
            ) as response:
                with open(output_path, 'wb') as output_file:
                    output_file.write(response.read())
        except (
            urlerror.URLError, ssl.SSLError, client.IncompleteRead
        ) as exception:
            failures += 1
            print('Attempt %d of %d failed when downloading %s.' % (
                failures, max_attempts, url))
            if failures >= max_attempts:
                raise exception
            print('Error: %s' % exception)
            print('Retrying download.')
        else:
            success = True


def url_open(
    source_url: Union[str, urllib.request.Request]
) -> urllib.request._UrlopenRet:
    """Opens a URL and returns the response.

    Args:
        source_url: Union[str, Request]. The URL.

    Returns:
        urlopen. The 'urlopen' object.
    """
    context = ssl.create_default_context(cafile=certifi.where())
    return urllib.request.urlopen(source_url, context=context)


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
    files: List[str]
    bundle: Dict[str, List[str]]


class DependenciesDict(TypedDict):
    """Dict representation of dependencies."""

    frontendDependencies: Dict[str, DependencyDict]


@overload
def open_file(
    filename: str,
    mode: TextModeTypes,
    encoding: str = 'utf-8',
    newline: Union[str, None] = None
) -> TextIO: ...


@overload
def open_file(
    filename: str,
    mode: BinaryModeTypes,
    encoding: Union[str, None] = 'utf-8',
    newline: Union[str, None] = None
) -> BinaryIO: ...


def open_file(
    filename: str,
    mode: Union[TextModeTypes, BinaryModeTypes],
    encoding: Union[str, None] = 'utf-8',
    newline: Union[str, None] = None
) -> Union[BinaryIO, TextIO]:
    """Open file and return a corresponding file object.

    Args:
        filename: str. The file to be opened.
        mode: Literal. Mode in which the file is opened.
        encoding: str. Encoding in which the file is opened.
        newline: None|str. Controls how universal newlines work.

    Returns:
        IO[Any]. The file object.

    Raises:
        FileNotFoundError. The file cannot be found.
    """
    # Here we use cast because we are narrowing down the type from IO[Any]
    # to Union[BinaryIO, TextIO].
    file = cast(
        Union[BinaryIO, TextIO],
        open(filename, mode, encoding=encoding, newline=newline)
    )
    return file


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
    pathlib.Path(target_dir).mkdir(parents=True, exist_ok=True)
    for filename in source_filenames:
        if not os.path.exists(os.path.join(target_dir, filename)):
            print('Downloading file %s to %s ...' % (filename, target_dir))
            url_retrieve(
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
        pathlib.Path(target_parent_dir).mkdir(parents=True, exist_ok=True)

        url_retrieve(source_url, TMP_UNZIP_PATH)

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
            file_stream = io.BytesIO(url_open(req).read())
            with zipfile.ZipFile(file_stream, 'r') as zfile:
                zfile.extractall(path=target_parent_dir)

        # Rename the target directory.
        os.rename(
            os.path.join(target_parent_dir, zip_root_name),
            os.path.join(target_parent_dir, target_root_name))

        print('Download of %s succeeded.' % zip_root_name)


def get_file_contents(filepath: str, mode: TextModeTypes = 'r') -> str:
    """Gets the contents of a file, given a relative filepath from oppia/."""
    with open_file(filepath, mode) as f:
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
    if (dependency_url.endswith('.zip') and not is_zip_file_format or
            is_zip_file_format and not dependency_url.endswith('.zip')):
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
    dependencies = dependencies_data['frontendDependencies']
    for _, dependency in dependencies.items():
        if 'downloadFormat' not in dependency:
            raise Exception('downloadFormat not specified in %s' % dependency)
        download_format = dependency['downloadFormat']
        test_dependencies_syntax(download_format, dependency)


def download_all_dependencies(filepath: str) -> None:
    """This download all files to the required folders.

    Args:
        filepath: str. The path to the json file.
    """
    validate_dependencies(filepath)
    dependencies_data = return_json(filepath)
    dependencies = dependencies_data['frontendDependencies']
    for _, dependency in dependencies.items():
        download_format = dependency['downloadFormat']

        if download_format == _DOWNLOAD_FORMAT_FILES:
            dependency_dst = os.path.join(
                THIRD_PARTY_STATIC_DIR,
                dependency['targetDirPrefix'] + dependency['version'])
            download_files(
                dependency['url'], dependency_dst, dependency['files'])

        elif download_format == _DOWNLOAD_FORMAT_ZIP:
            dependency_zip_root_name = (
                dependency['rootDir'] if 'rootDir' in dependency
                else dependency['rootDirPrefix'] + dependency['version'])
            dependency_target_root_name = (
                dependency['targetDir'] if 'targetDir' in dependency
                else dependency['targetDirPrefix'] + dependency['version'])
            download_and_unzip_files(
                dependency['url'], THIRD_PARTY_STATIC_DIR,
                dependency_zip_root_name, dependency_target_root_name)


def main() -> None:
    """Installs all the packages from the dependencies.json file."""

    download_all_dependencies(DEPENDENCIES_FILE_PATH)


# The 'no coverage' pragma is used as this line is un-testable. This is because
# it will only be called when this Python file is used as a script.
if __name__ == '__main__': # pragma: no cover
    main()
