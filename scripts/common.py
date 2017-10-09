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

import os
import subprocess


def ensure_directory_exists(d):
    """Creates the given directory if it does not already exist."""
    if not os.path.exists(d):
        os.makedirs(d)


def require_cwd_to_be_oppia(allow_deploy_dir=False):
    """Ensures that the current working directory ends in 'oppia'.

    If allow_deploy_dir is True, this also allows the cwd to be a directory
    called 'deploy-*' which is a sibling of the oppia/ directory.
    """
    is_oppia_dir = os.getcwd().endswith('oppia')

    current_dirname = os.path.basename(os.path.normpath(os.getcwd()))
    is_deploy_dir = (
        current_dirname.startswith('deploy-') and
        os.path.isdir(os.path.join(os.getcwd(), '..', 'oppia')))

    if is_oppia_dir or (allow_deploy_dir and is_deploy_dir):
        return

    raise Exception('Please run this script from the oppia/ directory.')


def open_new_tab_in_browser_if_possible(url):
    """Opens the given URL in a new browser tab, if possible."""
    browser_cmds = ['chromium-browser', 'google-chrome', 'firefox']
    for cmd in browser_cmds:
        if subprocess.call(['which', cmd]) == 0:
            subprocess.call([cmd, url])
            return


def get_remote_alias(remote_url):
    """Finds the correct alias for the given remote repository URL."""
    git_remote_output = subprocess.check_output(
        ['git', 'remote', '-v']).split('\n')
    remote_alias = None
    for line in git_remote_output:
        if remote_url in line:
            remote_alias = line.split()[0]
    if remote_alias is None:
        raise Exception(
            'ERROR: There is no existing remote alias for the %s repo.'
            % remote_url)

    return remote_alias


def verify_local_repo_is_clean():
    """Checks that the local Git repo is clean."""
    git_status_output = subprocess.check_output(
        ['git', 'status']).strip().split('\n')

    branch_is_clean_message = 'nothing to commit, working directory clean'
    if not branch_is_clean_message in git_status_output:
        raise Exception(
            'ERROR: This script should be run from a clean branch.')


def get_current_branch_name():
    """Get the current branch name."""
    git_status_output = subprocess.check_output(
        ['git', 'status']).strip().split('\n')
    branch_message_prefix = 'On branch '
    git_status_first_line = git_status_output[0]
    assert git_status_first_line.startswith(branch_message_prefix)
    return git_status_first_line[branch_message_prefix:]


def verify_current_branch_name(expected_branch_name):
    """Checks that the user is on the expected branch."""
    if get_current_branch_name() != expected_branch_name:
        raise Exception(
            'ERROR: This script can only be run from the "%s" branch.' %
            expected_branch_name)


class CD(object):
    """Context manager for changing the current working directory."""
    def __init__(self, new_path):
        self.new_path = new_path
        self.saved_path = None

    def __enter__(self):
        self.saved_path = os.getcwd()
        os.chdir(self.new_path)

    def __exit__(self, etype, value, traceback):
        os.chdir(self.saved_path)
