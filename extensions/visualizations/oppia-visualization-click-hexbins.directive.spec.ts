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
 * @fileoverview Directive unit tests for the "click hexbins" visualization.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';

require('visualizations/oppia-visualization-click-hexbins.directive.ts');

describe('Oppia click hexbins visualization', function() {
  let $compile, $rootScope, $scope,
    AssetsBackendApiService, ContextService, ImagePreloaderService,
    element: JQLite, elementTemplate: JQLite;

  beforeEach(angular.mock.module('oppia', function($provide) {
    const ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function(
      _$compile_, _$rootScope_,
      _AssetsBackendApiService_, _ContextService_, _ImagePreloaderService_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    AssetsBackendApiService = _AssetsBackendApiService_;
    ContextService = _ContextService_;
    ImagePreloaderService = _ImagePreloaderService_;
  }));

  beforeEach(() => {
    spyOn(ContextService, 'getEntityId').and.returnValue('eid');
    spyOn(ContextService, 'getEntityType').and.returnValue('exploration');
    spyOn(AssetsBackendApiService, 'getImageUrlForPreview').and.returnValue(
      'solar-system.png');
    spyOn(ImagePreloaderService, 'getDimensionsOfImage').and.returnValue(
      [300, 250]);
  });

  beforeEach(() => {
    elementTemplate = angular.element(
      '<oppia-visualization-click-hexbins ' + (
        'data="data" interactionArgs="interactionArgs">') +
      '</oppia-visualization-click-hexbins>');
    $scope = $rootScope.$new();
    $scope.data = [
      {answer: {clickPosition: [0.03, 0.03], clickedRegions: []}, frequency: 2},
      {answer: {clickPosition: [0.50, 0.50], clickedRegions: []}, frequency: 1},
    ];
    $scope.interactionArgs = {
      imageAndRegions: {
        value: { imagePath: 'solar-system.png' },
      },
    };
    element = $compile(elementTemplate)($scope);
    $rootScope.$digest();
  });

  it('should render a single image from the interaction argument', () => {
    expect(element.map((_, e) => e.innerHTML).toArray())
      .toEqual([]);
  });
});
