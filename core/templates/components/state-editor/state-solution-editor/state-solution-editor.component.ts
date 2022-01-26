// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the solution viewer and editor section in the
 * state editor.
 */

import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SolutionValidityService } from 'pages/exploration-editor-page/editor-tab/services/solution-validity.service';
import { SolutionVerificationService } from 'pages/exploration-editor-page/editor-tab/services/solution-verification.service';
import { AddOrUpdateSolutionModalComponent } from 'pages/exploration-editor-page/editor-tab/templates/modal-templates/add-or-update-solution-modal.component';
import { DeleteSolutionModalComponent } from 'pages/exploration-editor-page/editor-tab/templates/modal-templates/delete-solution-modal.component';
import { AlertsService } from 'services/alerts.service';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { EditabilityService } from 'services/editability.service';
import { ExplorationHtmlFormatterService } from 'services/exploration-html-formatter.service';
import { ExternalSaveService } from 'services/external-save.service';
import { StateCustomizationArgsService } from '../state-editor-properties-services/state-customization-args.service';
import { StateEditorService } from '../state-editor-properties-services/state-editor.service';
import { StateHintsService } from '../state-editor-properties-services/state-hints.service';
import { StateInteractionIdService } from '../state-editor-properties-services/state-interaction-id.service';
import { StateSolutionService } from '../state-editor-properties-services/state-solution.service';
import INTERACTION_SPECS from 'interactions/interaction_specs.json';
import { Solution } from 'domain/exploration/SolutionObjectFactory';
import { AppConstants } from 'app.constants';
import { StateEditorConstants } from '../state-editor.constants';
import { ConvertToPlainTextPipe } from 'filters/string-utility-filters/convert-to-plain-text.pipe';

interface DeleteValue {
  index: number;
  evt: Event;
}
@Component({
  selector: 'oppia-state-solution-editor',
  templateUrl: './state-solution-editor.component.html'
})
export class StateSolutionEditorComponent implements OnInit {
  @Output() saveSolution: EventEmitter<Solution> = new EventEmitter();
  @Output() refreshWarnings: EventEmitter<void> = new EventEmitter();
  @Output() showMarkAllAudioAsNeedingUpdateModalIfRequired:
  EventEmitter<Solution> = (new EventEmitter());
  correctAnswer: string;
  inlineSolutionEditorIsActive: boolean;
  solutionCardIsShown: boolean;
  SOLUTION_EDITOR_FOCUS_LABEL: string;
  correctAnswerEditorHtml: string;
  INFO_MESSAGE_SOLUTION_IS_INVALID_FOR_QUESTION: string = (
    StateEditorConstants.INFO_MESSAGE_SOLUTION_IS_INVALID_FOR_QUESTION);
  INFO_MESSAGE_SOLUTION_IS_INVALID_FOR_EXPLORATION: string = (
    AppConstants.INFO_MESSAGE_SOLUTION_IS_INVALID_FOR_EXPLORATION);

  constructor(
    private alertsService: AlertsService,
    private convertToPlainText: ConvertToPlainTextPipe,
    private editabilityService: EditabilityService,
    private explorationHtmlFormatterService: ExplorationHtmlFormatterService,
    private externalSaveService: ExternalSaveService,
    private ngbModal: NgbModal,
    private solutionValidityService: SolutionValidityService,
    private solutionVerificationService: SolutionVerificationService,
    private stateCustomizationArgsService: StateCustomizationArgsService,
    private stateEditorService: StateEditorService,
    private stateHintsService: StateHintsService,
    private stateInteractionIdService: StateInteractionIdService,
    private stateSolutionService: StateSolutionService,
    private windowDimensionsService: WindowDimensionsService,
  ) {}

  ngOnInit(): void {
    this.correctAnswer = null;
    this.solutionCardIsShown = (
      !this.windowDimensionsService.isWindowNarrow());
    this.inlineSolutionEditorIsActive = false;
    this.SOLUTION_EDITOR_FOCUS_LABEL = (
      'currentCorrectAnswerEditorHtmlForSolutionEditor');
    this.stateEditorService.updateStateSolutionEditorInitialised();
    this.correctAnswerEditorHtml = (
      this.explorationHtmlFormatterService.getInteractionHtml(
        this.stateInteractionIdService.savedMemento,
        this.stateCustomizationArgsService.savedMemento,
        false,
        this.SOLUTION_EDITOR_FOCUS_LABEL, null));
  }

