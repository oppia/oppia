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
 * @fileoverview Component for the exploration statistics tab in the
 * exploration editor.
 */

import {Component, OnDestroy, OnInit} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ReadOnlyExplorationBackendApiService} from 'domain/exploration/read-only-exploration-backend-api.service';
import {
  States,
  StatesObjectFactory,
} from 'domain/exploration/StatesObjectFactory';
import {ExplorationStats} from 'domain/statistics/exploration-stats.model';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {Subscription} from 'rxjs';
import {AlertsService} from 'services/alerts.service';
import {ComputeGraphService, GraphData} from 'services/compute-graph.service';
import {ExplorationStatsService} from 'services/exploration-stats.service';
import {StateInteractionStatsService} from 'services/state-interaction-stats.service';
import {ExplorationDataService} from '../services/exploration-data.service';
import {RouterService} from '../services/router.service';
import {StateStatsModalComponent} from './templates/state-stats-modal.component';

interface PieChartOptions {
  chartAreaWidth: number;
  colors: string[];
  height: number;
  left: number;
  legendPosition: string;
  pieHole: number;
  pieSliceBorderColor: string;
  pieSliceTextStyleColor: string;
  title: string;
  width: number;
}

@Component({
  selector: 'oppia-statistics-tab',
  templateUrl: './statistics-tab.component.html',
})
export class StatisticsTabComponent implements OnInit, OnDestroy {
  directiveSubscriptions = new Subscription();
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  stateStatsModalIsOpen!: boolean;
  explorationHasBeenVisited!: boolean;
  pieChartOptions!: PieChartOptions;
  pieChartData!: ((string | number)[] | string[])[];
  statsGraphData!: GraphData;
  numPassersby!: number;
  states!: States;
  expStats!: ExplorationStats;
  expId!: string;

  constructor(
    private alertsService: AlertsService,
    private computeGraphService: ComputeGraphService,
    private explorationDataService: ExplorationDataService,
    private explorationStatsService: ExplorationStatsService,
    private ngbModal: NgbModal,
    private readOnlyExplorationBackendApiService: ReadOnlyExplorationBackendApiService,
    private routerService: RouterService,
    private stateInteractionStatsService: StateInteractionStatsService,
    private statesObjectFactory: StatesObjectFactory,
    private urlInterpolationService: UrlInterpolationService
  ) {}

  refreshExplorationStatistics(): void {
    Promise.all([
      this.readOnlyExplorationBackendApiService.loadLatestExplorationAsync(
        this.expId
      ),
      this.explorationStatsService.getExplorationStatsAsync(this.expId),
    ]).then(responses => {
      const [expResponse, expStats] = responses;
      const initStateName = expResponse.exploration.init_state_name;
      const numNonCompletions =
        expStats.numActualStarts - expStats.numCompletions;

      this.states = this.statesObjectFactory.createFromBackendDict(
        expResponse.exploration.states
      );
      this.expStats = expStats;

      this.statsGraphData = this.computeGraphService.compute(
        initStateName,
        this.states
      );
      this.numPassersby = expStats.numStarts - expStats.numActualStarts;

      this.pieChartData = [
        ['Type', 'Number'],
        ['Completions', expStats.numCompletions],
        ['Non-Completions', numNonCompletions],
      ];

      this.pieChartOptions = {
        chartAreaWidth: 500,
        colors: ['#008808', '#d8d8d8'],
        height: 300,
        left: 230,
        legendPosition: 'right',
        pieHole: 0.6,
        pieSliceBorderColor: 'black',
        pieSliceTextStyleColor: 'black',
        title: '',
        width: 600,
      };

      if (expStats.numActualStarts > 0) {
        this.explorationHasBeenVisited = true;
      }
    });
  }

  onClickStateInStatsGraph(stateName: string): void {
    if (!this.stateStatsModalIsOpen) {
      this.stateStatsModalIsOpen = true;

      const state = this.states.getState(stateName);
      this.alertsService.clearWarnings();

      this.stateInteractionStatsService
        .computeStatsAsync(this.expId, state)
        .then(stats => {
          const modalRef = this.ngbModal.open(StateStatsModalComponent, {
            backdrop: false,
          });

          modalRef.componentInstance.interactionArgs =
            state.interaction.customizationArgs;
          modalRef.componentInstance.stateName = stateName;
          modalRef.componentInstance.visualizationsInfo =
            stats.visualizationsInfo;
          modalRef.componentInstance.stateStats =
            this.expStats.getStateStats(stateName);

          modalRef.result.then(
            () => (this.stateStatsModalIsOpen = false),
            () => {
              this.alertsService.clearWarnings();
              this.stateStatsModalIsOpen = false;
            }
          );
        });
    }
  }

  ngOnInit(): void {
    this.expId = this.explorationDataService.explorationId;

    this.stateStatsModalIsOpen = false;
    this.explorationHasBeenVisited = false;

    this.directiveSubscriptions.add(
      this.routerService.onRefreshStatisticsTab.subscribe(() =>
        this.refreshExplorationStatistics()
      )
    );

    this.refreshExplorationStatistics();
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
