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
 * @fileoverview Unit tests for storyViewerNavbarBreadcrumb.
 */

import { ComponentFixture, TestBed, async } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { StoryViewerNavbarBreadcrumbComponent } from './story-viewer-navbar-breadcrumb.component';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { StoryViewerBackendApiService } from 'domain/story_viewer/story-viewer-backend-api.service';
import { UrlService } from 'services/contextual/url.service';
import { StoryPlaythrough } from 'domain/story_viewer/story-playthrough.model';

class MockUrlService {
  getTopicUrlFragmentFromLearnerUrl() {
    return 'topic_1';
  }

  getClassroomUrlFragmentFromLearnerUrl() {
    return 'classroom_1';
  }

  getStoryUrlFragmentFromLearnerUrl() {
    return 'story';
  }
}

let component: StoryViewerNavbarBreadcrumbComponent;
let fixture: ComponentFixture<StoryViewerNavbarBreadcrumbComponent>;

describe('Subtopic viewer navbar breadcrumb component', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [StoryViewerNavbarBreadcrumbComponent],
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: StoryViewerBackendApiService,
          useValue: {
            fetchStoryDataAsync: async() => (
              new Promise((resolve) => {
                resolve(
                  StoryPlaythrough.createFromBackendDict({
                    story_id: 'id',
                    story_nodes: [],
                    story_title: 'title',
                    story_description: 'description',
                    topic_name: 'topic_1',
                    meta_tag_content: 'this is a meta tag content'
                  }));
              })
            )
          }
        },
        { provide: UrlService, useClass: MockUrlService },
        UrlInterpolationService,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StoryViewerNavbarBreadcrumbComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should set story title when component is initialized', async(() => {
    component.ngOnInit();
    fixture.whenStable().then(() => {
      fixture.detectChanges();
      expect(component.topicName).toBe('topic_1');
      expect(component.storyTitle).toBe('title');
    });
  }));

  it('should get topic url after component is initialized', () => {
    component.ngOnInit();
    expect(component.getTopicUrl()).toBe(
      '/learn/classroom_1/topic_1/story');
  });
});
