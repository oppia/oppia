const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  try {
    console.log(github.context);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
