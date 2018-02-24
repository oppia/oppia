var ScreenShotReporter = require('protractor-screenshot-reporter');

// A reference configuration file.
exports.config = {
  // ----- How to setup Selenium -----
  //
  // There are three ways to specify how to use Selenium. Specify one of the
  // following:
  //
  // 1. seleniumServerJar - to start Selenium Standalone locally.
  // 2. seleniumAddress - to connect to a Selenium server which is already
  //    running.
  // 3. sauceUser/sauceKey - to use remote Selenium servers via SauceLabs.
  //
  // If the chromeOnly option is specified, no Selenium server will be started,
  // and chromeDriver will be used directly (from the location specified in
  // chromeDriver)

  // The location of the selenium standalone server .jar file, relative
  // to the location of this config. If no other method of starting selenium
  // is found, this will default to
  // node_modules/protractor/selenium/selenium-server...
  seleniumServerJar: null,
  // The port to start the selenium server on, or null if the server should
  // find its own unused port.
  seleniumPort: null,
  // Chromedriver location is used to help the selenium standalone server
  // find chromedriver. This will be passed to the selenium jar as
  // the system property webdriver.chrome.driver. If null, selenium will
  // attempt to find chromedriver using PATH.
  chromeDriver: './selenium/chromedriver',
  // If true, only chromedriver will be started, not a standalone selenium.
  // Tests for browsers other than chrome will not run.
  chromeOnly: false,
  // Additional command line options to pass to selenium. For example,
  // if you need to change the browser timeout, use
  // seleniumArgs: ['-browserTimeout=60'],
  seleniumArgs: [],

  // If sauceUser and sauceKey are specified, seleniumServerJar will be ignored.
  // The tests will be run remotely using SauceLabs.
  sauceUser: null,
  sauceKey: null,

  // The address of a running selenium server. If specified, Protractor will
  // connect to an already running instance of selenium. This usually looks like
  // seleniumAddress: 'http://localhost:4444/wd/hub'
  seleniumAddress: 'http://localhost:4444/wd/hub',

  // The timeout for each script run on the browser. This should be longer
  // than the maximum time your application needs to stabilize between tasks.
  // (Note that the hint tooltip has a 60-second timeout.)
  allScriptsTimeout: 180000,

  // ----- What tests to run -----
  //
  // When run without a command line parameter, all suites will run. If run
  // with --suite=smoke, only the patterns matched by that suite will run.
  suites: {
    full: [
      'protractor/*.js'
    ],

    mainEditor: [
      'protractor/editorAndPlayer.js',
      'protractor/stateEditor.js',
      'protractor/explorationFeedback.js'
    ],

    editorFeatures: [
      'protractor/historyTab.js',
      'protractor/parameters.js',
      'protractor/hintsAndSolutions.js'
    ],

    extensions: [
      'protractor/richTextComponents.js',
      'protractor/interactions.js'
    ],

    library: [
      'protractor/explorationRating.js',
      'protractor/privileges.js',
      'protractor/libraryPagesTour.js',
      'protractor/publicationAndLibrary.js'
    ],

    learnerDashboard: [
      'protractor/learnerDashboard.js',
    ],

    users: [
      'protractor/userManagement.js',
      'protractor/loginFlow.js',
      'protractor/subscriptions.js',
      'protractor/preferences.js'
    ],

    misc: [
      'protractor/suggestions.js',
      'protractor/cacheSlugs.js',
      'protractor/staticPagesTour.js',
      'protractor/collections.js',
      'protractor/accessibility.js',
      'protractor/i18n.js'
    ],

    embedding: [
      'protractor/embedding.js'
    ]
  },

  // ----- Capabilities to be passed to the webdriver instance ----
  //
  // For a full list of available capabilities, see
  // https://code.google.com/p/selenium/wiki/DesiredCapabilities
  // and
  // https://code.google.com/p/selenium/source/browse/javascript/webdriver/capabilities.js
  capabilities: {
    browserName: 'chrome',
    chromeOptions: {
      args: ['lang=en-EN'],
      prefs: {
        intl: {
          accept_languages: 'en-EN'
        }
      }
    },
    loggingPrefs: {
      driver: 'INFO',
      browser: 'INFO'
    }
  },

  // If you would like to run more than one instance of webdriver on the same
  // tests, use multiCapabilities, which takes an array of capabilities.
  // If this is specified, capabilities will be ignored.
  multiCapabilities: [],

  // ----- More information for your tests ----
  //
  // A base URL for your application under test. Calls to protractor.get()
  // with relative paths will be prepended with this.
  baseUrl: 'http://localhost:9001',

  // Selector for the element housing the angular app - this defaults to
  // body, but is necessary if ng-app is on a descendant of <body>
  rootElement: 'body',

  // A callback function called once protractor is ready and available, and
  // before the specs are executed
  // You can specify a file containing code to run by setting onPrepare to
  // the filename string.
  onPrepare: function() {
    // At this point, global 'protractor' object will be set up, and jasmine
    // will be available. For example, you can add a Jasmine reporter with:
    //     jasmine.getEnv().addReporter(new jasmine.JUnitXmlReporter(
    //         'outputdir/', true, true));

    // This is currently pulled out into a flag because it sometimes obscures
    // the actual protractor error logs and does not close the browser after
    // a failed run.
    // TODO(sll): Switch this option on by default, once the above issues are
    // fixed.
    var _ADD_SCREENSHOT_REPORTER = false;

    if (_ADD_SCREENSHOT_REPORTER) {
      // This takes screenshots of failed tests. For more information see
      // https://www.npmjs.com/package/protractor-screenshot-reporter
      jasmine.getEnv().addReporter(new ScreenShotReporter({
        // Directory for screenshots
        baseDirectory: '../protractor-screenshots',
        // Function to build filenames of screenshots
        pathBuilder: function(spec, descriptions, results, capabilities) {
          return descriptions[1] + ' ' + descriptions[0];
        },
        takeScreenShotsOnlyForFailedSpecs: true
      }));
    }

    var SpecReporter = require('jasmine-spec-reporter').SpecReporter;
    jasmine.getEnv().addReporter(new SpecReporter({
      displayStacktrace: 'all',
      displaySpecDuration: true
    }));

    // Set a wide enough window size for the navbar in the library pages to
    // display fully.
    browser.driver.manage().window().setSize(1285, 1000);
  },

  // The params object will be passed directly to the protractor instance,
  // and can be accessed from your test. It is an arbitrary object and can
  // contain anything you may need in your test.
  // This can be changed via the command line as:
  //   --params.login.user 'Joe'
  params: {
    login: {
      user: 'Jane',
      password: '1234'
    }
  },

  // ----- The test framework -----
  //
  // Jasmine and Cucumber are fully supported as a test and assertion framework.
  // Mocha has limited beta support. You will need to include your own
  // assertion framework if working with mocha.
  framework: 'jasmine2',

  // ----- Options to be passed to minijasminenode -----
  //
  // See the full list at https://github.com/juliemr/minijasminenode
  jasmineNodeOpts: {
    // The onComplete method will be called just before the driver quits.
    onComplete: null,
    // If true, display spec names.
    isVerbose: false,
    // If true, print colors to the terminal.
    showColors: true,
    // If true, include stack traces in failures.
    includeStackTrace: true,
    // Default time to wait in ms before a test fails.
    defaultTimeoutInterval: 1200000
  },

  // ----- Options to be passed to mocha -----
  //
  // See the full list at http://visionmedia.github.io/mocha/
  mochaOpts: {
    ui: 'bdd',
    reporter: 'list'
  },

  // ----- Options to be passed to cucumber -----
  cucumberOpts: {
    // Require files before executing the features.
    require: 'cucumber/stepDefinitions.js',
    // Only execute the features or scenarios with tags matching @dev.
    // This may be an array of strings to specify multiple tags to include.
    tags: '@dev',
    // How to format features (default: progress)
    format: 'summary'
  },

  // ----- The cleanup step -----
  //
  // A callback function called once the tests have finished running and
  // the webdriver instance has been shut down. It is passed the exit code
  // (0 if the tests passed or 1 if not).
  onCleanUp: function() {}
};
