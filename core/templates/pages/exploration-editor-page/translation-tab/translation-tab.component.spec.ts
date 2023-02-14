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

import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { LoaderService } from 'services/loader.service';
import { ContextService } from 'services/context.service';
import { UserExplorationPermissionsService } from 'pages/exploration-editor-page/services/user-exploration-permissions.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { StateEditorService } from 'components/state-editor/state-editor-properties-services/state-editor.service';
import { EditabilityService } from 'services/editability.service';
import { ExplorationStatesService } from '../services/exploration-states.service';
import { RouterService } from '../services/router.service';
import { StateTutorialFirstTimeService } from '../services/state-tutorial-first-time.service';
import { TranslationTabComponent } from './translation-tab.component';
import { ExplorationPermissions } from 'domain/exploration/exploration-permissions.model';
import {
  JoyrideDirective,
  JoyrideOptionsService,
  JoyrideService,
  JoyrideStepsContainerService,
  JoyrideStepService
  // This throws "Object is possibly undefined." The type undefined
  // comes here from ngx joyride dependency. We need to suppress this
  // error because of strict type checking. This error is thrown because
  // the type of the variable is undefined.
  // @ts-ignore
} from 'ngx-joyride';

class MockNgbModal {
  open() {
    return {
      result: Promise.resolve()
    };
  }
}

class MockContextservice {
  getExplorationId() {
    return 'exp1';
  }
}

