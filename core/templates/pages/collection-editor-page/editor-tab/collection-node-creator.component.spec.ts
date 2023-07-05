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
 * @fileoverview Unit tests for collection node creator component.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { ExplorationCreationBackendApiService } from 'components/entity-creation-services/exploration-creation-backend-api.service';
import { CollectionPlaythrough } from 'domain/collection/collection-playthrough.model';
import { Collection } from 'domain/collection/collection.model';
import { SearchExplorationsBackendApiService } from 'domain/collection/search-explorations-backend-api.service';
import { ExplorationSummaryBackendApiService } from 'domain/summary/exploration-summary-backend-api.service';
import { NormalizeWhitespacePipe } from 'filters/string-utility-filters/normalize-whitespace.pipe';
import { AlertsService } from 'services/alerts.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { ValidatorsService } from 'services/validators.service';
import { CollectionEditorStateService } from '../services/collection-editor-state.service';
import { CollectionLinearizerService } from '../services/collection-linearizer.service';
import { CollectionNodeCreatorComponent } from './collection-node-creator.component';

describe('Collection node creator component', () => {
  let fixture: ComponentFixture<CollectionNodeCreatorComponent>;
  let componentInstance: CollectionNodeCreatorComponent;
  let collectionEditorStateService: CollectionEditorStateService;
  let alertsService: AlertsService;
  let explorationSummaryBackendApiService: ExplorationSummaryBackendApiService;
  let collectionLinearizerService: CollectionLinearizerService;
  let normalizeWhitespacePipe: NormalizeWhitespacePipe;
  let validatorsService: ValidatorsService;
  let explorationCreationBackendApiService:
    ExplorationCreationBackendApiService;
  let siteAnalyticsService: SiteAnalyticsService;

  let mockCollection = new Collection(
    'collection_id', 'collection_title', 'collection_objective', 'en', [],
    new CollectionPlaythrough(null, []), '', 2, 3, []);

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      declarations: [
        CollectionNodeCreatorComponent
      ],
      providers: [
        AlertsService,
        CollectionEditorStateService,
        CollectionLinearizerService,
        ExplorationCreationBackendApiService,
        ExplorationSummaryBackendApiService,
        SearchExplorationsBackendApiService,
        SiteAnalyticsService,
        ValidatorsService,
        NormalizeWhitespacePipe
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CollectionNodeCreatorComponent);
    componentInstance = fixture.componentInstance;
    collectionEditorStateService = TestBed.inject(CollectionEditorStateService);
    alertsService = TestBed.inject(AlertsService);
    explorationSummaryBackendApiService = TestBed.inject(
      ExplorationSummaryBackendApiService);
    collectionLinearizerService = TestBed.inject(CollectionLinearizerService);
    normalizeWhitespacePipe = TestBed.inject(NormalizeWhitespacePipe);
    validatorsService = TestBed.inject(ValidatorsService);
    explorationCreationBackendApiService = TestBed.inject(
      ExplorationCreationBackendApiService);
    siteAnalyticsService = TestBed.inject(SiteAnalyticsService);
  });

  it('should initialize', () => {
    spyOn(collectionEditorStateService, 'getCollection').and.returnValue(
      mockCollection);
    componentInstance.ngOnInit();
    expect(componentInstance.collection).toEqual(mockCollection);
  });

  it('should add exploration to collection', fakeAsync(() => {
    componentInstance.collection = mockCollection;
    let expId = 'new_id';
    spyOn(
      explorationSummaryBackendApiService,
      'loadPublicAndPrivateExplorationSummariesAsync')
      .and.returnValue(Promise.resolve({
        summaries: [{
          category: '',
          community_owned: true,
          human_readable_contributors_summary: {},
          id: expId,
          language_code: '',
          num_views: 1,
          objective: '',
          status: '',
          tags: [],
          thumbnail_bg_color: '',
          thumbnail_icon_url: '',
          title: ''
        }]
      }));
    spyOn(collectionLinearizerService, 'appendCollectionNode');
    spyOn(componentInstance.collection, 'containsCollectionNode')
      .and.returnValue(false);
    componentInstance.addExplorationToCollection(expId);
    tick();
    expect(collectionLinearizerService.appendCollectionNode).toHaveBeenCalled();
  }));

  it('should should not add exploration to collection if exploration' +
  ' id is empty', () => {
    spyOn(alertsService, 'addWarning');
    componentInstance.addExplorationToCollection('');
    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'Cannot add an empty exploration ID.');
  });

  it('should not add exploration to collection if it is already added', () => {
    componentInstance.collection = mockCollection;
    spyOn(alertsService, 'addWarning');
    spyOn(componentInstance.collection, 'containsCollectionNode')
      .and.returnValue(true);
    componentInstance.addExplorationToCollection('exp');
    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'There is already an exploration in this collection with that id.');
  });

  it('should show warning if request to backend fails while adding ' +
    'exploration to collection', fakeAsync(() => {
    componentInstance.collection = mockCollection;
    let expId = 'new_id';
    spyOn(alertsService, 'addWarning');
    spyOn(
      explorationSummaryBackendApiService,
      'loadPublicAndPrivateExplorationSummariesAsync')
      .and.returnValue(Promise.reject());
    spyOn(collectionLinearizerService, 'appendCollectionNode');
    spyOn(componentInstance.collection, 'containsCollectionNode')
      .and.returnValue(false);
    componentInstance.addExplorationToCollection(expId);
    tick();
    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'There was an error while adding an exploration to the collection.');
  }));

  it('should show an alert if exploration doesnot exist in collection',
    fakeAsync(() => {
      componentInstance.collection = mockCollection;
      let expId = 'new_id';
      spyOn(alertsService, 'addWarning');
      spyOn(
        explorationSummaryBackendApiService,
        'loadPublicAndPrivateExplorationSummariesAsync')
        .and.returnValue(Promise.resolve({
          summaries: []
        }));
      spyOn(collectionLinearizerService, 'appendCollectionNode');
      spyOn(componentInstance.collection, 'containsCollectionNode')
        .and.returnValue(false);
      componentInstance.addExplorationToCollection(expId);
      tick();
      expect(alertsService.addWarning).toHaveBeenCalledWith(
        'That exploration does not exist or you do not have edit access to it.'
      );
    }));

  it('should create new exploration', fakeAsync(() => {
    let expTitle = 'Exp Title';
    let expId = 'newExpId';
    spyOn(normalizeWhitespacePipe, 'transform').and.returnValue(expTitle);
    spyOn(validatorsService, 'isValidExplorationTitle').and.returnValue(true);
    spyOn(explorationCreationBackendApiService, 'registerNewExplorationAsync')
      .and.returnValue(Promise.resolve({
        explorationId: expId
      }));
    spyOn(
      siteAnalyticsService, 'registerCreateNewExplorationInCollectionEvent');
    spyOn(componentInstance, 'addExplorationToCollection');
    componentInstance.createNewExploration();
    tick();
    expect(normalizeWhitespacePipe.transform).toHaveBeenCalled();
    expect(validatorsService.isValidExplorationTitle).toHaveBeenCalled();
    expect(explorationCreationBackendApiService.registerNewExplorationAsync)
      .toHaveBeenCalled();
    expect(componentInstance.newExplorationTitle).toEqual('');
    expect(siteAnalyticsService.registerCreateNewExplorationInCollectionEvent)
      .toHaveBeenCalledWith(expId);
    expect(componentInstance.addExplorationToCollection).toHaveBeenCalledWith(
      expId);
  }));

  it('should not create exploration if title is not valid', fakeAsync(() => {
    spyOn(normalizeWhitespacePipe, 'transform').and.returnValue('');
    spyOn(validatorsService, 'isValidExplorationTitle').and.returnValue(false);
    spyOn(explorationCreationBackendApiService, 'registerNewExplorationAsync')
      .and.returnValue(Promise.resolve({
        explorationId: ''
      }));
    componentInstance.createNewExploration();
    tick();
    expect(explorationCreationBackendApiService.registerNewExplorationAsync)
      .not.toHaveBeenCalled();
  }));

  it('should check if id is malformed', () => {
    expect(componentInstance.isIdMalformed('adkslajdf#')).toBeTrue();
  });

  it('should add exploration', () => {
    componentInstance.newExplorationId = 'not_empty';
    spyOn(componentInstance, 'addExplorationToCollection');
    componentInstance.addExploration();
    expect(componentInstance.newExplorationId).toEqual('');
  });
});
