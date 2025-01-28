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
 * @fileoverview Component for the exploration graph.
 */

import {Component} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {StateEditorService} from 'components/state-editor/state-editor-properties-services/state-editor.service';
import {ExplorationStatesService} from 'pages/exploration-editor-page/services/exploration-states.service';
import {ExplorationWarningsService} from 'pages/exploration-editor-page/services/exploration-warnings.service';
import {GraphDataService} from 'pages/exploration-editor-page/services/graph-data.service';
import {RouterService} from 'pages/exploration-editor-page/services/router.service';
import {AlertsService} from 'services/alerts.service';
import {GraphData} from 'services/compute-graph.service';
import {LoggerService} from 'services/contextual/logger.service';
import {EditabilityService} from 'services/editability.service';
import {ExplorationGraphModalComponent} from '../templates/modal-templates/exploration-graph-modal.component';

@Component({
  selector: 'oppia-exploration-graph',
  templateUrl: './exploration-graph.component.html',
})
export class ExplorationGraphComponent {
  // This property is initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  checkpointCountWarning!: string;

  constructor(
    private alertsService: AlertsService,
    private editabilityService: EditabilityService,
    private explorationStatesService: ExplorationStatesService,
    private explorationWarningsService: ExplorationWarningsService,
    private graphDataService: GraphDataService,
    private loggerService: LoggerService,
    private ngbModal: NgbModal,
    private routerService: RouterService,
    private stateEditorService: StateEditorService
  ) {}

  // We hide the graph at the outset in order not to confuse new
  // exploration creators.
  isGraphShown(): boolean {
    return Boolean(this.explorationStatesService.isInitialized());
  }

  deleteState(deleteStateName: string): void {
    this.explorationStatesService.deleteState(deleteStateName);
  }

  onClickStateInMinimap(stateName: string): void {
    this.routerService.navigateToMainTab(stateName);
  }

  // Return null if their is no active state name.
  getActiveStateName(): string | null {
    return this.stateEditorService.getActiveStateName();
  }

  getCheckpointCount(): number {
    return this.explorationStatesService.getCheckpointCount();
  }

  openStateGraphModal(): void {
    this.alertsService.clearWarnings();

    const modalRef: NgbModalRef = this.ngbModal.open(
      ExplorationGraphModalComponent,
      {
        backdrop: true,
        windowClass: 'oppia-large-modal-window exploration-graph-modal',
      }
    );

    modalRef.componentInstance.isEditable = this.isEditable;

    modalRef.result.then(
      closeDict => {
        if (closeDict.action === 'delete') {
          this.deleteState(closeDict.stateName);
        } else if (closeDict.action === 'navigate') {
          this.onClickStateInMinimap(closeDict.stateName);
        } else {
          this.loggerService.error(
            'Invalid closeDict action: ' + closeDict.action
          );
        }
      },
      () => {
        this.alertsService.clearWarnings();
      }
    );
  }

  getGraphData(): GraphData {
    return this.graphDataService.getGraphData();
  }

  isEditable(): boolean {
    return this.editabilityService.isEditable();
  }

  showCheckpointCountWarningSign(): string {
    this.checkpointCountWarning =
      this.explorationWarningsService.getCheckpointCountWarning();

    return this.checkpointCountWarning;
  }
}
