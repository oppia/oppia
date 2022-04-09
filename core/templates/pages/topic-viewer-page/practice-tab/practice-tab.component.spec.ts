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
 * @fileoverview Unit tests for practiceTab.
 */

import { TestBed, async, ComponentFixture, fakeAsync, flushMicrotasks } from
  '@angular/core/testing';
import { Subtopic } from 'domain/topic/subtopic.model';
import { PracticeTabComponent } from './practice-tab.component';
import { QuestionBackendApiService } from
  'domain/question/question-backend-api.service';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { UrlService } from 'services/contextual/url.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { MockTranslatePipe } from 'tests/unit-test-utils';

class MockUrlService {
  getTopicUrlFragmentFromLearnerUrl() {
    return 'topic_1';
  }

  getClassroomUrlFragmentFromLearnerUrl() {
    return 'classroom_1';
  }
}

class MockWindowRef {
  _window = {
    location: {
      href: '',
      reload: (val: boolean) => val
    },
  };

  get nativeWindow() {
    return this._window;
  }
}

class MockQuestionBackendApiService {
  async fetchTotalQuestionCountForSkillIdsAsync() {
    return Promise.resolve(1);
  }
}

describe('Practice tab component', function() {
  let component: PracticeTabComponent;
  let fixture: ComponentFixture<PracticeTabComponent>;
  let windowRef: MockWindowRef;
  let questionBackendApiService: MockQuestionBackendApiService;

  beforeEach(async(() => {
    windowRef = new MockWindowRef();
    questionBackendApiService = new MockQuestionBackendApiService();
    TestBed.configureTestingModule({
      declarations: [PracticeTabComponent, MockTranslatePipe],
      providers: [
        UrlInterpolationService,
        { provide: UrlService, useClass: MockUrlService },
        { provide: WindowRef, useValue: windowRef },
        {
          provide: QuestionBackendApiService,
          useValue: questionBackendApiService
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PracticeTabComponent);
    component = fixture.componentInstance;
    component.topicName = 'Topic Name';
    component.subtopicsList = [
      Subtopic.create({
        id: 1,
        title: 'Subtopic 1',
        skill_ids: ['1', '2'],
        thumbnail_filename: '',
        thumbnail_bg_color: '',
        url_fragment: ''
      }, {
        1: 'First skill',
        2: 'Second skill'
      }),
      Subtopic.create({
        id: 2,
        title: 'Subtopic 2',
        skill_ids: [],
        thumbnail_filename: '',
        thumbnail_bg_color: '',
        url_fragment: ''
      }, {
        1: 'First skill',
        2: 'Second skill'
      })
    ];
    component.subtopicIds = [1, 2, 3];
    component.subtopicMastery = {
      1: 0,
      2: 1
    };
    fixture.detectChanges();
  });

  it('should initialize controller properties after its initilization',
    function() {
      component.ngOnInit();
      expect(component.selectedSubtopics).toEqual([]);
      expect(component.availableSubtopics.length).toBe(1);
      expect(component.selectedSubtopicIndices).toEqual([false]);
    });

  it('should have start button enabled when a subtopic is selected',
    function() {
      component.selectedSubtopicIndices[0] = true;
      component.questionsAreAvailable = true;
      expect(component.isStartButtonDisabled()).toBe(false);
    });

  it('should have start button disabled when there is no subtopic selected',
    function() {
      component.selectedSubtopicIndices[0] = false;
      expect(component.isStartButtonDisabled()).toBe(true);
    });

  it('should have start button disabled when the disable boolean is set',
    function() {
      component.previewMode = true;
      expect(component.isStartButtonDisabled()).toBe(true);
    });

  it('should open a new practice session containing the selected subtopic' +
    ' when start button is clicked for topicViewer display area', function() {
    component.selectedSubtopicIndices[0] = true;
    component.openNewPracticeSession();

    expect(windowRef.nativeWindow.location.href).toBe(
      '/learn/classroom_1/topic_1/practice/session?' +
      'selected_subtopic_ids=%5B1%5D'
    );
  });

  it('should check if questions exist for the selected subtopics',
    fakeAsync(() => {
      component.checkIfQuestionsExist([true]);
      flushMicrotasks();
      expect(component.questionsAreAvailable).toBeTrue();
      component.checkIfQuestionsExist([false]);
      flushMicrotasks();
      expect(component.questionsAreAvailable).toBeFalse();
    }));

  it('should open a new practice session containing the selected subtopic' +
    ' when start button is clicked for progressTab display area', function() {
    component.displayArea = 'progressTab';
    component.topicUrlFragment = 'topic_1';
    component.classroomUrlFragment = 'classroom_1';
    component.selectedSubtopicIndices[0] = true;
    component.openNewPracticeSession();

    expect(windowRef.nativeWindow.location.href).toBe(
      '/learn/classroom_1/topic_1/practice/session?' +
      'selected_subtopic_ids=%5B1%5D'
    );
  });

  it('should return background for progress of a subtopic', () => {
    component.subtopicMasteryArray = [10, 20];
    expect(component.getBackgroundForProgress(0)).toEqual(10);
  });

  it('should get subtopic mastery position for capsule', () => {
    component.clientWidth = 700;
    component.subtopicMasteryArray = [20, 99];
    expect(component.subtopicMasteryPosition(0)).toEqual(175);
    expect(component.subtopicMasteryPosition(1)).toEqual(12);

    component.clientWidth = 400;
    expect(component.subtopicMasteryPosition(0)).toEqual(150);
    expect(component.subtopicMasteryPosition(1)).toEqual(7);
  });

  it('should get mastery text color', () => {
    component.subtopicMasteryArray = [20, 99];
    expect(component.masteryTextColor(0)).toEqual('black');
    expect(component.masteryTextColor(1)).toEqual('white');
  });
});
