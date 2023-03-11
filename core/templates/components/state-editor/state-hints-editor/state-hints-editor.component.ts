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
 * @fileoverview Component for the add and view hints section of the state
 * editor.
 */

import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CdkDragSortEvent, moveItemInArray} from '@angular/cdk/drag-drop';
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Hint } from 'domain/exploration/hint-object.model';
import INTERACTION_SPECS from 'interactions/interaction_specs.json';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { StateEditorService } from 'components/state-editor/state-editor-properties-services/state-editor.service';
import { StateHintsService } from 'components/state-editor/state-editor-properties-services/state-hints.service';
import { StateInteractionIdService } from 'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import { StateSolutionService } from 'components/state-editor/state-editor-properties-services/state-solution.service';
import { FormatRtePreviewPipe } from 'filters/format-rte-preview.pipe';
import { AlertsService } from 'services/alerts.service';
import { EditabilityService } from 'services/editability.service';
import { ExternalSaveService } from 'services/external-save.service';
import { AddHintModalComponent } from 'pages/exploration-editor-page/editor-tab/templates/modal-templates/add-hint-modal.component';
import { DeleteHintModalComponent } from 'pages/exploration-editor-page/editor-tab/templates/modal-templates/delete-hint-modal.component';
import { DeleteLastHintModalComponent } from 'pages/exploration-editor-page/editor-tab/templates/modal-templates/delete-last-hint-modal.component';
import { Solution } from 'domain/exploration/SolutionObjectFactory';
import { InteractionSpecsKey } from 'pages/interaction-specs.constants';

interface DeleteValueResponse {
  index: number;
  evt: Event;
}

interface AddHintModalResponse {
  hint: Hint;
}

@Component({
  selector: 'oppia-state-hints-editor',
  templateUrl: './state-hints-editor.component.html'
})
export class StateHintsEditorComponent implements OnInit {
  @Output() onSaveNextContentIdIndex = new EventEmitter<number>();
  @Output() onSaveSolution = new EventEmitter<Solution | null>();

  @Output() onSaveHints = new EventEmitter<Hint[]>();

  hintCardIsShown: boolean = false;
  canEdit: boolean = false;

  constructor(
    private alertsService: AlertsService,
    private editabilityService: EditabilityService,
    private externalSaveService: ExternalSaveService,
    private formatRtePreviewPipe: FormatRtePreviewPipe,
    private ngbModal: NgbModal,
    private stateEditorService: StateEditorService,
    private stateHintsService: StateHintsService,
    private stateInteractionIdService: StateInteractionIdService,
    private stateSolutionService: StateSolutionService,
    private urlInterpolationService: UrlInterpolationService,
  ) {}

  drop(event: CdkDragSortEvent<Hint[]>): void {
    moveItemInArray(
      this.stateHintsService.displayed, event.previousIndex,
      event.currentIndex);
    this.stateHintsService.saveDisplayedValue();
    this.onSaveHints.emit(this.stateHintsService.displayed);
  }

  getHintButtonText(): string {
    let hintButtonText = '+ ADD HINT';
    if (this.stateHintsService.displayed) {
      if (this.stateHintsService.displayed.length >= 5) {
        hintButtonText = 'Limit Reached';
      }
    }
    return hintButtonText;
  }

  getHintSummary(hint: Hint): string {
    return this.formatRtePreviewPipe.transform(hint.hintContent.html);
  }

  changeActiveHintIndex(newIndex: number): void {
    const currentActiveIndex = this.stateHintsService.getActiveHintIndex();
    if (currentActiveIndex !== null && (
      !this.stateHintsService.displayed[currentActiveIndex]
        .hintContent.html)) {
      if (this.stateSolutionService.savedMemento &&
        this.stateHintsService.displayed.length === 1) {
        this.openDeleteLastHintModal();
        return;
      } else {
        this.alertsService.addInfoMessage('Deleting empty hint.');
        this.stateHintsService.displayed.splice(currentActiveIndex, 1);
        this.stateHintsService.saveDisplayedValue();
        this.onSaveHints.emit(this.stateHintsService.displayed);
      }
    }
    // If the current hint is being clicked on again, close it.
    if (newIndex === this.stateHintsService.getActiveHintIndex()) {
      this.stateHintsService.setActiveHintIndex(null);
    } else {
      this.stateHintsService.setActiveHintIndex(newIndex);
    }
  }

