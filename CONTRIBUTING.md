# Contributing code to Oppia

*These instructions are for developers and designers who would like to contribute code to Oppia. If you'd prefer to help out with other things, please see our [general contribution guidelines](https://github.com/oppia/oppia/wiki/Contributing-to-Oppia).*

Thanks for your interest in contributing code or design help to the Oppia project! This page explains how to get set up, how to find something to work on, and how to make a code change. If you run into any problems along the way, please file an issue on our [issue tracker](https://github.com/oppia/oppia/issues), or get help by posting to the [developers' mailing list](https://groups.google.com/forum/#!forum/oppia-dev). You might also want to look at the resources on the [developer wiki](https://github.com/oppia/oppia/wiki).

## Setting things up

  1. Please sign the CLA so that we can accept your contributions. If you're contributing as an individual, use the [individual CLA](https://goo.gl/forms/AttNH80OV0). If your company owns the copyright to your contributions, a company representative should sign the [corporate CLA](https://goo.gl/forms/xDq9gK3Zcv).
  2. Fill in the [Oppia contributor survey](http://goo.gl/forms/wz1x3bFfpF) to let us know what your interests are. (You can always change your responses later.)  
  3. Join the [oppia-dev@](https://groups.google.com/forum/#!forum/oppia-dev) mailing list, and say hi on the [gitter](https://gitter.im/oppia/oppia-chat) chat channel!  
  4. While you're waiting for a reply, create a new, empty folder called `opensource/` in your computer's home folder. Navigate to it (`cd opensource`), then [fork and clone](https://help.github.com/articles/fork-a-repo/) the Oppia repo so that it gets downloaded into `opensource/oppia`. Then follow the appropriate installation instructions ([Linux](https://github.com/oppia/oppia/wiki/Installing-Oppia-%28Linux%29), [Mac OS](https://github.com/oppia/oppia/wiki/Installing-Oppia-%28Mac-OS%29), [Windows](https://github.com/oppia/oppia/wiki/Installing-Oppia-%28Windows%29)).
  5. Update your GitHub notification settings:
    * Go to your settings page (click the Settings option under the profile menu in the top right), then go to 'Notification center' and ensure that everything's as you want it.
    * Go to the [Oppia repo](https://github.com/oppia/oppia), and click 'Watch' at the top right. Ensure that you're not 'ignoring' the repo, so that you'll be notified when someone replies to a conversation you're part of.
  6. (Optional) You may also want to set up [automatic auth](https://help.github.com/articles/set-up-git/#next-steps-authenticating-with-github-from-git) so you don't have to type in a username and password each time you commit a change.

## Getting in touch with the team

The primary chat channel that the team uses is [Gitter](https://gitter.im/oppia/oppia-chat). Feel free to hang out there! (You might also consider 'pinning' the tab in your browser, so that it's easily accessible.)

We have also recently started offering office hours for new contributors on Gitter, where you can get your questions answered! You can find the schedule on the [wiki homepage](https://github.com/oppia/oppia/wiki). We also maintain a list of [Frequently Asked Questions](https://github.com/oppia/oppia/wiki/Frequently-Asked-Questions).

## Finding something to do

If you have an idea for something to do, first check if it's already on the [issue tracker](https://github.com/oppia/oppia/issues). If so, add a comment to the issue saying you'd like to work on it, and we'll help you get started! Otherwise, please file a new issue, and say you'd like to work on it.

If you don't have an idea for something to do, try searching the issue tracker for something that looks interesting! High-priority issues are tracked by [milestones](https://github.com/oppia/oppia/milestones), so we recommend starting there, but feel free to take on any of the others as well. Each issue is tagged based on which part of the site it affects, and also categorized based on the type of help needed. If this is your first contribution, we recommend picking one of the following types of issues:

  * **[TODO: code](https://github.com/oppia/oppia/labels/TODO%3A%20code)** means that the issue is suitable for new developers: the overall solution is known and is described in the issue, and the only thing left to do is code it.
  * **[TODO: design (UI/Interaction)](https://github.com/oppia/oppia/labels/TODO%3A%20design%20%28UI%2Finteraction%29)** means that the issue is suitable for new UI designers, interaction designers, artists and writers. In general, it means that UI design help is needed, and the deliverable would usually be a mockup, drawing, prototype or text that conveys what the feature should look like. 
  * **[TODO: design (usability)](https://github.com/oppia/oppia/labels/TODO%3A%20design%20%28usability%29)** means that the  issue is suitable for new usability testers. In general, it means that we have one (or more) ideas or designs for a project, and usability testing/research is needed to find out which one to go with. 

These issues, also tagged as 'starter projects', are usually local to a small part of the codebase. They tend to be easier, so they give you a chance to get your feet wet without having to understand the entire codebase. If you'd like some help finding an issue to work on, please don't hesitate to reach out to us at the [developers' mailing list](https://groups.google.com/forum/#!forum/oppia-dev) or the [Gitter chat room](https://gitter.im/oppia/oppia-chat)! Also, if the issue you're working on has a grey label of the form "team-name (@team-lead)", please feel free to reach out to that team lead for help or advice on that issue -- they should be able to answer questions about that area of the codebase.

For reference, here are descriptions of what the other 'TODO' tags mean:
  * **[TODO: tech (instructions)](https://github.com/oppia/oppia/labels/TODO%3A%20tech%20%28instructions%29)** means that the overall solution is generally known, but newcomers to the codebase may need additional instructions to be able to implement them. Adding instructions, such as where to make the necessary changes, will help move these issues to the `TODO: code` stage.
  * **[TODO: tech (breakdown)](https://github.com/oppia/oppia/labels/TODO%3A%20tech%20%28breakdown%29)** means that the approach is known, but needs to be broken down into single-person projects.
  * **[TODO: tech (design doc)](https://github.com/oppia/oppia/labels/TODO%3A%20tech%20%28design%20doc%29)** means that the problem is known, but the solution needs fleshing out. In that case, the best thing to do is to prepare a short doc outlining the solution approach and implementation plan, add a link to it on the issue thread, then discuss it before starting implementation.
  * **[TODO: design (breakdown)](https://github.com/oppia/oppia/labels/TODO%3A%20design%20%28breakdown%29)** means the UX design is completed, but the issue needs to be broken down into single-person projects.
  * **[TODO: design (UX)](https://github.com/oppia/oppia/labels/TODO%3A%20design%20%28UX%29)** means the way that the user interacts with this feature needs to be planned. The best way to approach this is to outline the core user journeys (probably using slides), and discuss them on the issue thread, so that the feature can move forward.
  * **[TODO: triage](https://github.com/oppia/oppia/labels/TODO%3A%20triage)** means we aren't sure whether to work on this issue or not. It would be helpful to give comments on this issue in support of or against implementing that feature, or mention if you encountered something similar.

## Instructions for making a code change

**Working on your first Pull Request?** You can learn how from this free series: [How to Contribute to an Open Source Project on GitHub](https://egghead.io/series/how-to-contribute-to-an-open-source-project-on-github).

*If your change isn't trivial, please [talk to us](https://gitter.im/oppia/oppia-chat) before you start working on it -- this helps avoid duplication of effort, and allows us to offer advice and suggestions. For larger changes, it may be better to first create a short doc outlining a suggested implementation plan, and send it to the dev team for feedback.*

Our central development branch is `develop`, which should be clean and ready for release at any time. In general, all changes should be done as feature branches based off of `develop`. (In case you're interested, we mainly use the [Gitflow workflow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow), which also incorporates `master`, `hotfix-` and `release-` branches -- but you don't need to worry about these.)

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
  * You can refer to relevant issues in the commit message by writing, e.g., "Fixes #105".
  * Please read [these style rules](https://github.com/oppia/oppia/wiki/Coding-style-guide) and ensure that your code follows them. If you use [Sublime Text](http://www.sublimetext.com/), consider installing the SublimeLinter, [SublimeLinter-jscs](https://github.com/SublimeLinter/SublimeLinter-jscs) and [SublimeLinter-pylint](https://github.com/SublimeLinter/SublimeLinter-pylint) plugins, following the instructions on their respective pages.
  * Please ensure that the code you write is well-tested.
  * Before making the commit, start up a local instance of Oppia and do some manual testing in order to check that you haven't broken anything! After that, ensure that the added code has no lint errors and passes all automated tests by running the presubmit script:

    ```
      bash scripts/run_presubmit_checks.sh
    ```

  * To actually make the commit and push it to your GitHub fork, run:

    ```
      git commit -a -m "{{YOUR COMMIT MESSAGE HERE}}"
      git push origin {{YOUR BRANCH NAME}}
    ```

    

    Before your code gets uploaded to GitHub, a script is automatically executed that checks the styling of all changed JavaScript and Python files and runs the front-end tests. Run the push command in command line, and not GitHub's Desktop client, as the script needs access to other tools like pip.
    
     **If any of the tests fail, the push will be interrupted**. If this happens, fix the issues that the tests tell you about and **repeat the instructions above** ('commit' and then 'push').
     
    If you need some help with your code and therefore want to put non functioning code into your GitHub fork to show it to other developers, you  can force a push with `git push origin {{YOUR BRANCH NAME}} --no-verify`.

4. **When your feature is ready to merge, create a pull request.**
  * Go to your fork on GitHub, select your branch from the dropdown menu, and click "pull request". Ensure that the 'base' repository is the main oppia repo and that the 'base' branch is 'develop'.
  * Add a descriptive title explaining the purpose of the PR (e.g. "Fix #bugnum: add a warning when the user leaves a page in the middle of an exploration."). The "Fix #bugnum: " prefix **must** be included if this PR resolves an issue on the issue tracker.
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
  * Once you've finished addressing everything, and would like the reviewer to take another look, **please write a top-level comment explicitly asking them to do so**.
  * At the end, the reviewer will merge the pull request.
6. **Tidy up!** Delete the feature branch from your both your local clone and the GitHub repository:

  ```
    git branch -D new-branch-name
    git push origin --delete new-branch-name
  ```

7. **Celebrate.** Congratulations, you have contributed to Oppia!

### Notes

We do not use author tags in files, since they tend to be inaccurate or become stale when the author is no longer a regular contributor. However, you can still find the author of a particular change in a file by running the command:

```
git blame file-name
```
The output will show the latest commit SHA, author, date, and time of commit for each line.

To confine the search of an author between particular lines in a file, you can use:

```
git blame -L 40,60 file-name
```
The output will then show lines 40 to 60 of the particular file.

For more `git blame` options, you can visit the [git blame documentation](https://git-scm.com/docs/git-blame).

## Communication channels

### Mailing lists

We have several mailing lists in the form of Google Groups that you can join:
  * [oppia-announce](https://groups.google.com/forum/#!forum/oppia-announce) is for announcements of new releases or blog posts.
  * [oppia-dev](https://groups.google.com/forum/#!forum/oppia-dev) is the main mailing list for communication between developers, and for technical questions.

We also have a developer chat room [here](https://gitter.im/oppia/oppia-chat). Feel free to drop in and say hi!

### GitHub teams

GitHub teams allow contributors working on similar areas of the Oppia codebase to to find and contact each other easily. These teams will be accessible via the GitHub alias @oppia/{{team-name}}. Mentioning a team in a issue or comment will notify all members in the team. During the issue triage process, issues will be assigned to a team, and members of the team are encouraged to comment on or take up the issue. If a contributor who is not part of the team is working on an issue, they will also be able to ask the team for guidance.

You can indicate which team(s) you want to join by filling in the form [here](http://goo.gl/forms/kXILyztnfS), or requesting to join/leave teams on the [teams page](https://github.com/orgs/oppia/teams). You can join or leave a team at any time.

### Design docs and planning

Design documents and meeting minutes are in our [Google Drive folder](https://drive.google.com/open?id=0B8ADASwHtwE9UFlLSFdlMkt2Y2c). 
