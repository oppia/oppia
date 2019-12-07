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
 * @fileoverview Service to handle common code for suggestion modal display.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

export interface IParamDict {
  action: string;
  audioUpdateRequired?: boolean;
  commitMessage?: string;
  reviewMessage: string;
}

@Injectable({
  providedIn: 'root'
})
export class SuggestionModalService {
  SUGGESTION_ACCEPTED_MSG: string = (
    'This suggestion has already been accepted.');
  SUGGESTION_REJECTED_MSG: string = (
    'This suggestion has already been rejected.');
  SUGGESTION_INVALID_MSG: string = (
    'This suggestion was made for a state that no longer exists.' +
    ' It cannot be accepted.');
  UNSAVED_CHANGES_MSG: string = (
    'You have unsaved changes to this exploration. Please save/discard your ' +
    'unsaved changes if you wish to accept.');
  ACTION_ACCEPT_SUGGESTION: string = 'accept';
  ACTION_REJECT_SUGGESTION: string = 'reject';
  ACTION_RESUBMIT_SUGGESTION: string = 'resubmit';
  SUGGESTION_ACCEPTED: string = 'accepted';
  SUGGESTION_REJECTED: string = 'rejected';

  // TODO(YashJipkate): Replace 'any' with the exact type. This has been kept as
  // 'any' since '$uibModalInstance' is a AngularJS native object and does not
  // have a TS interface.
  acceptSuggestion($uibModalInstance: any, paramDict: IParamDict): void {
    $uibModalInstance.close(paramDict);
  }

  // TODO(YashJipkate): Replace 'any' with the exact type. This has been kept as
  // 'any' since '$uibModalInstance' is a AngularJS native object and does not
  // have a TS interface.
  rejectSuggestion($uibModalInstance: any, paramDict: IParamDict): void {
    $uibModalInstance.close(paramDict);
  }

  // TODO(YashJipkate): Replace 'any' with the exact type. This has been kept as
  // 'any' since '$uibModalInstance' is a AngularJS native object and does not
  // have a TS interface.
  cancelSuggestion($uibModalInstance: any): void {
    $uibModalInstance.dismiss('cancel');
  }
}

angular.module('oppia').factory(
  'SuggestionModalService', downgradeInjectable(SuggestionModalService));
