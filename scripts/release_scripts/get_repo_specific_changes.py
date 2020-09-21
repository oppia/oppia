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


def get_changes_in_versions(release_tag_to_diff_against):
    """Returns a list of schema version variable names in feconf that have
    changed since the release against which diff is being checked.

    Args:
        release_tag_to_diff_against: str. The release tag to diff against.

    Returns:
        list(str). List of version variable names in feconf that changed.
    """
    changed_version_vars_in_feconf = []
    git_show_cmd = (GIT_CMD_SHOW_FORMAT_STRING % release_tag_to_diff_against)
    old_feconf = common.run_cmd(git_show_cmd.split(' '))
    with python_utils.open_file(FECONF_FILEPATH, 'r') as feconf_file:
        new_feconf = feconf_file.read()
    for variable in FECONF_VAR_NAMES:
        old_version = re.findall(
            VERSION_RE_FORMAT_STRING % variable, old_feconf)[0]
        new_version = re.findall(
            VERSION_RE_FORMAT_STRING % variable, new_feconf)[0]
        if old_version != new_version:
            changed_version_vars_in_feconf.append(variable)
    return changed_version_vars_in_feconf


def _git_diff_names_only(first_release_tag, second_release_tag='HEAD'):
    """Get names of changed files from git between two releases.

    Args:
        first_release_tag: str. The first release tag to diff against.
        second_release_tag: str. The second release tag to diff against.

    Returns:
        list(str). List of filenames that are different between two releases.
    """
    diff_cmd = (
        GIT_CMD_DIFF_NAMES_ONLY_FORMAT_STRING % (
            first_release_tag, second_release_tag))
    return common.run_cmd(diff_cmd.split(' ')).splitlines()


def get_changes_in_setup_scripts(
        release_tag_to_diff_against, only_include_changed_scripts=True):
    """Returns a dict of setup script with a status of whether they have
    changed or not since the release against which diff is being checked.

    Args:
        release_tag_to_diff_against: str. The release tag to diff against.
        only_include_changed_scripts: bool. If true the output dict only
            include the setup scripts which changed. If false, the output dict
            will include the status for all setup scripts which are checked
            irrespective of whether they are changed or not.

    Returns:
        dict. Dict consisting of key as script name and value as boolean
        indicating whether or not it has changed
        (filtered by default to those that are modified).
    """
    setup_scripts = ['scripts/%s' % item for item in
                     ['setup.py', 'setup_gae.py', 'install_third_party_libs.py',
                      'install_third_party.py']]
    changed_files = _git_diff_names_only(release_tag_to_diff_against)
    changes_dict = {script: script in changed_files
                    for script in setup_scripts}
    if only_include_changed_scripts:
        return {name: status for name, status
                in changes_dict.items() if status}
    else:
        return changes_dict


def get_changes_in_storage_models(release_tag_to_diff_against):
    """Returns a list of filepaths in core/storage whose contents have
    changed since the release against which diff is being checked.

    Args:
        release_tag_to_diff_against: str. The release tag to diff against.

    Returns:
        list(str). The changed filenames in core/storage (if any).
    """
    diff_list = _git_diff_names_only(release_tag_to_diff_against)
    return [item for item in diff_list if item.startswith('core/storage')]


def get_changes(release_tag_to_diff_against):
    """Collects changes in storage models, setup scripts and feconf
    since the specified release in args.

    Args:
        release_tag_to_diff_against: str. The release tag to diff against.

    Returns:
        list(str). A list of lines to be written to the release summary file.
        These lines describe the changed storage models, setup scripts and
        feconf schema versions since the release against which diff is being
        checked.
    """
    changes = []

    feconf_version_changes = get_changes_in_versions(
        release_tag_to_diff_against)
    if feconf_version_changes:
        changes.append(
            '\n### Feconf version changes:\nThis indicates that a '
            'migration may be needed\n\n')
        for var in feconf_version_changes:
            changes.append('* %s\n' % var)

    setup_changes = get_changes_in_setup_scripts(release_tag_to_diff_against)
    if setup_changes:
        changes.append('\n### Changed setup scripts:\n')
        for var in setup_changes.keys():
            changes.append('* %s\n' % var)

    storage_changes = get_changes_in_setup_scripts(release_tag_to_diff_against)
    if storage_changes:
        changes.append('\n### Changed storage models:\n')
        for item in storage_changes:
            changes.append('* %s\n' % item)

    return changes
