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

import { TestBed, async, ComponentFixture } from '@angular/core/testing';
import { SubtopicObjectFactory } from 'domain/topic/SubtopicObjectFactory';
import { PracticeTabComponent } from './practice-tab.component';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { UrlService } from 'services/contextual/url.service';
import { WindowRef } from 'services/contextual/window-ref.service';

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
      reload: (val) => val
    },
  };
  get nativeWindow() {
    return this._window;
  }
}

describe('Practice tab component', function() {
  let component: PracticeTabComponent;
  let fixture: ComponentFixture<PracticeTabComponent>;
  let subtopicObjectFactory = null;
  let windowRef: MockWindowRef;

  beforeEach(async(() => {
    windowRef = new MockWindowRef();
    TestBed.configureTestingModule({
      declarations: [PracticeTabComponent],
      providers: [
        UrlInterpolationService,
        { provide: UrlService, useClass: MockUrlService },
        { provide: WindowRef, useValue: windowRef },
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    subtopicObjectFactory = TestBed.get(SubtopicObjectFactory);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PracticeTabComponent);
    component = fixture.componentInstance;
    component.topicName = 'Topic Name';
    component.subtopicsList = [
      subtopicObjectFactory.create({
        id: 1,
        title: 'Subtopic 1',
        skill_ids: ['1', '2'],
        thumbnail_filename: '',
        thumbnail_bg_color: ''
      }, {
        1: 'First skill',
        2: 'Second skill'
      }),
      subtopicObjectFactory.create({
        id: 2,
        title: 'Subtopic 2',
        skill_ids: [],
        thumbnail_filename: '',
        thumbnail_bg_color: ''
      })
    ];
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
      expect(component.isStartButtonDisabled()).toBe(false);
    });

  it('should have start button disabled when there is no subtopic selected',
    function() {
      component.selectedSubtopicIndices[0] = false;
      expect(component.isStartButtonDisabled()).toBe(true);
    });

  it('should open a new practice session containing the selected subtopic' +
    ' when start button is clicked', function() {
    component.selectedSubtopicIndices[0] = true;
    component.openNewPracticeSession();

    expect(windowRef.nativeWindow.location.href).toBe(
      '/learn/classroom_1/topic_1/practice/session?selected_subtopic_ids=1');
  });
});
