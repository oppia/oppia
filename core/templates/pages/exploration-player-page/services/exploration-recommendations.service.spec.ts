// Copyright 2019 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit tests for ExplorationRecommendationsService.
 */


import { async, TestBed } from '@angular/core/testing';
import { ExplorationRecommendationsService } from
  // eslint-disable-next-line max-len
  'pages/exploration-player-page/services/exploration-recommendations.service';
import { ContextService } from 'services/context.service';
import { ServicesConstants } from 'services/services.constants';
import { UrlService } from 'services/contextual/url.service';
import { ExplorationRecommendationsBackendApiService } from
  'domain/recommendations/exploration-recommendations-backend-api.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';



fdescribe('Exploration Recommendations Service', () => {
  let expRecsService: ExplorationRecommendationsService;
  let urlService: UrlService;
  let contextService: ContextService;
  let expRecsBackendApiService: ExplorationRecommendationsBackendApiService;
  const STORY_ID = '1';
  const NODE_ID = '3';
  const EXPLORATION_ID = '4';

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
      ],
      providers: [
        ExplorationRecommendationsService,
      ]
    });
  }));

  beforeEach(() => {
    urlService = TestBed.get(UrlService);
    contextService = TestBed.get(ContextService);
    expRecsBackendApiService = TestBed.get(
      ExplorationRecommendationsBackendApiService
    );

    spyOn(urlService, 'getCollectionIdFromExplorationUrl');
    spyOn(urlService, 'getUrlParams').and.returnValue({
      story_id: STORY_ID,
      node_id: NODE_ID
    });

    spyOn(contextService, 'getExplorationId').and.returnValue(EXPLORATION_ID);

    spyOn(expRecsBackendApiService, 'getRecommendedSummaryDicts');
  });

  describe('when context is in editor page', () => {
    beforeEach(() => {
      spyOn(contextService, 'getPageContext').and.returnValue(
        ServicesConstants.PAGE_CONTEXT.EXPLORATION_EDITOR
      );
    });

    it('should initialize with correct context', () => {
      expRecsService = TestBed.get(ExplorationRecommendationsService);
      expect(expRecsService.isInEditorPage).toBeTrue();
    });

    describe('in preview mode', () => {
      beforeEach(() => {
        spyOn(contextService, 'getEditorTabContext').and.returnValue(
          ServicesConstants.EXPLORATION_EDITOR_TAB_CONTEXT.PREVIEW
        );
      });
      it('should initialize with correct context', () => {
        expRecsService = TestBed.get(ExplorationRecommendationsService);
        expect(expRecsService.isInEditorPage).toBeTrue();
        expect(expRecsService.isInEditorPreviewMode).toBeTrue();
      });
    });
  });

  describe('when not in editor page', () => {
    beforeEach(() => {
      spyOn(contextService, 'getPageContext').and.returnValue(
        ServicesConstants.PAGE_CONTEXT.OTHER
      );
    });

    it('should initialize with correct context', () => {
      expRecsService = TestBed.get(ExplorationRecommendationsService);
      expect(expRecsService.isInEditorPage).toBeFalse();
    });
  });
});
