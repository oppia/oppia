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

"""Common utility functions and classes used by multiple Python scripts."""

from __future__ import annotations

import contextlib
import errno
import getpass
import io
import os
import platform
import re
import shutil
import socket
import ssl
import subprocess
import sys
import time
from urllib import error as urlerror
from urllib import request as urlrequest

from core import constants

from typing import Dict, Generator, List, Optional, Union

# Add third_party to path. Some scripts access feconf even before
# python_libs is added to path.
_THIRD_PARTY_PATH = os.path.join(os.getcwd(), 'third_party', 'python_libs')
sys.path.insert(0, _THIRD_PARTY_PATH)

from core import utils # pylint: disable=wrong-import-position

AFFIRMATIVE_CONFIRMATIONS = ['y', 'ye', 'yes']

CURRENT_PYTHON_BIN = sys.executable

# Node version.
NODE_VERSION = '16.13.0'

# NB: Please ensure that the version is consistent with the version in .yarnrc.
YARN_VERSION = '1.22.15'

# Versions of libraries used in backend.
PILLOW_VERSION = '9.0.1'

# Buf version.
BUF_VERSION = '0.29.0'

# Must match the version of protobuf in requirements_dev.in.
PROTOC_VERSION = '3.13.0'

# IMPORTANT STEPS FOR DEVELOPERS TO UPGRADE REDIS:
# 1. Download the new version of the redis cli.
# 2. Extract the cli in the folder that it was downloaded, most likely
#    Downloads/.
# 3. Change directories into the folder you extracted, titled
#    redis-<new version>/ and change into that directory:
#    cd redis-<new version>/
# 4. From the top level of the redis-<new version> directory,
#    run `make test`.
# 5. All of the tests should pass with an [ok] status with no error codes. The
#    final output should be 'All tests pass'.
# 6. Be sure to leave a note in the PR description to confirm that you have read
#    this message, and that all of the `make test` tests pass before you commit
#    the upgrade to develop.
# 7. If any tests fail, DO NOT upgrade to this newer version of the redis cli.
REDIS_CLI_VERSION = '6.2.4'
ELASTICSEARCH_VERSION = '7.17.0'

RELEASE_BRANCH_NAME_PREFIX = 'release-'
CURR_DIR = os.path.abspath(os.getcwd())
OPPIA_TOOLS_DIR = os.path.join(CURR_DIR, os.pardir, 'oppia_tools')
OPPIA_TOOLS_DIR_ABS_PATH = os.path.abspath(OPPIA_TOOLS_DIR)
THIRD_PARTY_DIR = os.path.join(CURR_DIR, 'third_party')
THIRD_PARTY_PYTHON_LIBS_DIR = os.path.join(THIRD_PARTY_DIR, 'python_libs')
GOOGLE_CLOUD_SDK_HOME = os.path.join(
    OPPIA_TOOLS_DIR_ABS_PATH, 'google-cloud-sdk-364.0.0', 'google-cloud-sdk')
GOOGLE_APP_ENGINE_SDK_HOME = os.path.join(
    GOOGLE_CLOUD_SDK_HOME, 'platform', 'google_appengine')
GOOGLE_CLOUD_SDK_BIN = os.path.join(GOOGLE_CLOUD_SDK_HOME, 'bin')
WEBPACK_BIN_PATH = (
    os.path.join(CURR_DIR, 'node_modules', 'webpack', 'bin', 'webpack.js'))
DEV_APPSERVER_PATH = (
    os.path.join(GOOGLE_CLOUD_SDK_BIN, 'dev_appserver.py'))
GCLOUD_PATH = os.path.join(GOOGLE_CLOUD_SDK_BIN, 'gcloud')
NODE_PATH = os.path.join(OPPIA_TOOLS_DIR, 'node-%s' % NODE_VERSION)
NODE_MODULES_PATH = os.path.join(CURR_DIR, 'node_modules')
FRONTEND_DIR = os.path.join(CURR_DIR, 'core', 'templates')
YARN_PATH = os.path.join(OPPIA_TOOLS_DIR, 'yarn-%s' % YARN_VERSION)
FIREBASE_PATH = os.path.join(
    NODE_MODULES_PATH, 'firebase-tools', 'lib', 'bin', 'firebase.js')
