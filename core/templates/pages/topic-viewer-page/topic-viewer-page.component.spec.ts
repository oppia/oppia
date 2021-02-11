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
 * @fileoverview Unit tests for topic viewer page component.
 */

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA, Pipe } from '@angular/core';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { TopicViewerPageComponent } from
  'pages/topic-viewer-page/topic-viewer-page.component';
import { AlertsService } from 'services/alerts.service';
import { UrlService } from 'services/contextual/url.service';
import { WindowDimensionsService } from
  'services/contextual/window-dimensions.service';
import { PageTitleService } from 'services/page-title.service';

@Pipe({name: 'translate'})
class MockTranslatePipe {
  transform(value: string, params: Object | undefined):string {
    return value;
  }
}

describe('Topic viewer page', () => {
  let httpTestingController = null;
  let alertsService = null;
  let pageTitleService = null;
  let urlService = null;
  let windowDimensionsService = null;
  let topicViewerPageComponent = null;

  let topicName = 'Topic Name';
  let topicUrlFragment = 'topic-frag';
  let topicDict = {
    topic_id: '1',
    topic_name: 'Topic Name',
    topic_description: 'Topic Description',
    canonical_story_dicts: [{
      id: '2',
      title: 'Story Title',
      node_titles: ['Node title 1', 'Node title 2'],
      thumbnail_filename: '',
      thumbnail_bg_color: '',
      description: 'Story Description',
      story_is_published: true,
      all_node_dicts: []
    }],
    additional_story_dicts: [],
    uncategorized_skill_ids: [],
    subtopics: [],
    degrees_of_mastery: {},
    skill_descriptions: {},
    practice_tab_is_displayed: true,
    meta_tag_content: 'Topic Meta Tag',
    page_title_fragment_for_web: 'Topic page title'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TopicViewerPageComponent, MockTranslatePipe],
      imports: [HttpClientTestingModule],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
    httpTestingController = TestBed.get(HttpTestingController);
    alertsService = TestBed.get(AlertsService);
    pageTitleService = TestBed.get(PageTitleService);
    urlService = TestBed.get(UrlService);
    windowDimensionsService = TestBed.get(WindowDimensionsService);
    let fixture = TestBed.createComponent(TopicViewerPageComponent);
    topicViewerPageComponent = fixture.componentInstance;
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should successfully get topic data', fakeAsync(() => {
    spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue(
      topicUrlFragment);
    spyOn(urlService, 'getClassroomUrlFragmentFromLearnerUrl').and.returnValue(
      'math');

    spyOn(pageTitleService, 'setPageTitle').and.callThrough();
    spyOn(pageTitleService, 'updateMetaTag').and.callThrough();

    topicViewerPageComponent.ngOnInit();
    expect(topicViewerPageComponent.canonicalStorySummaries).toEqual([]);
    expect(topicViewerPageComponent.activeTab).toBe('story');

    var req = httpTestingController.expectOne(
      `/topic_data_handler/math/${topicUrlFragment}`);
    req.flush(topicDict);
    flushMicrotasks();

    expect(topicViewerPageComponent.topicId).toBe('1');
    expect(topicViewerPageComponent.topicName).toBe('Topic Name');
    expect(pageTitleService.setPageTitle).toHaveBeenCalledWith(
      `Learn ${topicName} | Topic page title | Oppia`);
    expect(pageTitleService.updateMetaTag).toHaveBeenCalledWith(
      'Topic Meta Tag');
    expect(topicViewerPageComponent.topicDescription).toBe(
      'Topic Description');
    expect(topicViewerPageComponent.canonicalStorySummaries.length).toBe(1);
    expect(topicViewerPageComponent.chapterCount).toBe(2);
    expect(topicViewerPageComponent.degreesOfMastery).toEqual({});
    expect(topicViewerPageComponent.subtopics).toEqual([]);
    expect(topicViewerPageComponent.skillDescriptions).toEqual({});
    expect(topicViewerPageComponent.topicIsLoading).toBe(false);
    expect(topicViewerPageComponent.practiceTabIsDisplayed).toBe(true);
  }));

  it('should set story tab correctly', fakeAsync(() => {
    spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue(
      topicUrlFragment);
    spyOn(urlService, 'getClassroomUrlFragmentFromLearnerUrl').and.returnValue(
      'math');
    spyOn(urlService, 'getPathname').and.returnValue(
      `/learn/math/${topicUrlFragment}/story`);
    topicViewerPageComponent.ngOnInit();
    var req = httpTestingController.expectOne(
      `/topic_data_handler/math/${topicUrlFragment}`);
    req.flush(topicDict);
    flushMicrotasks();
    expect(topicViewerPageComponent.activeTab).toBe('story');
  }));

  it('should set revision tab correctly', fakeAsync(() => {
    spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue(
      topicUrlFragment);
    spyOn(urlService, 'getClassroomUrlFragmentFromLearnerUrl').and.returnValue(
      'math');
    spyOn(urlService, 'getPathname').and.returnValue(
      `/learn/math/${topicUrlFragment}/revision`);
    topicViewerPageComponent.ngOnInit();
    var req = httpTestingController.expectOne(
      `/topic_data_handler/math/${topicUrlFragment}`);
    req.flush(topicDict);
    expect(topicViewerPageComponent.activeTab).toBe('subtopics');
  }));

  it('should set practice tab correctly', fakeAsync(() => {
    spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue(
      topicUrlFragment);
    spyOn(urlService, 'getClassroomUrlFragmentFromLearnerUrl').and.returnValue(
      'math');
    spyOn(urlService, 'getPathname').and.returnValue(
      `/learn/math/${topicUrlFragment}/practice`);
    topicViewerPageComponent.ngOnInit();
    var req = httpTestingController.expectOne(
      `/topic_data_handler/math/${topicUrlFragment}`);
    req.flush(topicDict);
    expect(topicViewerPageComponent.activeTab).toBe('practice');
  }));

  it('should use reject handler when fetching subtopic data fails',
    fakeAsync(() => {
      spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue(
        topicUrlFragment);
      spyOn(
        urlService, 'getClassroomUrlFragmentFromLearnerUrl').and.returnValue(
        'math');
      spyOn(alertsService, 'addWarning').and.callThrough();

      topicViewerPageComponent.ngOnInit();
      let req = httpTestingController.expectOne(
        `/topic_data_handler/math/${topicUrlFragment}`);
      let errorObject = { status: 404, statusText: 'Not Found' };
      req.flush({ error: errorObject }, errorObject);
      flushMicrotasks();

      expect(alertsService.addWarning).toHaveBeenCalledWith(
        'Failed to get dashboard data');
    }));

  it('should get static image url', () => {
    var imagePath = '/path/to/image.png';
    var staticImageUrl = topicViewerPageComponent.getStaticImageUrl(imagePath);

    expect(staticImageUrl).toBe('/assets/images/path/to/image.png');
  });

  it('should check if the view is mobile or not', () => {
    var widthSpy = spyOn(windowDimensionsService, 'getWidth');
    widthSpy.and.returnValue(400);
    expect(topicViewerPageComponent.checkMobileView()).toBe(true);

    widthSpy.and.returnValue(700);
    expect(topicViewerPageComponent.checkMobileView()).toBe(false);
  });
});
