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
 * @fileoverview Unit tests for ImprovementModalService.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

describe('Improvement Modal Service', function() {
  var ImprovementModalService = null;
  var $uibModal = null;
  var $q = null;
  var $rootScope = null;
  var openModalSpy = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('ContextService', {
      getExplorationId: () => '0'
    });
    $provide.value('UserExplorationPermissionsService', {
      getPermissionsAsync: () => $q.resolve({
        can_edit: true
      })
    });
    $provide.value('UserService', {
      getUserInfoAsync: () => $q.resolve({
        isLoggedIn: () => true
      })
    });
  }));
  beforeEach(angular.mock.inject(function($injector) {
    ImprovementModalService = $injector.get('ImprovementModalService');
    $uibModal = $injector.get('$uibModal');
    $q = $injector.get('$q');
    $rootScope = $injector.get('$rootScope');

    openModalSpy = spyOn($uibModal, 'open').and.callThrough();
  }));

  it('should open playthrough modal', function() {
    ImprovementModalService.openPlaythroughModal({}, 0);
    expect(openModalSpy).toHaveBeenCalled();
  });

  it('should open learner answer details modal', function() {
    ImprovementModalService.openLearnerAnswerDetails({});
    $rootScope.$apply();
    expect(openModalSpy).toHaveBeenCalled();
  });

  it('should open confirmation modal', function() {
    ImprovementModalService.openConfirmationModal(
      'Message', 'ButtonText', 'btn');
    expect(openModalSpy).toHaveBeenCalled();
  });
});
