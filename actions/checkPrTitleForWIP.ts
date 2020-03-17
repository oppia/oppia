const core = require('@actions/core');
const github = require('@actions/github');
const { request } = require("@octokit/request");


async function run() {
  try {
    console.log(github.context);
    var pullRequest = github.context.payload.pull_request;
    var pullRequestNumber = pullRequest.number;

    if (pullRequest.title.includes('WIP')) {
      
      var body = "comment hoja plz";
      await request(
        `POST /repos/:owner/:repo/issues/:issue_number/comments`
        {
          body: `Me too`
        }
      );
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
