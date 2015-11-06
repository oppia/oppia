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
 * @fileoverview Factory for handling the current active input. In general,
 * there are many input fields in the view that get displayed when a button is
 * clicked, and we want only one of these to be active at a time.
 *
 * @author sll@google.com (Sean Lip)
 */

// TODO(sll): on-blur, this value should revert to '' unless the user has
// clicked inside another input box.
oppia.factory('activeInputData', [function() {
  var activeInputData = {
    name: '',
    scope: null,
    teardown: null
  };

  activeInputData.changeActiveInput = function(name, scope, setup, teardown) {
    if (activeInputData.teardown) {
      activeInputData.teardown(activeInputData.scope);
    }
    activeInputData.name = name;
    activeInputData.scope = scope;
    activeInputData.teardown = teardown;
    if (setup) {
      setup(scope);
    }
  };

  activeInputData.clear = function() {
    activeInputData.changeActiveInput('', null, null, null);
  };

  return activeInputData;
}]);