describe('Translation tab component', () => {
  let component: TranslationTabComponent;
  let fixture: ComponentFixture<TranslationTabComponent>;
  let ngbModal: NgbModal;
  let contextService: ContextService;
  let editabilityService: EditabilityService;
  let explorationStatesService: ExplorationStatesService;
  let loaderService: LoaderService;
  let routerService: RouterService;
  let siteAnalyticsService: SiteAnalyticsService;
  let stateEditorService: StateEditorService;
  let stateTutorialFirstTimeService: StateTutorialFirstTimeService;
  let userExplorationPermissionsService: UserExplorationPermissionsService;
  let refreshTranslationTabEmitter = new EventEmitter<void>();
  let enterTranslationForTheFirstTimeEmitter = new EventEmitter<string>();

  class MockJoyrideService {
    startTour() {
      return {
        subscribe: (
            value1: (arg0: { number: number }) => void,
            value2: () => void,
            value3: () => void
        ) => {
          value1({number: 2});
          value1({number: 4});
          value1({number: 6});
          value1({number: 8});
          value2();
          value3();
        }
      };
    }

    closeTour() {}
  }

  class MockUserExplorationPermissionsService {
    getPermissionsAsync() {
      return Promise.resolve({
        canVoiceover: true
      } as ExplorationPermissions);
    }

    fetchPermissionsAsync() {
      return Promise.resolve({
        canVoiceover: true
      } as ExplorationPermissions);
    }
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      declarations: [
        TranslationTabComponent,
        JoyrideDirective,
      ],
      providers: [
        JoyrideStepService,
        JoyrideOptionsService,
        JoyrideStepsContainerService,
        // The UserExplorationPermissionsService has been
        // mocked here because spying the function of
        // UserExplorationPermissionsService is not able to
        // stop afterAll error i.e. ContextService should not
        // be used outside the context of an exploration or a question.
        {
          provide: UserExplorationPermissionsService,
          useClass: MockUserExplorationPermissionsService,
        },
        {
          provide: JoyrideService,
          useClass: MockJoyrideService,
        },
        {
          provide: NgbModal,
          useClass: MockNgbModal
        },
        {
          provide: ContextService,
          useClass: MockContextservice
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TranslationTabComponent);
    component = fixture.componentInstance;

    contextService = TestBed.inject(ContextService);
    loaderService = TestBed.inject(LoaderService);
    siteAnalyticsService = TestBed.inject(SiteAnalyticsService);
    userExplorationPermissionsService = TestBed.inject(
      UserExplorationPermissionsService);
    editabilityService = TestBed.inject(EditabilityService);
    explorationStatesService = TestBed.inject(ExplorationStatesService);
    routerService = TestBed.inject(RouterService);
    stateEditorService = TestBed.inject(StateEditorService);
    ngbModal = TestBed.inject(NgbModal);
    stateTutorialFirstTimeService = TestBed.inject(
      StateTutorialFirstTimeService);

    spyOn(contextService, 'getExplorationId').and.returnValue('exp1');
    spyOn(stateEditorService, 'getActiveStateName').and.returnValue(
      'Introduction');
    spyOnProperty(
      stateTutorialFirstTimeService, 'onEnterTranslationForTheFirstTime')
      .and.returnValue(enterTranslationForTheFirstTimeEmitter);
    spyOnProperty(routerService, 'onRefreshTranslationTab')
      .and.returnValue(refreshTranslationTabEmitter);
    let element = document.createElement('div');
    spyOn(document, 'querySelector').and.returnValue((
      element as HTMLElement));

    explorationStatesService.init({
      Introduction: {
        classifier_model_id: null,
        card_is_checkpoint: false,
        content: {
          content_id: 'content',
          html: 'Introduction Content'
        },
        interaction: {
          confirmed_unclassified_answers: [],
          id: 'TextInput',
          customization_args: {
            placeholder: {value: {
              content_id: 'ca_placeholder',
              unicode_str: ''
            }},
            rows: {value: 1},
            catchMisspellings: {
              value: false
            }
          },
          answer_groups: [{
            rule_specs: [],
            training_data: [],
            tagged_skill_misconception_id: null,
            outcome: {
              missing_prerequisite_skill_id: null,
              dest: 'unused',
              dest_if_really_stuck: null,
              feedback: {
                content_id: 'feedback_1',
                html: ''
              },
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null
            }
          }],
          default_outcome: {
            missing_prerequisite_skill_id: null,
            dest: 'default',
            dest_if_really_stuck: null,
            feedback: {
              content_id: 'default_outcome',
              html: ''
            },
            labelled_as_correct: false,
            param_changes: [],
            refresher_exploration_id: null
          },
          solution: {
            correct_answer: 'This is the correct answer',
            answer_is_exclusive: false,
            explanation: {
              html: 'Solution explanation',
              content_id: 'content_4'
            }
          },
          hints: []
        },
        linked_skill_id: null,
        param_changes: [],
        solicit_answer_details: false,
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {},
            default_outcome: {},
            feedback_1: {
              en: {
                filename: 'myfile2.mp3',
                file_size_bytes: 120000,
                needs_update: false,
                duration_secs: 1.2
              }
            }
          }
        }
      }
    }, false);
    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should initialize component properties after controller is initialized',
    () => {
      spyOn(userExplorationPermissionsService, 'getPermissionsAsync').and
        .returnValue(Promise.resolve({
          canVoiceover: true
        } as ExplorationPermissions));

      component.ngOnInit();

      expect(component.isTranslationTabBusy).toBe(false);
      expect(component.showTranslationTabSubDirectives).toBe(false);
      expect(component.tutorialInProgress).toBe(false);
    });

  it('should load translation tab data when translation tab page is' +
    ' refreshed', fakeAsync(() => {
    spyOn(loaderService, 'hideLoadingScreen');
    spyOn(userExplorationPermissionsService, 'getPermissionsAsync').and
      .returnValue(Promise.resolve({
        canVoiceover: true
      } as ExplorationPermissions));

    component.ngOnInit();
    tick();

    refreshTranslationTabEmitter.emit();
    tick();

    expect(component.showTranslationTabSubDirectives).toBe(true);
    expect(loaderService.hideLoadingScreen).toHaveBeenCalled();
  }));

  it('should start tutorial if in tutorial mode on page load with' +
    ' permissions', fakeAsync(() => {
    component.permissions = {
      canVoiceover: true
    };
    spyOn(userExplorationPermissionsService, 'getPermissionsAsync').and
      .returnValue(Promise.resolve({
        canVoiceover: true
      } as ExplorationPermissions));

    spyOn(component, 'startTutorial').and.callThrough();

    editabilityService.onStartTutorial();
    component.ngOnInit();
    component.initTranslationTab();
    component.startTutorial();


    expect(editabilityService.inTutorialMode()).toBe(false);
    expect(component.startTutorial).toHaveBeenCalled();
    expect(component.tutorialInProgress).toBe(false);
  }));

  it('should not start tutorial if in tutorial mode on page load but' +
    ' no permissions', () => {
    component.permissions = {
      canVoiceover: true
    };

    spyOn(userExplorationPermissionsService, 'getPermissionsAsync').and
      .returnValue(Promise.resolve({} as ExplorationPermissions));

    editabilityService.onStartTutorial();
    component.ngOnInit();

    component.initTranslationTab();

    expect(editabilityService.inTutorialMode()).toBe(false);
    expect(component.tutorialInProgress).toBe(false);
  });

  it('should not start tutorial if not in tutorial mode on page load', () => {
    spyOn(userExplorationPermissionsService, 'getPermissionsAsync').and
      .returnValue(Promise.resolve({
        canVoiceover: true
      } as ExplorationPermissions));

    editabilityService.onEndTutorial();
    component.ngOnInit();

    component.initTranslationTab();

    expect(editabilityService.inTutorialMode()).toBe(false);
    expect(component.tutorialInProgress).toBe(false);
  });

  it('should finish tutorial on clicking the end tutorial button when' +
    ' it has already started', fakeAsync(() => {
    spyOn(editabilityService, 'onEndTutorial');
    spyOn(stateTutorialFirstTimeService, 'markTranslationTutorialFinished');
    spyOn(userExplorationPermissionsService, 'getPermissionsAsync').and
      .returnValue(Promise.resolve({
        canVoiceover: true
      } as ExplorationPermissions));

    component.ngOnInit();

    editabilityService.onStartTutorial();
    component.leaveTutorial();

    expect(component.tutorialInProgress).toBe(false);
    expect(stateTutorialFirstTimeService.markTranslationTutorialFinished)
      .toHaveBeenCalled();
  }));

  it('should skip tutorial when the skip tutorial button is clicked',
    fakeAsync(() => {
      spyOn(editabilityService, 'onEndTutorial');
      spyOn(stateTutorialFirstTimeService, 'markTranslationTutorialFinished');
      spyOn(userExplorationPermissionsService, 'getPermissionsAsync').and
        .returnValue(Promise.resolve({
          canVoiceover: true
        } as ExplorationPermissions));

      component.ngOnInit();

      editabilityService.onStartTutorial();
      component.leaveTutorial();

      expect(component.tutorialInProgress).toBe(false);
      expect(stateTutorialFirstTimeService.markTranslationTutorialFinished)
        .toHaveBeenCalled();
    }));

  it('should start tutorial when welcome translation modal is closed',
    fakeAsync(() => {
      spyOn(userExplorationPermissionsService, 'getPermissionsAsync').and
        .returnValue(Promise.resolve({
          canVoiceover: true
        } as ExplorationPermissions));

      component.ngOnInit();

      spyOn(siteAnalyticsService, 'registerAcceptTutorialModalEvent');
      spyOn(ngbModal, 'open').and.returnValue({
        result: Promise.resolve('exp1')
      } as NgbModalRef);
      enterTranslationForTheFirstTimeEmitter.emit();
      tick();

      expect(siteAnalyticsService.registerAcceptTutorialModalEvent)
        .toHaveBeenCalled();
    }));

  it('should finish translation tutorial when welcome translation modal is' +
    ' dismissed', fakeAsync(() => {
    spyOn(userExplorationPermissionsService, 'getPermissionsAsync').and
      .returnValue(Promise.resolve({
        canVoiceover: true
      } as ExplorationPermissions));
    component.ngOnInit();

    spyOn(stateTutorialFirstTimeService, 'markTranslationTutorialFinished')
      .and.stub();
    spyOn(siteAnalyticsService, 'registerDeclineTutorialModalEvent').and.stub();
    spyOn(ngbModal, 'open').and.returnValue({
      result: Promise.reject('exp1')
    } as NgbModalRef);
    enterTranslationForTheFirstTimeEmitter.emit();
    tick();


    expect(siteAnalyticsService.registerDeclineTutorialModalEvent)
      .toHaveBeenCalledWith('exp1');
    expect(stateTutorialFirstTimeService.markTranslationTutorialFinished)
      .toHaveBeenCalled();
  }));

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
});
