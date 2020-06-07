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
 * @fileoverview Unit tests for the oppia noninteractive svg editor component.
 */

import { AppConstants } from 'app.constants';

describe('oppiaNoninteractiveSvgeditor', function() {
  var ecs = null;
  var ctrl = null;
  var mockabas = {
    getImageUrlForPreview: function(contentType, contentId, filename) {
      return 'imageUrl:' + contentType + '_' + contentId + '_' + filename;
    }
  };
  var mockips = {
    getDimensionsOfImage: function() {
      return {
        width: 450,
        height: 350
      };
    }
  };

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('AssetsBackendApiService', mockabas);
    $provide.value('ImagePreloaderService', mockips);
    $provide.value('ImageLocalStorageService', {});
    $provide.value('$attrs', {
      svgFilenameWithValue: '&quot;svgFilename.svg&quot;',
      altWithValue: '&quot;altText&quot;'
    });
  }));
  beforeEach(angular.mock.inject(function($injector, $componentController) {
    ecs = $injector.get('ContextService');
    spyOn(ecs, 'getEntityType').and.returnValue('exploration');
    spyOn(ecs, 'getEntityId').and.returnValue('1');
    spyOn(ecs, 'getImageSaveDestination').and.returnValue(
      AppConstants.IMAGE_SAVE_DESTINATION_SERVER);
    ctrl = $componentController('oppiaNoninteractiveSvgeditor');
    ctrl.$onInit();
  }));

  it('should fetch the svg file', function() {
    expect(ctrl.filename).toBe('svgFilename.svg');
    expect(ctrl.svgAltText).toBe('altText');
    expect(ctrl.svgUrl).toBe('imageUrl:exploration_1_svgFilename.svg');
  });
});

describe('oppiaNoninteractiveSvgeditor with image save destination as' +
  ' local storage', function() {
  var ecs = null;
  var ctrl = null;
  var mockilss = {
    getObjectUrlForImage: function() {
      return 'imageUrl:exploration_1_svgFilename.svg';
    }
  };
  var mockips = {
    getDimensionsOfImage: function() {
      return {
        width: 450,
        height: 350
      };
    }
  };

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('AssetsBackendApiService', {});
    $provide.value('ImageLocalStorageService', mockilss);
    $provide.value('ImagePreloaderService', mockips);
    $provide.value('$attrs', {
      svgFilenameWithValue: '&quot;svgFilename.svg&quot;',
      altWithValue: '&quot;altText&quot;'
    });
  }));
  beforeEach(angular.mock.inject(function($injector, $componentController) {
    ecs = $injector.get('ContextService');
    spyOn(ecs, 'getImageSaveDestination').and.returnValue(
      AppConstants.IMAGE_SAVE_DESTINATION_LOCAL_STORAGE);
    ctrl = $componentController('oppiaNoninteractiveSvgeditor');
    ctrl.$onInit();
  }));

  it('should fetch the svg file', function() {
    expect(ctrl.filename).toBe('svgFilename.svg');
    expect(ctrl.svgAltText).toBe('altText');
    expect(ctrl.svgUrl).toBe('imageUrl:exploration_1_svgFilename.svg');
  });
});
