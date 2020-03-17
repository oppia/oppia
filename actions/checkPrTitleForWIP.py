import github, os

def main():
    print("WORKS!!")
    gh = github.Github(os.getenv('GITHUB_TOKEN'))
    print(gh.get_user())
    print(gh)

if __name__ == '__main__':
    main()
