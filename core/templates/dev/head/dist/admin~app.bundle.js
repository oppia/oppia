(window["webpackJsonp"] = window["webpackJsonp"] || []).push([["admin~app"],{

/***/ "./core/templates/dev/head/I18nFooter.ts":
/*!***********************************************!*\
  !*** ./core/templates/dev/head/I18nFooter.ts ***!
  \***********************************************/
/*! no static exports found */
/***/ (function(module, exports) {

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
/**
 * @fileoverview Translation functions for Oppia.
 *
 * @author milagro.teruel@gmail.com (Milagro Teruel)
 */
// Translations of strings that are loaded in the front page. They are listed
// here to be loaded synchronously with the script to prevent a FOUC or
// Flash of Untranslated Content.
// See http://angular-translate.github.io/docs/#/guide/12_asynchronous-loading
oppia.constant('DEFAULT_TRANSLATIONS', {
    I18N_LIBRARY_PAGE_TITLE: 'Library',
    I18N_LIBRARY_LOADING: 'Loading',
    I18N_SIGNUP_PAGE_SUBTITLE: 'Registration',
    I18N_SIGNUP_PAGE_TITLE: 'Oppia',
    I18N_LIBRARY_SEARCH_PLACEHOLDER: 'What are you curious about?',
    I18N_LIBRARY_ALL_LANGUAGES: 'All Languages',
    I18N_LIBRARY_LANGUAGES_EN: 'English',
    I18N_LIBRARY_ALL_CATEGORIES: 'All Categories',
    I18N_TOPNAV_SIGN_IN: 'Sign in',
    I18N_SPLASH_PAGE_TITLE: 'Oppia: Teach, Learn, Explore',
    I18N_SIGNUP_REGISTRATION: 'Registration',
    I18N_SIGNUP_LOADING: 'Loading'
});
oppia.controller('I18nFooter', [
    '$cookies', '$http', '$rootScope', '$scope', '$timeout', '$translate',
    'UserService',
    function ($cookies, $http, $rootScope, $scope, $timeout, $translate, UserService) {
        // Changes the language of the translations.
        var preferencesDataUrl = '/preferenceshandler/data';
        var siteLanguageUrl = '/save_site_language';
        $scope.supportedSiteLanguages = constants.SUPPORTED_SITE_LANGUAGES;
        // The $timeout seems to be necessary for the dropdown to show anything
        // at the outset, if the default language is not English.
        $timeout(function () {
            // $translate.use() returns undefined until the language file is fully
            // loaded, which causes a blank field in the dropdown, hence we use
            // $translate.proposedLanguage() as suggested in
            // http://stackoverflow.com/a/28903658
            $scope.currentLanguageCode = $translate.use() ||
                $translate.proposedLanguage();
        }, 50);
        $scope.changeLanguage = function () {
            $translate.use($scope.currentLanguageCode);
            UserService.getUserInfoAsync().then(function (userInfo) {
                if (userInfo.isLoggedIn()) {
                    $http.put(siteLanguageUrl, {
                        site_language_code: $scope.currentLanguageCode
                    });
                }
            });
        };
    }
]);
oppia.config([
    '$translateProvider', 'DEFAULT_TRANSLATIONS',
    function ($translateProvider, DEFAULT_TRANSLATIONS) {
        var availableLanguageKeys = [];
        var availableLanguageKeysMap = {};
        constants.SUPPORTED_SITE_LANGUAGES.forEach(function (language) {
            availableLanguageKeys.push(language.id);
            availableLanguageKeysMap[language.id + '*'] = language.id;
        });
        availableLanguageKeysMap['*'] = 'en';
        $translateProvider
            .registerAvailableLanguageKeys(availableLanguageKeys, availableLanguageKeysMap)
            .useLoader('TranslationFileHashLoaderService', {
            prefix: '/i18n/',
            suffix: '.json'
        })
            // The use of default translation improves the loading time when English
            // is selected
            .translations('en', DEFAULT_TRANSLATIONS)
            .fallbackLanguage('en')
            .determinePreferredLanguage()
            .useCookieStorage()
            // The messageformat interpolation method is necessary for pluralization.
            // Is optional and should be passed as argument to the translate call. See
            // https://angular-translate.github.io/docs/#/guide/14_pluralization
            .addInterpolation('$translateMessageFormatInterpolation')
            // The strategy 'sanitize' does not support utf-8 encoding.
            // https://github.com/angular-translate/angular-translate/issues/1131
            // The strategy 'escape' will brake strings with raw html, like hyperlinks
            .useSanitizeValueStrategy('sanitizeParameters')
            .forceAsyncReload(true);
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/components/button-directives/buttons-directives.module.ts":
/*!*******************************************************************************************!*\
  !*** ./core/templates/dev/head/components/button-directives/buttons-directives.module.ts ***!
  \*******************************************************************************************/
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
 * @fileoverview Module for the buttons used by pages.
 */
angular.module('buttonsDirectivesModule', ['createActivityButtonModule',
    'explorationEmbedButtonModule', 'hintAndSolutionButtonsModule',
    'socialButtonsModule'
]);


/***/ }),

/***/ "./core/templates/dev/head/components/button-directives/create-button/create-activity-button.directive.ts":
/*!****************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/button-directives/create-button/create-activity-button.directive.ts ***!
  \****************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

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
 * @fileoverview Directive for the Create Exploration/Collection button.
 */
__webpack_require__(/*! components/entity-creation-services/collection-creation/collection-creation.service.ts */ "./core/templates/dev/head/components/entity-creation-services/collection-creation/collection-creation.service.ts");
__webpack_require__(/*! components/entity-creation-services/exploration-creation/exploration-creation.service.ts */ "./core/templates/dev/head/components/entity-creation-services/exploration-creation/exploration-creation.service.ts");
__webpack_require__(/*! domain/utilities/BrowserCheckerService.ts */ "./core/templates/dev/head/domain/utilities/BrowserCheckerService.ts");
__webpack_require__(/*! services/contextual/UrlService.ts */ "./core/templates/dev/head/services/contextual/UrlService.ts");
__webpack_require__(/*! services/SiteAnalyticsService.ts */ "./core/templates/dev/head/services/SiteAnalyticsService.ts");
__webpack_require__(/*! services/UserService.ts */ "./core/templates/dev/head/services/UserService.ts");
angular.module('createActivityButtonModule').directive('createActivityButton', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/button-directives/create-button/' +
                'create-activity-button.directive.html'),
            controllerAs: '$ctrl',
            controller: [
                '$timeout', '$window', '$uibModal',
                'ExplorationCreationService', 'CollectionCreationService',
                'SiteAnalyticsService', 'UrlService', 'UserService',
                'ALLOW_YAML_FILE_UPLOAD',
                function ($timeout, $window, $uibModal, ExplorationCreationService, CollectionCreationService, SiteAnalyticsService, UrlService, UserService, ALLOW_YAML_FILE_UPLOAD) {
                    var ctrl = this;
                    ctrl.creationInProgress = false;
                    ctrl.allowYamlFileUpload = ALLOW_YAML_FILE_UPLOAD;
                    ctrl.canCreateCollections = null;
                    ctrl.userIsLoggedIn = null;
                    UserService.getUserInfoAsync().then(function (userInfo) {
                        ctrl.canCreateCollections = userInfo.canCreateCollections();
                        ctrl.userIsLoggedIn = userInfo.isLoggedIn();
                    });
                    ctrl.showUploadExplorationModal = (ExplorationCreationService.showUploadExplorationModal);
                    ctrl.onRedirectToLogin = function (destinationUrl) {
                        SiteAnalyticsService.registerStartLoginEvent('createActivityButton');
                        $timeout(function () {
                            $window.location = destinationUrl;
                        }, 150);
                        return false;
                    };
                    ctrl.initCreationProcess = function () {
                        // Without this, the modal keeps reopening when the window is
                        // resized.
                        if (ctrl.creationInProgress) {
                            return;
                        }
                        ctrl.creationInProgress = true;
                        if (!ctrl.canCreateCollections) {
                            ExplorationCreationService.createNewExploration();
                        }
                        else if (UrlService.getPathname() !== '/creator_dashboard') {
                            $window.location.replace('/creator_dashboard?mode=create');
                        }
                        else {
                            $uibModal.open({
                                templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/creator-dashboard-page/' +
                                    'creator-dashboard-page-templates/' +
                                    'create-activity-modal.directive.html'),
                                backdrop: true,
                                controller: [
                                    '$scope', '$uibModalInstance',
                                    function ($scope, $uibModalInstance) {
                                        UserService.getUserInfoAsync().then(function (userInfo) {
                                            $scope.canCreateCollections = (userInfo.canCreateCollections());
                                        });
                                        $scope.chooseExploration = function () {
                                            ExplorationCreationService.createNewExploration();
                                            $uibModalInstance.close();
                                        };
                                        $scope.chooseCollection = function () {
                                            CollectionCreationService.createNewCollection();
                                            $uibModalInstance.close();
                                        };
                                        $scope.cancel = function () {
                                            $uibModalInstance.dismiss('cancel');
                                        };
                                        $scope.explorationImgUrl = (UrlInterpolationService.getStaticImageUrl('/activity/exploration.svg'));
                                        $scope.collectionImgUrl = (UrlInterpolationService.getStaticImageUrl('/activity/collection.svg'));
                                    }
                                ],
                                windowClass: 'oppia-creation-modal'
                            }).result.then(function () { }, function () {
                                ctrl.creationInProgress = false;
                            });
                        }
                    };
                    // If the user clicked on a 'create' button to get to the dashboard,
                    // open the create modal immediately (or redirect to the exploration
                    // editor if the create modal does not need to be shown).
                    if (UrlService.getUrlParams().mode === 'create') {
                        if (!ctrl.canCreateCollections) {
                            ExplorationCreationService.createNewExploration();
                        }
                        else {
                            ctrl.initCreationProcess();
                        }
                    }
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/components/button-directives/create-button/create-activity-button.module.ts":
/*!*************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/button-directives/create-button/create-activity-button.module.ts ***!
  \*************************************************************************************************************/
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
 * @fileoverview Module for the Create Exploration/Collection button.
 */
angular.module('createActivityButtonModule', []);


/***/ }),

/***/ "./core/templates/dev/head/components/button-directives/exploration-embed-modal/exploration-embed-button.module.ts":
/*!*************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/button-directives/exploration-embed-modal/exploration-embed-button.module.ts ***!
  \*************************************************************************************************************************/
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
 * @fileoverview Service for the 'embed exploration' modal.
 */
angular.module('explorationEmbedButtonModule', []);


/***/ }),

/***/ "./core/templates/dev/head/components/button-directives/hint-and-solution-buttons/hint-and-solution-buttons.module.ts":
/*!****************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/button-directives/hint-and-solution-buttons/hint-and-solution-buttons.module.ts ***!
  \****************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for hint and solution buttons.
 */
angular.module('hintAndSolutionButtonsModule', []);


/***/ }),

/***/ "./core/templates/dev/head/components/button-directives/social-buttons/social-buttons.directive.ts":
/*!*********************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/button-directives/social-buttons/social-buttons.directive.ts ***!
  \*********************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

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
 * @fileoverview Directive for the social buttons displayed in footer.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
angular.module('socialButtonsModule').directive('socialButtons', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/button-directives/social-buttons/' +
                'social-buttons.directive.html'),
            controllerAs: '$ctrl',
            controller: [function () {
                    var ctrl = this;
                    ctrl.getStaticImageUrl = UrlInterpolationService.getStaticImageUrl;
                }]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/components/button-directives/social-buttons/social-buttons.module.ts":
/*!******************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/button-directives/social-buttons/social-buttons.module.ts ***!
  \******************************************************************************************************/
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
 * @fileoverview Module for the social buttons.
 */
angular.module('socialButtonsModule', []);


/***/ }),

/***/ "./core/templates/dev/head/components/ck-editor-helpers/ck-editor-helpers.module.ts":
/*!******************************************************************************************!*\
  !*** ./core/templates/dev/head/components/ck-editor-helpers/ck-editor-helpers.module.ts ***!
  \******************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for the CkEditor helpers.
 */
angular.module('ckEditorHelpersModule', ['ckEditorRteModule',
    'ckEditorWidgetsModule'
]);


/***/ }),

/***/ "./core/templates/dev/head/components/ck-editor-helpers/ck-editor-rte/ck-editor-rte.module.ts":
/*!****************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/ck-editor-helpers/ck-editor-rte/ck-editor-rte.module.ts ***!
  \****************************************************************************************************/
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
 * @fileoverview Module for the Modal and functionality for the create story
 * button.
 */
angular.module('ckEditorRteModule', []);


/***/ }),

/***/ "./core/templates/dev/head/components/ck-editor-helpers/ck-editor-widgets/ck-editor-widgets.module.ts":
/*!************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/ck-editor-helpers/ck-editor-widgets/ck-editor-widgets.module.ts ***!
  \************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Code to dynamically generate CKEditor widgets for the rich
 * text components.
 */
angular.module('ckEditorWidgetsModule', []);


/***/ }),

/***/ "./core/templates/dev/head/components/codemirror-mergeview/codemirror-mergeview.module.ts":
/*!************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/codemirror-mergeview/codemirror-mergeview.module.ts ***!
  \************************************************************************************************/
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
 * @fileoverview Module for the codemirror mergeview component.
 */
angular.module('codemirrorMergeviewModule', []);


/***/ }),

/***/ "./core/templates/dev/head/components/common-layout-directives/alert-message/alert-message.directive.ts":
/*!**************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/common-layout-directives/alert-message/alert-message.directive.ts ***!
  \**************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

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
 * @fileoverview Directive for Alert Messages
 */
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
angular.module('alertMessageModule').directive('alertMessage', [function () {
        return {
            restrict: 'E',
            scope: {
                getMessage: '&messageObject',
                getMessageIndex: '&messageIndex'
            },
            template: '<div class="oppia-alert-message"></div>',
            controller: [
                '$scope', 'AlertsService', 'toastr',
                function ($scope, AlertsService, toastr) {
                    $scope.AlertsService = AlertsService;
                    $scope.toastr = toastr;
                }
            ],
            link: function (scope) {
                var message = scope.getMessage();
                if (message.type === 'info') {
                    scope.toastr.info(message.content, {
                        timeOut: message.timeout,
                        onHidden: function () {
                            scope.AlertsService.deleteMessage(message);
                        }
                    });
                }
                else if (message.type === 'success') {
                    scope.toastr.success(message.content, {
                        timeOut: message.timeout,
                        onHidden: function () {
                            scope.AlertsService.deleteMessage(message);
                        }
                    });
                }
            }
        };
    }]);


/***/ }),

/***/ "./core/templates/dev/head/components/common-layout-directives/alert-message/alert-message.module.ts":
/*!***********************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/common-layout-directives/alert-message/alert-message.module.ts ***!
  \***********************************************************************************************************/
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
 * @fileoverview Directive for Alert Messages
 */
angular.module('alertMessageModule', []);


/***/ }),

/***/ "./core/templates/dev/head/components/common-layout-directives/attribution-guide/attribution-guide.module.ts":
/*!*******************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/common-layout-directives/attribution-guide/attribution-guide.module.ts ***!
  \*******************************************************************************************************************/
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
 * @fileoverview Directive for the attribution guide.
 */
angular.module('attributionGuideModule', []);


/***/ }),

/***/ "./core/templates/dev/head/components/common-layout-directives/background-banner/background-banner.module.ts":
/*!*******************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/common-layout-directives/background-banner/background-banner.module.ts ***!
  \*******************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

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
/**
 * @fileoverview Module for the background banner.
 */
angular.module('backgroundBannerModule', []);


/***/ }),

/***/ "./core/templates/dev/head/components/common-layout-directives/common-layout-directives.module.ts":
/*!********************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/common-layout-directives/common-layout-directives.module.ts ***!
  \********************************************************************************************************/
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
 * @fileoverview Module for the common layout directives.
 */
angular.module('commonLayoutDirectivesModule', ['alertMessageModule',
    'attributionGuideModule', 'backgroundBannerModule',
    'loadingDotsModule', 'promoBarModule', 'sharingLinksModule',
    'sideNavigationBarModule', 'topNavigationBarModule'
]);


/***/ }),

/***/ "./core/templates/dev/head/components/common-layout-directives/loading-dots/loading-dots.module.ts":
/*!*********************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/common-layout-directives/loading-dots/loading-dots.module.ts ***!
  \*********************************************************************************************************/
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
 * @fileoverview Module for displaying animated loading dots.
 */
angular.module('loadingDotsModule', []);


/***/ }),

/***/ "./core/templates/dev/head/components/common-layout-directives/promo-bar/promo-bar.directive.ts":
/*!******************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/common-layout-directives/promo-bar/promo-bar.directive.ts ***!
  \******************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for a promo bar that appears at the top of the
 * screen. The bar is configurable with a message and whether the promo is
 * dismissible.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/PromoBarService.ts */ "./core/templates/dev/head/services/PromoBarService.ts");
angular.module('promoBarModule').directive('promoBar', [
    'PromoBarService', 'UrlInterpolationService',
    function (PromoBarService, UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/common-layout-directives/promo-bar/' +
                'promo-bar.directive.html'),
            controllerAs: '$ctrl',
            controller: [
                function () {
                    var ctrl = this;
                    var isPromoDismissed = function () {
                        return !!angular.fromJson(sessionStorage.promoIsDismissed);
                    };
                    var setPromoDismissed = function (promoIsDismissed) {
                        sessionStorage.promoIsDismissed = angular.toJson(promoIsDismissed);
                    };
                    PromoBarService.getPromoBarData().then(function (promoBarObject) {
                        ctrl.promoBarIsEnabled = promoBarObject.promoBarEnabled;
                        ctrl.promoBarMessage = promoBarObject.promoBarMessage;
                    });
                    // TODO(bhenning): Utilize cookies for tracking when a promo is
                    // dismissed. Cookies allow for a longer-lived memory of whether the
                    // promo is dismissed.
                    ctrl.promoIsVisible = !isPromoDismissed();
                    ctrl.dismissPromo = function () {
                        ctrl.promoIsVisible = false;
                        setPromoDismissed(true);
                    };
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/components/common-layout-directives/promo-bar/promo-bar.module.ts":
/*!***************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/common-layout-directives/promo-bar/promo-bar.module.ts ***!
  \***************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for a promo bar that appears at the top of the
 * screen. The bar is configurable with a message and whether the promo is
 * dismissible.
 */
angular.module('promoBarModule', []);


/***/ }),

/***/ "./core/templates/dev/head/components/common-layout-directives/sharing-links/sharing-links.module.ts":
/*!***********************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/common-layout-directives/sharing-links/sharing-links.module.ts ***!
  \***********************************************************************************************************/
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
 * @fileoverview Module for the Social Sharing Links.
 */
angular.module('sharingLinksModule', []);


/***/ }),

/***/ "./core/templates/dev/head/components/common-layout-directives/side-navigation-bar/side-navigation-bar.directive.ts":
/*!**************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/common-layout-directives/side-navigation-bar/side-navigation-bar.directive.ts ***!
  \**************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

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
 * @fileoverview Directive for the side navigation bar.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
angular.module('sideNavigationBarModule').directive('sideNavigationBar', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/common-layout-directives/side-navigation-bar/' +
                'side-navigation-bar.directive.html'),
            controllerAs: '$ctrl',
            controller: ['$timeout', function ($timeout) {
                    var ctrl = this;
                    ctrl.currentUrl = window.location.pathname;
                    ctrl.getStaticImageUrl = UrlInterpolationService.getStaticImageUrl;
                }]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/components/common-layout-directives/side-navigation-bar/side-navigation-bar.module.ts":
/*!***********************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/common-layout-directives/side-navigation-bar/side-navigation-bar.module.ts ***!
  \***********************************************************************************************************************/
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
 * @fileoverview Module for the side navigation bar.
 */
angular.module('sideNavigationBarModule', []);


/***/ }),

/***/ "./core/templates/dev/head/components/common-layout-directives/top-navigation-bar/top-navigation-bar.directive.ts":
/*!************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/common-layout-directives/top-navigation-bar/top-navigation-bar.directive.ts ***!
  \************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

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
 * @fileoverview Directive for the top navigation bar. This excludes the part
 * of the navbar that is used for local navigation (such as the various tabs in
 * the editor pages).
 */
__webpack_require__(/*! domain/sidebar/SidebarStatusService.ts */ "./core/templates/dev/head/domain/sidebar/SidebarStatusService.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/DebouncerService.ts */ "./core/templates/dev/head/services/DebouncerService.ts");
__webpack_require__(/*! services/NavigationService.ts */ "./core/templates/dev/head/services/NavigationService.ts");
__webpack_require__(/*! services/SiteAnalyticsService.ts */ "./core/templates/dev/head/services/SiteAnalyticsService.ts");
__webpack_require__(/*! services/UserService.ts */ "./core/templates/dev/head/services/UserService.ts");
__webpack_require__(/*! services/contextual/DeviceInfoService.ts */ "./core/templates/dev/head/services/contextual/DeviceInfoService.ts");
__webpack_require__(/*! services/contextual/WindowDimensionsService.ts */ "./core/templates/dev/head/services/contextual/WindowDimensionsService.ts");
angular.module('topNavigationBarModule').directive('topNavigationBar', [
    'UrlInterpolationService', function (UrlInterpolationService) {
        return {
            restrict: 'E',
            scope: {},
            bindToController: {},
            templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/common-layout-directives/top-navigation-bar/' +
                'top-navigation-bar.directive.html'),
            controllerAs: '$ctrl',
            controller: [
                '$scope', '$http', '$window', '$timeout', '$translate',
                'SidebarStatusService', 'LABEL_FOR_CLEARING_FOCUS', 'UserService',
                'SiteAnalyticsService', 'NavigationService', 'WindowDimensionsService',
                'DebouncerService', 'DeviceInfoService', 'LOGOUT_URL',
                function ($scope, $http, $window, $timeout, $translate, SidebarStatusService, LABEL_FOR_CLEARING_FOCUS, UserService, SiteAnalyticsService, NavigationService, WindowDimensionsService, DebouncerService, DeviceInfoService, LOGOUT_URL) {
                    var ctrl = this;
                    ctrl.isModerator = null;
                    ctrl.isAdmin = null;
                    ctrl.isTopicManager = null;
                    ctrl.isSuperAdmin = null;
                    ctrl.userIsLoggedIn = null;
                    ctrl.username = '';
                    UserService.getUserInfoAsync().then(function (userInfo) {
                        if (userInfo.getPreferredSiteLanguageCode()) {
                            $translate.use(userInfo.getPreferredSiteLanguageCode());
                        }
                        ctrl.isModerator = userInfo.isModerator();
                        ctrl.isAdmin = userInfo.isAdmin();
                        ctrl.isTopicManager = userInfo.isTopicManager();
                        ctrl.isSuperAdmin = userInfo.isSuperAdmin();
                        ctrl.userIsLoggedIn = userInfo.isLoggedIn();
                        ctrl.username = userInfo.getUsername();
                        if (ctrl.username) {
                            ctrl.profilePageUrl = UrlInterpolationService.interpolateUrl('/profile/<username>', {
                                username: ctrl.username
                            });
                        }
                        if (ctrl.userIsLoggedIn) {
                            // Show the number of unseen notifications in the navbar and page
                            // title, unless the user is already on the dashboard page.
                            $http.get('/notificationshandler').then(function (response) {
                                var data = response.data;
                                if ($window.location.pathname !== '/') {
                                    ctrl.numUnseenNotifications = data.num_unseen_notifications;
                                    if (ctrl.numUnseenNotifications > 0) {
                                        $window.document.title = ('(' + ctrl.numUnseenNotifications + ') ' +
                                            $window.document.title);
                                    }
                                }
                            });
                        }
                    });
                    UserService.getProfileImageDataUrlAsync().then(function (dataUrl) {
                        ctrl.profilePictureDataUrl = dataUrl;
                    });
                    var NAV_MODE_SIGNUP = 'signup';
                    var NAV_MODES_WITH_CUSTOM_LOCAL_NAV = [
                        'create', 'explore', 'collection', 'topics_and_skills_dashboard',
                        'topic_editor', 'skill_editor', 'story_editor'
                    ];
                    ctrl.currentUrl = window.location.pathname.split('/')[1];
                    ctrl.LABEL_FOR_CLEARING_FOCUS = LABEL_FOR_CLEARING_FOCUS;
                    ctrl.newStructuresEnabled = constants.ENABLE_NEW_STRUCTURE_EDITORS;
                    ctrl.getStaticImageUrl = UrlInterpolationService.getStaticImageUrl;
                    ctrl.logoutUrl = LOGOUT_URL;
                    ctrl.userMenuIsShown = (ctrl.currentUrl !== NAV_MODE_SIGNUP);
                    ctrl.standardNavIsShown = (NAV_MODES_WITH_CUSTOM_LOCAL_NAV.indexOf(ctrl.currentUrl) === -1);
                    ctrl.onLoginButtonClicked = function () {
                        SiteAnalyticsService.registerStartLoginEvent('loginButton');
                        UserService.getLoginUrlAsync().then(function (loginUrl) {
                            if (loginUrl) {
                                $timeout(function () {
                                    $window.location = loginUrl;
                                }, 150);
                            }
                            else {
                                throw Error('Login url not found.');
                            }
                        });
                    };
                    ctrl.googleSignInIconUrl = (UrlInterpolationService.getStaticImageUrl('/google_signin_buttons/google_signin.svg'));
                    ctrl.onLogoutButtonClicked = function () {
                        $window.localStorage.removeItem('last_uploaded_audio_lang');
                    };
                    ctrl.ACTION_OPEN = NavigationService.ACTION_OPEN;
                    ctrl.ACTION_CLOSE = NavigationService.ACTION_CLOSE;
                    ctrl.KEYBOARD_EVENT_TO_KEY_CODES =
                        NavigationService.KEYBOARD_EVENT_TO_KEY_CODES;
                    /**
                     * Opens the submenu.
                     * @param {object} evt
                     * @param {String} menuName - name of menu, on which
                     * open/close action to be performed (aboutMenu,profileMenu).
                     */
                    ctrl.openSubmenu = function (evt, menuName) {
                        // Focus on the current target before opening its submenu.
                        NavigationService.openSubmenu(evt, menuName);
                    };
                    ctrl.blurNavigationLinks = function (evt) {
                        // This is required because if about submenu is in open state
                        // and when you hover on library, both will be highlighted,
                        // To avoid that, blur all the a's in nav, so that only one
                        // will be highlighted.
                        $('nav a').blur();
                    };
                    ctrl.closeSubmenu = function (evt) {
                        NavigationService.closeSubmenu(evt);
                    };
                    ctrl.closeSubmenuIfNotMobile = function (evt) {
                        if (DeviceInfoService.isMobileDevice()) {
                            return;
                        }
                        ctrl.closeSubmenu(evt);
                    };
                    /**
                     * Handles keydown events on menus.
                     * @param {object} evt
                     * @param {String} menuName - name of menu to perform action
                     * on(aboutMenu/profileMenu)
                     * @param {object} eventsTobeHandled - Map keyboard events('Enter') to
                     * corresponding actions to be performed(open/close).
                     *
                     * @example
                     *  onMenuKeypress($event, 'aboutMenu', {enter: 'open'})
                     */
                    ctrl.onMenuKeypress = function (evt, menuName, eventsTobeHandled) {
                        NavigationService.onMenuKeypress(evt, menuName, eventsTobeHandled);
                        ctrl.activeMenuName = NavigationService.activeMenuName;
                    };
                    // Close the submenu if focus or click occurs anywhere outside of
                    // the menu or outside of its parent (which opens submenu on hover).
                    angular.element(document).on('click', function (evt) {
                        if (!angular.element(evt.target).closest('li').length) {
                            ctrl.activeMenuName = '';
                            $scope.$apply();
                        }
                    });
                    ctrl.windowIsNarrow = WindowDimensionsService.isWindowNarrow();
                    var currentWindowWidth = WindowDimensionsService.getWidth();
                    ctrl.navElementsVisibilityStatus = {};
                    // The order of the elements in this array specifies the order in
                    // which they will be hidden. Earlier elements will be hidden first.
                    var NAV_ELEMENTS_ORDER = [
                        'I18N_TOPNAV_DONATE', 'I18N_TOPNAV_ABOUT',
                        'I18N_CREATE_EXPLORATION_CREATE', 'I18N_TOPNAV_LIBRARY'
                    ];
                    for (var i = 0; i < NAV_ELEMENTS_ORDER.length; i++) {
                        ctrl.navElementsVisibilityStatus[NAV_ELEMENTS_ORDER[i]] = true;
                    }
                    WindowDimensionsService.registerOnResizeHook(function () {
                        ctrl.windowIsNarrow = WindowDimensionsService.isWindowNarrow();
                        $scope.$apply();
                        // If window is resized larger, try displaying the hidden elements.
                        if (currentWindowWidth < WindowDimensionsService.getWidth()) {
                            for (var i = 0; i < NAV_ELEMENTS_ORDER.length; i++) {
                                if (!ctrl.navElementsVisibilityStatus[NAV_ELEMENTS_ORDER[i]]) {
                                    ctrl.navElementsVisibilityStatus[NAV_ELEMENTS_ORDER[i]] =
                                        true;
                                }
                            }
                        }
                        // Close the sidebar, if necessary.
                        SidebarStatusService.closeSidebar();
                        ctrl.sidebarIsShown = SidebarStatusService.isSidebarShown();
                        currentWindowWidth = WindowDimensionsService.getWidth();
                        truncateNavbarDebounced();
                    });
                    ctrl.isSidebarShown = function () {
                        if (SidebarStatusService.isSidebarShown()) {
                            angular.element(document.body).addClass('oppia-stop-scroll');
                        }
                        else {
                            angular.element(document.body).removeClass('oppia-stop-scroll');
                        }
                        return SidebarStatusService.isSidebarShown();
                    };
                    ctrl.toggleSidebar = function () {
                        SidebarStatusService.toggleSidebar();
                    };
                    /**
                     * Checks if i18n has been run.
                     * If i18n has not yet run, the <a> and <span> tags will have
                     * no text content, so their innerText.length value will be 0.
                     * @returns {boolean}
                     */
                    var checkIfI18NCompleted = function () {
                        var i18nCompleted = true;
                        var tabs = document.querySelectorAll('.oppia-navbar-tab-content');
                        for (var i = 0; i < tabs.length; i++) {
                            if (tabs[i].innerText.length === 0) {
                                i18nCompleted = false;
                                break;
                            }
                        }
                        return i18nCompleted;
                    };
                    /**
                     * Checks if window is >768px and i18n is completed, then checks
                     * for overflow. If overflow is detected, hides the least important
                     * tab and then calls itself again after a 50ms delay.
                     */
                    var truncateNavbar = function () {
                        // If the window is narrow, the standard nav tabs are not shown.
                        if (WindowDimensionsService.isWindowNarrow()) {
                            return;
                        }
                        // If i18n hasn't completed, retry after 100ms.
                        if (!checkIfI18NCompleted()) {
                            $timeout(truncateNavbar, 100);
                            return;
                        }
                        // The value of 60px used here comes from measuring the normal
                        // height of the navbar (56px) in Chrome's inspector and rounding
                        // up. If the height of the navbar is changed in the future this
                        // will need to be updated.
                        if (document.querySelector('div.collapse.navbar-collapse')
                            .clientHeight > 60) {
                            for (var i = 0; i < NAV_ELEMENTS_ORDER.length; i++) {
                                if (ctrl.navElementsVisibilityStatus[NAV_ELEMENTS_ORDER[i]]) {
                                    // Hide one element, then check again after 50ms.
                                    // This gives the browser time to render the visibility
                                    // change.
                                    ctrl.navElementsVisibilityStatus[NAV_ELEMENTS_ORDER[i]] =
                                        false;
                                    // Force a digest cycle to hide element immediately.
                                    // Otherwise it would be hidden after the next call.
                                    // This is due to setTimeout use in debounce.
                                    $scope.$apply();
                                    $timeout(truncateNavbar, 50);
                                    return;
                                }
                            }
                        }
                    };
                    var truncateNavbarDebounced = DebouncerService.debounce(truncateNavbar, 500);
                    // The function needs to be run after i18n. A timeout of 0 appears to
                    // run after i18n in Chrome, but not other browsers. The function will
                    // check if i18n is complete and set a new timeout if it is not. Since
                    // a timeout of 0 works for at least one browser, it is used here.
                    $timeout(truncateNavbar, 0);
                    $scope.$on('searchBarLoaded', function () {
                        $timeout(truncateNavbar, 100);
                    });
                }
            ]
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/components/common-layout-directives/top-navigation-bar/top-navigation-bar.module.ts":
/*!*********************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/common-layout-directives/top-navigation-bar/top-navigation-bar.module.ts ***!
  \*********************************************************************************************************************/
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
 * @fileoverview Directive for the top navigation bar. This excludes the part
 * of the navbar that is used for local navigation (such as the various tabs in
 * the editor pages).
 */
angular.module('topNavigationBarModule', []);


/***/ }),

/***/ "./core/templates/dev/head/components/entity-creation-services/collection-creation/collection-creation.service.ts":
/*!************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/entity-creation-services/collection-creation/collection-creation.service.ts ***!
  \************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

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
 * @fileoverview Modal and functionality for the create collection button.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
__webpack_require__(/*! services/SiteAnalyticsService.ts */ "./core/templates/dev/head/services/SiteAnalyticsService.ts");
// TODO(bhenning): Refactor this to match the frontend design spec and reduce
// duplicated code between CollectionCreationService and
// ExplorationCreationService.
angular.module('entityCreationServicesModule').factory('CollectionCreationService', [
    '$http', '$rootScope', '$timeout', '$window', 'AlertsService',
    'SiteAnalyticsService', 'UrlInterpolationService',
    function ($http, $rootScope, $timeout, $window, AlertsService, SiteAnalyticsService, UrlInterpolationService) {
        var CREATE_NEW_COLLECTION_URL_TEMPLATE = ('/collection_editor/create/<collection_id>');
        var collectionCreationInProgress = false;
        return {
            createNewCollection: function () {
                if (collectionCreationInProgress) {
                    return;
                }
                collectionCreationInProgress = true;
                AlertsService.clearWarnings();
                $rootScope.loadingMessage = 'Creating collection';
                $http.post('/collection_editor_handler/create_new', {})
                    .then(function (response) {
                    SiteAnalyticsService.registerCreateNewCollectionEvent(response.data.collectionId);
                    $timeout(function () {
                        $window.location = UrlInterpolationService.interpolateUrl(CREATE_NEW_COLLECTION_URL_TEMPLATE, {
                            collection_id: response.data.collectionId
                        });
                    }, 150);
                }, function () {
                    $rootScope.loadingMessage = '';
                });
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/components/entity-creation-services/entity-creation-services.module.ts":
/*!********************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/entity-creation-services/entity-creation-services.module.ts ***!
  \********************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for the entity creation services.
 */
angular.module('entityCreationServicesModule', []);


/***/ }),

/***/ "./core/templates/dev/head/components/entity-creation-services/exploration-creation/exploration-creation.service.ts":
/*!**************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/entity-creation-services/exploration-creation/exploration-creation.service.ts ***!
  \**************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

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
 * @fileoverview Functionality for the create exploration button and upload
 * modal.
 */
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
__webpack_require__(/*! services/AlertsService.ts */ "./core/templates/dev/head/services/AlertsService.ts");
__webpack_require__(/*! services/SiteAnalyticsService.ts */ "./core/templates/dev/head/services/SiteAnalyticsService.ts");
angular.module('entityCreationServicesModule').factory('ExplorationCreationService', [
    '$http', '$rootScope', '$timeout', '$uibModal', '$window',
    'AlertsService', 'SiteAnalyticsService', 'UrlInterpolationService',
    function ($http, $rootScope, $timeout, $uibModal, $window, AlertsService, SiteAnalyticsService, UrlInterpolationService) {
        var CREATE_NEW_EXPLORATION_URL_TEMPLATE = '/create/<exploration_id>';
        var explorationCreationInProgress = false;
        return {
            createNewExploration: function () {
                if (explorationCreationInProgress) {
                    return;
                }
                explorationCreationInProgress = true;
                AlertsService.clearWarnings();
                $rootScope.loadingMessage = 'Creating exploration';
                $http.post('/contributehandler/create_new', {}).then(function (response) {
                    SiteAnalyticsService.registerCreateNewExplorationEvent(response.data.explorationId);
                    $timeout(function () {
                        $window.location = UrlInterpolationService.interpolateUrl(CREATE_NEW_EXPLORATION_URL_TEMPLATE, {
                            exploration_id: response.data.explorationId
                        });
                    }, 150);
                    return false;
                }, function () {
                    $rootScope.loadingMessage = '';
                    explorationCreationInProgress = false;
                });
            },
            showUploadExplorationModal: function () {
                AlertsService.clearWarnings();
                $uibModal.open({
                    backdrop: true,
                    templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/pages/creator-dashboard-page/' +
                        'creator-dashboard-page-templates/' +
                        'upload-activity-modal.directive.html'),
                    controller: [
                        '$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                            $scope.save = function () {
                                var returnObj = {
                                    yamlFile: null
                                };
                                var file = document.getElementById('newFileInput').files[0];
                                if (!file || !file.size) {
                                    AlertsService.addWarning('Empty file detected.');
                                    return;
                                }
                                returnObj.yamlFile = file;
                                $uibModalInstance.close(returnObj);
                            };
                            $scope.cancel = function () {
                                $uibModalInstance.dismiss('cancel');
                                AlertsService.clearWarnings();
                            };
                        }
                    ]
                }).result.then(function (result) {
                    var yamlFile = result.yamlFile;
                    $rootScope.loadingMessage = 'Creating exploration';
                    var form = new FormData();
                    form.append('yaml_file', yamlFile);
                    form.append('payload', JSON.stringify({}));
                    form.append('csrf_token', GLOBALS.csrf_token);
                    $.ajax({
                        contentType: false,
                        data: form,
                        dataFilter: function (data) {
                            // Remove the XSSI prefix.
                            return JSON.parse(data.substring(5));
                        },
                        dataType: 'text',
                        processData: false,
                        type: 'POST',
                        url: 'contributehandler/upload'
                    }).done(function (data) {
                        $window.location = UrlInterpolationService.interpolateUrl(CREATE_NEW_EXPLORATION_URL_TEMPLATE, {
                            exploration_id: data.explorationId
                        });
                    }).fail(function (data) {
                        var transformedData = data.responseText.substring(5);
                        var parsedResponse = JSON.parse(transformedData);
                        AlertsService.addWarning(parsedResponse.error || 'Error communicating with server.');
                        $rootScope.loadingMessage = '';
                        $rootScope.$apply();
                    });
                });
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/components/forms/forms-directives/apply-validation/apply-validation.module.ts":
/*!***************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/forms-directives/apply-validation/apply-validation.module.ts ***!
  \***************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for applying validation.
 */
angular.module('applyValidationModule', []);


/***/ }),

/***/ "./core/templates/dev/head/components/forms/forms-directives/audio-file-uploader/audio-file-uploader.module.ts":
/*!*********************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/forms-directives/audio-file-uploader/audio-file-uploader.module.ts ***!
  \*********************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module that enables the user to upload audio files.
 */
angular.module('audioFileUploaderModule', []);


/***/ }),

/***/ "./core/templates/dev/head/components/forms/forms-directives/forms-directives.module.ts":
/*!**********************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/forms-directives/forms-directives.module.ts ***!
  \**********************************************************************************************/
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
 * @fileoverview Module for the form directives.
 */
angular.module('formsDirectivesModule', ['applyValidationModule',
    'audioFileUploaderModule', 'htmlSelectModule', 'imageUploaderModule',
    'objectEditorModule', 'requireIsFloatModule', 'select2DropdownModule'
]);


/***/ }),

/***/ "./core/templates/dev/head/components/forms/forms-directives/html-select/html-select.module.ts":
/*!*****************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/forms-directives/html-select/html-select.module.ts ***!
  \*****************************************************************************************************/
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
 * @fileoverview Module for the selection dropdown with HTML content.
 */
angular.module('htmlSelectModule', []);


/***/ }),

/***/ "./core/templates/dev/head/components/forms/forms-directives/image-uploader/image-uploader.module.ts":
/*!***********************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/forms-directives/image-uploader/image-uploader.module.ts ***!
  \***********************************************************************************************************/
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
 * @fileoverview Module for uploading images.
 */
angular.module('imageUploaderModule', []);


/***/ }),

/***/ "./core/templates/dev/head/components/forms/forms-directives/object-editor/object-editor.directive.ts":
/*!************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/forms-directives/object-editor/object-editor.directive.ts ***!
  \************************************************************************************************************/
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
 * @fileoverview Directives for the object editors.
 */
// Individual object editor directives are in extensions/objects/templates.
angular.module('objectEditorModule').directive('objectEditor', ['$compile', '$log', function ($compile, $log) {
        return {
            scope: {
                alwaysEditable: '@',
                initArgs: '=',
                isEditable: '@',
                objType: '@',
                value: '='
            },
            link: function (scope, element) {
                // Converts a camel-cased string to a lower-case hyphen-separated
                // string.
                var directiveName = scope.objType.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
                scope.getInitArgs = function () {
                    return scope.initArgs;
                };
                scope.getAlwaysEditable = function () {
                    return scope.alwaysEditable;
                };
                scope.getIsEditable = function () {
                    return scope.isEditable;
                };
                if (directiveName) {
                    element.html('<' + directiveName +
                        '-editor get-always-editable="getAlwaysEditable()"' +
                        ' get-init-args="getInitArgs()" get-is-editable="getIsEditable()"' +
                        ' obj-type="objType" value="value"></' +
                        directiveName + '-editor>');
                    $compile(element.contents())(scope);
                }
                else {
                    $log.error('Error in objectEditor: no editor type supplied.');
                }
            },
            restrict: 'E'
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/components/forms/forms-directives/object-editor/object-editor.module.ts":
/*!*********************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/forms-directives/object-editor/object-editor.module.ts ***!
  \*********************************************************************************************************/
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
 * @fileoverview Module for the object editors.
 */
angular.module('objectEditorModule', []);


/***/ }),

/***/ "./core/templates/dev/head/components/forms/forms-directives/require-is-float/require-is-float.module.ts":
/*!***************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/forms-directives/require-is-float/require-is-float.module.ts ***!
  \***************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for requiring "isFloat" filter.
 */
angular.module('requireIsFloatModule', []);


/***/ }),

/***/ "./core/templates/dev/head/components/forms/forms-directives/select2-dropdown/select2-dropdown.module.ts":
/*!***************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/forms-directives/select2-dropdown/select2-dropdown.module.ts ***!
  \***************************************************************************************************************/
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
 * @fileoverview Module for the select2 autocomplete component.
 */
angular.module('select2DropdownModule', []);


/***/ }),

/***/ "./core/templates/dev/head/components/forms/forms-schema-editors/forms-schema-editors.module.ts":
/*!******************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/forms-schema-editors/forms-schema-editors.module.ts ***!
  \******************************************************************************************************/
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
 * @fileoverview Module for the form schema editors.
 */
angular.module('formsSchemaEditorsModule', [
    'schemaBasedEditorModule', 'schemaBasedExpressionEditorModule'
]);


/***/ }),

/***/ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-bool-editor/schema-based-bool-editor.module.ts":
/*!*******************************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-bool-editor/schema-based-bool-editor.module.ts ***!
  \*******************************************************************************************************************************************************/
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
 * @fileoverview Module for a schema-based editor for booleans.
 */
angular.module('schemaBasedBoolEditorModule', []);


/***/ }),

/***/ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-choices-editor/schema-based-choices-editor.module.ts":
/*!*************************************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-choices-editor/schema-based-choices-editor.module.ts ***!
  \*************************************************************************************************************************************************************/
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
 * @fileoverview Module for a schema-based editor for multiple choice.
 */
angular.module('schemaBasedChoicesEditorModule', []);


/***/ }),

/***/ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-custom-editor/schema-based-custom-editor.module.ts":
/*!***********************************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-custom-editor/schema-based-custom-editor.module.ts ***!
  \***********************************************************************************************************************************************************/
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
 * @fileoverview Module for a schema-based editor for custom values.
 */
angular.module('schemaBasedCustomEditorModule', []);


/***/ }),

/***/ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-dict-editor/schema-based-dict-editor.module.ts":
/*!*******************************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-dict-editor/schema-based-dict-editor.module.ts ***!
  \*******************************************************************************************************************************************************/
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
 * @fileoverview Module for a schema-based editor for dicts.
 */
angular.module('schemaBasedDictEditorModule', []);


/***/ }),

/***/ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-editor.module.ts":
/*!*************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-editor.module.ts ***!
  \*************************************************************************************************************************/
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
 * @fileoverview Module for general schema-based editors.
 */
angular.module('schemaBasedEditorModule', ['schemaBasedBoolEditorModule',
    'schemaBasedChoicesEditorModule', 'schemaBasedCustomEditorModule',
    'schemaBasedDictEditorModule', 'schemaBasedFloatEditorModule',
    'schemaBasedHtmlEditorModule', 'schemaBasedIntEditorModule',
    'schemaBasedListEditorModule', 'schemaBasedUnicodeEditorModule'
]);


/***/ }),

/***/ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-float-editor/schema-based-float-editor.module.ts":
/*!*********************************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-float-editor/schema-based-float-editor.module.ts ***!
  \*********************************************************************************************************************************************************/
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
 * @fileoverview Module for a schema-based editor for floats.
 */
angular.module('schemaBasedFloatEditorModule', []);


/***/ }),

/***/ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-html-editor/schema-based-html-editor.module.ts":
/*!*******************************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-html-editor/schema-based-html-editor.module.ts ***!
  \*******************************************************************************************************************************************************/
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
 * @fileoverview Module for a schema-based editor for HTML.
 */
angular.module('schemaBasedHtmlEditorModule', []);


/***/ }),

/***/ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-int-editor/schema-based-int-editor.module.ts":
/*!*****************************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-int-editor/schema-based-int-editor.module.ts ***!
  \*****************************************************************************************************************************************************/
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
 * @fileoverview Module for a schema-based editor for integers.
 */
angular.module('schemaBasedIntEditorModule', []);


/***/ }),

/***/ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-list-editor/schema-based-list-editor.module.ts":
/*!*******************************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-list-editor/schema-based-list-editor.module.ts ***!
  \*******************************************************************************************************************************************************/
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
 * @fileoverview Module for a schema-based editor for lists.
 */
angular.module('schemaBasedListEditorModule', []);


/***/ }),

/***/ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-unicode-editor/schema-based-unicode-editor.module.ts":
/*!*************************************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-editor/schema-based-unicode-editor/schema-based-unicode-editor.module.ts ***!
  \*************************************************************************************************************************************************************/
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
 * @fileoverview Module for a schema-based editor for unicode strings.
 */
angular.module('schemaBasedUnicodeEditorModule', []);


/***/ }),

/***/ "./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-expression-editor/schema-based-expression-editor.module.ts":
/*!***********************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/forms-schema-editors/schema-based-expression-editor/schema-based-expression-editor.module.ts ***!
  \***********************************************************************************************************************************************/
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
 * @fileoverview Module for a schema-based editor for expressions.
 */
angular.module('schemaBasedExpressionEditorModule', []);


/***/ }),

/***/ "./core/templates/dev/head/components/forms/forms-unicode-filters/forms-unicode-filters.module.ts":
/*!********************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/forms-unicode-filters/forms-unicode-filters.module.ts ***!
  \********************************************************************************************************/
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
 * @fileoverview Module for unicode filters.
 */
angular.module('formsUnicodeFiltersModule', []);


/***/ }),

/***/ "./core/templates/dev/head/components/forms/forms-validators/forms-validators.module.ts":
/*!**********************************************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/forms-validators/forms-validators.module.ts ***!
  \**********************************************************************************************/
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
 * @fileoverview Module for unicode filters.
 */
angular.module('formsValidatorsModule', []);


/***/ }),

/***/ "./core/templates/dev/head/components/forms/forms.module.ts":
/*!******************************************************************!*\
  !*** ./core/templates/dev/head/components/forms/forms.module.ts ***!
  \******************************************************************/
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
 * @fileoverview Module for forms.
 */
angular.module('formsModule', ['formsSchemaEditorsModule',
    'formsDirectivesModule', 'formsUnicodeFiltersModule', 'formsValidatorsModule'
]);


/***/ }),

/***/ "./core/templates/dev/head/components/profile-link-directives/circular-image/circular-image.module.ts":
/*!************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/profile-link-directives/circular-image/circular-image.module.ts ***!
  \************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

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
/**
 * @fileoverview Module for displaying circled images with linking (when
 * available).
 */
angular.module('circularImageModule', []);


/***/ }),

/***/ "./core/templates/dev/head/components/profile-link-directives/profile-link-directives.module.ts":
/*!******************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/profile-link-directives/profile-link-directives.module.ts ***!
  \******************************************************************************************************/
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
 * @fileoverview Module for profile link directives.
 */
angular.module('profileLinkDirectivesModule', ['profileLinkTextModule',
    'profileLinkImageModule', 'circularImageModule'
]);


/***/ }),

/***/ "./core/templates/dev/head/components/profile-link-directives/profile-link-image/profile-link-image.module.ts":
/*!********************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/profile-link-directives/profile-link-image/profile-link-image.module.ts ***!
  \********************************************************************************************************************/
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
 * @fileoverview Module for creating image links to a user's profile page.
 */
angular.module('profileLinkImageModule', []);


/***/ }),

/***/ "./core/templates/dev/head/components/profile-link-directives/profile-link-text/profile-link-text.module.ts":
/*!******************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/profile-link-directives/profile-link-text/profile-link-text.module.ts ***!
  \******************************************************************************************************************/
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
 * @fileoverview Module for creating text links to a user's profile page.
 */
angular.module('profileLinkTextModule', []);


/***/ }),

/***/ "./core/templates/dev/head/components/ratings/rating-display/rating-display.module.ts":
/*!********************************************************************************************!*\
  !*** ./core/templates/dev/head/components/ratings/rating-display/rating-display.module.ts ***!
  \********************************************************************************************/
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
 * @fileoverview Module for displaying summary rating information.
 */
angular.module('ratingDisplayModule', []);


/***/ }),

/***/ "./core/templates/dev/head/components/ratings/ratings.module.ts":
/*!**********************************************************************!*\
  !*** ./core/templates/dev/head/components/ratings/ratings.module.ts ***!
  \**********************************************************************/
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
 * @fileoverview Module for the ratings.
 */
angular.module('ratingsModule', ['ratingDisplayModule']);


/***/ }),

/***/ "./core/templates/dev/head/components/state/answer-group-editor/answer-group-editor.module.ts":
/*!****************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/state/answer-group-editor/answer-group-editor.module.ts ***!
  \****************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

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
/**
 * @fileoverview Module for the answer group editor.
 */
angular.module('answerGroupEditorModule', []);


/***/ }),

/***/ "./core/templates/dev/head/components/state/hint-editor/hint-editor.module.ts":
/*!************************************************************************************!*\
  !*** ./core/templates/dev/head/components/state/hint-editor/hint-editor.module.ts ***!
  \************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for the hint editor.
 */
angular.module('hintEditorModule', []);


/***/ }),

/***/ "./core/templates/dev/head/components/state/outcome-editor/outcome-destination-editor/outcome-destination-editor.module.ts":
/*!*********************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/state/outcome-editor/outcome-destination-editor/outcome-destination-editor.module.ts ***!
  \*********************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

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
/**
 * @fileoverview Module for the outcome destination editor.
 */
angular.module('outcomeDestinationEditorModule', []);


/***/ }),

/***/ "./core/templates/dev/head/components/state/outcome-editor/outcome-editor.module.ts":
/*!******************************************************************************************!*\
  !*** ./core/templates/dev/head/components/state/outcome-editor/outcome-editor.module.ts ***!
  \******************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

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
/**
 * @fileoverview Module for the outcome editor.
 */
angular.module('outcomeEditorModule', ['outcomeDestinationEditorModule',
    'outcomeFeedbackEditorModule'
]);


/***/ }),

/***/ "./core/templates/dev/head/components/state/outcome-editor/outcome-feedback-editor/outcome-feedback-editor.module.ts":
/*!***************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/state/outcome-editor/outcome-feedback-editor/outcome-feedback-editor.module.ts ***!
  \***************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

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
/**
 * @fileoverview Module for the outcome destination editor.
 */
angular.module('outcomeFeedbackEditorModule', []);


/***/ }),

/***/ "./core/templates/dev/head/components/state/response-header/response-header.module.ts":
/*!********************************************************************************************!*\
  !*** ./core/templates/dev/head/components/state/response-header/response-header.module.ts ***!
  \********************************************************************************************/
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
 * @fileoverview Module for the header of the response tiles.
 */
angular.module('responseHeaderModule', []);


/***/ }),

/***/ "./core/templates/dev/head/components/state/rule-editor/rule-editor.module.ts":
/*!************************************************************************************!*\
  !*** ./core/templates/dev/head/components/state/rule-editor/rule-editor.module.ts ***!
  \************************************************************************************/
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
 * @fileoverview Module for the rule editor.
 */
angular.module('ruleEditorModule', []);


/***/ }),

/***/ "./core/templates/dev/head/components/state/rule-type-selector/rule-type-selector.module.ts":
/*!**************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/state/rule-type-selector/rule-type-selector.module.ts ***!
  \**************************************************************************************************/
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
 * @fileoverview Directive for the rule type selector.
 */
angular.module('ruleTypeSelectorModule', []);


/***/ }),

/***/ "./core/templates/dev/head/components/state/solution-editor/solution-editor.module.ts":
/*!********************************************************************************************!*\
  !*** ./core/templates/dev/head/components/state/solution-editor/solution-editor.module.ts ***!
  \********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for the solution editor.
 */
angular.module('solutionEditorModule', ['solutionExplanationEditorModule']);


/***/ }),

/***/ "./core/templates/dev/head/components/state/solution-editor/solution-explanation-editor/solution-explanation-editor.module.ts":
/*!************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/state/solution-editor/solution-explanation-editor/solution-explanation-editor.module.ts ***!
  \************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the solution explanation editor.
 */
angular.module('solutionExplanationEditorModule', []);


/***/ }),

/***/ "./core/templates/dev/head/components/state/state.module.ts":
/*!******************************************************************!*\
  !*** ./core/templates/dev/head/components/state/state.module.ts ***!
  \******************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for state component.
 */
angular.module('stateModule', ['answerGroupEditorModule', 'hintEditorModule',
    'outcomeEditorModule', 'responseHeaderModule', 'ruleEditorModule',
    'ruleTypeSelectorModule', 'solutionEditorModule'
]);


/***/ }),

/***/ "./core/templates/dev/head/components/summary-list-header/summary-list-header.module.ts":
/*!**********************************************************************************************!*\
  !*** ./core/templates/dev/head/components/summary-list-header/summary-list-header.module.ts ***!
  \**********************************************************************************************/
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
 * @fileoverview Module for the header of items in a list.
 */
angular.module('summaryListHeaderModule', []);


/***/ }),

/***/ "./core/templates/dev/head/components/summary-tile-directives/collection-summary-tile/collection-summary-tile.module.ts":
/*!******************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/summary-tile-directives/collection-summary-tile/collection-summary-tile.module.ts ***!
  \******************************************************************************************************************************/
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
 * @fileoverview Module for Summary tile for collections.
 */
angular.module('collectionSummaryTileModule', []);
angular.module('collectionSummaryTileModule').constant('COLLECTION_VIEWER_URL', '/collection/<collection_id>');
angular.module('collectionSummaryTileModule').constant('COLLECTION_EDITOR_URL', '/collection_editor/create/<collection_id>');


/***/ }),

/***/ "./core/templates/dev/head/components/summary-tile-directives/exploration-summary-tile/exploration-summary-tile.module.ts":
/*!********************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/summary-tile-directives/exploration-summary-tile/exploration-summary-tile.module.ts ***!
  \********************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

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
/**
 * @fileoverview Module for Component for an exploration summary tile.
 */
angular.module('explorationSummaryTileModule', []);


/***/ }),

/***/ "./core/templates/dev/head/components/summary-tile-directives/story-summary-tile/story-summary-tile.module.ts":
/*!********************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/summary-tile-directives/story-summary-tile/story-summary-tile.module.ts ***!
  \********************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

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
/**
 * @fileoverview Module for Component for a canonical story tile.
 */
angular.module('storySummaryTileModule', []);


/***/ }),

/***/ "./core/templates/dev/head/components/summary-tile-directives/summary-tile-directives.module.ts":
/*!******************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/summary-tile-directives/summary-tile-directives.module.ts ***!
  \******************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for the summary tile directives.
 */
angular.module('summaryTileDirectivesModule', [
    'collectionSummaryTileModule',
    'explorationSummaryTileModule',
    'storySummaryTileModule'
]);


/***/ }),

/***/ "./core/templates/dev/head/components/version-diff-visualization/version-diff-visualization.module.ts":
/*!************************************************************************************************************!*\
  !*** ./core/templates/dev/head/components/version-diff-visualization/version-diff-visualization.module.ts ***!
  \************************************************************************************************************/
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
 * @fileoverview Module for the visualization of the diff between two
 *   versions of an exploration.
 */
angular.module('visualDiffVisualizationModule', []);


/***/ }),

/***/ "./core/templates/dev/head/directives/FocusOnDirective.ts":
/*!****************************************************************!*\
  !*** ./core/templates/dev/head/directives/FocusOnDirective.ts ***!
  \****************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview FocusOn Directive (not associated with reusable
 * components.)
 * NB: Reusable component directives should go in the components/ folder.
 */
// When set as an attr of an <input> element, moves focus to that element
// when a 'focusOn' event is broadcast.
oppia.directive('focusOn', [
    'LABEL_FOR_CLEARING_FOCUS', function (LABEL_FOR_CLEARING_FOCUS) {
        return function (scope, elt, attrs) {
            scope.$on('focusOn', function (e, name) {
                if (name === attrs.focusOn) {
                    elt[0].focus();
                }
                // If the purpose of the focus switch was to clear focus, blur the
                // element.
                if (name === LABEL_FOR_CLEARING_FOCUS) {
                    elt[0].blur();
                }
            });
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/domain/sidebar/SidebarStatusService.ts":
/*!************************************************************************!*\
  !*** ./core/templates/dev/head/domain/sidebar/SidebarStatusService.ts ***!
  \************************************************************************/
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
/**
 * @fileoverview Service for maintaining the open/closed status of the
 * hamburger-menu sidebar.
 */
__webpack_require__(/*! services/contextual/WindowDimensionsService.ts */ "./core/templates/dev/head/services/contextual/WindowDimensionsService.ts");
oppia.factory('SidebarStatusService', [
    'WindowDimensionsService', function (WindowDimensionsService) {
        var pendingSidebarClick = false;
        var sidebarIsShown = false;
        var _openSidebar = function () {
            if (WindowDimensionsService.isWindowNarrow() && !sidebarIsShown) {
                sidebarIsShown = true;
                pendingSidebarClick = true;
            }
        };
        var _closeSidebar = function () {
            if (sidebarIsShown) {
                sidebarIsShown = false;
                pendingSidebarClick = false;
            }
        };
        return {
            isSidebarShown: function () {
                return sidebarIsShown;
            },
            openSidebar: function () {
                _openSidebar();
            },
            closeSidebar: function () {
                _closeSidebar();
            },
            toggleSidebar: function () {
                if (!sidebarIsShown) {
                    _openSidebar();
                }
                else {
                    _closeSidebar();
                }
            },
            onDocumentClick: function () {
                if (!pendingSidebarClick) {
                    sidebarIsShown = false;
                }
                else {
                    pendingSidebarClick = false;
                }
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/domain/user/UserInfoObjectFactory.ts":
/*!**********************************************************************!*\
  !*** ./core/templates/dev/head/domain/user/UserInfoObjectFactory.ts ***!
  \**********************************************************************/
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
 * @fileoverview Factory for creating and instances of frontend user UserInfo
 * domain objects.
 */
oppia.factory('UserInfoObjectFactory', [function () {
        var UserInfo = function (isModerator, isAdmin, isSuperAdmin, isTopicManager, canCreateCollections, preferredSiteLanguageCode, username, isLoggedIn) {
            this._isModerator = isModerator;
            this._isAdmin = isAdmin;
            this._isTopicManager = isTopicManager;
            this._isSuperAdmin = isSuperAdmin;
            this._canCreateCollections = canCreateCollections;
            this._preferredSiteLanguageCode = preferredSiteLanguageCode;
            this._username = username;
            this._isLoggedIn = isLoggedIn;
        };
        // Instance methods
        UserInfo.prototype.isModerator = function () {
            return this._isModerator;
        };
        UserInfo.prototype.isAdmin = function () {
            return this._isAdmin;
        };
        UserInfo.prototype.isTopicManager = function () {
            return this._isTopicManager;
        };
        UserInfo.prototype.isSuperAdmin = function () {
            return this._isSuperAdmin;
        };
        UserInfo.prototype.canCreateCollections = function () {
            return this._canCreateCollections;
        };
        UserInfo.prototype.getPreferredSiteLanguageCode = function () {
            return this._preferredSiteLanguageCode;
        };
        UserInfo.prototype.getUsername = function () {
            return this._username;
        };
        UserInfo.prototype.isLoggedIn = function () {
            return this._isLoggedIn;
        };
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        UserInfo['createFromBackendDict'] = function (data) {
            /* eslint-enable dot-notation */
            return new UserInfo(data.is_moderator, data.is_admin, data.is_super_admin, data.is_topic_manager, data.can_create_collections, data.preferred_site_language_code, data.username, data.user_is_logged_in);
        };
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        UserInfo['createDefault'] = function () {
            /* eslint-enable dot-notation */
            return new UserInfo(false, false, false, false, false, null, null, false);
        };
        return UserInfo;
    }]);


/***/ }),

/***/ "./core/templates/dev/head/filters/filters.module.ts":
/*!***********************************************************!*\
  !*** ./core/templates/dev/head/filters/filters.module.ts ***!
  \***********************************************************/
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
 * @fileoverview Module for custom filters.
 */
angular.module('filtersModule', ['stringUtilityFiltersModule']);


/***/ }),

/***/ "./core/templates/dev/head/filters/string-utility-filters/string-utility-filters.module.ts":
/*!*************************************************************************************************!*\
  !*** ./core/templates/dev/head/filters/string-utility-filters/string-utility-filters.module.ts ***!
  \*************************************************************************************************/
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
 * @fileoverview Module for string utility filters.
 */
angular.module('stringUtilityFiltersModule', []);
angular.module('stringUtilityFiltersModule').constant('RULE_SUMMARY_WRAP_CHARACTER_COUNT', 30);
angular.module('stringUtilityFiltersModule').constant('FEEDBACK_SUBJECT_MAX_CHAR_LIMIT', constants.FEEDBACK_SUBJECT_MAX_CHAR_LIMIT);


/***/ }),

/***/ "./core/templates/dev/head/pages/Base.ts":
/*!***********************************************!*\
  !*** ./core/templates/dev/head/pages/Base.ts ***!
  \***********************************************/
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
 * @fileoverview Oppia's base controller.
 */
oppia.controller('Base', [
    '$document', '$rootScope', '$scope', 'AlertsService', 'BackgroundMaskService',
    'SidebarStatusService', 'UrlService', 'DEV_MODE', 'SITE_FEEDBACK_FORM_URL',
    'SITE_NAME',
    function ($document, $rootScope, $scope, AlertsService, BackgroundMaskService, SidebarStatusService, UrlService, DEV_MODE, SITE_FEEDBACK_FORM_URL, SITE_NAME) {
        $scope.siteName = SITE_NAME;
        $scope.AlertsService = AlertsService;
        $scope.currentLang = 'en';
        $scope.iframed = UrlService.isIframed();
        $scope.siteFeedbackFormUrl = SITE_FEEDBACK_FORM_URL;
        $rootScope.DEV_MODE = DEV_MODE;
        // If this is nonempty, the whole page goes into 'Loading...' mode.
        $rootScope.loadingMessage = '';
        $scope.isSidebarShown = SidebarStatusService.isSidebarShown;
        $scope.closeSidebarOnSwipe = SidebarStatusService.closeSidebar;
        $scope.isBackgroundMaskActive = BackgroundMaskService.isMaskActive;
        // Listener function to catch the change in language preference.
        $rootScope.$on('$translateChangeSuccess', function (evt, response) {
            $scope.currentLang = response.language;
        });
        // TODO(sll): use 'touchstart' for mobile.
        $document.on('click', function () {
            SidebarStatusService.onDocumentClick();
            $scope.$apply();
        });
        $scope.skipToMainContent = function () {
            var mainContentElement = document.getElementById('oppia-main-content');
            if (!mainContentElement) {
                throw Error('Variable mainContentElement is undefined.');
            }
            mainContentElement.tabIndex = -1;
            mainContentElement.scrollIntoView();
            mainContentElement.focus();
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/about-page/about-page.module.ts":
/*!***********************************************************************!*\
  !*** ./core/templates/dev/head/pages/about-page/about-page.module.ts ***!
  \***********************************************************************/
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
 * @fileoverview Module for the about page.
 */
angular.module('aboutPageModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/admin-page/activities-tab/admin-dev-mode-activities-tab/admin-dev-mode-activities-tab.module.ts":
/*!***************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/admin-page/activities-tab/admin-dev-mode-activities-tab/admin-dev-mode-activities-tab.module.ts ***!
  \***************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for the activities tab in the admin panel when Oppia
 * is in developer mode.
 */
angular.module('adminDevModeActivitiesTabModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/admin-page/activities-tab/admin-prod-mode-activities-tab/admin-prod-mode-activities-tab.module.ts":
/*!*****************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/admin-page/activities-tab/admin-prod-mode-activities-tab/admin-prod-mode-activities-tab.module.ts ***!
  \*****************************************************************************************************************************************/
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
 * @fileoverview Module for the activities tab in the admin panel when Oppia
 * is in production mode.
 */
angular.module('adminProdModeActivitiesTab', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/admin-page/admin-navbar/admin-navbar.module.ts":
/*!**************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/admin-page/admin-navbar/admin-navbar.module.ts ***!
  \**************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for the navigation bar in the admin panel.
 */
angular.module('adminNavbarModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/admin-page/admin-page.module.ts":
/*!***********************************************************************!*\
  !*** ./core/templates/dev/head/pages/admin-page/admin-page.module.ts ***!
  \***********************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Data and Module for the Oppia admin page.
 */
angular.module('adminPageModule', [
    'adminNavbarModule', 'adminConfigTabModule', 'adminJobsTabModule',
    'adminMiscTabModule', 'adminRolesTabModule', 'roleGraphModule',
    'adminDevModeActivitiesTabModule', 'adminProdModeActivitiesTab'
]);
angular.module('adminPageModule').constant('ADMIN_HANDLER_URL', '/adminhandler');
angular.module('adminPageModule')
    .constant('ADMIN_ROLE_HANDLER_URL', '/adminrolehandler');
angular.module('adminPageModule')
    .constant('PROFILE_URL_TEMPLATE', '/profile/<username>');
angular.module('adminPageModule').constant('ADMIN_JOB_OUTPUT_URL_TEMPLATE', '/adminjoboutput?job_id=<jobId>');
angular.module('adminPageModule').constant('ADMIN_TOPICS_CSV_DOWNLOAD_HANDLER_URL', '/admintopicscsvdownloadhandler');
angular.module('adminPageModule').constant('ADMIN_TAB_URLS', {
    ACTIVITIES: '#activities',
    JOBS: '#jobs',
    CONFIG: '#config',
    ROLES: '#roles',
    MISC: '#misc'
});


/***/ }),

/***/ "./core/templates/dev/head/pages/admin-page/config-tab/admin-config-tab.module.ts":
/*!****************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/admin-page/config-tab/admin-config-tab.module.ts ***!
  \****************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for the configuration tab in the admin panel.
 */
angular.module('adminConfigTabModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/admin-page/jobs-tab/admin-jobs-tab.module.ts":
/*!************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/admin-page/jobs-tab/admin-jobs-tab.module.ts ***!
  \************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for the jobs tab in the admin panel.
 */
angular.module('adminJobsTabModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/admin-page/misc-tab/admin-misc-tab.module.ts":
/*!************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/admin-page/misc-tab/admin-misc-tab.module.ts ***!
  \************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for the miscellaneous tab in the admin panel.
 */
angular.module('adminMiscTabModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/admin-page/roles-tab/admin-roles-tab.module.ts":
/*!**************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/admin-page/roles-tab/admin-roles-tab.module.ts ***!
  \**************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for the Roles tab in the admin panel.
 */
angular.module('adminRolesTabModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/admin-page/roles-tab/roles-graph/role-graph.module.ts":
/*!*********************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/admin-page/roles-tab/roles-graph/role-graph.module.ts ***!
  \*********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for displaying Role graph.
 */
angular.module('roleGraphModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/collection-player-page/collection-footer/collection-footer.module.ts":
/*!************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/collection-player-page/collection-footer/collection-footer.module.ts ***!
  \************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for showing author/share footer
 * in collection player.
 */
angular.module('collectionFooterModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/collection-player-page/collection-local-nav/collection-local-nav.module.ts":
/*!******************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/collection-player-page/collection-local-nav/collection-local-nav.module.ts ***!
  \******************************************************************************************************************/
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
 * @fileoverview Controller for the local navigation in the collection view.
 */
angular.module('collectionLocalNavModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/collection-player-page/collection-node-list/collection-node-list.module.ts":
/*!******************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/collection-player-page/collection-node-list/collection-node-list.module.ts ***!
  \******************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for creating a list of collection nodes which link to
 * playing the exploration in each node.
 */
angular.module('collectionNodeListModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/collection-player-page/collection-player-page.module.ts":
/*!***********************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/collection-player-page/collection-player-page.module.ts ***!
  \***********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for the learner's view of a collection.
 */
angular.module('collectionPlayerPageModule', [
    'collectionFooterModule', 'collectionNodeListModule',
    'collectionLocalNavModule'
]);
angular.module('collectionPlayerPageModule').constant('COLLECTION_DATA_URL_TEMPLATE', '/collection_handler/data/<collection_id>');
angular.module('collectionPlayerPageModule').animation('.oppia-collection-animate-slide', function () {
    return {
        enter: function (element) {
            element.hide().slideDown();
        },
        leave: function (element) {
            element.slideUp();
        }
    };
});


/***/ }),

/***/ "./core/templates/dev/head/pages/creator-dashboard-page/creator-dashboard-page.module.ts":
/*!***********************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/creator-dashboard-page/creator-dashboard-page.module.ts ***!
  \***********************************************************************************************/
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
 * @fileoverview Controllers for the creator dashboard.
 */
angular.module('creatorDashboardPageModule', []);
angular.module('creatorDashboardPageModule').constant('EXPLORATION_DROPDOWN_STATS', {
    OPEN_FEEDBACK: 'open_feedback'
});
angular.module('creatorDashboardPageModule').constant('EXPLORATIONS_SORT_BY_KEYS', {
    TITLE: 'title',
    RATING: 'ratings',
    NUM_VIEWS: 'num_views',
    OPEN_FEEDBACK: 'num_open_threads',
    LAST_UPDATED: 'last_updated_msec'
});
angular.module('creatorDashboardPageModule').constant('HUMAN_READABLE_EXPLORATIONS_SORT_BY_KEYS', {
    TITLE: 'I18N_DASHBOARD_EXPLORATIONS_SORT_BY_TITLE ',
    RATING: 'I18N_DASHBOARD_EXPLORATIONS_SORT_BY_AVERAGE_RATING',
    NUM_VIEWS: 'I18N_DASHBOARD_EXPLORATIONS_SORT_BY_TOTAL_PLAYS',
    OPEN_FEEDBACK: 'I18N_DASHBOARD_EXPLORATIONS_SORT_BY_OPEN_FEEDBACK',
    LAST_UPDATED: 'I18N_DASHBOARD_EXPLORATIONS_SORT_BY_LAST_UPDATED'
});
angular.module('creatorDashboardPageModule').constant('SUBSCRIPTION_SORT_BY_KEYS', {
    USERNAME: 'subscriber_username',
    IMPACT: 'subscriber_impact'
});
angular.module('creatorDashboardPageModule').constant('HUMAN_READABLE_SUBSCRIPTION_SORT_BY_KEYS', {
    USERNAME: 'Username',
    IMPACT: 'Impact'
});


/***/ }),

/***/ "./core/templates/dev/head/pages/donate-page/donate-page.module.ts":
/*!*************************************************************************!*\
  !*** ./core/templates/dev/head/pages/donate-page/donate-page.module.ts ***!
  \*************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for the donate page.
 */
angular.module('donatePageModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/email-dashboard-page/email-dashboard-page.module.ts":
/*!*******************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/email-dashboard-page/email-dashboard-page.module.ts ***!
  \*******************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for oppia email dashboard page.
 */
angular.module('emailDashboardPageModule', ['emailDashboardResultModule']);


/***/ }),

/***/ "./core/templates/dev/head/pages/email-dashboard-page/email-dashboard-result/email-dashboard-result.module.ts":
/*!********************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/email-dashboard-page/email-dashboard-result/email-dashboard-result.module.ts ***!
  \********************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for oppia email dashboard page.
 */
angular.module('emailDashboardResultModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/error-page/error-page.module.ts":
/*!***********************************************************************!*\
  !*** ./core/templates/dev/head/pages/error-page/error-page.module.ts ***!
  \***********************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for the error page.
 */
angular.module('errorPageModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/editor-navbar-breadcrumb/editor-navbar-breadcrumb.module.ts":
/*!***************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/editor-navbar-breadcrumb/editor-navbar-breadcrumb.module.ts ***!
  \***************************************************************************************************************************/
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
 * @fileoverview Module for showing Editor Navbar breadcrumb
 * in editor navbar.
 */
angular.module('editorNavbarBreadcrumbModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/editor-navigation/editor-navigation.module.ts":
/*!*************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/editor-navigation/editor-navigation.module.ts ***!
  \*************************************************************************************************************/
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
 * @fileoverview Directive for showing Editor Navigation
 * in editor.
 */
angular.module('editorNavigationModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-page-services/angular-name/angular-name.service.ts":
/*!*************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-page-services/angular-name/angular-name.service.ts ***!
  \*************************************************************************************************************************************/
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
 * @fileoverview A service that maps IDs to Angular names.
 */
angular.module('explorationEditorPageModule').factory('AngularNameService', [function () {
        var angularName = null;
        return {
            getNameOfInteractionRulesService: function (interactionId) {
                angularName = interactionId.charAt(0) +
                    interactionId.slice(1) + 'RulesService';
                return angularName;
            }
        };
    }]);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-page.module.ts":
/*!*************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-page.module.ts ***!
  \*************************************************************************************************/
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
 * @fileoverview Module for the exploration editor page and the editor
 *               help tab in the navbar.
 */
angular.module('explorationEditorPageModule', ['editorNavbarBreadcrumbModule',
    'editorNavigationModule', 'explorationEditorTabModule',
    'explorationSaveAndPulishButtonsModule', 'explorationObjectiveEditorModule',
    'explorationTitleEditorModule',
    'feedbackTabModule', 'historyTabModule', 'improvementsTabModule',
    'markAllAudioAndTranslationsAsNeedingUpdateModule',
    'paramsChangesEditorModule',
    'previewTabModule', 'settingsTabModule', 'statisticsTabModule',
    'translationTabModule', 'valueGeneratorEditorModule'
]);
angular.module('explorationEditorPageModule').constant('INTERACTION_SPECS', GLOBALS.INTERACTION_SPECS);
angular.module('explorationEditorPageModule').constant('EXPLORATION_TITLE_INPUT_FOCUS_LABEL', 'explorationTitleInputFocusLabel');
angular.module('explorationEditorPageModule').constant('EXPLORATION_DATA_URL_TEMPLATE', '/explorehandler/init/<exploration_id>');
angular.module('explorationEditorPageModule').constant('EXPLORATION_VERSION_DATA_URL_TEMPLATE', '/explorehandler/init/<exploration_id>?v=<version>');
angular.module('explorationEditorPageModule').constant('EDITABLE_EXPLORATION_DATA_URL_TEMPLATE', '/createhandler/data/<exploration_id>');
angular.module('explorationEditorPageModule').constant('TRANSLATE_EXPLORATION_DATA_URL_TEMPLATE', '/createhandler/translate/<exploration_id>');
angular.module('explorationEditorPageModule').constant('EDITABLE_EXPLORATION_DATA_DRAFT_URL_TEMPLATE', '/createhandler/data/<exploration_id>?apply_draft=<apply_draft>');
angular.module('explorationEditorPageModule').constant('PARAM_ACTION_GET', 'get');
angular.module('explorationEditorPageModule').constant('PARAM_ACTION_SET', 'set');
angular.module('explorationEditorPageModule').constant('VOICEOVER_MODE', 'voiceoverMode');
angular.module('explorationEditorPageModule').constant('TRANSLATION_MODE', 'translationMode');
// When an unresolved answer's frequency exceeds this threshold, an exploration
// will be blocked from being published until the answer is resolved.
angular.module('explorationEditorPageModule').constant('UNRESOLVED_ANSWER_FREQUENCY_THRESHOLD', 5);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-tab/exploration-editor-tab.module.ts":
/*!***********************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-tab/exploration-editor-tab.module.ts ***!
  \***********************************************************************************************************************/
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
 * @fileoverview Module for the Editor tab in the exploration editor page.
 */
angular.module('explorationEditorTabModule', ['explorationGraphModule',
    'stateGraphVisualizationModule', 'stateNameEditorModule',
    'stateParamChangesEditorModule', 'testInteractionPanelModule',
    'trainingPanelModule', 'unresolvedAnswersOverviewModule'
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-tab/exploration-graph/exploration-graph.module.ts":
/*!************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-tab/exploration-graph/exploration-graph.module.ts ***!
  \************************************************************************************************************************************/
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
 * @fileoverview Module for the exploration graph.
 */
angular.module('explorationGraphModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-tab/state-graph-visualization/state-graph-visualization.module.ts":
/*!****************************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-tab/state-graph-visualization/state-graph-visualization.module.ts ***!
  \****************************************************************************************************************************************************/
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
 * @fileoverview Module for the state graph visualization.
 */
angular.module('stateGraphVisualizationModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-tab/state-name-editor/state-name-editor.module.ts":
/*!************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-tab/state-name-editor/state-name-editor.module.ts ***!
  \************************************************************************************************************************************/
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
 * @fileoverview Module for the state name editor section of the state
 * editor.
 */
angular.module('stateNameEditorModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-tab/state-param-changes-editor/state-param-changes-editor.module.ts":
/*!******************************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-tab/state-param-changes-editor/state-param-changes-editor.module.ts ***!
  \******************************************************************************************************************************************************/
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
 * @fileoverview Module for the param changes editor section of the
 * state editor.
 */
angular.module('stateParamChangesEditorModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-tab/test-interaction-panel/test-interaction-panel.module.ts":
/*!**********************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-tab/test-interaction-panel/test-interaction-panel.module.ts ***!
  \**********************************************************************************************************************************************/
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
 * @fileoverview Directive for the test interaction panel in the state editor.
 */
angular.module('testInteractionPanelModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-tab/training-panel/training-panel.module.ts":
/*!******************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-tab/training-panel/training-panel.module.ts ***!
  \******************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for the training panel in the state editor.
 */
angular.module('trainingPanelModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-tab/unresolved-answers-overview/unresolved-answers-overview.module.ts":
/*!********************************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-tab/unresolved-answers-overview/unresolved-answers-overview.module.ts ***!
  \********************************************************************************************************************************************************/
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
 * @fileoverview Module for the state graph visualization.
 */
angular.module('unresolvedAnswersOverviewModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/exploration-objective-editor/exploration-objective-editor.module.ts":
/*!***********************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/exploration-objective-editor/exploration-objective-editor.module.ts ***!
  \***********************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for the exploration objective/goal field in forms.
 */
angular.module('explorationObjectiveEditorModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/exploration-save-and-publish-buttons/exploration-save-and-publish-buttons.module.ts":
/*!***************************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/exploration-save-and-publish-buttons/exploration-save-and-publish-buttons.module.ts ***!
  \***************************************************************************************************************************************************/
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
 * @fileoverview Module for the exploration save & publish buttons.
 */
angular.module('explorationSaveAndPulishButtonsModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/exploration-title-editor/exploration-title-editor.module.ts":
/*!***************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/exploration-title-editor/exploration-title-editor.module.ts ***!
  \***************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for the exploration title field in forms.
 */
angular.module('explorationTitleEditorModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/feedback-tab/feedback-tab.module.ts":
/*!***************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/feedback-tab/feedback-tab.module.ts ***!
  \***************************************************************************************************/
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
 * @fileoverview Controller for the exploration editor feedback tab.
 */
angular.module('feedbackTabModule', ['threadTableModule']);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/feedback-tab/thread-table/thread-table.module.ts":
/*!****************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/feedback-tab/thread-table/thread-table.module.ts ***!
  \****************************************************************************************************************/
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
 * @fileoverview Module for displaying the list of threads in the feedback
 * tab of the exploration editor.
 */
angular.module('threadTableModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/history-tab/history-tab.module.ts":
/*!*************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/history-tab/history-tab.module.ts ***!
  \*************************************************************************************************/
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
 * @fileoverview Module for the exploration history tab.
 */
angular.module('historyTabModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/improvements-tab/improvements-tab.module.ts":
/*!***********************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/improvements-tab/improvements-tab.module.ts ***!
  \***********************************************************************************************************/
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
 * @fileoverview Module for the exploration improvements tab in the
 * exploration editor.
 */
angular.module('improvementsTabModule', ['playthroughImprovementCardModule']);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/improvements-tab/playthrough-improvement-card/playthrough-improvement-card.module.ts":
/*!****************************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/improvements-tab/playthrough-improvement-card/playthrough-improvement-card.module.ts ***!
  \****************************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
angular.module('playthroughImprovementCardModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/mark-all-audio-and-translations-as-needing-update/mark-all-audio-and-translations-as-needing-update.module.ts":
/*!*****************************************************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/mark-all-audio-and-translations-as-needing-update/mark-all-audio-and-translations-as-needing-update.module.ts ***!
  \*****************************************************************************************************************************************************************************/
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
 * @fileoverview Module for the
 * mark_all_audio_and_translations_as_needing_update modal.
 */
angular.module('markAllAudioAndTranslationsAsNeedingUpdateModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/param-changes-editor/param-changes-editor.module.ts":
/*!*******************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/param-changes-editor/param-changes-editor.module.ts ***!
  \*******************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

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
/**
 * @fileoverview Directive for the parameter changes editor (which is shown in
 * both the exploration settings tab and the state editor page).
 */
angular.module('paramsChangesEditorModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/preview-tab/preview-tab.module.ts":
/*!*************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/preview-tab/preview-tab.module.ts ***!
  \*************************************************************************************************/
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
 * @fileoverview Module for the exploration preview in the
 * editor page.
 */
angular.module('previewTabModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/settings-tab/settings-tab.module.ts":
/*!***************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/settings-tab/settings-tab.module.ts ***!
  \***************************************************************************************************/
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
 * @fileoverview Module for the exploration settings tab.
 */
angular.module('settingsTabModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/statistics-tab/bar-chart/bar-chart.module.ts":
/*!************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/statistics-tab/bar-chart/bar-chart.module.ts ***!
  \************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2014 The  Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for bar chart visualization.
 */
angular.module('barChartModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/statistics-tab/cyclic-transitions-issue/cyclic-transitions-issue.module.ts":
/*!******************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/statistics-tab/cyclic-transitions-issue/cyclic-transitions-issue.module.ts ***!
  \******************************************************************************************************************************************/
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
 * @fileoverview Module for visualizing multiple incorrect issue.
 */
angular.module('cyclicTransitionIssueModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/statistics-tab/early-quit-issue/early-quit-issue.module.ts":
/*!**************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/statistics-tab/early-quit-issue/early-quit-issue.module.ts ***!
  \**************************************************************************************************************************/
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
 * @fileoverview Module for visualizing early quit issue.
 */
angular.module('earlyQuitIssueModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/statistics-tab/multiple-incorrect-issue/multiple-incorrect-issue.module.ts":
/*!******************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/statistics-tab/multiple-incorrect-issue/multiple-incorrect-issue.module.ts ***!
  \******************************************************************************************************************************************/
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
 * @fileoverview Module for visualizing multiple incorrect issue.
 */
angular.module('multipleIncorrectIssueModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/statistics-tab/pie-chart/pie-chart.module.ts":
/*!************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/statistics-tab/pie-chart/pie-chart.module.ts ***!
  \************************************************************************************************************/
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
 * @fileoverview Module for pie chart visualization.
 */
angular.module('pieChartModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/statistics-tab/playthrough-issues/playthrough-issues.module.ts":
/*!******************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/statistics-tab/playthrough-issues/playthrough-issues.module.ts ***!
  \******************************************************************************************************************************/
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
 * @fileoverview Module for visualizing issues.
 */
angular.module('playthroughIssuesModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/statistics-tab/statistics-tab.module.ts":
/*!*******************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/statistics-tab/statistics-tab.module.ts ***!
  \*******************************************************************************************************/
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
 * @fileoverview Module for the exploration statistics tab in the
 * exploration editor.
 */
angular.module('statisticsTabModule', ['barChartModule',
    'cyclicTransitionIssueModule', 'earlyQuitIssueModule',
    'multipleIncorrectIssueModule', 'pieChartModule', 'playthroughIssuesModule'
]);
angular.module('statisticsTabModule').constant('IMPROVE_TYPE_INCOMPLETE', 'incomplete');


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/translation-tab/audio-translation-bar/audio-translation-bar.module.ts":
/*!*************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/translation-tab/audio-translation-bar/audio-translation-bar.module.ts ***!
  \*************************************************************************************************************************************/
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
 * @fileoverview Module for the audio translation bar.
 */
angular.module('audioTranslationBarModule', []);
// Constant for audio recording time limit.
angular.module('audioTranslationBarModule').constant('RECORDING_TIME_LIMIT', 300);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/translation-tab/state-translation-editor/state-translation-editor.module.ts":
/*!*******************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/translation-tab/state-translation-editor/state-translation-editor.module.ts ***!
  \*******************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the state translation editor.
 */
angular.module('stateTranslationEditorModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/translation-tab/state-translation-status-graph/state-translation-status-graph.module.ts":
/*!*******************************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/translation-tab/state-translation-status-graph/state-translation-status-graph.module.ts ***!
  \*******************************************************************************************************************************************************/
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
 * @fileoverview Directive for the state translation status graph.
 */
angular.module('stateTranslationStatusGraphModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/translation-tab/state-translation/state-translation.module.ts":
/*!*****************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/translation-tab/state-translation/state-translation.module.ts ***!
  \*****************************************************************************************************************************/
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
 * @fileoverview Module containing the exploration material to be translated.
 */
angular.module('stateTranslationModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/translation-tab/translation-tab.module.ts":
/*!*********************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/translation-tab/translation-tab.module.ts ***!
  \*********************************************************************************************************/
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
 * @fileoverview Module for the translation tab.
 */
angular.module('translationTabModule', ['audioTranslationBarModule',
    'stateTranslationModule', 'stateTranslationEditorModule',
    'stateTranslationStatusGraphModule', 'translatorOverviewModule'
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/translation-tab/translator-overview/translator-overview.module.ts":
/*!*********************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/translation-tab/translator-overview/translator-overview.module.ts ***!
  \*********************************************************************************************************************************/
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
 * @fileoverview Module for the translation overview and changing
 * translation language.
 */
angular.module('translatorOverviewModule', []);
angular.module('translatorOverviewModule').constant('DEFAULT_AUDIO_LANGUAGE', 'en');


/***/ }),

/***/ "./core/templates/dev/head/pages/exploration-editor-page/value-generator-editor/value-generator-editor.module.ts":
/*!***********************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/exploration-editor-page/value-generator-editor/value-generator-editor.module.ts ***!
  \***********************************************************************************************************************/
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
 * @fileoverview Module for the parameter generator editors.
 */
angular.module('valueGeneratorEditorModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/learner-dashboard-page/learner-dashboard-page.module.ts":
/*!***********************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/learner-dashboard-page/learner-dashboard-page.module.ts ***!
  \***********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for the Learner dashboard.
 */
angular.module('learnerDashboardPageModule', []);
angular.module('learnerDashboardPageModule').constant('LEARNER_DASHBOARD_SECTION_I18N_IDS', {
    INCOMPLETE: 'I18N_LEARNER_DASHBOARD_INCOMPLETE_SECTION',
    COMPLETED: 'I18N_LEARNER_DASHBOARD_COMPLETED_SECTION',
    SUBSCRIPTIONS: 'I18N_LEARNER_DASHBOARD_SUBSCRIPTIONS_SECTION',
    FEEDBACK: 'I18N_LEARNER_DASHBOARD_FEEDBACK_SECTION',
    PLAYLIST: 'I18N_LEARNER_DASHBOARD_PLAYLIST_SECTION'
});
angular.module('learnerDashboardPageModule').constant('LEARNER_DASHBOARD_SUBSECTION_I18N_IDS', {
    EXPLORATIONS: 'I18N_DASHBOARD_EXPLORATIONS',
    COLLECTIONS: 'I18N_DASHBOARD_COLLECTIONS'
});
angular.module('learnerDashboardPageModule').constant('EXPLORATIONS_SORT_BY_KEYS_AND_I18N_IDS', {
    LAST_PLAYED: {
        key: 'last_played',
        i18nId: 'I18N_LEARNER_DASHBOARD_EXPLORATIONS_SORT_BY_LAST_PLAYED'
    },
    TITLE: {
        key: 'title',
        i18nId: 'I18N_DASHBOARD_EXPLORATIONS_SORT_BY_TITLE'
    },
    CATEGORY: {
        key: 'category',
        i18nId: 'I18N_DASHBOARD_EXPLORATIONS_SORT_BY_CATEGORY'
    }
});
angular.module('learnerDashboardPageModule').constant('SUBSCRIPTION_SORT_BY_KEYS_AND_I18N_IDS', {
    USERNAME: {
        key: 'subscriber_username',
        i18nId: 'I18N_PREFERENCES_USERNAME'
    },
    IMPACT: {
        key: 'subscriber_impact',
        i18nId: 'I18N_CREATOR_IMPACT'
    }
});
angular.module('learnerDashboardPageModule').constant('FEEDBACK_THREADS_SORT_BY_KEYS_AND_I18N_IDS', {
    LAST_UPDATED: {
        key: 'last_updated',
        i18nId: 'I18N_DASHBOARD_EXPLORATIONS_SORT_BY_LAST_UPDATED'
    },
    EXPLORATION: {
        key: 'exploration',
        i18nId: 'I18N_DASHBOARD_TABLE_HEADING_EXPLORATION'
    }
});


/***/ }),

/***/ "./core/templates/dev/head/pages/library-page/activity-tiles-infinity-grid/activity-tiles-infinity-grid.module.ts":
/*!************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/library-page/activity-tiles-infinity-grid/activity-tiles-infinity-grid.module.ts ***!
  \************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for an infinitely-scrollable view of activity tiles.
 */
angular.module('activityTilesInfinityGridModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/library-page/library-footer/library-footer.module.ts":
/*!********************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/library-page/library-footer/library-footer.module.ts ***!
  \********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for the Oppia library footer.
 */
angular.module('libraryFooterModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/library-page/library-page.module.ts":
/*!***************************************************************************!*\
  !*** ./core/templates/dev/head/pages/library-page/library-page.module.ts ***!
  \***************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for the Oppia contributors' library page.
 */
angular.module('libraryPageModule', ['activityTilesInfinityGridModule',
    'libraryFooterModule', 'searchBarModule', 'searchResultsModule']);
angular.module('libraryPageModule').constant('LIBRARY_PAGE_MODES', {
    GROUP: 'group',
    INDEX: 'index',
    SEARCH: 'search'
});
angular.module('libraryPageModule').constant('LIBRARY_PATHS_TO_MODES', {
    '/library': 'index',
    '/library/top_rated': 'group',
    '/library/recently_published': 'group',
    '/search/find': 'search'
});


/***/ }),

/***/ "./core/templates/dev/head/pages/library-page/search-bar/search-bar.module.ts":
/*!************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/library-page/search-bar/search-bar.module.ts ***!
  \************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for the Search Bar.
 */
angular.module('searchBarModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/library-page/search-results/search-results.module.ts":
/*!********************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/library-page/search-results/search-results.module.ts ***!
  \********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for showing search results.
 */
angular.module('searchResultsModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/maintenance-page/maintenance-page.module.ts":
/*!***********************************************************************************!*\
  !*** ./core/templates/dev/head/pages/maintenance-page/maintenance-page.module.ts ***!
  \***********************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview The module for the maintenance page.
 */
angular.module('maintenancePageModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/moderator-page/moderator-page.module.ts":
/*!*******************************************************************************!*\
  !*** ./core/templates/dev/head/pages/moderator-page/moderator-page.module.ts ***!
  \*******************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
* @fileoverview Module for the Oppia moderator page.
*/
angular.module('moderatorPageModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/notifications-dashboard-page/notifications-dashboard-page.module.ts":
/*!***********************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/notifications-dashboard-page/notifications-dashboard-page.module.ts ***!
  \***********************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for the user's notifications dashboard.
 */
angular.module('notificationsDashboardPageModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/practice-session-page/practice-session-page.module.ts":
/*!*********************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/practice-session-page/practice-session-page.module.ts ***!
  \*********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for the practice session.
 */
angular.module('practiceSessionPageModule', []);
angular.module('practiceSessionPageModule').constant('TOTAL_QUESTIONS', 20);
angular.module('practiceSessionPageModule').constant('PRACTICE_SESSIONS_DATA_URL', '/practice_session/data/<topic_name>');


/***/ }),

/***/ "./core/templates/dev/head/pages/preferences-page/preferences-page.module.ts":
/*!***********************************************************************************!*\
  !*** ./core/templates/dev/head/pages/preferences-page/preferences-page.module.ts ***!
  \***********************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for the Oppia 'edit preferences' page.
 */
angular.module('preferencesPageModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/profile-page/profile-page.module.ts":
/*!***************************************************************************!*\
  !*** ./core/templates/dev/head/pages/profile-page/profile-page.module.ts ***!
  \***************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for the Oppia profile page.
 */
angular.module('profilePageModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/question-editor-page/question-editor-page.module.ts":
/*!*******************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/question-editor-page/question-editor-page.module.ts ***!
  \*******************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for the questions editor directive.
 */
angular.module('questionEditorPageModule', []);
angular.module('questionEditorPageModule').constant('INTERACTION_SPECS', GLOBALS.INTERACTION_SPECS);


/***/ }),

/***/ "./core/templates/dev/head/pages/question-player-page/question-player-page.module.ts":
/*!*******************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/question-player-page/question-player-page.module.ts ***!
  \*******************************************************************************************/
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
 * @fileoverview Module for the questions player directive.
 */
angular.module('questionPlayerPageModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/questions-list-page/questions-list-page.module.ts":
/*!*****************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/questions-list-page/questions-list-page.module.ts ***!
  \*****************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for the questions list.
 */
angular.module('questionsListPageModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/show-suggestion-editor-pages/show-suggestion-modal-for-creator-view/show-suggestion-modal-for-creator-view.module.ts":
/*!************************************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/show-suggestion-editor-pages/show-suggestion-modal-for-creator-view/show-suggestion-modal-for-creator-view.module.ts ***!
  \************************************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module to show suggestion modal in creator view.
 */
angular.module('showSuggestionModalForCreatorViewModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/show-suggestion-editor-pages/show-suggestion-modal-for-editor-view/show-suggestion-modal-for-editor-view.module.ts":
/*!**********************************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/show-suggestion-editor-pages/show-suggestion-modal-for-editor-view/show-suggestion-modal-for-editor-view.module.ts ***!
  \**********************************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module to show suggestion modal in editor view.
 */
angular.module('showSuggestionModalForEditorViewModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/show-suggestion-editor-pages/show-suggestion-modal-for-learner-local-view/show-suggestion-modal-for-learner-local-view.module.ts":
/*!************************************************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/show-suggestion-editor-pages/show-suggestion-modal-for-learner-local-view/show-suggestion-modal-for-learner-local-view.module.ts ***!
  \************************************************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module to show suggestion modal in learner local view.
 */
angular.module('showSuggestionModalForLocalViewModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/show-suggestion-editor-pages/show-suggestion-modal-for-learner-view/show-suggestion-modal-for-learner-view.module.ts":
/*!************************************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/show-suggestion-editor-pages/show-suggestion-modal-for-learner-view/show-suggestion-modal-for-learner-view.module.ts ***!
  \************************************************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module to show suggestion modal in learner view.
 */
angular.module('showSuggestionModalForLearnerViewModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/show-suggestion-editor-pages/suggestion-modal.module.ts":
/*!***********************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/show-suggestion-editor-pages/suggestion-modal.module.ts ***!
  \***********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for suggestion modal services.
 */
angular.module('suggestionModalModule', [
    'showSuggestionModalForCreatorViewModule',
    'showSuggestionModalForEditorViewModule',
    'showSuggestionModalForLocalViewModule',
    'showSuggestionModalForLearnerViewModule'
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/signup-page/signup-page.module.ts":
/*!*************************************************************************!*\
  !*** ./core/templates/dev/head/pages/signup-page/signup-page.module.ts ***!
  \*************************************************************************/
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
 * @fileoverview Module for the Oppia profile page.
 */
angular.module('signupPageModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/skill-editor-page/skill-editor-main-tab/skill-concept-card-editor/skill-concept-card-editor.module.ts":
/*!*********************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/skill-editor-page/skill-editor-main-tab/skill-concept-card-editor/skill-concept-card-editor.module.ts ***!
  \*********************************************************************************************************************************************/
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
 * @fileoverview Module for the concept card editor.
 */
angular.module('skillConceptCardEditorModule', [
    'workedExampleEditorModule'
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/skill-editor-page/skill-editor-main-tab/skill-concept-card-editor/worked-example-editor/worked-example-editor.module.ts":
/*!***************************************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/skill-editor-page/skill-editor-main-tab/skill-concept-card-editor/worked-example-editor/worked-example-editor.module.ts ***!
  \***************************************************************************************************************************************************************/
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
 * @fileoverview Module for the worked example editor.
 */
angular.module('workedExampleEditorModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/skill-editor-page/skill-editor-main-tab/skill-description-editor/skill-description-editor.module.ts":
/*!*******************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/skill-editor-page/skill-editor-main-tab/skill-description-editor/skill-description-editor.module.ts ***!
  \*******************************************************************************************************************************************/
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
 * @fileoverview Module for the skill description editor.
 */
angular.module('skillDescriptionEditorModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/skill-editor-page/skill-editor-main-tab/skill-editor-main-tab.module.ts":
/*!***************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/skill-editor-page/skill-editor-main-tab/skill-editor-main-tab.module.ts ***!
  \***************************************************************************************************************/
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
 * @fileoverview Module for the main tab of the skill editor.
 */
angular.module('skillEditorMainTabModule', [
    'skillConceptCardEditorModule', 'skillDescriptionEditorModule',
    'skillMisconceptionsEditorModule'
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/skill-editor-page/skill-editor-main-tab/skill-misconceptions-editor/misconception-editor/misconception-editor.module.ts":
/*!***************************************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/skill-editor-page/skill-editor-main-tab/skill-misconceptions-editor/misconception-editor/misconception-editor.module.ts ***!
  \***************************************************************************************************************************************************************/
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
 * @fileoverview Directive for the misconception editor.
 */
angular.module('misconceptionEditorModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/skill-editor-page/skill-editor-main-tab/skill-misconceptions-editor/skill-misconceptions-editor.module.ts":
/*!*************************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/skill-editor-page/skill-editor-main-tab/skill-misconceptions-editor/skill-misconceptions-editor.module.ts ***!
  \*************************************************************************************************************************************************/
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
 * @fileoverview Module for the skill misconceptions editor.
 */
angular.module('skillMisconceptionsEditorModule', [
    'misconceptionEditorModule'
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/skill-editor-page/skill-editor-navbar-breadcrumb/skill-editor-navbar-breadcrumb.module.ts":
/*!*********************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/skill-editor-page/skill-editor-navbar-breadcrumb/skill-editor-navbar-breadcrumb.module.ts ***!
  \*********************************************************************************************************************************/
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
 * @fileoverview Module for the navbar breadcrumb of the skill editor.
 */
angular.module('skillEditorNavbarBreadcrumbModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/skill-editor-page/skill-editor-navbar/skill-editor-navbar.module.ts":
/*!***********************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/skill-editor-page/skill-editor-navbar/skill-editor-navbar.module.ts ***!
  \***********************************************************************************************************/
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
 * @fileoverview Module for the navbar of the skill editor.
 */
angular.module('skillEditorNavbarModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/skill-editor-page/skill-editor-page.module.ts":
/*!*************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/skill-editor-page/skill-editor-page.module.ts ***!
  \*************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for the skill editor page.
 */
angular.module('skillEditorModule', [
    'skillEditorMainTabModule', 'skillEditorNavbarModule',
    'skillEditorNavbarBreadcrumbModule', 'skillEditorQuestionsTabModule'
]);
angular.module('skillEditorModule').constant('INTERACTION_SPECS', GLOBALS.INTERACTION_SPECS);
angular.module('skillEditorModule').constant('SKILL_RIGHTS_URL_TEMPLATE', '/skill_editor_handler/rights/<skill_id>');
angular.module('skillEditorModule').constant('SKILL_PUBLISH_URL_TEMPLATE', '/skill_editor_handler/publish_skill/<skill_id>');
angular.module('skillEditorModule').constant('EVENT_SKILL_INITIALIZED', 'skillInitialized');
angular.module('skillEditorModule').constant('EVENT_SKILL_REINITIALIZED', 'skillReinitialized');
angular.module('skillEditorModule').constant('EVENT_QUESTION_SUMMARIES_INITIALIZED', 'questionSummariesInitialized');


/***/ }),

/***/ "./core/templates/dev/head/pages/skill-editor-page/skill-editor-questions-tab/skill-editor-questions-tab.module.ts":
/*!*************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/skill-editor-page/skill-editor-questions-tab/skill-editor-questions-tab.module.ts ***!
  \*************************************************************************************************************************/
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
 * @fileoverview Module for the questions tab.
 */
angular.module('skillEditorQuestionsTabModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/splash-page/splash-page.module.ts":
/*!*************************************************************************!*\
  !*** ./core/templates/dev/head/pages/splash-page/splash-page.module.ts ***!
  \*************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for the for the Oppia splash page.
 */
angular.module('splashPageModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/state-editor/state-content-editor/state-content-editor.module.ts":
/*!********************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/state-editor/state-content-editor/state-content-editor.module.ts ***!
  \********************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for the state content editor.
 */
angular.module('stateContentEditorModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/state-editor/state-editor.module.ts":
/*!***************************************************************************!*\
  !*** ./core/templates/dev/head/pages/state-editor/state-editor.module.ts ***!
  \***************************************************************************/
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
 * @fileoverview Module for the state editor directive.
 */
angular.module('stateEditorModule', ['stateSolutionEditorModule',
    'stateResponsesModule', 'stateInteractionEditorModule',
    'stateHintsEditorModule', 'stateContentEditorModule']);


/***/ }),

/***/ "./core/templates/dev/head/pages/state-editor/state-hints-editor/state-hints-editor.module.ts":
/*!****************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/state-editor/state-hints-editor/state-hints-editor.module.ts ***!
  \****************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for the add and view hints section of the state
 * editor.
 */
angular.module('stateHintsEditorModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/state-editor/state-interaction-editor/state-interaction-editor.module.ts":
/*!****************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/state-editor/state-interaction-editor/state-interaction-editor.module.ts ***!
  \****************************************************************************************************************/
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
 * @fileoverview Module for the interaction editor section in the state
 * editor.
 */
angular.module('stateInteractionEditorModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/state-editor/state-responses/state-responses.module.ts":
/*!**********************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/state-editor/state-responses/state-responses.module.ts ***!
  \**********************************************************************************************/
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
 * @fileoverview Module for managing the state responses in the state editor.
 */
angular.module('stateResponsesModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/state-editor/state-solution-editor/state-solution-editor.module.ts":
/*!**********************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/state-editor/state-solution-editor/state-solution-editor.module.ts ***!
  \**********************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for the solution viewer and editor section in the
 * state editor.
 */
angular.module('stateSolutionEditorModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/story-editor-page/main-story-editor/main-story-editor.module.ts":
/*!*******************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/story-editor-page/main-story-editor/main-story-editor.module.ts ***!
  \*******************************************************************************************************/
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
 * @fileoverview Module for the main story editor.
 */
angular.module('mainStoryEditorModule', ['storyNodeEditorModule']);
angular.module('mainStoryEditorModule').constant('EVENT_VIEW_STORY_NODE_EDITOR', 'viewStoryNodeEditor');


/***/ }),

/***/ "./core/templates/dev/head/pages/story-editor-page/main-story-editor/story-node-editor/story-node-editor.module.ts":
/*!*************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/story-editor-page/main-story-editor/story-node-editor/story-node-editor.module.ts ***!
  \*************************************************************************************************************************/
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
 * @fileoverview Module for the story node editor.
 */
angular.module('storyNodeEditorModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/story-editor-page/story-editor-navbar-breadcrumb/story-editor-navbar-breadcrumb.module.ts":
/*!*********************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/story-editor-page/story-editor-navbar-breadcrumb/story-editor-navbar-breadcrumb.module.ts ***!
  \*********************************************************************************************************************************/
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
 * @fileoverview Module for the navbar breadcrumb of the story editor.
 */
angular.module('storyEditorNavbarBreadcrumbModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/story-editor-page/story-editor-navbar/story-editor-navbar.module.ts":
/*!***********************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/story-editor-page/story-editor-navbar/story-editor-navbar.module.ts ***!
  \***********************************************************************************************************/
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
 * @fileoverview Module for the navbar of the story editor.
 */
angular.module('storyEditorNavbarModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/story-editor-page/story-editor-page.module.ts":
/*!*************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/story-editor-page/story-editor-page.module.ts ***!
  \*************************************************************************************/
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
 * @fileoverview Module for the story editor page.
 */
angular.module('storyEditorModule', ['storyEditorNavbarBreadcrumbModule',
    'storyEditorNavbarModule', 'mainStoryEditorModule']);
angular.module('storyEditorModule').constant('NODE_ID_PREFIX', 'node_');
angular.module('storyEditorModule').constant('EVENT_STORY_INITIALIZED', 'storyInitialized');
angular.module('storyEditorModule').constant('EVENT_STORY_REINITIALIZED', 'storyReinitialized');


/***/ }),

/***/ "./core/templates/dev/head/pages/teach-page/teach-page.module.ts":
/*!***********************************************************************!*\
  !*** ./core/templates/dev/head/pages/teach-page/teach-page.module.ts ***!
  \***********************************************************************/
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
 * @fileoverview Module for the teach page.
 */
angular.module('teachPageModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/thanks-page/thanks-page.module.ts":
/*!*************************************************************************!*\
  !*** ./core/templates/dev/head/pages/thanks-page/thanks-page.module.ts ***!
  \*************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for the 'thanks' page.
 */
angular.module('thanksPageModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/topic-editor-page/main-topic-editor/main-topic-editor-stories-list/main-topic-editor-stories-list.module.ts":
/*!***************************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/topic-editor-page/main-topic-editor/main-topic-editor-stories-list/main-topic-editor-stories-list.module.ts ***!
  \***************************************************************************************************************************************************/
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
 * @fileoverview Module for the stories list viewer.
 */
angular.module('mainTopicEditorStoriesListModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/topic-editor-page/main-topic-editor/main-topic-editor.module.ts":
/*!*******************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/topic-editor-page/main-topic-editor/main-topic-editor.module.ts ***!
  \*******************************************************************************************************/
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
 * @fileoverview Module for the main topic editor.
 */
angular.module('mainTopicEditorModule', ['mainTopicEditorStoriesListModule']);


/***/ }),

/***/ "./core/templates/dev/head/pages/topic-editor-page/questions-tab/questions-tab.module.ts":
/*!***********************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/topic-editor-page/questions-tab/questions-tab.module.ts ***!
  \***********************************************************************************************/
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
 * @fileoverview Module for the questions tab.
 */
angular.module('questionsTabModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/topic-editor-page/subtopics-list-tab/subtopics-list-tab.module.ts":
/*!*********************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/topic-editor-page/subtopics-list-tab/subtopics-list-tab.module.ts ***!
  \*********************************************************************************************************/
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
 * @fileoverview Module for the subtopics list editor.
 */
angular.module('subtopicsListTabModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/topic-editor-page/topic-editor-navbar-breadcrumb/topic-editor-navbar-breadcrumb.module.ts":
/*!*********************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/topic-editor-page/topic-editor-navbar-breadcrumb/topic-editor-navbar-breadcrumb.module.ts ***!
  \*********************************************************************************************************************************/
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
 * @fileoverview Module for the navbar breadcrumb of the topic editor.
 */
angular.module('topicEditorNavbarBreadcrumbModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/topic-editor-page/topic-editor-navbar/topic-editor-navbar.module.ts":
/*!***********************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/topic-editor-page/topic-editor-navbar/topic-editor-navbar.module.ts ***!
  \***********************************************************************************************************/
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
 * @fileoverview Module for the navbar of the topic editor.
 */
angular.module('topicEditorNavbarModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/topic-editor-page/topic-editor-page.module.ts":
/*!*************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/topic-editor-page/topic-editor-page.module.ts ***!
  \*************************************************************************************/
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
 * @fileoverview Primary controller for the topic editor page.
 */
angular.module('topicEditorPageModule', [
    'topicEditorNavbarBreadcrumbModule', 'topicEditorNavbarModule',
    'subtopicsListTabModule', 'questionsTabModule', 'mainTopicEditorModule'
]);
angular.module('topicEditorPageModule').constant('INTERACTION_SPECS', GLOBALS.INTERACTION_SPECS);
angular.module('topicEditorPageModule').constant('EDITABLE_TOPIC_DATA_URL_TEMPLATE', '/topic_editor_handler/data/<topic_id>');
angular.module('topicEditorPageModule').constant('TOPIC_MANAGER_RIGHTS_URL_TEMPLATE', '/rightshandler/assign_topic_manager/<topic_id>/<assignee_id>');
angular.module('topicEditorPageModule').constant('TOPIC_RIGHTS_URL_TEMPLATE', '/rightshandler/get_topic_rights/<topic_id>');
angular.module('topicEditorPageModule').constant('SUBTOPIC_PAGE_EDITOR_DATA_URL_TEMPLATE', '/subtopic_page_editor_handler/data/<topic_id>/<subtopic_id>');
angular.module('topicEditorPageModule').constant('TOPIC_NAME_INPUT_FOCUS_LABEL', 'topicNameInputFocusLabel');
angular.module('topicEditorPageModule').constant('EVENT_TOPIC_INITIALIZED', 'topicInitialized');
angular.module('topicEditorPageModule').constant('EVENT_TOPIC_REINITIALIZED', 'topicReinitialized');
angular.module('topicEditorPageModule').constant('EVENT_SUBTOPIC_PAGE_LOADED', 'subtopicPageLoaded');
angular.module('topicEditorPageModule').constant('EVENT_STORY_SUMMARIES_INITIALIZED', 'storySummariesInitialized');
angular.module('topicEditorPageModule').constant('EVENT_QUESTION_SUMMARIES_INITIALIZED', 'questionSummariesInitialized');


/***/ }),

/***/ "./core/templates/dev/head/pages/topic-landing-page/topic-landing-page-stewards/topic-landing-page-stewards.module.ts":
/*!****************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/topic-landing-page/topic-landing-page-stewards/topic-landing-page-stewards.module.ts ***!
  \****************************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for the stewards landing page.
 */
angular.module('topicLandingPageStewardsModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/topic-landing-page/topic-landing-page.module.ts":
/*!***************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/topic-landing-page/topic-landing-page.module.ts ***!
  \***************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for the landing page.
 */
angular.module('topicLandingPageModule', ['topicLandingPageStewardsModule']);
// Note: This oppia constant needs to be keep in sync with
// AVAILABLE_LANDING_PAGES constant defined in feconf.py file.
angular.module('topicLandingPageModule').constant('TOPIC_LANDING_PAGE_DATA', {
    maths: {
        fractions: {
            collection_id: '4UgTQUc1tala',
            page_data: {
                image_1: 'matthew_paper.png',
                image_2: 'matthew_fractions.png',
                video: 'fractions_video.mp4',
            }
        },
        ratios: {
            collection_id: '53gXGLIR044l',
            page_data: {
                image_1: 'ratios_James.png',
                image_2: 'ratios_question.png',
                video: 'ratios_video.mp4',
            }
        }
    }
});


/***/ }),

/***/ "./core/templates/dev/head/pages/topic-viewer-page/stories-list/stories-list.module.ts":
/*!*********************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/topic-viewer-page/stories-list/stories-list.module.ts ***!
  \*********************************************************************************************/
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
 * @fileoverview Module for the stories list.
 */
angular.module('storiesListModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/topic-viewer-page/topic-viewer-navbar-breadcrumb/topic-viewer-navbar-breadcrumb.module.ts":
/*!*********************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/topic-viewer-page/topic-viewer-navbar-breadcrumb/topic-viewer-navbar-breadcrumb.module.ts ***!
  \*********************************************************************************************************************************/
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
 * @fileoverview Module for the navbar breadcrumb of the topic viewer.
 */
angular.module('topicViewerNavbarBreadcrumbModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/topic-viewer-page/topic-viewer-page.module.ts":
/*!*************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/topic-viewer-page/topic-viewer-page.module.ts ***!
  \*************************************************************************************/
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
 * @fileoverview Module for the topic viewer.
 */
angular.module('topicViewerPageModule', [
    'storiesListModule', 'topicViewerNavbarBreadcrumbModule'
]);


/***/ }),

/***/ "./core/templates/dev/head/pages/topics-and-skills-dashboard-page/select-topics/select-topics.module.ts":
/*!**************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/topics-and-skills-dashboard-page/select-topics/select-topics.module.ts ***!
  \**************************************************************************************************************/
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
 * @fileoverview Module for the select topics viewer.
 */
angular.module('selectTopicsModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/topics-and-skills-dashboard-page/skills-list/skills-list.module.ts":
/*!**********************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/topics-and-skills-dashboard-page/skills-list/skills-list.module.ts ***!
  \**********************************************************************************************************/
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
 * @fileoverview Module for the skills list viewer.
 */
angular.module('skillsListModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page-navbar-breadcrumb/topics-and-skills-dashboard-page-navbar-breadcrumb.module.ts":
/*!****************************************************************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page-navbar-breadcrumb/topics-and-skills-dashboard-page-navbar-breadcrumb.module.ts ***!
  \****************************************************************************************************************************************************************************************/
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
 * @fileoverview Module for the navbar breadcrumb of the topics and skills
 * dashboard.
 */
angular.module('topicsAndSkillsDashboardNavbarBreadcrumbModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page-navbar/topics-and-skills-dashboard-page-navbar.module.ts":
/*!******************************************************************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page-navbar/topics-and-skills-dashboard-page-navbar.module.ts ***!
  \******************************************************************************************************************************************************************/
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
 * @fileoverview Module for the navbar of the collection editor.
 */
angular.module('topicsAndSkillsDashboardNavbarModule', []);


/***/ }),

/***/ "./core/templates/dev/head/pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page.module.ts":
/*!*******************************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page.module.ts ***!
  \*******************************************************************************************************************/
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
 * @fileoverview Module for the topics and skills dashboard.
 */
angular.module('topicsAndSkillsDashboardModule', [
    'selectTopicsModule', 'skillsListModule',
    'topicsAndSkillsDashboardNavbarBreadcrumbModule',
    'topicsAndSkillsDashboardNavbarModule', 'topicsListModule'
]);
angular.module('topicsAndSkillsDashboardModule').constant('EDITABLE_TOPIC_DATA_URL_TEMPLATE', '/topic_editor_handler/data/<topic_id>');
angular.module('topicsAndSkillsDashboardModule').constant('SUBTOPIC_PAGE_EDITOR_DATA_URL_TEMPLATE', '/subtopic_page_editor_handler/data/<topic_id>/<subtopic_id>');
angular.module('topicsAndSkillsDashboardModule').constant('EVENT_TYPE_TOPIC_CREATION_ENABLED', 'topicCreationEnabled');
angular.module('topicsAndSkillsDashboardModule').constant('EVENT_TYPE_SKILL_CREATION_ENABLED', 'skillCreationEnabled');
angular.module('topicsAndSkillsDashboardModule').constant('EVENT_TOPICS_AND_SKILLS_DASHBOARD_REINITIALIZED', 'topicsAndSkillsDashboardReinitialized');


/***/ }),

/***/ "./core/templates/dev/head/pages/topics-and-skills-dashboard-page/topics-list/topics-list.module.ts":
/*!**********************************************************************************************************!*\
  !*** ./core/templates/dev/head/pages/topics-and-skills-dashboard-page/topics-list/topics-list.module.ts ***!
  \**********************************************************************************************************/
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
 * @fileoverview Module for the topics list viewer.
 */
angular.module('topicsListModule', []);


/***/ }),

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

/***/ "./core/templates/dev/head/services/DateTimeFormatService.ts":
/*!*******************************************************************!*\
  !*** ./core/templates/dev/head/services/DateTimeFormatService.ts ***!
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
* @fileoverview Service for converting dates in milliseconds
* since the Epoch to human-readable dates.
*/
oppia.factory('DateTimeFormatService', ['$filter', function ($filter) {
        return {
            // Returns just the time if the local datetime representation has the
            // same date as the current date. Otherwise, returns just the date if the
            // local datetime representation has the same year as the current date.
            // Otherwise, returns the full date (with the year abbreviated).
            getLocaleAbbreviatedDatetimeString: function (millisSinceEpoch) {
                var date = new Date(millisSinceEpoch);
                if (date.toLocaleDateString() === new Date().toLocaleDateString()) {
                    return date.toLocaleTimeString([], {
                        hour: 'numeric',
                        minute: 'numeric',
                        hour12: true
                    });
                }
                else if (date.getFullYear() === new Date().getFullYear()) {
                    return $filter('date')(date, 'MMM d');
                }
                else {
                    return $filter('date')(date, 'shortDate');
                }
            },
            // Returns just the date.
            getLocaleDateString: function (millisSinceEpoch) {
                var date = new Date(millisSinceEpoch);
                return date.toLocaleDateString();
            },
            // Returns whether the date is at most one week before the current date.
            isRecent: function (millisSinceEpoch) {
                var ONE_WEEK_IN_MILLIS = 7 * 24 * 60 * 60 * 1000;
                return new Date().getTime() - millisSinceEpoch < ONE_WEEK_IN_MILLIS;
            }
        };
    }]);


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

/***/ "./core/templates/dev/head/services/PromoBarService.ts":
/*!*************************************************************!*\
  !*** ./core/templates/dev/head/services/PromoBarService.ts ***!
  \*************************************************************/
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
 * @fileoverview Service Promo bar.
 */
oppia.factory('PromoBarService', [
    '$http', '$q', 'ENABLE_PROMO_BAR',
    function ($http, $q, ENABLE_PROMO_BAR) {
        return {
            getPromoBarData: function () {
                var promoBarData = {
                    promoBarEnabled: false,
                    promoBarMessage: ''
                };
                if (ENABLE_PROMO_BAR) {
                    return $http.get('/promo_bar_handler', {}).then(function (response) {
                        promoBarData.promoBarEnabled = response.data.promo_bar_enabled;
                        promoBarData.promoBarMessage = response.data.promo_bar_message;
                        return promoBarData;
                    });
                }
                else {
                    return $q.resolve(promoBarData);
                }
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/services/RteHelperService.ts":
/*!**************************************************************!*\
  !*** ./core/templates/dev/head/services/RteHelperService.ts ***!
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
 * @fileoverview A helper service for the Rich text editor(RTE).
 */
oppia.constant('RTE_COMPONENT_SPECS', richTextComponents);
oppia.factory('RteHelperService', [
    '$document', '$filter', '$interpolate', '$log', '$uibModal',
    'ContextService', 'FocusManagerService', 'HtmlEscaperService',
    'UrlInterpolationService', 'RTE_COMPONENT_SPECS',
    function ($document, $filter, $interpolate, $log, $uibModal, ContextService, FocusManagerService, HtmlEscaperService, UrlInterpolationService, RTE_COMPONENT_SPECS) {
        var _RICH_TEXT_COMPONENTS = [];
        Object.keys(RTE_COMPONENT_SPECS).sort().forEach(function (componentId) {
            _RICH_TEXT_COMPONENTS.push({
                backendId: RTE_COMPONENT_SPECS[componentId].backend_id,
                customizationArgSpecs: angular.copy(RTE_COMPONENT_SPECS[componentId].customization_arg_specs),
                id: RTE_COMPONENT_SPECS[componentId].frontend_id,
                iconDataUrl: RTE_COMPONENT_SPECS[componentId].icon_data_url,
                isComplex: RTE_COMPONENT_SPECS[componentId].is_complex,
                isBlockElement: RTE_COMPONENT_SPECS[componentId].is_block_element,
                requiresFs: RTE_COMPONENT_SPECS[componentId].requires_fs,
                tooltip: RTE_COMPONENT_SPECS[componentId].tooltip
            });
        });
        var _createCustomizationArgDictFromAttrs = function (attrs) {
            var customizationArgsDict = {};
            for (var i = 0; i < attrs.length; i++) {
                var attr = attrs[i];
                if (attr.name === 'class' || attr.name === 'src' ||
                    attr.name === '_moz_resizing') {
                    continue;
                }
                var separatorLocation = attr.name.indexOf('-with-value');
                if (separatorLocation === -1) {
                    $log.error('RTE Error: invalid customization attribute ' + attr.name);
                    continue;
                }
                var argName = attr.name.substring(0, separatorLocation);
                customizationArgsDict[argName] = HtmlEscaperService.escapedJsonToObj(attr.value);
            }
            return customizationArgsDict;
        };
        return {
            createCustomizationArgDictFromAttrs: function (attrs) {
                return _createCustomizationArgDictFromAttrs(attrs);
            },
            getRichTextComponents: function () {
                return angular.copy(_RICH_TEXT_COMPONENTS);
            },
            isInlineComponent: function (richTextComponent) {
                var inlineComponents = ['link', 'math'];
                return inlineComponents.indexOf(richTextComponent) !== -1;
            },
            // The refocusFn arg is a function that restores focus to the text editor
            // after exiting the modal, and moves the cursor back to where it was
            // before the modal was opened.
            _openCustomizationModal: function (customizationArgSpecs, attrsCustomizationArgsDict, onSubmitCallback, onDismissCallback, refocusFn) {
                $document[0].execCommand('enableObjectResizing', false, false);
                var modalDialog = $uibModal.open({
                    templateUrl: UrlInterpolationService.getDirectiveTemplateUrl('/components/forms/forms-templates/' +
                        'customize-rte-component-modal.template.html'),
                    backdrop: 'static',
                    resolve: {},
                    controller: [
                        '$scope', '$uibModalInstance', '$timeout',
                        function ($scope, $uibModalInstance, $timeout) {
                            $scope.customizationArgSpecs = customizationArgSpecs;
                            // Without this code, the focus will remain in the background RTE
                            // even after the modal loads. This switches the focus to a
                            // temporary field in the modal which is then removed from the
                            // DOM.
                            // TODO(sll): Make this switch to the first input field in the
                            // modal instead.
                            $scope.modalIsLoading = true;
                            FocusManagerService.setFocus('tmpFocusPoint');
                            $timeout(function () {
                                $scope.modalIsLoading = false;
                            });
                            $scope.tmpCustomizationArgs = [];
                            for (var i = 0; i < customizationArgSpecs.length; i++) {
                                var caName = customizationArgSpecs[i].name;
                                $scope.tmpCustomizationArgs.push({
                                    name: caName,
                                    value: (attrsCustomizationArgsDict.hasOwnProperty(caName) ?
                                        angular.copy(attrsCustomizationArgsDict[caName]) :
                                        customizationArgSpecs[i].default_value)
                                });
                            }
                            $scope.cancel = function () {
                                $uibModalInstance.dismiss('cancel');
                            };
                            $scope.save = function () {
                                $scope.$broadcast('externalSave');
                                var customizationArgsDict = {};
                                for (var i = 0; i < $scope.tmpCustomizationArgs.length; i++) {
                                    var caName = $scope.tmpCustomizationArgs[i].name;
                                    customizationArgsDict[caName] = ($scope.tmpCustomizationArgs[i].value);
                                }
                                $uibModalInstance.close(customizationArgsDict);
                            };
                        }
                    ]
                });
                modalDialog.result.then(onSubmitCallback, onDismissCallback);
                // 'finally' is a JS keyword. If it is just used in its ".finally" form,
                // the minification process throws an error.
                modalDialog.result['finally'](refocusFn);
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/services/StateRulesStatsService.ts":
/*!********************************************************************!*\
  !*** ./core/templates/dev/head/services/StateRulesStatsService.ts ***!
  \********************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

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
 * @fileoverview Factory for calculating the statistics of a particular state.
 */
__webpack_require__(/*! pages/exploration-editor-page/exploration-editor-page-services/angular-name/angular-name.service.ts */ "./core/templates/dev/head/pages/exploration-editor-page/exploration-editor-page-services/angular-name/angular-name.service.ts");
__webpack_require__(/*! pages/exploration_player/AnswerClassificationService.ts */ "./core/templates/dev/head/pages/exploration_player/AnswerClassificationService.ts");
__webpack_require__(/*! services/ContextService.ts */ "./core/templates/dev/head/services/ContextService.ts");
__webpack_require__(/*! domain/objects/FractionObjectFactory.ts */ "./core/templates/dev/head/domain/objects/FractionObjectFactory.ts");
__webpack_require__(/*! domain/utilities/UrlInterpolationService.ts */ "./core/templates/dev/head/domain/utilities/UrlInterpolationService.ts");
oppia.factory('StateRulesStatsService', [
    '$http', '$injector', 'AngularNameService', 'AnswerClassificationService',
    'ContextService', 'FractionObjectFactory', 'UrlInterpolationService',
    function ($http, $injector, AngularNameService, AnswerClassificationService, ContextService, FractionObjectFactory, UrlInterpolationService) {
        return {
            /**
             * TODO(brianrodri): Consider moving this into a visualization domain
             * object.
             *
             * @param {Object!} state
             * @return {Boolean} whether given state has an implementation for
             *     displaying the improvements overview tab in the State Editor.
             */
            stateSupportsImprovementsOverview: function (state) {
                return state.interaction.id === 'TextInput';
            },
            /**
             * Returns a promise which will provide details of the given state's
             * answer-statistics.
             *
             * @param {Object!} state
             */
            computeStateRulesStats: function (state) {
                var interactionRulesService = $injector.get(AngularNameService.getNameOfInteractionRulesService(state.interaction.id));
                var explorationId = ContextService.getExplorationId();
                return $http.get('/createhandler/state_rules_stats/' + [
                    encodeURIComponent(explorationId),
                    encodeURIComponent(state.name)
                ].join('/')).then(function (response) {
                    return {
                        state_name: state.name,
                        exploration_id: explorationId,
                        visualizations_info: response.data.visualizations_info.map(function (vizInfo) {
                            var newVizInfo = angular.copy(vizInfo);
                            newVizInfo.data.forEach(function (vizInfoDatum) {
                                // If data is a FractionInput, need to change data so that
                                // visualization displays the input in a readable manner.
                                if (state.interaction.id === 'FractionInput') {
                                    vizInfoDatum.answer =
                                        FractionObjectFactory.fromDict(vizInfoDatum.answer).toString();
                                }
                                if (newVizInfo.addressed_info_is_supported) {
                                    vizInfoDatum.is_addressed =
                                        AnswerClassificationService
                                            .isClassifiedExplicitlyOrGoesToNewState(state.name, state, vizInfoDatum.answer, interactionRulesService);
                                }
                            });
                            return newVizInfo;
                        })
                    };
                });
            }
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/services/TranslationFileHashLoaderService.ts":
/*!******************************************************************************!*\
  !*** ./core/templates/dev/head/services/TranslationFileHashLoaderService.ts ***!
  \******************************************************************************/
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
 * @fileoverview Service to load the i18n translation file.
 */
oppia.factory('TranslationFileHashLoaderService', [
    '$http', '$q', 'UrlInterpolationService',
    function ($http, $q, UrlInterpolationService) {
        /* Options object contains:
         *  prefix: added before key, defined by developer
         *  key: language key, determined internally by i18n library
         *  suffix: added after key, defined by developer
         */
        return function (options) {
            var fileUrl = [
                options.prefix,
                options.key,
                options.suffix
            ].join('');
            return $http.get(UrlInterpolationService.getStaticAssetUrl(fileUrl)).then(function (result) {
                return result.data;
            }, function () {
                return $q.reject(options.key);
            });
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/services/UserService.ts":
/*!*********************************************************!*\
  !*** ./core/templates/dev/head/services/UserService.ts ***!
  \*********************************************************/
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
 * @fileoverview Service for user data.
 */
oppia.factory('UserService', [
    '$http', '$q', '$window', 'UrlInterpolationService', 'UserInfoObjectFactory',
    'DEFAULT_PROFILE_IMAGE_PATH',
    function ($http, $q, $window, UrlInterpolationService, UserInfoObjectFactory, DEFAULT_PROFILE_IMAGE_PATH) {
        var PREFERENCES_DATA_URL = '/preferenceshandler/data';
        var userInfo = null;
        var getUserInfoAsync = function () {
            if (GLOBALS.userIsLoggedIn) {
                if (userInfo) {
                    return $q.resolve(userInfo);
                }
                return $http.get('/userinfohandler').then(function (response) {
                    userInfo = UserInfoObjectFactory.createFromBackendDict(response.data);
                    return userInfo;
                });
            }
            else {
                return $q.resolve(UserInfoObjectFactory.createDefault());
            }
        };
        return {
            getProfileImageDataUrlAsync: function () {
                var profilePictureDataUrl = (UrlInterpolationService.getStaticImageUrl(DEFAULT_PROFILE_IMAGE_PATH));
                if (GLOBALS.userIsLoggedIn) {
                    return $http.get('/preferenceshandler/profile_picture').then(function (response) {
                        if (response.data.profile_picture_data_url) {
                            profilePictureDataUrl = response.data.profile_picture_data_url;
                        }
                        return profilePictureDataUrl;
                    });
                }
                else {
                    return $q.resolve(profilePictureDataUrl);
                }
            },
            setProfileImageDataUrlAsync: function (newProfileImageDataUrl) {
                return $http.put(PREFERENCES_DATA_URL, {
                    update_type: 'profile_picture_data_url',
                    data: newProfileImageDataUrl
                });
            },
            getLoginUrlAsync: function () {
                var urlParameters = {
                    current_url: $window.location.href
                };
                return $http.get('/url_handler', { params: urlParameters }).then(function (response) {
                    return response.data.login_url;
                });
            },
            getUserInfoAsync: getUserInfoAsync
        };
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/services/contextual/WindowDimensionsService.ts":
/*!********************************************************************************!*\
  !*** ./core/templates/dev/head/services/contextual/WindowDimensionsService.ts ***!
  \********************************************************************************/
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
 * @fileoverview Service for computing the window dimensions.
 */
oppia.factory('WindowDimensionsService', ['$window', function ($window) {
        var onResizeHooks = [];
        angular.element($window).bind('resize', function () {
            onResizeHooks.forEach(function (hookFn) {
                hookFn();
            });
        });
        return {
            getWidth: function () {
                return ($window.innerWidth || document.documentElement.clientWidth ||
                    document.body.clientWidth);
            },
            registerOnResizeHook: function (hookFn) {
                onResizeHooks.push(hookFn);
            },
            isWindowNarrow: function () {
                var NORMAL_NAVBAR_CUTOFF_WIDTH_PX = 768;
                return this.getWidth() <= NORMAL_NAVBAR_CUTOFF_WIDTH_PX;
            }
        };
    }]);


/***/ }),

/***/ "./core/templates/dev/head/services/stateful/BackgroundMaskService.ts":
/*!****************************************************************************!*\
  !*** ./core/templates/dev/head/services/stateful/BackgroundMaskService.ts ***!
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
 * @fileoverview Service for enabling a background mask that leaves navigation
 * visible.
 */
oppia.factory('BackgroundMaskService', [
    function () {
        var maskIsActive = false;
        return {
            isMaskActive: function () {
                return maskIsActive;
            },
            activateMask: function () {
                maskIsActive = true;
            },
            deactivateMask: function () {
                maskIsActive = false;
            }
        };
    }
]);


/***/ })

}]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9JMThuRm9vdGVyLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvYnV0dG9uLWRpcmVjdGl2ZXMvYnV0dG9ucy1kaXJlY3RpdmVzLm1vZHVsZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9jb21wb25lbnRzL2J1dHRvbi1kaXJlY3RpdmVzL2NyZWF0ZS1idXR0b24vY3JlYXRlLWFjdGl2aXR5LWJ1dHRvbi5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9idXR0b24tZGlyZWN0aXZlcy9jcmVhdGUtYnV0dG9uL2NyZWF0ZS1hY3Rpdml0eS1idXR0b24ubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvYnV0dG9uLWRpcmVjdGl2ZXMvZXhwbG9yYXRpb24tZW1iZWQtbW9kYWwvZXhwbG9yYXRpb24tZW1iZWQtYnV0dG9uLm1vZHVsZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9jb21wb25lbnRzL2J1dHRvbi1kaXJlY3RpdmVzL2hpbnQtYW5kLXNvbHV0aW9uLWJ1dHRvbnMvaGludC1hbmQtc29sdXRpb24tYnV0dG9ucy5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9idXR0b24tZGlyZWN0aXZlcy9zb2NpYWwtYnV0dG9ucy9zb2NpYWwtYnV0dG9ucy5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9idXR0b24tZGlyZWN0aXZlcy9zb2NpYWwtYnV0dG9ucy9zb2NpYWwtYnV0dG9ucy5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9jay1lZGl0b3ItaGVscGVycy9jay1lZGl0b3ItaGVscGVycy5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9jay1lZGl0b3ItaGVscGVycy9jay1lZGl0b3ItcnRlL2NrLWVkaXRvci1ydGUubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvY2stZWRpdG9yLWhlbHBlcnMvY2stZWRpdG9yLXdpZGdldHMvY2stZWRpdG9yLXdpZGdldHMubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvY29kZW1pcnJvci1tZXJnZXZpZXcvY29kZW1pcnJvci1tZXJnZXZpZXcubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvY29tbW9uLWxheW91dC1kaXJlY3RpdmVzL2FsZXJ0LW1lc3NhZ2UvYWxlcnQtbWVzc2FnZS5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9jb21tb24tbGF5b3V0LWRpcmVjdGl2ZXMvYWxlcnQtbWVzc2FnZS9hbGVydC1tZXNzYWdlLm1vZHVsZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9jb21wb25lbnRzL2NvbW1vbi1sYXlvdXQtZGlyZWN0aXZlcy9hdHRyaWJ1dGlvbi1ndWlkZS9hdHRyaWJ1dGlvbi1ndWlkZS5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9jb21tb24tbGF5b3V0LWRpcmVjdGl2ZXMvYmFja2dyb3VuZC1iYW5uZXIvYmFja2dyb3VuZC1iYW5uZXIubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvY29tbW9uLWxheW91dC1kaXJlY3RpdmVzL2NvbW1vbi1sYXlvdXQtZGlyZWN0aXZlcy5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9jb21tb24tbGF5b3V0LWRpcmVjdGl2ZXMvbG9hZGluZy1kb3RzL2xvYWRpbmctZG90cy5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9jb21tb24tbGF5b3V0LWRpcmVjdGl2ZXMvcHJvbW8tYmFyL3Byb21vLWJhci5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9jb21tb24tbGF5b3V0LWRpcmVjdGl2ZXMvcHJvbW8tYmFyL3Byb21vLWJhci5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9jb21tb24tbGF5b3V0LWRpcmVjdGl2ZXMvc2hhcmluZy1saW5rcy9zaGFyaW5nLWxpbmtzLm1vZHVsZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9jb21wb25lbnRzL2NvbW1vbi1sYXlvdXQtZGlyZWN0aXZlcy9zaWRlLW5hdmlnYXRpb24tYmFyL3NpZGUtbmF2aWdhdGlvbi1iYXIuZGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvY29tbW9uLWxheW91dC1kaXJlY3RpdmVzL3NpZGUtbmF2aWdhdGlvbi1iYXIvc2lkZS1uYXZpZ2F0aW9uLWJhci5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9jb21tb24tbGF5b3V0LWRpcmVjdGl2ZXMvdG9wLW5hdmlnYXRpb24tYmFyL3RvcC1uYXZpZ2F0aW9uLWJhci5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9jb21tb24tbGF5b3V0LWRpcmVjdGl2ZXMvdG9wLW5hdmlnYXRpb24tYmFyL3RvcC1uYXZpZ2F0aW9uLWJhci5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9lbnRpdHktY3JlYXRpb24tc2VydmljZXMvY29sbGVjdGlvbi1jcmVhdGlvbi9jb2xsZWN0aW9uLWNyZWF0aW9uLnNlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9lbnRpdHktY3JlYXRpb24tc2VydmljZXMvZW50aXR5LWNyZWF0aW9uLXNlcnZpY2VzLm1vZHVsZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9jb21wb25lbnRzL2VudGl0eS1jcmVhdGlvbi1zZXJ2aWNlcy9leHBsb3JhdGlvbi1jcmVhdGlvbi9leHBsb3JhdGlvbi1jcmVhdGlvbi5zZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvZm9ybXMvZm9ybXMtZGlyZWN0aXZlcy9hcHBseS12YWxpZGF0aW9uL2FwcGx5LXZhbGlkYXRpb24ubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvZm9ybXMvZm9ybXMtZGlyZWN0aXZlcy9hdWRpby1maWxlLXVwbG9hZGVyL2F1ZGlvLWZpbGUtdXBsb2FkZXIubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvZm9ybXMvZm9ybXMtZGlyZWN0aXZlcy9mb3Jtcy1kaXJlY3RpdmVzLm1vZHVsZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9jb21wb25lbnRzL2Zvcm1zL2Zvcm1zLWRpcmVjdGl2ZXMvaHRtbC1zZWxlY3QvaHRtbC1zZWxlY3QubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvZm9ybXMvZm9ybXMtZGlyZWN0aXZlcy9pbWFnZS11cGxvYWRlci9pbWFnZS11cGxvYWRlci5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9mb3Jtcy9mb3Jtcy1kaXJlY3RpdmVzL29iamVjdC1lZGl0b3Ivb2JqZWN0LWVkaXRvci5kaXJlY3RpdmUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9mb3Jtcy9mb3Jtcy1kaXJlY3RpdmVzL29iamVjdC1lZGl0b3Ivb2JqZWN0LWVkaXRvci5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9mb3Jtcy9mb3Jtcy1kaXJlY3RpdmVzL3JlcXVpcmUtaXMtZmxvYXQvcmVxdWlyZS1pcy1mbG9hdC5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9mb3Jtcy9mb3Jtcy1kaXJlY3RpdmVzL3NlbGVjdDItZHJvcGRvd24vc2VsZWN0Mi1kcm9wZG93bi5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9mb3Jtcy9mb3Jtcy1zY2hlbWEtZWRpdG9ycy9mb3Jtcy1zY2hlbWEtZWRpdG9ycy5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9mb3Jtcy9mb3Jtcy1zY2hlbWEtZWRpdG9ycy9zY2hlbWEtYmFzZWQtZWRpdG9yL3NjaGVtYS1iYXNlZC1ib29sLWVkaXRvci9zY2hlbWEtYmFzZWQtYm9vbC1lZGl0b3IubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvZm9ybXMvZm9ybXMtc2NoZW1hLWVkaXRvcnMvc2NoZW1hLWJhc2VkLWVkaXRvci9zY2hlbWEtYmFzZWQtY2hvaWNlcy1lZGl0b3Ivc2NoZW1hLWJhc2VkLWNob2ljZXMtZWRpdG9yLm1vZHVsZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9jb21wb25lbnRzL2Zvcm1zL2Zvcm1zLXNjaGVtYS1lZGl0b3JzL3NjaGVtYS1iYXNlZC1lZGl0b3Ivc2NoZW1hLWJhc2VkLWN1c3RvbS1lZGl0b3Ivc2NoZW1hLWJhc2VkLWN1c3RvbS1lZGl0b3IubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvZm9ybXMvZm9ybXMtc2NoZW1hLWVkaXRvcnMvc2NoZW1hLWJhc2VkLWVkaXRvci9zY2hlbWEtYmFzZWQtZGljdC1lZGl0b3Ivc2NoZW1hLWJhc2VkLWRpY3QtZWRpdG9yLm1vZHVsZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9jb21wb25lbnRzL2Zvcm1zL2Zvcm1zLXNjaGVtYS1lZGl0b3JzL3NjaGVtYS1iYXNlZC1lZGl0b3Ivc2NoZW1hLWJhc2VkLWVkaXRvci5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9mb3Jtcy9mb3Jtcy1zY2hlbWEtZWRpdG9ycy9zY2hlbWEtYmFzZWQtZWRpdG9yL3NjaGVtYS1iYXNlZC1mbG9hdC1lZGl0b3Ivc2NoZW1hLWJhc2VkLWZsb2F0LWVkaXRvci5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9mb3Jtcy9mb3Jtcy1zY2hlbWEtZWRpdG9ycy9zY2hlbWEtYmFzZWQtZWRpdG9yL3NjaGVtYS1iYXNlZC1odG1sLWVkaXRvci9zY2hlbWEtYmFzZWQtaHRtbC1lZGl0b3IubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvZm9ybXMvZm9ybXMtc2NoZW1hLWVkaXRvcnMvc2NoZW1hLWJhc2VkLWVkaXRvci9zY2hlbWEtYmFzZWQtaW50LWVkaXRvci9zY2hlbWEtYmFzZWQtaW50LWVkaXRvci5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9mb3Jtcy9mb3Jtcy1zY2hlbWEtZWRpdG9ycy9zY2hlbWEtYmFzZWQtZWRpdG9yL3NjaGVtYS1iYXNlZC1saXN0LWVkaXRvci9zY2hlbWEtYmFzZWQtbGlzdC1lZGl0b3IubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvZm9ybXMvZm9ybXMtc2NoZW1hLWVkaXRvcnMvc2NoZW1hLWJhc2VkLWVkaXRvci9zY2hlbWEtYmFzZWQtdW5pY29kZS1lZGl0b3Ivc2NoZW1hLWJhc2VkLXVuaWNvZGUtZWRpdG9yLm1vZHVsZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9jb21wb25lbnRzL2Zvcm1zL2Zvcm1zLXNjaGVtYS1lZGl0b3JzL3NjaGVtYS1iYXNlZC1leHByZXNzaW9uLWVkaXRvci9zY2hlbWEtYmFzZWQtZXhwcmVzc2lvbi1lZGl0b3IubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvZm9ybXMvZm9ybXMtdW5pY29kZS1maWx0ZXJzL2Zvcm1zLXVuaWNvZGUtZmlsdGVycy5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9mb3Jtcy9mb3Jtcy12YWxpZGF0b3JzL2Zvcm1zLXZhbGlkYXRvcnMubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvZm9ybXMvZm9ybXMubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvcHJvZmlsZS1saW5rLWRpcmVjdGl2ZXMvY2lyY3VsYXItaW1hZ2UvY2lyY3VsYXItaW1hZ2UubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvcHJvZmlsZS1saW5rLWRpcmVjdGl2ZXMvcHJvZmlsZS1saW5rLWRpcmVjdGl2ZXMubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvcHJvZmlsZS1saW5rLWRpcmVjdGl2ZXMvcHJvZmlsZS1saW5rLWltYWdlL3Byb2ZpbGUtbGluay1pbWFnZS5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9wcm9maWxlLWxpbmstZGlyZWN0aXZlcy9wcm9maWxlLWxpbmstdGV4dC9wcm9maWxlLWxpbmstdGV4dC5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9yYXRpbmdzL3JhdGluZy1kaXNwbGF5L3JhdGluZy1kaXNwbGF5Lm1vZHVsZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9jb21wb25lbnRzL3JhdGluZ3MvcmF0aW5ncy5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9zdGF0ZS9hbnN3ZXItZ3JvdXAtZWRpdG9yL2Fuc3dlci1ncm91cC1lZGl0b3IubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvc3RhdGUvaGludC1lZGl0b3IvaGludC1lZGl0b3IubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvc3RhdGUvb3V0Y29tZS1lZGl0b3Ivb3V0Y29tZS1kZXN0aW5hdGlvbi1lZGl0b3Ivb3V0Y29tZS1kZXN0aW5hdGlvbi1lZGl0b3IubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvc3RhdGUvb3V0Y29tZS1lZGl0b3Ivb3V0Y29tZS1lZGl0b3IubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvc3RhdGUvb3V0Y29tZS1lZGl0b3Ivb3V0Y29tZS1mZWVkYmFjay1lZGl0b3Ivb3V0Y29tZS1mZWVkYmFjay1lZGl0b3IubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvc3RhdGUvcmVzcG9uc2UtaGVhZGVyL3Jlc3BvbnNlLWhlYWRlci5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9zdGF0ZS9ydWxlLWVkaXRvci9ydWxlLWVkaXRvci5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9zdGF0ZS9ydWxlLXR5cGUtc2VsZWN0b3IvcnVsZS10eXBlLXNlbGVjdG9yLm1vZHVsZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9jb21wb25lbnRzL3N0YXRlL3NvbHV0aW9uLWVkaXRvci9zb2x1dGlvbi1lZGl0b3IubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvc3RhdGUvc29sdXRpb24tZWRpdG9yL3NvbHV0aW9uLWV4cGxhbmF0aW9uLWVkaXRvci9zb2x1dGlvbi1leHBsYW5hdGlvbi1lZGl0b3IubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvc3RhdGUvc3RhdGUubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvc3VtbWFyeS1saXN0LWhlYWRlci9zdW1tYXJ5LWxpc3QtaGVhZGVyLm1vZHVsZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9jb21wb25lbnRzL3N1bW1hcnktdGlsZS1kaXJlY3RpdmVzL2NvbGxlY3Rpb24tc3VtbWFyeS10aWxlL2NvbGxlY3Rpb24tc3VtbWFyeS10aWxlLm1vZHVsZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9jb21wb25lbnRzL3N1bW1hcnktdGlsZS1kaXJlY3RpdmVzL2V4cGxvcmF0aW9uLXN1bW1hcnktdGlsZS9leHBsb3JhdGlvbi1zdW1tYXJ5LXRpbGUubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2NvbXBvbmVudHMvc3VtbWFyeS10aWxlLWRpcmVjdGl2ZXMvc3Rvcnktc3VtbWFyeS10aWxlL3N0b3J5LXN1bW1hcnktdGlsZS5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy9zdW1tYXJ5LXRpbGUtZGlyZWN0aXZlcy9zdW1tYXJ5LXRpbGUtZGlyZWN0aXZlcy5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvY29tcG9uZW50cy92ZXJzaW9uLWRpZmYtdmlzdWFsaXphdGlvbi92ZXJzaW9uLWRpZmYtdmlzdWFsaXphdGlvbi5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZGlyZWN0aXZlcy9Gb2N1c09uRGlyZWN0aXZlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2RvbWFpbi9zaWRlYmFyL1NpZGViYXJTdGF0dXNTZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2RvbWFpbi91c2VyL1VzZXJJbmZvT2JqZWN0RmFjdG9yeS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9maWx0ZXJzL2ZpbHRlcnMubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2ZpbHRlcnMvc3RyaW5nLXV0aWxpdHktZmlsdGVycy9zdHJpbmctdXRpbGl0eS1maWx0ZXJzLm1vZHVsZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9CYXNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2Fib3V0LXBhZ2UvYWJvdXQtcGFnZS5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvYWRtaW4tcGFnZS9hY3Rpdml0aWVzLXRhYi9hZG1pbi1kZXYtbW9kZS1hY3Rpdml0aWVzLXRhYi9hZG1pbi1kZXYtbW9kZS1hY3Rpdml0aWVzLXRhYi5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvYWRtaW4tcGFnZS9hY3Rpdml0aWVzLXRhYi9hZG1pbi1wcm9kLW1vZGUtYWN0aXZpdGllcy10YWIvYWRtaW4tcHJvZC1tb2RlLWFjdGl2aXRpZXMtdGFiLm1vZHVsZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9hZG1pbi1wYWdlL2FkbWluLW5hdmJhci9hZG1pbi1uYXZiYXIubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2FkbWluLXBhZ2UvYWRtaW4tcGFnZS5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvYWRtaW4tcGFnZS9jb25maWctdGFiL2FkbWluLWNvbmZpZy10YWIubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2FkbWluLXBhZ2Uvam9icy10YWIvYWRtaW4tam9icy10YWIubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2FkbWluLXBhZ2UvbWlzYy10YWIvYWRtaW4tbWlzYy10YWIubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2FkbWluLXBhZ2Uvcm9sZXMtdGFiL2FkbWluLXJvbGVzLXRhYi5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvYWRtaW4tcGFnZS9yb2xlcy10YWIvcm9sZXMtZ3JhcGgvcm9sZS1ncmFwaC5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvY29sbGVjdGlvbi1wbGF5ZXItcGFnZS9jb2xsZWN0aW9uLWZvb3Rlci9jb2xsZWN0aW9uLWZvb3Rlci5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvY29sbGVjdGlvbi1wbGF5ZXItcGFnZS9jb2xsZWN0aW9uLWxvY2FsLW5hdi9jb2xsZWN0aW9uLWxvY2FsLW5hdi5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvY29sbGVjdGlvbi1wbGF5ZXItcGFnZS9jb2xsZWN0aW9uLW5vZGUtbGlzdC9jb2xsZWN0aW9uLW5vZGUtbGlzdC5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvY29sbGVjdGlvbi1wbGF5ZXItcGFnZS9jb2xsZWN0aW9uLXBsYXllci1wYWdlLm1vZHVsZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9jcmVhdG9yLWRhc2hib2FyZC1wYWdlL2NyZWF0b3ItZGFzaGJvYXJkLXBhZ2UubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2RvbmF0ZS1wYWdlL2RvbmF0ZS1wYWdlLm1vZHVsZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9lbWFpbC1kYXNoYm9hcmQtcGFnZS9lbWFpbC1kYXNoYm9hcmQtcGFnZS5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvZW1haWwtZGFzaGJvYXJkLXBhZ2UvZW1haWwtZGFzaGJvYXJkLXJlc3VsdC9lbWFpbC1kYXNoYm9hcmQtcmVzdWx0Lm1vZHVsZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9lcnJvci1wYWdlL2Vycm9yLXBhZ2UubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2V4cGxvcmF0aW9uLWVkaXRvci1wYWdlL2VkaXRvci1uYXZiYXItYnJlYWRjcnVtYi9lZGl0b3ItbmF2YmFyLWJyZWFkY3J1bWIubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2V4cGxvcmF0aW9uLWVkaXRvci1wYWdlL2VkaXRvci1uYXZpZ2F0aW9uL2VkaXRvci1uYXZpZ2F0aW9uLm1vZHVsZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS1zZXJ2aWNlcy9hbmd1bGFyLW5hbWUvYW5ndWxhci1uYW1lLnNlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvZXhwbG9yYXRpb24tZWRpdG9yLXBhZ2UvZXhwbG9yYXRpb24tZWRpdG9yLXBhZ2UubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2V4cGxvcmF0aW9uLWVkaXRvci1wYWdlL2V4cGxvcmF0aW9uLWVkaXRvci10YWIvZXhwbG9yYXRpb24tZWRpdG9yLXRhYi5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvZXhwbG9yYXRpb24tZWRpdG9yLXBhZ2UvZXhwbG9yYXRpb24tZWRpdG9yLXRhYi9leHBsb3JhdGlvbi1ncmFwaC9leHBsb3JhdGlvbi1ncmFwaC5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvZXhwbG9yYXRpb24tZWRpdG9yLXBhZ2UvZXhwbG9yYXRpb24tZWRpdG9yLXRhYi9zdGF0ZS1ncmFwaC12aXN1YWxpemF0aW9uL3N0YXRlLWdyYXBoLXZpc3VhbGl6YXRpb24ubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2V4cGxvcmF0aW9uLWVkaXRvci1wYWdlL2V4cGxvcmF0aW9uLWVkaXRvci10YWIvc3RhdGUtbmFtZS1lZGl0b3Ivc3RhdGUtbmFtZS1lZGl0b3IubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2V4cGxvcmF0aW9uLWVkaXRvci1wYWdlL2V4cGxvcmF0aW9uLWVkaXRvci10YWIvc3RhdGUtcGFyYW0tY2hhbmdlcy1lZGl0b3Ivc3RhdGUtcGFyYW0tY2hhbmdlcy1lZGl0b3IubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2V4cGxvcmF0aW9uLWVkaXRvci1wYWdlL2V4cGxvcmF0aW9uLWVkaXRvci10YWIvdGVzdC1pbnRlcmFjdGlvbi1wYW5lbC90ZXN0LWludGVyYWN0aW9uLXBhbmVsLm1vZHVsZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS9leHBsb3JhdGlvbi1lZGl0b3ItdGFiL3RyYWluaW5nLXBhbmVsL3RyYWluaW5nLXBhbmVsLm1vZHVsZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS9leHBsb3JhdGlvbi1lZGl0b3ItdGFiL3VucmVzb2x2ZWQtYW5zd2Vycy1vdmVydmlldy91bnJlc29sdmVkLWFuc3dlcnMtb3ZlcnZpZXcubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2V4cGxvcmF0aW9uLWVkaXRvci1wYWdlL2V4cGxvcmF0aW9uLW9iamVjdGl2ZS1lZGl0b3IvZXhwbG9yYXRpb24tb2JqZWN0aXZlLWVkaXRvci5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvZXhwbG9yYXRpb24tZWRpdG9yLXBhZ2UvZXhwbG9yYXRpb24tc2F2ZS1hbmQtcHVibGlzaC1idXR0b25zL2V4cGxvcmF0aW9uLXNhdmUtYW5kLXB1Ymxpc2gtYnV0dG9ucy5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvZXhwbG9yYXRpb24tZWRpdG9yLXBhZ2UvZXhwbG9yYXRpb24tdGl0bGUtZWRpdG9yL2V4cGxvcmF0aW9uLXRpdGxlLWVkaXRvci5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvZXhwbG9yYXRpb24tZWRpdG9yLXBhZ2UvZmVlZGJhY2stdGFiL2ZlZWRiYWNrLXRhYi5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvZXhwbG9yYXRpb24tZWRpdG9yLXBhZ2UvZmVlZGJhY2stdGFiL3RocmVhZC10YWJsZS90aHJlYWQtdGFibGUubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2V4cGxvcmF0aW9uLWVkaXRvci1wYWdlL2hpc3RvcnktdGFiL2hpc3RvcnktdGFiLm1vZHVsZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS9pbXByb3ZlbWVudHMtdGFiL2ltcHJvdmVtZW50cy10YWIubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2V4cGxvcmF0aW9uLWVkaXRvci1wYWdlL2ltcHJvdmVtZW50cy10YWIvcGxheXRocm91Z2gtaW1wcm92ZW1lbnQtY2FyZC9wbGF5dGhyb3VnaC1pbXByb3ZlbWVudC1jYXJkLm1vZHVsZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS9tYXJrLWFsbC1hdWRpby1hbmQtdHJhbnNsYXRpb25zLWFzLW5lZWRpbmctdXBkYXRlL21hcmstYWxsLWF1ZGlvLWFuZC10cmFuc2xhdGlvbnMtYXMtbmVlZGluZy11cGRhdGUubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2V4cGxvcmF0aW9uLWVkaXRvci1wYWdlL3BhcmFtLWNoYW5nZXMtZWRpdG9yL3BhcmFtLWNoYW5nZXMtZWRpdG9yLm1vZHVsZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS9wcmV2aWV3LXRhYi9wcmV2aWV3LXRhYi5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvZXhwbG9yYXRpb24tZWRpdG9yLXBhZ2Uvc2V0dGluZ3MtdGFiL3NldHRpbmdzLXRhYi5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvZXhwbG9yYXRpb24tZWRpdG9yLXBhZ2Uvc3RhdGlzdGljcy10YWIvYmFyLWNoYXJ0L2Jhci1jaGFydC5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvZXhwbG9yYXRpb24tZWRpdG9yLXBhZ2Uvc3RhdGlzdGljcy10YWIvY3ljbGljLXRyYW5zaXRpb25zLWlzc3VlL2N5Y2xpYy10cmFuc2l0aW9ucy1pc3N1ZS5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvZXhwbG9yYXRpb24tZWRpdG9yLXBhZ2Uvc3RhdGlzdGljcy10YWIvZWFybHktcXVpdC1pc3N1ZS9lYXJseS1xdWl0LWlzc3VlLm1vZHVsZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS9zdGF0aXN0aWNzLXRhYi9tdWx0aXBsZS1pbmNvcnJlY3QtaXNzdWUvbXVsdGlwbGUtaW5jb3JyZWN0LWlzc3VlLm1vZHVsZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS9zdGF0aXN0aWNzLXRhYi9waWUtY2hhcnQvcGllLWNoYXJ0Lm1vZHVsZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS9zdGF0aXN0aWNzLXRhYi9wbGF5dGhyb3VnaC1pc3N1ZXMvcGxheXRocm91Z2gtaXNzdWVzLm1vZHVsZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS9zdGF0aXN0aWNzLXRhYi9zdGF0aXN0aWNzLXRhYi5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvZXhwbG9yYXRpb24tZWRpdG9yLXBhZ2UvdHJhbnNsYXRpb24tdGFiL2F1ZGlvLXRyYW5zbGF0aW9uLWJhci9hdWRpby10cmFuc2xhdGlvbi1iYXIubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2V4cGxvcmF0aW9uLWVkaXRvci1wYWdlL3RyYW5zbGF0aW9uLXRhYi9zdGF0ZS10cmFuc2xhdGlvbi1lZGl0b3Ivc3RhdGUtdHJhbnNsYXRpb24tZWRpdG9yLm1vZHVsZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS90cmFuc2xhdGlvbi10YWIvc3RhdGUtdHJhbnNsYXRpb24tc3RhdHVzLWdyYXBoL3N0YXRlLXRyYW5zbGF0aW9uLXN0YXR1cy1ncmFwaC5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvZXhwbG9yYXRpb24tZWRpdG9yLXBhZ2UvdHJhbnNsYXRpb24tdGFiL3N0YXRlLXRyYW5zbGF0aW9uL3N0YXRlLXRyYW5zbGF0aW9uLm1vZHVsZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS90cmFuc2xhdGlvbi10YWIvdHJhbnNsYXRpb24tdGFiLm1vZHVsZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS90cmFuc2xhdGlvbi10YWIvdHJhbnNsYXRvci1vdmVydmlldy90cmFuc2xhdG9yLW92ZXJ2aWV3Lm1vZHVsZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9leHBsb3JhdGlvbi1lZGl0b3ItcGFnZS92YWx1ZS1nZW5lcmF0b3ItZWRpdG9yL3ZhbHVlLWdlbmVyYXRvci1lZGl0b3IubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL2xlYXJuZXItZGFzaGJvYXJkLXBhZ2UvbGVhcm5lci1kYXNoYm9hcmQtcGFnZS5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvbGlicmFyeS1wYWdlL2FjdGl2aXR5LXRpbGVzLWluZmluaXR5LWdyaWQvYWN0aXZpdHktdGlsZXMtaW5maW5pdHktZ3JpZC5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvbGlicmFyeS1wYWdlL2xpYnJhcnktZm9vdGVyL2xpYnJhcnktZm9vdGVyLm1vZHVsZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9saWJyYXJ5LXBhZ2UvbGlicmFyeS1wYWdlLm1vZHVsZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9saWJyYXJ5LXBhZ2Uvc2VhcmNoLWJhci9zZWFyY2gtYmFyLm1vZHVsZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9saWJyYXJ5LXBhZ2Uvc2VhcmNoLXJlc3VsdHMvc2VhcmNoLXJlc3VsdHMubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL21haW50ZW5hbmNlLXBhZ2UvbWFpbnRlbmFuY2UtcGFnZS5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvbW9kZXJhdG9yLXBhZ2UvbW9kZXJhdG9yLXBhZ2UubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL25vdGlmaWNhdGlvbnMtZGFzaGJvYXJkLXBhZ2Uvbm90aWZpY2F0aW9ucy1kYXNoYm9hcmQtcGFnZS5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvcHJhY3RpY2Utc2Vzc2lvbi1wYWdlL3ByYWN0aWNlLXNlc3Npb24tcGFnZS5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvcHJlZmVyZW5jZXMtcGFnZS9wcmVmZXJlbmNlcy1wYWdlLm1vZHVsZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9wcm9maWxlLXBhZ2UvcHJvZmlsZS1wYWdlLm1vZHVsZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9xdWVzdGlvbi1lZGl0b3ItcGFnZS9xdWVzdGlvbi1lZGl0b3ItcGFnZS5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvcXVlc3Rpb24tcGxheWVyLXBhZ2UvcXVlc3Rpb24tcGxheWVyLXBhZ2UubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL3F1ZXN0aW9ucy1saXN0LXBhZ2UvcXVlc3Rpb25zLWxpc3QtcGFnZS5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvc2hvdy1zdWdnZXN0aW9uLWVkaXRvci1wYWdlcy9zaG93LXN1Z2dlc3Rpb24tbW9kYWwtZm9yLWNyZWF0b3Itdmlldy9zaG93LXN1Z2dlc3Rpb24tbW9kYWwtZm9yLWNyZWF0b3Itdmlldy5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvc2hvdy1zdWdnZXN0aW9uLWVkaXRvci1wYWdlcy9zaG93LXN1Z2dlc3Rpb24tbW9kYWwtZm9yLWVkaXRvci12aWV3L3Nob3ctc3VnZ2VzdGlvbi1tb2RhbC1mb3ItZWRpdG9yLXZpZXcubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL3Nob3ctc3VnZ2VzdGlvbi1lZGl0b3ItcGFnZXMvc2hvdy1zdWdnZXN0aW9uLW1vZGFsLWZvci1sZWFybmVyLWxvY2FsLXZpZXcvc2hvdy1zdWdnZXN0aW9uLW1vZGFsLWZvci1sZWFybmVyLWxvY2FsLXZpZXcubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL3Nob3ctc3VnZ2VzdGlvbi1lZGl0b3ItcGFnZXMvc2hvdy1zdWdnZXN0aW9uLW1vZGFsLWZvci1sZWFybmVyLXZpZXcvc2hvdy1zdWdnZXN0aW9uLW1vZGFsLWZvci1sZWFybmVyLXZpZXcubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL3Nob3ctc3VnZ2VzdGlvbi1lZGl0b3ItcGFnZXMvc3VnZ2VzdGlvbi1tb2RhbC5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvc2lnbnVwLXBhZ2Uvc2lnbnVwLXBhZ2UubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL3NraWxsLWVkaXRvci1wYWdlL3NraWxsLWVkaXRvci1tYWluLXRhYi9za2lsbC1jb25jZXB0LWNhcmQtZWRpdG9yL3NraWxsLWNvbmNlcHQtY2FyZC1lZGl0b3IubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL3NraWxsLWVkaXRvci1wYWdlL3NraWxsLWVkaXRvci1tYWluLXRhYi9za2lsbC1jb25jZXB0LWNhcmQtZWRpdG9yL3dvcmtlZC1leGFtcGxlLWVkaXRvci93b3JrZWQtZXhhbXBsZS1lZGl0b3IubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL3NraWxsLWVkaXRvci1wYWdlL3NraWxsLWVkaXRvci1tYWluLXRhYi9za2lsbC1kZXNjcmlwdGlvbi1lZGl0b3Ivc2tpbGwtZGVzY3JpcHRpb24tZWRpdG9yLm1vZHVsZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9za2lsbC1lZGl0b3ItcGFnZS9za2lsbC1lZGl0b3ItbWFpbi10YWIvc2tpbGwtZWRpdG9yLW1haW4tdGFiLm1vZHVsZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9za2lsbC1lZGl0b3ItcGFnZS9za2lsbC1lZGl0b3ItbWFpbi10YWIvc2tpbGwtbWlzY29uY2VwdGlvbnMtZWRpdG9yL21pc2NvbmNlcHRpb24tZWRpdG9yL21pc2NvbmNlcHRpb24tZWRpdG9yLm1vZHVsZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9za2lsbC1lZGl0b3ItcGFnZS9za2lsbC1lZGl0b3ItbWFpbi10YWIvc2tpbGwtbWlzY29uY2VwdGlvbnMtZWRpdG9yL3NraWxsLW1pc2NvbmNlcHRpb25zLWVkaXRvci5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvc2tpbGwtZWRpdG9yLXBhZ2Uvc2tpbGwtZWRpdG9yLW5hdmJhci1icmVhZGNydW1iL3NraWxsLWVkaXRvci1uYXZiYXItYnJlYWRjcnVtYi5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvc2tpbGwtZWRpdG9yLXBhZ2Uvc2tpbGwtZWRpdG9yLW5hdmJhci9za2lsbC1lZGl0b3ItbmF2YmFyLm1vZHVsZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9za2lsbC1lZGl0b3ItcGFnZS9za2lsbC1lZGl0b3ItcGFnZS5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvc2tpbGwtZWRpdG9yLXBhZ2Uvc2tpbGwtZWRpdG9yLXF1ZXN0aW9ucy10YWIvc2tpbGwtZWRpdG9yLXF1ZXN0aW9ucy10YWIubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL3NwbGFzaC1wYWdlL3NwbGFzaC1wYWdlLm1vZHVsZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9zdGF0ZS1lZGl0b3Ivc3RhdGUtY29udGVudC1lZGl0b3Ivc3RhdGUtY29udGVudC1lZGl0b3IubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL3N0YXRlLWVkaXRvci9zdGF0ZS1lZGl0b3IubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL3N0YXRlLWVkaXRvci9zdGF0ZS1oaW50cy1lZGl0b3Ivc3RhdGUtaGludHMtZWRpdG9yLm1vZHVsZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9zdGF0ZS1lZGl0b3Ivc3RhdGUtaW50ZXJhY3Rpb24tZWRpdG9yL3N0YXRlLWludGVyYWN0aW9uLWVkaXRvci5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvc3RhdGUtZWRpdG9yL3N0YXRlLXJlc3BvbnNlcy9zdGF0ZS1yZXNwb25zZXMubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL3N0YXRlLWVkaXRvci9zdGF0ZS1zb2x1dGlvbi1lZGl0b3Ivc3RhdGUtc29sdXRpb24tZWRpdG9yLm1vZHVsZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy9zdG9yeS1lZGl0b3ItcGFnZS9tYWluLXN0b3J5LWVkaXRvci9tYWluLXN0b3J5LWVkaXRvci5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvc3RvcnktZWRpdG9yLXBhZ2UvbWFpbi1zdG9yeS1lZGl0b3Ivc3Rvcnktbm9kZS1lZGl0b3Ivc3Rvcnktbm9kZS1lZGl0b3IubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL3N0b3J5LWVkaXRvci1wYWdlL3N0b3J5LWVkaXRvci1uYXZiYXItYnJlYWRjcnVtYi9zdG9yeS1lZGl0b3ItbmF2YmFyLWJyZWFkY3J1bWIubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL3N0b3J5LWVkaXRvci1wYWdlL3N0b3J5LWVkaXRvci1uYXZiYXIvc3RvcnktZWRpdG9yLW5hdmJhci5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvc3RvcnktZWRpdG9yLXBhZ2Uvc3RvcnktZWRpdG9yLXBhZ2UubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL3RlYWNoLXBhZ2UvdGVhY2gtcGFnZS5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvdGhhbmtzLXBhZ2UvdGhhbmtzLXBhZ2UubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL3RvcGljLWVkaXRvci1wYWdlL21haW4tdG9waWMtZWRpdG9yL21haW4tdG9waWMtZWRpdG9yLXN0b3JpZXMtbGlzdC9tYWluLXRvcGljLWVkaXRvci1zdG9yaWVzLWxpc3QubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL3RvcGljLWVkaXRvci1wYWdlL21haW4tdG9waWMtZWRpdG9yL21haW4tdG9waWMtZWRpdG9yLm1vZHVsZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy90b3BpYy1lZGl0b3ItcGFnZS9xdWVzdGlvbnMtdGFiL3F1ZXN0aW9ucy10YWIubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL3RvcGljLWVkaXRvci1wYWdlL3N1YnRvcGljcy1saXN0LXRhYi9zdWJ0b3BpY3MtbGlzdC10YWIubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL3RvcGljLWVkaXRvci1wYWdlL3RvcGljLWVkaXRvci1uYXZiYXItYnJlYWRjcnVtYi90b3BpYy1lZGl0b3ItbmF2YmFyLWJyZWFkY3J1bWIubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL3RvcGljLWVkaXRvci1wYWdlL3RvcGljLWVkaXRvci1uYXZiYXIvdG9waWMtZWRpdG9yLW5hdmJhci5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvdG9waWMtZWRpdG9yLXBhZ2UvdG9waWMtZWRpdG9yLXBhZ2UubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL3RvcGljLWxhbmRpbmctcGFnZS90b3BpYy1sYW5kaW5nLXBhZ2Utc3Rld2FyZHMvdG9waWMtbGFuZGluZy1wYWdlLXN0ZXdhcmRzLm1vZHVsZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy90b3BpYy1sYW5kaW5nLXBhZ2UvdG9waWMtbGFuZGluZy1wYWdlLm1vZHVsZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy90b3BpYy12aWV3ZXItcGFnZS9zdG9yaWVzLWxpc3Qvc3Rvcmllcy1saXN0Lm1vZHVsZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy90b3BpYy12aWV3ZXItcGFnZS90b3BpYy12aWV3ZXItbmF2YmFyLWJyZWFkY3J1bWIvdG9waWMtdmlld2VyLW5hdmJhci1icmVhZGNydW1iLm1vZHVsZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy90b3BpYy12aWV3ZXItcGFnZS90b3BpYy12aWV3ZXItcGFnZS5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvdG9waWNzLWFuZC1za2lsbHMtZGFzaGJvYXJkLXBhZ2Uvc2VsZWN0LXRvcGljcy9zZWxlY3QtdG9waWNzLm1vZHVsZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy90b3BpY3MtYW5kLXNraWxscy1kYXNoYm9hcmQtcGFnZS9za2lsbHMtbGlzdC9za2lsbHMtbGlzdC5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvcGFnZXMvdG9waWNzLWFuZC1za2lsbHMtZGFzaGJvYXJkLXBhZ2UvdG9waWNzLWFuZC1za2lsbHMtZGFzaGJvYXJkLXBhZ2UtbmF2YmFyLWJyZWFkY3J1bWIvdG9waWNzLWFuZC1za2lsbHMtZGFzaGJvYXJkLXBhZ2UtbmF2YmFyLWJyZWFkY3J1bWIubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL3RvcGljcy1hbmQtc2tpbGxzLWRhc2hib2FyZC1wYWdlL3RvcGljcy1hbmQtc2tpbGxzLWRhc2hib2FyZC1wYWdlLW5hdmJhci90b3BpY3MtYW5kLXNraWxscy1kYXNoYm9hcmQtcGFnZS1uYXZiYXIubW9kdWxlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3BhZ2VzL3RvcGljcy1hbmQtc2tpbGxzLWRhc2hib2FyZC1wYWdlL3RvcGljcy1hbmQtc2tpbGxzLWRhc2hib2FyZC1wYWdlLm1vZHVsZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9wYWdlcy90b3BpY3MtYW5kLXNraWxscy1kYXNoYm9hcmQtcGFnZS90b3BpY3MtbGlzdC90b3BpY3MtbGlzdC5tb2R1bGUudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvc2VydmljZXMvQ29uc3RydWN0VHJhbnNsYXRpb25JZHNTZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3NlcnZpY2VzL0RhdGVUaW1lRm9ybWF0U2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9zZXJ2aWNlcy9EZWJvdW5jZXJTZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3NlcnZpY2VzL05hdmlnYXRpb25TZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3NlcnZpY2VzL1Byb21vQmFyU2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9zZXJ2aWNlcy9SdGVIZWxwZXJTZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL3NlcnZpY2VzL1N0YXRlUnVsZXNTdGF0c1NlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvc2VydmljZXMvVHJhbnNsYXRpb25GaWxlSGFzaExvYWRlclNlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvc2VydmljZXMvVXNlclNlcnZpY2UudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvc2VydmljZXMvY29udGV4dHVhbC9XaW5kb3dEaW1lbnNpb25zU2VydmljZS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9zZXJ2aWNlcy9zdGF0ZWZ1bC9CYWNrZ3JvdW5kTWFza1NlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNsR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQyxnTkFDNEI7QUFDcEMsbUJBQU8sQ0FBQyxvTkFDNkI7QUFDckMsbUJBQU8sQ0FBQyxzSEFBMkM7QUFDbkQsbUJBQU8sQ0FBQyxzR0FBbUM7QUFDM0MsbUJBQU8sQ0FBQyxvR0FBa0M7QUFDMUMsbUJBQU8sQ0FBQyxrRkFBeUI7QUFDakM7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckIsZ0NBQWdDO0FBQ2hDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHlCQUF5QjtBQUN6QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUNBQXlDO0FBQ3pDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNkJBQTZCLDJCQUEyQixFQUFFO0FBQzFEO0FBQ0EsNkJBQTZCO0FBQzdCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDckhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQywwSEFBNkM7QUFDckQ7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckIsZ0NBQWdDO0FBQ2hDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLHNGQUEyQjtBQUNuQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckI7QUFDQTtBQUNBO0FBQ0EsS0FBSzs7Ozs7Ozs7Ozs7O0FDcERMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLDBIQUE2QztBQUNyRCxtQkFBTyxDQUFDLDBGQUE2QjtBQUNyQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCLGdDQUFnQztBQUNoQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFPLENBQUMsMEhBQTZDO0FBQ3JEO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCLGdDQUFnQztBQUNoQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQyxnSEFBd0M7QUFDaEQsbUJBQU8sQ0FBQywwSEFBNkM7QUFDckQsbUJBQU8sQ0FBQyw0RkFBOEI7QUFDdEMsbUJBQU8sQ0FBQyw4RkFBK0I7QUFDdkMsbUJBQU8sQ0FBQyxvR0FBa0M7QUFDMUMsbUJBQU8sQ0FBQyxrRkFBeUI7QUFDakMsbUJBQU8sQ0FBQyxvSEFBMEM7QUFDbEQsbUJBQU8sQ0FBQyxnSUFBZ0Q7QUFDeEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckIsZ0NBQWdDO0FBQ2hDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw2QkFBNkI7QUFDN0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw2QkFBNkI7QUFDN0I7QUFDQSxxQkFBcUI7QUFDckI7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQ0FBaUM7QUFDakM7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5QkFBeUI7QUFDekI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLCtCQUErQixPQUFPO0FBQ3RDLCtCQUErQixPQUFPO0FBQ3RDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLCtCQUErQixPQUFPO0FBQ3RDLCtCQUErQixPQUFPO0FBQ3RDO0FBQ0EsK0JBQStCLE9BQU87QUFDdEM7QUFDQTtBQUNBO0FBQ0EsNkRBQTZELGNBQWM7QUFDM0U7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1DQUFtQywrQkFBK0I7QUFDbEU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwyQ0FBMkMsK0JBQStCO0FBQzFFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQ0FBaUM7QUFDakM7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1Q0FBdUMsaUJBQWlCO0FBQ3hEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkNBQTJDLCtCQUErQjtBQUMxRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckI7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDalJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLDBIQUE2QztBQUNyRCxtQkFBTyxDQUFDLHNGQUEyQjtBQUNuQyxtQkFBTyxDQUFDLG9HQUFrQztBQUMxQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esc0VBQXNFO0FBQ3RFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5QkFBeUI7QUFDekIscUJBQXFCO0FBQ3JCLGlCQUFpQjtBQUNqQjtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDbERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQywwSEFBNkM7QUFDckQsbUJBQU8sQ0FBQyxzRkFBMkI7QUFDbkMsbUJBQU8sQ0FBQyxvR0FBa0M7QUFDMUM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDhEQUE4RDtBQUM5RDtBQUNBO0FBQ0E7QUFDQTtBQUNBLHlCQUF5QjtBQUN6QixxQkFBcUI7QUFDckI7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQixhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNERBQTREO0FBQzVEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUJBQXlCO0FBQ3pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQSx5QkFBeUI7QUFDekIscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckIsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUMzR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFPLENBQUMsZ0lBQWdEO0FBQ3hEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUM5REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSzs7Ozs7Ozs7Ozs7O0FDbEVMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDbkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDOzs7Ozs7Ozs7Ozs7QUNsQ0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDOzs7Ozs7Ozs7Ozs7QUM5QkQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQSxDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0EsQ0FBQzs7Ozs7Ozs7Ozs7O0FDekNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7Ozs7Ozs7Ozs7OztBQ3pCTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUM7Ozs7Ozs7Ozs7OztBQzdERDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDOzs7Ozs7Ozs7Ozs7QUM1QkQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUM7Ozs7Ozs7Ozs7OztBQ3RDRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLOzs7Ozs7Ozs7Ozs7QUNsREw7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLOzs7Ozs7Ozs7Ozs7QUNwREw7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0JBQWtCLE9BQU87QUFDekIsa0JBQWtCLE9BQU87QUFDekI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFtQixPQUFPO0FBQzFCLG1CQUFtQixPQUFPO0FBQzFCO0FBQ0EsbUJBQW1CLE9BQU87QUFDMUI7QUFDQTtBQUNBO0FBQ0EsZ0RBQWdELGNBQWM7QUFDOUQ7QUFDQTtBQUNBO0FBQ0EsMkJBQTJCLHlCQUF5QjtBQUNwRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSzs7Ozs7Ozs7Ozs7O0FDdkZMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw2REFBNkQ7QUFDN0Q7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2IsU0FBUztBQUNUO0FBQ0E7QUFDQSwyQkFBMkIsa0JBQWtCO0FBQzdDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwrQkFBK0I7QUFDL0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDZCQUE2QjtBQUM3QjtBQUNBLDJDQUEyQyxrQ0FBa0M7QUFDN0U7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUNBQWlDO0FBQ2pDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsK0NBQStDLHdDQUF3QztBQUN2RjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUN6SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBTyxDQUFDLDBPQUNrQztBQUMxQyxtQkFBTyxDQUFDLGtKQUF5RDtBQUNqRSxtQkFBTyxDQUFDLHdGQUE0QjtBQUNwQyxtQkFBTyxDQUFDLGtIQUF5QztBQUNqRCxtQkFBTyxDQUFDLDBIQUE2QztBQUNyRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1QkFBdUIsUUFBUTtBQUMvQix3QkFBd0IsUUFBUTtBQUNoQztBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBLHVCQUF1QixRQUFRO0FBQy9CO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNkJBQTZCO0FBQzdCO0FBQ0EseUJBQXlCO0FBQ3pCO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUM1RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQixhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrREFBa0Qsd0JBQXdCO0FBQzFFO0FBQ0EsaUJBQWlCO0FBQ2pCLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDcEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYixTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSzs7Ozs7Ozs7Ozs7O0FDcENMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiYWRtaW5+YXBwLmJ1bmRsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE1IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgVHJhbnNsYXRpb24gZnVuY3Rpb25zIGZvciBPcHBpYS5cbiAqXG4gKiBAYXV0aG9yIG1pbGFncm8udGVydWVsQGdtYWlsLmNvbSAoTWlsYWdybyBUZXJ1ZWwpXG4gKi9cbi8vIFRyYW5zbGF0aW9ucyBvZiBzdHJpbmdzIHRoYXQgYXJlIGxvYWRlZCBpbiB0aGUgZnJvbnQgcGFnZS4gVGhleSBhcmUgbGlzdGVkXG4vLyBoZXJlIHRvIGJlIGxvYWRlZCBzeW5jaHJvbm91c2x5IHdpdGggdGhlIHNjcmlwdCB0byBwcmV2ZW50IGEgRk9VQyBvclxuLy8gRmxhc2ggb2YgVW50cmFuc2xhdGVkIENvbnRlbnQuXG4vLyBTZWUgaHR0cDovL2FuZ3VsYXItdHJhbnNsYXRlLmdpdGh1Yi5pby9kb2NzLyMvZ3VpZGUvMTJfYXN5bmNocm9ub3VzLWxvYWRpbmdcbm9wcGlhLmNvbnN0YW50KCdERUZBVUxUX1RSQU5TTEFUSU9OUycsIHtcbiAgICBJMThOX0xJQlJBUllfUEFHRV9USVRMRTogJ0xpYnJhcnknLFxuICAgIEkxOE5fTElCUkFSWV9MT0FESU5HOiAnTG9hZGluZycsXG4gICAgSTE4Tl9TSUdOVVBfUEFHRV9TVUJUSVRMRTogJ1JlZ2lzdHJhdGlvbicsXG4gICAgSTE4Tl9TSUdOVVBfUEFHRV9USVRMRTogJ09wcGlhJyxcbiAgICBJMThOX0xJQlJBUllfU0VBUkNIX1BMQUNFSE9MREVSOiAnV2hhdCBhcmUgeW91IGN1cmlvdXMgYWJvdXQ/JyxcbiAgICBJMThOX0xJQlJBUllfQUxMX0xBTkdVQUdFUzogJ0FsbCBMYW5ndWFnZXMnLFxuICAgIEkxOE5fTElCUkFSWV9MQU5HVUFHRVNfRU46ICdFbmdsaXNoJyxcbiAgICBJMThOX0xJQlJBUllfQUxMX0NBVEVHT1JJRVM6ICdBbGwgQ2F0ZWdvcmllcycsXG4gICAgSTE4Tl9UT1BOQVZfU0lHTl9JTjogJ1NpZ24gaW4nLFxuICAgIEkxOE5fU1BMQVNIX1BBR0VfVElUTEU6ICdPcHBpYTogVGVhY2gsIExlYXJuLCBFeHBsb3JlJyxcbiAgICBJMThOX1NJR05VUF9SRUdJU1RSQVRJT046ICdSZWdpc3RyYXRpb24nLFxuICAgIEkxOE5fU0lHTlVQX0xPQURJTkc6ICdMb2FkaW5nJ1xufSk7XG5vcHBpYS5jb250cm9sbGVyKCdJMThuRm9vdGVyJywgW1xuICAgICckY29va2llcycsICckaHR0cCcsICckcm9vdFNjb3BlJywgJyRzY29wZScsICckdGltZW91dCcsICckdHJhbnNsYXRlJyxcbiAgICAnVXNlclNlcnZpY2UnLFxuICAgIGZ1bmN0aW9uICgkY29va2llcywgJGh0dHAsICRyb290U2NvcGUsICRzY29wZSwgJHRpbWVvdXQsICR0cmFuc2xhdGUsIFVzZXJTZXJ2aWNlKSB7XG4gICAgICAgIC8vIENoYW5nZXMgdGhlIGxhbmd1YWdlIG9mIHRoZSB0cmFuc2xhdGlvbnMuXG4gICAgICAgIHZhciBwcmVmZXJlbmNlc0RhdGFVcmwgPSAnL3ByZWZlcmVuY2VzaGFuZGxlci9kYXRhJztcbiAgICAgICAgdmFyIHNpdGVMYW5ndWFnZVVybCA9ICcvc2F2ZV9zaXRlX2xhbmd1YWdlJztcbiAgICAgICAgJHNjb3BlLnN1cHBvcnRlZFNpdGVMYW5ndWFnZXMgPSBjb25zdGFudHMuU1VQUE9SVEVEX1NJVEVfTEFOR1VBR0VTO1xuICAgICAgICAvLyBUaGUgJHRpbWVvdXQgc2VlbXMgdG8gYmUgbmVjZXNzYXJ5IGZvciB0aGUgZHJvcGRvd24gdG8gc2hvdyBhbnl0aGluZ1xuICAgICAgICAvLyBhdCB0aGUgb3V0c2V0LCBpZiB0aGUgZGVmYXVsdCBsYW5ndWFnZSBpcyBub3QgRW5nbGlzaC5cbiAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy8gJHRyYW5zbGF0ZS51c2UoKSByZXR1cm5zIHVuZGVmaW5lZCB1bnRpbCB0aGUgbGFuZ3VhZ2UgZmlsZSBpcyBmdWxseVxuICAgICAgICAgICAgLy8gbG9hZGVkLCB3aGljaCBjYXVzZXMgYSBibGFuayBmaWVsZCBpbiB0aGUgZHJvcGRvd24sIGhlbmNlIHdlIHVzZVxuICAgICAgICAgICAgLy8gJHRyYW5zbGF0ZS5wcm9wb3NlZExhbmd1YWdlKCkgYXMgc3VnZ2VzdGVkIGluXG4gICAgICAgICAgICAvLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8yODkwMzY1OFxuICAgICAgICAgICAgJHNjb3BlLmN1cnJlbnRMYW5ndWFnZUNvZGUgPSAkdHJhbnNsYXRlLnVzZSgpIHx8XG4gICAgICAgICAgICAgICAgJHRyYW5zbGF0ZS5wcm9wb3NlZExhbmd1YWdlKCk7XG4gICAgICAgIH0sIDUwKTtcbiAgICAgICAgJHNjb3BlLmNoYW5nZUxhbmd1YWdlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHRyYW5zbGF0ZS51c2UoJHNjb3BlLmN1cnJlbnRMYW5ndWFnZUNvZGUpO1xuICAgICAgICAgICAgVXNlclNlcnZpY2UuZ2V0VXNlckluZm9Bc3luYygpLnRoZW4oZnVuY3Rpb24gKHVzZXJJbmZvKSB7XG4gICAgICAgICAgICAgICAgaWYgKHVzZXJJbmZvLmlzTG9nZ2VkSW4oKSkge1xuICAgICAgICAgICAgICAgICAgICAkaHR0cC5wdXQoc2l0ZUxhbmd1YWdlVXJsLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzaXRlX2xhbmd1YWdlX2NvZGU6ICRzY29wZS5jdXJyZW50TGFuZ3VhZ2VDb2RlXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgIH1cbl0pO1xub3BwaWEuY29uZmlnKFtcbiAgICAnJHRyYW5zbGF0ZVByb3ZpZGVyJywgJ0RFRkFVTFRfVFJBTlNMQVRJT05TJyxcbiAgICBmdW5jdGlvbiAoJHRyYW5zbGF0ZVByb3ZpZGVyLCBERUZBVUxUX1RSQU5TTEFUSU9OUykge1xuICAgICAgICB2YXIgYXZhaWxhYmxlTGFuZ3VhZ2VLZXlzID0gW107XG4gICAgICAgIHZhciBhdmFpbGFibGVMYW5ndWFnZUtleXNNYXAgPSB7fTtcbiAgICAgICAgY29uc3RhbnRzLlNVUFBPUlRFRF9TSVRFX0xBTkdVQUdFUy5mb3JFYWNoKGZ1bmN0aW9uIChsYW5ndWFnZSkge1xuICAgICAgICAgICAgYXZhaWxhYmxlTGFuZ3VhZ2VLZXlzLnB1c2gobGFuZ3VhZ2UuaWQpO1xuICAgICAgICAgICAgYXZhaWxhYmxlTGFuZ3VhZ2VLZXlzTWFwW2xhbmd1YWdlLmlkICsgJyonXSA9IGxhbmd1YWdlLmlkO1xuICAgICAgICB9KTtcbiAgICAgICAgYXZhaWxhYmxlTGFuZ3VhZ2VLZXlzTWFwWycqJ10gPSAnZW4nO1xuICAgICAgICAkdHJhbnNsYXRlUHJvdmlkZXJcbiAgICAgICAgICAgIC5yZWdpc3RlckF2YWlsYWJsZUxhbmd1YWdlS2V5cyhhdmFpbGFibGVMYW5ndWFnZUtleXMsIGF2YWlsYWJsZUxhbmd1YWdlS2V5c01hcClcbiAgICAgICAgICAgIC51c2VMb2FkZXIoJ1RyYW5zbGF0aW9uRmlsZUhhc2hMb2FkZXJTZXJ2aWNlJywge1xuICAgICAgICAgICAgcHJlZml4OiAnL2kxOG4vJyxcbiAgICAgICAgICAgIHN1ZmZpeDogJy5qc29uJ1xuICAgICAgICB9KVxuICAgICAgICAgICAgLy8gVGhlIHVzZSBvZiBkZWZhdWx0IHRyYW5zbGF0aW9uIGltcHJvdmVzIHRoZSBsb2FkaW5nIHRpbWUgd2hlbiBFbmdsaXNoXG4gICAgICAgICAgICAvLyBpcyBzZWxlY3RlZFxuICAgICAgICAgICAgLnRyYW5zbGF0aW9ucygnZW4nLCBERUZBVUxUX1RSQU5TTEFUSU9OUylcbiAgICAgICAgICAgIC5mYWxsYmFja0xhbmd1YWdlKCdlbicpXG4gICAgICAgICAgICAuZGV0ZXJtaW5lUHJlZmVycmVkTGFuZ3VhZ2UoKVxuICAgICAgICAgICAgLnVzZUNvb2tpZVN0b3JhZ2UoKVxuICAgICAgICAgICAgLy8gVGhlIG1lc3NhZ2Vmb3JtYXQgaW50ZXJwb2xhdGlvbiBtZXRob2QgaXMgbmVjZXNzYXJ5IGZvciBwbHVyYWxpemF0aW9uLlxuICAgICAgICAgICAgLy8gSXMgb3B0aW9uYWwgYW5kIHNob3VsZCBiZSBwYXNzZWQgYXMgYXJndW1lbnQgdG8gdGhlIHRyYW5zbGF0ZSBjYWxsLiBTZWVcbiAgICAgICAgICAgIC8vIGh0dHBzOi8vYW5ndWxhci10cmFuc2xhdGUuZ2l0aHViLmlvL2RvY3MvIy9ndWlkZS8xNF9wbHVyYWxpemF0aW9uXG4gICAgICAgICAgICAuYWRkSW50ZXJwb2xhdGlvbignJHRyYW5zbGF0ZU1lc3NhZ2VGb3JtYXRJbnRlcnBvbGF0aW9uJylcbiAgICAgICAgICAgIC8vIFRoZSBzdHJhdGVneSAnc2FuaXRpemUnIGRvZXMgbm90IHN1cHBvcnQgdXRmLTggZW5jb2RpbmcuXG4gICAgICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci10cmFuc2xhdGUvYW5ndWxhci10cmFuc2xhdGUvaXNzdWVzLzExMzFcbiAgICAgICAgICAgIC8vIFRoZSBzdHJhdGVneSAnZXNjYXBlJyB3aWxsIGJyYWtlIHN0cmluZ3Mgd2l0aCByYXcgaHRtbCwgbGlrZSBoeXBlcmxpbmtzXG4gICAgICAgICAgICAudXNlU2FuaXRpemVWYWx1ZVN0cmF0ZWd5KCdzYW5pdGl6ZVBhcmFtZXRlcnMnKVxuICAgICAgICAgICAgLmZvcmNlQXN5bmNSZWxvYWQodHJ1ZSk7XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IE1vZHVsZSBmb3IgdGhlIGJ1dHRvbnMgdXNlZCBieSBwYWdlcy5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2J1dHRvbnNEaXJlY3RpdmVzTW9kdWxlJywgWydjcmVhdGVBY3Rpdml0eUJ1dHRvbk1vZHVsZScsXG4gICAgJ2V4cGxvcmF0aW9uRW1iZWRCdXR0b25Nb2R1bGUnLCAnaGludEFuZFNvbHV0aW9uQnV0dG9uc01vZHVsZScsXG4gICAgJ3NvY2lhbEJ1dHRvbnNNb2R1bGUnXG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE2IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciB0aGUgQ3JlYXRlIEV4cGxvcmF0aW9uL0NvbGxlY3Rpb24gYnV0dG9uLlxuICovXG5yZXF1aXJlKCdjb21wb25lbnRzL2VudGl0eS1jcmVhdGlvbi1zZXJ2aWNlcy9jb2xsZWN0aW9uLWNyZWF0aW9uLycgK1xuICAgICdjb2xsZWN0aW9uLWNyZWF0aW9uLnNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ2NvbXBvbmVudHMvZW50aXR5LWNyZWF0aW9uLXNlcnZpY2VzL2V4cGxvcmF0aW9uLWNyZWF0aW9uLycgK1xuICAgICdleHBsb3JhdGlvbi1jcmVhdGlvbi5zZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL0Jyb3dzZXJDaGVja2VyU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvY29udGV4dHVhbC9VcmxTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9TaXRlQW5hbHl0aWNzU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvVXNlclNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdjcmVhdGVBY3Rpdml0eUJ1dHRvbk1vZHVsZScpLmRpcmVjdGl2ZSgnY3JlYXRlQWN0aXZpdHlCdXR0b24nLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgYmluZFRvQ29udHJvbGxlcjoge30sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9jb21wb25lbnRzL2J1dHRvbi1kaXJlY3RpdmVzL2NyZWF0ZS1idXR0b24vJyArXG4gICAgICAgICAgICAgICAgJ2NyZWF0ZS1hY3Rpdml0eS1idXR0b24uZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJyRjdHJsJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICAnJHRpbWVvdXQnLCAnJHdpbmRvdycsICckdWliTW9kYWwnLFxuICAgICAgICAgICAgICAgICdFeHBsb3JhdGlvbkNyZWF0aW9uU2VydmljZScsICdDb2xsZWN0aW9uQ3JlYXRpb25TZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICAnU2l0ZUFuYWx5dGljc1NlcnZpY2UnLCAnVXJsU2VydmljZScsICdVc2VyU2VydmljZScsXG4gICAgICAgICAgICAgICAgJ0FMTE9XX1lBTUxfRklMRV9VUExPQUQnLFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgkdGltZW91dCwgJHdpbmRvdywgJHVpYk1vZGFsLCBFeHBsb3JhdGlvbkNyZWF0aW9uU2VydmljZSwgQ29sbGVjdGlvbkNyZWF0aW9uU2VydmljZSwgU2l0ZUFuYWx5dGljc1NlcnZpY2UsIFVybFNlcnZpY2UsIFVzZXJTZXJ2aWNlLCBBTExPV19ZQU1MX0ZJTEVfVVBMT0FEKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdHJsID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgY3RybC5jcmVhdGlvbkluUHJvZ3Jlc3MgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5hbGxvd1lhbWxGaWxlVXBsb2FkID0gQUxMT1dfWUFNTF9GSUxFX1VQTE9BRDtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5jYW5DcmVhdGVDb2xsZWN0aW9ucyA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwudXNlcklzTG9nZ2VkSW4gPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICBVc2VyU2VydmljZS5nZXRVc2VySW5mb0FzeW5jKCkudGhlbihmdW5jdGlvbiAodXNlckluZm8pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuY2FuQ3JlYXRlQ29sbGVjdGlvbnMgPSB1c2VySW5mby5jYW5DcmVhdGVDb2xsZWN0aW9ucygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC51c2VySXNMb2dnZWRJbiA9IHVzZXJJbmZvLmlzTG9nZ2VkSW4oKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuc2hvd1VwbG9hZEV4cGxvcmF0aW9uTW9kYWwgPSAoRXhwbG9yYXRpb25DcmVhdGlvblNlcnZpY2Uuc2hvd1VwbG9hZEV4cGxvcmF0aW9uTW9kYWwpO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLm9uUmVkaXJlY3RUb0xvZ2luID0gZnVuY3Rpb24gKGRlc3RpbmF0aW9uVXJsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBTaXRlQW5hbHl0aWNzU2VydmljZS5yZWdpc3RlclN0YXJ0TG9naW5FdmVudCgnY3JlYXRlQWN0aXZpdHlCdXR0b24nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkd2luZG93LmxvY2F0aW9uID0gZGVzdGluYXRpb25Vcmw7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LCAxNTApO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmluaXRDcmVhdGlvblByb2Nlc3MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBXaXRob3V0IHRoaXMsIHRoZSBtb2RhbCBrZWVwcyByZW9wZW5pbmcgd2hlbiB0aGUgd2luZG93IGlzXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyByZXNpemVkLlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGN0cmwuY3JlYXRpb25JblByb2dyZXNzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5jcmVhdGlvbkluUHJvZ3Jlc3MgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFjdHJsLmNhbkNyZWF0ZUNvbGxlY3Rpb25zKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgRXhwbG9yYXRpb25DcmVhdGlvblNlcnZpY2UuY3JlYXRlTmV3RXhwbG9yYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKFVybFNlcnZpY2UuZ2V0UGF0aG5hbWUoKSAhPT0gJy9jcmVhdG9yX2Rhc2hib2FyZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkd2luZG93LmxvY2F0aW9uLnJlcGxhY2UoJy9jcmVhdG9yX2Rhc2hib2FyZD9tb2RlPWNyZWF0ZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHVpYk1vZGFsLm9wZW4oe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9wYWdlcy9jcmVhdG9yLWRhc2hib2FyZC1wYWdlLycgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2NyZWF0b3ItZGFzaGJvYXJkLXBhZ2UtdGVtcGxhdGVzLycgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2NyZWF0ZS1hY3Rpdml0eS1tb2RhbC5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYWNrZHJvcDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJyRzY29wZScsICckdWliTW9kYWxJbnN0YW5jZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAoJHNjb3BlLCAkdWliTW9kYWxJbnN0YW5jZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFVzZXJTZXJ2aWNlLmdldFVzZXJJbmZvQXN5bmMoKS50aGVuKGZ1bmN0aW9uICh1c2VySW5mbykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY2FuQ3JlYXRlQ29sbGVjdGlvbnMgPSAodXNlckluZm8uY2FuQ3JlYXRlQ29sbGVjdGlvbnMoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNob29zZUV4cGxvcmF0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBFeHBsb3JhdGlvbkNyZWF0aW9uU2VydmljZS5jcmVhdGVOZXdFeHBsb3JhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdWliTW9kYWxJbnN0YW5jZS5jbG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNob29zZUNvbGxlY3Rpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIENvbGxlY3Rpb25DcmVhdGlvblNlcnZpY2UuY3JlYXRlTmV3Q29sbGVjdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdWliTW9kYWxJbnN0YW5jZS5jbG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNhbmNlbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHVpYk1vZGFsSW5zdGFuY2UuZGlzbWlzcygnY2FuY2VsJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuZXhwbG9yYXRpb25JbWdVcmwgPSAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0U3RhdGljSW1hZ2VVcmwoJy9hY3Rpdml0eS9leHBsb3JhdGlvbi5zdmcnKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNvbGxlY3Rpb25JbWdVcmwgPSAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0U3RhdGljSW1hZ2VVcmwoJy9hY3Rpdml0eS9jb2xsZWN0aW9uLnN2ZycpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93Q2xhc3M6ICdvcHBpYS1jcmVhdGlvbi1tb2RhbCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KS5yZXN1bHQudGhlbihmdW5jdGlvbiAoKSB7IH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5jcmVhdGlvbkluUHJvZ3Jlc3MgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhlIHVzZXIgY2xpY2tlZCBvbiBhICdjcmVhdGUnIGJ1dHRvbiB0byBnZXQgdG8gdGhlIGRhc2hib2FyZCxcbiAgICAgICAgICAgICAgICAgICAgLy8gb3BlbiB0aGUgY3JlYXRlIG1vZGFsIGltbWVkaWF0ZWx5IChvciByZWRpcmVjdCB0byB0aGUgZXhwbG9yYXRpb25cbiAgICAgICAgICAgICAgICAgICAgLy8gZWRpdG9yIGlmIHRoZSBjcmVhdGUgbW9kYWwgZG9lcyBub3QgbmVlZCB0byBiZSBzaG93bikuXG4gICAgICAgICAgICAgICAgICAgIGlmIChVcmxTZXJ2aWNlLmdldFVybFBhcmFtcygpLm1vZGUgPT09ICdjcmVhdGUnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWN0cmwuY2FuQ3JlYXRlQ29sbGVjdGlvbnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBFeHBsb3JhdGlvbkNyZWF0aW9uU2VydmljZS5jcmVhdGVOZXdFeHBsb3JhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5pbml0Q3JlYXRpb25Qcm9jZXNzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IE1vZHVsZSBmb3IgdGhlIENyZWF0ZSBFeHBsb3JhdGlvbi9Db2xsZWN0aW9uIGJ1dHRvbi5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2NyZWF0ZUFjdGl2aXR5QnV0dG9uTW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIGZvciB0aGUgJ2VtYmVkIGV4cGxvcmF0aW9uJyBtb2RhbC5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2V4cGxvcmF0aW9uRW1iZWRCdXR0b25Nb2R1bGUnLCBbXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNyBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgaGludCBhbmQgc29sdXRpb24gYnV0dG9ucy5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2hpbnRBbmRTb2x1dGlvbkJ1dHRvbnNNb2R1bGUnLCBbXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgdGhlIHNvY2lhbCBidXR0b25zIGRpc3BsYXllZCBpbiBmb290ZXIuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdzb2NpYWxCdXR0b25zTW9kdWxlJykuZGlyZWN0aXZlKCdzb2NpYWxCdXR0b25zJywgW1xuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsIGZ1bmN0aW9uIChVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgICAgIGJpbmRUb0NvbnRyb2xsZXI6IHt9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvY29tcG9uZW50cy9idXR0b24tZGlyZWN0aXZlcy9zb2NpYWwtYnV0dG9ucy8nICtcbiAgICAgICAgICAgICAgICAnc29jaWFsLWJ1dHRvbnMuZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJyRjdHJsJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdHJsID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgY3RybC5nZXRTdGF0aWNJbWFnZVVybCA9IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldFN0YXRpY0ltYWdlVXJsO1xuICAgICAgICAgICAgICAgIH1dXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IE1vZHVsZSBmb3IgdGhlIHNvY2lhbCBidXR0b25zLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnc29jaWFsQnV0dG9uc01vZHVsZScsIFtdKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgTW9kdWxlIGZvciB0aGUgQ2tFZGl0b3IgaGVscGVycy5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2NrRWRpdG9ySGVscGVyc01vZHVsZScsIFsnY2tFZGl0b3JSdGVNb2R1bGUnLFxuICAgICdja0VkaXRvcldpZGdldHNNb2R1bGUnXG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE4IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgTW9kdWxlIGZvciB0aGUgTW9kYWwgYW5kIGZ1bmN0aW9uYWxpdHkgZm9yIHRoZSBjcmVhdGUgc3RvcnlcbiAqIGJ1dHRvbi5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2NrRWRpdG9yUnRlTW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBDb2RlIHRvIGR5bmFtaWNhbGx5IGdlbmVyYXRlIENLRWRpdG9yIHdpZGdldHMgZm9yIHRoZSByaWNoXG4gKiB0ZXh0IGNvbXBvbmVudHMuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdja0VkaXRvcldpZGdldHNNb2R1bGUnLCBbXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IE1vZHVsZSBmb3IgdGhlIGNvZGVtaXJyb3IgbWVyZ2V2aWV3IGNvbXBvbmVudC5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2NvZGVtaXJyb3JNZXJnZXZpZXdNb2R1bGUnLCBbXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgQWxlcnQgTWVzc2FnZXNcbiAqL1xucmVxdWlyZSgnc2VydmljZXMvQWxlcnRzU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ2FsZXJ0TWVzc2FnZU1vZHVsZScpLmRpcmVjdGl2ZSgnYWxlcnRNZXNzYWdlJywgW2Z1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge1xuICAgICAgICAgICAgICAgIGdldE1lc3NhZ2U6ICcmbWVzc2FnZU9iamVjdCcsXG4gICAgICAgICAgICAgICAgZ2V0TWVzc2FnZUluZGV4OiAnJm1lc3NhZ2VJbmRleCdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZW1wbGF0ZTogJzxkaXYgY2xhc3M9XCJvcHBpYS1hbGVydC1tZXNzYWdlXCI+PC9kaXY+JyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICAnJHNjb3BlJywgJ0FsZXJ0c1NlcnZpY2UnLCAndG9hc3RyJyxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoJHNjb3BlLCBBbGVydHNTZXJ2aWNlLCB0b2FzdHIpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLkFsZXJ0c1NlcnZpY2UgPSBBbGVydHNTZXJ2aWNlO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUudG9hc3RyID0gdG9hc3RyO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgbWVzc2FnZSA9IHNjb3BlLmdldE1lc3NhZ2UoKTtcbiAgICAgICAgICAgICAgICBpZiAobWVzc2FnZS50eXBlID09PSAnaW5mbycpIHtcbiAgICAgICAgICAgICAgICAgICAgc2NvcGUudG9hc3RyLmluZm8obWVzc2FnZS5jb250ZW50LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aW1lT3V0OiBtZXNzYWdlLnRpbWVvdXQsXG4gICAgICAgICAgICAgICAgICAgICAgICBvbkhpZGRlbjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjb3BlLkFsZXJ0c1NlcnZpY2UuZGVsZXRlTWVzc2FnZShtZXNzYWdlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKG1lc3NhZ2UudHlwZSA9PT0gJ3N1Y2Nlc3MnKSB7XG4gICAgICAgICAgICAgICAgICAgIHNjb3BlLnRvYXN0ci5zdWNjZXNzKG1lc3NhZ2UuY29udGVudCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGltZU91dDogbWVzc2FnZS50aW1lb3V0LFxuICAgICAgICAgICAgICAgICAgICAgICAgb25IaWRkZW46IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY29wZS5BbGVydHNTZXJ2aWNlLmRlbGV0ZU1lc3NhZ2UobWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgQWxlcnQgTWVzc2FnZXNcbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2FsZXJ0TWVzc2FnZU1vZHVsZScsIFtdKTtcbiIsIi8vIENvcHlyaWdodCAyMDE2IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlIGZvciB0aGUgYXR0cmlidXRpb24gZ3VpZGUuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdhdHRyaWJ1dGlvbkd1aWRlTW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTUgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIHRoZSBiYWNrZ3JvdW5kIGJhbm5lci5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2JhY2tncm91bmRCYW5uZXJNb2R1bGUnLCBbXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IE1vZHVsZSBmb3IgdGhlIGNvbW1vbiBsYXlvdXQgZGlyZWN0aXZlcy5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2NvbW1vbkxheW91dERpcmVjdGl2ZXNNb2R1bGUnLCBbJ2FsZXJ0TWVzc2FnZU1vZHVsZScsXG4gICAgJ2F0dHJpYnV0aW9uR3VpZGVNb2R1bGUnLCAnYmFja2dyb3VuZEJhbm5lck1vZHVsZScsXG4gICAgJ2xvYWRpbmdEb3RzTW9kdWxlJywgJ3Byb21vQmFyTW9kdWxlJywgJ3NoYXJpbmdMaW5rc01vZHVsZScsXG4gICAgJ3NpZGVOYXZpZ2F0aW9uQmFyTW9kdWxlJywgJ3RvcE5hdmlnYXRpb25CYXJNb2R1bGUnXG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE2IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgTW9kdWxlIGZvciBkaXNwbGF5aW5nIGFuaW1hdGVkIGxvYWRpbmcgZG90cy5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2xvYWRpbmdEb3RzTW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTcgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIGEgcHJvbW8gYmFyIHRoYXQgYXBwZWFycyBhdCB0aGUgdG9wIG9mIHRoZVxuICogc2NyZWVuLiBUaGUgYmFyIGlzIGNvbmZpZ3VyYWJsZSB3aXRoIGEgbWVzc2FnZSBhbmQgd2hldGhlciB0aGUgcHJvbW8gaXNcbiAqIGRpc21pc3NpYmxlLlxuICovXG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9Qcm9tb0JhclNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdwcm9tb0Jhck1vZHVsZScpLmRpcmVjdGl2ZSgncHJvbW9CYXInLCBbXG4gICAgJ1Byb21vQmFyU2VydmljZScsICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsXG4gICAgZnVuY3Rpb24gKFByb21vQmFyU2VydmljZSwgVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgICAgICBzY29wZToge30sXG4gICAgICAgICAgICBiaW5kVG9Db250cm9sbGVyOiB7fSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXREaXJlY3RpdmVUZW1wbGF0ZVVybCgnL2NvbXBvbmVudHMvY29tbW9uLWxheW91dC1kaXJlY3RpdmVzL3Byb21vLWJhci8nICtcbiAgICAgICAgICAgICAgICAncHJvbW8tYmFyLmRpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICckY3RybCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3RybCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpc1Byb21vRGlzbWlzc2VkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICEhYW5ndWxhci5mcm9tSnNvbihzZXNzaW9uU3RvcmFnZS5wcm9tb0lzRGlzbWlzc2VkKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNldFByb21vRGlzbWlzc2VkID0gZnVuY3Rpb24gKHByb21vSXNEaXNtaXNzZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlc3Npb25TdG9yYWdlLnByb21vSXNEaXNtaXNzZWQgPSBhbmd1bGFyLnRvSnNvbihwcm9tb0lzRGlzbWlzc2VkKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgUHJvbW9CYXJTZXJ2aWNlLmdldFByb21vQmFyRGF0YSgpLnRoZW4oZnVuY3Rpb24gKHByb21vQmFyT2JqZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnByb21vQmFySXNFbmFibGVkID0gcHJvbW9CYXJPYmplY3QucHJvbW9CYXJFbmFibGVkO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5wcm9tb0Jhck1lc3NhZ2UgPSBwcm9tb0Jhck9iamVjdC5wcm9tb0Jhck1lc3NhZ2U7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAvLyBUT0RPKGJoZW5uaW5nKTogVXRpbGl6ZSBjb29raWVzIGZvciB0cmFja2luZyB3aGVuIGEgcHJvbW8gaXNcbiAgICAgICAgICAgICAgICAgICAgLy8gZGlzbWlzc2VkLiBDb29raWVzIGFsbG93IGZvciBhIGxvbmdlci1saXZlZCBtZW1vcnkgb2Ygd2hldGhlciB0aGVcbiAgICAgICAgICAgICAgICAgICAgLy8gcHJvbW8gaXMgZGlzbWlzc2VkLlxuICAgICAgICAgICAgICAgICAgICBjdHJsLnByb21vSXNWaXNpYmxlID0gIWlzUHJvbW9EaXNtaXNzZWQoKTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5kaXNtaXNzUHJvbW8gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnByb21vSXNWaXNpYmxlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRQcm9tb0Rpc21pc3NlZCh0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNyBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgYSBwcm9tbyBiYXIgdGhhdCBhcHBlYXJzIGF0IHRoZSB0b3Agb2YgdGhlXG4gKiBzY3JlZW4uIFRoZSBiYXIgaXMgY29uZmlndXJhYmxlIHdpdGggYSBtZXNzYWdlIGFuZCB3aGV0aGVyIHRoZSBwcm9tbyBpc1xuICogZGlzbWlzc2libGUuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdwcm9tb0Jhck1vZHVsZScsIFtdKTtcbiIsIi8vIENvcHlyaWdodCAyMDE2IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgTW9kdWxlIGZvciB0aGUgU29jaWFsIFNoYXJpbmcgTGlua3MuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdzaGFyaW5nTGlua3NNb2R1bGUnLCBbXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgdGhlIHNpZGUgbmF2aWdhdGlvbiBiYXIuXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbmFuZ3VsYXIubW9kdWxlKCdzaWRlTmF2aWdhdGlvbkJhck1vZHVsZScpLmRpcmVjdGl2ZSgnc2lkZU5hdmlnYXRpb25CYXInLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgYmluZFRvQ29udHJvbGxlcjoge30sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9jb21wb25lbnRzL2NvbW1vbi1sYXlvdXQtZGlyZWN0aXZlcy9zaWRlLW5hdmlnYXRpb24tYmFyLycgK1xuICAgICAgICAgICAgICAgICdzaWRlLW5hdmlnYXRpb24tYmFyLmRpcmVjdGl2ZS5odG1sJyksXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICckY3RybCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbJyR0aW1lb3V0JywgZnVuY3Rpb24gKCR0aW1lb3V0KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdHJsID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgY3RybC5jdXJyZW50VXJsID0gd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmdldFN0YXRpY0ltYWdlVXJsID0gVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0U3RhdGljSW1hZ2VVcmw7XG4gICAgICAgICAgICAgICAgfV1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE2IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgTW9kdWxlIGZvciB0aGUgc2lkZSBuYXZpZ2F0aW9uIGJhci5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ3NpZGVOYXZpZ2F0aW9uQmFyTW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIHRoZSB0b3AgbmF2aWdhdGlvbiBiYXIuIFRoaXMgZXhjbHVkZXMgdGhlIHBhcnRcbiAqIG9mIHRoZSBuYXZiYXIgdGhhdCBpcyB1c2VkIGZvciBsb2NhbCBuYXZpZ2F0aW9uIChzdWNoIGFzIHRoZSB2YXJpb3VzIHRhYnMgaW5cbiAqIHRoZSBlZGl0b3IgcGFnZXMpLlxuICovXG5yZXF1aXJlKCdkb21haW4vc2lkZWJhci9TaWRlYmFyU3RhdHVzU2VydmljZS50cycpO1xucmVxdWlyZSgnZG9tYWluL3V0aWxpdGllcy9VcmxJbnRlcnBvbGF0aW9uU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvRGVib3VuY2VyU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvTmF2aWdhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL1NpdGVBbmFseXRpY3NTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9Vc2VyU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvY29udGV4dHVhbC9EZXZpY2VJbmZvU2VydmljZS50cycpO1xucmVxdWlyZSgnc2VydmljZXMvY29udGV4dHVhbC9XaW5kb3dEaW1lbnNpb25zU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ3RvcE5hdmlnYXRpb25CYXJNb2R1bGUnKS5kaXJlY3RpdmUoJ3RvcE5hdmlnYXRpb25CYXInLCBbXG4gICAgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJywgZnVuY3Rpb24gKFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICAgICAgYmluZFRvQ29udHJvbGxlcjoge30sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9jb21wb25lbnRzL2NvbW1vbi1sYXlvdXQtZGlyZWN0aXZlcy90b3AtbmF2aWdhdGlvbi1iYXIvJyArXG4gICAgICAgICAgICAgICAgJ3RvcC1uYXZpZ2F0aW9uLWJhci5kaXJlY3RpdmUuaHRtbCcpLFxuICAgICAgICAgICAgY29udHJvbGxlckFzOiAnJGN0cmwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgICckc2NvcGUnLCAnJGh0dHAnLCAnJHdpbmRvdycsICckdGltZW91dCcsICckdHJhbnNsYXRlJyxcbiAgICAgICAgICAgICAgICAnU2lkZWJhclN0YXR1c1NlcnZpY2UnLCAnTEFCRUxfRk9SX0NMRUFSSU5HX0ZPQ1VTJywgJ1VzZXJTZXJ2aWNlJyxcbiAgICAgICAgICAgICAgICAnU2l0ZUFuYWx5dGljc1NlcnZpY2UnLCAnTmF2aWdhdGlvblNlcnZpY2UnLCAnV2luZG93RGltZW5zaW9uc1NlcnZpY2UnLFxuICAgICAgICAgICAgICAgICdEZWJvdW5jZXJTZXJ2aWNlJywgJ0RldmljZUluZm9TZXJ2aWNlJywgJ0xPR09VVF9VUkwnLFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgkc2NvcGUsICRodHRwLCAkd2luZG93LCAkdGltZW91dCwgJHRyYW5zbGF0ZSwgU2lkZWJhclN0YXR1c1NlcnZpY2UsIExBQkVMX0ZPUl9DTEVBUklOR19GT0NVUywgVXNlclNlcnZpY2UsIFNpdGVBbmFseXRpY3NTZXJ2aWNlLCBOYXZpZ2F0aW9uU2VydmljZSwgV2luZG93RGltZW5zaW9uc1NlcnZpY2UsIERlYm91bmNlclNlcnZpY2UsIERldmljZUluZm9TZXJ2aWNlLCBMT0dPVVRfVVJMKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdHJsID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgY3RybC5pc01vZGVyYXRvciA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuaXNBZG1pbiA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuaXNUb3BpY01hbmFnZXIgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmlzU3VwZXJBZG1pbiA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwudXNlcklzTG9nZ2VkSW4gPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLnVzZXJuYW1lID0gJyc7XG4gICAgICAgICAgICAgICAgICAgIFVzZXJTZXJ2aWNlLmdldFVzZXJJbmZvQXN5bmMoKS50aGVuKGZ1bmN0aW9uICh1c2VySW5mbykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHVzZXJJbmZvLmdldFByZWZlcnJlZFNpdGVMYW5ndWFnZUNvZGUoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0cmFuc2xhdGUudXNlKHVzZXJJbmZvLmdldFByZWZlcnJlZFNpdGVMYW5ndWFnZUNvZGUoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLmlzTW9kZXJhdG9yID0gdXNlckluZm8uaXNNb2RlcmF0b3IoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuaXNBZG1pbiA9IHVzZXJJbmZvLmlzQWRtaW4oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuaXNUb3BpY01hbmFnZXIgPSB1c2VySW5mby5pc1RvcGljTWFuYWdlcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5pc1N1cGVyQWRtaW4gPSB1c2VySW5mby5pc1N1cGVyQWRtaW4oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwudXNlcklzTG9nZ2VkSW4gPSB1c2VySW5mby5pc0xvZ2dlZEluKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHJsLnVzZXJuYW1lID0gdXNlckluZm8uZ2V0VXNlcm5hbWUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjdHJsLnVzZXJuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5wcm9maWxlUGFnZVVybCA9IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmludGVycG9sYXRlVXJsKCcvcHJvZmlsZS88dXNlcm5hbWU+Jywge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1c2VybmFtZTogY3RybC51c2VybmFtZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGN0cmwudXNlcklzTG9nZ2VkSW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTaG93IHRoZSBudW1iZXIgb2YgdW5zZWVuIG5vdGlmaWNhdGlvbnMgaW4gdGhlIG5hdmJhciBhbmQgcGFnZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRpdGxlLCB1bmxlc3MgdGhlIHVzZXIgaXMgYWxyZWFkeSBvbiB0aGUgZGFzaGJvYXJkIHBhZ2UuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJGh0dHAuZ2V0KCcvbm90aWZpY2F0aW9uc2hhbmRsZXInKS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZGF0YSA9IHJlc3BvbnNlLmRhdGE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lICE9PSAnLycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwubnVtVW5zZWVuTm90aWZpY2F0aW9ucyA9IGRhdGEubnVtX3Vuc2Vlbl9ub3RpZmljYXRpb25zO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGN0cmwubnVtVW5zZWVuTm90aWZpY2F0aW9ucyA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkd2luZG93LmRvY3VtZW50LnRpdGxlID0gKCcoJyArIGN0cmwubnVtVW5zZWVuTm90aWZpY2F0aW9ucyArICcpICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkd2luZG93LmRvY3VtZW50LnRpdGxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgVXNlclNlcnZpY2UuZ2V0UHJvZmlsZUltYWdlRGF0YVVybEFzeW5jKCkudGhlbihmdW5jdGlvbiAoZGF0YVVybCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5wcm9maWxlUGljdHVyZURhdGFVcmwgPSBkYXRhVXJsO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIE5BVl9NT0RFX1NJR05VUCA9ICdzaWdudXAnO1xuICAgICAgICAgICAgICAgICAgICB2YXIgTkFWX01PREVTX1dJVEhfQ1VTVE9NX0xPQ0FMX05BViA9IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICdjcmVhdGUnLCAnZXhwbG9yZScsICdjb2xsZWN0aW9uJywgJ3RvcGljc19hbmRfc2tpbGxzX2Rhc2hib2FyZCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAndG9waWNfZWRpdG9yJywgJ3NraWxsX2VkaXRvcicsICdzdG9yeV9lZGl0b3InXG4gICAgICAgICAgICAgICAgICAgIF07XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuY3VycmVudFVybCA9IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZS5zcGxpdCgnLycpWzFdO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLkxBQkVMX0ZPUl9DTEVBUklOR19GT0NVUyA9IExBQkVMX0ZPUl9DTEVBUklOR19GT0NVUztcbiAgICAgICAgICAgICAgICAgICAgY3RybC5uZXdTdHJ1Y3R1cmVzRW5hYmxlZCA9IGNvbnN0YW50cy5FTkFCTEVfTkVXX1NUUlVDVFVSRV9FRElUT1JTO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmdldFN0YXRpY0ltYWdlVXJsID0gVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0U3RhdGljSW1hZ2VVcmw7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwubG9nb3V0VXJsID0gTE9HT1VUX1VSTDtcbiAgICAgICAgICAgICAgICAgICAgY3RybC51c2VyTWVudUlzU2hvd24gPSAoY3RybC5jdXJyZW50VXJsICE9PSBOQVZfTU9ERV9TSUdOVVApO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLnN0YW5kYXJkTmF2SXNTaG93biA9IChOQVZfTU9ERVNfV0lUSF9DVVNUT01fTE9DQUxfTkFWLmluZGV4T2YoY3RybC5jdXJyZW50VXJsKSA9PT0gLTEpO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLm9uTG9naW5CdXR0b25DbGlja2VkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgU2l0ZUFuYWx5dGljc1NlcnZpY2UucmVnaXN0ZXJTdGFydExvZ2luRXZlbnQoJ2xvZ2luQnV0dG9uJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBVc2VyU2VydmljZS5nZXRMb2dpblVybEFzeW5jKCkudGhlbihmdW5jdGlvbiAobG9naW5VcmwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobG9naW5VcmwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHdpbmRvdy5sb2NhdGlvbiA9IGxvZ2luVXJsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCAxNTApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ0xvZ2luIHVybCBub3QgZm91bmQuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGN0cmwuZ29vZ2xlU2lnbkluSWNvblVybCA9IChVcmxJbnRlcnBvbGF0aW9uU2VydmljZS5nZXRTdGF0aWNJbWFnZVVybCgnL2dvb2dsZV9zaWduaW5fYnV0dG9ucy9nb29nbGVfc2lnbmluLnN2ZycpKTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5vbkxvZ291dEJ1dHRvbkNsaWNrZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkd2luZG93LmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdsYXN0X3VwbG9hZGVkX2F1ZGlvX2xhbmcnKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5BQ1RJT05fT1BFTiA9IE5hdmlnYXRpb25TZXJ2aWNlLkFDVElPTl9PUEVOO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLkFDVElPTl9DTE9TRSA9IE5hdmlnYXRpb25TZXJ2aWNlLkFDVElPTl9DTE9TRTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5LRVlCT0FSRF9FVkVOVF9UT19LRVlfQ09ERVMgPVxuICAgICAgICAgICAgICAgICAgICAgICAgTmF2aWdhdGlvblNlcnZpY2UuS0VZQk9BUkRfRVZFTlRfVE9fS0VZX0NPREVTO1xuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogT3BlbnMgdGhlIHN1Ym1lbnUuXG4gICAgICAgICAgICAgICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBldnRcbiAgICAgICAgICAgICAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IG1lbnVOYW1lIC0gbmFtZSBvZiBtZW51LCBvbiB3aGljaFxuICAgICAgICAgICAgICAgICAgICAgKiBvcGVuL2Nsb3NlIGFjdGlvbiB0byBiZSBwZXJmb3JtZWQgKGFib3V0TWVudSxwcm9maWxlTWVudSkuXG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBjdHJsLm9wZW5TdWJtZW51ID0gZnVuY3Rpb24gKGV2dCwgbWVudU5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZvY3VzIG9uIHRoZSBjdXJyZW50IHRhcmdldCBiZWZvcmUgb3BlbmluZyBpdHMgc3VibWVudS5cbiAgICAgICAgICAgICAgICAgICAgICAgIE5hdmlnYXRpb25TZXJ2aWNlLm9wZW5TdWJtZW51KGV2dCwgbWVudU5hbWUpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmJsdXJOYXZpZ2F0aW9uTGlua3MgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIHJlcXVpcmVkIGJlY2F1c2UgaWYgYWJvdXQgc3VibWVudSBpcyBpbiBvcGVuIHN0YXRlXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBhbmQgd2hlbiB5b3UgaG92ZXIgb24gbGlicmFyeSwgYm90aCB3aWxsIGJlIGhpZ2hsaWdodGVkLFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVG8gYXZvaWQgdGhhdCwgYmx1ciBhbGwgdGhlIGEncyBpbiBuYXYsIHNvIHRoYXQgb25seSBvbmVcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHdpbGwgYmUgaGlnaGxpZ2h0ZWQuXG4gICAgICAgICAgICAgICAgICAgICAgICAkKCduYXYgYScpLmJsdXIoKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5jbG9zZVN1Ym1lbnUgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBOYXZpZ2F0aW9uU2VydmljZS5jbG9zZVN1Ym1lbnUoZXZ0KTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5jbG9zZVN1Ym1lbnVJZk5vdE1vYmlsZSA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChEZXZpY2VJbmZvU2VydmljZS5pc01vYmlsZURldmljZSgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5jbG9zZVN1Ym1lbnUoZXZ0KTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIEhhbmRsZXMga2V5ZG93biBldmVudHMgb24gbWVudXMuXG4gICAgICAgICAgICAgICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBldnRcbiAgICAgICAgICAgICAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IG1lbnVOYW1lIC0gbmFtZSBvZiBtZW51IHRvIHBlcmZvcm0gYWN0aW9uXG4gICAgICAgICAgICAgICAgICAgICAqIG9uKGFib3V0TWVudS9wcm9maWxlTWVudSlcbiAgICAgICAgICAgICAgICAgICAgICogQHBhcmFtIHtvYmplY3R9IGV2ZW50c1RvYmVIYW5kbGVkIC0gTWFwIGtleWJvYXJkIGV2ZW50cygnRW50ZXInKSB0b1xuICAgICAgICAgICAgICAgICAgICAgKiBjb3JyZXNwb25kaW5nIGFjdGlvbnMgdG8gYmUgcGVyZm9ybWVkKG9wZW4vY2xvc2UpLlxuICAgICAgICAgICAgICAgICAgICAgKlxuICAgICAgICAgICAgICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgICAgICAgICAgICAgKiAgb25NZW51S2V5cHJlc3MoJGV2ZW50LCAnYWJvdXRNZW51Jywge2VudGVyOiAnb3Blbid9KVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgY3RybC5vbk1lbnVLZXlwcmVzcyA9IGZ1bmN0aW9uIChldnQsIG1lbnVOYW1lLCBldmVudHNUb2JlSGFuZGxlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgTmF2aWdhdGlvblNlcnZpY2Uub25NZW51S2V5cHJlc3MoZXZ0LCBtZW51TmFtZSwgZXZlbnRzVG9iZUhhbmRsZWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5hY3RpdmVNZW51TmFtZSA9IE5hdmlnYXRpb25TZXJ2aWNlLmFjdGl2ZU1lbnVOYW1lO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAvLyBDbG9zZSB0aGUgc3VibWVudSBpZiBmb2N1cyBvciBjbGljayBvY2N1cnMgYW55d2hlcmUgb3V0c2lkZSBvZlxuICAgICAgICAgICAgICAgICAgICAvLyB0aGUgbWVudSBvciBvdXRzaWRlIG9mIGl0cyBwYXJlbnQgKHdoaWNoIG9wZW5zIHN1Ym1lbnUgb24gaG92ZXIpLlxuICAgICAgICAgICAgICAgICAgICBhbmd1bGFyLmVsZW1lbnQoZG9jdW1lbnQpLm9uKCdjbGljaycsIGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghYW5ndWxhci5lbGVtZW50KGV2dC50YXJnZXQpLmNsb3Nlc3QoJ2xpJykubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5hY3RpdmVNZW51TmFtZSA9ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGN0cmwud2luZG93SXNOYXJyb3cgPSBXaW5kb3dEaW1lbnNpb25zU2VydmljZS5pc1dpbmRvd05hcnJvdygpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3VycmVudFdpbmRvd1dpZHRoID0gV2luZG93RGltZW5zaW9uc1NlcnZpY2UuZ2V0V2lkdGgoKTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC5uYXZFbGVtZW50c1Zpc2liaWxpdHlTdGF0dXMgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgLy8gVGhlIG9yZGVyIG9mIHRoZSBlbGVtZW50cyBpbiB0aGlzIGFycmF5IHNwZWNpZmllcyB0aGUgb3JkZXIgaW5cbiAgICAgICAgICAgICAgICAgICAgLy8gd2hpY2ggdGhleSB3aWxsIGJlIGhpZGRlbi4gRWFybGllciBlbGVtZW50cyB3aWxsIGJlIGhpZGRlbiBmaXJzdC5cbiAgICAgICAgICAgICAgICAgICAgdmFyIE5BVl9FTEVNRU5UU19PUkRFUiA9IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICdJMThOX1RPUE5BVl9ET05BVEUnLCAnSTE4Tl9UT1BOQVZfQUJPVVQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ0kxOE5fQ1JFQVRFX0VYUExPUkFUSU9OX0NSRUFURScsICdJMThOX1RPUE5BVl9MSUJSQVJZJ1xuICAgICAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IE5BVl9FTEVNRU5UU19PUkRFUi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5uYXZFbGVtZW50c1Zpc2liaWxpdHlTdGF0dXNbTkFWX0VMRU1FTlRTX09SREVSW2ldXSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgV2luZG93RGltZW5zaW9uc1NlcnZpY2UucmVnaXN0ZXJPblJlc2l6ZUhvb2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3RybC53aW5kb3dJc05hcnJvdyA9IFdpbmRvd0RpbWVuc2lvbnNTZXJ2aWNlLmlzV2luZG93TmFycm93KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiB3aW5kb3cgaXMgcmVzaXplZCBsYXJnZXIsIHRyeSBkaXNwbGF5aW5nIHRoZSBoaWRkZW4gZWxlbWVudHMuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY3VycmVudFdpbmRvd1dpZHRoIDwgV2luZG93RGltZW5zaW9uc1NlcnZpY2UuZ2V0V2lkdGgoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgTkFWX0VMRU1FTlRTX09SREVSLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghY3RybC5uYXZFbGVtZW50c1Zpc2liaWxpdHlTdGF0dXNbTkFWX0VMRU1FTlRTX09SREVSW2ldXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3RybC5uYXZFbGVtZW50c1Zpc2liaWxpdHlTdGF0dXNbTkFWX0VMRU1FTlRTX09SREVSW2ldXSA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIENsb3NlIHRoZSBzaWRlYmFyLCBpZiBuZWNlc3NhcnkuXG4gICAgICAgICAgICAgICAgICAgICAgICBTaWRlYmFyU3RhdHVzU2VydmljZS5jbG9zZVNpZGViYXIoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0cmwuc2lkZWJhcklzU2hvd24gPSBTaWRlYmFyU3RhdHVzU2VydmljZS5pc1NpZGViYXJTaG93bigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudFdpbmRvd1dpZHRoID0gV2luZG93RGltZW5zaW9uc1NlcnZpY2UuZ2V0V2lkdGgoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRydW5jYXRlTmF2YmFyRGVib3VuY2VkKCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBjdHJsLmlzU2lkZWJhclNob3duID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFNpZGViYXJTdGF0dXNTZXJ2aWNlLmlzU2lkZWJhclNob3duKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbmd1bGFyLmVsZW1lbnQoZG9jdW1lbnQuYm9keSkuYWRkQ2xhc3MoJ29wcGlhLXN0b3Atc2Nyb2xsJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbmd1bGFyLmVsZW1lbnQoZG9jdW1lbnQuYm9keSkucmVtb3ZlQ2xhc3MoJ29wcGlhLXN0b3Atc2Nyb2xsJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gU2lkZWJhclN0YXR1c1NlcnZpY2UuaXNTaWRlYmFyU2hvd24oKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY3RybC50b2dnbGVTaWRlYmFyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgU2lkZWJhclN0YXR1c1NlcnZpY2UudG9nZ2xlU2lkZWJhcigpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICogQ2hlY2tzIGlmIGkxOG4gaGFzIGJlZW4gcnVuLlxuICAgICAgICAgICAgICAgICAgICAgKiBJZiBpMThuIGhhcyBub3QgeWV0IHJ1biwgdGhlIDxhPiBhbmQgPHNwYW4+IHRhZ3Mgd2lsbCBoYXZlXG4gICAgICAgICAgICAgICAgICAgICAqIG5vIHRleHQgY29udGVudCwgc28gdGhlaXIgaW5uZXJUZXh0Lmxlbmd0aCB2YWx1ZSB3aWxsIGJlIDAuXG4gICAgICAgICAgICAgICAgICAgICAqIEByZXR1cm5zIHtib29sZWFufVxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgdmFyIGNoZWNrSWZJMThOQ29tcGxldGVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGkxOG5Db21wbGV0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRhYnMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcub3BwaWEtbmF2YmFyLXRhYi1jb250ZW50Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRhYnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGFic1tpXS5pbm5lclRleHQubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGkxOG5Db21wbGV0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGkxOG5Db21wbGV0ZWQ7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBDaGVja3MgaWYgd2luZG93IGlzID43NjhweCBhbmQgaTE4biBpcyBjb21wbGV0ZWQsIHRoZW4gY2hlY2tzXG4gICAgICAgICAgICAgICAgICAgICAqIGZvciBvdmVyZmxvdy4gSWYgb3ZlcmZsb3cgaXMgZGV0ZWN0ZWQsIGhpZGVzIHRoZSBsZWFzdCBpbXBvcnRhbnRcbiAgICAgICAgICAgICAgICAgICAgICogdGFiIGFuZCB0aGVuIGNhbGxzIGl0c2VsZiBhZ2FpbiBhZnRlciBhIDUwbXMgZGVsYXkuXG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICB2YXIgdHJ1bmNhdGVOYXZiYXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiB0aGUgd2luZG93IGlzIG5hcnJvdywgdGhlIHN0YW5kYXJkIG5hdiB0YWJzIGFyZSBub3Qgc2hvd24uXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoV2luZG93RGltZW5zaW9uc1NlcnZpY2UuaXNXaW5kb3dOYXJyb3coKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIGkxOG4gaGFzbid0IGNvbXBsZXRlZCwgcmV0cnkgYWZ0ZXIgMTAwbXMuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWNoZWNrSWZJMThOQ29tcGxldGVkKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdGltZW91dCh0cnVuY2F0ZU5hdmJhciwgMTAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUaGUgdmFsdWUgb2YgNjBweCB1c2VkIGhlcmUgY29tZXMgZnJvbSBtZWFzdXJpbmcgdGhlIG5vcm1hbFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaGVpZ2h0IG9mIHRoZSBuYXZiYXIgKDU2cHgpIGluIENocm9tZSdzIGluc3BlY3RvciBhbmQgcm91bmRpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHVwLiBJZiB0aGUgaGVpZ2h0IG9mIHRoZSBuYXZiYXIgaXMgY2hhbmdlZCBpbiB0aGUgZnV0dXJlIHRoaXNcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHdpbGwgbmVlZCB0byBiZSB1cGRhdGVkLlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2Rpdi5jb2xsYXBzZS5uYXZiYXItY29sbGFwc2UnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5jbGllbnRIZWlnaHQgPiA2MCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgTkFWX0VMRU1FTlRTX09SREVSLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjdHJsLm5hdkVsZW1lbnRzVmlzaWJpbGl0eVN0YXR1c1tOQVZfRUxFTUVOVFNfT1JERVJbaV1dKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBIaWRlIG9uZSBlbGVtZW50LCB0aGVuIGNoZWNrIGFnYWluIGFmdGVyIDUwbXMuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUaGlzIGdpdmVzIHRoZSBicm93c2VyIHRpbWUgdG8gcmVuZGVyIHRoZSB2aXNpYmlsaXR5XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjaGFuZ2UuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHJsLm5hdkVsZW1lbnRzVmlzaWJpbGl0eVN0YXR1c1tOQVZfRUxFTUVOVFNfT1JERVJbaV1dID1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZvcmNlIGEgZGlnZXN0IGN5Y2xlIHRvIGhpZGUgZWxlbWVudCBpbW1lZGlhdGVseS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE90aGVyd2lzZSBpdCB3b3VsZCBiZSBoaWRkZW4gYWZ0ZXIgdGhlIG5leHQgY2FsbC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoaXMgaXMgZHVlIHRvIHNldFRpbWVvdXQgdXNlIGluIGRlYm91bmNlLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHRpbWVvdXQodHJ1bmNhdGVOYXZiYXIsIDUwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRydW5jYXRlTmF2YmFyRGVib3VuY2VkID0gRGVib3VuY2VyU2VydmljZS5kZWJvdW5jZSh0cnVuY2F0ZU5hdmJhciwgNTAwKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gVGhlIGZ1bmN0aW9uIG5lZWRzIHRvIGJlIHJ1biBhZnRlciBpMThuLiBBIHRpbWVvdXQgb2YgMCBhcHBlYXJzIHRvXG4gICAgICAgICAgICAgICAgICAgIC8vIHJ1biBhZnRlciBpMThuIGluIENocm9tZSwgYnV0IG5vdCBvdGhlciBicm93c2Vycy4gVGhlIGZ1bmN0aW9uIHdpbGxcbiAgICAgICAgICAgICAgICAgICAgLy8gY2hlY2sgaWYgaTE4biBpcyBjb21wbGV0ZSBhbmQgc2V0IGEgbmV3IHRpbWVvdXQgaWYgaXQgaXMgbm90LiBTaW5jZVxuICAgICAgICAgICAgICAgICAgICAvLyBhIHRpbWVvdXQgb2YgMCB3b3JrcyBmb3IgYXQgbGVhc3Qgb25lIGJyb3dzZXIsIGl0IGlzIHVzZWQgaGVyZS5cbiAgICAgICAgICAgICAgICAgICAgJHRpbWVvdXQodHJ1bmNhdGVOYXZiYXIsIDApO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuJG9uKCdzZWFyY2hCYXJMb2FkZWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkdGltZW91dCh0cnVuY2F0ZU5hdmJhciwgMTAwKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIHRoZSB0b3AgbmF2aWdhdGlvbiBiYXIuIFRoaXMgZXhjbHVkZXMgdGhlIHBhcnRcbiAqIG9mIHRoZSBuYXZiYXIgdGhhdCBpcyB1c2VkIGZvciBsb2NhbCBuYXZpZ2F0aW9uIChzdWNoIGFzIHRoZSB2YXJpb3VzIHRhYnMgaW5cbiAqIHRoZSBlZGl0b3IgcGFnZXMpLlxuICovXG5hbmd1bGFyLm1vZHVsZSgndG9wTmF2aWdhdGlvbkJhck1vZHVsZScsIFtdKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgTW9kYWwgYW5kIGZ1bmN0aW9uYWxpdHkgZm9yIHRoZSBjcmVhdGUgY29sbGVjdGlvbiBidXR0b24uXG4gKi9cbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL0FsZXJ0c1NlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL1NpdGVBbmFseXRpY3NTZXJ2aWNlLnRzJyk7XG4vLyBUT0RPKGJoZW5uaW5nKTogUmVmYWN0b3IgdGhpcyB0byBtYXRjaCB0aGUgZnJvbnRlbmQgZGVzaWduIHNwZWMgYW5kIHJlZHVjZVxuLy8gZHVwbGljYXRlZCBjb2RlIGJldHdlZW4gQ29sbGVjdGlvbkNyZWF0aW9uU2VydmljZSBhbmRcbi8vIEV4cGxvcmF0aW9uQ3JlYXRpb25TZXJ2aWNlLlxuYW5ndWxhci5tb2R1bGUoJ2VudGl0eUNyZWF0aW9uU2VydmljZXNNb2R1bGUnKS5mYWN0b3J5KCdDb2xsZWN0aW9uQ3JlYXRpb25TZXJ2aWNlJywgW1xuICAgICckaHR0cCcsICckcm9vdFNjb3BlJywgJyR0aW1lb3V0JywgJyR3aW5kb3cnLCAnQWxlcnRzU2VydmljZScsXG4gICAgJ1NpdGVBbmFseXRpY3NTZXJ2aWNlJywgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJyxcbiAgICBmdW5jdGlvbiAoJGh0dHAsICRyb290U2NvcGUsICR0aW1lb3V0LCAkd2luZG93LCBBbGVydHNTZXJ2aWNlLCBTaXRlQW5hbHl0aWNzU2VydmljZSwgVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UpIHtcbiAgICAgICAgdmFyIENSRUFURV9ORVdfQ09MTEVDVElPTl9VUkxfVEVNUExBVEUgPSAoJy9jb2xsZWN0aW9uX2VkaXRvci9jcmVhdGUvPGNvbGxlY3Rpb25faWQ+Jyk7XG4gICAgICAgIHZhciBjb2xsZWN0aW9uQ3JlYXRpb25JblByb2dyZXNzID0gZmFsc2U7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBjcmVhdGVOZXdDb2xsZWN0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKGNvbGxlY3Rpb25DcmVhdGlvbkluUHJvZ3Jlc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb2xsZWN0aW9uQ3JlYXRpb25JblByb2dyZXNzID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmNsZWFyV2FybmluZ3MoKTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdNZXNzYWdlID0gJ0NyZWF0aW5nIGNvbGxlY3Rpb24nO1xuICAgICAgICAgICAgICAgICRodHRwLnBvc3QoJy9jb2xsZWN0aW9uX2VkaXRvcl9oYW5kbGVyL2NyZWF0ZV9uZXcnLCB7fSlcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgIFNpdGVBbmFseXRpY3NTZXJ2aWNlLnJlZ2lzdGVyQ3JlYXRlTmV3Q29sbGVjdGlvbkV2ZW50KHJlc3BvbnNlLmRhdGEuY29sbGVjdGlvbklkKTtcbiAgICAgICAgICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHdpbmRvdy5sb2NhdGlvbiA9IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmludGVycG9sYXRlVXJsKENSRUFURV9ORVdfQ09MTEVDVElPTl9VUkxfVEVNUExBVEUsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xsZWN0aW9uX2lkOiByZXNwb25zZS5kYXRhLmNvbGxlY3Rpb25JZFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0sIDE1MCk7XG4gICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdNZXNzYWdlID0gJyc7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IE1vZHVsZSBmb3IgdGhlIGVudGl0eSBjcmVhdGlvbiBzZXJ2aWNlcy5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2VudGl0eUNyZWF0aW9uU2VydmljZXNNb2R1bGUnLCBbXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEZ1bmN0aW9uYWxpdHkgZm9yIHRoZSBjcmVhdGUgZXhwbG9yYXRpb24gYnV0dG9uIGFuZCB1cGxvYWRcbiAqIG1vZGFsLlxuICovXG5yZXF1aXJlKCdkb21haW4vdXRpbGl0aWVzL1VybEludGVycG9sYXRpb25TZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9BbGVydHNTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdzZXJ2aWNlcy9TaXRlQW5hbHl0aWNzU2VydmljZS50cycpO1xuYW5ndWxhci5tb2R1bGUoJ2VudGl0eUNyZWF0aW9uU2VydmljZXNNb2R1bGUnKS5mYWN0b3J5KCdFeHBsb3JhdGlvbkNyZWF0aW9uU2VydmljZScsIFtcbiAgICAnJGh0dHAnLCAnJHJvb3RTY29wZScsICckdGltZW91dCcsICckdWliTW9kYWwnLCAnJHdpbmRvdycsXG4gICAgJ0FsZXJ0c1NlcnZpY2UnLCAnU2l0ZUFuYWx5dGljc1NlcnZpY2UnLCAnVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UnLFxuICAgIGZ1bmN0aW9uICgkaHR0cCwgJHJvb3RTY29wZSwgJHRpbWVvdXQsICR1aWJNb2RhbCwgJHdpbmRvdywgQWxlcnRzU2VydmljZSwgU2l0ZUFuYWx5dGljc1NlcnZpY2UsIFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHZhciBDUkVBVEVfTkVXX0VYUExPUkFUSU9OX1VSTF9URU1QTEFURSA9ICcvY3JlYXRlLzxleHBsb3JhdGlvbl9pZD4nO1xuICAgICAgICB2YXIgZXhwbG9yYXRpb25DcmVhdGlvbkluUHJvZ3Jlc3MgPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGNyZWF0ZU5ld0V4cGxvcmF0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKGV4cGxvcmF0aW9uQ3JlYXRpb25JblByb2dyZXNzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZXhwbG9yYXRpb25DcmVhdGlvbkluUHJvZ3Jlc3MgPSB0cnVlO1xuICAgICAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UuY2xlYXJXYXJuaW5ncygpO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ01lc3NhZ2UgPSAnQ3JlYXRpbmcgZXhwbG9yYXRpb24nO1xuICAgICAgICAgICAgICAgICRodHRwLnBvc3QoJy9jb250cmlidXRlaGFuZGxlci9jcmVhdGVfbmV3Jywge30pLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgIFNpdGVBbmFseXRpY3NTZXJ2aWNlLnJlZ2lzdGVyQ3JlYXRlTmV3RXhwbG9yYXRpb25FdmVudChyZXNwb25zZS5kYXRhLmV4cGxvcmF0aW9uSWQpO1xuICAgICAgICAgICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkd2luZG93LmxvY2F0aW9uID0gVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuaW50ZXJwb2xhdGVVcmwoQ1JFQVRFX05FV19FWFBMT1JBVElPTl9VUkxfVEVNUExBVEUsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHBsb3JhdGlvbl9pZDogcmVzcG9uc2UuZGF0YS5leHBsb3JhdGlvbklkXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSwgMTUwKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nTWVzc2FnZSA9ICcnO1xuICAgICAgICAgICAgICAgICAgICBleHBsb3JhdGlvbkNyZWF0aW9uSW5Qcm9ncmVzcyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNob3dVcGxvYWRFeHBsb3JhdGlvbk1vZGFsOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgQWxlcnRzU2VydmljZS5jbGVhcldhcm5pbmdzKCk7XG4gICAgICAgICAgICAgICAgJHVpYk1vZGFsLm9wZW4oe1xuICAgICAgICAgICAgICAgICAgICBiYWNrZHJvcDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldERpcmVjdGl2ZVRlbXBsYXRlVXJsKCcvcGFnZXMvY3JlYXRvci1kYXNoYm9hcmQtcGFnZS8nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICdjcmVhdG9yLWRhc2hib2FyZC1wYWdlLXRlbXBsYXRlcy8nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICd1cGxvYWQtYWN0aXZpdHktbW9kYWwuZGlyZWN0aXZlLmh0bWwnKSxcbiAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlcjogW1xuICAgICAgICAgICAgICAgICAgICAgICAgJyRzY29wZScsICckdWliTW9kYWxJbnN0YW5jZScsIGZ1bmN0aW9uICgkc2NvcGUsICR1aWJNb2RhbEluc3RhbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnNhdmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXR1cm5PYmogPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB5YW1sRmlsZTogbnVsbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZmlsZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduZXdGaWxlSW5wdXQnKS5maWxlc1swXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFmaWxlIHx8ICFmaWxlLnNpemUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UuYWRkV2FybmluZygnRW1wdHkgZmlsZSBkZXRlY3RlZC4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm5PYmoueWFtbEZpbGUgPSBmaWxlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdWliTW9kYWxJbnN0YW5jZS5jbG9zZShyZXR1cm5PYmopO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNhbmNlbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHVpYk1vZGFsSW5zdGFuY2UuZGlzbWlzcygnY2FuY2VsJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFsZXJ0c1NlcnZpY2UuY2xlYXJXYXJuaW5ncygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICB9KS5yZXN1bHQudGhlbihmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB5YW1sRmlsZSA9IHJlc3VsdC55YW1sRmlsZTtcbiAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nTWVzc2FnZSA9ICdDcmVhdGluZyBleHBsb3JhdGlvbic7XG4gICAgICAgICAgICAgICAgICAgIHZhciBmb3JtID0gbmV3IEZvcm1EYXRhKCk7XG4gICAgICAgICAgICAgICAgICAgIGZvcm0uYXBwZW5kKCd5YW1sX2ZpbGUnLCB5YW1sRmlsZSk7XG4gICAgICAgICAgICAgICAgICAgIGZvcm0uYXBwZW5kKCdwYXlsb2FkJywgSlNPTi5zdHJpbmdpZnkoe30pKTtcbiAgICAgICAgICAgICAgICAgICAgZm9ybS5hcHBlbmQoJ2NzcmZfdG9rZW4nLCBHTE9CQUxTLmNzcmZfdG9rZW4pO1xuICAgICAgICAgICAgICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudFR5cGU6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YTogZm9ybSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFGaWx0ZXI6IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUmVtb3ZlIHRoZSBYU1NJIHByZWZpeC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gSlNPTi5wYXJzZShkYXRhLnN1YnN0cmluZyg1KSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YVR5cGU6ICd0ZXh0JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb2Nlc3NEYXRhOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdQT1NUJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHVybDogJ2NvbnRyaWJ1dGVoYW5kbGVyL3VwbG9hZCdcbiAgICAgICAgICAgICAgICAgICAgfSkuZG9uZShmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHdpbmRvdy5sb2NhdGlvbiA9IFVybEludGVycG9sYXRpb25TZXJ2aWNlLmludGVycG9sYXRlVXJsKENSRUFURV9ORVdfRVhQTE9SQVRJT05fVVJMX1RFTVBMQVRFLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhwbG9yYXRpb25faWQ6IGRhdGEuZXhwbG9yYXRpb25JZFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0pLmZhaWwoZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0cmFuc2Zvcm1lZERhdGEgPSBkYXRhLnJlc3BvbnNlVGV4dC5zdWJzdHJpbmcoNSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcGFyc2VkUmVzcG9uc2UgPSBKU09OLnBhcnNlKHRyYW5zZm9ybWVkRGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBBbGVydHNTZXJ2aWNlLmFkZFdhcm5pbmcocGFyc2VkUmVzcG9uc2UuZXJyb3IgfHwgJ0Vycm9yIGNvbW11bmljYXRpbmcgd2l0aCBzZXJ2ZXIuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdNZXNzYWdlID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRhcHBseSgpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgTW9kdWxlIGZvciBhcHBseWluZyB2YWxpZGF0aW9uLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnYXBwbHlWYWxpZGF0aW9uTW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTcgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgdGhhdCBlbmFibGVzIHRoZSB1c2VyIHRvIHVwbG9hZCBhdWRpbyBmaWxlcy5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2F1ZGlvRmlsZVVwbG9hZGVyTW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIHRoZSBmb3JtIGRpcmVjdGl2ZXMuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdmb3Jtc0RpcmVjdGl2ZXNNb2R1bGUnLCBbJ2FwcGx5VmFsaWRhdGlvbk1vZHVsZScsXG4gICAgJ2F1ZGlvRmlsZVVwbG9hZGVyTW9kdWxlJywgJ2h0bWxTZWxlY3RNb2R1bGUnLCAnaW1hZ2VVcGxvYWRlck1vZHVsZScsXG4gICAgJ29iamVjdEVkaXRvck1vZHVsZScsICdyZXF1aXJlSXNGbG9hdE1vZHVsZScsICdzZWxlY3QyRHJvcGRvd25Nb2R1bGUnXG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE2IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgTW9kdWxlIGZvciB0aGUgc2VsZWN0aW9uIGRyb3Bkb3duIHdpdGggSFRNTCBjb250ZW50LlxuICovXG5hbmd1bGFyLm1vZHVsZSgnaHRtbFNlbGVjdE1vZHVsZScsIFtdKTtcbiIsIi8vIENvcHlyaWdodCAyMDE2IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgTW9kdWxlIGZvciB1cGxvYWRpbmcgaW1hZ2VzLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnaW1hZ2VVcGxvYWRlck1vZHVsZScsIFtdKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRGlyZWN0aXZlcyBmb3IgdGhlIG9iamVjdCBlZGl0b3JzLlxuICovXG4vLyBJbmRpdmlkdWFsIG9iamVjdCBlZGl0b3IgZGlyZWN0aXZlcyBhcmUgaW4gZXh0ZW5zaW9ucy9vYmplY3RzL3RlbXBsYXRlcy5cbmFuZ3VsYXIubW9kdWxlKCdvYmplY3RFZGl0b3JNb2R1bGUnKS5kaXJlY3RpdmUoJ29iamVjdEVkaXRvcicsIFsnJGNvbXBpbGUnLCAnJGxvZycsIGZ1bmN0aW9uICgkY29tcGlsZSwgJGxvZykge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc2NvcGU6IHtcbiAgICAgICAgICAgICAgICBhbHdheXNFZGl0YWJsZTogJ0AnLFxuICAgICAgICAgICAgICAgIGluaXRBcmdzOiAnPScsXG4gICAgICAgICAgICAgICAgaXNFZGl0YWJsZTogJ0AnLFxuICAgICAgICAgICAgICAgIG9ialR5cGU6ICdAJyxcbiAgICAgICAgICAgICAgICB2YWx1ZTogJz0nXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgLy8gQ29udmVydHMgYSBjYW1lbC1jYXNlZCBzdHJpbmcgdG8gYSBsb3dlci1jYXNlIGh5cGhlbi1zZXBhcmF0ZWRcbiAgICAgICAgICAgICAgICAvLyBzdHJpbmcuXG4gICAgICAgICAgICAgICAgdmFyIGRpcmVjdGl2ZU5hbWUgPSBzY29wZS5vYmpUeXBlLnJlcGxhY2UoLyhbYS16XSkoW0EtWl0pL2csICckMS0kMicpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgc2NvcGUuZ2V0SW5pdEFyZ3MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzY29wZS5pbml0QXJncztcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHNjb3BlLmdldEFsd2F5c0VkaXRhYmxlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2NvcGUuYWx3YXlzRWRpdGFibGU7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBzY29wZS5nZXRJc0VkaXRhYmxlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2NvcGUuaXNFZGl0YWJsZTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGlmIChkaXJlY3RpdmVOYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuaHRtbCgnPCcgKyBkaXJlY3RpdmVOYW1lICtcbiAgICAgICAgICAgICAgICAgICAgICAgICctZWRpdG9yIGdldC1hbHdheXMtZWRpdGFibGU9XCJnZXRBbHdheXNFZGl0YWJsZSgpXCInICtcbiAgICAgICAgICAgICAgICAgICAgICAgICcgZ2V0LWluaXQtYXJncz1cImdldEluaXRBcmdzKClcIiBnZXQtaXMtZWRpdGFibGU9XCJnZXRJc0VkaXRhYmxlKClcIicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJyBvYmotdHlwZT1cIm9ialR5cGVcIiB2YWx1ZT1cInZhbHVlXCI+PC8nICtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpcmVjdGl2ZU5hbWUgKyAnLWVkaXRvcj4nKTtcbiAgICAgICAgICAgICAgICAgICAgJGNvbXBpbGUoZWxlbWVudC5jb250ZW50cygpKShzY29wZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAkbG9nLmVycm9yKCdFcnJvciBpbiBvYmplY3RFZGl0b3I6IG5vIGVkaXRvciB0eXBlIHN1cHBsaWVkLicpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZXN0cmljdDogJ0UnXG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IE1vZHVsZSBmb3IgdGhlIG9iamVjdCBlZGl0b3JzLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnb2JqZWN0RWRpdG9yTW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIHJlcXVpcmluZyBcImlzRmxvYXRcIiBmaWx0ZXIuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdyZXF1aXJlSXNGbG9hdE1vZHVsZScsIFtdKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgTW9kdWxlIGZvciB0aGUgc2VsZWN0MiBhdXRvY29tcGxldGUgY29tcG9uZW50LlxuICovXG5hbmd1bGFyLm1vZHVsZSgnc2VsZWN0MkRyb3Bkb3duTW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIHRoZSBmb3JtIHNjaGVtYSBlZGl0b3JzLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZm9ybXNTY2hlbWFFZGl0b3JzTW9kdWxlJywgW1xuICAgICdzY2hlbWFCYXNlZEVkaXRvck1vZHVsZScsICdzY2hlbWFCYXNlZEV4cHJlc3Npb25FZGl0b3JNb2R1bGUnXG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE2IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgTW9kdWxlIGZvciBhIHNjaGVtYS1iYXNlZCBlZGl0b3IgZm9yIGJvb2xlYW5zLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnc2NoZW1hQmFzZWRCb29sRWRpdG9yTW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIGEgc2NoZW1hLWJhc2VkIGVkaXRvciBmb3IgbXVsdGlwbGUgY2hvaWNlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnc2NoZW1hQmFzZWRDaG9pY2VzRWRpdG9yTW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIGEgc2NoZW1hLWJhc2VkIGVkaXRvciBmb3IgY3VzdG9tIHZhbHVlcy5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ3NjaGVtYUJhc2VkQ3VzdG9tRWRpdG9yTW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIGEgc2NoZW1hLWJhc2VkIGVkaXRvciBmb3IgZGljdHMuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdzY2hlbWFCYXNlZERpY3RFZGl0b3JNb2R1bGUnLCBbXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IE1vZHVsZSBmb3IgZ2VuZXJhbCBzY2hlbWEtYmFzZWQgZWRpdG9ycy5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ3NjaGVtYUJhc2VkRWRpdG9yTW9kdWxlJywgWydzY2hlbWFCYXNlZEJvb2xFZGl0b3JNb2R1bGUnLFxuICAgICdzY2hlbWFCYXNlZENob2ljZXNFZGl0b3JNb2R1bGUnLCAnc2NoZW1hQmFzZWRDdXN0b21FZGl0b3JNb2R1bGUnLFxuICAgICdzY2hlbWFCYXNlZERpY3RFZGl0b3JNb2R1bGUnLCAnc2NoZW1hQmFzZWRGbG9hdEVkaXRvck1vZHVsZScsXG4gICAgJ3NjaGVtYUJhc2VkSHRtbEVkaXRvck1vZHVsZScsICdzY2hlbWFCYXNlZEludEVkaXRvck1vZHVsZScsXG4gICAgJ3NjaGVtYUJhc2VkTGlzdEVkaXRvck1vZHVsZScsICdzY2hlbWFCYXNlZFVuaWNvZGVFZGl0b3JNb2R1bGUnXG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE2IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgTW9kdWxlIGZvciBhIHNjaGVtYS1iYXNlZCBlZGl0b3IgZm9yIGZsb2F0cy5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ3NjaGVtYUJhc2VkRmxvYXRFZGl0b3JNb2R1bGUnLCBbXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IE1vZHVsZSBmb3IgYSBzY2hlbWEtYmFzZWQgZWRpdG9yIGZvciBIVE1MLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnc2NoZW1hQmFzZWRIdG1sRWRpdG9yTW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIGEgc2NoZW1hLWJhc2VkIGVkaXRvciBmb3IgaW50ZWdlcnMuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdzY2hlbWFCYXNlZEludEVkaXRvck1vZHVsZScsIFtdKTtcbiIsIi8vIENvcHlyaWdodCAyMDE2IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgTW9kdWxlIGZvciBhIHNjaGVtYS1iYXNlZCBlZGl0b3IgZm9yIGxpc3RzLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnc2NoZW1hQmFzZWRMaXN0RWRpdG9yTW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIGEgc2NoZW1hLWJhc2VkIGVkaXRvciBmb3IgdW5pY29kZSBzdHJpbmdzLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnc2NoZW1hQmFzZWRVbmljb2RlRWRpdG9yTW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIGEgc2NoZW1hLWJhc2VkIGVkaXRvciBmb3IgZXhwcmVzc2lvbnMuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdzY2hlbWFCYXNlZEV4cHJlc3Npb25FZGl0b3JNb2R1bGUnLCBbXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IE1vZHVsZSBmb3IgdW5pY29kZSBmaWx0ZXJzLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZm9ybXNVbmljb2RlRmlsdGVyc01vZHVsZScsIFtdKTtcbiIsIi8vIENvcHlyaWdodCAyMDE2IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgTW9kdWxlIGZvciB1bmljb2RlIGZpbHRlcnMuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdmb3Jtc1ZhbGlkYXRvcnNNb2R1bGUnLCBbXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IE1vZHVsZSBmb3IgZm9ybXMuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdmb3Jtc01vZHVsZScsIFsnZm9ybXNTY2hlbWFFZGl0b3JzTW9kdWxlJyxcbiAgICAnZm9ybXNEaXJlY3RpdmVzTW9kdWxlJywgJ2Zvcm1zVW5pY29kZUZpbHRlcnNNb2R1bGUnLCAnZm9ybXNWYWxpZGF0b3JzTW9kdWxlJ1xuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IE1vZHVsZSBmb3IgZGlzcGxheWluZyBjaXJjbGVkIGltYWdlcyB3aXRoIGxpbmtpbmcgKHdoZW5cbiAqIGF2YWlsYWJsZSkuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdjaXJjdWxhckltYWdlTW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIHByb2ZpbGUgbGluayBkaXJlY3RpdmVzLlxuICovXG5hbmd1bGFyLm1vZHVsZSgncHJvZmlsZUxpbmtEaXJlY3RpdmVzTW9kdWxlJywgWydwcm9maWxlTGlua1RleHRNb2R1bGUnLFxuICAgICdwcm9maWxlTGlua0ltYWdlTW9kdWxlJywgJ2NpcmN1bGFySW1hZ2VNb2R1bGUnXG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgTW9kdWxlIGZvciBjcmVhdGluZyBpbWFnZSBsaW5rcyB0byBhIHVzZXIncyBwcm9maWxlIHBhZ2UuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdwcm9maWxlTGlua0ltYWdlTW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIGNyZWF0aW5nIHRleHQgbGlua3MgdG8gYSB1c2VyJ3MgcHJvZmlsZSBwYWdlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgncHJvZmlsZUxpbmtUZXh0TW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIGRpc3BsYXlpbmcgc3VtbWFyeSByYXRpbmcgaW5mb3JtYXRpb24uXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdyYXRpbmdEaXNwbGF5TW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIHRoZSByYXRpbmdzLlxuICovXG5hbmd1bGFyLm1vZHVsZSgncmF0aW5nc01vZHVsZScsIFsncmF0aW5nRGlzcGxheU1vZHVsZSddKTtcbiIsIi8vIENvcHlyaWdodCAyMDE1IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgTW9kdWxlIGZvciB0aGUgYW5zd2VyIGdyb3VwIGVkaXRvci5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2Fuc3dlckdyb3VwRWRpdG9yTW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTcgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIHRoZSBoaW50IGVkaXRvci5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2hpbnRFZGl0b3JNb2R1bGUnLCBbXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IE1vZHVsZSBmb3IgdGhlIG91dGNvbWUgZGVzdGluYXRpb24gZWRpdG9yLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnb3V0Y29tZURlc3RpbmF0aW9uRWRpdG9yTW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTUgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIHRoZSBvdXRjb21lIGVkaXRvci5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ291dGNvbWVFZGl0b3JNb2R1bGUnLCBbJ291dGNvbWVEZXN0aW5hdGlvbkVkaXRvck1vZHVsZScsXG4gICAgJ291dGNvbWVGZWVkYmFja0VkaXRvck1vZHVsZSdcbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTUgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIHRoZSBvdXRjb21lIGRlc3RpbmF0aW9uIGVkaXRvci5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ291dGNvbWVGZWVkYmFja0VkaXRvck1vZHVsZScsIFtdKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgTW9kdWxlIGZvciB0aGUgaGVhZGVyIG9mIHRoZSByZXNwb25zZSB0aWxlcy5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ3Jlc3BvbnNlSGVhZGVyTW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIHRoZSBydWxlIGVkaXRvci5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ3J1bGVFZGl0b3JNb2R1bGUnLCBbXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgdGhlIHJ1bGUgdHlwZSBzZWxlY3Rvci5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ3J1bGVUeXBlU2VsZWN0b3JNb2R1bGUnLCBbXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNyBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IE1vZHVsZSBmb3IgdGhlIHNvbHV0aW9uIGVkaXRvci5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ3NvbHV0aW9uRWRpdG9yTW9kdWxlJywgWydzb2x1dGlvbkV4cGxhbmF0aW9uRWRpdG9yTW9kdWxlJ10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTcgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIHRoZSBzb2x1dGlvbiBleHBsYW5hdGlvbiBlZGl0b3IuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdzb2x1dGlvbkV4cGxhbmF0aW9uRWRpdG9yTW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTcgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIHN0YXRlIGNvbXBvbmVudC5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ3N0YXRlTW9kdWxlJywgWydhbnN3ZXJHcm91cEVkaXRvck1vZHVsZScsICdoaW50RWRpdG9yTW9kdWxlJyxcbiAgICAnb3V0Y29tZUVkaXRvck1vZHVsZScsICdyZXNwb25zZUhlYWRlck1vZHVsZScsICdydWxlRWRpdG9yTW9kdWxlJyxcbiAgICAncnVsZVR5cGVTZWxlY3Rvck1vZHVsZScsICdzb2x1dGlvbkVkaXRvck1vZHVsZSdcbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIHRoZSBoZWFkZXIgb2YgaXRlbXMgaW4gYSBsaXN0LlxuICovXG5hbmd1bGFyLm1vZHVsZSgnc3VtbWFyeUxpc3RIZWFkZXJNb2R1bGUnLCBbXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IE1vZHVsZSBmb3IgU3VtbWFyeSB0aWxlIGZvciBjb2xsZWN0aW9ucy5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2NvbGxlY3Rpb25TdW1tYXJ5VGlsZU1vZHVsZScsIFtdKTtcbmFuZ3VsYXIubW9kdWxlKCdjb2xsZWN0aW9uU3VtbWFyeVRpbGVNb2R1bGUnKS5jb25zdGFudCgnQ09MTEVDVElPTl9WSUVXRVJfVVJMJywgJy9jb2xsZWN0aW9uLzxjb2xsZWN0aW9uX2lkPicpO1xuYW5ndWxhci5tb2R1bGUoJ2NvbGxlY3Rpb25TdW1tYXJ5VGlsZU1vZHVsZScpLmNvbnN0YW50KCdDT0xMRUNUSU9OX0VESVRPUl9VUkwnLCAnL2NvbGxlY3Rpb25fZWRpdG9yL2NyZWF0ZS88Y29sbGVjdGlvbl9pZD4nKTtcbiIsIi8vIENvcHlyaWdodCAyMDE1IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgTW9kdWxlIGZvciBDb21wb25lbnQgZm9yIGFuIGV4cGxvcmF0aW9uIHN1bW1hcnkgdGlsZS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2V4cGxvcmF0aW9uU3VtbWFyeVRpbGVNb2R1bGUnLCBbXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IE1vZHVsZSBmb3IgQ29tcG9uZW50IGZvciBhIGNhbm9uaWNhbCBzdG9yeSB0aWxlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnc3RvcnlTdW1tYXJ5VGlsZU1vZHVsZScsIFtdKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgTW9kdWxlIGZvciB0aGUgc3VtbWFyeSB0aWxlIGRpcmVjdGl2ZXMuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdzdW1tYXJ5VGlsZURpcmVjdGl2ZXNNb2R1bGUnLCBbXG4gICAgJ2NvbGxlY3Rpb25TdW1tYXJ5VGlsZU1vZHVsZScsXG4gICAgJ2V4cGxvcmF0aW9uU3VtbWFyeVRpbGVNb2R1bGUnLFxuICAgICdzdG9yeVN1bW1hcnlUaWxlTW9kdWxlJ1xuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IE1vZHVsZSBmb3IgdGhlIHZpc3VhbGl6YXRpb24gb2YgdGhlIGRpZmYgYmV0d2VlbiB0d29cbiAqICAgdmVyc2lvbnMgb2YgYW4gZXhwbG9yYXRpb24uXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCd2aXN1YWxEaWZmVmlzdWFsaXphdGlvbk1vZHVsZScsIFtdKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRm9jdXNPbiBEaXJlY3RpdmUgKG5vdCBhc3NvY2lhdGVkIHdpdGggcmV1c2FibGVcbiAqIGNvbXBvbmVudHMuKVxuICogTkI6IFJldXNhYmxlIGNvbXBvbmVudCBkaXJlY3RpdmVzIHNob3VsZCBnbyBpbiB0aGUgY29tcG9uZW50cy8gZm9sZGVyLlxuICovXG4vLyBXaGVuIHNldCBhcyBhbiBhdHRyIG9mIGFuIDxpbnB1dD4gZWxlbWVudCwgbW92ZXMgZm9jdXMgdG8gdGhhdCBlbGVtZW50XG4vLyB3aGVuIGEgJ2ZvY3VzT24nIGV2ZW50IGlzIGJyb2FkY2FzdC5cbm9wcGlhLmRpcmVjdGl2ZSgnZm9jdXNPbicsIFtcbiAgICAnTEFCRUxfRk9SX0NMRUFSSU5HX0ZPQ1VTJywgZnVuY3Rpb24gKExBQkVMX0ZPUl9DTEVBUklOR19GT0NVUykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKHNjb3BlLCBlbHQsIGF0dHJzKSB7XG4gICAgICAgICAgICBzY29wZS4kb24oJ2ZvY3VzT24nLCBmdW5jdGlvbiAoZSwgbmFtZSkge1xuICAgICAgICAgICAgICAgIGlmIChuYW1lID09PSBhdHRycy5mb2N1c09uKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsdFswXS5mb2N1cygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBJZiB0aGUgcHVycG9zZSBvZiB0aGUgZm9jdXMgc3dpdGNoIHdhcyB0byBjbGVhciBmb2N1cywgYmx1ciB0aGVcbiAgICAgICAgICAgICAgICAvLyBlbGVtZW50LlxuICAgICAgICAgICAgICAgIGlmIChuYW1lID09PSBMQUJFTF9GT1JfQ0xFQVJJTkdfRk9DVVMpIHtcbiAgICAgICAgICAgICAgICAgICAgZWx0WzBdLmJsdXIoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE1IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU2VydmljZSBmb3IgbWFpbnRhaW5pbmcgdGhlIG9wZW4vY2xvc2VkIHN0YXR1cyBvZiB0aGVcbiAqIGhhbWJ1cmdlci1tZW51IHNpZGViYXIuXG4gKi9cbnJlcXVpcmUoJ3NlcnZpY2VzL2NvbnRleHR1YWwvV2luZG93RGltZW5zaW9uc1NlcnZpY2UudHMnKTtcbm9wcGlhLmZhY3RvcnkoJ1NpZGViYXJTdGF0dXNTZXJ2aWNlJywgW1xuICAgICdXaW5kb3dEaW1lbnNpb25zU2VydmljZScsIGZ1bmN0aW9uIChXaW5kb3dEaW1lbnNpb25zU2VydmljZSkge1xuICAgICAgICB2YXIgcGVuZGluZ1NpZGViYXJDbGljayA9IGZhbHNlO1xuICAgICAgICB2YXIgc2lkZWJhcklzU2hvd24gPSBmYWxzZTtcbiAgICAgICAgdmFyIF9vcGVuU2lkZWJhciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChXaW5kb3dEaW1lbnNpb25zU2VydmljZS5pc1dpbmRvd05hcnJvdygpICYmICFzaWRlYmFySXNTaG93bikge1xuICAgICAgICAgICAgICAgIHNpZGViYXJJc1Nob3duID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBwZW5kaW5nU2lkZWJhckNsaWNrID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgdmFyIF9jbG9zZVNpZGViYXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoc2lkZWJhcklzU2hvd24pIHtcbiAgICAgICAgICAgICAgICBzaWRlYmFySXNTaG93biA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHBlbmRpbmdTaWRlYmFyQ2xpY2sgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGlzU2lkZWJhclNob3duOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNpZGViYXJJc1Nob3duO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9wZW5TaWRlYmFyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgX29wZW5TaWRlYmFyKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY2xvc2VTaWRlYmFyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgX2Nsb3NlU2lkZWJhcigpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRvZ2dsZVNpZGViYXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXNpZGViYXJJc1Nob3duKSB7XG4gICAgICAgICAgICAgICAgICAgIF9vcGVuU2lkZWJhcigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgX2Nsb3NlU2lkZWJhcigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvbkRvY3VtZW50Q2xpY2s6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXBlbmRpbmdTaWRlYmFyQ2xpY2spIHtcbiAgICAgICAgICAgICAgICAgICAgc2lkZWJhcklzU2hvd24gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHBlbmRpbmdTaWRlYmFyQ2xpY2sgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEZhY3RvcnkgZm9yIGNyZWF0aW5nIGFuZCBpbnN0YW5jZXMgb2YgZnJvbnRlbmQgdXNlciBVc2VySW5mb1xuICogZG9tYWluIG9iamVjdHMuXG4gKi9cbm9wcGlhLmZhY3RvcnkoJ1VzZXJJbmZvT2JqZWN0RmFjdG9yeScsIFtmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBVc2VySW5mbyA9IGZ1bmN0aW9uIChpc01vZGVyYXRvciwgaXNBZG1pbiwgaXNTdXBlckFkbWluLCBpc1RvcGljTWFuYWdlciwgY2FuQ3JlYXRlQ29sbGVjdGlvbnMsIHByZWZlcnJlZFNpdGVMYW5ndWFnZUNvZGUsIHVzZXJuYW1lLCBpc0xvZ2dlZEluKSB7XG4gICAgICAgICAgICB0aGlzLl9pc01vZGVyYXRvciA9IGlzTW9kZXJhdG9yO1xuICAgICAgICAgICAgdGhpcy5faXNBZG1pbiA9IGlzQWRtaW47XG4gICAgICAgICAgICB0aGlzLl9pc1RvcGljTWFuYWdlciA9IGlzVG9waWNNYW5hZ2VyO1xuICAgICAgICAgICAgdGhpcy5faXNTdXBlckFkbWluID0gaXNTdXBlckFkbWluO1xuICAgICAgICAgICAgdGhpcy5fY2FuQ3JlYXRlQ29sbGVjdGlvbnMgPSBjYW5DcmVhdGVDb2xsZWN0aW9ucztcbiAgICAgICAgICAgIHRoaXMuX3ByZWZlcnJlZFNpdGVMYW5ndWFnZUNvZGUgPSBwcmVmZXJyZWRTaXRlTGFuZ3VhZ2VDb2RlO1xuICAgICAgICAgICAgdGhpcy5fdXNlcm5hbWUgPSB1c2VybmFtZTtcbiAgICAgICAgICAgIHRoaXMuX2lzTG9nZ2VkSW4gPSBpc0xvZ2dlZEluO1xuICAgICAgICB9O1xuICAgICAgICAvLyBJbnN0YW5jZSBtZXRob2RzXG4gICAgICAgIFVzZXJJbmZvLnByb3RvdHlwZS5pc01vZGVyYXRvciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9pc01vZGVyYXRvcjtcbiAgICAgICAgfTtcbiAgICAgICAgVXNlckluZm8ucHJvdG90eXBlLmlzQWRtaW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5faXNBZG1pbjtcbiAgICAgICAgfTtcbiAgICAgICAgVXNlckluZm8ucHJvdG90eXBlLmlzVG9waWNNYW5hZ2VyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2lzVG9waWNNYW5hZ2VyO1xuICAgICAgICB9O1xuICAgICAgICBVc2VySW5mby5wcm90b3R5cGUuaXNTdXBlckFkbWluID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2lzU3VwZXJBZG1pbjtcbiAgICAgICAgfTtcbiAgICAgICAgVXNlckluZm8ucHJvdG90eXBlLmNhbkNyZWF0ZUNvbGxlY3Rpb25zID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2NhbkNyZWF0ZUNvbGxlY3Rpb25zO1xuICAgICAgICB9O1xuICAgICAgICBVc2VySW5mby5wcm90b3R5cGUuZ2V0UHJlZmVycmVkU2l0ZUxhbmd1YWdlQ29kZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9wcmVmZXJyZWRTaXRlTGFuZ3VhZ2VDb2RlO1xuICAgICAgICB9O1xuICAgICAgICBVc2VySW5mby5wcm90b3R5cGUuZ2V0VXNlcm5hbWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fdXNlcm5hbWU7XG4gICAgICAgIH07XG4gICAgICAgIFVzZXJJbmZvLnByb3RvdHlwZS5pc0xvZ2dlZEluID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2lzTG9nZ2VkSW47XG4gICAgICAgIH07XG4gICAgICAgIC8vIFRPRE8gKGFua2l0YTI0MDc5NikgUmVtb3ZlIHRoZSBicmFja2V0IG5vdGF0aW9uIG9uY2UgQW5ndWxhcjIgZ2V0cyBpbi5cbiAgICAgICAgLyogZXNsaW50LWRpc2FibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgIFVzZXJJbmZvWydjcmVhdGVGcm9tQmFja2VuZERpY3QnXSA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgICAvKiBlc2xpbnQtZW5hYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBVc2VySW5mbyhkYXRhLmlzX21vZGVyYXRvciwgZGF0YS5pc19hZG1pbiwgZGF0YS5pc19zdXBlcl9hZG1pbiwgZGF0YS5pc190b3BpY19tYW5hZ2VyLCBkYXRhLmNhbl9jcmVhdGVfY29sbGVjdGlvbnMsIGRhdGEucHJlZmVycmVkX3NpdGVfbGFuZ3VhZ2VfY29kZSwgZGF0YS51c2VybmFtZSwgZGF0YS51c2VyX2lzX2xvZ2dlZF9pbik7XG4gICAgICAgIH07XG4gICAgICAgIC8vIFRPRE8gKGFua2l0YTI0MDc5NikgUmVtb3ZlIHRoZSBicmFja2V0IG5vdGF0aW9uIG9uY2UgQW5ndWxhcjIgZ2V0cyBpbi5cbiAgICAgICAgLyogZXNsaW50LWRpc2FibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgIFVzZXJJbmZvWydjcmVhdGVEZWZhdWx0J10gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvKiBlc2xpbnQtZW5hYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBVc2VySW5mbyhmYWxzZSwgZmFsc2UsIGZhbHNlLCBmYWxzZSwgZmFsc2UsIG51bGwsIG51bGwsIGZhbHNlKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIFVzZXJJbmZvO1xuICAgIH1dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgTW9kdWxlIGZvciBjdXN0b20gZmlsdGVycy5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2ZpbHRlcnNNb2R1bGUnLCBbJ3N0cmluZ1V0aWxpdHlGaWx0ZXJzTW9kdWxlJ10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIHN0cmluZyB1dGlsaXR5IGZpbHRlcnMuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdzdHJpbmdVdGlsaXR5RmlsdGVyc01vZHVsZScsIFtdKTtcbmFuZ3VsYXIubW9kdWxlKCdzdHJpbmdVdGlsaXR5RmlsdGVyc01vZHVsZScpLmNvbnN0YW50KCdSVUxFX1NVTU1BUllfV1JBUF9DSEFSQUNURVJfQ09VTlQnLCAzMCk7XG5hbmd1bGFyLm1vZHVsZSgnc3RyaW5nVXRpbGl0eUZpbHRlcnNNb2R1bGUnKS5jb25zdGFudCgnRkVFREJBQ0tfU1VCSkVDVF9NQVhfQ0hBUl9MSU1JVCcsIGNvbnN0YW50cy5GRUVEQkFDS19TVUJKRUNUX01BWF9DSEFSX0xJTUlUKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgT3BwaWEncyBiYXNlIGNvbnRyb2xsZXIuXG4gKi9cbm9wcGlhLmNvbnRyb2xsZXIoJ0Jhc2UnLCBbXG4gICAgJyRkb2N1bWVudCcsICckcm9vdFNjb3BlJywgJyRzY29wZScsICdBbGVydHNTZXJ2aWNlJywgJ0JhY2tncm91bmRNYXNrU2VydmljZScsXG4gICAgJ1NpZGViYXJTdGF0dXNTZXJ2aWNlJywgJ1VybFNlcnZpY2UnLCAnREVWX01PREUnLCAnU0lURV9GRUVEQkFDS19GT1JNX1VSTCcsXG4gICAgJ1NJVEVfTkFNRScsXG4gICAgZnVuY3Rpb24gKCRkb2N1bWVudCwgJHJvb3RTY29wZSwgJHNjb3BlLCBBbGVydHNTZXJ2aWNlLCBCYWNrZ3JvdW5kTWFza1NlcnZpY2UsIFNpZGViYXJTdGF0dXNTZXJ2aWNlLCBVcmxTZXJ2aWNlLCBERVZfTU9ERSwgU0lURV9GRUVEQkFDS19GT1JNX1VSTCwgU0lURV9OQU1FKSB7XG4gICAgICAgICRzY29wZS5zaXRlTmFtZSA9IFNJVEVfTkFNRTtcbiAgICAgICAgJHNjb3BlLkFsZXJ0c1NlcnZpY2UgPSBBbGVydHNTZXJ2aWNlO1xuICAgICAgICAkc2NvcGUuY3VycmVudExhbmcgPSAnZW4nO1xuICAgICAgICAkc2NvcGUuaWZyYW1lZCA9IFVybFNlcnZpY2UuaXNJZnJhbWVkKCk7XG4gICAgICAgICRzY29wZS5zaXRlRmVlZGJhY2tGb3JtVXJsID0gU0lURV9GRUVEQkFDS19GT1JNX1VSTDtcbiAgICAgICAgJHJvb3RTY29wZS5ERVZfTU9ERSA9IERFVl9NT0RFO1xuICAgICAgICAvLyBJZiB0aGlzIGlzIG5vbmVtcHR5LCB0aGUgd2hvbGUgcGFnZSBnb2VzIGludG8gJ0xvYWRpbmcuLi4nIG1vZGUuXG4gICAgICAgICRyb290U2NvcGUubG9hZGluZ01lc3NhZ2UgPSAnJztcbiAgICAgICAgJHNjb3BlLmlzU2lkZWJhclNob3duID0gU2lkZWJhclN0YXR1c1NlcnZpY2UuaXNTaWRlYmFyU2hvd247XG4gICAgICAgICRzY29wZS5jbG9zZVNpZGViYXJPblN3aXBlID0gU2lkZWJhclN0YXR1c1NlcnZpY2UuY2xvc2VTaWRlYmFyO1xuICAgICAgICAkc2NvcGUuaXNCYWNrZ3JvdW5kTWFza0FjdGl2ZSA9IEJhY2tncm91bmRNYXNrU2VydmljZS5pc01hc2tBY3RpdmU7XG4gICAgICAgIC8vIExpc3RlbmVyIGZ1bmN0aW9uIHRvIGNhdGNoIHRoZSBjaGFuZ2UgaW4gbGFuZ3VhZ2UgcHJlZmVyZW5jZS5cbiAgICAgICAgJHJvb3RTY29wZS4kb24oJyR0cmFuc2xhdGVDaGFuZ2VTdWNjZXNzJywgZnVuY3Rpb24gKGV2dCwgcmVzcG9uc2UpIHtcbiAgICAgICAgICAgICRzY29wZS5jdXJyZW50TGFuZyA9IHJlc3BvbnNlLmxhbmd1YWdlO1xuICAgICAgICB9KTtcbiAgICAgICAgLy8gVE9ETyhzbGwpOiB1c2UgJ3RvdWNoc3RhcnQnIGZvciBtb2JpbGUuXG4gICAgICAgICRkb2N1bWVudC5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBTaWRlYmFyU3RhdHVzU2VydmljZS5vbkRvY3VtZW50Q2xpY2soKTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfSk7XG4gICAgICAgICRzY29wZS5za2lwVG9NYWluQ29udGVudCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBtYWluQ29udGVudEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnb3BwaWEtbWFpbi1jb250ZW50Jyk7XG4gICAgICAgICAgICBpZiAoIW1haW5Db250ZW50RWxlbWVudCkge1xuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdWYXJpYWJsZSBtYWluQ29udGVudEVsZW1lbnQgaXMgdW5kZWZpbmVkLicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbWFpbkNvbnRlbnRFbGVtZW50LnRhYkluZGV4ID0gLTE7XG4gICAgICAgICAgICBtYWluQ29udGVudEVsZW1lbnQuc2Nyb2xsSW50b1ZpZXcoKTtcbiAgICAgICAgICAgIG1haW5Db250ZW50RWxlbWVudC5mb2N1cygpO1xuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIHRoZSBhYm91dCBwYWdlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnYWJvdXRQYWdlTW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIHRoZSBhY3Rpdml0aWVzIHRhYiBpbiB0aGUgYWRtaW4gcGFuZWwgd2hlbiBPcHBpYVxuICogaXMgaW4gZGV2ZWxvcGVyIG1vZGUuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdhZG1pbkRldk1vZGVBY3Rpdml0aWVzVGFiTW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIHRoZSBhY3Rpdml0aWVzIHRhYiBpbiB0aGUgYWRtaW4gcGFuZWwgd2hlbiBPcHBpYVxuICogaXMgaW4gcHJvZHVjdGlvbiBtb2RlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnYWRtaW5Qcm9kTW9kZUFjdGl2aXRpZXNUYWInLCBbXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IE1vZHVsZSBmb3IgdGhlIG5hdmlnYXRpb24gYmFyIGluIHRoZSBhZG1pbiBwYW5lbC5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2FkbWluTmF2YmFyTW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEYXRhIGFuZCBNb2R1bGUgZm9yIHRoZSBPcHBpYSBhZG1pbiBwYWdlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnYWRtaW5QYWdlTW9kdWxlJywgW1xuICAgICdhZG1pbk5hdmJhck1vZHVsZScsICdhZG1pbkNvbmZpZ1RhYk1vZHVsZScsICdhZG1pbkpvYnNUYWJNb2R1bGUnLFxuICAgICdhZG1pbk1pc2NUYWJNb2R1bGUnLCAnYWRtaW5Sb2xlc1RhYk1vZHVsZScsICdyb2xlR3JhcGhNb2R1bGUnLFxuICAgICdhZG1pbkRldk1vZGVBY3Rpdml0aWVzVGFiTW9kdWxlJywgJ2FkbWluUHJvZE1vZGVBY3Rpdml0aWVzVGFiJ1xuXSk7XG5hbmd1bGFyLm1vZHVsZSgnYWRtaW5QYWdlTW9kdWxlJykuY29uc3RhbnQoJ0FETUlOX0hBTkRMRVJfVVJMJywgJy9hZG1pbmhhbmRsZXInKTtcbmFuZ3VsYXIubW9kdWxlKCdhZG1pblBhZ2VNb2R1bGUnKVxuICAgIC5jb25zdGFudCgnQURNSU5fUk9MRV9IQU5ETEVSX1VSTCcsICcvYWRtaW5yb2xlaGFuZGxlcicpO1xuYW5ndWxhci5tb2R1bGUoJ2FkbWluUGFnZU1vZHVsZScpXG4gICAgLmNvbnN0YW50KCdQUk9GSUxFX1VSTF9URU1QTEFURScsICcvcHJvZmlsZS88dXNlcm5hbWU+Jyk7XG5hbmd1bGFyLm1vZHVsZSgnYWRtaW5QYWdlTW9kdWxlJykuY29uc3RhbnQoJ0FETUlOX0pPQl9PVVRQVVRfVVJMX1RFTVBMQVRFJywgJy9hZG1pbmpvYm91dHB1dD9qb2JfaWQ9PGpvYklkPicpO1xuYW5ndWxhci5tb2R1bGUoJ2FkbWluUGFnZU1vZHVsZScpLmNvbnN0YW50KCdBRE1JTl9UT1BJQ1NfQ1NWX0RPV05MT0FEX0hBTkRMRVJfVVJMJywgJy9hZG1pbnRvcGljc2NzdmRvd25sb2FkaGFuZGxlcicpO1xuYW5ndWxhci5tb2R1bGUoJ2FkbWluUGFnZU1vZHVsZScpLmNvbnN0YW50KCdBRE1JTl9UQUJfVVJMUycsIHtcbiAgICBBQ1RJVklUSUVTOiAnI2FjdGl2aXRpZXMnLFxuICAgIEpPQlM6ICcjam9icycsXG4gICAgQ09ORklHOiAnI2NvbmZpZycsXG4gICAgUk9MRVM6ICcjcm9sZXMnLFxuICAgIE1JU0M6ICcjbWlzYydcbn0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIHRoZSBjb25maWd1cmF0aW9uIHRhYiBpbiB0aGUgYWRtaW4gcGFuZWwuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdhZG1pbkNvbmZpZ1RhYk1vZHVsZScsIFtdKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgTW9kdWxlIGZvciB0aGUgam9icyB0YWIgaW4gdGhlIGFkbWluIHBhbmVsLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnYWRtaW5Kb2JzVGFiTW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIHRoZSBtaXNjZWxsYW5lb3VzIHRhYiBpbiB0aGUgYWRtaW4gcGFuZWwuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdhZG1pbk1pc2NUYWJNb2R1bGUnLCBbXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IE1vZHVsZSBmb3IgdGhlIFJvbGVzIHRhYiBpbiB0aGUgYWRtaW4gcGFuZWwuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdhZG1pblJvbGVzVGFiTW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIGRpc3BsYXlpbmcgUm9sZSBncmFwaC5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ3JvbGVHcmFwaE1vZHVsZScsIFtdKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgTW9kdWxlIGZvciBzaG93aW5nIGF1dGhvci9zaGFyZSBmb290ZXJcbiAqIGluIGNvbGxlY3Rpb24gcGxheWVyLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnY29sbGVjdGlvbkZvb3Rlck1vZHVsZScsIFtdKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgQ29udHJvbGxlciBmb3IgdGhlIGxvY2FsIG5hdmlnYXRpb24gaW4gdGhlIGNvbGxlY3Rpb24gdmlldy5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2NvbGxlY3Rpb25Mb2NhbE5hdk1vZHVsZScsIFtdKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgTW9kdWxlIGZvciBjcmVhdGluZyBhIGxpc3Qgb2YgY29sbGVjdGlvbiBub2RlcyB3aGljaCBsaW5rIHRvXG4gKiBwbGF5aW5nIHRoZSBleHBsb3JhdGlvbiBpbiBlYWNoIG5vZGUuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdjb2xsZWN0aW9uTm9kZUxpc3RNb2R1bGUnLCBbXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IE1vZHVsZSBmb3IgdGhlIGxlYXJuZXIncyB2aWV3IG9mIGEgY29sbGVjdGlvbi5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2NvbGxlY3Rpb25QbGF5ZXJQYWdlTW9kdWxlJywgW1xuICAgICdjb2xsZWN0aW9uRm9vdGVyTW9kdWxlJywgJ2NvbGxlY3Rpb25Ob2RlTGlzdE1vZHVsZScsXG4gICAgJ2NvbGxlY3Rpb25Mb2NhbE5hdk1vZHVsZSdcbl0pO1xuYW5ndWxhci5tb2R1bGUoJ2NvbGxlY3Rpb25QbGF5ZXJQYWdlTW9kdWxlJykuY29uc3RhbnQoJ0NPTExFQ1RJT05fREFUQV9VUkxfVEVNUExBVEUnLCAnL2NvbGxlY3Rpb25faGFuZGxlci9kYXRhLzxjb2xsZWN0aW9uX2lkPicpO1xuYW5ndWxhci5tb2R1bGUoJ2NvbGxlY3Rpb25QbGF5ZXJQYWdlTW9kdWxlJykuYW5pbWF0aW9uKCcub3BwaWEtY29sbGVjdGlvbi1hbmltYXRlLXNsaWRlJywgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIGVudGVyOiBmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgICAgICAgZWxlbWVudC5oaWRlKCkuc2xpZGVEb3duKCk7XG4gICAgICAgIH0sXG4gICAgICAgIGxlYXZlOiBmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgICAgICAgZWxlbWVudC5zbGlkZVVwKCk7XG4gICAgICAgIH1cbiAgICB9O1xufSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IENvbnRyb2xsZXJzIGZvciB0aGUgY3JlYXRvciBkYXNoYm9hcmQuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdjcmVhdG9yRGFzaGJvYXJkUGFnZU1vZHVsZScsIFtdKTtcbmFuZ3VsYXIubW9kdWxlKCdjcmVhdG9yRGFzaGJvYXJkUGFnZU1vZHVsZScpLmNvbnN0YW50KCdFWFBMT1JBVElPTl9EUk9QRE9XTl9TVEFUUycsIHtcbiAgICBPUEVOX0ZFRURCQUNLOiAnb3Blbl9mZWVkYmFjaydcbn0pO1xuYW5ndWxhci5tb2R1bGUoJ2NyZWF0b3JEYXNoYm9hcmRQYWdlTW9kdWxlJykuY29uc3RhbnQoJ0VYUExPUkFUSU9OU19TT1JUX0JZX0tFWVMnLCB7XG4gICAgVElUTEU6ICd0aXRsZScsXG4gICAgUkFUSU5HOiAncmF0aW5ncycsXG4gICAgTlVNX1ZJRVdTOiAnbnVtX3ZpZXdzJyxcbiAgICBPUEVOX0ZFRURCQUNLOiAnbnVtX29wZW5fdGhyZWFkcycsXG4gICAgTEFTVF9VUERBVEVEOiAnbGFzdF91cGRhdGVkX21zZWMnXG59KTtcbmFuZ3VsYXIubW9kdWxlKCdjcmVhdG9yRGFzaGJvYXJkUGFnZU1vZHVsZScpLmNvbnN0YW50KCdIVU1BTl9SRUFEQUJMRV9FWFBMT1JBVElPTlNfU09SVF9CWV9LRVlTJywge1xuICAgIFRJVExFOiAnSTE4Tl9EQVNIQk9BUkRfRVhQTE9SQVRJT05TX1NPUlRfQllfVElUTEUgJyxcbiAgICBSQVRJTkc6ICdJMThOX0RBU0hCT0FSRF9FWFBMT1JBVElPTlNfU09SVF9CWV9BVkVSQUdFX1JBVElORycsXG4gICAgTlVNX1ZJRVdTOiAnSTE4Tl9EQVNIQk9BUkRfRVhQTE9SQVRJT05TX1NPUlRfQllfVE9UQUxfUExBWVMnLFxuICAgIE9QRU5fRkVFREJBQ0s6ICdJMThOX0RBU0hCT0FSRF9FWFBMT1JBVElPTlNfU09SVF9CWV9PUEVOX0ZFRURCQUNLJyxcbiAgICBMQVNUX1VQREFURUQ6ICdJMThOX0RBU0hCT0FSRF9FWFBMT1JBVElPTlNfU09SVF9CWV9MQVNUX1VQREFURUQnXG59KTtcbmFuZ3VsYXIubW9kdWxlKCdjcmVhdG9yRGFzaGJvYXJkUGFnZU1vZHVsZScpLmNvbnN0YW50KCdTVUJTQ1JJUFRJT05fU09SVF9CWV9LRVlTJywge1xuICAgIFVTRVJOQU1FOiAnc3Vic2NyaWJlcl91c2VybmFtZScsXG4gICAgSU1QQUNUOiAnc3Vic2NyaWJlcl9pbXBhY3QnXG59KTtcbmFuZ3VsYXIubW9kdWxlKCdjcmVhdG9yRGFzaGJvYXJkUGFnZU1vZHVsZScpLmNvbnN0YW50KCdIVU1BTl9SRUFEQUJMRV9TVUJTQ1JJUFRJT05fU09SVF9CWV9LRVlTJywge1xuICAgIFVTRVJOQU1FOiAnVXNlcm5hbWUnLFxuICAgIElNUEFDVDogJ0ltcGFjdCdcbn0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIHRoZSBkb25hdGUgcGFnZS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2RvbmF0ZVBhZ2VNb2R1bGUnLCBbXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IE1vZHVsZSBmb3Igb3BwaWEgZW1haWwgZGFzaGJvYXJkIHBhZ2UuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdlbWFpbERhc2hib2FyZFBhZ2VNb2R1bGUnLCBbJ2VtYWlsRGFzaGJvYXJkUmVzdWx0TW9kdWxlJ10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIG9wcGlhIGVtYWlsIGRhc2hib2FyZCBwYWdlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZW1haWxEYXNoYm9hcmRSZXN1bHRNb2R1bGUnLCBbXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IE1vZHVsZSBmb3IgdGhlIGVycm9yIHBhZ2UuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdlcnJvclBhZ2VNb2R1bGUnLCBbXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IE1vZHVsZSBmb3Igc2hvd2luZyBFZGl0b3IgTmF2YmFyIGJyZWFkY3J1bWJcbiAqIGluIGVkaXRvciBuYXZiYXIuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdlZGl0b3JOYXZiYXJCcmVhZGNydW1iTW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIHNob3dpbmcgRWRpdG9yIE5hdmlnYXRpb25cbiAqIGluIGVkaXRvci5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2VkaXRvck5hdmlnYXRpb25Nb2R1bGUnLCBbXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEEgc2VydmljZSB0aGF0IG1hcHMgSURzIHRvIEFuZ3VsYXIgbmFtZXMuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdleHBsb3JhdGlvbkVkaXRvclBhZ2VNb2R1bGUnKS5mYWN0b3J5KCdBbmd1bGFyTmFtZVNlcnZpY2UnLCBbZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgYW5ndWxhck5hbWUgPSBudWxsO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZ2V0TmFtZU9mSW50ZXJhY3Rpb25SdWxlc1NlcnZpY2U6IGZ1bmN0aW9uIChpbnRlcmFjdGlvbklkKSB7XG4gICAgICAgICAgICAgICAgYW5ndWxhck5hbWUgPSBpbnRlcmFjdGlvbklkLmNoYXJBdCgwKSArXG4gICAgICAgICAgICAgICAgICAgIGludGVyYWN0aW9uSWQuc2xpY2UoMSkgKyAnUnVsZXNTZXJ2aWNlJztcbiAgICAgICAgICAgICAgICByZXR1cm4gYW5ndWxhck5hbWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfV0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIHRoZSBleHBsb3JhdGlvbiBlZGl0b3IgcGFnZSBhbmQgdGhlIGVkaXRvclxuICogICAgICAgICAgICAgICBoZWxwIHRhYiBpbiB0aGUgbmF2YmFyLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZXhwbG9yYXRpb25FZGl0b3JQYWdlTW9kdWxlJywgWydlZGl0b3JOYXZiYXJCcmVhZGNydW1iTW9kdWxlJyxcbiAgICAnZWRpdG9yTmF2aWdhdGlvbk1vZHVsZScsICdleHBsb3JhdGlvbkVkaXRvclRhYk1vZHVsZScsXG4gICAgJ2V4cGxvcmF0aW9uU2F2ZUFuZFB1bGlzaEJ1dHRvbnNNb2R1bGUnLCAnZXhwbG9yYXRpb25PYmplY3RpdmVFZGl0b3JNb2R1bGUnLFxuICAgICdleHBsb3JhdGlvblRpdGxlRWRpdG9yTW9kdWxlJyxcbiAgICAnZmVlZGJhY2tUYWJNb2R1bGUnLCAnaGlzdG9yeVRhYk1vZHVsZScsICdpbXByb3ZlbWVudHNUYWJNb2R1bGUnLFxuICAgICdtYXJrQWxsQXVkaW9BbmRUcmFuc2xhdGlvbnNBc05lZWRpbmdVcGRhdGVNb2R1bGUnLFxuICAgICdwYXJhbXNDaGFuZ2VzRWRpdG9yTW9kdWxlJyxcbiAgICAncHJldmlld1RhYk1vZHVsZScsICdzZXR0aW5nc1RhYk1vZHVsZScsICdzdGF0aXN0aWNzVGFiTW9kdWxlJyxcbiAgICAndHJhbnNsYXRpb25UYWJNb2R1bGUnLCAndmFsdWVHZW5lcmF0b3JFZGl0b3JNb2R1bGUnXG5dKTtcbmFuZ3VsYXIubW9kdWxlKCdleHBsb3JhdGlvbkVkaXRvclBhZ2VNb2R1bGUnKS5jb25zdGFudCgnSU5URVJBQ1RJT05fU1BFQ1MnLCBHTE9CQUxTLklOVEVSQUNUSU9OX1NQRUNTKTtcbmFuZ3VsYXIubW9kdWxlKCdleHBsb3JhdGlvbkVkaXRvclBhZ2VNb2R1bGUnKS5jb25zdGFudCgnRVhQTE9SQVRJT05fVElUTEVfSU5QVVRfRk9DVVNfTEFCRUwnLCAnZXhwbG9yYXRpb25UaXRsZUlucHV0Rm9jdXNMYWJlbCcpO1xuYW5ndWxhci5tb2R1bGUoJ2V4cGxvcmF0aW9uRWRpdG9yUGFnZU1vZHVsZScpLmNvbnN0YW50KCdFWFBMT1JBVElPTl9EQVRBX1VSTF9URU1QTEFURScsICcvZXhwbG9yZWhhbmRsZXIvaW5pdC88ZXhwbG9yYXRpb25faWQ+Jyk7XG5hbmd1bGFyLm1vZHVsZSgnZXhwbG9yYXRpb25FZGl0b3JQYWdlTW9kdWxlJykuY29uc3RhbnQoJ0VYUExPUkFUSU9OX1ZFUlNJT05fREFUQV9VUkxfVEVNUExBVEUnLCAnL2V4cGxvcmVoYW5kbGVyL2luaXQvPGV4cGxvcmF0aW9uX2lkPj92PTx2ZXJzaW9uPicpO1xuYW5ndWxhci5tb2R1bGUoJ2V4cGxvcmF0aW9uRWRpdG9yUGFnZU1vZHVsZScpLmNvbnN0YW50KCdFRElUQUJMRV9FWFBMT1JBVElPTl9EQVRBX1VSTF9URU1QTEFURScsICcvY3JlYXRlaGFuZGxlci9kYXRhLzxleHBsb3JhdGlvbl9pZD4nKTtcbmFuZ3VsYXIubW9kdWxlKCdleHBsb3JhdGlvbkVkaXRvclBhZ2VNb2R1bGUnKS5jb25zdGFudCgnVFJBTlNMQVRFX0VYUExPUkFUSU9OX0RBVEFfVVJMX1RFTVBMQVRFJywgJy9jcmVhdGVoYW5kbGVyL3RyYW5zbGF0ZS88ZXhwbG9yYXRpb25faWQ+Jyk7XG5hbmd1bGFyLm1vZHVsZSgnZXhwbG9yYXRpb25FZGl0b3JQYWdlTW9kdWxlJykuY29uc3RhbnQoJ0VESVRBQkxFX0VYUExPUkFUSU9OX0RBVEFfRFJBRlRfVVJMX1RFTVBMQVRFJywgJy9jcmVhdGVoYW5kbGVyL2RhdGEvPGV4cGxvcmF0aW9uX2lkPj9hcHBseV9kcmFmdD08YXBwbHlfZHJhZnQ+Jyk7XG5hbmd1bGFyLm1vZHVsZSgnZXhwbG9yYXRpb25FZGl0b3JQYWdlTW9kdWxlJykuY29uc3RhbnQoJ1BBUkFNX0FDVElPTl9HRVQnLCAnZ2V0Jyk7XG5hbmd1bGFyLm1vZHVsZSgnZXhwbG9yYXRpb25FZGl0b3JQYWdlTW9kdWxlJykuY29uc3RhbnQoJ1BBUkFNX0FDVElPTl9TRVQnLCAnc2V0Jyk7XG5hbmd1bGFyLm1vZHVsZSgnZXhwbG9yYXRpb25FZGl0b3JQYWdlTW9kdWxlJykuY29uc3RhbnQoJ1ZPSUNFT1ZFUl9NT0RFJywgJ3ZvaWNlb3Zlck1vZGUnKTtcbmFuZ3VsYXIubW9kdWxlKCdleHBsb3JhdGlvbkVkaXRvclBhZ2VNb2R1bGUnKS5jb25zdGFudCgnVFJBTlNMQVRJT05fTU9ERScsICd0cmFuc2xhdGlvbk1vZGUnKTtcbi8vIFdoZW4gYW4gdW5yZXNvbHZlZCBhbnN3ZXIncyBmcmVxdWVuY3kgZXhjZWVkcyB0aGlzIHRocmVzaG9sZCwgYW4gZXhwbG9yYXRpb25cbi8vIHdpbGwgYmUgYmxvY2tlZCBmcm9tIGJlaW5nIHB1Ymxpc2hlZCB1bnRpbCB0aGUgYW5zd2VyIGlzIHJlc29sdmVkLlxuYW5ndWxhci5tb2R1bGUoJ2V4cGxvcmF0aW9uRWRpdG9yUGFnZU1vZHVsZScpLmNvbnN0YW50KCdVTlJFU09MVkVEX0FOU1dFUl9GUkVRVUVOQ1lfVEhSRVNIT0xEJywgNSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IE1vZHVsZSBmb3IgdGhlIEVkaXRvciB0YWIgaW4gdGhlIGV4cGxvcmF0aW9uIGVkaXRvciBwYWdlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZXhwbG9yYXRpb25FZGl0b3JUYWJNb2R1bGUnLCBbJ2V4cGxvcmF0aW9uR3JhcGhNb2R1bGUnLFxuICAgICdzdGF0ZUdyYXBoVmlzdWFsaXphdGlvbk1vZHVsZScsICdzdGF0ZU5hbWVFZGl0b3JNb2R1bGUnLFxuICAgICdzdGF0ZVBhcmFtQ2hhbmdlc0VkaXRvck1vZHVsZScsICd0ZXN0SW50ZXJhY3Rpb25QYW5lbE1vZHVsZScsXG4gICAgJ3RyYWluaW5nUGFuZWxNb2R1bGUnLCAndW5yZXNvbHZlZEFuc3dlcnNPdmVydmlld01vZHVsZSdcbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIHRoZSBleHBsb3JhdGlvbiBncmFwaC5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2V4cGxvcmF0aW9uR3JhcGhNb2R1bGUnLCBbXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IE1vZHVsZSBmb3IgdGhlIHN0YXRlIGdyYXBoIHZpc3VhbGl6YXRpb24uXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdzdGF0ZUdyYXBoVmlzdWFsaXphdGlvbk1vZHVsZScsIFtdKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgTW9kdWxlIGZvciB0aGUgc3RhdGUgbmFtZSBlZGl0b3Igc2VjdGlvbiBvZiB0aGUgc3RhdGVcbiAqIGVkaXRvci5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ3N0YXRlTmFtZUVkaXRvck1vZHVsZScsIFtdKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgTW9kdWxlIGZvciB0aGUgcGFyYW0gY2hhbmdlcyBlZGl0b3Igc2VjdGlvbiBvZiB0aGVcbiAqIHN0YXRlIGVkaXRvci5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ3N0YXRlUGFyYW1DaGFuZ2VzRWRpdG9yTW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIHRoZSB0ZXN0IGludGVyYWN0aW9uIHBhbmVsIGluIHRoZSBzdGF0ZSBlZGl0b3IuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCd0ZXN0SW50ZXJhY3Rpb25QYW5lbE1vZHVsZScsIFtdKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgTW9kdWxlIGZvciB0aGUgdHJhaW5pbmcgcGFuZWwgaW4gdGhlIHN0YXRlIGVkaXRvci5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ3RyYWluaW5nUGFuZWxNb2R1bGUnLCBbXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IE1vZHVsZSBmb3IgdGhlIHN0YXRlIGdyYXBoIHZpc3VhbGl6YXRpb24uXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCd1bnJlc29sdmVkQW5zd2Vyc092ZXJ2aWV3TW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTcgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIHRoZSBleHBsb3JhdGlvbiBvYmplY3RpdmUvZ29hbCBmaWVsZCBpbiBmb3Jtcy5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2V4cGxvcmF0aW9uT2JqZWN0aXZlRWRpdG9yTW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIHRoZSBleHBsb3JhdGlvbiBzYXZlICYgcHVibGlzaCBidXR0b25zLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZXhwbG9yYXRpb25TYXZlQW5kUHVsaXNoQnV0dG9uc01vZHVsZScsIFtdKTtcbiIsIi8vIENvcHlyaWdodCAyMDE3IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgTW9kdWxlIGZvciB0aGUgZXhwbG9yYXRpb24gdGl0bGUgZmllbGQgaW4gZm9ybXMuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdleHBsb3JhdGlvblRpdGxlRWRpdG9yTW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBDb250cm9sbGVyIGZvciB0aGUgZXhwbG9yYXRpb24gZWRpdG9yIGZlZWRiYWNrIHRhYi5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2ZlZWRiYWNrVGFiTW9kdWxlJywgWyd0aHJlYWRUYWJsZU1vZHVsZSddKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgTW9kdWxlIGZvciBkaXNwbGF5aW5nIHRoZSBsaXN0IG9mIHRocmVhZHMgaW4gdGhlIGZlZWRiYWNrXG4gKiB0YWIgb2YgdGhlIGV4cGxvcmF0aW9uIGVkaXRvci5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ3RocmVhZFRhYmxlTW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIHRoZSBleHBsb3JhdGlvbiBoaXN0b3J5IHRhYi5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2hpc3RvcnlUYWJNb2R1bGUnLCBbXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IE1vZHVsZSBmb3IgdGhlIGV4cGxvcmF0aW9uIGltcHJvdmVtZW50cyB0YWIgaW4gdGhlXG4gKiBleHBsb3JhdGlvbiBlZGl0b3IuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdpbXByb3ZlbWVudHNUYWJNb2R1bGUnLCBbJ3BsYXl0aHJvdWdoSW1wcm92ZW1lbnRDYXJkTW9kdWxlJ10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbmFuZ3VsYXIubW9kdWxlKCdwbGF5dGhyb3VnaEltcHJvdmVtZW50Q2FyZE1vZHVsZScsIFtdKTtcbiIsIi8vIENvcHlyaWdodCAyMDE4IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgTW9kdWxlIGZvciB0aGVcbiAqIG1hcmtfYWxsX2F1ZGlvX2FuZF90cmFuc2xhdGlvbnNfYXNfbmVlZGluZ191cGRhdGUgbW9kYWwuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdtYXJrQWxsQXVkaW9BbmRUcmFuc2xhdGlvbnNBc05lZWRpbmdVcGRhdGVNb2R1bGUnLCBbXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgdGhlIHBhcmFtZXRlciBjaGFuZ2VzIGVkaXRvciAod2hpY2ggaXMgc2hvd24gaW5cbiAqIGJvdGggdGhlIGV4cGxvcmF0aW9uIHNldHRpbmdzIHRhYiBhbmQgdGhlIHN0YXRlIGVkaXRvciBwYWdlKS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ3BhcmFtc0NoYW5nZXNFZGl0b3JNb2R1bGUnLCBbXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IE1vZHVsZSBmb3IgdGhlIGV4cGxvcmF0aW9uIHByZXZpZXcgaW4gdGhlXG4gKiBlZGl0b3IgcGFnZS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ3ByZXZpZXdUYWJNb2R1bGUnLCBbXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IE1vZHVsZSBmb3IgdGhlIGV4cGxvcmF0aW9uIHNldHRpbmdzIHRhYi5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ3NldHRpbmdzVGFiTW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlICBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgTW9kdWxlIGZvciBiYXIgY2hhcnQgdmlzdWFsaXphdGlvbi5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2JhckNoYXJ0TW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIHZpc3VhbGl6aW5nIG11bHRpcGxlIGluY29ycmVjdCBpc3N1ZS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2N5Y2xpY1RyYW5zaXRpb25Jc3N1ZU1vZHVsZScsIFtdKTtcbiIsIi8vIENvcHlyaWdodCAyMDE4IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgTW9kdWxlIGZvciB2aXN1YWxpemluZyBlYXJseSBxdWl0IGlzc3VlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZWFybHlRdWl0SXNzdWVNb2R1bGUnLCBbXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IE1vZHVsZSBmb3IgdmlzdWFsaXppbmcgbXVsdGlwbGUgaW5jb3JyZWN0IGlzc3VlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnbXVsdGlwbGVJbmNvcnJlY3RJc3N1ZU1vZHVsZScsIFtdKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgTW9kdWxlIGZvciBwaWUgY2hhcnQgdmlzdWFsaXphdGlvbi5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ3BpZUNoYXJ0TW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIHZpc3VhbGl6aW5nIGlzc3Vlcy5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ3BsYXl0aHJvdWdoSXNzdWVzTW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIHRoZSBleHBsb3JhdGlvbiBzdGF0aXN0aWNzIHRhYiBpbiB0aGVcbiAqIGV4cGxvcmF0aW9uIGVkaXRvci5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ3N0YXRpc3RpY3NUYWJNb2R1bGUnLCBbJ2JhckNoYXJ0TW9kdWxlJyxcbiAgICAnY3ljbGljVHJhbnNpdGlvbklzc3VlTW9kdWxlJywgJ2Vhcmx5UXVpdElzc3VlTW9kdWxlJyxcbiAgICAnbXVsdGlwbGVJbmNvcnJlY3RJc3N1ZU1vZHVsZScsICdwaWVDaGFydE1vZHVsZScsICdwbGF5dGhyb3VnaElzc3Vlc01vZHVsZSdcbl0pO1xuYW5ndWxhci5tb2R1bGUoJ3N0YXRpc3RpY3NUYWJNb2R1bGUnKS5jb25zdGFudCgnSU1QUk9WRV9UWVBFX0lOQ09NUExFVEUnLCAnaW5jb21wbGV0ZScpO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIHRoZSBhdWRpbyB0cmFuc2xhdGlvbiBiYXIuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdhdWRpb1RyYW5zbGF0aW9uQmFyTW9kdWxlJywgW10pO1xuLy8gQ29uc3RhbnQgZm9yIGF1ZGlvIHJlY29yZGluZyB0aW1lIGxpbWl0LlxuYW5ndWxhci5tb2R1bGUoJ2F1ZGlvVHJhbnNsYXRpb25CYXJNb2R1bGUnKS5jb25zdGFudCgnUkVDT1JESU5HX1RJTUVfTElNSVQnLCAzMDApO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIHRoZSBzdGF0ZSB0cmFuc2xhdGlvbiBlZGl0b3IuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdzdGF0ZVRyYW5zbGF0aW9uRWRpdG9yTW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBEaXJlY3RpdmUgZm9yIHRoZSBzdGF0ZSB0cmFuc2xhdGlvbiBzdGF0dXMgZ3JhcGguXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdzdGF0ZVRyYW5zbGF0aW9uU3RhdHVzR3JhcGhNb2R1bGUnLCBbXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IE1vZHVsZSBjb250YWluaW5nIHRoZSBleHBsb3JhdGlvbiBtYXRlcmlhbCB0byBiZSB0cmFuc2xhdGVkLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnc3RhdGVUcmFuc2xhdGlvbk1vZHVsZScsIFtdKTtcbiIsIi8vIENvcHlyaWdodCAyMDE4IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgTW9kdWxlIGZvciB0aGUgdHJhbnNsYXRpb24gdGFiLlxuICovXG5hbmd1bGFyLm1vZHVsZSgndHJhbnNsYXRpb25UYWJNb2R1bGUnLCBbJ2F1ZGlvVHJhbnNsYXRpb25CYXJNb2R1bGUnLFxuICAgICdzdGF0ZVRyYW5zbGF0aW9uTW9kdWxlJywgJ3N0YXRlVHJhbnNsYXRpb25FZGl0b3JNb2R1bGUnLFxuICAgICdzdGF0ZVRyYW5zbGF0aW9uU3RhdHVzR3JhcGhNb2R1bGUnLCAndHJhbnNsYXRvck92ZXJ2aWV3TW9kdWxlJ1xuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IE1vZHVsZSBmb3IgdGhlIHRyYW5zbGF0aW9uIG92ZXJ2aWV3IGFuZCBjaGFuZ2luZ1xuICogdHJhbnNsYXRpb24gbGFuZ3VhZ2UuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCd0cmFuc2xhdG9yT3ZlcnZpZXdNb2R1bGUnLCBbXSk7XG5hbmd1bGFyLm1vZHVsZSgndHJhbnNsYXRvck92ZXJ2aWV3TW9kdWxlJykuY29uc3RhbnQoJ0RFRkFVTFRfQVVESU9fTEFOR1VBR0UnLCAnZW4nKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgTW9kdWxlIGZvciB0aGUgcGFyYW1ldGVyIGdlbmVyYXRvciBlZGl0b3JzLlxuICovXG5hbmd1bGFyLm1vZHVsZSgndmFsdWVHZW5lcmF0b3JFZGl0b3JNb2R1bGUnLCBbXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IE1vZHVsZSBmb3IgdGhlIExlYXJuZXIgZGFzaGJvYXJkLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnbGVhcm5lckRhc2hib2FyZFBhZ2VNb2R1bGUnLCBbXSk7XG5hbmd1bGFyLm1vZHVsZSgnbGVhcm5lckRhc2hib2FyZFBhZ2VNb2R1bGUnKS5jb25zdGFudCgnTEVBUk5FUl9EQVNIQk9BUkRfU0VDVElPTl9JMThOX0lEUycsIHtcbiAgICBJTkNPTVBMRVRFOiAnSTE4Tl9MRUFSTkVSX0RBU0hCT0FSRF9JTkNPTVBMRVRFX1NFQ1RJT04nLFxuICAgIENPTVBMRVRFRDogJ0kxOE5fTEVBUk5FUl9EQVNIQk9BUkRfQ09NUExFVEVEX1NFQ1RJT04nLFxuICAgIFNVQlNDUklQVElPTlM6ICdJMThOX0xFQVJORVJfREFTSEJPQVJEX1NVQlNDUklQVElPTlNfU0VDVElPTicsXG4gICAgRkVFREJBQ0s6ICdJMThOX0xFQVJORVJfREFTSEJPQVJEX0ZFRURCQUNLX1NFQ1RJT04nLFxuICAgIFBMQVlMSVNUOiAnSTE4Tl9MRUFSTkVSX0RBU0hCT0FSRF9QTEFZTElTVF9TRUNUSU9OJ1xufSk7XG5hbmd1bGFyLm1vZHVsZSgnbGVhcm5lckRhc2hib2FyZFBhZ2VNb2R1bGUnKS5jb25zdGFudCgnTEVBUk5FUl9EQVNIQk9BUkRfU1VCU0VDVElPTl9JMThOX0lEUycsIHtcbiAgICBFWFBMT1JBVElPTlM6ICdJMThOX0RBU0hCT0FSRF9FWFBMT1JBVElPTlMnLFxuICAgIENPTExFQ1RJT05TOiAnSTE4Tl9EQVNIQk9BUkRfQ09MTEVDVElPTlMnXG59KTtcbmFuZ3VsYXIubW9kdWxlKCdsZWFybmVyRGFzaGJvYXJkUGFnZU1vZHVsZScpLmNvbnN0YW50KCdFWFBMT1JBVElPTlNfU09SVF9CWV9LRVlTX0FORF9JMThOX0lEUycsIHtcbiAgICBMQVNUX1BMQVlFRDoge1xuICAgICAgICBrZXk6ICdsYXN0X3BsYXllZCcsXG4gICAgICAgIGkxOG5JZDogJ0kxOE5fTEVBUk5FUl9EQVNIQk9BUkRfRVhQTE9SQVRJT05TX1NPUlRfQllfTEFTVF9QTEFZRUQnXG4gICAgfSxcbiAgICBUSVRMRToge1xuICAgICAgICBrZXk6ICd0aXRsZScsXG4gICAgICAgIGkxOG5JZDogJ0kxOE5fREFTSEJPQVJEX0VYUExPUkFUSU9OU19TT1JUX0JZX1RJVExFJ1xuICAgIH0sXG4gICAgQ0FURUdPUlk6IHtcbiAgICAgICAga2V5OiAnY2F0ZWdvcnknLFxuICAgICAgICBpMThuSWQ6ICdJMThOX0RBU0hCT0FSRF9FWFBMT1JBVElPTlNfU09SVF9CWV9DQVRFR09SWSdcbiAgICB9XG59KTtcbmFuZ3VsYXIubW9kdWxlKCdsZWFybmVyRGFzaGJvYXJkUGFnZU1vZHVsZScpLmNvbnN0YW50KCdTVUJTQ1JJUFRJT05fU09SVF9CWV9LRVlTX0FORF9JMThOX0lEUycsIHtcbiAgICBVU0VSTkFNRToge1xuICAgICAgICBrZXk6ICdzdWJzY3JpYmVyX3VzZXJuYW1lJyxcbiAgICAgICAgaTE4bklkOiAnSTE4Tl9QUkVGRVJFTkNFU19VU0VSTkFNRSdcbiAgICB9LFxuICAgIElNUEFDVDoge1xuICAgICAgICBrZXk6ICdzdWJzY3JpYmVyX2ltcGFjdCcsXG4gICAgICAgIGkxOG5JZDogJ0kxOE5fQ1JFQVRPUl9JTVBBQ1QnXG4gICAgfVxufSk7XG5hbmd1bGFyLm1vZHVsZSgnbGVhcm5lckRhc2hib2FyZFBhZ2VNb2R1bGUnKS5jb25zdGFudCgnRkVFREJBQ0tfVEhSRUFEU19TT1JUX0JZX0tFWVNfQU5EX0kxOE5fSURTJywge1xuICAgIExBU1RfVVBEQVRFRDoge1xuICAgICAgICBrZXk6ICdsYXN0X3VwZGF0ZWQnLFxuICAgICAgICBpMThuSWQ6ICdJMThOX0RBU0hCT0FSRF9FWFBMT1JBVElPTlNfU09SVF9CWV9MQVNUX1VQREFURUQnXG4gICAgfSxcbiAgICBFWFBMT1JBVElPTjoge1xuICAgICAgICBrZXk6ICdleHBsb3JhdGlvbicsXG4gICAgICAgIGkxOG5JZDogJ0kxOE5fREFTSEJPQVJEX1RBQkxFX0hFQURJTkdfRVhQTE9SQVRJT04nXG4gICAgfVxufSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IE1vZHVsZSBmb3IgYW4gaW5maW5pdGVseS1zY3JvbGxhYmxlIHZpZXcgb2YgYWN0aXZpdHkgdGlsZXMuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdhY3Rpdml0eVRpbGVzSW5maW5pdHlHcmlkTW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIHRoZSBPcHBpYSBsaWJyYXJ5IGZvb3Rlci5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2xpYnJhcnlGb290ZXJNb2R1bGUnLCBbXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IE1vZHVsZSBmb3IgdGhlIE9wcGlhIGNvbnRyaWJ1dG9ycycgbGlicmFyeSBwYWdlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnbGlicmFyeVBhZ2VNb2R1bGUnLCBbJ2FjdGl2aXR5VGlsZXNJbmZpbml0eUdyaWRNb2R1bGUnLFxuICAgICdsaWJyYXJ5Rm9vdGVyTW9kdWxlJywgJ3NlYXJjaEJhck1vZHVsZScsICdzZWFyY2hSZXN1bHRzTW9kdWxlJ10pO1xuYW5ndWxhci5tb2R1bGUoJ2xpYnJhcnlQYWdlTW9kdWxlJykuY29uc3RhbnQoJ0xJQlJBUllfUEFHRV9NT0RFUycsIHtcbiAgICBHUk9VUDogJ2dyb3VwJyxcbiAgICBJTkRFWDogJ2luZGV4JyxcbiAgICBTRUFSQ0g6ICdzZWFyY2gnXG59KTtcbmFuZ3VsYXIubW9kdWxlKCdsaWJyYXJ5UGFnZU1vZHVsZScpLmNvbnN0YW50KCdMSUJSQVJZX1BBVEhTX1RPX01PREVTJywge1xuICAgICcvbGlicmFyeSc6ICdpbmRleCcsXG4gICAgJy9saWJyYXJ5L3RvcF9yYXRlZCc6ICdncm91cCcsXG4gICAgJy9saWJyYXJ5L3JlY2VudGx5X3B1Ymxpc2hlZCc6ICdncm91cCcsXG4gICAgJy9zZWFyY2gvZmluZCc6ICdzZWFyY2gnXG59KTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgTW9kdWxlIGZvciB0aGUgU2VhcmNoIEJhci5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ3NlYXJjaEJhck1vZHVsZScsIFtdKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgTW9kdWxlIGZvciBzaG93aW5nIHNlYXJjaCByZXN1bHRzLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnc2VhcmNoUmVzdWx0c01vZHVsZScsIFtdKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgVGhlIG1vZHVsZSBmb3IgdGhlIG1haW50ZW5hbmNlIHBhZ2UuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdtYWludGVuYW5jZVBhZ2VNb2R1bGUnLCBbXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4qIEBmaWxlb3ZlcnZpZXcgTW9kdWxlIGZvciB0aGUgT3BwaWEgbW9kZXJhdG9yIHBhZ2UuXG4qL1xuYW5ndWxhci5tb2R1bGUoJ21vZGVyYXRvclBhZ2VNb2R1bGUnLCBbXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IE1vZHVsZSBmb3IgdGhlIHVzZXIncyBub3RpZmljYXRpb25zIGRhc2hib2FyZC5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ25vdGlmaWNhdGlvbnNEYXNoYm9hcmRQYWdlTW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIHRoZSBwcmFjdGljZSBzZXNzaW9uLlxuICovXG5hbmd1bGFyLm1vZHVsZSgncHJhY3RpY2VTZXNzaW9uUGFnZU1vZHVsZScsIFtdKTtcbmFuZ3VsYXIubW9kdWxlKCdwcmFjdGljZVNlc3Npb25QYWdlTW9kdWxlJykuY29uc3RhbnQoJ1RPVEFMX1FVRVNUSU9OUycsIDIwKTtcbmFuZ3VsYXIubW9kdWxlKCdwcmFjdGljZVNlc3Npb25QYWdlTW9kdWxlJykuY29uc3RhbnQoJ1BSQUNUSUNFX1NFU1NJT05TX0RBVEFfVVJMJywgJy9wcmFjdGljZV9zZXNzaW9uL2RhdGEvPHRvcGljX25hbWU+Jyk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IE1vZHVsZSBmb3IgdGhlIE9wcGlhICdlZGl0IHByZWZlcmVuY2VzJyBwYWdlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgncHJlZmVyZW5jZXNQYWdlTW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIHRoZSBPcHBpYSBwcm9maWxlIHBhZ2UuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdwcm9maWxlUGFnZU1vZHVsZScsIFtdKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgTW9kdWxlIGZvciB0aGUgcXVlc3Rpb25zIGVkaXRvciBkaXJlY3RpdmUuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdxdWVzdGlvbkVkaXRvclBhZ2VNb2R1bGUnLCBbXSk7XG5hbmd1bGFyLm1vZHVsZSgncXVlc3Rpb25FZGl0b3JQYWdlTW9kdWxlJykuY29uc3RhbnQoJ0lOVEVSQUNUSU9OX1NQRUNTJywgR0xPQkFMUy5JTlRFUkFDVElPTl9TUEVDUyk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IE1vZHVsZSBmb3IgdGhlIHF1ZXN0aW9ucyBwbGF5ZXIgZGlyZWN0aXZlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgncXVlc3Rpb25QbGF5ZXJQYWdlTW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIHRoZSBxdWVzdGlvbnMgbGlzdC5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ3F1ZXN0aW9uc0xpc3RQYWdlTW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgdG8gc2hvdyBzdWdnZXN0aW9uIG1vZGFsIGluIGNyZWF0b3Igdmlldy5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ3Nob3dTdWdnZXN0aW9uTW9kYWxGb3JDcmVhdG9yVmlld01vZHVsZScsIFtdKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgTW9kdWxlIHRvIHNob3cgc3VnZ2VzdGlvbiBtb2RhbCBpbiBlZGl0b3Igdmlldy5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ3Nob3dTdWdnZXN0aW9uTW9kYWxGb3JFZGl0b3JWaWV3TW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgdG8gc2hvdyBzdWdnZXN0aW9uIG1vZGFsIGluIGxlYXJuZXIgbG9jYWwgdmlldy5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ3Nob3dTdWdnZXN0aW9uTW9kYWxGb3JMb2NhbFZpZXdNb2R1bGUnLCBbXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IE1vZHVsZSB0byBzaG93IHN1Z2dlc3Rpb24gbW9kYWwgaW4gbGVhcm5lciB2aWV3LlxuICovXG5hbmd1bGFyLm1vZHVsZSgnc2hvd1N1Z2dlc3Rpb25Nb2RhbEZvckxlYXJuZXJWaWV3TW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIHN1Z2dlc3Rpb24gbW9kYWwgc2VydmljZXMuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdzdWdnZXN0aW9uTW9kYWxNb2R1bGUnLCBbXG4gICAgJ3Nob3dTdWdnZXN0aW9uTW9kYWxGb3JDcmVhdG9yVmlld01vZHVsZScsXG4gICAgJ3Nob3dTdWdnZXN0aW9uTW9kYWxGb3JFZGl0b3JWaWV3TW9kdWxlJyxcbiAgICAnc2hvd1N1Z2dlc3Rpb25Nb2RhbEZvckxvY2FsVmlld01vZHVsZScsXG4gICAgJ3Nob3dTdWdnZXN0aW9uTW9kYWxGb3JMZWFybmVyVmlld01vZHVsZSdcbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIHRoZSBPcHBpYSBwcm9maWxlIHBhZ2UuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdzaWdudXBQYWdlTW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIHRoZSBjb25jZXB0IGNhcmQgZWRpdG9yLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnc2tpbGxDb25jZXB0Q2FyZEVkaXRvck1vZHVsZScsIFtcbiAgICAnd29ya2VkRXhhbXBsZUVkaXRvck1vZHVsZSdcbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIHRoZSB3b3JrZWQgZXhhbXBsZSBlZGl0b3IuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCd3b3JrZWRFeGFtcGxlRWRpdG9yTW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIHRoZSBza2lsbCBkZXNjcmlwdGlvbiBlZGl0b3IuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdza2lsbERlc2NyaXB0aW9uRWRpdG9yTW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIHRoZSBtYWluIHRhYiBvZiB0aGUgc2tpbGwgZWRpdG9yLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnc2tpbGxFZGl0b3JNYWluVGFiTW9kdWxlJywgW1xuICAgICdza2lsbENvbmNlcHRDYXJkRWRpdG9yTW9kdWxlJywgJ3NraWxsRGVzY3JpcHRpb25FZGl0b3JNb2R1bGUnLFxuICAgICdza2lsbE1pc2NvbmNlcHRpb25zRWRpdG9yTW9kdWxlJ1xuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IERpcmVjdGl2ZSBmb3IgdGhlIG1pc2NvbmNlcHRpb24gZWRpdG9yLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnbWlzY29uY2VwdGlvbkVkaXRvck1vZHVsZScsIFtdKTtcbiIsIi8vIENvcHlyaWdodCAyMDE4IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgTW9kdWxlIGZvciB0aGUgc2tpbGwgbWlzY29uY2VwdGlvbnMgZWRpdG9yLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnc2tpbGxNaXNjb25jZXB0aW9uc0VkaXRvck1vZHVsZScsIFtcbiAgICAnbWlzY29uY2VwdGlvbkVkaXRvck1vZHVsZSdcbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIHRoZSBuYXZiYXIgYnJlYWRjcnVtYiBvZiB0aGUgc2tpbGwgZWRpdG9yLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnc2tpbGxFZGl0b3JOYXZiYXJCcmVhZGNydW1iTW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIHRoZSBuYXZiYXIgb2YgdGhlIHNraWxsIGVkaXRvci5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ3NraWxsRWRpdG9yTmF2YmFyTW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIHRoZSBza2lsbCBlZGl0b3IgcGFnZS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ3NraWxsRWRpdG9yTW9kdWxlJywgW1xuICAgICdza2lsbEVkaXRvck1haW5UYWJNb2R1bGUnLCAnc2tpbGxFZGl0b3JOYXZiYXJNb2R1bGUnLFxuICAgICdza2lsbEVkaXRvck5hdmJhckJyZWFkY3J1bWJNb2R1bGUnLCAnc2tpbGxFZGl0b3JRdWVzdGlvbnNUYWJNb2R1bGUnXG5dKTtcbmFuZ3VsYXIubW9kdWxlKCdza2lsbEVkaXRvck1vZHVsZScpLmNvbnN0YW50KCdJTlRFUkFDVElPTl9TUEVDUycsIEdMT0JBTFMuSU5URVJBQ1RJT05fU1BFQ1MpO1xuYW5ndWxhci5tb2R1bGUoJ3NraWxsRWRpdG9yTW9kdWxlJykuY29uc3RhbnQoJ1NLSUxMX1JJR0hUU19VUkxfVEVNUExBVEUnLCAnL3NraWxsX2VkaXRvcl9oYW5kbGVyL3JpZ2h0cy88c2tpbGxfaWQ+Jyk7XG5hbmd1bGFyLm1vZHVsZSgnc2tpbGxFZGl0b3JNb2R1bGUnKS5jb25zdGFudCgnU0tJTExfUFVCTElTSF9VUkxfVEVNUExBVEUnLCAnL3NraWxsX2VkaXRvcl9oYW5kbGVyL3B1Ymxpc2hfc2tpbGwvPHNraWxsX2lkPicpO1xuYW5ndWxhci5tb2R1bGUoJ3NraWxsRWRpdG9yTW9kdWxlJykuY29uc3RhbnQoJ0VWRU5UX1NLSUxMX0lOSVRJQUxJWkVEJywgJ3NraWxsSW5pdGlhbGl6ZWQnKTtcbmFuZ3VsYXIubW9kdWxlKCdza2lsbEVkaXRvck1vZHVsZScpLmNvbnN0YW50KCdFVkVOVF9TS0lMTF9SRUlOSVRJQUxJWkVEJywgJ3NraWxsUmVpbml0aWFsaXplZCcpO1xuYW5ndWxhci5tb2R1bGUoJ3NraWxsRWRpdG9yTW9kdWxlJykuY29uc3RhbnQoJ0VWRU5UX1FVRVNUSU9OX1NVTU1BUklFU19JTklUSUFMSVpFRCcsICdxdWVzdGlvblN1bW1hcmllc0luaXRpYWxpemVkJyk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IE1vZHVsZSBmb3IgdGhlIHF1ZXN0aW9ucyB0YWIuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdza2lsbEVkaXRvclF1ZXN0aW9uc1RhYk1vZHVsZScsIFtdKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgTW9kdWxlIGZvciB0aGUgZm9yIHRoZSBPcHBpYSBzcGxhc2ggcGFnZS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ3NwbGFzaFBhZ2VNb2R1bGUnLCBbXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNyBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IE1vZHVsZSBmb3IgdGhlIHN0YXRlIGNvbnRlbnQgZWRpdG9yLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnc3RhdGVDb250ZW50RWRpdG9yTW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIHRoZSBzdGF0ZSBlZGl0b3IgZGlyZWN0aXZlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnc3RhdGVFZGl0b3JNb2R1bGUnLCBbJ3N0YXRlU29sdXRpb25FZGl0b3JNb2R1bGUnLFxuICAgICdzdGF0ZVJlc3BvbnNlc01vZHVsZScsICdzdGF0ZUludGVyYWN0aW9uRWRpdG9yTW9kdWxlJyxcbiAgICAnc3RhdGVIaW50c0VkaXRvck1vZHVsZScsICdzdGF0ZUNvbnRlbnRFZGl0b3JNb2R1bGUnXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNyBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IE1vZHVsZSBmb3IgdGhlIGFkZCBhbmQgdmlldyBoaW50cyBzZWN0aW9uIG9mIHRoZSBzdGF0ZVxuICogZWRpdG9yLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnc3RhdGVIaW50c0VkaXRvck1vZHVsZScsIFtdKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgTW9kdWxlIGZvciB0aGUgaW50ZXJhY3Rpb24gZWRpdG9yIHNlY3Rpb24gaW4gdGhlIHN0YXRlXG4gKiBlZGl0b3IuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdzdGF0ZUludGVyYWN0aW9uRWRpdG9yTW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIG1hbmFnaW5nIHRoZSBzdGF0ZSByZXNwb25zZXMgaW4gdGhlIHN0YXRlIGVkaXRvci5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ3N0YXRlUmVzcG9uc2VzTW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTcgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIHRoZSBzb2x1dGlvbiB2aWV3ZXIgYW5kIGVkaXRvciBzZWN0aW9uIGluIHRoZVxuICogc3RhdGUgZWRpdG9yLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnc3RhdGVTb2x1dGlvbkVkaXRvck1vZHVsZScsIFtdKTtcbiIsIi8vIENvcHlyaWdodCAyMDE4IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgTW9kdWxlIGZvciB0aGUgbWFpbiBzdG9yeSBlZGl0b3IuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdtYWluU3RvcnlFZGl0b3JNb2R1bGUnLCBbJ3N0b3J5Tm9kZUVkaXRvck1vZHVsZSddKTtcbmFuZ3VsYXIubW9kdWxlKCdtYWluU3RvcnlFZGl0b3JNb2R1bGUnKS5jb25zdGFudCgnRVZFTlRfVklFV19TVE9SWV9OT0RFX0VESVRPUicsICd2aWV3U3RvcnlOb2RlRWRpdG9yJyk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IE1vZHVsZSBmb3IgdGhlIHN0b3J5IG5vZGUgZWRpdG9yLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnc3RvcnlOb2RlRWRpdG9yTW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIHRoZSBuYXZiYXIgYnJlYWRjcnVtYiBvZiB0aGUgc3RvcnkgZWRpdG9yLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnc3RvcnlFZGl0b3JOYXZiYXJCcmVhZGNydW1iTW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIHRoZSBuYXZiYXIgb2YgdGhlIHN0b3J5IGVkaXRvci5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ3N0b3J5RWRpdG9yTmF2YmFyTW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIHRoZSBzdG9yeSBlZGl0b3IgcGFnZS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ3N0b3J5RWRpdG9yTW9kdWxlJywgWydzdG9yeUVkaXRvck5hdmJhckJyZWFkY3J1bWJNb2R1bGUnLFxuICAgICdzdG9yeUVkaXRvck5hdmJhck1vZHVsZScsICdtYWluU3RvcnlFZGl0b3JNb2R1bGUnXSk7XG5hbmd1bGFyLm1vZHVsZSgnc3RvcnlFZGl0b3JNb2R1bGUnKS5jb25zdGFudCgnTk9ERV9JRF9QUkVGSVgnLCAnbm9kZV8nKTtcbmFuZ3VsYXIubW9kdWxlKCdzdG9yeUVkaXRvck1vZHVsZScpLmNvbnN0YW50KCdFVkVOVF9TVE9SWV9JTklUSUFMSVpFRCcsICdzdG9yeUluaXRpYWxpemVkJyk7XG5hbmd1bGFyLm1vZHVsZSgnc3RvcnlFZGl0b3JNb2R1bGUnKS5jb25zdGFudCgnRVZFTlRfU1RPUllfUkVJTklUSUFMSVpFRCcsICdzdG9yeVJlaW5pdGlhbGl6ZWQnKTtcbiIsIi8vIENvcHlyaWdodCAyMDE2IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgTW9kdWxlIGZvciB0aGUgdGVhY2ggcGFnZS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ3RlYWNoUGFnZU1vZHVsZScsIFtdKTtcbiIsIi8vIENvcHlyaWdodCAyMDE5IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgTW9kdWxlIGZvciB0aGUgJ3RoYW5rcycgcGFnZS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ3RoYW5rc1BhZ2VNb2R1bGUnLCBbXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IE1vZHVsZSBmb3IgdGhlIHN0b3JpZXMgbGlzdCB2aWV3ZXIuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdtYWluVG9waWNFZGl0b3JTdG9yaWVzTGlzdE1vZHVsZScsIFtdKTtcbiIsIi8vIENvcHlyaWdodCAyMDE4IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgTW9kdWxlIGZvciB0aGUgbWFpbiB0b3BpYyBlZGl0b3IuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdtYWluVG9waWNFZGl0b3JNb2R1bGUnLCBbJ21haW5Ub3BpY0VkaXRvclN0b3JpZXNMaXN0TW9kdWxlJ10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIHRoZSBxdWVzdGlvbnMgdGFiLlxuICovXG5hbmd1bGFyLm1vZHVsZSgncXVlc3Rpb25zVGFiTW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIHRoZSBzdWJ0b3BpY3MgbGlzdCBlZGl0b3IuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdzdWJ0b3BpY3NMaXN0VGFiTW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTYgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIHRoZSBuYXZiYXIgYnJlYWRjcnVtYiBvZiB0aGUgdG9waWMgZWRpdG9yLlxuICovXG5hbmd1bGFyLm1vZHVsZSgndG9waWNFZGl0b3JOYXZiYXJCcmVhZGNydW1iTW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIHRoZSBuYXZiYXIgb2YgdGhlIHRvcGljIGVkaXRvci5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ3RvcGljRWRpdG9yTmF2YmFyTW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBQcmltYXJ5IGNvbnRyb2xsZXIgZm9yIHRoZSB0b3BpYyBlZGl0b3IgcGFnZS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ3RvcGljRWRpdG9yUGFnZU1vZHVsZScsIFtcbiAgICAndG9waWNFZGl0b3JOYXZiYXJCcmVhZGNydW1iTW9kdWxlJywgJ3RvcGljRWRpdG9yTmF2YmFyTW9kdWxlJyxcbiAgICAnc3VidG9waWNzTGlzdFRhYk1vZHVsZScsICdxdWVzdGlvbnNUYWJNb2R1bGUnLCAnbWFpblRvcGljRWRpdG9yTW9kdWxlJ1xuXSk7XG5hbmd1bGFyLm1vZHVsZSgndG9waWNFZGl0b3JQYWdlTW9kdWxlJykuY29uc3RhbnQoJ0lOVEVSQUNUSU9OX1NQRUNTJywgR0xPQkFMUy5JTlRFUkFDVElPTl9TUEVDUyk7XG5hbmd1bGFyLm1vZHVsZSgndG9waWNFZGl0b3JQYWdlTW9kdWxlJykuY29uc3RhbnQoJ0VESVRBQkxFX1RPUElDX0RBVEFfVVJMX1RFTVBMQVRFJywgJy90b3BpY19lZGl0b3JfaGFuZGxlci9kYXRhLzx0b3BpY19pZD4nKTtcbmFuZ3VsYXIubW9kdWxlKCd0b3BpY0VkaXRvclBhZ2VNb2R1bGUnKS5jb25zdGFudCgnVE9QSUNfTUFOQUdFUl9SSUdIVFNfVVJMX1RFTVBMQVRFJywgJy9yaWdodHNoYW5kbGVyL2Fzc2lnbl90b3BpY19tYW5hZ2VyLzx0b3BpY19pZD4vPGFzc2lnbmVlX2lkPicpO1xuYW5ndWxhci5tb2R1bGUoJ3RvcGljRWRpdG9yUGFnZU1vZHVsZScpLmNvbnN0YW50KCdUT1BJQ19SSUdIVFNfVVJMX1RFTVBMQVRFJywgJy9yaWdodHNoYW5kbGVyL2dldF90b3BpY19yaWdodHMvPHRvcGljX2lkPicpO1xuYW5ndWxhci5tb2R1bGUoJ3RvcGljRWRpdG9yUGFnZU1vZHVsZScpLmNvbnN0YW50KCdTVUJUT1BJQ19QQUdFX0VESVRPUl9EQVRBX1VSTF9URU1QTEFURScsICcvc3VidG9waWNfcGFnZV9lZGl0b3JfaGFuZGxlci9kYXRhLzx0b3BpY19pZD4vPHN1YnRvcGljX2lkPicpO1xuYW5ndWxhci5tb2R1bGUoJ3RvcGljRWRpdG9yUGFnZU1vZHVsZScpLmNvbnN0YW50KCdUT1BJQ19OQU1FX0lOUFVUX0ZPQ1VTX0xBQkVMJywgJ3RvcGljTmFtZUlucHV0Rm9jdXNMYWJlbCcpO1xuYW5ndWxhci5tb2R1bGUoJ3RvcGljRWRpdG9yUGFnZU1vZHVsZScpLmNvbnN0YW50KCdFVkVOVF9UT1BJQ19JTklUSUFMSVpFRCcsICd0b3BpY0luaXRpYWxpemVkJyk7XG5hbmd1bGFyLm1vZHVsZSgndG9waWNFZGl0b3JQYWdlTW9kdWxlJykuY29uc3RhbnQoJ0VWRU5UX1RPUElDX1JFSU5JVElBTElaRUQnLCAndG9waWNSZWluaXRpYWxpemVkJyk7XG5hbmd1bGFyLm1vZHVsZSgndG9waWNFZGl0b3JQYWdlTW9kdWxlJykuY29uc3RhbnQoJ0VWRU5UX1NVQlRPUElDX1BBR0VfTE9BREVEJywgJ3N1YnRvcGljUGFnZUxvYWRlZCcpO1xuYW5ndWxhci5tb2R1bGUoJ3RvcGljRWRpdG9yUGFnZU1vZHVsZScpLmNvbnN0YW50KCdFVkVOVF9TVE9SWV9TVU1NQVJJRVNfSU5JVElBTElaRUQnLCAnc3RvcnlTdW1tYXJpZXNJbml0aWFsaXplZCcpO1xuYW5ndWxhci5tb2R1bGUoJ3RvcGljRWRpdG9yUGFnZU1vZHVsZScpLmNvbnN0YW50KCdFVkVOVF9RVUVTVElPTl9TVU1NQVJJRVNfSU5JVElBTElaRUQnLCAncXVlc3Rpb25TdW1tYXJpZXNJbml0aWFsaXplZCcpO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIHRoZSBzdGV3YXJkcyBsYW5kaW5nIHBhZ2UuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCd0b3BpY0xhbmRpbmdQYWdlU3Rld2FyZHNNb2R1bGUnLCBbXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOSBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IE1vZHVsZSBmb3IgdGhlIGxhbmRpbmcgcGFnZS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ3RvcGljTGFuZGluZ1BhZ2VNb2R1bGUnLCBbJ3RvcGljTGFuZGluZ1BhZ2VTdGV3YXJkc01vZHVsZSddKTtcbi8vIE5vdGU6IFRoaXMgb3BwaWEgY29uc3RhbnQgbmVlZHMgdG8gYmUga2VlcCBpbiBzeW5jIHdpdGhcbi8vIEFWQUlMQUJMRV9MQU5ESU5HX1BBR0VTIGNvbnN0YW50IGRlZmluZWQgaW4gZmVjb25mLnB5IGZpbGUuXG5hbmd1bGFyLm1vZHVsZSgndG9waWNMYW5kaW5nUGFnZU1vZHVsZScpLmNvbnN0YW50KCdUT1BJQ19MQU5ESU5HX1BBR0VfREFUQScsIHtcbiAgICBtYXRoczoge1xuICAgICAgICBmcmFjdGlvbnM6IHtcbiAgICAgICAgICAgIGNvbGxlY3Rpb25faWQ6ICc0VWdUUVVjMXRhbGEnLFxuICAgICAgICAgICAgcGFnZV9kYXRhOiB7XG4gICAgICAgICAgICAgICAgaW1hZ2VfMTogJ21hdHRoZXdfcGFwZXIucG5nJyxcbiAgICAgICAgICAgICAgICBpbWFnZV8yOiAnbWF0dGhld19mcmFjdGlvbnMucG5nJyxcbiAgICAgICAgICAgICAgICB2aWRlbzogJ2ZyYWN0aW9uc192aWRlby5tcDQnLFxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICByYXRpb3M6IHtcbiAgICAgICAgICAgIGNvbGxlY3Rpb25faWQ6ICc1M2dYR0xJUjA0NGwnLFxuICAgICAgICAgICAgcGFnZV9kYXRhOiB7XG4gICAgICAgICAgICAgICAgaW1hZ2VfMTogJ3JhdGlvc19KYW1lcy5wbmcnLFxuICAgICAgICAgICAgICAgIGltYWdlXzI6ICdyYXRpb3NfcXVlc3Rpb24ucG5nJyxcbiAgICAgICAgICAgICAgICB2aWRlbzogJ3JhdGlvc192aWRlby5tcDQnLFxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IE1vZHVsZSBmb3IgdGhlIHN0b3JpZXMgbGlzdC5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ3N0b3JpZXNMaXN0TW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIHRoZSBuYXZiYXIgYnJlYWRjcnVtYiBvZiB0aGUgdG9waWMgdmlld2VyLlxuICovXG5hbmd1bGFyLm1vZHVsZSgndG9waWNWaWV3ZXJOYXZiYXJCcmVhZGNydW1iTW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIHRoZSB0b3BpYyB2aWV3ZXIuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCd0b3BpY1ZpZXdlclBhZ2VNb2R1bGUnLCBbXG4gICAgJ3N0b3JpZXNMaXN0TW9kdWxlJywgJ3RvcGljVmlld2VyTmF2YmFyQnJlYWRjcnVtYk1vZHVsZSdcbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIHRoZSBzZWxlY3QgdG9waWNzIHZpZXdlci5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ3NlbGVjdFRvcGljc01vZHVsZScsIFtdKTtcbiIsIi8vIENvcHlyaWdodCAyMDE4IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgTW9kdWxlIGZvciB0aGUgc2tpbGxzIGxpc3Qgdmlld2VyLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnc2tpbGxzTGlzdE1vZHVsZScsIFtdKTtcbiIsIi8vIENvcHlyaWdodCAyMDE4IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgTW9kdWxlIGZvciB0aGUgbmF2YmFyIGJyZWFkY3J1bWIgb2YgdGhlIHRvcGljcyBhbmQgc2tpbGxzXG4gKiBkYXNoYm9hcmQuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCd0b3BpY3NBbmRTa2lsbHNEYXNoYm9hcmROYXZiYXJCcmVhZGNydW1iTW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIHRoZSBuYXZiYXIgb2YgdGhlIGNvbGxlY3Rpb24gZWRpdG9yLlxuICovXG5hbmd1bGFyLm1vZHVsZSgndG9waWNzQW5kU2tpbGxzRGFzaGJvYXJkTmF2YmFyTW9kdWxlJywgW10pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBNb2R1bGUgZm9yIHRoZSB0b3BpY3MgYW5kIHNraWxscyBkYXNoYm9hcmQuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCd0b3BpY3NBbmRTa2lsbHNEYXNoYm9hcmRNb2R1bGUnLCBbXG4gICAgJ3NlbGVjdFRvcGljc01vZHVsZScsICdza2lsbHNMaXN0TW9kdWxlJyxcbiAgICAndG9waWNzQW5kU2tpbGxzRGFzaGJvYXJkTmF2YmFyQnJlYWRjcnVtYk1vZHVsZScsXG4gICAgJ3RvcGljc0FuZFNraWxsc0Rhc2hib2FyZE5hdmJhck1vZHVsZScsICd0b3BpY3NMaXN0TW9kdWxlJ1xuXSk7XG5hbmd1bGFyLm1vZHVsZSgndG9waWNzQW5kU2tpbGxzRGFzaGJvYXJkTW9kdWxlJykuY29uc3RhbnQoJ0VESVRBQkxFX1RPUElDX0RBVEFfVVJMX1RFTVBMQVRFJywgJy90b3BpY19lZGl0b3JfaGFuZGxlci9kYXRhLzx0b3BpY19pZD4nKTtcbmFuZ3VsYXIubW9kdWxlKCd0b3BpY3NBbmRTa2lsbHNEYXNoYm9hcmRNb2R1bGUnKS5jb25zdGFudCgnU1VCVE9QSUNfUEFHRV9FRElUT1JfREFUQV9VUkxfVEVNUExBVEUnLCAnL3N1YnRvcGljX3BhZ2VfZWRpdG9yX2hhbmRsZXIvZGF0YS88dG9waWNfaWQ+LzxzdWJ0b3BpY19pZD4nKTtcbmFuZ3VsYXIubW9kdWxlKCd0b3BpY3NBbmRTa2lsbHNEYXNoYm9hcmRNb2R1bGUnKS5jb25zdGFudCgnRVZFTlRfVFlQRV9UT1BJQ19DUkVBVElPTl9FTkFCTEVEJywgJ3RvcGljQ3JlYXRpb25FbmFibGVkJyk7XG5hbmd1bGFyLm1vZHVsZSgndG9waWNzQW5kU2tpbGxzRGFzaGJvYXJkTW9kdWxlJykuY29uc3RhbnQoJ0VWRU5UX1RZUEVfU0tJTExfQ1JFQVRJT05fRU5BQkxFRCcsICdza2lsbENyZWF0aW9uRW5hYmxlZCcpO1xuYW5ndWxhci5tb2R1bGUoJ3RvcGljc0FuZFNraWxsc0Rhc2hib2FyZE1vZHVsZScpLmNvbnN0YW50KCdFVkVOVF9UT1BJQ1NfQU5EX1NLSUxMU19EQVNIQk9BUkRfUkVJTklUSUFMSVpFRCcsICd0b3BpY3NBbmRTa2lsbHNEYXNoYm9hcmRSZWluaXRpYWxpemVkJyk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxOCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IE1vZHVsZSBmb3IgdGhlIHRvcGljcyBsaXN0IHZpZXdlci5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ3RvcGljc0xpc3RNb2R1bGUnLCBbXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFNlcnZpY2UgdG8gZHluYW1pY2FsbHkgY29uc3RydWN0IHRyYW5zbGF0aW9uIGlkcyBmb3IgaTE4bi5cbiAqL1xub3BwaWEuZmFjdG9yeSgnQ29uc3RydWN0VHJhbnNsYXRpb25JZHNTZXJ2aWNlJywgW1xuICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC8vIENvbnN0cnVjdCBhIHRyYW5zbGF0aW9uIGlkIGZvciBsaWJyYXJ5IGZyb20gbmFtZSBhbmQgYSBwcmVmaXguXG4gICAgICAgICAgICAvLyBFeDogJ2NhdGVnb3JpZXMnLCAnYXJ0JyAtPiAnSTE4Tl9MSUJSQVJZX0NBVEVHT1JJRVNfQVJUJ1xuICAgICAgICAgICAgZ2V0TGlicmFyeUlkOiBmdW5jdGlvbiAocHJlZml4LCBuYW1lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICgnSTE4Tl9MSUJSQVJZXycgKyBwcmVmaXgudG9VcHBlckNhc2UoKSArICdfJyArXG4gICAgICAgICAgICAgICAgICAgIG5hbWUudG9VcHBlckNhc2UoKS5zcGxpdCgnICcpLmpvaW4oJ18nKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4qIEBmaWxlb3ZlcnZpZXcgU2VydmljZSBmb3IgY29udmVydGluZyBkYXRlcyBpbiBtaWxsaXNlY29uZHNcbiogc2luY2UgdGhlIEVwb2NoIHRvIGh1bWFuLXJlYWRhYmxlIGRhdGVzLlxuKi9cbm9wcGlhLmZhY3RvcnkoJ0RhdGVUaW1lRm9ybWF0U2VydmljZScsIFsnJGZpbHRlcicsIGZ1bmN0aW9uICgkZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAvLyBSZXR1cm5zIGp1c3QgdGhlIHRpbWUgaWYgdGhlIGxvY2FsIGRhdGV0aW1lIHJlcHJlc2VudGF0aW9uIGhhcyB0aGVcbiAgICAgICAgICAgIC8vIHNhbWUgZGF0ZSBhcyB0aGUgY3VycmVudCBkYXRlLiBPdGhlcndpc2UsIHJldHVybnMganVzdCB0aGUgZGF0ZSBpZiB0aGVcbiAgICAgICAgICAgIC8vIGxvY2FsIGRhdGV0aW1lIHJlcHJlc2VudGF0aW9uIGhhcyB0aGUgc2FtZSB5ZWFyIGFzIHRoZSBjdXJyZW50IGRhdGUuXG4gICAgICAgICAgICAvLyBPdGhlcndpc2UsIHJldHVybnMgdGhlIGZ1bGwgZGF0ZSAod2l0aCB0aGUgeWVhciBhYmJyZXZpYXRlZCkuXG4gICAgICAgICAgICBnZXRMb2NhbGVBYmJyZXZpYXRlZERhdGV0aW1lU3RyaW5nOiBmdW5jdGlvbiAobWlsbGlzU2luY2VFcG9jaCkge1xuICAgICAgICAgICAgICAgIHZhciBkYXRlID0gbmV3IERhdGUobWlsbGlzU2luY2VFcG9jaCk7XG4gICAgICAgICAgICAgICAgaWYgKGRhdGUudG9Mb2NhbGVEYXRlU3RyaW5nKCkgPT09IG5ldyBEYXRlKCkudG9Mb2NhbGVEYXRlU3RyaW5nKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRhdGUudG9Mb2NhbGVUaW1lU3RyaW5nKFtdLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBob3VyOiAnbnVtZXJpYycsXG4gICAgICAgICAgICAgICAgICAgICAgICBtaW51dGU6ICdudW1lcmljJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGhvdXIxMjogdHJ1ZVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoZGF0ZS5nZXRGdWxsWWVhcigpID09PSBuZXcgRGF0ZSgpLmdldEZ1bGxZZWFyKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRmaWx0ZXIoJ2RhdGUnKShkYXRlLCAnTU1NIGQnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAkZmlsdGVyKCdkYXRlJykoZGF0ZSwgJ3Nob3J0RGF0ZScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBSZXR1cm5zIGp1c3QgdGhlIGRhdGUuXG4gICAgICAgICAgICBnZXRMb2NhbGVEYXRlU3RyaW5nOiBmdW5jdGlvbiAobWlsbGlzU2luY2VFcG9jaCkge1xuICAgICAgICAgICAgICAgIHZhciBkYXRlID0gbmV3IERhdGUobWlsbGlzU2luY2VFcG9jaCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRhdGUudG9Mb2NhbGVEYXRlU3RyaW5nKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gUmV0dXJucyB3aGV0aGVyIHRoZSBkYXRlIGlzIGF0IG1vc3Qgb25lIHdlZWsgYmVmb3JlIHRoZSBjdXJyZW50IGRhdGUuXG4gICAgICAgICAgICBpc1JlY2VudDogZnVuY3Rpb24gKG1pbGxpc1NpbmNlRXBvY2gpIHtcbiAgICAgICAgICAgICAgICB2YXIgT05FX1dFRUtfSU5fTUlMTElTID0gNyAqIDI0ICogNjAgKiA2MCAqIDEwMDA7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBEYXRlKCkuZ2V0VGltZSgpIC0gbWlsbGlzU2luY2VFcG9jaCA8IE9ORV9XRUVLX0lOX01JTExJUztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNCBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFNlcnZpY2UgZm9yIGRlYm91bmNpbmcgZnVuY3Rpb24gY2FsbHMuXG4gKi9cbm9wcGlhLmZhY3RvcnkoJ0RlYm91bmNlclNlcnZpY2UnLCBbZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLy8gUmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQgd2lsbCBub3QgYmUgdHJpZ2dlcmVkIGFzIGxvbmcgYXMgaXQgY29udGludWVzIHRvXG4gICAgICAgICAgICAvLyBiZSBpbnZva2VkLiBUaGUgZnVuY3Rpb24gb25seSBnZXRzIGV4ZWN1dGVkIGFmdGVyIGl0IHN0b3BzIGJlaW5nIGNhbGxlZFxuICAgICAgICAgICAgLy8gZm9yIGB3YWl0YCBtaWxsaXNlY29uZHMuXG4gICAgICAgICAgICBkZWJvdW5jZTogZnVuY3Rpb24gKGZ1bmMsIG1pbGxpc2Vjc1RvV2FpdCkge1xuICAgICAgICAgICAgICAgIHZhciB0aW1lb3V0O1xuICAgICAgICAgICAgICAgIHZhciBjb250ZXh0ID0gdGhpcztcbiAgICAgICAgICAgICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgICAgICAgICAgICB2YXIgdGltZXN0YW1wO1xuICAgICAgICAgICAgICAgIHZhciByZXN1bHQ7XG4gICAgICAgICAgICAgICAgdmFyIGxhdGVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbGFzdCA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpIC0gdGltZXN0YW1wO1xuICAgICAgICAgICAgICAgICAgICBpZiAobGFzdCA8IG1pbGxpc2Vjc1RvV2FpdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQobGF0ZXIsIG1pbGxpc2Vjc1RvV2FpdCAtIGxhc3QpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGltZW91dCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF0aW1lb3V0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJncyA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICBhcmdzID0gYXJndW1lbnRzO1xuICAgICAgICAgICAgICAgICAgICB0aW1lc3RhbXAgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0aW1lb3V0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aW1lb3V0ID0gc2V0VGltZW91dChsYXRlciwgbWlsbGlzZWNzVG9XYWl0KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfV0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBGYWN0b3J5IGZvciBuYXZpZ2F0aW5nIHRoZSB0b3AgbmF2aWdhdGlvbiBiYXIgd2l0aFxuICogdGFiIGFuZCBzaGlmdC10YWIuXG4gKi9cbm9wcGlhLmZhY3RvcnkoJ05hdmlnYXRpb25TZXJ2aWNlJywgW2Z1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG5hdmlnYXRpb24gPSB7XG4gICAgICAgICAgICBhY3RpdmVNZW51TmFtZTogJycsXG4gICAgICAgICAgICBBQ1RJT05fT1BFTjogJ29wZW4nLFxuICAgICAgICAgICAgQUNUSU9OX0NMT1NFOiAnY2xvc2UnLFxuICAgICAgICAgICAgS0VZQk9BUkRfRVZFTlRfVE9fS0VZX0NPREVTOiB7XG4gICAgICAgICAgICAgICAgZW50ZXI6IHtcbiAgICAgICAgICAgICAgICAgICAgc2hpZnRLZXlJc1ByZXNzZWQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBrZXlDb2RlOiAxM1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgdGFiOiB7XG4gICAgICAgICAgICAgICAgICAgIHNoaWZ0S2V5SXNQcmVzc2VkOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAga2V5Q29kZTogOVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgc2hpZnRUYWI6IHtcbiAgICAgICAgICAgICAgICAgICAgc2hpZnRLZXlJc1ByZXNzZWQ6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGtleUNvZGU6IDlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb3BlblN1Ym1lbnU6IG51bGwsXG4gICAgICAgICAgICBjbG9zZVN1Ym1lbnU6IG51bGwsXG4gICAgICAgICAgICBvbk1lbnVLZXlwcmVzczogbnVsbFxuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgKiBPcGVucyB0aGUgc3VibWVudS5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gZXZ0XG4gICAgICAgICogQHBhcmFtIHtTdHJpbmd9IG1lbnVOYW1lIC0gbmFtZSBvZiBtZW51LCBvbiB3aGljaFxuICAgICAgICAqIG9wZW4vY2xvc2UgYWN0aW9uIHRvIGJlIHBlcmZvcm1lZCAoY2F0ZWdvcnksbGFuZ3VhZ2UpLlxuICAgICAgICAqL1xuICAgICAgICBuYXZpZ2F0aW9uLm9wZW5TdWJtZW51ID0gZnVuY3Rpb24gKGV2dCwgbWVudU5hbWUpIHtcbiAgICAgICAgICAgIC8vIEZvY3VzIG9uIHRoZSBjdXJyZW50IHRhcmdldCBiZWZvcmUgb3BlbmluZyBpdHMgc3VibWVudS5cbiAgICAgICAgICAgIG5hdmlnYXRpb24uYWN0aXZlTWVudU5hbWUgPSBtZW51TmFtZTtcbiAgICAgICAgICAgIGFuZ3VsYXIuZWxlbWVudChldnQuY3VycmVudFRhcmdldCkuZm9jdXMoKTtcbiAgICAgICAgfTtcbiAgICAgICAgbmF2aWdhdGlvbi5jbG9zZVN1Ym1lbnUgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgICAgICBuYXZpZ2F0aW9uLmFjdGl2ZU1lbnVOYW1lID0gJyc7XG4gICAgICAgICAgICBhbmd1bGFyLmVsZW1lbnQoZXZ0LmN1cnJlbnRUYXJnZXQpLmNsb3Nlc3QoJ2xpJylcbiAgICAgICAgICAgICAgICAuZmluZCgnYScpLmJsdXIoKTtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEhhbmRsZXMga2V5ZG93biBldmVudHMgb24gbWVudXMuXG4gICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBldnRcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IG1lbnVOYW1lIC0gbmFtZSBvZiBtZW51IHRvIHBlcmZvcm0gYWN0aW9uXG4gICAgICAgICAqIG9uKGNhdGVnb3J5L2xhbmd1YWdlKVxuICAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gZXZlbnRzVG9iZUhhbmRsZWQgLSBNYXAga2V5Ym9hcmQgZXZlbnRzKCdFbnRlcicpIHRvXG4gICAgICAgICAqIGNvcnJlc3BvbmRpbmcgYWN0aW9ucyB0byBiZSBwZXJmb3JtZWQob3Blbi9jbG9zZSkuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAqICBvbk1lbnVLZXlwcmVzcygkZXZlbnQsICdjYXRlZ29yeScsIHtlbnRlcjogJ29wZW4nfSlcbiAgICAgICAgICovXG4gICAgICAgIG5hdmlnYXRpb24ub25NZW51S2V5cHJlc3MgPSBmdW5jdGlvbiAoZXZ0LCBtZW51TmFtZSwgZXZlbnRzVG9iZUhhbmRsZWQpIHtcbiAgICAgICAgICAgIHZhciB0YXJnZXRFdmVudHMgPSBPYmplY3Qua2V5cyhldmVudHNUb2JlSGFuZGxlZCk7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRhcmdldEV2ZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBrZXlDb2RlU3BlYyA9IG5hdmlnYXRpb24uS0VZQk9BUkRfRVZFTlRfVE9fS0VZX0NPREVTW3RhcmdldEV2ZW50c1tpXV07XG4gICAgICAgICAgICAgICAgaWYgKGtleUNvZGVTcGVjLmtleUNvZGUgPT09IGV2dC5rZXlDb2RlICYmXG4gICAgICAgICAgICAgICAgICAgIGV2dC5zaGlmdEtleSA9PT0ga2V5Q29kZVNwZWMuc2hpZnRLZXlJc1ByZXNzZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGV2ZW50c1RvYmVIYW5kbGVkW3RhcmdldEV2ZW50c1tpXV0gPT09IG5hdmlnYXRpb24uQUNUSU9OX09QRU4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hdmlnYXRpb24ub3BlblN1Ym1lbnUoZXZ0LCBtZW51TmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoZXZlbnRzVG9iZUhhbmRsZWRbdGFyZ2V0RXZlbnRzW2ldXSA9PT1cbiAgICAgICAgICAgICAgICAgICAgICAgIG5hdmlnYXRpb24uQUNUSU9OX0NMT1NFKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuYXZpZ2F0aW9uLmNsb3NlU3VibWVudShldnQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ0ludmFsaWQgYWN0aW9uIHR5cGUuJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBuYXZpZ2F0aW9uO1xuICAgIH1dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE4IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU2VydmljZSBQcm9tbyBiYXIuXG4gKi9cbm9wcGlhLmZhY3RvcnkoJ1Byb21vQmFyU2VydmljZScsIFtcbiAgICAnJGh0dHAnLCAnJHEnLCAnRU5BQkxFX1BST01PX0JBUicsXG4gICAgZnVuY3Rpb24gKCRodHRwLCAkcSwgRU5BQkxFX1BST01PX0JBUikge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZ2V0UHJvbW9CYXJEYXRhOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHByb21vQmFyRGF0YSA9IHtcbiAgICAgICAgICAgICAgICAgICAgcHJvbW9CYXJFbmFibGVkOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgcHJvbW9CYXJNZXNzYWdlOiAnJ1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgaWYgKEVOQUJMRV9QUk9NT19CQVIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL3Byb21vX2Jhcl9oYW5kbGVyJywge30pLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9tb0JhckRhdGEucHJvbW9CYXJFbmFibGVkID0gcmVzcG9uc2UuZGF0YS5wcm9tb19iYXJfZW5hYmxlZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb21vQmFyRGF0YS5wcm9tb0Jhck1lc3NhZ2UgPSByZXNwb25zZS5kYXRhLnByb21vX2Jhcl9tZXNzYWdlO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHByb21vQmFyRGF0YTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVzb2x2ZShwcm9tb0JhckRhdGEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgQSBoZWxwZXIgc2VydmljZSBmb3IgdGhlIFJpY2ggdGV4dCBlZGl0b3IoUlRFKS5cbiAqL1xub3BwaWEuY29uc3RhbnQoJ1JURV9DT01QT05FTlRfU1BFQ1MnLCByaWNoVGV4dENvbXBvbmVudHMpO1xub3BwaWEuZmFjdG9yeSgnUnRlSGVscGVyU2VydmljZScsIFtcbiAgICAnJGRvY3VtZW50JywgJyRmaWx0ZXInLCAnJGludGVycG9sYXRlJywgJyRsb2cnLCAnJHVpYk1vZGFsJyxcbiAgICAnQ29udGV4dFNlcnZpY2UnLCAnRm9jdXNNYW5hZ2VyU2VydmljZScsICdIdG1sRXNjYXBlclNlcnZpY2UnLFxuICAgICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsICdSVEVfQ09NUE9ORU5UX1NQRUNTJyxcbiAgICBmdW5jdGlvbiAoJGRvY3VtZW50LCAkZmlsdGVyLCAkaW50ZXJwb2xhdGUsICRsb2csICR1aWJNb2RhbCwgQ29udGV4dFNlcnZpY2UsIEZvY3VzTWFuYWdlclNlcnZpY2UsIEh0bWxFc2NhcGVyU2VydmljZSwgVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UsIFJURV9DT01QT05FTlRfU1BFQ1MpIHtcbiAgICAgICAgdmFyIF9SSUNIX1RFWFRfQ09NUE9ORU5UUyA9IFtdO1xuICAgICAgICBPYmplY3Qua2V5cyhSVEVfQ09NUE9ORU5UX1NQRUNTKS5zb3J0KCkuZm9yRWFjaChmdW5jdGlvbiAoY29tcG9uZW50SWQpIHtcbiAgICAgICAgICAgIF9SSUNIX1RFWFRfQ09NUE9ORU5UUy5wdXNoKHtcbiAgICAgICAgICAgICAgICBiYWNrZW5kSWQ6IFJURV9DT01QT05FTlRfU1BFQ1NbY29tcG9uZW50SWRdLmJhY2tlbmRfaWQsXG4gICAgICAgICAgICAgICAgY3VzdG9taXphdGlvbkFyZ1NwZWNzOiBhbmd1bGFyLmNvcHkoUlRFX0NPTVBPTkVOVF9TUEVDU1tjb21wb25lbnRJZF0uY3VzdG9taXphdGlvbl9hcmdfc3BlY3MpLFxuICAgICAgICAgICAgICAgIGlkOiBSVEVfQ09NUE9ORU5UX1NQRUNTW2NvbXBvbmVudElkXS5mcm9udGVuZF9pZCxcbiAgICAgICAgICAgICAgICBpY29uRGF0YVVybDogUlRFX0NPTVBPTkVOVF9TUEVDU1tjb21wb25lbnRJZF0uaWNvbl9kYXRhX3VybCxcbiAgICAgICAgICAgICAgICBpc0NvbXBsZXg6IFJURV9DT01QT05FTlRfU1BFQ1NbY29tcG9uZW50SWRdLmlzX2NvbXBsZXgsXG4gICAgICAgICAgICAgICAgaXNCbG9ja0VsZW1lbnQ6IFJURV9DT01QT05FTlRfU1BFQ1NbY29tcG9uZW50SWRdLmlzX2Jsb2NrX2VsZW1lbnQsXG4gICAgICAgICAgICAgICAgcmVxdWlyZXNGczogUlRFX0NPTVBPTkVOVF9TUEVDU1tjb21wb25lbnRJZF0ucmVxdWlyZXNfZnMsXG4gICAgICAgICAgICAgICAgdG9vbHRpcDogUlRFX0NPTVBPTkVOVF9TUEVDU1tjb21wb25lbnRJZF0udG9vbHRpcFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICB2YXIgX2NyZWF0ZUN1c3RvbWl6YXRpb25BcmdEaWN0RnJvbUF0dHJzID0gZnVuY3Rpb24gKGF0dHJzKSB7XG4gICAgICAgICAgICB2YXIgY3VzdG9taXphdGlvbkFyZ3NEaWN0ID0ge307XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGF0dHJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGF0dHIgPSBhdHRyc1tpXTtcbiAgICAgICAgICAgICAgICBpZiAoYXR0ci5uYW1lID09PSAnY2xhc3MnIHx8IGF0dHIubmFtZSA9PT0gJ3NyYycgfHxcbiAgICAgICAgICAgICAgICAgICAgYXR0ci5uYW1lID09PSAnX21vel9yZXNpemluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBzZXBhcmF0b3JMb2NhdGlvbiA9IGF0dHIubmFtZS5pbmRleE9mKCctd2l0aC12YWx1ZScpO1xuICAgICAgICAgICAgICAgIGlmIChzZXBhcmF0b3JMb2NhdGlvbiA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgJGxvZy5lcnJvcignUlRFIEVycm9yOiBpbnZhbGlkIGN1c3RvbWl6YXRpb24gYXR0cmlidXRlICcgKyBhdHRyLm5hbWUpO1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIGFyZ05hbWUgPSBhdHRyLm5hbWUuc3Vic3RyaW5nKDAsIHNlcGFyYXRvckxvY2F0aW9uKTtcbiAgICAgICAgICAgICAgICBjdXN0b21pemF0aW9uQXJnc0RpY3RbYXJnTmFtZV0gPSBIdG1sRXNjYXBlclNlcnZpY2UuZXNjYXBlZEpzb25Ub09iaihhdHRyLnZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBjdXN0b21pemF0aW9uQXJnc0RpY3Q7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBjcmVhdGVDdXN0b21pemF0aW9uQXJnRGljdEZyb21BdHRyczogZnVuY3Rpb24gKGF0dHJzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9jcmVhdGVDdXN0b21pemF0aW9uQXJnRGljdEZyb21BdHRycyhhdHRycyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0UmljaFRleHRDb21wb25lbnRzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFuZ3VsYXIuY29weShfUklDSF9URVhUX0NPTVBPTkVOVFMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGlzSW5saW5lQ29tcG9uZW50OiBmdW5jdGlvbiAocmljaFRleHRDb21wb25lbnQpIHtcbiAgICAgICAgICAgICAgICB2YXIgaW5saW5lQ29tcG9uZW50cyA9IFsnbGluaycsICdtYXRoJ107XG4gICAgICAgICAgICAgICAgcmV0dXJuIGlubGluZUNvbXBvbmVudHMuaW5kZXhPZihyaWNoVGV4dENvbXBvbmVudCkgIT09IC0xO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIFRoZSByZWZvY3VzRm4gYXJnIGlzIGEgZnVuY3Rpb24gdGhhdCByZXN0b3JlcyBmb2N1cyB0byB0aGUgdGV4dCBlZGl0b3JcbiAgICAgICAgICAgIC8vIGFmdGVyIGV4aXRpbmcgdGhlIG1vZGFsLCBhbmQgbW92ZXMgdGhlIGN1cnNvciBiYWNrIHRvIHdoZXJlIGl0IHdhc1xuICAgICAgICAgICAgLy8gYmVmb3JlIHRoZSBtb2RhbCB3YXMgb3BlbmVkLlxuICAgICAgICAgICAgX29wZW5DdXN0b21pemF0aW9uTW9kYWw6IGZ1bmN0aW9uIChjdXN0b21pemF0aW9uQXJnU3BlY3MsIGF0dHJzQ3VzdG9taXphdGlvbkFyZ3NEaWN0LCBvblN1Ym1pdENhbGxiYWNrLCBvbkRpc21pc3NDYWxsYmFjaywgcmVmb2N1c0ZuKSB7XG4gICAgICAgICAgICAgICAgJGRvY3VtZW50WzBdLmV4ZWNDb21tYW5kKCdlbmFibGVPYmplY3RSZXNpemluZycsIGZhbHNlLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgdmFyIG1vZGFsRGlhbG9nID0gJHVpYk1vZGFsLm9wZW4oe1xuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0RGlyZWN0aXZlVGVtcGxhdGVVcmwoJy9jb21wb25lbnRzL2Zvcm1zL2Zvcm1zLXRlbXBsYXRlcy8nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICdjdXN0b21pemUtcnRlLWNvbXBvbmVudC1tb2RhbC50ZW1wbGF0ZS5odG1sJyksXG4gICAgICAgICAgICAgICAgICAgIGJhY2tkcm9wOiAnc3RhdGljJyxcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZToge30sXG4gICAgICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICckc2NvcGUnLCAnJHVpYk1vZGFsSW5zdGFuY2UnLCAnJHRpbWVvdXQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKCRzY29wZSwgJHVpYk1vZGFsSW5zdGFuY2UsICR0aW1lb3V0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmN1c3RvbWl6YXRpb25BcmdTcGVjcyA9IGN1c3RvbWl6YXRpb25BcmdTcGVjcztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBXaXRob3V0IHRoaXMgY29kZSwgdGhlIGZvY3VzIHdpbGwgcmVtYWluIGluIHRoZSBiYWNrZ3JvdW5kIFJURVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGV2ZW4gYWZ0ZXIgdGhlIG1vZGFsIGxvYWRzLiBUaGlzIHN3aXRjaGVzIHRoZSBmb2N1cyB0byBhXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGVtcG9yYXJ5IGZpZWxkIGluIHRoZSBtb2RhbCB3aGljaCBpcyB0aGVuIHJlbW92ZWQgZnJvbSB0aGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBET00uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVE9ETyhzbGwpOiBNYWtlIHRoaXMgc3dpdGNoIHRvIHRoZSBmaXJzdCBpbnB1dCBmaWVsZCBpbiB0aGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBtb2RhbCBpbnN0ZWFkLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5tb2RhbElzTG9hZGluZyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgRm9jdXNNYW5hZ2VyU2VydmljZS5zZXRGb2N1cygndG1wRm9jdXNQb2ludCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLm1vZGFsSXNMb2FkaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnRtcEN1c3RvbWl6YXRpb25BcmdzID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjdXN0b21pemF0aW9uQXJnU3BlY3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNhTmFtZSA9IGN1c3RvbWl6YXRpb25BcmdTcGVjc1tpXS5uYW1lO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUudG1wQ3VzdG9taXphdGlvbkFyZ3MucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBjYU5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogKGF0dHJzQ3VzdG9taXphdGlvbkFyZ3NEaWN0Lmhhc093blByb3BlcnR5KGNhTmFtZSkgP1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuZ3VsYXIuY29weShhdHRyc0N1c3RvbWl6YXRpb25BcmdzRGljdFtjYU5hbWVdKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VzdG9taXphdGlvbkFyZ1NwZWNzW2ldLmRlZmF1bHRfdmFsdWUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY2FuY2VsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdWliTW9kYWxJbnN0YW5jZS5kaXNtaXNzKCdjYW5jZWwnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zYXZlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuJGJyb2FkY2FzdCgnZXh0ZXJuYWxTYXZlJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjdXN0b21pemF0aW9uQXJnc0RpY3QgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAkc2NvcGUudG1wQ3VzdG9taXphdGlvbkFyZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjYU5hbWUgPSAkc2NvcGUudG1wQ3VzdG9taXphdGlvbkFyZ3NbaV0ubmFtZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1c3RvbWl6YXRpb25BcmdzRGljdFtjYU5hbWVdID0gKCRzY29wZS50bXBDdXN0b21pemF0aW9uQXJnc1tpXS52YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHVpYk1vZGFsSW5zdGFuY2UuY2xvc2UoY3VzdG9taXphdGlvbkFyZ3NEaWN0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgbW9kYWxEaWFsb2cucmVzdWx0LnRoZW4ob25TdWJtaXRDYWxsYmFjaywgb25EaXNtaXNzQ2FsbGJhY2spO1xuICAgICAgICAgICAgICAgIC8vICdmaW5hbGx5JyBpcyBhIEpTIGtleXdvcmQuIElmIGl0IGlzIGp1c3QgdXNlZCBpbiBpdHMgXCIuZmluYWxseVwiIGZvcm0sXG4gICAgICAgICAgICAgICAgLy8gdGhlIG1pbmlmaWNhdGlvbiBwcm9jZXNzIHRocm93cyBhbiBlcnJvci5cbiAgICAgICAgICAgICAgICBtb2RhbERpYWxvZy5yZXN1bHRbJ2ZpbmFsbHknXShyZWZvY3VzRm4pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBGYWN0b3J5IGZvciBjYWxjdWxhdGluZyB0aGUgc3RhdGlzdGljcyBvZiBhIHBhcnRpY3VsYXIgc3RhdGUuXG4gKi9cbnJlcXVpcmUoJ3BhZ2VzL2V4cGxvcmF0aW9uLWVkaXRvci1wYWdlL2V4cGxvcmF0aW9uLWVkaXRvci1wYWdlLXNlcnZpY2VzLycgK1xuICAgICdhbmd1bGFyLW5hbWUvYW5ndWxhci1uYW1lLnNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3BhZ2VzL2V4cGxvcmF0aW9uX3BsYXllci9BbnN3ZXJDbGFzc2lmaWNhdGlvblNlcnZpY2UudHMnKTtcbnJlcXVpcmUoJ3NlcnZpY2VzL0NvbnRleHRTZXJ2aWNlLnRzJyk7XG5yZXF1aXJlKCdkb21haW4vb2JqZWN0cy9GcmFjdGlvbk9iamVjdEZhY3RvcnkudHMnKTtcbnJlcXVpcmUoJ2RvbWFpbi91dGlsaXRpZXMvVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UudHMnKTtcbm9wcGlhLmZhY3RvcnkoJ1N0YXRlUnVsZXNTdGF0c1NlcnZpY2UnLCBbXG4gICAgJyRodHRwJywgJyRpbmplY3RvcicsICdBbmd1bGFyTmFtZVNlcnZpY2UnLCAnQW5zd2VyQ2xhc3NpZmljYXRpb25TZXJ2aWNlJyxcbiAgICAnQ29udGV4dFNlcnZpY2UnLCAnRnJhY3Rpb25PYmplY3RGYWN0b3J5JywgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJyxcbiAgICBmdW5jdGlvbiAoJGh0dHAsICRpbmplY3RvciwgQW5ndWxhck5hbWVTZXJ2aWNlLCBBbnN3ZXJDbGFzc2lmaWNhdGlvblNlcnZpY2UsIENvbnRleHRTZXJ2aWNlLCBGcmFjdGlvbk9iamVjdEZhY3RvcnksIFVybEludGVycG9sYXRpb25TZXJ2aWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFRPRE8oYnJpYW5yb2RyaSk6IENvbnNpZGVyIG1vdmluZyB0aGlzIGludG8gYSB2aXN1YWxpemF0aW9uIGRvbWFpblxuICAgICAgICAgICAgICogb2JqZWN0LlxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7T2JqZWN0IX0gc3RhdGVcbiAgICAgICAgICAgICAqIEByZXR1cm4ge0Jvb2xlYW59IHdoZXRoZXIgZ2l2ZW4gc3RhdGUgaGFzIGFuIGltcGxlbWVudGF0aW9uIGZvclxuICAgICAgICAgICAgICogICAgIGRpc3BsYXlpbmcgdGhlIGltcHJvdmVtZW50cyBvdmVydmlldyB0YWIgaW4gdGhlIFN0YXRlIEVkaXRvci5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgc3RhdGVTdXBwb3J0c0ltcHJvdmVtZW50c092ZXJ2aWV3OiBmdW5jdGlvbiAoc3RhdGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RhdGUuaW50ZXJhY3Rpb24uaWQgPT09ICdUZXh0SW5wdXQnO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogUmV0dXJucyBhIHByb21pc2Ugd2hpY2ggd2lsbCBwcm92aWRlIGRldGFpbHMgb2YgdGhlIGdpdmVuIHN0YXRlJ3NcbiAgICAgICAgICAgICAqIGFuc3dlci1zdGF0aXN0aWNzLlxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSB7T2JqZWN0IX0gc3RhdGVcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgY29tcHV0ZVN0YXRlUnVsZXNTdGF0czogZnVuY3Rpb24gKHN0YXRlKSB7XG4gICAgICAgICAgICAgICAgdmFyIGludGVyYWN0aW9uUnVsZXNTZXJ2aWNlID0gJGluamVjdG9yLmdldChBbmd1bGFyTmFtZVNlcnZpY2UuZ2V0TmFtZU9mSW50ZXJhY3Rpb25SdWxlc1NlcnZpY2Uoc3RhdGUuaW50ZXJhY3Rpb24uaWQpKTtcbiAgICAgICAgICAgICAgICB2YXIgZXhwbG9yYXRpb25JZCA9IENvbnRleHRTZXJ2aWNlLmdldEV4cGxvcmF0aW9uSWQoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvY3JlYXRlaGFuZGxlci9zdGF0ZV9ydWxlc19zdGF0cy8nICsgW1xuICAgICAgICAgICAgICAgICAgICBlbmNvZGVVUklDb21wb25lbnQoZXhwbG9yYXRpb25JZCksXG4gICAgICAgICAgICAgICAgICAgIGVuY29kZVVSSUNvbXBvbmVudChzdGF0ZS5uYW1lKVxuICAgICAgICAgICAgICAgIF0uam9pbignLycpKS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGVfbmFtZTogc3RhdGUubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4cGxvcmF0aW9uX2lkOiBleHBsb3JhdGlvbklkLFxuICAgICAgICAgICAgICAgICAgICAgICAgdmlzdWFsaXphdGlvbnNfaW5mbzogcmVzcG9uc2UuZGF0YS52aXN1YWxpemF0aW9uc19pbmZvLm1hcChmdW5jdGlvbiAodml6SW5mbykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBuZXdWaXpJbmZvID0gYW5ndWxhci5jb3B5KHZpekluZm8pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld1ZpekluZm8uZGF0YS5mb3JFYWNoKGZ1bmN0aW9uICh2aXpJbmZvRGF0dW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgZGF0YSBpcyBhIEZyYWN0aW9uSW5wdXQsIG5lZWQgdG8gY2hhbmdlIGRhdGEgc28gdGhhdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB2aXN1YWxpemF0aW9uIGRpc3BsYXlzIHRoZSBpbnB1dCBpbiBhIHJlYWRhYmxlIG1hbm5lci5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN0YXRlLmludGVyYWN0aW9uLmlkID09PSAnRnJhY3Rpb25JbnB1dCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZpekluZm9EYXR1bS5hbnN3ZXIgPVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEZyYWN0aW9uT2JqZWN0RmFjdG9yeS5mcm9tRGljdCh2aXpJbmZvRGF0dW0uYW5zd2VyKS50b1N0cmluZygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChuZXdWaXpJbmZvLmFkZHJlc3NlZF9pbmZvX2lzX3N1cHBvcnRlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdml6SW5mb0RhdHVtLmlzX2FkZHJlc3NlZCA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQW5zd2VyQ2xhc3NpZmljYXRpb25TZXJ2aWNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5pc0NsYXNzaWZpZWRFeHBsaWNpdGx5T3JHb2VzVG9OZXdTdGF0ZShzdGF0ZS5uYW1lLCBzdGF0ZSwgdml6SW5mb0RhdHVtLmFuc3dlciwgaW50ZXJhY3Rpb25SdWxlc1NlcnZpY2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ld1ZpekluZm87XG4gICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIHRvIGxvYWQgdGhlIGkxOG4gdHJhbnNsYXRpb24gZmlsZS5cbiAqL1xub3BwaWEuZmFjdG9yeSgnVHJhbnNsYXRpb25GaWxlSGFzaExvYWRlclNlcnZpY2UnLCBbXG4gICAgJyRodHRwJywgJyRxJywgJ1VybEludGVycG9sYXRpb25TZXJ2aWNlJyxcbiAgICBmdW5jdGlvbiAoJGh0dHAsICRxLCBVcmxJbnRlcnBvbGF0aW9uU2VydmljZSkge1xuICAgICAgICAvKiBPcHRpb25zIG9iamVjdCBjb250YWluczpcbiAgICAgICAgICogIHByZWZpeDogYWRkZWQgYmVmb3JlIGtleSwgZGVmaW5lZCBieSBkZXZlbG9wZXJcbiAgICAgICAgICogIGtleTogbGFuZ3VhZ2Uga2V5LCBkZXRlcm1pbmVkIGludGVybmFsbHkgYnkgaTE4biBsaWJyYXJ5XG4gICAgICAgICAqICBzdWZmaXg6IGFkZGVkIGFmdGVyIGtleSwgZGVmaW5lZCBieSBkZXZlbG9wZXJcbiAgICAgICAgICovXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIGZpbGVVcmwgPSBbXG4gICAgICAgICAgICAgICAgb3B0aW9ucy5wcmVmaXgsXG4gICAgICAgICAgICAgICAgb3B0aW9ucy5rZXksXG4gICAgICAgICAgICAgICAgb3B0aW9ucy5zdWZmaXhcbiAgICAgICAgICAgIF0uam9pbignJyk7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KFVybEludGVycG9sYXRpb25TZXJ2aWNlLmdldFN0YXRpY0Fzc2V0VXJsKGZpbGVVcmwpKS50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0LmRhdGE7XG4gICAgICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdChvcHRpb25zLmtleSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICB9XG5dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE4IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU2VydmljZSBmb3IgdXNlciBkYXRhLlxuICovXG5vcHBpYS5mYWN0b3J5KCdVc2VyU2VydmljZScsIFtcbiAgICAnJGh0dHAnLCAnJHEnLCAnJHdpbmRvdycsICdVcmxJbnRlcnBvbGF0aW9uU2VydmljZScsICdVc2VySW5mb09iamVjdEZhY3RvcnknLFxuICAgICdERUZBVUxUX1BST0ZJTEVfSU1BR0VfUEFUSCcsXG4gICAgZnVuY3Rpb24gKCRodHRwLCAkcSwgJHdpbmRvdywgVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UsIFVzZXJJbmZvT2JqZWN0RmFjdG9yeSwgREVGQVVMVF9QUk9GSUxFX0lNQUdFX1BBVEgpIHtcbiAgICAgICAgdmFyIFBSRUZFUkVOQ0VTX0RBVEFfVVJMID0gJy9wcmVmZXJlbmNlc2hhbmRsZXIvZGF0YSc7XG4gICAgICAgIHZhciB1c2VySW5mbyA9IG51bGw7XG4gICAgICAgIHZhciBnZXRVc2VySW5mb0FzeW5jID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKEdMT0JBTFMudXNlcklzTG9nZ2VkSW4pIHtcbiAgICAgICAgICAgICAgICBpZiAodXNlckluZm8pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlc29sdmUodXNlckluZm8pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvdXNlcmluZm9oYW5kbGVyJykudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgdXNlckluZm8gPSBVc2VySW5mb09iamVjdEZhY3RvcnkuY3JlYXRlRnJvbUJhY2tlbmREaWN0KHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdXNlckluZm87XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVzb2x2ZShVc2VySW5mb09iamVjdEZhY3RvcnkuY3JlYXRlRGVmYXVsdCgpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGdldFByb2ZpbGVJbWFnZURhdGFVcmxBc3luYzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBwcm9maWxlUGljdHVyZURhdGFVcmwgPSAoVXJsSW50ZXJwb2xhdGlvblNlcnZpY2UuZ2V0U3RhdGljSW1hZ2VVcmwoREVGQVVMVF9QUk9GSUxFX0lNQUdFX1BBVEgpKTtcbiAgICAgICAgICAgICAgICBpZiAoR0xPQkFMUy51c2VySXNMb2dnZWRJbikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvcHJlZmVyZW5jZXNoYW5kbGVyL3Byb2ZpbGVfcGljdHVyZScpLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2UuZGF0YS5wcm9maWxlX3BpY3R1cmVfZGF0YV91cmwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9maWxlUGljdHVyZURhdGFVcmwgPSByZXNwb25zZS5kYXRhLnByb2ZpbGVfcGljdHVyZV9kYXRhX3VybDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBwcm9maWxlUGljdHVyZURhdGFVcmw7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlc29sdmUocHJvZmlsZVBpY3R1cmVEYXRhVXJsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2V0UHJvZmlsZUltYWdlRGF0YVVybEFzeW5jOiBmdW5jdGlvbiAobmV3UHJvZmlsZUltYWdlRGF0YVVybCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkaHR0cC5wdXQoUFJFRkVSRU5DRVNfREFUQV9VUkwsIHtcbiAgICAgICAgICAgICAgICAgICAgdXBkYXRlX3R5cGU6ICdwcm9maWxlX3BpY3R1cmVfZGF0YV91cmwnLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBuZXdQcm9maWxlSW1hZ2VEYXRhVXJsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0TG9naW5VcmxBc3luYzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciB1cmxQYXJhbWV0ZXJzID0ge1xuICAgICAgICAgICAgICAgICAgICBjdXJyZW50X3VybDogJHdpbmRvdy5sb2NhdGlvbi5ocmVmXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvdXJsX2hhbmRsZXInLCB7IHBhcmFtczogdXJsUGFyYW1ldGVycyB9KS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5sb2dpbl91cmw7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0VXNlckluZm9Bc3luYzogZ2V0VXNlckluZm9Bc3luY1xuICAgICAgICB9O1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTQgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIGZvciBjb21wdXRpbmcgdGhlIHdpbmRvdyBkaW1lbnNpb25zLlxuICovXG5vcHBpYS5mYWN0b3J5KCdXaW5kb3dEaW1lbnNpb25zU2VydmljZScsIFsnJHdpbmRvdycsIGZ1bmN0aW9uICgkd2luZG93KSB7XG4gICAgICAgIHZhciBvblJlc2l6ZUhvb2tzID0gW107XG4gICAgICAgIGFuZ3VsYXIuZWxlbWVudCgkd2luZG93KS5iaW5kKCdyZXNpemUnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBvblJlc2l6ZUhvb2tzLmZvckVhY2goZnVuY3Rpb24gKGhvb2tGbikge1xuICAgICAgICAgICAgICAgIGhvb2tGbigpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZ2V0V2lkdGg6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKCR3aW5kb3cuaW5uZXJXaWR0aCB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGggfHxcbiAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5jbGllbnRXaWR0aCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVnaXN0ZXJPblJlc2l6ZUhvb2s6IGZ1bmN0aW9uIChob29rRm4pIHtcbiAgICAgICAgICAgICAgICBvblJlc2l6ZUhvb2tzLnB1c2goaG9va0ZuKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpc1dpbmRvd05hcnJvdzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBOT1JNQUxfTkFWQkFSX0NVVE9GRl9XSURUSF9QWCA9IDc2ODtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRXaWR0aCgpIDw9IE5PUk1BTF9OQVZCQVJfQ1VUT0ZGX1dJRFRIX1BYO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1dKTtcbiIsIi8vIENvcHlyaWdodCAyMDE0IFRoZSBPcHBpYSBBdXRob3JzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMtSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgU2VydmljZSBmb3IgZW5hYmxpbmcgYSBiYWNrZ3JvdW5kIG1hc2sgdGhhdCBsZWF2ZXMgbmF2aWdhdGlvblxuICogdmlzaWJsZS5cbiAqL1xub3BwaWEuZmFjdG9yeSgnQmFja2dyb3VuZE1hc2tTZXJ2aWNlJywgW1xuICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG1hc2tJc0FjdGl2ZSA9IGZhbHNlO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgaXNNYXNrQWN0aXZlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1hc2tJc0FjdGl2ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBhY3RpdmF0ZU1hc2s6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBtYXNrSXNBY3RpdmUgPSB0cnVlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRlYWN0aXZhdGVNYXNrOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgbWFza0lzQWN0aXZlID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iXSwic291cmNlUm9vdCI6IiJ9