  displayedHintsLength(): number {
    return this.stateHintsService.displayed.length;
  }

  getInvalidSolutionTooltip(): string {
    if (this.stateEditorService.isInQuestionMode()) {
      return 'This solution doesn\'t correspond to an answer ' +
        'marked as correct. Verify the rules specified for the ' +
        'answers or change the solution.';
    }
    return 'This solution does not lead to another card. Verify the ' +
      'responses specified or change the solution.';
  }

  isSolutionValid(): boolean {
    return this.stateEditorService.isCurrentSolutionValid();
  }

  isEditableOutsideTutorialMode(): boolean {
    return this.editabilityService.isEditableOutsideTutorialMode();
  }

  toggleInlineSolutionEditorIsActive(): void {
    this.inlineSolutionEditorIsActive = (
      !this.inlineSolutionEditorIsActive);
  }

  getSolutionSummary(): string {
    let solution = this.stateSolutionService.savedMemento;
    let solutionAsPlainText = (
      solution.getSummary(this.stateInteractionIdService.savedMemento));
    solutionAsPlainText = (
      this.convertToPlainText.transform(solutionAsPlainText));
    return solutionAsPlainText;
  }

  savedMemento(): Solution {
    return this.stateSolutionService.savedMemento;
  }

  // This returns false if the current interaction ID is null.
  isCurrentInteractionLinear(): boolean {
    return (
      this.stateInteractionIdService.savedMemento &&
      INTERACTION_SPECS[
        this.stateInteractionIdService.savedMemento
      ].is_linear);
  }

  onSaveSolution(value: Solution): void {
    this.saveSolution.emit(value);
  }

  openMarkAllAudioAsNeedingUpdateModalIfRequired(value: Solution): void {
    this.showMarkAllAudioAsNeedingUpdateModalIfRequired.emit(value);
  }

  openAddOrUpdateSolutionModal(): void {
    this.alertsService.clearWarnings();
    this.externalSaveService.onExternalSave.emit();
    this.inlineSolutionEditorIsActive = false;
    this.ngbModal.open(AddOrUpdateSolutionModalComponent, {
      backdrop: 'static'
    }).result.then((result) => {
      this.stateSolutionService.displayed = result.solution;
      this.stateSolutionService.saveDisplayedValue();
      this.saveSolution.emit(this.stateSolutionService.displayed);
      let solutionIsValid = this.solutionVerificationService.verifySolution(
        this.stateEditorService.getActiveStateName(),
        this.stateEditorService.getInteraction(),
        this.stateSolutionService.savedMemento.correctAnswer
      );

      this.solutionValidityService.updateValidity(
        this.stateEditorService.getActiveStateName(), solutionIsValid);
      this.refreshWarnings.emit();
      if (!solutionIsValid) {
        if (this.stateEditorService.isInQuestionMode()) {
          this.alertsService.addInfoMessage(
            this.INFO_MESSAGE_SOLUTION_IS_INVALID_FOR_QUESTION, 4000);
        } else {
          this.alertsService.addInfoMessage(
            this.INFO_MESSAGE_SOLUTION_IS_INVALID_FOR_EXPLORATION, 4000);
        }
      }
      () => {
        this.alertsService.clearWarnings();
      };
    });
  }

  deleteSolution(value: DeleteValue): void {
    value.evt.stopPropagation();

    this.alertsService.clearWarnings();
    this.ngbModal.open(DeleteSolutionModalComponent, {
      backdrop: true,
    }).result.then(() => {
      this.stateSolutionService.displayed = null;
      this.stateSolutionService.saveDisplayedValue();
      this.onSaveSolution(this.stateSolutionService.displayed);
      this.stateEditorService.deleteCurrentSolutionValidity();
      this.refreshWarnings.emit();
      () => {
        this.alertsService.clearWarnings();
      };
    });
  }

  toggleSolutionCard(): void {
    this.solutionCardIsShown = !this.solutionCardIsShown;
  }
}

angular.module('oppia').directive('oppiaStateSolutionEditor',
  downgradeComponent({component: StateSolutionEditorComponent}));
