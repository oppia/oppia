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

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';

import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {UrlService} from 'services/contextual/url.service';

import {TopicLessonCardComponent} from './topic-lesson-card/topic-lesson-card.component';
import {TopicPracticeCardComponent} from './topic-practice-card/topic-practice-card.component';
import {TopicStorySectionComponent} from './topic-story-section.component';

describe('TopicStorySectionComponent', () => {
  let component: TopicStorySectionComponent;
  let fixture: ComponentFixture<TopicStorySectionComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        TopicStorySectionComponent,
        TopicLessonCardComponent,
        TopicPracticeCardComponent,
      ],
      providers: [
        {
          provide: UrlInterpolationService,
          useValue: {
            getStaticImageUrl: jasmine.createSpy().and.returnValue('img-url'),
            getStaticCopyrightedImageUrl: jasmine
              .createSpy()
              .and.returnValue('copyrighted-img-url'),
            interpolateUrl: jasmine
              .createSpy()
              .and.callFake((template: string, params: Object) => {
                if (template === '/explore/<exp_id>') {
                  return '/explore/exp_1';
                }
                if (template.includes('/practice/session')) {
                  return (
                    '/learn/math/fractions/practice/session?' +
                    'selected_subtopic_ids=%5B1%5D'
                  );
                }
                if (template.includes('studyguide')) {
                  return '/learn/math/fractions/studyguide';
                }
                return JSON.stringify(params);
              }),
          },
        },
        {
          provide: AssetsBackendApiService,
          useValue: {
            getThumbnailUrlForPreview: jasmine
              .createSpy()
              .and.returnValue('thumb-url'),
          },
        },
        {
          provide: UrlService,
          useValue: {
            getClassroomUrlFragmentFromLearnerUrl: jasmine
              .createSpy()
              .and.returnValue('math'),
            getTopicUrlFragmentFromLearnerUrl: jasmine
              .createSpy()
              .and.returnValue('fractions'),
            addField: jasmine
              .createSpy()
              .and.callFake(
                (url: string, fieldName: string, fieldValue: string) => {
                  const separator = url.includes('?') ? '&' : '?';
                  return `${url}${separator}${fieldName}=${fieldValue}`;
                }
              ),
          },
        },
        {
          provide: I18nLanguageCodeService,
          useValue: {
            isCurrentLanguageRTL: jasmine.createSpy().and.returnValue(false),
          },
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TopicStorySectionComponent);
    component = fixture.componentInstance;

    component.storySummary = {
      getId: () => 'story_1',
      getTitle: () => 'Help Jaime win the Arcade Game',
      getDescription: () =>
        "In this story, we'll follow Jaime and his sister Nic as they learn.",
      getNodeTitles: () => ['Lesson 1', 'Lesson 2'],
      getUrlFragment: () => 'help-jaime-win-the-arcade-game',
      getAllNodes: () => [
        {
          getId: () => 'node_1',
          getTitle: () => 'What are place values?',
          getDescription: () => 'Jaime learns the place value of each digit.',
          getThumbnailFilename: () => 'image.png',
          getExplorationId: () => 'exp_1',
        },
        {
          getId: () => 'node_2',
          getTitle: () => 'Comparing numbers',
          getDescription: () => 'Jaime compares large numbers.',
          getThumbnailFilename: () => 'image2.png',
          getExplorationId: () => 'exp_2',
        },
      ],
    } as never;
    component.classroomUrlFragment = 'math';
    component.topicUrlFragment = 'fractions';
    component.practiceCount = 1;
    component.practiceSubtopicIds = [1];

    fixture.detectChanges();
  });

  it('should render the callout and lesson cards', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(
      el.querySelector('.story-description-bubble')?.textContent
    ).toContain(
      "In this story, we'll follow Jaime and his sister Nic as they learn."
    );
    const lessonTitles = el.querySelectorAll('.topic-lesson-card-title');
    expect(lessonTitles.length).toBe(2);
    expect(lessonTitles[0].textContent).toContain(
      'Lesson 1: What are place values?'
    );
    expect(lessonTitles[1].textContent).toContain(
      'Lesson 2: Comparing numbers'
    );
  });

  it('should build lesson urls and metadata from the story summary', () => {
    expect(component.getStoryMetaText()).toBe('2 lessons, 1 practice');
    expect(component.getStoryMetaAriaLabel()).toBe(
      '2 lessons and 1 practice available'
    );
    expect(component.studyGuideUrl).toBe('/learn/math/fractions/studyguide');
    expect(component.lessonCards.length).toBe(2);
    expect(component.lessonCards[0].startUrl).toContain('/explore/exp_1');
  });

  it('should render practice card when story has no lessons', () => {
    component.storySummary = {
      getId: () => 'story_2',
      getTitle: () => 'Practice Story',
      getDescription: () => 'Practice-only story.',
      getNodeTitles: () => [],
      getUrlFragment: () => 'practice-story',
      getAllNodes: () => [],
    } as never;
    component.practiceCount = 1;

    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelectorAll('.topic-lesson-card-title').length).toBe(0);
    expect(
      el.querySelector('.topic-practice-card-title')?.textContent
    ).toContain('Practice 1: Practice Story');
    expect(component.practiceCard?.practiceUrl).toBe(
      '/learn/math/fractions/practice/session?' +
        'selected_subtopic_ids=%5B1%5D'
    );
  });
});
