// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for ImprovementsDisplayService.
 */

require(
  'pages/exploration-editor-page/improvements-tab/services/' +
  'improvements-display.service.ts');

describe('ImprovementsDisplayService', function() {
  var $httpBackend = null;
  var ImprovementsDisplayService = null;
  var STATUS_COMPLIMENT = null;
  var STATUS_FIXED = null;
  var STATUS_IGNORED = null;
  var STATUS_NOT_ACTIONABLE = null;
  var STATUS_OPEN = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function(
      _$httpBackend_, _ImprovementsDisplayService_,
      _STATUS_COMPLIMENT_, _STATUS_FIXED_, _STATUS_IGNORED_,
      _STATUS_NOT_ACTIONABLE_, _STATUS_OPEN_) {
    $httpBackend = _$httpBackend_;
    ImprovementsDisplayService = _ImprovementsDisplayService_;
    STATUS_COMPLIMENT = _STATUS_COMPLIMENT_;
    STATUS_FIXED = _STATUS_FIXED_;
    STATUS_IGNORED = _STATUS_IGNORED_;
    STATUS_NOT_ACTIONABLE = _STATUS_NOT_ACTIONABLE_;
    STATUS_OPEN = _STATUS_OPEN_;
  }));

  describe('STATUS_OPEN', function() {
    beforeEach(function() {
      this.status = STATUS_OPEN;
    });

    it('is open', function() {
      expect(ImprovementsDisplayService.isOpen(this.status)).toBe(true);
    });

    it('uses info badge', function() {
      expect(ImprovementsDisplayService.getStatusCssClass(this.status))
        .toEqual('badge badge-info');
    });

    it('has a nice name', function() {
      expect(ImprovementsDisplayService.getHumanReadableStatus(this.status))
        .toEqual('Open');
    });
  });

  describe('STATUS_FIXED', function() {
    beforeEach(function() {
      this.status = STATUS_FIXED;
    });

    it('is not open', function() {
      expect(ImprovementsDisplayService.isOpen(this.status)).toBe(false);
    });

    it('uses default badge', function() {
      expect(ImprovementsDisplayService.getStatusCssClass(this.status))
        .toEqual('badge badge-default');
    });

    it('has a nice name', function() {
      expect(ImprovementsDisplayService.getHumanReadableStatus(this.status))
        .toEqual('Fixed');
    });
  });

  describe('STATUS_IGNORED', function() {
    beforeEach(function() {
      this.status = STATUS_IGNORED;
    });

    it('is not open', function() {
      expect(ImprovementsDisplayService.isOpen(this.status)).toBe(false);
    });

    it('uses default badge', function() {
      expect(ImprovementsDisplayService.getStatusCssClass(this.status))
        .toEqual('badge badge-default');
    });

    it('has a nice name', function() {
      expect(ImprovementsDisplayService.getHumanReadableStatus(this.status))
        .toEqual('Ignored');
    });
  });

  describe('STATUS_COMPLIMENT', function() {
    beforeEach(function() {
      this.status = STATUS_COMPLIMENT;
    });

    it('is not open', function() {
      expect(ImprovementsDisplayService.isOpen(this.status)).toBe(false);
    });

    it('uses success badge', function() {
      expect(ImprovementsDisplayService.getStatusCssClass(this.status))
        .toEqual('badge badge-success');
    });

    it('has a nice name', function() {
      expect(ImprovementsDisplayService.getHumanReadableStatus(this.status))
        .toEqual('Compliment');
    });
  });

  describe('STATUS_NOT_ACTIONABLE', function() {
    beforeEach(function() {
      this.status = STATUS_NOT_ACTIONABLE;
    });

    it('is not open', function() {
      expect(ImprovementsDisplayService.isOpen(this.status)).toBe(false);
    });

    it('uses default badge', function() {
      expect(ImprovementsDisplayService.getStatusCssClass(this.status))
        .toEqual('badge badge-default');
    });

    it('has a nice name', function() {
      expect(ImprovementsDisplayService.getHumanReadableStatus(this.status))
        .toEqual('Not Actionable');
    });
  });

  describe('non-existant status', function() {
    beforeEach(function() {
      this.status = 'not_a_status';
    });

    it('is not open', function() {
      expect(ImprovementsDisplayService.isOpen(this.status)).toBe(false);
    });

    it('uses default badge', function() {
      expect(ImprovementsDisplayService.getStatusCssClass(this.status))
        .toEqual('badge badge-default');
    });

    it('has an empty name', function() {
      expect(ImprovementsDisplayService.getHumanReadableStatus(this.status))
        .toEqual('');
    });
  });
});
