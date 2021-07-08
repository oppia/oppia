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

"""Script that automatically makes updates to changelog and authors
using release_summary.md.
"""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import argparse
import datetime
import os
import subprocess
import sys

import constants
import python_utils
from scripts import common

_PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
_PY_GITHUB_PATH = os.path.join(
    _PARENT_DIR, 'oppia_tools', 'PyGithub-%s' % common.PYGITHUB_VERSION)
sys.path.insert(0, _PY_GITHUB_PATH)

import github  # isort:skip pylint: disable=wrong-import-position

ABOUT_PAGE_CONSTANTS_FILEPATH = os.path.join(
    'core', 'templates', 'pages', 'about-page',
    'about-page.constants.ts')
AUTHORS_FILEPATH = os.path.join('', 'AUTHORS')
CHANGELOG_FILEPATH = os.path.join('', 'CHANGELOG')
CONTRIBUTORS_FILEPATH = os.path.join('', 'CONTRIBUTORS')
PACKAGE_JSON_FILEPATH = os.path.join('', 'package.json')
LIST_OF_FILEPATHS_TO_MODIFY = (
    CHANGELOG_FILEPATH,
    AUTHORS_FILEPATH,
    CONTRIBUTORS_FILEPATH,
    ABOUT_PAGE_CONSTANTS_FILEPATH,
    PACKAGE_JSON_FILEPATH
)
GIT_CMD_CHECKOUT = 'git checkout -- %s' % ' '.join(LIST_OF_FILEPATHS_TO_MODIFY)

# These constants should match the format defined in
# about-page.constants.ts. If the patterns do not match,
# update_changelog_and_credits_test will fail.
CREDITS_START_LINE = '  CREDITS_CONSTANTS: [\n'
CREDITS_END_LINE = '  ]\n'
CREDITS_INDENT = '    '

# This ordering should not be changed. The automatic updates to
# changelog and credits performed using this script will work
# correctly only if the ordering of sections in release summary
# file matches this expected ordering.
EXPECTED_ORDERING_DICT = {
    constants.release_constants.CHANGELOG_HEADER: (
        constants.release_constants.COMMIT_HISTORY_HEADER),
    constants.release_constants.NEW_AUTHORS_HEADER: (
        constants.release_constants.EXISTING_AUTHORS_HEADER),
    constants.release_constants.NEW_CONTRIBUTORS_HEADER: (
        constants.release_constants.EMAIL_HEADER)
}
CURRENT_DATE = datetime.date.today().strftime('%d %b %Y')

_PARSER = argparse.ArgumentParser()
_PARSER.add_argument(
    '--github_username', help=('Your GitHub username.'), type=str)


def update_sorted_file(filepath, new_list):
    """Updates the files AUTHORS and CONTRIBUTORS with a sorted list of
    new authors or contributors.

    Args:
        filepath: str. The path of the file to update.
        new_list: list(str). The list of new authors or contributors to
            add to the file.
    """
    file_lines = []
    with python_utils.open_file(filepath, 'r') as f:
        file_lines = f.readlines()

    for line in file_lines:
        if line.startswith('#'):
            last_comment_line = line

    # start_index is the index of line where list of authors/contributors
    # starts. The line with the last comment is followed by a empty line
    # and then the sorted list. So, the start_index is the index of
    # last_comment_line plus 2.
    start_index = file_lines.index(last_comment_line) + 2
    updated_list = list(set(new_list + file_lines[start_index:]))
    updated_list = sorted(updated_list, key=lambda s: s.lower())
    file_lines = file_lines[:start_index] + updated_list
    with python_utils.open_file(filepath, 'w') as f:
        for line in file_lines:
            f.write(line)


def is_order_of_sections_valid(release_summary_lines):
    """Checks that the ordering of sections in release_summary file
    matches the expected ordering.

    This is required to ensure that automatic updates to changelog
    and credits are correct.

    Args:
        release_summary_lines: list(str). List of lines in
            ../release_summary.md.

    Returns:
        bool. Whether the ordering is correct.
    """
    sections = [
        line for line in release_summary_lines if line.startswith('###')
    ]
    for section, next_section in EXPECTED_ORDERING_DICT.items():
        if section not in sections:
            python_utils.PRINT(
                'Expected release_summary to have %s section to ensure '
                'that automatic updates to changelog and credits are '
                'correct.' % section.strip())
            return False
        index = sections.index(section)
        if index + 1 >= len(sections) or sections[index + 1] != next_section:
            python_utils.PRINT(
                'Expected %s section to be followed by %s section in '
                'release_summary to ensure that automatic updates to '
                'changelog and credits are correct.' % (
                    section.strip(), next_section.strip()))
            return False
    return True


