(window["webpackJsonp"] = window["webpackJsonp"] || []).push([["admin~app~collection_editor~creator_dashboard~exploration_editor~exploration_player~skill_editor~sto~7c5e036a"],{

/***/ "./core/templates/dev/head/services/ContextService.ts":
/*!************************************************************!*\
  !*** ./core/templates/dev/head/services/ContextService.ts ***!
  \************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

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
    function (UrlService, EXPLORATION_EDITOR_TAB_CONTEXT, PAGE_CONTEXT) {
        var pageContext = null;
        var explorationId = null;
        var questionId = null;
        var editorContext = null;
        return {
            init: function (editorName) {
                editorContext = editorName;
            },
            // Following method helps to know the whether the context of editor is
            // question editor or exploration editor. The variable editorContext is
            // set from the init function that is called upon initialization in the
            // respective editors.
            getEditorContext: function () {
                return editorContext;
            },
            // Returns a string representing the current tab of the editor (either
            // 'editor' or 'preview'), or null if the current tab is neither of these,
            // or the current page is not the editor.
            getEditorTabContext: function () {
                var hash = UrlService.getHash();
                if (hash.indexOf('#/gui') === 0) {
                    return EXPLORATION_EDITOR_TAB_CONTEXT.EDITOR;
                }
                else if (hash.indexOf('#/preview') === 0) {
                    return EXPLORATION_EDITOR_TAB_CONTEXT.PREVIEW;
                }
                else {
                    return null;
                }
            },
            // Returns a string representing the context of the current page.
            // This is PAGE_CONTEXT.EXPLORATION_EDITOR or
            // PAGE_CONTEXT.EXPLORATION_PLAYER or PAGE_CONTEXT.QUESTION_EDITOR.
            // If the current page is not one in either EXPLORATION_EDITOR or
            // EXPLORATION_PLAYER or QUESTION_EDITOR then return PAGE_CONTEXT.OTHER
            getPageContext: function () {
                if (pageContext) {
                    return pageContext;
                }
                else {
                    var pathnameArray = UrlService.getPathname().split('/');
                    for (var i = 0; i < pathnameArray.length; i++) {
                        if (pathnameArray[i] === 'explore' ||
                            (pathnameArray[i] === 'embed' &&
                                pathnameArray[i + 1] === 'exploration')) {
                            pageContext = PAGE_CONTEXT.EXPLORATION_PLAYER;
                            return PAGE_CONTEXT.EXPLORATION_PLAYER;
                        }
                        else if (pathnameArray[i] === 'create') {
                            pageContext = PAGE_CONTEXT.EXPLORATION_EDITOR;
                            return PAGE_CONTEXT.EXPLORATION_EDITOR;
                        }
                        else if (pathnameArray[i] === 'question_editor') {
                            pageContext = PAGE_CONTEXT.QUESTION_EDITOR;
                            return PAGE_CONTEXT.QUESTION_EDITOR;
                        }
                    }
                    return PAGE_CONTEXT.OTHER;
                }
            },
            isInExplorationContext: function () {
                return (this.getPageContext() === PAGE_CONTEXT.EXPLORATION_EDITOR ||
                    this.getPageContext() === PAGE_CONTEXT.EXPLORATION_PLAYER);
            },
            isInQuestionContext: function () {
                return (this.getPageContext() === PAGE_CONTEXT.QUESTION_EDITOR);
            },
            // Returns a string representing the explorationId (obtained from the
            // URL).
            getExplorationId: function () {
                if (explorationId) {
                    return explorationId;
                }
                else {
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
                    throw Error('ERROR: ContextService should not be used outside the ' +
                        'context of an exploration or a question.');
                }
            },
            // Returns a string representing the questionId (obtained from the
            // URL).
            getQuestionId: function () {
                if (questionId) {
                    return questionId;
                }
                else {
                    // The pathname should /question_editor/{question_id}.
                    var pathnameArray = UrlService.getPathname().split('/');
                    for (var i = 0; i < pathnameArray.length; i++) {
                        if (pathnameArray[i] === 'question_editor') {
                            questionId = pathnameArray[i + 1];
                            return pathnameArray[i + 1];
                        }
                    }
                    throw Error('ERROR: ContextService should not be used outside the ' +
                        'context of an exploration or a question.');
                }
            },
            // Following method helps to know whether exploration editor is
            // in main editing mode or preview mode.
            isInExplorationEditorMode: function () {
                return (this.getPageContext() === PAGE_CONTEXT.EXPLORATION_EDITOR &&
                    this.getEditorTabContext() === (EXPLORATION_EDITOR_TAB_CONTEXT.EDITOR));
            },
            isInExplorationEditorPage: function () {
                return this.getPageContext() === PAGE_CONTEXT.EXPLORATION_EDITOR;
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/services/HtmlEscaperService.ts":
/*!****************************************************************!*\
  !*** ./core/templates/dev/head/services/HtmlEscaperService.ts ***!
  \****************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

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
 * @fileoverview Service for HTML serialization and escaping.
 */
oppia.factory('HtmlEscaperService', ['$log', function ($log) {
        var htmlEscaper = {
            objToEscapedJson: function (obj) {
                return this.unescapedStrToEscapedStr(JSON.stringify(obj));
            },
            escapedJsonToObj: function (json) {
                if (!json) {
                    $log.error('Empty string was passed to JSON decoder.');
                    return '';
                }
                return JSON.parse(this.escapedStrToUnescapedStr(json));
            },
            unescapedStrToEscapedStr: function (str) {
                return String(str)
                    .replace(/&/g, '&amp;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#39;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;');
            },
            escapedStrToUnescapedStr: function (value) {
                return String(value)
                    .replace(/&quot;/g, '"')
                    .replace(/&#39;/g, '\'')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&amp;/g, '&');
            }
        };
        return htmlEscaper;
    }]);


/***/ }),

/***/ "./core/templates/dev/head/services/contextual/UrlService.ts":
/*!*******************************************************************!*\
  !*** ./core/templates/dev/head/services/contextual/UrlService.ts ***!
  \*******************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

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
 * @fileoverview Service for manipulating the page URL. Also allows
 * functions on $window to be mocked in unit tests.
 */
oppia.factory('UrlService', ['$window', function ($window) {
        return {
            // This function is for testing purposes (to mock $window.location)
            getCurrentLocation: function () {
                return $window.location;
            },
            getCurrentQueryString: function () {
                return this.getCurrentLocation().search;
            },
            /* As params[key] is overwritten, if query string has multiple fieldValues
               for same fieldName, use getQueryFieldValuesAsList(fieldName) to get it
               in array form. */
            getUrlParams: function () {
                var params = {};
                var parts = this.getCurrentQueryString().replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
                    params[decodeURIComponent(key)] = decodeURIComponent(value);
                });
                return params;
            },
            isIframed: function () {
                var pathname = this.getPathname();
                var urlParts = pathname.split('/');
                return urlParts[1] === 'embed';
            },
            getPathname: function () {
                return this.getCurrentLocation().pathname;
            },
            // Topic id should be correctly returned from topic editor as well as
            // story editor, since both have topic id in their url.
            getTopicIdFromUrl: function () {
                var pathname = this.getPathname();
                if (pathname.match(/\/(story|topic)_editor\/(\w|-){12}/g)) {
                    return pathname.split('/')[2];
                }
                throw Error('Invalid topic id url');
            },
            getTopicNameFromLearnerUrl: function () {
                var pathname = this.getPathname();
                if (pathname.match(/\/(story|topic|practice_session)/g)) {
                    return decodeURIComponent(pathname.split('/')[2]);
                }
                throw Error('Invalid URL for topic');
            },
            getStoryIdFromUrl: function () {
                var pathname = this.getPathname();
                if (pathname.match(/\/story_editor(\/(\w|-){12}){2}/g)) {
                    return pathname.split('/')[3];
                }
                throw Error('Invalid story id url');
            },
            getStoryIdInPlayer: function () {
                var query = this.getCurrentQueryString();
                if (query.match(/\?story_id=((\w|-){12})/g)) {
                    return query.split('=')[1];
                }
                return null;
            },
            getSkillIdFromUrl: function () {
                var pathname = this.getPathname();
                var skillId = pathname.split('/')[2];
                if (skillId.length !== 12) {
                    throw Error('Invalid Skill Id');
                }
                return skillId;
            },
            getQueryFieldValuesAsList: function (fieldName) {
                var fieldValues = [];
                if (this.getCurrentQueryString().indexOf('?') > -1) {
                    // Each queryItem return one field-value pair in the url.
                    var queryItems = this.getCurrentQueryString().slice(this.getCurrentQueryString().indexOf('?') + 1).split('&');
                    for (var i = 0; i < queryItems.length; i++) {
                        var currentFieldName = decodeURIComponent(queryItems[i].split('=')[0]);
                        var currentFieldValue = decodeURIComponent(queryItems[i].split('=')[1]);
                        if (currentFieldName === fieldName) {
                            fieldValues.push(currentFieldValue);
                        }
                    }
                }
                return fieldValues;
            },
            addField: function (url, fieldName, fieldValue) {
                var encodedFieldValue = encodeURIComponent(fieldValue);
                var encodedFieldName = encodeURIComponent(fieldName);
                return url + (url.indexOf('?') !== -1 ? '&' : '?') + encodedFieldName +
                    '=' + encodedFieldValue;
            },
            getHash: function () {
                return this.getCurrentLocation().hash;
            }
        };
    }]);


