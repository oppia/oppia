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
 * @fileoverview Unit tests for collection editor navbar breadcrumb component.
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {
  TestBed,
  waitForAsync,
  ComponentFixture,
  fakeAsync,
} from '@angular/core/testing';
import {CollectionEditorPageConstants} from '../collection-editor-page.constants';
import {CollectionEditorNavbarBreadcrumbComponent} from './collection-editor-navbar-breadcrumb.component';
import {CollectionEditorStateService} from '../services/collection-editor-state.service';
import {CollectionEditorRoutingService} from '../services/collection-editor-routing.service';
import {FocusManagerService} from 'services/stateful/focus-manager.service';
import {Collection} from 'domain/collection/collection.model';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {CollectionPlaythrough} from 'domain/collection/collection-playthrough.model';

describe('Collection editor navbar breadcrumb component', () => {
  let collectionEditorStateService: CollectionEditorStateService;
  let collectionEditorRoutingService: CollectionEditorRoutingService;
  let focusManagerService: FocusManagerService;
  let component: CollectionEditorNavbarBreadcrumbComponent;
  let fixture: ComponentFixture<CollectionEditorNavbarBreadcrumbComponent>;
  let expectedCollection: Collection;

  let activeTab = 'edit';
  let collectionData = {
    id: 'collection_id',
    title: 'collection title',
    objective: 'collection objective',
    languageCode: 'en',
    tags: ['test tag'],
    playthrough: new CollectionPlaythrough(null, []),
    category: 'Collection Category',
    version: 0,
    schemaVersion: 1,
    nodes: [],
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [CollectionEditorNavbarBreadcrumbComponent],
      providers: [
        CollectionEditorStateService,
        CollectionEditorRoutingService,
        FocusManagerService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      CollectionEditorNavbarBreadcrumbComponent
    );
    component = fixture.componentInstance;
    collectionEditorStateService = TestBed.inject(CollectionEditorStateService);
    collectionEditorRoutingService = TestBed.inject(
      CollectionEditorRoutingService
    );
    focusManagerService = TestBed.inject(FocusManagerService);
  });

  beforeEach(() => {
    expectedCollection = new Collection(
      collectionData.id,
      collectionData.title,
      collectionData.objective,
      collectionData.languageCode,
      collectionData.tags,
      collectionData.playthrough,
      collectionData.category,
      collectionData.version,
      collectionData.schemaVersion,
      collectionData.nodes
    );
  });

  beforeEach(() => {
    spyOn(collectionEditorStateService, 'getCollection').and.returnValue(
      expectedCollection
    );
    spyOn(collectionEditorRoutingService, 'getActiveTabName').and.returnValue(
      activeTab
    );
    spyOn(focusManagerService, 'setFocus');
    component.ngOnInit();
  });

  it(
    'should load the component on opening collection editor page by clicking' +
      'on create collection',
    () => {
      expect(component.collection).toBe(expectedCollection);
      expect(component.activeTabName).toBe(activeTab);
    }
  );

  it('should get the current tab name in readable form', () => {
    expect(component.getCurrentTabName()).toBe('Edit');
  });

  it(
    'should change the active tab to settings when clicked on' +
      'collection title if the title is empty',
    fakeAsync(() => {
      expect(component.activeTabName).toBe(activeTab);

      component.editCollectionTitle();

      expect(component.activeTabName).toBe('Settings');
      expect(focusManagerService.setFocus).toHaveBeenCalledWith(
        CollectionEditorPageConstants.COLLECTION_TITLE_INPUT_FOCUS_LABEL
      );
    })
  );
});
