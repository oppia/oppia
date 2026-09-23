// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for lesson player navbar breadcrumb component.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {
  ReadOnlyTopicBackendDict,
  ReadOnlyTopic,
} from '../../../../domain/topic_viewer/read-only-topic.model';
import {TopicViewerBackendApiService} from '../../../../domain/topic_viewer/topic-viewer-backend-api.service';
import {UrlService} from '../../../../services/contextual/url.service';
import {CapitalizePipe} from '../../../../filters/string-utility-filters/capitalize.pipe';
import {ClassroomBackendApiService} from '../../../../domain/classroom/classroom-backend-api.service';
import {MockTranslatePipe} from '../../../../tests/unit-test-utils';
import {LessonPlayerNavbarBreadcrumbComponent} from './lesson-player-navbar-breadcrumb.component';

class MockCapitalizePipe {
  transform = jasmine.createSpy('transform').and.returnValue('Math Classroom');
}

class MockClassroomBackendApiService {
  fetchClassroomDataAsync = jasmine
    .createSpy('fetchClassroomDataAsync')
    .and.returnValue(
      Promise.resolve({
        getName: () => 'math classroom',
      })
    );
}

describe('Lesson player navbar breadcrumb component', () => {
  let fixture: ComponentFixture<LessonPlayerNavbarBreadcrumbComponent>;
  let componentInstance: LessonPlayerNavbarBreadcrumbComponent;
  let urlService: UrlService;
  let topicViewerBackendApiService: TopicViewerBackendApiService;
  let classroomBackendApiService: ClassroomBackendApiService;
  let capitalizePipe: CapitalizePipe;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [LessonPlayerNavbarBreadcrumbComponent, MockTranslatePipe],
      providers: [
        UrlService,
        TopicViewerBackendApiService,
        {provide: CapitalizePipe, useClass: MockCapitalizePipe},
        {
          provide: ClassroomBackendApiService,
          useClass: MockClassroomBackendApiService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LessonPlayerNavbarBreadcrumbComponent);
    componentInstance = fixture.componentInstance;
    urlService = TestBed.inject(UrlService);
    topicViewerBackendApiService = TestBed.inject(TopicViewerBackendApiService);
    classroomBackendApiService = TestBed.inject(ClassroomBackendApiService);
    capitalizePipe = TestBed.inject(CapitalizePipe);

    spyOn(topicViewerBackendApiService, 'fetchTopicDataAsync').and.resolveTo(
      ReadOnlyTopic.createFromBackendDict({
        subtopics: [],
        skill_descriptions: {},
        uncategorized_skill_ids: [],
        degrees_of_mastery: {},
        canonical_story_dicts: [],
        additional_story_dicts: [],
        topic_name: 'Topic Name 1',
        topic_id: 'topic1',
        topic_description: 'Description',
        practice_tab_is_displayed: false,
        meta_tag_content: 'content',
        page_title_fragment_for_web: 'title',
        classroom_name: 'math',
      } as ReadOnlyTopicBackendDict)
    );
  });

  describe('ngOnInit', () => {
    it('should not fetch topic or classroom data when not linked to a topic', () => {
      spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue(
        null
      );
      spyOn(
        urlService,
        'getClassroomUrlFragmentFromLearnerUrl'
      ).and.returnValue(null);

      componentInstance.ngOnInit();

      expect(componentInstance.topicName).toBe('');
      expect(componentInstance.classroomName).toBe('');
      expect(componentInstance.isLinkedToTopic).toBe(false);
      expect(
        topicViewerBackendApiService.fetchTopicDataAsync
      ).not.toHaveBeenCalled();
      expect(
        classroomBackendApiService.fetchClassroomDataAsync
      ).not.toHaveBeenCalled();
    });

    it('should fetch topic and classroom data when linked to a topic', async () => {
      spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue(
        'topic1'
      );
      spyOn(
        urlService,
        'getClassroomUrlFragmentFromLearnerUrl'
      ).and.returnValue('classroom1');

      componentInstance.ngOnInit();
      await fixture.whenStable();

      expect(componentInstance.isLinkedToTopic).toBe(true);
      expect(
        topicViewerBackendApiService.fetchTopicDataAsync
      ).toHaveBeenCalledWith('topic1', 'classroom1');
      expect(componentInstance.topicName).toBe('Topic Name 1');
      expect(
        classroomBackendApiService.fetchClassroomDataAsync
      ).toHaveBeenCalledWith('classroom1');
      expect(capitalizePipe.transform).toHaveBeenCalledWith('math classroom');
      expect(componentInstance.classroomName).toBe('Math Classroom');
    });

    it('should throw an error when classroom URL fragment is null', () => {
      spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue(
        'topic1'
      );
      spyOn(
        urlService,
        'getClassroomUrlFragmentFromLearnerUrl'
      ).and.returnValue(null);

      expect(() => componentInstance.ngOnInit()).toThrowError(
        'Classroom URL fragment is null'
      );
    });
  });

  describe('computeIsLinkedToTopic (via ngOnInit)', () => {
    it('should return false when the URL service throws', () => {
      spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.throwError(
        'Test error'
      );

      componentInstance.ngOnInit();

      expect(componentInstance.isLinkedToTopic).toBe(false);
      expect(
        topicViewerBackendApiService.fetchTopicDataAsync
      ).not.toHaveBeenCalled();
    });

    it('should throw when only the topic URL fragment is present', () => {
      spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue(
        'topic1'
      );
      spyOn(
        urlService,
        'getClassroomUrlFragmentFromLearnerUrl'
      ).and.returnValue(null);

      expect(() => componentInstance.ngOnInit()).toThrowError(
        'Classroom URL fragment is null'
      );
      expect(
        topicViewerBackendApiService.fetchTopicDataAsync
      ).not.toHaveBeenCalled();
    });

    it('should throw when only the classroom URL fragment is present', () => {
      spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue(
        null
      );
      spyOn(
        urlService,
        'getClassroomUrlFragmentFromLearnerUrl'
      ).and.returnValue('classroom1');

      expect(() => componentInstance.ngOnInit()).toThrowError(
        'Classroom URL fragment is null'
      );
      expect(
        topicViewerBackendApiService.fetchTopicDataAsync
      ).not.toHaveBeenCalled();
    });
  });

  describe('shouldShowBreadcrumb', () => {
    it('should return false when not linked to a topic', () => {
      componentInstance.isLinkedToTopic = false;
      componentInstance.classroomName = 'Math Classroom';
      componentInstance.topicName = 'Topic Name 1';

      expect(componentInstance.shouldShowBreadcrumb()).toBe(false);
    });

    it('should return false when classroom name has not arrived yet', () => {
      componentInstance.isLinkedToTopic = true;
      componentInstance.classroomName = '';
      componentInstance.topicName = 'Topic Name 1';

      expect(componentInstance.shouldShowBreadcrumb()).toBe(false);
    });

    it('should return false when topic name has not arrived yet', () => {
      componentInstance.isLinkedToTopic = true;
      componentInstance.classroomName = 'Math Classroom';
      componentInstance.topicName = '';

      expect(componentInstance.shouldShowBreadcrumb()).toBe(false);
    });

    it('should return true when linked to a topic and both names have arrived', () => {
      componentInstance.isLinkedToTopic = true;
      componentInstance.classroomName = 'Math Classroom';
      componentInstance.topicName = 'Topic Name 1';

      expect(componentInstance.shouldShowBreadcrumb()).toBe(true);
    });
  });

  describe('getClassroomUrl', () => {
    it('should return the classroom URL', () => {
      componentInstance.classroomUrlFragment = 'classroom1';

      expect(componentInstance.getClassroomUrl()).toBe('/learn/classroom1');
    });
  });

  describe('getTopicUrl', () => {
    it('should return the topic URL', () => {
      componentInstance.classroomUrlFragment = 'classroom1';
      componentInstance.topicUrlFragment = 'topic1';

      expect(componentInstance.getTopicUrl()).toBe('/learn/classroom1/topic1');
    });
  });
});
