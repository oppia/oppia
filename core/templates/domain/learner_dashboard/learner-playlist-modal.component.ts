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
 * @fileoverview Controller for learnerPlaylistModal.
 */
import { downgradeComponent } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Component,Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { UrlInterpolationService } from
'domain/utilities/url-interpolation.service';


@Component({
  selector: 'learner-playlist-modal',
  templateUrl: './learner-playlist-modal.component.html',
  styleUrls: []
})
export class LearnerPlaylistModalComponent implements OnInit {
  @Input() activityId: string;
  @Input() activityTitle: string;
  @Input() activityType: string;

  sectionNameI18nId: string;
  removeFromLearnerPlaylistUrl:string;

  constructor(
    private activeModal: NgbActiveModal,
    private http:HttpClient,
    private urlInterpolationService: UrlInterpolationService
  ) {}

  ngOnInit(): void { 
    this.sectionNameI18nId = 'I18N_LEARNER_DASHBOARD_PLAYLIST_SECTION';
    this.removeFromLearnerPlaylistUrl = (
      this.urlInterpolationService.interpolateUrl(
      '/learnerplaylistactivityhandler/' +
      '<activityType>/<activityId>', {
        activityType: this.activityType,
        activityId: this.activityId
      }));
  }

  remove(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.delete<void>(this.removeFromLearnerPlaylistUrl).toPromise().then(() => {
        this.activeModal.close();
        resolve();
      }, errorResponse => {
        reject(errorResponse.error.error);
      });
    });
  }

  cancel(): void {
    this.activeModal.dismiss();
  }
}

angular.module('oppia').controller(
  'LearnerPlaylistModalComponent',
  downgradeComponent(
    {component: LearnerPlaylistModalComponent}));

// require('domain/utilities/url-interpolation.service.ts');

// angular.module('oppia').controller('LearnerPlaylistModalController', [
//   '$http', '$scope', '$uibModalInstance', 'UrlInterpolationService',
//   'activityId', 'activityTitle', 'activityType',
//   function(
//       $http, $scope, $uibModalInstance, UrlInterpolationService,
//       activityId, activityTitle, activityType) {
//     $scope.sectionNameI18nId = (
//       'I18N_LEARNER_DASHBOARD_PLAYLIST_SECTION');
//     $scope.activityTitle = activityTitle;
//     var removeFromLearnerPlaylistUrl = (
//       UrlInterpolationService.interpolateUrl(
//         '/learnerplaylistactivityhandler/' +
//         '<activityType>/<activityId>', {
//           activityType: activityType,
//           activityId: activityId
//         }));

//     $scope.remove = function() {
//       $http['delete'](removeFromLearnerPlaylistUrl);
//       $uibModalInstance.close();
//     };

//     $scope.cancel = function() {
//       $uibModalInstance.dismiss('cancel');
//     };
//   }
// ]);
