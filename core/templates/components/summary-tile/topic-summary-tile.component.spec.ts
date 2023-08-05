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
 * @fileoverview Unit tests for TopicSummaryTileComponent.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CreatorTopicSummary } from 'domain/topic/creator-topic-summary.model';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { AssetsBackendApiService } from 'services/assets-backend-api.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { TopicSummaryTileComponent } from './topic-summary-tile.component';

describe('TopicSummaryTileCompoennt', () => {
  let component: TopicSummaryTileComponent;
  let fixture: ComponentFixture<TopicSummaryTileComponent>;

  let abas: AssetsBackendApiService;
  let urlInterpolationService: UrlInterpolationService;
  let i18nLanguageCodeService: I18nLanguageCodeService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        TopicSummaryTileComponent,
        MockTranslatePipe
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TopicSummaryTileComponent);
    component = fixture.componentInstance;
    abas = TestBed.inject(AssetsBackendApiService);
    urlInterpolationService = TestBed.get(UrlInterpolationService);
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);

    component.topicSummary = CreatorTopicSummary.createFromBackendDict({
      topic_model_created_on: 1581839432987.596,
      uncategorized_skill_count: 0,
      canonical_story_count: 0,
      id: 'wbL5aAyTWfOH1',
      is_published: true,
      total_skill_count: 10,
      total_published_node_count: 3,
      can_edit_topic: true,
      topic_model_last_updated: 1581839492500.852,
      additional_story_count: 0,
      name: 'Alpha',
      classroom: 'Math',
      version: 1,
      description: 'Alpha description',
      subtopic_count: 0,
      language_code: 'en',
      url_fragment: 'alpha',
      thumbnail_filename: 'image.svg',
      thumbnail_bg_color: '#C6DCDA',
      total_upcoming_chapters_count: 1,
      total_overdue_chapters_count: 1,
      total_chapter_counts_for_each_story: [5, 4],
      published_chapter_counts_for_each_story: [3, 4]
    });
  });

  it('should set component properties on initialization', () => {
    spyOn(abas, 'getThumbnailUrlForPreview').and.returnValue('/thumbnail/url');

    component.ngOnInit();

    expect(component.thumbnailUrl).toBe('/thumbnail/url');
  });

  it('should get topic page url', () => {
    spyOn(urlInterpolationService, 'interpolateUrl').and.returnValue(
      '/topic/page/url');

    expect(component.getTopicPageUrl()).toBe('/topic/page/url');
  });

  it('should get color value in hex form', () => {
    expect(component.getColorValueInHexForm(213563)).toBe('3423b');
    expect(component.getColorValueInHexForm(0)).toBe('00');
  });

  it('should get darker thumbnail background color', () => {
    expect(component.getDarkerThumbnailBgColor()).toBe('#627876');
  });

  it('should get topic name translation key correctly', () => {
    spyOn(i18nLanguageCodeService, 'getTopicTranslationKey')
      .and.returnValue('I18N_TOPIC_abc1234_TITLE');

    component.ngOnInit();

    expect(component.topicNameTranslationKey).toBe(
      'I18N_TOPIC_abc1234_TITLE');
  });

  it('should check if hacky topic name translation is displayed correctly',
    () => {
      spyOn(i18nLanguageCodeService, 'isHackyTranslationAvailable')
        .and.returnValue(true);
      spyOn(i18nLanguageCodeService, 'isCurrentLanguageEnglish')
        .and.returnValue(false);

      component.ngOnInit();

      expect(component.isHackyTopicNameTranslationDisplayed()).toBe(true);
    }
  );
});
