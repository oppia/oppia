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

import datetime
import os
import re
import sys

import python_utils
import release_constants
from scripts import common

_PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
_APPENGINE_PATH = os.path.join(
    _PARENT_DIR, 'oppia_tools', 'google_appengine_1.9.67', 'google_appengine')
_PYGSHEETS_PATH = os.path.join(_PARENT_DIR, 'oppia_tools', 'pygsheets-2.0.2')
_GOOGLE_PATH = os.path.join(_PYGSHEETS_PATH, 'google')

sys.path.insert(0, _APPENGINE_PATH)
sys.path.insert(0, _PYGSHEETS_PATH)

# pylint: disable=wrong-import-position
import google # isort:skip
# pylint: enable=wrong-import-position

# Refer: https://groups.google.com/forum/#!topic/google-appengine/AJJbuQ3FaGI.
google.__path__.append(_GOOGLE_PATH)

# pylint: disable=wrong-import-position
import pygsheets # isort:skip
# pylint: enable=wrong-import-position

RELEASE_CREDENTIALS_FILEPATH = os.path.join(
    os.getcwd(), 'oppia-release-credentials.json')
# This file is created when pygsheets asks the user to authenticate.
AUTH_FILEPATH = os.path.join(os.getcwd(), 'sheets.googleapis.com-python.json')


def get_job_details_for_current_release(
        job_details, job_name_header, month_header, author_email_header,
        author_name_header, instruction_doc_header):
    """Returns a list of job names for current release from a list
    of job details.

    Args:
        job_details: list(dict). List of dictionary of job details.
            The keys of each dict are the headers from the jobs
            spreadsheet.
        job_name_header: string. The header used for job names.
        month_header: string. The header used for month of the release.
        author_email_header: string. The header used for email address of
            job author.
        author_name_header: string. The header used for name of
            job author.
        instruction_doc_header: string. The header used for instruction
            doc for running the job.

    Returns:
        list(dict). The list of job details for current release.
    """
    job_details_for_current_release = []
    # First three letters of the release month. Eg: Nov, Dec etc.
    current_release_month = datetime.datetime.utcnow().strftime('%h').lower()
    for job_detail in job_details:
        if current_release_month in job_detail[month_header].lower():
            job_details_for_current_release.append({
                'job_name': job_detail[job_name_header],
                'author_email': job_detail[author_email_header],
                'author_name': job_detail[author_name_header],
                'instruction_doc': job_detail[instruction_doc_header]
            })
    return job_details_for_current_release


def get_mail_message_template(job_details):
    """Returns a mail template with the details for running jobs for release
    on backup server.

    Args:
        job_details: list(dict). List of dictionary of job details. The dict
            has the following keys: job_name, author_email, author_name,
            instruction_doc.

    Returns:
        string. The mail message template.
    """
    job_names_with_instructions_and_author = ''
    author_names_and_mail_ids = []
    for job_detail in job_details:
        job_names_with_instructions_and_author += (
            '%s (Instructions: %s) (Author: %s)\n' % (
                job_detail['job_name'], job_detail['instruction_doc'],
                job_detail['author_name']))
        author_names_and_mail_ids.append(
            '%s: %s' % (
                job_detail['author_name'], job_detail['author_email']))
    author_names_and_mail_ids = list(set(author_names_and_mail_ids))
    mail_message_template = (
        'Hi Sean,\n\n'
        'You will need to run these jobs on the backup server:\n\n'
        '%s\n'
        'The specific instructions for jobs are linked with them. '
        'The general instructions are as follows:\n\n'
        '1. Login as admin\n'
        '2. Navigate to the admin panel and then the jobs tab\n'
        '3. Run the above jobs\n'
        '4. In case of failure/success, please send the output logs for '
        'the job to me and the job authors: %s\n\n'
        'Thanks!\n') % (
            job_names_with_instructions_and_author, author_names_and_mail_ids)
    return mail_message_template


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


def main():
    """Performs task to initiate the release."""
    common.require_cwd_to_be_oppia()
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
    try:
        # The file here is opened and closed just to create an empty
        # file where the release co-ordinator can enter the credentials.
        f = python_utils.open_file(RELEASE_CREDENTIALS_FILEPATH, 'w')
        f.close()
        common.ask_user_to_confirm(
            'Copy the release json credentials from the release '
            'doc and paste them in the file %s. Make sure to save the '
            'file once you are done.' % (
                RELEASE_CREDENTIALS_FILEPATH))
        client = pygsheets.authorize(client_secret=RELEASE_CREDENTIALS_FILEPATH)

        repeatable_jobs_sheet = client.open(
            'Oppia release team: Submitting an existing job for '
            'testing on the Oppia test server (Responses)').sheet1
        repeatable_job_details = get_job_details_for_current_release(
            repeatable_jobs_sheet.get_all_records(),
            'Select the job you want to test',
            'Which upcoming release are you targeting this job for? ',
            'Email Address',
            'What is your name? ',
            'Please give a clear description of why you want to '
            'run this job on the test server')
        repeatable_job_names = [
            job_detail['job_name'] for job_detail in repeatable_job_details]

        one_time_jobs_sheet = client.open(
            'Oppia release team: Submitting a job for testing (Responses)'
            ).sheet1
        one_time_job_details = get_job_details_for_current_release(
            one_time_jobs_sheet.get_all_records(),
            'What is the name of the job to be run?',
            'Which upcoming release are you targeting this job for?',
            'Email Address',
            'What is your name?',
            'URL of a Google Doc with clear instructions on what the tester '
            'needs to do:')
        one_time_job_names = [
            job_detail['job_name'] for job_detail in one_time_job_details]

        python_utils.PRINT(
            'Repeatable jobs to run:\n%s\n' % ('\n').join(repeatable_job_names))
        python_utils.PRINT(
            'One time jobs to run:\n%s\n' % ('\n').join(one_time_job_names))
        common.open_new_tab_in_browser_if_possible(
            release_constants.RELEASE_DRIVE_URL)
        common.ask_user_to_confirm(
            'Please enter the above job names to release journal.')

        common.open_new_tab_in_browser_if_possible(
            release_constants.REPEATABLE_JOBS_SPREADSHEETS_URL)
        common.open_new_tab_in_browser_if_possible(
            release_constants.ONE_TIME_JOBS_SPREADSHEET_URL)
        python_utils.PRINT(
            get_mail_message_template(
                repeatable_job_details + one_time_job_details))
        author_mail_ids = [
            job_details['author_email'] for job_details in (
                repeatable_job_details + one_time_job_details)]
        common.ask_user_to_confirm(
            'Note: Send the mail only after deploying to backup server.\n\n'
            'Note: Add author email ids: %s to the cc list when you send '
            'the mail\n\n.'
            'Note: Please check manually if the details in the above mail are '
            'correct and add anything extra if required.\n\n'
            'Copy and save the above template for sending a mail to Sean '
            'to run these jobs on backup server.\n\n'
            'If the jobs are successful on backup server, run them on test '
            'and prod server.' % list(set(author_mail_ids)))
    finally:
        if os.path.isfile(RELEASE_CREDENTIALS_FILEPATH):
            os.remove(RELEASE_CREDENTIALS_FILEPATH)
        if os.path.isfile(AUTH_FILEPATH):
            os.remove(AUTH_FILEPATH)


# The 'no coverage' pragma is used as this line is un-testable. This is because
# it will only be called when initial_release_prep.py is used as a script.
if __name__ == '__main__': # pragma: no cover
    main()
