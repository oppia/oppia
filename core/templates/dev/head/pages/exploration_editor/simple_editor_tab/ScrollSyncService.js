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
 * @fileoverview Service that syncs the position of the user in the simple editor
 with the navigation sidebar.
 */

oppia.factory('ScrollSyncService', [
  '$anchorScroll', '$document', '$rootScope', 'QuestionHashService',
  'SimpleEditorManagerService',
  function($anchorScroll, $document, $rootScope, QuestionHashService,
           SimpleEditorManagerService) {
    var targets = [];
    var questionList = SimpleEditorManagerService.getQuestionList();
    var clear = function() {
      angular.element('.highlighted').removeClass('highlighted');
    };
    var collapse = function(hash) {
      var question;
      var questionIndex;
      var questions = questionList.getQuestions();
      for (var i = 0; i < questions.length; i++) {
        if (QuestionHashService.getHash(questions[i]) === hash) {
          questionIndex = i;
          break;
        }
      };
      if (!angular.isDefined(questionIndex)) {
        return;
      };
      question = questions[questionIndex];
      $rootScope.$broadcast('SimpleEditorSidebarLinkCollapse', question);
    };
    $anchorScroll.yOffset = 80;

    var scrollSyncService = {
      // Add an element to the targets list, when a user scrolls to an element
      // in the target list to sidebar is updated accordingly.
      addTarget: function(target) {
        targets.push(target);
      },
      // Update the active nav link
      updateActive: function(hash) {
        if (!angular.isDefined(hash)) {
          return;
        } else {
          clear();
          var elm = angular.element('#si-' + hash);

          if (!(hash === 'intro' || hash === 'title')) {
            elm.addClass('highlighted');
          };

          // Uncollapse the nav link in case hidden
          if (elm.is(':hidden')) {
            collapse(QuestionHashService.getParentQuestionHash(hash));
          };
          // TODO: scroll to the nav link in case not displayed
        }
      },
      // Scroll to an element in the editor given it's id.
      scrollTo: function(hash) {
        $anchorScroll(hash);
      }
    };

    // Onscroll event handler
    $document.on('scroll', function() {
      var documentY = $document.scrollTop();
      var positiveTargets = {};
      var positiveTargetsDy = [];
      // Find the closest positive target (the closest element in the target
      // list to the top of the editor, with a positive distance from it.)
      for (var i = 0; i < targets.length; i++) {
        var target = angular.element(targets[i]);
        var targetOffset = target.offset().top;
        var dy = targetOffset - documentY;
        if (dy > 0) {
          positiveTargets[dy] = target;
          positiveTargetsDy.push(dy);
        }
      };
      for (var i = 0, minPositive = null; i < positiveTargetsDy.length; i++) {
        if (i === 0) {
          minPositive = positiveTargetsDy[i];
          continue;
        } else {
          var dy = positiveTargetsDy[i];
          if (minPositive > dy) {
            minPositive = dy;
          }
        }
      };
      if (minPositive === null) {
        return;
      } else {
        // Update the sidebar active element
        var closestTarget = positiveTargets[minPositive];
        scrollSyncService.updateActive(closestTarget.attr('id'));
      }
    });

    return scrollSyncService;
}]);

// Used to mark parts of the editor that have a sidebar item associated to it.
oppia.directive('scrollSync', ['ScrollSyncService', function(ScrollSyncService) {
  return {
    restrict: 'A',
    link: function(scope, element) {
      ScrollSyncService.addTarget(element);
    }
  };
}]);
