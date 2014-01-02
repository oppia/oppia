var repl = angular.module('repl', ['ui.codemirror']);

// Sets the AngularJS interpolators as <[ and ]>, to not conflict with Django.
repl.config(function($interpolateProvider) {
  $interpolateProvider.startSymbol('<[');
  $interpolateProvider.endSymbol(']>');
});

function CodeRepl($scope) {
  $scope.language = GLOBALS.language;
  $scope.preCode = GLOBALS.preCode;
  $scope.postCode = GLOBALS.postCode;

  // Keep the code string given by the user and the stdout from the evaluation
  // until sending them back to the server.
  $scope.code = GLOBALS.placeholder;
  $scope.output = '';

  // Options for the ui-codemirror display.
  $scope.codemirrorOptions = {
    lineNumbers: true,
    indentWithTabs: true,
    // Note that only 'coffeescript', 'javascript', 'lua', 'python', 'ruby' and
    // 'scheme' have CodeMirror-supported syntax highlighting. For other
    // languages, highlighting will not happen.
    mode: $scope.language
  };

  // Set up the jsrepl instance with callbacks set.
  var jsrepl = new JSREPL({
    output: function(out) {
      // For successful evaluation, this is called before 'result', so just keep
      // the output string here.
      $scope.output = out;
    },
    result: function(res) {
      sendResponse(res, '');
    },
    error: function(err) {
      if ($scope.output) {
        // Part of the error message can be in the output string.
        err += $scope.output;
        $scope.output = '';
      }
      sendResponse('', err);
    },
    timeout: {
      time: 10000,
      callback: function() {
        sendResponse('', 'timeout');
      },
    },
  });

  jsrepl.loadLanguage(GLOBALS.language, function () {
    // Initialization done. Allow submit.
    window.parent.postMessage(
        {'widgetHeight': document.body.scrollHeight},
        window.location.protocol + '//' + window.location.host);

    document.getElementById('run_button').disabled = false;
  });

  $scope.runCode = function(codeInput) {
    $scope.code = codeInput;
    $scope.output = '';

    // Running the code. This triggers one of the callbacks set to jsrepl which
    // then calls sendResponse with the result.
    var fullCode = $scope.preCode + '\n' + codeInput + '\n' + $scope.postCode;
    console.log(fullCode);
    jsrepl.eval(fullCode);
  };

  var sendResponse = function(evaluation, err) {
    $scope.evaluation = (evaluation || '');
    $scope.err = (err || '');
    if (parent.location.pathname.indexOf('/explore') === 0) {
      window.parent.postMessage(
          JSON.stringify({
            'submit': {
              code: $scope.code,
              output: $scope.output,
              evaluation: $scope.evaluation,
              error: $scope.err
            }
          }),
          window.location.protocol + '//' + window.location.host);
    }
  };
}
