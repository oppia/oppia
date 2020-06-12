// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for Alert Messages
 */

import { AlertsService, Message } from 'services/alerts.service';

interface ToastrActionConfig {
  allowHtml?: boolean;
  closeButton?: boolean | string;
  closeHtml?: string;
  extendedTimeOut?: number;
  extraData?: Object;
  iconClass?: string;
  messageClass?: string;
  progressBar?: boolean;
  tapToDismiss?: boolean;
  templates?: string;
  timeOut?: number;
  titleClass?: string;
  toastClass?: string;
  onHidden?: Function;
  onShown?: Function;
  onTap?: Function;
}

interface ToastrAction {
  (message: string, config?: ToastrActionConfig): void;
  (message: string, heading: string, config?: ToastrActionConfig): void;
}

interface Toastr {
  success: ToastrAction;
  info: ToastrAction;
  warning: ToastrAction;
  error: ToastrAction;
}

interface AlertMessageCustomScope extends ng.IScope {
  AlertsService: AlertsService
  toastr: Toastr;

  getMessage: () => Message;
}

angular.module('oppia').directive('alertMessage', [function() {
  return {
    restrict: 'E',
    scope: {
      getMessage: '&messageObject',
      getMessageIndex: '&messageIndex'
    },
    template: '<div class="oppia-alert-message"></div>',
    controller: [
      '$scope', 'AlertsService', 'toastr',
      function($scope, AlertsService, toastr) {
        $scope.AlertsService = AlertsService;
        $scope.toastr = toastr;
      }
    ],
    link: function(scope: AlertMessageCustomScope) {
      var message = scope.getMessage();
      if (message.type === 'info') {
        scope.toastr.info(message.content, {
          timeOut: message.timeout,
          onHidden: function() {
            scope.AlertsService.deleteMessage(message);
          }
        });
      } else if (message.type === 'success') {
        scope.toastr.success(message.content, {
          timeOut: message.timeout,
          onHidden: function() {
            scope.AlertsService.deleteMessage(message);
          }
        });
      }
    }
  };
}]);
