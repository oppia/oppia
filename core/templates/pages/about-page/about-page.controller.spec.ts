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
 * @fileoverview Unit tests for aboutPage.
 */

import { WindowRef } from 'services/contextual/window-ref.service';

describe('About Page', function() {
  var $scope = null, ctrl = null;
  var windowRef = new WindowRef();

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('WindowRef', windowRef);
  }));
  beforeEach(angular.mock.inject(function($injector) {
    var $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    var directive = $injector.get('aboutPageDirective')[0];
    ctrl = $injector.instantiate(directive.controller, {
      $rootScope: $scope
    });
  }));

  afterEach(function() {
    // onhashchange and location.hash are reassigned because it shares
    // same reference to the all test blocks, making the tests unpredictable.
    windowRef.nativeWindow.onhashchange = null;
    windowRef.nativeWindow.location.hash = '';
  });

  it('should click on about tab', function(done) {
    // @ts-ignore
    var addClassSpy = spyOn($.fn, 'addClass').and.callThrough();
    // @ts-ignore
    var removeClassSpy = spyOn($.fn, 'removeClass').and.callThrough();

    ctrl.$onInit();
    ctrl.onTabClick('about');

    // setTimeout is being used here in order to wait onhashchange event to
    // finish. setTimeout is executed only after call stack is empty.
    // Ref: https://developer.mozilla.org/en-US/docs/Web/JavaScript/EventLoop
    setTimeout(function() {
      expect(windowRef.nativeWindow.location.hash).toBe('#about');
      // 2 calls for activeTab calls on onTabClick and 2 calls for
      // activeTab calls on $onInit.
      expect(addClassSpy).toHaveBeenCalledTimes(4);
      // 2 calls for activeTab calls on onTabClick and 2 calls for
      // activeTab calls on $onInit.
      expect(removeClassSpy).toHaveBeenCalledTimes(4);
      done();
    });
  });

  it('should click on license tab', function(done) {
    // @ts-ignore
    var addClassSpy = spyOn($.fn, 'addClass').and.callThrough();
    // @ts-ignore
    var removeClassSpy = spyOn($.fn, 'removeClass').and.callThrough();

    ctrl.$onInit();
    ctrl.onTabClick('license');
    spyOnProperty(windowRef, 'nativeWindow').and.returnValue({
      location: {
        hash: '#license',
        reload: function() {}
      }
    });

    // setTimeout is being used here in order to wait onhashchange event to
    // finish. setTimeout is executed only after call stack is empty.
    // Ref: https://developer.mozilla.org/en-US/docs/Web/JavaScript/EventLoop
    setTimeout(function() {
      expect(windowRef.nativeWindow.location.hash).toBe('#license');
      // 2 calls for activeTab calls on onTabClick and 2 calls for
      // activeTab calls on $onInit.
      expect(addClassSpy).toHaveBeenCalledTimes(4);
      // 2 calls for activeTab calls on onTabClick and 2 calls for
      // activeTab calls on $onInit.
      expect(removeClassSpy).toHaveBeenCalledTimes(4);
      done();
    });
  });

  it('should click on foundation tab', function(done) {
    // @ts-ignore
    var addClassSpy = spyOn($.fn, 'addClass').and.callThrough();
    // @ts-ignore
    var removeClassSpy = spyOn($.fn, 'removeClass').and.callThrough();

    ctrl.$onInit();
    ctrl.onTabClick('foundation');

    // setTimeout is being used here in order to wait onhashchange event to
    // finish. setTimeout is executed only after call stack is empty.
    // Ref: https://developer.mozilla.org/en-US/docs/Web/JavaScript/EventLoop
    setTimeout(function() {
      expect(windowRef.nativeWindow.location.hash).toBe('#foundation');
      // 2 calls for activeTab calls on onTabClick and 2 calls for
      // activeTab calls on $onInit.
      expect(addClassSpy).toHaveBeenCalledTimes(4);
      // 2 calls for activeTab calls on onTabClick and 2 calls for
      // activeTab calls on $onInit.
      expect(removeClassSpy).toHaveBeenCalledTimes(4);
      done();
    });
  });

  it('should click on credits tab', function(done) {
    // @ts-ignore
    var addClassSpy = spyOn($.fn, 'addClass').and.callThrough();
    // @ts-ignore
    var removeClassSpy = spyOn($.fn, 'removeClass').and.callThrough();

    ctrl.$onInit();
    ctrl.onTabClick('credits');

    // setTimeout is being used here in order to wait onhashchange event to
    // finish. setTimeout is executed only after call stack is empty.
    // Ref: https://developer.mozilla.org/en-US/docs/Web/JavaScript/EventLoop
    setTimeout(function() {
      expect(windowRef.nativeWindow.location.hash).toBe('#credits');
      // 2 calls for activeTab calls on onTabClick and 2 calls for
      // activeTab calls on $onInit.
      expect(addClassSpy).toHaveBeenCalledTimes(4);
      // 2 calls for activeTab calls on onTabClick and 2 calls for
      // activeTab calls on $onInit.
      expect(removeClassSpy).toHaveBeenCalledTimes(4);
      done();
    });
  });

  it('should active about tab on init', function() {
    windowRef.nativeWindow.location.hash = '#about';
    // @ts-ignore
    var addClassSpy = spyOn($.fn, 'addClass').and.callThrough();
    // @ts-ignore
    var removeClassSpy = spyOn($.fn, 'removeClass').and.callThrough();

    ctrl.$onInit();

    expect(windowRef.nativeWindow.location.hash).toBe('#about');
    expect(addClassSpy).toHaveBeenCalledTimes(2);
    expect(removeClassSpy).toHaveBeenCalledTimes(2);
  });

  it('should active about license on init', function() {
    windowRef.nativeWindow.location.hash = '#license';
    // @ts-ignore
    var addClassSpy = spyOn($.fn, 'addClass').and.callThrough();
    // @ts-ignore
    var removeClassSpy = spyOn($.fn, 'removeClass').and.callThrough();

    ctrl.$onInit();

    expect(windowRef.nativeWindow.location.hash).toBe('#license');
    expect(addClassSpy).toHaveBeenCalledTimes(2);
    expect(removeClassSpy).toHaveBeenCalledTimes(2);
  });

  it('should active foundation tab on init', function() {
    windowRef.nativeWindow.location.hash = '#foundation';
    // @ts-ignore
    var addClassSpy = spyOn($.fn, 'addClass').and.callThrough();
    // @ts-ignore
    var removeClassSpy = spyOn($.fn, 'removeClass').and.callThrough();

    ctrl.$onInit();

    expect(windowRef.nativeWindow.location.hash).toBe('#foundation');
    expect(addClassSpy).toHaveBeenCalledTimes(2);
    expect(removeClassSpy).toHaveBeenCalledTimes(2);
  });

  it('should active credits tab on init', function() {
    windowRef.nativeWindow.location.hash = '#credits';
    // @ts-ignore
    var addClassSpy = spyOn($.fn, 'addClass').and.callThrough();
    // @ts-ignore
    var removeClassSpy = spyOn($.fn, 'removeClass').and.callThrough();

    ctrl.$onInit();

    expect(windowRef.nativeWindow.location.hash).toBe('#credits');
    expect(addClassSpy).toHaveBeenCalledTimes(2);
    expect(removeClassSpy).toHaveBeenCalledTimes(2);
  });

  it('should get static image url', function() {
    expect(ctrl.getStaticImageUrl('/path/to/image')).toBe(
      '/assets/images/path/to/image');
  });

  it('should blah when onInit is called', function() {
    ctrl.$onInit();

    expect(ctrl.listOfNames).toBe(
      'Alex Kauffmann, Allison Barros, Amy Latten, Brett Barros,' +
      ' Crystal Kwok, Daniel Hernandez, Divya Siddarth, Ilwon Yoon,' +
      ' Jennifer Chen, John Cox, John Orr, Katie Berlent, Michael Wawszczak,' +
      ' Mike Gainer, Neil Fraser, Noah Falstein, Nupur Jain, Peter Norvig,' +
      ' Philip Guo, Piotr Mitros, Rachel Chen, Rahim Nathwani, Robyn Choo,' +
      ' Tricia Ngoon, Vikrant Nanda, Vinamrata Singal & Yarin Feigenbaum');
    expect(ctrl.aboutPageMascotImgUrl).toBe(
      '/assets/images/general/about_page_mascot.png');
  });
});
