// Copyright 2020 The Oppia Authors. All Rights Reserved.
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

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {async, TestBed} from '@angular/core/testing';

import {ExplorationRecommendationsBackendApiService} from 'domain/recommendations/exploration-recommendations-backend-api.service';
import {LearnerExplorationSummary} from 'domain/summary/learner-exploration-summary.model';
import {ExplorationRecommendationsService} from 'pages/exploration-player-page/services/exploration-recommendations.service';
import {ContextService} from 'services/context.service';
import {UrlService} from 'services/contextual/url.service';
import {ServicesConstants} from 'services/services.constants';

describe('Exploration Recommendations Service', () => {
  let expRecsService: ExplorationRecommendationsService;
  let urlService: UrlService;
  let contextService: ContextService;

  const STORY_ID = '1';
  const COLLECTION_ID = '2';
  const NODE_ID = '3';
  const EXPLORATION_ID = '4';

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ExplorationRecommendationsService],
    });
  }));

  beforeEach(() => {
    urlService = TestBed.inject(UrlService);
    contextService = TestBed.inject(ContextService);

    spyOn(urlService, 'getCollectionIdFromExplorationUrl').and.returnValue(
      COLLECTION_ID
    );

    spyOn(urlService, 'getUrlParams').and.returnValue({
      story_id: STORY_ID,
      node_id: NODE_ID,
    });

    spyOn(contextService, 'getExplorationId').and.returnValue(EXPLORATION_ID);
  });

  describe('when used in the editor page', () => {
    beforeEach(() => {
      spyOn(contextService, 'getPageContext').and.returnValue(
        ServicesConstants.PAGE_CONTEXT.EXPLORATION_EDITOR
      );
    });

    it('should initialize with editor context', () => {
      expRecsService = TestBed.inject(ExplorationRecommendationsService);
      expect(expRecsService.isInEditorPage).toBeTrue();
    });

    describe('in the Preview tab', () => {
      beforeEach(() => {
        spyOn(contextService, 'getEditorTabContext').and.returnValue(
          ServicesConstants.EXPLORATION_EDITOR_TAB_CONTEXT.PREVIEW
        );
      });

      it('should initialize with editor preview context', () => {
        expRecsService = TestBed.inject(ExplorationRecommendationsService);
        expect(expRecsService.isInEditorPage).toBeTrue();
        expect(expRecsService.isInEditorPreviewMode).toBeTrue();
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
      expRecsService = TestBed.inject(ExplorationRecommendationsService);
      expect(expRecsService.isInEditorPage).toBeFalse();
    });
  });

  describe('getRecommendedSummaryDicts', () => {
    let expRecsBackendApiService: ExplorationRecommendationsBackendApiService;
    const AUTHOR_REC_IDS = ['author_rec_1', 'author_rec_2'];

    class MockExplorationSummary {
      id?: string;
      constructor(id?: string) {
        this.id = id;
      }
    }

    let authorRecommendations: LearnerExplorationSummary[];
    let systemRecommendations: LearnerExplorationSummary[];

    beforeEach(() => {
      systemRecommendations = [
        new MockExplorationSummary('system_rec_1') as LearnerExplorationSummary,
        new MockExplorationSummary('system_rec_2') as LearnerExplorationSummary,
      ];

      authorRecommendations = [
        new MockExplorationSummary('author_rec_1') as LearnerExplorationSummary,
        new MockExplorationSummary('author_rec_2') as LearnerExplorationSummary,
      ];

      expRecsBackendApiService = TestBed.inject(
        ExplorationRecommendationsBackendApiService
      );

      spyOn(
        expRecsBackendApiService,
        'getRecommendedSummaryDictsAsync'
      ).and.callFake(async (_, includeSystemRecommendations: string) => {
        return Promise.resolve(
          includeSystemRecommendations === 'true'
            ? systemRecommendations.concat(authorRecommendations)
            : authorRecommendations
        );
      });
    });

    describe('when used in other page context', () => {
      beforeEach(() => {
        spyOn(contextService, 'getPageContext').and.returnValue(
          ServicesConstants.PAGE_CONTEXT.OTHER
        );
        expRecsService = TestBed.inject(ExplorationRecommendationsService);
      });

      it('should include author recommendations', () => {
        expRecsService.getRecommendedSummaryDicts(
          AUTHOR_REC_IDS,
          true,
          expSummaries => {
            expect(expSummaries).toEqual(
              jasmine.arrayContaining(authorRecommendations)
            );
          }
        );
      });

      it('should include system recommendations', () => {
        expRecsService.getRecommendedSummaryDicts(
          AUTHOR_REC_IDS,
          true,
          expSummaries => {
            expect(expSummaries).toEqual(
              jasmine.arrayContaining(systemRecommendations)
            );
          }
        );
      });
    });

    describe('when used in the editor', () => {
      beforeEach(() => {
        spyOn(contextService, 'getPageContext').and.returnValue(
          ServicesConstants.PAGE_CONTEXT.EXPLORATION_EDITOR
        );
        expRecsService = TestBed.inject(ExplorationRecommendationsService);
      });

      it('should include author recommendations', () => {
        expRecsService.getRecommendedSummaryDicts(
          AUTHOR_REC_IDS,
          true,
          expSummaries => {
            expect(expSummaries).toEqual(
              jasmine.arrayContaining(authorRecommendations)
            );
          }
        );
      });

      it('should not include system recommendations', () => {
        expRecsService.getRecommendedSummaryDicts(
          AUTHOR_REC_IDS,
          true,
          expSummaries => {
            expect(expSummaries).not.toEqual(
              jasmine.arrayContaining(systemRecommendations)
            );
          }
        );
      });
    });
  });
});
