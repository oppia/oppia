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
 *  @fileoverview Service for handling all interactions
 *  with the exploration editor backend.
 */

oppia.factory('ExplorationDataService', [
  '$http', '$log', '$q', '$window', 'AlertsService',
  'EditableExplorationBackendApiService', 'LocalStorageService',
  'ReadOnlyExplorationBackendApiService',
  'StateTopAnswersStatsBackendApiService', 'UrlService',
  function($http, $log, $q, $window, AlertsService,
      EditableExplorationBackendApiService, LocalStorageService,
      ReadOnlyExplorationBackendApiService,
      StateTopAnswersStatsBackendApiService, UrlService) {
    // The pathname (without the hash) should be: .../create/{exploration_id}
    var explorationId = '';
    var draftChangeListId = null;
    var pathnameArray = UrlService.getPathname().split('/');
    for (var i = 0; i < pathnameArray.length; i++) {
      if (pathnameArray[i] === 'create') {
        var explorationId = pathnameArray[i + 1];
        break;
      }
    }
    if (!explorationId) {
      $log.error(
        'Unexpected call to ExplorationDataService for pathname ',
        pathnameArray[i]);
      // Note: if we do not return anything, Karma unit tests fail.
      return {};
    }

    var resolvedAnswersUrlPrefix = (
      '/createhandler/resolved_answers/' + explorationId);
    var explorationDraftAutosaveUrl = '';
    if (GLOBALS.can_edit) {
      explorationDraftAutosaveUrl = (
        '/createhandler/autosave_draft/' + explorationId);
    } else if (GLOBALS.can_translate) {
      explorationDraftAutosaveUrl = (
        '/createhandler/autosave_translation_draft/' + explorationId);
    }


    // Put exploration variables here.
    var explorationData = {
      explorationId: explorationId,
      // Note that the changeList is the full changeList since the last
      // committed version (as opposed to the most recent autosave).
      autosaveChangeList: function(changeList, successCallback, errorCallback) {
        // First save locally to be retrieved later if save is unsuccessful.
        LocalStorageService.saveExplorationDraft(
          explorationId, changeList, draftChangeListId);
        $http.put(explorationDraftAutosaveUrl, {
          change_list: changeList,
          version: explorationData.data.version
        }).then(function(response) {
          draftChangeListId = response.data.draft_change_list_id;
          // We can safely remove the locally saved draft copy if it was saved
          // to the backend.
          LocalStorageService.removeExplorationDraft(explorationId);
          if (successCallback) {
            successCallback(response);
          }
        }, function() {
          if (errorCallback) {
            errorCallback();
          }
        });
      },
      discardDraft: function(successCallback, errorCallback) {
        $http.post(explorationDraftAutosaveUrl, {}).then(function() {
          LocalStorageService.removeExplorationDraft(explorationId);
          if (successCallback) {
            successCallback();
          }
        }, function() {
          if (errorCallback) {
            errorCallback();
          }
        });
      },
      // Returns a promise that supplies the data for the current exploration.
      getData: function(errorCallback) {
        if (explorationData.data) {
          $log.info('Found exploration data in cache.');
          return $q.resolve(explorationData.data);
        } else {
          // Retrieve data from the server.
          // WARNING: Note that this is a version of the exploration with draft
          // changes applied. This makes a force-refresh necessary when changes
          // are discarded, otherwise the exploration-with-draft-changes
          // (which is cached here) will be reused.
          return Promise.all([
            EditableExplorationBackendApiService.fetchApplyDraftExploration(
              explorationId).then(function(response) {
              $log.info('Retrieved exploration data.');
              $log.info(response);
              draftChangeListId = response.draft_change_list_id;
              explorationData.data = response;
              var draft = LocalStorageService.getExplorationDraft(
                explorationId);
              if (draft) {
                if (draft.isValid(draftChangeListId)) {
                  var changeList = draft.getChanges();
                  explorationData.autosaveChangeList(changeList, function() {
                    // A reload is needed so that the changelist just saved is
                    // loaded as opposed to the exploration returned by this
                    // response.
                    $window.location.reload();
                  });
                } else {
                  errorCallback(explorationId, draft.getChanges());
                }
              }
              return response;
            }),
            StateTopAnswersStatsBackendApiService.fetchStats(explorationId),
          ]).then(function(promisedValues) {
            var response = promisedValues[0];
            response.stateTopStats = promisedValues[1];
            return response;
          });
        }
      },
      // Returns a promise supplying the last saved version for the current
      // exploration.
      getLastSavedData: function() {
        return ReadOnlyExplorationBackendApiService.loadLatestExploration(
          explorationId).then(function(response) {
          $log.info('Retrieved saved exploration data.');
          $log.info(response);

          return response.exploration;
        });
      },
      resolveAnswers: function(stateName, resolvedAnswersList) {
        AlertsService.clearWarnings();
        $http.put(
          resolvedAnswersUrlPrefix + '/' + encodeURIComponent(stateName), {
            resolved_answers: resolvedAnswersList
          }
        );
      },
      /**
       * Saves the exploration to the backend, and, on a success callback,
       * updates the local copy of the exploration data.
       * @param {object} changeList - Represents the change list for
       *   this save. Each element of the list is a command representing an
       *   editing action (such as add state, delete state, etc.). See the
       *  _'Change' class in exp_services.py for full documentation.
       * @param {string} commitMessage - The user-entered commit message for
       *   this save operation.
       */
      save: function(
          changeList, commitMessage, successCallback, errorCallback) {
        EditableExplorationBackendApiService.updateExploration(explorationId,
          explorationData.data.version, commitMessage, changeList).then(
          function(response) {
            AlertsService.clearWarnings();
            explorationData.data = response;
            if (successCallback) {
              successCallback(
                response.is_version_of_draft_valid,
                response.draft_changes);
            }
          }, function() {
            if (errorCallback) {
              errorCallback();
            }
          }
        );
      }
    };

    return explorationData;
  }
]);