def get_previous_release_version(branch_type, current_release_version_number):
    """Finds previous version given the current version.

    Args:
        branch_type: str. The type of the branch: release or hotfix.
        current_release_version_number: str. The current release version.

    Returns:
        str. The previous version.

    Raises:
        Exception. Branch type is invalid.
        Exception. Previous release version is same as current release version.
    """
    all_tags = subprocess.check_output(['git', 'tag'])[:-1].split('\n')
    # Tags are of format vX.Y.Z. So, the substring starting from index 1 is the
    # version.
    if branch_type == constants.release_constants.BRANCH_TYPE_RELEASE:
        previous_release_version = all_tags[-1][1:]
    elif branch_type == constants.release_constants.BRANCH_TYPE_HOTFIX:
        previous_release_version = all_tags[-2][1:]
    else:
        raise Exception('Invalid branch type: %s.' % branch_type)
    assert previous_release_version != current_release_version_number, (
        'Previous release version is same as current release version.')
    return previous_release_version


def remove_repetition_from_changelog(
        current_release_version_number, previous_release_version,
        changelog_lines):
    """Removes information about current version from changelog before
    generation of changelog again.

    Args:
        current_release_version_number: str. The current release version.
        previous_release_version: str. The previous release version.
        changelog_lines: str. The lines of changelog file.

    Returns:
        list(str). Changelog lines with no information on current release
        version.
    """
    current_version_start = 0
    previous_version_start = 0
    for index, line in enumerate(changelog_lines):
        if 'v%s' % current_release_version_number in line:
            current_version_start = index
        if 'v%s' % previous_release_version in line:
            previous_version_start = index
    changelog_lines[current_version_start:previous_version_start] = []
    return changelog_lines


def update_changelog(
        branch_name, release_summary_lines, current_release_version_number):
    """Updates CHANGELOG file.

    Args:
        branch_name: str. The name of the current branch.
        release_summary_lines: list(str). List of lines in
            ../release_summary.md.
        current_release_version_number: str. The version of current release.
    """
    python_utils.PRINT('Updating Changelog...')
    start_index = release_summary_lines.index(
        constants.release_constants.CHANGELOG_HEADER) + 1
    end_index = release_summary_lines.index(
        constants.release_constants.COMMIT_HISTORY_HEADER)
    release_version_changelog = [
        u'v%s (%s)\n' % (current_release_version_number, CURRENT_DATE),
        u'------------------------\n'] + release_summary_lines[
            start_index:end_index]
    changelog_lines = []
    with python_utils.open_file(CHANGELOG_FILEPATH, 'r') as changelog_file:
        changelog_lines = changelog_file.readlines()

    if constants.release_constants.BRANCH_TYPE_HOTFIX in branch_name:
        previous_release_version = get_previous_release_version(
            constants.release_constants.BRANCH_TYPE_HOTFIX,
            current_release_version_number)
        changelog_lines = remove_repetition_from_changelog(
            current_release_version_number, previous_release_version,
            changelog_lines)
    else:
        previous_release_version = get_previous_release_version(
            constants.release_constants.BRANCH_TYPE_RELEASE,
            current_release_version_number)
        # Update only if changelog is generated before and contains info for
        # current version.
        if any(
                line.startswith(
                    'v%s' % current_release_version_number
                    ) for line in changelog_lines):
            changelog_lines = remove_repetition_from_changelog(
                current_release_version_number, previous_release_version,
                changelog_lines)

    changelog_lines[2:2] = release_version_changelog
    with python_utils.open_file(CHANGELOG_FILEPATH, 'w') as changelog_file:
        for line in changelog_lines:
            changelog_file.write(line)
    python_utils.PRINT('Updated Changelog!')


