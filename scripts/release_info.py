#!/usr/bin/env python
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

"""Script that simplifies releases by collecting various information.
Should be run from the oppia root dir.
"""
from __future__ import absolute_import  # pylint: disable=import-only-modules

import argparse
import collections
import datetime
import getpass
import os
import re
import subprocess
import sys

import python_utils

from . import common

_PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
_PY_GITHUB_PATH = os.path.join(_PARENT_DIR, 'oppia_tools', 'PyGithub-1.43.7')
sys.path.insert(0, _PY_GITHUB_PATH)

# pylint: disable=wrong-import-position
import github # isort:skip
# pylint: enable=wrong-import-position

GIT_CMD_GET_STATUS = 'git status'
GIT_CMD_TEMPLATE_CHECKOUT = 'git checkout -- %s'
GIT_CMD_TEMPLATE_GET_NEW_COMMITS = 'git cherry %s -v'
GIT_CMD_GET_LOGS_FORMAT_STRING = (
    'git log -z --no-color --pretty=format:%H{0}%aN{0}%aE{0}%B {1}..{2}')
GIT_CMD_DIFF_NAMES_ONLY_FORMAT_STRING = 'git diff --name-only %s %s'
GIT_CMD_SHOW_FORMAT_STRING = 'git show %s:feconf.py'
ISSUE_URL_FORMAT_STRING = 'https://github.com/oppia/oppia/issues/%s'
ISSUE_REGEX = re.compile(r'#(\d+)')
PR_NUMBER_REGEX = re.compile(r'\(#(\d+)\)')
GROUP_SEP = '\x1D'
VERSION_RE_FORMAT_STRING = r'%s\s*=\s*(\d+|\.)+'
FECONF_VAR_NAMES = ['CURRENT_STATE_SCHEMA_VERSION',
                    'CURRENT_COLLECTION_SCHEMA_VERSION']
FIRST_OPPIA_COMMIT = '6a7138f5f603375e58d1dc3e1c4f1c80a126e249'
NO_LABEL_CHANGELOG_CATEGORY = 'Uncategorized'
# This should match the indentation of span and li elements used
# in developer_names section of
# core/templates/dev/head/pages/about-page/about-page.directive.html.
SPAN_INDENT = '              '
LI_INDENT = '                '
# This line should match the line after div element for developer_names in
# about-page.directive.html.
LINE_AFTER_Z_DEVELOPER_NAMES = (
    '            <p translate="I18N_ABOUT_PAGE_developer_nameS_'
    'TAB_TEXT_BOTTOM" translate-values="{listOfNames: $ctrl.listOfNames}">\n')
ABOUT_PAGE_FILEPATH = (
    'core/templates/dev/head/pages/about-page/about-page.directive.html')
AUTHORS_FILEPATH = os.path.join('AUTHORS', '')
CHANGELOG_FILEPATH = os.path.join('CHANGELOG', '')
CONTRIBUTORS_FILEPATH = os.path.join('CONTRIBUTORS', '')
RELEASE_SUMMARY_FILEPATH = os.path.join(
    os.getcwd(), os.pardir, 'release_summary.md')

Log = collections.namedtuple('Log', ['sha1', 'author', 'email', 'message'])

_PARSER = argparse.ArgumentParser()
_PARSER.add_argument(
    '--github_username', help=('Your GitHub username.'), type=str)


def _run_cmd(cmd_str):
    """Runs the command and returns the output.
    Raises subprocess.CalledProcessError upon failure.

    Args:
        cmd_str: str. The command string to execute

    Returns:
        str. The output of the command.
    """
    return subprocess.check_output(cmd_str.split(' ')).strip()


def _get_current_branch():
    """Retrieves the branch Git is currently in.

    Returns:
        (str): The name of the current Git branch.
    """
    branch_name_line = _run_cmd(GIT_CMD_GET_STATUS).splitlines()[0]
    return branch_name_line.split(' ')[2]


