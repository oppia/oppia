// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for creating a new question.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { QuestionEditorModalComponent } from 'components/question-directives/modal-templates/question-editor-modal.component';
import { SkillDifficulty } from 'domain/skill/skill-difficulty.model';
import { QuestionsListSelectSkillAndDifficultyModalComponent } from 'pages/topic-editor-page/modal-templates/questions-list-select-skill-and-difficulty-modal.component';
import { EditableQuestionBackendApiService } from 'domain/question/editable-question-backend-api.service';
import { Question, QuestionObjectFactory } from 'domain/question/QuestionObjectFactory';
import { SkillBackendApiService } from 'domain/skill/skill-backend-api.service';
import { GroupedSkillSummaries, SkillEditorStateService } from 'pages/skill-editor-page/services/skill-editor-state.service';
import { AlertsService } from 'services/alerts.service';
import { ImageLocalStorageService } from 'services/image-local-storage.service';
import { QuestionUndoRedoService } from 'domain/editor/undo_redo/question-undo-redo.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { AppConstants } from 'app.constants';
import { QuestionsListConstants } from
  'components/question-directives/questions-list/questions-list.constants';
import { Skill } from 'domain/skill/SkillObjectFactory';
import { State } from 'domain/state/StateObjectFactory';
import { MisconceptionSkillMap } from 'domain/skill/MisconceptionObjectFactory';

 @Injectable({
   providedIn: 'root'
 })
export class QuestionCreationService {
  newQuestionSkillDifficulties = [];
  question: Question;
  skill: Skill;
  skillId: string;
  questionId: string;
  questionStateData: State;
  skillIdToRubricsObject: object = {};
  misconceptionsBySkill: MisconceptionSkillMap = {};
  groupedSkillSummaries: GroupedSkillSummaries = null;
  newQuestionSkillIds: string[] = [];

  constructor(
     private alertsService: AlertsService,
     private ngbModal: NgbModal,
     private skillBackendApiService: SkillBackendApiService,
     private skillEditorStateService: SkillEditorStateService,
     private questionObjectFactory: QuestionObjectFactory,
     private imageLocalStorageService: ImageLocalStorageService,
     private editableQuestionBackendApiService:
      EditableQuestionBackendApiService,
     private questionUndoRedoService: QuestionUndoRedoService,
     private windowRef: WindowRef,
  ) {}

  populateMisconceptions(): void {
    this.skillBackendApiService.fetchMultiSkillsAsync(
      this.newQuestionSkillIds).then(
      (skills) => {
        skills.forEach((skill) => {
          this.misconceptionsBySkill[skill.getId()] =
             skill.getMisconceptions();
        });
      }, (error) => {
        this.alertsService.addWarning('');
      });
  }

  continueQuestionEditing(linkedSkillsWithDifficulty: SkillDifficulty[]): void {
    this.newQuestionSkillIds = [];
    this.newQuestionSkillDifficulties = [];
    linkedSkillsWithDifficulty.forEach((linkedSkillWithDifficulty) => {
      this.newQuestionSkillIds.push(linkedSkillWithDifficulty.getId());
      this.newQuestionSkillDifficulties.push(
        linkedSkillWithDifficulty.getDifficulty());
    });

    this.populateMisconceptions();
    if (this.alertsService.warnings.length === 0) {
      this.initializeNewQuestionCreation();
    }
  }

