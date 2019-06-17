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
 * ImageAssets domain objects.
 */

require('domain/exploration/ImageObjectFactory.ts');

oppia.factory('ImageAssetsObjectFactory', [
  'ImageObjectFactory', function(ImageObjectFactory) {
    var ImageAssets = function(imageMapping) {
      this.imageMapping = imageMapping;
    };

    ImageAssets.prototype.toBackendDict = function() {
      var imageMapping = {};
      for (var imageId in this.imageMapping) {
        var imageObject = this.imageMapping[imageId];
        var imageDict = imageObject.toBackendDict();
        imageMapping[imageId] = imageDict;
      }
      return {
        image_mapping: imageMapping
      };
    };

    ImageAssets.prototype.addImage = function(imageId, imageInfo) {
      var src = imageInfo.src;
      var placeholder = imageInfo.placeholder;
      var authorId = imageInfo.authorId;
      var instrutions = imageInfo.instructions;

      var imageObject = (
        ImageObjectFactory.createNew(src, placeholder, authorId, instrutions));

      this.imageMapping[imageId] = imageObject;
    };

    /* eslint-disable dot-notation */
    ImageAssets['createNew'] = function(imageMapping) {
    /* eslint-enable dot-notation */
      return new ImageAssets(imageMapping);
    };

    /* eslint-disable dot-notation */
    ImageAssets['createFromBackendDict'] = function(imageAssetsDict) {
    /* eslint-enable dot-notation */
      var imageMapping = {};
      for (var imageId in imageAssetsDict.imageMapping) {
        var imageDict = imageAssetsDict.imageMapping[imageId];
        var imageObject = (ImageObjectFactory.
          createFromBackendDict(imageDict));
        imageMapping[imageId] = imageObject;
      }
      return new ImageAssets(imageMapping);
    };

    return ImageAssets;
  }]);
