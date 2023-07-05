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
 * @fileoverview Unit tests for collection details editor component.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { AppConstants } from 'app.constants';
import { CollectionPlaythrough } from 'domain/collection/collection-playthrough.model';
import { CollectionUpdateService } from 'domain/collection/collection-update.service';
import { CollectionValidationService } from 'domain/collection/collection-validation.service';
import { Collection } from 'domain/collection/collection.model';
import { AlertsService } from 'services/alerts.service';
import { CollectionEditorStateService } from '../services/collection-editor-state.service';
import { CollectionDetailsEditorComponent } from './collection-details-editor.component';

describe('Collection details editor component', () => {
  let fixture: ComponentFixture<CollectionDetailsEditorComponent>;
  let componentInstance: CollectionDetailsEditorComponent;

  let alertsService: AlertsService;
  let collectionEditorStateService: CollectionEditorStateService;
  let collectionUpdateService: CollectionUpdateService;
  let collectionValidationService: CollectionValidationService;

  let collectionTitle = 'Collection Title';
  let collectionObjective = 'Collection Objective';
  let collectionCategory = 'Collection Category';
  let languageCode = 'en';
  let collectionTags = ['mock tag'];
  let mockCollection = new Collection(
    'id', collectionTitle, collectionObjective, languageCode, collectionTags,
    new CollectionPlaythrough(null, []), collectionCategory, 0, 1, []);

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      declarations: [
        CollectionDetailsEditorComponent
      ],
      providers: [
        AlertsService,
        CollectionEditorStateService,
        CollectionUpdateService,
        CollectionValidationService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CollectionDetailsEditorComponent);
    componentInstance = fixture.componentInstance;

    alertsService = TestBed.inject(AlertsService);
    collectionEditorStateService = TestBed.inject(CollectionEditorStateService);
    collectionUpdateService = TestBed.inject(CollectionUpdateService);
    collectionValidationService = TestBed.inject(CollectionValidationService);
  });

  afterEach(() => {
    componentInstance.ngOnDestroy();
  });

  it('should initialize', () => {
    let mockOnCollectionInitializedEventEmitter = new EventEmitter<void>();

    spyOnProperty(collectionEditorStateService, 'onCollectionInitialized')
      .and.returnValue(mockOnCollectionInitializedEventEmitter);
    spyOn(componentInstance, 'refreshSettingsTab');
    spyOn(collectionEditorStateService, 'getCollection').and.returnValue(
      mockCollection);

    componentInstance.ngOnInit();
    mockOnCollectionInitializedEventEmitter.emit();
    fixture.detectChanges();

    expect(componentInstance.refreshSettingsTab).toHaveBeenCalled();
    expect(collectionEditorStateService.getCollection).toHaveBeenCalled();
    expect(componentInstance.collection).toEqual(mockCollection);
  });

  it('should refresh settings tab', () => {
    componentInstance.collection = mockCollection;
    let categoryList: string[] = [...AppConstants.ALL_CATEGORIES];
    categoryList.unshift(collectionCategory);

    componentInstance.refreshSettingsTab();

    expect(componentInstance.displayedCollectionTitle).toEqual(collectionTitle);
    expect(componentInstance.displayedCollectionObjective).toEqual(
      collectionObjective);
    expect(componentInstance.displayedCollectionCategory).toEqual(
      collectionCategory);
    expect(componentInstance.displayedCollectionLanguage).toEqual(languageCode);
    expect(componentInstance.displayedCollectionTags).toEqual(collectionTags);
    expect(componentInstance.CATEGORY_LIST).toEqual(categoryList);
  });

  it('should tell page has loaded', () => {
    spyOn(collectionEditorStateService, 'hasLoadedCollection').and.returnValues(
      true, false);
    expect(componentInstance.hasPageLoaded()).toBeTrue();
    expect(componentInstance.hasPageLoaded()).toBeFalse();
  });

  it('should normlize tags', () => {
    let tags = ['   category 1  ', 'category 2   '];
    expect(componentInstance.normalizeTags(tags)).toEqual(
      ['category 1', 'category 2']);
  });

  it('should return empty list if there are no tags on normalization', () => {
    let tags = null;
    expect(componentInstance.normalizeTags(tags)).toEqual([]);
  });

  it('should update collection', () => {
    componentInstance.collection = mockCollection;
    componentInstance.displayedCollectionTitle = 'Title';
    componentInstance.displayedCollectionObjective = 'Objective';
    componentInstance.displayedCollectionCategory = 'Category';
    componentInstance.displayedCollectionLanguage = 'es';

    spyOn(collectionUpdateService, 'setCollectionTitle');
    spyOn(collectionUpdateService, 'setCollectionObjective');
    spyOn(collectionUpdateService, 'setCollectionCategory');
    spyOn(collectionUpdateService, 'setCollectionLanguageCode');

    componentInstance.updateCollectionTitle();
    componentInstance.updateCollectionObjective();
    componentInstance.updateCollectionCategory();
    componentInstance.updateCollectionLanguageCode();

    expect(collectionUpdateService.setCollectionTitle).toHaveBeenCalledWith(
      mockCollection, componentInstance.displayedCollectionTitle);
    expect(collectionUpdateService.setCollectionObjective).toHaveBeenCalledWith(
      mockCollection, componentInstance.displayedCollectionObjective);
    expect(collectionUpdateService.setCollectionCategory).toHaveBeenCalledWith(
      mockCollection, componentInstance.displayedCollectionCategory);
    expect(collectionUpdateService.setCollectionLanguageCode)
      .toHaveBeenCalledWith(
        mockCollection, componentInstance.displayedCollectionLanguage);
  });

  it('should update collection tags', () => {
    componentInstance.collection = mockCollection;
    let collectionTags = ['Valid Tag'];

    spyOn(componentInstance, 'normalizeTags').and.returnValue(collectionTags);
    spyOn(collectionUpdateService, 'setCollectionTags');
    spyOn(collectionValidationService, 'isTagValid').and.returnValue(true);

    componentInstance.updateCollectionTags();

    expect(collectionUpdateService.setCollectionTags).toHaveBeenCalledWith(
      mockCollection, collectionTags);
  });

  it('should show alert when collection tags are not valid', () => {
    componentInstance.collection = mockCollection;
    let collectionTags = ['Invalid Tag   '];

    spyOn(componentInstance, 'normalizeTags').and.returnValue(collectionTags);
    spyOn(alertsService, 'addWarning');
    spyOn(collectionValidationService, 'isTagValid').and.returnValue(false);

    componentInstance.updateCollectionTags();

    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'Please ensure that there are no duplicate tags and that all ' +
                'tags contain only lower case and spaces.');
  });
});
