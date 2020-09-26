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
 * @fileoverview A data service that stores tags for the exploration.
 */

require(
  'pages/exploration-editor-page/services/exploration-property.service.ts');

angular.module('oppia').factory('ExplorationTagsService', [
  'ExplorationPropertyService', 'TAG_REGEX',
  function(ExplorationPropertyService, TAG_REGEX) {
    var child = Object.create(ExplorationPropertyService);
    child.propertyName = 'tags';
    /**
      *@param {string} value - tag array to be normalized
      *(white spaces removed and '+' replaced with ' ')
      *@return {string} -normalized array
    */
    child._normalize = function(value) {
      for (var i = 0; i < value.length; i++) {
        value[i] = value[i].trim().replace(/\s+/g, ' ');
      }
      // TODO(sll): Prevent duplicate tags from being added.
      return value;
    };
    /**
      *@param {string} value -tag array to be matched with TAG_REGEX
      *@return {boolean} -whether or not all tags match TAG_REGEX
    */
    child._isValid = function(value) {
      // Every tag should match the TAG_REGEX.
      for (var i = 0; i < value.length; i++) {
        var tagRegex = new RegExp(TAG_REGEX);
        if (!value[i].match(tagRegex)) {
          return false;
        }
      }

      return true;
    };
    return child;
  }
]);
