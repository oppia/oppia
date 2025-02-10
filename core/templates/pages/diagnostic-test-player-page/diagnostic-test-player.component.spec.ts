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

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import {AppConstants} from 'app.constants';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {DiagnosticTestPlayerComponent} from './diagnostic-test-player.component';
import {PreventPageUnloadEventService} from 'services/prevent-page-unload-event.service';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {DiagnosticTestPlayerStatusService} from './diagnostic-test-player-status.service';
import {ClassroomBackendApiService} from 'domain/classroom/classroom-backend-api.service';
import {CreatorTopicSummary} from 'domain/topic/creator-topic-summary.model';
import {ClassroomData} from 'domain/classroom/classroom-data.model';
import {DiagnosticTestTopicTrackerModel} from './diagnostic-test-topic-tracker.model';
import {TranslateService} from '@ngx-translate/core';
import {EventEmitter} from '@angular/core';
import {Router} from '@angular/router';
import {WindowRef} from 'services/contextual/window-ref.service';
import {HttpErrorResponse} from '@angular/common/http';
import {AlertsService} from 'services/alerts.service';

class MockTranslateService {
  instant(key: string, interpolateParams?: Object): string {
    return key;
  }
}

class MockWindowRef {
  _window = {
    location: {
      _href: '',
      search: '',
      get href() {
        return this._href;
      },
      set href(val) {
        this._href = val;
      },
      replace: (val: string) => {},
    },
    gtag: () => {},
    onhashchange: () => {},
    addEventListener: (
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions
    ) => {},
  };

  get nativeWindow() {
    return this._window;
  }
}

class MockRouter {
  navigate(commands: string[]): Promise<boolean> {
    return Promise.resolve(true);
  }
}

const topicData1: CreatorTopicSummary = new CreatorTopicSummary(
  'dummy',
  'addition',
  3,
  3,
  3,
  3,
  1,
  'en',
  'dummy',
  1,
  1,
  1,
  1,
  true,
  true,
  'math',
  'public/img.webp',
  'red',
  'add',
  1,
  1,
  [5, 4],
  [3, 4]
);
const topicData2: CreatorTopicSummary = new CreatorTopicSummary(
  'dummy2',
  'division',
  2,
  2,
  3,
  3,
  0,
  'es',
  'dummy2',
  1,
  1,
  1,
  1,
  true,
  true,
  'math',
  'public/img1.png',
  'green',
  'div',
  1,
  1,
  [5, 4],
  [3, 4]
);

const dummyClassroomData = new ClassroomData(
  'id',
  'math',
  'math',
  [topicData1, topicData2],
  'dummy',
  'dummy',
  'dummy',
  true,
  {filename: 'thumbnail.svg', size_in_bytes: 100, bg_color: 'transparent'},
  {filename: 'banner.png', size_in_bytes: 100, bg_color: 'transparent'},
  1
);

