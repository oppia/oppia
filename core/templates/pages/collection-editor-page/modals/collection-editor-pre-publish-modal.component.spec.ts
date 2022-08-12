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
 * @fileoverview Unit tests for collection editor pre publish modal.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NgbActiveModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { CollectionPlaythrough } from 'domain/collection/collection-playthrough.model';
import { CollectionUpdateService } from 'domain/collection/collection-update.service';
import { Collection } from 'domain/collection/collection.model';
import { AlertsService } from 'services/alerts.service';
import { CollectionEditorStateService } from '../services/collection-editor-state.service';
import { CollectionEditorPrePublishModalComponent } from './collection-editor-pre-publish-modal.component';

describe('Collection editor pre publish modal component', () => {
  let fixture: ComponentFixture<CollectionEditorPrePublishModalComponent>;
  let componentInstance: CollectionEditorPrePublishModalComponent;
  let collectionEditorStateService: CollectionEditorStateService;
  let collectionUpdateService: CollectionUpdateService;
  let ngbActiveModal: NgbActiveModal;
  let alertsService: AlertsService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        NgbModalModule
      ],
      declarations: [
        CollectionEditorPrePublishModalComponent
      ],
      providers: [
        AlertsService,
        CollectionEditorStateService,
        CollectionUpdateService,
        NgbActiveModal
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CollectionEditorPrePublishModalComponent);
    componentInstance = fixture.componentInstance;
    collectionEditorStateService = TestBed.inject(CollectionEditorStateService);
    collectionUpdateService = TestBed.inject(CollectionUpdateService);
    ngbActiveModal = TestBed.inject(NgbActiveModal);
    alertsService = TestBed.inject(AlertsService);
  });

  it('should initialize', () => {
    let collectionTitle = 'collection_title';
    let collectionObjective = 'collection_objective';
    let mockCollection = new Collection(
      'collection_id', collectionTitle, collectionObjective, 'en', [],
      new CollectionPlaythrough(null, []), '', 2, 3, []);
    spyOn(collectionEditorStateService, 'getCollection')
      .and.returnValue(mockCollection);
    componentInstance.ngOnInit();
    expect(componentInstance.newTitle).toEqual(collectionTitle);
    expect(componentInstance.newObjective).toEqual(collectionObjective);
  });

  it('should tell if saving is allowed', () => {
    componentInstance.newTitle = 'valid title';
    componentInstance.newObjective = 'valid objective';
    componentInstance.newCategory = '';
    expect(componentInstance.isSavingAllowed()).toBeFalse();
  });

  it('should cancel publish', () => {
    spyOn(ngbActiveModal, 'dismiss');
    componentInstance.cancel();
    expect(ngbActiveModal.dismiss).toHaveBeenCalled();
  });

  it('should publish', () => {
    let collectionTitle = 'collection_title';
    let collectionObjective = 'collection_objective';
    let mockCollection = new Collection(
      'collection_id', collectionTitle, collectionObjective, 'en', [],
      new CollectionPlaythrough(null, []), '', 2, 3, []);
    spyOn(collectionEditorStateService, 'getCollection')
      .and.returnValue(mockCollection);
    componentInstance.ngOnInit();

    spyOn(alertsService, 'addWarning');
    componentInstance.newTitle = '';
    componentInstance.save();
    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'Please specify a title');
    componentInstance.newTitle = 'valid title';
    componentInstance.newObjective = '';
    componentInstance.save();
    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'Please specify an objective');
    componentInstance.newObjective = 'learn';
    componentInstance.save();
    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'Please specify a category');
    componentInstance.newCategory = 'ALGEBRA';

    spyOn(collectionUpdateService, 'setCollectionObjective');
    spyOn(collectionUpdateService, 'setCollectionCategory');
    spyOn(ngbActiveModal, 'close');
    componentInstance.save();
  });
});
