// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview It keeps track of sidebar mode in simple editor. It provides
 * two modes: ReadOnly and Edit.
 */

oppia.factory('SimpleEditorSidebarModeService', [
  function() {
    var SIDEBAR_MODE_READONLY = 'readonly';
    var SIDEBAR_MODE_EDIT = 'edit';

    var mode = SIDEBAR_MODE_READONLY;

    return {
      isSidebarInReadonlyMode: function() {
        return mode === SIDEBAR_MODE_READONLY;
      },
      isSidebarInEditMode: function() {
        return mode === SIDEBAR_MODE_EDIT;
      },
      setModeToReadonly: function() {
        mode = SIDEBAR_MODE_READONLY;
      },
      setModeToEdit: function() {
        mode = SIDEBAR_MODE_EDIT;
      }
    };
  }]);
