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
 * @fileoverview Unit tests for
 * NestedDirectivesRecursionTimeoutPreventionService.
 */

import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ANGULAR_SERVICES, ANGULAR_SERVICES_NAMES } from
  'tests/angular-services.index';
import { HttpClientTestingModule } from '@angular/common/http/testing';

require('services/nested-directives-recursion-timeout-prevention.service');
require('services/contextual/logger.service');

describe('Nested Directives Recursion Timeout Prevention Service',
  function() {
    var ndrtps, ls;
    var $scope;
    var element = {
      append: function() {},
      contents: function() {
        return {
          remove: function() {}
        };
      }
    };
    var functions;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [...ANGULAR_SERVICES],
        schemas: [NO_ERRORS_SCHEMA]
      });
    });

    beforeEach(angular.mock.module('oppia'));
    beforeEach(angular.mock.module('oppia', function($provide) {
      for (let i in ANGULAR_SERVICES) {
        $provide.value(ANGULAR_SERVICES_NAMES[i],
          TestBed.get(ANGULAR_SERVICES[i]));
      }
    }));
    beforeEach(angular.mock.inject(function($injector, $rootScope) {
      ndrtps = $injector.get(
        'NestedDirectivesRecursionTimeoutPreventionService');
      ls = $injector.get('LoggerService');
      $scope = $rootScope.$new();

      functions = {
        pre: function() {
          ls.log('Calling pre function');
        },
        post: function() {}
      };
    }));

    it('should return linking functions when object is passed as' +
      ' arguments on compile function', function() {
      var logSpy = spyOn(ls, 'log').and.callThrough();
      var postFunctionSpy = spyOn(functions, 'post').and.callThrough();
      var appendElementSpy = spyOn(element, 'append').and.callThrough();
      var linkingFunctions = ndrtps.compile(element, functions);

      expect(linkingFunctions.pre).toBeInstanceOf(Function);
      linkingFunctions.pre();
      expect(logSpy).toHaveBeenCalledWith('Calling pre function');

      linkingFunctions.post($scope, element);
      expect(appendElementSpy).toHaveBeenCalled();
      expect(postFunctionSpy).toHaveBeenCalledWith($scope, element);
    });

    it('should return post linking function when a function is passed' +
      ' as argument on compile function', function() {
      var postFunctionSpy = spyOn(functions, 'post').and.callThrough();
      var appendElementSpy = spyOn(element, 'append').and.callThrough();

      var linkingFunctions = ndrtps.compile(element, functions.post);

      expect(linkingFunctions.pre).toBeNull();
      linkingFunctions.post($scope, element);
      expect(appendElementSpy).toHaveBeenCalled();
      expect(postFunctionSpy).toHaveBeenCalledWith($scope, element);
    });
  });
