// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the codemirror mergeview component.
 */

oppia.directive('codemirrorMergeview', [
  function() {
    return {
      restrict: 'E',
      link: function(scope, element, attrs) {
        // Require CodeMirror
        if (angular.isUndefined(window.CodeMirror)) {
          throw new Error('CodeMirror not found.');
        }

        var options = scope.$eval(attrs.options);
        // 'value', 'orig' are initial values of left and right
        // pane respectively
        var codeMirrorInstance = new window.CodeMirror.MergeView(
          element[0], angular.extend({
            value: ' ',
            orig: ' '
          }, options));

        if (!attrs.leftValue) {
          throw new Error('Left pane value is not defined.');
        }
        if (!attrs.rightValue) {
          throw new Error('Right pane value is not defined.');
        }

        // Watch for changes and set value in left pane
        scope.$watch(attrs.leftValue, function(newValue) {
          if (angular.isString(newValue)) {
            codeMirrorInstance.edit.setValue(newValue);
          }
        });

        // Watch for changes and set value in right pane
        scope.$watch(attrs.rightValue, function(newValue) {
          if (angular.isString(newValue)) {
            codeMirrorInstance.right.orig.setValue(newValue);
          }
        });
      }
    };
  }]
);
