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

import { TestBed } from '@angular/core/testing';

import { StateEditorRefreshService } from
  'pages/exploration-editor-page/services/state-editor-refresh.service';
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
import { ExplorationDataService } from '../services/exploration-data.service';

/**
 * @fileoverview Unit tests for ExplorationMetadataModalController.
 */

describe('Exploration Metadata Modal Controller', function() {
  var $scope = null;
  var $timeout = null;
  var $uibModalInstance = null;
  var AlertsService = null;
  var ExplorationCategoryService = null;
  var ExplorationLanguageCodeService = null;
  var ExplorationObjectiveService = null;
  var ExplorationStatesService = null;
  var ExplorationTagsService = null;
  var ExplorationTitleService = null;

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('NgbModal', {
      open: () => {
        return {
          result: Promise.resolve()
        };
      }
    });
  }));
  importAllAngularServices();

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ExplorationDataService,
          useValue: {
            explorationId: 0,
            autosaveChangeListAsync() {
              return;
            }
          }
        }
      ]
    });
  });

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value(
      'StateEditorRefreshService', TestBed.get(StateEditorRefreshService));
  }));

  describe('when all metadata are filled', function() {
    beforeEach(angular.mock.inject(function($injector, $controller) {
      var $rootScope = $injector.get('$rootScope');
      $timeout = $injector.get('$timeout');
      ExplorationCategoryService = $injector.get('ExplorationCategoryService');
      ExplorationLanguageCodeService = $injector.get(
        'ExplorationLanguageCodeService');
      ExplorationObjectiveService = $injector.get(
        'ExplorationObjectiveService');
      ExplorationStatesService = $injector.get('ExplorationStatesService');
      ExplorationTagsService = $injector.get('ExplorationTagsService');
      ExplorationTitleService = $injector.get('ExplorationTitleService');

      $uibModalInstance = jasmine.createSpyObj(
        '$uibModalInstance', ['close', 'dismiss']);

      ExplorationObjectiveService.init('');
      ExplorationTitleService.init('');
      ExplorationCategoryService.init('');
      ExplorationLanguageCodeService.init('en');
      ExplorationStatesService.init(null);
      ExplorationTagsService.init([]);

      $scope = $rootScope.$new();
      $controller('ExplorationMetadataModalController', {
        $scope: $scope,
        $uibModalInstance: $uibModalInstance,
      });
    }));

    it('should initialize $scope properties after controller is initialized',
      function() {
        var TOTAL_CATEGORIES = 42;
        expect($scope.objectiveHasBeenPreviouslyEdited).toBe(false);
        expect($scope.requireTitleToBeSpecified).toBe(true);
        expect($scope.requireObjectiveToBeSpecified).toBe(true);
        expect($scope.requireCategoryToBeSpecified).toBe(true);
        expect($scope.askForLanguageCheck).toBe(true);
        expect($scope.askForTags).toBe(true);
        expect($scope.CATEGORY_LIST_FOR_SELECT2.length).toBe(TOTAL_CATEGORIES);
      });

    it('should save all exploration metadata values when it contains title,' +
      ' category and objective', function() {
      ExplorationCategoryService.displayed = 'New Category';
      ExplorationLanguageCodeService.displayed = 'es';
      ExplorationObjectiveService.displayed = (
        'Exp Objective is ready to be saved');
      ExplorationStatesService.displayed = [];
      ExplorationTagsService.displayed = ['h1'];
      ExplorationTitleService.displayed = 'New Title';
      expect($scope.isSavingAllowed()).toBe(true);
      $scope.save();

      $timeout.flush(500);

      expect($uibModalInstance.close).toHaveBeenCalledWith([
        'title', 'objective', 'category', 'language', 'tags']);
    });
  });

  describe('when all metadata are not filled', function() {
    beforeEach(angular.mock.inject(function($injector, $controller) {
      var $rootScope = $injector.get('$rootScope');
      $timeout = $injector.get('$timeout');
      AlertsService = $injector.get('AlertsService');
      ExplorationCategoryService = $injector.get('ExplorationCategoryService');
      ExplorationLanguageCodeService = $injector.get(
        'ExplorationLanguageCodeService');
      ExplorationObjectiveService = $injector.get(
        'ExplorationObjectiveService');
      ExplorationStatesService = $injector.get('ExplorationStatesService');
      ExplorationTagsService = $injector.get('ExplorationTagsService');
      ExplorationTitleService = $injector.get('ExplorationTitleService');

      $uibModalInstance = jasmine.createSpyObj(
        '$uibModalInstance', ['close', 'dismiss']);

      ExplorationObjectiveService.init('');
      ExplorationTitleService.init('');
      ExplorationCategoryService.init('Generic category');
      ExplorationLanguageCodeService.init('en');
      ExplorationStatesService.init(null);
      ExplorationTagsService.init([]);

      $scope = $rootScope.$new();
      $controller('ExplorationMetadataModalController', {
        $scope: $scope,
        $uibModalInstance: $uibModalInstance,
      });
    }));

    it('should not save exploration metadata values when title is not' +
      ' provided', function() {
      spyOn(AlertsService, 'addWarning');
      expect($scope.isSavingAllowed()).toBe(false);
      $scope.save();

      expect(AlertsService.addWarning).toHaveBeenCalledWith(
        'Please specify a title');
      expect($uibModalInstance.close).not.toHaveBeenCalled();
    });

    it('should not save exploration metadata values when objective is not' +
      ' provided', function() {
      ExplorationTitleService.displayed = 'New Title';

      spyOn(AlertsService, 'addWarning');
      expect($scope.isSavingAllowed()).toBe(false);
      $scope.save();

      expect(AlertsService.addWarning).toHaveBeenCalledWith(
        'Please specify an objective');
      expect($uibModalInstance.close).not.toHaveBeenCalled();
    });

    it('should not save exploration metadata values when category is not' +
      ' provided', function() {
      ExplorationTitleService.displayed = 'New Title';
      ExplorationObjectiveService.displayed = 'Exp Objective';
      ExplorationCategoryService.displayed = '';

      spyOn(AlertsService, 'addWarning');
      expect($scope.isSavingAllowed()).toBe(false);
      $scope.save();

      expect(AlertsService.addWarning).toHaveBeenCalledWith(
        'Please specify a category');
      expect($uibModalInstance.close).not.toHaveBeenCalled();
    });
  });
});
