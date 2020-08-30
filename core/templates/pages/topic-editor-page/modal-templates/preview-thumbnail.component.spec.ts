// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the preview thumbnail directive.
 */

import { UpgradedServices } from 'services/UpgradedServices';

describe('Preview Thumbnail Directive', function() {
  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));
  var ctrl = null;

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    var MockContextSerivce = {
      getEntityType: () => 'topic',
      getEntityId: () => '1'
    };
    var MockImageUploadHelperService = {
      getTrustedResourceUrlForThumbnailFilename: (
          filename, entityType, entityId) => (
        entityType + '/' + entityId + '/' + filename)
    };

    ctrl = $componentController('previewThumbnail', {
      ContextService: MockContextSerivce,
      ImageUploadHelperService: MockImageUploadHelperService,
    });
    ctrl.getFilename = function() {
      return 'img.svg';
    };
    ctrl.$onInit();
  }));

  it('should init the controller', function() {
    expect(ctrl.editableThumbnailDataUrl).toEqual('topic/1/img.svg');
  });
});
