# How to contribute code to Oppia

## Setting things up

First, make a local clone of the repository on your computer by following the installation instructions above.

Next, update your GitHub notification settings:

1. Go to your settings page (click the Settings option under the profile menu in the top right), then go to 'Notification center' and ensure that everything's as you want it.
2. Go to the repository page, and click 'Watch' at the top right. Ensure that your notification status is not set to "Ignoring", so that you at least get notified when someone replies to a conversation you're part of. Note that you won't get emails for comments that you make on issues.

Next, please sign the CLA so that we can accept your contributions. If you're contributing as an individual, use the [individual CLA](https://goo.gl/forms/AttNH80OV0). If your company would own the copyright to your contributions, a representative from the company should sign the [corporate CLA](https://goo.gl/forms/xDq9gK3Zcv).

You may also want to set up [automatic auth](https://help.github.com/articles/set-up-git/#next-steps-authenticating-with-github-from-git) so you don't have to type in a username and password each time.

## Instructions for code contributors

Oppia development is mainly done via the [Gitflow workflow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow), which defines a few special types of branches:

* develop: this is the central branch for development, which should be clean and ready for release at any time
* master: this is the branch that the production server at [Oppia.org](https://www.oppia.org) is synced to
* "hotfix"-prefixed branches: these are used for hotfixes to master that can't wait until the next release
* "release"-prefixed branches: these are used for testing and QA of new releases

Please don't commit directly to these branches! We want to ensure that the main develop branch is always clean, since it's used as the base branch by all contributors. Instead, you should create a new feature branch off of **develop**, and make changes there.

Here are full instructions for how to make a one-off code change. (If you're working on a larger feature, see the instructions at the end.)

1. **Choose a descriptive name for your branch.** Branch names should be lowercase and hyphen-separated. They should also be nouns describing the change. So, 'fuzzy-rules' is fine, but not 'implement-fuzzy-rules'. In addition:
  * Branch names should not start with 'hotfix' or 'release'.
  * Branch names should only begin with 'experiment-' if they represent an experimental change that may not be merged into develop. For consistency, please use 'experiment-' and not 'experimental-'.
2. **Starting from 'develop', create a new branch with the name you picked.** To do this, run:

  ```
    git fetch upstream
    git checkout develop
    git merge upstream/develop
    git checkout -b your-branch-name
  ```

3. **Make a commit to your feature branch.** Each commit should be self-contained, and should have a descriptive commit message that helps other developers understand why the changes were made. You can also refer to any relevant issues, e.g. write "#105" to refer to issue 105. GitHub will auto-generate a link.
  * For consistency, please try to conform to the following style guides: [Python](http://google-styleguide.googlecode.com/svn/trunk/pyguide.html) and [Javascript](https://google-styleguide.googlecode.com/svn/trunk/javascriptguide.xml) style guides. In addition, code should be formatted in a way that is consistent with other code surrounding it. Where these two guidelines differ, prefer the latter.
  * Please ensure that the code you write is well-tested.
  * Before making a commit, start up a local instance of Oppia and do some manual testing in order to check that your code doesn't break things! Also, ensure that all automated tests still pass, by running:

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
     * Make a new commit addressing the comments you agree with, and push it to the same branch. Ideally, the commit message would explain what the commit does (e.g. "Fix lint error"), but if there are a lot of disparate review comments, it's fine to refer to the original commit message and add something like "(address review comments)".
     * In addition, please reply to each of the reviewer's comments. Each comment should be either "Done" or a response explaining why the corresponding suggestion wasn't implemented. All comments must be resolved before an LGTM can be given.
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


## Instructions for contributors working on a large feature that involves more than one person

Please arrange with the maintainers to create a new branch (that's not "develop") for this feature. The rest of the review process is as above, except that you'll be pushing commits to the new branch instead of "develop". Once that branch is clean and ready to ship, it can be merged into "develop".

(This is experimental. The main concern here is that the process hinges on the maintainers responding quickly to pull requests. If that ends up being an issue, we should look into other solutions, such as: (i) adding additional teams with write access, (ii) writing a special pre-commit hook, or (iii) having one of the collaborators on that feature 'own' the repo with the feature branch.)


## Git command reference

This section outlines some basic git commands for developers new to Git.

1. After making a local clone of Oppia, you can make code changes in your local directory, under oppia/ . These changes will be tracked by Git. At any time, you can check what git thinks has been changed using:
  
  ```
     $ git status
  ```

  Note that new files will need to be explicitly 'git add'ed.

  You can also view diffs of your changes by typing:

  ```
     $ git diff
  ```

2. To sync your local code with the latest updates from the GitHub repo, run:

  ```
     $ git pull
  ```

3. To commit a change to your local Git repository, with the commit message "Add a new graphical editor", run:

  ```
     $ git commit -a -m "Add a new graphical editor."
  ```

4. To download a branch someone else created:

  ```
     $ git checkout -b {{repo-name-then-branch-name}} {{branch-name}}
     $ git pull https://github.com/{{repo-name}}/{{branch-name}}.git {{branch-name}}
  ```

5. To patch a specific commit onto a different branch:

  ```
     $ git checkout {{branch-to-patch-from}}
     $ git format-patch -1   # goes back one commit
  ```
  
  This should create a file with the extension .patch. The name should include part of the commit message from the change it is patching. You may need to move this file to somewhere where it won't disappear when you switch branches.

  ```
     $ git checkout {{branch-to-patch-to}}
     $ git apply {{patch-file-name}}
  ```

6. If you have a bunch of small unreviewed commits, you might want to squash them into a single large commit before they are reviewed. To squash the last three commits, do

  ```
    git reset --soft HEAD~3 &&
    git commit -m "{{YOUR_COMMIT_MESSAGE_HERE}}"
  ```

  Be careful to only squash "local" commits -- never squash anything that has been uploaded to the codesite before (no matter what branch). In particular, don't squash commits that already have code review comments on them. Also, don't squash any commit that merged two branches.

  If you want to squash commits that you previously pushed to GitHub, make a new local branch that includes the small commits, squash the commits locally, and push the new branch instead.
