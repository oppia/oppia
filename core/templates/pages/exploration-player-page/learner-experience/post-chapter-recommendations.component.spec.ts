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

import { ComponentFixture, waitForAsync, TestBed } from '@angular/core/testing';
import { PostChapterRecommendationsComponent } from './post-chapter-recommendations.component';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { MockTranslatePipe } from 'tests/unit-test-utils';

describe('End chapter check mark component', function() {
  let component: PostChapterRecommendationsComponent;
  let fixture: ComponentFixture<PostChapterRecommendationsComponent>;
  let urlInterpolationService: UrlInterpolationService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [PostChapterRecommendationsComponent, MockTranslatePipe],
      providers: [UrlInterpolationService],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PostChapterRecommendationsComponent);
    component = fixture.componentInstance;
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
  });

  it('should get static image url', () => {
    spyOn(urlInterpolationService, 'getStaticImageUrl')
      .and.returnValue('image_url');

    expect(component.getStaticImageUrl('practice_session_image_path'))
      .toBe('image_url');
    expect(urlInterpolationService.getStaticImageUrl).toHaveBeenCalledWith(
      'practice_session_image_path');
  });
});
