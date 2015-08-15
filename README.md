# Oppia
Oppia is an online learning tool that enables anyone to easily create and share interactive activities. These activities, called 'explorations', simulate a one-on-one conversation with an intelligent tutor. You can try a hosted version at [Oppia.org](https://www.oppia.org), or read more at our [GitHub page](http://oppia.github.io/).

## Installation
Please refer to https://code.google.com/p/oppia/wiki/GettingStarted for extensive installation instructions. Here is just a short summary for developers who would like to contribute:

1. First, fork and clone the Oppia repo. We suggest you make a directory called opensource/ within your home folder (mkdir opensource). Then do

  ```
    cd opensource/
  ```

  and follow the instructions on Github's [Fork a Repo page](https://help.github.com/articles/fork-a-repo/) to clone the repo to that directory. This should create a new folder named `oppia`.

2. Navigate to `oppia/` and install Oppia by running

  ```
    bash scripts/start.sh
  ```

3. To test the installation, navigate to `oppia/` and run

  ```
    bash scripts/test.sh
    bash scripts/run_js_tests.sh
  ```

# Contributing

## Setting things up

First, make a local clone of the repository on your computer by following the installation instructions above.

Next, update your GitHub notification settings:

1. Go to your settings page (click the Settings option under the profile menu in the top right), then go to 'Notification center' and ensure that everything's as you want it.
2. Go to the repository page, and click 'Watch' at the top right. Ensure that your notification status is not set to "Ignoring", so that you at least get notified when someone replies to a conversation you're part of. Note that you won't get emails for comments that you make on issues.

Next, please sign the CLA so that we can accept your contributions. If you're an individual, use the [individual CLA](https://goo.gl/forms/AttNH80OV0). If your company would own the copyright to your contributions, a representative from the company should sign the [corporate CLA](https://goo.gl/forms/xDq9gK3Zcv).

You may also want to set up [automatic auth](https://help.github.com/articles/set-up-git/#next-steps-authenticating-with-github-from-git) so you don't have to type in a username and password each time.

## Instructions for code contributors

Oppia development is mainly done via the [Gitflow workflow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow), which defines a few special types of branches:

* develop: this is the central branch for development, which should be clean and ready for release at any time
* master: this is the branch that the production server at [Oppia.org](https://www.oppia.org) is synced to
* "hotfix"-prefixed branches: these are used for hotfixes to master that can't wait until the next release
* "release"-prefixed branches: these are used for testing and QA of new releases

Please don't commit directly to these branches! We want to ensure that the main develop branch is always clean, since it's used as the base branch by all contributors. Instead, you should create a new feature branch off of **develop**, and make changes there.

Here are full instructions for how to make a code change:

1. **Choose a descriptive name for your branch.** Branch names should be lowercase and hyphen-separated. They should also be nouns describing the change. So, 'fuzzy-rules' is fine, but not 'implement-fuzzy-rules'. In addition:
  * Branch names should not start with 'hotfix' or 'release'.
  * Branch names should only begin with 'experiment-' if they represent an experimental change that may not be merged into develop. For consistency, please use 'experiment-' and not 'experimental-'.
2. **Starting from 'develop', create a new branch with this name.**
  * Run:
    ```
        git fetch upstream
        git checkout develop
        git merge upstream/develop
        git checkout -b your-branch-name
    ```
3. **Make a commit to your feature branch.** Each commit should be self-contained, and should have a descriptive commit message that helps other developers understand why the changes were made.
  * Before making a commit, ensure that all tests still pass, by running:
    ```
        bash scripts/test.sh
        bash scripts/run_js_tests.sh
        bash scripts/run_integration_tests.sh (if necessary)
    ```
  * To actually make the commit and push it to your fork on GitHub, run:
    ```
        git commit -a -m "{{YOUR COMMIT MESSAGE HERE}}"
        git push origin {{YOUR BRANCH NAME}}
    ```
4. **When your feature is ready to merge, create a pull request.** A pull request is like a regular GitHub issue, that has a series of commits attached to it.
  * Go to the GitHub page for your fork, and select your branch from the dropdown menu.
  * Click "pull request". Ensure that the 'base' repository is the main oppia repo and that the 'base' branch is 'develop'. Also ensure that the 'combine' fork and branch correspond to your fork and the branch you've been working on.
  * Add a descriptive comment explaining the purpose of the branch (e.g. "Add a warning when the user leaves a page in the middle of an exploration."). This will be the first message in the review conversation, and it will tell the reviewer what the purpose of the branch is.
  * Click "Create pull request". (This will notify anyone who's watching the repository.)
  * An admin should notice the new pull request, and will assign a reviewer to your commit.
5. **Address review comments until all reviewers give LGTM ('looks good to me').**
  * When your reviewer has reviewed the code, you'll get an email from them. You'll need to respond in two ways:
     * Make a new commit addressing the comments, and push it to the same branch.
     * In addition, reply to each of the reviewer's comments. If a change is requested, you can just reply "Done" once you've fixed it -- otherwise, explain why you think it should not be fixed. All comments should be resolved before an LGTM can be given.
  * If any merge conflicts arise, you'll need to resolve them. To resolve merge issues between 'new-branch-name' (in your fork) and 'develop' (in the main oppia repository), run:
  ```
    git checkout new-branch-name
    git fetch upstream
    git merge upstream/develop
    ...[fix the conflicts]...
    ...[make sure the tests pass before committing]...
    git commit -a
    git push origin new-branch-name
  ```
  * At the end, the reviewer should merge the pull request.
6. **Tidy up!** Delete the feature branch from your local clone and from the GitHub repository:
  ```
    git branch -D new-branch-name
    git push origin --delete new-branch-name
  ```
7. **Celebrate.** Congratulations, you have contributed to Oppia!
