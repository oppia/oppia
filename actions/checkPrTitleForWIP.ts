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
      var repository = process.env.GITHUB_REPOSITORY;
      const repo = repository.split('/');
      //var repoName = github.context.payload.repository.name;
      var issueNumber = github.context.payload.pull_request.number;
      var body = "comment";
      octokit.issues.createComment({
        owner: repo[0],
        repo: repo[1],
        issue_number: issueNumber,
        body: body
      }).then(({ data, headers, status }) => {}).catch(err => {
        console.log("ERROR!!\n");
        console.log(err);
      });
      //console.log(userName);
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
