// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for generic services.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// App.ts is upgraded to Angular 8.
import { ParamChangeObjectFactory } from
  'domain/exploration/ParamChangeObjectFactory';
import { WrittenTranslationObjectFactory } from
  'domain/exploration/WrittenTranslationObjectFactory';
import { WrittenTranslationsObjectFactory } from
  'domain/exploration/WrittenTranslationsObjectFactory';
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

import constants from 'assets/constants';
import sourceMappedStackTrace from 'sourcemapped-stacktrace';

describe('App', function() {
  describe('Generating Constants', function() {
    beforeEach(angular.mock.module('oppia'));
    beforeEach(angular.mock.module('oppia', function($provide) {
      $provide.value(
        'ParamChangeObjectFactory', new ParamChangeObjectFactory());
      $provide.value(
        'WrittenTranslationObjectFactory',
        new WrittenTranslationObjectFactory());
      $provide.value(
        'WrittenTranslationsObjectFactory',
        new WrittenTranslationsObjectFactory(
          new WrittenTranslationObjectFactory()));
    }));
    beforeEach(angular.mock.module('oppia', function($provide) {
      var ugs = new UpgradedServices();
      for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
        $provide.value(key, value);
      }
    }));

    var $injector = null;
    beforeEach(angular.mock.inject(function(_$injector_) {
      $injector = _$injector_.get('$injector');
    }));

    it('should transform all key value pairs to angular constants',
      function() {
        for (var constantName in constants) {
          expect($injector.has(constantName)).toBe(true);
          expect($injector.get(constantName)).toEqual(constants[constantName]);
        }
      });
  });

  describe('Exception Handler', function() {
    beforeEach(angular.mock.module('oppia'));
    beforeEach(angular.mock.module('oppia', function($provide) {
      $provide.constant('DEV_MODE', false);
    }));
    beforeEach(angular.mock.module('oppia', function($provide) {
      var ugs = new UpgradedServices();
      for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
        $provide.value(key, value);
      }
    }));

    var $exceptionHandler = null;
    var $log = null;
    beforeEach(angular.mock.inject(function(
        _$exceptionHandler_, _$log_) {
      $exceptionHandler = _$exceptionHandler_;
      $log = _$log_;
      spyOn($log, 'error');
      spyOn(sourceMappedStackTrace, 'mapStackTrace');
    }));

    it('should handle undefined gracefully', function() {
      $exceptionHandler(undefined);
      const errorFromObject = new Error('undefined');

      expect(sourceMappedStackTrace.mapStackTrace).toHaveBeenCalledWith(
        jasmine.stringMatching(/^Error: undefined/), jasmine.any(Function));
      expect($log.error).toHaveBeenCalledWith(errorFromObject);
    });

    it('should handle null gracefully', function() {
      $exceptionHandler(null);
      const errorFromObject = new Error(null);

      expect(sourceMappedStackTrace.mapStackTrace).toHaveBeenCalledWith(
        jasmine.stringMatching(/^Error: null/), jasmine.any(Function));
      expect($log.error).toHaveBeenCalledWith(errorFromObject);
    });

    it('should handle string values gracefully', function() {
      $exceptionHandler('something');
      const errorFromObject = new Error('something');

      expect(sourceMappedStackTrace.mapStackTrace).toHaveBeenCalledWith(
        jasmine.stringMatching(/^Error: something/), jasmine.any(Function));
      expect($log.error).toHaveBeenCalledWith(errorFromObject);
    });

    it('should print stack trace when given empty string', function() {
      $exceptionHandler('');
      const errorFromObject = new Error('');

      expect(sourceMappedStackTrace.mapStackTrace).toHaveBeenCalledWith(
        jasmine.stringMatching(/^Error/), jasmine.any(Function));
      expect($log.error).toHaveBeenCalledWith(errorFromObject);
    });

    it('should handle object values gracefully', function() {
      // Error constructor will fail to compile without casting the object from
      // unknown to string.
      let obj: unknown = {a: 'something'};
      $exceptionHandler(obj);
      const errorFromObject = new Error(obj as string);

      expect(sourceMappedStackTrace.mapStackTrace).toHaveBeenCalledWith(
        jasmine.stringMatching(/^Error: \[object Object\]/),
        jasmine.any(Function));
      expect($log.error).toHaveBeenCalledWith(errorFromObject);
    });

    it('should handle empty object values gracefully', function() {
      // Error constructor will fail to compile without casting the object from
      // unknown to string.
      let obj: unknown = {};
      $exceptionHandler(obj);
      const errorFromObject = new Error(obj as string);

      expect(sourceMappedStackTrace.mapStackTrace).toHaveBeenCalledWith(
        jasmine.stringMatching(/^Error: \[object Object\]/),
        jasmine.any(Function));
      expect($log.error).toHaveBeenCalledWith(errorFromObject);
    });

    it('should handle Error type exceptions correctly', function() {
      var expectedError = new Error('something');
      $exceptionHandler(expectedError);
      expect(sourceMappedStackTrace.mapStackTrace).toHaveBeenCalledWith(
        jasmine.stringMatching(/^Error: something/),
        jasmine.any(Function));
      expect($log.error).toHaveBeenCalledWith(expectedError);
    });

    it('should ignore exceptions with status code -1', function() {
      $exceptionHandler('Possibly unhandled rejection: { "status":-1 }');
      expect(sourceMappedStackTrace.mapStackTrace).not.toHaveBeenCalled();
      expect($log.error).not.toHaveBeenCalled();
    });

    it('should ignore $templateRequest:tpload error with status code -1',
      function() {
        $exceptionHandler('[$templateRequest:tpload]?p1=-1&p2=');
        expect(sourceMappedStackTrace.mapStackTrace).not.toHaveBeenCalled();
        expect($log.error).not.toHaveBeenCalled();
      });
  });
});