OS_NAME = platform.system()
ARCHITECTURE = platform.machine()
REDIS_SERVER_PATH = os.path.join(
    OPPIA_TOOLS_DIR, 'redis-cli-%s' % REDIS_CLI_VERSION,
    'src', 'redis-server')
REDIS_CLI_PATH = os.path.join(
    OPPIA_TOOLS_DIR, 'redis-cli-%s' % REDIS_CLI_VERSION,
    'src', 'redis-cli')
# Directory for storing/fetching data related to the Cloud Datastore emulator.
CLOUD_DATASTORE_EMULATOR_DATA_DIR = (
    os.path.join(CURR_DIR, os.pardir, 'cloud_datastore_emulator_cache'))
# Directory for storing/fetching data related to the Firebase emulator.
FIREBASE_EMULATOR_CACHE_DIR = (
    os.path.join(CURR_DIR, os.pardir, 'firebase_emulator_cache'))

# By specifying this condition, we are importing the below module only while
# type checking, not in runtime.
MYPY = False
if MYPY:  # pragma: no cover
    import github

ES_PATH = os.path.join(
    OPPIA_TOOLS_DIR, 'elasticsearch-%s' % ELASTICSEARCH_VERSION)
ES_PATH_CONFIG_DIR = os.path.join(
    OPPIA_TOOLS_DIR, 'elasticsearch-%s' % ELASTICSEARCH_VERSION, 'config')
ES_PATH_DATA_DIR = os.path.join(
    OPPIA_TOOLS_DIR, 'elasticsearch-%s' % ELASTICSEARCH_VERSION, 'data')

RELEASE_BRANCH_REGEX = r'release-(\d+\.\d+\.\d+)$'
RELEASE_MAINTENANCE_BRANCH_REGEX = r'release-maintenance-(\d+\.\d+\.\d+)$'
HOTFIX_BRANCH_REGEX = r'release-(\d+\.\d+\.\d+)-hotfix-[1-9]+$'
TEST_BRANCH_REGEX = r'test-[A-Za-z0-9-]*$'
USER_PREFERENCES: Dict[str, Optional[str]] = {'open_new_tab_in_browser': None}

FECONF_PATH = os.path.join('core', 'feconf.py')
CONSTANTS_FILE_PATH = os.path.join('assets', 'constants.ts')
APP_DEV_YAML_PATH = os.path.join('app_dev.yaml')
MAX_WAIT_TIME_FOR_PORT_TO_OPEN_SECS = 5 * 60
MAX_WAIT_TIME_FOR_PORT_TO_CLOSE_SECS = 60
REDIS_CONF_PATH = os.path.join('redis.conf')
# Path for the dump file the redis server autogenerates. It contains data
# used by the Redis server.
REDIS_DUMP_PATH = os.path.join(CURR_DIR, 'dump.rdb')
# The requirements.txt file is auto-generated and contains a deterministic list
# of all libraries and versions that should exist in the
# 'third_party/python_libs' directory.
# NOTE: Developers should NOT modify this file.
COMPILED_REQUIREMENTS_FILE_PATH = os.path.join(CURR_DIR, 'requirements.txt')
# The precompiled requirements file is the one that developers should be
# modifying. It is the file that we use to recompile the
# "requirements.txt" file so that all installations using "requirements.txt"
# will be identical.
REQUIREMENTS_FILE_PATH = os.path.join(CURR_DIR, 'requirements.in')

WEBPACK_DEV_CONFIG = 'webpack.dev.config.ts'
WEBPACK_DEV_SOURCE_MAPS_CONFIG = 'webpack.dev.sourcemap.config.ts'
WEBPACK_PROD_CONFIG = 'webpack.prod.config.ts'
WEBPACK_PROD_SOURCE_MAPS_CONFIG = 'webpack.prod.sourcemap.config.ts'
ANALYTICS_CONSTANTS_FILE_PATH = (
    os.path.join('assets', 'analytics-constants.json'))

PORTSERVER_SOCKET_FILEPATH = os.path.join(os.getcwd(), 'portserver.socket')

