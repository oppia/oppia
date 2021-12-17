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

import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

/**
 * @fileoverview Unit test for State Hints Editor Component.
 */

describe('StateHintsEditorComponent', () => {
  let ctrl = null;
  let $rootScope = null;
  let $scope = null;
  let $uibModal = null;
  let $q = null;
  let ngbModal: NgbModal = null;

  let WindowDimensionsService = null;
  let EditabilityService = null;
  let StateHintsService = null;
  let ExternalSaveService = null;
  let StateInteractionIdService = null;
  let StateSolutionService = null;
  let AlertsService = null;

  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('NgbModal', {
      open: () => {
        return {
          result: Promise.resolve()
        };
      }
    });
  }));

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    $uibModal = $injector.get('$uibModal');
    $q = $injector.get('$q');
    ngbModal = $injector.get('NgbModal');

    WindowDimensionsService = $injector.get('WindowDimensionsService');
    EditabilityService = $injector.get('EditabilityService');
    StateHintsService = $injector.get('StateHintsService');
    ExternalSaveService = $injector.get('ExternalSaveService');
    StateInteractionIdService = $injector.get('StateInteractionIdService');
    StateSolutionService = $injector.get('StateSolutionService');
    AlertsService = $injector.get('AlertsService');

    ctrl = $componentController('stateHintsEditor', {
      $scope: $scope
    }, {
      onSaveHints: () => {},
      onSaveSolution: () => {}
    });

    spyOn(WindowDimensionsService, 'isWindowNarrow').and.returnValue(true);
    spyOn(EditabilityService, 'isEditable').and.returnValue(true);

    ctrl.$onInit();
  }));

  it('should set component properties on initialization', () => {
    expect($scope.hintCardIsShown).toBe(false);
    expect($scope.canEdit).toBe(true);
    expect($scope.getStaticImageUrl('/demo/img'))
      .toBe('/assets/images/demo/img');
  });

  it('should toggle hint card when user clicks on hint header', () => {
    expect($scope.hintCardIsShown).toBe(false);

    $scope.toggleHintCard();

    expect($scope.hintCardIsShown).toBe(true);
  });

  it('should save displayed hint value when user saves inline hint', () => {
    spyOn(StateHintsService, 'saveDisplayedValue');
    spyOn(ctrl, 'onSaveHints');

    $scope.onSaveInlineHint();

    expect(StateHintsService.saveDisplayedValue).toHaveBeenCalled();
    expect(ctrl.onSaveHints).toHaveBeenCalled();
  });

  it('should trigger external save event on starting sorting', () => {
    let ui = {
      placeholder: {
        height: () => {}
      },
      item: {
        height: () => {}
      }
    };
    spyOn(ExternalSaveService.onExternalSave, 'emit');
    spyOn(StateHintsService, 'setActiveHintIndex');

    $scope.HINT_LIST_SORTABLE_OPTIONS.start('', ui);

    expect(ExternalSaveService.onExternalSave.emit).toHaveBeenCalled();
    expect(StateHintsService.setActiveHintIndex).toHaveBeenCalledWith(null);
  });

  it('should save displayed hint value when sorting stops', () => {
    let ui = {
      placeholder: {
        height: () => {}
      },
      item: {
        height: () => {}
      }
    };
    spyOn(StateHintsService, 'saveDisplayedValue');

    $scope.HINT_LIST_SORTABLE_OPTIONS.stop('', ui);

    expect(StateHintsService.saveDisplayedValue).toHaveBeenCalled();
  });

  it('should check if current interaction is linear', () => {
    StateInteractionIdService.savedMemento = 'TextInput';

    expect($scope.isCurrentInteractionLinear()).toBe(false);

    StateInteractionIdService.savedMemento = 'Continue';

    expect($scope.isCurrentInteractionLinear()).toBe(true);
  });

  it('should get hint button text', () => {
    $scope.StateHintsService.displayed = ['a', 'b', 'c', 'd'];

    expect($scope.getHintButtonText()).toBe('+ ADD HINT');

    $scope.StateHintsService.displayed = ['a', 'b', 'c', 'd', 'e'];

    expect($scope.getHintButtonText()).toBe('Limit Reached');
  });

  it('should get hint summary when hint is given', () => {
    let hint = {
      hintContent: {
        html: '<p> Hint <p>'
      }
    };

    expect($scope.getHintSummary(hint)).toBe('Hint');
  });

  it('should open delete last hint modal if only one hint exists while' +
    ' changing active hint index', () => {
    spyOn(StateHintsService, 'getActiveHintIndex').and.returnValue(0);
    spyOn(ngbModal, 'open').and.returnValue(
      {
        result: $q.resolve()
      } as NgbModalRef
    );
    StateHintsService.displayed = [
      {
        hintContent: {
          html: null
        }
      }
    ];
    StateSolutionService.savedMemento = 'A';

    $scope.changeActiveHintIndex(0);
    $scope.$apply();

    expect(StateSolutionService.displayed).toBe(null);
    expect(StateHintsService.displayed).toEqual([]);
  });

  it('should close delete last hint modal when user clicks cancel', () => {
    spyOn(StateHintsService, 'getActiveHintIndex').and.returnValue(0);
    spyOn(ngbModal, 'open').and.returnValue(
      {
        result: $q.reject()
      } as NgbModalRef
    );
    StateHintsService.displayed = [
      {
        hintContent: {
          html: null
        }
      }
    ];
    StateSolutionService.savedMemento = 'A';

    $scope.changeActiveHintIndex(0);
    $scope.$apply();

    expect(ngbModal.open).toHaveBeenCalled();
  });

  it('should delete empty hint when changing active hint index', () => {
    spyOn(StateHintsService, 'getActiveHintIndex').and.returnValue(0);
    spyOn(AlertsService, 'addInfoMessage');
    StateHintsService.displayed = [
      {
        hintContent: {
          html: null
        }
      },
      {
        hintContent: {
          html: '<p> Hint </p>'
        }
      }
    ];
    StateSolutionService.savedMemento = 'A';

    $scope.changeActiveHintIndex(0);

    expect(AlertsService.addInfoMessage)
      .toHaveBeenCalledWith('Deleting empty hint.');
    expect(StateHintsService.displayed).toEqual([
      {
        hintContent: {
          html: '<p> Hint </p>'
        }
      }
    ]);
  });

  it('should set new hint index if no hint is opened', () => {
    spyOn(StateHintsService, 'getActiveHintIndex').and.returnValue(null);
    spyOn(StateHintsService, 'setActiveHintIndex');

    $scope.changeActiveHintIndex(0);

    expect(StateHintsService.setActiveHintIndex).toHaveBeenCalledWith(0);
  });

  it('should not open add hints modal if number of hint is greater than' +
    ' or equal to 5', () => {
    $scope.StateHintsService.displayed = ['a', 'b', 'c', 'd', 'e'];
    spyOn($uibModal, 'open');

    expect($scope.openAddHintModal()).toBe(undefined);
    expect($uibModal.open).not.toHaveBeenCalled();
  });

  it('should open add hints modal when user clicks on add hint button', () => {
    $scope.StateHintsService.displayed = [
      {
        hintContent: {
          html: '<p> Hint </p>'
        }
      }
    ];
    spyOn($uibModal, 'open').and.returnValue({
      result: $q.resolve({
        hint: {
          hintContent: {
            html: '<p> New hint </p>'
          }
        }
      })
    });

    $scope.openAddHintModal();
    $scope.$apply();

    expect(StateHintsService.displayed).toEqual([
      {
        hintContent: {
          html: '<p> Hint </p>'
        }
      },
      {
        hintContent: {
          html: '<p> New hint </p>'
        }
      }
    ]);
  });

  it('should close add hint modal when user clicks cancel', () => {
    $scope.StateHintsService.displayed = [
      {
        hintContent: {
          html: '<p> Hint </p>'
        }
      }
    ];
    spyOn($uibModal, 'open').and.returnValue({
      result: $q.reject()
    });

    $scope.openAddHintModal();
    $scope.$apply();

    expect($uibModal.open).toHaveBeenCalled();
  });

  it('should open delete hint modal when user clicks on' +
    ' delete hint button', () => {
    spyOn(StateHintsService, 'getActiveHintIndex').and.returnValue(0);
    StateSolutionService.savedMemento = 'A';
    StateHintsService.displayed = [
      {
        hintContent: {
          html: '<p> Hint </p>'
        }
      }
    ];
    StateHintsService.savedMemento = StateHintsService.displayed;
    spyOn(ngbModal, 'open').and.returnValue(
      {
        result: $q.resolve()
      } as NgbModalRef
    );

    $scope.deleteHint(0, new Event(''));
    $scope.$apply();

    expect(ngbModal.open).toHaveBeenCalled();
    expect(StateHintsService.displayed).toEqual([]);
  });

  it('should delete hint when user clicks on' +
    ' delete hint button', () => {
    spyOn(StateHintsService, 'getActiveHintIndex').and.returnValue(0);
    StateSolutionService.savedMemento = 'A';
    StateHintsService.displayed = [
      {
        hintContent: {
          html: '<p> Hint Index 0 </p>'
        }
      },
      {
        hintContent: {
          html: '<p> Hint Index 1 </p>'
        }
      }
    ];
    StateHintsService.savedMemento = StateHintsService.displayed;
    spyOn(ngbModal, 'open').and.returnValue(
      {
        result: $q.resolve()
      } as NgbModalRef
    );

    $scope.deleteHint(0, new Event(''));
    $scope.$apply();

    expect(StateHintsService.displayed).toEqual([
      {
        hintContent: {
          html: '<p> Hint Index 1 </p>'
        }
      }
    ]);
  });

  it('should close delete hint modal when user clicks on cancel', () => {
    spyOn(ngbModal, 'open').and.returnValue(
      {
        result: $q.reject()
      } as NgbModalRef
    );
    $scope.deleteHint(0, new Event(''));
    $scope.$apply();

    expect(ngbModal.open).toHaveBeenCalled();
  });
});
