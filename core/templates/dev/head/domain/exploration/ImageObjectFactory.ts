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
 * @fileoverview Factory for creating new frontend instances of
 * Image domain objects.
 */

oppia.factory('ImageObjectFactory', [function() {
  var Image = function(src, placeholder, instructions) {
    this.src = src;
    this.placeholder = placeholder;
    this.instrutions = instructions;
  };

  Image.prototype.toBackendDict = function() {
    return {
      src: this.src,
      placeholder: this.placeholder,
      instructions: this.instructions
    };
  };

  /* eslint-disable dot-notation */
  Image['createNew'] = function(src, placeholder, instructions) {
  /* eslint-enable dot-notation */
    return new Image(src, placeholder, instructions);
  };

  /* eslint-disable dot-notation */
  Image['createFromBackendDict'] = function(imageBackendDict) {
  /* eslint-enable dot-notation */
    return new Image(
      imageBackendDict.src,
      imageBackendDict.placeholder,
      imageBackendDict.instructions
    );
  };

  return Image;
}]);
