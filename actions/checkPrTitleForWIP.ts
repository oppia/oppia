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
      console.log(userName);
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
