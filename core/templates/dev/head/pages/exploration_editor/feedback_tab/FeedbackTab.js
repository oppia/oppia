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
  '$scope', '$http', '$uibModal', '$timeout', '$rootScope', 'AlertsService',
  'DateTimeFormatService', 'ThreadStatusDisplayService',
  'ThreadDataService', 'ExplorationStatesService', 'ExplorationDataService',
  'ChangeListService', 'StateObjectFactory', 'UrlInterpolationService',
  'ACTION_ACCEPT_SUGGESTION', 'ACTION_REJECT_SUGGESTION',
  function(
      $scope, $http, $uibModal, $timeout, $rootScope, AlertsService,
      DateTimeFormatService, ThreadStatusDisplayService,
      ThreadDataService, ExplorationStatesService, ExplorationDataService,
      ChangeListService, StateObjectFactory, UrlInterpolationService,
      ACTION_ACCEPT_SUGGESTION, ACTION_REJECT_SUGGESTION) {
    $scope.STATUS_CHOICES = ThreadStatusDisplayService.STATUS_CHOICES;
    $scope.threadData = ThreadDataService.data;
    $scope.getLabelClass = ThreadStatusDisplayService.getLabelClass;
    $scope.getHumanReadableStatus = (
      ThreadStatusDisplayService.getHumanReadableStatus);
    $scope.getLocaleAbbreviatedDatetimeString = (
      DateTimeFormatService.getLocaleAbbreviatedDatetimeString);

    $scope.activeThread = null;
    $scope.userIsLoggedIn = GLOBALS.userIsLoggedIn;
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
      $uibModal.open({
        templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
          '/pages/exploration_editor/feedback_tab/' +
          'editor_create_feedback_thread_modal_directive.html'),
        backdrop: true,
        resolve: {},
        controller: ['$scope', '$uibModalInstance', function(
            $scope, $uibModalInstance) {
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

            $uibModalInstance.close({
              newThreadSubject: newThreadSubject,
              newThreadText: newThreadText
            });
          };

          $scope.cancel = function() {
            $uibModalInstance.dismiss('cancel');
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

    var _isSuggestionHandled = function() {
      return $scope.activeThread.isSuggestionHandled();
    };

    var _isSuggestionValid = function() {
      return ExplorationStatesService.hasState(
        $scope.activeThread.getSuggestionStateName());
    };

    var _hasUnsavedChanges = function() {
      return (ChangeListService.getChangeList().length > 0);
    };

    $scope.getSuggestionButtonType = function() {
      return (!_isSuggestionHandled() && _isSuggestionValid() &&
              !_hasUnsavedChanges() ? 'primary' : 'default');
    };

    // TODO(Allan): Implement ability to edit suggestions before applying.
    $scope.showSuggestionModal = function() {
      $uibModal.open({
        templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
          '/pages/exploration_editor/feedback_tab/' +
          'editor_view_suggestion_modal_directive.html'),
        backdrop: true,
        size: 'lg',
        resolve: {
          suggestionIsHandled: function() {
            return _isSuggestionHandled();
          },
          suggestionIsValid: function() {
            return _isSuggestionValid();
          },
          unsavedChangesExist: function() {
            return _hasUnsavedChanges();
          },
          suggestionStatus: function() {
            return $scope.activeThread.getSuggestionStatus();
          },
          description: function() {
            return $scope.activeThread.description;
          },
          currentContent: function() {
            var stateName = $scope.activeThread.getSuggestionStateName();
            var state = ExplorationStatesService.getState(stateName);
            return state !== undefined ? state.content.getHtml() : null;
          },
          newContent: function() {
            return $scope.activeThread.getReplacementHtmlFromSuggestion();
          }
        },
        controller: [
          '$scope', '$log', '$uibModalInstance', 'suggestionIsHandled',
          'suggestionIsValid', 'unsavedChangesExist', 'suggestionStatus',
          'description', 'currentContent', 'newContent', 'EditabilityService',
          function(
              $scope, $log, $uibModalInstance, suggestionIsHandled,
              suggestionIsValid, unsavedChangesExist, suggestionStatus,
              description, currentContent, newContent, EditabilityService) {
            var SUGGESTION_ACCEPTED_MSG = 'This suggestion has already been ' +
              'accepted.';
            var SUGGESTION_REJECTED_MSG = 'This suggestion has already been ' +
              'rejected.';
            var SUGGESTION_INVALID_MSG = 'This suggestion was made ' +
              'for a state that no longer exists. It cannot be accepted.';
            var UNSAVED_CHANGES_MSG = 'You have unsaved changes to ' +
              'this exploration. Please save/discard your unsaved changes if ' +
              'you wish to accept.';
            $scope.isNotHandled = !suggestionIsHandled;
            $scope.canEdit = EditabilityService.isEditable();
            $scope.canReject = $scope.canEdit && $scope.isNotHandled;
            $scope.canAccept = $scope.canEdit && $scope.isNotHandled &&
              suggestionIsValid && !unsavedChangesExist;

            if (!$scope.canEdit) {
              $scope.errorMessage = '';
            } else if (!$scope.isNotHandled) {
              $scope.errorMessage = (suggestionStatus === 'accepted' ||
                suggestionStatus === 'fixed') ?
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
            $scope.reviewMessage = null;

            $scope.acceptSuggestion = function() {
              $uibModalInstance.close({
                action: ACTION_ACCEPT_SUGGESTION,
                commitMessage: $scope.commitMessage,
                reviewMessage: $scope.reviewMessage,
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
              $uibModalInstance.close({
                action: ACTION_REJECT_SUGGESTION,
                reviewMessage: $scope.reviewMessage
              });
            };

            $scope.cancelReview = function() {
              $uibModalInstance.dismiss();
            };
          }
        ]
      }).result.then(function(result) {
        ThreadDataService.resolveSuggestion(
          $scope.activeThread.threadId, result.action, result.commitMessage,
          result.reviewMessage, result.audioUpdateRequired, function() {
            ThreadDataService.fetchThreads(function() {
              $scope.setActiveThread($scope.activeThread.threadId);
            });
            // Immediately update editor to reflect accepted suggestion.
            if (result.action === ACTION_ACCEPT_SUGGESTION) {
              var suggestion = $scope.activeThread.getSuggestion();

              var stateName = suggestion.stateName;
              var stateDict = ExplorationDataService.data.states[stateName];
              var state = StateObjectFactory.createFromBackendDict(
                stateName, stateDict);
              state.content.setHtml(
                $scope.activeThread.getReplacementHtmlFromSuggestion());
              if (result.audioUpdateRequired) {
                state.contentIdsToAudioTranslations.markAllAudioAsNeedingUpdate(
                  state.content.getContentId());
              }
              ExplorationDataService.data.version += 1;
              ExplorationStatesService.setState(stateName, state);
              $rootScope.$broadcast('refreshVersionHistory', {
                forceRefresh: true
              });
              $rootScope.$broadcast('refreshStateEditor');
            }
          }, function() {
            $log.error('Error resolving suggestion');
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
        if (allThreads[i].threadId === threadId) {
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