def _get_current_version_tag(repo):
    """Retrieves the most recent version tag.

    Args:
        repo: github.Repository.Repository. The PyGithub object for the repo.

    Returns:
        github.Tag.Tag: The most recent version tag.
    """
    return repo.get_tags()[0]


def get_extra_commits_in_new_release(base_commit, repo):
    """Gets extra commits in the new release.

    Args:
        base_commit: str. The base commit common between current branch and the
            latest release.
        repo: github.Repository.Repository. The PyGithub object for the repo.

    Returns:
        list(github.Commit.Commit). List of commits from the base commit up to
        the current commit, which haven't been cherrypicked already.
    """
    get_commits_cmd = GIT_CMD_TEMPLATE_GET_NEW_COMMITS % base_commit
    out = _run_cmd(get_commits_cmd).split('\n')
    commits = []
    for line in out:
        # Lines that start with a - are already cherrypicked. The commits of
        # interest are on lines that start with +.
        if line[0] == '+':
            line = line[2:]
            commit = repo.get_commit(line[:line.find(' ')])
            commits.append(commit)
    return commits


def _gather_logs(start, stop='HEAD'):
    """Gathers the logs between the start and endpoint.

    Args:
        start: str. Tag, Branch or SHA1 of start point
        stop: str.  Tag, Branch or SHA1 of end point, defaults to HEAD

    Returns:
        list(Log): List of Logs.
    """
    get_logs_cmd = GIT_CMD_GET_LOGS_FORMAT_STRING.format(
        GROUP_SEP, start, stop)
    out = _run_cmd(get_logs_cmd).split('\x00')
    if len(out) == 1 and out[0] == '':
        return []
    else:
        return [Log(*line.strip().split(GROUP_SEP)) for line in out]


def _extract_issues(logs):
    """Extract references to issues out of a list of Logs

    Args:
        logs: list(Log). List of Logs to parse

    Returns:
        set(str): Set of found issues as links to Github.
    """
    issues = ISSUE_REGEX.findall(' '.join([log.message for log in logs]))
    links = {ISSUE_URL_FORMAT_STRING % issue for issue in issues}
    return links


def _extract_pr_numbers(logs):
    """Extract PR numbers out of a list of Logs.

    Args:
        logs: list(Log). List of Logs to parse.

    Returns:
        set(int): Set of PR numbers extracted from the log.
    """
    pr_numbers = PR_NUMBER_REGEX.findall(
        ' '.join([log.message for log in logs]))
    # Delete duplicates.
    pr_numbers = list(set(pr_numbers))
    pr_numbers.sort(reverse=True)
    return pr_numbers


def get_prs_from_pr_numbers(pr_numbers, repo):
    """Returns a list of PRs corresponding to the numbers provided.

    Args:
        pr_numbers: list(int). List of PR numbers.
        repo: github.Repository.Repository. The PyGithub object for the repo.

    Returns:
        list(github.PullRequest.PullRequest). The list of references to the PRs.
    """
    pulls = [repo.get_pull(int(num)) for num in pr_numbers]
    return list(pulls)


def get_changelog_categories(pulls):
    """Categorizes the given PRs into various changelog categories

    Args:
        pulls: list(github.PullRequest.PullRequest). The list of PRs to be
            categorized.

    Returns:
        dict(str, list(str)). A list where the keys are the various changelog
            labels, and the values are the titles of the PRs that fall under
            that category.
    """
    result = collections.defaultdict(list)
    for pull in pulls:
        labels = pull.labels
        added_to_dict = False
        formatted_title = '%s (#%d)' % (pull.title, pull.number)
        for label in labels:
            if 'CHANGELOG:' in label.name:
                category = label.name[label.name.find(':') + 2:]
                added_to_dict = True
                result[category].append(formatted_title)
                break
        if not added_to_dict:
            result[NO_LABEL_CHANGELOG_CATEGORY].append(formatted_title)
    return dict(result)


