// Copyright 2012 Google Inc. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Directives that are not associated with reusable components.
 * NB: Reusable component directives should go in the components/ folder.
 *
 * @author sll@google.com (Sean Lip)
 */

// HTML bind directive that trusts the value it is given and also evaluates
// custom directive tags in the provided value.
oppia.directive('angularHtmlBind', ['$compile', function($compile) {
  return {
    restrict: 'A',
    scope: {
      varToBind: '=angularHtmlBind'
    },
    link: function(scope, elm, attrs) {
      scope.$watch('varToBind', function(newValue, oldValue) {
        elm.html(newValue);
        $compile(elm.contents())(scope);
      });
    }
  };
}]);


oppia.directive('mathjaxBind', [function() {
  return {
    restrict: 'A',
    controller: ['$scope', '$element', '$attrs', function($scope, $element, $attrs) {
      $scope.$watch($attrs.mathjaxBind, function(value) {
        var $script = angular.element('<script type="math/tex">')
          .html(value == undefined ? '' : value);
        $element.html('');
        $element.append($script);
        MathJax.Hub.Queue(['Reprocess', MathJax.Hub, $element[0]]);
      });
    }]
  };
}]);


// Highlights the text of an input field when it is clicked.
oppia.directive('selectOnClick', [function() {
  return {
    restrict: 'A',
    link: function(scope, elm, attrs) {
      elm.bind('click', function() {
        this.select();
      });
    }
  };
}]);
