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

If you have an idea for something to do, first check if it's already been filed on the [issue tracker](https://github.com/oppia/oppia/issues). If so, add a comment to the issue saying you'd like to work on it, and we'll help you get started! Otherwise, please file a new issue.

Otherwise, you could try searching the issue tracker for something that looks interesting! High priority projects are tracked by [milestones](https://github.com/oppia/oppia/milestones), so we recommend you start there. The issues have been categorized according to the type of help needed:

  * [TODO: code](https://github.com/oppia/oppia/labels/TODO%3A%20code) means that the overall solution is known and is described in the issue, and the only thing left to do is code it. This issue is suitable for new developers.
  * [TODO: design (UI/Interaction)](https://github.com/oppia/oppia/labels/TODO%3A%20design%20%28UI%2Finteraction%29) means UI design help is needed. This could mean designing how a feature looks like. This issue is suitable for new designers.
  * [TODO: design (usability)](https://github.com/oppia/oppia/labels/TODO%3A%20design%20%28usability%29) means the design needs user testing. This issue is suitable for new usability testers.

The above issues are also [starter projects](https://github.com/oppia/oppia/labels/starter%20project). These projects are local to a small part of the codebase, and they tend to be easier, so they give you a chance to get your feet wet without having to understand the  entire codebase. If this is your first contribution, we suggest picking one of these issues to get you familiar with the contribution process.

When you get more experienced, consider tackling a issue that is more open-ended:

For tech issues:
  * [TODO: tech (instructions)](https://github.com/oppia/oppia/labels/TODO%3A%20tech%20%28instructions%29) means that the overall solution is generally known, but newcomers to the codebase may need additional instructions to be able to implement them. Adding instructions, for example where to make changes in the codebase will help move these issues to the `TODO: code` stage.
  * [TODO: tech (breakdown)](https://github.com/oppia/oppia/labels/TODO%3A%20tech%20%28breakdown%29) means that the approach is known, but needs to be broken down into single-person projects.
  * [TODO: tech (design doc)](https://github.com/oppia/oppia/labels/TODO%3A%20tech%20%28design%20doc%29) means that the problem is known, but the solution needs fleshing out. In that case, the best thing to do is to prepare a short doc outlining the solution approach and implementation plan, then discuss it on the issue thread before starting implementation.

For design issues:
  * [TODO: design (breakdown)](https://github.com/oppia/oppia/labels/TODO%3A%20design%20%breakdown%29) means the UX design is completed, but the issue needs to be broken down into single-person projects.
  * [TODO: design (UX)](https://github.com/oppia/oppia/labels/TODO%3A%20design%20%UX%29) means the way that the user interacts with this feature needs to be planned. The best way to approach this is to outline a user journey, and discuss it on the issue thread.

Issue triage:
  * [TODO: triage](https://github.com/oppia/oppia/labels/TODO%3A%20triage) means we aren't sure whether to work on this issue or not. It would be helpful to give comments on this issue in support or against implementing that feature, or mention if you encountered something similar.

If you can't find a suitable project on the milestones list, you can also look at the main issue tracker for something to work on.

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
  * In general, code should be formatted consistently with other code around it; we use Google's Python and JavaScript style guides as a reference.
    * If you use [Sublime Text](http://www.sublimetext.com/), you might also want to install the SublimeLinter, [SublimeLinter-jscs](https://github.com/SublimeLinter/SublimeLinter-jscs) and [SublimeLinter-pylint](https://github.com/SublimeLinter/SublimeLinter-pylint) plugins. Follow the instructions on the plugin pages for installation.
  * Please ensure that the code you write is well-tested.
  * Before making a commit, start up a local instance of Oppia and do some manual testing in order to check that you haven't broken anything! After that, ensure that the added code has no lint errors and pass all automated tests by running the presubmit script:

    ```
      bash scripts/run_presubmit_checks.sh
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
  * Once you've finished addressing everything, and would like the reviewer to take another look, please write a top-level comment explicitly asking them to do so.
  * At the end, the reviewer will merge the pull request.
6. **Tidy up!** Delete the feature branch from your both your local clone and the GitHub repository:

  ```
    git branch -D new-branch-name
    git push origin --delete new-branch-name
  ```

7. **Celebrate.** Congratulations, you have contributed to Oppia!

## Communication channels

### Mailing lists

Announcements: [oppia-announce](https://groups.google.com/forum/#!forum/oppia-announce) is for announcements of new releases or blog posts.

Development team mailing list: [oppia-dev](https://groups.google.com/forum/#!forum/oppia-dev) is the main mailing list for communication between developers, and for technical questions.

General: [oppia](https://groups.google.com/forum/#%21forum/oppia) is the general discussion list.

### GitHub teams

GitHub teams allow contributors working on similar areas of the Oppia codebase to to find and contact each other easily. These teams will be accessible via the GitHub alias @oppia/{{team-name}}. Mentioning a team in a issue or comment will notify all members in the team. During the issue triage process, issues will be assigned to a team, and members of the team are encouraged to comment on or take up the issue. If a contributor who is not part of the team is working on an issue, they will also be able to ask the team for guidance.

You can indicate which team(s) you want to join by filling in the form [here](http://goo.gl/forms/kXILyztnfS), or requesting to join/leaving teams on the [teams page](https://github.com/orgs/oppia/teams). You can join or leave a team at any time.

### Gitter chat room

We have a developer chat room [here](https://gitter.im/oppia/oppia-chat). Feel free to say hi, or ask any questions there.

## Instructions for multiple contributors working on a large feature

Please arrange with the maintainers to create a new branch (not `develop`) for this feature. The rest of the review process is as above, except that you'll be pushing commits to the new branch instead of `develop`. Once that branch is clean and ready to ship, it can be merged into `develop`.

*Note: This is experimental. The main concern here is that the process hinges on the maintainers responding quickly to pull requests. If that ends up being a bottleneck, we should look into other solutions, such as: (i) adding additional teams with write access, (ii) writing a special pre-commit hook, or (iii) having one of the collaborators on that feature 'own' the repo with the feature branch.*
