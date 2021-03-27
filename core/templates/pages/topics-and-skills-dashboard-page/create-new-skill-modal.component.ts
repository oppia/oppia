// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Modal for the creating new skill.
 */

import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AppConstants } from 'app.constants';
import constants from 'assets/constants';
import { SkillCreationService } from 'components/entity-creation-services/skill-creation.service';
import { SubtitledHtmlObjectFactory } from 'domain/exploration/SubtitledHtmlObjectFactory';
import { RubricObjectFactory } from 'domain/skill/RubricObjectFactory';
import { SkillObjectFactory } from 'domain/skill/SkillObjectFactory';
import { SkillEditorStateService } from 'pages/skill-editor-page/services/skill-editor-state.service';
import { ContextService } from 'services/context.service';
import { ImageLocalStorageService } from 'services/image-local-storage.service';
import { TopicsAndSkillsDashboardPageConstants } from './topics-and-skills-dashboard-page.constants';

@Component({
  selector: 'create-new-skill-modal',
  templateUrl: './create-new-skill-modal.component.html'
})
export class CreateNewSkillModalComponent {
  rubrics = [
    this.rubricObjectFactory.create(constants.SKILL_DIFFICULTIES[0], []),
    this.rubricObjectFactory.create(constants.SKILL_DIFFICULTIES[1], ['']),
    this.rubricObjectFactory.create(constants.SKILL_DIFFICULTIES[2], [])];
  newSkillDescription: string = '';
  errorMsg: string = '';
  skillDescriptionExists: boolean = true;
  conceptCardExplanationEditorIsShown: boolean = false;
  bindableDict = {displayedConceptCardExplanation: ''};
  HTML_SCHEMA = { type: 'html' };
  MAX_CHARS_IN_SKILL_DESCRIPTION = (
    constants.MAX_CHARS_IN_SKILL_DESCRIPTION);
  newExplanationObject = null;

  constructor(
    private ngbActiveModal: NgbActiveModal,
    private contextService: ContextService,
    private imageLocalStorageService: ImageLocalStorageService,
    private rubricObjectFactory: RubricObjectFactory,
    private skillCreationService: SkillCreationService,
    private skillEditorStateService: SkillEditorStateService,
    private skillObjectFactory: SkillObjectFactory,
    private subtitledHtmlObjectFactory: SubtitledHtmlObjectFactory
  ) {}

  ngOnInit(): void {
    this.contextService.setImageSaveDestinationToLocalStorage();
  }

  openConceptCardExplanationEditor(): void {
    this.conceptCardExplanationEditorIsShown = true;
  }

  setErrorMessageIfNeeded(): void {
    if (
      !this.skillObjectFactory.hasValidDescription(
        this.newSkillDescription)) {
      this.errorMsg = (
        'Please use a non-empty description consisting of ' +
          'alphanumeric characters, spaces and/or hyphens.');
    }
    if (this.skillDescriptionExists) {
      this.errorMsg = (
        'This description already exists. Please choose a ' +
            'new name or modify the existing skill.');
    }
  }

  _skillDescriptionExistsCallback(skillDescriptionExists): void {
    this.skillDescriptionExists = skillDescriptionExists;
    this.setErrorMessageIfNeeded();
  }
  updateSkillDescriptionAndCheckIfExists(): void {
    this.resetErrorMsg();
    this.skillEditorStateService.updateExistenceOfSkillDescription(
      this.newSkillDescription, this._skillDescriptionExistsCallback
    );
    if (
      this.skillCreationService.getSkillDescriptionStatus() !==
          TopicsAndSkillsDashboardPageConstants.SKILL_DESCRIPTION_STATUS_VALUES
            .STATUS_DISABLED) {
      this.rubrics[1].setExplanations([this.newSkillDescription]);
      this.skillCreationService.markChangeInSkillDescription();
    }
  }

  resetErrorMsg(): void {
    this.errorMsg = '';
  }

  saveConceptCardExplanation(): void {
    const explanationObject = this.subtitledHtmlObjectFactory.createDefault(
      this.bindableDict.displayedConceptCardExplanation,
      AppConstants.COMPONENT_NAME_EXPLANATION);
    this.newExplanationObject = explanationObject.toBackendDict();
    this.bindableDict.displayedConceptCardExplanation = (
      explanationObject.html);
  }

  createNewSkill(): void {
    this.setErrorMessageIfNeeded();
    if (this.errorMsg !== '') {
      return;
    }
    this.saveConceptCardExplanation();
    this.ngbActiveModal.close({
      description: this.newSkillDescription,
      rubrics: this.rubrics,
      explanation: this.newExplanationObject
    });
  }

