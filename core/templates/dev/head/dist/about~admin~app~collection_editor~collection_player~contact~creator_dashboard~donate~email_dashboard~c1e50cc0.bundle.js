(window["webpackJsonp"] = window["webpackJsonp"] || []).push([["about~admin~app~collection_editor~collection_player~contact~creator_dashboard~donate~email_dashboard~c1e50cc0"],{

/***/ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts":
/*!*****************************************************************************!*\
  !*** ./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts ***!
  \*****************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
__webpack_require__(/*! services/UtilsService.ts */ "./core/templates/dev/head/services/UtilsService.ts");
/**
 * @fileoverview Service to construct URLs by inserting variables within them as
 * necessary to have a fully-qualified URL.
 */
oppia.factory('UrlInterpolationService', [
    'AlertsService', 'UtilsService', 'DEV_MODE',
    function (AlertsService, UtilsService, DEV_MODE) {
        var validateResourcePath = function (resourcePath) {
            if (!resourcePath) {
                AlertsService.fatalWarning('Empty path passed in method.');
            }
            var RESOURCE_PATH_STARTS_WITH_FORWARD_SLASH = /^\//;
            // Ensure that resourcePath starts with a forward slash.
            if (!resourcePath.match(RESOURCE_PATH_STARTS_WITH_FORWARD_SLASH)) {
                AlertsService.fatalWarning('Path must start with \'\/\': \'' + resourcePath + '\'.');
            }
        };
        /**
         * Given a resource path relative to subfolder in /,
         * returns resource path with cache slug.
         */
        var getUrlWithSlug = function (resourcePath) {
            if (!DEV_MODE) {
                if (hashes[resourcePath]) {
                    var index = resourcePath.lastIndexOf('.');
                    return (resourcePath.slice(0, index) + '.' + hashes[resourcePath] +
                        resourcePath.slice(index));
                }
            }
            return resourcePath;
        };
        /**
         * Given a resource path relative to subfolder in /,
         * returns complete resource path with cache slug and prefixed with url
         * depending on dev/prod mode.
         */
        var getCompleteUrl = function (prefix, path) {
            if (DEV_MODE) {
                return prefix + getUrlWithSlug(path);
            }
            else {
                return '/build' + prefix + getUrlWithSlug(path);
            }
        };
        /**
         * Given a resource path relative to extensions folder,
         * returns the complete url path to that resource.
         */
        var getExtensionResourceUrl = function (resourcePath) {
            validateResourcePath(resourcePath);
            return getCompleteUrl('/extensions', resourcePath);
        };
        return {
            /**
             * Given a formatted URL, interpolates the URL by inserting values the URL
             * needs using the interpolationValues object. For example, urlTemplate
             * might be:
             *
             *   /createhandler/resolved_answers/<exploration_id>/<escaped_state_name>
             *
             * interpolationValues is an object whose keys are variables within the
             * URL. For the above example, interpolationValues may look something
             * like:
             *
             *   { 'exploration_id': '0', 'escaped_state_name': 'InputBinaryNumber' }
             *
             * If a URL requires a value which is not keyed within the
             * interpolationValues object, this will return null.
             */
            interpolateUrl: function (urlTemplate, interpolationValues) {
                if (!urlTemplate) {
                    AlertsService.fatalWarning('Invalid or empty URL template passed in: \'' + urlTemplate + '\'');
                    return null;
                }
                // http://stackoverflow.com/questions/4775722
                if (!(interpolationValues instanceof Object) || (Object.prototype.toString.call(interpolationValues) === '[object Array]')) {
                    AlertsService.fatalWarning('Expected an object of interpolation values to be passed into ' +
                        'interpolateUrl.');
                    return null;
                }
                // Valid pattern: <alphanum>
                var INTERPOLATION_VARIABLE_REGEX = /<(\w+)>/;
                // Invalid patterns: <<stuff>>, <stuff>>>, <>
                var EMPTY_VARIABLE_REGEX = /<>/;
                var INVALID_VARIABLE_REGEX = /(<{2,})(\w*)(>{2,})/;
                if (urlTemplate.match(INVALID_VARIABLE_REGEX) ||
                    urlTemplate.match(EMPTY_VARIABLE_REGEX)) {
                    AlertsService.fatalWarning('Invalid URL template received: \'' + urlTemplate + '\'');
                    return null;
                }
                var escapedInterpolationValues = {};
                for (var varName in interpolationValues) {
                    var value = interpolationValues[varName];
                    if (!UtilsService.isString(value)) {
                        AlertsService.fatalWarning('Parameters passed into interpolateUrl must be strings.');
                        return null;
                    }
                    escapedInterpolationValues[varName] = encodeURIComponent(value);
                }
                // Ensure the URL has no nested brackets (which would lead to
                // indirection in the interpolated variables).
                var filledUrl = angular.copy(urlTemplate);
                var match = filledUrl.match(INTERPOLATION_VARIABLE_REGEX);
                while (match) {
                    var currentVarName = match[1];
                    if (!escapedInterpolationValues.hasOwnProperty(currentVarName)) {
                        AlertsService.fatalWarning('Expected variable \'' + currentVarName +
                            '\' when interpolating URL.');
                        return null;
                    }
                    filledUrl = filledUrl.replace(INTERPOLATION_VARIABLE_REGEX, escapedInterpolationValues[currentVarName]);
                    match = filledUrl.match(INTERPOLATION_VARIABLE_REGEX);
                }
                return filledUrl;
            },
            /**
             * Given an image path relative to /assets/images folder,
             * returns the complete url path to that image.
             */
            getStaticImageUrl: function (imagePath) {
                validateResourcePath(imagePath);
                return getCompleteUrl('/assets', '/images' + imagePath);
            },
            /**
             * Given an story id returns the complete url path to that image.
             */
            getStoryUrl: function (storyId) {
                validateResourcePath(storyId);
                return '/story' + storyId;
            },
            /**
             * Given a video path relative to /assets/videos folder,
             * returns the complete url path to that image.
             */
            getStaticVideoUrl: function (videoPath) {
                validateResourcePath(videoPath);
                return getCompleteUrl('/assets', '/videos' + videoPath);
            },
            /**
             * Given a path relative to /assets folder, returns the complete url path
             * to that asset.
             */
            getStaticAssetUrl: function (assetPath) {
                validateResourcePath(assetPath);
                return getCompleteUrl('/assets', assetPath);
            },
            /**
             * Given an interaction id, returns the complete url path to
             * the thumbnail image for the interaction.
             */
            getInteractionThumbnailImageUrl: function (interactionId) {
                if (!interactionId) {
                    AlertsService.fatalWarning('Empty interactionId passed in getInteractionThumbnailImageUrl.');
                }
                return getExtensionResourceUrl('/interactions/' + interactionId +
                    '/static/' + interactionId + '.png');
            },
            /**
             * Given a directive path relative to head folder,
             * returns the complete url path to that directive.
             */
            getDirectiveTemplateUrl: function (path) {
                validateResourcePath(path);
                if (DEV_MODE) {
                    return '/templates/dev/head' + getUrlWithSlug(path);
                }
                else {
                    return '/build/templates/head' + getUrlWithSlug(path);
                }
            },
            getExtensionResourceUrl: getExtensionResourceUrl,
            _getUrlWithSlug: getUrlWithSlug,
            _getCompleteUrl: getCompleteUrl
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/services/AlertsService.ts":
/*!***********************************************************!*\
  !*** ./core/templates/dev/head/services/AlertsService.ts ***!
  \***********************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Factory for handling warnings and info messages.
 */
oppia.factory('AlertsService', ['$log', function ($log) {
        var AlertsService = {
            /**
             * Each element in each of the arrays here is an object with two keys:
             *   - type:  a string specifying the type of message or warning.
             *            Possible types - "warning", "info" or "success".
             *   - content: a string containing the warning or message.
             */
            /**
             * Array of "warning" messages.
             */
            warnings: [],
            /**
             * Array of "success" or "info" messages.
             */
            messages: [],
            addWarning: null,
            fatalWarning: null,
            deleteWarning: null,
            clearWarnings: null,
            addMessage: null,
            deleteMessage: null,
            addInfoMessage: null,
            addSuccessMessage: null,
            clearMessages: null
        };
        // This is to prevent infinite loops.
        var MAX_TOTAL_WARNINGS = 10;
        var MAX_TOTAL_MESSAGES = 10;
        /**
         * Adds a warning message.
         * @param {string} warning - The warning message to display.
         */
        AlertsService.addWarning = function (warning) {
            $log.error(warning);
            if (AlertsService.warnings.length >= MAX_TOTAL_WARNINGS) {
                return;
            }
            AlertsService.warnings.push({
                type: 'warning',
                content: warning
            });
        };
        /**
         * Adds a warning in the same way as addWarning(), except it also throws an
         * exception to cause a hard failure in the frontend.
         * @param {string} warning - The warning message to display.
         */
        AlertsService.fatalWarning = function (warning) {
            AlertsService.addWarning(warning);
            throw new Error(warning);
        };
        /**
         * Deletes the warning from the warnings list.
         * @param {Object} warningObject - The warning message to be deleted.
         */
        AlertsService.deleteWarning = function (warningObject) {
            var warnings = AlertsService.warnings;
            var newWarnings = [];
            for (var i = 0; i < warnings.length; i++) {
                if (warnings[i].content !== warningObject.content) {
                    newWarnings.push(warnings[i]);
                }
            }
            AlertsService.warnings = newWarnings;
        };
        /**
         * Clears all warnings.
         */
        AlertsService.clearWarnings = function () {
            AlertsService.warnings = [];
        };
        /**
         * Adds a message, can be info messages or success messages.
         * @param {string} type - Type of message
         * @param {string} message - Message content
         * @param {number|undefined} timeoutMilliseconds - Timeout for the toast.
         */
        AlertsService.addMessage = function (type, message, timeoutMilliseconds) {
            if (AlertsService.messages.length >= MAX_TOTAL_MESSAGES) {
                return;
            }
            AlertsService.messages.push({
                type: type,
                content: message,
                timeout: timeoutMilliseconds
            });
        };
        /**
         * Deletes the message from the messages list.
         * @param {Object} messageObject - Message to be deleted.
         */
        AlertsService.deleteMessage = function (messageObject) {
            var messages = AlertsService.messages;
            var newMessages = [];
            for (var i = 0; i < messages.length; i++) {
                if (messages[i].type !== messageObject.type ||
                    messages[i].content !== messageObject.content) {
                    newMessages.push(messages[i]);
                }
            }
            AlertsService.messages = newMessages;
        };
        /**
         * Adds an info message.
         * @param {string} message - Info message to display.
         * @param {number|undefined} timeoutMilliseconds - Timeout for the toast.
         */
        AlertsService.addInfoMessage = function (message, timeoutMilliseconds) {
            if (timeoutMilliseconds === undefined) {
                timeoutMilliseconds = 1500;
            }
            AlertsService.addMessage('info', message, timeoutMilliseconds);
        };
        /**
         * Adds a success message.
         * @param {string} message - Success message to display
         * @param {number|undefined} timeoutMilliseconds - Timeout for the toast.
         */
        AlertsService.addSuccessMessage = function (message, timeoutMilliseconds) {
            if (timeoutMilliseconds === undefined) {
                timeoutMilliseconds = 1500;
            }
            AlertsService.addMessage('success', message, timeoutMilliseconds);
        };
        /**
         * Clears all messages.
         */
        AlertsService.clearMessages = function () {
            AlertsService.messages = [];
        };
        return AlertsService;
    }]);


/***/ }),

/***/ "./core/templates/dev/head/services/UtilsService.ts":
/*!**********************************************************!*\
  !*** ./core/templates/dev/head/services/UtilsService.ts ***!
  \**********************************************************/
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
 * @fileoverview Service for storing all generic functions which have to be
 * used at multiple places in the codebase.
 */
oppia.factory('UtilsService', [function () {
        var utils = {
            isEmpty: function (obj) {
                for (var property in obj) {
                    if (obj.hasOwnProperty(property)) {
                        return false;
                    }
                }
                return true;
            },
            // http://stackoverflow.com/questions/203739
            isString: function (input) {
                return (typeof input === 'string' || input instanceof String);
            }
        };
        return utils;
    }]);


/***/ })

}]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9kb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3NlcnZpY2VzL0FsZXJ0c1NlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvc2VydmljZXMvVXRpbHNTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQyxzRkFBMkI7QUFDbkMsbUJBQU8sQ0FBQyxvRkFBMEI7QUFDbEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQkFBa0I7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpREFBaUQsR0FBRyxTQUFTLEdBQUc7QUFDaEU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDOUxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBbUIsT0FBTztBQUMxQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBbUIsT0FBTztBQUMxQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFtQixPQUFPO0FBQzFCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkJBQTJCLHFCQUFxQjtBQUNoRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQW1CLE9BQU87QUFDMUIsbUJBQW1CLE9BQU87QUFDMUIsbUJBQW1CLGlCQUFpQjtBQUNwQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0EsbUJBQW1CLE9BQU87QUFDMUI7QUFDQTtBQUNBO0FBQ0E7QUFDQSwyQkFBMkIscUJBQXFCO0FBQ2hEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFtQixPQUFPO0FBQzFCLG1CQUFtQixpQkFBaUI7QUFDcEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQW1CLE9BQU87QUFDMUIsbUJBQW1CLGlCQUFpQjtBQUNwQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSzs7Ozs7Ozs7Ozs7O0FDcEpMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSyIsImZpbGUiOiJhYm91dH5hZG1pbn5hcHB+Y29sbGVjdGlvbl9lZGl0b3J+Y29sbGVjdGlvbl9wbGF5ZXJ+Y29udGFjdH5jcmVhdG9yX2Rhc2hib2FyZH5kb25hdGV+ZW1haWxfZGFzaGJvYXJkfmMxZTUwY2MwLmJ1bmRsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE1IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG5yZXF1aXJlKCdzZXJ2aWNlcy9BbGVydHNTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9VdGlsc1NlcnZpY2UudHMnKTtcbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIHRvIGNvbnN0cnVjdCBVUkxzIGJ5IGluc2VydGluZyB2YXJpYWJsZXMgd2l0aGluIHRoZW0gYXNcbiAqIG5lY2Vzc2FyeSB0byBoYXZlIGEgZnVsbHktcXVhbGlmaWVkIFVSTC5cbiAqL1xub3BwaWEuZmFjdG9yeSgnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLCBbXG4gICAgJ0FsZXJ0c1NlcnZpY2UnLCAnVXRpbHNTZXJ2aWNlJywgJ0RFVl9NT0RFJyxcbiAgICBmdW5jdGlvbiAoQWxlcnRzU2VydmljZSwgVXRpbHNTZXJ2aWNlLCBERVZfTU9ERSkge1xuICAgICAgICB2YXIgdmFsaWRhdGVSZXNvdXJjZVBhdGggPSBmdW5jdGlvbiAocmVzb3VyY2VQYXRoKSB7XG4gICAgICAgICAgICBpZiAoIXJlc291cmNlUGF0aCkge1xuICAgICAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UuZmF0YWxXYXJuaW5nKCdFbXB0eSBwYXRoIHBhc3NlZCBpbiBtZXRob2QuJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgUkVTT1VSQ0VfUEFUSF9TVEFSVFNfV0lUSF9GT1JXQVJEX1NMQVNIID0gL15cXC8vO1xuICAgICAgICAgICAgLy8gRW5zdXJlIHRoYXQgcmVzb3VyY2VQYXRoIHN0YXJ0cyB3aXRoIGEgZm9yd2FyZCBzbGFzaC5cbiAgICAgICAgICAgIGlmICghcmVzb3VyY2VQYXRoLm1hdGNoKFJFU09VUkNFX1BBVEhfU1RBUlRTX1dJVEhfRk9SV0FSRF9TTEFTSCkpIHtcbiAgICAgICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmZhdGFsV2FybmluZygnUGF0aCBtdXN0IHN0YXJ0IHdpdGggXFwnXFwvXFwnOiBcXCcnICsgcmVzb3VyY2VQYXRoICsgJ1xcJy4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdpdmVuIGEgcmVzb3VyY2UgcGF0aCByZWxhdGl2ZSB0byBzdWJmb2xkZXIgaW4gLyxcbiAgICAgICAgICogcmV0dXJucyByZXNvdXJjZSBwYXRoIHdpdGggY2FjaGUgc2x1Zy5cbiAgICAgICAgICovXG4gICAgICAgIHZhciBnZXRVcmxXaXRoU2x1ZyA9IGZ1bmN0aW9uIChyZXNvdXJjZVBhdGgpIHtcbiAgICAgICAgICAgIGlmICghREVWX01PREUpIHtcbiAgICAgICAgICAgICAgICBpZiAoaGFzaGVzW3Jlc291cmNlUGF0aF0pIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGluZGV4ID0gcmVzb3VyY2VQYXRoLmxhc3RJbmRleE9mKCcuJyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAocmVzb3VyY2VQYXRoLnNsaWNlKDAsIGluZGV4KSArICcuJyArIGhhc2hlc1tyZXNvdXJjZVBhdGhdICtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc291cmNlUGF0aC5zbGljZShpbmRleCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZXNvdXJjZVBhdGg7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHaXZlbiBhIHJlc291cmNlIHBhdGggcmVsYXRpdmUgdG8gc3ViZm9sZGVyIGluIC8sXG4gICAgICAgICAqIHJldHVybnMgY29tcGxldGUgcmVzb3VyY2UgcGF0aCB3aXRoIGNhY2hlIHNsdWcgYW5kIHByZWZpeGVkIHdpdGggdXJsXG4gICAgICAgICAqIGRlcGVuZGluZyBvbiBkZXYvcHJvZCBtb2RlLlxuICAgICAgICAgKi9cbiAgICAgICAgdmFyIGdldENvbXBsZXRlVXJsID0gZnVuY3Rpb24gKHByZWZpeCwgcGF0aCkge1xuICAgICAgICAgICAgaWYgKERFVl9NT0RFKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHByZWZpeCArIGdldFVybFdpdGhTbHVnKHBhdGgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICcvYnVpbGQnICsgcHJlZml4ICsgZ2V0VXJsV2l0aFNsdWcocGF0aCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHaXZlbiBhIHJlc291cmNlIHBhdGggcmVsYXRpdmUgdG8gZXh0ZW5zaW9ucyBmb2xkZXIsXG4gICAgICAgICAqIHJldHVybnMgdGhlIGNvbXBsZXRlIHVybCBwYXRoIHRvIHRoYXQgcmVzb3VyY2UuXG4gICAgICAgICAqL1xuICAgICAgICB2YXIgZ2V0RXh0ZW5zaW9uUmVzb3VyY2VVcmwgPSBmdW5jdGlvbiAocmVzb3VyY2VQYXRoKSB7XG4gICAgICAgICAgICB2YWxpZGF0ZVJlc291cmNlUGF0aChyZXNvdXJjZVBhdGgpO1xuICAgICAgICAgICAgcmV0dXJuIGdldENvbXBsZXRlVXJsKCcvZXh0ZW5zaW9ucycsIHJlc291cmNlUGF0aCk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEdpdmVuIGEgZm9ybWF0dGVkIFVSTCwgaW50ZXJwb2xhdGVzIHRoZSBVUkwgYnkgaW5zZXJ0aW5nIHZhbHVlcyB0aGUgVVJMXG4gICAgICAgICAgICAgKiBuZWVkcyB1c2luZyB0aGUgaW50ZXJwb2xhdGlvblZhbHVlcyBvYmplY3QuIEZvciBleGFtcGxlLCB1cmxUZW1wbGF0ZVxuICAgICAgICAgICAgICogbWlnaHQgYmU6XG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogICAvY3JlYXRlaGFuZGxlci9yZXNvbHZlZF9hbnN3ZXJzLzxleHBsb3JhdGlvbl9pZD4vPGVzY2FwZWRfc3RhdGVfbmFtZT5cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBpbnRlcnBvbGF0aW9uVmFsdWVzIGlzIGFuIG9iamVjdCB3aG9zZSBrZXlzIGFyZSB2YXJpYWJsZXMgd2l0aGluIHRoZVxuICAgICAgICAgICAgICogVVJMLiBGb3IgdGhlIGFib3ZlIGV4YW1wbGUsIGludGVycG9sYXRpb25WYWx1ZXMgbWF5IGxvb2sgc29tZXRoaW5nXG4gICAgICAgICAgICAgKiBsaWtlOlxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqICAgeyAnZXhwbG9yYXRpb25faWQnOiAnMCcsICdlc2NhcGVkX3N0YXRlX25hbWUnOiAnSW5wdXRCaW5hcnlOdW1iZXInIH1cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBJZiBhIFVSTCByZXF1aXJlcyBhIHZhbHVlIHdoaWNoIGlzIG5vdCBrZXllZCB3aXRoaW4gdGhlXG4gICAgICAgICAgICAgKiBpbnRlcnBvbGF0aW9uVmFsdWVzIG9iamVjdCwgdGhpcyB3aWxsIHJldHVybiBudWxsLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBpbnRlcnBvbGF0ZVVybDogZnVuY3Rpb24gKHVybFRlbXBsYXRlLCBpbnRlcnBvbGF0aW9uVmFsdWVzKSB7XG4gICAgICAgICAgICAgICAgaWYgKCF1cmxUZW1wbGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmZhdGFsV2FybmluZygnSW52YWxpZCBvciBlbXB0eSBVUkwgdGVtcGxhdGUgcGFzc2VkIGluOiBcXCcnICsgdXJsVGVtcGxhdGUgKyAnXFwnJyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzQ3NzU3MjJcbiAgICAgICAgICAgICAgICBpZiAoIShpbnRlcnBvbGF0aW9uVmFsdWVzIGluc3RhbmNlb2YgT2JqZWN0KSB8fCAoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGludGVycG9sYXRpb25WYWx1ZXMpID09PSAnW29iamVjdCBBcnJheV0nKSkge1xuICAgICAgICAgICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmZhdGFsV2FybmluZygnRXhwZWN0ZWQgYW4gb2JqZWN0IG9mIGludGVycG9sYXRpb24gdmFsdWVzIHRvIGJlIHBhc3NlZCBpbnRvICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJ2ludGVycG9sYXRlVXJsLicpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gVmFsaWQgcGF0dGVybjogPGFscGhhbnVtPlxuICAgICAgICAgICAgICAgIHZhciBJTlRFUlBPTEFUSU9OX1ZBUklBQkxFX1JFR0VYID0gLzwoXFx3Kyk+LztcbiAgICAgICAgICAgICAgICAvLyBJbnZhbGlkIHBhdHRlcm5zOiA8PHN0dWZmPj4sIDxzdHVmZj4+PiwgPD5cbiAgICAgICAgICAgICAgICB2YXIgRU1QVFlfVkFSSUFCTEVfUkVHRVggPSAvPD4vO1xuICAgICAgICAgICAgICAgIHZhciBJTlZBTElEX1ZBUklBQkxFX1JFR0VYID0gLyg8ezIsfSkoXFx3KikoPnsyLH0pLztcbiAgICAgICAgICAgICAgICBpZiAodXJsVGVtcGxhdGUubWF0Y2goSU5WQUxJRF9WQVJJQUJMRV9SRUdFWCkgfHxcbiAgICAgICAgICAgICAgICAgICAgdXJsVGVtcGxhdGUubWF0Y2goRU1QVFlfVkFSSUFCTEVfUkVHRVgpKSB7XG4gICAgICAgICAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UuZmF0YWxXYXJuaW5nKCdJbnZhbGlkIFVSTCB0ZW1wbGF0ZSByZWNlaXZlZDogXFwnJyArIHVybFRlbXBsYXRlICsgJ1xcJycpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIGVzY2FwZWRJbnRlcnBvbGF0aW9uVmFsdWVzID0ge307XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgdmFyTmFtZSBpbiBpbnRlcnBvbGF0aW9uVmFsdWVzKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IGludGVycG9sYXRpb25WYWx1ZXNbdmFyTmFtZV07XG4gICAgICAgICAgICAgICAgICAgIGlmICghVXRpbHNTZXJ2aWNlLmlzU3RyaW5nKHZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgQWxlcnRzU2VydmljZS5mYXRhbFdhcm5pbmcoJ1BhcmFtZXRlcnMgcGFzc2VkIGludG8gaW50ZXJwb2xhdGVVcmwgbXVzdCBiZSBzdHJpbmdzLicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZXNjYXBlZEludGVycG9sYXRpb25WYWx1ZXNbdmFyTmFtZV0gPSBlbmNvZGVVUklDb21wb25lbnQodmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBFbnN1cmUgdGhlIFVSTCBoYXMgbm8gbmVzdGVkIGJyYWNrZXRzICh3aGljaCB3b3VsZCBsZWFkIHRvXG4gICAgICAgICAgICAgICAgLy8gaW5kaXJlY3Rpb24gaW4gdGhlIGludGVycG9sYXRlZCB2YXJpYWJsZXMpLlxuICAgICAgICAgICAgICAgIHZhciBmaWxsZWRVcmwgPSBhbmd1bGFyLmNvcHkodXJsVGVtcGxhdGUpO1xuICAgICAgICAgICAgICAgIHZhciBtYXRjaCA9IGZpbGxlZFVybC5tYXRjaChJTlRFUlBPTEFUSU9OX1ZBUklBQkxFX1JFR0VYKTtcbiAgICAgICAgICAgICAgICB3aGlsZSAobWF0Y2gpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRWYXJOYW1lID0gbWF0Y2hbMV07XG4gICAgICAgICAgICAgICAgICAgIGlmICghZXNjYXBlZEludGVycG9sYXRpb25WYWx1ZXMuaGFzT3duUHJvcGVydHkoY3VycmVudFZhck5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmZhdGFsV2FybmluZygnRXhwZWN0ZWQgdmFyaWFibGUgXFwnJyArIGN1cnJlbnRWYXJOYW1lICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnXFwnIHdoZW4gaW50ZXJwb2xhdGluZyBVUkwuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBmaWxsZWRVcmwgPSBmaWxsZWRVcmwucmVwbGFjZShJTlRFUlBPTEFUSU9OX1ZBUklBQkxFX1JFR0VYLCBlc2NhcGVkSW50ZXJwb2xhdGlvblZhbHVlc1tjdXJyZW50VmFyTmFtZV0pO1xuICAgICAgICAgICAgICAgICAgICBtYXRjaCA9IGZpbGxlZFVybC5tYXRjaChJTlRFUlBPTEFUSU9OX1ZBUklBQkxFX1JFR0VYKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpbGxlZFVybDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEdpdmVuIGFuIGltYWdlIHBhdGggcmVsYXRpdmUgdG8gL2Fzc2V0cy9pbWFnZXMgZm9sZGVyLFxuICAgICAgICAgICAgICogcmV0dXJucyB0aGUgY29tcGxldGUgdXJsIHBhdGggdG8gdGhhdCBpbWFnZS5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZ2V0U3RhdGljSW1hZ2VVcmw6IGZ1bmN0aW9uIChpbWFnZVBhdGgpIHtcbiAgICAgICAgICAgICAgICB2YWxpZGF0ZVJlc291cmNlUGF0aChpbWFnZVBhdGgpO1xuICAgICAgICAgICAgICAgIHJldHVybiBnZXRDb21wbGV0ZVVybCgnL2Fzc2V0cycsICcvaW1hZ2VzJyArIGltYWdlUGF0aCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBHaXZlbiBhbiBzdG9yeSBpZCByZXR1cm5zIHRoZSBjb21wbGV0ZSB1cmwgcGF0aCB0byB0aGF0IGltYWdlLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBnZXRTdG9yeVVybDogZnVuY3Rpb24gKHN0b3J5SWQpIHtcbiAgICAgICAgICAgICAgICB2YWxpZGF0ZVJlc291cmNlUGF0aChzdG9yeUlkKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gJy9zdG9yeScgKyBzdG9yeUlkO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogR2l2ZW4gYSB2aWRlbyBwYXRoIHJlbGF0aXZlIHRvIC9hc3NldHMvdmlkZW9zIGZvbGRlcixcbiAgICAgICAgICAgICAqIHJldHVybnMgdGhlIGNvbXBsZXRlIHVybCBwYXRoIHRvIHRoYXQgaW1hZ2UuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGdldFN0YXRpY1ZpZGVvVXJsOiBmdW5jdGlvbiAodmlkZW9QYXRoKSB7XG4gICAgICAgICAgICAgICAgdmFsaWRhdGVSZXNvdXJjZVBhdGgodmlkZW9QYXRoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZ2V0Q29tcGxldGVVcmwoJy9hc3NldHMnLCAnL3ZpZGVvcycgKyB2aWRlb1BhdGgpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogR2l2ZW4gYSBwYXRoIHJlbGF0aXZlIHRvIC9hc3NldHMgZm9sZGVyLCByZXR1cm5zIHRoZSBjb21wbGV0ZSB1cmwgcGF0aFxuICAgICAgICAgICAgICogdG8gdGhhdCBhc3NldC5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZ2V0U3RhdGljQXNzZXRVcmw6IGZ1bmN0aW9uIChhc3NldFBhdGgpIHtcbiAgICAgICAgICAgICAgICB2YWxpZGF0ZVJlc291cmNlUGF0aChhc3NldFBhdGgpO1xuICAgICAgICAgICAgICAgIHJldHVybiBnZXRDb21wbGV0ZVVybCgnL2Fzc2V0cycsIGFzc2V0UGF0aCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBHaXZlbiBhbiBpbnRlcmFjdGlvbiBpZCwgcmV0dXJucyB0aGUgY29tcGxldGUgdXJsIHBhdGggdG9cbiAgICAgICAgICAgICAqIHRoZSB0aHVtYm5haWwgaW1hZ2UgZm9yIHRoZSBpbnRlcmFjdGlvbi5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZ2V0SW50ZXJhY3Rpb25UaHVtYm5haWxJbWFnZVVybDogZnVuY3Rpb24gKGludGVyYWN0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWludGVyYWN0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgQWxlcnRzU2VydmljZS5mYXRhbFdhcm5pbmcoJ0VtcHR5IGludGVyYWN0aW9uSWQgcGFzc2VkIGluIGdldEludGVyYWN0aW9uVGh1bWJuYWlsSW1hZ2VVcmwuJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBnZXRFeHRlbnNpb25SZXNvdXJjZVVybCgnL2ludGVyYWN0aW9ucy8nICsgaW50ZXJhY3Rpb25JZCArXG4gICAgICAgICAgICAgICAgICAgICcvc3RhdGljLycgKyBpbnRlcmFjdGlvbklkICsgJy5wbmcnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEdpdmVuIGEgZGlyZWN0aXZlIHBhdGggcmVsYXRpdmUgdG8gaGVhZCBmb2xkZXIsXG4gICAgICAgICAgICAgKiByZXR1cm5zIHRoZSBjb21wbGV0ZSB1cmwgcGF0aCB0byB0aGF0IGRpcmVjdGl2ZS5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmw6IGZ1bmN0aW9uIChwYXRoKSB7XG4gICAgICAgICAgICAgICAgdmFsaWRhdGVSZXNvdXJjZVBhdGgocGF0aCk7XG4gICAgICAgICAgICAgICAgaWYgKERFVl9NT0RFKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnL3RlbXBsYXRlcy9kZXYvaGVhZCcgKyBnZXRVcmxXaXRoU2x1ZyhwYXRoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnL2J1aWxkL3RlbXBsYXRlcy9oZWFkJyArIGdldFVybFdpdGhTbHVnKHBhdGgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRFeHRlbnNpb25SZXNvdXJjZVVybDogZ2V0RXh0ZW5zaW9uUmVzb3VyY2VVcmwsXG4gICAgICAgICAgICBfZ2V0VXJsV2l0aFNsdWc6IGdldFVybFdpdGhTbHVnLFxuICAgICAgICAgICAgX2dldENvbXBsZXRlVXJsOiBnZXRDb21wbGV0ZVVybFxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBGYWN0b3J5IGZvciBoYW5kbGluZyB3YXJuaW5ncyBhbmQgaW5mbyBtZXNzYWdlcy5cbiAqL1xub3BwaWEuZmFjdG9yeSgnQWxlcnRzU2VydmljZScsIFsnJGxvZycsIGZ1bmN0aW9uICgkbG9nKSB7XG4gICAgICAgIHZhciBBbGVydHNTZXJ2aWNlID0ge1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBFYWNoIGVsZW1lbnQgaW4gZWFjaCBvZiB0aGUgYXJyYXlzIGhlcmUgaXMgYW4gb2JqZWN0IHdpdGggdHdvIGtleXM6XG4gICAgICAgICAgICAgKiAgIC0gdHlwZTogIGEgc3RyaW5nIHNwZWNpZnlpbmcgdGhlIHR5cGUgb2YgbWVzc2FnZSBvciB3YXJuaW5nLlxuICAgICAgICAgICAgICogICAgICAgICAgICBQb3NzaWJsZSB0eXBlcyAtIFwid2FybmluZ1wiLCBcImluZm9cIiBvciBcInN1Y2Nlc3NcIi5cbiAgICAgICAgICAgICAqICAgLSBjb250ZW50OiBhIHN0cmluZyBjb250YWluaW5nIHRoZSB3YXJuaW5nIG9yIG1lc3NhZ2UuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQXJyYXkgb2YgXCJ3YXJuaW5nXCIgbWVzc2FnZXMuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHdhcm5pbmdzOiBbXSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQXJyYXkgb2YgXCJzdWNjZXNzXCIgb3IgXCJpbmZvXCIgbWVzc2FnZXMuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIG1lc3NhZ2VzOiBbXSxcbiAgICAgICAgICAgIGFkZFdhcm5pbmc6IG51bGwsXG4gICAgICAgICAgICBmYXRhbFdhcm5pbmc6IG51bGwsXG4gICAgICAgICAgICBkZWxldGVXYXJuaW5nOiBudWxsLFxuICAgICAgICAgICAgY2xlYXJXYXJuaW5nczogbnVsbCxcbiAgICAgICAgICAgIGFkZE1lc3NhZ2U6IG51bGwsXG4gICAgICAgICAgICBkZWxldGVNZXNzYWdlOiBudWxsLFxuICAgICAgICAgICAgYWRkSW5mb01lc3NhZ2U6IG51bGwsXG4gICAgICAgICAgICBhZGRTdWNjZXNzTWVzc2FnZTogbnVsbCxcbiAgICAgICAgICAgIGNsZWFyTWVzc2FnZXM6IG51bGxcbiAgICAgICAgfTtcbiAgICAgICAgLy8gVGhpcyBpcyB0byBwcmV2ZW50IGluZmluaXRlIGxvb3BzLlxuICAgICAgICB2YXIgTUFYX1RPVEFMX1dBUk5JTkdTID0gMTA7XG4gICAgICAgIHZhciBNQVhfVE9UQUxfTUVTU0FHRVMgPSAxMDtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEFkZHMgYSB3YXJuaW5nIG1lc3NhZ2UuXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSB3YXJuaW5nIC0gVGhlIHdhcm5pbmcgbWVzc2FnZSB0byBkaXNwbGF5LlxuICAgICAgICAgKi9cbiAgICAgICAgQWxlcnRzU2VydmljZS5hZGRXYXJuaW5nID0gZnVuY3Rpb24gKHdhcm5pbmcpIHtcbiAgICAgICAgICAgICRsb2cuZXJyb3Iod2FybmluZyk7XG4gICAgICAgICAgICBpZiAoQWxlcnRzU2VydmljZS53YXJuaW5ncy5sZW5ndGggPj0gTUFYX1RPVEFMX1dBUk5JTkdTKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgQWxlcnRzU2VydmljZS53YXJuaW5ncy5wdXNoKHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnd2FybmluZycsXG4gICAgICAgICAgICAgICAgY29udGVudDogd2FybmluZ1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBZGRzIGEgd2FybmluZyBpbiB0aGUgc2FtZSB3YXkgYXMgYWRkV2FybmluZygpLCBleGNlcHQgaXQgYWxzbyB0aHJvd3MgYW5cbiAgICAgICAgICogZXhjZXB0aW9uIHRvIGNhdXNlIGEgaGFyZCBmYWlsdXJlIGluIHRoZSBmcm9udGVuZC5cbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHdhcm5pbmcgLSBUaGUgd2FybmluZyBtZXNzYWdlIHRvIGRpc3BsYXkuXG4gICAgICAgICAqL1xuICAgICAgICBBbGVydHNTZXJ2aWNlLmZhdGFsV2FybmluZyA9IGZ1bmN0aW9uICh3YXJuaW5nKSB7XG4gICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmFkZFdhcm5pbmcod2FybmluZyk7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3Iod2FybmluZyk7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEZWxldGVzIHRoZSB3YXJuaW5nIGZyb20gdGhlIHdhcm5pbmdzIGxpc3QuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSB3YXJuaW5nT2JqZWN0IC0gVGhlIHdhcm5pbmcgbWVzc2FnZSB0byBiZSBkZWxldGVkLlxuICAgICAgICAgKi9cbiAgICAgICAgQWxlcnRzU2VydmljZS5kZWxldGVXYXJuaW5nID0gZnVuY3Rpb24gKHdhcm5pbmdPYmplY3QpIHtcbiAgICAgICAgICAgIHZhciB3YXJuaW5ncyA9IEFsZXJ0c1NlcnZpY2Uud2FybmluZ3M7XG4gICAgICAgICAgICB2YXIgbmV3V2FybmluZ3MgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgd2FybmluZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAod2FybmluZ3NbaV0uY29udGVudCAhPT0gd2FybmluZ09iamVjdC5jb250ZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIG5ld1dhcm5pbmdzLnB1c2god2FybmluZ3NbaV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2Uud2FybmluZ3MgPSBuZXdXYXJuaW5ncztcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIENsZWFycyBhbGwgd2FybmluZ3MuXG4gICAgICAgICAqL1xuICAgICAgICBBbGVydHNTZXJ2aWNlLmNsZWFyV2FybmluZ3MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBBbGVydHNTZXJ2aWNlLndhcm5pbmdzID0gW107XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBZGRzIGEgbWVzc2FnZSwgY2FuIGJlIGluZm8gbWVzc2FnZXMgb3Igc3VjY2VzcyBtZXNzYWdlcy5cbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHR5cGUgLSBUeXBlIG9mIG1lc3NhZ2VcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2UgLSBNZXNzYWdlIGNvbnRlbnRcbiAgICAgICAgICogQHBhcmFtIHtudW1iZXJ8dW5kZWZpbmVkfSB0aW1lb3V0TWlsbGlzZWNvbmRzIC0gVGltZW91dCBmb3IgdGhlIHRvYXN0LlxuICAgICAgICAgKi9cbiAgICAgICAgQWxlcnRzU2VydmljZS5hZGRNZXNzYWdlID0gZnVuY3Rpb24gKHR5cGUsIG1lc3NhZ2UsIHRpbWVvdXRNaWxsaXNlY29uZHMpIHtcbiAgICAgICAgICAgIGlmIChBbGVydHNTZXJ2aWNlLm1lc3NhZ2VzLmxlbmd0aCA+PSBNQVhfVE9UQUxfTUVTU0FHRVMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBBbGVydHNTZXJ2aWNlLm1lc3NhZ2VzLnB1c2goe1xuICAgICAgICAgICAgICAgIHR5cGU6IHR5cGUsXG4gICAgICAgICAgICAgICAgY29udGVudDogbWVzc2FnZSxcbiAgICAgICAgICAgICAgICB0aW1lb3V0OiB0aW1lb3V0TWlsbGlzZWNvbmRzXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIERlbGV0ZXMgdGhlIG1lc3NhZ2UgZnJvbSB0aGUgbWVzc2FnZXMgbGlzdC5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG1lc3NhZ2VPYmplY3QgLSBNZXNzYWdlIHRvIGJlIGRlbGV0ZWQuXG4gICAgICAgICAqL1xuICAgICAgICBBbGVydHNTZXJ2aWNlLmRlbGV0ZU1lc3NhZ2UgPSBmdW5jdGlvbiAobWVzc2FnZU9iamVjdCkge1xuICAgICAgICAgICAgdmFyIG1lc3NhZ2VzID0gQWxlcnRzU2VydmljZS5tZXNzYWdlcztcbiAgICAgICAgICAgIHZhciBuZXdNZXNzYWdlcyA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtZXNzYWdlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmIChtZXNzYWdlc1tpXS50eXBlICE9PSBtZXNzYWdlT2JqZWN0LnR5cGUgfHxcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZXNbaV0uY29udGVudCAhPT0gbWVzc2FnZU9iamVjdC5jb250ZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIG5ld01lc3NhZ2VzLnB1c2gobWVzc2FnZXNbaV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UubWVzc2FnZXMgPSBuZXdNZXNzYWdlcztcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEFkZHMgYW4gaW5mbyBtZXNzYWdlLlxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZSAtIEluZm8gbWVzc2FnZSB0byBkaXNwbGF5LlxuICAgICAgICAgKiBAcGFyYW0ge251bWJlcnx1bmRlZmluZWR9IHRpbWVvdXRNaWxsaXNlY29uZHMgLSBUaW1lb3V0IGZvciB0aGUgdG9hc3QuXG4gICAgICAgICAqL1xuICAgICAgICBBbGVydHNTZXJ2aWNlLmFkZEluZm9NZXNzYWdlID0gZnVuY3Rpb24gKG1lc3NhZ2UsIHRpbWVvdXRNaWxsaXNlY29uZHMpIHtcbiAgICAgICAgICAgIGlmICh0aW1lb3V0TWlsbGlzZWNvbmRzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICB0aW1lb3V0TWlsbGlzZWNvbmRzID0gMTUwMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UuYWRkTWVzc2FnZSgnaW5mbycsIG1lc3NhZ2UsIHRpbWVvdXRNaWxsaXNlY29uZHMpO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogQWRkcyBhIHN1Y2Nlc3MgbWVzc2FnZS5cbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2UgLSBTdWNjZXNzIG1lc3NhZ2UgdG8gZGlzcGxheVxuICAgICAgICAgKiBAcGFyYW0ge251bWJlcnx1bmRlZmluZWR9IHRpbWVvdXRNaWxsaXNlY29uZHMgLSBUaW1lb3V0IGZvciB0aGUgdG9hc3QuXG4gICAgICAgICAqL1xuICAgICAgICBBbGVydHNTZXJ2aWNlLmFkZFN1Y2Nlc3NNZXNzYWdlID0gZnVuY3Rpb24gKG1lc3NhZ2UsIHRpbWVvdXRNaWxsaXNlY29uZHMpIHtcbiAgICAgICAgICAgIGlmICh0aW1lb3V0TWlsbGlzZWNvbmRzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICB0aW1lb3V0TWlsbGlzZWNvbmRzID0gMTUwMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UuYWRkTWVzc2FnZSgnc3VjY2VzcycsIG1lc3NhZ2UsIHRpbWVvdXRNaWxsaXNlY29uZHMpO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogQ2xlYXJzIGFsbCBtZXNzYWdlcy5cbiAgICAgICAgICovXG4gICAgICAgIEFsZXJ0c1NlcnZpY2UuY2xlYXJNZXNzYWdlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UubWVzc2FnZXMgPSBbXTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIEFsZXJ0c1NlcnZpY2U7XG4gICAgfV0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIGZvciBzdG9yaW5nIGFsbCBnZW5lcmljIGZ1bmN0aW9ucyB3aGljaCBoYXZlIHRvIGJlXG4gKiB1c2VkIGF0IG11bHRpcGxlIHBsYWNlcyBpbiB0aGUgY29kZWJhc2UuXG4gKi9cbm9wcGlhLmZhY3RvcnkoJ1V0aWxzU2VydmljZScsIFtmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB1dGlscyA9IHtcbiAgICAgICAgICAgIGlzRW1wdHk6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBwcm9wZXJ0eSBpbiBvYmopIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShwcm9wZXJ0eSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzIwMzczOVxuICAgICAgICAgICAgaXNTdHJpbmc6IGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAodHlwZW9mIGlucHV0ID09PSAnc3RyaW5nJyB8fCBpbnB1dCBpbnN0YW5jZW9mIFN0cmluZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB1dGlscztcbiAgICB9XSk7XG4iXSwic291cmNlUm9vdCI6IiJ9