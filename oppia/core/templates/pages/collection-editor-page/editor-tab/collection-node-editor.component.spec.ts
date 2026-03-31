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
 * @fileoverview Unit tests for for Collection node editor component.
 */

import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {CollectionNodeEditorComponent} from './collection-node-editor.component';
import {CollectionLinearizerService} from '../services/collection-linearizer.service';
import {AlertsService} from 'services/alerts.service';
import {CollectionEditorStateService} from '../services/collection-editor-state.service';
import {
  Collection,
  CollectionBackendDict,
} from 'domain/collection/collection.model';
import {CollectionNode} from 'domain/collection/collection-node.model';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MaterialModule} from 'modules/material.module';
import {FormsModule} from '@angular/forms';
import {LearnerExplorationSummaryBackendDict} from 'domain/summary/learner-exploration-summary.model';

describe('Collection node editor component ', () => {
  let component: CollectionNodeEditorComponent;
  let fixture: ComponentFixture<CollectionNodeEditorComponent>;
  let collectionLinearizerService: CollectionLinearizerService;
  let alertsService: AlertsService;
  let collectionEditorStateService: CollectionEditorStateService;

  let sampleCollection: Collection;
  let learnerExplorationSummaryBackendDict: LearnerExplorationSummaryBackendDict;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        MaterialModule,
        FormsModule,
        HttpClientTestingModule,
      ],
      declarations: [CollectionNodeEditorComponent],
      providers: [],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CollectionNodeEditorComponent);
    component = fixture.componentInstance;
    collectionLinearizerService = TestBed.inject(CollectionLinearizerService);
    alertsService = TestBed.inject(AlertsService);
    collectionEditorStateService = TestBed.inject(CollectionEditorStateService);

    component.collectionNode =
      CollectionNode.createFromExplorationId('exp_id0');

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
        5: 0,
      },
      human_readable_contributors_summary: {},
      language_code: 'en',
      num_views: 0,
      objective: 'Test Objective',
      status: 'public',
      tags: [],
      thumbnail_bg_color: '#cc4b00',
      thumbnail_icon_url: '/subjects/Algebra.svg',
      title: 'a title',
    };

    let sampleCollectionBackendObject: CollectionBackendDict = {
      id: 'collection_id',
      title: 'a title',
      objective: 'an objective',
      language_code: 'en',
      tags: [],
      category: 'a category',
      version: 1,
      schema_version: 1,
      nodes: [
        {
          exploration_id: 'exp_id0',
          exploration_summary: learnerExplorationSummaryBackendDict,
        },
        {
          exploration_id: 'exp_id1',
          exploration_summary: learnerExplorationSummaryBackendDict,
        },
      ],
      playthrough_dict: {
        next_exploration_id: 'expId',
        completed_exploration_ids: ['expId2'],
      },
    };

    sampleCollection = Collection.create(sampleCollectionBackendObject);

    spyOn(collectionEditorStateService, 'getCollection').and.returnValue(
      sampleCollection
    );
    fixture.detectChanges();
  });

  it('should fetch collection when initialized', () => {
    component.ngOnInit();
    expect(component.collection).toEqual(sampleCollection);
  });

  it("should delete node when calling 'deleteNode'", () => {
    let removeSpy = spyOn(
      collectionLinearizerService,
      'removeCollectionNode'
    ).and.returnValue(true);

    component.deleteNode();

    expect(removeSpy).toHaveBeenCalled();
  });

  it(
    'should not delete node from collection in case ' + 'of backend error',
    () => {
      spyOn(
        collectionLinearizerService,
        'removeCollectionNode'
      ).and.returnValue(false);
      let alertsSpy = spyOn(alertsService, 'fatalWarning').and.returnValue();

      component.deleteNode();

      expect(alertsSpy).toHaveBeenCalledWith(
        'Internal collection editor error. Could not delete ' +
          'exploration by ID: exp_id0'
      );
    }
  );

  it("should shift node to left when calling 'shiftNodeLeft'", () => {
    let shiftNodeLeftSpy = spyOn(
      collectionLinearizerService,
      'shiftNodeLeft'
    ).and.returnValue(true);

    component.shiftNodeLeft();

    expect(shiftNodeLeftSpy).toHaveBeenCalled();
  });

  it('should not shift node to left in case ' + 'of backend error', () => {
    spyOn(collectionLinearizerService, 'shiftNodeLeft').and.returnValue(false);
    let alertsSpy = spyOn(alertsService, 'fatalWarning').and.returnValue();

    component.shiftNodeLeft();

    expect(alertsSpy).toHaveBeenCalledWith(
      'Internal collection editor error. Could not shift node left ' +
        'with ID: exp_id0'
    );
  });

  it("should shift node to right when calling 'shiftNodeRight'", () => {
    let shiftNodeRightSpy = spyOn(
      collectionLinearizerService,
      'shiftNodeRight'
    ).and.returnValue(true);

    component.shiftNodeRight();

    expect(shiftNodeRightSpy).toHaveBeenCalled();
  });

  it('should not shift node to right in case ' + 'of backend error', () => {
    spyOn(collectionLinearizerService, 'shiftNodeRight').and.returnValue(false);
    let alertsSpy = spyOn(alertsService, 'fatalWarning').and.returnValue();

    component.shiftNodeRight();

    expect(alertsSpy).toHaveBeenCalledWith(
      'Internal collection editor error. Could not shift node right ' +
        'with ID: exp_id0'
    );
  });
});
