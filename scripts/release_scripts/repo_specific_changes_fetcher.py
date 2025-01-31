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

from __future__ import annotations

import argparse
import os
import re

from core import utils
from scripts import common
from typing import Dict, Final, List, Optional

GIT_CMD_DIFF_NAMES_ONLY_FORMAT_STRING: Final = 'git diff --name-only %s %s'
GIT_CMD_SHOW_FORMAT_STRING: Final = 'git show %s:core/feconf.py'
VERSION_RE_FORMAT_STRING: Final = r'%s\s*=\s*(\d+|\.)+'
FECONF_SCHEMA_VERSION_CONSTANT_NAMES: Final = [
    'CURRENT_STATE_SCHEMA_VERSION', 'CURRENT_COLLECTION_SCHEMA_VERSION']
FECONF_FILEPATH: Final = os.path.join('core', 'feconf.py')


_PARSER: Final = argparse.ArgumentParser()
_PARSER.add_argument(
    '--release_tag',
    required=True,
    type=str,
    help='The release tag from which to fetch the changes.'
)


def get_changed_schema_version_constant_names(
    release_tag_to_diff_against: str
) -> List[str]:
    """Returns a list of schema version constant names in feconf that have
    changed since the release against which diff is being checked.

    Args:
        release_tag_to_diff_against: str. The release tag to diff against.

    Returns:
        list(str). List of version constant names in feconf that changed.
    """
    changed_version_constants_in_feconf = []
    git_show_cmd = GIT_CMD_SHOW_FORMAT_STRING % release_tag_to_diff_against
    old_feconf = common.run_cmd(git_show_cmd.split(' '))
    with utils.open_file(FECONF_FILEPATH, 'r') as feconf_file:
        new_feconf = feconf_file.read()
    for version_constant in FECONF_SCHEMA_VERSION_CONSTANT_NAMES:
        old_version = re.findall(
            VERSION_RE_FORMAT_STRING % version_constant, old_feconf)[0]
        new_version = re.findall(
            VERSION_RE_FORMAT_STRING % version_constant, new_feconf)[0]
        if old_version != new_version:
            changed_version_constants_in_feconf.append(version_constant)
    return changed_version_constants_in_feconf


def _get_changed_filenames_since_tag(
    release_tag_to_diff_against: str
) -> List[str]:
    """Get names of changed files from git since a given release.

    Args:
        release_tag_to_diff_against: str. The release tag to diff against.

    Returns:
        list(str). List of filenames for files that have been modified since
        the release against which diff is being checked.
    """
    diff_cmd = (
        GIT_CMD_DIFF_NAMES_ONLY_FORMAT_STRING % (
            release_tag_to_diff_against, 'HEAD'))
    return common.run_cmd(diff_cmd.split(' ')).splitlines()


def get_setup_scripts_changes_status(
    release_tag_to_diff_against: str
) -> Dict[str, bool]:
    """Returns a dict of setup script filepaths with a status of whether
    they have changed or not since the release against which diff is
    being checked.

    Args:
        release_tag_to_diff_against: str. The release tag to diff against.

    Returns:
        dict. Dict consisting of key as script name and value as boolean
        indicating whether or not the script is modified since the release
        against which diff is being checked.
    """
    setup_script_filepaths = ['scripts/install_third_party_libs.py']
    changed_filenames = _get_changed_filenames_since_tag(
        release_tag_to_diff_against)
    changes_dict = {
        script_filepath: script_filepath in changed_filenames
        for script_filepath in setup_script_filepaths}
    return changes_dict


def get_changed_storage_models_filenames(
    release_tag_to_diff_against: str
) -> List[str]:
    """Returns a list of filepaths in core/storage whose contents have
    changed since the release against which diff is being checked.

    Args:
        release_tag_to_diff_against: str. The release tag to diff against.

    Returns:
        list(str). The changed filenames in core/storage (if any).
    """
    changed_model_filenames = _get_changed_filenames_since_tag(
        release_tag_to_diff_against)
    return [
        model_filename for model_filename in changed_model_filenames
        if model_filename.startswith('core/storage')]


def get_changes(release_tag_to_diff_against: str) -> List[str]:
    """Collects changes in storage models, setup scripts and feconf
    since the release tag passed in arguments.

    Args:
        release_tag_to_diff_against: str. The release tag to diff against.

    Returns:
        list(str). A list of lines to be written to the release summary file.
        These lines describe the changed storage model names, setup script names
        and feconf schema version names since the release against which diff is
        being checked.
    """
    changes = []

    feconf_version_changes = get_changed_schema_version_constant_names(
        release_tag_to_diff_against)
    if feconf_version_changes:
        changes.append(
            '\n### Feconf version changes:\nThis indicates that a '
            'migration may be needed\n\n')
        for var in feconf_version_changes:
            changes.append('* %s\n' % var)

    setup_changes = get_setup_scripts_changes_status(
        release_tag_to_diff_against)
    if setup_changes:
        changes.append('\n### Changed setup scripts:\n')
        for var in setup_changes.keys():
            changes.append('* %s\n' % var)

    storage_changes = get_setup_scripts_changes_status(
        release_tag_to_diff_against)
    if storage_changes:
        changes.append('\n### Changed storage models:\n')
        for item in storage_changes:
            changes.append('* %s\n' % item)

    return changes


def main(args: Optional[List[str]] = None) -> None:
    """Main method for fetching repo specific changes."""
    options = _PARSER.parse_args(args=args)
    changes = get_changes(options.release_tag)
    print('\n'.join(changes))


# The 'no coverage' pragma is used as this line is un-testable. This is because
# it will only be called when deploy.py is used as a script.
if __name__ == '__main__':  # pragma: no cover
    main()
