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

"""
Script that simplifies releases by collecting various information.
Should be run from the oppia root dir.
"""
import collections
import os
import re
import subprocess
import sys


class ChangedBranch(object):
    def __init__(self, new_branch):
        get_branch_cmd = 'git symbolic-ref -q --short HEAD'.split()
        self.old_branch = subprocess.check_output(get_branch_cmd).strip()
        self.new_branch = new_branch
        self.is_same_branch = self.old_branch == self.new_branch

    def __enter__(self):
        if not self.is_same_branch:
            try:
                subprocess.check_output(["git", "checkout", self.new_branch])
            except subprocess.CalledProcessError:
                print ('\nCould not change to %s. This is most probably because'
                       ' you are in a dirty state' % self.new_branch)
                sys.exit(1)

    def __exit__(self, exc_type, exc_val, exc_tb):
        if not self.is_same_branch:
            subprocess.check_output(["git", "checkout", self.old_branch])


Log = collections.namedtuple('Log', ['sha1', 'author', 'email', 'message'])


def _get_current_version():
    """Get the newest tag in the current commits branch (the version number).

    Returns (str): Latest version tag
    """
    git_describe_cmd = 'git describe --abbrev=0'.split()
    return subprocess.check_output(git_describe_cmd).strip()


def _gather_logs(start, stop="HEAD"):
    """Gathers the logs between the start and endpoint.

    Args:
        start (str): Tag, Branch or SHA1 of start point
        stop (str):  Tag, Branch or SHA1 of end point, defaults to HEAD

    Returns:
        list[Log]: List of Logs

    """
    group_sep = '\x1D'
    git_log_cmd = \
        'git log -z --no-color --pretty=format:"%H{0}%aN{0}%aE{0}%B' \
            .format(group_sep).split(' ')
    git_log_cmd.append('%s..%s' % (start, stop))
    out = subprocess.check_output(git_log_cmd).strip().split('\x00')
    if len(out) == 1 and out[0] == '':
        return []
    else:
        return [Log(*line.strip().split(group_sep)) for line in out]


def _extract_issues(logs):
    """Extract references to issues out of a list of Logs

    Args:
        logs (list[Log]): List of Logs to parse

    Returns:
        set[str]: Set of found issues as links to Github

    """
    issue_regex = re.compile(r'#([0-9]{4})')
    issues = issue_regex.findall(" ".join([log.message for log in logs]))
    base_url = 'https://github.com/oppia/oppia/issues/%s'
    links = {base_url % issue for issue in issues}
    return links


def _check_versions(current_release):
    """Checks if the versions for the exploration or collection schemas have
    changed.

    Args:
        current_release (str): The current release tag to diff against.

    Returns:
        Dictionary consisting of name --> boolean that indicates whether or not
            it has changed.
    """
    feconf_vars = ['CURRENT_EXPLORATION_STATES_SCHEMA_VERSION',
                   'CURRENT_COLLECTION_SCHEMA_VERSION']
    feconf_changed_version = {}
    git_show_cmd = ('git show %s:feconf.py' % current_release).split()
    old_feconf = subprocess.check_output(git_show_cmd)
    with open('feconf.py', 'r') as feconf:
        new_feconf = feconf.read()
    for variable in feconf_vars:
        version_re = r'%s\s*=\s*(\d+|\.)+'
        old_version = re.findall(version_re % variable, old_feconf)[0]
        new_version = re.findall(version_re % variable, new_feconf)[0]
        feconf_changed_version[variable] = old_version != new_version
    return feconf_changed_version


def _git_diff_names_only(left, right='HEAD'):
    """ Get names of changed files from git.

    Args:
        left (str): Lefthand timepoint
        right (str): rightand timepoint

    Returns:
        (list): List of files that are different between the two points.

    """
    git_diff_cmd = ('git diff --name-only %s %s' % (left, right)).split()
    return subprocess.check_output(git_diff_cmd).splitlines()


def _check_setup_scripts(current_release, changed_only=False):
    """Check if setup scripts have changed.

    Args:
        current_release (str): The current release tag to diff against.
        changed_only (bool): If set to True returns only changed scripts

    Returns:
        dict consisting of script --> boolean indicating whether or not it has
            changed.
    """
    setup_scripts = ['scripts/%s' % item for item in
                     ['setup.sh', 'setup_gae.sh', 'install_third_party.sh',
                      'install_third_party.py']]
    changed_files = _git_diff_names_only(current_release)
    changes_dict = {script: script in changed_files for script in setup_scripts}
    if changed_only:
        return {name: status for name, status in changes_dict.items() if status}
    else:
        return changes_dict


def _check_storage_models(current_release):
    """Check if files in core/storage have changed and returns them.

    Args:
        current_release: The current release version

    Returns:
        (list): The changed files (if any)

    """
    diff_list = _git_diff_names_only(current_release)
    return [item for item in diff_list if item.startswith('core/storage')]


def main():
    """Collects necessary info and dumps it to disk."""
    with ChangedBranch('develop'):
        current_release = _get_current_version()
        logs = _gather_logs(current_release)
        issue_links = _extract_issues(logs)
        version_changes = _check_versions(current_release)
        setup_changes = _check_setup_scripts(current_release, changed_only=True)
        storage_changes = _check_storage_models(current_release)

    summary_file = os.path.join(os.getcwd(), os.pardir, "release_summary.md")
    with open(summary_file, 'w') as out:
        out.write('## Collected release information\n')
        out.write('\n### Feconf version changes:\n')
        for var, status in version_changes.items():
            out.write('* %s: %s\n' % (var, status))

        if setup_changes:
            out.write('\n### Changed setup scripts:\n')
            for var in setup_changes.keys():
                out.write('* %s\n' % var)

        if storage_changes:
            out.write('\n### Changed storage models:\n')
            for item in storage_changes:
                out.write('* %s\n' % item)

        out.write('\n### Authors:\n')
        # TODO: duplicate author handling due to email changes
        for name, email in sorted({(log.author, log.email) for log in logs}):
            out.write('%s <%s>  \n' % (name, email))

        out.write('\n### Commit History:\n')
        for name, title in [(log.author, log.message.split('\n\n')[0])
                            for log in logs]:
            out.write('%s: %s  \n' %(name, title))

        if issue_links:
            out.write('\n### Issues mentioned in commits:\n')
            for link in issue_links:
                out.write('* [%s](%s)\n' % (link, link))


if __name__ == '__main__':
    main()
