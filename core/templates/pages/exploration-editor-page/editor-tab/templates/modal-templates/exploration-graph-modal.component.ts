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
 * @fileoverview Component for exploration graph modal.
 */

import { Component, Input, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmOrCancelModal } from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import { StateEditorService } from 'components/state-editor/state-editor-properties-services/state-editor.service';
import { GraphDataService } from 'pages/exploration-editor-page/services/graph-data.service';
import { GraphData } from 'services/compute-graph.service';

@Component({
  selector: 'oppia-exploration-graph-modal',
  templateUrl: './exploration-graph-modal.component.html'
})
export class ExplorationGraphModalComponent
  extends ConfirmOrCancelModal implements OnInit {
  // These properties below are initialized using Angular lifecycle hooks
  // where we need to do non-null assertion. For more information see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() isEditable!: boolean;
  // State name is null if their is no state selected or have no active state.
  // This is the case when the user is creating a new state.
  currentStateName!: string | null;
  graphData!: GraphData;

  constructor(
    private graphDataService: GraphDataService,
    private ngbActiveModal: NgbActiveModal,
    private stateEditorService: StateEditorService,
  ) {
    super(ngbActiveModal);
  }

  deleteState(stateName: string): void {
    this.ngbActiveModal.close({
      action: 'delete',
      stateName: stateName
    });
  }

  selectState(stateName: string): void {
    this.ngbActiveModal.close({
      action: 'navigate',
      stateName: stateName
    });
  }

  ngOnInit(): void {
    this.currentStateName = this.stateEditorService
      .getActiveStateName();
    this.graphData = this.graphDataService.getGraphData();
  }
}

angular.module('oppia').directive('oppiaPostPublishModal',
  downgradeComponent({
    component: ExplorationGraphModalComponent
  }) as angular.IDirectiveFactory);
