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

require('./translations-backend-api.service.ts');

angular.module('oppia').factory('TranslationFileHashLoaderService', [
  '$q', 'TranslationsBackendApiService',
  function($q, TranslationsBackendApiService) {
    /* Options object contains:
     *  prefix: added before key, defined by developer
     *  key: language key, determined internally by i18n library
     *  suffix: added after key, defined by developer.
     */
    return function(options) {
      var fileUrl = [
        options.prefix,
        options.key,
        options.suffix
      ].join('');
      TranslationsBackendApiService.loadTranslationFileAsync(fileUrl)
        .then((result) => {
          return result.body;
        }, function() {
          return $q.reject(options.key);
        });
    };
  }
]);
