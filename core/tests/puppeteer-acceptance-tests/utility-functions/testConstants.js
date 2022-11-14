// this file is for exporting the constants in our tests, that can be used again-and-again..

let testConstants = {
  URLs: {
    home: 'http://localhost:8181/',
    BlogDashboard: 'http://localhost:8181/blog-dashboard',
    CreatorDashboard: 'http://localhost:8181/creator-dashboard'
  },
  Dashboard: {
    MainDashboard: '.oppia-learner-dashboard-main-content',
  },
  SignInDetails: {
    inputField: 'input.e2e-test-sign-in-email-input',
    devEmail: 'testadmin@example.com'
  }
};

module.exports = testConstants;