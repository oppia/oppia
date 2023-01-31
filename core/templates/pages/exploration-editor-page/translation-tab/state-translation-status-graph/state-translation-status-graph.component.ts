// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Compoennt for the state translation status graph.
 */

import { Component, Input } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { StateEditorService } from 'components/state-editor/state-editor-properties-services/state-editor.service';
import { StateRecordedVoiceoversService } from 'components/state-editor/state-editor-properties-services/state-recorded-voiceovers.service';
import { ExplorationStatesService } from 'pages/exploration-editor-page/services/exploration-states.service';
import { GraphDataService } from 'pages/exploration-editor-page/services/graph-data.service';
import { RouterService } from 'pages/exploration-editor-page/services/router.service';
import { TranslationStatusService } from '../services/translation-status.service';

@Component({
  selector: 'oppia-state-translation-status-graph',
  templateUrl: './state-translation-status-graph.component.html'
})
export class StateTranslationStatusGraphComponent {
  // This property is initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() isTranslationTabBusy!: boolean;

  constructor(
    private explorationStatesService: ExplorationStatesService,
    private graphDataService: GraphDataService,
    private stateEditorService: StateEditorService,
    private routerService: RouterService,
    private stateRecordedVoiceoversService: StateRecordedVoiceoversService,
    private translationStatusService: TranslationStatusService
  ) { }

  nodeColors(): object {
    return this.translationStatusService.getAllStateStatusColors();
  }

  getActiveStateName(): string | null {
    return this.stateEditorService.getActiveStateName();
  }

  onClickStateInMap(newStateName: string): void {
    if (this.isTranslationTabBusy) {
      this.stateEditorService.onShowTranslationTabBusyModal.emit();
      return;
    }
    this.stateEditorService.setActiveStateName(newStateName);
    let stateName = this.stateEditorService.getActiveStateName();
    if (!stateName) {
      throw new Error('Active state name cannot be null.');
    }
    let stateData = this.explorationStatesService.getState(stateName);

    if (stateName && stateData) {
      this.stateRecordedVoiceoversService.init(
        stateName, stateData.recordedVoiceovers);
      this.stateEditorService.onRefreshStateTranslation.emit();
    }
    this.routerService.onCenterGraph.emit();
  }
}

angular.module('oppia').directive('oppiaStateTranslationStatusGraph',
  downgradeComponent({
    component: StateTranslationStatusGraphComponent
  }) as angular.IDirectiveFactory);
