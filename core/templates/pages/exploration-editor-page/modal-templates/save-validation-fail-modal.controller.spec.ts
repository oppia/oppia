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
 * @fileoverview Unit tests for SaveValidationFailModalController.
 */

import { WindowRef } from 'services/contextual/window-ref.service';

describe('Save Validation Fail Modal Controller', () => {
  let $scope = null;
  let $uibModalInstance = null;
  let $timeout = null;
  const windowRef = new WindowRef();

  beforeEach(angular.mock.module('oppia', ($provide) => {
    $provide.value('WindowRef', windowRef);
  }));
  beforeEach(angular.mock.inject(($injector, $controller) => {
    $timeout = $injector.get('$timeout');
    const $rootScope = $injector.get('$rootScope');

    $uibModalInstance = jasmine.createSpyObj(
      '$uibModalInstance', ['close', 'dismiss']);

    $scope = $rootScope.$new();
    $controller(
      'SaveValidationFailModalController', {
        $scope: $scope,
        $uibModalInstance: $uibModalInstance
      });
  }));

  it('should refresh page when modal is closed', () => {
    const reloadSpy = jasmine.createSpy('reload');
    spyOnProperty(windowRef, 'nativeWindow').and.returnValue({
      location: {
        reload: reloadSpy
      }
    });

    $scope.closeAndRefresh();
    expect($uibModalInstance.dismiss).toHaveBeenCalledWith('cancel');

    $timeout.flush();

    expect(reloadSpy).toHaveBeenCalled();
  });
});
