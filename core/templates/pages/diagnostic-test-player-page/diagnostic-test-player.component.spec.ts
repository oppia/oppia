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
 * @fileoverview Tests for the diagnostic test player component.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { DiagnosticTestPlayerComponent } from './diagnostic-test-player.component';
import { WindowRef } from 'services/contextual/window-ref.service';
import { PreventPageUnloadEventService } from 'services/prevent-page-unload-event.service';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { DiagnosticTestPlayerStatusService } from './diagnostic-test-player-status.service';
import { ClassroomBackendApiService } from 'domain/classroom/classroom-backend-api.service';
import { CreatorTopicSummary } from 'domain/topic/creator-topic-summary.model';
import { ClassroomData } from 'domain/classroom/classroom-data.model';
import { DiagnosticTestTopicTrackerModel } from './diagnostic-test-topic-tracker.model';
import { TranslateService } from '@ngx-translate/core';
import { EventEmitter } from '@angular/core';

class MockTranslateService {
  instant(key: string, interpolateParams?: Object): string {
    return key;
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

describe('Diagnostic test player component', () => {
  let component: DiagnosticTestPlayerComponent;
  let fixture: ComponentFixture<DiagnosticTestPlayerComponent>;
  let windowRef: MockWindowRef;
  let preventPageUnloadEventService: PreventPageUnloadEventService;
  let classroomBackendApiService: ClassroomBackendApiService;
  let translateService: TranslateService;
  let sessionCompleteEmitter = new EventEmitter<string[]>();
  let progressEmitter = new EventEmitter<number>();

  class MockDiagnosticTestPlayerStatusService {
    onDiagnosticTestSessionCompleted = sessionCompleteEmitter;
    onDiagnosticTestSessionProgressChange = progressEmitter;
  }

  beforeEach(() => {
    windowRef = new MockWindowRef();

    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
      ],
      declarations: [
        DiagnosticTestPlayerComponent,
        MockTranslatePipe
      ],
      providers: [
        PreventPageUnloadEventService,
        {
          provide: WindowRef,
          useValue: windowRef
        },
        {
          provide: TranslateService,
          useClass: MockTranslateService
        },
        {
          provide: DiagnosticTestPlayerStatusService,
          useClass: MockDiagnosticTestPlayerStatusService
        },
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DiagnosticTestPlayerComponent);
    component = fixture.componentInstance;
    preventPageUnloadEventService = TestBed.inject(
      PreventPageUnloadEventService);
    classroomBackendApiService = TestBed.inject(ClassroomBackendApiService);
    translateService = TestBed.inject(TranslateService);
  });

  it('should listen to page unload events after initialization', () => {
    spyOn(preventPageUnloadEventService, 'addListener').and
      .callFake((callback: () => boolean) => callback());

    component.ngOnInit();

    expect(preventPageUnloadEventService.addListener)
      .toHaveBeenCalledWith(jasmine.any(Function));
  });

  it(
    'should be able to get Oppia\'s avatar image URL after initialization',
    () => {
      spyOn(preventPageUnloadEventService, 'addListener');

      expect(component.OPPIA_AVATAR_IMAGE_URL).toEqual('');

      const avatarImageLocation = (
        '/assets/images/avatar/oppia_avatar_100px.svg');

      component.ngOnInit();

      expect(component.OPPIA_AVATAR_IMAGE_URL).toEqual(avatarImageLocation);
    });

  it(
    'should be able to subscribe event emitters after initialization',
    fakeAsync(() => {
      spyOn(preventPageUnloadEventService, 'addListener');
      spyOn(component, 'getRecommendedTopicSummaries');
      spyOn(component, 'getProgressText');

      component.ngOnInit();
      sessionCompleteEmitter.emit(['recommendedTopicId']);
      progressEmitter.emit(20);
      tick(200);

      expect(
        component.getRecommendedTopicSummaries
      ).toHaveBeenCalledWith(['recommendedTopicId']);

      expect(
        component.getProgressText
      ).toHaveBeenCalled();
    }));

  it(
    'should be able to get the math classroom ID after initialization',
    fakeAsync(() => {
      spyOn(preventPageUnloadEventService, 'addListener');
      spyOn(classroomBackendApiService, 'getClassroomIdAsync')
        .and.returnValue(Promise.resolve('mathClassroomId'));
      component.classroomUrlFragment = 'math';

      expect(component.classroomId).toEqual('');

      component.ngOnInit();
      tick();

      expect(component.classroomId).toEqual('mathClassroomId');
    }));

  it('should be able to get the topic button text', () => {
    let topicName = 'Fraction';
    spyOn(translateService, 'instant').and.callThrough();

    component.getTopicButtonText(topicName);

    expect(translateService.instant).toHaveBeenCalledWith(
      'I18N_DIAGNOSTIC_TEST_RESULT_START_TOPIC', { topicName: 'Fraction' });
  });

  it('should be able to get the topic URL from the URL fragment', () => {
    let topicUrlFragment = 'subtraction';

    expect(component.getTopicUrlFromUrlFragment(topicUrlFragment)).toEqual(
      '/learn/math/' + topicUrlFragment);
  });

  it('should be able to get topic recommendations', fakeAsync(() => {
    let cData1: CreatorTopicSummary = new CreatorTopicSummary(
      'dummy', 'addition', 3, 3, 3, 3, 1,
      'en', 'dummy', 1, 1, 1, 1, true,
      true, 'math', 'public/img.webp', 'red', 'add', 1, 1, [5, 4], [3, 4]);
    let cData2: CreatorTopicSummary = new CreatorTopicSummary(
      'dummy2', 'division', 2, 2, 3, 3, 0,
      'es', 'dummy2', 1, 1, 1, 1, true,
      true, 'math', 'public/img1.png', 'green', 'div', 1, 1, [5, 4], [3, 4]);

    let array: CreatorTopicSummary[] = [cData1, cData2];
    let classroomData = new ClassroomData('test', array, 'dummy', 'dummy');

    spyOn(classroomBackendApiService, 'fetchClassroomDataAsync')
      .and.returnValue(Promise.resolve(classroomData));

    expect(component.recommendedTopicSummaries).toEqual([]);

    component.getRecommendedTopicSummaries(['dummy']);
    tick();

    expect(component.recommendedTopicSummaries).toEqual([cData1]);
  }));

  it(
    'should be able to set topic tracker model after starting diagnostic test',
    fakeAsync(() => {
      // A linear graph with 3 nodes.
      const topicIdToPrerequisiteTopicIds = {
        topicId1: [],
        topicId2: ['topicId1'],
        topicId3: ['topicId2']
      };

      const diagnosticTestTopicTrackerModel = (
        new DiagnosticTestTopicTrackerModel(topicIdToPrerequisiteTopicIds));

      let response = {
        classroomDict: {
          classroomId: 'classroomId',
          name: 'math',
          urlFragment: 'math',
          courseDetails: '',
          topicListIntro: '',
          topicIdToPrerequisiteTopicIds: topicIdToPrerequisiteTopicIds
        }
      };

      spyOn(classroomBackendApiService, 'getClassroomDataAsync')
        .and.returnValue(Promise.resolve(response));

      expect(component.diagnosticTestTopicTrackerModel).toEqual(undefined);

      component.startDiagnosticTest();
      tick();

      expect(component.diagnosticTestTopicTrackerModel).toEqual(
        diagnosticTestTopicTrackerModel);
    }));
});
