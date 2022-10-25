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
 * @fileoverview Component for the questions list.
 */

import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { AlertsService } from 'services/alerts.service';
import { AppConstants } from 'app.constants';
import cloneDeep from 'lodash/cloneDeep';
import { QuestionSummary } from 'domain/question/question-summary-object.model';
import { QuestionSummaryForOneSkill } from 'domain/question/question-summary-for-one-skill-object.model';
import { QuestionUndoRedoService } from 'domain/editor/undo_redo/question-undo-redo.service';
import { ShortSkillSummary } from 'domain/skill/short-skill-summary.model';
import { SkillBackendApiService } from 'domain/skill/skill-backend-api.service';
import { SkillDifficulty } from 'domain/skill/skill-difficulty.model';
import { SkillLinkageModificationsArray } from 'domain/question/editable-question-backend-api.service';
import { SkillSummary, SkillSummaryBackendDict } from 'domain/skill/skill-summary.model';
import { MisconceptionObjectFactory, MisconceptionSkillMap } from 'domain/skill/MisconceptionObjectFactory';
import { Question, QuestionObjectFactory } from 'domain/question/QuestionObjectFactory';
import { State } from 'domain/state/StateObjectFactory';
import { Rubric } from 'domain/skill/rubric.model';
import { EditableQuestionBackendApiService } from 'domain/question/editable-question-backend-api.service';
import { CategorizedSkills, SelectSkillModalComponent } from 'components/skill-selector/select-skill-modal.component';
import { ConfirmQuestionExitModalComponent } from '../modal-templates/confirm-question-exit-modal.component';
import { QuestionEditorSaveModalComponent } from '../modal-templates/question-editor-save-modal.component';
import { ContextService } from 'services/context.service';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { ImageLocalStorageService } from 'services/image-local-storage.service';
import { QuestionsListService } from 'services/questions-list.service';
import { QuestionValidationService } from 'services/question-validation.service';
import { SkillEditorRoutingService } from 'pages/skill-editor-page/services/skill-editor-routing.service';
import { UtilsService } from 'services/utils.service';
import { LoggerService } from 'services/contextual/logger.service';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { RemoveQuestionSkillLinkModalComponent } from '../modal-templates/remove-question-skill-link-modal.component';
import INTERACTION_SPECS from 'interactions/interaction_specs.json';

interface GroupedSkillSummaries {
  current: SkillSummaryBackendDict[];
  others: SkillSummaryBackendDict[];
}

@Component({
  selector: 'oppia-questions-list',
  templateUrl: './questions-list.component.html'
})
export class QuestionsListComponent implements OnInit, OnDestroy {
  @Input() allSkillSummaries: ShortSkillSummary[];
  @Input() canEditQuestion: boolean;
  @Input() groupedSkillSummaries: GroupedSkillSummaries;
  @Input() selectedSkillId: string;
  @Input() selectSkillModalIsShown: boolean;
  @Input() skillIdToRubricsObject: Record<string, Rubric>;
  @Input() skillsCategorizedByTopics: CategorizedSkills;
  @Input() untriagedSkillSummaries: SkillSummary[];
  @Input() skillDescriptionsAreShown: boolean;

  associatedSkillSummaries: ShortSkillSummary[];
  deletedQuestionIds: string[];
  difficulty: number;
  difficultyCardIsShown: boolean;
  editorIsOpen: boolean;
  isSkillDifficultyChanged: boolean;
  linkedSkillsWithDifficulty: SkillDifficulty[];
  misconceptionIdsForSelectedSkill: number[];
  misconceptionsBySkill: MisconceptionSkillMap;
  newQuestionIsBeingCreated: boolean;
  newQuestionSkillDifficulties: number[];
  newQuestionSkillIds: string[];
  question: Question;
  questionId: string;
  questionIsBeingSaved: boolean;
  questionIsBeingUpdated: boolean;
  questionStateData: State;
  questionSummariesForOneSkill: QuestionSummaryForOneSkill[] = [];
  showDifficultyChoices: boolean;
  skillLinkageModificationsArray: SkillLinkageModificationsArray[];
  directiveSubscriptions = new Subscription();

