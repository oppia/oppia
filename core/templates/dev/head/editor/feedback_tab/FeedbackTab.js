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
 *
 * @author kashida@google.com (Koji Ashida)
 */

oppia.controller('FeedbackTab', [
  '$scope', '$http', '$modal', '$timeout', '$rootScope', 'warningsData',
  'oppiaDatetimeFormatter', 'threadStatusDisplayService',
  'threadDataService', 'explorationStatesService', 'explorationData',
  'changeListService',
  function(
    $scope, $http, $modal, $timeout, $rootScope, warningsData,
    oppiaDatetimeFormatter, threadStatusDisplayService,
    threadDataService, explorationStatesService, explorationData,
    changeListService) {
    var ACTION_ACCEPT_SUGGESTION = 'accept';
    var ACTION_REJECT_SUGGESTION = 'reject';
    $scope.STATUS_CHOICES = threadStatusDisplayService.STATUS_CHOICES;
    $scope.threadData = threadDataService.data;
    $scope.getLabelClass = threadStatusDisplayService.getLabelClass;
    $scope.getHumanReadableStatus = (
      threadStatusDisplayService.getHumanReadableStatus);
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
        templateUrl: 'modals/editorFeedbackCreateThread',
        backdrop: true,
        resolve: {},
        controller: ['$scope', '$modalInstance', function(
          $scope, $modalInstance) {
          $scope.newThreadSubject = '';
          $scope.newThreadText = '';

          $scope.create = function(newThreadSubject, newThreadText) {
            if (!newThreadSubject) {
              warningsData.addWarning('Please specify a thread subject.');
              return;
            }
            if (!newThreadText) {
              warningsData.addWarning('Please specify a message.');
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
        threadDataService.createNewThread(
          result.newThreadSubject, result.newThreadText, function() {
            $scope.clearActiveThread();
          });
      });
    };

    var _isSuggestionOpen = function() {
      return $scope.activeThread.status === 'open';
    };

    var _isSuggestionValid = function() {
      return explorationStatesService.getStates()[
        $scope.activeThread.suggestion.state_name] !== undefined;
    };

    var _hasUnsavedChanges = function() {
      return (changeListService.getChangeList().length > 0);
    };

    $scope.viewSuggestionBtnType = function() {
      return (_isSuggestionOpen() && _isSuggestionValid() &&
              !_hasUnsavedChanges() ? 'primary' : 'default');
    };

    // TODO(Allan): Implement ability to edit suggestions before applying.
    $scope.showSuggestionModal = function() {
      $modal.open({
        templateUrl: 'modals/editorViewSuggestion',
        backdrop: true,
        size: 'lg',
        resolve: {
          suggestionIsOpen: function() {
            return _isSuggestionOpen();
          },
          isSuggestionValid: function() {
            return _isSuggestionValid();
          },
          unsavedChangesExist: function() {
            return _hasUnsavedChanges();
          },
          oldContent: function() {
            var stateName = $scope.activeThread.suggestion.state_name;
            return explorationData.data.states[stateName].content[0].value;
          },
          newContent: function() {
            return $scope.activeThread.suggestion.state_content.value;
          }
        },
        controller: [
          '$scope', '$modalInstance', 'suggestionIsOpen', 'isSuggestionValid',
          'unsavedChangesExist', 'oldContent', 'newContent',
          function(
            $scope, $modalInstance, suggestionIsOpen, isSuggestionValid,
            unsavedChangesExist, oldContent, newContent) {
            var SUGGESTION_NOT_OPEN_MSG = 'This suggestion has already been ' +
              'accepted or rejected.';
            var SUGGESTION_INVALID_MSG = 'This suggestion was made ' +
              'for a state that no longer exists. It cannot be  accepted.';
            var UNSAVED_CHANGES_MSG = 'You have unsaved changes to ' +
              'this exploration. Please discard your unsaved changes if you ' +
              'wish to accept.';
            $scope.canReject = suggestionIsOpen;
            $scope.canAccept = suggestionIsOpen && isSuggestionValid &&
              !unsavedChangesExist;

            if (!suggestionIsOpen) {
              $scope.errorMessage = SUGGESTION_NOT_OPEN_MSG;
            } else if (!isSuggestionValid) {
              $scope.errorMessage = SUGGESTION_INVALID_MSG;
            } else if (unsavedChangesExist) {
              $scope.errorMessage = UNSAVED_CHANGES_MSG;
            } else {
              $scope.errorMessage = '';
            }

            $scope.oldContent = oldContent;
            $scope.newContent = newContent;
            $scope.commitMessage = '';

            $scope.acceptSuggestion = function() {
              $modalInstance.close({
                action: ACTION_ACCEPT_SUGGESTION,
                commitMsg: $scope.commitMessage
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
        threadDataService.resolveSuggestion(
          $scope.activeThread.thread_id, result.action, result.commitMsg,
          function() {
            threadDataService.fetchThreads(function() {
              $scope.setActiveThread($scope.activeThread.thread_id);
            });
            // Immediately update editor to reflect accepted suggestion.
            if (result.action === ACTION_ACCEPT_SUGGESTION) {
              var suggestion = $scope.activeThread.suggestion;
              var stateName = suggestion.state_name;
              var state = explorationData.data.states[stateName];
              state.content[0].value = suggestion.state_content.value;
              explorationData.data.version += 1;
              explorationStatesService.setState(stateName, state);
              $rootScope.$broadcast('refreshStateEditor');
            }
          }, function() {
            console.log('Error resolving suggestion');
          });
      });
    };

    $scope.addNewMessage = function(threadId, tmpText, tmpStatus) {
      if (threadId === null) {
        warningsData.addWarning('Cannot add message to thread with ID: null.');
        return;
      }
      if (!tmpStatus) {
        warningsData.addWarning('Invalid message status: ' + tmpStatus);
        return;
      }

      $scope.messageSendingInProgress = true;
      threadDataService.addNewMessage(threadId, tmpText, tmpStatus, function() {
        _resetTmpMessageFields();
        $scope.messageSendingInProgress = false;
      }, function() {
        $scope.messageSendingInProgress = false;
      });
    };

    $scope.setActiveThread = function(threadId) {
      threadDataService.fetchMessages(threadId);

      var combined = [].concat(
        $scope.threadData.feedbackThreads, $scope.threadData.suggestionThreads);
      for (var i = 0; i < combined.length; i++) {
        if (combined[i].thread_id === threadId) {
          $scope.activeThread = combined[i];
          break;
        }
      }

      $scope.tmpMessage.status = $scope.activeThread.status;
    };

    // Initial load of the thread list on page load.
    $scope.clearActiveThread();
    threadDataService.fetchThreads(function() {
      $timeout(function() {
        $rootScope.loadingMessage = '';
      }, 500);
    });
  }
]);
