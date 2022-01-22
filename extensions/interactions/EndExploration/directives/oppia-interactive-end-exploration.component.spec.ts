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
 * @fileoverview Unit tests for EndExploration component.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { InteractiveEndExplorationComponent } from './oppia-interactive-end-exploration.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ContextService } from 'services/context.service';
import { EndExplorationBackendApiService } from './end-exploration-backend-api.service';
import { InteractionAttributesExtractorService } from 'interactions/interaction-attributes-extractor.service';
import { ReadOnlyCollectionBackendApiService } from 'domain/collection/read-only-collection-backend-api.service';
import { UrlService } from 'services/contextual/url.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { CollectionNodeBackendDict } from 'domain/collection/collection-node.model';
import { Collection, CollectionBackendDict } from 'domain/collection/collection.model';

describe('InteractiveRatioExpressionInput', () => {
  let component: InteractiveEndExplorationComponent;
  let fixture: ComponentFixture<InteractiveEndExplorationComponent>;
  let contextService: ContextService;
  let endExplorationBackendApiService: EndExplorationBackendApiService;
  let readOnlyCollectionBackendApiService: ReadOnlyCollectionBackendApiService;
  let urlService: UrlService;
  let sampleCollection: Collection;

  const collectionNodeBackendObject: CollectionNodeBackendDict = {
    exploration_id: 'exp_id',
    exploration_summary: {
      last_updated_msec: 1591296737470.528,
      community_owned: false,
      objective: 'Test Objective',
      id: '44LKoKLlIbGe',
      num_views: 0,
      thumbnail_icon_url: '/subjects/Algebra.svg',
      human_readable_contributors_summary: {},
      language_code: 'en',
      thumbnail_bg_color: '#cd672b',
      created_on_msec: 1591296635736.666,
      ratings: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0
      },
      status: 'public',
      tags: [],
      activity_type: 'exploration',
      category: 'Algebra',
      title: 'Test Title'
    }
  };
  const sampleCollectionBackendObject: CollectionBackendDict = {
    id: '0',
    title: 'Collection Under Test',
    objective: 'objective',
    category: 'category',
    version: 1,
    nodes: [
      collectionNodeBackendObject,
      collectionNodeBackendObject,
      collectionNodeBackendObject,
      collectionNodeBackendObject,
      collectionNodeBackendObject,
      collectionNodeBackendObject
    ],
    language_code: null,
    schema_version: null,
    tags: null,
    playthrough_dict: {
      next_exploration_id: 'expId',
      completed_exploration_ids: ['expId2']
    }
  };
  const httpResponse = {
    summaries: [{
      id: '0'
    }]
  };
  const editorTabContext = 'preview';
  const pageContextEditor = 'editor';

  class MockInteractionAttributesExtractorService {
    getValuesFromAttributes(interactionId, attributes) {
      return {
        recommendedExplorationIds: {
          value: JSON.parse(attributes.recommendedExplorationIdsWithValue)
        },
      };
    }
  }

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [InteractiveEndExplorationComponent],
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: InteractionAttributesExtractorService,
          useClass: MockInteractionAttributesExtractorService
        },
        ContextService,
        EndExplorationBackendApiService,
        ReadOnlyCollectionBackendApiService,
        UrlService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  describe('Valid exploration id provided', function() {
    const explorationIds = ['0'];

    beforeEach(() => {
      contextService = TestBed.inject(ContextService);
      readOnlyCollectionBackendApiService =
        TestBed.inject(ReadOnlyCollectionBackendApiService);
      urlService = TestBed.inject(UrlService);
      endExplorationBackendApiService =
        TestBed.inject(EndExplorationBackendApiService);
      fixture = (
        TestBed.createComponent(InteractiveEndExplorationComponent));
      component = fixture.componentInstance;

      spyOn(contextService, 'getPageContext').and
        .returnValue(pageContextEditor);
      spyOn(contextService, 'getEditorTabContext').and.
        returnValue(editorTabContext);
      spyOn(urlService, 'getCollectionIdFromExplorationUrl')
        .and.returnValue('0');
      spyOn(urlService, 'isIframed').and.returnValue(true);

      sampleCollection = Collection.create(sampleCollectionBackendObject);
      sampleCollectionBackendObject.nodes = [collectionNodeBackendObject];
      spyOn(readOnlyCollectionBackendApiService, 'loadCollectionAsync')
        .and.callFake(() => Promise.resolve(sampleCollection));


      component.recommendedExplorationIdsWithValue = JSON.stringify(
        explorationIds);

      spyOn(endExplorationBackendApiService, 'getRecommendExplorationsData')
        .and.callFake(() => Promise.resolve(httpResponse));
    });

    fit('should initialize ctrl variables', function() {
      component.ngOnInit();
      expect(component.isIframed).toBe(true);
      expect(component.isInEditorPage).toBe(true);
      expect(component.isInEditorPreviewMode).toBe(true);
      expect(component.isInEditorMainTab).toBe(false);
      expect(component.collectionId).toBe('0');
      let result = component.getCollectionTitle();
      expect(result()).toBe('Collection Under Test');
      expect(component.errorMessage).toBe('');
    });

    it('should not display error message', function() {
      component.ngOnInit();
      expect(component.isInEditorPage).toBe(true);
      expect(component.isInEditorPreviewMode).toBe(true);
      expect(component.errorMessage).toBe('');
    });
  });

  describe('Invalid exploration Id provided', function() {
    const explorationIds = ['0', '1'];

    beforeEach(() => {
      contextService = TestBed.inject(ContextService);
      readOnlyCollectionBackendApiService =
        TestBed.inject(ReadOnlyCollectionBackendApiService);
      urlService = TestBed.inject(UrlService);
      endExplorationBackendApiService =
        TestBed.inject(EndExplorationBackendApiService);
      fixture = (
        TestBed.createComponent(InteractiveEndExplorationComponent));
      component = fixture.componentInstance;

      spyOn(contextService, 'getPageContext').and
        .returnValue(pageContextEditor);
      spyOn(contextService, 'getEditorTabContext').and.
        returnValue(editorTabContext);

      sampleCollection = Collection.create(sampleCollectionBackendObject);
      sampleCollectionBackendObject.nodes = [collectionNodeBackendObject];
      spyOn(readOnlyCollectionBackendApiService, 'loadCollectionAsync')
        .and.callFake(() => Promise.resolve(sampleCollection));

      spyOn(urlService, 'getCollectionIdFromExplorationUrl')
        .and.returnValue('0');
      spyOn(urlService, 'isIframed').and.returnValue(true);

      component.recommendedExplorationIdsWithValue = JSON.stringify(
        explorationIds);

      spyOn(endExplorationBackendApiService, 'getRecommendExplorationsData')
        .and.callFake(() => Promise.resolve(httpResponse));
    });

    fit('should display error message', function() {
      component.ngOnInit();
      expect(component.isIframed).toBe(true);
      expect(component.isInEditorPage).toBe(true);
      expect(component.isInEditorPreviewMode).toBe(true);
      expect(component.isInEditorMainTab).toBe(false);
      expect(component.collectionId).toBe('0');
      expect(component.getCollectionTitle()).toBe('Collection Under Test');
      expect(component.errorMessage).toBe(
        'Warning: exploration(s) with the IDs "' + '1' +
      '" will not be shown as recommendations because ' +
      'they either do not exist, or are not publicly viewable.');
    });
  });

  describe('Data should not be fetched from backend ', function() {
    const explorationIds = ['0', '1'];

    beforeEach(() => {
      contextService = TestBed.inject(ContextService);
      readOnlyCollectionBackendApiService =
        TestBed.inject(ReadOnlyCollectionBackendApiService);
      urlService = TestBed.inject(UrlService);
      endExplorationBackendApiService =
        TestBed.inject(EndExplorationBackendApiService);
      fixture = (
        TestBed.createComponent(InteractiveEndExplorationComponent));
      component = fixture.componentInstance;

      spyOn(contextService, 'getPageContext').and
        .returnValue('learner');
      spyOn(contextService, 'getEditorTabContext').and.
        returnValue(editorTabContext);

      sampleCollection = Collection.create(sampleCollectionBackendObject);
      sampleCollectionBackendObject.nodes = [collectionNodeBackendObject];
      spyOn(readOnlyCollectionBackendApiService, 'loadCollectionAsync')
        .and.callFake(() => Promise.resolve(sampleCollection));

      spyOn(urlService, 'getCollectionIdFromExplorationUrl')
        .and.returnValue('');
      spyOn(urlService, 'isIframed').and.returnValue(true);

      component.recommendedExplorationIdsWithValue = JSON.stringify(
        explorationIds);

      spyOn(endExplorationBackendApiService, 'getRecommendExplorationsData')
        .and.callFake(() => Promise.resolve(httpResponse));
    });

    it('should not load collection data', function() {
      component.ngOnInit();
      expect(component.collectionId).toBe('');
      expect(readOnlyCollectionBackendApiService.loadCollectionAsync)
        .not.toHaveBeenCalled();
    });

    it('should not check if any author-recommended explorations are' +
    ' invalid.', function() {
      component.ngOnInit();
      expect(component.isInEditorPage).toBe(false);
      expect($httpBackend.flush).toThrowError();
      $httpBackend.verifyNoOutstandingRequest();
    });
  });
});
