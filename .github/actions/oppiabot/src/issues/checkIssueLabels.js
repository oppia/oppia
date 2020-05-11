const core = require('@actions/core');
const { context, GitHub } = require('@actions/github');
const whitelist = require('../whitelist.json');
const GOOD_FIRST_LABEL = 'good first issue';
const prLabels = ['dependencies', 'critical', 'stale'];

const checkLabels = async () => {
  core.info(`Checking newly added label...`);
  const token = core.getInput('repo-token');
  const label = context.payload.label;
  const octokit = new GitHub(token);
  const user = context.payload.sender.login

  if (label.name === GOOD_FIRST_LABEL &&
      !whitelist.goodFirstIssue.includes(user)) {
    core.info(`Good first issue label got added by non whitelisted user.`);
    await handleGoodFirstIssue(octokit, user);
  } else if(prLabels.includes(label.name) || label.name.startsWith('PR')) {
    core.info('PR label got added on an issue');
    await handlePRLabel(octokit, label.name, user);
  }
};

/**
 * Handles cases when a good first issue gets added by a non whitelisted user.
 *
 * @param {import('@actions/github').GitHub} octokit
 * @param {String} user - Username of the user that added the label.
 */
const handleGoodFirstIssue = async (octokit, user) => {
  const issueNumber = context.payload.issue.number;
  // Comment on the issue and ping the onboarding team lead.
  await octokit.issues.createComment(
    {
      body:'Hi @' + user + ', thanks for proposing this as a good first ' +
          'issue. Looping in @' + whitelist.teamLeads.onboardingTeam  +
          ' to confirm, removing the label until he does so.',
      issue_number: issueNumber,
      owner: context.repo.owner,
      repo: context.repo.repo,
    }
  );
  // Remove the label.
  core.info(`Removing the label.`);
  await octokit.issues.removeLabel({
    issue_number:issueNumber,
    name: GOOD_FIRST_LABEL,
    owner: context.repo.owner,
    repo: context.repo.repo
  })
};

/**
 * Handles cases when a PR label gets added to an issue.
 *
 * @param {import('@actions/github').GitHub} octokit
 * @param {String} label - Name of label that got added.
 * @param {String} user - Username of the user that added the label.
 */
const handlePRLabel = async (octokit, label, user) => {
  const issueNumber = context.payload.issue.number;
  const linkText = 'here';
  // Add link to wiki.
  const link = linkText.link(
    'https://github.com/oppia/oppia/wiki/Contributing-code-to-Oppia#' +
    'labeling-issues-and-pull-requests');
  let commentBody = ''
  if(label.startsWith('PR CHANGELOG')) {
    // Handle case for a changelog label.
    commentBody = (
      'Hi @' + user + ', changelog labels should not be used on issues.' +
      ' I’m removing the label. You can learn more about labels ' + link);
  } else {
    commentBody = (
      'Hi @' + user + ', the ' + label + ' label should only be used in ' +
      'pull requests. I’m removing the label. You can learn more about ' +
      'labels ' + link);
  }

  await octokit.issues.createComment(
    {
      body:commentBody,
      issue_number: issueNumber,
      owner: context.repo.owner,
      repo: context.repo.repo,
    }
  );

  // Remove the label.
  core.info(`Removing the label.`);
  await octokit.issues.removeLabel({
    issue_number:issueNumber,
    name: label,
    owner: context.repo.owner,
    repo: context.repo.repo
  })

};

module.exports = {
  checkLabels,
};
