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
 * @fileoverview Unit tests for SuggestionModalService.
 */
import { TestBed } from '@angular/core/testing';
import { SuggestionModalService } from './suggestion-modal.service';

describe('Suggestion Modal Service', () => {
  let sms;
  const uibModalInstanceMock = {
    close: paramDict => {},
    dismiss: message => {}
  };

  beforeEach(() => {
    sms = TestBed.get(SuggestionModalService);
  });

  it('should accept suggestion', () => {
    const closeSpy = spyOn(uibModalInstanceMock, 'close').and.callThrough();
    const paramDict = {
      action: sms.ACTION_ACCEPT_SUGGESTION,
      commitMessage: '',
      reviewMessage: ''
    };
    sms.acceptSuggestion(uibModalInstanceMock, paramDict);

    expect(closeSpy).toHaveBeenCalledWith(paramDict);
  });

  it('should reject suggestion', () => {
    const closeSpy = spyOn(uibModalInstanceMock, 'close').and.callThrough();
    const paramDict = {
      action: sms.ACTION_REJECT_SUGGESTION,
      commitMessage: '',
      reviewMessage: ''
    };
    sms.rejectSuggestion(uibModalInstanceMock, paramDict);

    expect(closeSpy).toHaveBeenCalledWith(paramDict);
  });

  it('should cancel suggestion', () => {
    const closeSpy = spyOn(uibModalInstanceMock, 'dismiss').and.callThrough();
    const dismissMessage = 'cancel';
    sms.cancelSuggestion(uibModalInstanceMock, dismissMessage);

    expect(closeSpy).toHaveBeenCalledWith(dismissMessage);
  });
});
