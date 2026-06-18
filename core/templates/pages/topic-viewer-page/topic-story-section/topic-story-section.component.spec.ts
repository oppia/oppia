// Copyright 2026 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit tests for TopicStorySectionComponent.
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {SimpleChange} from '@angular/core';

import {StoryNode} from 'domain/story/story-node.model';
import {StorySummary} from 'domain/story/story-summary.model';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {UrlService} from 'services/contextual/url.service';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {MockTranslatePipe} from 'tests/unit-test-utils';

import {TopicStorySectionComponent} from './topic-story-section.component';

describe('TopicStorySectionComponent', () => {
  let component: TopicStorySectionComponent;
  let fixture: ComponentFixture<TopicStorySectionComponent>;
  let urlService: jasmine.SpyObj<UrlService>;
  let urlInterpolationService: jasmine.SpyObj<UrlInterpolationService>;
  let assetsBackendApiService: jasmine.SpyObj<AssetsBackendApiService>;
  let i18nLanguageCodeService: jasmine.SpyObj<I18nLanguageCodeService>;

  beforeEach(waitForAsync(() => {
    urlService = jasmine.createSpyObj('UrlService', [
      'getLearnerTopicStudyGuideUrl',
      'getClassroomUrlFragmentFromLearnerUrl',
      'getTopicUrlFragmentFromLearnerUrl',
      'addField',
    ]);
    urlInterpolationService = jasmine.createSpyObj('UrlInterpolationService', [
      'getStaticImageUrl',
      'getStaticCopyrightedImageUrl',
      'interpolateUrl',
    ]);
    assetsBackendApiService = jasmine.createSpyObj('AssetsBackendApiService', [
      'getThumbnailUrlForPreview',
    ]);
    i18nLanguageCodeService = jasmine.createSpyObj('I18nLanguageCodeService', [
      'isCurrentLanguageRTL',
    ]);

    TestBed.configureTestingModule({
      declarations: [TopicStorySectionComponent, MockTranslatePipe],
      providers: [
        {provide: UrlService, useValue: urlService},
        {provide: UrlInterpolationService, useValue: urlInterpolationService},
        {provide: AssetsBackendApiService, useValue: assetsBackendApiService},
        {provide: I18nLanguageCodeService, useValue: i18nLanguageCodeService},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TopicStorySectionComponent);
    component = fixture.componentInstance;

    urlService.getLearnerTopicStudyGuideUrl.and.returnValue(
      '/learn/math/place-values/studyguide'
    );
    urlService.getClassroomUrlFragmentFromLearnerUrl.and.returnValue('math');
    urlService.getTopicUrlFragmentFromLearnerUrl.and.returnValue('topic');
    urlService.addField.and.callFake(
      (url: string, key: string, value: string | number) =>
        `${url}?${key}=${value}`
    );

    urlInterpolationService.getStaticImageUrl.and.callFake((p: string) => {
      return `/assets/images${p}`;
    });
    urlInterpolationService.getStaticCopyrightedImageUrl.and.callFake(
      (p: string) => `/assets/copyrighted-images${p}`
    );
    urlInterpolationService.interpolateUrl.and.callFake((template: string) => {
      return template.replace('<exp_id>', 'exp_1');
    });

    assetsBackendApiService.getThumbnailUrlForPreview.and.returnValue(
      '/thumbnail/story/story_id/thumb.png'
    );

    i18nLanguageCodeService.isCurrentLanguageRTL.and.returnValue(false);

    component.storySummary = createStorySummarySpy([], []);

    fixture.detectChanges();
  });

  const createStorySummarySpy = (
    nodeTitles: string[],
    nodes: jasmine.SpyObj<StoryNode>[]
  ): jasmine.SpyObj<StorySummary> => {
    const storySummarySpy = jasmine.createSpyObj('StorySummary', [
      'getTitle',
      'getDescription',
      'getNodeTitles',
      'getAllNodes',
      'getId',
      'getUrlFragment',
    ]);

    storySummarySpy.getTitle.and.returnValue('Story Title');
    storySummarySpy.getDescription.and.returnValue('Story Description');
    storySummarySpy.getNodeTitles.and.returnValue(nodeTitles);
    storySummarySpy.getAllNodes.and.returnValue(nodes);
    storySummarySpy.getId.and.returnValue('story_id_1');
    storySummarySpy.getUrlFragment.and.returnValue('story-url-fragment');

    return storySummarySpy as jasmine.SpyObj<StorySummary>;
  };

  it('should expose story meta text helpers', () => {
    component.lessonCount = 2;
    component.practiceCount = 1;

    expect(component.getStoryMetaText()).toBe('2 lessons, 1 practice');
    expect(component.getStoryMetaAriaLabel()).toBe(
      '2 lessons and 1 practice available'
    );
  });

  it('should set study guide url on init', () => {
    expect(component.studyGuideUrl).toBe('/learn/math/place-values/studyguide');
  });

  it('should fallback avatar image on error', () => {
    const primary = component.oppiaAvatarImageUrl;
    component.onAvatarImageError();
    expect(component.oppiaAvatarImageUrl).not.toBe(primary);
    expect(component.oppiaAvatarImageUrl).toContain(
      '/assets/copyrighted-images/general/collection_mascot.svg'
    );
  });

  it('should build lesson cards from storySummary and not create practice card', () => {
    const storyNodeSpy = jasmine.createSpyObj('StoryNode', [
      'getTitle',
      'getDescription',
      'getThumbnailFilename',
      'getExplorationId',
      'getId',
    ]);
    storyNodeSpy.getTitle.and.returnValue('Node title 1');
    storyNodeSpy.getDescription.and.returnValue('Node description 1');
    storyNodeSpy.getThumbnailFilename.and.returnValue('thumb.png');
    storyNodeSpy.getExplorationId.and.returnValue('exp_1');
    storyNodeSpy.getId.and.returnValue('node_1');

    component.storySummary = createStorySummarySpy(
      ['Node title 1'],
      [storyNodeSpy]
    );
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';
    component.practiceSubtopicIds = [1];

    component.ngOnInit();

    expect(component.lessonCards.length).toBe(1);
    expect(component.lessonCards[0].thumbnailUrl).toBe(
      '/thumbnail/story/story_id/thumb.png'
    );
    expect(component.isPracticeCardVisible).toBeFalse();
  });

  it('should create practice card only when there are zero lessons', () => {
    component.storySummary = createStorySummarySpy([], []);
    component.lessonCount = 0;
    component.practiceCount = 1;
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';
    component.practiceSubtopicIds = [1];

    component.ngOnInit();

    expect(component.lessonCards.length).toBe(0);
    expect(component.isPracticeCardVisible).toBeTrue();
    expect(component.practiceCard.studyUrl).toBe(
      '/learn/math/place-values/studyguide'
    );
  });

  it('should use fallback practice session url when fragments are missing', () => {
    component.storySummary = createStorySummarySpy([], []);
    component.lessonCount = 0;
    component.practiceCount = 1;
    urlService.getClassroomUrlFragmentFromLearnerUrl.and.returnValue('');
    urlService.getTopicUrlFragmentFromLearnerUrl.and.returnValue('');
    component.classroomUrlFragment = '';
    component.topicUrlFragment = '';
    component.practiceSubtopicIds = [1];

    component.ngOnInit();

    expect(component.lessonCards.length).toBe(0);
    expect(component.isPracticeCardVisible).toBeTrue();
    expect(component.practiceCard.practiceUrl).toBe('#');
  });

  it('should use fallback practice session url when no subtopic id present', () => {
    component.storySummary = createStorySummarySpy([], []);
    component.lessonCount = 0;
    component.practiceCount = 1;
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';
    component.practiceSubtopicIds = [];

    component.ngOnInit();

    expect(component.lessonCards.length).toBe(0);
    expect(component.isPracticeCardVisible).toBeTrue();
    expect(component.practiceCard.practiceUrl).toBe('#');
  });

  it('should build lesson start url with all fields when exploration id present', () => {
    const storyNodeSpy = jasmine.createSpyObj('StoryNode', [
      'getTitle',
      'getDescription',
      'getThumbnailFilename',
      'getExplorationId',
      'getId',
    ]);
    storyNodeSpy.getTitle.and.returnValue('Node title 1');
    storyNodeSpy.getDescription.and.returnValue('Node description 1');
    storyNodeSpy.getThumbnailFilename.and.returnValue(null);
    storyNodeSpy.getExplorationId.and.returnValue('exp_1');
    storyNodeSpy.getId.and.returnValue('node_1');

    const storySummary = createStorySummarySpy(
      ['Node title 1'],
      [storyNodeSpy]
    );
    component.storySummary = storySummary;
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';
    component.practiceSubtopicIds = [1];

    component.ngOnInit();

    expect(component.lessonCards.length).toBe(1);
    const startUrl = component.lessonCards[0].startUrl;
    expect(startUrl).toContain('/explore/exp_1');
    expect(startUrl).toContain('?node_id=node_1');
    expect(startUrl).toContain('?story_url_fragment=story-url-fragment');
  });

  it('should fallback lesson thumbnail when story id is missing', () => {
    const storyNodeSpy = jasmine.createSpyObj('StoryNode', [
      'getTitle',
      'getDescription',
      'getThumbnailFilename',
      'getExplorationId',
      'getId',
    ]);
    storyNodeSpy.getTitle.and.returnValue('Node title 1');
    storyNodeSpy.getDescription.and.returnValue('Node description 1');
    storyNodeSpy.getThumbnailFilename.and.returnValue('thumb.png');
    storyNodeSpy.getExplorationId.and.returnValue(null);
    storyNodeSpy.getId.and.returnValue('node_1');

    const storySummary = createStorySummarySpy(
      ['Node title 1'],
      [storyNodeSpy]
    );
    storySummary.getId.and.returnValue(null);

    component.storySummary = storySummary;
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'topic';

    component.ngOnInit();

    expect(component.lessonCards.length).toBe(1);
    expect(component.lessonCards[0].thumbnailUrl).toContain(
      '/assets/images/splash/student_desk1x.webp'
    );
  });

  it('should not change avatar when already using fallback', () => {
    component.oppiaAvatarImageUrl =
      '/assets/copyrighted-images/general/collection_mascot.svg';
    component.onAvatarImageError();
    expect(component.oppiaAvatarImageUrl).toContain(
      '/assets/copyrighted-images/general/collection_mascot.svg'
    );
  });

  it('should respect RTL language flag', () => {
    i18nLanguageCodeService.isCurrentLanguageRTL.and.returnValue(true);
    expect(component.isLanguageRTL()).toBeTrue();
  });

  it('should correctly singularize lesson and practice counts', () => {
    component.lessonCount = 1;
    component.practiceCount = 1;
    expect(component.getLessonCountText()).toBe('1 lesson');
    expect(component.getPracticeCountText()).toBe('1 practice');
    expect(component.getStoryMetaAriaLabel()).toBe(
      '1 lesson and 1 practice available'
    );
  });

  it('should construct practice session url when fragments and subtopic id present', () => {
    component.storySummary = createStorySummarySpy([], []);
    component.lessonCount = 0;
    component.practiceCount = 1;
    urlService.getClassroomUrlFragmentFromLearnerUrl.and.returnValue('math');
    urlService.getTopicUrlFragmentFromLearnerUrl.and.returnValue(
      'place-values'
    );
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'place-values';
    component.practiceSubtopicIds = [3];

    component.ngOnInit();

    expect(component.isPracticeCardVisible).toBeTrue();
    expect(component.practiceCard.practiceUrl).toContain('practice/session');
  });

  it('should not create practice card when practice count is zero', () => {
    component.storySummary = createStorySummarySpy([], []);
    component.lessonCount = 0;
    component.practiceCount = 0;
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'place-values';
    component.practiceSubtopicIds = [1];

    component.ngOnInit();

    expect(component.lessonCards.length).toBe(0);
    expect(component.isPracticeCardVisible).toBeFalse();
  });

  it('should use empty string when story description is missing', () => {
    const storySummary = createStorySummarySpy([], []);
    storySummary.getDescription.and.returnValue(null);

    component.storySummary = storySummary;
    component.lessonCount = 0;
    component.practiceCount = 0;

    component.ngOnInit();

    expect(component.storyDescription).toBe('');
  });

  it('should sync on relevant ngOnChanges input updates', () => {
    const initialStudyGuideUrl = component.studyGuideUrl;
    urlService.getLearnerTopicStudyGuideUrl.and.returnValue('/learn/new/study');

    component.ngOnChanges({
      storySummary: new SimpleChange(null, null, false),
    });

    expect(component.studyGuideUrl).not.toBe(initialStudyGuideUrl);
    expect(component.studyGuideUrl).toBe('/learn/new/study');
  });

  it('should not sync on unrelated ngOnChanges input updates', () => {
    component.studyGuideUrl = 'unchanged-value';
    urlService.getLearnerTopicStudyGuideUrl.and.returnValue('/learn/new/study');

    component.ngOnChanges({
      practiceSubtopicIds: new SimpleChange([], [1], false),
    });

    expect(component.studyGuideUrl).toBe('unchanged-value');
  });
});
