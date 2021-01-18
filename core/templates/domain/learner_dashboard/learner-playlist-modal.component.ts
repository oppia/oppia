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
 * @fileoverview Controller for learnerPlaylistModal.
 */
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';



@Component({
  selector: 'learner-playlist-modal',
  templateUrl: (
    '/template/pages/learner-dashboard-page/modal-templates/' +
    'remove-activity-from-learner-dashboard-modal.template.html'),
  styleUrls: []
})
export class LearnerPlaylistModalComponent {
  constructor(
    private activeModal: NgbActiveModal,
    private http: HttpClient,
    private activityType = activityType,
    private activityId = activityId,
    private activityTitle = activityTitle,
    private urlInterpolationService: UrlInterpolationService
    = urlInterpolationService,
  ) {}

  sectionNameI18nId = (
      'I18N_LEARNER_DASHBOARD_PLAYLIST_SECTION');
  removeFromLearnerPlaylistUrl = (
    this.urlInterpolationService.interpolateUrl(
      '/learnerplaylistactivityhandler/' +
        '<activityType>/<activityId>', {
        activityType: this.activityType,
        activityId: this.activityId
      }));
  ngOnInit(): void {
  }

  cancel(): void {
    this.activeModal.dismiss();
  }

  remove(): void {
    this.http['delete'](this.removeFromLearnerPlaylistUrl);
    this.activeModal.close();
  }
}

angular.module('oppia').factory(
  'LearnerPlaylistModalComponent',
  downgradeComponent(
    {component: LearnerPlaylistModalComponent}));
