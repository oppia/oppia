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
 * @fileoverview A data service that stores the current exploration image
 * counter so that it can be displayed and edited in multiple places in the UI.
 */

require('filters/string-utility-filters/normalize-whitespace.filter.ts');
require(
  'pages/exploration-editor-page/services/exploration-property.service.ts');
require('services/ValidatorsService.ts');

oppia.factory('ExplorationImageCounterService', [
  '$filter', 'ExplorationPropertyService', 'ValidatorsService',
  function(
      $filter, ExplorationPropertyService, ValidatorsService) {
    var child = Object.create(ExplorationPropertyService);
    child.propertyName = 'image_counter';
    child._normalize = $filter('number');
    return child;
  }
]);
