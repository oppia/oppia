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
import {waitForAsync, TestBed} from '@angular/core/testing';

import {ExplorationRecommendationsBackendApiService} from '../../../domain/recommendations/exploration-recommendations-backend-api.service';
import {LearnerExplorationSummary} from '../../../domain/summary/learner-exploration-summary.model';
import {ExplorationRecommendationsService} from './exploration-recommendations.service';
import {PageContextService} from '../../../services/page-context.service';
import {UrlService} from '../../../services/contextual/url.service';
import {ServicesConstants} from '../../../services/services.constants';
import {ExplorationRatings} from '../../../domain/summary/learner-exploration-summary.model';

describe('Exploration Recommendations Service', () => {
  let expRecsService: ExplorationRecommendationsService;
  let urlService: UrlService;
  let pageContextService: PageContextService;

  const STORY_ID = '1';
  const COLLECTION_ID = '2';
  const NODE_ID = '3';
  const EXPLORATION_ID = '4';
  const DEFAULT_RATINGS: ExplorationRatings = {
    '1': 0,
    '2': 0,
    '3': 0,
    '4': 0,
    '5': 0,
  };

  const createSummary = (id: string): LearnerExplorationSummary =>
    new LearnerExplorationSummary(
      'Algebra',
      false,
      id,
      'en',
      0,
      'Objective',
      'public',
      [],
      '#fff',
      '/icon.svg',
      'Title',
      'exploration',
      0,
      0,
      DEFAULT_RATINGS,
      {}
    );

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ExplorationRecommendationsService],
    });
  }));

  beforeEach(() => {
    urlService = TestBed.inject(UrlService);
    pageContextService = TestBed.inject(PageContextService);

    spyOn(urlService, 'getCollectionIdFromExplorationUrl').and.returnValue(
      COLLECTION_ID
    );

    spyOn(urlService, 'getUrlParams').and.returnValue({
      story_id: STORY_ID,
      node_id: NODE_ID,
    });

    spyOn(pageContextService, 'getExplorationId').and.returnValue(
      EXPLORATION_ID
    );
  });

  describe('when used in the editor page', () => {
    beforeEach(() => {
      spyOn(pageContextService, 'getPageContext').and.returnValue(
        ServicesConstants.PAGE_CONTEXT.EXPLORATION_EDITOR
      );
    });

    it('should initialize with editor context', () => {
      expRecsService = TestBed.inject(ExplorationRecommendationsService);
      expect(expRecsService.isInEditorPage).toBe(true);
    });

    describe('in the Preview tab', () => {
      beforeEach(() => {
        spyOn(pageContextService, 'getEditorTabContext').and.returnValue(
          ServicesConstants.EXPLORATION_EDITOR_TAB_CONTEXT.PREVIEW
        );
      });

      it('should initialize with editor preview context', () => {
        expRecsService = TestBed.inject(ExplorationRecommendationsService);
        expect(expRecsService.isInEditorPage).toBe(true);
        expect(expRecsService.isInEditorPreviewMode).toBe(true);
      });
    });
  });

  describe('when used outside of the editor', () => {
    beforeEach(() => {
      spyOn(pageContextService, 'getPageContext').and.returnValue(
        ServicesConstants.PAGE_CONTEXT.OTHER
      );
    });

    it('should not initialize with editor context', () => {
      expRecsService = TestBed.inject(ExplorationRecommendationsService);
      expect(expRecsService.isInEditorPage).toBe(false);
    });
  });

  describe('getRecommendedSummaryDicts', () => {
    let expRecsBackendApiService: ExplorationRecommendationsBackendApiService;
    const AUTHOR_REC_IDS = ['author_rec_1', 'author_rec_2'];

    let authorRecommendations: LearnerExplorationSummary[];
    let systemRecommendations: LearnerExplorationSummary[];

    beforeEach(() => {
      systemRecommendations = [
        createSummary('system_rec_1'),
        createSummary('system_rec_2'),
      ];

      authorRecommendations = [
        createSummary('author_rec_1'),
        createSummary('author_rec_2'),
      ];

      expRecsBackendApiService = TestBed.inject(
        ExplorationRecommendationsBackendApiService
      );

      spyOn(
        expRecsBackendApiService,
        'getRecommendedSummaryDictsAsync'
      ).and.callFake(
        async (
          _authorRecommendedExpIds: string[],
          includeSystemRecommendations: string
        ) => {
          return Promise.resolve(
            includeSystemRecommendations === 'true'
              ? systemRecommendations.concat(authorRecommendations)
              : authorRecommendations
          );
        }
      );
    });

    describe('when used in other page context', () => {
      beforeEach(() => {
        spyOn(pageContextService, 'getPageContext').and.returnValue(
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
        spyOn(pageContextService, 'getPageContext').and.returnValue(
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

  describe('getExplorationLink', () => {
    beforeEach(() => {
      expRecsService = TestBed.inject(ExplorationRecommendationsService);
    });
    it('should return "#" if no recommendations are present', () => {
      const result = expRecsService.getExplorationLink([]);
      expect(result).toBe('#');
    });

    it('should return "#" if recommendation has no ID', () => {
      const summaryWithoutId = createSummary('');
      summaryWithoutId.id = '';

      const result = expRecsService.getExplorationLink([summaryWithoutId]);
      expect(result).toBe('#');
    });

    it('should return link with only collection_id', () => {
      const result = expRecsService.getExplorationLink([
        createSummary('exp123'),
      ]);
      expect(result).toBe(`/explore/exp123?collection_id=${COLLECTION_ID}`);
    });

    it('should return link with full story params and node_id if present', () => {
      expRecsService.setRecommendedStoryNodeId(NODE_ID);
      (urlService.getUrlParams as jasmine.Spy).and.returnValue({
        story_url_fragment: 'some_story',
        node_id: NODE_ID,
        topic_url_fragment: 'some_topic',
        classroom_url_fragment: 'some_classroom',
      });
      const result = expRecsService.getExplorationLink([
        createSummary('exp123'),
      ]);
      expect(result).toBe(
        `/explore/exp123?collection_id=${COLLECTION_ID}&topic_url_fragment=some_topic&classroom_url_fragment=some_classroom&story_url_fragment=some_story&node_id=${NODE_ID}`
      );
    });
  });
});
