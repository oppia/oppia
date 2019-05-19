(window["webpackJsonp"] = window["webpackJsonp"] || []).push([["app~collection_editor~creator_dashboard~exploration_editor~exploration_player~skill_editor~story_edi~49592d2f"],{

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


/***/ })

}]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9zZXJ2aWNlcy9Db250ZXh0U2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9zZXJ2aWNlcy9jb250ZXh0dWFsL1VybFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQ0FBbUMsMEJBQTBCO0FBQzdEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwrREFBK0QsZUFBZTtBQUM5RSxnQ0FBZ0MsZUFBZSx3QkFBd0IsZUFBZTtBQUN0RjtBQUNBLG1DQUFtQywwQkFBMEI7QUFDN0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw2REFBNkQsWUFBWTtBQUN6RTtBQUNBLG1DQUFtQywwQkFBMEI7QUFDN0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDeEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1FQUFtRSxHQUFHO0FBQ3RFO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLDREQUE0RCxHQUFHLEVBQUUsRUFBRTtBQUNuRTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLG9EQUFvRCxHQUFHO0FBQ3ZEO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUNBQW1DLHVCQUF1QjtBQUMxRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLIiwiZmlsZSI6ImFwcH5jb2xsZWN0aW9uX2VkaXRvcn5jcmVhdG9yX2Rhc2hib2FyZH5leHBsb3JhdGlvbl9lZGl0b3J+ZXhwbG9yYXRpb25fcGxheWVyfnNraWxsX2VkaXRvcn5zdG9yeV9lZGl+NDk1OTJkMmYuYnVuZGxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIGZvciByZXR1cm5pbmcgaW5mb3JtYXRpb24gYWJvdXQgYSBwYWdlJ3NcbiAqIGNvbnRleHQuXG4gKi9cbm9wcGlhLmNvbnN0YW50KCdQQUdFX0NPTlRFWFQnLCB7XG4gICAgRVhQTE9SQVRJT05fRURJVE9SOiAnZWRpdG9yJyxcbiAgICBFWFBMT1JBVElPTl9QTEFZRVI6ICdsZWFybmVyJyxcbiAgICBRVUVTVElPTl9FRElUT1I6ICdxdWVzdGlvbl9lZGl0b3InLFxuICAgIE9USEVSOiAnb3RoZXInXG59KTtcbm9wcGlhLmNvbnN0YW50KCdFWFBMT1JBVElPTl9FRElUT1JfVEFCX0NPTlRFWFQnLCB7XG4gICAgRURJVE9SOiAnZWRpdG9yJyxcbiAgICBQUkVWSUVXOiAncHJldmlldydcbn0pO1xub3BwaWEuZmFjdG9yeSgnQ29udGV4dFNlcnZpY2UnLCBbXG4gICAgJ1VybFNlcnZpY2UnLCAnRVhQTE9SQVRJT05fRURJVE9SX1RBQl9DT05URVhUJywgJ1BBR0VfQ09OVEVYVCcsXG4gICAgZnVuY3Rpb24gKFVybFNlcnZpY2UsIEVYUExPUkFUSU9OX0VESVRPUl9UQUJfQ09OVEVYVCwgUEFHRV9DT05URVhUKSB7XG4gICAgICAgIHZhciBwYWdlQ29udGV4dCA9IG51bGw7XG4gICAgICAgIHZhciBleHBsb3JhdGlvbklkID0gbnVsbDtcbiAgICAgICAgdmFyIHF1ZXN0aW9uSWQgPSBudWxsO1xuICAgICAgICB2YXIgZWRpdG9yQ29udGV4dCA9IG51bGw7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBpbml0OiBmdW5jdGlvbiAoZWRpdG9yTmFtZSkge1xuICAgICAgICAgICAgICAgIGVkaXRvckNvbnRleHQgPSBlZGl0b3JOYW1lO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIEZvbGxvd2luZyBtZXRob2QgaGVscHMgdG8ga25vdyB0aGUgd2hldGhlciB0aGUgY29udGV4dCBvZiBlZGl0b3IgaXNcbiAgICAgICAgICAgIC8vIHF1ZXN0aW9uIGVkaXRvciBvciBleHBsb3JhdGlvbiBlZGl0b3IuIFRoZSB2YXJpYWJsZSBlZGl0b3JDb250ZXh0IGlzXG4gICAgICAgICAgICAvLyBzZXQgZnJvbSB0aGUgaW5pdCBmdW5jdGlvbiB0aGF0IGlzIGNhbGxlZCB1cG9uIGluaXRpYWxpemF0aW9uIGluIHRoZVxuICAgICAgICAgICAgLy8gcmVzcGVjdGl2ZSBlZGl0b3JzLlxuICAgICAgICAgICAgZ2V0RWRpdG9yQ29udGV4dDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBlZGl0b3JDb250ZXh0O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIFJldHVybnMgYSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSBjdXJyZW50IHRhYiBvZiB0aGUgZWRpdG9yIChlaXRoZXJcbiAgICAgICAgICAgIC8vICdlZGl0b3InIG9yICdwcmV2aWV3JyksIG9yIG51bGwgaWYgdGhlIGN1cnJlbnQgdGFiIGlzIG5laXRoZXIgb2YgdGhlc2UsXG4gICAgICAgICAgICAvLyBvciB0aGUgY3VycmVudCBwYWdlIGlzIG5vdCB0aGUgZWRpdG9yLlxuICAgICAgICAgICAgZ2V0RWRpdG9yVGFiQ29udGV4dDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBoYXNoID0gVXJsU2VydmljZS5nZXRIYXNoKCk7XG4gICAgICAgICAgICAgICAgaWYgKGhhc2guaW5kZXhPZignIy9ndWknKSA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gRVhQTE9SQVRJT05fRURJVE9SX1RBQl9DT05URVhULkVESVRPUjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoaGFzaC5pbmRleE9mKCcjL3ByZXZpZXcnKSA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gRVhQTE9SQVRJT05fRURJVE9SX1RBQl9DT05URVhULlBSRVZJRVc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gUmV0dXJucyBhIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIGNvbnRleHQgb2YgdGhlIGN1cnJlbnQgcGFnZS5cbiAgICAgICAgICAgIC8vIFRoaXMgaXMgUEFHRV9DT05URVhULkVYUExPUkFUSU9OX0VESVRPUiBvclxuICAgICAgICAgICAgLy8gUEFHRV9DT05URVhULkVYUExPUkFUSU9OX1BMQVlFUiBvciBQQUdFX0NPTlRFWFQuUVVFU1RJT05fRURJVE9SLlxuICAgICAgICAgICAgLy8gSWYgdGhlIGN1cnJlbnQgcGFnZSBpcyBub3Qgb25lIGluIGVpdGhlciBFWFBMT1JBVElPTl9FRElUT1Igb3JcbiAgICAgICAgICAgIC8vIEVYUExPUkFUSU9OX1BMQVlFUiBvciBRVUVTVElPTl9FRElUT1IgdGhlbiByZXR1cm4gUEFHRV9DT05URVhULk9USEVSXG4gICAgICAgICAgICBnZXRQYWdlQ29udGV4dDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmIChwYWdlQ29udGV4dCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGFnZUNvbnRleHQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcGF0aG5hbWVBcnJheSA9IFVybFNlcnZpY2UuZ2V0UGF0aG5hbWUoKS5zcGxpdCgnLycpO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBhdGhuYW1lQXJyYXkubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwYXRobmFtZUFycmF5W2ldID09PSAnZXhwbG9yZScgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAocGF0aG5hbWVBcnJheVtpXSA9PT0gJ2VtYmVkJyAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRobmFtZUFycmF5W2kgKyAxXSA9PT0gJ2V4cGxvcmF0aW9uJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYWdlQ29udGV4dCA9IFBBR0VfQ09OVEVYVC5FWFBMT1JBVElPTl9QTEFZRVI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFBBR0VfQ09OVEVYVC5FWFBMT1JBVElPTl9QTEFZRVI7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChwYXRobmFtZUFycmF5W2ldID09PSAnY3JlYXRlJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhZ2VDb250ZXh0ID0gUEFHRV9DT05URVhULkVYUExPUkFUSU9OX0VESVRPUjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gUEFHRV9DT05URVhULkVYUExPUkFUSU9OX0VESVRPUjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHBhdGhuYW1lQXJyYXlbaV0gPT09ICdxdWVzdGlvbl9lZGl0b3InKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFnZUNvbnRleHQgPSBQQUdFX0NPTlRFWFQuUVVFU1RJT05fRURJVE9SO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBQQUdFX0NPTlRFWFQuUVVFU1RJT05fRURJVE9SO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBQQUdFX0NPTlRFWFQuT1RIRVI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGlzSW5FeHBsb3JhdGlvbkNvbnRleHQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKHRoaXMuZ2V0UGFnZUNvbnRleHQoKSA9PT0gUEFHRV9DT05URVhULkVYUExPUkFUSU9OX0VESVRPUiB8fFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmdldFBhZ2VDb250ZXh0KCkgPT09IFBBR0VfQ09OVEVYVC5FWFBMT1JBVElPTl9QTEFZRVIpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGlzSW5RdWVzdGlvbkNvbnRleHQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKHRoaXMuZ2V0UGFnZUNvbnRleHQoKSA9PT0gUEFHRV9DT05URVhULlFVRVNUSU9OX0VESVRPUik7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gUmV0dXJucyBhIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIGV4cGxvcmF0aW9uSWQgKG9idGFpbmVkIGZyb20gdGhlXG4gICAgICAgICAgICAvLyBVUkwpLlxuICAgICAgICAgICAgZ2V0RXhwbG9yYXRpb25JZDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBleHBsb3JhdGlvbklkO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVGhlIHBhdGhuYW1lIHNob3VsZCBiZSBvbmUgb2YgL2V4cGxvcmUve2V4cGxvcmF0aW9uX2lkfSBvclxuICAgICAgICAgICAgICAgICAgICAvLyAvY3JlYXRlL3tleHBsb3JhdGlvbl9pZH0gb3IgL2VtYmVkL2V4cGxvcmF0aW9uL3tleHBsb3JhdGlvbl9pZH0uXG4gICAgICAgICAgICAgICAgICAgIHZhciBwYXRobmFtZUFycmF5ID0gVXJsU2VydmljZS5nZXRQYXRobmFtZSgpLnNwbGl0KCcvJyk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGF0aG5hbWVBcnJheS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBhdGhuYW1lQXJyYXlbaV0gPT09ICdleHBsb3JlJyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGhuYW1lQXJyYXlbaV0gPT09ICdjcmVhdGUnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhwbG9yYXRpb25JZCA9IHBhdGhuYW1lQXJyYXlbaSArIDFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBwYXRobmFtZUFycmF5W2kgKyAxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwYXRobmFtZUFycmF5W2ldID09PSAnZW1iZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhwbG9yYXRpb25JZCA9IHBhdGhuYW1lQXJyYXlbaSArIDJdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBleHBsb3JhdGlvbklkO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdFUlJPUjogQ29udGV4dFNlcnZpY2Ugc2hvdWxkIG5vdCBiZSB1c2VkIG91dHNpZGUgdGhlICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJ2NvbnRleHQgb2YgYW4gZXhwbG9yYXRpb24gb3IgYSBxdWVzdGlvbi4nKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gUmV0dXJucyBhIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIHF1ZXN0aW9uSWQgKG9idGFpbmVkIGZyb20gdGhlXG4gICAgICAgICAgICAvLyBVUkwpLlxuICAgICAgICAgICAgZ2V0UXVlc3Rpb25JZDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmIChxdWVzdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBxdWVzdGlvbklkO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVGhlIHBhdGhuYW1lIHNob3VsZCAvcXVlc3Rpb25fZWRpdG9yL3txdWVzdGlvbl9pZH0uXG4gICAgICAgICAgICAgICAgICAgIHZhciBwYXRobmFtZUFycmF5ID0gVXJsU2VydmljZS5nZXRQYXRobmFtZSgpLnNwbGl0KCcvJyk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGF0aG5hbWVBcnJheS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBhdGhuYW1lQXJyYXlbaV0gPT09ICdxdWVzdGlvbl9lZGl0b3InKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcXVlc3Rpb25JZCA9IHBhdGhuYW1lQXJyYXlbaSArIDFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBwYXRobmFtZUFycmF5W2kgKyAxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignRVJST1I6IENvbnRleHRTZXJ2aWNlIHNob3VsZCBub3QgYmUgdXNlZCBvdXRzaWRlIHRoZSAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICdjb250ZXh0IG9mIGFuIGV4cGxvcmF0aW9uIG9yIGEgcXVlc3Rpb24uJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIEZvbGxvd2luZyBtZXRob2QgaGVscHMgdG8ga25vdyB3aGV0aGVyIGV4cGxvcmF0aW9uIGVkaXRvciBpc1xuICAgICAgICAgICAgLy8gaW4gbWFpbiBlZGl0aW5nIG1vZGUgb3IgcHJldmlldyBtb2RlLlxuICAgICAgICAgICAgaXNJbkV4cGxvcmF0aW9uRWRpdG9yTW9kZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAodGhpcy5nZXRQYWdlQ29udGV4dCgpID09PSBQQUdFX0NPTlRFWFQuRVhQTE9SQVRJT05fRURJVE9SICYmXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ2V0RWRpdG9yVGFiQ29udGV4dCgpID09PSAoRVhQTE9SQVRJT05fRURJVE9SX1RBQl9DT05URVhULkVESVRPUikpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGlzSW5FeHBsb3JhdGlvbkVkaXRvclBhZ2U6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRQYWdlQ29udGV4dCgpID09PSBQQUdFX0NPTlRFWFQuRVhQTE9SQVRJT05fRURJVE9SO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIGZvciBtYW5pcHVsYXRpbmcgdGhlIHBhZ2UgVVJMLiBBbHNvIGFsbG93c1xuICogZnVuY3Rpb25zIG9uICR3aW5kb3cgdG8gYmUgbW9ja2VkIGluIHVuaXQgdGVzdHMuXG4gKi9cbm9wcGlhLmZhY3RvcnkoJ1VybFNlcnZpY2UnLCBbJyR3aW5kb3cnLCBmdW5jdGlvbiAoJHdpbmRvdykge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLy8gVGhpcyBmdW5jdGlvbiBpcyBmb3IgdGVzdGluZyBwdXJwb3NlcyAodG8gbW9jayAkd2luZG93LmxvY2F0aW9uKVxuICAgICAgICAgICAgZ2V0Q3VycmVudExvY2F0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICR3aW5kb3cubG9jYXRpb247XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0Q3VycmVudFF1ZXJ5U3RyaW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0Q3VycmVudExvY2F0aW9uKCkuc2VhcmNoO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qIEFzIHBhcmFtc1trZXldIGlzIG92ZXJ3cml0dGVuLCBpZiBxdWVyeSBzdHJpbmcgaGFzIG11bHRpcGxlIGZpZWxkVmFsdWVzXG4gICAgICAgICAgICAgICBmb3Igc2FtZSBmaWVsZE5hbWUsIHVzZSBnZXRRdWVyeUZpZWxkVmFsdWVzQXNMaXN0KGZpZWxkTmFtZSkgdG8gZ2V0IGl0XG4gICAgICAgICAgICAgICBpbiBhcnJheSBmb3JtLiAqL1xuICAgICAgICAgICAgZ2V0VXJsUGFyYW1zOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBhcmFtcyA9IHt9O1xuICAgICAgICAgICAgICAgIHZhciBwYXJ0cyA9IHRoaXMuZ2V0Q3VycmVudFF1ZXJ5U3RyaW5nKCkucmVwbGFjZSgvWz8mXSsoW149Jl0rKT0oW14mXSopL2dpLCBmdW5jdGlvbiAobSwga2V5LCB2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICBwYXJhbXNbZGVjb2RlVVJJQ29tcG9uZW50KGtleSldID0gZGVjb2RlVVJJQ29tcG9uZW50KHZhbHVlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyYW1zO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGlzSWZyYW1lZDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBwYXRobmFtZSA9IHRoaXMuZ2V0UGF0aG5hbWUoKTtcbiAgICAgICAgICAgICAgICB2YXIgdXJsUGFydHMgPSBwYXRobmFtZS5zcGxpdCgnLycpO1xuICAgICAgICAgICAgICAgIHJldHVybiB1cmxQYXJ0c1sxXSA9PT0gJ2VtYmVkJztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRQYXRobmFtZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmdldEN1cnJlbnRMb2NhdGlvbigpLnBhdGhuYW1lO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIFRvcGljIGlkIHNob3VsZCBiZSBjb3JyZWN0bHkgcmV0dXJuZWQgZnJvbSB0b3BpYyBlZGl0b3IgYXMgd2VsbCBhc1xuICAgICAgICAgICAgLy8gc3RvcnkgZWRpdG9yLCBzaW5jZSBib3RoIGhhdmUgdG9waWMgaWQgaW4gdGhlaXIgdXJsLlxuICAgICAgICAgICAgZ2V0VG9waWNJZEZyb21Vcmw6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgcGF0aG5hbWUgPSB0aGlzLmdldFBhdGhuYW1lKCk7XG4gICAgICAgICAgICAgICAgaWYgKHBhdGhuYW1lLm1hdGNoKC9cXC8oc3Rvcnl8dG9waWMpX2VkaXRvclxcLyhcXHd8LSl7MTJ9L2cpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwYXRobmFtZS5zcGxpdCgnLycpWzJdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignSW52YWxpZCB0b3BpYyBpZCB1cmwnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRUb3BpY05hbWVGcm9tTGVhcm5lclVybDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBwYXRobmFtZSA9IHRoaXMuZ2V0UGF0aG5hbWUoKTtcbiAgICAgICAgICAgICAgICBpZiAocGF0aG5hbWUubWF0Y2goL1xcLyhzdG9yeXx0b3BpY3xwcmFjdGljZV9zZXNzaW9uKS9nKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KHBhdGhuYW1lLnNwbGl0KCcvJylbMl0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignSW52YWxpZCBVUkwgZm9yIHRvcGljJyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0U3RvcnlJZEZyb21Vcmw6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgcGF0aG5hbWUgPSB0aGlzLmdldFBhdGhuYW1lKCk7XG4gICAgICAgICAgICAgICAgaWYgKHBhdGhuYW1lLm1hdGNoKC9cXC9zdG9yeV9lZGl0b3IoXFwvKFxcd3wtKXsxMn0pezJ9L2cpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwYXRobmFtZS5zcGxpdCgnLycpWzNdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignSW52YWxpZCBzdG9yeSBpZCB1cmwnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRTdG9yeUlkSW5QbGF5ZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgcXVlcnkgPSB0aGlzLmdldEN1cnJlbnRRdWVyeVN0cmluZygpO1xuICAgICAgICAgICAgICAgIGlmIChxdWVyeS5tYXRjaCgvXFw/c3RvcnlfaWQ9KChcXHd8LSl7MTJ9KS9nKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcXVlcnkuc3BsaXQoJz0nKVsxXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0U2tpbGxJZEZyb21Vcmw6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgcGF0aG5hbWUgPSB0aGlzLmdldFBhdGhuYW1lKCk7XG4gICAgICAgICAgICAgICAgdmFyIHNraWxsSWQgPSBwYXRobmFtZS5zcGxpdCgnLycpWzJdO1xuICAgICAgICAgICAgICAgIGlmIChza2lsbElkLmxlbmd0aCAhPT0gMTIpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ0ludmFsaWQgU2tpbGwgSWQnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNraWxsSWQ7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0UXVlcnlGaWVsZFZhbHVlc0FzTGlzdDogZnVuY3Rpb24gKGZpZWxkTmFtZSkge1xuICAgICAgICAgICAgICAgIHZhciBmaWVsZFZhbHVlcyA9IFtdO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmdldEN1cnJlbnRRdWVyeVN0cmluZygpLmluZGV4T2YoJz8nKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEVhY2ggcXVlcnlJdGVtIHJldHVybiBvbmUgZmllbGQtdmFsdWUgcGFpciBpbiB0aGUgdXJsLlxuICAgICAgICAgICAgICAgICAgICB2YXIgcXVlcnlJdGVtcyA9IHRoaXMuZ2V0Q3VycmVudFF1ZXJ5U3RyaW5nKCkuc2xpY2UodGhpcy5nZXRDdXJyZW50UXVlcnlTdHJpbmcoKS5pbmRleE9mKCc/JykgKyAxKS5zcGxpdCgnJicpO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHF1ZXJ5SXRlbXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjdXJyZW50RmllbGROYW1lID0gZGVjb2RlVVJJQ29tcG9uZW50KHF1ZXJ5SXRlbXNbaV0uc3BsaXQoJz0nKVswXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY3VycmVudEZpZWxkVmFsdWUgPSBkZWNvZGVVUklDb21wb25lbnQocXVlcnlJdGVtc1tpXS5zcGxpdCgnPScpWzFdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjdXJyZW50RmllbGROYW1lID09PSBmaWVsZE5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWVsZFZhbHVlcy5wdXNoKGN1cnJlbnRGaWVsZFZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZmllbGRWYWx1ZXM7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYWRkRmllbGQ6IGZ1bmN0aW9uICh1cmwsIGZpZWxkTmFtZSwgZmllbGRWYWx1ZSkge1xuICAgICAgICAgICAgICAgIHZhciBlbmNvZGVkRmllbGRWYWx1ZSA9IGVuY29kZVVSSUNvbXBvbmVudChmaWVsZFZhbHVlKTtcbiAgICAgICAgICAgICAgICB2YXIgZW5jb2RlZEZpZWxkTmFtZSA9IGVuY29kZVVSSUNvbXBvbmVudChmaWVsZE5hbWUpO1xuICAgICAgICAgICAgICAgIHJldHVybiB1cmwgKyAodXJsLmluZGV4T2YoJz8nKSAhPT0gLTEgPyAnJicgOiAnPycpICsgZW5jb2RlZEZpZWxkTmFtZSArXG4gICAgICAgICAgICAgICAgICAgICc9JyArIGVuY29kZWRGaWVsZFZhbHVlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldEhhc2g6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRDdXJyZW50TG9jYXRpb24oKS5oYXNoO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1dKTtcbiJdLCJzb3VyY2VSb290IjoiIn0=