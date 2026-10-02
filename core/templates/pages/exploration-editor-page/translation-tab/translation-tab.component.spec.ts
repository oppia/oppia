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
 * @fileoverview Unit tests for translationTab.
 */

// @ts-nocheck

import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {EventEmitter, NO_ERRORS_SCHEMA} from '@angular/core';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {SiteAnalyticsService} from 'services/site-analytics.service';
import {LoaderService} from 'services/loader.service';
import {PageContextService} from 'services/page-context.service';
import {UserExplorationPermissionsService} from 'pages/exploration-editor-page/services/user-exploration-permissions.service';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {StateEditorService} from 'components/state-editor/state-editor-properties-services/state-editor.service';
import {EditabilityService} from 'services/editability.service';
import {ExplorationStatesService} from '../services/exploration-states.service';
import {RouterService} from '../services/router.service';
import {StateTutorialFirstTimeService} from '../services/state-tutorial-first-time.service';
import {TranslationTabComponent} from './translation-tab.component';
import {ExplorationPermissions} from 'domain/exploration/exploration-permissions.model';
import {VoiceoverBackendApiService} from 'domain/voiceover/voiceover-backend-api.service';
import {ShepherdService} from 'angular-shepherd';

class MockNgbModal {
  open() {
    return {
      result: Promise.resolve(),
    };
  }
}

class MockPageContextService {
  getExplorationId() {
    return 'exp1';
  }
}

