#!/usr/bin/env python
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Script that provides changes specific to oppia repo to be written
to release summary file.
"""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os
import re

import python_utils
from scripts import common

GIT_CMD_DIFF_NAMES_ONLY_FORMAT_STRING = 'git diff --name-only %s %s'
GIT_CMD_SHOW_FORMAT_STRING = 'git show %s:feconf.py'
VERSION_RE_FORMAT_STRING = r'%s\s*=\s*(\d+|\.)+'
FECONF_VAR_NAMES = ['CURRENT_STATE_SCHEMA_VERSION',
                    'CURRENT_COLLECTION_SCHEMA_VERSION']
FECONF_FILEPATH = os.path.join('', 'feconf.py')


def check_versions(current_release):
    """Checks if the versions for the exploration or collection schemas have
    changed.

    Args:
        current_release: str. The current release tag to diff against.

    Returns:
        list(str). List of variable names that changed.
    """
    feconf_changed_version = []
    git_show_cmd = (GIT_CMD_SHOW_FORMAT_STRING % current_release)
    old_feconf = common.run_cmd(git_show_cmd.split(' '))
    with python_utils.open_file(FECONF_FILEPATH, 'r') as feconf_file:
        new_feconf = feconf_file.read()
    for variable in FECONF_VAR_NAMES:
        old_version = re.findall(
            VERSION_RE_FORMAT_STRING % variable, old_feconf)[0]
        new_version = re.findall(
            VERSION_RE_FORMAT_STRING % variable, new_feconf)[0]
        if old_version != new_version:
            feconf_changed_version.append(variable)
    return feconf_changed_version


def _git_diff_names_only(left, right='HEAD'):
    """Get names of changed files from git.

    Args:
        left: str. Lefthand timepoint.
        right: str. Rightand timepoint.

    Returns:
        list(str). List of files that are different between the two points.
    """
    diff_cmd = (GIT_CMD_DIFF_NAMES_ONLY_FORMAT_STRING % (left, right))
    return common.run_cmd(diff_cmd.split(' ')).splitlines()


def check_setup_scripts(base_release_tag, changed_only=True):
    """Check if setup scripts have changed.

    Args:
        base_release_tag: str. The current release tag to diff against.
        changed_only: bool. If set to False will return all tested files
            instead of just the changed ones.

    Returns:
        dict. Dict consisting of script or boolean indicating whether or not it
        has changed (filtered by default to those that are modified).
    """
    setup_scripts = ['scripts/%s' % item for item in
                     ['setup.py', 'setup_gae.py', 'install_third_party_libs.py',
                      'install_third_party.py']]
    changed_files = _git_diff_names_only(base_release_tag)
    changes_dict = {script: script in changed_files
                    for script in setup_scripts}
    if changed_only:
        return {name: status for name, status
                in changes_dict.items() if status}
    else:
        return changes_dict


def check_storage_models(current_release):
    """Check if files in core/storage have changed and returns them.

    Args:
        current_release: str. The current release version.

    Returns:
        list(str). The changed files (if any).
    """
    diff_list = _git_diff_names_only(current_release)
    return [item for item in diff_list if item.startswith('core/storage')]


def get_changes(current_release):
    """Collects necessary info and dumps it to disk.

    Args:
        current_release: str. The current release version.

    Returns:
        list(str). The list of repo specific changes to write to release
        summary file.
    """
    changes = []

    feconf_version_changes = check_versions(current_release)
    if feconf_version_changes:
        changes.append(
            '\n### Feconf version changes:\nThis indicates that a '
            'migration may be needed\n\n')
        for var in feconf_version_changes:
            changes.append('* %s\n' % var)

    setup_changes = check_setup_scripts(current_release)
    if setup_changes:
        changes.append('\n### Changed setup scripts:\n')
        for var in setup_changes.keys():
            changes.append('* %s\n' % var)

    storage_changes = check_setup_scripts(current_release)
    if storage_changes:
        changes.append('\n### Changed storage models:\n')
        for item in storage_changes:
            changes.append('* %s\n' % item)

    return changes
