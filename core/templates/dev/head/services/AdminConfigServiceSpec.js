// Copyright 2018 The Oppia Authors. All Rights Reserved.
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

describe('AdminConfigService', function() {
  beforeEach(module('oppia'));
  beforeEach(inject(function($injector) {
    this.AdminConfigService = $injector.get('AdminConfigService');
    this.ADMIN_CONFIG_URL = $injector.get('ADMIN_CONFIG_URL');
    this.$httpBackend = $injector.get('$httpBackend');
  }));
  afterEach(function() {
    this.$httpBackend.verifyNoOutstandingExpectation();
    this.$httpBackend.verifyNoOutstandingRequest();
  });

  describe('.init', function() {
    it('calls out to the backend for initialization', function() {
      var successHandler = jasmine.createSpy('success');
      var failureHandler = jasmine.createSpy('failure');
      this.$httpBackend.expectGET(this.ADMIN_CONFIG_URL).respond({
        'test_parameter_name': true,
      });

      this.AdminConfigService.init().then(successHandler, failureHandler);
      this.$httpBackend.flush();

      expect(successHandler).toHaveBeenCalled();
      expect(failureHandler).not.toHaveBeenCalled();
    });
  });

  describe('.getConfigValue', function() {
    it('returns value fetched from backend', function() {
      this.$httpBackend.expectGET(this.ADMIN_CONFIG_URL).respond({
        'test_parameter_name': true,
      });

      this.AdminConfigService.init();
      this.$httpBackend.flush();

      expect(
        this.AdminConfigService.getConfigValue('test_parameter_name', false)
      ).toEqual(true);
    });

    it('returns default value if the value is missing', function() {
      this.$httpBackend.expectGET(this.ADMIN_CONFIG_URL).respond({
        'test_parameter_name': true,
      });

      this.AdminConfigService.init();
      this.$httpBackend.flush();

      expect(
        this.AdminConfigService.getConfigValue('test_number', 'not a number')
      ).toEqual('not a number');
    });
  });
});