/***/ }),

/***/ "./core/templates/dev/head/services/stateful/FocusManagerService.ts":
/*!**************************************************************************!*\
  !*** ./core/templates/dev/head/services/stateful/FocusManagerService.ts ***!
  \**************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

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
 * @fileoverview Service for setting focus. This broadcasts a 'focusOn' event
 * which sets focus to the element in the page with the corresponding focusOn
 * attribute.
 * Note: This requires LABEL_FOR_CLEARING_FOCUS to exist somewhere in the HTML
 * page.
 */
oppia.factory('FocusManagerService', [
    '$rootScope', '$timeout', 'DeviceInfoService', 'IdGenerationService',
    'LABEL_FOR_CLEARING_FOCUS',
    function ($rootScope, $timeout, DeviceInfoService, IdGenerationService, LABEL_FOR_CLEARING_FOCUS) {
        var _nextLabelToFocusOn = null;
        return {
            clearFocus: function () {
                this.setFocus(LABEL_FOR_CLEARING_FOCUS);
            },
            setFocus: function (name) {
                if (_nextLabelToFocusOn) {
                    return;
                }
                _nextLabelToFocusOn = name;
                $timeout(function () {
                    $rootScope.$broadcast('focusOn', _nextLabelToFocusOn);
                    _nextLabelToFocusOn = null;
                });
            },
            setFocusIfOnDesktop: function (newFocusLabel) {
                if (!DeviceInfoService.isMobileDevice()) {
                    this.setFocus(newFocusLabel);
                }
            },
            // Generates a random string (to be used as a focus label).
            generateFocusLabel: function () {
                return IdGenerationService.generateNewId();
            }
        };
    }
]);


