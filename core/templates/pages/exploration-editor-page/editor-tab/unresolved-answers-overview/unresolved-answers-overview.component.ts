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

import {Component, OnInit} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import INTERACTION_SPECS from 'interactions/interaction_specs.json';
import {AppConstants} from 'app.constants';
import {StateEditorService} from 'components/state-editor/state-editor-properties-services/state-editor.service';
import {StateInteractionIdService} from 'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import {ExplorationStatesService} from 'pages/exploration-editor-page/services/exploration-states.service';
import {EditabilityService} from 'services/editability.service';
import {ImprovementsService} from 'services/improvements.service';
import {StateTopAnswersStatsService} from 'services/state-top-answers-stats.service';
import {TeachOppiaModalComponent} from '../templates/modal-templates/teach-oppia-modal.component';
import {AnswerStats} from 'domain/exploration/answer-stats.model';
import {ExternalSaveService} from 'services/external-save.service';
import {InteractionSpecsKey} from 'pages/interaction-specs.constants';

@Component({
  selector: 'oppia-unresolved-answers-overview',
  templateUrl: './unresolved-answers-overview.component.html',
})
export class UnresolvedAnswersOverviewComponent implements OnInit {
  // These properties below are initialized using Angular lifecycle hooks
  // where we need to do non-null assertion. For more information see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  unresolvedAnswersOverviewIsShown!: boolean;
  SHOW_TRAINABLE_UNRESOLVED_ANSWERS!: boolean;

  constructor(
    private editabilityService: EditabilityService,
    private explorationStatesService: ExplorationStatesService,
    private externalSaveService: ExternalSaveService,
    private improvementsService: ImprovementsService,
    private ngbModal: NgbModal,
    private stateEditorService: StateEditorService,
    private stateInteractionIdService: StateInteractionIdService,
    private stateTopAnswersStatsService: StateTopAnswersStatsService
  ) {}

  isStateRequiredToBeResolved(stateName: string): boolean {
    return this.improvementsService.isStateForcedToResolveOutstandingUnaddressedAnswers(
      this.explorationStatesService.getState(stateName)
    );
  }

  isUnresolvedAnswersOverviewShown(): boolean {
    let activeStateName = this.stateEditorService.getActiveStateName();
    if (activeStateName === null) {
      return false;
    }
    return (
      this.stateTopAnswersStatsService.hasStateStats(activeStateName) &&
      this.isStateRequiredToBeResolved(activeStateName)
    );
  }

  getCurrentInteractionId(): string {
    return this.stateInteractionIdService.savedMemento;
  }

  isCurrentInteractionLinear(): boolean {
    let interactionId = this.getCurrentInteractionId();
    return (
      Boolean(interactionId) &&
      INTERACTION_SPECS[interactionId as InteractionSpecsKey].is_linear
    );
  }

  isCurrentInteractionTrainable(): boolean {
    let interactionId = this.getCurrentInteractionId();
    return (
      Boolean(interactionId) &&
      INTERACTION_SPECS[interactionId as InteractionSpecsKey].is_trainable
    );
  }

  isEditableOutsideTutorialMode(): boolean {
    return this.editabilityService.isEditableOutsideTutorialMode();
  }

  openTeachOppiaModal(): void {
    this.externalSaveService.onExternalSave.emit();

    this.ngbModal
      .open(TeachOppiaModalComponent, {
        backdrop: 'static',
      })
      .result.then(
        () => {},
        () => {
          // Note to developers:
          // This callback is triggered when the Cancel button is clicked.
          // No further action is needed.
        }
      );
  }

  getUnresolvedStateStats(): AnswerStats[] {
    let stateName = this.stateEditorService.getActiveStateName();
    if (stateName === null) {
      throw new Error('State name should not be null.');
    }
    return this.stateTopAnswersStatsService.getUnresolvedStateStats(stateName);
  }

  ngOnInit(): void {
    this.unresolvedAnswersOverviewIsShown = false;
    this.SHOW_TRAINABLE_UNRESOLVED_ANSWERS =
      AppConstants.SHOW_TRAINABLE_UNRESOLVED_ANSWERS;
  }
}
