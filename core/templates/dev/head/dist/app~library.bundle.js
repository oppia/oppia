(window["webpackJsonp"] = window["webpackJsonp"] || []).push([["app~library"],{

/***/ "./core/templates/dev/head/services/ConstructTranslationIdsService.ts":
/*!****************************************************************************!*\
  !*** ./core/templates/dev/head/services/ConstructTranslationIdsService.ts ***!
  \****************************************************************************/
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
 * @fileoverview Service to dynamically construct translation ids for i18n.
 */
oppia.factory('ConstructTranslationIdsService', [
    function () {
        return {
            // Construct a translation id for library from name and a prefix.
            // Ex: 'categories', 'art' -> 'I18N_LIBRARY_CATEGORIES_ART'
            getLibraryId: function (prefix, name) {
                return ('I18N_LIBRARY_' + prefix.toUpperCase() + '_' +
                    name.toUpperCase().split(' ').join('_'));
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/services/DebouncerService.ts":
/*!**************************************************************!*\
  !*** ./core/templates/dev/head/services/DebouncerService.ts ***!
  \**************************************************************/
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
 * @fileoverview Service for debouncing function calls.
 */
oppia.factory('DebouncerService', [function () {
        return {
            // Returns a function that will not be triggered as long as it continues to
            // be invoked. The function only gets executed after it stops being called
            // for `wait` milliseconds.
            debounce: function (func, millisecsToWait) {
                var timeout;
                var context = this;
                var args = arguments;
                var timestamp;
                var result;
                var later = function () {
                    var last = new Date().getTime() - timestamp;
                    if (last < millisecsToWait) {
                        timeout = setTimeout(later, millisecsToWait - last);
                    }
                    else {
                        timeout = null;
                        result = func.apply(context, args);
                        if (!timeout) {
                            context = null;
                            args = null;
                        }
                    }
                };
                return function () {
                    context = this;
                    args = arguments;
                    timestamp = new Date().getTime();
                    if (!timeout) {
                        timeout = setTimeout(later, millisecsToWait);
                    }
                    return result;
                };
            }
        };
    }]);


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

/***/ "./core/templates/dev/head/services/NavigationService.ts":
/*!***************************************************************!*\
  !*** ./core/templates/dev/head/services/NavigationService.ts ***!
  \***************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Factory for navigating the top navigation bar with
 * tab and shift-tab.
 */
oppia.factory('NavigationService', [function () {
        var navigation = {
            activeMenuName: '',
            ACTION_OPEN: 'open',
            ACTION_CLOSE: 'close',
            KEYBOARD_EVENT_TO_KEY_CODES: {
                enter: {
                    shiftKeyIsPressed: false,
                    keyCode: 13
                },
                tab: {
                    shiftKeyIsPressed: false,
                    keyCode: 9
                },
                shiftTab: {
                    shiftKeyIsPressed: true,
                    keyCode: 9
                }
            },
            openSubmenu: null,
            closeSubmenu: null,
            onMenuKeypress: null
        };
        /**
        * Opens the submenu.
        * @param {object} evt
        * @param {String} menuName - name of menu, on which
        * open/close action to be performed (category,language).
        */
        navigation.openSubmenu = function (evt, menuName) {
            // Focus on the current target before opening its submenu.
            navigation.activeMenuName = menuName;
            angular.element(evt.currentTarget).focus();
        };
        navigation.closeSubmenu = function (evt) {
            navigation.activeMenuName = '';
            angular.element(evt.currentTarget).closest('li')
                .find('a').blur();
        };
        /**
         * Handles keydown events on menus.
         * @param {object} evt
         * @param {String} menuName - name of menu to perform action
         * on(category/language)
         * @param {object} eventsTobeHandled - Map keyboard events('Enter') to
         * corresponding actions to be performed(open/close).
         *
         * @example
         *  onMenuKeypress($event, 'category', {enter: 'open'})
         */
        navigation.onMenuKeypress = function (evt, menuName, eventsTobeHandled) {
            var targetEvents = Object.keys(eventsTobeHandled);
            for (var i = 0; i < targetEvents.length; i++) {
                var keyCodeSpec = navigation.KEYBOARD_EVENT_TO_KEY_CODES[targetEvents[i]];
                if (keyCodeSpec.keyCode === evt.keyCode &&
                    evt.shiftKey === keyCodeSpec.shiftKeyIsPressed) {
                    if (eventsTobeHandled[targetEvents[i]] === navigation.ACTION_OPEN) {
                        navigation.openSubmenu(evt, menuName);
                    }
                    else if (eventsTobeHandled[targetEvents[i]] ===
                        navigation.ACTION_CLOSE) {
                        navigation.closeSubmenu(evt);
                    }
                    else {
                        throw Error('Invalid action type.');
                    }
                }
            }
        };
        return navigation;
    }]);


/***/ }),

/***/ "./core/templates/dev/head/services/SiteAnalyticsService.ts":
/*!******************************************************************!*\
  !*** ./core/templates/dev/head/services/SiteAnalyticsService.ts ***!
  \******************************************************************/
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
 * @fileoverview Utility services for explorations which may be shared by both
 * the learner and editor views.
 */
// Service for sending events to Google Analytics.
//
// Note that events are only sent if the CAN_SEND_ANALYTICS_EVENTS flag is
// turned on. This flag must be turned on explicitly by the application
// owner in feconf.py.
oppia.factory('SiteAnalyticsService', ['$window', function ($window) {
        var CAN_SEND_ANALYTICS_EVENTS = constants.CAN_SEND_ANALYTICS_EVENTS;
        // For definitions of the various arguments, please see:
        // developers.google.com/analytics/devguides/collection/analyticsjs/events
        var _sendEventToGoogleAnalytics = function (eventCategory, eventAction, eventLabel) {
            if ($window.ga && CAN_SEND_ANALYTICS_EVENTS) {
                $window.ga('send', 'event', eventCategory, eventAction, eventLabel);
            }
        };
        // For definitions of the various arguments, please see:
        // developers.google.com/analytics/devguides/collection/analyticsjs/
        //   social-interactions
        var _sendSocialEventToGoogleAnalytics = function (network, action, targetUrl) {
            if ($window.ga && CAN_SEND_ANALYTICS_EVENTS) {
                $window.ga('send', 'social', network, action, targetUrl);
            }
        };
        return {
            // The srcElement refers to the element on the page that is clicked.
            registerStartLoginEvent: function (srcElement) {
                _sendEventToGoogleAnalytics('LoginButton', 'click', $window.location.pathname + ' ' + srcElement);
            },
            registerNewSignupEvent: function () {
                _sendEventToGoogleAnalytics('SignupButton', 'click', '');
            },
            registerClickBrowseLibraryButtonEvent: function () {
                _sendEventToGoogleAnalytics('BrowseLibraryButton', 'click', $window.location.pathname);
            },
            registerGoToDonationSiteEvent: function (donationSiteName) {
                _sendEventToGoogleAnalytics('GoToDonationSite', 'click', donationSiteName);
            },
            registerApplyToTeachWithOppiaEvent: function () {
                _sendEventToGoogleAnalytics('ApplyToTeachWithOppia', 'click', '');
            },
            registerClickCreateExplorationButtonEvent: function () {
                _sendEventToGoogleAnalytics('CreateExplorationButton', 'click', $window.location.pathname);
            },
            registerCreateNewExplorationEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('NewExploration', 'create', explorationId);
            },
            registerCreateNewExplorationInCollectionEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('NewExplorationFromCollection', 'create', explorationId);
            },
            registerCreateNewCollectionEvent: function (collectionId) {
                _sendEventToGoogleAnalytics('NewCollection', 'create', collectionId);
            },
            registerCommitChangesToPrivateExplorationEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('CommitToPrivateExploration', 'click', explorationId);
            },
            registerShareExplorationEvent: function (network) {
                _sendSocialEventToGoogleAnalytics(network, 'share', $window.location.pathname);
            },
            registerShareCollectionEvent: function (network) {
                _sendSocialEventToGoogleAnalytics(network, 'share', $window.location.pathname);
            },
            registerOpenEmbedInfoEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('EmbedInfoModal', 'open', explorationId);
            },
            registerCommitChangesToPublicExplorationEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('CommitToPublicExploration', 'click', explorationId);
            },
            // Metrics for tutorial on first creating exploration
            registerTutorialModalOpenEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('TutorialModalOpen', 'open', explorationId);
            },
            registerDeclineTutorialModalEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('DeclineTutorialModal', 'click', explorationId);
            },
            registerAcceptTutorialModalEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('AcceptTutorialModal', 'click', explorationId);
            },
            // Metrics for visiting the help center
            registerClickHelpButtonEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('ClickHelpButton', 'click', explorationId);
            },
            registerVisitHelpCenterEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('VisitHelpCenter', 'click', explorationId);
            },
            registerOpenTutorialFromHelpCenterEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('OpenTutorialFromHelpCenter', 'click', explorationId);
            },
            // Metrics for exiting the tutorial
            registerSkipTutorialEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('SkipTutorial', 'click', explorationId);
            },
            registerFinishTutorialEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('FinishTutorial', 'click', explorationId);
            },
            // Metrics for first time editor use
            registerEditorFirstEntryEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('FirstEnterEditor', 'open', explorationId);
            },
            registerFirstOpenContentBoxEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('FirstOpenContentBox', 'open', explorationId);
            },
            registerFirstSaveContentEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('FirstSaveContent', 'click', explorationId);
            },
            registerFirstClickAddInteractionEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('FirstClickAddInteraction', 'click', explorationId);
            },
            registerFirstSelectInteractionTypeEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('FirstSelectInteractionType', 'click', explorationId);
            },
            registerFirstSaveInteractionEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('FirstSaveInteraction', 'click', explorationId);
            },
            registerFirstSaveRuleEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('FirstSaveRule', 'click', explorationId);
            },
            registerFirstCreateSecondStateEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('FirstCreateSecondState', 'create', explorationId);
            },
            // Metrics for publishing explorations
            registerSavePlayableExplorationEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('SavePlayableExploration', 'save', explorationId);
            },
            registerOpenPublishExplorationModalEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('PublishExplorationModal', 'open', explorationId);
            },
            registerPublishExplorationEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('PublishExploration', 'click', explorationId);
            },
            registerVisitOppiaFromIframeEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('VisitOppiaFromIframe', 'click', explorationId);
            },
            registerNewCard: function (cardNum) {
                if (cardNum <= 10 || cardNum % 10 === 0) {
                    _sendEventToGoogleAnalytics('PlayerNewCard', 'click', cardNum);
                }
            },
            registerFinishExploration: function () {
                _sendEventToGoogleAnalytics('PlayerFinishExploration', 'click', '');
            },
            registerOpenCollectionFromLandingPageEvent: function (collectionId) {
                _sendEventToGoogleAnalytics('OpenFractionsFromLandingPage', 'click', collectionId);
            },
            registerStewardsLandingPageEvent: function (viewerType, buttonText) {
                _sendEventToGoogleAnalytics('ClickButtonOnStewardsPage', 'click', viewerType + ':' + buttonText);
            },
            registerSaveRecordedAudioEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('SaveRecordedAudio', 'click', explorationId);
            },
            registerStartAudioRecordingEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('StartAudioRecording', 'click', explorationId);
            },
            registerUploadAudioEvent: function (explorationId) {
                _sendEventToGoogleAnalytics('UploadRecordedAudio', 'click', explorationId);
            },
        };
    }]);


