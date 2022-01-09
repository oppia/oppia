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

import { Component, Input, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { Hint } from 'domain/exploration/HintObjectFactory';
import INTERACTION_SPECS from 'interactions/interaction_specs.json';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { StateEditorService } from 'components/state-editor/state-editor-properties-services/state-editor.service';
import { StateHintsService } from 'components/state-editor/state-editor-properties-services/state-hints.service';
import { StateInteractionIdService } from 'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import { StateNextContentIdIndexService } from 'components/state-editor/state-editor-properties-services/state-next-content-id-index.service';
import { StateSolutionService } from 'components/state-editor/state-editor-properties-services/state-solution.service';
import { FormatRtePreviewPipe } from 'filters/format-rte-preview.pipe';
import { AlertsService } from 'services/alerts.service';
import { EditabilityService } from 'services/editability.service';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { ExternalSaveService } from 'services/external-save.service';
import { AddHintModalComponent } from 'pages/exploration-editor-page/editor-tab/templates/modal-templates/add-hint-modal.component';
import { DeleteHintModalComponent } from 'pages/exploration-editor-page/editor-tab/templates/modal-templates/delete-hint-modal.component';
import { DeleteLastHintModalComponent } from 'pages/exploration-editor-page/editor-tab/templates/modal-templates/delete-last-hint-modal.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CdkDragSortEvent, moveItemInArray} from '@angular/cdk/drag-drop';

interface AddHintModalResponse {
  hint: Hint;
}
@Component({
  selector: 'oppia-state-hints-editor',
  templateUrl: './state-hints-editor.component.html'
})
export class StateHintsEditorComponent implements OnInit {
  @Input() onSaveHints;
  @Input() onSaveNextContentIdIndex;
  @Input() onSaveSolution;
  @Input() showMarkAllAudioAsNeedingUpdateModalIfRequired;
  hintCardIsShown: boolean;
  canEdit: boolean;

  constructor(
    private stateHintsService: StateHintsService,
    private urlInterpolationService: UrlInterpolationService,
    private stateEditorService: StateEditorService,
    private stateInteractionIdService: StateInteractionIdService,
    private stateNextContentIdIndexService: StateNextContentIdIndexService,
    private stateSolutionService: StateSolutionService,
    private alertsService: AlertsService,
    private editabilityService: EditabilityService,
    private windowDimensionsService: WindowDimensionsService,
    private externalSaveService: ExternalSaveService,
    private formatRtePreviewPipe: FormatRtePreviewPipe,
    private ngbModal: NgbModal,
  ) {}

  drop(event: CdkDragSortEvent<Hint[]>): void {
    moveItemInArray(
      this.stateHintsService.displayed, event.previousIndex,
      event.currentIndex);
    this.stateHintsService.saveDisplayedValue();
    this.onSaveHints(this.stateHintsService.displayed);
  }

  getHintButtonText(): string {
    var hintButtonText = '+ ADD HINT';
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
        this.onSaveHints(this.stateHintsService.displayed);
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
    return interactionId && INTERACTION_SPECS[interactionId].is_linear;
  }

  openAddHintModal(): void {
    if (this.stateHintsService.displayed.length >= 5) {
      return;
    }
    this.alertsService.clearWarnings();
    this.externalSaveService.onExternalSave.emit();

    const addHintSuccess = (result: AddHintModalResponse): void => {
      this.stateHintsService.displayed.push(result.hint);
      this.stateHintsService.saveDisplayedValue();
      this.onSaveHints(this.stateHintsService.displayed);
      this.stateNextContentIdIndexService.saveDisplayedValue();
      this.onSaveNextContentIdIndex(
        this.stateNextContentIdIndexService.displayed);
    };

    this.ngbModal.open(AddHintModalComponent, {
      backdrop: 'static',
      windowClass: 'add-hint-modal'
    }).result.then(function(result) {
      addHintSuccess(result);
    }, function() {
      this.alertsService.clearWarnings();
    });
  }

  openDeleteLastHintModal = (): void => {
    this.alertsService.clearWarnings();

    const openDeleteLastHintSuccess = (): void => {
      this.stateSolutionService.displayed = null;
      this.stateSolutionService.saveDisplayedValue();
      this.onSaveSolution(this.stateSolutionService.displayed);

      this.stateHintsService.displayed = [];
      this.stateHintsService.saveDisplayedValue();
      this.onSaveHints(this.stateHintsService.displayed);
    };

    this.ngbModal.open(DeleteLastHintModalComponent, {
      backdrop: true,
    }).result.then(function() {
      openDeleteLastHintSuccess();
    }, function() {
      this.alertsService.clearWarnings();
    });
  };

  deleteHint = (index: number, evt: Event): void => {
    // Prevent clicking on the delete button from also toggling the
    // display state of the hint.
    evt.stopPropagation();

    const deleteHintModalSuccess = (): void => {
      if (this.stateSolutionService.savedMemento &&
        this.stateHintsService.savedMemento.length === 1) {
        this.openDeleteLastHintModal();
      } else {
        this.stateHintsService.displayed.splice(index, 1);
        this.stateHintsService.saveDisplayedValue();
        this.onSaveHints(this.stateHintsService.displayed);
      }

      if (index === this.stateHintsService.getActiveHintIndex()) {
        this.stateHintsService.setActiveHintIndex(null);
      }
    };

    this.alertsService.clearWarnings();
    this.ngbModal.open(DeleteHintModalComponent, {
      backdrop: true,
    }).result.then(function() {
      deleteHintModalSuccess();
    }, function() {
      this.alertsService.clearWarnings();
    });
  };

  onSaveInlineHint(): void {
    this.stateHintsService.saveDisplayedValue();
    this.onSaveHints(this.stateHintsService.displayed);
  }

  toggleHintCard(): void {
    this.hintCardIsShown = !this.hintCardIsShown;
  }

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }

  ngOnInit(): void {
    this.hintCardIsShown = (
      !this.windowDimensionsService.isWindowNarrow());
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