def get_new_authors(release_summary_lines):
    """Returns the list of new authors in release_summary_lines.

    Args:
        release_summary_lines: list(str). List of lines in
            ../release_summary.md.

    Returns:
        list(str). The list of new authors.
    """
    start_index = release_summary_lines.index(
        constants.release_constants.NEW_AUTHORS_HEADER) + 1
    end_index = release_summary_lines.index(
        constants.release_constants.EXISTING_AUTHORS_HEADER) - 1
    new_authors = release_summary_lines[start_index:end_index]
    new_authors = [
        '%s\n' % (author.replace('* ', '').strip()) for author in new_authors]
    return new_authors


def get_new_contributors(release_summary_lines, return_only_names=False):
    """Returns the list of new contributors in release_summary_lines.

    Args:
        release_summary_lines: list(str). List of lines in
            ../release_summary.md.
        return_only_names: bool. Whether to return names only or
            names along with email ids.

    Returns:
        list(str). The list of new contributors.
    """
    start_index = release_summary_lines.index(
        constants.release_constants.NEW_CONTRIBUTORS_HEADER) + 1
    end_index = release_summary_lines.index(
        constants.release_constants.EMAIL_HEADER) - 1
    new_contributors = (
        release_summary_lines[start_index:end_index])
    new_contributors = [
        '%s\n' % (
            contributor.replace(
                '* ', '').strip()) for contributor in new_contributors]
    if not return_only_names:
        return new_contributors
    return [
        contributor.split('<')[0].strip() for contributor in new_contributors]


def update_authors(release_summary_lines):
    """Updates AUTHORS file.

    Args:
        release_summary_lines: list(str). List of lines in
            ../release_summary.md.
    """
    python_utils.PRINT('Updating AUTHORS file...')
    new_authors = get_new_authors(release_summary_lines)
    update_sorted_file(AUTHORS_FILEPATH, new_authors)
    python_utils.PRINT('Updated AUTHORS file!')


def update_contributors(release_summary_lines):
    """Updates CONTRIBUTORS file.

    Args:
        release_summary_lines: list(str). List of lines in
            ../release_summary.md.
    """
    python_utils.PRINT('Updating CONTRIBUTORS file...')
    new_contributors = get_new_contributors(release_summary_lines)
    update_sorted_file(CONTRIBUTORS_FILEPATH, new_contributors)
    python_utils.PRINT('Updated CONTRIBUTORS file!')


def update_developer_names(release_summary_lines):
    """Updates about-page.constants.ts file.

    Args:
        release_summary_lines: list(str). List of lines in
            ../release_summary.md.
    """
    python_utils.PRINT('Updating about-page file...')
    new_developer_names = get_new_contributors(
        release_summary_lines, return_only_names=True)

    with python_utils.open_file(
        ABOUT_PAGE_CONSTANTS_FILEPATH, 'r') as about_page_file:
        about_page_lines = about_page_file.readlines()
        start_index = about_page_lines.index(CREDITS_START_LINE) + 1
        end_index = about_page_lines[start_index:].index(CREDITS_END_LINE) + 1
        all_developer_names = about_page_lines[start_index:end_index]
        for name in new_developer_names:
            all_developer_names.append('%s\'%s\',\n' % (CREDITS_INDENT, name))
        all_developer_names = sorted(
            list(set(all_developer_names)), key=lambda s: s.lower())
        about_page_lines[start_index:end_index] = all_developer_names

    with python_utils.open_file(
        ABOUT_PAGE_CONSTANTS_FILEPATH, 'w') as about_page_file:
        for line in about_page_lines:
            about_page_file.write(python_utils.UNICODE(line))
    python_utils.PRINT('Updated about-page file!')


def remove_updates_and_delete_branch(repo_fork, target_branch):
    """Remove changes made to AUTHORS, CHANGELOG, CONTRIBUTORS
    and about-page and delete the branch created with these changes.

    Args:
        repo_fork: github.Repository.Repository. The PyGithub object for the
            forked repo.
        target_branch: str. The name of the target branch.
    """

    common.run_cmd(GIT_CMD_CHECKOUT.split(' '))
    # The get_git_ref code is wrapped in try except block since the
    # function raises an exception if the target branch is not found.
    try:
        repo_fork.get_git_ref('heads/%s' % target_branch).delete()
    except github.UnknownObjectException:
        pass
    except Exception:
        raise Exception(
            'Please ensure that %s branch is deleted before '
            're-running the script' % target_branch)


