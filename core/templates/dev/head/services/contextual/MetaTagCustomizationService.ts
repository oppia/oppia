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
 * @fileoverview Service to add custom meta tags.
 */

angular.module('oppia').factory('MetaTagCustomizationService', [
  '$window', function($window) {
    return {
      addMetaTags: function(attrArray) {
        attrArray.forEach(attr => {
          var meta = $window.document.createElement('meta');
          meta.setAttribute(attr.propertyType, attr.propertyValue);
          meta.setAttribute('content', attr.content);
          $window.document.head.appendChild(meta);
        });
      }
    };
  }
]);
