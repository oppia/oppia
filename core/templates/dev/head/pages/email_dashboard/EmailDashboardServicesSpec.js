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
 * @fileoverview Unit tests for the email dashboard page.
 */

describe('Email Dashboard Services', function() {
  beforeEach(module('oppia'));

  describe('Email Dashboard Servces', function() {
    var service, $httpBackend, mockCallback;

    beforeEach(inject(function($injector) {
      $httpBackend = $injector.get('$httpBackend');
      service = $injector.get('EmailDashboardDataService');
      mockCallback = jasmine.createSpy('callback');
    }));

    it('should fetch correct data from backend', function() {
      var data = [{
        id: 'q123'
      },
      {
        id: 'q456'
      }];
      $httpBackend.expectGET(/.*?emaildashboarddatahandler?.*/g).respond({
        recent_queries: data,
        cursor: null
      });
      expect(service.getQueries()).toEqual([]);
      expect(service.getCurrentPageIndex()).toEqual(-1);
      expect(service.getLatestCursor()).toBe(null);
      service.getNextQueries(mockCallback);
      $httpBackend.flush();
      expect(service.getQueries().length).toEqual(2);
      expect(service.getQueries()).toEqual(data);
      expect(service.getCurrentPageIndex()).toEqual(0);
      expect(service.getLatestCursor()).toBe(null);
      expect(mockCallback).toHaveBeenCalledWith(data);
    });
  });
});
