import github, os, json

def main():
    print("WORKS!!")
    gh = github.Github(os.getenv('GITHUB_TOKEN'))
    print(gh.get_user())
    event = json.load(open(os.getenv('GITHUB_EVENT_PATH')))
    print(event)
    if 'WIP' in event['pull_request']['title']:
        repo = gh.get_repo(event['repository']['full_name'])
        issue = repo.get_issue(event['pull_request']['number'])
        issue.create_comment('I have arrived!!')

if __name__ == '__main__':
    main()
