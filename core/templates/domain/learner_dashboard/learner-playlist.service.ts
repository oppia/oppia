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
 * @fileoverview Service related to the learner playlist.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { AppConstants } from 'app.constants';
import { AlertsService } from 'services/alerts.service';
import { HttpClient } from '@angular/common/http';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { LearnerPlaylistModalComponent } from
  'domain/learner_dashboard/learner-playlist-modal.component.ts';

@Injectable({
  providedIn: 'root'
})
export class LearnerPlaylistService {
  successfullyAdded: boolean;
  addToLearnerPlaylistUrl: string;

// belongs_to_completed_or_incomplete_list: false
// belongs_to_subscribed_activities: false
// is_admin: false
// is_moderator: false
// is_super_admin: true
// is_topic_manager: false
// playlist_limit_exceeded: false
// user_email: "test@example.com"
// username: "Radesh"

  constructor(
    private _alertsService: AlertsService,
    private _http: HttpClient,
    private nbgModal: NgbModal,
    private _urlInterpolationService: UrlInterpolationService,
  ) {}
  
  addToLearnerPlaylist(activityId: string, activityType: string): boolean{
    this.successfullyAdded = true;
    this.addToLearnerPlaylistUrl = (
      this._urlInterpolationService.interpolateUrl(
        '/learnerplaylistactivityhandler/<activityType>/<activityId>', {
          activityType: activityType,
          activityId: activityId
        }));
    this._http.post<any>(this.addToLearnerPlaylistUrl, {}).toPromise()
      .then(response => {
        console.log(response)
        console.log(response.belongs_to_completed_or_incomplete_list)
        if (response.belongs_to_completed_or_incomplete_list) {
          this.successfullyAdded = false;
          this._alertsService.addInfoMessage(
            'You have already completed or are completing this ' +
            'activity.');
        }
        if (response.belongs_to_subscribed_activities) {
          this.successfullyAdded = false;
          this._alertsService.addInfoMessage(
            'This is present in your creator dashboard');
        }
        if (response.playlist_limit_exceeded) {
          this.successfullyAdded = false;
          this._alertsService.addInfoMessage(
            'Your \'Play Later\' list is full!  Either you can ' +
            'complete some or you can head to the learner dashboard ' +
            'and remove some.');
        }
        if (this.successfullyAdded) {
          this._alertsService.addSuccessMessage(
            'Successfully added to your \'Play Later\' list.');
        }
      });
    return this.successfullyAdded; 
  }

  removeFromLearnerPlaylist(activityId, activityTitle,
    activityType, learnerDashboardActivityIds) {
    const modelRef = this.nbgModal.open(
      LearnerPlaylistModalComponent, {backdrop: true});
    modelRef.componentInstance.activityId = activityId;
    modelRef.componentInstance.activityTitle = activityTitle;
    modelRef.componentInstance.activityType = activityType;
    modelRef.result.then(function() {
      if (activityType === AppConstants.ACTIVITY_TYPE_EXPLORATION) {
        learnerDashboardActivityIds.removeFromExplorationLearnerPlaylist(
          activityId);
      } else if (activityType === AppConstants.ACTIVITY_TYPE_COLLECTION) {
        learnerDashboardActivityIds.removeFromCollectionLearnerPlaylist(
          activityId);
      }
    }, function() {
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
    });
  }
}

angular.module('oppia').factory(
  'LearnerPlaylistService',
  downgradeInjectable(LearnerPlaylistService)
);

// require('domain/utilities/url-interpolation.service.ts');
// require('services/alerts.service.ts');
// require('domain/learner_dashboard/learner-playlist-modal.controller.ts');

// angular.module('oppia').factory('LearnerPlaylistService', [
//   '$http', '$uibModal', 'this._alertsService', 'UrlInterpolationService',
//   'ACTIVITY_TYPE_COLLECTION', 'ACTIVITY_TYPE_EXPLORATION',
//   function(
//       $http, $uibModal, this._alertsService, UrlInterpolationService,
//       ACTIVITY_TYPE_COLLECTION, ACTIVITY_TYPE_EXPLORATION) {
//     var _addToLearnerPlaylist = function(activityId, activityType) {
//       var this.successfullyAdded = true;
//       var addToLearnerPlaylistUrl = (
//         UrlInterpolationService.interpolateUrl(
//           '/learnerplaylistactivityhandler/<activityType>/<activityId>', {
//             activityType: activityType,
//             activityId: activityId
//           }));
//       $http.post(addToLearnerPlaylistUrl, {})
//         .then(function(response) {
//           if (response.data.belongs_to_completed_or_incomplete_list) {
//             this.successfullyAdded = false;
//             this._alertsService.addInfoMessage(
//               'You have already completed or are completing this ' +
//               'activity.');
//           }
//           if (response.data.belongs_to_subscribed_activities) {
//             this.successfullyAdded = false;
//             this._alertsService.addInfoMessage(
//               'This is present in your creator dashboard');
//           }
//           if (response.data.playlist_limit_exceeded) {
//             this.successfullyAdded = false;
//             this._alertsService.addInfoMessage(
//               'Your \'Play Later\' list is full!  Either you can ' +
//               'complete some or you can head to the learner dashboard ' +
//               'and remove some.');
//           }
//           if (this.successfullyAdded) {
//             this._alertsService.addSuccessMessage(
//               'Successfully added to your \'Play Later\' list.');
//           }
//         });
//       return this.successfullyAdded;
//     };

    

//     var _removeFromLearnerPlaylist = function(
//         activityId, activityTitle, activityType, learnerDashboardActivityIds) {
//       $uibModal.open({
//         templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
//           '/pages/learner-dashboard-page/modal-templates/' +
//           'remove-activity-from-learner-dashboard-modal.template.html'),
//         backdrop: true,
//         resolve: {
//           activityId: function() {
//             return activityId;
//           },
//           activityTitle: function() {
//             return activityTitle;
//           },
//           activityType: function() {
//             return activityType;
//           }
//         },
//         controller: 'LearnerPlaylistModalController'
//       }).result.then(function() {
//         if (activityType === ACTIVITY_TYPE_EXPLORATION) {
//           learnerDashboardActivityIds.removeFromExplorationLearnerPlaylist(
//             activityId);
//         } else if (activityType === ACTIVITY_TYPE_COLLECTION) {
//           learnerDashboardActivityIds.removeFromCollectionLearnerPlaylist(
//             activityId);
//         }
//       }, function() {
//         // Note to developers:
//         // This callback is triggered when the Cancel button is clicked.
//         // No further action is needed.
//       });
//     };

//     return {
//       addToLearnerPlaylist: _addToLearnerPlaylist,
//       removeFromLearnerPlaylist: _removeFromLearnerPlaylist
//     };
//   }]);
