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
import { EditabilityService } from 'services/editability.service';
import { ExplorationHtmlFormatterService } from 'services/exploration-html-formatter.service';
import { ExternalSaveService } from 'services/external-save.service';
import { StateCustomizationArgsService } from '../state-editor-properties-services/state-customization-args.service';
import { StateEditorService } from '../state-editor-properties-services/state-editor.service';
import { StateHintsService } from '../state-editor-properties-services/state-hints.service';
import { StateInteractionIdService } from '../state-editor-properties-services/state-interaction-id.service';
import { StateSolutionService } from '../state-editor-properties-services/state-solution.service';
import { Solution } from 'domain/exploration/SolutionObjectFactory';
import { AppConstants } from 'app.constants';
import { StateEditorConstants } from '../state-editor.constants';
import { ConvertToPlainTextPipe } from 'filters/string-utility-filters/convert-to-plain-text.pipe';
import INTERACTION_SPECS from 'interactions/interaction_specs.json';
import { GenerateContentIdService } from 'services/generate-content-id.service';
import { InteractionSpecsKey } from 'pages/interaction-specs.constants';

interface DeleteValue {
  index: number;
  evt: Event;
}

@Component({
  selector: 'oppia-state-solution-editor',
  templateUrl: './state-solution-editor.component.html'
})
export class StateSolutionEditorComponent implements OnInit {
  // The state property is null until a solution is specified or removed.
  @Output() saveSolution: EventEmitter<Solution | null> = new EventEmitter();
  @Output() refreshWarnings: EventEmitter<void> = new EventEmitter();
  @Output() getSolutionChange: EventEmitter<void> = new EventEmitter();

  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  SOLUTION_EDITOR_FOCUS_LABEL!: string;
  correctAnswerEditorHtml!: string;
  inlineSolutionEditorIsActive: boolean = false;
  solutionCardIsShown: boolean = false;
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
    private generateContentIdService: GenerateContentIdService,
    private ngbModal: NgbModal,
    private solutionValidityService: SolutionValidityService,
    private solutionVerificationService: SolutionVerificationService,
    private stateCustomizationArgsService: StateCustomizationArgsService,
    private stateEditorService: StateEditorService,
    private stateHintsService: StateHintsService,
    private stateInteractionIdService: StateInteractionIdService,
    private stateSolutionService: StateSolutionService,
  ) {}

  ngOnInit(): void {
    this.solutionCardIsShown = true;
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

  isEditable(): boolean {
    return (
      this.editabilityService.isEditable() &&
      this.editabilityService.isEditableOutsideTutorialMode());
  }

  toggleInlineSolutionEditorIsActive(): void {
    this.inlineSolutionEditorIsActive = (
      !this.inlineSolutionEditorIsActive);
  }

  getSolutionSummary(): string {
    const solution = this.stateSolutionService.savedMemento;
    const interactionId = this.stateInteractionIdService.savedMemento;
    if (solution === null) {
      throw new Error('Expected solution to be non-null.');
    }
    const solutionSummary = (
      solution.getSummary(
        interactionId, this.stateCustomizationArgsService.savedMemento));
    const solutionAsPlainText = (
      this.convertToPlainText.transform(solutionSummary));
    return solutionAsPlainText;
  }

  // Returns null if solution is not yet specified or removed.
  savedMemento(): Solution | null {
    return this.stateSolutionService.savedMemento;
  }

  // This returns false if the current interaction ID is null.
  isCurrentInteractionLinear(): boolean {
    let savedMemento = this.stateInteractionIdService.savedMemento;
    return (Boolean(savedMemento) && INTERACTION_SPECS[
      savedMemento as InteractionSpecsKey].is_linear);
  }

  onSaveSolution(value: Solution | null): void {
    this.saveSolution.emit(value);
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
      this.onSaveSolution(this.stateSolutionService.displayed);
      let activeStateName = this.stateEditorService.getActiveStateName();
      if (activeStateName === null) {
        throw new Error('Expected active state name to be non-null.');
      }
      let solutionIsValid = this.solutionVerificationService.verifySolution(
        activeStateName,
        this.stateEditorService.getInteraction(),
        result.solution.correctAnswer
      );

      this.solutionValidityService.updateValidity(
        activeStateName, solutionIsValid);
      this.refreshWarnings.emit();
      this.getSolutionChange.emit();
      if (!solutionIsValid) {
        if (this.stateEditorService.isInQuestionMode()) {
          this.alertsService.addInfoMessage(
            this.INFO_MESSAGE_SOLUTION_IS_INVALID_FOR_QUESTION, 4000);
        } else {
          this.alertsService.addInfoMessage(
            this.INFO_MESSAGE_SOLUTION_IS_INVALID_FOR_EXPLORATION, 4000);
        }
      }
    }, () => {
      this.generateContentIdService.revertUnusedContentIdIndex();
      this.alertsService.clearWarnings();
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
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
      this.getSolutionChange.emit();
    }, () => {
      this.alertsService.clearWarnings();
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
    });
  }

  toggleSolutionCard(): void {
    this.solutionCardIsShown = !this.solutionCardIsShown;
  }
}

angular.module('oppia').directive('oppiaStateSolutionEditor',
downgradeComponent({
  component: StateSolutionEditorComponent
}) as angular.IDirectiveFactory);