WEBDRIVER_HOME_PATH = os.path.join(NODE_MODULES_PATH, 'webdriver-manager')
WEBDRIVER_MANAGER_BIN_PATH = (
    os.path.join(WEBDRIVER_HOME_PATH, 'bin', 'webdriver-manager'))
WEBDRIVER_PROVIDER_PATH = (
    os.path.join(WEBDRIVER_HOME_PATH, 'dist', 'lib', 'provider'))
GECKO_PROVIDER_FILE_PATH = (
    os.path.join(WEBDRIVER_PROVIDER_PATH, 'geckodriver.js'))
CHROME_PROVIDER_FILE_PATH = (
    os.path.join(WEBDRIVER_PROVIDER_PATH, 'chromedriver.js'))

PROTRACTOR_BIN_PATH = (
    os.path.join(NODE_MODULES_PATH, 'protractor', 'bin', 'protractor'))
PROTRACTOR_CONFIG_FILE_PATH = (
    os.path.join('core', 'tests', 'protractor.conf.js'))
WEBDRIVERIO_CONFIG_FILE_PATH = (
    os.path.join('core', 'tests', 'wdio.conf.js'))
NODEMODULES_WDIO_BIN_PATH = (
    os.path.join(NODE_MODULES_PATH, '.bin', 'wdio'))

DIRS_TO_ADD_TO_SYS_PATH = [
    GOOGLE_APP_ENGINE_SDK_HOME,
    os.path.join(CURR_DIR, 'proto_files'),
    CURR_DIR,
    THIRD_PARTY_PYTHON_LIBS_DIR,
]


def is_windows_os() -> bool:
    """Check if the running system is Windows."""
    return OS_NAME == 'Windows'


def is_mac_os() -> bool:
    """Check if the running system is MacOS."""
    return OS_NAME == 'Darwin'


def is_linux_os() -> bool:
    """Check if the running system is Linux."""
    return OS_NAME == 'Linux'


def is_x64_architecture() -> bool:
    """Check if the architecture is on X64."""
    # https://docs.python.org/2/library/platform.html#platform.architecture
    return sys.maxsize > 2**32


NODE_BIN_PATH = os.path.join(
    NODE_PATH, '' if is_windows_os() else 'bin', 'node')
NPX_BIN_PATH = os.path.join(
    NODE_PATH, '' if is_windows_os() else 'bin', 'npx')

# Add path for node which is required by the node_modules.
os.environ['PATH'] = os.pathsep.join([
    os.path.dirname(NODE_BIN_PATH),
    os.path.join(YARN_PATH, 'bin'),
    os.environ['PATH'],
])


def run_cmd(cmd_tokens: List[str]) -> str:
    """Runs the command and returns the output.
    Raises subprocess.CalledProcessError upon failure.

    Args:
        cmd_tokens: list(str). The list of command tokens to execute.

    Returns:
        str. The output of the command.
    """
    return subprocess.check_output(
        cmd_tokens, stderr=subprocess.STDOUT, encoding='utf-8').strip()


def ensure_directory_exists(d: str) -> None:
    """Creates the given directory if it does not already exist."""
    if not os.path.exists(d):
        os.makedirs(d)


def require_cwd_to_be_oppia(allow_deploy_dir: bool = False) -> None:
    """Ensures that the current working directory ends in 'oppia'.

    If allow_deploy_dir is True, this also allows the cwd to be a directory
    called 'deploy-*' which is a sibling of the oppia/ directory.
    """
    is_oppia_dir = os.getcwd().endswith('oppia')

    current_dirname = os.path.basename(os.path.normpath(os.getcwd()))
    is_deploy_dir = (
        current_dirname.startswith('deploy-') and
        os.path.isdir(os.path.join(os.getcwd(), os.pardir, 'oppia')))

    if is_oppia_dir or (allow_deploy_dir and is_deploy_dir):
        return

    raise Exception('Please run this script from the oppia/ directory.')


