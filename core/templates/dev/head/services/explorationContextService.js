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
 * @fileoverview Service for returning information about an exploration's
 * context.
 */

oppia.constant('PAGE_CONTEXT', {
  EDITOR: 'editor',
  LEARNER: 'learner',
  OTHER: 'other'
});

oppia.constant('EDITOR_TAB_CONTEXT', {
  EDITOR: 'editor',
  PREVIEW: 'preview'
});

oppia.factory('explorationContextService', [
  '$window', 'PAGE_CONTEXT', 'EDITOR_TAB_CONTEXT',
  function($window, PAGE_CONTEXT, EDITOR_TAB_CONTEXT) {
    var _pageContext = null;
    var _explorationId = null;

    return {
      // Returns a string representing the current tab of the editor (either
      // 'editor' or 'preview'), or null if the current tab is neither of these,
      // or the current page is not the editor.
      getEditorTabContext: function() {
        var hash = $window.location.hash;
        if (hash.indexOf('#/gui') === 0) {
          return EDITOR_TAB_CONTEXT.EDITOR;
        } else if (hash.indexOf('#/preview') === 0) {
          return EDITOR_TAB_CONTEXT.PREVIEW;
        } else {
          return null;
        }
      },
      // Returns a string representing the context of the current page.
      // This is either PAGE_CONTEXT.EDITOR or PAGE_CONTEXT.LEARNER.
      // If the current page is not one in either EDITOR or LEARNER then
      // return PAGE_CONTEXT.OTHER
      getPageContext: function() {
        if (_pageContext) {
          return _pageContext;
        } else {
          var pathnameArray = $window.location.pathname.split('/');
          for (var i = 0; i < pathnameArray.length; i++) {
            if (pathnameArray[i] === 'explore') {
              _pageContext = PAGE_CONTEXT.LEARNER;
              return PAGE_CONTEXT.LEARNER;
            } else if (pathnameArray[i] === 'create') {
              _pageContext = PAGE_CONTEXT.EDITOR;
              return PAGE_CONTEXT.EDITOR;
            }
          }

          return PAGE_CONTEXT.OTHER;
        }
      },

      isInExplorationContext: function() {
        return (this.getPageContext() === PAGE_CONTEXT.EDITOR ||
          this.getPageContext() === PAGE_CONTEXT.LEARNER);
      },

      // Returns a string representing the explorationId (obtained from the
      // URL).
      getExplorationId: function() {
        if (_explorationId) {
          return _explorationId;
        } else {
          // The pathname should be one of /explore/{exploration_id} or
          // /create/{exploration_id} .
          var pathnameArray = $window.location.pathname.split('/');
          for (var i = 0; i < pathnameArray.length; i++) {
            if (pathnameArray[i] === 'explore' ||
                pathnameArray[i] === 'create') {
              _explorationId = pathnameArray[i + 1];
              return pathnameArray[i + 1];
            }
          }

          throw Error(
            'ERROR: explorationContextService should not be used outside the ' +
            'context of an exploration.');
        }
      },

      // Following variable helps to know whether exploration editor is
      // in main editing mode or preview mode.
      isInExplorationEditorMode: function() {
        return (this.getPageContext() === PAGE_CONTEXT.EDITOR &&
            this.getEditorTabContext() === EDITOR_TAB_CONTEXT.EDITOR);
      }
    };
  }
]);
