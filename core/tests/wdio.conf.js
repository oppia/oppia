require('dotenv').config();
var FirebaseAdmin = require('firebase-admin');
var path = require('path');
var fs = require('fs');
var childProcess = require('child_process');
var Constants = require('./webdriverio_utils/WebdriverioConstants');
var DOWNLOAD_PATH = path.resolve(__dirname, Constants.DOWNLOAD_PATH);
var args = process.argv;

// When tests is running in debug mode, the chrome version number
// is passed as 7th argument else it is passed as 6th argument.
// eslint-disable-next-line eqeqeq
var chromeVersion = (args[0] == 'DEBUG=true') ? args[6] : args[5];

const drivers = {
  chrome: { version: chromeVersion },
};

// If video recorder is not running the ffmpeg process will be null.
var ffmpegProcess = null;
// The absolute path where the recorded video of test will be stored.
var videoPath = null;
// Enable ALL_VIDEOS if you want success videos to be saved.
const ALL_VIDEOS = false;

var suites = {
  full: [
    './core/tests/webdriverio/**/*.js',
    './core/tests/webdriverio_desktop/**/*.js',
  ],

  accessibility: [
    './core/tests/webdriverio/accessibility.js'
  ],

  additionalEditorFeatures: [
    './core/tests/webdriverio_desktop/additionalEditorFeatures.js'
  ],

  additionalEditorFeaturesModals: [
    './core/tests/webdriverio_desktop/additionalEditorFeaturesModals.js'
  ],

  additionalPlayerFeatures: [
    './core/tests/webdriverio_desktop/additionalPlayerFeatures.js'
  ],

  blogDashboard: [
    './core/tests/webdriverio_desktop/blogDashboard.js'
  ],

  blog: [
    './core/tests/webdriverio_desktop/blog.js'
  ],

  collections: [
    './core/tests/webdriverio_desktop/collections.js'
  ],

  contributorAdminDashboard: [
    './core/tests/webdriverio_desktop/contributorAdminDashboard.js'
  ],

  contributorDashboard: [
    './core/tests/webdriverio_desktop/contributorDashboard.js'
  ],

  coreEditorAndPlayerFeatures: [
    './core/tests/webdriverio_desktop/coreEditorAndPlayerFeatures.js'
  ],

  creatorDashboard: [
    './core/tests/webdriverio_desktop/creatorDashboard.js'
  ],

  embedding: [
    './core/tests/webdriverio_desktop/embedding.js'
  ],

  explorationFeedbackTab: [
    './core/tests/webdriverio_desktop/explorationFeedbackTab.js'
  ],

  explorationImprovementsTab: [
    './core/tests/webdriverio_desktop/explorationImprovementsTab.js'
  ],

  explorationHistoryTab: [
    './core/tests/webdriverio_desktop/explorationHistoryTab.js'
  ],

  explorationStatisticsTab: [
    './core/tests/webdriverio_desktop/explorationStatisticsTab.js'
  ],

  explorationTranslationTab: [
    './core/tests/webdriverio_desktop/explorationTranslationTab.js'
  ],

  extensions: [
    './core/tests/webdriverio_desktop/extensions.js'
  ],

  fileUploadExtensions: [
    './core/tests/webdriverio_desktop/fileUploadExtensions.js'
  ],

  fileUploadFeatures: [
    './core/tests/webdriverio_desktop/voiceoverUploadFeatures.js'
  ],

  learner: [
    './core/tests/webdriverio/learnerFlow.js'
  ],

  navigation: [
    './core/tests/webdriverio_desktop/navigation.js'
  ],

  profileFeatures: [
    './core/tests/webdriverio_desktop/profileFeatures.js'
  ],

  profileMenu: [
    './core/tests/webdriverio/profileMenuFlow.js'
  ],

  publication: [
    './core/tests/webdriverio_desktop/publicationAndLibrary.js'
  ],

  skillEditor: [
    './core/tests/webdriverio_desktop/skillEditor.js'
  ],

  subscriptions: [
    './core/tests/webdriverio/subscriptionsFlow.js'
  ],

  topicsAndSkillsDashboard: [
    './core/tests/webdriverio_desktop/topicsAndSkillsDashboard.js'
  ],

  topicAndStoryEditor: [
    './core/tests/webdriverio_desktop/topicAndStoryEditor.js'
  ],

  topicAndStoryEditorFileUploadFeatures: [
    './core/tests/webdriverio_desktop/topicAndStoryEditorFileUploadFeatures.js'
  ],

  users: [
    './core/tests/webdriverio_desktop/userJourneys.js'
  ],

  wipeout: [
    './core/tests/webdriverio_desktop/wipeout.js'
  ]
};

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
    'goog:loggingPrefs': {
      browser: 'ALL',
    },
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
  baseUrl: 'http://localhost:8181',

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
    ['selenium-standalone', {
      logPath: 'logs',
      installArgs: { drivers },
      args: { drivers }
    }],
    'intercept'
  ],

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
  reporters: [
    ['spec', {
      showPreface: false,
      realtimeReporting: true,
    }]
  ],

  isMobile: false,

  // Options to be passed to Jasmine.
  jasmineOpts: {
    // Default time to wait in ms before a test fails.
    defaultTimeoutInterval: 1200000,
    // Option to stop execution of the suite after the first spec failure.
    stopOnSpecFailure: true,
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
    // eslint-disable-next-line eqeqeq
    mobileViewportArg = process.env.MOBILE == 'true';

    // eslint-disable-next-line eqeqeq
    if (mobileViewportArg) {
      browser.setWindowSize(600, 1000);
    } else {
      // Set a wide enough window size for the navbar in the library pages to
      // display fully.
      browser.setWindowSize(1285, 1000);
    }


    // Configure the Firebase Admin SDK to communicate with the emulator.
    process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
    FirebaseAdmin.initializeApp({projectId: 'dev-project-id'});

    // Navigate to the splash page so that tests can begin on an Angular page.
    browser.url('http://localhost:8181');
  },
  /**
    * Function to be executed before a test (in Mocha/Jasmine only)
    * @param {Object} test    test object
    * @param {Object} context scope object the test was executed with
    */
  beforeTest: function(test, context) {
    if (// eslint-disable-next-line eqeqeq
    process.env.VIDEO_RECORDING_IS_ENABLED == 1) {
      let ffmpegArgs = [
        '-y',
        '-r', '30',
        '-f', 'x11grab',
        '-s', '1285x1000',
        '-i', process.env.DISPLAY,
        '-g', '300',
        '-loglevel', '16',
        // Use ultrafast preset to reduce overhead,
        // which is crucial when testing in CI.
        '-preset', 'ultrafast',
      ];
      const uniqueString = Math.random().toString(36).substring(2, 8);
      var name = uniqueString + '.mp4';
      var dirPath = path.resolve(
        '__dirname', '..', '..', 'webdriverio-video/');
      try {
        fs.mkdirSync(dirPath, { recursive: true });
      } catch (err) {}
      videoPath = path.resolve(dirPath, name);
      ffmpegArgs.push(videoPath);
      ffmpegProcess = childProcess.spawn('ffmpeg', ffmpegArgs);
      // eslint-disable-next-line no-console
      console.log(
        'Test name: ' + test.fullName + ' has video path ' + videoPath);
      ffmpegProcess.on('message', (message) => {
        // eslint-disable-next-line no-console
        console.log(`ffmpeg stdout: ${message}`);
      });
      ffmpegProcess.on('error', (errorMessage) => {
        console.error(`ffmpeg stderr: ${errorMessage}`);
      });
      ffmpegProcess.on('close', (code) => {
        // eslint-disable-next-line no-console
        console.log(`ffmpeg exited with code ${code}`);
      });
    }
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
    if (// eslint-disable-next-line eqeqeq
    process.env.VIDEO_RECORDING_IS_ENABLED == 1) {
      ffmpegProcess.kill();
      if (passed === true && !ALL_VIDEOS && fs.existsSync(videoPath)) {
        fs.unlinkSync(videoPath);
        // eslint-disable-next-line no-console
        console.log(
          `Video for test: ${test.fullName}` +
          'was deleted successfully (test passed).');
      }
    }
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
