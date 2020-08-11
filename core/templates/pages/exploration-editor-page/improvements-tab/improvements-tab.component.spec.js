"use strict";
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
exports.__esModule = true;
/**
 * @fileoverview Unit tests for the controller of the 'Completion Graph' used by
 * the improvements tab.
 */
var testing_1 = require("@angular/common/http/testing");
var testing_2 = require("@angular/core/testing");
var exploration_improvements_task_registry_service_1 = require("services/exploration-improvements-task-registry.service");
var url_interpolation_service_1 = require("domain/utilities/url-interpolation.service");
require('pages/exploration-editor-page/improvements-tab/' +
    'improvements-tab.component.ts');
describe('Improvements tab', function () {
    var $ctrl;
    var $scope;
    var explorationImprovementsService;
    var explorationImprovementsTaskRegistryService;
    var urlInterpolationService;
    beforeEach(function () {
        testing_2.TestBed.configureTestingModule({
            imports: [testing_1.HttpClientTestingModule],
            providers: [
                exploration_improvements_task_registry_service_1.ExplorationImprovementsTaskRegistryService,
                url_interpolation_service_1.UrlInterpolationService,
            ]
        });
    });
    beforeEach(angular.mock.module('oppia'));
    beforeEach(angular.mock.inject(function ($componentController, $rootScope, _ExplorationImprovementsService_, _ExplorationImprovementsTaskRegistryService_, _UrlInterpolationService_) {
        explorationImprovementsService = _ExplorationImprovementsService_;
        explorationImprovementsTaskRegistryService = (_ExplorationImprovementsTaskRegistryService_);
        urlInterpolationService = _UrlInterpolationService_;
        $scope = $rootScope.$new();
        $ctrl = $componentController('improvementsTab');
    }));
    it('should provide the correct time machine image url', function () {
        $ctrl.$onInit();
        expect($ctrl.timeMachineImageUrl)
            .toMatch(new RegExp('/icons/time_machine.svg'));
    });
});
