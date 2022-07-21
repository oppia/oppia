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
 * @fileoverview Component for the questions editor component.
 */

import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { Subscription } from 'rxjs';
import { MarkAllAudioAndTranslationsAsNeedingUpdateModalComponent } from 'components/forms/forms-templates/mark-all-audio-and-translations-as-needing-update-modal.component';
import { StateEditorService } from 'components/state-editor/state-editor-properties-services/state-editor.service';
import { StateInteractionIdService } from 'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import { EditabilityService } from 'services/editability.service';
import { SolutionValidityService } from 'pages/exploration-editor-page/editor-tab/services/solution-validity.service';
import { LoaderService } from 'services/loader.service';
import { QuestionUpdateService } from 'domain/question/question-update.service';
import cloneDeep from 'lodash/cloneDeep';
import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';
import { Hint } from 'domain/exploration/HintObjectFactory';
import { Solution } from 'domain/exploration/SolutionObjectFactory';
import { InteractionCustomizationArgs } from 'interactions/customization-args-defs';
import { Outcome } from 'domain/exploration/OutcomeObjectFactory';
import { AnswerGroup } from 'domain/exploration/AnswerGroupObjectFactory';
import { Question } from 'domain/question/QuestionObjectFactory';
import { State } from 'domain/state/StateObjectFactory';

@Component({
  selector: 'oppia-question-editor',
  templateUrl: './question-editor.component.html'
})
export class QuestionEditorComponent implements OnInit, OnDestroy {
  @Input() questionId: unknown;
  @Input() misconceptionsBySkill: object;
  @Input() canEditQuestion: boolean;
  @Input() question: Question;
  @Input() questionStateData: State;
  @Output() questionChanged = new EventEmitter();

