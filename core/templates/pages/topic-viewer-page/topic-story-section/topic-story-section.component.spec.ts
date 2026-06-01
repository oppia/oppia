// Copyright 2026 The Oppia Authors. All Rights Reserved.
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

import {ComponentFixture, TestBed} from '@angular/core/testing';

import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {UrlService} from 'services/contextual/url.service';
import {TopicStorySectionComponent} from './topic-story-section.component';

describe('TopicStorySectionComponent', () => {
  let component: TopicStorySectionComponent;
  let fixture: ComponentFixture<TopicStorySectionComponent>;

  class MockUrlInterpolationService {
    getStaticImageUrl(imagePath: string): string {
      return '/assets/images' + imagePath;
    }

    interpolateUrl(
      urlTemplate: string,
      interpolationValues: {
        classroom_url_fragment: string;
        topic_url_fragment: string;
      }
    ): string {
      return urlTemplate
        .replace(
          '<classroom_url_fragment>',
          interpolationValues.classroom_url_fragment
        )
        .replace(
          '<topic_url_fragment>',
          interpolationValues.topic_url_fragment
        );
    }
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TopicStorySectionComponent],
      providers: [
        {
          provide: UrlInterpolationService,
          useClass: MockUrlInterpolationService,
        },
        {
          provide: UrlService,
          useValue: {
            getClassroomUrlFragmentFromLearnerUrl: () => 'math',
            getTopicUrlFragmentFromLearnerUrl: () => 'topic-frag',
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TopicStorySectionComponent);
    component = fixture.componentInstance;
  });

  it('should render title, description bubble, counts, avatar and link', () => {
    component.storyTitle = 'My Story';
    component.storyDescription = 'Story description';
    component.classroomUrlFragment = 'science';
    component.topicUrlFragment = 'forces';
    component.lessonCount = 3;
    component.practiceCount = 2;

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.story-title')?.textContent).toContain(
      'Story: "My Story"'
    );
    expect(
      compiled.querySelector('.story-description-bubble')?.textContent
    ).toContain('Story description');
    expect(compiled.querySelector('.story-meta')?.textContent).toContain(
      '3 lessons, 2 practices'
    );
    expect(
      compiled.querySelector('.story-callout-avatar')?.getAttribute('src')
    ).toBe('/assets/images/avatar/oppia_avatar_large_100px.svg');
    expect(
      compiled.querySelector('.study-skills-cta')?.getAttribute('href')
    ).toBe('/learn/science/forces/studyguide');
  });

  it('should not render description bubble when description is empty', () => {
    component.storyTitle = 'My Story';
    component.storyDescription = '';
    component.lessonCount = 1;
    component.practiceCount = 1;

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.story-description-bubble')).toBeNull();
    expect(compiled.querySelector('.story-meta')?.textContent).toContain(
      '1 lesson, 1 practice'
    );
  });

  it('should use URL fragments from URL service when inputs are empty', () => {
    component.storyTitle = 'My Story';
    component.storyDescription = 'Story description';

    fixture.detectChanges();

    expect(component.classroomUrlFragment).toBe('math');
    expect(component.topicUrlFragment).toBe('topic-frag');
    expect(component.studyGuideUrl).toBe('/learn/math/topic-frag/studyguide');
  });
});
