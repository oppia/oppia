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

import constants from 'assets/constants';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { LearnerTopicSummary } from 'domain/topic/learner-topic-summary.model';
import { LearnerDashboardPageConstants } from 'pages/learner-dashboard-page/learner-dashboard-page.constants';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { Subscription } from 'rxjs';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';

import './learner-groups-tab.component.css';
import { ShortLearnerGroupSummary } from 'domain/learner_group/short-learner-group-summary.model';
import { LearnerDashboardBackendApiService } from 'domain/learner_dashboard/learner-dashboard-backend-api.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DeclineInvitationModalComponent } from './modal-templates/decline-invitaiton-modal.component';
import { LearnerGroupBackendApiService } from 'domain/learner_group/learner-group-backend-api.service';
import { ExitLearnerGroupModalComponent } from './modal-templates/exit-learner-group-modal.component';


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
  classroomUrlFragment!: string;
  width!: number;
  CLASSROOM_LINK_URL_TEMPLATE: string = '/learn/<classroom_url_fragment>';
  nextIncompleteNodeTitles: string[] = [];
  widthConst: number = 233;
  continueWhereYouLeftOffList: LearnerTopicSummary[] = [];
  windowIsNarrow: boolean = false;
  showThreeDotsDropdown: boolean = false;
  directiveSubscriptions = new Subscription();
  invitedToLearnerGroups: ShortLearnerGroupSummary[] = [];
  learnerOfLearnerGroups: ShortLearnerGroupSummary[] = [];

  constructor(
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private windowDimensionService: WindowDimensionsService,
    private urlInterpolationService: UrlInterpolationService,
    private learnerDashboardBackendApiService: LearnerDashboardBackendApiService,
    private ngbModal: NgbModal,
    private learnerGroupBackendApiService: LearnerGroupBackendApiService
  ) {}

  ngOnInit(): void {
    this.learnerDashboardBackendApiService
      .fetchLearnerDashboardLearnerGroupsAsync().then(
        (learnerDashboardLearnerGroups) => {
          this.learnerOfLearnerGroups = (
            learnerDashboardLearnerGroups.learnerOfLearnerGroups);
          this.invitedToLearnerGroups = (
            learnerDashboardLearnerGroups.invitedToLearnerGroups);
          console.log(this.learnerOfLearnerGroups);
          console.log(this.invitedToLearnerGroups);
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

  getWidth(length: number): number {
    /**
     * If there are 3 or more topics for each untrackedTopic, the total
     * width of the section will be 662px in mobile view to enable scrolling.
    */
    if (length >= 3) {
      return 662;
    }
    /**
     * If there less than 3 topics for each untrackedTopic, the total
     * width of the section will be calculated by multiplying the addition of
     * number of topics and one classroom card with 164px in mobile view to
     * enable scrolling.
    */
    return (length + 1) * 164;
  }

  changeActiveSection(): void {
    this.setActiveSection.emit(
      LearnerDashboardPageConstants.LEARNER_DASHBOARD_SECTION_I18N_IDS.LEARNER_GROUPS);
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
      ).then((learnerGroup) => {});
    }, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
    });
  }

  exitLearnerGroup(
    learnerGroupSummary: ShortLearnerGroupSummary
  ): void {
    let modalRef = this.ngbModal.open(
      ExitLearnerGroupModalComponent,
      {
        backdrop: 'static',
        windowClass: 'exit-learner-group-modal'
      }
    );
    modalRef.componentInstance.learnerGroupTitle = learnerGroupSummary.title;

    modalRef.result.then(() => {
      this.learnerOfLearnerGroups = this.learnerOfLearnerGroups.filter(
        (learnerGroup) => learnerGroup.id !== learnerGroupSummary.id
      );
      this.learnerGroupBackendApiService.updateLearnerGroupInviteAsync(
        learnerGroupSummary.id, this.username, false
      ).then((learnerGroup) => {});
    }, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
    });
  }
}