def open_new_tab_in_browser_if_possible(url: str) -> None:
    """Opens the given URL in a new browser tab, if possible."""
    if USER_PREFERENCES['open_new_tab_in_browser'] is None:
        print(
            '\nDo you want the url to be opened in the browser? '
            'Confirm by entering y/ye/yes.')
        USER_PREFERENCES['open_new_tab_in_browser'] = input()
    if USER_PREFERENCES['open_new_tab_in_browser'] not in ['y', 'ye', 'yes']:
        print('Please open the following link in browser: %s' % url)
        return
    browser_cmds = ['brave', 'chromium-browser', 'google-chrome', 'firefox']
    print(
        'Please choose your default browser from the list using a number. '
        'It will be given a preference over other available options.'
    )
    for index, browser in enumerate(browser_cmds):
        print('%s). %s' % (index + 1, browser))

    default_index = int(input().strip()) - 1
    # Re-order the browsers by moving the user selected browser to the
    # first position and copying over the browsers before and after
    # the selected browser in the same order as they were present.
    ordered_browser_cmds = (
        [browser_cmds[default_index]] + browser_cmds[:default_index] +
        browser_cmds[default_index + 1:])
    for cmd in ordered_browser_cmds:
        if subprocess.call(['which', cmd]) == 0:
            subprocess.check_call([cmd, url])
            return
    print('******************************************************************')
    print(
        'WARNING: Unable to open browser. Please manually open the following')
    print('URL in a browser window, then press Enter to confirm.')
    print('')
    print('    %s' % url)
    print('')
    print('NOTE: To get rid of this message, open scripts/common.py and fix')
    print('the function open_new_tab_in_browser_if_possible() to work on your')
    print('system.')
    input()


def get_remote_alias(remote_urls: List[str]) -> str:
    """Finds the correct alias for the given remote repository URLs."""
    git_remote_output = subprocess.check_output(
        ['git', 'remote', '-v'], encoding='utf-8'
    ).split('\n')
    remote_alias = None
    remote_url = None
    for remote_url in remote_urls:
        for line in git_remote_output:
            if remote_url in line:
                remote_alias = line.split()[0]
        if remote_alias:
            break
    if remote_alias is None:
        raise Exception(
            'ERROR: There is no existing remote alias for the %s repo.'
            % ', '.join(remote_urls))

    return remote_alias


def verify_local_repo_is_clean() -> None:
    """Checks that the local Git repo is clean."""
    git_status_output = subprocess.check_output(
        ['git', 'status']
    ).strip().split(b'\n')

    branch_is_clean_message_1 = b'nothing to commit, working directory clean'
    branch_is_clean_message_2 = b'nothing to commit, working tree clean'
    if (
            not branch_is_clean_message_1 in git_status_output and
            not branch_is_clean_message_2 in git_status_output):
        raise Exception(
            'ERROR: This script should be run from a clean branch.')


def get_current_branch_name() -> str:
    """Get the current branch name.

    Returns:
        str. The name of current branch.
    """
    git_status_output = subprocess.check_output(
        ['git', 'status'], encoding='utf-8'
    ).strip().split('\n')
    branch_message_prefix = 'On branch '
    git_status_first_line = git_status_output[0]
    assert git_status_first_line.startswith(branch_message_prefix)
    # Standard output is in bytes, we need to decode the line to print it.
    return git_status_first_line[len(branch_message_prefix):]


def update_branch_with_upstream() -> None:
    """Updates the current branch with upstream."""
    current_branch_name = get_current_branch_name()
    run_cmd(['git', 'pull', 'upstream', current_branch_name])


def get_current_release_version_number(release_branch_name: str) -> str:
    """Gets the release version given a release branch name.

    Args:
        release_branch_name: str. The name of release branch.

    Returns:
        str. The version of release.

    Raises:
        Exception. Invalid name of the release branch.
    """
    release_match = re.match(RELEASE_BRANCH_REGEX, release_branch_name)
    release_maintenance_match = re.match(
        RELEASE_MAINTENANCE_BRANCH_REGEX, release_branch_name)
    hotfix_match = re.match(
        HOTFIX_BRANCH_REGEX, release_branch_name)
    if release_match:
        return release_match.group(1)
    elif release_maintenance_match:
        return release_maintenance_match.group(1)
    elif hotfix_match:
        return hotfix_match.group(1)
    else:
        raise Exception('Invalid branch name: %s.' % release_branch_name)


def is_current_branch_a_hotfix_branch() -> bool:
    """Checks if the current branch is a hotfix branch.

    Returns:
        bool. Whether the current branch is hotfix branch.
    """
    current_branch_name = get_current_branch_name()
    return bool(
        re.match(HOTFIX_BRANCH_REGEX, current_branch_name))