  directiveSubscriptions = new Subscription();
  oppiaBlackImgUrl: string;
  interactionIsShown: boolean;
  stateEditorInitialized: boolean;

  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private stateEditorService: StateEditorService,
    private stateInteractionIdService: StateInteractionIdService,
    private editabilityService: EditabilityService,
    private solutionValidityService: SolutionValidityService,
    private loaderService: LoaderService,
    private ngbModal: NgbModal,
    private changeDetectionRef: ChangeDetectorRef,
    private questionUpdateService: QuestionUpdateService,
  ) { }

  showMarkAllAudioAsNeedingUpdateModalIfRequired(contentIds: string[]): void {
    let state = this.question?.getStateData();
    let recordedVoiceovers = state.recordedVoiceovers;
    let writtenTranslations = state.writtenTranslations;

    const shouldPrompt = contentIds.some(
      (contentId) =>
        recordedVoiceovers.hasUnflaggedVoiceovers(contentId));
    if (shouldPrompt) {
      this.ngbModal.open(
        MarkAllAudioAndTranslationsAsNeedingUpdateModalComponent, {
          backdrop: 'static'
        }).result.then(() => {
        this._updateQuestion(() => {
          contentIds.forEach(contentId => {
            if (recordedVoiceovers.hasUnflaggedVoiceovers(contentId)) {
              recordedVoiceovers.markAllVoiceoversAsNeedingUpdate(
                contentId);
            }
            if (
              writtenTranslations.hasUnflaggedWrittenTranslations(
                contentId)
            ) {
              writtenTranslations.markAllTranslationsAsNeedingUpdate(
                contentId);
            }
          });
        });
      }, () => {
        // This callback is triggered when the Cancel button is
        // clicked. No further action is needed.
      });
    }
  }

  saveInteractionId(displayedValue: string): void {
    this._updateQuestion(() => {
      this.stateEditorService.setInteractionId(cloneDeep(displayedValue));
    });
  }

  saveInteractionAnswerGroups(newAnswerGroups: AnswerGroup[]): void {
    this._updateQuestion(() => {
      this.stateEditorService.setInteractionAnswerGroups(
        cloneDeep(newAnswerGroups));
    });
  }

  saveInteractionDefaultOutcome(newOutcome: Outcome): void {
    this._updateQuestion(() => {
      this.stateEditorService.setInteractionDefaultOutcome(
        cloneDeep(newOutcome));
    });
  }

  saveInteractionCustomizationArgs(
      displayedValue: InteractionCustomizationArgs): void {
    this._updateQuestion(() => {
      this.stateEditorService.setInteractionCustomizationArgs(
        cloneDeep(displayedValue));
    });
  }

  saveNextContentIdIndex(displayedValue: number): void {
    this._updateQuestion(() => {
      let stateData = this.question?.getStateData();
      stateData.nextContentIdIndex = cloneDeep(displayedValue);
    });
  }

  saveSolution(displayedValue: Solution): void {
    this._updateQuestion(() => {
      this.stateEditorService.setInteractionSolution(
        cloneDeep(displayedValue));
    });

    this.changeDetectionRef.detectChanges();
  }

  saveHints(displayedValue: Hint[]): void {
    this._updateQuestion(() => {
      this.stateEditorService.setInteractionHints(
        cloneDeep(displayedValue));
    });
  }

  saveInapplicableSkillMisconceptionIds(
      displayedValue: string[]): void {
    this.stateEditorService.setInapplicableSkillMisconceptionIds(
      cloneDeep(displayedValue));
    this.questionUpdateService.setQuestionInapplicableSkillMisconceptionIds(
      this.question, displayedValue);
  }

  getStateContentPlaceholder(): string {
    return 'Type your question here.';
  }

  getStateContentSaveButtonPlaceholder(): string {
    return 'Save Question';
  }

  navigateToState(): void {
    return;
  }

  addState(): void {
    return;
  }

  recomputeGraph(): void {
    return;
  }

  refreshWarnings(): void {
    return;
  }

  _updateQuestion(updateFunction: Function): void {
    this.questionChanged.emit();
    this.questionUpdateService.setQuestionStateData(
      this.question, updateFunction);
  }

  saveStateContent(displayedValue: SubtitledHtml): void {
    // Show the interaction when the text content is saved, even if no
    // content is entered.
    this._updateQuestion(() => {
      let stateData = this.question?.getStateData();
      stateData.content = cloneDeep(displayedValue);
      this.interactionIsShown = true;
    });
  }

  _init(): void {
    this.stateEditorService.setStateNames([]);
    this.stateEditorService.setCorrectnessFeedbackEnabled(true);
    this.stateEditorService.setInQuestionMode(true);
    this.stateEditorService.setInapplicableSkillMisconceptionIds(
      this.question?.getInapplicableSkillMisconceptionIds());
    this.solutionValidityService.init(['question']);
    let stateData = this.questionStateData;
    stateData.interaction.defaultOutcome.setDestination(null);
    if (stateData) {
      this.stateEditorService.onStateEditorInitialized.emit(stateData);

      if (stateData.content.html || stateData.interaction.id) {
        this.interactionIsShown = true;
      }

      this.loaderService.hideLoadingScreen();
    }
    this.stateEditorInitialized = true;
  }

  ngOnInit(): void {
    this.directiveSubscriptions.add(
      this.stateEditorService.onStateEditorDirectiveInitialized.subscribe(
        () => this._init()
      )
    );
    this.directiveSubscriptions.add(
      this.stateEditorService.onInteractionEditorInitialized.subscribe(
        () => this._init()
      )
    );
    this.directiveSubscriptions.add(
      this.stateInteractionIdService.onInteractionIdChanged.subscribe(
        () => this._init()
      )
    );

    if (this.canEditQuestion) {
      this.editabilityService.markEditable();
    } else {
      this.editabilityService.markNotEditable();
    }
    this.stateEditorService.setActiveStateName('question');
    this.stateEditorService.setMisconceptionsBySkill(
      this.misconceptionsBySkill);
    this.oppiaBlackImgUrl = this.urlInterpolationService.getStaticImageUrl(
      '/avatar/oppia_avatar_100px.svg');

    this.interactionIsShown = false;
    this.stateEditorInitialized = false;
    // The _init function is written separately since it is also called
    // in $scope.$on when some external events are triggered.
    this._init();
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}

angular.module('oppia').directive('oppiaQuestionEditor',
  downgradeComponent({
    component: QuestionEditorComponent
  }) as angular.IDirectiveFactory);
