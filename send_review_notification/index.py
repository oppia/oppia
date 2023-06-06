# Copyright 2023 The Oppia Authors. All Rights Reserved.
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

"""The index file for sending pending-review notifications."""

from __future__ import annotations

import argparse
import logging
import os
import re

from send_review_notification import github_domain
from send_review_notification import github_services

from typing import List, Literal, Optional


PARSER = argparse.ArgumentParser(
    description='Send pending review notifications to reviewers.')
PARSER.add_argument(
    '--token',
    type=str,
    help='The github-token to be used for creating github discussions.')
PARSER.add_argument(
    '--repo',
    type=str,
    help='The repository name for fetching the pull requests.')
PARSER.add_argument(
    '--category',
    type=str,
    help='The category name for the discussion.')
PARSER.add_argument(
    '--title',
    type=str,
    help='The title of the discussion.')
PARSER.add_argument(
    '--max-wait-hours',
    type=int,
    help='The maximum waiting time for getting a PR reviewed in hours.')
PARSER.add_argument(
    '--verbose',
    action='store_true',
    help='Whether to add important logs in the process.')
PARSER.add_argument(
    '--test_mode',
    type=bool,
    help='Run the program in test mode and do not send notifications.')


def generate_message(username: str, pr_list: str) -> str:
    """Generates message using the template provided in
    PENDING_REVIEW_NOTIFICATION_TEMPLATE.md.
    """
    template_path = '.github/PENDING_REVIEW_NOTIFICATION_TEMPLATE.md'
    if not os.path.exists(template_path):
        raise Exception(f'Please add a template file at: {template_path}')
    message = ''
    with open(template_path, 'r', encoding='UTF-8') as file:
        message = file.read()

    message = re.sub(r'\{\{ *username *\}\}', '@' + username, message)
    message = re.sub(r'\{\{ *pr_list *\}\}', pr_list, message)

    return message


def send_notification(
    username: str,
    pull_requests: List[github_domain.PullRequest],
    org_name: str,
    repo: str,
    discussion_category: str,
    discussion_title: str,
    test_mode: Optional[str]
) -> None:
    """Sends notification on github-discussion."""
    pr_list_messages: List[str] = []
    for pull_request in pull_requests:
        assignee = pull_request.get_assignee(username)
        assert assignee is not None
        pr_list_messages.append(
            f'- [#{pull_request.number}]({pull_request.url}) [Waiting for the'
            f'last {assignee.get_readable_waiting_time()}]')

    title = f'[@{username}] Pending review on PRs'

    body = generate_message(username, '\n'.join(pr_list_messages))

    if test_mode:
        logging.info('Logging notification title in test mode: %s', title)
        return

    github_services.create_discussion_comment(
        org_name, repo, discussion_category, discussion_title, body)


def main(args: Optional[List[str]]=None) -> Literal[0]:
    """The main function to execute the workflow."""
    parsed_args = PARSER.parse_args(args=args)

    org_name, repo = parsed_args.repo.split('/')
    discussion_category = parsed_args.category
    discussion_title = parsed_args.title

    max_wait_hours = parsed_args.max_wait_hours
    test_mode = os.getenv('TEST_MODE_ENV')

    if parsed_args.verbose:
        logging.basicConfig(
            format='%(levelname)s: %(message)s', level=logging.INFO)

    if test_mode:
        logging.warning('Running in test mode')

    github_services.init_service(parsed_args.token)

    reviewer_to_assigned_prs = github_services.get_prs_assigned_to_reviewers(
        org_name, repo, max_wait_hours)
    for reviewer_name, prs in reviewer_to_assigned_prs.items():
        send_notification(
            reviewer_name,
            prs,
            org_name,
            repo,
            discussion_category,
            discussion_title,
            test_mode
        )

    return 0


if __name__ == '__main__':
    main()
