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
 * @fileoverview Unit tests for the Collection node creator directive.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CollectionEditorStateService } from '../services/collection-editor-state.service';
import { Collection, CollectionBackendDict } from 'domain/collection/collection.model';
import { AlertsService } from 'services/alerts.service';
import { SearchExplorationsBackendApiService } from 'domain/collection/search-explorations-backend-api.service';
import { ExplorationSummaryBackendApiService, ExplorationSummaryDict } from 'domain/summary/exploration-summary-backend-api.service';
import { CollectionLinearizerService } from '../services/collection-linearizer.service';
import { ValidatorsService } from 'services/validators.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
// ^^^ This block is to be removed.

describe('Collection node creator directive', function() {
  let $scope = null;
  let ctrl = null;
  let $rootScope = null;
  let $httpBackend = null;
  let directive = null;
  let collectionEditorStateService: CollectionEditorStateService = null;
  let alertsService: AlertsService = null;
  let searchExplorationsBackendApiService:
    SearchExplorationsBackendApiService = null;
  let explorationSummaryBackendApiService:
    ExplorationSummaryBackendApiService = null;
  let collectionLinearizerService:
    CollectionLinearizerService = null;
  let validatorsService: ValidatorsService = null;
  let siteAnalyticsService: SiteAnalyticsService = null;
  let CsrfService = null;

  let sampleCollectionBackendObject: CollectionBackendDict = null;
  let sampleCollection: Collection = null;
  let learnerExplorationSummaryBackendDict = null;
  let alertsSpy = null;


  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
  });

  beforeEach(angular.mock.inject(function($injector, $q) {
    $rootScope = $injector.get('$rootScope');
    $httpBackend = $injector.get('$httpBackend');
    $scope = $rootScope.$new();
    directive = $injector.get('collectionNodeCreatorDirective')[0];

    collectionEditorStateService = $injector.get(
      'CollectionEditorStateService');
    alertsService = $injector.get('AlertsService');
    searchExplorationsBackendApiService = $injector.get(
      'SearchExplorationsBackendApiService');
    explorationSummaryBackendApiService = $injector.get(
      'ExplorationSummaryBackendApiService');
    collectionLinearizerService = $injector.get(
      'CollectionLinearizerService');
    validatorsService = $injector.get('ValidatorsService');
    siteAnalyticsService = $injector.get('SiteAnalyticsService');
    CsrfService = $injector.get('CsrfTokenService');

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

    spyOn(CsrfService, 'getTokenAsync').and.callFake(function() {
      let deferred = $q.defer();
      deferred.resolve('sample-csrf-token');
      return deferred.promise;
    });

    spyOn(collectionEditorStateService, 'getCollection')
      .and.returnValue(sampleCollection);
    alertsSpy = spyOn(alertsService, 'addWarning')
      .and.returnValue(null);

    ctrl = $injector.instantiate(directive.controller, {
      $rootScope: $scope,
      $scope: $scope
    });
    ctrl.$onInit();
  }));

  it('should set properties when initialized', function() {
    expect(ctrl.collection).toEqual(sampleCollection);
    expect(ctrl.newExplorationId).toEqual('');
    expect(ctrl.newExplorationTitle).toEqual('');
    expect(ctrl.searchQueryHasError).toEqual(false);
  });

  describe('while fetching type head exploration results ', function() {
    it('should fetch type head exploration results ' +
      'successfully', fakeAsync(function() {
      let metadataList = [
        {
          id: 'id1',
          title: 'title1',
          objective: 'objective1'
        },
        {
          id: 'id2',
          title: 'title2',
          objective: 'objective2'
        }
      ];
      let fetchExplorationSpy = spyOn(
        searchExplorationsBackendApiService, 'fetchExplorationsAsync')
        .and.resolveTo(metadataList);

      ctrl.fetchTypeaheadResults('searchQuery');
      tick();

      expect(fetchExplorationSpy).toHaveBeenCalled();
      expect(alertsSpy).not.toHaveBeenCalled();
    }));

    it('should show an alert message in case of ' +
      'backend error', fakeAsync(function() {
      spyOn(searchExplorationsBackendApiService, 'fetchExplorationsAsync')
        .and.returnValue(Promise.reject());

      ctrl.fetchTypeaheadResults('searchQuery');
      tick();

      expect(alertsSpy).toHaveBeenCalledWith(
        'There was an error when searching for matching ' +
        'explorations.');
    }));

    it('should not fetch type head exploration results ' +
      'if search query is invalid', fakeAsync(function() {
      let fetchExplorationSpy = spyOn(
        searchExplorationsBackendApiService, 'fetchExplorationsAsync');

      ctrl.fetchTypeaheadResults('invalid#search@query');
      tick();

      expect(fetchExplorationSpy).not.toHaveBeenCalled();
    }));
  });

  describe('while adding exploration to collection ', function() {
    it('should show alert message if we try to add ' +
      'an empty exploration', function() {
      // Setting exploration Id to be empty.
      ctrl.newExplorationId = '';
      ctrl.addExploration();

      expect(alertsSpy).toHaveBeenCalledWith(
        'Cannot add an empty exploration ID.');
    });

    it('should show alert message if we try to add ' +
      'an exploration which is already exist', function() {
      ctrl.newExplorationId = 'exp_id0';
      ctrl.addExploration();

      expect(alertsSpy).toHaveBeenCalledWith(
        'There is already an exploration in this collection ' +
        'with that id.');
    });

    it('should show alert message if we try to add ' +
      'an exploration that does not exist', fakeAsync(function() {
      spyOn(
        explorationSummaryBackendApiService,
        'loadPublicAndPrivateExplorationSummariesAsync')
        .and.resolveTo({
          summaries: [
            {
              id: '(newId)'
            } as ExplorationSummaryDict
          ]
        });
      ctrl.newExplorationId = 'invalidId';

      ctrl.addExploration();
      tick();

      expect(alertsSpy).toHaveBeenCalledWith(
        'That exploration does not exist or you do not have edit ' +
        'access to it.'
      );
    }));

    it('should show alert message in case of ' +
      'backend error', fakeAsync(function() {
      spyOn(
        explorationSummaryBackendApiService,
        'loadPublicAndPrivateExplorationSummariesAsync')
        .and.returnValue(Promise.reject());
      ctrl.newExplorationId = '(newId)';

      ctrl.addExploration();
      tick();

      expect(alertsSpy).toHaveBeenCalledWith(
        'There was an error while adding an exploration to the ' +
        'collection.');
    }));

    it('should add exploration to collection ' +
      'successfully', fakeAsync(function() {
      spyOn(
        explorationSummaryBackendApiService,
        'loadPublicAndPrivateExplorationSummariesAsync')
        .and.resolveTo({
          summaries: [
            {
              id: 'newId'
            } as ExplorationSummaryDict
          ]
        });
      spyOn(collectionLinearizerService, 'appendCollectionNode')
        .and.returnValue(null);
      ctrl.newExplorationId = '(newId)';

      ctrl.addExploration();
      tick();

      expect(alertsSpy).not.toHaveBeenCalled();
    }));
  });

  describe('while creating a new exploration ', function() {
    it('should create an exploration ' +
      'successfully', fakeAsync(function() {
      spyOn(validatorsService, 'isValidExplorationTitle')
        .and.returnValue(true);
      let registerNewExplorationSpy = spyOn(
        siteAnalyticsService, 'registerCreateNewExplorationInCollectionEvent')
        .and.returnValue(null);

      $httpBackend.expect(
        'POST', '/contributehandler/create_new').respond(
        200, {
          exploration_id: 'expId'
        });

      ctrl.createNewExploration();
      $httpBackend.flush();
      tick();

      expect(registerNewExplorationSpy).toHaveBeenCalled();
    }));

    it('should not create an exploration if' +
      'exploration title is not valid', function() {
      spyOn(validatorsService, 'isValidExplorationTitle')
        .and.returnValue(false);
      let registerNewExplorationSpy = spyOn(
        siteAnalyticsService, 'registerCreateNewExplorationInCollectionEvent')
        .and.returnValue(null);

      ctrl.createNewExploration();

      expect(registerNewExplorationSpy).not.toHaveBeenCalled();
    });
  });

  it('should check whether the given exploration id ' +
    'is malformed', function() {
    let result = ctrl.isMalformedId('expId');

    expect(result).toBe(false);
  });
});
