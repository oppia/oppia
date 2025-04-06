// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for questions opportunities select difficulty modal.
 */

import {Component, Input, OnInit} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {AppConstants} from 'app.constants';
import {ConfirmOrCancelModal} from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import {Rubric} from 'domain/skill/rubric.model';
import {SkillBackendApiService} from 'domain/skill/skill-backend-api.service';
import {SkillDifficulty} from 'domain/skill/skill-difficulty.model';
import {Skill} from 'domain/skill/SkillObjectFactory';
import {ImageFile} from 'domain/utilities/image-file.model';
import {ExtractImageFilenamesFromModelService} from 'pages/exploration-player-page/services/extract-image-filenames-from-model.service';
import {AlertsService} from 'services/alerts.service';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {ImageLocalStorageService} from 'services/image-local-storage.service';

@Component({
  selector: 'oppia-questions-opportunities-select-difficulty-modal',
  templateUrl:
    './questions-opportunities-select-difficulty-modal.component.html',
})
export class QuestionsOpportunitiesSelectDifficultyModalComponent
  extends ConfirmOrCancelModal
  implements OnInit
{
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() skillId!: string;
  instructionMessage!: string;
  skillIdToRubricsObject!: Record<string, Rubric[]>;
  skill!: Skill;
  linkedSkillsWithDifficulty: SkillDifficulty[] = [];

  constructor(
    private alertsService: AlertsService,
    private assetsBackendApiService: AssetsBackendApiService,
    private extractImageFilenamesFromModelService: ExtractImageFilenamesFromModelService,
    private imageLocalStorageService: ImageLocalStorageService,
    private ngbActiveModal: NgbActiveModal,
    private skillBackendApiService: SkillBackendApiService
  ) {
    super(ngbActiveModal);
  }

  ngOnInit(): void {
    this.instructionMessage = 'Select the skill(s) to link the question to:';
    this.skillBackendApiService.fetchSkillAsync(this.skillId).then(
      backendSkillObject => {
        this.skill = backendSkillObject.skill;
        // Skills have SubtitledHtml fields that can contain images. In
        // order to render them in the contributor dashboard, we parse the
        // HTML fields in the Skill to get a list of filenames, fetch
        // these images and store their corresponding base64 URLs in the local
        // storage. The image components will use the data from the local
        // storage to render the image.
        let imageFileFetchPromises: Promise<ImageFile>[] = [];
        let imageFilenames =
          this.extractImageFilenamesFromModelService.getImageFilenamesInSkill(
            this.skill
          );
        imageFilenames.forEach(imageFilename => {
          imageFileFetchPromises.push(
            this.assetsBackendApiService.loadImage(
              AppConstants.ENTITY_TYPE.SKILL,
              this.skillId,
              imageFilename
            )
          );
        });
        Promise.all(imageFileFetchPromises).then(files => {
          files.forEach(file => {
            const reader = new FileReader();
            reader.onload = () => {
              const imageData = reader.result as string;
              this.imageLocalStorageService.saveImage(file.filename, imageData);
            };
            reader.readAsDataURL(file.data);
          });
          this.linkedSkillsWithDifficulty = [
            SkillDifficulty.create(
              this.skillId,
              this.skill.getDescription(),
              AppConstants.DEFAULT_SKILL_DIFFICULTY
            ),
          ];
          this.skillIdToRubricsObject = {};
          this.skillIdToRubricsObject[this.skillId] = this.skill.getRubrics();
        });
      },
      error => {
        this.alertsService.addWarning(`Error populating skill: ${error}.`);
      }
    );
  }

  startQuestionCreation(): void {
    const result = {
      skill: this.skill,
      skillDifficulty: this.linkedSkillsWithDifficulty[0].getDifficulty(),
    };
    this.ngbActiveModal.close(result);
  }
}
