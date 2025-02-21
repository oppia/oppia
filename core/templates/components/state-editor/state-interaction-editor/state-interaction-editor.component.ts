// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the interaction editor section in the state
 * editor.
 */

import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  ElementRef,
} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {InteractionDetailsCacheService} from 'pages/exploration-editor-page/editor-tab/services/interaction-details-cache.service';
import {ResponsesService} from 'pages/exploration-editor-page/editor-tab/services/responses.service';
import {CustomizeInteractionModalComponent} from 'pages/exploration-editor-page/editor-tab/templates/modal-templates/customize-interaction-modal.component';
import {DeleteInteractionModalComponent} from 'pages/exploration-editor-page/editor-tab/templates/modal-templates/delete-interaction-modal.component';
import {Subscription} from 'rxjs';
import {AlertsService} from 'services/alerts.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {EditabilityService} from 'services/editability.service';
import {StateCustomizationArgsService} from '../state-editor-properties-services/state-customization-args.service';
import {StateEditorService} from '../state-editor-properties-services/state-editor.service';
import {StateInteractionIdService} from '../state-editor-properties-services/state-interaction-id.service';
import {StateSolutionService} from '../state-editor-properties-services/state-solution.service';
import {StateContentService} from '../state-editor-properties-services/state-content.service';
import {ContextService} from 'services/context.service';
import {ExplorationHtmlFormatterService} from 'services/exploration-html-formatter.service';
import {
  InteractionCustomizationArgs,
  InteractionData,
} from 'interactions/customization-args-defs';
import {Solution} from 'domain/exploration/SolutionObjectFactory';
import {SubtitledHtml} from 'domain/exploration/subtitled-html.model';
import INTERACTION_SPECS from 'interactions/interaction_specs.json';
import {State} from 'domain/state/StateObjectFactory';
import {AnswerGroup} from 'domain/exploration/AnswerGroupObjectFactory';
import {Outcome} from 'domain/exploration/OutcomeObjectFactory';
import {InteractionAnswer} from 'interactions/answer-defs';
import {GenerateContentIdService} from 'services/generate-content-id.service';

export interface InitializeAnswerGroups {
  interactionId: string;
  answerGroups: AnswerGroup[];
  defaultOutcome: Outcome;
  confirmedUnclassifiedAnswers: readonly InteractionAnswer[];
}

@Component({
  selector: 'oppia-state-interaction-editor',
  templateUrl: './state-interaction-editor.component.html',
})
export class StateInteractionEditorComponent implements OnInit, OnDestroy {
  @Output() markAllAudioAsNeedingUpdateModalIfRequired = new EventEmitter<
    string[]
  >();

  @Output() onSaveInteractionData = new EventEmitter<InteractionData>();
  @Output() onSaveNextContentIdIndex = new EventEmitter<number>();
  @Output() onSaveSolution = new EventEmitter<Solution>();
  @Output() onSaveStateContent = new EventEmitter<SubtitledHtml>();
  @Output() recomputeGraph = new EventEmitter<void>();

  @ViewChild('customizeInteractionButton')
  customizeInteractionButton!: ElementRef;

  @ViewChild('collapseAnswersAndResponsesButton')
  collapseAnswersAndResponsesButton!: ElementRef;

  customizationModalReopened: boolean;
  DEFAULT_TERMINAL_STATE_CONTENT: string;
  directiveSubscriptions = new Subscription();
  hasLoaded: boolean;
  interactionEditorIsShown: boolean;
  interactionId: string;
  interactionIsDisabled: boolean;
  interactionPreviewHtml: string;
  windowIsNarrow: boolean;

  constructor(
    private alertsService: AlertsService,
    private contextService: ContextService,
    private editabilityService: EditabilityService,
    private explorationHtmlFormatterService: ExplorationHtmlFormatterService,
    private interactionDetailsCacheService: InteractionDetailsCacheService,
    private ngbModal: NgbModal,
    private responsesService: ResponsesService,
    private stateContentService: StateContentService,
    private stateCustomizationArgsService: StateCustomizationArgsService,
    private stateEditorService: StateEditorService,
    private stateInteractionIdService: StateInteractionIdService,
    private generateContentIdService: GenerateContentIdService,
    private stateSolutionService: StateSolutionService,
    private urlInterpolationService: UrlInterpolationService,
    private windowDimensionsService: WindowDimensionsService
  ) {}

