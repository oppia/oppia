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
 * @fileoverview Unit test for collection editor navbar breadcrumb component.
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed, waitForAsync, ComponentFixture, fakeAsync } from '@angular/core/testing';
import { CollectionEditorPageConstants } from '../collection-editor-page.constants';
import { CollectionEditorNavbarBreadcrumbComponent } from './collection-editor-navbar-breadcrumb.component';
import { CollectionEditorStateService } from '../services/collection-editor-state.service';
import { CollectionEditorRoutingService } from '../services/collection-editor-routing.service';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { Collection } from 'domain/collection/collection.model';
import { HttpClientTestingModule } from '@angular/common/http/testing';

// eslint-disable-next-line oppia/no-test-blockers
fdescribe('Collection editor navbar breadcrumb component', () => {
  let collectionEditorStateService: CollectionEditorStateService;
  let collectionEditorRoutingService: CollectionEditorRoutingService;
  let focusManagerService: FocusManagerService;
  let component: CollectionEditorNavbarBreadcrumbComponent;
  let fixture: ComponentFixture<CollectionEditorNavbarBreadcrumbComponent>;
  let mockCollection: Collection;

  let activeTab = 'edit';
  let collectionData = {
    id: 'collection_id',
    title: 'collection title',
    objective: 'collection objective',
    languageCode: 'en',
    tags: ['mock tag'],
    playthrough: null,
    category: 'Collection Category',
    version: 0,
    schemaVersion: 1,
    nodes: []
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      declarations: [
        CollectionEditorNavbarBreadcrumbComponent
      ],
      providers: [
        CollectionEditorStateService,
        CollectionEditorRoutingService,
        FocusManagerService
      ],
      schemas: [
        NO_ERRORS_SCHEMA
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      CollectionEditorNavbarBreadcrumbComponent);
    component = fixture.componentInstance;
    collectionEditorStateService = TestBed.inject(CollectionEditorStateService);
    collectionEditorStateService = (collectionEditorStateService as unknown) as
      jasmine.SpyObj<CollectionEditorStateService>;
    collectionEditorRoutingService = TestBed.inject(
      CollectionEditorRoutingService);
    collectionEditorRoutingService = (
      (collectionEditorRoutingService as unknown) as
        jasmine.SpyObj<CollectionEditorRoutingService>);
    focusManagerService = TestBed.inject(FocusManagerService);
    focusManagerService = (focusManagerService as unknown) as
      jasmine.SpyObj<FocusManagerService>;
  });

  beforeEach(() => {
    mockCollection = new Collection(
      collectionData.id, collectionData.title, collectionData.objective,
      collectionData.languageCode, collectionData.tags,
      collectionData.playthrough, collectionData.category,
      collectionData.version, collectionData.schemaVersion,
      collectionData.nodes);
  });

  it('should load the component properly', () => {
    spyOn(collectionEditorStateService, 'getCollection').and.returnValue(
      mockCollection);
    spyOn(collectionEditorRoutingService, 'getActiveTabName').and.returnValue(
      activeTab);

    component.ngOnInit();
    fixture.whenStable()
      .then(() => {
        expect(component.collection).toBe(mockCollection);
        expect(component.activeTabName).toBe(activeTab);
      });
  });

  it('should get the current tab name in readable form', () => {
    spyOn(collectionEditorStateService, 'getCollection').and.returnValue(
      mockCollection);
    spyOn(collectionEditorRoutingService, 'getActiveTabName').and.returnValue(
      activeTab);

    component.ngOnInit();
    fixture.whenStable()
      .then(() => {
        expect(component.getCurrentTabName()).toBe('Edit');
      });
  });

  it('should edit the active tab to settings and change focus',
    fakeAsync(() => {
      spyOn(collectionEditorStateService, 'getCollection').and.returnValue(
        mockCollection);
      spyOn(collectionEditorRoutingService, 'getActiveTabName').and.returnValue(
        activeTab);
      spyOn(focusManagerService, 'setFocus');

      component.ngOnInit();
      fixture.whenStable()
        .then(() => {
          component.editCollectionTitle();
          expect(component.activeTabName).toBe('Settings');
          expect(focusManagerService.setFocus).toHaveBeenCalledWith(
            CollectionEditorPageConstants.COLLECTION_TITLE_INPUT_FOCUS_LABEL);
        });
    }));
});
