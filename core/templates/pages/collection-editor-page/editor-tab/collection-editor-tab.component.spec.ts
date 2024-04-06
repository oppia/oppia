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
 * @fileoverview Unit tests for collection editor tab component.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {CollectionNode} from 'domain/collection/collection-node.model';
import {CollectionPlaythrough} from 'domain/collection/collection-playthrough.model';
import {Collection} from 'domain/collection/collection.model';
import {CollectionEditorStateService} from '../services/collection-editor-state.service';
import {CollectionLinearizerService} from '../services/collection-linearizer.service';
import {CollectionEditorTabComponent} from './collection-editor-tab.component';

describe('Collection editor tab component', () => {
  let componentInstance: CollectionEditorTabComponent;
  let fixture: ComponentFixture<CollectionEditorTabComponent>;

  let collectionEditorStateService: CollectionEditorStateService;
  let collectionLinearizerService: CollectionLinearizerService;

  let mockCollection = new Collection(
    '',
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

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [CollectionEditorTabComponent],
      providers: [CollectionEditorStateService, CollectionLinearizerService],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CollectionEditorTabComponent);
    componentInstance = fixture.componentInstance;

    collectionEditorStateService = TestBed.inject(CollectionEditorStateService);
    collectionLinearizerService = TestBed.inject(CollectionLinearizerService);
  });

  it('should initialize', () => {
    spyOn(collectionEditorStateService, 'getCollection').and.returnValue(
      mockCollection
    );

    componentInstance.ngOnInit();

    expect(componentInstance.collection).toEqual(mockCollection);
  });

  it('should get linearly sorted nodes', () => {
    componentInstance.collection = mockCollection;
    let collectionNode = new CollectionNode({
      exploration_id: 'id',
      exploration_summary: null,
    });

    spyOn(
      collectionLinearizerService,
      'getCollectionNodesInPlayableOrder'
    ).and.returnValue([collectionNode]);

    expect(componentInstance.getLinearlySortedNodes()).toEqual([
      collectionNode,
    ]);
  });

  it('should tell if collection is loaded', () => {
    spyOn(collectionEditorStateService, 'hasLoadedCollection').and.returnValues(
      true,
      false
    );
    expect(componentInstance.hasLoadedCollection()).toBeTrue();
    expect(componentInstance.hasLoadedCollection()).toBeFalse();
  });
});