def _check_versions(current_release):
    """Checks if the versions for the exploration or collection schemas have
    changed.

    Args:
        current_release: str. The current release tag to diff against.

    Returns:
        List of variable names that changed.
    """
    feconf_changed_version = []
    git_show_cmd = (GIT_CMD_SHOW_FORMAT_STRING % current_release)
    old_feconf = _run_cmd(git_show_cmd)
    with python_utils.open_file('feconf.py', 'r') as feconf:
        new_feconf = feconf.read()
    for variable in FECONF_VAR_NAMES:
        old_version = re.findall(VERSION_RE_FORMAT_STRING % variable,
                                 old_feconf)[0]
        new_version = re.findall(VERSION_RE_FORMAT_STRING % variable,
                                 new_feconf)[0]
        if old_version != new_version:
            feconf_changed_version.append(variable)
    return feconf_changed_version


def _git_diff_names_only(left, right='HEAD'):
    """Get names of changed files from git.

    Args:
        left: str. Lefthand timepoint.
        right: str. rightand timepoint.

    Returns:
        list(str): List of files that are different between the two points.
    """
    diff_cmd = (GIT_CMD_DIFF_NAMES_ONLY_FORMAT_STRING % (left, right))
    return _run_cmd(diff_cmd).splitlines()


def _check_setup_scripts(base_release_tag, changed_only=True):
    """Check if setup scripts have changed.

    Args:
        base_release_tag: str. The current release tag to diff against.
        changed_only: bool. If set to False will return all tested files
            instead of just the changed ones.

    Returns:
        dict consisting of script --> boolean indicating whether or not it has
            changed (filtered by default to those that are modified).
    """
    setup_scripts = ['scripts/%s' % item for item in
                     ['setup.sh', 'setup_gae.sh', 'install_third_party.sh',
                      'install_third_party.py']]
    changed_files = _git_diff_names_only(base_release_tag)
    changes_dict = {script: script in changed_files
                    for script in setup_scripts}
    if changed_only:
        return {name: status for name, status
                in changes_dict.items() if status}
    else:
        return changes_dict


def _check_storage_models(current_release):
    """Check if files in core/storage have changed and returns them.

    Args:
        current_release: The current release version

    Returns:
        list(str): The changed files (if any).
    """
    diff_list = _git_diff_names_only(current_release)
    return [item for item in diff_list if item.startswith('core/storage')]


def get_blocking_bug_issue_count(repo):
    """Returns the number of unresolved blocking bugs.

    Args:
        repo: github.Repository.Repository. The PyGithub object for the repo.

    Returns:
        int: Number of unresolved blocking bugs.
    """
    blocking_bugs_milestone = repo.get_milestone(number=39)
    return blocking_bugs_milestone.open_issues


def check_prs_for_current_release_are_released(repo):
    """Checks that all pull requests for current release have a
    'PR: released' label.

    Args:
        repo: github.Repository.Repository. The PyGithub object for the repo.

    Returns:
        bool. Whether all pull requests for current release have a
            PR: released label.
    """
    all_prs = repo.get_pulls(state='all')
    for pr in all_prs:
        label_names = [label.name for label in pr.labels]
        if 'PR: released' not in label_names and (
                'PR: for current release' in label_names):
            return False
    return True


def update_sorted_file(filepath, new_list, last_comment_line):
    """Updates the files AUTHORS and CONTRIBUTORS with a sorted list of
    new authors or contributors.

    Args:
        filepath: str. The path of the file to update.
        new_list: list(str). The list of new authors or contributors to
            add to the file.
        last_comment_line: str. The content of the line of last comment in
            a line after which the file contains a new line followed by
            a sorted list of authors/contributors.
    """
    file_lines = []
    with python_utils.open_file(filepath, 'r') as f:
        file_lines = f.readlines()
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


