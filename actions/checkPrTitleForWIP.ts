const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  try {
    //console.log(github.context);
    console.log(github);
    var context = github.context;
    var pullRequest = context.payload.pull_request;
    var pullRequestNumber = pullRequest.number;

    if (pullRequest.title.includes('WIP')) {
      var userName = pullRequest.user.login;
      var linkText = 'link';
      var linkA = linkText.link(
        'https://github.com/oppia/oppia/wiki/Setup-your-own-CircleCI-instance');
      var linkB = linkText.link(
        'https://github.com/oppia/oppia/wiki/Setup-your-own-Travis-instance');
      body=('Hi @' + userName + ' ' +
            'We typically do not want WIP PRs since each ' +
            'push will make the Travis queue unnecessarily ' +
            'long. If you need to run automated tests, ' +
            'please see our guides:' +
            'Please follow this ' + linkA + ' and ' + linkB + ' ' +
            'on how to set that up. Thanks!');
      console.log(body)
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
