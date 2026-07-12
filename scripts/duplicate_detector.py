# Copyright 2026 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
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

from core.constants import constants

import sentence_transformers  # pylint: disable=import-error
from typing import Any, Dict, List, Optional, Set, Tuple


# Here we use type Any because the parsed JSON object is highly dynamic.
def _get_template_lines_recursive(path: str, template_lines: Set[str]) -> None:
    """Helper function to recursively find and parse template files.

    Args:
        path: str. The current path to process.
        template_lines: set. A set to store the boilerplate lines.
    """
    if os.path.isfile(path):
        if path.endswith('.md') or path.endswith('.yml'):
            with open(path, 'r', encoding='utf-8') as f:
                for line in f:
                    clean_line = line.strip()
                    if clean_line:
                        template_lines.add(clean_line.lower())
    elif os.path.isdir(path):
        for item in os.listdir(path):
            _get_template_lines_recursive(
                os.path.join(path, item), template_lines
            )


def get_template_lines(workspace: str) -> Set[str]:
    """Extracts all non-empty lines from issue and PR templates.

    Args:
        workspace: str. The absolute path to the repository root.

    Returns:
        set. A set of stripped, lowercased lines from the templates.
    """
    template_lines: Set[str] = set()
    issue_template_dir = os.path.join(workspace, '.github', 'ISSUE_TEMPLATE')
    pr_template_file = os.path.join(
        workspace, '.github', 'PULL_REQUEST_TEMPLATE.md'
    )

    _get_template_lines_recursive(issue_template_dir, template_lines)
    _get_template_lines_recursive(pr_template_file, template_lines)

    return template_lines


def clean_text(text: str, template_lines: Set[str]) -> str:
    """Removes markdown formatting and boilerplate template lines.

    Args:
        text: str. The original issue text.
        template_lines: set. A set of boilerplate template lines.

    Returns:
        str. The cleaned issue text.
    """
    text = re.sub(r'#+\s+.*?\n', '\n', text)

    lines = text.split('\n')
    cleaned_lines = []
    for line in lines:
        if line.strip().lower() not in template_lines:
            cleaned_lines.append(line)
    return '\n'.join(cleaned_lines)


# Here we use type Any because the JSON response from the GitHub API contains generic structures.
def get_all_open_issues(
    repo: str, headers: Dict[str, str]
) -> List[Dict[str, Any]]:
    """Fetches all open issues from the GitHub repository.

    Args:
        repo: str. The repository name (e.g., 'oppia/oppia').
        headers: dict. The headers to use for the API request.

    Returns:
        list. A list of issue dictionaries.
    """
    # Here we use type Any because the JSON response from the GitHub API contains generic structures.
    issues: List[Dict[str, Any]] = []
    page = 1
    while True:
        url = (
            f'https://api.github.com/repos/{repo}/issues?'
            f'state=open&per_page=100&page={page}'
        )
        req = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                page_issues = json.loads(response.read().decode())
                for issue in page_issues:
                    if 'pull_request' not in issue:
                        issues.append(issue)
                if not page_issues:
                    break
                page += 1
        except Exception as e:
            logging.error('Error fetching issues on page %s: %s', page, e)
            break
    return issues


# Here we use type Any because the GitHub event JSON payload contains generic data.
def load_event(event_path: str) -> Dict[str, Any]:
    """Loads the GitHub event from the given path."""
    event = {}
    if event_path and os.path.exists(event_path):
        with open(event_path, 'r', encoding='utf-8') as f:
            event = json.load(f)
    return event


# Here we use type Any because the GitHub API returns issues with highly dynamic JSON structures.
def get_issues_to_classify(
    open_issues: List[Dict[str, Any]],
    event: Dict[str, Any],
    is_manual_trigger: bool,
    start_issue_env: str,
    end_issue_env: str,
) -> List[Dict[str, Any]]:
    """Determines which issues need classification based on the trigger."""
    issues_to_classify = []
    if is_manual_trigger:
        logging.info('Manual trigger detected. Batch mode.')
        if not start_issue_env:
            raise ValueError(
                'start_issue_number is required for manual trigger.'
            )
        start_issue_number = int(start_issue_env)
        end_issue_number = (
            int(end_issue_env) if end_issue_env else start_issue_number
        )

        for issue in open_issues:
            if start_issue_number <= issue['number'] <= end_issue_number:
                issues_to_classify.append(issue)
        issues_to_classify.sort(key=lambda x: int(x['number']))
    else:
        logging.info('Automatic trigger detected.')
        item = event.get('issue')
        if not item:
            logging.info('No issue found in event payload.')
            return []
        issues_to_classify = [item]
    return issues_to_classify