describe('Diagnostic test player component', () => {
  let component: DiagnosticTestPlayerComponent;
  let fixture: ComponentFixture<DiagnosticTestPlayerComponent>;
  let preventPageUnloadEventService: PreventPageUnloadEventService;
  let classroomBackendApiService: ClassroomBackendApiService;
  let translateService: TranslateService;
  let sessionCompleteEmitter = new EventEmitter<string[]>();
  let progressEmitter = new EventEmitter<number>();
  let router: Router;
  let windowRef: MockWindowRef;
  let alertsService: AlertsService;

  class MockDiagnosticTestPlayerStatusService {
    onDiagnosticTestSessionCompleted = sessionCompleteEmitter;
    onDiagnosticTestSessionProgressChange = progressEmitter;
  }

  beforeEach(() => {
    windowRef = new MockWindowRef();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [DiagnosticTestPlayerComponent, MockTranslatePipe],
      providers: [
        PreventPageUnloadEventService,
        {provide: WindowRef, useValue: windowRef},
        {
          provide: TranslateService,
          useClass: MockTranslateService,
        },
        {
          provide: DiagnosticTestPlayerStatusService,
          useClass: MockDiagnosticTestPlayerStatusService,
        },
        {provide: Router, useClass: MockRouter},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    router = TestBed.inject(Router);
    alertsService = TestBed.inject(AlertsService);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DiagnosticTestPlayerComponent);
    component = fixture.componentInstance;
    preventPageUnloadEventService = TestBed.inject(
      PreventPageUnloadEventService
    );
    classroomBackendApiService = TestBed.inject(ClassroomBackendApiService);
    translateService = TestBed.inject(TranslateService);
  });

  it('should listen to page unload events after initialization', () => {
    windowRef.nativeWindow.location.search = '?classroom=math';
    spyOn(preventPageUnloadEventService, 'addListener').and.callFake(
      (callback: () => boolean) => callback()
    );

    component.ngOnInit();

    expect(preventPageUnloadEventService.addListener).toHaveBeenCalledWith(
      jasmine.any(Function)
    );
  });

  it('should get classroomData after initialization', fakeAsync(() => {
    windowRef.nativeWindow.location.search = '?classroom=math';

    spyOn(
      classroomBackendApiService,
      'fetchClassroomDataAsync'
    ).and.returnValue(Promise.resolve(dummyClassroomData));

    component.ngOnInit();
    tick();

    expect(component.classroomUrlFragment).toEqual('math');
    expect(component.classroomData.getName()).toEqual('math');
  }));

  it('should redirect to the 404 page if the classroom url fragment is not present', fakeAsync(() => {
    const navigateSpy = spyOn(router, 'navigate').and.returnValue(
      Promise.resolve(true)
    );

    component.ngOnInit();
    tick();

    expect(navigateSpy).toHaveBeenCalledWith([
      `${AppConstants.PAGES_REGISTERED_WITH_FRONTEND.ERROR.ROUTE}/404`,
    ]);
  }));

  it('should show an alert if the classroom url fragment is invalid', fakeAsync(() => {
    windowRef.nativeWindow.location.search = '?classroom=mathtwo';
    spyOn(alertsService, 'addWarning');

    spyOn(
      classroomBackendApiService,
      'fetchClassroomDataAsync'
    ).and.returnValue(
      Promise.reject(
        new HttpErrorResponse({
          status: 400,
        })
      )
    );

    component.ngOnInit();
    tick();

    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'Failed to get classroom data. The URL fragment is invalid, or the classroom does not exist.'
    );
  }));

  it('should be able to subscribe event emitters after initialization', fakeAsync(() => {
    windowRef.nativeWindow.location.search = '?classroom=math';
    spyOn(preventPageUnloadEventService, 'addListener');
    spyOn(component, 'getRecommendedTopicSummaries').and.callThrough();
    spyOn(component, 'getProgressText').and.callThrough();

    spyOn(
      classroomBackendApiService,
      'fetchClassroomDataAsync'
    ).and.returnValue(Promise.resolve(dummyClassroomData));

    component.ngOnInit();
    tick();

    sessionCompleteEmitter.emit(['recommendedTopicId']);
    progressEmitter.emit(20);
    tick();

    expect(component.getRecommendedTopicSummaries).toHaveBeenCalledWith([
      'recommendedTopicId',
    ]);
    expect(component.getProgressText).toHaveBeenCalled();
  }));

  it('should not get recommended topics if classroomData is not initialized', () => {
    component.classroomData = undefined;
    component.getRecommendedTopicSummaries(['test']);
    expect(component.recommendedTopicSummaries).toEqual([]);
  });

  it('should be able to get the topic button text', () => {
    windowRef.nativeWindow.location.search = '?classroom=math';
    let topicName = 'Fraction';
    spyOn(translateService, 'instant').and.callThrough();

    component.getTopicButtonText(topicName);

    expect(translateService.instant).toHaveBeenCalledWith(
      'I18N_DIAGNOSTIC_TEST_RESULT_START_TOPIC',
      {topicName: 'Fraction'}
    );
  });

  it('should be able to get the topic URL from the URL fragment', () => {
    windowRef.nativeWindow.location.search = '?classroom=math';
    component.classroomUrlFragment = 'math';
    let topicUrlFragment = 'subtraction';

    expect(component.getTopicUrlFromUrlFragment(topicUrlFragment)).toEqual(
      '/learn/math/' + topicUrlFragment
    );
  });

  it('should be able to get topic recommendations', fakeAsync(() => {
    windowRef.nativeWindow.location.search = '?classroom=math';

    spyOn(
      classroomBackendApiService,
      'fetchClassroomDataAsync'
    ).and.returnValue(Promise.resolve(dummyClassroomData));

    component.ngOnInit();
    tick();

    expect(component.recommendedTopicSummaries).toEqual([]);

    component.getRecommendedTopicSummaries(['dummy']);
    tick();

    expect(component.recommendedTopicSummaries).toEqual([topicData1]);
  }));

  it('should be able to set topic tracker model after starting diagnostic test', fakeAsync(() => {
    windowRef.nativeWindow.location.search = '?classroom=math';
    // A linear graph with 3 nodes.
    const topicIdToPrerequisiteTopicIds = {
      topicId1: [],
      topicId2: ['topicId1'],
      topicId3: ['topicId2'],
    };

    component.classroomData = dummyClassroomData;

    const diagnosticTestTopicTrackerModel = new DiagnosticTestTopicTrackerModel(
      topicIdToPrerequisiteTopicIds
    );

    let response = {
      classroomDict: {
        classroomId: 'classroomId',
        name: 'math',
        urlFragment: 'math',
        courseDetails: '',
        topicListIntro: '',
        topicIdToPrerequisiteTopicIds: topicIdToPrerequisiteTopicIds,
      },
    };

    expect(component.diagnosticTestTopicTrackerModel).toEqual(undefined);

    spyOn(classroomBackendApiService, 'getClassroomDataAsync').and.returnValue(
      Promise.resolve(response)
    );

    component.ngOnInit();
    tick();

    component.startDiagnosticTest();
    tick();

    expect(component.diagnosticTestTopicTrackerModel).toEqual(
      diagnosticTestTopicTrackerModel
    );
  }));

  it('should not start diagnostic test if there is error while fetching classroom data', fakeAsync(() => {
    expect(component.isStartTestButtonDisabled).toBeFalse();
    component.classroomData = dummyClassroomData;

    spyOn(classroomBackendApiService, 'getClassroomDataAsync').and.returnValue(
      Promise.reject({status: 400})
    );

    component.startDiagnosticTest();
    tick();

    expect(component.isStartTestButtonDisabled).toBeTrue();
  }));
});
