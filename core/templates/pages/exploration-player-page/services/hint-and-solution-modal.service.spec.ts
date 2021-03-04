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
 * @fileoverview Tests for HintAndSolutionModalService.
 */

// eslint-disable-next-line max-len
require('pages/exploration-player-page/services/hint-and-solution-modal.service.ts');

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.
// TODO(#7222): Remove usage of importAllAngularServices once upgraded to
// Angular 8.
import { importAllAngularServices } from 'tests/unit-test-utils';
import { TranslatorProviderForTests } from 'tests/test.extras';

describe('Hint and Solution modal service factory', () => {
  var HintAndSolutionModalService = null;
  var $uibModal = null;
  importAllAngularServices();

  beforeEach(angular.mock.module('oppia'));
  beforeEach(
    angular.mock.module('oppia', TranslatorProviderForTests));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function($injector) {
    HintAndSolutionModalService = $injector.get(
      'HintAndSolutionModalService');
    $uibModal = $injector.get('$uibModal');
  }));

  it('should open an $uibModal when clicking displayHintModal', () => {
    let modalSpy = spyOn($uibModal, 'open').and.callThrough();
    HintAndSolutionModalService.displayHintModal('0');
    expect(modalSpy).toHaveBeenCalled();
    });

  it('should open an $uibModal when clicking displaySolutionModal', () => {
    let modalSpy = spyOn($uibModal, 'open').and.callThrough();
    HintAndSolutionModalService.displaySolutionModal();
    expect(modalSpy).toHaveBeenCalled();
    });

  it('should open an $uibModal when clicking displayHintModal', () => {
    let modalSpy = spyOn($uibModal, 'open').and.callThrough();
    HintAndSolutionModalService.displaySolutionInterstitialModal();
    expect(modalSpy).toHaveBeenCalled();
    });
});
