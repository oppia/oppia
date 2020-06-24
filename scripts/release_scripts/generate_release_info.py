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
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import collections
import os
import re
import sys

import python_utils
import release_constants
from scripts import common

_PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
_PY_GITHUB_PATH = os.path.join(_PARENT_DIR, 'oppia_tools', 'PyGithub-1.43.7')
sys.path.insert(0, _PY_GITHUB_PATH)

# pylint: disable=wrong-import-position
import github # isort:skip
# pylint: enable=wrong-import-position

GIT_CMD_GET_STATUS = 'git status'
GIT_CMD_TEMPLATE_GET_NEW_COMMITS = 'git cherry %s -v'
GIT_CMD_GET_LOGS_FORMAT_STRING = (
    'git log -z --no-color --pretty=format:%H{0}%aN{0}%aE{0}%B {1}..{2}')
GIT_CMD_DIFF_NAMES_ONLY_FORMAT_STRING = 'git diff --name-only %s %s'
GIT_CMD_SHOW_FORMAT_STRING = 'git show %s:feconf.py'
ISSUE_URL_FORMAT_STRING = 'https://github.com/oppia/oppia/issues/%s'
ISSUE_REGEX = re.compile(r'#(\d+)')
PR_NUMBER_REGEX = re.compile(r'\(#(\d+)\)$')
GROUP_SEP = '\x1D'
VERSION_RE_FORMAT_STRING = r'%s\s*=\s*(\d+|\.)+'
FECONF_VAR_NAMES = ['CURRENT_STATE_SCHEMA_VERSION',
                    'CURRENT_COLLECTION_SCHEMA_VERSION']
FIRST_OPPIA_COMMIT = '6a7138f5f603375e58d1dc3e1c4f1c80a126e249'
NO_LABEL_CHANGELOG_CATEGORY = 'Uncategorized'
FECONF_FILEPATH = os.path.join('', 'feconf.py')

Log = collections.namedtuple('Log', ['sha1', 'author', 'email', 'message'])


def get_current_version_tag(repo):
    """Retrieves the most recent version tag.

    Args:
        repo: github.Repository.Repository. The PyGithub object for the repo.

    Returns:
        github.Tag.Tag: The most recent version tag.
    """
    # In case of hotfix, the first version tag will be the version of the
    # release for which the hotfix branch is. So, if we require generation
    # of release summary in case of hotfix, we need to get the second version
    # tag. For example, if branch is release-1.2.3-hotfix-1, the first tag
    # on github will be 1.2.3 but the correct tag of previous release will be
    # 1.2.2 which is required for release summary generation.
    if 'hotfix' in common.get_current_branch_name():
        return repo.get_tags()[1]
    # This is for the normal release without any hotfix. In this case, the
    # first tag will be of current release serving on prod. For example, if we
    # are deploying release-1.2.3, the first tag on github will be 1.2.2 which
    # is required for release summary generation.
    else:
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
    out = python_utils.UNICODE(
        common.run_cmd(get_commits_cmd.split(' ')), 'utf-8').split('\n')
    commits = []
    for line in out:
        # Lines that start with a - are already cherrypicked. The commits of
        # interest are on lines that start with +.
        if line[0] == '+':
            line = line[2:]
            commit = repo.get_commit(line[:line.find(' ')])
            commits.append(commit)
    return commits


def gather_logs(start, stop='HEAD'):
    """Gathers the logs between the start and endpoint.

    Args:
        start: str. Tag, Branch or SHA1 of start point
        stop: str.  Tag, Branch or SHA1 of end point, defaults to HEAD

    Returns:
        list(Log): List of Logs.
    """
    get_logs_cmd = GIT_CMD_GET_LOGS_FORMAT_STRING.format(
        GROUP_SEP, start, stop)
    # The unicode conversion is required because there can be non-ascii
    # characters in the logs and it can result in breaking the flow
    # of release summary generation.
    out = python_utils.UNICODE(
        common.run_cmd(get_logs_cmd.split(' ')), 'utf-8').split('\x00')
    if len(out) == 1 and out[0] == '':
        return []
    else:
        return [Log(*line.strip().split(GROUP_SEP)) for line in out]


def extract_issues(logs):
    """Extract references to issues out of a list of Logs

    Args:
        logs: list(Log). List of Logs to parse

    Returns:
        set(str): Set of found issues as links to Github.
    """
    issues = ISSUE_REGEX.findall(' '.join([log.message for log in logs]))
    links = {ISSUE_URL_FORMAT_STRING % issue for issue in issues}
    return links


def extract_pr_numbers(logs):
    """Extract PR numbers out of a list of Logs.

    Args:
        logs: list(Log). List of Logs to parse.

    Returns:
        set(int): Set of PR numbers extracted from the log.
    """
    pr_numbers = []
    for log in logs:
        pr_numbers.extend(PR_NUMBER_REGEX.findall(log.message.split('\n')[0]))
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
                category = label.name[
                    label.name.find(':') + 2:label.name.find(' --')]
                added_to_dict = True
                result[category].append(formatted_title)
                break
        if not added_to_dict:
            result[NO_LABEL_CHANGELOG_CATEGORY].append(formatted_title)
    return dict(result)


