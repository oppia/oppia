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
 * @fileoverview Controller for the settings tab of the collection editor.
 */

require('pages/collection_editor/settings-tab/' +
  'collection-details-editor/collection-details-editor.directive.ts');
require('pages/collection_editor/settings-tab/' +
  'collection-permissions-card/collection-permissions-card.directive.ts');

require('domain/utilities/UrlInterpolationService.ts');

angular.module('collectionSettingsTabModule').directive('collectionSettingsTab', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/collection_editor/settings-tab/' +
        'collection-settings-tab.directive.html'),
      controller: [function() {}]
    };
  }]);
