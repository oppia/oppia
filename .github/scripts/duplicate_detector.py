import os
import json
import urllib.request
import re
from sentence_transformers import SentenceTransformer, util


def get_template_lines(repo_path):
    template_lines = set()
    template_dir = os.path.join(repo_path, '.github', 'ISSUE_TEMPLATE')
    if os.path.exists(template_dir):
        for root, dirs, files in os.walk(template_dir):
            for file in files:
                if file.endswith('.md') or file.endswith('.yml'):
                    with open(
                        os.path.join(root, file), 'r', encoding='utf-8'
                    ) as f:
                        for line in f:
                            clean_line = line.strip()
                            if (
                                len(clean_line) > 10
                                and not clean_line.startswith('name:')
                                and not clean_line.startswith('description:')
                                and not clean_line.startswith('title:')
                            ):
                                template_lines.add(clean_line.lower())
    return template_lines


def clean_text(text, template_lines):
    # Strip markdown headers that come from YAML fields (e.g., "### Label")
    text = re.sub(r'^###\s+.*$', '', text, flags=re.MULTILINE)
    clean_lines = []
    for line in text.split('\n'):
        if line.strip().lower() not in template_lines:
            clean_lines.append(line)
    return '\n'.join(clean_lines)


def get_all_open_issues(repo, headers):
    issues = []
    page = 1
    while True:
        url = f"https://api.github.com/repos/{repo}/issues?state=open&per_page=100&page={page}"
        req = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(req) as response:
                page_issues = json.loads(response.read().decode())
                if not page_issues:
                    break
                issues.extend(page_issues)
                page += 1
        except Exception as e:
            print(f"Error fetching issues on page {page}: {e}")
            break
    return issues


def main():
    print("Loading HuggingFace Sentence Transformers AI Model...")
    # This downloads the 80MB neural network model (cached if run locally)
    model = SentenceTransformer('all-MiniLM-L6-v2')

    event_path = os.environ.get('GITHUB_EVENT_PATH')
    event = {}
    if event_path and os.path.exists(event_path):
        with open(event_path, 'r') as f:
            event = json.load(f)

    repo = os.environ.get('GITHUB_REPOSITORY')
    token = os.environ.get('GITHUB_TOKEN')
    workspace = os.environ.get('GITHUB_WORKSPACE', '.')
    threshold = float(os.environ.get('THRESHOLD_SCORE', 0.8))

    print("Extracting boilerplate from templates...")
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
        print("Manual trigger detected. Batch mode.")
        start_issue = int(start_issue_env) if start_issue_env else 1
        end_issue = int(end_issue_env) if end_issue_env else 999999999
        print("Fetching all open issues for batch processing...")
        all_issues = get_all_open_issues(repo, headers)

        for iss in all_issues:
            if start_issue <= iss['number'] <= end_issue:
                issues_to_triage.append(iss)
        # Sort ascending so we process older issues first
        issues_to_triage.sort(key=lambda x: x['number'])
    else:
        print("Automatic trigger detected.")
        is_pr = 'pull_request' in event
        item = event.get('pull_request') if is_pr else event.get('issue')
        if not item:
            print("No issue or PR found in event payload.")
            return
        issues_to_triage = [item]
        print("Fetching all open issues to compare against...")
        all_issues = get_all_open_issues(repo, headers)

    if not issues_to_triage:
        print("No issues found to triage in the given range.")
        return

    print(f"Generating embeddings for {len(all_issues)} open issues...")
    # Pre-compute all embeddings for O(N) performance
    embeddings = {}
    for iss in all_issues:
        title = iss.get('title', '')
        body = iss.get('body', '') or ''
        text = clean_text(f"{title} {body}", template_lines)
        embeddings[iss['number']] = model.encode(text, convert_to_tensor=True)

    # Ensure targeted issues have embeddings even if not in the fetched list
    for iss in issues_to_triage:
        if iss['number'] not in embeddings:
            title = iss.get('title', '')
            body = iss.get('body', '') or ''
            text = clean_text(f"{title} {body}", template_lines)
            embeddings[iss['number']] = model.encode(
                text, convert_to_tensor=True
            )

    print(f"Triaging {len(issues_to_triage)} issues...")
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
            print(
                f"Issue #{current_id}: No duplicate found. (Highest score: {best_score})"
            )
            continue

        print(
            f"Issue #{current_id}: Duplicate found! #{best_issue_number} (Score: {best_score})"
        )

        # Add label
        label_url = (
            f"https://api.github.com/repos/{repo}/issues/{current_id}/labels"
        )
        label_data = json.dumps({"labels": ["potential-duplicate"]}).encode(
            'utf-8'
        )
        label_req = urllib.request.Request(
            label_url, data=label_data, headers=headers, method='POST'
        )
        try:
            urllib.request.urlopen(label_req)
            print(f"Issue #{current_id}: Label added.")
        except Exception as e:
            print(f"Issue #{current_id}: Failed to add label: {e}")

        # Add comment
        comment_url = (
            f"https://api.github.com/repos/{repo}/issues/{current_id}/comments"
        )
        login = target_iss.get('user', {}).get('login', 'contributor')
        comment_body = (
            f"Hi @{login}, thanks for opening this! We have automatically detected that this might be a duplicate of #{best_issue_number}.\n\n"
            f"If you believe this is a unique issue, please feel free to ignore this message.\n\n"
            f"cc: @oppia/dev-workflow-reviewers"
        )
        comment_data = json.dumps({"body": comment_body}).encode('utf-8')
        comment_req = urllib.request.Request(
            comment_url, data=comment_data, headers=headers, method='POST'
        )
        try:
            urllib.request.urlopen(comment_req)
            print(f"Issue #{current_id}: Comment added.")
        except Exception as e:
            print(f"Issue #{current_id}: Failed to add comment: {e}")


if __name__ == '__main__':
    main()