  constructor(
    private alertsService: AlertsService,
    private changeDetectorRef: ChangeDetectorRef,
    private contextService: ContextService,
    private editableQuestionBackendApiService:
      EditableQuestionBackendApiService,
    private focusManagerService: FocusManagerService,
    private imageLocalStorageService: ImageLocalStorageService,
    private loggerService: LoggerService,
    private misconceptionObjectFactory: MisconceptionObjectFactory,
    private ngbModal: NgbModal,
    private questionObjectFactory: QuestionObjectFactory,
    private questionsListService: QuestionsListService,
    private questionUndoRedoService: QuestionUndoRedoService,
    private questionValidationService: QuestionValidationService,
    private skillBackendApiService: SkillBackendApiService,
    private skillEditorRoutingService: SkillEditorRoutingService,
    private utilsService: UtilsService,
    private windowDimensionsService: WindowDimensionsService,
    private windowRef: WindowRef,
  ) { }

  createQuestion(): void {
    if (this.alertsService.warnings.length > 0) {
      this.loggerService.error(
        'Could not create new question due to warnings: ' +
        this.alertsService.warnings[0].content);
      return;
    }

    this.newQuestionSkillIds = [this.selectedSkillId];
    this.associatedSkillSummaries = [];
    this.linkedSkillsWithDifficulty = [
      SkillDifficulty.create(
        this.selectedSkillId, '', AppConstants.DEFAULT_SKILL_DIFFICULTY)];
    this.newQuestionSkillDifficulties = this.linkedSkillsWithDifficulty.map(
      linkedSkillWithDifficulty => linkedSkillWithDifficulty.getDifficulty()
    );
    this.focusManagerService.setFocus('difficultySelectionDiv');
    this.showDifficultyChoices = true;
    this.populateMisconceptions(this.newQuestionSkillIds);

    this.imageLocalStorageService.flushStoredImagesData();
    this.contextService.setImageSaveDestinationToLocalStorage();
    this.question = this.questionObjectFactory.createDefaultQuestion(
      this.newQuestionSkillIds);
    this.questionId = this.question.getId();
    this.questionStateData = this.question.getStateData();
    this.questionIsBeingUpdated = false;
    this.newQuestionIsBeingCreated = true;
    this.editorIsOpen = true;

    this.skillLinkageModificationsArray = [];
    this.isSkillDifficultyChanged = false;
  }

  updateSkillWithDifficulty(event: SkillDifficulty, index: number): void {
    this.linkedSkillsWithDifficulty[index] = event;
    this.changeLinkedSkillDifficulty();
  }

  changeLinkedSkillDifficulty(): void {
    this.isSkillDifficultyChanged = true;
    if (this.newQuestionSkillIds.length === 1) {
      this.newQuestionSkillDifficulties = (
        [this.linkedSkillsWithDifficulty[0].getDifficulty()]);
    } else {
      this.linkedSkillsWithDifficulty.forEach(
        (linkedSkillWithDifficulty) => {
          if (!this.newQuestionSkillIds.includes(
            linkedSkillWithDifficulty.getId())) {
            this.newQuestionSkillIds.push(
              linkedSkillWithDifficulty.getId());
            this.newQuestionSkillDifficulties.push(
              linkedSkillWithDifficulty.getDifficulty());
          }
        });
    }
    this.linkedSkillsWithDifficulty.forEach(
      (linkedSkillWithDifficulty) => {
        this.skillLinkageModificationsArray.push({
          id: linkedSkillWithDifficulty.getId(),
          task: 'update_difficulty',
          difficulty: linkedSkillWithDifficulty.getDifficulty()
        });
      });
  }

