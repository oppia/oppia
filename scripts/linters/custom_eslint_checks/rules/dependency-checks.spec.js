// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for the no-unused-dependency.js file.
 */

'use strict';

var rule = require('./dependency-checks');
var RuleTester = require('eslint').RuleTester;

var ruleTester = new RuleTester();
ruleTester.run('no-unused-dependency', rule, {
  valid: [
    `function test() {
      return {
        controller: [
          '$http', '$translate', 'I18nLanguageCodeService',
          'UserService', 'SUPPORTED_SITE_LANGUAGES',
          function(
              $http, $translate, I18nLanguageCodeService,
              UserService, SUPPORTED_SITE_LANGUAGES) {
            var ctrl = this;
            // Changes the language of the translations.
            var preferencesDataUrl = '/preferenceshandler/data';
            var siteLanguageUrl = '/save_site_language';
            ctrl.changeLanguage = function() {
              $translate.use(ctrl.currentLanguageCode);
              I18nLanguageCodeService.setI18nLanguageCode(
                ctrl.currentLanguageCode);
              UserService.getUserInfoAsync().then(function(userInfo) {
                if (userInfo.isLoggedIn()) {
                  $http.put(siteLanguageUrl, {
                    site_language_code: ctrl.currentLanguageCode
                  });
                }
              });
            };
            ctrl.$onInit = function() {
              ctrl.supportedSiteLanguages = SUPPORTED_SITE_LANGUAGES;
              ctrl.currentLanguageCode = (
                $translate.proposedLanguage() || $translate.use());
              I18nLanguageCodeService.setI18nLanguageCode(
                ctrl.currentLanguageCode);
            };
          }
        ]
      };
    }`,
    `function test() {
      return {
        controllers: [
          '$http', '$translate', 'I18nLanguageCodeService',
          'UserService', 'SUPPORTED_SITE_LANGUAGES',
          function(
              $http, $translate, I18nLanguageCodeService,
              UserService, SUPPORTED_SITE_LANGUAGES) {
            var ctrl = this;
            // Changes the language of the translations.
            var preferencesDataUrl = '/preferenceshandler/data';
            var siteLanguageUrl = '/save_site_language';
            ctrl.changeLanguage = function() {
              $translate.use(ctrl.currentLanguageCode);
              I18nLanguageCodeService.setI18nLanguageCode(
                ctrl.currentLanguageCode);
              UserService.getUserInfoAsync().then(function(userInfo) {
                if (userInfo.isLoggedIn()) {
                  $http.put(siteLanguageUrl, {
                    site_language_code: ctrl.currentLanguageCode
                  });
                }
              });
            };
            ctrl.$onInit = function() {
              ctrl.supportedSiteLanguages = SUPPORTED_SITE_LANGUAGES;
              ctrl.currentLanguageCode = (
                $translate.proposedLanguage() || $translate.use());
              I18nLanguageCodeService.setI18nLanguageCode(
                ctrl.currentLanguageCode);
            };
          }
        ]
      };
    }`,
    `function test() {
      return {
        controller: [
          (function() {
            return true;
          }), 'abc', 'abca'
        ]
      };
    }`,
    `function test() {
        a =  [
          '$http', '$translate', 'I18nLanguageCodeService',
          'UserService', 'SUPPORTED_SITE_LANGUAGES'
        ]
    }`
  ],

  invalid: [
    {
      code:
      `function test() {
        return {
          controller: [
            '$http', '$translate', 'I18nLanguageCodeService',
            'UserService', 'SUPPORTED_SITE_LANGUAGES',
            function(
                $http, $translate, I18nLanguageCodeService,
                UserService, SUPPORTED_SITE_LANGUAGES) {
              var ctrl = this;
              // Changes the language of the translations.
              var preferencesDataUrl = '/preferenceshandler/data';
              var siteLanguageUrl = '/save_site_language';
              ctrl.changeLanguage = function() {
                $translate.use(ctrl.currentLanguageCode);
                I18nLanguageCodeService.setI18nLanguageCode(
                  ctrl.currentLanguageCode);
                UserService.getUserInfoAsync().then(function(userInfo) {
                  if (userInfo.isLoggedIn()) {
                    $http.put(siteLanguageUrl, {
                      site_language_code: ctrl.currentLanguageCode
                    });
                  }
                });
              };
              ctrl.$onInit = function() {
                ctrl.supportedSiteLanguages = 'English';
                ctrl.currentLanguageCode = (
                  $translate.proposedLanguage() || $translate.use());
                I18nLanguageCodeService.setI18nLanguageCode(
                  ctrl.currentLanguageCode);
              };
            }
          ]
        };
      }`,
      errors: [{
        message: 'SUPPORTED_SITE_LANGUAGES is injected but never used.',
        type: 'ArrayExpression'
      }]
    },
    {
      code:
      `function test() {
        return {
          controller: [
            '$http', 'I18nLanguageCodeService', '$translate',
            'UserService', 'SUPPORTED_SITE_LANGUAGES',
            function(
                $http, I18nLanguageCodeService, $translate,
                UserService, SUPPORTED_SITE_LANGUAGES) {
              var ctrl = this;
              // Changes the language of the translations.
              var preferencesDataUrl = '/preferenceshandler/data';
              var siteLanguageUrl = '/save_site_language';
              ctrl.changeLanguage = function() {
                $translate.use(ctrl.currentLanguageCode);
                I18nLanguageCodeService.setI18nLanguageCode(
                  ctrl.currentLanguageCode);
                UserService.getUserInfoAsync().then(function(userInfo) {
                  if (userInfo.isLoggedIn()) {
                    $http.put(siteLanguageUrl, {
                      site_language_code: ctrl.currentLanguageCode
                    });
                  }
                });
              };
              ctrl.$onInit = function() {
                ctrl.supportedSiteLanguages = SUPPORTED_SITE_LANGUAGES;
                ctrl.currentLanguageCode = (
                  $translate.proposedLanguage() || $translate.use());
                I18nLanguageCodeService.setI18nLanguageCode(
                  ctrl.currentLanguageCode);
              };
            }
          ]
        };
      }`,
      errors: [{
        message: 'Dependencies are not sorted.',
        type: 'ArrayExpression'
      }]
    }
  ]
});
