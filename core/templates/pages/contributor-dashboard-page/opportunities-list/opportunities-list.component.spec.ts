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
import { ExplorationOpportunity } from '../opportunities-list-item/opportunities-list-item.component';
import { ContributionOpportunitiesService } from '../services/contribution-opportunities.service';
import { OpportunitiesListComponent } from './opportunities-list.component';

describe('Opportunities List Component', () => {
  let component: OpportunitiesListComponent;
  let fixture: ComponentFixture<OpportunitiesListComponent>;

  let translationLanguageService: TranslationLanguageService;
  let contributionOpportunitiesService: ContributionOpportunitiesService;
  const mockActiveLanguageEventEmitter = new EventEmitter();
  const mockReloadOpportunitiesEventEmitter = new EventEmitter();
  const mockRemoveOpportunitiesEventEmitter = new EventEmitter();

  const ExplorationOpportunityDict: ExplorationOpportunity[] = [{
    id: 'id1',
    labelText: 'text',
    labelColor: 'red',
    progressPercentage: 50
  },
  {
    id: 'id2',
    labelText: 'text',
    labelColor: 'blue',
    progressPercentage: 30
  }];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [OpportunitiesListComponent],
      providers: [
        ContributionOpportunitiesService,
        TranslationLanguageService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OpportunitiesListComponent);
    component = fixture.componentInstance;
    translationLanguageService = TestBed.inject(TranslationLanguageService);
    contributionOpportunitiesService = TestBed.inject(
      ContributionOpportunitiesService);

    component.loadOpportunities = () => Promise.resolve({
      opportunitiesDicts: ExplorationOpportunityDict,
      more: false
    });
    component.loadMoreOpportunities = () => Promise.resolve({
      opportunitiesDicts: ExplorationOpportunityDict,
      more: true
    });

    spyOnProperty(translationLanguageService, 'onActiveLanguageChanged')
      .and.returnValue(mockActiveLanguageEventEmitter);
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
    tick();

    // Added two opportunities with id's as 'id1' and 'id2'.
    mockActiveLanguageEventEmitter.emit();
    tick();
    mockReloadOpportunitiesEventEmitter.emit();
    tick();
    expect(component.opportunities).toEqual(ExplorationOpportunityDict);
    expect(component.opportunities.length).toEqual(2);

    // Removed opportunity with id as 'id2'.
    mockRemoveOpportunitiesEventEmitter.emit(['id2']);
    tick();

    expect(component.opportunities.length).toEqual(1);
    expect(component.opportunities).toEqual([
      {
        id: 'id1',
        labelText: 'text',
        labelColor: 'red',
        progressPercentage: 50
      }
    ]);
  }));

  describe('when clicking on page number ', () => {
    it('should go to the new page when opportunities ' +
      'are greater then page length', fakeAsync(() => {
      expect(component.activePageNumber).toBe(1);

      component.init();
      tick();
      mockReloadOpportunitiesEventEmitter.emit();
      tick();
      component.gotoPage(2);
      tick();

      expect(component.activePageNumber).toBe(2);
    }));

    it('should not go to the new page when opportunities ' +
      'are less then page length', fakeAsync(() => {
      // Setting more option to be false.
      component.loadMoreOpportunities = () => Promise.resolve({
        opportunitiesDicts: ExplorationOpportunityDict,
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
  });
});