  populateMisconceptions(skillIds: string[]): void {
    this.misconceptionsBySkill = {};
    this.skillBackendApiService.fetchMultiSkillsAsync(
      skillIds).then(
      (skills) => {
        skills.forEach((skill) => {
          this.misconceptionsBySkill[skill.getId()] =
            skill.getMisconceptions();
        });
      }, (error) => {
        this.alertsService.addWarning(error);
      });
  }

  editQuestion(
      questionSummaryForOneSkill: QuestionSummary,
      skillDescription: string, difficulty: number): void {
    this.skillLinkageModificationsArray = [];
    this.isSkillDifficultyChanged = false;
    if (this.editorIsOpen) {
      return;
    }
    if (!this.canEditQuestion) {
      this.alertsService.addWarning(
        'User does not have enough rights to edit the question');
      return;
    }
    this.newQuestionSkillIds = [];
    this.newQuestionSkillIds = [this.selectedSkillId];
    this.linkedSkillsWithDifficulty = [];
    this.newQuestionSkillIds.forEach((skillId) => {
      this.linkedSkillsWithDifficulty.push(
        SkillDifficulty.create(
          skillId, skillDescription, difficulty));
    });
    this.difficulty = difficulty;
    this.misconceptionsBySkill = {};
    this.associatedSkillSummaries = [];
    this.editableQuestionBackendApiService.fetchQuestionAsync(
      questionSummaryForOneSkill.getQuestionId()).then(
      (response) => {
        if (response.associated_skill_dicts) {
          response.associated_skill_dicts.forEach((skillDict) => {
            this.misconceptionsBySkill[skillDict.id] =
              skillDict.misconceptions.map((misconception) => {
                return this.misconceptionObjectFactory.createFromBackendDict(
                  misconception);
              });
            this.associatedSkillSummaries.push(
              ShortSkillSummary.create(
                skillDict.id, skillDict.description));
          });
        }
        this.question = cloneDeep(response.questionObject);
        this.questionId = this.question.getId();
        this.questionStateData = this.question.getStateData();
        this.questionIsBeingUpdated = true;
        this.newQuestionIsBeingCreated = false;
        this.openQuestionEditor();
      }, (errorResponse) => {
        this.alertsService.addWarning(
          errorResponse.error || 'Failed to fetch question.');
      });
  }

  openQuestionEditor(): void {
    this.questionUndoRedoService.clearChanges();
    this.editorIsOpen = true;
    this.imageLocalStorageService.flushStoredImagesData();
    if (this.newQuestionIsBeingCreated) {
      this.contextService.setImageSaveDestinationToLocalStorage();
    }

    this.windowRef.nativeWindow.location.hash = this.questionId;
  }

  removeQuestionSkillLinkAsync(questionId: string, skillId: string): void {
    this.editableQuestionBackendApiService.editQuestionSkillLinksAsync(
      questionId, [
        {
          id: skillId,
          task: 'remove'
        } as SkillLinkageModificationsArray
      ]
    ).then(() => {
      this.questionsListService.resetPageNumber();
      this.questionsListService.getQuestionSummariesAsync(
        this.selectedSkillId, true, true);
      this.alertsService.addSuccessMessage('Question Removed');
      this._removeArrayElement(questionId);
    });
  }

