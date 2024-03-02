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
 * @fileoverview Component for the state editor Component.
 */

import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { State } from 'domain/state/StateObjectFactory';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { Subscription } from 'rxjs';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { StateCardIsCheckpointService } from './state-editor-properties-services/state-card-is-checkpoint.service';
import { StateContentService } from './state-editor-properties-services/state-content.service';
import { StateCustomizationArgsService } from './state-editor-properties-services/state-customization-args.service';
import { StateEditorService } from './state-editor-properties-services/state-editor.service';
import { StateHintsService } from './state-editor-properties-services/state-hints.service';
import { StateInteractionIdService } from './state-editor-properties-services/state-interaction-id.service';
import { StateNameService } from './state-editor-properties-services/state-name.service';
import { StateParamChangesService } from './state-editor-properties-services/state-param-changes.service';
import { StateLinkedSkillIdService } from './state-editor-properties-services/state-skill.service';
import { StateSolicitAnswerDetailsService } from './state-editor-properties-services/state-solicit-answer-details.service';
import { StateSolutionService } from './state-editor-properties-services/state-solution.service';
import INTERACTION_SPECS from 'interactions/interaction_specs.json';
import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';
import { Solution } from 'domain/exploration/SolutionObjectFactory';
import { Outcome } from 'domain/exploration/OutcomeObjectFactory';
import { InteractionData } from 'interactions/customization-args-defs';
import { Hint } from 'domain/exploration/hint-object.model';
import { InteractionSpecsKey } from 'pages/interaction-specs.constants';
import { AnswerGroup } from 'domain/exploration/AnswerGroupObjectFactory';

@Component({
  selector: 'oppia-state-editor',
  templateUrl: './state-editor.component.html'
})
export class StateEditorComponent implements OnInit, OnDestroy {
  @Output() onSaveHints = new EventEmitter<Hint[]>();
  @Output() onSaveInapplicableSkillMisconceptionIds = (
    new EventEmitter<string[]>());

  @Output() onSaveInteractionAnswerGroups = (
    new EventEmitter<AnswerGroup[]>());

  @Output() onSaveInteractionData = (
    new EventEmitter<InteractionData>());

  @Output() onSaveInteractionDefaultOutcome = new EventEmitter<Outcome>();
  @Output() onSaveLinkedSkillId = new EventEmitter<string>();
  @Output() onSaveNextContentIdIndex = new EventEmitter<number>();
  @Output() onSaveSolicitAnswerDetails = new EventEmitter<boolean>();
  @Output() onSaveSolution = new EventEmitter<Solution>();
  @Output() onSaveStateContent = new EventEmitter<SubtitledHtml>();
  @Output() recomputeGraph = new EventEmitter<void>();
  @Output() refreshWarnings = new EventEmitter<void>();
  @Output() navigateToState = new EventEmitter<string>();

  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() addState!: (value: string) => void;
  @Input() explorationIsLinkedToStory!: boolean;
  @Input() interactionIsShown!: boolean;
  @Input() stateContentSaveButtonPlaceholder!: string;
  @Input() stateContentPlaceholder!: string;


  oppiaBlackImgUrl!: string;
  // State name is null if their is no state selected or have no active state.
  // This is the case when the user is creating a new state.
  stateName!: string | null;
  stateData!: State;
  directiveSubscriptions = new Subscription();
  currentStateIsTerminal: boolean = false;
  windowIsNarrow: boolean = false;
  interactionIdIsSet: boolean = false;
  servicesInitialized: boolean = false;
  currentInteractionCanHaveSolution: boolean = false;
  conceptCardIsShown: boolean = true;

  constructor(
    private stateCardIsCheckpointService: StateCardIsCheckpointService,
    private stateContentService: StateContentService,
    private stateCustomizationArgsService: StateCustomizationArgsService,
    private stateEditorService: StateEditorService,
    private stateHintsService: StateHintsService,
    private stateInteractionIdService: StateInteractionIdService,
    private stateLinkedSkillIdService: StateLinkedSkillIdService,
    private stateNameService: StateNameService,
    private stateParamChangesService: StateParamChangesService,
    private stateSolicitAnswerDetailsService: StateSolicitAnswerDetailsService,
    private stateSolutionService: StateSolutionService,
    private urlInterpolationService: UrlInterpolationService,
    private windowDimensionsService: WindowDimensionsService,
  ) { }

  sendRecomputeGraph(): void {
    this.recomputeGraph.emit();
  }

  sendOnSaveLinkedSkillId($event: string): void {
    this.onSaveLinkedSkillId.emit($event);
  }

