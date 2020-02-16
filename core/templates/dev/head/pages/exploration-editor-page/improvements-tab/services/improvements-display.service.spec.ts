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

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.
import { TestBed } from '@angular/core/testing';

import { ExplorationEditorPageConstants } from
  'pages/exploration-editor-page/exploration-editor-page.constants';
/* eslint-disable max-len */
import { ImprovementsDisplayService } from
  'pages/exploration-editor-page/improvements-tab/services/improvements-display.service';
/* eslint-enable max-len */

describe('ImprovementsDisplayService', function() {
  var ids = null;
  var STATUS_COMPLIMENT = null;
  var STATUS_FIXED = null;
  var STATUS_IGNORED = null;
  var STATUS_NOT_ACTIONABLE = null;
  var STATUS_OPEN = null;

  beforeEach(() => {
    ids = TestBed.get(ImprovementsDisplayService);
    STATUS_COMPLIMENT = ExplorationEditorPageConstants.STATUS_COMPLIMENT;
    STATUS_FIXED = ExplorationEditorPageConstants.STATUS_FIXED;
    STATUS_IGNORED = ExplorationEditorPageConstants.STATUS_IGNORED;
    STATUS_NOT_ACTIONABLE = (
      ExplorationEditorPageConstants.STATUS_NOT_ACTIONABLE);
    STATUS_OPEN = ExplorationEditorPageConstants.STATUS_OPEN;
  });

  describe('STATUS_OPEN', function() {
    beforeEach(function() {
      this.status = STATUS_OPEN;
    });

    it('is open', function() {
      expect(ids.isOpen(this.status)).toBe(true);
    });

    it('uses info badge', function() {
      expect(ids.getStatusCssClass(this.status))
        .toEqual('badge badge-info');
    });

    it('has a nice name', function() {
      expect(ids.getHumanReadableStatus(this.status))
        .toEqual('Open');
    });
  });

  describe('STATUS_FIXED', function() {
    beforeEach(function() {
      this.status = STATUS_FIXED;
    });

    it('is not open', function() {
      expect(ids.isOpen(this.status)).toBe(false);
    });

    it('uses default badge', function() {
      expect(ids.getStatusCssClass(this.status))
        .toEqual('badge badge-default');
    });

    it('has a nice name', function() {
      expect(ids.getHumanReadableStatus(this.status))
        .toEqual('Fixed');
    });
  });

  describe('STATUS_IGNORED', function() {
    beforeEach(function() {
      this.status = STATUS_IGNORED;
    });

    it('is not open', function() {
      expect(ids.isOpen(this.status)).toBe(false);
    });

    it('uses default badge', function() {
      expect(ids.getStatusCssClass(this.status))
        .toEqual('badge badge-default');
    });

    it('has a nice name', function() {
      expect(ids.getHumanReadableStatus(this.status))
        .toEqual('Ignored');
    });
  });

  describe('STATUS_COMPLIMENT', function() {
    beforeEach(function() {
      this.status = STATUS_COMPLIMENT;
    });

    it('is not open', function() {
      expect(ids.isOpen(this.status)).toBe(false);
    });

    it('uses success badge', function() {
      expect(ids.getStatusCssClass(this.status))
        .toEqual('badge badge-success');
    });

    it('has a nice name', function() {
      expect(ids.getHumanReadableStatus(this.status))
        .toEqual('Compliment');
    });
  });

  describe('STATUS_NOT_ACTIONABLE', function() {
    beforeEach(function() {
      this.status = STATUS_NOT_ACTIONABLE;
    });

    it('is not open', function() {
      expect(ids.isOpen(this.status)).toBe(false);
    });

    it('uses default badge', function() {
      expect(ids.getStatusCssClass(this.status))
        .toEqual('badge badge-default');
    });

    it('has a nice name', function() {
      expect(ids.getHumanReadableStatus(this.status))
        .toEqual('Not Actionable');
    });
  });

  describe('non-existant status', function() {
    beforeEach(function() {
      this.status = 'not_a_status';
    });

    it('is not open', function() {
      expect(ids.isOpen(this.status)).toBe(false);
    });

    it('uses default badge', function() {
      expect(ids.getStatusCssClass(this.status))
        .toEqual('badge badge-default');
    });

    it('has an empty name', function() {
      expect(ids.getHumanReadableStatus(this.status))
        .toEqual('');
    });
  });
});