  getCurrentInteractionName(): string {
    return this.stateInteractionIdService.savedMemento
      ? INTERACTION_SPECS[this.stateInteractionIdService.savedMemento].name
      : '';
  }

  _getInteractionPreviewTag(
    interactionCustomizationArgs: InteractionCustomizationArgs
  ): string {
    if (!this.stateInteractionIdService.savedMemento) {
      return '';
    }

    return this.explorationHtmlFormatterService.getInteractionHtml(
      this.stateInteractionIdService.savedMemento,
      interactionCustomizationArgs,
      false,
      null,
      null
    );
  }

  _updateInteractionPreview(): void {
    this.interactionId = this.stateInteractionIdService.savedMemento;

    let currentCustomizationArgs =
      this.stateCustomizationArgsService.savedMemento;
    this.interactionPreviewHtml = this._getInteractionPreviewTag(
      currentCustomizationArgs
    );
    this.interactionIsDisabled =
      this.interactionId === 'EndExploration' &&
      this.contextService.isExplorationLinkedToStory();
  }

  _updateAnswerChoices(): void {
    this.stateEditorService.onUpdateAnswerChoices.emit(
      this.stateEditorService.getAnswerChoices(
        this.interactionId,
        this.stateCustomizationArgsService.savedMemento
      )
    );
  }

  // If a terminal interaction is selected for a state with no content,
  // this function sets the content to DEFAULT_TERMINAL_STATE_CONTENT.
  // NOTE TO DEVELOPERS: Callers of this function must ensure that the
  // current active state is a terminal one.

  updateDefaultTerminalStateContentIfEmpty(): void {
    // Check if the content is currently empty, as expected.
    let previousContent = this.stateContentService.savedMemento;
    if (!previousContent.isEmpty()) {
      return;
    }
    // Update the state's content.
    this.stateContentService.displayed.html =
      this.DEFAULT_TERMINAL_STATE_CONTENT;
    this.stateContentService.saveDisplayedValue();
    this.onSaveStateContent.emit(this.stateContentService.displayed);
  }

  focusOnCustomizeInteraction(event: KeyboardEvent): void {
    if (
      this.getCurrentInteractionName() !== '' &&
      this.interactionEditorIsShown
    ) {
      event.preventDefault();
      this.customizeInteractionButton.nativeElement.focus();
    }
  }