def create_branch(
        repo, repo_fork, target_branch, github_username,
        current_release_version_number):
    """Creates a new branch with updates to AUTHORS, CHANGELOG,
    CONTRIBUTORS, about-page, and package.json.

    Args:
        repo: github.Repository.Repository. The PyGithub object for the
            original repo.
        repo_fork: github.Repository.Repository. The PyGithub object for the
            forked repo.
        target_branch: str. The name of the target branch.
        github_username: str. The github username of the user.
        current_release_version_number: str. The version of current release.
    """
    python_utils.PRINT(
        'Creating new branch with updates to AUTHORS, CONTRIBUTORS, '
        'CHANGELOG, about-page, and package.json...')
    sb = repo.get_branch('develop')
    repo_fork.create_git_ref(
        ref='refs/heads/%s' % target_branch, sha=sb.commit.sha)

    for filepath in LIST_OF_FILEPATHS_TO_MODIFY:
        contents = repo_fork.get_contents(filepath, ref=target_branch)
        with python_utils.open_file(filepath, 'r') as f:
            repo_fork.update_file(
                contents.path, 'Update %s' % filepath, f.read(),
                contents.sha, branch=target_branch)
    common.run_cmd(GIT_CMD_CHECKOUT.split(' '))
    common.open_new_tab_in_browser_if_possible(
        'https://github.com/oppia/oppia/compare/develop...%s:%s?'
        'expand=1&title=Update authors and changelog for v%s' % (
            github_username, target_branch, current_release_version_number))
    python_utils.PRINT(
        'Pushed changes to Github. '
        'Please create a pull request from the %s branch\n\n'
        'Note: PR title should be exactly: '
        '"Update authors and changelog for v%s" '
        'otherwise deployment will fail.' % (
            target_branch, current_release_version_number))


def is_invalid_email_present(release_summary_lines):
    """Checks if any invalid email is present in the list of
    new authors and contributors.

    Args:
        release_summary_lines: list(str). List of lines in
            ../release_summary.md.

    Returns:
        bool. Whether invalid email is present or not.
    """
    new_authors = get_new_authors(release_summary_lines)
    new_contributors = get_new_contributors(release_summary_lines)
    new_email_ids = new_authors + new_contributors
    invalid_email_ids = [
        email_id for email_id in new_email_ids
        if constants.release_constants.INVALID_EMAIL_SUFFIX in email_id]
    python_utils.PRINT(
        'Following email ids are invalid: %s' % invalid_email_ids)
    return bool(invalid_email_ids)


def get_release_summary_lines():
    """Returns the lines from release summary file. It checks whether
    incorrect email is present or ordering of sections is invalid.
    In either case, the user will be asked to update the release
    summary file and the lines will be re-read.

    Returns:
        list(str). List of lines in ../release_summary.md.
    """
    invalid_email_is_present = True
    ordering_is_invalid = True
    while invalid_email_is_present or ordering_is_invalid:
        release_summary_file = python_utils.open_file(
            constants.release_constants.RELEASE_SUMMARY_FILEPATH, 'r')
        release_summary_lines = release_summary_file.readlines()
        invalid_email_is_present = is_invalid_email_present(
            release_summary_lines)
        if invalid_email_is_present:
            common.ask_user_to_confirm(
                'The release summary file contains emails of the form: %s '
                'Please replace them with the correct emails. '
                '(See error messages above.)' % (
                    constants.release_constants.INVALID_EMAIL_SUFFIX))
        ordering_is_invalid = not(
            is_order_of_sections_valid(release_summary_lines))
        if ordering_is_invalid:
            common.ask_user_to_confirm(
                'Please fix the ordering in release summary file. '
                '(See error messages above.)')
        if invalid_email_is_present or ordering_is_invalid:
            common.ask_user_to_confirm(
                'Please save the file: %s with all the changes that '
                'you have made.' % (
                    constants.release_constants.RELEASE_SUMMARY_FILEPATH))
    return release_summary_lines


def update_package_json():
    """Updates version param in package json file to match the current
    release version.
    """
    release_version = common.get_current_release_version_number(
        common.get_current_branch_name())

    common.inplace_replace_file(
        PACKAGE_JSON_FILEPATH, '"version": ".*"',
        '"version": "%s"' % release_version)


