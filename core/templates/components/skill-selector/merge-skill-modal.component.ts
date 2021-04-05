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
 * @fileoverview Component for merge skill modal.
 */

import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmOrCancelModal } from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';

@Component({
  selector: 'oppia-merge-skill',
  templateUrl: './merge-skill-modal.component.html'
})
export class MergeSkillModalComponent extends ConfirmOrCancelModal {
  categorizedSkills;
  skill;
  skillSummaries;
  untriagedSkillSummaries;
  allowSkillsFromOtherTopics: boolean = true;
  selectedSkillId: string;

  constructor(
    private ngbActiveModal: NgbActiveModal
  ) {
    super(ngbActiveModal);
  }

  confirm(): void {
    this.ngbActiveModal.close({
      skill: this.skill,
      supersedingSkillId: this.selectedSkillId
    });
  }

  save(): void {
    this.confirm();
  }

  setSelectedSkillId(skillId: string): void {
    this.selectedSkillId = skillId;
  }
}

// require(
//   'components/common-layout-directives/common-elements/' +
//   'confirm-or-cancel-modal.controller.ts');

// angular.module('oppia').controller('MergeSkillModalController', [
//   '$controller', '$scope', '$uibModalInstance', 'categorizedSkills', 'skill',
//   'skillSummaries', 'untriagedSkillSummaries',
//   function(
//       $controller, $scope, $uibModalInstance, categorizedSkills, skill,
//       skillSummaries, untriagedSkillSummaries) {
//     $controller('ConfirmOrCancelModalController', {
//       $scope: $scope,
//       $uibModalInstance: $uibModalInstance
//     });

//     $scope.skillSummaries = skillSummaries;
//     $scope.categorizedSkills = categorizedSkills;
//     $scope.allowSkillsFromOtherTopics = true;
//     $scope.untriagedSkillSummaries = untriagedSkillSummaries;
//     $scope.selectedSkillId = null;
//     $scope.confirm = function() {
//       $uibModalInstance.close(
//         {
//           skill: skill,
//           supersedingSkillId: $scope.selectedSkillId
//         });
//     };
//     $scope.save = function() {
//       $scope.confirm();
//     };
//     $scope.setSelectedSkillId = function(skillId: string) {
//       $scope.selectedSkillId = skillId;
//     };
//   }
// ]);
