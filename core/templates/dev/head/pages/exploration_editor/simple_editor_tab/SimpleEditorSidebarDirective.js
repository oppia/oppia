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
 * @fileoverview Directive for the sidebar of the simple editor.
 */

oppia.factory('ScrollSyncService', ['$anchorScroll', '$document', '$rootScope',
  function($anchorScroll, $document, $rootScope) {
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
        if (questions[i].getHash() === hash) {
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
    // Get Question id given a child id.
    getQuestionHash: function(childHash) {
      var hash = childHash.split('-');
      if (hash.length > 2) {
        return hash.slice(0, 2).join('-');
      } else {
        return hash[0];
      }
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
          this._collapse(this.getQuestionHash(hash));
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

oppia.directive('simpleEditorSidebar', [function() {
  return {
    restrict: 'E',
    templateUrl: 'simpleEditor/sidebar',
    controller: [
       '$scope', 'EditorModeService', 'SimpleEditorManagerService',
        'ScrollSyncService',
        function($scope, EditorModeService, SimpleEditorManagerService,
                 ScrollSyncService) {
      $scope.SUBFIELD_LABELS = [
        {label: 'Multiple choice', abbr: 'mc'},
        {label: 'Correct answer', abbr: 'ca'},
        {label: 'Hints', abbr: 'hint'},
        {label: 'Bridge text', abbr: 'bt'}
      ];
      $scope.setEditorModeToFull = EditorModeService.setModeToFull;
      $scope.questionList = ScrollSyncService._questionList = SimpleEditorManagerService.getQuestionList();
      $scope.scrollTo = function(hash) {
        ScrollSyncService.scrollTo(hash);
      };
      $scope.collapse = function(question) {
        if (!angular.isDefined(question.collapsed)) {
          question.collapsed = false;
        } else {
          question.collapsed = !question.collapsed;
        }
      };
      $scope.$on('SimpleEditorSidebarLinkCollapse', function(event, question) {
        $scope.collapse(question);
        $scope.$apply();
      });
      $scope.isCollapsed = function(question) {
        if (!angular.isDefined(question.collapsed)) {
          question.collapsed = false;
        };
        return question.collapsed;
      };
    }]
  };
}]);
