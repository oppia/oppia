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
 * @fileoverview Directive unit tests for the "enumerated sorted tiles"
 * visualization.
 */
// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
var UpgradedServices_1 = require("services/UpgradedServices");
// ^^^ This block is to be removed.
describe('Oppia sorted tiles visualization', function () {
    beforeEach(angular.mock.module('directiveTemplates'));
    beforeEach(angular.mock.module('oppia', function ($provide) {
        var ugs = new UpgradedServices_1.UpgradedServices();
        for (var _i = 0, _a = Object.entries(ugs.getUpgradedServices()); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            $provide.value(key, value);
        }
    }));
    beforeEach(angular.mock.inject(function ($compile, $rootScope, $templateCache, UrlInterpolationService) {
        var templateHtml = $templateCache.get(UrlInterpolationService.getExtensionResourceUrl('/visualizations/oppia-visualization-sorted-tiles.directive.html'));
        $compile(templateHtml)($rootScope);
        $rootScope.$digest();
        this.outerScope = $rootScope.$new();
        var elem = angular.element('<oppia-visualization-sorted-tiles ' +
            'escaped-data="[{answer: \'foo\', frequency: 5}]">' +
            '</rating-display>');
        var compiledElem = $compile(elem)(this.outerScope);
        this.outerScope.$digest();
        this.ctrlScope = compiledElem[0].getControllerScope();
    }));
    it('should display the correct number of stars', function () {
        this.outerScope.$digest();
        expect(this.ctrlScope.data).toEqual([{ answer: 'foo', frequency: 5 }]);
    });
});