  cancel(): void {
    this.imageLocalStorageService.flushStoredImagesData();
    this.skillCreationService.resetSkillDescriptionStatusMarker();
    this.ngbActiveModal.dismiss('cancel');
  }
}


// Function(
//       $scope, $uibModalInstance, ContextService, ImageLocalStorageService,
//       RubricObjectFactory, SkillCreationService, SkillEditorStateService,
//       SkillObjectFactory, SubtitledHtmlObjectFactory,
//       COMPONENT_NAME_EXPLANATION, MAX_CHARS_IN_SKILL_DESCRIPTION,
//       SKILL_DESCRIPTION_STATUS_VALUES, SKILL_DIFFICULTIES) {
//     var rubrics = [
//       RubricObjectFactory.create(SKILL_DIFFICULTIES[0], []),
//       RubricObjectFactory.create(SKILL_DIFFICULTIES[1], ['']),
//       RubricObjectFactory.create(SKILL_DIFFICULTIES[2], [])];
//     ContextService.setImageSaveDestinationToLocalStorage();
//     $scope.newSkillDescription = '';
//     $scope.rubrics = rubrics;
//     $scope.errorMsg = '';
//     $scope.skillDescriptionExists = true;
//     $scope.conceptCardExplanationEditorIsShown = false;
//     $scope.bindableDict = {
//       displayedConceptCardExplanation: ''
//     };
//     $scope.HTML_SCHEMA = {
//       type: 'html'
//     };
//     $scope.MAX_CHARS_IN_SKILL_DESCRIPTION = (
//       MAX_CHARS_IN_SKILL_DESCRIPTION);
//     $scope.newExplanationObject = null;

//     $scope.openConceptCardExplanationEditor = function() {
//       $scope.conceptCardExplanationEditorIsShown = true;
//     };

//     $scope.setErrorMessageIfNeeded = function() {
//       if (
//         !SkillObjectFactory.hasValidDescription(
//           $scope.newSkillDescription)) {
//         $scope.errorMsg = (
//           'Please use a non-empty description consisting of ' +
//           'alphanumeric characters, spaces and/or hyphens.');
//       }
//       if ($scope.skillDescriptionExists) {
//         $scope.errorMsg = (
//           'This description already exists. Please choose a ' +
//             'new name or modify the existing skill.');
//       }
//     };

//     $scope._skillDescriptionExistsCallback = function(skillDescriptionExists) {
//       $scope.skillDescriptionExists = skillDescriptionExists;
//       $scope.setErrorMessageIfNeeded();
//     };
//     $scope.updateSkillDescriptionAndCheckIfExists = function() {
//       $scope.resetErrorMsg();
//       SkillEditorStateService.updateExistenceOfSkillDescription(
//         $scope.newSkillDescription, $scope._skillDescriptionExistsCallback
//       );
//       if (
//         SkillCreationService.getSkillDescriptionStatus() !==
//           SKILL_DESCRIPTION_STATUS_VALUES.STATUS_DISABLED) {
//         $scope.rubrics[1].setExplanations([$scope.newSkillDescription]);
//         SkillCreationService.markChangeInSkillDescription();
//       }
//     };

//     $scope.resetErrorMsg = function() {
//       $scope.errorMsg = '';
//     };

//     $scope.saveConceptCardExplanation = function() {
//       var explanationObject = SubtitledHtmlObjectFactory.createDefault(
//         $scope.bindableDict.displayedConceptCardExplanation,
//         COMPONENT_NAME_EXPLANATION);
//       $scope.newExplanationObject = explanationObject.toBackendDict();
//       $scope.bindableDict.displayedConceptCardExplanation = (
//         explanationObject.html);
//     };

//     $scope.createNewSkill = function() {
//       $scope.setErrorMessageIfNeeded();
//       if ($scope.errorMsg !== '') {
//         return;
//       }
//       $scope.saveConceptCardExplanation();
//       $uibModalInstance.close({
//         description: $scope.newSkillDescription,
//         rubrics: $scope.rubrics,
//         explanation: $scope.newExplanationObject
//       });
//     };

//     $scope.cancel = function() {
//       ImageLocalStorageService.flushStoredImagesData();
//       SkillCreationService.resetSkillDescriptionStatusMarker();
//       $uibModalInstance.dismiss('cancel');
//     };
//   }
// ]);
