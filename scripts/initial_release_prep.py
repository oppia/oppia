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
import sys

import python_utils
import release_constants

from . import common

_PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
_PYGSHEETS_PATH = os.path.join(_PARENT_DIR, 'oppia_tools', 'pygsheets-2.0.2')
sys.path.insert(0, _PYGSHEETS_PATH)

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
    current_release_month = datetime.datetime.utcnow().strftime('%h')
    for job_detail in job_details:
        if current_release_month in job_detail[month_header]:
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

    for job_detail in job_details:
        job_names_with_instructions_and_author += (
            '%s (Instructions: %s) (Author: %s)\n' % (
                job_detail['job_name'], job_detail['instruction_doc'],
                job_detail['author_name']))
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
        'the job to me and the job author:\n\n'
        'Thanks!\n') % job_names_with_instructions_and_author
    return mail_message_template


def main():
    """Performs task to initiate the release."""
    common.require_cwd_to_be_oppia()
    common.open_new_tab_in_browser_if_possible(
        release_constants.RELEASE_NOTES_URL)
    common.ask_user_to_confirm(
        'Please check if anything extra is required for the release '
        'and keep a track of this and do it at the appropriate point.')

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
    try:
        f = python_utils.open_file(RELEASE_CREDENTIALS_FILEPATH, 'w')
        f.close()
        common.ask_user_to_confirm(
            'Copy the release json credentials from the release '
            'doc and paste them in the file %s. Make sure to save the '
            'file once you are done.' % (
                RELEASE_CREDENTIALS_FILEPATH))
        client = pygsheets.authorize(client_secret=RELEASE_CREDENTIALS_FILEPATH)

        existing_jobs_sheet = client.open(
            'Oppia release team: Submitting an existing job for '
            'testing on the Oppia test server (Responses)').sheet1
        existing_job_details = get_job_details_for_current_release(
            existing_jobs_sheet.get_all_records(),
            'Select the job you want to test',
            'Which upcoming release are you targeting this job for? ',
            'Email Address',
            'What is your name? ',
            'Please give a clear description of why you want to '
            'run this job on the test server')
        existing_job_names = [
            job_detail['job_name'] for job_detail in existing_job_details]

        new_jobs_sheet = client.open(
            'Oppia release team: Submitting a job for testing (Responses)'
            ).sheet1
        new_job_details = get_job_details_for_current_release(
            new_jobs_sheet.get_all_records(),
            'What is the name of the job to be run?',
            'Which upcoming release are you targeting this job for?',
            'Email Address',
            'What is your name?',
            'URL of a Google Doc with clear instructions on what the tester '
            'needs to do:')
        new_job_names = [
            job_detail['job_name'] for job_detail in new_job_details]

        python_utils.PRINT(
            'Existing jobs to run:\n%s\n' % ('\n').join(existing_job_names))
        python_utils.PRINT(
            'New jobs to run:\n%s\n' % ('\n').join(new_job_names))
        common.open_new_tab_in_browser_if_possible(
            release_constants.RELEASE_DRIVE_URL)
        common.ask_user_to_confirm(
            'Please enter the above job names to release journal.')

        common.open_new_tab_in_browser_if_possible(
            release_constants.EXISTING_JOB_SPREADSHEETS_URL)
        common.open_new_tab_in_browser_if_possible(
            release_constants.NEW_JOBS_SPREADSHEET_URL)
        python_utils.PRINT(
            get_mail_message_template(existing_job_details + new_job_details))
        author_mail_ids = [
            job_details['author_email'] for job_details in (
                existing_job_details + new_job_details)]
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