def update_changelog(release_summary_lines, current_release_version):
    """Updates CHANGELOG file.

    Args:
        release_summary_lines: list(str). List of lines in
            ../release_summary.md.
        current_release_version: str. The version of current release.
    """

    current_date = datetime.date.today().strftime('%d %b %Y')
    python_utils.PRINT('Updating Changelog...')
    start_index = release_summary_lines.index('### Changelog:\n') + 1
    end_index = release_summary_lines.index('### Commit History:\n')
    release_version_changelog = [
        u'v%s (%s)\n' % (current_release_version, current_date),
        u'------------------------\n'] + release_summary_lines[
            start_index:end_index]
    changelog_lines = []
    with python_utils.open_file(
        CHANGELOG_FILEPATH, 'r') as changelog_file:
        changelog_lines = changelog_file.readlines()
    changelog_lines[2:2] = release_version_changelog
    with python_utils.open_file(
        CHANGELOG_FILEPATH, 'w') as changelog_file:
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
    new_authors = [author.replace('* ', '') for author in new_authors]
    update_sorted_file(
        AUTHORS_FILEPATH, new_authors,
        '# Please keep the list sorted alphabetically.\n')
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
        contributor.replace(
            '* ', '') for contributor in new_contributors]
    update_sorted_file(
        CONTRIBUTORS_FILEPATH, new_contributors,
        '# Please keep the list sorted alphabetically.\n')
    python_utils.PRINT('Updated CONTRIBUTORS file!')


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
        contributor.split('<')[0] for contributor in new_contributors]
    new_developer_names.sort()
    developer_name_dict = collections.defaultdict(list)
    for developer_name in new_developer_names:
        developer_name_dict[developer_name[0].upper()].append(
            '%s<li>%s</li>\n' % (LI_INDENT, developer_name))
    with python_utils.open_file(
        ABOUT_PAGE_FILEPATH, 'r') as about_page_file:
        about_page_lines = about_page_file.readlines()
        for char in developer_name_dict:
            start_index = about_page_lines.index(
                '%s<span>%s</span>\n' % (SPAN_INDENT, char)) + 2
            if char != 'Z':
                nxt_char = chr(ord(char) + 1)
                end_index = about_page_lines.index(
                    '%s<span>%s</span>\n' % (SPAN_INDENT, nxt_char)) - 2
            else:
                end_index = about_page_lines.index(
                    LINE_AFTER_Z_DEVELOPER_NAMES) - 2

            old_developer_names = about_page_lines[start_index:end_index]
            updated_developer_names = (
                old_developer_names + developer_name_dict[char])
            updated_developer_names = sorted(
                updated_developer_names, key=lambda s: s.lower())
            about_page_lines[start_index:end_index] = updated_developer_names

    with python_utils.open_file(
        ABOUT_PAGE_FILEPATH, 'w') as about_page_file:
        for line in about_page_lines:
            about_page_file.write(line)
    python_utils.PRINT('Updated about-page file!')


