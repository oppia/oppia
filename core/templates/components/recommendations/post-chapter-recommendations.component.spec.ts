// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the post chapter recommendations component.
 */

import {
  ComponentFixture,
  waitForAsync,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import {PostChapterRecommendationsComponent} from './post-chapter-recommendations.component';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {UrlService} from 'services/contextual/url.service';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {PlatformFeatureService} from '../../services/platform-feature.service';
import {UserService} from '../../services/user.service';
import {WindowRef} from 'services/contextual/window-ref.service';

class MockPlatformFeatureService {
  status = {
    NewLessonPlayer: {
      isEnabled: false,
    },
  };
}

class MockWindowRef {
  nativeWindow = {
    location: {
      pathname: '/learn/math',
      href: '',
      reload: jasmine.createSpy('reload'),
      assign: jasmine.createSpy('assign'),
    },
  };
}

describe('End chapter check mark component', function () {
  let component: PostChapterRecommendationsComponent;
  let fixture: ComponentFixture<PostChapterRecommendationsComponent>;
  let mockPlatformFeatureService: MockPlatformFeatureService;
  let urlInterpolationService: UrlInterpolationService;
  let mockWindowRef: MockWindowRef;
  let userService: UserService;
  let urlService: UrlService;

  beforeEach(waitForAsync(() => {
    mockPlatformFeatureService = new MockPlatformFeatureService();
    mockWindowRef = new MockWindowRef();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [PostChapterRecommendationsComponent, MockTranslatePipe],
      providers: [
        UrlInterpolationService,
        UrlService,
        {
          provide: WindowRef,
          useValue: mockWindowRef,
        },
        {
          provide: PlatformFeatureService,
          useValue: mockPlatformFeatureService,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PostChapterRecommendationsComponent);
    component = fixture.componentInstance;
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    urlService = TestBed.inject(UrlService);
    userService = TestBed.inject(UserService);
  });

  it('should get static image url', () => {
    spyOn(urlInterpolationService, 'getStaticImageUrl').and.returnValue(
      'image_url'
    );

    expect(component.getStaticImageUrl('practice_session_image_path')).toBe(
      'image_url'
    );
    expect(urlInterpolationService.getStaticImageUrl).toHaveBeenCalledWith(
      'practice_session_image_path'
    );
  });

  it('should return true from showThreeButtons when practiceQuestionsAreEnabled is true and nextStoryNodeTitle is falsy', () => {
    component.practiceQuestionsAreEnabled = true;
    component.nextStoryNodeTitle = '';
    expect(component.showThreeButtons()).toBeTrue();
  });

  it('should return false from showThreeButtons when nextStoryNodeTitle is truthy', () => {
    component.practiceQuestionsAreEnabled = true;
    component.nextStoryNodeTitle = 'Some Title';
    expect(component.showThreeButtons()).toBeFalse();
  });

  it('should redirect to sign in page when user clicks on signin button', fakeAsync(() => {
    spyOn(userService, 'getLoginUrlAsync').and.returnValue(
      Promise.resolve('login_url')
    );

    component.signIn();
    tick();

    expect(userService.getLoginUrlAsync).toHaveBeenCalled();
    expect(mockWindowRef.nativeWindow.location).toBe('login_url');
  }));

  it(
    'should reload the page if user clicks on signin button and ' +
      'login url is not available',
    fakeAsync(() => {
      spyOn(userService, 'getLoginUrlAsync').and.returnValue(
        Promise.resolve('')
      );

      component.signIn();
      tick();

      expect(userService.getLoginUrlAsync).toHaveBeenCalled();
      expect(mockWindowRef.nativeWindow.location.reload).toHaveBeenCalled();
    })
  );

  it('should get practice tab url', () => {
    spyOn(urlInterpolationService, 'interpolateUrl').and.returnValue(
      'topic_page'
    );
    spyOn(urlService, 'getUrlParams').and.returnValue({
      topic_url_fragment: 'topic_url_fragment',
      classroom_url_fragment: 'classroom_url_fragment',
    });

    expect(component.getPracticeTabUrl()).toBe('topic_page/practice');
    expect(urlInterpolationService.interpolateUrl).toHaveBeenCalledWith(
      '/learn/<classroom_url_fragment>/<topic_url_fragment>',
      {
        topic_url_fragment: 'topic_url_fragment',
        classroom_url_fragment: 'classroom_url_fragment',
      }
    );
  });

  it('should check new lesson player feature flag is enabled', () => {
    mockPlatformFeatureService.status.NewLessonPlayer.isEnabled = true;
    expect(component.isNewLessonPlayerEnabled()).toBe(true);
  });

  it('should get study tab url', () => {
    spyOn(urlInterpolationService, 'interpolateUrl').and.returnValue(
      'topic_page'
    );
    spyOn(urlService, 'getUrlParams').and.returnValue({
      topic_url_fragment: 'topic_url_fragment',
      classroom_url_fragment: 'classroom_url_fragment',
    });

    expect(component.getStudyTabUrl()).toBe('topic_page/studyguide');
    expect(urlInterpolationService.interpolateUrl).toHaveBeenCalledWith(
      '/learn/<classroom_url_fragment>/<topic_url_fragment>',
      {
        topic_url_fragment: 'topic_url_fragment',
        classroom_url_fragment: 'classroom_url_fragment',
      }
    );
  });
});
