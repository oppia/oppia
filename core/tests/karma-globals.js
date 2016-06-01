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
 * @fileoverview Globals for the Karma test environment.
 */

var GLOBALS = {
  INTERACTION_SPECS: {},
  GADGET_SPECS: {},
  PANEL_SPECS: {}
};

/* This function overwrites the translationProvider for a dummy function
 * (customLoader). This is necessary to prevent the js test warnings about an
 * "unexpected GET request" when the translationProvider tries to load the
 * translation files.
 * More info in the angular-translate documentation:
 *   http://angular-translate.github.io/docs/#/guide
 * (see the "Unit Testing" section).
 */
GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS = function($provide, $translateProvider) {
  $provide.factory('customLoader', function($q) {
    return function() {
      var deferred = $q.defer();
      deferred.resolve({});
      return deferred.promise;
    };
  });
  $translateProvider.useLoader('customLoader');
};
