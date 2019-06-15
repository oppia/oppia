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
    var ImageAssets = function(image_mapping) {
        this.image_mapping = image_mapping;
    }

    ImageAssets.prototype.toBackendDict = function() {
        var image_mapping = {}
        for (var image_id in this.image_mapping) {
            var image_object = this.image_mapping[image_id]
            var image_dict = image_object.toBackendDict();
            image_mapping[image_id] = image_dict;
        }
        return {
            image_mapping: image_mapping;
        }
    };

    ImageAssets['createNew'] = function(image_mapping) {
        return new ImageAssets(image_mapping)
    };

    ImageAssets['createFromBackendDict'] = function(imageAssetsDict) {
        var image_mapping = {}
        for (var image_id in imageAssetsDict.image_mapping) {
            var image_dict = imageAssetsDict.image_mapping[image_id];
            var image_object = (ImageObjectFactory.
                createFromBackendDict(image_dict));
            image_mapping[image_id] = image_object;
        }
        return new ImageAssets(image_mapping);
    };
}]);
