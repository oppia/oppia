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
 * @fileoverview Service for all tutorials to be run only for the first time.
 */

oppia.factory('StateTutorialFirstTimeService', [
  '$http', '$rootScope', 'EditorFirstTimeEventsService',
  function($http, $rootScope, EditorFirstTimeEventsService) {
    // Whether this is the first time the tutorial has been seen by this user.
    var _currentlyInEditorFirstVisit = true;
    var STARTED_EDITOR_TUTORIAL_EVENT_URL = '/createhandler/' +
    'started_tutorial_event';
    var _currentlyInTranslationFirstVisit = true;
    var STARTED_TRANSLATION_TUTORIAL_EVENT_URL = '/createhandler/' +
    'started_translation_tutorial_event';

    return {
      initEditor: function(firstTime, expId) {
        // After the first call to it in a client session, this does nothing.
        if (!firstTime || !_currentlyInEditorFirstVisit) {
          _currentlyInEditorFirstVisit = false;
        }

        if (_currentlyInEditorFirstVisit) {
          $rootScope.$broadcast('enterEditorForTheFirstTime');
          EditorFirstTimeEventsService.initRegisterEvents(expId);
          $http.post(STARTED_EDITOR_TUTORIAL_EVENT_URL + '/' + expId).error(
            function() {
              console.error('Warning: could not record editor tutorial ' +
              'start event.');
            });
        }
      },
      markEditorTutorialFinished: function() {
        if (_currentlyInEditorFirstVisit) {
          $rootScope.$broadcast('openPostTutorialHelpPopover');
          EditorFirstTimeEventsService.registerEditorFirstEntryEvent();
        }

        _currentlyInEditorFirstVisit = false;
      },
      initTranslation: function(firstTime, expId) {
        // After the first call to it in a client session, this does nothing.
        if (!firstTime || !_currentlyInTranslationFirstVisit) {
          _currentlyInTranslationFirstVisit = false;
        }

        if (_currentlyInTranslationFirstVisit) {
          $rootScope.$broadcast('enterTranslationForTheFirstTime');
          EditorFirstTimeEventsService.initRegisterEvents(expId);
          $http.post(STARTED_TRANSLATION_TUTORIAL_EVENT_URL + '/' + expId)
            .error(function() {
              console.error(
                'Warning: could not record translation tutorial start event.'
              );
            });
        }
      },
      markTranslationTutorialFinished: function() {
        if (_currentlyInTranslationFirstVisit) {
          $rootScope.$broadcast('openPostTutorialHelpPopover');
          EditorFirstTimeEventsService.registerEditorFirstEntryEvent();
        }

        _currentlyInTranslationFirstVisit = false;
      },
    };
  }
]);
