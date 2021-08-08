// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the Collection Editor Navbar directive.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
// ^^^ This block is to be removed.
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { UrlService } from 'services/contextual/url.service';
import { Collection, CollectionBackendDict } from 'domain/collection/collection.model';
import { CollectionEditorStateService } from '../services/collection-editor-state.service';
import { CollectionRights } from 'domain/collection/collection-rights.model';
import { UndoRedoService } from 'domain/editor/undo_redo/undo-redo.service';
import { EventEmitter } from '@angular/core';
import { Subscription } from 'rxjs';
import { CollectionRightsBackendApiService } from 'domain/collection/collection-rights-backend-api.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { CollectionValidationService } from 'domain/collection/collection-validation.service';

describe('Collection Editor Navbar directive', function() {
  let $scope = null;
  let ctrl = null;
  let $rootScope = null;
  let directive = null;
  let undoRedoService: UndoRedoService = null;
  let $uibModal = null;
  let urlService: UrlService = null;
  let collectionEditorStateService: CollectionEditorStateService = null;
  let collectionRightsBackendApiService:
    CollectionRightsBackendApiService = null;
  let urlInterpolationService: UrlInterpolationService = null;
  let RouterService = null;
  let collectionValidationService: CollectionValidationService = null;

  let testSubscriptions: Subscription;
  let sampleCollectionBackendObject1: CollectionBackendDict;
  let sampleCollectionBackendObject2: CollectionBackendDict;
  let sampleCollection: Collection = null;
  let sampleCollectionRights: CollectionRights = null;
  let learnerExplorationSummaryBackendDict = null;
  const collectionInitializedSpy = jasmine.createSpy('collectionInitialized');
  let mockUndoRedoChangeEventEmitter = new EventEmitter();
  let mockCollectionInitializedEventEmitter = new EventEmitter();

  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
  });


  beforeEach(angular.mock.inject(function($injector) {
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    $uibModal = $injector.get('$uibModal');
    undoRedoService = $injector.get('UndoRedoService');
    directive = $injector.get('collectionEditorNavbarDirective')[0];

    urlService = $injector.get('UrlService');
    collectionEditorStateService = TestBed.inject(
      CollectionEditorStateService);
    collectionRightsBackendApiService = $injector.get(
      'CollectionRightsBackendApiService');
    urlInterpolationService = $injector.get('UrlInterpolationService');
    RouterService = $injector.get('RouterService');
    collectionValidationService = $injector.get(
      'CollectionValidationService');

    learnerExplorationSummaryBackendDict = {
      activity_type: 'exploration',
      category: 'a category',
      community_owned: false,
      created_on_msec: 1591296635736.666,
      id: 'collection_id',
      last_updated_msec: 1591296737470.528,
      ratings: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0
      },
      human_readable_contributors_summary: {},
      language_code: 'en',
      num_views: 0,
      objective: 'Test Objective',
      status: 'public',
      tags: [],
      thumbnail_bg_color: '#cd672b',
      thumbnail_icon_url: '/subjects/Algebra.svg',
      title: 'a title'
    };

    sampleCollectionBackendObject1 = {
      id: 'collection_id',
      title: 'a title',
      objective: 'an objective',
      language_code: 'en',
      tags: [],
      category: 'a category',
      version: 1,
      schema_version: 1,
      nodes: [{
        exploration_id: 'exp_id0',
        exploration_summary: learnerExplorationSummaryBackendDict
      },
      {
        exploration_id: 'exp_id1',
        exploration_summary: learnerExplorationSummaryBackendDict
      }],
      playthrough_dict: {
        next_exploration_id: 'expId',
        completed_exploration_ids: ['expId2']
      }
    };

    sampleCollectionBackendObject2 = {
      id: 'collection_id',
      title: null,
      objective: 'an objective',
      language_code: 'en',
      tags: [],
      category: 'a category',
      version: 1,
      schema_version: 1,
      nodes: [{
        exploration_id: 'exp_id0',
        exploration_summary: learnerExplorationSummaryBackendDict
      },
      {
        exploration_id: 'exp_id1',
        exploration_summary: learnerExplorationSummaryBackendDict
      }],
      playthrough_dict: {
        next_exploration_id: 'expId',
        completed_exploration_ids: ['expId2']
      }
    };
    sampleCollection = Collection.create(
      sampleCollectionBackendObject1);
    sampleCollectionRights = CollectionRights.createEmptyCollectionRights();

    ctrl = $injector.instantiate(directive.controller, {
      $rootScope: $scope,
      $scope: $scope
    });
  }));

  beforeEach(() => {
    testSubscriptions = new Subscription();
    testSubscriptions.add(
      collectionEditorStateService.onCollectionInitialized.subscribe(
        collectionInitializedSpy));
  });

  afterEach(() => {
    testSubscriptions.unsubscribe();
    ctrl.$onDestroy();
  });

  it('should set properties when initialized', function() {
    spyOn(urlService, 'getCollectionIdFromEditorUrl')
      .and.returnValue('collectionId');
    spyOn(collectionEditorStateService, 'getCollection')
      .and.returnValue(sampleCollection);
    spyOn(collectionEditorStateService, 'getCollectionRights')
      .and.returnValue(sampleCollectionRights);
    spyOn(undoRedoService, 'onUndoRedoChangeApplied$').and.returnValue(
      mockUndoRedoChangeEventEmitter);
    spyOnProperty(collectionEditorStateService, 'onCollectionInitialized')
      .and.returnValue(mockCollectionInitializedEventEmitter);

    ctrl.$onInit();
    $rootScope.$apply();

    expect(ctrl.collectionId).toBe('collectionId');
    expect(ctrl.collectionRights).toBe(sampleCollectionRights);
  });

  it('should validate issues when undo redo change ' +
    'event is emitted', function() {
    spyOn(urlService, 'getCollectionIdFromEditorUrl')
      .and.returnValue('collectionId');
    spyOn(collectionEditorStateService, 'getCollection')
      .and.returnValue(sampleCollection);
    spyOn(collectionEditorStateService, 'getCollectionRights')
      .and.returnValue(sampleCollectionRights);
    spyOn(undoRedoService, 'onUndoRedoChangeApplied$').and.returnValue(
      mockUndoRedoChangeEventEmitter);
    let validationSpy = spyOn(
      collectionValidationService, 'findValidationIssuesForPublicCollection')
      .and.callThrough();

    ctrl.$onInit();
    $rootScope.$apply();
    mockUndoRedoChangeEventEmitter.emit();

    expect(validationSpy).toHaveBeenCalled();
  });


  it('should validate issues when collection initialize ' +
    'event is emitted', function() {
    spyOn(urlService, 'getCollectionIdFromEditorUrl')
      .and.returnValue('collectionId');
    spyOn(collectionEditorStateService, 'getCollection')
      .and.returnValue(sampleCollection);
    spyOn(collectionEditorStateService, 'getCollectionRights')
      .and.returnValue(
        new CollectionRights({
          owner_names: [],
          collection_id: 1,
          can_edit: true,
          can_unpublish: true,
          is_private: true
        }));
    spyOnProperty(collectionEditorStateService, 'onCollectionInitialized')
      .and.returnValue(mockCollectionInitializedEventEmitter);
    let validationSpy = spyOn(
      collectionValidationService, 'findValidationIssuesForPrivateCollection')
      .and.callThrough();

    ctrl.$onInit();
    $rootScope.$apply();
    mockCollectionInitializedEventEmitter.emit();

    expect(validationSpy).toHaveBeenCalled();
  });

  it('should fetch collection when initialized', function() {
    spyOn(urlService, 'getCollectionIdFromEditorUrl')
      .and.returnValue('collectionId');
    spyOn(collectionEditorStateService, 'getCollection')
      .and.returnValue(sampleCollection);
    spyOn(collectionEditorStateService, 'getCollectionRights')
      .and.returnValue(
        new CollectionRights({
          owner_names: [],
          collection_id: 1,
          can_edit: true,
          can_unpublish: true,
          is_private: true
        }));

    ctrl.$onInit();
    $rootScope.$apply();

    expect(ctrl.collection).toBe(sampleCollection);
  });

  it('should unpublish collection successfully ' +
    'when unpublish button is clicked', fakeAsync(function() {
    ctrl.collection = sampleCollection;
    ctrl.collectionRights = new CollectionRights({
      owner_names: [],
      collection_id: 1,
      can_edit: true,
      can_unpublish: true,
      is_private: false
    });
    spyOn(collectionRightsBackendApiService, 'setCollectionPrivateAsync')
      .and.returnValue(Promise.resolve(null));
    let collectionRightsSpy = spyOn(
      collectionEditorStateService, 'setCollectionRights')
      .and.returnValue(null);

    ctrl.unpublishCollection();
    tick();

    expect(collectionRightsSpy).toHaveBeenCalled();
  }));

  it('should not unpublish collection in case of ' +
    'backend error', fakeAsync(function() {
    ctrl.collection = sampleCollection;
    ctrl.collectionRights = sampleCollectionRights;
    spyOn(collectionRightsBackendApiService, 'setCollectionPrivateAsync')
      .and.returnValue(Promise.reject(null));
    let collectionRightsSpy = spyOn(
      collectionEditorStateService, 'setCollectionRights')
      .and.returnValue(null);

    ctrl.unpublishCollection();
    tick();

    expect(collectionRightsSpy).not.toHaveBeenCalled();
  }));

  it('should open a modal to save changes if ' +
    'additional meta data needed', fakeAsync(function() {
    sampleCollection = Collection.create(
      sampleCollectionBackendObject2);
    ctrl.collection = sampleCollection;
    ctrl.collectionRights = new CollectionRights({
      owner_names: [],
      collection_id: 1,
      can_edit: true,
      can_unpublish: true,
      is_private: false
    });

    spyOn($uibModal, 'open').and.returnValue({
      result: Promise.resolve(['metadata'])
    });
    spyOn(urlInterpolationService, 'interpolateUrl')
      .and.returnValue('url');
    let saveSpy = spyOn(
      collectionEditorStateService, 'saveCollection')
      .and.returnValue(null);

    ctrl.publishCollection();
    $rootScope.$apply();
    tick();

    expect(saveSpy).toHaveBeenCalled();
  }));

  it('should publish collection successfully if no ' +
    'additional meta data needed', fakeAsync(function() {
    ctrl.collection = sampleCollection;
    ctrl.collectionRights = new CollectionRights({
      owner_names: [],
      collection_id: 1,
      can_edit: true,
      can_unpublish: true,
      is_private: false
    });

    spyOn(collectionRightsBackendApiService, 'setCollectionPublicAsync')
      .and.returnValue(Promise.resolve(null));
    let collectionRightsSpy = spyOn(
      collectionEditorStateService, 'setCollectionRights')
      .and.returnValue(null);

    spyOn(urlInterpolationService, 'interpolateUrl')
      .and.returnValue('url');

    ctrl.publishCollection();
    $rootScope.$apply();
    tick();

    expect(collectionRightsSpy).toHaveBeenCalled();
  }));

  it('should open a modal to save changes when clicking ' +
    'on save button', fakeAsync(function() {
    sampleCollection = Collection.create(
      sampleCollectionBackendObject2);
    ctrl.collection = sampleCollection;
    ctrl.collectionRights = new CollectionRights({
      owner_names: [],
      collection_id: 1,
      can_edit: true,
      can_unpublish: true,
      is_private: false
    });

    spyOn($uibModal, 'open').and.returnValue({
      result: Promise.resolve('commit message')
    });
    spyOn(urlInterpolationService, 'interpolateUrl')
      .and.returnValue('url');
    let saveSpy = spyOn(
      collectionEditorStateService, 'saveCollection')
      .and.callFake((commitMessage, cb) =>{
        cb();
        return null;
      });

    ctrl.saveChanges();
    $rootScope.$apply();
    tick();

    expect(saveSpy).toHaveBeenCalled();
  }));

  it('should not save changes if cancel button was ' +
    'clicked', fakeAsync(function() {
    sampleCollection = Collection.create(
      sampleCollectionBackendObject2);
    ctrl.collection = sampleCollection;
    ctrl.collectionRights = new CollectionRights({
      owner_names: [],
      collection_id: 1,
      can_edit: true,
      can_unpublish: true,
      is_private: false
    });

    spyOn($uibModal, 'open').and.callThrough();
    spyOn(urlInterpolationService, 'interpolateUrl')
      .and.returnValue('url');
    let saveSpy = spyOn(
      collectionEditorStateService, 'saveCollection')
      .and.callFake((commitMessage, cb) =>{
        cb();
        return null;
      });

    ctrl.saveChanges();
    $rootScope.$apply();
    tick();

    expect(saveSpy).not.toHaveBeenCalled();
  }));

  it('should return change list count ' +
    'when calling \'getChangeListCount\'', function() {
    spyOn(undoRedoService, 'getChangeCount')
      .and.returnValue(2);
    expect(ctrl.getChangeListCount()).toBe(2);
  });

  it('should return count of validation issues ' +
    'when calling \'getWarningsCount\'', function() {
    ctrl.validationIssues = [];
    expect(ctrl.getWarningsCount()).toBe(0);

    ctrl.validationIssues = ['1', '2'];
    expect(ctrl.getWarningsCount()).toBe(2);
  });

  it('should check whether a collection is saveable ' +
    'when calling \'isCollectionSaveable\'', function() {
    let result = ctrl.isCollectionSaveable();

    expect(result).toBe(false);
  });

  it('should check whether a collection is publishable ' +
    'when calling \'isCollectionPublishable\'', function() {
    ctrl.collectionRights = new CollectionRights({
      owner_names: [],
      collection_id: 1,
      can_edit: true,
      can_unpublish: true,
      is_private: false
    });

    let result = ctrl.isCollectionPublishable();

    expect(result).toBe(false);
  });

  it('should check whether a collection is loading ' +
    'when calling \'isLoadingCollection\'', function() {
    spyOn(collectionEditorStateService, 'isLoadingCollection')
      .and.returnValue(true);

    let result = ctrl.isLoadingCollection();

    expect(result).toBe(true);
  });

  it('should check whether a collection is saving ' +
    'when calling \'isSaveInProgress\'', function() {
    spyOn(collectionEditorStateService, 'isSavingCollection')
      .and.returnValue(true);

    let result = ctrl.isSaveInProgress();

    expect(result).toBe(true);
  });

  it('should return active tab name ' +
    'when calling \'getActiveTabName\'', function() {
    spyOn(RouterService, 'getActiveTabName')
      .and.returnValue('activeTab');

    let result = ctrl.getActiveTabName();

    expect(result).toBe('activeTab');
  });

  it('should open the main tab ' +
    'when calling \'selectMainTab\'', function() {
    let navigationSpy = spyOn(RouterService, 'navigateToMainTab')
      .and.returnValue(null);

    ctrl.selectMainTab();

    expect(navigationSpy).toHaveBeenCalled();
  });

  it('should open the preview tab ' +
    'when calling \'selectPreviewTab\'', function() {
    let navigationSpy = spyOn(RouterService, 'navigateToPreviewTab')
      .and.returnValue(null);

    ctrl.selectPreviewTab();

    expect(navigationSpy).toHaveBeenCalled();
  });

  it('should open the settings tab ' +
    'when calling \'selectSettingsTab\'', function() {
    let navigationSpy = spyOn(RouterService, 'navigateToSettingsTab')
      .and.returnValue(null);

    ctrl.selectSettingsTab();

    expect(navigationSpy).toHaveBeenCalled();
  });

  it('should open the stats tab ' +
    'when calling \'selectStatsTab\'', function() {
    let navigationSpy = spyOn(RouterService, 'navigateToStatsTab')
      .and.returnValue(null);

    ctrl.selectStatsTab();

    expect(navigationSpy).toHaveBeenCalled();
  });

  it('should open the history tab ' +
    'when calling \'selectHistoryTab\'', function() {
    let navigationSpy = spyOn(RouterService, 'navigateToHistoryTab')
      .and.returnValue(null);

    ctrl.selectHistoryTab();

    expect(navigationSpy).toHaveBeenCalled();
  });
});
