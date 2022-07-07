require('dotenv').config();
const video = require('wdio-video-reporter');
var FirebaseAdmin = require('firebase-admin');
var path = require('path');
var fs = require('fs');
var Constants = require('./webdriverio_utils/WebdriverioConstants');
var DOWNLOAD_PATH = path.resolve(__dirname, Constants.DOWNLOAD_PATH);
var args = process.argv;

// When tests is running in debug mode, the chrome version number
// is passed as 7th argument else it is passed as 6th argument.
// eslint-disable-next-line eqeqeq
var chromeVersion = (args[0] == 'DEBUG=true') ? args[6] : args[5];

var chromedriverPath =
'./node_modules/webdriver-manager/selenium/chromedriver_' + chromeVersion;

// To record videos of the failed test suites locally,
// update the value of LOCAL_VIDEO_RECORDING_IS_ENABLED to 1.
var LOCAL_VIDEO_RECORDING_IS_ENABLED = 0;

var suites = {
  full: [
    './core/tests/webdriverio/**/*.js',
    './core/tests/webdriverio_desktop/**/*.js',
  ],

  collections: [
    './core/tests/webdriverio_desktop/collections.js'
  ],

  creatorDashboard: [
    './core/tests/webdriverio_desktop/creatorDashboard.js'
  ],

  learner: [
    './core/tests/webdriverio/learnerFlow.js'
  ],

  learnerDashboard: [
    './core/tests/webdriverio_desktop/learnerDashboard.js'
  ],

  preferences: [
    './core/tests/webdriverio_desktop/preferences.js'
  ],

  profileFeatures: [
    './core/tests/webdriverio_desktop/profileFeatures.js'
  ],

  subscriptions: [
    './core/tests/webdriverio/subscriptionsFlow.js'
  ],

  users: [
    './core/tests/webdriverio_desktop/userJourneys.js'
  ],
};

reportersArray = [
  ['spec', {
    showPreface: false,
    realtimeReporting: true,
  }]
];

if ((process.env.GITHUB_ACTIONS &&
    // eslint-disable-next-line eqeqeq
    process.env.VIDEO_RECORDING_IS_ENABLED == 1) ||
    LOCAL_VIDEO_RECORDING_IS_ENABLED === 1) {
  videoReporter = [video, {
    outputDir: '../webdriverio-video',
    // Enable saveAllVideos if you want to save the videos
    // of the tests that pass as well.
    saveAllVideos: false,
    videoSlowdownMultiplier: 3,
  }];

  reportersArray.push(videoReporter);
  // eslint-disable-next-line no-console
  console.log(
    'Videos of the failed tests can be viewed ' +
    'in ../webdriverio-video');
} else {
  // eslint-disable-next-line no-console
  console.log(
    'Videos will not be recorded for this suite either because videos' +
    ' have been disabled for it (using environment variables) or' +
    ' because it\'s on CircleCI');
}