def main():
    """Collects necessary info and dumps it to disk."""
    branch_name = common.get_current_branch_name()
    if not common.is_current_branch_a_release_branch():
        raise Exception(
            'This script should only be run from the latest release branch.')

    parsed_args = _PARSER.parse_args()
    if parsed_args.github_username is None:
        raise Exception(
            'No GitHub username provided. Please re-run the '
            'script specifying a username using '
            '--github_username=<Your username>')
    github_username = parsed_args.github_username

    personal_access_token = common.get_personal_access_token()

    g = github.Github(personal_access_token)
    repo = g.get_organization('oppia').get_repo('oppia')
    repo_fork = g.get_repo('%s/oppia' % github_username)

    common.check_blocking_bug_issue_count(repo)
    common.check_prs_for_current_release_are_released(repo)

    if not os.path.exists(constants.release_constants.RELEASE_SUMMARY_FILEPATH):
        raise Exception(
            'Release summary file %s is missing. Please re-run '
            'this script.' % (
                constants.release_constants.RELEASE_SUMMARY_FILEPATH))

    current_release_version_number = common.get_current_release_version_number(
        branch_name)
    target_branch = 'update-changelog-for-releasev%s' % (
        current_release_version_number)

    remove_updates_and_delete_branch(repo_fork, target_branch)

    # Opens Credit Form.
    python_utils.PRINT(
        'Note: Make following changes directly to %s and make sure to '
        'save the file after making these changes.' % (
            constants.release_constants.RELEASE_SUMMARY_FILEPATH))

    common.ask_user_to_confirm(
        'Check emails and names for new authors and new contributors in the '
        'file: %s and verify that the emails are '
        'correct through welcome emails sent from welcome@oppia.org '
        '(confirm with Sean in case of doubt). Please ensure that you correct '
        'the emails of the form: %s.' % (
            constants.release_constants.RELEASE_SUMMARY_FILEPATH,
            constants.release_constants.INVALID_EMAIL_SUFFIX))
    common.open_new_tab_in_browser_if_possible(
        constants.release_constants.CREDITS_FORM_URL)
    common.ask_user_to_confirm(
        'Check the credits form and add any additional contributors '
        'to the contributor list in the file: %s.' % (
            constants.release_constants.RELEASE_SUMMARY_FILEPATH))
    common.ask_user_to_confirm(
        'Categorize the PR titles in the Uncategorized section of the '
        'changelog in the file: %s, and arrange the changelog '
        'to have user-facing categories on top.' % (
            constants.release_constants.RELEASE_SUMMARY_FILEPATH))
    common.ask_user_to_confirm(
        'Verify each item is in the correct section in the '
        'file: %s and remove trivial changes like "Fix lint errors" '
        'from the changelog.' % (
            constants.release_constants.RELEASE_SUMMARY_FILEPATH))
    common.ask_user_to_confirm(
        'Ensure that all items in changelog in the file: %s '
        'start with a verb in simple present tense.' % (
            constants.release_constants.RELEASE_SUMMARY_FILEPATH))
    common.ask_user_to_confirm(
        'Please save the file: %s with all the changes that '
        'you have made.' % (
            constants.release_constants.RELEASE_SUMMARY_FILEPATH))

    release_summary_lines = get_release_summary_lines()

    update_changelog(
        branch_name, release_summary_lines, current_release_version_number)
    update_authors(release_summary_lines)
    update_contributors(release_summary_lines)
    update_developer_names(release_summary_lines)
    update_package_json()

    list_of_numbered_files = []
    for i, filepath in enumerate(LIST_OF_FILEPATHS_TO_MODIFY, start=1):
        list_of_numbered_files.append('%s. %s' % (i, filepath))

    message = (
        'Please check the changes and make updates if required in the '
        'following files:\n%s\n' % '\n'.join(list_of_numbered_files)
    )
    common.ask_user_to_confirm(message)

    create_branch(
        repo, repo_fork, target_branch, github_username,
        current_release_version_number)


# The 'no coverage' pragma is used as this line is un-testable. This is because
# it will only be called when update_changelog_and_credits.py is used as
# a script.
if __name__ == '__main__': # pragma: no cover
    main()
