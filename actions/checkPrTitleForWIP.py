import github, os

def main():
    print("WORKS!!")
    gh = github.Github(os.getenv('GITHUB_TOKEN'))
    print(github.context)

if __name__ == '__main__':
    main()
