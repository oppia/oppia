// Copyright 2021 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS-IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit tests for the Opportunities List Component.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {EventEmitter} from '@angular/core';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import {TranslationLanguageService} from 'pages/exploration-editor-page/translation-tab/services/translation-language.service';
import {TranslationTopicService} from 'pages/exploration-editor-page/translation-tab/services/translation-topic.service';
import {ExplorationOpportunity} from '../opportunities-list-item/opportunities-list-item.component';
import {ContributionOpportunitiesService} from '../services/contribution-opportunities.service';
import {OpportunitiesListComponent} from './opportunities-list.component';
import {MatIconModule} from '@angular/material/icon';
import {PlatformFeatureService} from 'services/platform-feature.service';

class MockPlatformFeatureService {
  get status() {
    return {
      EnableDropdownPagination: {
        isEnabled: true,
      },
    };
  }
}

describe('Opportunities List Component', () => {
  let component: OpportunitiesListComponent;
  let fixture: ComponentFixture<OpportunitiesListComponent>;

  let translationLanguageService: TranslationLanguageService;
  let translationTopicService: TranslationTopicService;
  let contributionOpportunitiesService: ContributionOpportunitiesService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, MatIconModule],
      declarations: [OpportunitiesListComponent],
      providers: [
        ContributionOpportunitiesService,
        TranslationLanguageService,
        TranslationTopicService,
        {
          provide: PlatformFeatureService,
          useClass: MockPlatformFeatureService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OpportunitiesListComponent);
    component = fixture.componentInstance;
    translationLanguageService = TestBed.inject(TranslationLanguageService);
    translationTopicService = TestBed.inject(TranslationTopicService);
    contributionOpportunitiesService = TestBed.inject(
      ContributionOpportunitiesService
    );
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  describe('when clicking on page number ', () => {
    const mockActiveLanguageEventEmitter = new EventEmitter();
    const mockActiveTopicEventEmitter = new EventEmitter();
    const mockReloadOpportunitiesEventEmitter = new EventEmitter();
    const mockRemoveOpportunitiesEventEmitter = new EventEmitter();
    const explorationOpportunitiesLoad1: ExplorationOpportunity[] = [
      {
        id: 'id1',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50,
        topicName: 'Topic 1',
      },
      {
        id: 'id2',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50,
        topicName: 'Topic 1',
      },
      {
        id: 'id3',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50,
        topicName: 'Topic 1',
      },
      {
        id: 'id4',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50,
        topicName: 'Topic 1',
      },
      {
        id: 'id5',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50,
        topicName: 'Topic 1',
      },
      {
        id: 'id6',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50,
        topicName: 'Topic 1',
      },
      {
        id: 'id7',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50,
        topicName: 'Topic 1',
      },
      {
        id: 'id8',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50,
        topicName: 'Topic 1',
      },
      {
        id: 'id9',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50,
        topicName: 'Topic 1',
      },
      {
        id: 'id10',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50,
        topicName: 'Topic 1',
      },
      {
        id: 'id11',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50,
        topicName: 'Topic 1',
      },
      {
        id: 'id12',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50,
        topicName: 'Topic 1',
      },
      {
        id: 'id13',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50,
        topicName: 'Topic 1',
      },
      {
        id: 'id14',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50,
        topicName: 'Topic 1',
      },
      {
        id: 'id15',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50,
        topicName: 'Topic 1',
      },
      {
        id: 'id16',
        labelText: 'text',
        labelColor: 'blue',
        progressPercentage: 30,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 30,
        topicName: 'Topic 1',
      },
    ];

    const explorationOpportunitiesLoad2: ExplorationOpportunity[] = [
      {
        id: 'id17',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50,
        topicName: 'Topic 1',
      },
      {
        id: 'id18',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50,
        topicName: 'Topic 1',
      },
      {
        id: 'id19',
        labelText: 'text',
        labelColor: 'blue',
        progressPercentage: 30,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 30,
        topicName: 'Topic 1',
      },
      {
        id: 'id20',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50,
        topicName: 'Topic 1',
      },
      {
        id: 'id21',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50,
        topicName: 'Topic 1',
      },
      {
        id: 'id22',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50,
        topicName: 'Topic 1',
      },
      {
        id: 'id23',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50,
        topicName: 'Topic 1',
      },
      {
        id: 'id24',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50,
        topicName: 'Topic 1',
      },
      {
        id: 'id25',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50,
        topicName: 'Topic 1',
      },
      {
        id: 'id26',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50,
        topicName: 'Topic 1',
      },
    ];

    beforeEach(() => {
      component.loadOpportunities = () =>
        Promise.resolve({
          opportunitiesDicts: explorationOpportunitiesLoad1,
          more: true,
        });
      component.loadMoreOpportunities = () =>
        Promise.resolve({
          opportunitiesDicts: explorationOpportunitiesLoad2,
          more: false,
        });

      spyOnProperty(
        translationLanguageService,
        'onActiveLanguageChanged'
      ).and.returnValue(mockActiveLanguageEventEmitter);
      spyOnProperty(
        translationTopicService,
        'onActiveTopicChanged'
      ).and.returnValue(mockActiveTopicEventEmitter);
      spyOnProperty(
        contributionOpportunitiesService,
        'reloadOpportunitiesEventEmitter'
      ).and.returnValue(mockReloadOpportunitiesEventEmitter);
      spyOnProperty(
        contributionOpportunitiesService,
        'removeOpportunitiesEventEmitter'
      ).and.returnValue(mockRemoveOpportunitiesEventEmitter);
    });

    it(
      'should go to the new page when opportunities ' +
        'are greater then page length',
      fakeAsync(() => {
        expect(component.activePageNumber).toBe(1);

        component.init();
        component.onChangeLanguage('en');
        tick();
        mockReloadOpportunitiesEventEmitter.emit();
        tick();
        component.gotoPage(1);
        tick();
        expect(component.activePageNumber).toBe(1);
        expect(component.visibleOpportunities).toEqual([
          {
            id: 'id1',
            labelText: 'text',
            labelColor: 'red',
            progressPercentage: 50,
            inReviewCount: 20,
            totalCount: 100,
            translationsCount: 50,
            topicName: 'Topic 1',
          },
          {
            id: 'id2',
            labelText: 'text',
            labelColor: 'red',
            progressPercentage: 50,
            inReviewCount: 20,
            totalCount: 100,
            translationsCount: 50,
            topicName: 'Topic 1',
          },
          {
            id: 'id3',
            labelText: 'text',
            labelColor: 'red',
            progressPercentage: 50,
            inReviewCount: 20,
            totalCount: 100,
            translationsCount: 50,
            topicName: 'Topic 1',
          },
          {
            id: 'id4',
            labelText: 'text',
            labelColor: 'red',
            progressPercentage: 50,
            inReviewCount: 20,
            totalCount: 100,
            translationsCount: 50,
            topicName: 'Topic 1',
          },
          {
            id: 'id5',
            labelText: 'text',
            labelColor: 'red',
            progressPercentage: 50,
            inReviewCount: 20,
            totalCount: 100,
            translationsCount: 50,
            topicName: 'Topic 1',
          },
          {
            id: 'id6',
            labelText: 'text',
            labelColor: 'red',
            progressPercentage: 50,
            inReviewCount: 20,
            totalCount: 100,
            translationsCount: 50,
            topicName: 'Topic 1',
          },
          {
            id: 'id7',
            labelText: 'text',
            labelColor: 'red',
            progressPercentage: 50,
            inReviewCount: 20,
            totalCount: 100,
            translationsCount: 50,
            topicName: 'Topic 1',
          },
          {
            id: 'id8',
            labelText: 'text',
            labelColor: 'red',
            progressPercentage: 50,
            inReviewCount: 20,
            totalCount: 100,
            translationsCount: 50,
            topicName: 'Topic 1',
          },
          {
            id: 'id9',
            labelText: 'text',
            labelColor: 'red',
            progressPercentage: 50,
            inReviewCount: 20,
            totalCount: 100,
            translationsCount: 50,
            topicName: 'Topic 1',
          },
          {
            id: 'id10',
            labelText: 'text',
            labelColor: 'red',
            progressPercentage: 50,
            inReviewCount: 20,
            totalCount: 100,
            translationsCount: 50,
            topicName: 'Topic 1',
          },
        ]);
        component.gotoPage(2);
        tick();

        expect(component.activePageNumber).toBe(2);
      })
    );

    it(
      'should not go to the new page when opportunities ' +
        'are less then page length',
      fakeAsync(() => {
        // Setting more option to be false.
        component.loadMoreOpportunities = () =>
          Promise.resolve({
            opportunitiesDicts: explorationOpportunitiesLoad1,
            more: false,
          });
        expect(component.activePageNumber).toBe(1);

        component.init();
        tick();
        mockReloadOpportunitiesEventEmitter.emit();
        tick();
        component.gotoPage(1);
        tick();

        expect(component.activePageNumber).toBe(1);
      })
    );

    it('should show the first page when loadOpportunities is not set', fakeAsync(() => {
      component.loadOpportunities = undefined;
      expect(component.activePageNumber).toBe(1);

      component.init();
      tick();
      component.ngOnInit();
      tick();

      expect(component.activePageNumber).toBe(1);
    }));

    it('should load opportunities when initialized', fakeAsync(() => {
      expect(component.opportunities).toEqual([]);

      // Since the constructor will be automatically called in unit tests, it
      // is hard to test or spy on the constructor. So, we have created a
      // function to manually trigger and tests different edge cases.
      component.init();
      component.onChangeLanguage('en');
      tick();

      // Added two opportunities with id's as 'id1' and 'id2'.
      mockActiveLanguageEventEmitter.emit();
      tick();
      mockActiveTopicEventEmitter.emit();
      tick();
      mockReloadOpportunitiesEventEmitter.emit();
      tick();
      expect(component.opportunities).toEqual(explorationOpportunitiesLoad1);
      expect(component.opportunities.length).toEqual(16);

      // Removed opportunity with id as 'id2'.
      mockRemoveOpportunitiesEventEmitter.emit(['id2']);
      tick();

      expect(component.opportunities.length).toEqual(15);

      // RemoveOpportunitiesEvent with no opportunities, e.g. if a user closes a
      // review modal without completing a review.
      mockRemoveOpportunitiesEventEmitter.emit([]);
      tick();

      expect(component.opportunities.length).toEqual(15);
    }));

    it('should navigate to updated last page when current last page is removed', fakeAsync(() => {
      component.init();
      component.onChangeLanguage('en');
      tick();
      component.ngOnInit();
      tick();
      expect(component.opportunities).toEqual(explorationOpportunitiesLoad1);
      expect(component.opportunities.length).toEqual(16);
      expect(component.activePageNumber).toBe(1);
      // Navigate to the last page.
      component.gotoPage(2);
      tick();
      component.gotoPage(3);
      tick();
      expect(component.activePageNumber).toBe(3);
      // Reset the load method to return no more opportunities.
      component.loadMoreOpportunities = () =>
        Promise.resolve({
          opportunitiesDicts: [],
          more: false,
        });

      // Remove all opportunities on the last page.
      mockRemoveOpportunitiesEventEmitter.emit([
        'id20',
        'id21',
        'id22',
        'id23',
        'id24',
        'id25',
        'id26',
      ]);
      tick();

      expect(component.opportunities.length).toEqual(19);
      expect(component.activePageNumber).toBe(2);
    }));

    it('should debounce search query changes and reload opportunities', fakeAsync(() => {
      component.init();
      component.ngOnInit();
      tick();

      spyOn(component, 'fetchAndLoadOpportunities').and.callThrough();

      component.onSearchQueryChange('math');
      expect(component.searchQuery).not.toEqual('math');

      tick(300);

      expect(component.searchQuery).toEqual('math');
      expect(component.activePageNumber).toBe(1);
      expect(component.fetchAndLoadOpportunities).toHaveBeenCalled();
    }));

    it('should initialize totalPages to 1 if loadOpportunitiesCount is undefined', fakeAsync(() => {
      component.loadOpportunitiesCount = undefined;
      component.init();
      component.ngOnInit();
      tick();
      expect(component.totalPages).toBe(1);
    }));

    it('should calculate totalPages on init using loadOpportunitiesCount', fakeAsync(() => {
      component.loadOpportunitiesCount = () => Promise.resolve(20); // E.g. 20 total items.
      // 20 items / 16 items per page = 2 pages.
      component.init();
      component.ngOnInit();
      tick();
      expect(component.totalPages).toBe(2);
    }));

    it('should self-correct totalPages in fetchAndLoadOpportunities when backend is exhausted', fakeAsync(() => {
      component.dropdownPaginationEnabled = true;
      component.loadOpportunitiesCount = () => Promise.resolve(50); // Predict 5 pages.
      component.loadOpportunities = () =>
        Promise.resolve({
          opportunitiesDicts: explorationOpportunitiesLoad1.slice(0, 10), // Only 10 actual items.
          more: false, // End of actual dataset.
        });

      component.init();
      component.ngOnInit();
      tick();

      expect(component.totalPages).toBe(1); // Self-corrected from 5 to 1.
      expect(component.opportunities.length).toBe(10);
    }));

    it('should self-correct totalPages and clamp activePageNumber in gotoPage', fakeAsync(() => {
      component.dropdownPaginationEnabled = true;
      component.loadOpportunitiesCount = () => Promise.resolve(25); // Predict 3 pages.
      component.loadOpportunities = () =>
        Promise.resolve({
          opportunitiesDicts: explorationOpportunitiesLoad1.slice(0, 10), // Only 10 items initially.
          more: true,
        });
      component.loadMoreOpportunities = () =>
        Promise.resolve({
          opportunitiesDicts: explorationOpportunitiesLoad1.slice(0, 5), // Only 5 items on page 2.
          more: false, // End of actual dataset.
        });

      component.init();
      component.ngOnInit();
      tick();

      expect(component.totalPages).toBe(3); // Initial prediction.

      // Navigate to a page that will trigger loadMoreOpportunities and hit the end of the dataset.
      component.gotoPage(3);
      tick();

      // Total opportunities loaded is 10 + 5 = 15.
      // 15 / 10 (page size) = 1.5 -> 2 pages total.
      // Since we tried to go to page 3, it should clamp to page 2.
      expect(component.totalPages).toBe(2); // Self-corrected from 3 to 2.
      expect(component.activePageNumber).toBe(2); // Clamped from 3 to 2.
    }));

    it('should clamp activePageNumber when self-correcting totalPages in fetchAndLoadOpportunities', fakeAsync(() => {
      component.dropdownPaginationEnabled = true;
      component.activePageNumber = 5; // Start at page 5.
      component.loadOpportunitiesCount = () => Promise.resolve(50); // Predict 5 pages.
      component.loadOpportunities = () =>
        Promise.resolve({
          opportunitiesDicts: explorationOpportunitiesLoad1.slice(0, 10), // Only 10 items.
          more: false, // End of dataset.
        });

      component.loadOpportunities = component.loadOpportunities.bind(component);
      component.fetchAndLoadOpportunities();
      tick();

      expect(component.totalPages).toBe(1);
      expect(component.activePageNumber).toBe(1); // Clamped from 5 to 1.
    }));

    it('should clamp activePageNumber in gotoPage when more is false and navigating out of bounds', fakeAsync(() => {
      component.dropdownPaginationEnabled = true;
      component.opportunities = explorationOpportunitiesLoad1.slice(0, 10);
      component.more = false;
      component.totalPages = 1;

      component.gotoPage(3);
      tick();

      expect(component.totalPages).toBe(1);
      expect(component.activePageNumber).toBe(1); // Clamped to 1.
    }));

    it('should not clamp activePageNumber in gotoPage if dropdownPaginationEnabled is false', fakeAsync(() => {
      component.dropdownPaginationEnabled = false;
      component.opportunities = explorationOpportunitiesLoad1.slice(0, 10);
      component.more = true;
      component.loadMoreOpportunities = () =>
        Promise.resolve({
          opportunitiesDicts: explorationOpportunitiesLoad1.slice(0, 10),
          more: false,
        });

      component.gotoPage(2);
      tick();

      expect(component.activePageNumber).toBe(2);
      expect(component.opportunities.length).toBe(20);
    }));

    it('should hit the else branch in unpinOpportunity when indexInVisible is -1', fakeAsync(() => {
      component.opportunities = explorationOpportunitiesLoad1
        .slice(0, 10)
        .map(opp => ({...opp}));
      component.visibleOpportunities = []; // Force indexInVisible to be -1.

      // Set it up as pinned.
      component.opportunities[0].isPinned = true;

      component.unpinOpportunity({
        explorationId: component.opportunities[0].id as string,
        topicName: component.opportunities[0].topicName,
      });
      tick();

      expect(
        component.opportunities[component.opportunities.length - 1].isPinned
      ).toBe(false);
    }));
  });

  describe('when clicking on pin-unpin icon', () => {
    const mockActiveLanguageEventEmitter = new EventEmitter();
    const mockActiveTopicEventEmitter = new EventEmitter();
    const mockReloadOpportunitiesEventEmitter = new EventEmitter();
    const mockRemoveOpportunitiesEventEmitter = new EventEmitter();
    const explorationOpportunitiesLoad1: ExplorationOpportunity[] = [
      {
        id: 'id1',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50,
        topicName: 'Topic 1',
      },
      {
        id: 'id2',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50,
        topicName: 'Topic 1',
      },
      {
        id: 'id3',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50,
        topicName: 'Topic 1',
      },
      {
        id: 'id4',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50,
        topicName: 'Topic 1',
      },
      {
        id: 'id5',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50,
        topicName: 'Topic 1',
      },
      {
        id: 'id6',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50,
        topicName: 'Topic 1',
      },
      {
        id: 'id7',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50,
        topicName: 'Topic 1',
      },
      {
        id: 'id8',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50,
        topicName: 'Topic 1',
      },
      {
        id: 'id9',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50,
        topicName: 'Topic 1',
      },
      {
        id: 'id10',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50,
        topicName: 'Topic 1',
      },
      {
        id: 'id11',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50,
        topicName: 'Topic 1',
      },
      {
        id: 'id12',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50,
        topicName: 'Topic 1',
      },
      {
        id: 'id13',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50,
        topicName: 'Topic 1',
      },
      {
        id: 'id14',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50,
        topicName: 'Topic 1',
      },
      {
        id: 'id15',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50,
        topicName: 'Topic 1',
      },
      {
        id: 'id16',
        labelText: 'text',
        labelColor: 'blue',
        progressPercentage: 30,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 30,
        topicName: 'Topic 1',
      },
    ];

    const explorationOpportunitiesLoad2: ExplorationOpportunity[] = [
      {
        id: 'id17',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50,
        topicName: 'Topic 1',
      },
      {
        id: 'id18',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50,
        topicName: 'Topic 1',
      },
      {
        id: 'id19',
        labelText: 'text',
        labelColor: 'blue',
        progressPercentage: 30,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 30,
        topicName: 'Topic 1',
      },
      {
        id: 'id20',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50,
        topicName: 'Topic 1',
      },
      {
        id: 'id21',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50,
        topicName: 'Topic 1',
      },
      {
        id: 'id22',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50,
        topicName: 'Topic 1',
      },
      {
        id: 'id23',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50,
        topicName: 'Topic 1',
      },
      {
        id: 'id24',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50,
        topicName: 'Topic 1',
      },
      {
        id: 'id25',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50,
        topicName: 'Topic 1',
      },
      {
        id: 'id26',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50,
        topicName: 'Topic 1',
      },
    ];

    let mockPinOpportunitiesEventEmitter = new EventEmitter();
    let mockUnpinOpportunitiesEventEmitter = new EventEmitter();

    beforeEach(() => {
      mockPinOpportunitiesEventEmitter = new EventEmitter();
      mockUnpinOpportunitiesEventEmitter = new EventEmitter();

      spyOnProperty(
        contributionOpportunitiesService,
        'pinnedOpportunitiesChanged'
      ).and.returnValue(mockPinOpportunitiesEventEmitter);
      spyOnProperty(
        contributionOpportunitiesService,
        'unpinnedOpportunitiesChanged'
      ).and.returnValue(mockUnpinOpportunitiesEventEmitter);

      component.loadOpportunities = () =>
        Promise.resolve({
          opportunitiesDicts: explorationOpportunitiesLoad1,
          more: true,
        });
      component.loadMoreOpportunities = () =>
        Promise.resolve({
          opportunitiesDicts: explorationOpportunitiesLoad2,
          more: false,
        });

      spyOnProperty(
        translationLanguageService,
        'onActiveLanguageChanged'
      ).and.returnValue(mockActiveLanguageEventEmitter);
      spyOnProperty(
        translationTopicService,
        'onActiveTopicChanged'
      ).and.returnValue(mockActiveTopicEventEmitter);
      spyOnProperty(
        contributionOpportunitiesService,
        'reloadOpportunitiesEventEmitter'
      ).and.returnValue(mockReloadOpportunitiesEventEmitter);
      spyOnProperty(
        contributionOpportunitiesService,
        'removeOpportunitiesEventEmitter'
      ).and.returnValue(mockRemoveOpportunitiesEventEmitter);
    });

    it('should pin an opportunity', fakeAsync(() => {
      component.init();
      component.onChangeLanguage('en');
      tick();

      mockActiveLanguageEventEmitter.emit();
      tick();
      mockActiveTopicEventEmitter.emit();
      tick();
      mockReloadOpportunitiesEventEmitter.emit();
      tick();
      const updatedData = {explorationId: 'id1', topicName: 'Topic 1'};
      component.pinOpportunity(updatedData);

      expect(component.opportunities[0].isPinned).toBe(true);
      // Ensure the pinned opportunity is at the top of the list.
      expect(component.opportunities[0].id).toBe('id1');
      expect(component.opportunities[0].topicName).toBe('Topic 1');

      component.pinOpportunity({explorationId: 'id2', topicName: 'Topic 1'});

      // Pin an opportunity that is not visible (to hit indexInVisible === -1).
      component.visibleOpportunities = [];
      component.pinOpportunity({explorationId: 'id3', topicName: 'Topic 1'});

      // Pin an opportunity with same id but different topic name (to cover the || branch).
      component.pinOpportunity({explorationId: 'id3', topicName: 'Topic 2'});
    }));

    it('should unpin an opportunity', fakeAsync(() => {
      component.init();
      component.onChangeLanguage('en');
      tick();

      mockActiveLanguageEventEmitter.emit();
      tick();
      mockActiveTopicEventEmitter.emit();
      tick();
      mockReloadOpportunitiesEventEmitter.emit();
      tick();
      const updatedData = {explorationId: 'id1', topicName: 'Topic 1'};
      component.pinOpportunity(updatedData);

      expect(component.opportunities[0].isPinned).toBe(true);
      component.unpinOpportunity(updatedData);
      // Ensure the unpinned opportunity is at the end of the list.
      expect(
        component.opportunities[component.opportunities.length - 1].id
      ).toBe('id1');
      expect(
        component.opportunities[component.opportunities.length - 1].topicName
      ).toBe('Topic 1');
    }));

    it(
      'should subscribe to pinnedOpportunitiesChanged and call' +
        'pinOpportunity',
      () => {
        const updatedData = {
          explorationId: 'id1',
          topicName: 'topic',
        };
        spyOn(component, 'pinOpportunity').and.callThrough();

        component.subscribeToPinnedOpportunities();
        contributionOpportunitiesService.pinnedOpportunitiesChanged.emit(
          updatedData
        );

        expect(component.pinOpportunity).toHaveBeenCalledWith(updatedData);
      }
    );

    it(
      'should subscribe to unpinnedOpportunitiesChanged and call' +
        'unpinOpportunity',
      () => {
        const updatedData = {
          explorationId: 'id1',
          topicName: 'topic',
        };
        spyOn(component, 'unpinOpportunity').and.callThrough();

        component.subscribeToPinnedOpportunities();
        contributionOpportunitiesService.unpinnedOpportunitiesChanged.emit(
          updatedData
        );

        expect(component.unpinOpportunity).toHaveBeenCalledWith(updatedData);
      }
    );
  });
});