  // This returns false if the current interaction ID is null.
  isCurrentInteractionLinear(): boolean {
    const interactionId = this.stateInteractionIdService.savedMemento;
    if (interactionId) {
      return INTERACTION_SPECS[interactionId as InteractionSpecsKey].is_linear;
    }
    return false;
  }

  openAddHintModal(): void {
    if (this.stateHintsService.displayed.length >= 5) {
      return;
    }
    this.alertsService.clearWarnings();
    this.externalSaveService.onExternalSave.emit();

    this.ngbModal.open(AddHintModalComponent, {
      backdrop: 'static',
      windowClass: 'add-hint-modal'
    }).result.then((result: AddHintModalResponse): void => {
      this.stateHintsService.displayed.push(result.hint);
      this.stateHintsService.saveDisplayedValue();
      this.onSaveHints.emit(this.stateHintsService.displayed);
      this.onSaveNextContentIdIndex.emit();
    }, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
    });
  }

  openDeleteLastHintModal = (): void => {
    this.alertsService.clearWarnings();

    this.ngbModal.open(DeleteLastHintModalComponent, {
      backdrop: true,
    }).result.then((): void => {
      this.stateSolutionService.displayed = null;
      this.stateSolutionService.saveDisplayedValue();
      this.onSaveSolution.emit(this.stateSolutionService.displayed);

      this.stateHintsService.displayed = [];
      this.stateHintsService.saveDisplayedValue();
      this.onSaveHints.emit(this.stateHintsService.displayed);
    }, (): void => {
      this.alertsService.clearWarnings();
    });
  };

  deleteHint(value: DeleteValueResponse): void {
    // Prevent clicking on the delete button from also toggling the
    // display state of the hint.
    value.evt.stopPropagation();

    this.alertsService.clearWarnings();
    this.ngbModal.open(DeleteHintModalComponent, {
      backdrop: true,
    }).result.then((): void => {
      if (this.stateSolutionService.savedMemento &&
        this.stateHintsService.savedMemento.length === 1) {
        this.openDeleteLastHintModal();
      } else {
        this.stateHintsService.displayed.splice(value.index, 1);
        this.stateHintsService.saveDisplayedValue();
        this.onSaveHints.emit(this.stateHintsService.displayed);
      }

      if (value.index === this.stateHintsService.getActiveHintIndex()) {
        this.stateHintsService.setActiveHintIndex(null);
      }
    }, (): void => {
      this.alertsService.clearWarnings();
    });
  }

  onSaveInlineHint(): void {
    this.stateHintsService.saveDisplayedValue();
    this.onSaveHints.emit(this.stateHintsService.displayed);
  }

  toggleHintCard(): void {
    this.hintCardIsShown = !this.hintCardIsShown;
  }

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }

  ngOnInit(): void {
    this.hintCardIsShown = true;
    this.stateHintsService.setActiveHintIndex(null);
    this.canEdit = this.editabilityService.isEditable();
    // When the page is scrolled so that the top of the page is above
    // the browser viewport, there are some bugs in the positioning of
    // the helper. This is a bug in jQueryUI that has not been fixed
    // yet. For more details, see http://stackoverflow.com/q/5791886
    this.stateEditorService.updateStateHintsEditorInitialised();
  }
}

angular.module('oppia').directive('oppiaStateHintsEditor',
downgradeComponent({
  component: StateHintsEditorComponent
}) as angular.IDirectiveFactory);
