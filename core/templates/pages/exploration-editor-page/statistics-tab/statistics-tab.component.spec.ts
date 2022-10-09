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

import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ExplorationStatsService } from 'services/exploration-stats.service';
import { StateInteractionStats, StateInteractionStatsService } from
  'services/state-interaction-stats.service';
import { States, StatesObjectFactory } from 'domain/exploration/StatesObjectFactory';
import { AlertsService } from 'services/alerts.service';
import { ComputeGraphService } from 'services/compute-graph.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { FetchExplorationBackendResponse, ReadOnlyExplorationBackendApiService, ReadOnlyExplorationBackendDict } from 'domain/exploration/read-only-exploration-backend-api.service';
import { RouterService } from '../services/router.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { StatisticsTabComponent } from './statistics-tab.component';
import { ExplorationDataService } from '../services/exploration-data.service';
import { ExplorationStats } from 'domain/statistics/exploration-stats.model';
import { StateStatsModalComponent } from './templates/state-stats-modal.component';
import { State, StateBackendDict } from 'domain/state/StateObjectFactory';
import { InteractionBackendDict } from 'domain/exploration/InteractionObjectFactory';

describe('Statistics Tab Component', () => {
  let component: StatisticsTabComponent;
  let fixture: ComponentFixture<StatisticsTabComponent>;
  let ngbModal: NgbModal;
  let alertsService: AlertsService;
  let computeGraphService: ComputeGraphService;
  let explorationStatsService: ExplorationStatsService;
  let readOnlyExplorationBackendApiService:
     ReadOnlyExplorationBackendApiService;
  let stateInteractionStatsService: StateInteractionStatsService;
  let statesObjectFactory: StatesObjectFactory;
  let refreshStatisticsTabEventEmitter = new EventEmitter();

  class MockRouterService {
    onRefreshStatisticsTab = refreshStatisticsTabEventEmitter;
  }

  let explorationId = 'exp1';
  let state = {
    card_is_checkpoint: false,
    classifier_model_id: '1',
    content: {
      content_id: 'content1',
      html: 'This is a html text'
    },
    interaction: {
      customization_args: null
    } as InteractionBackendDict,
    linked_skill_id: null,
    next_content_id_index: 0,
    param_changes: [],
    recorded_voiceovers: {
      voiceovers_mapping: {}
    },
    solicit_answer_details: true,
    written_translations: {
      translations_mapping: {}
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        FormsModule,
      ],
      declarations: [
        StateStatsModalComponent,
        StatisticsTabComponent
      ],
      providers: [
        {
          provide: ExplorationDataService,
          useValue: {
            explorationId: explorationId
          }
        },
        {
          provide: RouterService,
          useClass: MockRouterService
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(
      StatisticsTabComponent);
    component = fixture.componentInstance;

    alertsService = TestBed.inject(AlertsService);
    explorationStatsService = TestBed.inject(ExplorationStatsService);
    stateInteractionStatsService = TestBed.inject(StateInteractionStatsService);
    ngbModal = TestBed.inject(NgbModal);
    readOnlyExplorationBackendApiService = TestBed.inject(
      ReadOnlyExplorationBackendApiService);
    statesObjectFactory = TestBed.inject(
      StatesObjectFactory);
    computeGraphService = TestBed.inject(
      ComputeGraphService);

    spyOn(statesObjectFactory, 'createFromBackendDict').and.returnValue(null);

    spyOn(
      readOnlyExplorationBackendApiService, 'loadLatestExplorationAsync').and
      .returnValue(Promise.resolve({
        exploration: {
          init_state_name: 'State1',
          states: {
            State1: state as StateBackendDict
          },
          param_changes: null,
          param_specs: null,
          title: null,
          language_code: null,
          objective: null,
          correctness_feedback_enabled: null,
        } as ReadOnlyExplorationBackendDict,
        can_edit: null,
        exploration_metadata: null,
        exploration_id: null,
        is_logged_in: null,
        session_id: null,
        version: null,
        preferred_audio_language_code: null,
        preferred_language_codes: null,
        auto_tts_enabled: null,
        correctness_feedback_enabled: null,
        record_playthrough_probability: null,
        draft_change_list_id: null,
        has_viewed_lesson_info_modal_once: null,
        furthest_reached_checkpoint_exp_version: null,
        furthest_reached_checkpoint_state_name: null,
        most_recently_reached_checkpoint_state_name: null,
        most_recently_reached_checkpoint_exp_version: null,
      } as FetchExplorationBackendResponse));

    spyOn(explorationStatsService, 'getExplorationStatsAsync').and.returnValue(
      Promise.resolve({
        numStarts: 20,
        numActualStarts: 10,
        numCompletions: 5,
      } as ExplorationStats));

    spyOn(stateInteractionStatsService, 'computeStatsAsync').and.returnValue(
      Promise.resolve({
        visualizationsInfo: {}
      } as StateInteractionStats));

    spyOn (computeGraphService, 'compute').and.stub();
    component.states = {
      getState: (name) => {
        return {
          interaction: {
            customizationArgs: null,
          }
        } as State;
      }
    } as States;

    component.expStats = {
      getStateStats: (name) => null
    } as ExplorationStats;

    component.ngOnInit();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should initialize controller properties after its initialization',
    () => {
      expect(component.stateStatsModalIsOpen).toBe(false);
      expect(component.explorationHasBeenVisited).toBe(false);
    });

  it('should refresh exploration statistics when broadcasting' +
     ' refreshStatisticsTab', fakeAsync(() => {
    refreshStatisticsTabEventEmitter.emit();
    tick();

    expect(component.statsGraphData).toEqual(undefined);
    expect(component.pieChartData).toEqual([
      ['Type', 'Number'],
      ['Completions', 5],
      ['Non-Completions', 5]
    ]);
    expect(component.numPassersby).toBe(10);
    expect(component.explorationHasBeenVisited).toBe(true);
  }));

  it('should open state stats modal and close it when clicking in stats' +
     ' graph', fakeAsync(() => {
    tick();

    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: {
        interactionArgs: '',
        stateName: 'stateName',
        visualizationsInfo: '',
        stateStats: false
      },
      result: Promise.resolve()
    } as NgbModalRef);
    tick();

    component.onClickStateInStatsGraph('id');
    tick();

    expect(component.stateStatsModalIsOpen).toBe(false);
  }));

  it('should open state stats modal and dismiss it when clicking in' +
     ' stats graph', fakeAsync(() => {
    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: {
        interactionArgs: '',
        stateName: 'stateName',
        visualizationsInfo: '',
        stateStats: false
      },
      result: Promise.reject()
    } as NgbModalRef);
    spyOn(alertsService, 'clearWarnings');

    component.onClickStateInStatsGraph('State1');
    tick();

    expect(component.stateStatsModalIsOpen).toBe(false);
    expect(alertsService.clearWarnings).toHaveBeenCalled();
  }));
});