# Here we use type Any because the model parameter is an external library object without explicit typing, and issue dictionaries contain dynamic structures.
def generate_embeddings(
    issues: List[Dict[str, Any]], model: Any, template_lines: Set[str]
) -> Dict[int, Any]:
    """Generates embeddings for the given list of issues."""
    embeddings = {}
    for issue in issues:
        title = issue.get('title', '')
        body = issue.get('body', '') or ''
        text = clean_text(f'{title} {body}', template_lines)
        embeddings[issue['number']] = model.encode(text, convert_to_tensor=True)
    return embeddings


# Here we use type Any because issues and embeddings rely on external outputs and generic dictionaries.
def find_best_match(
    target_issue: Dict[str, Any],
    open_issues: List[Dict[str, Any]],
    embeddings: Dict[int, Any],
) -> Tuple[Optional[int], float]:
    """Finds the best matching prior issue for the target issue."""
    current_id = target_issue['number']
    current_embedding = embeddings[current_id]
    best_score = 0.0
    best_issue_number = None

    for issue in open_issues:
        if issue['number'] >= current_id:
            continue

        score = sentence_transformers.util.cos_sim(
            current_embedding, embeddings[issue['number']]
        ).item()
        if score > best_score:
            best_score = score
            best_issue_number = issue['number']

    return best_issue_number, best_score


# Here we use type Any because target_issue contains generic GitHub API JSON values.
def label_and_comment(
    repo: str,
    headers: Dict[str, str],
    current_id: int,
    best_issue_number: int,
    target_issue: Dict[str, Any],
) -> None:
    """Adds a duplicate label and a comment to the target issue."""
    label_url = (
        f'https://api.github.com/repos/{repo}/issues/{current_id}/labels'
    )
    label_data = json.dumps(
        {'labels': [constants.DUPLICATE_ISSUE_LABEL]}
    ).encode('utf-8')
    label_req = urllib.request.Request(
        label_url, data=label_data, headers=headers, method='POST'
    )
    try:
        urllib.request.urlopen(label_req, timeout=30)
        logging.info('Issue #%s: Label added.', current_id)
    except Exception as e:
        logging.error('Issue #%s: Failed to add label: %s', current_id, e)

    comment_url = (
        f'https://api.github.com/repos/{repo}/issues/{current_id}/comments'
    )
    login = target_issue.get('user', {}).get('login', 'contributor')
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
        urllib.request.urlopen(comment_req, timeout=30)
        logging.info('Issue #%s: Comment added.', current_id)
    except Exception as e:
        logging.error('Issue #%s: Failed to add comment: %s', current_id, e)


def main() -> None:
    """Main execution function."""
    logging.getLogger().setLevel(logging.INFO)
    logging.info('Loading HuggingFace Sentence Transformers AI Model...')
    model = sentence_transformers.SentenceTransformer('all-MiniLM-L6-v2')

    event_path = os.environ.get('GITHUB_EVENT_PATH', '')
    event = load_event(event_path)

    repo = os.environ.get('GITHUB_REPOSITORY', '')
    token = os.environ.get('GITHUB_TOKEN', '')
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
    is_manual_trigger = (
        os.environ.get('GITHUB_EVENT_NAME') == 'workflow_dispatch'
    )

    logging.info('Fetching all open issues for processing...')
    open_issues = get_all_open_issues(repo, headers)

    issues_to_classify = get_issues_to_classify(
        open_issues, event, is_manual_trigger, start_issue_env, end_issue_env
    )

    if not issues_to_classify:
        logging.info('No issues found to classify in the given range.')
        return

    logging.info(
        'Generating embeddings for %s open issues...', len(open_issues)
    )
    embeddings = generate_embeddings(open_issues, model, template_lines)

    for issue in issues_to_classify:
        if issue['number'] not in embeddings:
            embeddings.update(
                generate_embeddings([issue], model, template_lines)
            )

    logging.info('Classifying %s issues...', len(issues_to_classify))
    for target_issue in issues_to_classify:
        current_id = target_issue['number']
        best_issue_number, best_score = find_best_match(
            target_issue, open_issues, embeddings
        )

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

        label_and_comment(
            repo, headers, current_id, best_issue_number, target_issue
        )


if __name__ == '__main__':  # pragma: no cover
    main()
