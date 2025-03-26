import os
import requests
import time

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
REPO = os.getenv("GITHUB_REPOSITORY")
HEADERS = {"Authorization": f"token {GITHUB_TOKEN}", "Accept": "application/vnd.github.v3+json"}
RETRY_COUNT = 3
RETRY_DELAY = 5

def list_open_prs():
    """Fetch all open pull requests with pagination."""
    prs = []
    page = 1
    while True:
        url = f"https://api.github.com/repos/{REPO}/pulls?state=open&page={page}&per_page=100"
        response = requests.get(url, headers=HEADERS)
        response.raise_for_status()
        current_prs = response.json()
        if not current_prs:
            break
        prs.extend(current_prs)
        page += 1
    return prs

def fetch_pr_details(pr_number):
    """Fetch PR details with retries for undetermined mergeable state."""
    pr_details_url = f"https://api.github.com/repos/{REPO}/pulls/{pr_number}"
    for attempt in range(RETRY_COUNT):
        response = requests.get(pr_details_url, headers=HEADERS)
        response.raise_for_status()
        pr_details = response.json()
        mergeable_state = pr_details.get("mergeable_state")
        if mergeable_state and mergeable_state != "unknown":
            return pr_details
        print(f"Retry {attempt + 1}/{RETRY_COUNT}: Mergeable state is 'unknown' for PR #{pr_number}. Retrying...")
        time.sleep(RETRY_DELAY)
    print(f"Mergeable state could not be determined for PR #{pr_number} after retries.")
    return None

def assign_pr_author(pr_number, pr_author):
    """Assign the PR author as the sole assignee."""
    assign_url = f"https://api.github.com/repos/{REPO}/issues/{pr_number}"
    assign_payload = {"assignees": [pr_author]}
    response = requests.patch(assign_url, json=assign_payload, headers=HEADERS)
    if response.ok:
        print(f"Successfully assigned {pr_author} to PR #{pr_number}.")
    else:
        print(f"Failed to assign {pr_author} to PR #{pr_number}. Response: {response.text}")

def notify_pr_author(pr_number, pr_author):
    """Notify the PR author about merge conflicts."""
    comment_url = f"https://api.github.com/repos/{REPO}/issues/{pr_number}/comments"
    message = (
        f"Hi @{pr_author}, due to recent changes in the 'develop' branch, this PR now has a merge conflict. "
        f"Please refer to [GitHub's guide on resolving merge conflicts](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/addressing-merge-conflicts/resolving-a-merge-conflict-using-the-command-line) "
        f"if you need help resolving the conflict, so that the PR can be merged. Thanks!"
    )
    comment_payload = {"body": message}
    response = requests.post(comment_url, json=comment_payload, headers=HEADERS)
    if response.ok:
        print(f"Notified {pr_author} about conflicts in PR #{pr_number}.")
    else:
        print(f"Failed to notify {pr_author} in PR #{pr_number}. Response: {response.text}")

def check_and_notify(prs):
    """Check PRs for merge conflicts, assign and notify authors."""
    for pr in prs:
        pr_number = pr["number"]
        pr_author = pr["user"]["login"]
        print(f"Checking PR #{pr_number} by {pr_author}.")

        pr_details = fetch_pr_details(pr_number)
        if not pr_details:
            continue  # Skip if mergeable state undetermined

        mergeable_state = pr_details.get("mergeable_state")
        if mergeable_state == "dirty":
            print(f"PR #{pr_number} has merge conflicts.")
            assign_pr_author(pr_number, pr_author)
            notify_pr_author(pr_number, pr_author)
        else:
            print(f"PR #{pr_number} state: {mergeable_state}. No action needed.")

if __name__ == "__main__":
    try:
        open_prs = list_open_prs()
        check_and_notify(open_prs)
    except Exception as e:
        print(f"Error: {e}")
