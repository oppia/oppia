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
 * @fileoverview Unit test for collection editor navbar component.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {EventEmitter, NO_ERRORS_SCHEMA} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {UrlSerializer} from '@angular/router';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {CollectionPlaythrough} from 'domain/collection/collection-playthrough.model';
import {CollectionRightsBackendApiService} from 'domain/collection/collection-rights-backend-api.service';
import {CollectionRights} from 'domain/collection/collection-rights.model';
import {CollectionValidationService} from 'domain/collection/collection-validation.service';
import {Collection} from 'domain/collection/collection.model';
import {UndoRedoService} from 'domain/editor/undo_redo/undo-redo.service';
import {UrlService} from 'services/contextual/url.service';
import {CollectionEditorRoutingService} from '../services/collection-editor-routing.service';
import {CollectionEditorStateService} from '../services/collection-editor-state.service';
import {CollectionEditorNavbarComponent} from './collection-editor-navbar.component';

describe('Collection editor navbar component', () => {
  let fixture: ComponentFixture<CollectionEditorNavbarComponent>;
  let componentInstance: CollectionEditorNavbarComponent;

  let collectionEditorRoutingService: CollectionEditorRoutingService;
  let collectionEditorStateService: CollectionEditorStateService;
  let collectionRightsBackendApiService: CollectionRightsBackendApiService;
  let collectionValidationService: CollectionValidationService;
  let undoRedoService: UndoRedoService;
  let urlService: UrlService;
  let ngbModal: NgbModal;

  let collectionTitle = 'Collection Title';
  let collectionObjective = 'Collection Objective';
  let collectionCategory = 'Collection Category';
  let languageCode = 'en';
  let collectionTags = ['mock tag'];
  let collectionId = 'collection_id';
  let mockCollection = new Collection(
    collectionId,
    collectionTitle,
    collectionObjective,
    languageCode,
    collectionTags,
    new CollectionPlaythrough(null, []),
    collectionCategory,
    0,
    1,
    []
  );
  let mockPrivateCollectionRights = new CollectionRights({
    collection_id: collectionId,
    can_edit: true,
    can_unpublish: true,
    is_private: true,
    owner_names: [],
  });

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [CollectionEditorNavbarComponent],
      providers: [
        CollectionEditorRoutingService,
        CollectionEditorStateService,
        CollectionRightsBackendApiService,
        CollectionValidationService,
        UndoRedoService,
        UrlSerializer,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CollectionEditorNavbarComponent);
    componentInstance = fixture.componentInstance;

    collectionEditorRoutingService = TestBed.inject(
      CollectionEditorRoutingService
    );
    collectionEditorStateService = TestBed.inject(CollectionEditorStateService);
    collectionRightsBackendApiService = TestBed.inject(
      CollectionRightsBackendApiService
    );
    collectionValidationService = TestBed.inject(CollectionValidationService);
    undoRedoService = TestBed.inject(UndoRedoService);
    urlService = TestBed.inject(UrlService);
    ngbModal = TestBed.inject(NgbModal);
  });

  afterEach(() => {
    componentInstance.ngOnDestroy();
  });

  it('should initialize', fakeAsync(() => {
    let mockOnCollectionEventEmitter = new EventEmitter<void>();
    let mockUndoRedoChangeAppliedEventEmitter = new EventEmitter<void>();

    spyOnProperty(
      collectionEditorStateService,
      'onCollectionInitialized'
    ).and.returnValue(mockOnCollectionEventEmitter);
    spyOn(undoRedoService, 'getUndoRedoChangeEventEmitter').and.returnValue(
      mockUndoRedoChangeAppliedEventEmitter
    );
    spyOn(urlService, 'getCollectionIdFromEditorUrl').and.returnValue(
      collectionId
    );
    spyOn(collectionEditorStateService, 'getCollection').and.returnValue(
      mockCollection
    );
    spyOn(collectionEditorStateService, 'getCollectionRights').and.returnValue(
      mockPrivateCollectionRights
    );
    spyOn(
      collectionValidationService,
      'findValidationIssuesForPrivateCollection'
    ).and.returnValue([]);
    spyOn(
      collectionValidationService,
      'findValidationIssuesForPublicCollection'
    ).and.returnValue([]);

    componentInstance.ngOnInit();

    spyOn(componentInstance.collectionRights, 'isPrivate').and.returnValue(
      true
    );

    mockOnCollectionEventEmitter.emit();
    tick();
    mockUndoRedoChangeAppliedEventEmitter.emit();
    tick();

    expect(componentInstance.collectionId).toEqual(collectionId);
    expect(componentInstance.collection).toEqual(mockCollection);
    expect(urlService.getCollectionIdFromEditorUrl).toHaveBeenCalled();
    expect(collectionEditorStateService.getCollection).toHaveBeenCalled();
    expect(collectionEditorStateService.getCollectionRights).toHaveBeenCalled();
  }));

  it('should validate public collection', fakeAsync(() => {
    let mockPublicCollectionRights = new CollectionRights({
      collection_id: collectionId,
      can_edit: true,
      can_unpublish: true,
      is_private: false,
      owner_names: [],
    });

    let mockOnCollectionEventEmitter = new EventEmitter<void>();
    let mockUndoRedoChangeAppliedEventEmitter = new EventEmitter<void>();

    spyOnProperty(
      collectionEditorStateService,
      'onCollectionInitialized'
    ).and.returnValue(mockOnCollectionEventEmitter);
    spyOn(undoRedoService, 'getUndoRedoChangeEventEmitter').and.returnValue(
      mockUndoRedoChangeAppliedEventEmitter
    );
    spyOn(urlService, 'getCollectionIdFromEditorUrl').and.returnValue(
      collectionId
    );
    spyOn(collectionEditorStateService, 'getCollection').and.returnValue(
      mockCollection
    );
    spyOn(collectionEditorStateService, 'getCollectionRights').and.returnValue(
      mockPublicCollectionRights
    );
    spyOn(
      collectionValidationService,
      'findValidationIssuesForPrivateCollection'
    ).and.returnValue([]);
    spyOn(
      collectionValidationService,
      'findValidationIssuesForPublicCollection'
    ).and.returnValue([]);

    componentInstance.ngOnInit();

    mockOnCollectionEventEmitter.emit();
    tick();
    mockUndoRedoChangeAppliedEventEmitter.emit();
    tick();

    expect(componentInstance.collectionId).toEqual(collectionId);
    expect(componentInstance.collection).toEqual(mockCollection);
    expect(urlService.getCollectionIdFromEditorUrl).toHaveBeenCalled();
    expect(collectionEditorStateService.getCollection).toHaveBeenCalled();
    expect(collectionEditorStateService.getCollectionRights).toHaveBeenCalled();
  }));

  it('should test dropdown toggle functions', () => {
    componentInstance.editButtonHovering = false;
    componentInstance.onEditButtonHover();
    expect(componentInstance.editButtonHovering).toBeTrue();
    componentInstance.playerButtonHovering = false;
    componentInstance.onPlayerButtonHover();
    expect(componentInstance.playerButtonHovering).toBeTrue();
  });

  it('should test getters', () => {
    componentInstance.validationIssues = [];
    componentInstance.collectionRights = {
      isPrivate: () => true,
    } as CollectionRights;

    let changeCount = 10;
    let activeTabName = 'active tab';

    spyOn(undoRedoService, 'getChangeCount').and.returnValue(changeCount);
    spyOn(collectionEditorStateService, 'isLoadingCollection').and.returnValues(
      true,
      false
    );
    spyOn(collectionEditorStateService, 'isSavingCollection').and.returnValues(
      true,
      false
    );
    spyOn(collectionEditorRoutingService, 'getActiveTabName').and.returnValue(
      activeTabName
    );

    expect(componentInstance.getWarningsCount()).toEqual(0);
    expect(componentInstance.getChangeListCount()).toEqual(changeCount);
    expect(componentInstance.isCollectionSaveable()).toBeTrue();
    expect(componentInstance.isCollectionPublishable()).toBeFalse();
    expect(componentInstance.isLoadingCollection()).toBeTrue();
    expect(componentInstance.isLoadingCollection()).toBeFalse();
    expect(componentInstance.isSaveInProgress()).toBeTrue();
    expect(componentInstance.isSaveInProgress()).toBeFalse();
    expect(componentInstance.getActiveTabName()).toEqual(activeTabName);
  });

  it('should select switch tabs', () => {
    spyOn(collectionEditorRoutingService, 'navigateToEditTab');
    spyOn(collectionEditorRoutingService, 'navigateToSettingsTab');
    spyOn(collectionEditorRoutingService, 'navigateToStatsTab');
    spyOn(collectionEditorRoutingService, 'navigateToHistoryTab');

    componentInstance.selectMainTab();
    componentInstance.selectSettingsTab();
    componentInstance.selectStatsTab();
    componentInstance.selectHistoryTab();

    expect(collectionEditorRoutingService.navigateToEditTab).toHaveBeenCalled();
    expect(
      collectionEditorRoutingService.navigateToSettingsTab
    ).toHaveBeenCalled();
    expect(
      collectionEditorRoutingService.navigateToStatsTab
    ).toHaveBeenCalled();
    expect(
      collectionEditorRoutingService.navigateToHistoryTab
    ).toHaveBeenCalled();
  });

  it('should save changes', () => {
    let commitMessage = 'success';
    componentInstance.collectionRights = mockPrivateCollectionRights;

    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: {
        isCollectionPrivate: false,
      },
      result: {
        then: (
          successCallback: (commitMessage: string) => void,
          errorCallback: () => void
        ) => {
          successCallback(commitMessage);
          errorCallback();
        },
      },
    } as NgbModalRef);

    spyOn(collectionEditorStateService, 'saveCollection');

    componentInstance.saveChanges();

    expect(collectionEditorStateService.saveCollection).toHaveBeenCalledWith(
      commitMessage
    );
  });

  it('should publish collection', fakeAsync(() => {
    componentInstance.collection = mockCollection;
    componentInstance.collectionRights = mockPrivateCollectionRights;

    spyOn(
      collectionRightsBackendApiService,
      'setCollectionPublicAsync'
    ).and.returnValue(Promise.resolve(mockPrivateCollectionRights));
    spyOn(collectionEditorStateService, 'setCollectionRights');

    componentInstance.publishCollection();
    tick();

    expect(
      collectionRightsBackendApiService.setCollectionPublicAsync
    ).toHaveBeenCalled();
    expect(collectionEditorStateService.setCollectionRights).toHaveBeenCalled();

    let mockCollectionWithoutMetadata = new Collection(
      'id',
      '',
      '',
      '',
      [],
      new CollectionPlaythrough(null, []),
      '',
      0,
      1,
      []
    );

    componentInstance.collection = mockCollectionWithoutMetadata;

    spyOn(ngbModal, 'open').and.returnValue({
      result: {
        then: (
          successCallback: (commitMessage: string[]) => void,
          errorCallback: () => void
        ) => {
          successCallback([]);
          errorCallback();
        },
      },
    } as NgbModalRef);
    spyOn(collectionEditorStateService, 'saveCollection');

    componentInstance.publishCollection();
    tick();

    expect(collectionEditorStateService.saveCollection).toHaveBeenCalled();
  }));
});