def is_current_branch_a_release_branch() -> bool:
    """Returns whether the current branch is a release branch.

    Returns:
        bool. Whether the current branch is a release branch.
    """
    current_branch_name = get_current_branch_name()
    release_match = bool(re.match(RELEASE_BRANCH_REGEX, current_branch_name))
    release_maintenance_match = bool(
        re.match(RELEASE_MAINTENANCE_BRANCH_REGEX, current_branch_name))
    hotfix_match = bool(
        re.match(HOTFIX_BRANCH_REGEX, current_branch_name))
    return release_match or release_maintenance_match or hotfix_match


def is_current_branch_a_test_branch() -> bool:
    """Returns whether the current branch is a test branch for deployment.

    Returns:
        bool. Whether the current branch is a test branch for deployment.
    """
    current_branch_name = get_current_branch_name()
    return bool(re.match(TEST_BRANCH_REGEX, current_branch_name))


def verify_current_branch_name(expected_branch_name: str) -> None:
    """Checks that the user is on the expected branch."""
    if get_current_branch_name() != expected_branch_name:
        raise Exception(
            'ERROR: This script can only be run from the "%s" branch.' %
            expected_branch_name)


def is_port_in_use(port: int) -> bool:
    """Checks if a process is listening to the port.

    Args:
        port: int. The port number.

    Returns:
        bool. True if port is open else False.
    """
    with contextlib.closing(
        socket.socket(socket.AF_INET, socket.SOCK_STREAM)) as s:
        return bool(not s.connect_ex(('localhost', port)))


def recursive_chown(path: str, uid: int, gid: int) -> None:
    """Changes the owner and group id of all files in a path to the numeric
    uid and gid.

    Args:
        path: str. The path for which owner id and group id need to be setup.
        uid: int. Owner ID to be set.
        gid: int. Group ID to be set.
    """
    os.chown(path, uid, gid)
    for root, directories, filenames in os.walk(path):
        for directory in directories:
            os.chown(os.path.join(root, directory), uid, gid)
        for filename in filenames:
            os.chown(os.path.join(root, filename), uid, gid)


def recursive_chmod(path: str, mode: int) -> None:
    """Changes the mode of path to the passed numeric mode.

    Args:
        path: str. The path for which mode would be set.
        mode: int. The mode to be set.
    """
    os.chmod(path, mode)
    for root, directories, filenames in os.walk(path):
        for directory in directories:
            os.chmod(os.path.join(root, directory), mode)
        for filename in filenames:
            os.chmod(os.path.join(root, filename), mode)


def print_each_string_after_two_new_lines(strings: List[str]) -> None:
    """Prints the given strings, separating adjacent strings with two newlines.

    Args:
        strings: list(str). The strings to print.
    """
    for string in strings:
        print('%s\n' % string)


def install_npm_library(library_name: str, version: str, path: str) -> None:
    """Installs the npm library after ensuring its not already installed.

    Args:
        library_name: str. The library name.
        version: str. The library version.
        path: str. The installation path for the library.
    """
    print('Checking whether %s is installed in %s' % (library_name, path))
    if not os.path.exists(os.path.join(NODE_MODULES_PATH, library_name)):
        print('Installing %s' % library_name)
        subprocess.check_call([
            'yarn', 'add', '%s@%s' % (library_name, version)])


def ask_user_to_confirm(message: str) -> None:
    """Asks user to perform a task and confirm once they are done.

    Args:
        message: str. The message which specifies the task user has
            to do.
    """
    while True:
        print('******************************************************')
        print(message)
        print('Confirm once you are done by entering y/ye/yes.\n')
        answer = input().lower()
        if answer in AFFIRMATIVE_CONFIRMATIONS:
            return


def get_personal_access_token() -> str:
    """"Returns the personal access token for the GitHub id of user.

    Returns:
        str. The personal access token for the GitHub id of user.

    Raises:
        Exception. Personal access token is None.
    """
    personal_access_token = getpass.getpass(
        prompt=(
            'Please provide personal access token for your github ID. '
            'You can create one at https://github.com/settings/tokens: '))

    if personal_access_token is None:
        raise Exception(
            'No personal access token provided, please set up a personal '
            'access token at https://github.com/settings/tokens and re-run '
            'the script')
    return personal_access_token


