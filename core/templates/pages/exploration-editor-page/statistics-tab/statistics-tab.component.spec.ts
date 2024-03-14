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
 * @fileoverview Unit tests for statisticsTab.
 */

import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import {ExplorationStatsService} from 'services/exploration-stats.service';
import {
  StateInteractionStats,
  StateInteractionStatsService,
} from 'services/state-interaction-stats.service';
import {
  States,
  StatesObjectFactory,
} from 'domain/exploration/StatesObjectFactory';
import {AlertsService} from 'services/alerts.service';
import {ComputeGraphService} from 'services/compute-graph.service';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {EventEmitter, NO_ERRORS_SCHEMA} from '@angular/core';
import {
  FetchExplorationBackendResponse,
  ReadOnlyExplorationBackendApiService,
} from 'domain/exploration/read-only-exploration-backend-api.service';
import {RouterService} from '../services/router.service';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {FormsModule} from '@angular/forms';
import {StatisticsTabComponent} from './statistics-tab.component';
import {ExplorationDataService} from '../services/exploration-data.service';
import {ExplorationStats} from 'domain/statistics/exploration-stats.model';
import {StateStatsModalComponent} from './templates/state-stats-modal.component';

describe('Statistics Tab Component', () => {
  let component: StatisticsTabComponent;
  let fixture: ComponentFixture<StatisticsTabComponent>;
  let ngbModal: NgbModal;
  let alertsService: AlertsService;
  let computeGraphService: ComputeGraphService;
  let explorationStatsService: ExplorationStatsService;
  let readOnlyExplorationBackendApiService: ReadOnlyExplorationBackendApiService;
  let stateInteractionStatsService: StateInteractionStatsService;
  let statesObjectFactory: StatesObjectFactory;
  let refreshStatisticsTabEventEmitter = new EventEmitter();

  class MockRouterService {
    onRefreshStatisticsTab = refreshStatisticsTabEventEmitter;
  }

  let explorationId = 'exp1';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, FormsModule],
      declarations: [StateStatsModalComponent, StatisticsTabComponent],
      providers: [
        {
          provide: ExplorationDataService,
          useValue: {
            explorationId: explorationId,
          },
        },
        {
          provide: RouterService,
          useClass: MockRouterService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StatisticsTabComponent);
    component = fixture.componentInstance;

    alertsService = TestBed.inject(AlertsService);
    explorationStatsService = TestBed.inject(ExplorationStatsService);
    stateInteractionStatsService = TestBed.inject(StateInteractionStatsService);
    ngbModal = TestBed.inject(NgbModal);
    readOnlyExplorationBackendApiService = TestBed.inject(
      ReadOnlyExplorationBackendApiService
    );
    statesObjectFactory = TestBed.inject(StatesObjectFactory);
    computeGraphService = TestBed.inject(ComputeGraphService);

    // This throws "Argument of type 'null' is not assignable to
    // parameter of type 'State'." We need to suppress this error
    // because of the need to test validations. This throws an
    // error because the state with name 'Introduction' is not
    // present in the states object.
    // @ts-ignore
    spyOn(statesObjectFactory, 'createFromBackendDict').and.returnValue(null);

    let explorationDict = {
      states: {
        Start: {
          classifier_model_id: null,
          recorded_voiceovers: {
            voiceovers_mapping: {
              ca_placeholder_0: {},
              feedback_1: {},
              rule_input_2: {},
              content: {},
              default_outcome: {},
            },
          },
          solicit_answer_details: false,
          interaction: {
            solution: null,
            confirmed_unclassified_answers: [],
            id: 'TextInput',
            hints: [],
            customization_args: {
              rows: {
                value: 1,
              },
              placeholder: {
                value: {
                  unicode_str: '',
                  content_id: 'ca_placeholder_0',
                },
              },
            },
            answer_groups: [
              {
                outcome: {
                  missing_prerequisite_skill_id: null,
                  refresher_exploration_id: null,
                  labelled_as_correct: false,
                  feedback: {
                    content_id: 'feedback_1',
                    html: '<p>Good Job</p>',
                  },
                  param_changes: [],
                  dest_if_really_stuck: null,
                  dest: 'Mid',
                },
                training_data: [],
                rule_specs: [
                  {
                    inputs: {
                      x: {
                        normalizedStrSet: ['answer'],
                        contentId: 'rule_input_2',
                      },
                    },
                    rule_type: 'FuzzyEquals',
                  },
                ],
                tagged_skill_misconception_id: null,
              },
            ],
            default_outcome: {
              missing_prerequisite_skill_id: null,
              refresher_exploration_id: null,
              labelled_as_correct: false,
              feedback: {
                content_id: 'default_outcome',
                html: '<p>Try again.</p>',
              },
              param_changes: [],
              dest_if_really_stuck: null,
              dest: 'Start',
            },
          },
          param_changes: [],
          card_is_checkpoint: true,
          linked_skill_id: null,
          content: {
            content_id: 'content',
            html: '<p>First Question</p>',
          },
        },
        End: {
          classifier_model_id: null,
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {},
            },
          },
          solicit_answer_details: false,
          interaction: {
            solution: null,
            confirmed_unclassified_answers: [],
            id: 'EndExploration',
            hints: [],
            customization_args: {
              recommendedExplorationIds: {
                value: ['recommnendedExplorationId'],
              },
            },
            answer_groups: [],
            default_outcome: null,
          },
          param_changes: [],
          card_is_checkpoint: false,
          linked_skill_id: null,
          content: {
            content_id: 'content',
            html: 'Congratulations, you have finished!',
          },
        },
        Mid: {
          classifier_model_id: null,
          recorded_voiceovers: {
            voiceovers_mapping: {
              ca_placeholder_0: {},
              feedback_1: {},
              rule_input_2: {},
              content: {},
              default_outcome: {},
            },
          },
          solicit_answer_details: false,
          interaction: {
            solution: null,
            confirmed_unclassified_answers: [],
            id: 'TextInput',
            hints: [],
            customization_args: {
              rows: {
                value: 1,
              },
              placeholder: {
                value: {
                  unicode_str: '',
                  content_id: 'ca_placeholder_0',
                },
              },
            },
            answer_groups: [
              {
                outcome: {
                  missing_prerequisite_skill_id: null,
                  refresher_exploration_id: null,
                  labelled_as_correct: false,
                  feedback: {
                    content_id: 'feedback_1',
                    html: ' <p>Good Job</p>',
                  },
                  param_changes: [],
                  dest_if_really_stuck: null,
                  dest: 'End',
                },
                training_data: [],
                rule_specs: [
                  {
                    inputs: {
                      x: {
                        normalizedStrSet: ['answer'],
                        contentId: 'rule_input_2',
                      },
                    },
                    rule_type: 'FuzzyEquals',
                  },
                ],
                tagged_skill_misconception_id: null,
              },
            ],
            default_outcome: {
              missing_prerequisite_skill_id: null,
              refresher_exploration_id: null,
              labelled_as_correct: false,
              feedback: {
                content_id: 'default_outcome',
                html: '<p>try again.</p>',
              },
              param_changes: [],
              dest_if_really_stuck: null,
              dest: 'Mid',
            },
          },
          param_changes: [],
          card_is_checkpoint: false,
          linked_skill_id: null,
          content: {
            content_id: 'content',
            html: '<p>Second Question</p>',
          },
        },
      },
      auto_tts_enabled: true,
      version: 2,
      draft_change_list_id: 9,
      is_version_of_draft_valid: null,
      title: 'Exploration',
      language_code: 'en',
      init_state_name: 'Start',
      param_changes: [],
      param_specs: null,
      draft_changes: null,
    };

    let explorationResponse: FetchExplorationBackendResponse = {
      exploration_id: 'exp_id',
      is_logged_in: true,
      session_id: 'KERH',
      exploration: {
        init_state_name: 'Start',
        param_changes: [],
        param_specs: {},
        title: 'Exploration',
        language_code: 'en',
        objective: 'To learn',
        states: explorationDict.states,
        next_content_id_index: 6,
      },
      exploration_metadata: {
        title: 'Exploration',
        category: 'Algebra',
        objective: 'To learn',
        language_code: 'en',
        tags: [],
        blurb: '',
        author_notes: '',
        states_schema_version: 50,
        init_state_name: 'Introduction',
        param_specs: {},
        param_changes: [],
        auto_tts_enabled: false,
        edits_allowed: true,
      },
      version: 2,
      can_edit: true,
      preferred_audio_language_code: 'en',
      preferred_language_codes: [],
      auto_tts_enabled: true,
      record_playthrough_probability: 1,
      draft_change_list_id: 0,
      has_viewed_lesson_info_modal_once: false,
      furthest_reached_checkpoint_exp_version: 1,
      furthest_reached_checkpoint_state_name: 'End',
      most_recently_reached_checkpoint_state_name: 'Mid',
      most_recently_reached_checkpoint_exp_version: 2,
      displayable_language_codes: [],
    };
    spyOn(
      readOnlyExplorationBackendApiService,
      'loadLatestExplorationAsync'
    ).and.returnValue(Promise.resolve(explorationResponse));

    spyOn(explorationStatsService, 'getExplorationStatsAsync').and.returnValue(
      Promise.resolve({
        numStarts: 20,
        numActualStarts: 10,
        numCompletions: 5,
      } as ExplorationStats)
    );

    spyOn(stateInteractionStatsService, 'computeStatsAsync').and.returnValue(
      Promise.resolve({
        visualizationsInfo: {},
      } as StateInteractionStats)
    );

    spyOn(computeGraphService, 'compute').and.stub();
    component.states = {
      getState: (name: string) => {
        return {
          interaction: {
            customizationArgs: null,
          },
        };
      },
    } as unknown as States;

    component.expStats = {
      getStateStats: (name: string) => null,
    } as unknown as ExplorationStats;

    component.ngOnInit();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should initialize controller properties after its initialization', () => {
    expect(component.stateStatsModalIsOpen).toBe(false);
    expect(component.explorationHasBeenVisited).toBe(false);
  });

  it(
    'should refresh exploration statistics when broadcasting' +
      ' refreshStatisticsTab',
    fakeAsync(() => {
      refreshStatisticsTabEventEmitter.emit();
      tick();

      expect(component.statsGraphData).toEqual(undefined);
      expect(component.pieChartData).toEqual([
        ['Type', 'Number'],
        ['Completions', 5],
        ['Non-Completions', 5],
      ]);
      expect(component.numPassersby).toBe(10);
      expect(component.explorationHasBeenVisited).toBe(true);
    })
  );

  it(
    'should open state stats modal and close it when clicking in stats' +
      ' graph',
    fakeAsync(() => {
      tick();

      spyOn(ngbModal, 'open').and.returnValue({
        componentInstance: {
          interactionArgs: '',
          stateName: 'stateName',
          visualizationsInfo: '',
          stateStats: false,
        },
        result: Promise.resolve(),
      } as NgbModalRef);
      tick();

      component.onClickStateInStatsGraph('id');
      tick();

      expect(component.stateStatsModalIsOpen).toBe(false);
    })
  );

  it(
    'should open state stats modal and dismiss it when clicking in' +
      ' stats graph',
    fakeAsync(() => {
      spyOn(ngbModal, 'open').and.returnValue({
        componentInstance: {
          interactionArgs: '',
          stateName: 'stateName',
          visualizationsInfo: '',
          stateStats: false,
        },
        result: Promise.reject(),
      } as NgbModalRef);
      spyOn(alertsService, 'clearWarnings');

      component.onClickStateInStatsGraph('State1');
      tick();

      expect(component.stateStatsModalIsOpen).toBe(false);
      expect(alertsService.clearWarnings).toHaveBeenCalled();
    })
  );
});
