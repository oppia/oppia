#!/usr/bin/env python
#
# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

"""Script for initial release preparation."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import re
import subprocess

import python_utils
import release_constants
from scripts import common


def get_extra_jobs_due_to_schema_changes(
        remote_alias, previous_release_version):
    """Finds additional jobs which should be run based on
    schema changes in feconf.

    Args:
        remote_alias: str. The alias for Oppia repo.
        previous_release_version: str. The version of the previous release.

    Returns:
        list(str). The list of jobs to run based on schema changes.
    """
    schema_versions_to_jobs_mapping = {
        'CURRENT_COLLECTION_SCHEMA_VERSION': 'CollectionMigrationOneOffJob',
        'CURRENT_STATE_SCHEMA_VERSION': 'ExplorationMigrationJobManager',
        'CURRENT_SKILL_CONTENTS_SCHEMA_VERSION': 'SkillMigrationOneOffJob',
        'CURRENT_MISCONCEPTIONS_SCHEMA_VERSION': 'SkillMigrationOneOffJob',
        'CURRENT_RUBRIC_SCHEMA_VERSION': 'SkillMigrationOneOffJob',
        'CURRENT_STORY_CONTENTS_SCHEMA_VERSION': 'StoryMigrationOneOffJob',
        'CURRENT_SUBTOPIC_SCHEMA_VERSION': 'TopicMigrationOneOffJob',
        'CURRENT_STORY_REFERENCE_SCHEMA_VERSION': 'TopicMigrationOneOffJob'}

    diff_output = common.run_cmd([
        'git', 'diff', '%s/develop' % remote_alias,
        '%s/release-%s' % (remote_alias, previous_release_version),
        'feconf.py'])
    feconf_diff = diff_output[:-1].split('\n')

    jobs_to_run = []
    for version_key in schema_versions_to_jobs_mapping:
        for line in feconf_diff:
            if line.startswith(('+%s' % version_key, '-%s' % version_key)):
                jobs_to_run.append(schema_versions_to_jobs_mapping[version_key])

    return list(set(jobs_to_run))


def did_supported_audio_languages_change(
        remote_alias, previous_release_version):
    """Checks changes in constants.SUPPORTED_AUDIO_LANGUAGES between
    the current and previous release.

    Args:
        remote_alias: str. The alias for Oppia repo.
        previous_release_version: str. The version of the previous release.

    Returns:
        bool. Whether supported audio languages have changed.
    """
    try:
        from constants import constants
        supported_audio_language_ids_for_current_release = [
            lang_dict['id'] for lang_dict in constants[
                'SUPPORTED_AUDIO_LANGUAGES']]

        common.run_cmd([
            'git', 'checkout',
            '%s/release-%s' % (remote_alias, previous_release_version),
            '--', 'assets/constants.ts'])
        from constants import constants
        supported_audio_language_ids_for_previous_release = [
            lang_dict['id'] for lang_dict in constants[
                'SUPPORTED_AUDIO_LANGUAGES']]
    finally:
        common.run_cmd(['git', 'reset', 'assets/constants.ts'])
        common.run_cmd(['git', 'checkout', '--', 'assets/constants.ts'])

    return (
        sorted(supported_audio_language_ids_for_current_release) != sorted(
            supported_audio_language_ids_for_previous_release))


def cut_release_branch():
    """Calls the cut_release_or_hotfix_branch script to cut a release branch.

    Raises:
        AssertionError. The version entered is invalid.
    """
    common.open_new_tab_in_browser_if_possible(
        'https://github.com/oppia/oppia/releases')
    python_utils.PRINT(
        'Enter the new version for the release.\n'
        'If major changes occurred since the last release, or if '
        'the third version is a 9, increment the minor version '
        '(e.g. 2.5.3 -> 2.6.0 or 2.5.9 -> 2.6.0)\n'
        'Otherwise, increment the third version number '
        '(e.g. 2.5.3 -> 2.5.4)\n')
    release_version = python_utils.INPUT()
    assert re.match(r'\d+\.\d+\.\d+$', release_version)
    subprocess.check_call([
        'python', '-m',
        'scripts.release_scripts.cut_release_or_hotfix_branch',
        '--release_version=%s' % release_version])


def main():
    """Performs task to initiate the release."""
    common.require_cwd_to_be_oppia()
    common.verify_current_branch_name('develop')
    common.open_new_tab_in_browser_if_possible(
        release_constants.RELEASE_NOTES_URL)
    common.ask_user_to_confirm(
        'Please check if anything extra is required for the release. '
        'If so, keep track of this and do it at the appropriate point.')

    common.open_new_tab_in_browser_if_possible(
        release_constants.RELEASE_DRIVE_URL)
    python_utils.PRINT(
        'Has the QA lead created a document for the current release?\n'
        'Confirm by entering y/ye/yes.\n')
    doc_for_release_created = python_utils.INPUT().lower()
    if doc_for_release_created not in (
            release_constants.AFFIRMATIVE_CONFIRMATIONS):
        raise Exception(
            'Please ensure a new doc is created for the '
            'release before starting with the release process.')

    remote_alias = common.get_remote_alias(release_constants.REMOTE_URL)
    python_utils.PRINT('Enter version of previous release.')
    previous_release_version = python_utils.INPUT()
    assert re.match(r'^\d+\.\d+\.\d+$', previous_release_version)

    extra_jobs_to_run = get_extra_jobs_due_to_schema_changes(
        remote_alias, previous_release_version)
    if did_supported_audio_languages_change(
            remote_alias, previous_release_version):
        # This job is run so that an opportunity is created for
        # contributors to translate and voiceover an exploration
        # whenever a new audio language is added.
        # Refer: https://github.com/oppia/oppia/issues/8027.
        extra_jobs_to_run.append(
            'ExplorationOpportunitySummaryModelRegenerationJob')
    if extra_jobs_to_run:
        common.ask_user_to_confirm(
            'Please add the following jobs to release journal and '
            'run them after deployment:\n%s' % '\n'.join(extra_jobs_to_run))

    common.open_new_tab_in_browser_if_possible(
        release_constants.REPEATABLE_JOBS_SPREADSHEETS_URL)
    common.open_new_tab_in_browser_if_possible(
        release_constants.ONE_TIME_JOBS_SPREADSHEET_URL)
    common.ask_user_to_confirm(
        'Please copy the names of the jobs to be run for this release along '
        'with author names, author mail ids & instruction docs.\n'
        'Note: Copy only those jobs that have been successfully run '
        'on backup server.')
    common.open_new_tab_in_browser_if_possible(
        release_constants.RELEASE_DRIVE_URL)
    common.ask_user_to_confirm(
        'Please enter the above job names to release journal.')

    cut_release_branch()


# The 'no coverage' pragma is used as this line is un-testable. This is because
# it will only be called when initial_release_prep.py is used as a script.
if __name__ == '__main__': # pragma: no cover
    main()
