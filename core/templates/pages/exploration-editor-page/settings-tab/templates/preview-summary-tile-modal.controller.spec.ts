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
 * @fileoverview Unit tests for PreviewSummaryTileModalController.
 */

describe('Preview Summary Tile Modal Controller', function() {
  var $scope = null;
  var $uibModalInstance = null;
  var ExplorationCategoryService = null;
  var ExplorationObjectiveService = null;
  var ExplorationTitleService = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector, $controller) {
    var $rootScope = $injector.get('$rootScope');
    ExplorationCategoryService = $injector.get('ExplorationCategoryService');
    ExplorationObjectiveService = $injector.get('ExplorationObjectiveService');
    ExplorationTitleService = $injector.get('ExplorationTitleService');

    $uibModalInstance = jasmine.createSpyObj(
      '$uibModalInstance', ['close', 'dismiss']);

    $scope = $rootScope.$new();
    $controller('PreviewSummaryTileModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance
    });
  }));

  it('should get exploration title', function() {
    ExplorationTitleService.init('Exploration Title');
    expect($scope.getExplorationTitle()).toBe('Exploration Title');
  });
  it('should get exploration objective', function() {
    ExplorationObjectiveService.init('Exploration Objective');
    expect($scope.getExplorationObjective()).toBe('Exploration Objective');
  });
  it('should get exploration category', function() {
    ExplorationCategoryService.init('Exploration Category');
    expect($scope.getExplorationCategory()).toBe('Exploration Category');
  });

  it('should get thumbnail icon url', function() {
    ExplorationCategoryService.init('Astrology');
    expect($scope.getThumbnailIconUrl()).toBe('/subjects/Lightbulb.svg');
  });

  it('should get thumbnail bg color if category is listed', function() {
    ExplorationCategoryService.init('Algebra');
    expect($scope.getThumbnailBgColor()).toBe('#cd672b');
  });

  it('should get thumbnail bg color if category is not listed', function() {
    ExplorationCategoryService.init('Astrology');
    expect($scope.getThumbnailBgColor()).toBe('#a33f40');
  });
});
