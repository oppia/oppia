'use strict';

angular.module('doc.ui-codeMirror', ['ui.codemirror', 'prettifyDirective', 'ui.bootstrap', 'plunker' ])
  .controller('CodemirrorCtrl', ['$scope', function ($scope) {

    // The modes
    $scope.modes = ['Scheme', 'XML', 'Javascript'];
    $scope.mode = $scope.modes[0];


    // The ui-codemirror option
    $scope.cmOption = {
      lineNumbers: true,
      indentWithTabs: true,
      onLoad: function (_cm) {

        // HACK to have the codemirror instance in the scope...
        $scope.modeChanged = function () {
          _cm.setOption('mode', $scope.mode.toLowerCase());
        };

      }
    };


    // Initial code content...
    $scope.cmModel = ';; Scheme code in here.\n' +
      '(define (double x)\n\t(* x x))\n\n\n' +
      '<!-- XML code in here. -->\n' +
      '<root>\n\t<foo>\n\t</foo>\n\t<bar/>\n</root>\n\n\n' +
      '// Javascript code in here.\n' +
      'function foo(msg) {\n\tvar r = Math.random();\n\treturn "" + r + " : " + msg;\n}';

  }]);
