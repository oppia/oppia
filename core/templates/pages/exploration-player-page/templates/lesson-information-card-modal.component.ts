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
 * @fileoverview Component for lesson information card modal.
 */

 import { Component } from '@angular/core';
 import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
 import { ConfirmOrCancelModal } from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
 import { LearnerExplorationSummaryBackendDict } from 'domain/summary/learner-exploration-summary.model';
 
 @Component({
   selector: 'oppia-lesson-information-card-modal',
   templateUrl: './lesson-information-card-modal.component.html'
 })
 export class LessonInformationCardModalComponent extends ConfirmOrCancelModal {

   contributorsSummary = {};
   expInfo: LearnerExplorationSummaryBackendDict;
   explorationId: string;
   explorationTitle: string;
   explorationIsPrivate: boolean;
 
   constructor(
     private ngbActiveModal: NgbActiveModal,
   ) {
     super(ngbActiveModal);
   }
 
   ngOnInit(): void {
     this.contributorsSummary = this.expInfo
       .human_readable_contributors_summary || {};
     this.explorationId = this.expInfo.id;
     this.explorationTitle = this.expInfo.title;
     this.explorationIsPrivate = (this.expInfo.status === 'private');
   }
}
 