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
 * @fileoverview Unit tests for baseContent component.
 */

import { EventEmitter } from '@angular/core';

var MockWindow = function() {
    this.location = {
      hostname: 'oppiaserver.appspot.com',
      pathname: '/path',
      href: '',
      search: '/search',
      hash: '/hash'
    };
};

describe('Base Content Component', function() {
    var ctrl = null;
    var $rootScope = null;
    var $scope = null;
    var BackgroundMaskService = null;
    var BottomNavbarStatusService = null;
    var PageTitleService = null;
    var SidebarStatusService = null;
    var mockWindow = null;
    var loadingMessageChangeEventEmitter = new EventEmitter();

    beforeEach(angular.mock.module('oppia', function($provide) {
        mockWindow = new MockWindow();
        $provide.value('LoaderService', {
          onLoadingMessageChange: loadingMessageChangeEventEmitter
        });
        $provide.value('UrlService', {
            isIframed: () =>  true
        });
        $provide.value('$window', mockWindow);
    }));

    beforeEach(angular.mock.inject(function($injector, $componentController) {
        $rootScope = $injector.get('$rootScope');
        BackgroundMaskService = $injector.get('BackgroundMaskService');
        BottomNavbarStatusService = $injector.get('BottomNavbarStatusService');
        PageTitleService = $injector.get('PageTitleService');
        SidebarStatusService = $injector.get('SidebarStatusService');

        $scope = $rootScope.$new();
        ctrl = $componentController('baseContent', {
            $scope: $scope
        });
        ctrl.$onInit();
    }));

    it('should initialize', function() {
        spyOn(BottomNavbarStatusService, 'isBottomNavbarEnabled')
            .and.returnValue(true);
        expect(ctrl.isBottomNavbarShown()).toBe(true);

        loadingMessageChangeEventEmitter.emit('Loading...');

        expect(ctrl.iframed).toBe(true);
        expect(ctrl.DEV_MODE).toBe($rootScope.DEV_MODE);
        expect(ctrl.loadingMessage).toBe('Loading...');
    });

    it('should get header text', function() {
        spyOn(PageTitleService, 'getPageTitleForMobileView').and.returnValue(
            'Header');
        expect($scope.getHeaderText()).toEqual('Header');
    });

    it('should get sub header text', function() {
        spyOn(PageTitleService, 'getPageSubtitleForMobileView').and.returnValue(
            'Sub header');
        expect($scope.getSubheaderText()).toEqual('Sub header');
    });

    it('should return if sidebar is shown', function() {
        spyOn(SidebarStatusService, 'isSidebarShown').and.returnValue(false);
        expect(ctrl.isSidebarShown()).toBe(false);
    });

    it('should close sidebar', function() {
        var isSidebarShown = true;
        spyOn(SidebarStatusService, 'closeSidebar').and.callFake(() => {
            isSidebarShown = false;
        });

        ctrl.closeSidebarOnSwipe();

        expect(isSidebarShown).toBe(false);
    });

    it('should toggle mobile nav options', function() {
        ctrl.mobileNavOptionsAreShown = true;
        ctrl.toggleMobileNavOptions();
        expect(ctrl.mobileNavOptionsAreShown).toBe(false);
    });

    it('should return if background mask is active', function() {
        spyOn(BackgroundMaskService, 'isMaskActive').and.returnValue(true);
        expect(ctrl.isBackgroundMaskActive()).toBe(true);
    });

    it('should redirect when on testing server', function() {
        expect(mockWindow.location.href)
            .toBe('https://oppiatestserver.appspot.com/path/search/hash');
    });

    it('should skip to main content', function() {
        var mainContentElement = {
            tabIndex: 0,
            scrollIntoView: () => {},
            focus: () => {}
        };

        // This throws "Argument of type '() => { tabIndex: number;
        // scrollIntoView: () => void; focus: () => void; }' is not assignable
        // to parameter of type '(elementId: string) => HTMLElement'.". This is
        // because the actual 'getElementById' returns more properties than
        // required. We need to suppress this error because we need only
        // "tabIndex" property and "focus", "scrollIntoView" functions
        // for testing.
        // @ts-expect-error
        spyOn(document, 'getElementById').and.callFake(() => {
            return mainContentElement;
        });
        var scrollIntoViewSpy = spyOn(mainContentElement, 'scrollIntoView');
        var focusSpy = spyOn(mainContentElement, 'focus');

        ctrl.skipToMainContent();

        expect(mainContentElement.tabIndex).toBe(-1);
        expect(focusSpy).toHaveBeenCalled();
        expect(scrollIntoViewSpy).toHaveBeenCalled();
    });

    it('should throw error when mainContentElement is undefined', function() {
        var mainContentElement = undefined;
        spyOn(document, 'getElementById').and.callFake(() => {
            return mainContentElement;
        });

        expect(() => ctrl.skipToMainContent())
            .toThrow(new Error('Variable mainContentElement is undefined.'));
    });
});