  createQuestion(): void {
    this.newQuestionSkillIds = [];
    this.skill = this.skillEditorStateService.getSkill();
    this.skillId = this.skillEditorStateService.getSkill().getId();
    this.skillIdToRubricsObject[this.skillId] = this.skill.getRubrics();

    this.newQuestionSkillIds = [this.skillId];
    var currentMode = QuestionsListConstants.MODE_SELECT_DIFFICULTY;

    var linkedSkillsWithDifficulty = [];
    this.newQuestionSkillIds.forEach((skillId) => {
      linkedSkillsWithDifficulty.push(
        SkillDifficulty.create(
          skillId, '', AppConstants.DEFAULT_SKILL_DIFFICULTY));
    });
    this.groupedSkillSummaries = (
      this.skillEditorStateService.getGroupedSkillSummaries());
    var sortedSkillSummaries =
     this.groupedSkillSummaries.current.concat(
       this.groupedSkillSummaries.others);
    var countOfSkillsToPrioritize =
     this.groupedSkillSummaries.current.length;
    var allSkillSummaries = sortedSkillSummaries.map(
      (summary) => {
        return summary;
      });

    var noOfRubricsWithExplanation = 0;
    for (var rubric of this.skillIdToRubricsObject[this.skillId]) {
      if (rubric.getExplanations().length > 0) {
        noOfRubricsWithExplanation++;
      }
    }

    if (noOfRubricsWithExplanation > 1) {
      let modalRef: NgbModalRef = this.ngbModal.open(
        QuestionsListSelectSkillAndDifficultyModalComponent, {
          backdrop: 'static'
        });

      modalRef.componentInstance.allSkillSummaries = (
        allSkillSummaries);
      modalRef.componentInstance.countOfSkillsToPrioritize = (
        countOfSkillsToPrioritize);
      modalRef.componentInstance.currentMode = currentMode;
      modalRef.componentInstance.linkedSkillsWithDifficulty = (
        linkedSkillsWithDifficulty);
      modalRef.componentInstance.skillIdToRubricsObject = (
        this.skillIdToRubricsObject);

      modalRef.result.then((linkedSkillsWithDifficulty) => {
        this.continueQuestionEditing(linkedSkillsWithDifficulty);
      }, () => {
        // Note to developers:
        // This callback is triggered when the Cancel button is clicked.
        // No further action is needed.
      });
    } else {
      for (var rubric of this.skillIdToRubricsObject[this.skillId]) {
        if (rubric.getExplanations().length > 0) {
          var rubricDifficulty = AppConstants.SKILL_DIFFICULTY_LABEL_TO_FLOAT[
            rubric.getDifficulty()];
          linkedSkillsWithDifficulty[0].setDifficulty(rubricDifficulty);
          break;
        }
      }
      this.continueQuestionEditing(linkedSkillsWithDifficulty);
    }
  }

  initializeNewQuestionCreation(): void {
    this.question = (
      this.questionObjectFactory
        .createDefaultQuestion(this.newQuestionSkillIds));
    this.questionId = this.question.getId();
    this.questionStateData = this.question.getStateData();
    this.openQuestionEditor(this.newQuestionSkillDifficulties[0]);
  }

  saveAndPublishQuestion(): void {
    var validationErrors = this.question.getValidationErrorMessage();
    var unaddressedMisconceptions = (
      this.question.getUnaddressedMisconceptionNames(
        this.misconceptionsBySkill));
    var unaddressedMisconceptionsErrorString = (
      `Remaining misconceptions that need to be addressed: ${
        unaddressedMisconceptions.join(', ')}`);

    if (validationErrors || unaddressedMisconceptions.length) {
      this.alertsService.addWarning(
        validationErrors || unaddressedMisconceptionsErrorString);
      return;
    }
    var imagesData = this.imageLocalStorageService.getStoredImagesData();
    this.imageLocalStorageService.flushStoredImagesData();
    this.editableQuestionBackendApiService.createQuestionAsync(
      this.newQuestionSkillIds, this.newQuestionSkillDifficulties,
      this.question, imagesData);
  }

  openQuestionEditor(questionDifficulty: string): void {
    var canEditQuestion = true;
    var newQuestionIsBeingCreated = true;

    this.questionUndoRedoService.clearChanges();
    var selectedSkillId = this.skillEditorStateService.getSkill().getId();

    this.windowRef.nativeWindow.location.hash = (this.questionId);

    var skillName = this.skillEditorStateService.getSkill().getDescription();
    var skillDifficultyMapping = AppConstants.SKILL_DIFFICULTY_LABEL_TO_FLOAT;
    var rubric = this.skillIdToRubricsObject[selectedSkillId].find(
      rubric => skillDifficultyMapping[rubric.getDifficulty()] === parseFloat(
        questionDifficulty));

    let modalRef: NgbModalRef = this.ngbModal.open(
      QuestionEditorModalComponent, {
        backdrop: 'static',
        keyboard: false,
      });

    modalRef.componentInstance.associatedSkillSummaries = [];
    modalRef.componentInstance.untriagedSkillSummaries = [];
    modalRef.componentInstance.canEditQuestion = canEditQuestion;
    modalRef.componentInstance.categorizedSkills = [];
    modalRef.componentInstance.groupedSkillSummaries = (
      this.groupedSkillSummaries);
    modalRef.componentInstance.misconceptionsBySkill = (
      this.misconceptionsBySkill);
    modalRef.componentInstance.newQuestionIsBeingCreated =
       newQuestionIsBeingCreated;
    modalRef.componentInstance.question = this.question;
    modalRef.componentInstance.questionId = this.questionId;
    modalRef.componentInstance.questionStateData = this.questionStateData;
    modalRef.componentInstance.rubric = rubric;
    modalRef.componentInstance.skillName = skillName;

    modalRef.result.then(() => {
      this.windowRef.nativeWindow.location.hash = (null);
      this.saveAndPublishQuestion();
    }, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
    });
  }
}
angular.module('oppia').factory('QuestionCreationService',
  downgradeInjectable(QuestionCreationService));

