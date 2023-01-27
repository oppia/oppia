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

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EventEmitter } from '@angular/core';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { TranslationLanguageService } from 'pages/exploration-editor-page/translation-tab/services/translation-language.service';
import { TranslationTopicService } from 'pages/exploration-editor-page/translation-tab/services/translation-topic.service';
import { ExplorationOpportunity } from '../opportunities-list-item/opportunities-list-item.component';
import { ContributionOpportunitiesService } from '../services/contribution-opportunities.service';
import { OpportunitiesListComponent } from './opportunities-list.component';

describe('Opportunities List Component', () => {
  let component: OpportunitiesListComponent;
  let fixture: ComponentFixture<OpportunitiesListComponent>;

  let translationLanguageService: TranslationLanguageService;
  let translationTopicService: TranslationTopicService;
  let contributionOpportunitiesService: ContributionOpportunitiesService;
  const mockActiveLanguageEventEmitter = new EventEmitter();
  const mockActiveTopicEventEmitter = new EventEmitter();
  const mockReloadOpportunitiesEventEmitter = new EventEmitter();
  const mockRemoveOpportunitiesEventEmitter = new EventEmitter();

  const explorationOpportunitiesLoad1: ExplorationOpportunity[] = [{
    id: 'id1',
    labelText: 'text',
    labelColor: 'red',
    progressPercentage: 50,
    inReviewCount: 20,
    totalCount: 100,
    translationsCount: 50
  },
  {
    id: 'id2',
    labelText: 'text',
    labelColor: 'red',
    progressPercentage: 50,
    inReviewCount: 20,
    totalCount: 100,
    translationsCount: 50
  },
  {
    id: 'id3',
    labelText: 'text',
    labelColor: 'red',
    progressPercentage: 50,
    inReviewCount: 20,
    totalCount: 100,
    translationsCount: 50
  },
  {
    id: 'id4',
    labelText: 'text',
    labelColor: 'red',
    progressPercentage: 50,
    inReviewCount: 20,
    totalCount: 100,
    translationsCount: 50
  },
  {
    id: 'id5',
    labelText: 'text',
    labelColor: 'red',
    progressPercentage: 50,
    inReviewCount: 20,
    totalCount: 100,
    translationsCount: 50
  },
  {
    id: 'id6',
    labelText: 'text',
    labelColor: 'red',
    progressPercentage: 50,
    inReviewCount: 20,
    totalCount: 100,
    translationsCount: 50
  },
  {
    id: 'id7',
    labelText: 'text',
    labelColor: 'red',
    progressPercentage: 50,
    inReviewCount: 20,
    totalCount: 100,
    translationsCount: 50
  },
  {
    id: 'id8',
    labelText: 'text',
    labelColor: 'red',
    progressPercentage: 50,
    inReviewCount: 20,
    totalCount: 100,
    translationsCount: 50
  },
  {
    id: 'id9',
    labelText: 'text',
    labelColor: 'red',
    progressPercentage: 50,
    inReviewCount: 20,
    totalCount: 100,
    translationsCount: 50
  },
  {
    id: 'id10',
    labelText: 'text',
    labelColor: 'red',
    progressPercentage: 50,
    inReviewCount: 20,
    totalCount: 100,
    translationsCount: 50
  },
  {
    id: 'id11',
    labelText: 'text',
    labelColor: 'red',
    progressPercentage: 50,
    inReviewCount: 20,
    totalCount: 100,
    translationsCount: 50
  },
  {
    id: 'id12',
    labelText: 'text',
    labelColor: 'red',
    progressPercentage: 50,
    inReviewCount: 20,
    totalCount: 100,
    translationsCount: 50
  },
  {
    id: 'id13',
    labelText: 'text',
    labelColor: 'red',
    progressPercentage: 50,
    inReviewCount: 20,
    totalCount: 100,
    translationsCount: 50
  },
  {
    id: 'id14',
    labelText: 'text',
    labelColor: 'red',
    progressPercentage: 50,
    inReviewCount: 20,
    totalCount: 100,
    translationsCount: 50
  },
  {
    id: 'id15',
    labelText: 'text',
    labelColor: 'red',
    progressPercentage: 50,
    inReviewCount: 20,
    totalCount: 100,
    translationsCount: 50
  },
  {
    id: 'id16',
    labelText: 'text',
    labelColor: 'blue',
    progressPercentage: 30,
    inReviewCount: 20,
    totalCount: 100,
    translationsCount: 30
  }];

  const explorationOpportunitiesLoad2: ExplorationOpportunity[] = [{
    id: 'id17',
    labelText: 'text',
    labelColor: 'red',
    progressPercentage: 50,
    inReviewCount: 20,
    totalCount: 100,
    translationsCount: 50
  },
  {
    id: 'id18',
    labelText: 'text',
    labelColor: 'red',
    progressPercentage: 50,
    inReviewCount: 20,
    totalCount: 100,
    translationsCount: 50
  },
  {
    id: 'id19',
    labelText: 'text',
    labelColor: 'blue',
    progressPercentage: 30,
    inReviewCount: 20,
    totalCount: 100,
    translationsCount: 30
  },
  {
    id: 'id20',
    labelText: 'text',
    labelColor: 'red',
    progressPercentage: 50,
    inReviewCount: 20,
    totalCount: 100,
    translationsCount: 50
  },
  {
    id: 'id21',
    labelText: 'text',
    labelColor: 'red',
    progressPercentage: 50,
    inReviewCount: 20,
    totalCount: 100,
    translationsCount: 50
  },
  {
    id: 'id22',
    labelText: 'text',
    labelColor: 'red',
    progressPercentage: 50,
    inReviewCount: 20,
    totalCount: 100,
    translationsCount: 50
  },
  {
    id: 'id23',
    labelText: 'text',
    labelColor: 'red',
    progressPercentage: 50,
    inReviewCount: 20,
    totalCount: 100,
    translationsCount: 50
  },
  {
    id: 'id24',
    labelText: 'text',
    labelColor: 'red',
    progressPercentage: 50,
    inReviewCount: 20,
    totalCount: 100,
    translationsCount: 50
  },
  {
    id: 'id25',
    labelText: 'text',
    labelColor: 'red',
    progressPercentage: 50,
    inReviewCount: 20,
    totalCount: 100,
    translationsCount: 50
  },
  {
    id: 'id26',
    labelText: 'text',
    labelColor: 'red',
    progressPercentage: 50,
    inReviewCount: 20,
    totalCount: 100,
    translationsCount: 50
  }];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [OpportunitiesListComponent],
      providers: [
        ContributionOpportunitiesService,
        TranslationLanguageService,
        TranslationTopicService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OpportunitiesListComponent);
    component = fixture.componentInstance;
    translationLanguageService = TestBed.inject(TranslationLanguageService);
    translationTopicService = TestBed.inject(TranslationTopicService);
    contributionOpportunitiesService = TestBed.inject(
      ContributionOpportunitiesService);

    component.loadOpportunities = () => Promise.resolve({
      opportunitiesDicts: explorationOpportunitiesLoad1,
      more: true
    });
    component.loadMoreOpportunities = () => Promise.resolve({
      opportunitiesDicts: explorationOpportunitiesLoad2,
      more: false
    });

    spyOnProperty(translationLanguageService, 'onActiveLanguageChanged')
      .and.returnValue(mockActiveLanguageEventEmitter);
    spyOnProperty(translationTopicService, 'onActiveTopicChanged')
      .and.returnValue(mockActiveTopicEventEmitter);
    spyOnProperty(
      contributionOpportunitiesService, 'reloadOpportunitiesEventEmitter')
      .and.returnValue(mockReloadOpportunitiesEventEmitter);
    spyOnProperty(
      contributionOpportunitiesService, 'removeOpportunitiesEventEmitter')
      .and.returnValue(mockRemoveOpportunitiesEventEmitter);
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

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

    expect(component.opportunities).toEqual([{
      id: 'id1',
      labelText: 'text',
      labelColor: 'red',
      progressPercentage: 50,
      inReviewCount: 20,
      totalCount: 100,
      translationsCount: 50
    },
    {
      id: 'id3',
      labelText: 'text',
      labelColor: 'red',
      progressPercentage: 50,
      inReviewCount: 20,
      totalCount: 100,
      translationsCount: 50
    },
    {
      id: 'id4',
      labelText: 'text',
      labelColor: 'red',
      progressPercentage: 50,
      inReviewCount: 20,
      totalCount: 100,
      translationsCount: 50
    },
    {
      id: 'id5',
      labelText: 'text',
      labelColor: 'red',
      progressPercentage: 50,
      inReviewCount: 20,
      totalCount: 100,
      translationsCount: 50
    },
    {
      id: 'id6',
      labelText: 'text',
      labelColor: 'red',
      progressPercentage: 50,
      inReviewCount: 20,
      totalCount: 100,
      translationsCount: 50
    },
    {
      id: 'id7',
      labelText: 'text',
      labelColor: 'red',
      progressPercentage: 50,
      inReviewCount: 20,
      totalCount: 100,
      translationsCount: 50
    },
    {
      id: 'id8',
      labelText: 'text',
      labelColor: 'red',
      progressPercentage: 50,
      inReviewCount: 20,
      totalCount: 100,
      translationsCount: 50
    },
    {
      id: 'id9',
      labelText: 'text',
      labelColor: 'red',
      progressPercentage: 50,
      inReviewCount: 20,
      totalCount: 100,
      translationsCount: 50
    },
    {
      id: 'id10',
      labelText: 'text',
      labelColor: 'red',
      progressPercentage: 50,
      inReviewCount: 20,
      totalCount: 100,
      translationsCount: 50
    },
    {
      id: 'id11',
      labelText: 'text',
      labelColor: 'red',
      progressPercentage: 50,
      inReviewCount: 20,
      totalCount: 100,
      translationsCount: 50
    },
    {
      id: 'id12',
      labelText: 'text',
      labelColor: 'red',
      progressPercentage: 50,
      inReviewCount: 20,
      totalCount: 100,
      translationsCount: 50
    },
    {
      id: 'id13',
      labelText: 'text',
      labelColor: 'red',
      progressPercentage: 50,
      inReviewCount: 20,
      totalCount: 100,
      translationsCount: 50
    },
    {
      id: 'id14',
      labelText: 'text',
      labelColor: 'red',
      progressPercentage: 50,
      inReviewCount: 20,
      totalCount: 100,
      translationsCount: 50
    },
    {
      id: 'id15',
      labelText: 'text',
      labelColor: 'red',
      progressPercentage: 50,
      inReviewCount: 20,
      totalCount: 100,
      translationsCount: 50
    },
    {
      id: 'id16',
      labelText: 'text',
      labelColor: 'blue',
      progressPercentage: 30,
      inReviewCount: 20,
      totalCount: 100,
      translationsCount: 30
    }]);

    expect(component.opportunities.length).toEqual(15);

    // RemoveOpportunitiesEvent with no opportunities, e.g. if a user closes a
    // review modal without completing a review.
    mockRemoveOpportunitiesEventEmitter.emit([]);
    tick();

    expect(component.opportunities.length).toEqual(15);
  }));

  it('should navigate to updated last page when current last page is removed',
    fakeAsync(() => {
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
      component.loadMoreOpportunities = () => Promise.resolve({
        opportunitiesDicts: [],
        more: false
      });

      // Remove all opportunities on the last page.
      mockRemoveOpportunitiesEventEmitter.emit(
        ['id20', 'id21', 'id22', 'id23', 'id24', 'id25', 'id26']);
      tick();

      // Should navigate to new last page. Since there are no more opportunities
      // to load, the new last page is page 2.
      expect(component.opportunities.length).toEqual(19);
      expect(component.activePageNumber).toBe(2);
    }));

  describe('when clicking on page number ', () => {
    it('should go to the new page when opportunities ' +
      'are greater then page length', fakeAsync(() => {
      expect(component.activePageNumber).toBe(1);

      component.init();
      component.onChangeLanguage('en');
      tick();
      mockReloadOpportunitiesEventEmitter.emit();
      tick();
      component.gotoPage(1);
      tick();
      expect(component.activePageNumber).toBe(1);
      expect(component.visibleOpportunities).toEqual([{
        id: 'id1',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50
      },
      {
        id: 'id2',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50
      },
      {
        id: 'id3',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50
      },
      {
        id: 'id4',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50
      },
      {
        id: 'id5',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50
      },
      {
        id: 'id6',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50
      },
      {
        id: 'id7',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50
      },
      {
        id: 'id8',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50
      },
      {
        id: 'id9',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50
      },
      {
        id: 'id10',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50
      }]);
      component.gotoPage(2);
      tick();

      expect(component.activePageNumber).toBe(2);
      expect(component.visibleOpportunities).toEqual([{
        id: 'id11',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50
      },
      {
        id: 'id12',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50
      },
      {
        id: 'id13',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50
      },
      {
        id: 'id14',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50
      },
      {
        id: 'id15',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50
      },
      {
        id: 'id16',
        labelText: 'text',
        labelColor: 'blue',
        progressPercentage: 30,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 30
      },
      {
        id: 'id17',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50
      },
      {
        id: 'id18',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50
      },
      {
        id: 'id19',
        labelText: 'text',
        labelColor: 'blue',
        progressPercentage: 30,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 30
      },
      {
        id: 'id20',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50,
        inReviewCount: 20,
        totalCount: 100,
        translationsCount: 50
      }]);
    }));

    it('should not go to the new page when opportunities ' +
      'are less then page length', fakeAsync(() => {
      // Setting more option to be false.
      component.loadMoreOpportunities = () => Promise.resolve({
        opportunitiesDicts: explorationOpportunitiesLoad1,
        more: false
      });
      expect(component.activePageNumber).toBe(1);

      component.init();
      tick();
      mockReloadOpportunitiesEventEmitter.emit();
      tick();
      component.gotoPage(1);
      tick();

      expect(component.activePageNumber).toBe(1);
    }));

    it('should show the first page when loadOpportunities is not set',
      fakeAsync(() => {
        component.loadOpportunities = undefined;
        expect(component.activePageNumber).toBe(1);

        component.init();
        tick();
        component.ngOnInit();
        tick();

        expect(component.activePageNumber).toBe(1);
      }));
  });
});
