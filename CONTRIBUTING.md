# Contributing code to Oppia

*These instructions are for developers who would like to contribute code to Oppia. If you'd prefer to help out with art, design or other things, please see our [general contribution guidelines](https://github.com/oppia/oppia/wiki/Contributing-to-Oppia).*

Thanks for your interest in contributing code to the Oppia project! This page explains how to get set up, how to find something to work on, and how to make a code change. If you run into any problems along the way, please file an issue on our [issue tracker](https://github.com/oppia/oppia/issues), or get help by posting to the [developers' mailing list](https://groups.google.com/forum/#!forum/oppia-dev). You might also want to look at the resources on the [developer wiki](https://github.com/oppia/oppia/wiki).

## Setting things up

  1. Create a new, empty folder called `opensource/` in your computer's home folder. Navigate to it (`cd opensource`), then [fork and clone](https://help.github.com/articles/fork-a-repo/) the Oppia repo so that it gets downloaded into `opensource/oppia`. Then follow the appropriate installation instructions ([Linux](https://github.com/oppia/oppia/wiki/Installing-Oppia-%28Linux%29), [Mac OS](https://github.com/oppia/oppia/wiki/Installing-Oppia-%28Mac-OS%29), [Windows](https://github.com/oppia/oppia/wiki/Installing-Oppia-%28Windows%29)).
  2. Update your GitHub notification settings:
    * Go to your settings page (click the Settings option under the profile menu in the top right), then go to 'Notification center' and ensure that everything's as you want it.
    * Go to the [Oppia repo](https://github.com/oppia/oppia), and click 'Watch' at the top right. Ensure that you're not 'ignoring' the repo, so that you'll be notified when someone replies to a conversation you're part of.
  3. Please sign the CLA so that we can accept your contributions. If you're contributing as an individual, use the [individual CLA](https://goo.gl/forms/AttNH80OV0). If your company owns the copyright to your contributions, a company representative should sign the [corporate CLA](https://goo.gl/forms/xDq9gK3Zcv).
  4. You may also want to set up [automatic auth](https://help.github.com/articles/set-up-git/#next-steps-authenticating-with-github-from-git) so you don't have to type in a username and password each time you commit a change.

## Finding something to do

If you already know what you'd like to work on, you can skip this section.

If you have an idea for something to do, first check if it's already been filed on the [issue tracker](https://github.com/oppia/oppia/issues). If so, add a comment to the issue saying you'd like to work on it, and we'll help you get started! Otherwise, please file a new issue and assign yourself to it.

Otherwise, you could try searching the issue tracker for something that looks interesting! The issues have been categorized according to the type of help needed:

  * [TODO: code](https://github.com/oppia/oppia/labels/TODO%3A%20code) means that the overall solution is known, and the only thing left to do is code it.
  * [TODO: design doc](https://github.com/oppia/oppia/labels/TODO%3A%20design%20doc) means that the problem is known, but the solution needs fleshing out. In that case, the best thing to do is to prepare a short doc outlining the solution approach and implementation plan, then circulate it to the [dev team](https://groups.google.com/forum/#!forum/oppia-dev) for feedback before starting implementation.
  * [TODO: investigation](https://github.com/oppia/oppia/labels/TODO%3A%20investigation) means that the problem is known, but no one has a clue why it's happening. This is generally a detective puzzle: any information you can add to the thread that helps us get closer to the root of the problem would be very helpful!

If this is your first contribution, we additionally suggest picking a [starter project](https://github.com/oppia/oppia/labels/starter%20project). These projects are local to a small part of the codebase, and they tend to be easier, so they give you a chance to get your feet wet without having to understand the entire codebase.

Another great way to start contributing is by writing tests -- we have pretty good backend test coverage, but our frontend and integration coverage is spotty. Tests are really important because they help prevent developers from accidentally breaking existing code, allowing them to build cool things faster. If you're interested in helping out, let the development team know by posting to the [developers' mailing list](https://groups.google.com/forum/#!forum/oppia-dev), and we'll help you get started.

## Instructions for making a code change

*If your change isn't trivial, please [talk to us](https://groups.google.com/forum/#!forum/oppia-dev) before you start working on it -- this helps avoid duplication of effort, and allows us to offer advice and suggestions. For larger changes, it may be better to first create a short design doc outlining a suggested implementation plan, and send it to the dev team for feedback.*

The central development branch is `develop`, which should be clean and ready for release at any time. In general, all changes should be done as feature branches based off of `develop`. (In case you're interested, we mainly use the [Gitflow workflow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow), which also incorporates `master`, `hotfix-` and `release-` branches -- but you don't need to worry about these.)

Here's how to make a one-off code change. (If you're working on a larger feature, see the instructions at the end.)

1. **Choose a descriptive branch name.** It should be lowercase, hyphen-separated, and a noun describing the change (so, `fuzzy-rules`, but not `implement-fuzzy-rules`). Also, it shouldn't start with `hotfix` or `release`.
2. **Create a new branch with this name, starting from 'develop'.** In other words, run:

  ```
    git fetch upstream
    git checkout develop
    git merge upstream/develop
    git checkout -b your-branch-name
  ```

3. **Make a commit to your feature branch.** Each commit should be self-contained and have a descriptive commit message that helps other developers understand why the changes were made. 
  * You can refer to relevant issues in the commit message by writing, e.g., "#105".
  * For consistency, please conform to the [Python](http://google-styleguide.googlecode.com/svn/trunk/pyguide.html) and [JavaScript](https://google-styleguide.googlecode.com/svn/trunk/javascriptguide.xml) style guides. In addition, code should be formatted consistently with other code around it. Where these two guidelines differ, prefer the latter.
  * Please ensure that the code you write is well-tested.
  * Before making a commit, start up a local instance of Oppia and do some manual testing in order to check that you haven't broken anything! Also, ensure that all automated tests still pass:

    ```
      bash scripts/test.sh
      bash scripts/run_js_tests.sh
      bash scripts/run_integration_tests.sh (if necessary)
    ```

  * To actually make the commit and push it to your GitHub fork, run:

    ```
      git commit -a -m "{{YOUR COMMIT MESSAGE HERE}}"
      git push origin {{YOUR BRANCH NAME}}
    ```

4. **When your feature is ready to merge, create a pull request.**
  * Go to your fork on GitHub, select your branch from the dropdown menu, and click "pull request". Ensure that the 'base' repository is the main oppia repo and that the 'base' branch is 'develop'.
  * Add a descriptive comment explaining the purpose of the branch (e.g. "Add a warning when the user leaves a page in the middle of an exploration."). This will tell the reviewer what the purpose of the branch is.
  * Click "Create pull request". An admin will assign a reviewer to your commit.
5. **Address review comments until all reviewers give LGTM ('looks good to me').**
  * When your reviewer has reviewed the code, you'll get an email. You'll need to respond in two ways:
     * Make a new commit addressing the comments you agree with, and push it to the same branch. Ideally, the commit message would explain what the commit does (e.g. "Fix lint error"), but if there are lots of disparate review comments, it's fine to refer to the original commit message and add something like "(address review comments)".
     * In addition, please reply to each comment. Each reply should be either "Done" or a response explaining why the corresponding suggestion wasn't implemented. All comments must be resolved before LGTM can be given.
  * Resolve any merge conflicts that arise. To resolve conflicts between 'new-branch-name' (in your fork) and 'develop' (in the oppia repository), run:

  ```
    git checkout new-branch-name
    git fetch upstream
    git merge upstream/develop
    ...[fix the conflicts]...
    ...[make sure the tests pass before committing]...
    git commit -a
    git push origin new-branch-name
  ```

  * At the end, the reviewer will merge the pull request.
6. **Tidy up!** Delete the feature branch from your both your local clone and the GitHub repository:

  ```
    git branch -D new-branch-name
    git push origin --delete new-branch-name
  ```

7. **Celebrate.** Congratulations, you have contributed to Oppia!


## Instructions for multiple contributors working on a large feature

Please arrange with the maintainers to create a new branch (not `develop`) for this feature. The rest of the review process is as above, except that you'll be pushing commits to the new branch instead of `develop`. Once that branch is clean and ready to ship, it can be merged into `develop`.

*Note: This is experimental. The main concern here is that the process hinges on the maintainers responding quickly to pull requests. If that ends up being a bottleneck, we should look into other solutions, such as: (i) adding additional teams with write access, (ii) writing a special pre-commit hook, or (iii) having one of the collaborators on that feature 'own' the repo with the feature branch.*
