const issueLabelsModule = require('./issues/checkIssueLabels');

const EVENTS = {
  ISSUES: 'issues',
};
const ACTIONS = {
  LABELLED: 'labeled'
}
module.exports = {
  async dispatch(event, action) {
    if(event === EVENTS.ISSUES) {
      if(action === ACTIONS.LABELLED) {
        await issueLabelsModule.checkLabels()
      }
    }
  }
}
