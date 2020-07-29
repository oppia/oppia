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
 * @fileoverview Unit tests for CollectionEditorPrePublishModalController.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

describe('Collection Editor Pre Publish Modal Controller', function() {
  var ctrl = null;
  var $scope = null;
  var $uibModalInstance = null;
  var AlertsService = null;
  var CollectionEditorStateService = null;
  var CollectionObjectFactory = null;
  var CollectionUpdateService = null;

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  describe('when title, objective and category are specified', function() {
    var collectionDict = {
      id: 'collection1',
      title: 'This is the collection title',
      objective: 'Test a controller',
      language_code: 'en',
      tags: [],
      category: 'Algebra',
      version: 1,
      nodes: [{
        exploration_id: 'exp1',
        exploration_summary: {}
      }],
      playthrough_dict: {
        next_exploration_id: 'expId',
        completed_exploration_ids: ['expId2']
      }
    };

    beforeEach(angular.mock.inject(function($injector, $controller) {
      var $rootScope = $injector.get('$rootScope');
      CollectionEditorStateService = $injector.get(
        'CollectionEditorStateService');
      CollectionObjectFactory = $injector.get('CollectionObjectFactory');
      CollectionUpdateService = $injector.get('CollectionUpdateService');

      $uibModalInstance = jasmine.createSpyObj(
        '$uibModalInstance', ['close', 'dismiss']);

      spyOnAllFunctions(CollectionUpdateService);

      spyOn(CollectionEditorStateService, 'getCollection').and.returnValue(
        CollectionObjectFactory.create(collectionDict));

      $scope = $rootScope.$new();
      ctrl = $controller('CollectionEditorPrePublishModalController', {
        $scope: $scope,
        $uibModalInstance: $uibModalInstance
      });
    }));

    it('should evaluate $scope properties', function() {
      expect(ctrl.requireTitleToBeSpecified).toBe(false);
      expect(ctrl.requireObjectiveToBeSpecified).toBe(false);
      expect(ctrl.requireCategoryToBeSpecified).toBe(false);

      expect(ctrl.newTitle).toBe(collectionDict.title);
      expect(ctrl.newObjective).toBe(collectionDict.objective);
      expect(ctrl.newCategory).toBe(collectionDict.category);
    });

    it('should save a collection successfully', function() {
      ctrl.newTitle = 'New title';
      ctrl.newObjective = 'New objective';
      ctrl.newCategory = 'Algorithm';
      expect(ctrl.isSavingAllowed()).toBe(true);

      ctrl.save();

      expect(CollectionUpdateService.setCollectionTitle).toHaveBeenCalled();
      expect(CollectionUpdateService.setCollectionObjective).toHaveBeenCalled();
      expect(CollectionUpdateService.setCollectionCategory).toHaveBeenCalled();

      expect($uibModalInstance.close).toHaveBeenCalledWith([
        'title', 'objective', 'category']);
    });

    it('should cancel the modal on dismiss', function() {
      ctrl.cancel();
      expect($uibModalInstance.dismiss).toHaveBeenCalledWith('cancel');
    });
  });

  describe('when title, objective or category are not specified', function() {
    var collectionDict = {
      id: 'collection1',
      title: '',
      objective: '',
      language_code: 'en',
      tags: [],
      category: '',
      version: 1,
      nodes: [{
        exploration_id: 'exp1',
        exploration_summary: {}
      }],
      playthrough_dict: {
        next_exploration_id: 'expId',
        completed_exploration_ids: ['expId2']
      }
    };

    beforeEach(angular.mock.inject(function($injector, $controller) {
      var $rootScope = $injector.get('$rootScope');
      AlertsService = $injector.get('AlertsService');
      CollectionEditorStateService = $injector.get(
        'CollectionEditorStateService');
      CollectionObjectFactory = $injector.get('CollectionObjectFactory');

      $uibModalInstance = jasmine.createSpyObj(
        '$uibModalInstance', ['close', 'dismiss']);

      spyOn(AlertsService, 'addWarning').and.callThrough();

      spyOn(CollectionEditorStateService, 'getCollection').and.returnValue(
        CollectionObjectFactory.create(collectionDict));

      $scope = $rootScope.$new();
      ctrl = $controller('CollectionEditorPrePublishModalController', {
        $scope: $scope,
        $uibModalInstance: $uibModalInstance
      });
    }));

    it('should evaluate $scope properties', function() {
      expect(ctrl.requireTitleToBeSpecified).toBe(true);
      expect(ctrl.requireObjectiveToBeSpecified).toBe(true);
      expect(ctrl.requireCategoryToBeSpecified).toBe(true);

      expect(ctrl.newTitle).toBe(collectionDict.title);
      expect(ctrl.newObjective).toBe(collectionDict.objective);
      expect(ctrl.newCategory).toBe(collectionDict.category);
    });

    it('should not save a collection if title is empty', function() {
      ctrl.newTitle = '';
      ctrl.newObjective = 'New objective';
      ctrl.newCategory = 'Algorithm';
      expect(ctrl.isSavingAllowed()).toBe(false);

      ctrl.save();

      expect(AlertsService.addWarning).toHaveBeenCalledWith(
        'Please specify a title');
      expect($uibModalInstance.close).not.toHaveBeenCalled();
    });

    it('should not save a collection if objective is empty', function() {
      ctrl.newTitle = 'New title';
      ctrl.newObjective = '';
      ctrl.newCategory = 'Algorithm';
      expect(ctrl.isSavingAllowed()).toBe(false);

      ctrl.save();

      expect(AlertsService.addWarning).toHaveBeenCalledWith(
        'Please specify an objective');
      expect($uibModalInstance.close).not.toHaveBeenCalled();
    });

    it('should not save a collection if category is empty', function() {
      ctrl.newTitle = 'New title';
      ctrl.newObjective = 'New objective';
      ctrl.newCategory = '';
      expect(ctrl.isSavingAllowed()).toBe(false);

      ctrl.save();

      expect(AlertsService.addWarning).toHaveBeenCalledWith(
        'Please specify a category');
      expect($uibModalInstance.close).not.toHaveBeenCalled();
    });
  });
});
