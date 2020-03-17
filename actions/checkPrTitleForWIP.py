import github, os, json

def main():
    print("WORKS!!")
    gh = github.Github(os.getenv('GITHUB_TOKEN'))
    print(gh.get_user())
    event = json.load(open(os.getenv('GITHUB_EVENT_PATH')))
    print(event)
    if 'WIP' in event['pull_request']['title']:
        print("FUCK YAEH, GOT WIP!!!!! fuck you node :D")


if __name__ == '__main__':
    main()
