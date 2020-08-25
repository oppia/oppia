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

"""Script that generates updates for the release."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os
import subprocess

import python_utils
import release_constants
from scripts import common

PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))


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
    for line_text in [
            release_constants.NEW_AUTHORS_HEADER,
            release_constants.NEW_CONTRIBUTORS_HEADER]:
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
    release_version = common.get_current_release_version_number(
        common.get_current_branch_name())
    common.open_new_tab_in_browser_if_possible(
        'https://www.gmail.com')
    common.ask_user_to_confirm(
        'Please draft an announcement message for the release and send it to:\n'
        '   TO: oppia-dev@googlegroups.com\n'
        '   BCC: oppia@googlegroups.com, '
        'oppia-announce@googlegroups.com, %s\n'
        'with the following subject: "Announcing release v%s of Oppia!"'
        'Please make sure to check that the mail ids of new authors '
        'and contributors are correct.\n' % (
            new_contributors_mail_ids, release_version))
    common.open_new_tab_in_browser_if_possible(
        'https://groups.google.com/forum/#!categories/oppia')
    common.ask_user_to_confirm('Add announcements label to the email sent.\n')
    common.ask_user_to_confirm(
        'Ensure the email sent to oppia@ is in the Announcements category')


def prepare_for_next_release():
    """Asks the release co-ordinator:
        1. To create a new chat group for the next release and send a message
        to make the release & QA co-ordinators aware.
        2. Send message to oppia-dev to inform about next release cut.
        3. Send message to oppia-dev as a reminder for job submissions.
    """
    common.open_new_tab_in_browser_if_possible(
        release_constants.RELEASE_ROTA_URL)
    common.ask_user_to_confirm(
        'Create a new chat group for the next release, '
        'and add the release coordinator, QA lead, Ankita '
        'and Nithesh to that group. You can find the release schedule '
        'and coordinators here: %s\n' % release_constants.RELEASE_ROTA_URL)
    common.ask_user_to_confirm(
        'Please send the following message to the newly created group:\n\n'
        'Hi all, This is the group chat for the next release. '
        '[Release co-ordinator\'s name] and [QA Lead\'s name] will be '
        'the release co-ordinator & QA Lead for next release. '
        'Please follow the release process doc: '
        '[Add link to release process doc] to ensure the release '
        'follows the schedule. Thanks!\n')
    common.open_new_tab_in_browser_if_possible(
        release_constants.OPPIA_DEV_GROUP_URL)
    common.ask_user_to_confirm(
        'Send the following message to oppia-dev:\n\n'
        'Hi all, This is an update for the next month\'s release. '
        'The next month release cut is [Add release cut date for next month]. '
        'Make sure you plan your tasks accordingly. Thanks!\n'
        'The subject for the message: Updates for next release\n')
    common.ask_user_to_confirm(
        'Send the following message to oppia-dev:\n\n'
        'Hi all, This is a reminder to fill in the job requests '
        'here: %s if you are planning to run your job in the next release. '
        'Please fill in the requests by [Add a deadline which is at least 7 '
        'days before the next release cut]. Thanks!\n'
        'The subject for the message: Deadline for job requests for '
        'the next release\n' % release_constants.JOBS_FORM_URL)


def draft_new_release():
    """Drafts a new release tag on github."""
    release_version = common.get_current_release_version_number(
        common.get_current_branch_name())
    remote_alias = common.get_remote_alias(release_constants.REMOTE_URL)
    subprocess.check_call([
        'git', 'tag', '-a', 'v%s' % release_version,
        '-m', 'Version %s' % release_version])
    subprocess.check_call([
        'git', 'push', remote_alias, 'v%s' % release_version])
    common.open_new_tab_in_browser_if_possible(
        release_constants.NEW_RELEASE_URL)
    common.open_new_tab_in_browser_if_possible(
        release_constants.GITHUB_RELEASE_TAB_URL)
    common.ask_user_to_confirm(
        'Please draft a new release on GitHub pointing to the '
        'new tag and including relevant changelog information.\n'
        'The two tabs in your browser point to: '
        'Page to draft a new release, examples of previous releases.')


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

    draft_new_release()
    prompt_user_to_send_announcement_email()
    prepare_for_next_release()


# The 'no coverage' pragma is used as this line is un-testable. This is because
# it will only be called when generate_release_updates.py is used as a script.
if __name__ == '__main__': # pragma: no cover
    main()
