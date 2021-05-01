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
 * @fileoverview Component for the local navigation in the learner view.
 */

import { Component } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import constants from 'assets/constants';
import { ReadOnlyExplorationBackendApiService } from 'domain/exploration/read-only-exploration-backend-api.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { AlertsService } from 'services/alerts.service';
import { AttributionService } from 'services/attribution.service';
import { LoaderService } from 'services/loader.service';
import { UserService } from 'services/user.service';
import { ExplorationPlayerConstants } from '../exploration-player-page.constants';
import { ExplorationEngineService } from '../services/exploration-engine.service';

@Component({
  selector: 'oppia-learner-local-nav',
  templateUrl: './learner-local-nav.component.html'
})
export class LearnerLocalNavComponent {
  explorationId: string;
  canEdit: boolean;
  version: number;
  username: string = '';
  feedbackOptionIsShown: boolean = true;

  constructor(
    private ngbModal: NgbModal,
    private alertsService: AlertsService,
    private attributionService: AttributionService,
    private explorationEngineService: ExplorationEngineService,
    private loaderService: LoaderService,
    private readOnlyExplorationBackendApiService:
    ReadOnlyExplorationBackendApiService,
    private urlInterpolationService:
    UrlInterpolationService,
    private userService: UserService
  ) {}

  getFeedbackPopoverUrl(): string {
    return this.urlInterpolationService.getDirectiveTemplateUrl(
      ExplorationPlayerConstants.FEEDBACK_POPOVER_PATH);
  }

  showFlagExplorationModal(): void {
    // this.ngbModal.open()
  }

  toggleAttributionModal(): void {
    if (this.attributionService.isAttributionModalShown()) {
      this.attributionService.hideAttributionModal();
    } else {
      this.attributionService.showAttributionModal();
    }
  }

  ngOnInit(): void {
    this.explorationId = this.explorationEngineService.getExplorationId();
    this.version = this.explorationEngineService.getExplorationVersion();
    this.readOnlyExplorationBackendApiService
      .loadExploration(this.explorationId, this.version)
      .then((exploration) => {
        this.canEdit = exploration.can_edit;
      });
    this.loaderService.showLoadingScreen('Loading');
    this.userService.getUserInfoAsync().then((userInfo) => {
      this.username = userInfo.getUsername();
      if (
        this.username === null &&
        !constants.ENABLE_EXP_FEEDBACK_FOR_LOGGED_OUT_USERS) {
        this.feedbackOptionIsShown = false;
      }
      this.loaderService.hideLoadingScreen();
    });
  }
}

angular.module('oppia').directive('oppiaLearnerLocalNav',
  downgradeComponent({ component: LearnerLocalNavComponent }));

// Angular.module('oppia').directive('learnerLocalNav', [
//   'UrlInterpolationService', function(UrlInterpolationService) {
//     return {
//       restrict: 'E',
//       scope: {},
//       bindToController: {},
//       templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
//         '/pages/exploration-player-page/layout-directives/' +
//         'learner-local-nav.directive.html'),
//       controllerAs: '$ctrl',
//       controller: [
//         '$http', '$rootScope', '$uibModal', 'AlertsService',
//         'AttributionService', 'ExplorationEngineService',
//         'LoaderService', 'ReadOnlyExplorationBackendApiService',
//         'UrlInterpolationService', 'UserService',
//         'ENABLE_EXP_FEEDBACK_FOR_LOGGED_OUT_USERS', 'FEEDBACK_POPOVER_PATH',
//         'FLAG_EXPLORATION_URL_TEMPLATE',
//         function(
//             $http, $rootScope, $uibModal, AlertsService,
//             AttributionService, ExplorationEngineService,
//             LoaderService, ReadOnlyExplorationBackendApiService,
//             UrlInterpolationService, UserService,
//             ENABLE_EXP_FEEDBACK_FOR_LOGGED_OUT_USERS, FEEDBACK_POPOVER_PATH,
//             FLAG_EXPLORATION_URL_TEMPLATE) {
//           var ctrl = this;
//           ctrl.getFeedbackPopoverUrl = function() {
//             return UrlInterpolationService.getDirectiveTemplateUrl(
//               FEEDBACK_POPOVER_PATH);
//           };

//           ctrl.showFlagExplorationModal = function() {
//             $uibModal.open({
//               template: require(
//                 'pages/exploration-player-page/templates/' +
//                 'flag-exploration-modal.template.html'),
//               backdrop: 'static',
//               controller: 'FlagExplorationModalController',
//             }).result.then(function(result) {
//               var flagExplorationUrl = UrlInterpolationService.interpolateUrl(
//                 FLAG_EXPLORATION_URL_TEMPLATE, {
//                   exploration_id: ctrl.explorationId
//                 }
//               );
//               var report = (
//                 '[' + result.state + '] (' + result.report_type + ') ' +
//                 result.report_text);
//               $http.post(flagExplorationUrl, {
//                 report_text: report
//               }, function(error) {
//                 AlertsService.addWarning(error);
//               });
//               $uibModal.open({
//                 template: require(
//                   'pages/exploration-player-page/templates/' +
//                   'exploration-successfully-flagged-modal.template.html'),
//                 backdrop: true,
//                 controller: 'ConfirmOrCancelModalController'
//               }).result.then(function() {}, function() {
//                 // Note to developers:
//                 // This callback is triggered when the Cancel button is clicked.
//                 // No further action is needed.
//               });
//             }, function() {
//               // Note to developers:
//               // This callback is triggered when the Cancel button is clicked.
//               // No further action is needed.
//             });
//           };

//           ctrl.toggleAttributionModal = function() {
//             if (AttributionService.isAttributionModalShown()) {
//               AttributionService.hideAttributionModal();
//             } else {
//               AttributionService.showAttributionModal();
//             }
//           };

//           ctrl.$onInit = function() {
//             ctrl.explorationId = ExplorationEngineService.getExplorationId();
//             ReadOnlyExplorationBackendApiService
//               .loadExploration(ctrl.explorationId)
//               .then(function(exploration) {
//                 ctrl.canEdit = exploration.can_edit;
//                 $rootScope.$applyAsync();
//               });
//             ctrl.username = '';
//             ctrl.feedbackOptionIsShown = true;
//             LoaderService.showLoadingScreen('Loading');
//             UserService.getUserInfoAsync().then(function(userInfo) {
//               ctrl.username = userInfo.getUsername();
//               if (
//                 ctrl.username === null &&
//                 !ENABLE_EXP_FEEDBACK_FOR_LOGGED_OUT_USERS) {
//                 ctrl.feedbackOptionIsShown = false;
//               }
//               LoaderService.hideLoadingScreen();
//               // TODO(#8521): Remove the use of $rootScope.$apply()
//               // once the controller is migrated to angular.
//               $rootScope.$applyAsync();
//             });
//           };
//         }
//       ]
//     };
//   }]);
