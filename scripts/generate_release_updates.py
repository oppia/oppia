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
import re

import feconf
import python_utils

from . import common

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
    '   The main changes in this release are %s.\n'
    '   %s.\n'
    '   %s\n'
    '   Finally, I\'d like to thank %s for their help with pre-release '
    'testing, bug-fixing and QA, as well as %s for leading the QA team for '
    'this release.\n\n'
    'Thanks,\n'
    '%s\n') % tuple(SECTIONS_TO_ADD)

PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
RELEASE_MAIL_MESSAGE_FILEPATH = os.path.join(
    PARENT_DIR, 'release_mail_message.txt')


def create_new_file_with_release_message_template():
    """Adds the template message to release mail filepath."""
    with python_utils.open_file(RELEASE_MAIL_MESSAGE_FILEPATH, 'w') as f:
        f.write(RELEASE_MAIL_MESSAGE_TEMPLATE)

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


def prompt_user_to_send_announcement_email():
    """Asks the user to send release announcement mail and check if
    it is in announcement category.
    """
    common.open_new_tab_in_browser_if_possible(
        'https://www.gmail.com')
    common.ask_user_to_confirm(
        'Please copy the mail message from %s and send the email to:\n'
        '   TO: oppia-dev@googlegroups.com\n'
        '   BCC: oppia@googlegroups.com\n'
        '   BCC: oppia-announce@googlegroups.com\n'
        '   BCC: each new contributor for this release\n' % (
            RELEASE_MAIL_MESSAGE_FILEPATH))

    common.open_new_tab_in_browser_if_possible(
        'https://groups.google.com/forum/#!categories/oppia/announcements')
    common.ask_user_to_confirm(
        'Ensure the email sent to oppia@ is in the Announcements category')


def main():
    """Performs task to generate message for release announcement."""
    branch_name = common.get_current_branch_name()
    if not re.match(r'release-\d+\.\d+\.\d+$', branch_name):
        raise Exception(
            'This script should only be run from the latest release branch.')

    if not os.path.exists(feconf.RELEASE_SUMMARY_FILEPATH):
        raise Exception(
            'Release summary file %s is missing. Please run the '
            'release_info.py script and re-run this script.' % (
                feconf.RELEASE_SUMMARY_FILEPATH))

    try:
        create_new_file_with_release_message_template()
        validate_release_message()
        prompt_user_to_send_announcement_email()

    finally:
        if os.path.exists(RELEASE_MAIL_MESSAGE_FILEPATH):
            os.remove(RELEASE_MAIL_MESSAGE_FILEPATH)


# The 'no coverage' pragma is used as this line is un-testable. This is because
# it will only be called when build.py is used as a script.
if __name__ == '__main__': # pragma: no cover
    main()