  focusOnCollapseAnswersAndResponses(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.openInteractionCustomizerModal();
    }
    if (event.shiftKey && event.key === 'Tab') {
      event.preventDefault();
      this.collapseAnswersAndResponsesButton.nativeElement.focus();
    }
  }

  onCustomizationModalSavePostHook(): void {
    let hasInteractionIdChanged =
      this.stateInteractionIdService.displayed !==
      this.stateInteractionIdService.savedMemento;
    if (hasInteractionIdChanged) {
      if (
        INTERACTION_SPECS[this.stateInteractionIdService.displayed].is_terminal
      ) {
        this.updateDefaultTerminalStateContentIfEmpty();
      }
      this.stateInteractionIdService.saveDisplayedValue();
    }
    this.stateCustomizationArgsService.saveDisplayedValue();

    let interactionData: InteractionData = {
      interactionId: this.stateInteractionIdService.displayed,
      customizationArgs: this.stateCustomizationArgsService.displayed,
    };
    this.onSaveInteractionData.emit(interactionData);

    this.onSaveNextContentIdIndex.emit();
    this.interactionDetailsCacheService.set(
      this.stateInteractionIdService.savedMemento,
      this.stateCustomizationArgsService.savedMemento
    );

    // This must be called here so that the rules are updated before the
    // state graph is recomputed.
    if (hasInteractionIdChanged) {
      this.stateInteractionIdService.onInteractionIdChanged.emit(
        this.stateInteractionIdService.savedMemento
      );
    }

    this.recomputeGraph.emit();
    this._updateInteractionPreview();
    this.stateEditorService.onHandleCustomArgsUpdate.emit(
      this.stateEditorService.getAnswerChoices(
        this.interactionId,
        this.stateCustomizationArgsService.savedMemento
      )
    );
  }

  openInteractionCustomizerModal(): void {
    if (this.interactionIsDisabled) {
      return;
    }
    if (this.editabilityService.isEditable()) {
      this.alertsService.clearWarnings();

      const modalRef = this.ngbModal.open(CustomizeInteractionModalComponent, {
        keyboard: false,
        backdrop: 'static',
        windowClass: 'customize-interaction-modal',
      });

      modalRef.result.then(
        () => {
          this.onCustomizationModalSavePostHook();
        },
        () => {
          this.stateInteractionIdService.restoreFromMemento();
          this.stateCustomizationArgsService.restoreFromMemento();
          this.generateContentIdService.revertUnusedContentIdIndex();
        }
      );
    }
  }

  deleteInteraction(): void {
    this.alertsService.clearWarnings();
    this.ngbModal
      .open(DeleteInteractionModalComponent, {
        backdrop: true,
      })
      .result.then(
        () => {
          this.stateInteractionIdService.displayed = null;
          this.stateCustomizationArgsService.displayed = {};
          this.stateSolutionService.displayed = null;
          this.interactionDetailsCacheService.removeDetails(
            this.stateInteractionIdService.savedMemento
          );
          this.stateInteractionIdService.saveDisplayedValue();
          this.stateCustomizationArgsService.saveDisplayedValue();

          let interactionData: InteractionData = {
            interactionId: this.stateInteractionIdService.displayed,
            customizationArgs: this.stateCustomizationArgsService.displayed,
          };
          this.onSaveInteractionData.emit(interactionData);

          this.stateSolutionService.saveDisplayedValue();
          this.onSaveSolution.emit(this.stateSolutionService.displayed);

          this.stateInteractionIdService.onInteractionIdChanged.emit(
            this.stateInteractionIdService.savedMemento
          );
          this.recomputeGraph.emit();
          this._updateInteractionPreview();
          this._updateAnswerChoices();
        },
        () => {
          this.alertsService.clearWarnings();
        }
      );
  }

  toggleInteractionEditor(): void {
    this.interactionEditorIsShown = !this.interactionEditorIsShown;
  }

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }

  throwError(stateData: State): void {
    throw new Error(
      'Expected stateData to be defined but ' + 'received ' + stateData
    );
  }

  ngOnInit(): void {
    this.interactionIsDisabled = false;
    this.DEFAULT_TERMINAL_STATE_CONTENT = 'Congratulations, you have finished!';

    this.windowIsNarrow = this.windowDimensionsService.isWindowNarrow();
    this.interactionEditorIsShown = true;
    this.hasLoaded = false;
    this.customizationModalReopened = false;
    this.directiveSubscriptions.add(
      this.stateEditorService.onStateEditorInitialized.subscribe(stateData => {
        if (stateData === undefined || Object.keys(stateData).length === 0) {
          this.throwError(stateData);
          return;
        }

        this.hasLoaded = false;
        this.interactionDetailsCacheService.reset();
        this.responsesService.onInitializeAnswerGroups.emit({
          interactionId: stateData.interaction.id,
          answerGroups: stateData.interaction.answerGroups,
          defaultOutcome: stateData.interaction.defaultOutcome,
          confirmedUnclassifiedAnswers:
            stateData.interaction.confirmedUnclassifiedAnswers,
        });

        this._updateInteractionPreview();
        this._updateAnswerChoices();
        this.hasLoaded = true;
      })
    );

    this.stateEditorService.onInteractionEditorInitialized.emit();
    this.stateEditorService.updateStateInteractionEditorInitialised();
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