def check_prs_for_current_release_are_released(
    repo: github.Repository.Repository
) -> None:
    """Checks that all pull requests for current release have a
    'PR: released' label.

    Args:
        repo: github.Repository.Repository. The PyGithub object for the repo.

    Raises:
        Exception. Some pull requests for current release do not have a
            "PR: released" label.
    """
    current_release_label = repo.get_label(
        constants.release_constants.LABEL_FOR_CURRENT_RELEASE_PRS)
    current_release_prs = repo.get_issues(
        state='all', labels=[current_release_label])
    for pr in current_release_prs:
        label_names = [label.name for label in pr.labels]
        if constants.release_constants.LABEL_FOR_RELEASED_PRS not in (
                label_names):
            open_new_tab_in_browser_if_possible(
                'https://github.com/oppia/oppia/pulls?utf8=%E2%9C%93&q=is%3Apr'
                '+label%3A%22PR%3A+for+current+release%22+')
            raise Exception(
                'There are PRs for current release which do not have '
                'a \'PR: released\' label. Please ensure that they are '
                'released before release summary generation.')


def convert_to_posixpath(file_path: str) -> str:
    """Converts a Windows style filepath to posixpath format. If the operating
    system is not Windows, this function does nothing.

    Args:
        file_path: str. The path to be converted.

    Returns:
        str. Returns a posixpath version of the file path.
    """
    if not is_windows_os():
        return file_path
    return file_path.replace('\\', '/')


def create_readme(dir_path: str, readme_content: str) -> None:
    """Creates a readme in a given dir path with the specified
    readme content.

    Args:
        dir_path: str. The path of the dir where the README is to
            be created.
        readme_content: str. The content to be written in the README.
    """
    with utils.open_file(os.path.join(dir_path, 'README.md'), 'w') as f:
        f.write(readme_content)


def inplace_replace_file(
    filename: str,
    regex_pattern: str,
    replacement_string: str,
    expected_number_of_replacements: Optional[int] = None
) -> None:
    """Replace the file content in-place with regex pattern. The pattern is used
    to replace the file's content line by line.

    Note:
        This function should only be used with files that are processed line by
            line.

    Args:
        filename: str. The name of the file to be changed.
        regex_pattern: str. The pattern to check.
        replacement_string: str. The content to be replaced.
        expected_number_of_replacements: optional(int). The number of
            replacements that should be made. When None no check is done.

    Raises:
        ValueError. Wrong number of replacements.
        Exception. The content failed to get replaced.
    """
    backup_filename = '%s.bak' % filename
    shutil.copyfile(filename, backup_filename)
    new_contents = []
    total_number_of_replacements = 0
    try:
        regex = re.compile(regex_pattern)
        with utils.open_file(backup_filename, 'r') as f:
            for line in f:
                new_line, number_of_replacements = regex.subn(
                    replacement_string, line)
                new_contents.append(new_line)
                total_number_of_replacements += number_of_replacements

        with utils.open_file(filename, 'w') as f:
            for line in new_contents:
                f.write(line)

        if (
                expected_number_of_replacements is not None and
                total_number_of_replacements != expected_number_of_replacements
        ):
            raise ValueError(
                'Wrong number of replacements. Expected %s. Performed %s.' % (
                    expected_number_of_replacements,
                    total_number_of_replacements
                )
            )

        os.remove(backup_filename)

    except Exception:
        # Restore the content if there was en error.
        os.remove(filename)
        shutil.move(backup_filename, filename)
        raise


@contextlib.contextmanager
def inplace_replace_file_context(
    filename: str, regex_pattern: str, replacement_string: str
) -> Generator[None, None, None]:
    """Context manager in which the file's content is replaced according to the
    given regex pattern. This function should only be used with files that are
    processed line by line.

    Args:
        filename: str. The name of the file to be changed.
        regex_pattern: str. The pattern to check.
        replacement_string: str. The content to be replaced.

    Yields:
        None. Nothing.
    """
    backup_filename = '%s.bak' % filename
    regex = re.compile(regex_pattern)

    shutil.copyfile(filename, backup_filename)

    try:
        with utils.open_file(backup_filename, 'r') as f:
            new_contents = [regex.sub(replacement_string, line) for line in f]
        with utils.open_file(filename, 'w') as f:
            f.write(''.join(new_contents))
        yield
    finally:
        if os.path.isfile(filename) and os.path.isfile(backup_filename):
            os.remove(filename)
        if os.path.isfile(backup_filename):
            shutil.move(backup_filename, filename)


