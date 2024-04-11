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
 * @fileoverview Tests for SuggestionModalForLearnerDashboardService.
 */

import {async, TestBed} from '@angular/core/testing';
import {CsrfTokenService} from 'services/csrf-token.service';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';

import {SuggestionModalForLearnerDashboardService} from './suggestion-modal-for-learner-dashboard.service';

class MockNgbModalRef {
  componentInstance = {
    newContent: null,
    oldContent: null,
    description: null,
  };
}

describe('Suggestion Modal Service For Learners Dashboard', () => {
  let suggestionModalForLearnerDashboardService: SuggestionModalForLearnerDashboardService;
  let csrfService: CsrfTokenService;
  let ngbModal: NgbModal;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
  }));

  beforeEach(() => {
    suggestionModalForLearnerDashboardService = TestBed.inject(
      SuggestionModalForLearnerDashboardService
    );
    ngbModal = TestBed.inject(NgbModal);
    csrfService = TestBed.inject(CsrfTokenService);

    spyOn(csrfService, 'getTokenAsync').and.callFake(async () => {
      return new Promise(resolve => {
        resolve('sample-csrf-token');
      });
    });
  });

  it(
    'should open an ngbModal for suggestions requested' +
      ' when calling showSuggestionModal',
    () => {
      const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
        if (opt?.beforeDismiss !== undefined) {
          setTimeout(opt.beforeDismiss);
        }
        return {
          componentInstance: MockNgbModalRef,
          result: Promise.resolve('success'),
        } as NgbModalRef;
      });

      let suggestionType = 'edit_exploration_state_content';
      let extraParams = {
        newContent: 'new',
        oldContent: 'old',
        description: 'description',
      };

      suggestionModalForLearnerDashboardService.showSuggestionModal(
        suggestionType,
        extraParams
      );

      expect(modalSpy).toHaveBeenCalled();
    }
  );

  it(
    'should not open an ngbModal for suggestions requested' +
      ' when calling showSuggestionModal',
    () => {
      const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
        if (opt?.beforeDismiss !== undefined) {
          setTimeout(opt.beforeDismiss);
        }
        return {
          componentInstance: MockNgbModalRef,
          result: Promise.resolve('success'),
        } as NgbModalRef;
      });

      let suggestionType = 'invalidType';
      let extraParams = {
        newContent: 'new',
        oldContent: 'old',
        description: 'description',
      };

      suggestionModalForLearnerDashboardService.showSuggestionModal(
        suggestionType,
        extraParams
      );

      expect(modalSpy).not.toHaveBeenCalled();
    }
  );

  it(
    'should do nothing when cancel button is clicked' +
      ' when calling showSuggestionModal',
    () => {
      const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
        if (opt?.beforeDismiss !== undefined) {
          setTimeout(opt.beforeDismiss);
        }
        return {
          componentInstance: MockNgbModalRef,
          result: Promise.reject('cancel'),
        } as NgbModalRef;
      });

      let suggestionType = 'edit_exploration_state_content';
      let extraParams = {
        newContent: 'new',
        oldContent: 'old',
        description: 'description',
      };

      suggestionModalForLearnerDashboardService.showSuggestionModal(
        suggestionType,
        extraParams
      );

      expect(modalSpy).toHaveBeenCalled();
    }
  );
});