  sendOnSaveSolicitAnswerDetails($event: boolean): void {
    this.onSaveSolicitAnswerDetails.emit($event);
  }

  sendOnSaveHints($event: Hint[]): void {
    this.onSaveHints.emit($event);
  }

  sendRefreshWarnings(): void {
    this.refreshWarnings.emit();
  }

  sendOnSaveInteractionDefaultOutcome($event: Outcome): void {
    this.onSaveInteractionDefaultOutcome.emit($event);
  }

  sendOnSaveInteractionAnswerGroups($event: AnswerGroup[]): void {
    this.onSaveInteractionAnswerGroups.emit($event);
  }

  sendOnSaveInapplicableSkillMisconceptionIds($event: string[]): void {
    this.onSaveInapplicableSkillMisconceptionIds.emit($event);
  }

  sendNavigateToState($event: string): void {
    this.navigateToState.emit($event);
  }

  sendOnSaveSolution($event: Solution): void {
    this.onSaveSolution.emit($event);
  }

  sendOnSaveNextContentIdIndex($event: number): void {
    this.onSaveNextContentIdIndex.emit($event);
  }

  sendOnSaveInteractionData($event: InteractionData): void {
    this.onSaveInteractionData.emit($event);
  }

  sendOnSaveStateContent($event: SubtitledHtml): void {
    this.onSaveStateContent.emit($event);
  }

  updateInteractionVisibility(newInteractionId: string): void {
    this.interactionIdIsSet = Boolean(newInteractionId);
    this.currentInteractionCanHaveSolution = Boolean(
      this.interactionIdIsSet &&
      INTERACTION_SPECS[
        newInteractionId as InteractionSpecsKey].can_have_solution);
    this.currentStateIsTerminal = Boolean(
      this.interactionIdIsSet && INTERACTION_SPECS[
        newInteractionId as InteractionSpecsKey].is_terminal);
  }

  reinitializeEditor(): void {
    this.stateEditorService.onStateEditorInitialized.emit(this.stateData);
  }

  toggleConceptCard(): void {
    this.conceptCardIsShown = !this.conceptCardIsShown;
  }

  ngOnInit(): void {
    this.oppiaBlackImgUrl = this.urlInterpolationService.getStaticImageUrl(
      '/avatar/oppia_avatar_100px.svg');
    this.currentStateIsTerminal = false;
    this.windowIsNarrow = this.windowDimensionsService.isWindowNarrow();
    this.interactionIdIsSet = false;
    this.servicesInitialized = false;
    this.stateName = this.stateEditorService.getActiveStateName();
    this.directiveSubscriptions.add(
      this.stateInteractionIdService.onInteractionIdChanged.subscribe(
        (newInteractionId) => {
          this.updateInteractionVisibility(newInteractionId);
        }
      )
    );

    this.directiveSubscriptions.add(
      this.stateEditorService.onStateEditorInitialized.subscribe(
        (stateData) => {
          if (stateData === undefined || $.isEmptyObject(stateData)) {
            throw new Error(
              'Expected stateData to be defined but ' +
              'received ' + stateData);
          }
          this.stateData = stateData;
          this.stateName = this.stateEditorService.getActiveStateName();
          this.stateEditorService.setInteraction(stateData.interaction);
          this.stateContentService.init(
            this.stateName, stateData.content);
          this.stateLinkedSkillIdService.init(
            this.stateName, stateData.linkedSkillId);
          this.stateHintsService.init(
            this.stateName, stateData.interaction.hints);
          this.stateInteractionIdService.init(
            this.stateName, stateData.interaction.id);
          this.stateCustomizationArgsService.init(
            this.stateName, stateData.interaction.customizationArgs);
          this.stateNameService.init();
          this.stateParamChangesService.init(
            this.stateName, stateData.paramChanges);
          this.stateSolicitAnswerDetailsService.init(
            this.stateName, stateData.solicitAnswerDetails);
          this.stateCardIsCheckpointService.init(
            this.stateName, stateData.cardIsCheckpoint);
          this.stateSolutionService.init(
            this.stateName, stateData.interaction.solution);
          this.updateInteractionVisibility(stateData.interaction.id);
          this.servicesInitialized = true;
        }
      )
    );
    this.stateEditorService.onStateEditorDirectiveInitialized.emit();
    this.stateEditorService.updateStateEditorDirectiveInitialised();
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}

angular.module('oppia').directive('oppiaStateEditor',
  downgradeComponent({
    component: StateEditorComponent
  }) as angular.IDirectiveFactory);
