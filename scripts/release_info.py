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
import argparse
import collections
import os
import re
import subprocess
import sys

_PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
_PY_GITHUB_PATH = os.path.join(_PARENT_DIR, 'oppia_tools', 'PyGithub-1.43.5')
sys.path.insert(0, _PY_GITHUB_PATH)

# pylint: disable=wrong-import-position
import github # isort:skip
# pylint: enable=wrong-import-position

GIT_CMD_GET_STATUS = 'git status'
GIT_CMD_GET_TAGS = 'git tag'
GIT_CMD_GET_LCA_WITH_DEVELOP = 'git merge-base develop %s'
GIT_CMD_GET_LOGS_FORMAT_STRING = (
    'git log -z --no-color --pretty=format:%H{0}%aN{0}%aE{0}%B {1}..{2}')
GIT_CMD_DIFF_NAMES_ONLY_FORMAT_STRING = 'git diff --name-only %s %s'
GIT_CMD_SHOW_FORMAT_STRING = 'git show %s:feconf.py'
ISSUE_URL_FORMAT_STRING = 'https://github.com/oppia/oppia/issues/%s'
ISSUE_REGEX = re.compile(r'#(\d+)')
PR_NUMBER_REGEX = re.compile(r'\(#(\d+)\)')
GROUP_SEP = '\x1D'
VERSION_RE_FORMAT_STRING = r'%s\s*=\s*(\d+|\.)+'
FECONF_VAR_NAMES = ['CURRENT_STATES_SCHEMA_VERSION',
                    'CURRENT_COLLECTION_SCHEMA_VERSION']
FIRST_OPPIA_COMMIT = '6a7138f5f603375e58d1dc3e1c4f1c80a126e249'
NO_LABEL_CHANGELOG_CATEGORY = 'Uncategorized'

Log = collections.namedtuple('Log', ['sha1', 'author', 'email', 'message'])

_PARSER = argparse.ArgumentParser()
_PARSER.add_argument(
    '--personal_access_token',
    help=(
        'Personal access token for your github ID. '
        'You can create one at https://github.com/settings/tokens'),
    type=str)


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


def _get_current_version_tag():
    """Retrieves the most recent version tag.

    Returns:
        (str): The most recent version tag.
    """
    tags = _run_cmd(GIT_CMD_GET_TAGS).splitlines()
    return tags[-1]


def _get_base_commit_with_develop(reference):
    """Retrieves the commit hash common between the develop branch and the
    specified reference commit.

    Args:
        reference: str. Tag, Branch, or commit hash of reference commit.

    Returns:
        (str): The common commit hash.
    """
    return _run_cmd(GIT_CMD_GET_LCA_WITH_DEVELOP % reference)


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


def get_prs_from_pr_numbers(pr_numbers, personal_access_token):
    """Returns a list of PRs corresponding to the numbers provided.

    Args:
        pr_numbers: list(int). List of PR numbers.
        personal_access_token: str. The personal access token of the user.

    Returns:
        list(github.PullRequest.PullRequest). The list of references to the PRs.
    """
    g = github.Github(personal_access_token)
    repo = g.get_organization('oppia').get_repo('oppia')
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
    with open('feconf.py', 'r') as feconf:
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


def main():
    """Collects necessary info and dumps it to disk."""
    branch_name = _get_current_branch()
    if not re.match(r'release-\d+\.\d+\.\d+$', branch_name):
        raise Exception(
            'This script should only be run from the latest release branch.')

    parsed_args = _PARSER.parse_args()
    current_release = _get_current_version_tag()
    base_commit = _get_base_commit_with_develop(current_release)
    new_release_logs = _gather_logs(base_commit)
    past_logs = _gather_logs(FIRST_OPPIA_COMMIT, stop=base_commit)
    issue_links = _extract_issues(new_release_logs)
    feconf_version_changes = _check_versions(current_release)
    setup_changes = _check_setup_scripts(current_release)
    storage_changes = _check_storage_models(current_release)

    if parsed_args.personal_access_token:
        personal_access_token = parsed_args.personal_access_token
        pr_numbers = _extract_pr_numbers(new_release_logs)
        prs = get_prs_from_pr_numbers(pr_numbers, personal_access_token)
        categorized_pr_titles = get_changelog_categories(prs)
    else:
        print('No personal access token provided, changelog will not be '
              'printed. If you would like to have the changelog also printed'
              ' by the script, set up a personal access token at '
              'https://github.com/settings/tokens and pass it to the script '
              'using --personal_access_token=<token>')

    summary_file = os.path.join(os.getcwd(), os.pardir, 'release_summary.md')
    with open(summary_file, 'w') as out:
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

        # TODO: duplicate author handling due to email changes.
        out.write('\n### New Authors:\n')
        for name, email in new_authors:
            out.write('* %s <%s>\n' % (name, email))

        out.write('\n### Existing Authors:\n')
        for name, email in existing_authors:
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

        if parsed_args.personal_access_token:
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

    print 'Done. Summary file generated in ../release_summary.md'


if __name__ == '__main__':
    main()
