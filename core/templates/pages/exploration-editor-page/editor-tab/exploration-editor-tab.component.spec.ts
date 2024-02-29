// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the component of the 'State Editor'.
 */

import { EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { fakeAsync, TestBed, tick, flush, ComponentFixture, waitForAsync } from '@angular/core/testing';
import { AnswerGroupObjectFactory } from 'domain/exploration/AnswerGroupObjectFactory';
import { ExplorationFeaturesService } from 'services/exploration-features.service';
import { Hint } from 'domain/exploration/hint-object.model';
import { OutcomeObjectFactory } from 'domain/exploration/OutcomeObjectFactory';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { StateCardIsCheckpointService } from 'components/state-editor/state-editor-properties-services/state-card-is-checkpoint.service';
import { StateEditorService } from 'components/state-editor/state-editor-properties-services/state-editor.service';
import { SolutionObjectFactory } from 'domain/exploration/SolutionObjectFactory';
import { SubtitledUnicode } from 'domain/exploration/SubtitledUnicodeObjectFactory';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';
import { ExplorationDataService } from '../services/exploration-data.service';
import { GenerateContentIdService } from 'services/generate-content-id.service';
import { EditabilityService } from 'services/editability.service';
import { ExplorationInitStateNameService } from '../services/exploration-init-state-name.service';
import { ExplorationStatesService } from '../services/exploration-states.service';
import { ExplorationWarningsService } from '../services/exploration-warnings.service';
import { RouterService } from '../services/router.service';
import { StateEditorRefreshService } from '../services/state-editor-refresh.service';
import { UserExplorationPermissionsService } from '../services/user-exploration-permissions.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { ExplorationEditorTabComponent } from './exploration-editor-tab.component';
import { DomRefService, JoyrideDirective, JoyrideOptionsService, JoyrideService, JoyrideStepsContainerService, JoyrideStepService, LoggerService, TemplatesService } from 'ngx-joyride';
import { Router } from '@angular/router';
import { ExplorationPermissions } from 'domain/exploration/exploration-permissions.model';
import { State, StateBackendDict, StateObjectFactory } from 'domain/state/StateObjectFactory';
import { Interaction } from 'domain/exploration/InteractionObjectFactory';
import { ContextService } from 'services/context.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { ExplorationNextContentIdIndexService } from '../services/exploration-next-content-id-index.service';
import { VersionHistoryService } from '../services/version-history.service';
import { VersionHistoryBackendApiService } from '../services/version-history-backend-api.service';

describe('Exploration editor tab component', () => {
  let component: ExplorationEditorTabComponent;
  let fixture: ComponentFixture<ExplorationEditorTabComponent>;
  let answerGroupObjectFactory: AnswerGroupObjectFactory;
  let editabilityService: EditabilityService;
  let explorationFeaturesService: ExplorationFeaturesService;
  let explorationInitStateNameService: ExplorationInitStateNameService;
  let explorationStatesService: ExplorationStatesService;
  let explorationWarningsService: ExplorationWarningsService;
  let outcomeObjectFactory: OutcomeObjectFactory;
  let routerService: RouterService;
  let siteAnalyticsService: SiteAnalyticsService;
  let stateEditorRefreshService: StateEditorRefreshService;
  let solutionObjectFactory: SolutionObjectFactory;
  let stateCardIsCheckpointService: StateCardIsCheckpointService;
  let stateEditorService: StateEditorService;
  let userExplorationPermissionsService: UserExplorationPermissionsService;
  let focusManagerService: FocusManagerService;
  let contextService: ContextService;
  var generateContentIdService: GenerateContentIdService;
  var explorationNextContentIdIndexService:
    ExplorationNextContentIdIndexService;
  let mockRefreshStateEditorEventEmitter = null;
  let versionHistoryService: VersionHistoryService;
  let stateObjectFactory: StateObjectFactory;
  let stateObject: StateBackendDict;
  let versionHistoryBackendApiService: VersionHistoryBackendApiService;

  class MockJoyrideService {
    startTour() {
      return {
        subscribe: (value1, value2, value3) => {
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

  class MockWindowRef {
    location = { path: '/create/2234' };
    nativeWindow = {
      scrollTo: (value1, value2) => {},
      sessionStorage: {
        promoIsDismissed: null,
        setItem: (testKey1, testKey2) => {},
        removeItem: (testKey) => {}
      },
      gtag: (value1, value2, value3) => {},
      navigator: {
        onLine: true,
        userAgent: null
      },
      location: {
        path: '/create/2234',
        pathname: '/',
        hostname: 'oppiaserver.appspot.com',
        search: '',
        protocol: '',
        reload: () => {},
        hash: '',
        href: '',
      },
      document: {
        documentElement: {
          setAttribute: (value1, value2) => {},
          clientWidth: null,
          clientHeight: null,
        },
        body: {
          clientWidth: null,
          clientHeight: null,
          style: {
            overflowY: ''
          }
        }
      },
      addEventListener: (value1, value2) => {}
    };
  }

  class MockRouter {}

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        FormsModule,
      ],
      declarations: [
        JoyrideDirective,
        ExplorationEditorTabComponent,
      ],
      providers: [
        JoyrideStepService,
        {
          provide: Router,
          useClas: MockRouter,
        },
        TemplatesService,
        {
          provide: WindowRef,
          useClass: MockWindowRef
        },
        JoyrideOptionsService,
        JoyrideStepsContainerService,
        LoggerService,
        DomRefService,
        {
          provide: JoyrideService,
          useClass: MockJoyrideService,
        },
        {
          provide: ExplorationDataService,
          useValue: {
            explorationId: 0,
            autosaveChangeListAsync() {
              return;
            }
          }
        },
        VersionHistoryService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExplorationEditorTabComponent);
    component = fixture.componentInstance;

    answerGroupObjectFactory = TestBed.inject(AnswerGroupObjectFactory);
    explorationFeaturesService = TestBed.inject(ExplorationFeaturesService);
    generateContentIdService = TestBed.inject(GenerateContentIdService);
    outcomeObjectFactory = TestBed.inject(OutcomeObjectFactory);
    solutionObjectFactory = TestBed.inject(SolutionObjectFactory);
    focusManagerService = TestBed.inject(FocusManagerService);
    stateEditorService = TestBed.inject(StateEditorService);
    stateCardIsCheckpointService = TestBed.inject(
      StateCardIsCheckpointService);
    editabilityService = TestBed.inject(EditabilityService);
    focusManagerService = TestBed.inject(FocusManagerService);
    explorationInitStateNameService = TestBed.inject(
      ExplorationInitStateNameService);
    explorationStatesService = TestBed.inject(ExplorationStatesService);
    explorationWarningsService = TestBed.inject(ExplorationWarningsService);
    routerService = TestBed.inject(RouterService);
    siteAnalyticsService = TestBed.inject(SiteAnalyticsService);
    stateEditorRefreshService = TestBed.inject(StateEditorRefreshService);
    userExplorationPermissionsService = TestBed.inject(
      UserExplorationPermissionsService);
    contextService = TestBed.inject(ContextService);
    explorationNextContentIdIndexService = TestBed.inject(
      ExplorationNextContentIdIndexService);
    versionHistoryService = TestBed.inject(VersionHistoryService);
    stateObjectFactory = TestBed.inject(StateObjectFactory);
    versionHistoryBackendApiService = TestBed.inject(
      VersionHistoryBackendApiService);

    mockRefreshStateEditorEventEmitter = new EventEmitter();
    spyOn(contextService, 'getExplorationId').and.returnValue(
      'explorationId');
    spyOn(stateEditorService, 'checkEventListenerRegistrationStatus')
      .and.returnValue(true);
    spyOn(document, 'getElementById').and.returnValue({
      offsetTop: 400
    } as HTMLElement);
    spyOnProperty(
      stateEditorRefreshService, 'onRefreshStateEditor').and.returnValue(
      mockRefreshStateEditorEventEmitter);
    let element = document.createElement('div');
    spyOn(document, 'querySelector').and.returnValue((
      element as HTMLElement));
    spyOn(
      versionHistoryService, 'getLatestVersionOfExploration'
    ).and.returnValue(3);

    stateObject = {
      classifier_model_id: null,
      content: {
        content_id: 'content',
        html: ''
      },
      recorded_voiceovers: {
        voiceovers_mapping: {
          content: {},
          default_outcome: {}
        }
      },
      interaction: {
        answer_groups: [],
        confirmed_unclassified_answers: [],
        customization_args: {
          rows: {
            value: 1
          },
          placeholder: {
            value: {
              unicode_str: 'Type your answer here.',
              content_id: ''
            }
          }
        },
        default_outcome: {
          dest: '(untitled state)',
          dest_if_really_stuck: null,
          feedback: {
            content_id: 'default_outcome',
            html: ''
          },
          param_changes: [],
          labelled_as_correct: false,
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null
        },
        hints: [],
        solution: null,
        id: 'TextInput'
      },
      linked_skill_id: null,
      param_changes: [],
      solicit_answer_details: false,
      card_is_checkpoint: false
    };

    explorationStatesService.init({
      'First State': {
        classifier_model_id: null,
        card_is_checkpoint: true,
        content: {
          content_id: 'content',
          html: 'First State Content'
        },
        interaction: {
          id: 'TextInput',
          confirmed_unclassified_answers: null,
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
            training_data: null,
            tagged_skill_misconception_id: null,
            outcome: {
              dest: 'unused',
              missing_prerequisite_skill_id: null,
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
            dest: 'default',
            dest_if_really_stuck: null,
            missing_prerequisite_skill_id: null,
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
      },
      'Second State': {
        classifier_model_id: null,
        card_is_checkpoint: false,
        content: {
          content_id: 'content',
          html: 'Second State Content'
        },
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {},
            default_outcome: {},
            feedback_1: {}
          }
        },
        interaction: {
          id: 'TextInput',
          confirmed_unclassified_answers: null,
          solution: null,
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
            training_data: null,
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
            dest: 'default',
            dest_if_really_stuck: null,
            feedback: {
              content_id: 'default_outcome',
              html: ''
            },
            missing_prerequisite_skill_id: null,
            labelled_as_correct: false,
            param_changes: [],
            refresher_exploration_id: null
          },
          hints: []
        },
        linked_skill_id: null,
        param_changes: [],
        solicit_answer_details: false
      }
    }, false);

    component.ngOnInit();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should apply autofocus to elements in active tab', () => {
    spyOn(routerService, 'getActiveTabName').and.returnValues(
      'main', 'feedback', 'history');
    spyOn(focusManagerService, 'setFocus');

    component.windowOnload();

    expect(component.TabName).toBe('main');
    expect(focusManagerService.setFocus).toHaveBeenCalledWith(
      'oppiaEditableSection');

    component.windowOnload();

    expect(component.TabName).toBe('feedback');
    expect(focusManagerService.setFocus).toHaveBeenCalledWith(
      'newThreadButton');

    component.windowOnload();

    expect(component.TabName).toBe('history');
    expect(focusManagerService.setFocus).toHaveBeenCalledWith(
      'usernameInputField');
  });

  it('should call focus method when window loads', fakeAsync(() => {
    stateEditorService.setActiveStateName('First State');
    let ctrlSpy = spyOn(component, 'windowOnload');
    component.initStateEditor();

    tick();
    flush();

    expect(ctrlSpy).toHaveBeenCalled();
  }));

  it('should initialize controller properties after its initialization',
    () => {
      expect(component.interactionIsShown).toBe(false);
    });

  it('should correctly initialize generateContentIdService', () => {
    explorationNextContentIdIndexService.init(5);

    generateContentIdService.getNextStateId('content');
    expect(explorationNextContentIdIndexService.displayed).toBe(6);
    expect(explorationNextContentIdIndexService.savedMemento).toBe(5);

    generateContentIdService.revertUnusedContentIdIndex();
    expect(explorationNextContentIdIndexService.displayed).toBe(5);
    expect(explorationNextContentIdIndexService.savedMemento).toBe(5);
  });

  it('should correctly save next contentId index', () => {
    explorationNextContentIdIndexService.init(5);
    generateContentIdService.getNextStateId('content');
    expect(explorationNextContentIdIndexService.displayed).toBe(6);
    expect(explorationNextContentIdIndexService.savedMemento).toBe(5);

    component.saveNextContentIdIndex();

    expect(explorationNextContentIdIndexService.displayed).toBe(6);
    expect(explorationNextContentIdIndexService.savedMemento).toBe(6);
  });

  it('should get state content placeholder text when init state name' +
      ' is equal to active state name', () => {
    stateEditorService.setActiveStateName('First State');
    explorationInitStateNameService.init('First State');

    expect(component.getStateContentPlaceholder()).toBe(
      'This is the first card of your exploration. Use this space ' +
       'to introduce your topic and engage the learner, then ask ' +
       'them a question.');
  });

  it('should get state content placeholder text when init state name is' +
     ' different from active state name', () => {
    stateEditorService.setActiveStateName('First State');
    explorationInitStateNameService.init('Second State');

    expect(component.getStateContentPlaceholder()).toBe(
      'You can speak to the learner here, then ask them a question.');
  });

  it('should get state content save button placeholder', () => {
    expect(
      component.getStateContentSaveButtonPlaceholder()).toBe('Save Content');
  });

  it('should add state in exploration states', () => {
    spyOn(explorationStatesService, 'addState').and.callThrough();

    component.addState('Fourth State');

    expect(explorationStatesService.addState).toHaveBeenCalledWith(
      'Fourth State', null);
  });

  it('should refresh warnings', () => {
    spyOn(explorationWarningsService, 'updateWarnings');

    component.refreshWarnings();

    expect(explorationWarningsService.updateWarnings).toHaveBeenCalled();
  });

  it('should save state content', () => {
    stateEditorService.setActiveStateName('First State');
    expect(explorationStatesService.getState('First State').content).toEqual(
      SubtitledHtml.createFromBackendDict({
        content_id: 'content',
        html: 'First State Content'
      }));

    let displayedValue = SubtitledHtml.createFromBackendDict({
      content_id: 'content',
      html: 'First State Content Changed'
    });
    component.saveStateContent(displayedValue);

    expect(explorationStatesService.getState('First State').content).toEqual(
      displayedValue);
    expect(component.interactionIsShown).toBe(true);
  });

  it('should save state interaction data when customization args' +
      ' are changed', () => {
    stateEditorService.setActiveStateName('First State');
    stateEditorService.setInteraction(
      explorationStatesService.getState('First State').interaction);

    expect(stateEditorService.interaction.id).toBe('TextInput');
    expect(stateEditorService.interaction.customizationArgs).toEqual({
      rows: { value: 1 },
      placeholder: { value: new SubtitledUnicode('', 'ca_placeholder') },
      catchMisspellings: {
        value: false
      }
    });

    let newInteractionData = {
      interactionId: 'TextInput',
      customizationArgs: {
        placeholder: {
          value: new SubtitledUnicode('Placeholder value', 'ca_placeholder')
        },
        rows: {
          value: 2
        },
        catchMisspellings: {
          value: false
        }
      }
    };
    component.saveInteractionData(newInteractionData);

    expect(stateEditorService.interaction.id)
      .toBe(newInteractionData.interactionId);
    expect(stateEditorService.interaction.customizationArgs)
      .toEqual(newInteractionData.customizationArgs);
  });

  it('should save linked skill id', () => {
    stateEditorService.setActiveStateName('First State');
    expect(
      explorationStatesService.getState('First State').linkedSkillId
    ).toEqual(null);

    component.saveLinkedSkillId('skill_id1');
    expect(
      explorationStatesService.getState('First State').linkedSkillId
    ).toBe('skill_id1');
  });

  it('should save interaction answer groups', () => {
    stateEditorService.setActiveStateName('First State');
    stateEditorService.setInteraction(
      explorationStatesService.getState('First State').interaction);

    expect(stateEditorService.interaction.answerGroups).toEqual([
      answerGroupObjectFactory.createFromBackendDict({
        rule_specs: [],
        training_data: null,
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
      }, null)]);

    let displayedValue = [answerGroupObjectFactory.createFromBackendDict({
      rule_specs: [],
      outcome: {
        missing_prerequisite_skill_id: null,
        dest: 'Second State',
        dest_if_really_stuck: null,
        feedback: {
          content_id: 'feedback_1',
          html: ''
        },
        labelled_as_correct: false,
        param_changes: [],
        refresher_exploration_id: null
      },
      training_data: null,
      tagged_skill_misconception_id: ''
    }, null)];
    component.saveInteractionAnswerGroups(displayedValue);

    expect(stateEditorService.interaction.answerGroups)
      .toEqual(displayedValue);
  });

  it('should save interaction default outcome', () => {
    stateEditorService.setActiveStateName('First State');
    stateEditorService.setInteraction(
      explorationStatesService.getState('First State').interaction);

    expect(stateEditorService.interaction.defaultOutcome).toEqual(
      outcomeObjectFactory.createFromBackendDict({
        dest: 'default',
        dest_if_really_stuck: null,
        feedback: {
          content_id: 'default_outcome',
          html: ''
        },
        labelled_as_correct: false,
        param_changes: [],
        missing_prerequisite_skill_id: null,
        refresher_exploration_id: null
      }));

    let displayedValue = outcomeObjectFactory.createFromBackendDict({
      dest: 'Second State',
      dest_if_really_stuck: null,
      feedback: {
        content_id: 'default_outcome_changed',
        html: 'This is the default outcome changed'
      },
      missing_prerequisite_skill_id: null,
      labelled_as_correct: false,
      param_changes: [],
      refresher_exploration_id: null
    });
    component.saveInteractionDefaultOutcome(displayedValue);

    expect(stateEditorService.interaction.defaultOutcome).toEqual(
      displayedValue);
  });

  it('should save interaction solution', () => {
    stateEditorService.setActiveStateName('First State');
    stateEditorService.setInteraction(
      explorationStatesService.getState('First State').interaction);

    expect(stateEditorService.interaction.solution).toEqual(
      solutionObjectFactory.createFromBackendDict({
        correct_answer: 'This is the correct answer',
        answer_is_exclusive: false,
        explanation: {
          html: 'Solution explanation',
          content_id: 'content_4'
        }
      }));

    let displayedValue = solutionObjectFactory.createFromBackendDict({
      correct_answer: 'This is the second correct answer',
      answer_is_exclusive: true,
      explanation: {
        html: 'Solution complete explanation',
        content_id: 'content_4'
      }
    });
    component.saveSolution(displayedValue);

    expect(stateEditorService.interaction.solution).toEqual(
      displayedValue);
  });

  it('should save interaction hints', () => {
    stateEditorService.setActiveStateName('First State');
    stateEditorService.setInteraction(
      explorationStatesService.getState('First State').interaction);

    expect(stateEditorService.interaction.hints).toEqual([]);

    let displayedValue = [Hint.createFromBackendDict({
      hint_content: {
        content_id: '',
        html: 'This is a hint'
      }
    })];
    component.saveHints(displayedValue);

    expect(stateEditorService.interaction.hints).toEqual(
      displayedValue);
  });

  it('should save solicit answer details', () => {
    stateEditorService.setActiveStateName('First State');
    stateEditorService.setSolicitAnswerDetails(
      explorationStatesService.getState('First State').solicitAnswerDetails);

    expect(stateEditorService.solicitAnswerDetails).toBe(false);

    component.saveSolicitAnswerDetails(true);

    expect(stateEditorService.solicitAnswerDetails).toBe(true);
  });

  it('should save card is checkpoint on change', () => {
    stateEditorService.setActiveStateName('Second State');
    stateEditorService.setCardIsCheckpoint(
      explorationStatesService.getState('Second State').cardIsCheckpoint);

    expect(stateEditorService.cardIsCheckpoint).toBe(false);

    stateCardIsCheckpointService.displayed = true;
    component.onChangeCardIsCheckpoint();

    expect(stateEditorService.cardIsCheckpoint).toBe(true);
  });

  it('should navigate to main tab in specific state name', () => {
    spyOn(routerService, 'navigateToMainTab');

    let stateName = 'Second State';
    component.navigateToState(stateName);

    expect(routerService.navigateToMainTab).toHaveBeenCalledWith(stateName);
  });

  it('should evaluate if parameters are enabled', () => {
    let areParametersEnabledSpy = spyOn(
      explorationFeaturesService, 'areParametersEnabled');

    areParametersEnabledSpy.and.returnValue(true);
    expect(component.areParametersEnabled()).toBe(true);

    areParametersEnabledSpy.and.returnValue(false);
    expect(component.areParametersEnabled()).toBe(false);
  });

  it('should correctly broadcast the stateEditorInitialized flag with ' +
       'the state data', fakeAsync(() => {
    const state = new State(
      'stateName', 'id', 'some', null,
      new Interaction([], [], null, null, [], 'id', null),
      null, null, true, true);
    component.stateName = 'stateName';

    spyOn(explorationStatesService, 'getState').and.returnValues(
      state
    );
    spyOn(explorationStatesService, 'isInitialized')
      .and.returnValue(true);
    stateEditorService.setActiveStateName('Second State');
    stateEditorService.updateStateInteractionEditorInitialised();
    stateEditorService.updateStateResponsesInitialised();
    stateEditorService.updateStateEditorDirectiveInitialised();
    spyOn(component, 'initStateEditor').and.stub();

    mockRefreshStateEditorEventEmitter.emit();
    tick();
    component.initStateEditor();
    tick();

    expect(component.initStateEditor).toHaveBeenCalled();
  }));

  it('should start tutorial if in tutorial mode on page load', () => {
    const state = new State(
      'stateName', 'id', 'some', null,
      new Interaction([], [], null, null, [], 'id', null),
      null, null, true, true);
    component.stateName = 'stateName';
    spyOn(explorationStatesService, 'getState').and.returnValues(
      state
    );
    spyOn(explorationStatesService, 'isInitialized')
      .and.returnValue(true);
    spyOn(component, 'startTutorial');
    editabilityService.onStartTutorial();

    component.initStateEditor();
    mockRefreshStateEditorEventEmitter.emit();

    expect(component.startTutorial).toHaveBeenCalled();
  });

  it('should check if exploration is editable', () => {
    spyOn(editabilityService, 'isEditable').and.returnValue(true);
    expect(component.isEditable()).toBe(true);
  });

  it('should not start tutorial if not in tutorial mode on page load', () => {
    spyOn(component, 'startTutorial');
    editabilityService.onEndTutorial();

    component.initStateEditor();

    expect(component.startTutorial).not.toHaveBeenCalled();
  });

  it('should finish tutorial if finish tutorial button is clicked',
    fakeAsync(() => {
      let registerFinishTutorialEventSpy = (
        spyOn(siteAnalyticsService, 'registerFinishTutorialEvent'));
      spyOn(editabilityService, 'onEndTutorial');
      editabilityService.onStartTutorial();

      component.initStateEditor();
      component.leaveTutorial();
      tick();

      expect(registerFinishTutorialEventSpy).toHaveBeenCalled();
      expect(editabilityService.onEndTutorial).toHaveBeenCalled();
      expect(component.tutorialInProgress).toBe(false);

      flush();
      flush();
    }));

  it('should skip tutorial if skip tutorial button is clicked', () => {
    spyOn(editabilityService, 'onEndTutorial');
    spyOn(userExplorationPermissionsService, 'getPermissionsAsync')
      .and.returnValue(
        Promise.resolve({
          canEdit: false
        } as ExplorationPermissions)
      );
    editabilityService.onStartTutorial();

    component.initStateEditor();
    component.leaveTutorial();
    component.removeTutorialSaveButtonIfNoPermissions();

    expect(editabilityService.onEndTutorial).toHaveBeenCalled();
    expect(component.tutorialInProgress).toBe(false);
  });

  it('should get the last edited version number in case of error', () => {
    versionHistoryService.insertStateVersionHistoryData(4, null, '');

    expect(component.getLastEditedVersionNumberInCaseOfError()).toEqual(4);
  });

  it('should fetch the version history data on initialization of state editor',
    fakeAsync(() => {
      stateEditorService.setActiveStateName('First State');
      let stateData = stateObjectFactory.createFromBackendDict(
        'State', stateObject);
      spyOn(
        versionHistoryBackendApiService, 'fetchStateVersionHistoryAsync'
      ).and.resolveTo({
        lastEditedVersionNumber: 2,
        stateNameInPreviousVersion: 'State',
        stateInPreviousVersion: stateData,
        lastEditedCommitterUsername: 'some'
      });

      component.initStateEditor();
      tick();
      flush();

      expect(
        versionHistoryBackendApiService.fetchStateVersionHistoryAsync
      ).toHaveBeenCalled();
    }));

  it('should show error message if the backend api fails', fakeAsync(() => {
    stateEditorService.setActiveStateName('First State');
    spyOn(
      versionHistoryBackendApiService, 'fetchStateVersionHistoryAsync'
    ).and.resolveTo(null);

    expect(component.validationErrorIsShown).toBeFalse();

    component.initStateEditor();
    tick();
    flush();

    expect(component.validationErrorIsShown).toBeTrue();
  }));
});
