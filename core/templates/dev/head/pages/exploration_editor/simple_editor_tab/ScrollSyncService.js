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
 * @fileoverview Service that syncs the postion of the user in the simple editor
 with the navigation sidebar.
 */

oppia.factory('ScrollSyncService', [
  '$anchorScroll', '$document', '$rootScope', 'QuestionHashService',
  function($anchorScroll, $document, $rootScope, QuestionHashService) {
  scrollSyncService = {
    _targets: [],
    _questionList: null,
    addTarget: function(target) {
      this._targets.push(target);
    },
    _clear: function() {
      angular.element('.highlighted').removeClass('highlighted');
    },
    _collapse: function(hash) {
      var question;
      var questionIndex;
      var questions = this._questionList.getQuestions();
      for (var i = 0, questionsLength = questions.length;
            i < questionsLength; i++) {
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
    },
    // Update the active nav link
    updateActive: function(hash) {
      if (!angular.isDefined(hash)) {
        return;
      } else {
        this._clear();
        var elm = angular.element('#si-' + hash);

        if (!(hash === 'intro' || hash === 'title')) {
          elm.addClass('highlighted');
        };

        // Uncollapse the nav link in case hidden
        if (elm.is(':hidden')) {
          this._collapse(QuestionHashService.getParentQuestionHash(hash));
        };
        // TODO: scroll to the nav link in case not displayed
      }
    },
    scrollTo: function(hash) {
      $anchorScroll.yOffset = 80;
      $anchorScroll(hash);
    }
  };

  // Onscroll event handler
  $document.on('scroll', function() {
    var documentY = $document.scrollTop();
    var positiveTargets = {};
    var positiveTargetsDy = [];
    // Find the closest positive target
    for (var i = 0, targetsLength = scrollSyncService._targets.length;
          i < targetsLength; i++) {
      var target = angular.element(scrollSyncService._targets[i]);
      var targetOffset = target.offset().top;
      var dy = targetOffset - documentY;
      if (dy > 0) {
        positiveTargets[dy] = target;
        positiveTargetsDy.push(dy);
      }
    };
    for (var i = 0, targetsLength = positiveTargetsDy.length,
          minPositive = null; i < targetsLength; i++) {
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
