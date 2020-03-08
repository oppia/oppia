import os
import requests
import json
import re

def find_assignees(comment):
    """This function is used to extract the usernames present in the form 
    `@person1 @person2 ptal!` anywhere in a comment

    Args: 
        comment: string. Comment to extract usernames from

    Returns:
        result: list(string). List of github usernames
    """

    result = []

    # regex1 extracts all the strings of the form `@person1 @person2 ptal`
    # from each line of the comment
    # Refer: https://regex101.com/r/8nUKY0/2
    pattern_regex = r"(@[a-zA-Z0-9\-]+[\s\W]+)+[p|P][t|T][a|A][l|L]\s*"

    # regex2 extracts the github usernames from the strings resulted from 
    # above regex
    # Refer: https://regex101.com/r/8nUKY0/4
    username_regex = r"@([a-zA-Z\d](?:[a-zA-Z\d]|-(?=[a-zA-Z\d])){0,38})"

    lines = comment.splitlines()
    for line in lines:
        # In each line of the comment, find the required pattern.
        pattern_matches = re.finditer(pattern_regex, line)
        for _, pattern in enumerate(pattern_matches, start=1):
            # For each string matching the pattern, find usernames in it
            username_matches = re.finditer(username_regex, pattern.group())
            for _, username in enumerate(username_matches, start=1):
                # Append all the usernames found in the string
                print(username.group(1))
                result.append(username.group(1))

    return result


def build_payload(event):
    """This function is used to build payload that is sent to Github API

    Args: 
        event: dict. Event payload that is sent BY github when an event occurs

    Returns:
        payload: dict. Payload that is sent TO Github API
    """

    if not event['repository']:
        raise Exception('Repository not given in event payload.')

    if not event['issue']:
        raise Exception('Event is not an issue or a pull-request event.')

    if not event['issue']['user']:
        raise Exception('Event does not contain user information.')

    if not event['issue']['user']['login']:
        raise Exception('User payload is malformed.')
    
    assignee_names = find_assignees(event["comment"]["body"])
    payload = {
        "url": f"/repos/{event['repository']['owner']['login']}/" +
                f"{event['repository']['name']}/issues/" +
                f"{event['issue']['number']}/assignees",
        "body": {
            "assignees": assignee_names
        }
    }
    return payload


def main():
    """This is the main driver function."""

    try:
        # Github token used by github actions
        repo_token = os.environ['INPUT_REPO-TOKEN']
    except Exception:
        raise Exception('Repo-token not provided')
        return

    try:
        # Path to the file, where the event payload is stored
        event_path = os.environ['GITHUB_EVENT_PATH'];
    except Exception:
        raise Exception('Event path is not present.')
        return

    try:
        with open(event_path, encoding='utf-8') as json_file:
            # Event payload after parsing from 'json' to 'dict'
            event = json.load(json_file)

        payload = build_payload(event)
        
        if not payload['body']['assignees']:
            raise Exception('No assignee found')
            return

        headers = {
            'Authorization': 'token ' + repo_token,
            'Accept': 'application/vnd.github.v3+json;'
        }
        r = requests.post('https://api.github.com'+payload['url'], 
            headers=headers, data=json.dumps(payload['body']))

    except Exception as e:
        raise Exception(e)


if __name__ == "__main__":
    main()
