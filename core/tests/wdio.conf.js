require('dotenv').config();
var Jasmine = require('jasmine');
var jasmine = new Jasmine();
var FirebaseAdmin = require('firebase-admin');
var HtmlScreenshotReporter = require('protractor-jasmine2-screenshot-reporter');
var glob = require('glob');
var path = require('path');
var fs = require('fs');
var childProcess = require('child_process');
var Constants = require('./protractor_utils/ProtractorConstants');
var DOWNLOAD_PATH = path.resolve(__dirname, Constants.DOWNLOAD_PATH);
var exitCode = 0;
var suites = {
    // The tests on Travis are run individually to parallelize
    // them. Therefore, we mention the complete directory
    // in 'full'.
    full: [
      './core/tests/webdriverio/*.js'
    ],

    // Unfortunately, adding more than one file to a test suite results in
    // severe instability as of Chromedriver 2.38 (Chrome 66).
    adminPage: [
      './core/tests/webdriverio/*.js'
    ]
};
exports.config = {
    beforeLaunch: function() {
      Object.keys(suites).forEach(function(key) {
        var patterns = suites[key];
        for (var pattern of patterns) {
          var fullPattern = path.resolve(__dirname, pattern);
          var files = glob.sync(fullPattern);
          if (files.length == 0) {
            var errorMessage = '';
            if (glob.hasMagic(pattern)) {
              errorMessage = 'There are no files with the following pattern: ' + (
                pattern);
            } else {
              errorMessage = pattern + ' does not exist.';
            }
            throw new Error(errorMessage)
          }
        }
      });
    },
    //
    // ====================
    // Runner Configuration
    // ====================
    //
    //
    // ==================
    // Specify Test Files
    // ==================
    // Define which test specs should run. The pattern is relative to the directory
    // from which `wdio` was called.
    //
    // The specs are defined as an array of spec files (optionally using wildcards
    // that will be expanded). The test for each spec file will be run in a separate
    // worker process. In order to have a group of spec files run in the same worker
    // process simply enclose them in an array within the specs array.
    //
    // If you are calling `wdio` from an NPM script (see https://docs.npmjs.com/cli/run-script),
    // then the current working directory is where your `package.json` resides, so `wdio`
    // will be called from there.
    //
    suites: suites,
    // Patterns to exclude.
    exclude: [
        // 'path/to/excluded/files'
    ],
    //
    // ============
    // Capabilities
    // ============
    // Define your capabilities here. WebdriverIO can run multiple capabilities at the same
    // time. Depending on the number of capabilities, WebdriverIO launches several test
    // sessions. Within your capabilities you can overwrite the spec and exclude options in
    // order to group specific specs to a specific capability.
    //
    // First, you can define how many instances should be started at the same time. Let's
    // say you have 3 different capabilities (Chrome, Firefox, and Safari) and you have
    // set maxInstances to 1; wdio will spawn 3 processes. Therefore, if you have 10 spec
    // files and you set maxInstances to 10, all spec files will get tested at the same time
    // and 30 processes will get spawned. The property handles how many capabilities
    // from the same test should run tests.
    //
    maxInstances: 10,
    //
    // If you have trouble getting all important capabilities together, check out the
    // Sauce Labs platform configurator - a great tool to configure your capabilities:
    // https://saucelabs.com/platform/platform-configurator
    //
    capabilities: [{
    
        // maxInstances can get overwritten per capability. So if you have an in-house Selenium
        // grid with only 5 firefox instances available you can make sure that not more than
        // 5 instances get started at a time.
        maxInstances: 5,
        //
        browserName: 'chrome',
        'goog:chromeOptions': {
            // Chromedriver versions 75+ sets w3c mode to true by default.
            // see https://chromedriver.storage.googleapis.com/75.0.3770.8/notes.txt
            // This causes certain legacy APIs to fail eg. sendKeysToActiveElement.
            // The workaround is to set this property to false per discussion on
            // this thread: https://github.com/angular/protractor/issues/5274
            w3c: false,
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
                  'prompt_for_download': false,
                  'default_directory': DOWNLOAD_PATH,
                }
            }
          },
        acceptInsecureCerts: true
        // If outputDir is provided WebdriverIO can capture driver session logs
        // it is possible to configure which logTypes to include/exclude.
        // excludeDriverLogs: ['*'], // pass '*' to exclude all driver session logs
        // excludeDriverLogs: ['bugreport', 'server'],
    }],
    //
    // ===================
    // Test Configurations
    // ===================
    // Define all options that are relevant for the WebdriverIO instance here
    //
    // Level of logging verbosity: trace | debug | info | warn | error | silent
    logLevel: 'info',
    //
    // Set specific log levels per logger
    // loggers:
    // - webdriver, webdriverio
    // - @wdio/browserstack-service, @wdio/devtools-service, @wdio/sauce-service
    // - @wdio/mocha-framework, @wdio/jasmine-framework
    // - @wdio/local-runner
    // - @wdio/sumologic-reporter
    // - @wdio/cli, @wdio/config, @wdio/utils
    // Level of logging verbosity: trace | debug | info | warn | error | silent
    // logLevels: {
    //     webdriver: 'info',
    //     '@wdio/appium-service': 'info'
    // },
    //
    // If you only want to run your tests until a specific amount of tests have failed use
    // bail (default is 0 - don't bail, run all tests).
    bail: 0,
    //
    // Set a base URL in order to shorten url command calls. If your `url` parameter starts
    // with `/`, the base url gets prepended, not including the path portion of your baseUrl.
    // If your `url` parameter starts without a scheme or `/` (like `some/path`), the base url
    // gets prepended directly.
    baseUrl: 'http://localhost:8181',
    //
    // Default timeout for all waitFor* commands.
    waitforTimeout: 10000,
    //
    // Default timeout in milliseconds for request
    // if browser driver or grid doesn't send response
    connectionRetryTimeout: 120000,
    //
    // Default request retries count
    connectionRetryCount: 3,
    //
    // Test runner services
    // Services take over a specific job you don't want to take care of. They enhance
    // your test setup with almost no effort. Unlike plugins, they don't add new
    // commands. Instead, they hook themselves up into the test process.
    connectionRetryCount: 3,

    services: ['chromedriver'],

    
    // Framework you want to run your specs with.
    // The following are supported: Mocha, Jasmine, and Cucumber
    // see also: https://webdriver.io/docs/frameworks
    //
    // Make sure you have the wdio adapter package for the specific framework installed
    // before running any tests.
    framework: 'jasmine',
    //
    // The number of times to retry the entire specfile when it fails as a whole
    // specFileRetries: 1,
    //
    // Delay in seconds between the spec file retry attempts
    // specFileRetriesDelay: 0,
    //
    // Whether or not retried specfiles should be retried immediately or deferred to the end of the queue
    // specFileRetriesDeferred: false,
    //
    // Test reporter for stdout.
    // The only one supported by default is 'dot'
    // see also: https://webdriver.io/docs/dot-reporter
    reporters: ['spec'],


    
    //
    // Options to be passed to Jasmine.
    jasmineOpts: {
        // Jasmine default timeout
        defaultTimeoutInterval: 1200000,
        //
        // The Jasmine framework allows interception of each assertion in order to log the state of the application
        // or website depending on the result. For example, it is pretty handy to take a screenshot every time
        // an assertion fails.
        expectationResultHandler: function(passed, assertion) {
            // do something
        }
    },
    
    //
    // =====
    // Hooks
    // =====
    // WebdriverIO provides several hooks you can use to interfere with the test process in order to enhance
    // it and to build services around it. You can either apply a single function or an array of
    // methods to it. If one of them returns with a promise, WebdriverIO will wait until that promise got
    // resolved to continue.
    /**
     * Gets executed once before all workers get launched.
     * @param {Object} config wdio configuration object
     * @param {Array.<Object>} capabilities list of capabilities details
     */
    onPrepare: function (config, capabilities) {
      // driver.isMobile = false;

      // At this point, global 'protractor' object will be set up, and jasmine
      // will be available. For example, you can add a Jasmine reporter with:
      //     jasmine.getEnv().addReporter(new jasmine.JUnitXmlReporter(
      //         'outputdir/', true, true));
  
      // var spw = null;
      // var vidPath = '';
      // // Enable ALL_VIDEOS if you want success videos to be saved.
      // const ALL_VIDEOS = false;
  
      // Only running video recorder on Github Actions, since running it on
      // CicleCI causes RAM issues (meaning very high flakiness).
  
      // if (process.env.GITHUB_ACTIONS && process.env.VIDEO_RECORDING_IS_ENABLED == 1) {
      //   jasmine.getEnv().addReporter({
      //     specStarted: function(result){
      //       let ffmpegArgs = [
      //         '-y',
      //         '-r', '30',
      //         '-f', 'x11grab',
      //         '-s', '1285x1000',
      //         '-i', process.env.DISPLAY,
      //         '-g', '300',
      //         '-loglevel', '16',
      //       ];
      //       const uniqueString = Math.random().toString(36).substring(2,8);
      //       var name = uniqueString + '.mp4';
      //       var dirPath = path.resolve('__dirname', '..', '..', 'protractor-video/');
      //       try {
      //         fs.mkdirSync(dirPath, { recursive: true });
      //       } catch (err) {}
      //       vidPath = path.resolve(dirPath, name);
      //       console.log('Test name: ' + result.fullName + ' has video path ' + vidPath);
      //       ffmpegArgs.push(vidPath);
      //       spw = childProcess.spawn('ffmpeg', ffmpegArgs);
      //       spw.on('message', (message) => {console.log(`ffmpeg stdout: ${message}`)});
      //       spw.on('error', (errorMessage) => {console.error(`ffmpeg stderr: ${errorMessage}`)});
      //       spw.on('close', (code) => {console.log(`ffmpeg exited with code ${code}`)});
      //     },
      //     specDone: function(result) {
      //       spw.kill();
      //       if (result.status == 'passed' && !ALL_VIDEOS && fs.existsSync(vidPath)) {
      //         fs.unlinkSync(vidPath);
      //         console.log(`Video for test: ${result.fullName} was deleted successfully (test passed).`);
      //       }
      //     },
      //   });
      // }
      // else {
      //   console.log(
      //     'Videos will not be recorded for this suite either because videos' +
      //     ' have been disabled for it (using environment variables) or' +
      //     ' because it\'s on CircleCI');
      // }
  
      // This takes screenshots of failed tests. For more information see
      // https://www.npmjs.com/package/protractor-jasmine2-screenshot-reporter
      // jasmine.getEnv().addReporter(new HtmlScreenshotReporter({
      //   // Directory for screenshots.
      //   dest: '../protractor-screenshots',
      //   // Function to build filenames of screenshots.
      //   pathBuilder: function(currentSpec) {
      //     let filename = currentSpec.fullName;
      //     return filename.replace(/[\":<>|*?]/g, 'ESCAPED_CHARACTER');
      //   },
      //   captureOnlyFailedSpecs: true,
      //   reportFailedUrl: true,
      //   preserveDirectory: true
      // }));
  
      // var SpecReporter = require('jasmine-spec-reporter').SpecReporter;
      // jasmine.getEnv().addReporter(new SpecReporter({
      //   displayStacktrace: 'pretty',
      //   displaySpecDuration: true
      // }));
  
      // Set a wide enough window size for the navbar in the library pages to
      // display fully.
      // browser.setWindowSize(1285, 1000);
  
      // Configure the Firebase Admin SDK to communicate with the emulator.
      process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
      FirebaseAdmin.initializeApp({projectId: 'dev-project-id'});
  
      // Navigate to the splash page so that tests can begin on an Angular page.
      // browser.url('http://localhost:9001');
    },
    /**
     * Gets executed before a worker process is spawned and can be used to initialise specific service
     * for that worker as well as modify runtime environments in an async fashion.
     * @param  {String} cid      capability id (e.g 0-0)
     * @param  {[type]} caps     object containing capabilities for session that will be spawn in the worker
     * @param  {[type]} specs    specs to be run in the worker process
     * @param  {[type]} args     object that will be merged with the main configuration once worker is initialized
     * @param  {[type]} execArgv list of string arguments passed to the worker process
     */
    // onWorkerStart: function (cid, caps, specs, args, execArgv) {
    // },
    /**
     * Gets executed just after a worker process has exited.
     * @param  {String} cid      capability id (e.g 0-0)
     * @param  {Number} exitCode 0 - success, 1 - fail
     * @param  {[type]} specs    specs to be run in the worker process
     * @param  {Number} retries  number of retries used
     */
    // onWorkerEnd: function (cid, exitCode, specs, retries) {
    // },
    /**
     * Gets executed just before initialising the webdriver session and test framework. It allows you
     * to manipulate configurations depending on the capability or spec.
     * @param {Object} config wdio configuration object
     * @param {Array.<Object>} capabilities list of capabilities details
     * @param {Array.<String>} specs List of spec file paths that are to be run
     * @param {String} cid worker id (e.g. 0-0)
     */
    // beforeSession: function (config, capabilities, specs, cid) {
    // },
    /**
     * Gets executed before test execution begins. At this point you can access to all global
     * variables like `browser`. It is the perfect place to define custom commands.
     * @param {Array.<Object>} capabilities list of capabilities details
     * @param {Array.<String>} specs        List of spec file paths that are to be run
     * @param {Object}         browser      instance of created browser/device session
     */
    before: function (capabilities, specs) {
      browser.setWindowSize(1285, 1000);
      browser.url('http://localhost:8181');
    },
    /**
     * Runs before a WebdriverIO command gets executed.
     * @param {String} commandName hook command name
     * @param {Array} args arguments that command would receive
     */
    // beforeCommand: function (commandName, args) {
    // },
    /**
     * Hook that gets executed before the suite starts
     * @param {Object} suite suite details
     */
    // beforeSuite: function (suite) {
    // },
    /**
     * Function to be executed before a test (in Mocha/Jasmine) starts.
     */
    // beforeTest: function (test, context) {
    // },
    /**
     * Hook that gets executed _before_ a hook within the suite starts (e.g. runs before calling
     * beforeEach in Mocha)
     */
    // beforeHook: function (test, context) {
    // },
    /**
     * Hook that gets executed _after_ a hook within the suite starts (e.g. runs after calling
     * afterEach in Mocha)
     */
    // afterHook: function (test, context, { error, result, duration, passed, retries }) {
    // },
    /**
     * Function to be executed after a test (in Mocha/Jasmine only)
     * @param {Object}  test             test object
     * @param {Object}  context          scope object the test was executed with
     * @param {Error}   result.error     error object in case the test fails, otherwise `undefined`
     * @param {Any}     result.result    return object of test function
     * @param {Number}  result.duration  duration of test
     * @param {Boolean} result.passed    true if test has passed, otherwise false
     * @param {Object}  result.retries   informations to spec related retries, e.g. `{ attempts: 0, limit: 0 }`
     */
    // afterTest: function(test, context, { error, result, duration, passed, retries }) {
    // },


    /**
     * Hook that gets executed after the suite has ended
     * @param {Object} suite suite details
     */
    // afterSuite: function (suite) {
    // },
    /**
     * Runs after a WebdriverIO command gets executed
     * @param {String} commandName hook command name
     * @param {Array} args arguments that command would receive
     * @param {Number} result 0 - command success, 1 - command error
     * @param {Object} error error object if any
     */
    // afterCommand: function (commandName, args, result, error) {
    // },
    /**
     * Gets executed after all tests are done. You still have access to all global variables from
     * the test.
     * @param {Number} result 0 - test pass, 1 - test fail
     * @param {Array.<Object>} capabilities list of capabilities details
     * @param {Array.<String>} specs List of spec file paths that ran
     */
    // after: function (result, capabilities, specs) {
    // },
    /**
     * Gets executed right after terminating the webdriver session.
     * @param {Object} config wdio configuration object
     * @param {Array.<Object>} capabilities list of capabilities details
     * @param {Array.<String>} specs List of spec file paths that ran
     */
    // afterSession: function (config, capabilities, specs) {
    // },
    /**
     * Gets executed after all workers got shut down and the process is about to exit. An error
     * thrown in the onComplete hook will result in the test run failing.
     * @param {Object} exitCode 0 - success, 1 - fail
     * @param {Object} config wdio configuration object
     * @param {Array.<Object>} capabilities list of capabilities details
     * @param {<Object>} results object containing test results
     */
    // onComplete: function(exitCode, config, capabilities, results) {
    // },
    /**
    * Gets executed when a refresh happens.
    * @param {String} oldSessionId session ID of the old session
    * @param {String} newSessionId session ID of the new session
    */
    // onReload: function(oldSessionId, newSessionId) {
    // }
}