def check_versions(current_release):
    """Checks if the versions for the exploration or collection schemas have
    changed.

    Args:
        current_release: str. The current release tag to diff against.

    Returns:
        List of variable names that changed.
    """
    feconf_changed_version = []
    git_show_cmd = (GIT_CMD_SHOW_FORMAT_STRING % current_release)
    old_feconf = common.run_cmd(git_show_cmd.split(' '))
    with python_utils.open_file(FECONF_FILEPATH, 'r') as feconf_file:
        new_feconf = feconf_file.read()
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
    return common.run_cmd(diff_cmd.split(' ')).splitlines()


def check_setup_scripts(base_release_tag, changed_only=True):
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
                     ['setup.py', 'setup_gae.py', 'install_third_party_libs.py',
                      'install_third_party.py']]
    changed_files = _git_diff_names_only(base_release_tag)
    changes_dict = {script: script in changed_files
                    for script in setup_scripts}
    if changed_only:
        return {name: status for name, status
                in changes_dict.items() if status}
    else:
        return changes_dict


def check_storage_models(current_release):
    """Check if files in core/storage have changed and returns them.

    Args:
        current_release: The current release version.

    Returns:
        list(str): The changed files (if any).
    """
    diff_list = _git_diff_names_only(current_release)
    return [item for item in diff_list if item.startswith('core/storage')]


def main(personal_access_token):
    """Collects necessary info and dumps it to disk.

    Args:
        personal_access_token: str. The personal access token for the
            GitHub id of user.
    """
    if not common.is_current_branch_a_release_branch():
        raise Exception(
            'This script should only be run from the latest release branch.')
    g = github.Github(personal_access_token)
    repo = g.get_organization('oppia').get_repo('oppia')

    current_release = get_current_version_tag(repo)
    current_release_tag = current_release.name
    base_commit = current_release.commit.sha
    new_commits = get_extra_commits_in_new_release(base_commit, repo)
    new_release_logs = gather_logs(base_commit)

    for index, log in enumerate(new_release_logs):
        is_cherrypicked = all(
            [log.sha1 != commit.sha for commit in new_commits])
        if is_cherrypicked:
            del new_release_logs[index]

    past_logs = gather_logs(FIRST_OPPIA_COMMIT, stop=base_commit)
    issue_links = extract_issues(new_release_logs)
    feconf_version_changes = check_versions(current_release_tag)
    setup_changes = check_setup_scripts(current_release_tag)
    storage_changes = check_storage_models(current_release_tag)

    pr_numbers = extract_pr_numbers(new_release_logs)
    prs = get_prs_from_pr_numbers(pr_numbers, repo)
    categorized_pr_titles = get_changelog_categories(prs)

    with python_utils.open_file(
        release_constants.RELEASE_SUMMARY_FILEPATH, 'w') as out:
        out.write('## Collected release information\n')

        if feconf_version_changes:
            out.write('\n### Feconf version changes:\nThis indicates that a '
                      'migration may be needed\n\n')
            for var in feconf_version_changes:
                out.write('* %s\n' % var)

        if setup_changes:
            out.write('\n### Changed setup scripts:\n')
            for var in setup_changes.keys():
                out.write('* %s\n' % var)

        if storage_changes:
            out.write('\n### Changed storage models:\n')
            for item in storage_changes:
                out.write('* %s\n' % item)

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

        # TODO(apb7): Duplicate author handling due to email changes.
        out.write('\n%s' % release_constants.NEW_AUTHORS_HEADER)
        for name, email in new_authors:
            out.write('* %s <%s>\n' % (name, email))

        out.write('\n%s' % release_constants.EXISTING_AUTHORS_HEADER)
        for name, email in existing_authors:
            out.write('* %s <%s>\n' % (name, email))

        out.write('\n%s' % release_constants.NEW_CONTRIBUTORS_HEADER)
        for name, email in new_authors:
            out.write('* %s <%s>\n' % (name, email))

        # Generate the author sections of the email.
        out.write('\n%s' % release_constants.EMAIL_HEADER)
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
            out.write('\n%s' % release_constants.CHANGELOG_HEADER)
            for category in categorized_pr_titles:
                out.write('%s\n' % category)
                for pr_title in categorized_pr_titles[category]:
                    out.write('* %s\n' % pr_title)
                out.write('\n')

        out.write('\n%s' % release_constants.COMMIT_HISTORY_HEADER)
        for name, title in [(log.author, log.message.split('\n\n')[0])
                            for log in new_release_logs]:
            out.write('* %s\n' % title)

        if issue_links:
            out.write('\n%s' % release_constants.ISSUES_HEADER)
            for link in issue_links:
                out.write('* [%s](%s)\n' % (link, link))

    python_utils.PRINT('Done. Summary file generated in %s' % (
        release_constants.RELEASE_SUMMARY_FILEPATH))


# The 'no coverage' pragma is used as this line is un-testable. This is because
# it will only be called when generate_release_info.py is used as
# a script.
if __name__ == '__main__': # pragma: no cover
    main(common.get_personal_access_token())
