// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for collection permissions card component.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CollectionRights } from 'domain/collection/collection-rights.model';
import { CollectionEditorStateService } from '../services/collection-editor-state.service';
import { CollectionPermissionsCardComponent } from './collection-permissions-card.component';

describe('Collection permissions card component', () => {
  let fixture: ComponentFixture<CollectionPermissionsCardComponent>;
  let componentInstance: CollectionPermissionsCardComponent;
  let collectionEditorStateService: CollectionEditorStateService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      declarations: [
        CollectionPermissionsCardComponent
      ],
      providers: [
        CollectionEditorStateService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CollectionPermissionsCardComponent);
    componentInstance = fixture.componentInstance;
    collectionEditorStateService = TestBed.inject(CollectionEditorStateService);
  });

  it('should initialize', () => {
    let mockCollectionRights = new CollectionRights({
      collection_id: null,
      can_edit: null,
      can_unpublish: null,
      is_private: null,
      owner_names: []
    });
    spyOn(collectionEditorStateService, 'getCollectionRights').and.returnValue(
      mockCollectionRights);
    componentInstance.ngOnInit();
    expect(componentInstance.collectionRights).toEqual(mockCollectionRights);
  });

  it('should tell if page has loaded', () => {
    spyOn(collectionEditorStateService, 'hasLoadedCollection').and.returnValues(
      false, true);
    expect(componentInstance.hasPageLoaded()).toBeFalse();
    expect(componentInstance.hasPageLoaded()).toBeTrue();
  });
});