/***/ })

}]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9zZXJ2aWNlcy9Db250ZXh0U2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9zZXJ2aWNlcy9IdG1sRXNjYXBlclNlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvc2VydmljZXMvY29udGV4dHVhbC9VcmxTZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3NlcnZpY2VzL3N0YXRlZnVsL0ZvY3VzTWFuYWdlclNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQ0FBbUMsMEJBQTBCO0FBQzdEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwrREFBK0QsZUFBZTtBQUM5RSxnQ0FBZ0MsZUFBZSx3QkFBd0IsZUFBZTtBQUN0RjtBQUNBLG1DQUFtQywwQkFBMEI7QUFDN0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw2REFBNkQsWUFBWTtBQUN6RTtBQUNBLG1DQUFtQywwQkFBMEI7QUFDN0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDeEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSx5Q0FBeUM7QUFDekMsMENBQTBDO0FBQzFDLHlDQUF5QztBQUN6Qyx3Q0FBd0M7QUFDeEMsd0NBQXdDO0FBQ3hDLGFBQWE7QUFDYjtBQUNBO0FBQ0Esb0NBQW9DO0FBQ3BDLG1DQUFtQztBQUNuQyxrQ0FBa0M7QUFDbEMsa0NBQWtDO0FBQ2xDLG1DQUFtQztBQUNuQztBQUNBO0FBQ0E7QUFDQSxLQUFLOzs7Ozs7Ozs7Ozs7QUM5Q0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUVBQW1FLEdBQUc7QUFDdEU7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsNERBQTRELEdBQUcsRUFBRSxFQUFFO0FBQ25FO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0Esb0RBQW9ELEdBQUc7QUFDdkQ7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQ0FBbUMsdUJBQXVCO0FBQzFEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7Ozs7Ozs7Ozs7OztBQzNHTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJhZG1pbn5hcHB+Y29sbGVjdGlvbl9lZGl0b3J+Y3JlYXRvcl9kYXNoYm9hcmR+ZXhwbG9yYXRpb25fZWRpdG9yfmV4cGxvcmF0aW9uX3BsYXllcn5za2lsbF9lZGl0b3J+c3RvfjdjNWUwMzZhLmJ1bmRsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU2VydmljZSBmb3IgcmV0dXJuaW5nIGluZm9ybWF0aW9uIGFib3V0IGEgcGFnZSdzXG4gKiBjb250ZXh0LlxuICovXG5vcHBpYS5jb25zdGFudCgnUEFHRV9DT05URVhUJywge1xuICAgIEVYUExPUkFUSU9OX0VESVRPUjogJ2VkaXRvcicsXG4gICAgRVhQTE9SQVRJT05fUExBWUVSOiAnbGVhcm5lcicsXG4gICAgUVVFU1RJT05fRURJVE9SOiAncXVlc3Rpb25fZWRpdG9yJyxcbiAgICBPVEhFUjogJ290aGVyJ1xufSk7XG5vcHBpYS5jb25zdGFudCgnRVhQTE9SQVRJT05fRURJVE9SX1RBQl9DT05URVhUJywge1xuICAgIEVESVRPUjogJ2VkaXRvcicsXG4gICAgUFJFVklFVzogJ3ByZXZpZXcnXG59KTtcbm9wcGlhLmZhY3RvcnkoJ0NvbnRleHRTZXJ2aWNlJywgW1xuICAgICdVcmxTZXJ2aWNlJywgJ0VYUExPUkFUSU9OX0VESVRPUl9UQUJfQ09OVEVYVCcsICdQQUdFX0NPTlRFWFQnLFxuICAgIGZ1bmN0aW9uIChVcmxTZXJ2aWNlLCBFWFBMT1JBVElPTl9FRElUT1JfVEFCX0NPTlRFWFQsIFBBR0VfQ09OVEVYVCkge1xuICAgICAgICB2YXIgcGFnZUNvbnRleHQgPSBudWxsO1xuICAgICAgICB2YXIgZXhwbG9yYXRpb25JZCA9IG51bGw7XG4gICAgICAgIHZhciBxdWVzdGlvbklkID0gbnVsbDtcbiAgICAgICAgdmFyIGVkaXRvckNvbnRleHQgPSBudWxsO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgaW5pdDogZnVuY3Rpb24gKGVkaXRvck5hbWUpIHtcbiAgICAgICAgICAgICAgICBlZGl0b3JDb250ZXh0ID0gZWRpdG9yTmFtZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBGb2xsb3dpbmcgbWV0aG9kIGhlbHBzIHRvIGtub3cgdGhlIHdoZXRoZXIgdGhlIGNvbnRleHQgb2YgZWRpdG9yIGlzXG4gICAgICAgICAgICAvLyBxdWVzdGlvbiBlZGl0b3Igb3IgZXhwbG9yYXRpb24gZWRpdG9yLiBUaGUgdmFyaWFibGUgZWRpdG9yQ29udGV4dCBpc1xuICAgICAgICAgICAgLy8gc2V0IGZyb20gdGhlIGluaXQgZnVuY3Rpb24gdGhhdCBpcyBjYWxsZWQgdXBvbiBpbml0aWFsaXphdGlvbiBpbiB0aGVcbiAgICAgICAgICAgIC8vIHJlc3BlY3RpdmUgZWRpdG9ycy5cbiAgICAgICAgICAgIGdldEVkaXRvckNvbnRleHQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZWRpdG9yQ29udGV4dDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBSZXR1cm5zIGEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgY3VycmVudCB0YWIgb2YgdGhlIGVkaXRvciAoZWl0aGVyXG4gICAgICAgICAgICAvLyAnZWRpdG9yJyBvciAncHJldmlldycpLCBvciBudWxsIGlmIHRoZSBjdXJyZW50IHRhYiBpcyBuZWl0aGVyIG9mIHRoZXNlLFxuICAgICAgICAgICAgLy8gb3IgdGhlIGN1cnJlbnQgcGFnZSBpcyBub3QgdGhlIGVkaXRvci5cbiAgICAgICAgICAgIGdldEVkaXRvclRhYkNvbnRleHQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgaGFzaCA9IFVybFNlcnZpY2UuZ2V0SGFzaCgpO1xuICAgICAgICAgICAgICAgIGlmIChoYXNoLmluZGV4T2YoJyMvZ3VpJykgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEVYUExPUkFUSU9OX0VESVRPUl9UQUJfQ09OVEVYVC5FRElUT1I7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGhhc2guaW5kZXhPZignIy9wcmV2aWV3JykgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEVYUExPUkFUSU9OX0VESVRPUl9UQUJfQ09OVEVYVC5QUkVWSUVXO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIFJldHVybnMgYSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSBjb250ZXh0IG9mIHRoZSBjdXJyZW50IHBhZ2UuXG4gICAgICAgICAgICAvLyBUaGlzIGlzIFBBR0VfQ09OVEVYVC5FWFBMT1JBVElPTl9FRElUT1Igb3JcbiAgICAgICAgICAgIC8vIFBBR0VfQ09OVEVYVC5FWFBMT1JBVElPTl9QTEFZRVIgb3IgUEFHRV9DT05URVhULlFVRVNUSU9OX0VESVRPUi5cbiAgICAgICAgICAgIC8vIElmIHRoZSBjdXJyZW50IHBhZ2UgaXMgbm90IG9uZSBpbiBlaXRoZXIgRVhQTE9SQVRJT05fRURJVE9SIG9yXG4gICAgICAgICAgICAvLyBFWFBMT1JBVElPTl9QTEFZRVIgb3IgUVVFU1RJT05fRURJVE9SIHRoZW4gcmV0dXJuIFBBR0VfQ09OVEVYVC5PVEhFUlxuICAgICAgICAgICAgZ2V0UGFnZUNvbnRleHQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAocGFnZUNvbnRleHQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBhZ2VDb250ZXh0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBhdGhuYW1lQXJyYXkgPSBVcmxTZXJ2aWNlLmdldFBhdGhuYW1lKCkuc3BsaXQoJy8nKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXRobmFtZUFycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocGF0aG5hbWVBcnJheVtpXSA9PT0gJ2V4cGxvcmUnIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKHBhdGhuYW1lQXJyYXlbaV0gPT09ICdlbWJlZCcgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0aG5hbWVBcnJheVtpICsgMV0gPT09ICdleHBsb3JhdGlvbicpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFnZUNvbnRleHQgPSBQQUdFX0NPTlRFWFQuRVhQTE9SQVRJT05fUExBWUVSO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBQQUdFX0NPTlRFWFQuRVhQTE9SQVRJT05fUExBWUVSO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAocGF0aG5hbWVBcnJheVtpXSA9PT0gJ2NyZWF0ZScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYWdlQ29udGV4dCA9IFBBR0VfQ09OVEVYVC5FWFBMT1JBVElPTl9FRElUT1I7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFBBR0VfQ09OVEVYVC5FWFBMT1JBVElPTl9FRElUT1I7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChwYXRobmFtZUFycmF5W2ldID09PSAncXVlc3Rpb25fZWRpdG9yJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhZ2VDb250ZXh0ID0gUEFHRV9DT05URVhULlFVRVNUSU9OX0VESVRPUjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gUEFHRV9DT05URVhULlFVRVNUSU9OX0VESVRPUjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gUEFHRV9DT05URVhULk9USEVSO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpc0luRXhwbG9yYXRpb25Db250ZXh0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICh0aGlzLmdldFBhZ2VDb250ZXh0KCkgPT09IFBBR0VfQ09OVEVYVC5FWFBMT1JBVElPTl9FRElUT1IgfHxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nZXRQYWdlQ29udGV4dCgpID09PSBQQUdFX0NPTlRFWFQuRVhQTE9SQVRJT05fUExBWUVSKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpc0luUXVlc3Rpb25Db250ZXh0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICh0aGlzLmdldFBhZ2VDb250ZXh0KCkgPT09IFBBR0VfQ09OVEVYVC5RVUVTVElPTl9FRElUT1IpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIFJldHVybnMgYSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSBleHBsb3JhdGlvbklkIChvYnRhaW5lZCBmcm9tIHRoZVxuICAgICAgICAgICAgLy8gVVJMKS5cbiAgICAgICAgICAgIGdldEV4cGxvcmF0aW9uSWQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXhwbG9yYXRpb25JZDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRoZSBwYXRobmFtZSBzaG91bGQgYmUgb25lIG9mIC9leHBsb3JlL3tleHBsb3JhdGlvbl9pZH0gb3JcbiAgICAgICAgICAgICAgICAgICAgLy8gL2NyZWF0ZS97ZXhwbG9yYXRpb25faWR9IG9yIC9lbWJlZC9leHBsb3JhdGlvbi97ZXhwbG9yYXRpb25faWR9LlxuICAgICAgICAgICAgICAgICAgICB2YXIgcGF0aG5hbWVBcnJheSA9IFVybFNlcnZpY2UuZ2V0UGF0aG5hbWUoKS5zcGxpdCgnLycpO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBhdGhuYW1lQXJyYXkubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwYXRobmFtZUFycmF5W2ldID09PSAnZXhwbG9yZScgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRobmFtZUFycmF5W2ldID09PSAnY3JlYXRlJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4cGxvcmF0aW9uSWQgPSBwYXRobmFtZUFycmF5W2kgKyAxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGF0aG5hbWVBcnJheVtpICsgMV07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocGF0aG5hbWVBcnJheVtpXSA9PT0gJ2VtYmVkJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4cGxvcmF0aW9uSWQgPSBwYXRobmFtZUFycmF5W2kgKyAyXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXhwbG9yYXRpb25JZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignRVJST1I6IENvbnRleHRTZXJ2aWNlIHNob3VsZCBub3QgYmUgdXNlZCBvdXRzaWRlIHRoZSAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICdjb250ZXh0IG9mIGFuIGV4cGxvcmF0aW9uIG9yIGEgcXVlc3Rpb24uJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIFJldHVybnMgYSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSBxdWVzdGlvbklkIChvYnRhaW5lZCBmcm9tIHRoZVxuICAgICAgICAgICAgLy8gVVJMKS5cbiAgICAgICAgICAgIGdldFF1ZXN0aW9uSWQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAocXVlc3Rpb25JZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcXVlc3Rpb25JZDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRoZSBwYXRobmFtZSBzaG91bGQgL3F1ZXN0aW9uX2VkaXRvci97cXVlc3Rpb25faWR9LlxuICAgICAgICAgICAgICAgICAgICB2YXIgcGF0aG5hbWVBcnJheSA9IFVybFNlcnZpY2UuZ2V0UGF0aG5hbWUoKS5zcGxpdCgnLycpO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBhdGhuYW1lQXJyYXkubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwYXRobmFtZUFycmF5W2ldID09PSAncXVlc3Rpb25fZWRpdG9yJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHF1ZXN0aW9uSWQgPSBwYXRobmFtZUFycmF5W2kgKyAxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGF0aG5hbWVBcnJheVtpICsgMV07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ0VSUk9SOiBDb250ZXh0U2VydmljZSBzaG91bGQgbm90IGJlIHVzZWQgb3V0c2lkZSB0aGUgJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnY29udGV4dCBvZiBhbiBleHBsb3JhdGlvbiBvciBhIHF1ZXN0aW9uLicpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBGb2xsb3dpbmcgbWV0aG9kIGhlbHBzIHRvIGtub3cgd2hldGhlciBleHBsb3JhdGlvbiBlZGl0b3IgaXNcbiAgICAgICAgICAgIC8vIGluIG1haW4gZWRpdGluZyBtb2RlIG9yIHByZXZpZXcgbW9kZS5cbiAgICAgICAgICAgIGlzSW5FeHBsb3JhdGlvbkVkaXRvck1vZGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKHRoaXMuZ2V0UGFnZUNvbnRleHQoKSA9PT0gUEFHRV9DT05URVhULkVYUExPUkFUSU9OX0VESVRPUiAmJlxuICAgICAgICAgICAgICAgICAgICB0aGlzLmdldEVkaXRvclRhYkNvbnRleHQoKSA9PT0gKEVYUExPUkFUSU9OX0VESVRPUl9UQUJfQ09OVEVYVC5FRElUT1IpKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpc0luRXhwbG9yYXRpb25FZGl0b3JQYWdlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0UGFnZUNvbnRleHQoKSA9PT0gUEFHRV9DT05URVhULkVYUExPUkFUSU9OX0VESVRPUjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU2VydmljZSBmb3IgSFRNTCBzZXJpYWxpemF0aW9uIGFuZCBlc2NhcGluZy5cbiAqL1xub3BwaWEuZmFjdG9yeSgnSHRtbEVzY2FwZXJTZXJ2aWNlJywgWyckbG9nJywgZnVuY3Rpb24gKCRsb2cpIHtcbiAgICAgICAgdmFyIGh0bWxFc2NhcGVyID0ge1xuICAgICAgICAgICAgb2JqVG9Fc2NhcGVkSnNvbjogZnVuY3Rpb24gKG9iaikge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnVuZXNjYXBlZFN0clRvRXNjYXBlZFN0cihKU09OLnN0cmluZ2lmeShvYmopKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlc2NhcGVkSnNvblRvT2JqOiBmdW5jdGlvbiAoanNvbikge1xuICAgICAgICAgICAgICAgIGlmICghanNvbikge1xuICAgICAgICAgICAgICAgICAgICAkbG9nLmVycm9yKCdFbXB0eSBzdHJpbmcgd2FzIHBhc3NlZCB0byBKU09OIGRlY29kZXIuJyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIEpTT04ucGFyc2UodGhpcy5lc2NhcGVkU3RyVG9VbmVzY2FwZWRTdHIoanNvbikpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHVuZXNjYXBlZFN0clRvRXNjYXBlZFN0cjogZnVuY3Rpb24gKHN0cikge1xuICAgICAgICAgICAgICAgIHJldHVybiBTdHJpbmcoc3RyKVxuICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvJi9nLCAnJmFtcDsnKVxuICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXCIvZywgJyZxdW90OycpXG4gICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8nL2csICcmIzM5OycpXG4gICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC88L2csICcmbHQ7JylcbiAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLz4vZywgJyZndDsnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlc2NhcGVkU3RyVG9VbmVzY2FwZWRTdHI6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBTdHJpbmcodmFsdWUpXG4gICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8mcXVvdDsvZywgJ1wiJylcbiAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyYjMzk7L2csICdcXCcnKVxuICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvJmx0Oy9nLCAnPCcpXG4gICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8mZ3Q7L2csICc+JylcbiAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyZhbXA7L2csICcmJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBodG1sRXNjYXBlcjtcbiAgICB9XSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFNlcnZpY2UgZm9yIG1hbmlwdWxhdGluZyB0aGUgcGFnZSBVUkwuIEFsc28gYWxsb3dzXG4gKiBmdW5jdGlvbnMgb24gJHdpbmRvdyB0byBiZSBtb2NrZWQgaW4gdW5pdCB0ZXN0cy5cbiAqL1xub3BwaWEuZmFjdG9yeSgnVXJsU2VydmljZScsIFsnJHdpbmRvdycsIGZ1bmN0aW9uICgkd2luZG93KSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAvLyBUaGlzIGZ1bmN0aW9uIGlzIGZvciB0ZXN0aW5nIHB1cnBvc2VzICh0byBtb2NrICR3aW5kb3cubG9jYXRpb24pXG4gICAgICAgICAgICBnZXRDdXJyZW50TG9jYXRpb246IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHdpbmRvdy5sb2NhdGlvbjtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRDdXJyZW50UXVlcnlTdHJpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRDdXJyZW50TG9jYXRpb24oKS5zZWFyY2g7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyogQXMgcGFyYW1zW2tleV0gaXMgb3ZlcndyaXR0ZW4sIGlmIHF1ZXJ5IHN0cmluZyBoYXMgbXVsdGlwbGUgZmllbGRWYWx1ZXNcbiAgICAgICAgICAgICAgIGZvciBzYW1lIGZpZWxkTmFtZSwgdXNlIGdldFF1ZXJ5RmllbGRWYWx1ZXNBc0xpc3QoZmllbGROYW1lKSB0byBnZXQgaXRcbiAgICAgICAgICAgICAgIGluIGFycmF5IGZvcm0uICovXG4gICAgICAgICAgICBnZXRVcmxQYXJhbXM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgcGFyYW1zID0ge307XG4gICAgICAgICAgICAgICAgdmFyIHBhcnRzID0gdGhpcy5nZXRDdXJyZW50UXVlcnlTdHJpbmcoKS5yZXBsYWNlKC9bPyZdKyhbXj0mXSspPShbXiZdKikvZ2ksIGZ1bmN0aW9uIChtLCBrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhcmFtc1tkZWNvZGVVUklDb21wb25lbnQoa2V5KV0gPSBkZWNvZGVVUklDb21wb25lbnQodmFsdWUpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJhbXM7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaXNJZnJhbWVkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBhdGhuYW1lID0gdGhpcy5nZXRQYXRobmFtZSgpO1xuICAgICAgICAgICAgICAgIHZhciB1cmxQYXJ0cyA9IHBhdGhuYW1lLnNwbGl0KCcvJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVybFBhcnRzWzFdID09PSAnZW1iZWQnO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldFBhdGhuYW1lOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0Q3VycmVudExvY2F0aW9uKCkucGF0aG5hbWU7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gVG9waWMgaWQgc2hvdWxkIGJlIGNvcnJlY3RseSByZXR1cm5lZCBmcm9tIHRvcGljIGVkaXRvciBhcyB3ZWxsIGFzXG4gICAgICAgICAgICAvLyBzdG9yeSBlZGl0b3IsIHNpbmNlIGJvdGggaGF2ZSB0b3BpYyBpZCBpbiB0aGVpciB1cmwuXG4gICAgICAgICAgICBnZXRUb3BpY0lkRnJvbVVybDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBwYXRobmFtZSA9IHRoaXMuZ2V0UGF0aG5hbWUoKTtcbiAgICAgICAgICAgICAgICBpZiAocGF0aG5hbWUubWF0Y2goL1xcLyhzdG9yeXx0b3BpYylfZWRpdG9yXFwvKFxcd3wtKXsxMn0vZykpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBhdGhuYW1lLnNwbGl0KCcvJylbMl07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdJbnZhbGlkIHRvcGljIGlkIHVybCcpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldFRvcGljTmFtZUZyb21MZWFybmVyVXJsOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBhdGhuYW1lID0gdGhpcy5nZXRQYXRobmFtZSgpO1xuICAgICAgICAgICAgICAgIGlmIChwYXRobmFtZS5tYXRjaCgvXFwvKHN0b3J5fHRvcGljfHByYWN0aWNlX3Nlc3Npb24pL2cpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkZWNvZGVVUklDb21wb25lbnQocGF0aG5hbWUuc3BsaXQoJy8nKVsyXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdJbnZhbGlkIFVSTCBmb3IgdG9waWMnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRTdG9yeUlkRnJvbVVybDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBwYXRobmFtZSA9IHRoaXMuZ2V0UGF0aG5hbWUoKTtcbiAgICAgICAgICAgICAgICBpZiAocGF0aG5hbWUubWF0Y2goL1xcL3N0b3J5X2VkaXRvcihcXC8oXFx3fC0pezEyfSl7Mn0vZykpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBhdGhuYW1lLnNwbGl0KCcvJylbM107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdJbnZhbGlkIHN0b3J5IGlkIHVybCcpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldFN0b3J5SWRJblBsYXllcjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBxdWVyeSA9IHRoaXMuZ2V0Q3VycmVudFF1ZXJ5U3RyaW5nKCk7XG4gICAgICAgICAgICAgICAgaWYgKHF1ZXJ5Lm1hdGNoKC9cXD9zdG9yeV9pZD0oKFxcd3wtKXsxMn0pL2cpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBxdWVyeS5zcGxpdCgnPScpWzFdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRTa2lsbElkRnJvbVVybDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBwYXRobmFtZSA9IHRoaXMuZ2V0UGF0aG5hbWUoKTtcbiAgICAgICAgICAgICAgICB2YXIgc2tpbGxJZCA9IHBhdGhuYW1lLnNwbGl0KCcvJylbMl07XG4gICAgICAgICAgICAgICAgaWYgKHNraWxsSWQubGVuZ3RoICE9PSAxMikge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignSW52YWxpZCBTa2lsbCBJZCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gc2tpbGxJZDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRRdWVyeUZpZWxkVmFsdWVzQXNMaXN0OiBmdW5jdGlvbiAoZmllbGROYW1lKSB7XG4gICAgICAgICAgICAgICAgdmFyIGZpZWxkVmFsdWVzID0gW107XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZ2V0Q3VycmVudFF1ZXJ5U3RyaW5nKCkuaW5kZXhPZignPycpID4gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gRWFjaCBxdWVyeUl0ZW0gcmV0dXJuIG9uZSBmaWVsZC12YWx1ZSBwYWlyIGluIHRoZSB1cmwuXG4gICAgICAgICAgICAgICAgICAgIHZhciBxdWVyeUl0ZW1zID0gdGhpcy5nZXRDdXJyZW50UXVlcnlTdHJpbmcoKS5zbGljZSh0aGlzLmdldEN1cnJlbnRRdWVyeVN0cmluZygpLmluZGV4T2YoJz8nKSArIDEpLnNwbGl0KCcmJyk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcXVlcnlJdGVtcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRGaWVsZE5hbWUgPSBkZWNvZGVVUklDb21wb25lbnQocXVlcnlJdGVtc1tpXS5zcGxpdCgnPScpWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjdXJyZW50RmllbGRWYWx1ZSA9IGRlY29kZVVSSUNvbXBvbmVudChxdWVyeUl0ZW1zW2ldLnNwbGl0KCc9JylbMV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRGaWVsZE5hbWUgPT09IGZpZWxkTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpZWxkVmFsdWVzLnB1c2goY3VycmVudEZpZWxkVmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBmaWVsZFZhbHVlcztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBhZGRGaWVsZDogZnVuY3Rpb24gKHVybCwgZmllbGROYW1lLCBmaWVsZFZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdmFyIGVuY29kZWRGaWVsZFZhbHVlID0gZW5jb2RlVVJJQ29tcG9uZW50KGZpZWxkVmFsdWUpO1xuICAgICAgICAgICAgICAgIHZhciBlbmNvZGVkRmllbGROYW1lID0gZW5jb2RlVVJJQ29tcG9uZW50KGZpZWxkTmFtZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVybCArICh1cmwuaW5kZXhPZignPycpICE9PSAtMSA/ICcmJyA6ICc/JykgKyBlbmNvZGVkRmllbGROYW1lICtcbiAgICAgICAgICAgICAgICAgICAgJz0nICsgZW5jb2RlZEZpZWxkVmFsdWU7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0SGFzaDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmdldEN1cnJlbnRMb2NhdGlvbigpLmhhc2g7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfV0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIGZvciBzZXR0aW5nIGZvY3VzLiBUaGlzIGJyb2FkY2FzdHMgYSAnZm9jdXNPbicgZXZlbnRcbiAqIHdoaWNoIHNldHMgZm9jdXMgdG8gdGhlIGVsZW1lbnQgaW4gdGhlIHBhZ2Ugd2l0aCB0aGUgY29ycmVzcG9uZGluZyBmb2N1c09uXG4gKiBhdHRyaWJ1dGUuXG4gKiBOb3RlOiBUaGlzIHJlcXVpcmVzIExBQkVMX0ZPUl9DTEVBUklOR19GT0NVUyB0byBleGlzdCBzb21ld2hlcmUgaW4gdGhlIEhUTUxcbiAqIHBhZ2UuXG4gKi9cbm9wcGlhLmZhY3RvcnkoJ0ZvY3VzTWFuYWdlclNlcnZpY2UnLCBbXG4gICAgJyRyb290U2NvcGUnLCAnJHRpbWVvdXQnLCAnRGV2aWNlSW5mb1NlcnZpY2UnLCAnSWRHZW5lcmF0aW9uU2VydmljZScsXG4gICAgJ0xBQkVMX0ZPUl9DTEVBUklOR19GT0NVUycsXG4gICAgZnVuY3Rpb24gKCRyb290U2NvcGUsICR0aW1lb3V0LCBEZXZpY2VJbmZvU2VydmljZSwgSWRHZW5lcmF0aW9uU2VydmljZSwgTEFCRUxfRk9SX0NMRUFSSU5HX0ZPQ1VTKSB7XG4gICAgICAgIHZhciBfbmV4dExhYmVsVG9Gb2N1c09uID0gbnVsbDtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGNsZWFyRm9jdXM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldEZvY3VzKExBQkVMX0ZPUl9DTEVBUklOR19GT0NVUyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2V0Rm9jdXM6IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgICAgICAgICAgaWYgKF9uZXh0TGFiZWxUb0ZvY3VzT24pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBfbmV4dExhYmVsVG9Gb2N1c09uID0gbmFtZTtcbiAgICAgICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgnZm9jdXNPbicsIF9uZXh0TGFiZWxUb0ZvY3VzT24pO1xuICAgICAgICAgICAgICAgICAgICBfbmV4dExhYmVsVG9Gb2N1c09uID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzZXRGb2N1c0lmT25EZXNrdG9wOiBmdW5jdGlvbiAobmV3Rm9jdXNMYWJlbCkge1xuICAgICAgICAgICAgICAgIGlmICghRGV2aWNlSW5mb1NlcnZpY2UuaXNNb2JpbGVEZXZpY2UoKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldEZvY3VzKG5ld0ZvY3VzTGFiZWwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBHZW5lcmF0ZXMgYSByYW5kb20gc3RyaW5nICh0byBiZSB1c2VkIGFzIGEgZm9jdXMgbGFiZWwpLlxuICAgICAgICAgICAgZ2VuZXJhdGVGb2N1c0xhYmVsOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIElkR2VuZXJhdGlvblNlcnZpY2UuZ2VuZXJhdGVOZXdJZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIl0sInNvdXJjZVJvb3QiOiIifQ==