// A reference configuration file.
exports.config = {
  //
  // ====================
  // Runner Configuration
  // ====================
  //
  //
  // ==================
  // Specify Test Files
  // ==================
  // When run without a command line parameter, all suites will run. If run
  // with --suite=smoke, only the patterns matched by that suite will run.
  suites: suites,
  //
  // ============
  // Capabilities
  // ============
  // Define your capabilities here. WebdriverIO can run multiple capabilities
  // at the same time. Depending on the number of capabilities, WebdriverIO
  // launches several test sessions. Within your capabilities you can overwrite
  //  the spec and exclude options in order to group specific specs to a
  // specific capability.
  capabilities: [{
    browserName: 'chrome',
    'goog:chromeOptions': {
      args: [
        '--lang=en-EN',
        '--window-size=1285x1000',
        // These arguments let us simulate recording from a microphone.
        '--use-fake-device-for-media-stream',
        '--use-fake-ui-for-media-stream',
        '--use-file-for-fake-audio-capture=data/cafe.mp3',
        // These arguments are required to run the tests on GitHub
        // Actions.
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
      prefs: {
        download: {
          // eslint-disable-next-line quote-props
          'prompt_for_download': false,
          // eslint-disable-next-line quote-props
          'default_directory': DOWNLOAD_PATH,
        }
      }
    }
  }],

  // ===================
  // Test Configurations
  // ===================
  // Define all options that are relevant for the WebdriverIO instance here
  //
  // Level of logging verbosity: trace | debug | info | warn | error | silent.
  logLevel: 'warn',

  // Set a base URL in order to shorten url command calls. If your `url`
  // parameter starts with `/`, the base url gets prepended, not including
  // the path portion of your baseUrl. If your `url` parameter starts
  // without a scheme or `/` (like `some/path`), the base url gets
  //  prepended directly.
  baseUrl: 'http://localhost:9001',

  // Default timeout in milliseconds for request
  // if browser driver or grid doesn't send response.
  connectionRetryTimeout: 120000,

  // Default request retries count.
  connectionRetryCount: 3,

  // Test runner services
  // Services take over a specific job you don't want to take care of.
  // They enhance your test setup with almost no effort. Unlike plugins,
  // they don't add newcommands. Instead, they hook themselves up into
  // the test process.
  services: [
    ['chromedriver', {
      chromedriverCustomPath: chromedriverPath
    }]],

  // Framework you want to run your specs with.
  // The following are supported: Mocha, Jasmine, and Cucumber
  // see also: https://webdriver.io/docs/frameworks
  //
  // Make sure you have the wdio adapter package for the specific
  // framework installed before running any tests.
  framework: 'jasmine',

  // Test reporter for stdout.
  // The only one supported by default is 'dot'
  // see also: https://webdriver.io/docs/dot-reporter
  reporters: reportersArray,

  isMobile: false,

  // Options to be passed to Jasmine.
  jasmineOpts: {
    // Default time to wait in ms before a test fails.
    defaultTimeoutInterval: 1200000
  },


  // =====
  // Hooks
  // =====
  // WebdriverIO provides several hooks you can use to interfere with
  // the test process in order to enhance it and to build services around it.
  // You can either apply a single function or an array of methods to it.
  // If one of them returns with a promise, WebdriverIO will wait until that
  // promise got resolved to continue.
  /**
   * Gets executed before test execution begins. At this point you can access
   * to all global variables like `browser`. It is the perfect place to
   * define custom commands.
   * @param {Array.<Object>} capabilities list of capabilities details
   * @param {Array.<String>} specs   List of spec file paths that are to be run
   * @param {Object}         browser instance of created browser/device session
   */
  before: function() {
    // Set a wide enough window size for the navbar in the library pages to
    // display fully.
    browser.setWindowSize(1285, 1000);


    // Configure the Firebase Admin SDK to communicate with the emulator.
    process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
    FirebaseAdmin.initializeApp({projectId: 'dev-project-id'});

    // Navigate to the splash page so that tests can begin on an Angular page.
    browser.url('http://localhost:9001');
  },
  /**
   * Function to be executed after a test
   * @param {Object}  test             test object
   * @param {Object}  context          scope object the test was executed with
   * @param {Error}   result.error     error object in case the test fails,
   *                                   otherwise `undefined`
   * @param {Any}     result.result    return object of test function
   * @param {Number}  result.duration  duration of test
   * @param {Boolean} result.passed    true if test has passed, otherwise false
   * @param {Object}  result.retries   informations to spec related retries,
   *                                   e.g. `{ attempts: 0, limit: 0 }`
   */
  afterTest: async function(
      test, context, { error, result, duration, passed, retries }) {
    // If a test fails then only the error will be defined and
    // the screenshot will be taken and saved.
    if (error) {
      var dirPath = path.resolve(
        '__dirname', '..', '..', 'webdriverio-screenshots/');
      try {
        fs.mkdirSync(dirPath, { recursive: true });
        var screenshotPath = '../webdriverio-screenshots';
      } catch (err) {}

      var testName = encodeURIComponent(test.fullName.replace(/\s+/g, '-'));
      var fileName = testName + '.png';
      var filePath = path.join(screenshotPath, fileName);
      // Save screenshot.
      await browser.saveScreenshot(filePath);
    }
  },
};