def main():
    """Collects necessary info and dumps it to disk."""
    branch_name = _get_current_branch()
    if not re.match(r'release-\d+\.\d+\.\d+$', branch_name):
        raise Exception(
            'This script should only be run from the latest release branch.')

    parsed_args = _PARSER.parse_args()
    if parsed_args.github_username is None:
        python_utils.PRINT(
            'No GitHub username provided. Please re-run the '
            'script specifying a username using --username=<Your username>')
        return
    github_username = parsed_args.github_username

    personal_access_token = getpass.getpass(
        prompt=(
            'Please provide personal access token for your github ID. '
            'You can create one at https://github.com/settings/tokens: '))

    if personal_access_token is None:
        python_utils.PRINT(
            'No personal access token provided, please set up a personal '
            'access token at https://github.com/settings/tokens and re-run '
            'the script')
        return
    g = github.Github(personal_access_token)
    repo = g.get_organization('oppia').get_repo('oppia')
    repo_fork = g.get_repo('%s/oppia' % github_username)

    blocking_bugs_count = get_blocking_bug_issue_count(repo)
    if blocking_bugs_count:
        common.open_new_tab_in_browser_if_possible(
            'https://github.com/oppia/oppia/issues?q=is%3Aopen+'
            'is%3Aissue+milestone%3A%22Blocking+bugs%22')
        raise Exception(
            'There are %s unresolved blocking bugs. Please '
            'ensure that they are resolved before changelog creation.' % (
                blocking_bugs_count))

    if not check_prs_for_current_release_are_released(repo):
        common.open_new_tab_in_browser_if_possible(
            'https://github.com/oppia/oppia/pulls?utf8=%E2%9C%93&q=is%3Apr'
            '+label%3A%22PR%3A+for+current+release%22+')
        raise Exception(
            'There are PRs for current release which do not have '
            'a \'PR: released\' label. Please ensure that they are released '
            'before changelog creation.')

    current_release = _get_current_version_tag(repo)
    current_release_tag = current_release.name
    base_commit = current_release.commit.sha
    new_commits = get_extra_commits_in_new_release(base_commit, repo)
    new_release_logs = _gather_logs(base_commit)

    for index, log in enumerate(new_release_logs):
        is_cherrypicked = all(
            [log.sha1 != commit.sha for commit in new_commits])
        if is_cherrypicked:
            del new_release_logs[index]

    past_logs = _gather_logs(FIRST_OPPIA_COMMIT, stop=base_commit)
    issue_links = _extract_issues(new_release_logs)
    feconf_version_changes = _check_versions(current_release_tag)
    setup_changes = _check_setup_scripts(current_release_tag)
    storage_changes = _check_storage_models(current_release_tag)

    pr_numbers = _extract_pr_numbers(new_release_logs)
    prs = get_prs_from_pr_numbers(pr_numbers, repo)
    categorized_pr_titles = get_changelog_categories(prs)

    with python_utils.open_file(RELEASE_SUMMARY_FILEPATH, 'w') as out:
        out.write('## Collected release information\n')

        if feconf_version_changes:
            out.write('\n### Feconf version changes:\nThis indicates that a '
                      'migration may be needed\n\n')
            for var in feconf_version_changes:
                out.write('* %s  \n' % var)

        if setup_changes:
            out.write('\n### Changed setup scripts:\n')
            for var in setup_changes.keys():
                out.write('* %s  \n' % var)

        if storage_changes:
            out.write('\n### Changed storage models:\n')
            for item in storage_changes:
                out.write('* %s  \n' % item)

        past_authors = {
            log.email: log.author for log in past_logs
        }
        release_authors = {(log.author, log.email) for log in new_release_logs}

        new_authors = sorted(set(
            [(name, email) for name, email in release_authors
             if email not in past_authors]))
        existing_authors = sorted(set(
            [(name, email) for name, email in release_authors
             if email in past_authors]))
        new_author_names = [name for name, _ in new_authors]
        existing_author_names = [name for name, _ in existing_authors]

        # TODO(apb7): duplicate author handling due to email changes.
        out.write('\n### New Authors:\n')
        for name, email in new_authors:
            out.write('* %s <%s>\n' % (name, email))

        out.write('\n### Existing Authors:\n')
        for name, email in existing_authors:
            out.write('* %s <%s>\n' % (name, email))

        out.write('\n### New Contributors:\n')
        for name, email in new_authors:
            out.write('* %s <%s>\n' % (name, email))

        # Generate the author sections of the email.
        out.write('\n### Email C&P Blurbs about authors:\n')
        new_author_comma_list = (
            '%s, and %s' % (', '.join(
                new_author_names[:-1]), new_author_names[-1]))
        existing_author_comma_list = (
            '%s, and %s' % (', '.join(
                existing_author_names[:-1]), existing_author_names[-1]))
        out.write(
            '``Please welcome %s for whom this release marks their first '
            'contribution to Oppia!``\n\n' % new_author_comma_list)
        out.write(
            '``Thanks to %s, our returning contributors who made this release '
            'possible.``\n' % existing_author_comma_list)

        if personal_access_token:
            out.write('\n### Changelog: \n')
            for category in categorized_pr_titles:
                out.write('%s\n' % category)
                for pr_title in categorized_pr_titles[category]:
                    out.write('* %s\n' % pr_title)
                out.write('\n')

        out.write('\n### Commit History:\n')
        for name, title in [(log.author, log.message.split('\n\n')[0])
                            for log in new_release_logs]:
            out.write('* %s\n' % title)

        if issue_links:
            out.write('\n### Issues mentioned in commits:\n')
            for link in issue_links:
                out.write('* [%s](%s)  \n' % (link, link))

    python_utils.PRINT('Done. Summary file generated in %s' % (
        RELEASE_SUMMARY_FILEPATH))

    while True:
        python_utils.PRINT(
            '******************************************************')
        python_utils.PRINT(
            'Please update %s to:\n- have a correct changelog for '
            'updating the CHANGELOG file\n- have a correct list of new '
            'authors and contributors to update AUTHORS, CONTRIBUTORS '
            'and developer_names section in about-page.directive.html\n'
            'Confirm once you are done by entering y/ye/yes.\n' % (
                RELEASE_SUMMARY_FILEPATH))
        answer = python_utils.INPUT().lower()
        if answer in ['y', 'ye', 'yes']:
            break

    current_release_version = branch_name[len(
        common.RELEASE_BRANCH_NAME_PREFIX):]
    source_branch = 'develop'
    target_branch = 'update-changelog-for-releasev%s' % current_release_version
    release_summary_lines = []
    # This complete code block is wrapped in try except since in case of
    # an exception, we should ensure that the changes made to AUTHORS,
    # CONTRIBUTORS, CHANGELOG and about-page are reverted and the branch
    # created is deleted. This is required to avoid errors when running
    # the script again.
    try:
        with python_utils.open_file(
            RELEASE_SUMMARY_FILEPATH, 'r') as release_summary_file:
            release_summary_lines = release_summary_file.readlines()

        update_changelog(
            release_summary_lines, current_release_version)
        update_authors(release_summary_lines)
        update_contributors(release_summary_lines)
        update_developer_names(release_summary_lines)

        python_utils.PRINT(
            'Creating new branch with updates to AUTHORS, CONTRIBUTORS, '
            'CHANGELOG and about-page...')
        sb = repo_fork.get_branch(source_branch)
        repo_fork.create_git_ref(
            ref='refs/heads/%s' % target_branch, sha=sb.commit.sha)

        for filepath in [
                ABOUT_PAGE_FILEPATH, CONTRIBUTORS_FILEPATH, AUTHORS_FILEPATH,
                CHANGELOG_FILEPATH]:
            contents = repo_fork.get_liness(filepath, ref=target_branch)
            with python_utils.open_file(filepath, 'r') as f:
                repo_fork.update_file(
                    contents.path, 'Update %s' % filepath, f.read(),
                    contents.sha, branch=target_branch)
        _run_cmd(GIT_CMD_TEMPLATE_CHECKOUT % ('%s %s %s %s') % (
            ABOUT_PAGE_FILEPATH, CONTRIBUTORS_FILEPATH, AUTHORS_FILEPATH,
            CHANGELOG_FILEPATH))
        common.open_new_tab_in_browser_if_possible(
            'https://github.com/oppia/oppia/compare/develop...%s:%s?'
            'expand=1' % (github_username, target_branch))
        python_utils.PRINT(
            'Pushed changes to Github. '
            'Please create a pull request from the %s branch' % target_branch)
    except Exception as e:
        _run_cmd(GIT_CMD_TEMPLATE_CHECKOUT % ('%s %s %s %s') % (
            ABOUT_PAGE_FILEPATH, CONTRIBUTORS_FILEPATH, AUTHORS_FILEPATH,
            CHANGELOG_FILEPATH))
        # The get_git_ref code is wrapped in try except block since the
        # function raises an exception if the target branch is not found.
        try:
            repo_fork.get_git_ref('heads/%s' % target_branch).delete()
        except Exception:
            python_utils.PRINT(
                'Please ensure that %s branch is deleted before re-running '
                'the script' % target_branch)
        raise Exception(e)


if __name__ == '__main__':
    main()
