// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for voiceoverOpportunities.
 */

import { fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { ExplorationOpportunitySummary } from 'domain/opportunity/exploration-opportunity-summary.model';
import { ContributionOpportunitiesService } from '../services/contribution-opportunities.service';
import { TranslationLanguageService } from 'pages/exploration-editor-page/translation-tab/services/translation-language.service';
import { VoiceoverOpportunitiesComponent } from './voiceover-opportunities.component';

describe('Voiceover opportunities component', () => {
  let contributionOpportunitiesService: ContributionOpportunitiesService;
  let translationLanguageService: TranslationLanguageService;

  let activeLanguageChangedEmitter = new EventEmitter();
  let component: VoiceoverOpportunitiesComponent;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      declarations: [
        VoiceoverOpportunitiesComponent
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
    contributionOpportunitiesService = TestBed.inject(
      ContributionOpportunitiesService);
    translationLanguageService = TestBed.inject(TranslationLanguageService);
    spyOnProperty(translationLanguageService, 'onActiveLanguageChanged').and
      .returnValue(activeLanguageChangedEmitter);
    spyOn(
      contributionOpportunitiesService, 'getVoiceoverOpportunitiesAsync').and
      .callFake((languageCode: string) => {
        return new Promise((resolve) => {
          resolve({
            opportunities: [
              ExplorationOpportunitySummary.createFromBackendDict({
                id: '1',
                topic_name: 'topic_1',
                story_title: 'Story title 1',
                chapter_title: 'Chapter title 1',
                content_count: 2,
                translation_counts: {
                  en: 1
                },
                translation_in_review_counts: {
                  hi: 20
                }
              }),
              ExplorationOpportunitySummary.createFromBackendDict({
                id: '2',
                topic_name: 'topic_2',
                story_title: 'Story title 2',
                chapter_title: 'Chapter title 2',
                content_count: 4,
                translation_counts: {
                  en: 2
                },
                translation_in_review_counts: {
                  hi: 20
                }
              })
            ],
            more: true
          });
        });
      });
    spyOn(
      contributionOpportunitiesService, 'getMoreVoiceoverOpportunitiesAsync')
      .and.callFake((languageCode) => {
        return new Promise((resolve) => {
          resolve({
            opportunities: [
              ExplorationOpportunitySummary.createFromBackendDict({
                id: '3',
                topic_name: 'topic_3',
                story_title: 'Story title 3',
                chapter_title: 'Chapter title 3',
                content_count: 3,
                translation_counts: {
                  en: 3
                },
                translation_in_review_counts: {
                  hi: 20
                }
              })
            ],
            more: true
          });
        });
      });

    let fixture = TestBed.createComponent(VoiceoverOpportunitiesComponent);
    component = fixture.componentInstance;
    component.ngOnInit();
  }));

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should initialize controller properties after its initialization', () => {
    expect(component.opportunities.length).toBe(2);
    expect(component.opportunitiesAreLoading).toBe(false);
    expect(component.moreOpportunitiesAvailable).toBe(true);
    expect(component.progressBarRequired).toBe(false);
  });

  it('should load more opportunities when opportunities are available',
    fakeAsync(() => {
      expect(component.opportunitiesAreLoading).toBe(false);
      expect(component.opportunities.length).toBe(2);

      component.onLoadMoreOpportunities();
      tick();
      expect(component.opportunitiesAreLoading).toBe(false);
      expect(component.opportunities.length).toBe(3);
    }));

  it('should get opportunities from new language when active language is' +
    ' changed', fakeAsync(() => {
    component.onLoadMoreOpportunities();
    tick();
    expect(component.opportunitiesAreLoading).toBe(false);
    expect(component.opportunities.length).toBe(3);

    activeLanguageChangedEmitter.emit();
    tick();

    expect(component.opportunitiesAreLoading).toBe(false);
    expect(component.opportunities.length).toBe(2);
  }));
});
