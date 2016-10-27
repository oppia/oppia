// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for maintaining the 'mode' of the exploration editor.
 */

oppia.factory('EditorModeService', [function() {
  var EDITOR_MODE_SIMPLE = 'simple';
  var EDITOR_MODE_FULL = 'full';

  var mode = EDITOR_MODE_FULL;

  return {
    isEditorInSimpleMode: function() {
      return mode === EDITOR_MODE_SIMPLE;
    },
    isEditorInFullMode: function() {
      return mode === EDITOR_MODE_FULL;
    },
    setModeToSimple: function() {
      mode = EDITOR_MODE_SIMPLE;
    },
    setModeToFull: function() {
      mode = EDITOR_MODE_FULL;
    }
  };
}]);
