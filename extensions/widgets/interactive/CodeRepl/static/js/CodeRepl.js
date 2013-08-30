var repl = angular.module('repl', []);

// Sets the AngularJS interpolators as <[ and ]>, to not conflict with Django.
repl.config(function($interpolateProvider) {
  $interpolateProvider.startSymbol('<[');
  $interpolateProvider.endSymbol(']>');
});

function CodeRepl($scope) {
  $scope.language = GLOBALS.languae;
  $scope.placeholder = GLOBALS.placeholder;
  $scope.rows = GLOBALS.rows;
  $scope.cols = GLOBALS.columns;

  // Keep the code string given by the user and the stdout from the evaluation
  // until sending them back to the server.
  var code = '';
  var output = '';

  // Set up the jsrepl instance with callbacks set.
  var jsrepl = new JSREPL({
    output: function(out) {
      // For successful evaluation, this is called before 'result', so just keep
      // the output string here.
      output = out;
    },
    result: function(res) {
      sendResponse(res, '');
    },
    error: function(err) {
      if (output) {
        // Part of the error message can be in the output string.
        err += output;
        output = '';
      }
      sendResponse('', err);
    },
    timeout: {
      time: 30000,
      callback: function() {
        sendResponse('', 'timeout');
      },
    },
  });

  jsrepl.loadLanguage(GLOBALS.language, function () {
    // Initialization done. Allow submit.
    document.getElementById('run_button').disabled = false;
  });

  $scope.runCode = function(code_input) {
    code = code_input;
    output = '';

    // Running the code. This triggers one of the callbacks set to jsrepl which
    // then call sendResponse with the result.
    jsrepl.eval(code);
  };

  var sendResponse = function(eval, err) {
    if (parent.location.pathname.indexOf('/learn') === 0) {
      window.parent.postMessage(
          JSON.stringify({
            'submit': {
              code: code,
              output: output,
              evaluation: eval,
              error: err
            }
          }),
          window.location.protocol + '//' + window.location.host);
    }
  };
}
