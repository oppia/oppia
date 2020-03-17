const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  try {
    console.log(github.context);
    const octokit = new github.GitHub(process.env.GITHUB_TOKEN, {
      log: console
    });
    //console.log(github);
    var pullRequest = github.context.payload.pull_request;
    var pullRequestNumber = pullRequest.number;

    if (pullRequest.title.includes('WIP')) {
      var userName = pullRequest.user.login;
      var owner = github.context.payload.sender.login;
      var repoName = context.payload.repository.name;
      var issueNumber = context.payload.pull_request.number;
      var body = "comment hoja plz";
      octokit.issues.createComment({
        owner,
        repo: repoNumber,
        issue_number: issueNumber,
        body
      }).then(({ data, headers, status }) => {}).catch(err => {
        console.log(err);
      });
      console.log(userName);
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