describe('Translation tab component', () => {
  let component: TranslationTabComponent;
  let fixture: ComponentFixture<TranslationTabComponent>;
  let ngbModal: NgbModal;
  let pageContextService: PageContextService;
  let editabilityService: EditabilityService;
  let explorationStatesService: ExplorationStatesService;
  let loaderService: LoaderService;
  let routerService: RouterService;
  let siteAnalyticsService: SiteAnalyticsService;
  let stateEditorService: StateEditorService;
  let stateTutorialFirstTimeService: StateTutorialFirstTimeService;
  let userExplorationPermissionsService: UserExplorationPermissionsService;
  let voiceoverBackendApiService: VoiceoverBackendApiService;
  let refreshTranslationTabEmitter = new EventEmitter<void>();
  let enterTranslationForTheFirstTimeEmitter = new EventEmitter<string>();

  class MockShepherdService {
    defaultStepOptions = {};
    modal = false;
    steps: object[] = [];
    tourObject: {
      on: (eventName: string, cb: () => void) => void;
      start: () => void;
      complete: () => void;
      cancel: () => void;
    } | null = null;

    addSteps(steps: object[]) {
      this.steps = steps;
      this.tourObject = {
        on: (eventName: string, cb: () => void) => {},
        start: () => {},
        complete: () => {},
        cancel: () => {},
      };
    }

    start() {
      this.tourObject?.start();
    }
    complete() {
      this.tourObject?.complete();
    }
    back() {}
    cancel() {
      this.tourObject?.cancel();
    }
  }

  class MockUserExplorationPermissionsService {
    getPermissionsAsync() {
      return Promise.resolve({
        canUnpublish: false,
        canReleaseOwnership: false,
        canPublish: false,
        canVoiceover: true,
        canDelete: false,
        canModifyRoles: false,
        canEdit: false,
        canManageVoiceArtist: false,
      } as ExplorationPermissions);
    }

    fetchPermissionsAsync() {
      return Promise.resolve({
        canUnpublish: false,
        canReleaseOwnership: false,
        canPublish: false,
        canVoiceover: true,
        canDelete: false,
        canModifyRoles: false,
        canEdit: false,
        canManageVoiceArtist: false,
      } as ExplorationPermissions);
    }
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [TranslationTabComponent],
      providers: [
        // The UserExplorationPermissionsService has been
        // mocked here because spying the function of
        // UserExplorationPermissionsService is not able to
        // stop afterAll error i.e. PageContextService should not
        // be used outside the context of an exploration or a question.
        {
          provide: UserExplorationPermissionsService,
          useClass: MockUserExplorationPermissionsService,
        },
        {
          provide: ShepherdService,
          useClass: MockShepherdService,
        },
        {
          provide: NgbModal,
          useClass: MockNgbModal,
        },
        {
          provide: PageContextService,
          useClass: MockPageContextService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TranslationTabComponent);
    component = fixture.componentInstance;

    pageContextService = TestBed.inject(PageContextService);
    loaderService = TestBed.inject(LoaderService);
    siteAnalyticsService = TestBed.inject(SiteAnalyticsService);
    userExplorationPermissionsService = TestBed.inject(
      UserExplorationPermissionsService
    );
    editabilityService = TestBed.inject(EditabilityService);
    explorationStatesService = TestBed.inject(ExplorationStatesService);
    routerService = TestBed.inject(RouterService);
    stateEditorService = TestBed.inject(StateEditorService);
    ngbModal = TestBed.inject(NgbModal);
    stateTutorialFirstTimeService = TestBed.inject(
      StateTutorialFirstTimeService
    );
    voiceoverBackendApiService = TestBed.inject(VoiceoverBackendApiService);

    spyOn(pageContextService, 'getExplorationId').and.returnValue('exp1');
    spyOn(stateEditorService, 'getActiveStateName').and.returnValue(
      'Introduction'
    );
    spyOnProperty(
      stateTutorialFirstTimeService,
      'onEnterTranslationForTheFirstTime'
    ).and.returnValue(enterTranslationForTheFirstTimeEmitter);
    spyOnProperty(routerService, 'onRefreshTranslationTab').and.returnValue(
      refreshTranslationTabEmitter
    );
    let element = document.createElement('div');
    spyOn(document, 'querySelector').and.returnValue(element as HTMLElement);

    let languageAccentMasterList = {
      en: {
        'en-IN': 'English (India)',
        'en-US': 'English (United State)',
      },
      hi: {
        'hi-IN': 'Hindi (India)',
      },
    };
    let languageCodesMapping = {
      en: {
        'en-US': true,
      },
      hi: {
        'hi-IN': true,
      },
    };

    let voiceoverAdminDataResponse = {
      languageAccentMasterList: languageAccentMasterList,
      languageCodesMapping: languageCodesMapping,
    };

    spyOn(
      voiceoverBackendApiService,
      'fetchVoiceoverAdminDataAsync'
    ).and.resolveTo(Promise.resolve(voiceoverAdminDataResponse));

    explorationStatesService.init(
      {
        Introduction: {
          classifier_model_id: null,
          card_is_checkpoint: false,
          content: {
            content_id: 'content',
            html: 'Introduction Content',
          },
          interaction: {
            confirmed_unclassified_answers: [],
            id: 'TextInput',
            customization_args: {
              placeholder: {
                value: {
                  content_id: 'ca_placeholder',
                  unicode_str: '',
                },
              },
              rows: {value: 1},
              catchMisspellings: {
                value: false,
              },
            },
            answer_groups: [
              {
                rule_specs: [],
                training_data: [],
                tagged_skill_misconception_id: null,
                outcome: {
                  missing_prerequisite_skill_id: null,
                  dest: 'unused',
                  dest_if_really_stuck: null,
                  feedback: {
                    content_id: 'feedback_1',
                    html: '',
                  },
                  labelled_as_correct: false,
                  param_changes: [],
                  refresher_exploration_id: null,
                },
              },
            ],
            default_outcome: {
              missing_prerequisite_skill_id: null,
              dest: 'default',
              dest_if_really_stuck: null,
              feedback: {
                content_id: 'default_outcome',
                html: '',
              },
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null,
            },
            solution: {
              correct_answer: 'This is the correct answer',
              answer_is_exclusive: false,
              explanation: {
                html: 'Solution explanation',
                content_id: 'content_4',
              },
            },
            hints: [],
          },
          linked_skill_id: null,
          param_changes: [],
          solicit_answer_details: false,
          inapplicable_skill_misconception_ids: null,
        },
      },
      false
    );
    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should initialize component properties after controller is initialized', () => {
    spyOn(
      userExplorationPermissionsService,
      'getPermissionsAsync'
    ).and.returnValue(
      Promise.resolve({
        canUnpublish: false,
        canReleaseOwnership: false,
        canPublish: false,
        canVoiceover: true,
        canDelete: false,
        canModifyRoles: false,
        canEdit: false,
        canManageVoiceArtist: false,
      } as ExplorationPermissions)
    );

    component.ngOnInit();

    expect(component.isTranslationTabBusy).toBe(false);
    expect(component.showTranslationTabSubDirectives).toBe(false);
    expect(component.tutorialInProgress).toBe(false);
  });

  it(
    'should load translation tab data when translation tab page is' +
      ' refreshed',
    fakeAsync(() => {
      spyOn(loaderService, 'hideLoadingScreen');
      spyOn(
        userExplorationPermissionsService,
        'getPermissionsAsync'
      ).and.returnValue(
        Promise.resolve({
          canUnpublish: false,
          canReleaseOwnership: false,
          canPublish: false,
          canVoiceover: true,
          canDelete: false,
          canModifyRoles: false,
          canEdit: false,
          canManageVoiceArtist: false,
        } as ExplorationPermissions)
      );

      component.ngOnInit();
      tick();

      refreshTranslationTabEmitter.emit();
      tick();

      expect(component.showTranslationTabSubDirectives).toBe(true);
      expect(loaderService.hideLoadingScreen).toHaveBeenCalled();
    })
  );

  it(
    'should start tutorial if in tutorial mode on page load with' +
      ' permissions',
    fakeAsync(() => {
      component.permissions = {
        canVoiceover: true,
      };
      spyOn(
        userExplorationPermissionsService,
        'getPermissionsAsync'
      ).and.returnValue(
        Promise.resolve({
          canUnpublish: false,
          canReleaseOwnership: false,
          canPublish: false,
          canVoiceover: true,
          canDelete: false,
          canModifyRoles: false,
          canEdit: false,
          canManageVoiceArtist: false,
        } as ExplorationPermissions)
      );

      spyOn(component, 'startTutorial').and.callThrough();

      editabilityService.onStartTutorial();
      component.ngOnInit();
      component.initTranslationTab();
      component.startTutorial();

      expect(component.startTutorial).toHaveBeenCalled();
      expect(component.tutorialInProgress).toBe(true);

      component.leaveTutorial();
      expect(editabilityService.inTutorialMode()).toBe(false);
      expect(component.tutorialInProgress).toBe(false);
    })
  );

  it(
    'should not start tutorial if in tutorial mode on page load but' +
      ' no permissions',
    () => {
      component.permissions = {
        canVoiceover: false,
      };

      editabilityService.onStartTutorial();
      component.ngOnInit();

      component.initTranslationTab();

      expect(component.tutorialInProgress).toBe(false);
    }
  );

  it('should not start tutorial if not in tutorial mode on page load', () => {
    spyOn(
      userExplorationPermissionsService,
      'getPermissionsAsync'
    ).and.returnValue(
      Promise.resolve({
        canUnpublish: false,
        canReleaseOwnership: false,
        canPublish: false,
        canVoiceover: true,
        canDelete: false,
        canModifyRoles: false,
        canEdit: false,
        canManageVoiceArtist: false,
      } as ExplorationPermissions)
    );

    editabilityService.onEndTutorial();
    component.ngOnInit();

    component.initTranslationTab();

    expect(editabilityService.inTutorialMode()).toBe(false);
    expect(component.tutorialInProgress).toBe(false);
  });

  it(
    'should finish tutorial on clicking the end tutorial button when' +
      ' it has already started',
    fakeAsync(() => {
      spyOn(editabilityService, 'onEndTutorial');
      spyOn(stateTutorialFirstTimeService, 'markTranslationTutorialFinished');
      spyOn(
        userExplorationPermissionsService,
        'getPermissionsAsync'
      ).and.returnValue(
        Promise.resolve({
          canUnpublish: false,
          canReleaseOwnership: false,
          canPublish: false,
          canVoiceover: true,
          canDelete: false,
          canModifyRoles: false,
          canEdit: false,
          canManageVoiceArtist: false,
        } as ExplorationPermissions)
      );

      component.ngOnInit();

      editabilityService.onStartTutorial();
      component.leaveTutorial();

      expect(component.tutorialInProgress).toBe(false);
      expect(
        stateTutorialFirstTimeService.markTranslationTutorialFinished
      ).toHaveBeenCalled();
    })
  );

  it('should skip tutorial when the skip tutorial button is clicked', fakeAsync(() => {
    spyOn(editabilityService, 'onEndTutorial');
    spyOn(stateTutorialFirstTimeService, 'markTranslationTutorialFinished');
    spyOn(
      userExplorationPermissionsService,
      'getPermissionsAsync'
    ).and.returnValue(
      Promise.resolve({
        canUnpublish: false,
        canReleaseOwnership: false,
        canPublish: false,
        canVoiceover: true,
        canDelete: false,
        canModifyRoles: false,
        canEdit: false,
        canManageVoiceArtist: false,
      } as ExplorationPermissions)
    );

    component.ngOnInit();

    editabilityService.onStartTutorial();
    component.leaveTutorial();

    expect(component.tutorialInProgress).toBe(false);
    expect(
      stateTutorialFirstTimeService.markTranslationTutorialFinished
    ).toHaveBeenCalled();
  }));

  it('should start tutorial when welcome translation modal is closed', fakeAsync(() => {
    spyOn(
      userExplorationPermissionsService,
      'getPermissionsAsync'
    ).and.returnValue(
      Promise.resolve({
        canVoiceover: true,
      } as ExplorationPermissions)
    );

    component.ngOnInit();

    spyOn(siteAnalyticsService, 'registerAcceptTutorialModalEvent');
    spyOn(ngbModal, 'open').and.returnValue({
      result: Promise.resolve('exp1'),
    } as NgbModalRef);
    enterTranslationForTheFirstTimeEmitter.emit();
    tick();

    expect(
      siteAnalyticsService.registerAcceptTutorialModalEvent
    ).toHaveBeenCalled();
  }));

  it(
    'should finish translation tutorial when welcome translation modal is' +
      ' dismissed',
    fakeAsync(() => {
      spyOn(
        userExplorationPermissionsService,
        'getPermissionsAsync'
      ).and.returnValue(
        Promise.resolve({
          canVoiceover: true,
        } as ExplorationPermissions)
      );
      component.ngOnInit();

      spyOn(
        stateTutorialFirstTimeService,
        'markTranslationTutorialFinished'
      ).and.stub();
      spyOn(
        siteAnalyticsService,
        'registerDeclineTutorialModalEvent'
      ).and.stub();
      spyOn(ngbModal, 'open').and.returnValue({
        result: Promise.reject('exp1'),
      } as NgbModalRef);
      enterTranslationForTheFirstTimeEmitter.emit();
      tick();

      expect(
        siteAnalyticsService.registerDeclineTutorialModalEvent
      ).toHaveBeenCalledWith('exp1');
      expect(
        stateTutorialFirstTimeService.markTranslationTutorialFinished
      ).toHaveBeenCalled();
    })
  );

  it('should smoothly scroll to target position', () => {
    let scrollToSpy = spyOn(window, 'scrollTo');
    let callbacks: FrameRequestCallback[] = [];
    spyOn(window, 'requestAnimationFrame').and.callFake(
      (cb: FrameRequestCallback) => {
        callbacks.push(cb);
        return 1;
      }
    );
    let mockPerformanceNow = spyOn(performance, 'now');

    mockPerformanceNow.and.returnValue(0);
    // eslint-disable-next-line dot-notation
    component['smoothScrollTo'](100, 1000);

    expect(callbacks.length).toBe(1);

    mockPerformanceNow.and.returnValue(100);
    callbacks[0](100);
    expect(scrollToSpy).toHaveBeenCalledWith(0, jasmine.any(Number));
    expect(callbacks.length).toBe(2);

    mockPerformanceNow.and.returnValue(600);
    callbacks[1](600);
    expect(callbacks.length).toBe(3);

    mockPerformanceNow.and.returnValue(1000);
    callbacks[2](1000);
    expect(scrollToSpy).toHaveBeenCalledWith(0, 100);
    expect(callbacks.length).toBe(3);
  });

  it('should trigger all tutorial tour step callbacks, done button, and cancel events', fakeAsync(() => {
    interface TourStep {
      id: string;
      buttons: {text: string; action?: () => void}[];
      when?: {
        show?: () => void;
      };
    }

    interface TestShepherdService {
      steps: TourStep[];
      tourObject: {
        on: (eventName: string, cb: () => void) => void;
        start: () => void;
        complete: () => void;
        cancel: () => void;
      } | null;
      addSteps: (steps: object[]) => void;
    }

    const shepherdService = TestBed.inject(
      ShepherdService
    ) as unknown as TestShepherdService;

    component.permissions = {
      canVoiceover: true,
    };

    const smoothScrollToSpy = spyOn(
      component as unknown as {
        smoothScrollTo: (targetY: number, duration: number) => void;
      },
      'smoothScrollTo'
    );
    // eslint-disable-next-line dot-notation
    const tickSpy = spyOn(component['applicationRef'], 'tick');

    const registeredCallbacks: Record<string, () => void> = {};
    spyOn(shepherdService, 'addSteps').and.callFake((steps: object[]) => {
      shepherdService.steps = steps as unknown as TourStep[];
      shepherdService.tourObject = {
        on: (eventName: string, cb: () => void) => {
          registeredCallbacks[eventName] = cb;
        },
        start: () => {},
        complete: () => {},
        cancel: () => {},
      };
    });

    component.startTutorial();
    tick();

    const steps = shepherdService.steps;
    expect(steps.length).toBeGreaterThan(0);

    steps.forEach(step => {
      if (step.when && typeof step.when.show === 'function') {
        step.when.show();
      }
    });

    expect(smoothScrollToSpy).toHaveBeenCalled();

    const lastStep = steps[steps.length - 1];
    const doneButton = lastStep.buttons.find(btn => btn.text === 'Done');
    expect(doneButton).toBeDefined();
    if (doneButton && doneButton.action) {
      doneButton.action();
    }
    expect(component.tutorialInProgress).toBe(false);

    component.tutorialInProgress = true;
    expect(registeredCallbacks.cancel).toBeDefined();
    registeredCallbacks.cancel();
    expect(tickSpy).toHaveBeenCalled();
    expect(component.tutorialInProgress).toBe(false);
  }));

  it('should add step counters even if buttons are missing and cover step counter action', () => {
    interface StepWithButtons {
      buttons?: {text: string; classes?: string; action?: () => void}[];
    }
    const stepsWithoutButtons: StepWithButtons[] = [{}];
    // eslint-disable-next-line dot-notation
    component['addStepCounters'](stepsWithoutButtons);
    const step = stepsWithoutButtons[0];
    expect(step.buttons).toBeDefined();
    if (step.buttons) {
      expect(step.buttons.length).toBe(1);
      expect(step.buttons[0].text).toBe('1/1');
      expect(step.buttons[0].classes).toBe('shepherd-step-counter');

      expect(step.buttons[0].action).toBeDefined();
      if (step.buttons[0].action) {
        step.buttons[0].action();
      }
    }
  });

  it('should not start tutorial', () => {
    component.tutorialInProgress = false;
    // This throws "Type 'null' is not assignable to parameter of
    // type '{ canVoiceover: boolean; }'." We need to suppress this
    // error because of the need to test validations. This throws an
    // error because the permissions are not initialized in the test.
    // @ts-ignore
    component.permissions = null;
    component.startTutorial();
    component.permissions = {
      canVoiceover: false,
    };
    component.startTutorial();

    expect(component.tutorialInProgress).toBe(false);
  });

  it('should return early from startTutorial if another tour started while permissions were loading', fakeAsync(() => {
    component.tutorialInProgress = false;
    // This throws "Type 'null' is not assignable to parameter of
    // type '{ canVoiceover: boolean; }'." We need to suppress this
    // error because permissions are null before fetching.
    // @ts-ignore
    component.permissions = null;

    component.startTutorial();

    component.tutorialInProgress = true;

    tick();

    expect(component.tutorialInProgress).toBe(true);
  }));
});
