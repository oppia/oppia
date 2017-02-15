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
 * editor with the navigation sidebar, see AnchorHeaderDirective.js.
 */

oppia.factory('ScrollSyncService', [
  '$anchorScroll', '$document', '$rootScope', 'QuestionIdService',
  'SimpleEditorManagerService',
  function($anchorScroll, $document, $rootScope, QuestionIdService,
           SimpleEditorManagerService) {
    var targets = [];
    var questionList = SimpleEditorManagerService.getQuestionList();
    var oppiaNavBarHeight = angular.element('.navbar-container').height();
    var CSS_CLASS_HIGHLIGHTED = 'highlighted';
    var HIGHLIGHTED_ELM_SELECTOR = 'simple-editor-sidebar .highlighted';

    var clearSidebarHighlight = function() {
      angular.element(HIGHLIGHTED_ELM_SELECTOR)
        .removeClass(CSS_CLASS_HIGHLIGHTED);
    };

    var toggleCollapse = function(id) {
      var questions = questionList.getQuestions();
      for (var i = 0; i < questions.length; i++) {
        if (questions[i].getId() === id) {
          questions[i].toggleCollapse();
          $rootScope.$broadcast('SimpleEditorSidebarToggleCollapse');
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
      updateActive: function(id) {
        if (!angular.isDefined(id)) {
          return;
        } else {
          clearSidebarHighlight();
          var elm = angular.element(document.getElementById(
            QuestionIdService.SIDEBAR_PREFIX + id)
          );
          elm.addClass(CSS_CLASS_HIGHLIGHTED);
          if (id === 'intro' || id === 'title') {
            return;
          };

          // Uncollapse the nav link in case hidden
          if (elm.is(':hidden')) {
            toggleCollapse(QuestionIdService.getParentQuestionId(id));
          };
          // TODO(andromfins): If the nav link is not displayed when the sidebar
          // is overflown, scroll to it.
        }
      },
      // Scroll to an element in the editor given its id.
      scrollTo: function(id) {
        $anchorScroll(id);
      }
    };

    // Onscroll event handler.
    $document.on('scroll', function() {
      // Find the closest positive target (the closest element in the target
      // list to the top of the editor, with a positive distance from it).
      var minPositiveTarget;
      var documentY = $document.scrollTop();
      var minDy;
      for (var i = 0; i < targets.length; i++) {
        var dy = targets[i].offset().top - documentY - oppiaNavBarHeight;
        if (dy > 0 && (!angular.isDefined(minPositiveTarget) || dy < minDy)) {
          minDy = dy;
          minPositiveTarget = targets[i];
        }
      };

      if (angular.isDefined(minPositiveTarget)) {
        scrollSyncService.updateActive(minPositiveTarget.attr('id'));
      };
    });

    return scrollSyncService;
  }]);
