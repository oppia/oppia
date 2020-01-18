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

"""Script that generates announcement mail for the release."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os

import python_utils
import release_constants
from scripts import common

SECTIONS_TO_ADD = [
    '[Add main changes]',
    '[Add editorials/announcements if required]',
    '[Add Author details (Use Email C&P Blurbs about authors from '
    'release_summary.md)]',
    '[Add names of release testers]',
    '[Add name of QA team lead for the release]',
    '[Add your name]']
RELEASE_MAIL_MESSAGE_TEMPLATE = (
    'Hi all,\n\n'
    '   We are happy to announce the release of v%s of Oppia.\n'
    '   The main changes in this release are %s.\n'
    '   %s.\n'
    '   %s\n'
    '   Finally, I\'d like to thank %s for their help with pre-release '
    'testing, bug-fixing and QA, as well as %s for leading the QA team for '
    'this release.\n\n'
    'Thanks,\n'
    '%s\n')

PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
RELEASE_MAIL_MESSAGE_FILEPATH = os.path.join(
    PARENT_DIR, 'release_mail_message.txt')


def create_new_file_with_release_message_template():
    """Adds the template message to release mail filepath."""
    release_version = common.get_current_release_version_number(
        common.get_current_branch_name())
    with python_utils.open_file(RELEASE_MAIL_MESSAGE_FILEPATH, 'w') as f:
        f.write(RELEASE_MAIL_MESSAGE_TEMPLATE % (
            tuple([release_version] + SECTIONS_TO_ADD)))

    common.ask_user_to_confirm(
        'Please make updates to following file %s for generating the '
        'release announcement mail by adding:\n'
        '   1. Main changes for release\n'
        '   2. Editorials/announcements if required\n'
        '   3. Author details from release_summary.md\n'
        '   4. Names of release testers\n'
        '   5. Name of QA Team lead\n'
        '   6. Your name\n' % RELEASE_MAIL_MESSAGE_FILEPATH)


def validate_release_message():
    """Checks the message after the mail template is updated by the
    user.

    Raises:
        Exception: The message still contains sections from template
            which are not updated.
    """
    with python_utils.open_file(RELEASE_MAIL_MESSAGE_FILEPATH, 'r') as f:
        release_mail_message = f.read()
        extra_sections = [
            section for section in SECTIONS_TO_ADD if (
                section in release_mail_message)]
        if extra_sections:
            raise Exception(
                'Template not formatted correctly. '
                'Following sections still not updated: %s.\n'
                'Please re-run the scripts and make the updates again.' % (
                    ', '.join(extra_sections)))


def get_new_authors_and_contributors_mail_ids():
    """Returns the mail ids of new authors and contributors for the release.

    Returns:
        list(str). List of mail ids of new authors and contributors
            for the release.
    """
    with python_utils.open_file(
        release_constants.RELEASE_SUMMARY_FILEPATH, 'r') as f:
        release_summary_lines = f.readlines()

    new_authors_and_contributors_mail_ids = []
    for line_text in ['### New Authors:\n', '### New Contributors:\n']:
        start_index = release_summary_lines.index(line_text)
        end_index = start_index
        for index, line in enumerate(release_summary_lines[start_index + 1:]):
            if line.startswith('###'):
                end_index = end_index + index
                break

        new_details_list = release_summary_lines[start_index + 1: end_index]
        new_authors_and_contributors_mail_ids.extend([
            detail[detail.find('<') + 1: detail.find('>')]
            for detail in new_details_list])

    return sorted(list(set(new_authors_and_contributors_mail_ids)))


def prompt_user_to_send_announcement_email():
    """Asks the user to send release announcement mail and check if
    it is in announcement category.
    """
    new_contributors_mail_ids = (', ').join(
        get_new_authors_and_contributors_mail_ids())
    common.open_new_tab_in_browser_if_possible(
        'https://www.gmail.com')
    common.ask_user_to_confirm(
        'Please copy the mail message from %s and send the email to:\n'
        '   TO: oppia-dev@googlegroups.com\n'
        '   BCC: oppia@googlegroups.com, '
        'oppia-announce@googlegroups.com, %s\n'
        'Please make sure to check that the mail ids of new authors '
        'and contributors are correct.\n' % (
            RELEASE_MAIL_MESSAGE_FILEPATH, new_contributors_mail_ids))

    common.open_new_tab_in_browser_if_possible(
        'https://groups.google.com/forum/#!categories/oppia/announcements')
    common.ask_user_to_confirm(
        'Ensure the email sent to oppia@ is in the Announcements category')


def create_group_for_next_release():
    """Asks the release co-ordinator to create a new chat group for
    the next release.
    """
    common.open_new_tab_in_browser_if_possible(
        release_constants.RELEASE_ROTA_URL)
    common.ask_user_to_confirm(
        'Please do the following two things:\n\n'
        '1. Create a new chat group for the next release, '
        'and add the release coordinator, QA lead, Ankita '
        'and Nithesh to that group. You can find the release schedule '
        'and coordinators here: %s\n\n'
        '2. Please send the following message to the newly created group:\n\n'
        'Hi all, This is the group chat for the next release. '
        '[Release co-ordinator\'s name] and [QA Lead\'s name] will be '
        'the release co-ordinator & QA Lead for next release. '
        'Please follow the release process doc: '
        '[Add link to release process doc] to ensure the release '
        'follows the schedule. Thanks!\n' % (
            release_constants.RELEASE_ROTA_URL))


def main():
    """Performs task to generate message for release announcement."""
    if not common.is_current_branch_a_release_branch():
        raise Exception(
            'This script should only be run from the latest release branch.')

    if not os.path.exists(release_constants.RELEASE_SUMMARY_FILEPATH):
        raise Exception(
            'Release summary file %s is missing. Please run the '
            'release_info.py script and re-run this script.' % (
                release_constants.RELEASE_SUMMARY_FILEPATH))

    try:
        create_new_file_with_release_message_template()
        validate_release_message()
        prompt_user_to_send_announcement_email()

    finally:
        if os.path.exists(RELEASE_MAIL_MESSAGE_FILEPATH):
            os.remove(RELEASE_MAIL_MESSAGE_FILEPATH)
    create_group_for_next_release()


# The 'no coverage' pragma is used as this line is un-testable. This is because
# it will only be called when generate_release_updates.py is used as a script.
if __name__ == '__main__': # pragma: no cover
    main()
