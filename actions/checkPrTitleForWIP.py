import github

def main():
    print("WORKS!!")
    print(github)
    gh = Github(os.getenv('GITHUB_TOKEN'))

if __name__ == '__main__':
    main()
