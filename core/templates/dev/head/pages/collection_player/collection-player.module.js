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
 * @fileoverview Module for the learner's view of a collection.
 */

angular.module('collectionPlayerModule', [
  'collectionFooterModule', 'collectionNodeListModule']);

angular.module('collectionPlayerModule').constant(
  'COLLECTION_DATA_URL_TEMPLATE', '/collection_handler/data/<collection_id>');

angular.module('collectionPlayerModule').animation('.oppia-collection-animate-slide', 
  function() {
    return {
      enter: function(element) {
        element.hide().slideDown();
      },
      leave: function(element) {
        element.slideUp();
      }
    };
  }
);
