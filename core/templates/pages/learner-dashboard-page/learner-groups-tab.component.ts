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
 * @fileoverview Component for learner groups tab in the Learner Dashboard page.
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { LearnerDashboardPageConstants } from 'pages/learner-dashboard-page/learner-dashboard-page.constants';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { Subscription } from 'rxjs';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { ShortLearnerGroupSummary } from 'domain/learner_group/short-learner-group-summary.model';
import { LearnerDashboardBackendApiService } from 'domain/learner_dashboard/learner-dashboard-backend-api.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AlertsService } from 'services/alerts.service';
import { DeclineInvitationModalComponent } from './modal-templates/decline-invitaiton-modal.component';
import { LearnerGroupBackendApiService } from 'domain/learner_group/learner-group-backend-api.service';
import { ViewLearnerGroupInvitationModalComponent } from './modal-templates/view-learner-group-invitation-modal.component';
import { ViewLearnerGroupDetailsModalComponent } from './modal-templates/view-learner-group-details-modal.component';

import './learner-groups-tab.component.css';

 @Component({
   selector: 'oppia-learner-groups-tab',
   templateUrl: './learner-groups-tab.component.html'
 })
export class LearnerGroupsTabComponent {
  @Output() setActiveSection: EventEmitter<string> = new EventEmitter();
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() username!: string;
  windowIsNarrow: boolean = false;
  directiveSubscriptions = new Subscription();
  invitedToLearnerGroups: ShortLearnerGroupSummary[] = [];
  learnerGroupsJoined: ShortLearnerGroupSummary[] = [];
  alertTimeout = 6000;

  constructor(
    private windowDimensionService: WindowDimensionsService,
    private urlInterpolationService: UrlInterpolationService,
    private learnerDashboardBackendApiService:
      LearnerDashboardBackendApiService,
    private ngbModal: NgbModal,
    private learnerGroupBackendApiService: LearnerGroupBackendApiService,
    private alertsService: AlertsService
  ) {}

  ngOnInit(): void {
    this.learnerDashboardBackendApiService
      .fetchLearnerDashboardLearnerGroupsAsync().then(
        (learnerDashboardLearnerGroups) => {
          this.learnerGroupsJoined = (
            learnerDashboardLearnerGroups.learnerGroupsJoined);
          this.invitedToLearnerGroups = (
            learnerDashboardLearnerGroups.invitedToLearnerGroups);
        }
      );
    this.windowIsNarrow = this.windowDimensionService.isWindowNarrow();
    this.directiveSubscriptions.add(
      this.windowDimensionService.getResizeEvent().subscribe(() => {
        this.windowIsNarrow = this.windowDimensionService.isWindowNarrow();
      }));
  }

  getLearnerGroupPageUrl(learnerGroupId: string): string {
    return (
      this.urlInterpolationService.interpolateUrl(
        '/learner-group/<groupId>', {
          groupId: learnerGroupId
        }
      )
    );
  }

  changeActiveSection(): void {
    this.setActiveSection.emit(
      LearnerDashboardPageConstants
        .LEARNER_DASHBOARD_SECTION_I18N_IDS.LEARNER_GROUPS);
  }

  declineLearnerGroupInvitation(
      learnerGroupSummary: ShortLearnerGroupSummary
  ): void {
    let modalRef = this.ngbModal.open(
      DeclineInvitationModalComponent,
      {
        backdrop: 'static',
        windowClass: 'decline-learner-group-invitation-modal'
      }
    );
    modalRef.componentInstance.learnerGroupTitle = learnerGroupSummary.title;

    modalRef.result.then(() => {
      this.invitedToLearnerGroups = this.invitedToLearnerGroups.filter(
        (invitedGroup) => invitedGroup.id !== learnerGroupSummary.id
      );
      this.learnerGroupBackendApiService.updateLearnerGroupInviteAsync(
        learnerGroupSummary.id, this.username, false
      ).then();
    }, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
    });
  }

  viewLearnerGroupDetails(
      learnerGroupSummary: ShortLearnerGroupSummary
  ): void {
    let modalRef = this.ngbModal.open(
      ViewLearnerGroupDetailsModalComponent,
      {
        backdrop: 'static',
        windowClass: 'view-learner-group-details-modal'
      }
    );
    modalRef.componentInstance.learnerGroup = learnerGroupSummary;

    modalRef.result.then(() => {
      // Note to developers:
      // This callback is triggered when the Confirm button is clicked.
      // No further action is needed.
    }, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
    });
  }

  acceptLearnerGroupInvitation(
      learnerGroupSummary: ShortLearnerGroupSummary
  ): void {
    let modalRef = this.ngbModal.open(
      ViewLearnerGroupInvitationModalComponent,
      {
        backdrop: 'static',
        windowClass: 'view-learner-group-invitation-modal'
      }
    );
    modalRef.componentInstance.learnerGroup = learnerGroupSummary;

    modalRef.result.then((data) => {
      this.learnerGroupBackendApiService.updateLearnerGroupInviteAsync(
        learnerGroupSummary.id, this.username, true,
        data.progressSharingPermission
      ).then((learnerGroup) => {
        // Show a message to indicate that the learner has successfully joined
        // the learner group.
        this.alertsService.addSuccessMessage(
          'You have successfully joined ' + learnerGroup.title +
          ' learner group.', this.alertTimeout);

        let acceptedLearnerGroupSummary = new ShortLearnerGroupSummary(
          learnerGroup.id, learnerGroup.title, learnerGroup.description,
          learnerGroup.facilitatorUsernames,
          learnerGroup.learnerUsernames.length
        );
        this.invitedToLearnerGroups = this.invitedToLearnerGroups.filter(
          (invitedGroup) => invitedGroup.id !== learnerGroupSummary.id
        );
        this.learnerGroupsJoined.push(acceptedLearnerGroupSummary);
      });
    }, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
    });
  }
}
