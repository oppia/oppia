# Copyright 2026 The Oppia Authors. All Rights Reserved.
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

"""Module for detecting duplicate issues."""

from __future__ import annotations

import json
import logging
import os
import re
import urllib.request

from sentence_transformers import (  # pylint: disable=import-error
    SentenceTransformer,
    util,
)


def get_template_lines(repo_path):
    """Extracts template boilerplate from issue and PR templates.

    Args:
        repo_path: str. Path to the repository.

    Returns:
        set. A set of boilerplate lines.
    """
    template_lines = set()
    targets = [
        os.path.join(repo_path, '.github', 'ISSUE_TEMPLATE'),
        os.path.join(repo_path, '.github', 'PULL_REQUEST_TEMPLATE.md'),
    ]

    for target in targets:
        if os.path.isdir(target):
            for root, _, files in os.walk(target):
                for file in files:
                    if file.endswith('.md') or file.endswith('.yml'):
                        with open(
                            os.path.join(root, file), 'r', encoding='utf-8'
                        ) as f:
                            for line in f:
                                clean_line = line.strip()
                                if len(
                                    clean_line
                                ) > 10 and not clean_line.startswith(
                                    ('name:', 'description:', 'title:')
                                ):
                                    template_lines.add(clean_line.lower())
        elif os.path.isfile(target):
            with open(target, 'r', encoding='utf-8') as f:
                for line in f:
                    clean_line = line.strip()
                    if len(clean_line) > 10 and not clean_line.startswith(
                        ('name:', 'description:', 'title:')
                    ):
                        template_lines.add(clean_line.lower())
    return template_lines


def clean_text(text, template_lines):
    """Cleans the issue text by removing boilerplate template lines.

    Args:
        text: str. The text to clean.
        template_lines: set. Set of boilerplate lines to remove.

    Returns:
        str. Cleaned text.
    """
    text = re.sub(r'^###\s+.*$', '', text, flags=re.MULTILINE)
    clean_lines = []
    for line in text.split('\n'):
        if line.strip().lower() not in template_lines:
            clean_lines.append(line)
    return '\n'.join(clean_lines)


def get_all_open_issues(repo, headers):
    """Fetches all open issues from the GitHub API via pagination.

    Args:
        repo: str. The repository string.
        headers: dict. The headers for the API request.

    Returns:
        list. A list of issue dictionaries.
    """
    issues = []
    page = 1
    while True:
        url = (
            f'https://api.github.com/repos/{repo}/issues?'
            f'state=open&per_page=100&page={page}'
        )
        req = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(req) as response:
                page_issues = json.loads(response.read().decode())
                if not page_issues:
                    break
                issues.extend(page_issues)
                page += 1
        except Exception as e:
            logging.info('Error fetching issues on page %s: %s', page, e)
            break
    return issues