def wait_for_port_to_be_in_use(port_number: int) -> None:
    """Wait until the port is in use and exit if port isn't open after
    MAX_WAIT_TIME_FOR_PORT_TO_OPEN_SECS seconds.

    Args:
        port_number: int. The port number to wait.
    """
    waited_seconds = 0
    while (not is_port_in_use(port_number)
           and waited_seconds < MAX_WAIT_TIME_FOR_PORT_TO_OPEN_SECS):
        time.sleep(1)
        waited_seconds += 1
    if (waited_seconds == MAX_WAIT_TIME_FOR_PORT_TO_OPEN_SECS
            and not is_port_in_use(port_number)):
        print('Failed to start server on port %s, exiting ...' % port_number)
        print(
            'This may be because you do not have enough available '
            'memory. Please refer to '
            'https://github.com/oppia/oppia/wiki/Troubleshooting#low-ram')
        sys.exit(1)


def wait_for_port_to_not_be_in_use(port_number: int) -> bool:
    """Wait until the port is closed or
    MAX_WAIT_TIME_FOR_PORT_TO_CLOSE_SECS seconds.

    Args:
        port_number: int. The port number to wait.

    Returns:
        bool. Whether the port closed in time.
    """
    waited_seconds = 0
    while (is_port_in_use(port_number)
           and waited_seconds < MAX_WAIT_TIME_FOR_PORT_TO_CLOSE_SECS):
        time.sleep(1)
        waited_seconds += 1
    return not is_port_in_use(port_number)


class CD:
    """Context manager for changing the current working directory."""

    def __init__(self, new_path: str) -> None:
        self.new_path = new_path
        self.saved_path: Optional[str] = None

    def __enter__(self) -> None:
        self.saved_path = os.getcwd()
        os.chdir(self.new_path)

    def __exit__(self, etype: str, value: str, traceback: str) -> None:
        assert self.saved_path is not None
        os.chdir(self.saved_path)


@contextlib.contextmanager
def swap_env(key: str, value: str) -> Generator[Optional[str], None, None]:
    """Context manager that temporarily changes the value of os.environ[key].

    Args:
        key: str. The name of the environment variable to change.
        value: str. The value to give the environment variable.

    Yields:
        str|None. The old value of the environment variable, or None if it did
        not exist.
    """
    old_value = os.environ.get(key, None)
    os.environ[key] = value
    try:
        yield old_value
    finally:
        if old_value is None:
            del os.environ[key]
        else:
            os.environ[key] = old_value


def write_stdout_safe(string: Union[str, bytes]) -> None:
    """Tries to write the input string to stdout in a non-blocking way.

    https://stackoverflow.com/a/44961052/4859885

    Args:
        string: str|bytes. The string to write to stdout.

    Raises:
        OSError. Failed to write the input string.
    """
    string_bytes = string.encode('utf-8') if isinstance(string, str) else string

    num_bytes_written = 0
    while num_bytes_written < len(string_bytes):
        try:
            num_bytes_written += os.write(
                sys.stdout.fileno(), string_bytes[num_bytes_written:])
        # The os.write might not be supported, thus we need
        # to try sys.stdout.write.
        except io.UnsupportedOperation:
            # Standard output accepts str, we need to decode the string_bytes
            # in order to write it.
            sys.stdout.write(string_bytes.decode('utf-8'))
            return
        except OSError as e:
            if e.errno == errno.EAGAIN:
                continue

            raise


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
        except (urlerror.URLError, ssl.SSLError) as exception:
            failures += 1
            print('Attempt %d of %d failed when downloading %s.' % (
                failures, max_attempts, url))
            if failures >= max_attempts:
                raise exception
            print('Error: %s' % exception)
            print('Retrying download.')
        else:
            success = True
