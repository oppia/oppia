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
 * @fileoverview Service for returning information about a page's
 * context.
 */

oppia.constant('PAGE_CONTEXT', {
  EXPLORATION_EDITOR: 'editor',
  EXPLORATION_PLAYER: 'learner',
  QUESTION_EDITOR: 'question_editor',
  OTHER: 'other'
});

oppia.constant('EXPLORATION_EDITOR_TAB_CONTEXT', {
  EDITOR: 'editor',
  PREVIEW: 'preview'
});

oppia.factory('ContextService', [
  'UrlService', 'EXPLORATION_EDITOR_TAB_CONTEXT', 'PAGE_CONTEXT',
  function(UrlService, EXPLORATION_EDITOR_TAB_CONTEXT, PAGE_CONTEXT) {
    var pageContext = null;
    var explorationId = null;
    var questionId = null;
    var editorContext = null;

    return {
      init: function(editorName) {
        editorContext = editorName;
      },
      // Following method helps to know the whether the context of editor is
      // question editor or exploration editor. The variable editorContext is
      // set from the init function that is called upon initialization in the
      // respective editors.
      getEditorContext: function() {
        return editorContext;
      },
      // Returns a string representing the current tab of the editor (either
      // 'editor' or 'preview'), or null if the current tab is neither of these,
      // or the current page is not the editor.
      getEditorTabContext: function() {
        var hash = UrlService.getHash();
        if (hash.indexOf('#/gui') === 0) {
          return EXPLORATION_EDITOR_TAB_CONTEXT.EDITOR;
        } else if (hash.indexOf('#/preview') === 0) {
          return EXPLORATION_EDITOR_TAB_CONTEXT.PREVIEW;
        } else {
          return null;
        }
      },
      // Returns a string representing the context of the current page.
      // This is PAGE_CONTEXT.EXPLORATION_EDITOR or
      // PAGE_CONTEXT.EXPLORATION_PLAYER or PAGE_CONTEXT.QUESTION_EDITOR.
      // If the current page is not one in either EXPLORATION_EDITOR or
      // EXPLORATION_PLAYER or QUESTION_EDITOR then return PAGE_CONTEXT.OTHER
      getPageContext: function() {
        if (pageContext) {
          return pageContext;
        } else {
          var pathnameArray = UrlService.getPathname().split('/');
          for (var i = 0; i < pathnameArray.length; i++) {
            if (pathnameArray[i] === 'explore' ||
                (pathnameArray[i] === 'embed' &&
                 pathnameArray[i + 1] === 'exploration')) {
              pageContext = PAGE_CONTEXT.EXPLORATION_PLAYER;
              return PAGE_CONTEXT.EXPLORATION_PLAYER;
            } else if (pathnameArray[i] === 'create') {
              pageContext = PAGE_CONTEXT.EXPLORATION_EDITOR;
              return PAGE_CONTEXT.EXPLORATION_EDITOR;
            } else if (pathnameArray[i] === 'question_editor') {
              pageContext = PAGE_CONTEXT.QUESTION_EDITOR;
              return PAGE_CONTEXT.QUESTION_EDITOR;
            }
          }

          return PAGE_CONTEXT.OTHER;
        }
      },

      isInExplorationContext: function() {
        return (this.getPageContext() === PAGE_CONTEXT.EXPLORATION_EDITOR ||
          this.getPageContext() === PAGE_CONTEXT.EXPLORATION_PLAYER);
      },

      isInQuestionContext: function() {
        return (this.getPageContext() === PAGE_CONTEXT.QUESTION_EDITOR);
      },

      // Returns a string representing the explorationId (obtained from the
      // URL).
      getExplorationId: function() {
        if (explorationId) {
          return explorationId;
        } else {
          // The pathname should be one of /explore/{exploration_id} or
          // /create/{exploration_id} or /embed/exploration/{exploration_id}.
          var pathnameArray = UrlService.getPathname().split('/');
          for (var i = 0; i < pathnameArray.length; i++) {
            if (pathnameArray[i] === 'explore' ||
                pathnameArray[i] === 'create') {
              explorationId = pathnameArray[i + 1];
              return pathnameArray[i + 1];
            }
            if (pathnameArray[i] === 'embed') {
              explorationId = pathnameArray[i + 2];
              return explorationId;
            }
          }

          throw Error(
            'ERROR: ContextService should not be used outside the ' +
            'context of an exploration or a question.');
        }
      },

      // Returns a string representing the questionId (obtained from the
      // URL).
      getQuestionId: function() {
        if (questionId) {
          return questionId;
        } else {
          // The pathname should /question_editor/{question_id}.
          var pathnameArray = UrlService.getPathname().split('/');
          for (var i = 0; i < pathnameArray.length; i++) {
            if (pathnameArray[i] === 'question_editor') {
              questionId = pathnameArray[i + 1];
              return pathnameArray[i + 1];
            }
          }

          throw Error(
            'ERROR: ContextService should not be used outside the ' +
            'context of an exploration or a question.');
        }
      },

      // Following method helps to know whether exploration editor is
      // in main editing mode or preview mode.
      isInExplorationEditorMode: function() {
        return (this.getPageContext() === PAGE_CONTEXT.EXPLORATION_EDITOR &&
            this.getEditorTabContext() === (
              EXPLORATION_EDITOR_TAB_CONTEXT.EDITOR));
      },

      isInExplorationEditorPage: function() {
        return this.getPageContext() === PAGE_CONTEXT.EXPLORATION_EDITOR;
      }
    };
  }
]);
