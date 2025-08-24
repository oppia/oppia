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

import {EventEmitter, NO_ERRORS_SCHEMA} from '@angular/core';
import {
  fakeAsync,
  TestBed,
  tick,
  flush,
  ComponentFixture,
  waitForAsync,
} from '@angular/core/testing';
import {AnswerGroup} from 'domain/exploration/answer-group.model';
import {ExplorationFeaturesService} from 'services/exploration-features.service';
import {Hint} from 'domain/exploration/hint-object.model';
import {Outcome} from 'domain/exploration/outcome.model';
import {SiteAnalyticsService} from 'services/site-analytics.service';
import {StateCardIsCheckpointService} from 'components/state-editor/state-editor-properties-services/state-card-is-checkpoint.service';
import {StateEditorService} from 'components/state-editor/state-editor-properties-services/state-editor.service';
import {Solution} from 'domain/exploration/solution.model';
import {SubtitledUnicode} from 'domain/exploration/subtitled-unicode.model.ts';
import {FocusManagerService} from 'services/stateful/focus-manager.service';
import {SubtitledHtml} from 'domain/exploration/subtitled-html.model';
import {ExplorationDataService} from '../services/exploration-data.service';
import {GenerateContentIdService} from 'services/generate-content-id.service';
import {EditabilityService} from 'services/editability.service';
import {ExplorationInitStateNameService} from '../services/exploration-init-state-name.service';
import {ExplorationStatesService} from '../services/exploration-states.service';
import {ExplorationWarningsService} from '../services/exploration-warnings.service';
import {RouterService} from '../services/router.service';
import {StateEditorRefreshService} from '../services/state-editor-refresh.service';
import {UserExplorationPermissionsService} from '../services/user-exploration-permissions.service';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {FormsModule} from '@angular/forms';
import {ExplorationEditorTabComponent} from './exploration-editor-tab.component';
import {
  DomRefService,
  JoyrideDirective,
  JoyrideOptionsService,
  JoyrideService,
  JoyrideStepsContainerService,
  JoyrideStepService,
  LoggerService,
  TemplatesService,
} from 'ngx-joyride';
import {Router} from '@angular/router';
import {ExplorationPermissions} from 'domain/exploration/exploration-permissions.model';
import {
  State,
  StateBackendDict,
  StateObjectFactory,
} from 'domain/state/StateObjectFactory';
import {Interaction} from 'domain/exploration/interaction.model';
import {PageContextService} from 'services/page-context.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {ExplorationNextContentIdIndexService} from '../services/exploration-next-content-id-index.service';
import {VersionHistoryService} from '../services/version-history.service';
import {VersionHistoryBackendApiService} from '../services/version-history-backend-api.service';
import {
  FetchSkillResponse,
  SkillBackendApiService,
} from 'domain/skill/skill-backend-api.service';
import {Skill} from 'domain/skill/skill.model';
import {Misconception} from 'domain/skill/misconception.model';
import {AlertsService} from 'services/alerts.service';

