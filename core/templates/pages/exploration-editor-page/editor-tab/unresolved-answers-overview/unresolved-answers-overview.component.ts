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
 * @fileoverview Component for the state graph visualization.
 */

import { Component, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import INTERACTION_SPECS from 'interactions/interaction_specs.json';
import { AppConstants } from 'app.constants';
import { StateEditorService } from 'components/state-editor/state-editor-properties-services/state-editor.service';
import { StateInteractionIdService } from 'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import { ExplorationStatesService } from 'pages/exploration-editor-page/services/exploration-states.service';
import { EditabilityService } from 'services/editability.service';
import { ImprovementsService } from 'services/improvements.service';
import { StateTopAnswersStatsService } from 'services/state-top-answers-stats.service';
import { TeachOppiaModalComponent } from '../templates/modal-templates/teach-oppia-modal.component';
import { AnswerStats } from 'domain/exploration/answer-stats.model';
import { ExternalSaveService } from 'services/external-save.service';

@Component({
  selector: 'oppia-unresolved-answers-overview',
  templateUrl: './unresolved-answers-overview.component.html'
})

export class UnresolvedAnswersOverviewComponent
  implements OnInit {
  unresolvedAnswersOverviewIsShown: boolean;
  SHOW_TRAINABLE_UNRESOLVED_ANSWERS: boolean;

  constructor(
    private improvementsService: ImprovementsService,
    private explorationStatesService: ExplorationStatesService,
    private stateEditorService: StateEditorService,
    private stateTopAnswersStatsService: StateTopAnswersStatsService,
    private stateInteractionIdService: StateInteractionIdService,
    private editabilityService: EditabilityService,
    private externalSaveService: ExternalSaveService,
    private ngbModal: NgbModal,
  ) { }

  isStateRequiredToBeResolved(stateName: string): boolean {
    return this.improvementsService
      .isStateForcedToResolveOutstandingUnaddressedAnswers(
        this.explorationStatesService.getState(stateName));
  }

  isUnresolvedAnswersOverviewShown(): boolean {
    let activeStateName = this.stateEditorService.getActiveStateName();
    return this.stateTopAnswersStatsService.hasStateStats(activeStateName) &&
      this.isStateRequiredToBeResolved(activeStateName);
  }

  getCurrentInteractionId(): string {
    return this.stateInteractionIdService.savedMemento;
  }

  isCurrentInteractionLinear(): boolean {
    let interactionId = this.getCurrentInteractionId();
    return interactionId && INTERACTION_SPECS[interactionId].is_linear;
  }

  isCurrentInteractionTrainable(): boolean {
    let interactionId = this.getCurrentInteractionId();
    return (
      interactionId &&
      INTERACTION_SPECS[interactionId].is_trainable);
  }

  isEditableOutsideTutorialMode(): boolean {
    return this.editabilityService.isEditableOutsideTutorialMode();
  }

  openTeachOppiaModal(): void {
    this.externalSaveService.onExternalSave.emit();

    this.ngbModal.open(TeachOppiaModalComponent, {
      backdrop: 'static'
    }).result.then(() => {}, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
    });
  }

  getUnresolvedStateStats(): AnswerStats[] {
    return this.stateTopAnswersStatsService.getUnresolvedStateStats(
      this.stateEditorService.getActiveStateName());
  }

  ngOnInit(): void {
    this.unresolvedAnswersOverviewIsShown = false;
    this.SHOW_TRAINABLE_UNRESOLVED_ANSWERS = (
      AppConstants.SHOW_TRAINABLE_UNRESOLVED_ANSWERS);
  }
}

angular.module('oppia').directive('oppiaUnresolvedAnswersOverview',
  downgradeComponent({
    component: UnresolvedAnswersOverviewComponent
  }) as angular.IDirectiveFactory);
