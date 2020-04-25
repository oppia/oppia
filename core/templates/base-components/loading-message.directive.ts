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
 * @fileoverview Directive for showing the loading screen with a message.
 */

angular.module('oppia').directive('loadingMessage', [
  function() {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      template: require('./loading-message.directive.html'),
      controllerAs: '$ctrl',
      controller: ['$rootScope', 'LoaderService',
        function($rootScope, LoaderService) {
          var ctrl = this;
          ctrl.$onInit = function() {
            /**
             * TODO(@srijanreddy98): when migrating to angular 8
             * remove the rootScope.loadingMessage and use a
             * class variable instead. this.loadingMessage = message
             */
            LoaderService.getLoadingMessageSubject().subscribe(
              (message: string) => $rootScope.loadingMessage = message
            );
          };
        }
      ]
    };
  }
]);
