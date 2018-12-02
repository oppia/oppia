// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for the state Translation tutorial.
 */

oppia.factory('StateTranslationTutorialFirstTimeService', [
  '$http', '$rootScope', 'EditorFirstTimeEventsService',
  function($http, $rootScope, EditorFirstTimeEventsService) {
    // Whether this is the first time the tutorial has been seen by this user.
    var _currentlyInFirstVisit = true;

    var STARTED_TUTORIAL_EVENT_URL = '/createhandler/' +
    'started_translation_tutorial' +
    '_event';

    return {
      // After the first call to it in a client session, this does nothing.
      init: function(firstTime, expId) {
        if (firstTime && _currentlyInFirstVisit) {
          $rootScope.$broadcast('enterTranslationForTheFirstTime');
          EditorFirstTimeEventsService.initRegisterEvents(expId);

          $http.post(STARTED_TUTORIAL_EVENT_URL + '/' + expId).error(
            function() {
              console.error(
                'Warning: could not record tutorial start event.'
              );
            });
          _currentlyInFirstVisit = false;
        }
      },
      markTutorialFinished: function() {
        if (_currentlyInFirstVisit) {
          $rootScope.$broadcast('openPostTutorialHelpPopover');
          EditorFirstTimeEventsService.registerEditorFirstEntryEvent();
        }

        _currentlyInFirstVisit = false;
      },
    };
  }
]);