describe('Exploration editor tab component', () => {
  let component: ExplorationEditorTabComponent;
  let fixture: ComponentFixture<ExplorationEditorTabComponent>;
  let editabilityService: EditabilityService;
  let explorationFeaturesService: ExplorationFeaturesService;
  let explorationInitStateNameService: ExplorationInitStateNameService;
  let explorationStatesService: ExplorationStatesService;
  let explorationWarningsService: ExplorationWarningsService;
  let routerService: RouterService;
  let siteAnalyticsService: SiteAnalyticsService;
  let stateEditorRefreshService: StateEditorRefreshService;
  let stateCardIsCheckpointService: StateCardIsCheckpointService;
  let stateEditorService: StateEditorService;
  let userExplorationPermissionsService: UserExplorationPermissionsService;
  let focusManagerService: FocusManagerService;
  let pageContextService: PageContextService;
  var generateContentIdService: GenerateContentIdService;
  var explorationNextContentIdIndexService: ExplorationNextContentIdIndexService;
  let mockRefreshStateEditorEventEmitter: EventEmitter<void>;
  // Mobile tour tests.
  describe('Mobile tour functionality', () => {
    it('should initialize with mobile joyride steps', () => {
      expect(component.mobileJoyRideSteps).toEqual([
        'editorTabTourContainer',
        'editorTabTourContentEditorTab',
        'editorTabTourSlideStateInteractionEditorTab',
        'editorTabTourStateResponsesTab',
        'editorTabTourMobilePreview',
        'editorTabTourMobileSaveDraft',
        'editorTabTourTutorialComplete',
      ]);
    });

    it('should have mobile tour step targets for preview and save buttons', () => {
      const mobileSteps = component.mobileJoyRideSteps;
      expect(mobileSteps).toContain('editorTabTourMobilePreview');
      expect(mobileSteps).toContain('editorTabTourMobileSaveDraft');
      expect(mobileSteps.length).toBe(7);
    });

    it('should use mobile tour steps when window is narrow', () => {
      spyOn(
        component.windowDimensionsService,
        'isWindowNarrow'
      ).and.returnValue(true);
      spyOn(component.joyride, 'startTour').and.callThrough();

      component.startTutorial();

      expect(component.joyride.startTour).toHaveBeenCalledWith({
        steps: component.mobileJoyRideSteps,
        stepDefaultPosition: 'top',
        themeColor: '#212f23',
      });
    });

    it('should use desktop tour steps when window is wide', () => {
      spyOn(
        component.windowDimensionsService,
        'isWindowNarrow'
      ).and.returnValue(false);
      spyOn(component.joyride, 'startTour').and.callThrough();

      component.startTutorial();

      expect(component.joyride.startTour).toHaveBeenCalledWith({
        steps: component.joyRideSteps,
        stepDefaultPosition: 'top',
        themeColor: '#212f23',
      });
    });
  });
  let versionHistoryService: VersionHistoryService;
  let stateObjectFactory: StateObjectFactory;
  let stateObject: StateBackendDict;
  let versionHistoryBackendApiService: VersionHistoryBackendApiService;
  let skillBackendApiService: SkillBackendApiService;
  let alertsService: AlertsService;

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
        },
      };
    }

    closeTour() {}
  }

  class MockWindowRef {
    location = {path: '/create/2234'};
    nativeWindow = {
      scrollTo: (value1, value2) => {},
      sessionStorage: {
        promoIsDismissed: null,
        setItem: (testKey1, testKey2) => {},
        removeItem: testKey => {},
      },
      gtag: (value1, value2, value3) => {},
      navigator: {
        onLine: true,
        userAgent: null,
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
            overflowY: '',
          },
        },
      },
      addEventListener: (value1, value2) => {},
    };
  }

  class MockRouter {}

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, FormsModule],
      declarations: [JoyrideDirective, ExplorationEditorTabComponent],
      providers: [
        JoyrideStepService,
        {
          provide: Router,
          useClas: MockRouter,
        },
        TemplatesService,
        {
          provide: WindowRef,
          useClass: MockWindowRef,
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
            },
          },
        },
        VersionHistoryService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExplorationEditorTabComponent);
    component = fixture.componentInstance;

    explorationFeaturesService = TestBed.inject(ExplorationFeaturesService);
    generateContentIdService = TestBed.inject(GenerateContentIdService);
    focusManagerService = TestBed.inject(FocusManagerService);
    stateEditorService = TestBed.inject(StateEditorService);
    stateCardIsCheckpointService = TestBed.inject(StateCardIsCheckpointService);
    editabilityService = TestBed.inject(EditabilityService);
    focusManagerService = TestBed.inject(FocusManagerService);
    explorationInitStateNameService = TestBed.inject(
      ExplorationInitStateNameService
    );
    explorationStatesService = TestBed.inject(ExplorationStatesService);
    explorationWarningsService = TestBed.inject(ExplorationWarningsService);
    routerService = TestBed.inject(RouterService);
    siteAnalyticsService = TestBed.inject(SiteAnalyticsService);
    stateEditorRefreshService = TestBed.inject(StateEditorRefreshService);
    userExplorationPermissionsService = TestBed.inject(
      UserExplorationPermissionsService
    );
    pageContextService = TestBed.inject(PageContextService);
    explorationNextContentIdIndexService = TestBed.inject(
      ExplorationNextContentIdIndexService
    );
    versionHistoryService = TestBed.inject(VersionHistoryService);
    stateObjectFactory = TestBed.inject(StateObjectFactory);
    versionHistoryBackendApiService = TestBed.inject(
      VersionHistoryBackendApiService
    );
    skillBackendApiService = TestBed.inject(SkillBackendApiService);
    alertsService = TestBed.inject(AlertsService);

    mockRefreshStateEditorEventEmitter = new EventEmitter();
    spyOn(pageContextService, 'getExplorationId').and.returnValue(
      'explorationId'
    );
    spyOn(
      stateEditorService,
      'checkEventListenerRegistrationStatus'
    ).and.returnValue(true);
    spyOn(document, 'getElementById').and.returnValue({
      offsetTop: 400,
    } as HTMLElement);
    spyOnProperty(
      stateEditorRefreshService,
      'onRefreshStateEditor'
    ).and.returnValue(mockRefreshStateEditorEventEmitter);
    let element = document.createElement('div');
    spyOn(document, 'querySelector').and.returnValue(element as HTMLElement);
    spyOn(
      versionHistoryService,
      'getLatestVersionOfExploration'
    ).and.returnValue(3);

    stateObject = {
      classifier_model_id: null,
      content: {
        content_id: 'content',
        html: '',
      },
      interaction: {
        answer_groups: [],
        confirmed_unclassified_answers: [],
        customization_args: {
          rows: {
            value: 1,
          },
          placeholder: {
            value: {
              unicode_str: 'Type your answer here.',
              content_id: '',
            },
          },
        },
        default_outcome: {
          dest: '(untitled state)',
          dest_if_really_stuck: null,
          feedback: {
            content_id: 'default_outcome',
            html: '',
          },
          param_changes: [],
          labelled_as_correct: false,
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null,
        },
        hints: [],
        solution: null,
        id: 'TextInput',
      },
      linked_skill_id: null,
      param_changes: [],
      solicit_answer_details: false,
      card_is_checkpoint: false,
    };

    explorationStatesService.init(
      {
        'First State': {
          classifier_model_id: null,
          card_is_checkpoint: true,
          content: {
            content_id: 'content',
            html: 'First State Content',
          },
          interaction: {
            id: 'TextInput',
            confirmed_unclassified_answers: null,
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
                training_data: null,
                tagged_skill_misconception_id: null,
                outcome: {
                  dest: 'unused',
                  missing_prerequisite_skill_id: null,
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
              dest: 'default',
              dest_if_really_stuck: null,
              missing_prerequisite_skill_id: null,
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
        },
        'Second State': {
          classifier_model_id: null,
          card_is_checkpoint: false,
          content: {
            content_id: 'content',
            html: 'Second State Content',
          },
          interaction: {
            id: 'TextInput',
            confirmed_unclassified_answers: null,
            solution: null,
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
                training_data: null,
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
              dest: 'default',
              dest_if_really_stuck: null,
              feedback: {
                content_id: 'default_outcome',
                html: '',
              },
              missing_prerequisite_skill_id: null,
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null,
            },
            hints: [],
          },
          linked_skill_id: null,
          param_changes: [],
          solicit_answer_details: false,
        },
      },
      false
    );

    component.ngOnInit();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should apply autofocus to elements in active tab', () => {
    spyOn(routerService, 'getActiveTabName').and.returnValues(
      'main',
      'feedback',
      'history'
    );
    spyOn(focusManagerService, 'setFocus');

    component.windowOnload();

    expect(component.TabName).toBe('main');
    expect(focusManagerService.setFocus).toHaveBeenCalledWith(
      'oppiaEditableSection'
    );

    component.windowOnload();

    expect(component.TabName).toBe('feedback');
    expect(focusManagerService.setFocus).toHaveBeenCalledWith(
      'newThreadButton'
    );

    component.windowOnload();

    expect(component.TabName).toBe('history');
    expect(focusManagerService.setFocus).toHaveBeenCalledWith(
      'usernameInputField'
    );
  });

  it('should call focus method when window loads', fakeAsync(() => {
    stateEditorService.setActiveStateName('First State');
    let ctrlSpy = spyOn(component, 'windowOnload');
    component.initStateEditor();

    tick();
    flush();

    expect(ctrlSpy).toHaveBeenCalled();
  }));

  it('should initialize controller properties after its initialization', () => {
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

  it(
    'should get state content placeholder text when init state name' +
      ' is equal to active state name',
    () => {
      stateEditorService.setActiveStateName('First State');
      explorationInitStateNameService.init('First State');

      expect(component.getStateContentPlaceholder()).toBe(
        'This is the first card of your exploration. Use this space ' +
          'to introduce your topic and engage the learner, then ask ' +
          'them a question.'
      );
    }
  );

  it(
    'should get state content placeholder text when init state name is' +
      ' different from active state name',
    () => {
      stateEditorService.setActiveStateName('First State');
      explorationInitStateNameService.init('Second State');

      expect(component.getStateContentPlaceholder()).toBe(
        'You can speak to the learner here, then ask them a question.'
      );
    }
  );

  it('should get state content save button placeholder', () => {
    expect(component.getStateContentSaveButtonPlaceholder()).toBe(
      'Save Content'
    );
  });

  it('should add state in exploration states', () => {
    spyOn(explorationStatesService, 'addState').and.callThrough();

    component.addState('Fourth State');

    expect(explorationStatesService.addState).toHaveBeenCalledWith(
      'Fourth State',
      null
    );
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
        html: 'First State Content',
      })
    );

    let displayedValue = SubtitledHtml.createFromBackendDict({
      content_id: 'content',
      html: 'First State Content Changed',
    });
    component.saveStateContent(displayedValue);

    expect(explorationStatesService.getState('First State').content).toEqual(
      displayedValue
    );
    expect(component.interactionIsShown).toBe(true);
  });

  it(
    'should save state interaction data when customization args' +
      ' are changed',
    () => {
      stateEditorService.setActiveStateName('First State');
      stateEditorService.setInteraction(
        explorationStatesService.getState('First State').interaction
      );

      expect(stateEditorService.interaction.id).toBe('TextInput');
      expect(stateEditorService.interaction.customizationArgs).toEqual({
        rows: {value: 1},
        placeholder: {value: new SubtitledUnicode('', 'ca_placeholder')},
        catchMisspellings: {
          value: false,
        },
      });

      let newInteractionData = {
        interactionId: 'TextInput',
        customizationArgs: {
          placeholder: {
            value: new SubtitledUnicode('Placeholder value', 'ca_placeholder'),
          },
          rows: {
            value: 2,
          },
          catchMisspellings: {
            value: false,
          },
        },
      };
      component.saveInteractionData(newInteractionData);

      expect(stateEditorService.interaction.id).toBe(
        newInteractionData.interactionId
      );
      expect(stateEditorService.interaction.customizationArgs).toEqual(
        newInteractionData.customizationArgs
      );
    }
  );

  it('should save linked skill id', () => {
    stateEditorService.setActiveStateName('First State');
    expect(
      explorationStatesService.getState('First State').linkedSkillId
    ).toEqual(null);

    component.saveLinkedSkillId('skill_id1');
    expect(explorationStatesService.getState('First State').linkedSkillId).toBe(
      'skill_id1'
    );
  });

  it('should save inapplicable misconception ids', () => {
    stateEditorService.setActiveStateName('First State');
    expect(
      explorationStatesService.getState('First State')
        .inapplicableSkillMisconceptionIds
    ).toEqual(undefined);

    component.saveInapplicableSkillMisconceptionIds(['skill_id1']);
    expect(
      explorationStatesService.getState('First State')
        .inapplicableSkillMisconceptionIds
    ).toEqual(['skill_id1']);
  });

  it('should populate misconceptions for state', fakeAsync(() => {
    spyOn(skillBackendApiService, 'fetchSkillAsync').and.returnValue(
      Promise.resolve({
        skill: Skill.createFromBackendDict({
          id: 'skill_id1',
          description: 'test description 1',
          misconceptions: [
            {
              id: 2,
              name: 'test name',
              notes: 'test notes',
              feedback: 'test feedback',
              must_be_addressed: true,
            },
          ],
          rubrics: [
            {
              difficulty: 'Easy',
              explanations: ['explanation'],
            },
          ],
          skill_contents: {
            explanation: {
              html: 'test explanation',
              content_id: 'explanation',
            },
            recorded_voiceovers: {
              voiceovers_mapping: {},
            },
          },
          language_code: 'en',
          version: 3,
          prerequisite_skill_ids: ['skill_id1'],
          all_questions_merged: false,
          next_misconception_id: 0,
          superseding_skill_id: '',
        }),
      } as FetchSkillResponse)
    );
    spyOn(stateEditorService, 'setMisconceptionsBySkill');

    component.populateMisconceptionsForState('skill_id1');
    tick();

    expect(component.misconceptionsBySkill).toEqual({
      skill_id1: [
        Misconception.createFromBackendDict({
          id: 2,
          name: 'test name',
          notes: 'test notes',
          feedback: 'test feedback',
          must_be_addressed: true,
        }),
      ],
    });
    expect(stateEditorService.setMisconceptionsBySkill).toHaveBeenCalledWith({
      skill_id1: [
        Misconception.createFromBackendDict({
          id: 2,
          name: 'test name',
          notes: 'test notes',
          feedback: 'test feedback',
          must_be_addressed: true,
        }),
      ],
    });
  }));

  it('should show warning message if fetching skill fails', fakeAsync(() => {
    spyOn(alertsService, 'addWarning');
    spyOn(skillBackendApiService, 'fetchSkillAsync').and.returnValue(
      Promise.reject('Error occurred.')
    );

    component.populateMisconceptionsForState('');
    tick();

    expect(skillBackendApiService.fetchSkillAsync).toHaveBeenCalled();
    expect(alertsService.addWarning).toHaveBeenCalled();
  }));

  it('should save interaction answer groups', () => {
    stateEditorService.setActiveStateName('First State');
    stateEditorService.setInteraction(
      explorationStatesService.getState('First State').interaction
    );

    expect(stateEditorService.interaction.answerGroups).toEqual([
      AnswerGroup.createFromBackendDict(
        {
          rule_specs: [],
          training_data: null,
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
        null
      ),
    ]);

    let displayedValue = [
      AnswerGroup.createFromBackendDict(
        {
          rule_specs: [],
          outcome: {
            missing_prerequisite_skill_id: null,
            dest: 'Second State',
            dest_if_really_stuck: null,
            feedback: {
              content_id: 'feedback_1',
              html: '',
            },
            labelled_as_correct: false,
            param_changes: [],
            refresher_exploration_id: null,
          },
          training_data: null,
          tagged_skill_misconception_id: '',
        },
        null
      ),
    ];
    component.saveInteractionAnswerGroups(displayedValue);

    expect(stateEditorService.interaction.answerGroups).toEqual(displayedValue);
  });

  it('should save interaction default outcome', () => {
    stateEditorService.setActiveStateName('First State');
    stateEditorService.setInteraction(
      explorationStatesService.getState('First State').interaction
    );

    expect(stateEditorService.interaction.defaultOutcome).toEqual(
      Outcome.createFromBackendDict({
        dest: 'default',
        dest_if_really_stuck: null,
        feedback: {
          content_id: 'default_outcome',
          html: '',
        },
        labelled_as_correct: false,
        param_changes: [],
        missing_prerequisite_skill_id: null,
        refresher_exploration_id: null,
      })
    );

    let displayedValue = Outcome.createFromBackendDict({
      dest: 'Second State',
      dest_if_really_stuck: null,
      feedback: {
        content_id: 'default_outcome_changed',
        html: 'This is the default outcome changed',
      },
      missing_prerequisite_skill_id: null,
      labelled_as_correct: false,
      param_changes: [],
      refresher_exploration_id: null,
    });
    component.saveInteractionDefaultOutcome(displayedValue);

    expect(stateEditorService.interaction.defaultOutcome).toEqual(
      displayedValue
    );
  });

  it('should save interaction solution', () => {
    stateEditorService.setActiveStateName('First State');
    stateEditorService.setInteraction(
      explorationStatesService.getState('First State').interaction
    );

    expect(stateEditorService.interaction.solution).toEqual(
      Solution.createFromBackendDict({
        correct_answer: 'This is the correct answer',
        answer_is_exclusive: false,
        explanation: {
          html: 'Solution explanation',
          content_id: 'content_4',
        },
      })
    );

    let displayedValue = Solution.createFromBackendDict({
      correct_answer: 'This is the second correct answer',
      answer_is_exclusive: true,
      explanation: {
        html: 'Solution complete explanation',
        content_id: 'content_4',
      },
    });
    component.saveSolution(displayedValue);

    expect(stateEditorService.interaction.solution).toEqual(displayedValue);
  });

  it('should save interaction hints', () => {
    stateEditorService.setActiveStateName('First State');
    stateEditorService.setInteraction(
      explorationStatesService.getState('First State').interaction
    );

    expect(stateEditorService.interaction.hints).toEqual([]);

    let displayedValue = [
      Hint.createFromBackendDict({
        hint_content: {
          content_id: '',
          html: 'This is a hint',
        },
      }),
    ];
    component.saveHints(displayedValue);

    expect(stateEditorService.interaction.hints).toEqual(displayedValue);
  });

  it('should save solicit answer details', () => {
    stateEditorService.setActiveStateName('First State');
    stateEditorService.setSolicitAnswerDetails(
      explorationStatesService.getState('First State').solicitAnswerDetails
    );

    expect(stateEditorService.solicitAnswerDetails).toBe(false);

    component.saveSolicitAnswerDetails(true);

    expect(stateEditorService.solicitAnswerDetails).toBe(true);
  });

  it('should save card is checkpoint on change', () => {
    stateEditorService.setActiveStateName('Second State');
    stateEditorService.setCardIsCheckpoint(
      explorationStatesService.getState('Second State').cardIsCheckpoint
    );

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
      explorationFeaturesService,
      'areParametersEnabled'
    );

    areParametersEnabledSpy.and.returnValue(true);
    expect(component.areParametersEnabled()).toBe(true);

    areParametersEnabledSpy.and.returnValue(false);
    expect(component.areParametersEnabled()).toBe(false);
  });

  it(
    'should correctly broadcast the stateEditorInitialized flag with ' +
      'the state data',
    fakeAsync(() => {
      const state = new State(
        'stateName',
        'id',
        'some',
        null,
        new Interaction([], [], null, null, [], 'id', null),
        null,
        null,
        true,
        true
      );
      component.stateName = 'stateName';

      spyOn(explorationStatesService, 'getState').and.returnValues(state);
      spyOn(explorationStatesService, 'isInitialized').and.returnValue(true);
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
    })
  );

  it('should start tutorial if in tutorial mode on page load', () => {
    const state = new State(
      'stateName',
      'id',
      'some',
      null,
      new Interaction([], [], null, null, [], 'id', null),
      null,
      null,
      true,
      true
    );
    component.stateName = 'stateName';
    spyOn(explorationStatesService, 'getState').and.returnValues(state);
    spyOn(explorationStatesService, 'isInitialized').and.returnValue(true);
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

  it('should finish tutorial if finish tutorial button is clicked', fakeAsync(() => {
    let registerFinishTutorialEventSpy = spyOn(
      siteAnalyticsService,
      'registerFinishTutorialEvent'
    );
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
    spyOn(
      userExplorationPermissionsService,
      'getPermissionsAsync'
    ).and.returnValue(
      Promise.resolve({
        canEdit: false,
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

  it('should fetch the version history data on initialization of state editor', fakeAsync(() => {
    stateEditorService.setActiveStateName('First State');
    let stateData = stateObjectFactory.createFromBackendDict(
      'State',
      stateObject
    );
    spyOn(
      versionHistoryBackendApiService,
      'fetchStateVersionHistoryAsync'
    ).and.resolveTo({
      lastEditedVersionNumber: 2,
      stateNameInPreviousVersion: 'State',
      stateInPreviousVersion: stateData,
      lastEditedCommitterUsername: 'some',
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
      versionHistoryBackendApiService,
      'fetchStateVersionHistoryAsync'
    ).and.resolveTo(null);

    expect(component.validationErrorIsShown).toBeFalse();

    component.initStateEditor();
    tick();
    flush();

    expect(component.validationErrorIsShown).toBeTrue();
  }));

  // Additional function coverage tests.
  describe('Additional function coverage', () => {
    it('should return state content placeholder for first state', () => {
      explorationInitStateNameService.init('First State');
      stateEditorService.setActiveStateName('First State');

      const placeholder = component.getStateContentPlaceholder();

      expect(placeholder).toContain(
        'This is the first card of your exploration'
      );
    });

    it('should return state content placeholder for non-first state', () => {
      explorationInitStateNameService.init('First State');
      stateEditorService.setActiveStateName('Second State');

      const placeholder = component.getStateContentPlaceholder();

      expect(placeholder).toContain('You can speak to the learner here');
    });

    it('should get state content save button placeholder', () => {
      const placeholder = component.getStateContentSaveButtonPlaceholder();
      expect(placeholder).toBe('Save Content');
    });

    it('should add state to exploration states', () => {
      spyOn(explorationStatesService, 'addState');
      const newStateName = 'New State';

      component.addState(newStateName);

      expect(explorationStatesService.addState).toHaveBeenCalledWith(
        newStateName,
        null
      );
    });

    it('should save state content and show interaction', () => {
      spyOn(explorationStatesService, 'saveStateContent');
      const subtitledHtml = SubtitledHtml.createFromBackendDict({
        html: 'Test content',
        content_id: 'content',
      });
      component.interactionIsShown = false;

      component.saveStateContent(subtitledHtml);

      expect(explorationStatesService.saveStateContent).toHaveBeenCalled();
      expect(component.interactionIsShown).toBe(true);
    });

    it('should save linked skill id and populate misconceptions', () => {
      spyOn(explorationStatesService, 'saveLinkedSkillId');
      spyOn(stateEditorService, 'setLinkedSkillId');
      spyOn(stateEditorService, 'getLinkedSkillId').and.returnValue('skill123');
      spyOn(component, 'populateMisconceptionsForState');
      const skillId = 'skill123';

      component.saveLinkedSkillId(skillId);

      expect(explorationStatesService.saveLinkedSkillId).toHaveBeenCalled();
      expect(stateEditorService.setLinkedSkillId).toHaveBeenCalledWith(skillId);
      expect(component.populateMisconceptionsForState).toHaveBeenCalledWith(
        skillId
      );
    });

    it('should save inapplicable skill misconception ids', () => {
      spyOn(stateEditorService, 'setInapplicableSkillMisconceptionIds');
      spyOn(explorationStatesService, 'saveInapplicableSkillMisconceptionIds');
      const ids = ['id1', 'id2'];

      component.saveInapplicableSkillMisconceptionIds(ids);

      expect(
        stateEditorService.setInapplicableSkillMisconceptionIds
      ).toHaveBeenCalledWith(ids);
      expect(
        explorationStatesService.saveInapplicableSkillMisconceptionIds
      ).toHaveBeenCalledWith(stateEditorService.getActiveStateName(), ids);
    });

    it('should handle component destruction', () => {
      spyOn(component.directiveSubscriptions, 'unsubscribe');

      component.ngOnDestroy();

      expect(component.directiveSubscriptions.unsubscribe).toHaveBeenCalled();
    });

    it('should initialize state editor on ngOnInit', () => {
      spyOn(component, 'initStateEditor');
      spyOn(component, 'removeTutorialSaveButtonIfNoPermissions');

      // Reset and initialize.
      component.ngOnInit();

      // Trigger the state editor refresh event.
      mockRefreshStateEditorEventEmitter.emit();

      expect(component.initStateEditor).toHaveBeenCalled();
      expect(
        component.removeTutorialSaveButtonIfNoPermissions
      ).toHaveBeenCalled();
    });

    it('should register callback for state changes', () => {
      spyOn(
        explorationStatesService,
        'registerOnStatesChangedCallback'
      ).and.callFake(callback => {
        // Simulate states changed.
        callback();
      });
      spyOn(stateEditorService, 'setStateNames');

      component.ngOnInit();

      expect(
        explorationStatesService.registerOnStatesChangedCallback
      ).toHaveBeenCalled();
    });

    it('should initialize generate content id service with proper callbacks', () => {
      spyOn(generateContentIdService, 'init');
      explorationNextContentIdIndexService.init(10);

      component.ngOnInit();

      expect(generateContentIdService.init).toHaveBeenCalled();

      // Test the callback functions passed to init.
      const initCall = generateContentIdService.init.calls.mostRecent();
      const incrementCallback = initCall.args[0];
      const restoreCallback = initCall.args[1];

      // Test increment callback.
      explorationNextContentIdIndexService.displayed = 5;
      const result = incrementCallback();
      expect(result).toBe(5);
      expect(explorationNextContentIdIndexService.displayed).toBe(6);

      // Test restore callback.
      spyOn(explorationNextContentIdIndexService, 'restoreFromMemento');
      restoreCallback();
      expect(
        explorationNextContentIdIndexService.restoreFromMemento
      ).toHaveBeenCalled();
    });
  });

  describe('smoothScrollTo function', () => {
    it('should scroll smoothly to target position', fakeAsync(() => {
      const targetY = 500;
      const duration = 1000;
      spyOn(window, 'scrollTo');
      spyOn(window, 'requestAnimationFrame').and.callFake(callback => {
        setTimeout(callback, 16);
        return 1;
      });

      component.smoothScrollTo(targetY, duration);

      // Fast forward through animation frames.
      tick(1100); // More than duration to complete animation.

      expect(window.scrollTo).toHaveBeenCalled();
    }));
  });

  describe('recomputeGraph function', () => {
    it('should call recompute on graph data service', () => {
      // Since GraphDataService is private, we'll test the method indirectly.
      spyOn(component.graphDataService, 'recompute');

      component.recomputeGraph();

      expect(component.graphDataService.recompute).toHaveBeenCalled();
    });
  });

  describe('startTutorial function', () => {
    it('should set tutorialInProgress to true and start tour', () => {
      spyOn(
        component.windowDimensionsService,
        'isWindowNarrow'
      ).and.returnValue(false);
      spyOn(component.joyride, 'startTour').and.returnValue({
        subscribe: (
          onNext?: (value: {number: number}) => void,
          onError?: () => void,
          onComplete?: () => void
        ) => {
          // Mock successful tour start.
        },
      } as unknown as jasmine.Spy);

      component.tutorialInProgress = false;
      component.startTutorial();

      expect(component.tutorialInProgress).toBe(true);
      expect(component.joyride.startTour).toHaveBeenCalled();
    });

    it('should use mobile tour steps when window is narrow', () => {
      spyOn(
        component.windowDimensionsService,
        'isWindowNarrow'
      ).and.returnValue(true);
      spyOn(component.joyride, 'startTour').and.returnValue({
        subscribe: (
          onNext?: (value: {number: number}) => void,
          onError?: () => void,
          onComplete?: () => void
        ) => {},
      } as unknown as jasmine.Spy);

      component.startTutorial();

      expect(component.joyride.startTour).toHaveBeenCalledWith({
        steps: component.mobileJoyRideSteps,
        stepDefaultPosition: 'top',
        themeColor: '#212f23',
      });
    });

    it('should register finish tutorial event on completion', () => {
      spyOn(
        component.windowDimensionsService,
        'isWindowNarrow'
      ).and.returnValue(false);
      spyOn(component.siteAnalyticsService, 'registerFinishTutorialEvent');
      spyOn(component, 'leaveTutorial');

      // Set exploration ID for the test.
      component.explorationId = 'test-exploration-id';

      // Mock JoyrideService to simulate tour completion.
      spyOn(component.joyride, 'startTour').and.returnValue({
        subscribe: (
          onNext?: (value: {number: number}) => void,
          onError?: () => void,
          onComplete?: () => void
        ) => {
          onComplete?.(); // Simulate completion.
        },
      } as unknown as jasmine.Spy);

      component.startTutorial();

      expect(
        component.siteAnalyticsService.registerFinishTutorialEvent
      ).toHaveBeenCalledWith('test-exploration-id');
      expect(component.leaveTutorial).toHaveBeenCalled();
    });
  });

  describe('Mobile navigation tour handling', () => {
    let originalQuerySelector: typeof document.querySelector;
    let mockDocument: {
      holderElement: {style: {zIndex: string}};
      counterElement: {tabIndex: number; style: Record<string, unknown>};
      titleElement: {focus: jasmine.Spy; style: Record<string, unknown>};
      mobileOptionsElement: {
        classList: {contains: jasmine.Spy};
        click: jasmine.Spy;
        style: Record<string, unknown>;
      } | null;
    };

    beforeEach(() => {
      originalQuerySelector = document.querySelector;

      // Mock document elements required by joyride.
      mockDocument = {
        holderElement: {
          style: {zIndex: '1000'},
        },
        counterElement: {
          tabIndex: 0,
          style: {},
        },
        titleElement: {
          focus: jasmine.createSpy('focus'),
          style: {},
        },
        mobileOptionsElement: null, // Will be set per test.
      };

      // Mock querySelector to return appropriate elements.
      document.querySelector = jasmine
        .createSpy('querySelector')
        .and.callFake((selector: string) => {
          if (selector === '.joyride-step__holder') {
            return mockDocument.holderElement;
          } else if (selector === '.joyride-step__counter') {
            return mockDocument.counterElement;
          } else if (selector === '.e2e-test-joyride-title') {
            return mockDocument.titleElement;
          } else if (selector === '.e2e-test-mobile-options') {
            return mockDocument.mobileOptionsElement;
          }
          return null;
        });
    });

    afterEach(() => {
      document.querySelector = originalQuerySelector;
    });

    it('should handle mobile navigation on step 5 of mobile tour', () => {
      spyOn(
        component.windowDimensionsService,
        'isWindowNarrow'
      ).and.returnValue(true);

      // Mock mobile options icon that needs to be clicked.
      mockDocument.mobileOptionsElement = {
        classList: {
          contains: jasmine.createSpy('contains').and.returnValue(false),
        },
        click: jasmine.createSpy('click'),
        style: {},
      };

      // Mock JoyrideService to simulate step 5 in mobile tour.
      spyOn(component.joyride, 'startTour').and.returnValue({
        subscribe: (
          onNext: (value: {number: number}) => void,
          onError?: () => void,
          onComplete?: () => void
        ) => {
          onNext({number: 5}); // Simulate step 5.
        },
      } as unknown as jasmine.Spy);

      component.startTutorial();

      expect(
        mockDocument.mobileOptionsElement.classList.contains
      ).toHaveBeenCalledWith('mobile-navbar-toggled');
      expect(mockDocument.mobileOptionsElement.click).toHaveBeenCalled();
    });

    it('should not click mobile navigation if already open on step 5', () => {
      spyOn(
        component.windowDimensionsService,
        'isWindowNarrow'
      ).and.returnValue(true);

      // Mock mobile options icon that's already open.
      mockDocument.mobileOptionsElement = {
        classList: {
          contains: jasmine.createSpy('contains').and.returnValue(true), // Already open.
        },
        click: jasmine.createSpy('click'),
        style: {},
      };

      // Mock JoyrideService to simulate step 5 in mobile tour.
      spyOn(component.joyride, 'startTour').and.returnValue({
        subscribe: (
          onNext: (value: {number: number}) => void,
          onError?: () => void,
          onComplete?: () => void
        ) => {
          onNext({number: 5}); // Simulate step 5.
        },
      } as unknown as jasmine.Spy);

      component.startTutorial();

      expect(
        mockDocument.mobileOptionsElement.classList.contains
      ).toHaveBeenCalledWith('mobile-navbar-toggled');
      expect(mockDocument.mobileOptionsElement.click).not.toHaveBeenCalled(); // Should not click if already open.
    });

    it('should handle case where mobile options icon is not found on step 5', () => {
      spyOn(
        component.windowDimensionsService,
        'isWindowNarrow'
      ).and.returnValue(true);

      // Mock mobile options element as null (not found).
      mockDocument.mobileOptionsElement = null;

      // Mock JoyrideService to simulate step 5 in mobile tour.
      spyOn(component.joyride, 'startTour').and.returnValue({
        subscribe: (
          onNext: (value: {number: number}) => void,
          onError?: () => void,
          onComplete?: () => void
        ) => {
          onNext({number: 5}); // Simulate step 5.
        },
      } as unknown as jasmine.Spy);

      // This should not throw an error even if element is not found.
      expect(() => component.startTutorial()).not.toThrowError();
    });
  });

  describe('WindowDimensionsService integration', () => {
    it('should inject WindowDimensionsService', () => {
      expect(component.windowDimensionsService).toBeDefined();
    });
  });
});
