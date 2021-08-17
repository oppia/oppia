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
 * @fileoverview Unit tests for the Collection details editor directive.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
import { destroyPlatform } from '@angular/core';
import { setupAndGetUpgradedComponentAsync } from 'tests/unit-test-utils.ajs';
import { async, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CollectionDetailsEditor } from './collection-details-editor.directive';
import { CollectionEditorStateService } from '../services/collection-editor-state.service';
import { EventEmitter } from '@angular/core';
import { Collection, CollectionBackendDict } from 'domain/collection/collection.model';
import { CollectionUpdateService } from 'domain/collection/collection-update.service';
import { CollectionValidationService } from 'domain/collection/collection-validation.service';
// ^^^ This block is to be removed.

describe('Collection details editor directive', function() {
  let $scope = null;
  let ctrl = null;
  let $rootScope = null;
  let directive = null;

  let collectionEditorStateService: CollectionEditorStateService = null;
  let collectionUpdateService: CollectionUpdateService = null;
  let collectionValidationService: CollectionValidationService = null;

  let mockCollectionInitializedEventEmitter = new EventEmitter();
  let sampleCollectionBackendObject: CollectionBackendDict;
  let sampleCollection: Collection = null;
  let learnerExplorationSummaryBackendDict = null;

  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
  });

  afterEach(() => {
    ctrl.$onDestroy();
  });

  beforeEach(angular.mock.inject(function($injector) {
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    directive = $injector.get('collectionDetailsEditorDirective')[0];
    collectionEditorStateService = $injector.get(
      'CollectionEditorStateService');
    collectionUpdateService = $injector.get('CollectionUpdateService');
    collectionValidationService = $injector.get('CollectionValidationService');

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

    sampleCollectionBackendObject = {
      id: 'collection_id',
      title: 'title',
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
      sampleCollectionBackendObject);

    spyOn(collectionEditorStateService, 'getCollection')
      .and.returnValue(sampleCollection);

    ctrl = $injector.instantiate(directive.controller, {
      $rootScope: $scope,
      $scope: $scope
    });
  }));

  it('should fetch collection when initialized', function() {
    expect(ctrl.collection).toEqual(undefined);

    ctrl.$onInit();

    expect(ctrl.collection).toEqual(sampleCollection);
  });

  it('should refresh collection properties in settings tab when ' +
    'collection initialize event is emitted', function() {
    spyOnProperty(collectionEditorStateService, 'onCollectionInitialized')
      .and.returnValue(mockCollectionInitializedEventEmitter);

    expect(ctrl.displayedCollectionTitle).toBe(undefined);
    expect(ctrl.displayedCollectionObjective).toBe(undefined);
    expect(ctrl.displayedCollectionCategory).toBe(undefined);
    expect(ctrl.displayedCollectionLanguage).toBe(undefined);

    ctrl.$onInit();
    $rootScope.$apply();
    mockCollectionInitializedEventEmitter.emit();
    $rootScope.$apply();

    expect(ctrl.displayedCollectionTitle).toBe('title');
    expect(ctrl.displayedCollectionObjective).toBe('an objective');
    expect(ctrl.displayedCollectionCategory).toBe('a category');
    expect(ctrl.displayedCollectionLanguage).toBe('en');
  });

  it('should check whether collection has loaded when ' +
    'calling \'hasPageLoaded\'', function() {
    spyOn(collectionEditorStateService, 'hasLoadedCollection')
      .and.returnValue(true);

    let result = ctrl.hasPageLoaded();

    expect(result).toEqual(true);
  });

  it('should update collection tags when given tag ' +
    'is valid', function() {
    let updateSpy = spyOn(collectionUpdateService, 'setCollectionTags')
      .and.returnValue(null);
    // Setting given tag to be valid.
    spyOn(collectionValidationService, 'isTagValid')
      .and.returnValue(true);
    ctrl.displayedCollectionTags = ['tag1', 'tag2'];

    ctrl.updateCollectionTags();

    expect(updateSpy).toHaveBeenCalled();
  });

  it('should not update collection tags when given tag ' +
    'is invalid', function() {
    let updateSpy = spyOn(collectionUpdateService, 'setCollectionTags')
      .and.returnValue(null);
    // Setting given tag to be invalid.
    spyOn(collectionValidationService, 'isTagValid')
      .and.returnValue(false);
    ctrl.displayedCollectionTags = ['tag1', 'tag2'];

    ctrl.updateCollectionTags();

    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('should update collection title when calling ' +
    '\'updateCollectionTitle\'', function() {
    let updateSpy = spyOn(collectionUpdateService, 'setCollectionTitle')
      .and.returnValue(null);

    ctrl.updateCollectionTitle();

    expect(updateSpy).toHaveBeenCalled();
  });

  it('should update collection objective when calling ' +
    '\'updateCollectionObjective\'', function() {
    let updateSpy = spyOn(collectionUpdateService, 'setCollectionObjective')
      .and.returnValue(null);

    ctrl.updateCollectionObjective();

    expect(updateSpy).toHaveBeenCalled();
  });

  it('should update collection category when calling ' +
    '\'updateCollectionCategory\'', function() {
    let updateSpy = spyOn(collectionUpdateService, 'setCollectionCategory')
      .and.returnValue(null);

    ctrl.updateCollectionCategory();

    expect(updateSpy).toHaveBeenCalled();
  });

  it('should update language code when calling ' +
    '\'updateCollectionLanguageCode\'', function() {
    let updateSpy = spyOn(collectionUpdateService, 'setCollectionLanguageCode')
      .and.returnValue(null);

    ctrl.updateCollectionLanguageCode();

    expect(updateSpy).toHaveBeenCalled();
  });
});

describe('Upgraded component', () => {
  beforeEach(() => destroyPlatform());
  afterEach(() => destroyPlatform());

  it('should create the upgraded component', async(() => {
    setupAndGetUpgradedComponentAsync(
      'collection-details-editor',
      'collectionDetailsEditor',
      [CollectionDetailsEditor]
    ).then(
      async(textContext) => expect(textContext).toBe('Hello Oppia!')
    );
  }));
});
