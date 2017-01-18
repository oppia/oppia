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
 * @fileoverview Service that syncs the position of the user in the simple
 * editor with the navigation sidebar, see ScrollSyncDirective.js.
 */

oppia.factory('ScrollSyncService', [
  '$anchorScroll', '$document', '$rootScope', 'QuestionHashService',
  'SimpleEditorManagerService',
  function($anchorScroll, $document, $rootScope, QuestionHashService,
           SimpleEditorManagerService) {
    var targets = [];
    var questionList = SimpleEditorManagerService.getQuestionList();

    var clearHighlighted = function() {
      angular.element('.highlighted').removeClass('highlighted');
    };

    var collapse = function(hash) {
      var questions = questionList.getQuestions();
      for (var i = 0; i < questions.length; i++) {
        if (QuestionHashService.getQuestionHash(questions[i]) === hash) {
          $rootScope.$broadcast(
            'SimpleEditorSidebarToggleCollapse', questions[i]
          );
          break;
        }
      };
    };

    $anchorScroll.yOffset = 80;

    var scrollSyncService = {
      // Add an element to the targets list, when a user scrolls to an element
      // in the target list, the sidebar is updated accordingly.
      addTarget: function(target) {
        targets.push(target);
      },
      // Update the active nav link
      updateActive: function(hash) {
        if (!angular.isDefined(hash)) {
          return;
        } else {
          clearHighlighted();
          var elm = angular.element('#sidebaritem-' + hash);

          if (!(hash === 'intro' || hash === 'title')) {
            elm.addClass('highlighted');
          };

          // Uncollapse the nav link in case hidden
          if (elm.is(':hidden')) {
            collapse(QuestionHashService.getParentQuestionHash(hash));
          };
          // TODO(andromfins): If the nav link is not displayed when the sidebar
          // is overflown, scroll to it.
        }
      },
      // Scroll to an element in the editor given its hash.
      scrollTo: function(hash) {
        $anchorScroll(hash);
      }
    };

    // Onscroll event handler.
    $document.on('scroll', function() {
      // Find the closest positive target (the closest element in the target
      // list to the top of the editor, with a positive distance from it).
      var minPositiveTarget;
      var documentY = $document.scrollTop();
      for (var i = 0, foundPositive = false, minDy; i < targets.length; i++) {
        var dy = targets[i].offset().top - documentY;
        if (dy > 0) {
          if (!foundPositive) {
            minDy = dy;
            minPositiveTarget = targets[i];
            foundPositive = true;
            continue;
          } else {
            if (dy < minDy) {
              minDy = dy;
              minPositiveTarget = targets[i];
            }
          }
        }
      };

      if (!angular.isDefined(minPositiveTarget)) {
        return;
      } else {
        // Update the sidebar active element.
        scrollSyncService.updateActive(minPositiveTarget.attr('id'));
      }
    });

    return scrollSyncService;
}]);
