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

import {ChangeDetectorRef, Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {AppConstants} from 'app.constants';
import {SkillCreationService} from 'components/entity-creation-services/skill-creation.service';
import {
  SubtitledHtml,
  SubtitledHtmlBackendDict,
} from 'domain/exploration/subtitled-html.model';
import {Rubric} from 'domain/skill/rubric.model';
import {SkillEditorStateService} from 'pages/skill-editor-page/services/skill-editor-state.service';
import {PageContextService} from 'services/page-context.service';
import {ImageLocalStorageService} from 'services/image-local-storage.service';
import {TopicsAndSkillsDashboardPageConstants} from '../topics-and-skills-dashboard-page.constants';
import {PlatformFeatureService} from 'services/platform-feature.service';
import {ValidatorsService} from 'services/validators.service';

@Component({
  selector: 'oppia-create-new-skill-modal',
  templateUrl: './create-new-skill-modal.component.html',
})
export class CreateNewSkillModalComponent {
  rubrics = [
    Rubric.create(AppConstants.SKILL_DIFFICULTIES[0], []),
    Rubric.create(AppConstants.SKILL_DIFFICULTIES[1], ['']),
    Rubric.create(AppConstants.SKILL_DIFFICULTIES[2], []),
  ];

  workedExampleLimitExceeded!: boolean;
  newSkillDescription: string = '';
  errorMsg: string = '';
  skillDescriptionExists: boolean = true;
  conceptCardExplanationEditorIsShown: boolean = false;
  bindableDict = {displayedConceptCardExplanation: ''};
  HTML_SCHEMA = {
    type: 'html',
    ui_config: {
      rte_component_config_id: 'SKILL_AND_STUDY_GUIDE_EDITOR_COMPONENTS',
    },
  };
  MAX_CHARS_IN_SKILL_DESCRIPTION = AppConstants.MAX_CHARS_IN_SKILL_DESCRIPTION;

  // This property is initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  newExplanationObject!: SubtitledHtmlBackendDict;
  skillEditorWorkedExampleLimit: number =
    AppConstants.SKILL_EDITOR_WORKED_EXAMPLE_LIMIT;

  constructor(
    private ngbActiveModal: NgbActiveModal,
    private pageContextService: PageContextService,
    private imageLocalStorageService: ImageLocalStorageService,
    private skillCreationService: SkillCreationService,
    private skillEditorStateService: SkillEditorStateService,
    private changeDetectorRef: ChangeDetectorRef,
    private platformFeatureService: PlatformFeatureService,
    private validatorsService: ValidatorsService
  ) {}

  ngOnInit(): void {
    this.pageContextService.setImageSaveDestinationToLocalStorage();
  }

  updateExplanation($event: string): void {
    if ($event !== this.bindableDict.displayedConceptCardExplanation) {
      this.bindableDict.displayedConceptCardExplanation = $event;
      this.changeDetectorRef.detectChanges();
    }
  }

  openConceptCardExplanationEditor(): void {
    this.conceptCardExplanationEditorIsShown = true;
  }

  getHtmlSchema(): {type: string} {
    if (!this.isEnableWorkedexamplesRteComponentFeatureEnabled()) {
      this.HTML_SCHEMA = {
        type: 'html',
        ui_config: {
          rte_component_config_id: 'ALL_COMPONENTS',
        },
      };
    }
    return this.HTML_SCHEMA;
  }

  setErrorMessageIfNeeded(): void {
    if (!this.validatorsService.hasValidDescription(this.newSkillDescription)) {
      this.errorMsg =
        'Please use a non-empty description consisting of ' +
        'alphanumeric characters, spaces and/or hyphens.';
    }
    if (this.skillDescriptionExists) {
      this.errorMsg =
        'This description already exists. Please choose a ' +
        'new name or modify the existing skill.';
    }
  }

  _skillDescriptionExistsCallback(skillDescriptionExists: boolean): void {
    this.skillDescriptionExists = skillDescriptionExists;
    this.setErrorMessageIfNeeded();
  }

  checkExtraWorkedexample(): boolean {
    const workedexampleRegex =
      /<oppia-noninteractive-workedexample.*?>.*?<\/oppia-noninteractive-workedexample>/g;
    const matches =
      this.bindableDict.displayedConceptCardExplanation.match(
        workedexampleRegex
      );

    this.workedExampleLimitExceeded = !!(
      matches && matches.length > this.skillEditorWorkedExampleLimit
    );
    return this.workedExampleLimitExceeded;
  }

  updateSkillDescriptionAndCheckIfExists(): void {
    this.resetErrorMsg();

    if (this.newSkillDescription !== '') {
      this.skillEditorStateService.updateExistenceOfSkillDescription(
        this.newSkillDescription,
        this._skillDescriptionExistsCallback.bind(this)
      );
    }
    if (
      this.skillCreationService.getSkillDescriptionStatus() !==
      TopicsAndSkillsDashboardPageConstants.SKILL_DESCRIPTION_STATUS_VALUES
        .STATUS_DISABLED
    ) {
      this.rubrics[1].setExplanations([this.newSkillDescription]);
      this.skillCreationService.markChangeInSkillDescription();
    }
  }

  isEnableWorkedexamplesRteComponentFeatureEnabled(): boolean {
    return this.platformFeatureService.status.EnableWorkedExamplesRteComponent
      .isEnabled;
  }

  resetErrorMsg(): void {
    this.errorMsg = '';
  }

  saveConceptCardExplanation(): void {
    const explanationObject: SubtitledHtml = SubtitledHtml.createDefault(
      this.bindableDict.displayedConceptCardExplanation,
      AppConstants.COMPONENT_NAME_EXPLANATION
    );
    this.newExplanationObject = explanationObject.toBackendDict();
    this.bindableDict.displayedConceptCardExplanation = explanationObject.html;
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
      explanation: this.newExplanationObject,
    });
  }

  cancel(): void {
    this.imageLocalStorageService.flushStoredImagesData();
    this.skillCreationService.resetSkillDescriptionStatusMarker();
    this.ngbActiveModal.dismiss('cancel');
  }
}