/***/ })

}]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9zZXJ2aWNlcy9Db25zdHJ1Y3RUcmFuc2xhdGlvbklkc1NlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvc2VydmljZXMvRGVib3VuY2VyU2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9zZXJ2aWNlcy9IdG1sRXNjYXBlclNlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvc2VydmljZXMvTmF2aWdhdGlvblNlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvc2VydmljZXMvU2l0ZUFuYWx5dGljc1NlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7Ozs7Ozs7Ozs7OztBQ3BETDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EseUNBQXlDO0FBQ3pDLDBDQUEwQztBQUMxQyx5Q0FBeUM7QUFDekMsd0NBQXdDO0FBQ3hDLHdDQUF3QztBQUN4QyxhQUFhO0FBQ2I7QUFDQTtBQUNBLG9DQUFvQztBQUNwQyxtQ0FBbUM7QUFDbkMsa0NBQWtDO0FBQ2xDLGtDQUFrQztBQUNsQyxtQ0FBbUM7QUFDbkM7QUFDQTtBQUNBO0FBQ0EsS0FBSzs7Ozs7Ozs7Ozs7O0FDOUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtCQUFrQixPQUFPO0FBQ3pCLGtCQUFrQixPQUFPO0FBQ3pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBbUIsT0FBTztBQUMxQixtQkFBbUIsT0FBTztBQUMxQjtBQUNBLG1CQUFtQixPQUFPO0FBQzFCO0FBQ0E7QUFDQTtBQUNBLGdEQUFnRCxjQUFjO0FBQzlEO0FBQ0E7QUFDQTtBQUNBLDJCQUEyQix5QkFBeUI7QUFDcEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7Ozs7Ozs7Ozs7OztBQ3ZGTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQSxLQUFLIiwiZmlsZSI6ImFwcH5saWJyYXJ5LmJ1bmRsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU2VydmljZSB0byBkeW5hbWljYWxseSBjb25zdHJ1Y3QgdHJhbnNsYXRpb24gaWRzIGZvciBpMThuLlxuICovXG5vcHBpYS5mYWN0b3J5KCdDb25zdHJ1Y3RUcmFuc2xhdGlvbklkc1NlcnZpY2UnLCBbXG4gICAgZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLy8gQ29uc3RydWN0IGEgdHJhbnNsYXRpb24gaWQgZm9yIGxpYnJhcnkgZnJvbSBuYW1lIGFuZCBhIHByZWZpeC5cbiAgICAgICAgICAgIC8vIEV4OiAnY2F0ZWdvcmllcycsICdhcnQnIC0+ICdJMThOX0xJQlJBUllfQ0FURUdPUklFU19BUlQnXG4gICAgICAgICAgICBnZXRMaWJyYXJ5SWQ6IGZ1bmN0aW9uIChwcmVmaXgsIG5hbWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKCdJMThOX0xJQlJBUllfJyArIHByZWZpeC50b1VwcGVyQ2FzZSgpICsgJ18nICtcbiAgICAgICAgICAgICAgICAgICAgbmFtZS50b1VwcGVyQ2FzZSgpLnNwbGl0KCcgJykuam9pbignXycpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU2VydmljZSBmb3IgZGVib3VuY2luZyBmdW5jdGlvbiBjYWxscy5cbiAqL1xub3BwaWEuZmFjdG9yeSgnRGVib3VuY2VyU2VydmljZScsIFtmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAvLyBSZXR1cm5zIGEgZnVuY3Rpb24gdGhhdCB3aWxsIG5vdCBiZSB0cmlnZ2VyZWQgYXMgbG9uZyBhcyBpdCBjb250aW51ZXMgdG9cbiAgICAgICAgICAgIC8vIGJlIGludm9rZWQuIFRoZSBmdW5jdGlvbiBvbmx5IGdldHMgZXhlY3V0ZWQgYWZ0ZXIgaXQgc3RvcHMgYmVpbmcgY2FsbGVkXG4gICAgICAgICAgICAvLyBmb3IgYHdhaXRgIG1pbGxpc2Vjb25kcy5cbiAgICAgICAgICAgIGRlYm91bmNlOiBmdW5jdGlvbiAoZnVuYywgbWlsbGlzZWNzVG9XYWl0KSB7XG4gICAgICAgICAgICAgICAgdmFyIHRpbWVvdXQ7XG4gICAgICAgICAgICAgICAgdmFyIGNvbnRleHQgPSB0aGlzO1xuICAgICAgICAgICAgICAgIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICAgICAgICAgICAgICAgIHZhciB0aW1lc3RhbXA7XG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdDtcbiAgICAgICAgICAgICAgICB2YXIgbGF0ZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBsYXN0ID0gbmV3IERhdGUoKS5nZXRUaW1lKCkgLSB0aW1lc3RhbXA7XG4gICAgICAgICAgICAgICAgICAgIGlmIChsYXN0IDwgbWlsbGlzZWNzVG9XYWl0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aW1lb3V0ID0gc2V0VGltZW91dChsYXRlciwgbWlsbGlzZWNzVG9XYWl0IC0gbGFzdCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aW1lb3V0ID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXRpbWVvdXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0ID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmdzID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICAgICAgICAgICAgICAgIHRpbWVzdGFtcCA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXRpbWVvdXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGxhdGVyLCBtaWxsaXNlY3NUb1dhaXQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFNlcnZpY2UgZm9yIEhUTUwgc2VyaWFsaXphdGlvbiBhbmQgZXNjYXBpbmcuXG4gKi9cbm9wcGlhLmZhY3RvcnkoJ0h0bWxFc2NhcGVyU2VydmljZScsIFsnJGxvZycsIGZ1bmN0aW9uICgkbG9nKSB7XG4gICAgICAgIHZhciBodG1sRXNjYXBlciA9IHtcbiAgICAgICAgICAgIG9ialRvRXNjYXBlZEpzb246IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy51bmVzY2FwZWRTdHJUb0VzY2FwZWRTdHIoSlNPTi5zdHJpbmdpZnkob2JqKSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZXNjYXBlZEpzb25Ub09iajogZnVuY3Rpb24gKGpzb24pIHtcbiAgICAgICAgICAgICAgICBpZiAoIWpzb24pIHtcbiAgICAgICAgICAgICAgICAgICAgJGxvZy5lcnJvcignRW1wdHkgc3RyaW5nIHdhcyBwYXNzZWQgdG8gSlNPTiBkZWNvZGVyLicpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBKU09OLnBhcnNlKHRoaXMuZXNjYXBlZFN0clRvVW5lc2NhcGVkU3RyKGpzb24pKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB1bmVzY2FwZWRTdHJUb0VzY2FwZWRTdHI6IGZ1bmN0aW9uIChzdHIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gU3RyaW5nKHN0cilcbiAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyYvZywgJyZhbXA7JylcbiAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1wiL2csICcmcXVvdDsnKVxuICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvJy9nLCAnJiMzOTsnKVxuICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvPC9nLCAnJmx0OycpXG4gICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8+L2csICcmZ3Q7Jyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZXNjYXBlZFN0clRvVW5lc2NhcGVkU3RyOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gU3RyaW5nKHZhbHVlKVxuICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvJnF1b3Q7L2csICdcIicpXG4gICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8mIzM5Oy9nLCAnXFwnJylcbiAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyZsdDsvZywgJzwnKVxuICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvJmd0Oy9nLCAnPicpXG4gICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8mYW1wOy9nLCAnJicpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gaHRtbEVzY2FwZXI7XG4gICAgfV0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBGYWN0b3J5IGZvciBuYXZpZ2F0aW5nIHRoZSB0b3AgbmF2aWdhdGlvbiBiYXIgd2l0aFxuICogdGFiIGFuZCBzaGlmdC10YWIuXG4gKi9cbm9wcGlhLmZhY3RvcnkoJ05hdmlnYXRpb25TZXJ2aWNlJywgW2Z1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG5hdmlnYXRpb24gPSB7XG4gICAgICAgICAgICBhY3RpdmVNZW51TmFtZTogJycsXG4gICAgICAgICAgICBBQ1RJT05fT1BFTjogJ29wZW4nLFxuICAgICAgICAgICAgQUNUSU9OX0NMT1NFOiAnY2xvc2UnLFxuICAgICAgICAgICAgS0VZQk9BUkRfRVZFTlRfVE9fS0VZX0NPREVTOiB7XG4gICAgICAgICAgICAgICAgZW50ZXI6IHtcbiAgICAgICAgICAgICAgICAgICAgc2hpZnRLZXlJc1ByZXNzZWQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBrZXlDb2RlOiAxM1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgdGFiOiB7XG4gICAgICAgICAgICAgICAgICAgIHNoaWZ0S2V5SXNQcmVzc2VkOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAga2V5Q29kZTogOVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgc2hpZnRUYWI6IHtcbiAgICAgICAgICAgICAgICAgICAgc2hpZnRLZXlJc1ByZXNzZWQ6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGtleUNvZGU6IDlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb3BlblN1Ym1lbnU6IG51bGwsXG4gICAgICAgICAgICBjbG9zZVN1Ym1lbnU6IG51bGwsXG4gICAgICAgICAgICBvbk1lbnVLZXlwcmVzczogbnVsbFxuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgKiBPcGVucyB0aGUgc3VibWVudS5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gZXZ0XG4gICAgICAgICogQHBhcmFtIHtTdHJpbmd9IG1lbnVOYW1lIC0gbmFtZSBvZiBtZW51LCBvbiB3aGljaFxuICAgICAgICAqIG9wZW4vY2xvc2UgYWN0aW9uIHRvIGJlIHBlcmZvcm1lZCAoY2F0ZWdvcnksbGFuZ3VhZ2UpLlxuICAgICAgICAqL1xuICAgICAgICBuYXZpZ2F0aW9uLm9wZW5TdWJtZW51ID0gZnVuY3Rpb24gKGV2dCwgbWVudU5hbWUpIHtcbiAgICAgICAgICAgIC8vIEZvY3VzIG9uIHRoZSBjdXJyZW50IHRhcmdldCBiZWZvcmUgb3BlbmluZyBpdHMgc3VibWVudS5cbiAgICAgICAgICAgIG5hdmlnYXRpb24uYWN0aXZlTWVudU5hbWUgPSBtZW51TmFtZTtcbiAgICAgICAgICAgIGFuZ3VsYXIuZWxlbWVudChldnQuY3VycmVudFRhcmdldCkuZm9jdXMoKTtcbiAgICAgICAgfTtcbiAgICAgICAgbmF2aWdhdGlvbi5jbG9zZVN1Ym1lbnUgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgICAgICBuYXZpZ2F0aW9uLmFjdGl2ZU1lbnVOYW1lID0gJyc7XG4gICAgICAgICAgICBhbmd1bGFyLmVsZW1lbnQoZXZ0LmN1cnJlbnRUYXJnZXQpLmNsb3Nlc3QoJ2xpJylcbiAgICAgICAgICAgICAgICAuZmluZCgnYScpLmJsdXIoKTtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEhhbmRsZXMga2V5ZG93biBldmVudHMgb24gbWVudXMuXG4gICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBldnRcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IG1lbnVOYW1lIC0gbmFtZSBvZiBtZW51IHRvIHBlcmZvcm0gYWN0aW9uXG4gICAgICAgICAqIG9uKGNhdGVnb3J5L2xhbmd1YWdlKVxuICAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gZXZlbnRzVG9iZUhhbmRsZWQgLSBNYXAga2V5Ym9hcmQgZXZlbnRzKCdFbnRlcicpIHRvXG4gICAgICAgICAqIGNvcnJlc3BvbmRpbmcgYWN0aW9ucyB0byBiZSBwZXJmb3JtZWQob3Blbi9jbG9zZSkuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAqICBvbk1lbnVLZXlwcmVzcygkZXZlbnQsICdjYXRlZ29yeScsIHtlbnRlcjogJ29wZW4nfSlcbiAgICAgICAgICovXG4gICAgICAgIG5hdmlnYXRpb24ub25NZW51S2V5cHJlc3MgPSBmdW5jdGlvbiAoZXZ0LCBtZW51TmFtZSwgZXZlbnRzVG9iZUhhbmRsZWQpIHtcbiAgICAgICAgICAgIHZhciB0YXJnZXRFdmVudHMgPSBPYmplY3Qua2V5cyhldmVudHNUb2JlSGFuZGxlZCk7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRhcmdldEV2ZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBrZXlDb2RlU3BlYyA9IG5hdmlnYXRpb24uS0VZQk9BUkRfRVZFTlRfVE9fS0VZX0NPREVTW3RhcmdldEV2ZW50c1tpXV07XG4gICAgICAgICAgICAgICAgaWYgKGtleUNvZGVTcGVjLmtleUNvZGUgPT09IGV2dC5rZXlDb2RlICYmXG4gICAgICAgICAgICAgICAgICAgIGV2dC5zaGlmdEtleSA9PT0ga2V5Q29kZVNwZWMuc2hpZnRLZXlJc1ByZXNzZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGV2ZW50c1RvYmVIYW5kbGVkW3RhcmdldEV2ZW50c1tpXV0gPT09IG5hdmlnYXRpb24uQUNUSU9OX09QRU4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hdmlnYXRpb24ub3BlblN1Ym1lbnUoZXZ0LCBtZW51TmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoZXZlbnRzVG9iZUhhbmRsZWRbdGFyZ2V0RXZlbnRzW2ldXSA9PT1cbiAgICAgICAgICAgICAgICAgICAgICAgIG5hdmlnYXRpb24uQUNUSU9OX0NMT1NFKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuYXZpZ2F0aW9uLmNsb3NlU3VibWVudShldnQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ0ludmFsaWQgYWN0aW9uIHR5cGUuJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBuYXZpZ2F0aW9uO1xuICAgIH1dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgVXRpbGl0eSBzZXJ2aWNlcyBmb3IgZXhwbG9yYXRpb25zIHdoaWNoIG1heSBiZSBzaGFyZWQgYnkgYm90aFxuICogdGhlIGxlYXJuZXIgYW5kIGVkaXRvciB2aWV3cy5cbiAqL1xuLy8gU2VydmljZSBmb3Igc2VuZGluZyBldmVudHMgdG8gR29vZ2xlIEFuYWx5dGljcy5cbi8vXG4vLyBOb3RlIHRoYXQgZXZlbnRzIGFyZSBvbmx5IHNlbnQgaWYgdGhlIENBTl9TRU5EX0FOQUxZVElDU19FVkVOVFMgZmxhZyBpc1xuLy8gdHVybmVkIG9uLiBUaGlzIGZsYWcgbXVzdCBiZSB0dXJuZWQgb24gZXhwbGljaXRseSBieSB0aGUgYXBwbGljYXRpb25cbi8vIG93bmVyIGluIGZlY29uZi5weS5cbm9wcGlhLmZhY3RvcnkoJ1NpdGVBbmFseXRpY3NTZXJ2aWNlJywgWyckd2luZG93JywgZnVuY3Rpb24gKCR3aW5kb3cpIHtcbiAgICAgICAgdmFyIENBTl9TRU5EX0FOQUxZVElDU19FVkVOVFMgPSBjb25zdGFudHMuQ0FOX1NFTkRfQU5BTFlUSUNTX0VWRU5UUztcbiAgICAgICAgLy8gRm9yIGRlZmluaXRpb25zIG9mIHRoZSB2YXJpb3VzIGFyZ3VtZW50cywgcGxlYXNlIHNlZTpcbiAgICAgICAgLy8gZGV2ZWxvcGVycy5nb29nbGUuY29tL2FuYWx5dGljcy9kZXZndWlkZXMvY29sbGVjdGlvbi9hbmFseXRpY3Nqcy9ldmVudHNcbiAgICAgICAgdmFyIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcyA9IGZ1bmN0aW9uIChldmVudENhdGVnb3J5LCBldmVudEFjdGlvbiwgZXZlbnRMYWJlbCkge1xuICAgICAgICAgICAgaWYgKCR3aW5kb3cuZ2EgJiYgQ0FOX1NFTkRfQU5BTFlUSUNTX0VWRU5UUykge1xuICAgICAgICAgICAgICAgICR3aW5kb3cuZ2EoJ3NlbmQnLCAnZXZlbnQnLCBldmVudENhdGVnb3J5LCBldmVudEFjdGlvbiwgZXZlbnRMYWJlbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIC8vIEZvciBkZWZpbml0aW9ucyBvZiB0aGUgdmFyaW91cyBhcmd1bWVudHMsIHBsZWFzZSBzZWU6XG4gICAgICAgIC8vIGRldmVsb3BlcnMuZ29vZ2xlLmNvbS9hbmFseXRpY3MvZGV2Z3VpZGVzL2NvbGxlY3Rpb24vYW5hbHl0aWNzanMvXG4gICAgICAgIC8vICAgc29jaWFsLWludGVyYWN0aW9uc1xuICAgICAgICB2YXIgX3NlbmRTb2NpYWxFdmVudFRvR29vZ2xlQW5hbHl0aWNzID0gZnVuY3Rpb24gKG5ldHdvcmssIGFjdGlvbiwgdGFyZ2V0VXJsKSB7XG4gICAgICAgICAgICBpZiAoJHdpbmRvdy5nYSAmJiBDQU5fU0VORF9BTkFMWVRJQ1NfRVZFTlRTKSB7XG4gICAgICAgICAgICAgICAgJHdpbmRvdy5nYSgnc2VuZCcsICdzb2NpYWwnLCBuZXR3b3JrLCBhY3Rpb24sIHRhcmdldFVybCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAvLyBUaGUgc3JjRWxlbWVudCByZWZlcnMgdG8gdGhlIGVsZW1lbnQgb24gdGhlIHBhZ2UgdGhhdCBpcyBjbGlja2VkLlxuICAgICAgICAgICAgcmVnaXN0ZXJTdGFydExvZ2luRXZlbnQ6IGZ1bmN0aW9uIChzcmNFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdMb2dpbkJ1dHRvbicsICdjbGljaycsICR3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUgKyAnICcgKyBzcmNFbGVtZW50KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3Rlck5ld1NpZ251cEV2ZW50OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdTaWdudXBCdXR0b24nLCAnY2xpY2snLCAnJyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJDbGlja0Jyb3dzZUxpYnJhcnlCdXR0b25FdmVudDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnQnJvd3NlTGlicmFyeUJ1dHRvbicsICdjbGljaycsICR3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyR29Ub0RvbmF0aW9uU2l0ZUV2ZW50OiBmdW5jdGlvbiAoZG9uYXRpb25TaXRlTmFtZSkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnR29Ub0RvbmF0aW9uU2l0ZScsICdjbGljaycsIGRvbmF0aW9uU2l0ZU5hbWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyQXBwbHlUb1RlYWNoV2l0aE9wcGlhRXZlbnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ0FwcGx5VG9UZWFjaFdpdGhPcHBpYScsICdjbGljaycsICcnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlckNsaWNrQ3JlYXRlRXhwbG9yYXRpb25CdXR0b25FdmVudDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnQ3JlYXRlRXhwbG9yYXRpb25CdXR0b24nLCAnY2xpY2snLCAkd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlckNyZWF0ZU5ld0V4cGxvcmF0aW9uRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdOZXdFeHBsb3JhdGlvbicsICdjcmVhdGUnLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlckNyZWF0ZU5ld0V4cGxvcmF0aW9uSW5Db2xsZWN0aW9uRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdOZXdFeHBsb3JhdGlvbkZyb21Db2xsZWN0aW9uJywgJ2NyZWF0ZScsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyQ3JlYXRlTmV3Q29sbGVjdGlvbkV2ZW50OiBmdW5jdGlvbiAoY29sbGVjdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdOZXdDb2xsZWN0aW9uJywgJ2NyZWF0ZScsIGNvbGxlY3Rpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJDb21taXRDaGFuZ2VzVG9Qcml2YXRlRXhwbG9yYXRpb25FdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ0NvbW1pdFRvUHJpdmF0ZUV4cGxvcmF0aW9uJywgJ2NsaWNrJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJTaGFyZUV4cGxvcmF0aW9uRXZlbnQ6IGZ1bmN0aW9uIChuZXR3b3JrKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRTb2NpYWxFdmVudFRvR29vZ2xlQW5hbHl0aWNzKG5ldHdvcmssICdzaGFyZScsICR3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyU2hhcmVDb2xsZWN0aW9uRXZlbnQ6IGZ1bmN0aW9uIChuZXR3b3JrKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRTb2NpYWxFdmVudFRvR29vZ2xlQW5hbHl0aWNzKG5ldHdvcmssICdzaGFyZScsICR3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyT3BlbkVtYmVkSW5mb0V2ZW50OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnRW1iZWRJbmZvTW9kYWwnLCAnb3BlbicsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyQ29tbWl0Q2hhbmdlc1RvUHVibGljRXhwbG9yYXRpb25FdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ0NvbW1pdFRvUHVibGljRXhwbG9yYXRpb24nLCAnY2xpY2snLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBNZXRyaWNzIGZvciB0dXRvcmlhbCBvbiBmaXJzdCBjcmVhdGluZyBleHBsb3JhdGlvblxuICAgICAgICAgICAgcmVnaXN0ZXJUdXRvcmlhbE1vZGFsT3BlbkV2ZW50OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnVHV0b3JpYWxNb2RhbE9wZW4nLCAnb3BlbicsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyRGVjbGluZVR1dG9yaWFsTW9kYWxFdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ0RlY2xpbmVUdXRvcmlhbE1vZGFsJywgJ2NsaWNrJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJBY2NlcHRUdXRvcmlhbE1vZGFsRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdBY2NlcHRUdXRvcmlhbE1vZGFsJywgJ2NsaWNrJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gTWV0cmljcyBmb3IgdmlzaXRpbmcgdGhlIGhlbHAgY2VudGVyXG4gICAgICAgICAgICByZWdpc3RlckNsaWNrSGVscEJ1dHRvbkV2ZW50OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnQ2xpY2tIZWxwQnV0dG9uJywgJ2NsaWNrJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJWaXNpdEhlbHBDZW50ZXJFdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ1Zpc2l0SGVscENlbnRlcicsICdjbGljaycsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyT3BlblR1dG9yaWFsRnJvbUhlbHBDZW50ZXJFdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ09wZW5UdXRvcmlhbEZyb21IZWxwQ2VudGVyJywgJ2NsaWNrJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gTWV0cmljcyBmb3IgZXhpdGluZyB0aGUgdHV0b3JpYWxcbiAgICAgICAgICAgIHJlZ2lzdGVyU2tpcFR1dG9yaWFsRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdTa2lwVHV0b3JpYWwnLCAnY2xpY2snLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlckZpbmlzaFR1dG9yaWFsRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdGaW5pc2hUdXRvcmlhbCcsICdjbGljaycsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIE1ldHJpY3MgZm9yIGZpcnN0IHRpbWUgZWRpdG9yIHVzZVxuICAgICAgICAgICAgcmVnaXN0ZXJFZGl0b3JGaXJzdEVudHJ5RXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdGaXJzdEVudGVyRWRpdG9yJywgJ29wZW4nLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlckZpcnN0T3BlbkNvbnRlbnRCb3hFdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ0ZpcnN0T3BlbkNvbnRlbnRCb3gnLCAnb3BlbicsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyRmlyc3RTYXZlQ29udGVudEV2ZW50OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnRmlyc3RTYXZlQ29udGVudCcsICdjbGljaycsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyRmlyc3RDbGlja0FkZEludGVyYWN0aW9uRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdGaXJzdENsaWNrQWRkSW50ZXJhY3Rpb24nLCAnY2xpY2snLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlckZpcnN0U2VsZWN0SW50ZXJhY3Rpb25UeXBlRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdGaXJzdFNlbGVjdEludGVyYWN0aW9uVHlwZScsICdjbGljaycsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyRmlyc3RTYXZlSW50ZXJhY3Rpb25FdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ0ZpcnN0U2F2ZUludGVyYWN0aW9uJywgJ2NsaWNrJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJGaXJzdFNhdmVSdWxlRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdGaXJzdFNhdmVSdWxlJywgJ2NsaWNrJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJGaXJzdENyZWF0ZVNlY29uZFN0YXRlRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdGaXJzdENyZWF0ZVNlY29uZFN0YXRlJywgJ2NyZWF0ZScsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIE1ldHJpY3MgZm9yIHB1Ymxpc2hpbmcgZXhwbG9yYXRpb25zXG4gICAgICAgICAgICByZWdpc3RlclNhdmVQbGF5YWJsZUV4cGxvcmF0aW9uRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdTYXZlUGxheWFibGVFeHBsb3JhdGlvbicsICdzYXZlJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJPcGVuUHVibGlzaEV4cGxvcmF0aW9uTW9kYWxFdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ1B1Ymxpc2hFeHBsb3JhdGlvbk1vZGFsJywgJ29wZW4nLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlclB1Ymxpc2hFeHBsb3JhdGlvbkV2ZW50OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnUHVibGlzaEV4cGxvcmF0aW9uJywgJ2NsaWNrJywgZXhwbG9yYXRpb25JZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJWaXNpdE9wcGlhRnJvbUlmcmFtZUV2ZW50OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnVmlzaXRPcHBpYUZyb21JZnJhbWUnLCAnY2xpY2snLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3Rlck5ld0NhcmQ6IGZ1bmN0aW9uIChjYXJkTnVtKSB7XG4gICAgICAgICAgICAgICAgaWYgKGNhcmROdW0gPD0gMTAgfHwgY2FyZE51bSAlIDEwID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnUGxheWVyTmV3Q2FyZCcsICdjbGljaycsIGNhcmROdW0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlckZpbmlzaEV4cGxvcmF0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdQbGF5ZXJGaW5pc2hFeHBsb3JhdGlvbicsICdjbGljaycsICcnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3Rlck9wZW5Db2xsZWN0aW9uRnJvbUxhbmRpbmdQYWdlRXZlbnQ6IGZ1bmN0aW9uIChjb2xsZWN0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ09wZW5GcmFjdGlvbnNGcm9tTGFuZGluZ1BhZ2UnLCAnY2xpY2snLCBjb2xsZWN0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyU3Rld2FyZHNMYW5kaW5nUGFnZUV2ZW50OiBmdW5jdGlvbiAodmlld2VyVHlwZSwgYnV0dG9uVGV4dCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnQ2xpY2tCdXR0b25PblN0ZXdhcmRzUGFnZScsICdjbGljaycsIHZpZXdlclR5cGUgKyAnOicgKyBidXR0b25UZXh0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWdpc3RlclNhdmVSZWNvcmRlZEF1ZGlvRXZlbnQ6IGZ1bmN0aW9uIChleHBsb3JhdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgX3NlbmRFdmVudFRvR29vZ2xlQW5hbHl0aWNzKCdTYXZlUmVjb3JkZWRBdWRpbycsICdjbGljaycsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyU3RhcnRBdWRpb1JlY29yZGluZ0V2ZW50OiBmdW5jdGlvbiAoZXhwbG9yYXRpb25JZCkge1xuICAgICAgICAgICAgICAgIF9zZW5kRXZlbnRUb0dvb2dsZUFuYWx5dGljcygnU3RhcnRBdWRpb1JlY29yZGluZycsICdjbGljaycsIGV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlZ2lzdGVyVXBsb2FkQXVkaW9FdmVudDogZnVuY3Rpb24gKGV4cGxvcmF0aW9uSWQpIHtcbiAgICAgICAgICAgICAgICBfc2VuZEV2ZW50VG9Hb29nbGVBbmFseXRpY3MoJ1VwbG9hZFJlY29yZGVkQXVkaW8nLCAnY2xpY2snLCBleHBsb3JhdGlvbklkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH07XG4gICAgfV0pO1xuIl0sInNvdXJjZVJvb3QiOiIifQ==