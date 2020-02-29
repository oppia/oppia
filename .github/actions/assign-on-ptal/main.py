import os
import requests
import json
import re

def findAssignees (comment):
    """
    This function is used to extract the usernames present in the form 
    `@person1 @person2 ptal!` anywhere in a comment

    Args: 
        comment - Input multiline string

    Returns:
        result - Array of string (list of github usernames)

    """
    result = []

    # regex1 extracts all the strings of the form `@person1 @person2 ptal`
    #  from each line of the comment
    # Refer: https://regex101.com/r/8nUKY0/2
    regex1 = r"(@[a-zA-Z0-9\-]+[\s\W]+)+[p|P][t|T][a|A][l|L]\s*"

    # regex2 extracts the github usernames from the strings resulted from 
    #  above regex
    # Refer: https://regex101.com/r/8nUKY0/4
    regex2 = r"@([a-zA-Z\d](?:[a-zA-Z\d]|-(?=[a-zA-Z\d])){0,38})"

    lines = comment.splitlines()
    for str in lines:
        # In each line of the comment, find the required pattern.
        res1 = re.finditer(regex1, str)
        for matchNum, match1 in enumerate(res1, start=1):
            # For each string matching the pattern, find usernames in it
            res2 = re.finditer(regex2, match1.group())
            for matchNum, match2 in enumerate(res2, start=1):
                # Append all the usernames found in the string
                print (match2.group(1))
                result.append(match2.group(1))

    return result


def buildPayload (event):
    """
    This function is used to build payload that is sent to Github API

    Args: 
        event - Event payload that is sent BY github when an event occurs

    Returns:
        payload - Payload that is sent TO Github API

    """
    if not event['repository']:
        raise Exception('Repository not given in event payload.')

    if not event['issue']:
        raise Exception('Event is not an issue or a pull-request event.')

    if not event['issue']['user']:
        raise Exception('Event does not contain user information.')

    if not event['issue']['user']['login']:
        raise Exception('User payload is malformed.')
    
    assigneeNames = findAssignees (event["comment"]["body"])
    payload = {
        "url": f"/repos/{event['repository']['owner']['login']}/{event['repository']['name']}/issues/{event['issue']['number']}/assignees",
        "body": {
            "assignees": assigneeNames
        }
    }
    return payload


def main():
    """
    This is the main driver function. 

    Variables:
        repoToken - github token used by github actions
        eventpath - path to the file, where the event payload is stored
        event - event payload after parsing from 'json' to 'dict'

    """
    try:
        repoToken = os.environ['INPUT_REPO-TOKEN']
    except Exception:
        print ('Repo-token not provided')
        return

    try:
        eventPath = os.environ['GITHUB_EVENT_PATH'];
    except Exception:
        print ('Event path is not present.')
        return

    try:
        with open(eventPath, encoding='utf-8') as json_file:
            event = json.load(json_file)

        payload = buildPayload(event)
        
        if not payload['body']['assignees']:
            print ('No assignee found')
            return

        headers = {
            'Authorization': 'token ' + repoToken,
            'Accept': 'application/vnd.github.v3+json;'
        }
        r = requests.post('https://api.github.com'+payload['url'], 
            headers=headers, data=json.dumps(payload['body']))

    except Exception as e:
        print (e)


if __name__ == "__main__":
    main()
