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
 * @fileoverview A data service that stores the current exploration title so
 * that it can be displayed and edited in multiple places in the UI.
 */

require('filters/string-utility-filters/normalize-whitespace.filter.ts');
require(
  'pages/exploration-editor-page/services/exploration-property.service.ts');
require(
  'pages/exploration-editor-page/services/' +
  'exploration-rights-backend-api.service.ts');
require('services/validators.service.ts');

angular.module('oppia').factory('ExplorationTitleService', [
  '$filter', 'ExplorationPropertyService', 'ExplorationRightsService',
  'ValidatorsService',
  function(
      $filter, ExplorationPropertyService, ExplorationRightsService,
      ValidatorsService) {
    var child = Object.create(ExplorationPropertyService);
    child.propertyName = 'title';
    child._normalize = $filter('normalizeWhitespace');
    child._isValid = function(value) {
      return ValidatorsService.isValidEntityName(
        value, true, ExplorationRightsService.isPrivate());
    };
    return child;
  }
]);