def main():
    """Main execution function."""
    logging.getLogger().setLevel(logging.INFO)
    logging.info('Loading HuggingFace Sentence Transformers AI Model...')
    model = SentenceTransformer('all-MiniLM-L6-v2')

    event_path = os.environ.get('GITHUB_EVENT_PATH')
    event = {}
    if event_path and os.path.exists(event_path):
        with open(event_path, 'r', encoding='utf-8') as f:
            event = json.load(f)

    repo = os.environ.get('GITHUB_REPOSITORY')
    token = os.environ.get('GITHUB_TOKEN')
    workspace = os.environ.get('GITHUB_WORKSPACE', '.')
    threshold = float(os.environ.get('THRESHOLD_SCORE', '0.8'))

    logging.info('Extracting boilerplate from templates...')
    template_lines = get_template_lines(workspace)

    headers = {
        'Authorization': f'token {token}',
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'duplicate-detector',
    }

    start_issue_env = os.environ.get('START_ISSUE_NUMBER', '')
    end_issue_env = os.environ.get('END_ISSUE_NUMBER', '')

    issues_to_triage = []

    is_manual_trigger = (
        os.environ.get('GITHUB_EVENT_NAME') == 'workflow_dispatch'
    )

    if is_manual_trigger:
        logging.info('Manual trigger detected. Batch mode.')
        start_issue = int(start_issue_env) if start_issue_env else 1
        end_issue = int(end_issue_env) if end_issue_env else 999999999
        logging.info('Fetching all open issues for batch processing...')
        all_issues = get_all_open_issues(repo, headers)

        for iss in all_issues:
            if start_issue <= iss['number'] <= end_issue:
                issues_to_triage.append(iss)
        issues_to_triage.sort(key=lambda x: x['number'])
    else:
        logging.info('Automatic trigger detected.')
        item = event.get('issue')
        if not item:
            logging.info('No issue found in event payload.')
            return
        issues_to_triage = [item]
        logging.info('Fetching all open issues to compare against...')
        all_issues = get_all_open_issues(repo, headers)

    if not issues_to_triage:
        logging.info('No issues found to triage in the given range.')
        return

    logging.info('Generating embeddings for %s open issues...', len(all_issues))
    embeddings = {}
    for iss in all_issues:
        title = iss.get('title', '')
        body = iss.get('body', '') or ''
        text = clean_text(f'{title} {body}', template_lines)
        embeddings[iss['number']] = model.encode(text, convert_to_tensor=True)

    for iss in issues_to_triage:
        if iss['number'] not in embeddings:
            title = iss.get('title', '')
            body = iss.get('body', '') or ''
            text = clean_text(f'{title} {body}', template_lines)
            embeddings[iss['number']] = model.encode(
                text, convert_to_tensor=True
            )

    logging.info('Triaging %s issues...', len(issues_to_triage))
    for target_iss in issues_to_triage:
        current_id = target_iss['number']
        current_embedding = embeddings[current_id]

        best_score = 0.0
        best_issue_number = None

        for iss in all_issues:
            if iss['number'] >= current_id:
                continue

            score = util.cos_sim(
                current_embedding, embeddings[iss['number']]
            ).item()
            if score > best_score:
                best_score = score
                best_issue_number = iss['number']

        if best_issue_number is None or best_score < threshold:
            logging.info(
                'Issue #%s: No duplicate found. (Highest score: %s)',
                current_id,
                best_score,
            )
            continue

        logging.info(
            'Issue #%s: Duplicate found! #%s (Score: %s)',
            current_id,
            best_issue_number,
            best_score,
        )

        label_url = (
            f'https://api.github.com/repos/{repo}/issues/{current_id}/labels'
        )
        label_data = json.dumps({'labels': ['potential-duplicate']}).encode(
            'utf-8'
        )
        label_req = urllib.request.Request(
            label_url, data=label_data, headers=headers, method='POST'
        )
        try:
            urllib.request.urlopen(label_req)
            logging.info('Issue #%s: Label added.', current_id)
        except Exception as e:
            logging.info('Issue #%s: Failed to add label: %s', current_id, e)

        comment_url = (
            f'https://api.github.com/repos/{repo}/issues/{current_id}/comments'
        )
        login = target_iss.get('user', {}).get('login', 'contributor')
        comment_body = (
            f'Hi @{login}, thanks for opening this! We have automatically '
            f'detected that this might be a duplicate of #{best_issue_number}.\n\n'
            f'If you believe this is a unique issue, please feel free '
            f'to ignore this message.\n\n'
            f'cc: @oppia/dev-workflow-reviewers'
        )
        comment_data = json.dumps({'body': comment_body}).encode('utf-8')
        comment_req = urllib.request.Request(
            comment_url, data=comment_data, headers=headers, method='POST'
        )
        try:
            urllib.request.urlopen(comment_req)
            logging.info('Issue #%s: Comment added.', current_id)
        except Exception as e:
            logging.info('Issue #%s: Failed to add comment: %s', current_id, e)


if __name__ == '__main__':
    main()
