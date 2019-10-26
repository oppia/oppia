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

This script should only be run after release_info.py script is run
successfully.
"""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import argparse
import collections
import datetime
import os
import sys

import python_utils
import release_constants

from . import common

_PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
_PY_GITHUB_PATH = os.path.join(_PARENT_DIR, 'oppia_tools', 'PyGithub-1.43.7')
sys.path.insert(0, _PY_GITHUB_PATH)

# pylint: disable=wrong-import-position
import github # isort:skip
# pylint: enable=wrong-import-position

ABOUT_PAGE_FILEPATH = os.path.join(
    'core', 'templates', 'dev', 'head', 'pages', 'about-page',
    'about-page.directive.html')
AUTHORS_FILEPATH = os.path.join('', 'AUTHORS')
CHANGELOG_FILEPATH = os.path.join('', 'CHANGELOG')
CONTRIBUTORS_FILEPATH = os.path.join('', 'CONTRIBUTORS')
GIT_CMD_CHECKOUT = 'git checkout -- %s %s %s %s' % (
    CHANGELOG_FILEPATH, AUTHORS_FILEPATH, CONTRIBUTORS_FILEPATH,
    ABOUT_PAGE_FILEPATH)
# This ordering should not be changed. The automatic updates to
# changelog and credits performed using this script will work
# correctly only if the ordering of sections in release summary
# file matches this expected ordering.
EXPECTED_ORDERING = {
    '### Changelog:\n': '### Commit History:\n',
    '### New Authors:\n': '### Existing Authors:\n',
    '### New Contributors:\n': '### Email C&P Blurbs about authors:\n'
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
    updated_list = new_list + file_lines[start_index:]
    updated_list = sorted(updated_list, key=lambda s: s.lower())
    file_lines = file_lines[:start_index] + updated_list
    with python_utils.open_file(filepath, 'w') as f:
        for line in file_lines:
            f.write(line)


def check_ordering_of_sections(release_summary_lines):
    """Checks that the ordering of sections in release_summary file
    matches the expected ordering.

    This is required to ensure that automatic updates to changelog
    and credits are correct.

    Args:
        release_summary_lines: list(str). List of lines in
            ../release_summary.md.

    Raises:
        Exception: The expected ordering does not match the ordering
            in release_summary.md.
    """
    sections = [
        line for line in release_summary_lines if line.startswith('###')
    ]
    for section, next_section in EXPECTED_ORDERING.items():
        if section not in sections:
            raise Exception(
                'Expected release_summary to have %s section to ensure '
                'that automatic updates to changelog and credits are '
                'correct.' % section.strip())
        index = sections.index(section)
        if index + 1 >= len(sections) or sections[index + 1] != next_section:
            raise Exception(
                'Expected %s section to be followed by %s section in '
                'release_summary to ensure that automatic updates to '
                'changelog and credits are correct.' % (
                    section.strip(), next_section.strip()))


def update_changelog(release_summary_lines, current_release_version):
    """Updates CHANGELOG file.

    Args:
        release_summary_lines: list(str). List of lines in
            ../release_summary.md.
        current_release_version: str. The version of current release.
    """
    python_utils.PRINT('Updating Changelog...')
    start_index = release_summary_lines.index('### Changelog:\n') + 1
    end_index = release_summary_lines.index('### Commit History:\n')
    release_version_changelog = [
        u'v%s (%s)\n' % (current_release_version, CURRENT_DATE),
        u'------------------------\n'] + release_summary_lines[
            start_index:end_index]
    changelog_lines = []
    with python_utils.open_file(CHANGELOG_FILEPATH, 'r') as changelog_file:
        changelog_lines = changelog_file.readlines()
    changelog_lines[2:2] = release_version_changelog
    with python_utils.open_file(CHANGELOG_FILEPATH, 'w') as changelog_file:
        for line in changelog_lines:
            changelog_file.write(line)
    python_utils.PRINT('Updated Changelog!')


def update_authors(release_summary_lines):
    """Updates AUTHORS file.

    Args:
        release_summary_lines: list(str). List of lines in
            ../release_summary.md.
    """
    python_utils.PRINT('Updating AUTHORS file...')
    start_index = release_summary_lines.index(
        '### New Authors:\n') + 1
    end_index = release_summary_lines.index(
        '### Existing Authors:\n') - 1
    new_authors = release_summary_lines[start_index:end_index]
    new_authors = [
        '%s\n' % (author.replace('* ', '').strip()) for author in new_authors]
    update_sorted_file(AUTHORS_FILEPATH, new_authors)
    python_utils.PRINT('Updated AUTHORS file!')


def update_contributors(release_summary_lines):
    """Updates CONTRIBUTORS file.

    Args:
        release_summary_lines: list(str). List of lines in
            ../release_summary.md.
    """
    python_utils.PRINT('Updating CONTRIBUTORS file...')
    start_index = release_summary_lines.index(
        '### New Contributors:\n') + 1
    end_index = release_summary_lines.index(
        '### Email C&P Blurbs about authors:\n') - 1
    new_contributors = (
        release_summary_lines[start_index:end_index])
    new_contributors = [
        '%s\n' % (
            contributor.replace(
                '* ', '').strip()) for contributor in new_contributors]
    update_sorted_file(CONTRIBUTORS_FILEPATH, new_contributors)
    python_utils.PRINT('Updated CONTRIBUTORS file!')


def find_indentation(about_page_lines):
    """Finds indentation used for span and li elements to list developer
    names in about-page.directive.html.

    Args:
        about_page_lines: list(str). List of lines in
            about-page.directive.html.

    Returns:
        tuple(str, str). A tuple of span indent and li indent.
    """

    span_text = '<span>A</span>'

    span_line = ''
    li_line = ''
    for index, line in enumerate(about_page_lines):
        if line.find(span_text) != -1:
            span_line = line
            if index + 2 < len(about_page_lines):
                li_line = about_page_lines[index + 2]
            break
    if not span_line:
        raise Exception(
            'Expected about-page.directive.html to have %s.' % span_text)
    span_indent = span_line[:span_line.find(span_text)]

    if li_line.find('<li>') == -1:
        # The format should be:
        # <span>A</span>
        #   <ul>
        #     <li>A*</li>.
        raise Exception(
            'Expected %s text to be followed by an unordered list in '
            'about-page.directive.html' % span_text)
    li_indent = li_line[:li_line.find('<li>')]
    return (span_indent, li_indent)


def update_developer_names(release_summary_lines):
    """Updates about-page.directive.html file.

    Args:
        release_summary_lines: list(str). List of lines in
            ../release_summary.md.
    """
    python_utils.PRINT('Updating about-page file...')
    start_index = release_summary_lines.index(
        '### New Contributors:\n') + 1
    end_index = release_summary_lines.index(
        '### Email C&P Blurbs about authors:\n') - 1
    new_contributors = (
        release_summary_lines[start_index:end_index])
    new_contributors = [
        contributor.replace(
            '* ', '') for contributor in new_contributors]
    new_developer_names = [
        contributor.split('<')[0].strip() for contributor in new_contributors]
    new_developer_names.sort()

    with python_utils.open_file(ABOUT_PAGE_FILEPATH, 'r') as about_page_file:
        about_page_lines = about_page_file.readlines()

        (span_indent, li_indent) = find_indentation(about_page_lines)

        developer_name_dict = collections.defaultdict(list)
        for developer_name in new_developer_names:
            developer_name_dict[developer_name[0].upper()].append(
                '%s<li>%s</li>\n' % (li_indent, developer_name))

        for char in developer_name_dict:
            # This case is only for developer names starting with Q since
            # as of now we have no developers listed whose names start with
            # a Q.
            if '%s<span>%s</span>\n' % (
                    span_indent, char) not in about_page_lines:
                prev_char = chr(ord(char) - 1)
                prev_start_index = about_page_lines.index(
                    '%s<span>%s</span>\n' % (span_indent, prev_char)) + 2
                prev_end_index = (
                    prev_start_index + about_page_lines[
                        prev_start_index:].index('%s</ul>\n' % span_indent))
                developer_names = sorted(
                    developer_name_dict[char], key=lambda s: s.lower())
                span_elem = '%s<span>%s</span>\n' % (span_indent, char)
                ul_start_elem = '%s<ul>\n' % span_indent
                ul_end_elem = '%s</ul>\n' % span_indent
                about_page_lines[prev_end_index + 1:prev_end_index + 1] = (
                    [span_elem, ul_start_elem] + developer_names + [
                        ul_end_elem])
                continue

            start_index = about_page_lines.index(
                '%s<span>%s</span>\n' % (span_indent, char)) + 2
            end_index = start_index + about_page_lines[start_index:].index(
                '%s</ul>\n' % span_indent)

            old_developer_names = about_page_lines[start_index:end_index]
            updated_developer_names = (
                old_developer_names + developer_name_dict[char])
            updated_developer_names = sorted(
                updated_developer_names, key=lambda s: s.lower())
            about_page_lines[start_index:end_index] = updated_developer_names

    with python_utils.open_file(ABOUT_PAGE_FILEPATH, 'w') as about_page_file:
        for line in about_page_lines:
            about_page_file.write(line)
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


def create_branch(repo_fork, target_branch, github_username):
    """Creates a new branch with updates to AUTHORS, CHANGELOG,
    CONTRIBUTORS and about-page.

    Args:
        repo_fork: github.Repository.Repository. The PyGithub object for the
            forked repo.
        target_branch: str. The name of the target branch.
        github_username: str. The github username of the user.
    """
    python_utils.PRINT(
        'Creating new branch with updates to AUTHORS, CONTRIBUTORS, '
        'CHANGELOG and about-page...')
    sb = repo_fork.get_branch('develop')
    repo_fork.create_git_ref(
        ref='refs/heads/%s' % target_branch, sha=sb.commit.sha)

    for filepath in [
            CHANGELOG_FILEPATH, AUTHORS_FILEPATH, CONTRIBUTORS_FILEPATH,
            ABOUT_PAGE_FILEPATH]:
        contents = repo_fork.get_contents(filepath, ref=target_branch)
        with python_utils.open_file(filepath, 'r') as f:
            repo_fork.update_file(
                contents.path, 'Update %s' % filepath, f.read(),
                contents.sha, branch=target_branch)
    common.run_cmd(GIT_CMD_CHECKOUT.split(' '))
    common.open_new_tab_in_browser_if_possible(
        'https://github.com/oppia/oppia/compare/develop...%s:%s?'
        'expand=1' % (github_username, target_branch))
    python_utils.PRINT(
        'Pushed changes to Github. '
        'Please create a pull request from the %s branch' % target_branch)


def main():
    """Collects necessary info and dumps it to disk."""
    branch_name = common.get_current_branch_name()
    if not common.is_current_branch_a_release_branch():
        raise Exception(
            'This script should only be run from the latest release branch.')

    if not os.path.exists(release_constants.RELEASE_SUMMARY_FILEPATH):
        raise Exception(
            'Release summary file %s is missing. Please run the '
            'release_info.py script and re-run this script.' % (
                release_constants.RELEASE_SUMMARY_FILEPATH))

    parsed_args = _PARSER.parse_args()
    if parsed_args.github_username is None:
        raise Exception(
            'No GitHub username provided. Please re-run the '
            'script specifying a username using --username=<Your username>')
    github_username = parsed_args.github_username

    personal_access_token = common.get_personal_access_token()
    g = github.Github(personal_access_token)
    repo_fork = g.get_repo('%s/oppia' % github_username)

    current_release_version = branch_name[len(
        common.RELEASE_BRANCH_NAME_PREFIX):]
    target_branch = 'update-changelog-for-releasev%s' % current_release_version

    remove_updates_and_delete_branch(repo_fork, target_branch)

    message = (
        'Please update %s to:\n- have a correct changelog for '
        'updating the CHANGELOG file\n- have a correct list of new '
        'authors and contributors to update AUTHORS, CONTRIBUTORS '
        'and developer_names section in about-page.directive.html\n' % (
            release_constants.RELEASE_SUMMARY_FILEPATH))
    common.ask_user_to_confirm(message)

    release_summary_lines = []
    with python_utils.open_file(
        release_constants.RELEASE_SUMMARY_FILEPATH, 'r'
        ) as release_summary_file:
        release_summary_lines = release_summary_file.readlines()

    check_ordering_of_sections(release_summary_lines)

    update_changelog(
        release_summary_lines, current_release_version)
    update_authors(release_summary_lines)
    update_contributors(release_summary_lines)
    update_developer_names(release_summary_lines)

    message = (
        'Please check the changes and make updates if required in the '
        'following files:\n1. %s\n2. %s\n3. %s\n4. %s\n' % (
            CHANGELOG_FILEPATH, AUTHORS_FILEPATH, CONTRIBUTORS_FILEPATH,
            ABOUT_PAGE_FILEPATH))
    common.ask_user_to_confirm(message)

    create_branch(repo_fork, target_branch, github_username)


# The 'no coverage' pragma is used as this line is un-testable. This is because
# it will only be called when update_changelog_and_credits.py is used as
# a script.
if __name__ == '__main__': # pragma: no cover
    main()
