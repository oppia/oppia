// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to display suggestion modal in creator view.
 */
require('components/ck-editor-helpers/ck-editor-4-rte.component.ts');
require('components/ck-editor-helpers/ck-editor-4-widgets.initializer.ts');

require('domain/utilities/url-interpolation.service.ts');
require('services/suggestion-modal.service.ts');
require(
  'pages/creator-dashboard-page/suggestion-modal-for-creator-view/' +
  'suggestion-modal-for-creator-view.controller');

angular.module('oppia').factory('SuggestionModalForCreatorDashboardService', [
  '$http', '$log', '$uibModal', 'UrlInterpolationService',
  function(
      $http, $log, $uibModal, UrlInterpolationService) {
    var _showEditStateContentSuggestionModal = function(
        activeThread, suggestionsToReviewList, clearActiveThread,
        canReviewActiveThread) {
      $uibModal.open({
        templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
          '/pages/creator-dashboard-page/suggestion-modal-for-creator-view/' +
          'suggestion-modal-for-creator-view.directive.html'
        ),
        backdrop: 'static',
        size: 'lg',
        resolve: {
          suggestionIsHandled: function() {
            return activeThread.isSuggestionHandled();
          },
          suggestionStatus: function() {
            return activeThread.getSuggestionStatus();
          },
          description: function() {
            return activeThread.description;
          },
          oldContent: function() {
            return activeThread.suggestion.oldValue;
          },
          newContent: function() {
            return activeThread.suggestion.newValue;
          },
          canReviewActiveThread: function() {
            return canReviewActiveThread;
          },
          stateName: function() {
            return activeThread.suggestion.stateName;
          },
          suggestionType: function() {
            return activeThread.suggestion.suggestionType;
          }
        },
        controller: 'SuggestionModalForCreatorViewController'
      }).result.then(function(result) {
        var RESUBMIT_SUGGESTION_URL_TEMPLATE = (
          '/suggestionactionhandler/resubmit/<suggestion_id>');
        var HANDLE_SUGGESTION_URL_TEMPLATE = (
          '/suggestionactionhandler/<target_type>/<target_id>/<suggestion_id>');

        var url = null;
        var data = null;
        if (result.action === 'resubmit' &&
            result.suggestionType === 'edit_exploration_state_content') {
          url = UrlInterpolationService.interpolateUrl(
            RESUBMIT_SUGGESTION_URL_TEMPLATE, {
              suggestion_id: activeThread.suggestion.suggestionId
            }
          );
          data = {
            action: result.action,
            summary_message: result.summaryMessage,
            change: {
              cmd: 'edit_state_property',
              property_name: 'content',
              state_name: result.stateName,
              old_value: result.oldContent,
              new_value: {
                html: result.newSuggestionHtml
              }
            }
          };
        } else {
          url = UrlInterpolationService.interpolateUrl(
            HANDLE_SUGGESTION_URL_TEMPLATE, {
              target_type: activeThread.suggestion.targetType,
              target_id: activeThread.suggestion.targetId,
              suggestion_id: activeThread.suggestion.suggestionId
            }
          );
          data = {
            action: result.action,
            commit_message: result.commitMessage,
            review_message: result.reviewMessage
          };
        }

        $http.put(url, data).then(function() {
          for (var i = 0; i < suggestionsToReviewList.length; i++) {
            if (suggestionsToReviewList[i] === activeThread) {
              suggestionsToReviewList.splice(i, 1);
              break;
            }
          }
          clearActiveThread();
        }).catch(function() {
          $log.error('Error resolving suggestion');
        });
      }, () => {
        // Note to developers:
        // This callback is triggered when the Cancel button is clicked.
        // No further action is needed.
      });
    };

    return {
      showSuggestionModal: function(suggestionType, extraParams) {
        if (suggestionType === 'edit_exploration_state_content') {
          _showEditStateContentSuggestionModal(
            extraParams.activeThread,
            extraParams.suggestionsToReviewList,
            extraParams.clearActiveThread,
            extraParams.canReviewActiveThread
          );
        }
      }
    };
  }
]);
