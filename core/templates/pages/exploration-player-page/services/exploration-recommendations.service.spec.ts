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



describe('Exploration Recommendations Service', () => {
  let expRecsService: ExplorationRecommendationsService;
  let urlService: UrlService;
  let contextService: ContextService;
  let expRecsBackendApiService: ExplorationRecommendationsBackendApiService;
  const STORY_ID = '1';
  const COLLECTION_ID = '2';
  const NODE_ID = '3';
  const EXPLORATION_ID = '4';
  const AUTHOR_REC_EXP_IDS = ['5', '6'];

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

    spyOn(urlService, 'getCollectionIdFromExplorationUrl').and.returnValue(
      COLLECTION_ID);

    spyOn(urlService, 'getUrlParams').and.returnValue({
      story_id: STORY_ID,
      node_id: NODE_ID
    });

    spyOn(contextService, 'getExplorationId').and.returnValue(EXPLORATION_ID);

    spyOn(
      expRecsBackendApiService, 'getRecommendedSummaryDicts').and.resolveTo([]);
  });

  describe('when used in the editor', () => {
    beforeEach(() => {
      spyOn(contextService, 'getPageContext').and.returnValue(
        ServicesConstants.PAGE_CONTEXT.EXPLORATION_EDITOR
      );
    });

    it('should initialize with editor context', () => {
      expRecsService = TestBed.get(ExplorationRecommendationsService);
      expect(expRecsService.isInEditorPage).toBeTrue();
    });

    describe('in the Preview tab', () => {
      beforeEach(() => {
        spyOn(contextService, 'getEditorTabContext').and.returnValue(
          ServicesConstants.EXPLORATION_EDITOR_TAB_CONTEXT.PREVIEW
        );
      });
      it('should initialize with editor preview context', () => {
        expRecsService = TestBed.get(ExplorationRecommendationsService);
        expect(expRecsService.isInEditorPage).toBeTrue();
        expect(expRecsService.isInEditorPreviewMode).toBeTrue();
      });
    });
    describe('getRecommendendedSummaryDicts', () => {
      beforeEach(() => {
        expRecsService = TestBed.get(ExplorationRecommendationsService);
      });
      it('should not include system recommendations', () => {
        expRecsService.getRecommendedSummaryDicts(
          AUTHOR_REC_EXP_IDS, true, (val)=>val
        );
        expect(
          expRecsBackendApiService.getRecommendedSummaryDicts
        ).toHaveBeenCalledWith(
          AUTHOR_REC_EXP_IDS,
          'false',
          COLLECTION_ID,
          STORY_ID,
          NODE_ID,
          EXPLORATION_ID
        );
      });
    });
  });

  describe('when used outside of the editor', () => {
    beforeEach(() => {
      spyOn(contextService, 'getPageContext').and.returnValue(
        ServicesConstants.PAGE_CONTEXT.OTHER
      );
    });

    it('should not initialize with editor context', () => {
      expRecsService = TestBed.get(ExplorationRecommendationsService);
      expect(expRecsService.isInEditorPage).toBeFalse();
    });

    describe('getRecommendendedSummaryDicts', () => {
      beforeEach(() => {
        expRecsService = TestBed.get(ExplorationRecommendationsService);
      });
      it('should include system recommendations', () => {
        expRecsService.getRecommendedSummaryDicts(
          AUTHOR_REC_EXP_IDS, true, (val)=>val
        );
        expect(
          expRecsBackendApiService.getRecommendedSummaryDicts
        ).toHaveBeenCalledWith(
          AUTHOR_REC_EXP_IDS,
          'true',
          COLLECTION_ID,
          STORY_ID,
          NODE_ID,
          EXPLORATION_ID
        );
      });
    });
  });
});
