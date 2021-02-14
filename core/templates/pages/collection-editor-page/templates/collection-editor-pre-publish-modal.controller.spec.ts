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

import { fakeAsync, TestBed } from '@angular/core/testing';
import { Collection, CollectionBackendDict } from 'domain/collection/collection.model';
import { UpgradedServices } from 'services/UpgradedServices';
// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { importAllAngularServices } from 'tests/unit-test-utils';
// ^^^ This block is to be removed.
import { CollectionUpdateService } from 'domain/collection/collection-update.service';

describe('Collection Editor Pre Publish Modal Controller', function() {
  var ctrl = null;
  var $scope = null;
  var $uibModalInstance = null;
  var AlertsService = null;
  var CollectionEditorStateService = null;
  let collectionUpdateService = null;
  importAllAngularServices();

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
      collectionUpdateService = TestBed.get(CollectionUpdateService);

      $uibModalInstance = jasmine.createSpyObj(
        '$uibModalInstance', ['close', 'dismiss']);

      spyOnAllFunctions(CollectionUpdateService);

      spyOn(CollectionEditorStateService, 'getCollection').and.returnValue(
        Collection.create(collectionDict as CollectionBackendDict));

      $scope = $rootScope.$new();
      ctrl = $controller('CollectionEditorPrePublishModalController', {
        $scope: $scope,
        $uibModalInstance: $uibModalInstance
      });
    }));

    it('should initialize $scope properties after controller is initialized',
      function() {
        expect(ctrl.requireTitleToBeSpecified).toBe(false);
        expect(ctrl.requireObjectiveToBeSpecified).toBe(false);
        expect(ctrl.requireCategoryToBeSpecified).toBe(false);

        expect(ctrl.newTitle).toBe(collectionDict.title);
        expect(ctrl.newObjective).toBe(collectionDict.objective);
        expect(ctrl.newCategory).toBe(collectionDict.category);
      });

    it('should allow saving a collection when it has a title, objective and' +
      ' category', fakeAsync(() => {
      spyOn(collectionUpdateService, 'setCollectionTitle').and.callThrough();
      spyOn(
        collectionUpdateService, 'setCollectionObjective').and.callThrough();
      spyOn(
        collectionUpdateService, 'setCollectionCategory').and.callThrough();
      ctrl.newTitle = 'New title';
      ctrl.newObjective = 'New objective';
      ctrl.newCategory = 'Algorithm';
      expect(ctrl.isSavingAllowed()).toBe(true);

      ctrl.save();

      expect(collectionUpdateService.setCollectionTitle).toHaveBeenCalled();
      expect(
        collectionUpdateService.setCollectionObjective).toHaveBeenCalled();
      expect(
        collectionUpdateService.setCollectionCategory).toHaveBeenCalled();

      expect($uibModalInstance.close).toHaveBeenCalledWith([
        'title', 'objective', 'category']);
    }));

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

      $uibModalInstance = jasmine.createSpyObj(
        '$uibModalInstance', ['close', 'dismiss']);

      spyOn(AlertsService, 'addWarning').and.callThrough();

      spyOn(CollectionEditorStateService, 'getCollection').and.returnValue(
        Collection.create(collectionDict as CollectionBackendDict));

      $scope = $rootScope.$new();
      ctrl = $controller('CollectionEditorPrePublishModalController', {
        $scope: $scope,
        $uibModalInstance: $uibModalInstance
      });
    }));

    it('should initialize $scope properties after controller is initialized',
      function() {
        expect(ctrl.requireTitleToBeSpecified).toBe(true);
        expect(ctrl.requireObjectiveToBeSpecified).toBe(true);
        expect(ctrl.requireCategoryToBeSpecified).toBe(true);

        expect(ctrl.newTitle).toBe(collectionDict.title);
        expect(ctrl.newObjective).toBe(collectionDict.objective);
        expect(ctrl.newCategory).toBe(collectionDict.category);
      });

    it('should not allow saving a collection with an empty title', function() {
      ctrl.newTitle = '';
      ctrl.newObjective = 'New objective';
      ctrl.newCategory = 'Algorithm';
      expect(ctrl.isSavingAllowed()).toBe(false);

      ctrl.save();

      expect(AlertsService.addWarning).toHaveBeenCalledWith(
        'Please specify a title');
      expect($uibModalInstance.close).not.toHaveBeenCalled();
    });

    it('should not allow saving a collection with an empty objective',
      function() {
        ctrl.newTitle = 'New title';
        ctrl.newObjective = '';
        ctrl.newCategory = 'Algorithm';
        expect(ctrl.isSavingAllowed()).toBe(false);

        ctrl.save();

        expect(AlertsService.addWarning).toHaveBeenCalledWith(
          'Please specify an objective');
        expect($uibModalInstance.close).not.toHaveBeenCalled();
      });

    it('should not allow saving a collection with an empty category',
      function() {
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
