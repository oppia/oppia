const github = require('@actions/github');
const core = require('@actions/core');
const payload = require('../payload/issue.labelled.json');
const dispatcher = require('../../src/dispatcher');
const whitelist = require('../../src/whitelist.json');
const checkIssueLabelModule = require('../../src/issues/checkIssueLabels');

describe('Check Issue Labels Module', () => {
  let octokit;

  beforeEach(async () => {
    github.context.eventName = 'issues';
    github.context.payload = payload;
    github.context.issue = payload.issue;
    github.context.repo = {
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
    };

    octokit = {
      issues: {
        createComment: jasmine.createSpy('createComment').and.resolveTo({}),
        removeLabel: jasmine.createSpy('removeLabel').and.resolveTo({}),
      },
    };

    spyOn(core, 'getInput').and.returnValue('sample-token');
    Object.setPrototypeOf(github.GitHub, function () {
      return octokit;
    });
    spyOn(checkIssueLabelModule, 'checkLabels').and.callThrough();
  });

  describe('called for only issue event and labeled action', () => {
    it('should not be called for non issue event', async () => {
      await dispatcher.dispatch('pull_request', 'labeled');

      expect(checkIssueLabelModule.checkLabels).not.toHaveBeenCalled();
    });

    it('should not be called for non labeled action', async () => {
      await dispatcher.dispatch('issues', 'opened');

      expect(checkIssueLabelModule.checkLabels).not.toHaveBeenCalled();
    });
  })

  describe('check for good first issue label by non whitelisted user', () => {
    beforeEach(async () => {

      await dispatcher.dispatch('issues', 'labeled');
    });

    it('should be called for the payload', () => {
      expect(checkIssueLabelModule.checkLabels).toHaveBeenCalled();
    });

    it('should create appropriate comment', () => {
      expect(octokit.issues.createComment).toHaveBeenCalled();
      const user = payload.sender.login;
      const body =
        'Hi @' +
        user +
        ', thanks for proposing this as a good first ' +
        'issue. Looping in @' +
        whitelist.teamLeads.onboardingTeam +
        ' to confirm, removing the label until he does so.';

      expect(octokit.issues.createComment).toHaveBeenCalledWith({
        issue_number: payload.issue.number,
        body: body,
        owner: payload.repository.owner.login,
        repo: payload.repository.name,
      });
    });

    it('should remove the label', () => {
      expect(octokit.issues.removeLabel).toHaveBeenCalled();
      expect(octokit.issues.removeLabel).toHaveBeenCalledWith({
        issue_number: payload.issue.number,
        name: 'good first issue',
        owner: payload.repository.owner.login,
        repo: payload.repository.name,
      });
    });
  });

  describe('check for good first issue by whitelisted user', () => {
    beforeEach(async () => {
      payload.sender.login = 'seanlip'
      await dispatcher.dispatch('issues', 'labeled');
    });

    it('should be called for the payload', () => {
      expect(checkIssueLabelModule.checkLabels).toHaveBeenCalled();
    });

    it('should not comment on issue', () => {
      expect(octokit.issues.createComment).not.toHaveBeenCalled();
    });

    it('should not remove the label', () => {
      expect(octokit.issues.removeLabel).not.toHaveBeenCalled();
    });
  })

  describe('check for changelog labels', () => {
    beforeEach(async () => {
      payload.label.name = 'PR CHANGELOG: Server Errors -- @kevintab95';
      await dispatcher.dispatch('issues', 'labeled');
    });

    it('should be called for the payload', () => {
      expect(checkIssueLabelModule.checkLabels).toHaveBeenCalled();
    });

    it('should create appropriate comment', () => {
      expect(octokit.issues.createComment).toHaveBeenCalled();

      const user = payload.sender.login;
      const link = 'here'.link()
      const body = 'Hi @' + user + ', changelog labels should not be used on issues.' +
      ' I’m removing the label. You can learn more about labels ' + link;

      expect(octokit.issues.createComment).toHaveBeenCalledWith({
        issue_number: payload.issue.number,
        body: body,
        owner: payload.repository.owner.login,
        repo: payload.repository.name,
      });
    });

    it('should remove the label', () => {
      expect(octokit.issues.removeLabel).toHaveBeenCalled();
      expect(octokit.issues.removeLabel).toHaveBeenCalledWith({
        issue_number: payload.issue.number,
        name: 'PR CHANGELOG: Server Errors -- @kevintab95',
        owner: payload.repository.owner.login,
        repo: payload.repository.name,
      });
    });
  });

  describe('check for other PR labels', () => {
    beforeEach(async () => {
      payload.label.name = 'dependencies';
      await dispatcher.dispatch('issues', 'labeled');
    });

    it('should be called for the payload', () => {
      expect(checkIssueLabelModule.checkLabels).toHaveBeenCalled();
    });

    it('should create appropriate comment', () => {
      expect(octokit.issues.createComment).toHaveBeenCalled();

      const user = payload.sender.login;
      const link = 'here'.link();
      const body = 'Hi @' + user + ', the label label should only be used in pull requests.' +
      ' I’m removing the label. You can learn more about labels ' + link;

      expect(octokit.issues.createComment).toHaveBeenCalledWith({
        issue_number: payload.issue.number,
        body: body,
        owner: payload.repository.owner.login,
        repo: payload.repository.name,
      });
    });

    it('should remove the label', () => {
      expect(octokit.issues.removeLabel).toHaveBeenCalled();
      expect(octokit.issues.removeLabel).toHaveBeenCalledWith({
        issue_number: payload.issue.number,
        name: 'dependencies',
        owner: payload.repository.owner.login,
        repo: payload.repository.name,
      });
    });
  })
});
