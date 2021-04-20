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
 * @fileoverview Component for removeActivityModal.
 */

import { downgradeComponent } from '@angular/upgrade/static';
import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import constants from 'assets/constants';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { LearnerDashboardPageConstants } from 'pages/learner-dashboard-page/learner-dashboard-page.constants';

@Component({
  selector: 'oppia-remove-activity-modal',
  templateUrl: './remove-activity-modal.component.html',
})
export class RemoveActivityModalComponent implements OnInit {
  @Input() sectionNameI18nId: string;
  @Input() subsectionName: string;
  @Input() activityId: string;
  @Input() activityTitle: string;
  removeActivityUrl: string;

  constructor(
    private activeModal: NgbActiveModal,
    private urlInterpolationService: UrlInterpolationService,
  ) {}

  ngOnInit(): void {
    let activityType = '';
    if (this.subsectionName ===
      LearnerDashboardPageConstants
        .LEARNER_DASHBOARD_SUBSECTION_I18N_IDS.EXPLORATIONS) {
      activityType = constants.ACTIVITY_TYPE_EXPLORATION;
    } else if (this.subsectionName ===
      LearnerDashboardPageConstants
        .LEARNER_DASHBOARD_SUBSECTION_I18N_IDS
        .COLLECTIONS) {
      activityType = constants.ACTIVITY_TYPE_COLLECTION;
    } else {
      throw new Error('Subsection name is not valid.');
    }

    let removeActivityUrlPrefix = '';
    if (this.sectionNameI18nId ===
      LearnerDashboardPageConstants
        .LEARNER_DASHBOARD_SECTION_I18N_IDS.PLAYLIST) {
      removeActivityUrlPrefix =
        '/learnerplaylistactivityhandler/';
    } else if (this.sectionNameI18nId ===
      LearnerDashboardPageConstants
        .LEARNER_DASHBOARD_SECTION_I18N_IDS.INCOMPLETE) {
      removeActivityUrlPrefix =
        '/learnerincompleteactivityhandler/';
    } else {
      throw new Error('Section name is not valid.');
    }

    this.removeActivityUrl = (
      this.urlInterpolationService.interpolateUrl(
        removeActivityUrlPrefix +
        '<activityType>/<activityId>', {
          activityType: activityType,
          activityId: this.activityId
        }));
  }

  remove(): void {
    this.activeModal.close(this.removeActivityUrl);
  }

  cancel(): void {
    this.activeModal.dismiss();
  }
}

angular.module('oppia').directive(
  'oppiaRemoveActivityModalComponent',
  downgradeComponent(
    {component: RemoveActivityModalComponent}));
