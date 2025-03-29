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
 * @fileoverview Component for the questions editor tab.
 */

import {
  Component,
  ChangeDetectorRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import cloneDeep from 'lodash/cloneDeep';
import {Subscription} from 'rxjs';
import {StateEditorService} from 'components/state-editor/state-editor-properties-services/state-editor.service';
import {StateInteractionIdService} from 'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import {MisconceptionSkillMap} from 'domain/skill/MisconceptionObjectFactory';
import {Outcome} from 'domain/exploration/OutcomeObjectFactory';
import {Question} from 'domain/question/QuestionObjectFactory';
import {QuestionUpdateService} from 'domain/question/question-update.service';
import {Solution} from 'domain/exploration/SolutionObjectFactory';
import {Hint} from 'domain/exploration/hint-object.model';
import {AnswerGroup} from 'domain/exploration/AnswerGroupObjectFactory';
import {State} from 'domain/state/StateObjectFactory';
import {SubtitledHtml} from 'domain/exploration/subtitled-html.model';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {SolutionValidityService} from 'pages/exploration-editor-page/editor-tab/services/solution-validity.service';
import {EditabilityService} from 'services/editability.service';
import {InteractionData} from 'interactions/customization-args-defs';
import {LoaderService} from 'services/loader.service';
import {GenerateContentIdService} from 'services/generate-content-id.service';

@Component({
  selector: 'oppia-question-editor',
  templateUrl: './question-editor.component.html',
})
export class QuestionEditorComponent implements OnInit, OnDestroy {
  @Output() questionChange = new EventEmitter<void>();
  // These properties below are initialized using Angular lifecycle hooks
  // where we need to do non-null assertion. For more information see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() userCanEditQuestion!: boolean;
  @Input() misconceptionsBySkill!: MisconceptionSkillMap;
  @Input() question!: Question;
  @Input() questionId!: string;
  @Input() questionStateData!: State;
  interactionIsShown!: boolean;
  oppiaBlackImgUrl!: string;
  stateEditorIsInitialized!: boolean;
  nextContentIdIndexMemento!: number;
  nextContentIdIndexDisplayedValue!: number;

  componentSubscriptions = new Subscription();

  constructor(
    private changeDetectionRef: ChangeDetectorRef,
    private editabilityService: EditabilityService,
    private generateContentIdService: GenerateContentIdService,
    private loaderService: LoaderService,
    private questionUpdateService: QuestionUpdateService,
    private solutionValidityService: SolutionValidityService,
    private stateEditorService: StateEditorService,
    private stateInteractionIdService: StateInteractionIdService,
    private urlInterpolationService: UrlInterpolationService
  ) {}

  saveInteractionAnswerGroups(newAnswerGroups: AnswerGroup[]): void {
    this._updateQuestion(() => {
      this.stateEditorService.setInteractionAnswerGroups(
        cloneDeep(newAnswerGroups)
      );
    });
  }

  saveInteractionDefaultOutcome(newOutcome: Outcome): void {
    this._updateQuestion(() => {
      this.stateEditorService.setInteractionDefaultOutcome(
        cloneDeep(newOutcome)
      );
    });
  }

  saveInteractionData(displayedValue: InteractionData): void {
    this._updateQuestion(() => {
      this.stateEditorService.setInteractionId(
        cloneDeep(displayedValue.interactionId)
      );
      this.stateEditorService.setInteractionCustomizationArgs(
        cloneDeep(displayedValue.customizationArgs)
      );
    });
  }

  saveNextContentIdIndex(): void {
    this.questionUpdateService.setQuestionNextContentIdIndex(
      this.question,
      this.nextContentIdIndexDisplayedValue
    );
    this.nextContentIdIndexMemento = this.nextContentIdIndexDisplayedValue;
  }

  saveSolution(displayedValue: Solution): void {
    this._updateQuestion(() => {
      this.stateEditorService.setInteractionSolution(cloneDeep(displayedValue));
    });

    this.changeDetectionRef.detectChanges();
  }

  saveHints(displayedValue: Hint[]): void {
    this._updateQuestion(() => {
      this.stateEditorService.setInteractionHints(cloneDeep(displayedValue));
    });
  }

  saveInapplicableSkillMisconceptionIds(displayedValue: string[]): void {
    this.stateEditorService.setInapplicableSkillMisconceptionIds(
      cloneDeep(displayedValue)
    );
    this.questionUpdateService.setQuestionInapplicableSkillMisconceptionIds(
      this.question,
      displayedValue
    );
  }

  getStateContentPlaceholder(): string {
    return 'Type your question here.';
  }

  getStateContentSaveButtonPlaceholder(): string {
    return 'Save Question';
  }

  _updateQuestion(updateFunction: Function): void {
    this.questionChange.emit();
    this.questionUpdateService.setQuestionStateData(
      this.question,
      updateFunction
    );
  }

  saveStateContent(displayedValue: SubtitledHtml): void {
    // Show the interaction when the text content is saved, even if no
    // content is entered.
    this._updateQuestion(() => {
      const stateData = this.question.getStateData();
      stateData.content = cloneDeep(displayedValue);
      this.interactionIsShown = true;
    });
  }

  _init(): void {
    this.stateEditorService.setStateNames([]);
    this.stateEditorService.setInQuestionMode(true);
    if (this.question) {
      this.stateEditorService.setInapplicableSkillMisconceptionIds(
        this.question.getInapplicableSkillMisconceptionIds()
      );
    }
    this.solutionValidityService.init(['question']);

    this.generateContentIdService.init(
      () => {
        let indexToUse = this.nextContentIdIndexDisplayedValue;
        this.nextContentIdIndexDisplayedValue += 1;
        return indexToUse;
      },
      () => {
        this.nextContentIdIndexDisplayedValue = this.nextContentIdIndexMemento;
      }
    );

    const stateData = this.questionStateData;
    const outcome = stateData.interaction.defaultOutcome;
    if (outcome) {
      outcome.setDestination(null);
    }
    if (stateData) {
      this.stateEditorService.onStateEditorInitialized.emit(stateData);

      if (stateData.content.html || stateData.interaction.id) {
        this.interactionIsShown = true;
      }

      this.loaderService.hideLoadingScreen();
    }
    this.stateEditorIsInitialized = true;
  }

  ngOnInit(): void {
    this.componentSubscriptions.add(
      this.stateEditorService.onStateEditorDirectiveInitialized.subscribe(() =>
        this._init()
      )
    );
    this.componentSubscriptions.add(
      this.stateEditorService.onInteractionEditorInitialized.subscribe(() =>
        this._init()
      )
    );
    this.componentSubscriptions.add(
      this.stateInteractionIdService.onInteractionIdChanged.subscribe(() =>
        this._init()
      )
    );

    if (this.userCanEditQuestion) {
      this.editabilityService.markEditable();
    } else {
      this.editabilityService.markNotEditable();
    }
    this.stateEditorService.setActiveStateName('question');
    this.stateEditorService.setMisconceptionsBySkill(
      this.misconceptionsBySkill
    );
    this.oppiaBlackImgUrl =
      this.urlInterpolationService.getStaticCopyrightedImageUrl(
        '/avatar/oppia_avatar_100px.svg'
      );

    this.interactionIsShown = false;
    this.stateEditorIsInitialized = false;

    this.nextContentIdIndexMemento = this.question.getNextContentIdIndex();
    this.nextContentIdIndexDisplayedValue =
      this.question.getNextContentIdIndex();

    this._init();
  }

  ngOnDestroy(): void {
    this.componentSubscriptions.unsubscribe();
  }
}
