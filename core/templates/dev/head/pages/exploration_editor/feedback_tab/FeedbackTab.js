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
 * @fileoverview Controller for the exploration editor feedback tab.
 */

oppia.controller('FeedbackTab', [
  '$scope', '$http', '$modal', '$timeout', '$rootScope', 'AlertsService',
  'oppiaDatetimeFormatter', 'ThreadStatusDisplayService',
  'ThreadDataService', 'explorationStatesService', 'ExplorationDataService',
  'changeListService', 'StateObjectFactory', 'UrlInterpolationService',
  'ACTION_ACCEPT_SUGGESTION', 'ACTION_REJECT_SUGGESTION',
  function(
    $scope, $http, $modal, $timeout, $rootScope, AlertsService,
    oppiaDatetimeFormatter, ThreadStatusDisplayService,
    ThreadDataService, explorationStatesService, ExplorationDataService,
    changeListService, StateObjectFactory, UrlInterpolationService,
    ACTION_ACCEPT_SUGGESTION, ACTION_REJECT_SUGGESTION) {
    $scope.STATUS_CHOICES = ThreadStatusDisplayService.STATUS_CHOICES;
    $scope.threadData = ThreadDataService.data;
    $scope.getLabelClass = ThreadStatusDisplayService.getLabelClass;
    $scope.getHumanReadableStatus = (
      ThreadStatusDisplayService.getHumanReadableStatus);
    $scope.getLocaleAbbreviatedDatetimeString = (
      oppiaDatetimeFormatter.getLocaleAbbreviatedDatetimeString);

    $scope.activeThread = null;
    $rootScope.loadingMessage = 'Loading';
    $scope.tmpMessage = {
      status: null,
      text: ''
    };

    var _resetTmpMessageFields = function() {
      $scope.tmpMessage.status = $scope.activeThread ?
        $scope.activeThread.status : null;
      $scope.tmpMessage.text = '';
    };

    $scope.clearActiveThread = function() {
      $scope.activeThread = null;
      _resetTmpMessageFields();
    };

    $scope.showCreateThreadModal = function() {
      $modal.open({
        templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
          '/pages/exploration_editor/feedback_tab/' +
          'editor_create_feedback_thread_modal_directive.html'),
        backdrop: true,
        resolve: {},
        controller: ['$scope', '$modalInstance', function(
          $scope, $modalInstance) {
          $scope.newThreadSubject = '';
          $scope.newThreadText = '';

          $scope.create = function(newThreadSubject, newThreadText) {
            if (!newThreadSubject) {
              AlertsService.addWarning('Please specify a thread subject.');
              return;
            }
            if (!newThreadText) {
              AlertsService.addWarning('Please specify a message.');
              return;
            }

            $modalInstance.close({
              newThreadSubject: newThreadSubject,
              newThreadText: newThreadText
            });
          };

          $scope.cancel = function() {
            $modalInstance.dismiss('cancel');
          };
        }]
      }).result.then(function(result) {
        ThreadDataService.createNewThread(
          result.newThreadSubject, result.newThreadText, function() {
            $scope.clearActiveThread();
            AlertsService.addSuccessMessage('Feedback thread created.');
          });
      });
    };

    var _isSuggestionOpen = function() {
      return $scope.activeThread.status === 'open';
    };

    var _isSuggestionValid = function() {
      return explorationStatesService.hasState(
        $scope.activeThread.suggestion.state_name);
    };

    var _hasUnsavedChanges = function() {
      return (changeListService.getChangeList().length > 0);
    };

    $scope.getSuggestionButtonType = function() {
      return (_isSuggestionOpen() && _isSuggestionValid() &&
              !_hasUnsavedChanges() ? 'primary' : 'default');
    };

    // TODO(Allan): Implement ability to edit suggestions before applying.
    $scope.showSuggestionModal = function() {
      $modal.open({
        templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
          '/pages/exploration_editor/feedback_tab/' +
          'editor_view_suggestion_modal_directive.html'),
        backdrop: true,
        size: 'lg',
        resolve: {
          suggestionIsOpen: function() {
            return _isSuggestionOpen();
          },
          suggestionIsValid: function() {
            return _isSuggestionValid();
          },
          unsavedChangesExist: function() {
            return _hasUnsavedChanges();
          },
          suggestionStatus: function() {
            return $scope.activeThread.status;
          },
          description: function() {
            return $scope.activeThread.suggestion.description;
          },
          currentContent: function() {
            var state = explorationStatesService.getState(
              $scope.activeThread.suggestion.state_name);
            return state !== undefined ? state.content.getHtml() : null;
          },
          newContent: function() {
            return $scope.activeThread.suggestion.suggestion_html;
          }
        },
        controller: [
          '$scope', '$modalInstance', 'suggestionIsOpen', 'suggestionIsValid',
          'unsavedChangesExist', 'suggestionStatus', 'description',
          'currentContent', 'newContent', 'editabilityService',
          function(
            $scope, $modalInstance, suggestionIsOpen, suggestionIsValid,
            unsavedChangesExist, suggestionStatus, description,
            currentContent, newContent, editabilityService) {
            var SUGGESTION_ACCEPTED_MSG = 'This suggestion has already been ' +
              'accepted.';
            var SUGGESTION_REJECTED_MSG = 'This suggestion has already been ' +
              'rejected.';
            var SUGGESTION_INVALID_MSG = 'This suggestion was made ' +
              'for a state that no longer exists. It cannot be accepted.';
            var UNSAVED_CHANGES_MSG = 'You have unsaved changes to ' +
              'this exploration. Please save/discard your unsaved changes if ' +
              'you wish to accept.';
            $scope.isOpen = suggestionIsOpen;
            $scope.canEdit = editabilityService.isEditable();
            $scope.canReject = $scope.canEdit && $scope.isOpen;
            $scope.canAccept = $scope.canEdit && $scope.isOpen &&
              suggestionIsValid && !unsavedChangesExist;

            if (!$scope.canEdit) {
              $scope.errorMessage = '';
            } else if (!$scope.isOpen) {
              $scope.errorMessage = suggestionStatus === 'fixed' ?
                SUGGESTION_ACCEPTED_MSG : SUGGESTION_REJECTED_MSG;
            } else if (!suggestionIsValid) {
              $scope.errorMessage = SUGGESTION_INVALID_MSG;
            } else if (unsavedChangesExist) {
              $scope.errorMessage = UNSAVED_CHANGES_MSG;
            } else {
              $scope.errorMessage = '';
            }

            $scope.currentContent = currentContent;
            $scope.newContent = newContent;
            $scope.commitMessage = description;

            $scope.acceptSuggestion = function() {
              $modalInstance.close({
                action: ACTION_ACCEPT_SUGGESTION,
                commitMessage: $scope.commitMessage,
                // TODO(sll): If audio files exist for the content being
                // replaced, implement functionality in the modal for the
                // exploration creator to indicate whether this change
                // requires the corresponding audio subtitles to be updated.
                // For now, we default to assuming that the changes are
                // sufficiently small as to warrant no updates.
                audioUpdateRequired: false
              });
            };

            $scope.rejectSuggestion = function() {
              $modalInstance.close({
                action: ACTION_REJECT_SUGGESTION
              });
            };

            $scope.cancelReview = function() {
              $modalInstance.dismiss();
            };
          }
        ]
      }).result.then(function(result) {
        ThreadDataService.resolveSuggestion(
          $scope.activeThread.thread_id, result.action, result.commitMessage,
          result.audioUpdateRequired,
          function() {
            ThreadDataService.fetchThreads(function() {
              $scope.setActiveThread($scope.activeThread.thread_id);
            });
            // Immediately update editor to reflect accepted suggestion.
            if (result.action === ACTION_ACCEPT_SUGGESTION) {
              var suggestion = $scope.activeThread.suggestion;
              var stateName = suggestion.state_name;
              var stateDict = ExplorationDataService.data.states[stateName];
              var state = StateObjectFactory.createFromBackendDict(
                stateName, stateDict);
              state.content.setHtml(suggestion.suggestion_html);
              if (result.audioUpdateRequired) {
                state.content.markAllAudioAsNeedingUpdate();
              }
              ExplorationDataService.data.version += 1;
              explorationStatesService.setState(stateName, state);
              $rootScope.$broadcast('refreshVersionHistory', {
                forceRefresh: true
              });
              $rootScope.$broadcast('refreshStateEditor');
            }
          }, function() {
            console.log('Error resolving suggestion');
          });
      });
    };

    $scope.addNewMessage = function(threadId, tmpText, tmpStatus) {
      if (threadId === null) {
        AlertsService.addWarning('Cannot add message to thread with ID: null.');
        return;
      }
      if (!tmpStatus) {
        AlertsService.addWarning('Invalid message status: ' + tmpStatus);
        return;
      }

      $scope.messageSendingInProgress = true;
      ThreadDataService.addNewMessage(threadId, tmpText, tmpStatus, function() {
        _resetTmpMessageFields();
        $scope.messageSendingInProgress = false;
      }, function() {
        $scope.messageSendingInProgress = false;
      });
    };

    $scope.setActiveThread = function(threadId) {
      ThreadDataService.fetchMessages(threadId);
      ThreadDataService.markThreadAsSeen(threadId);

      var allThreads = [].concat(
        $scope.threadData.feedbackThreads, $scope.threadData.suggestionThreads);
      for (var i = 0; i < allThreads.length; i++) {
        if (allThreads[i].thread_id === threadId) {
          $scope.activeThread = allThreads[i];
          break;
        }
      }

      $scope.tmpMessage.status = $scope.activeThread.status;
    };

    // Initial load of the thread list on page load.
    $scope.clearActiveThread();
    ThreadDataService.fetchFeedbackStats();
    ThreadDataService.fetchThreads(function() {
      $timeout(function() {
        $rootScope.loadingMessage = '';
      }, 500);
    });
  }
]);