  removeQuestionFromSkill(questionId: string): void {
    let modalRef: NgbModalRef = this.ngbModal.
      open(RemoveQuestionSkillLinkModalComponent, {
        backdrop: 'static'
      });

    modalRef.componentInstance.skillId = this.selectedSkillId;
    modalRef.componentInstance.canEditQuestion = this.canEditQuestion;
    modalRef.componentInstance.numberOfQuestions = (
      this.questionSummariesForOneSkill.length);

    modalRef.result.then(() => {
      this.deletedQuestionIds.push(questionId);
      this.removeQuestionSkillLinkAsync(questionId, this.selectedSkillId);
    }, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
    });
  }

  _removeArrayElement(questionId: string): void {
    let index = this.deletedQuestionIds.indexOf(questionId);
    if (index > -1) {
      this.deletedQuestionIds.splice(index, 1);
    }
  }

  removeSkill(skillId: string): void {
    if (this.associatedSkillSummaries.length === 1) {
      this.alertsService.addInfoMessage(
        'A question should be linked to at least one skill.');
      return;
    }

    this.skillLinkageModificationsArray.push({
      id: skillId,
      task: 'remove'
    } as SkillLinkageModificationsArray);

    this.associatedSkillSummaries =
        this.associatedSkillSummaries.filter((summary) => {
          return summary.getId() !== skillId;
        });

    this.updateSkillLinkage();
  }

  isQuestionSavable(): boolean {
    // Not savable if there are no changes.
    if (!this.questionUndoRedoService.hasChanges() && (
      this.skillLinkageModificationsArray &&
      this.skillLinkageModificationsArray.length === 0
    ) && !this.isSkillDifficultyChanged) {
      return false;
    }
    let questionIdValid = this.questionValidationService.isQuestionValid(
      this.question, this.misconceptionsBySkill);
    if (!this.questionIsBeingUpdated) {
      return Boolean(
        questionIdValid &&
        this.newQuestionSkillDifficulties &&
        this.newQuestionSkillDifficulties.length);
    }
    return questionIdValid;
  }

  showSolutionCheckpoint(): boolean {
    if (!this.question) {
      return false;
    }

    const interactionId = this.question.getStateData().interaction.id;
    return (
      interactionId && INTERACTION_SPECS[
        interactionId].can_have_solution);
  }

  addSkill(): void {
    let skillsInSameTopicCount =
        this.groupedSkillSummaries.current.length;
    let sortedSkillSummaries =
        this.groupedSkillSummaries.current.concat(
          this.groupedSkillSummaries.others);
    let allowSkillsFromOtherTopics = true;
    let modalRef: NgbModalRef = this.ngbModal.open(
      SelectSkillModalComponent, {
        backdrop: 'static',
        windowClass: 'skill-select-modal',
        size: 'xl'
      });

    modalRef.componentInstance.skillSummaries = sortedSkillSummaries;
    modalRef.componentInstance.skillsInSameTopicCount = (
      skillsInSameTopicCount);
    modalRef.componentInstance.categorizedSkills = (
      this.skillsCategorizedByTopics);
    modalRef.componentInstance.allowSkillsFromOtherTopics = (
      allowSkillsFromOtherTopics);
    modalRef.componentInstance.untriagedSkillSummaries = (
      this.untriagedSkillSummaries);

    modalRef.result.then((summary) => {
      for (let idx in this.associatedSkillSummaries) {
        if (
          this.associatedSkillSummaries[idx].getId() ===
            summary.id) {
          this.alertsService.addInfoMessage(
            'Skill already linked to question');
          return;
        }
      }

      this.associatedSkillSummaries.push(
        ShortSkillSummary.create(
          summary.id, summary.description));
      this.skillLinkageModificationsArray = [];
      this.skillLinkageModificationsArray.push({
        id: summary.id,
        task: 'add',
        difficulty: AppConstants.DEFAULT_SKILL_DIFFICULTY
      });
      this.updateSkillLinkage();
    }, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is
      // clicked. No further action is needed.
    });
  }

  getQuestionIndex(index: number): number {
    return (
      this.questionsListService.getCurrentPageNumber() *
      AppConstants.NUM_QUESTIONS_PER_PAGE + index + 1);
  }

  goToNextPage(): void {
    this.questionsListService.incrementPageNumber();
    this.questionsListService.getQuestionSummariesAsync(
      this.selectedSkillId, true, false
    );
  }

  goToPreviousPage(): void {
    this.questionsListService.decrementPageNumber();
    this.questionsListService.getQuestionSummariesAsync(
      this.selectedSkillId, false, false
    );
  }

  showUnaddressedSkillMisconceptionWarning(
      skillMisconceptionIds: string[]): boolean {
    let skillId = this.selectedSkillId;
    let expectedMisconceptionIds = (
      this.misconceptionIdsForSelectedSkill);
    let actualMisconceptionIds = (
      skillMisconceptionIds.map(skillMisconceptionId => {
        if (skillMisconceptionId.startsWith(skillId)) {
          return parseInt(skillMisconceptionId.split('-')[1]);
        }
      }));
    return this.utilsService.isEquivalent(
      actualMisconceptionIds.sort(), expectedMisconceptionIds.sort());
  }

  saveAndPublishQuestion(commitMessage: string | null): void {
    let validationErrors = this.question.getValidationErrorMessage();
    let unaddressedMisconceptions = (
      this.question.getUnaddressedMisconceptionNames(
        this.misconceptionsBySkill));
    let unaddressedMisconceptionsErrorString = (
      `Remaining misconceptions that need to be addressed: ${
        unaddressedMisconceptions.join(', ')}`);

    if (validationErrors || unaddressedMisconceptions.length) {
      this.alertsService.addWarning(
        validationErrors || unaddressedMisconceptionsErrorString);
      return;
    }

    if (!this.questionIsBeingUpdated) {
      let imagesData = this.imageLocalStorageService.getStoredImagesData();
      this.imageLocalStorageService.flushStoredImagesData();
      this.editableQuestionBackendApiService.createQuestionAsync(
        this.newQuestionSkillIds, this.newQuestionSkillDifficulties,
        (this.question.toBackendDict(true)), imagesData
      ).then((response) => {
        if (this.skillLinkageModificationsArray &&
            this.skillLinkageModificationsArray.length > 0) {
          this.editableQuestionBackendApiService.editQuestionSkillLinksAsync(
            response.questionId, this.skillLinkageModificationsArray
          );
        }
        this.questionsListService.resetPageNumber();
        this.questionsListService.getQuestionSummariesAsync(
          this.selectedSkillId, true, true
        );
        this.questionIsBeingSaved = false;
        this.editorIsOpen = false;
        this.alertsService.addSuccessMessage(
          'Question created successfully.');
        this._initTab(true);
      });
    } else {
      if (this.questionUndoRedoService.hasChanges()) {
        if (commitMessage) {
          this.questionIsBeingSaved = true;
          this.editableQuestionBackendApiService.updateQuestionAsync(
            this.questionId, String(this.question.getVersion()), commitMessage,
            this.questionUndoRedoService
              .getCommittableChangeList()).then(
            () => {
              this.questionUndoRedoService.clearChanges();
              this.editorIsOpen = false;
              this.questionIsBeingSaved = false;
              this.questionsListService.getQuestionSummariesAsync(
                this.selectedSkillId, true, true
              );
            }, (error) => {
              this.alertsService.addWarning(
                error || 'There was an error saving the question.');
              this.questionIsBeingSaved = false;
              this.editorIsOpen = false;
            });
        } else {
          this.alertsService.addWarning(
            'Please provide a valid commit message.');
          this.questionIsBeingSaved = false;
          this.editorIsOpen = false;
        }
      }
    }
  }

  getSkillEditorUrl(skillId: string): string {
    return `/skill_editor/${skillId}`;
  }

  isLastPage(): boolean {
    return this.questionsListService.isLastQuestionBatch();
  }

  cancel(): void {
    this.ngbModal.open(ConfirmQuestionExitModalComponent, {
      backdrop: true,
    }).result.then(() => {
      this.contextService.resetImageSaveDestination();
      this.editorIsOpen = false;
      this.windowRef.nativeWindow.location.hash = null;
      this.skillEditorRoutingService.questionIsBeingCreated = false;
    }, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is
      // clicked. No further action is needed.
    });
  }

  updateSkillLinkageAndQuestions(commitMsg: string): void {
    this.editableQuestionBackendApiService.editQuestionSkillLinksAsync(
      this.questionId, this.skillLinkageModificationsArray
    ).then(
      data => {
        this.skillLinkageModificationsArray = [];
        setTimeout(() => {
          this.questionsListService.resetPageNumber();
          this.questionsListService.getQuestionSummariesAsync(
            this.selectedSkillId, true, true
          );
          this.editorIsOpen = false;
          this.saveAndPublishQuestion(commitMsg);
        }, 500);
      });
  }

  updateSkillLinkage(): void {
    this.editableQuestionBackendApiService.editQuestionSkillLinksAsync(
      this.questionId, this.skillLinkageModificationsArray
    ).then(
      data => {
        this.skillLinkageModificationsArray = [];
      });
  }

  saveQuestion(): void {
    this.contextService.resetImageSaveDestination();
    this.windowRef.nativeWindow.location.hash = null;
    if (this.questionIsBeingUpdated) {
      this.ngbModal.open(QuestionEditorSaveModalComponent, {
        backdrop: 'static',
      }).result.then((commitMessage) => {
        if (this.skillLinkageModificationsArray &&
            this.skillLinkageModificationsArray.length > 0) {
          this.updateSkillLinkageAndQuestions(commitMessage);
        } else {
          this.contextService.resetImageSaveDestination();
          this.saveAndPublishQuestion(commitMessage);
        }
      }, () => {
        // Note to developers:
        // This callback is triggered when the Cancel button is
        // clicked. No further action is needed.
      });
    } else {
      this.contextService.resetImageSaveDestination();
      this.saveAndPublishQuestion(null);
      this.skillEditorRoutingService.creatingNewQuestion(false);
    }
  }

  getQuestionSummariesForOneSkill(): void {
    this.questionSummariesForOneSkill = (
      this.questionsListService.getCachedQuestionSummaries());
  }

  getCurrentPageNumber(): number {
    return this.questionsListService.getCurrentPageNumber();
  }

  toggleDifficultyCard(): void {
    if (!this.windowDimensionsService.isWindowNarrow()) {
      return;
    }
    this.difficultyCardIsShown = !this.difficultyCardIsShown;
  }

  _initTab(resetHistoryAndFetch: boolean): void {
    this.questionIsBeingUpdated = false;
    this.misconceptionsBySkill = {};
    this.misconceptionIdsForSelectedSkill = [];

    if (this.selectedSkillId) {
      this.skillBackendApiService.fetchSkillAsync(
        this.selectedSkillId
      ).then(responseObject => {
        this.misconceptionIdsForSelectedSkill = (
          responseObject.skill.getMisconceptions().map(
            misconception => misconception.getId()));
      });
    }

    if (this.skillEditorRoutingService.navigateToQuestionEditor()) {
      this.createQuestion();
    } else {
      this.questionsListService.getQuestionSummariesAsync(
        this.selectedSkillId, resetHistoryAndFetch,
        resetHistoryAndFetch
      );
    }

    this.getQuestionSummariesForOneSkill();
  }

  ngOnInit(): void {
    this.directiveSubscriptions.add(
      this.questionsListService.onQuestionSummariesInitialized.subscribe(
        () => {
          this._initTab(false);
          this.focusManagerService.setFocus('newQuestionBtn');
          this.getQuestionSummariesForOneSkill();
          this.changeDetectorRef.detectChanges();
        }));

    this.showDifficultyChoices = false;
    this.difficultyCardIsShown = (
      !this.windowDimensionsService.isWindowNarrow());
    this.associatedSkillSummaries = [];
    this.editorIsOpen = false;
    this.deletedQuestionIds = [];
    // The _initTab function is written separately since it is also
    // called in subscription when some external events are triggered.
    this._initTab(true);
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}

angular.module('oppia').directive('oppiaQuestionsList',
  downgradeComponent({
    component: QuestionsListComponent
  }) as angular.IDirectiveFactory);
