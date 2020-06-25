// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Invalid syntax .ts file, used by scripts/linters/
 * js_ts_linter_test.py. This file is using throw which is not allowed.
 */

angular.module('oppia').directive('codemirrorMergeview', [
  function() {
    return {
      restrict: 'E',
      link: function(scope, element, attrs) {
        // Require CodeMirror
        if (angular.isUndefined(window.CodeMirror)) {
          throw 'CodeMirror not found.'; // Use of throw is not allowed.
        }
      }
    };
  }]
);
