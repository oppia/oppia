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
import { BrowserCheckerService } from 'domain/utilities/browser-checker.service';

/**
 * @fileoverview Unit tests for the ItemSelectionInput interaction.
 */

describe('oppiaInteractiveItemSelectionInput', function() {
  let ctrl = null;
  let browserCheckerService: BrowserCheckerService = null;
  let currentInteractionService = null;

  let mockCurrentInteractionService = {
    onSubmit: function(answer, rulesService) {},
    registerCurrentInteraction: function(submitAnswerFn, isAnswerValid) {
      submitAnswerFn();
      isAnswerValid();
    }
  };
  let mockItemSelectionInputRulesService = {};
  let mockInteractionAttributesExtractorService = {
    getValuesFromAttributes: function(interactionId, attrs) {
      return attrs;
    }
  };

  importAllAngularServices();
  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value(
      'CurrentInteractionService', mockCurrentInteractionService);
    $provide.value(
      'ItemSelectionInputRulesService',
      mockItemSelectionInputRulesService);
    $provide.value(
      'InteractionAttributesExtractorService',
      mockInteractionAttributesExtractorService);
  }));

  describe('when only one choice is allowed to be selected', () => {
    beforeEach(angular.mock.module('oppia', function($provide) {
      $provide.value('$attrs', {
        choices: [
          {
            html: 'choice 1',
            contentId: 'ca_choices_1'
          },
          {
            html: 'choice 2',
            contentId: 'ca_choices_2'
          },
          {
            html: 'choice 3',
            contentId: 'ca_choices_3'
          },
        ],
        maxAllowableSelectionCount: 1,
        minAllowableSelectionCount: 1
      });
    }));
    beforeEach(angular.mock.inject(function($injector, $componentController) {
      browserCheckerService = $injector.get('BrowserCheckerService');
      currentInteractionService = $injector.get('CurrentInteractionService');
      ctrl = $componentController('oppiaInteractiveItemSelectionInput');
    }));

    it('should initialise component when user adds interaction', () => {
      ctrl.$onInit();

      expect(ctrl.choices).toEqual([
        'choice 1', 'choice 2', 'choice 3'
      ]);
      expect(ctrl.userSelections).toEqual({
        'choice 1': false,
        'choice 2': false,
        'choice 3': false
      });
      expect(ctrl.maxAllowableSelectionCount).toBe(1);
      expect(ctrl.minAllowableSelectionCount).toBe(1);
      expect(ctrl.displayCheckboxes).toBeFalse();
      expect(ctrl.preventAdditionalSelections).toBeFalse();
      expect(ctrl.notEnoughSelections).toBeTrue();
    });

    it('should deselect previously selected option and select the option' +
    ' checked by the user', () => {
      let e = {
        currentTarget: {
          classList: {
            add: () => {},
            remove: () => {}
          }
        } as unknown as Element
      };
      spyOn(browserCheckerService, 'isMobileDevice').and.returnValue(false);
      spyOn(currentInteractionService, 'onSubmit').and.callThrough();
      spyOn(ctrl, 'submitAnswer').and.callThrough();
      spyOn(document, 'querySelector')
        .withArgs('button.multiple-choice-option.selected').and.returnValue(
          e.currentTarget);
      ctrl.$onInit();
      ctrl.userSelections = {
        'choice 2': true
      };

      ctrl.submitMultipleChoiceAnswer(e, 0);

      expect(ctrl.userSelections).toEqual({
        'choice 1': true,
      });
      expect(ctrl.submitAnswer).toHaveBeenCalledTimes(2);
      expect(currentInteractionService.onSubmit).toHaveBeenCalledTimes(2);
    });

    it('should not submit answer when user click an option if user is using a' +
    ' mobile', () => {
      let e = {
        currentTarget: {
          classList: {
            add: () => {},
            remove: () => {}
          }
        } as unknown as Element
      };
      spyOn(browserCheckerService, 'isMobileDevice').and.returnValue(true);
      spyOn(currentInteractionService, 'onSubmit').and.callThrough();
      spyOn(ctrl, 'submitAnswer').and.callThrough();
      spyOn(document, 'querySelector')
        .withArgs('button.multiple-choice-option.selected').and.returnValue(
          e.currentTarget);
      ctrl.$onInit();
      ctrl.userSelections = {
        'choice 2': true
      };

      ctrl.submitMultipleChoiceAnswer(e, 0);

      expect(ctrl.userSelections).toEqual({
        'choice 1': true,
      });
      expect(ctrl.submitAnswer).toHaveBeenCalledTimes(1);
      expect(currentInteractionService.onSubmit).toHaveBeenCalledTimes(1);
    });
  });

  describe('when multiple choices are allowed to be selected', () => {
    beforeEach(angular.mock.module('oppia', function($provide) {
      $provide.value('$attrs', {
        choices: [
          {
            html: 'choice 1',
            contentId: 'ca_choices_1'
          },
          {
            html: 'choice 2',
            contentId: 'ca_choices_2'
          },
          {
            html: 'choice 3',
            contentId: 'ca_choices_3'
          },
        ],
        maxAllowableSelectionCount: 2,
        minAllowableSelectionCount: 1
      });
    }));
    beforeEach(angular.mock.inject(function($injector, $componentController) {
      ctrl = $componentController('oppiaInteractiveItemSelectionInput');
      ctrl.$onInit();
    }));

    it('should initialise component when user adds interaction', () => {
      expect(ctrl.choices).toEqual([
        'choice 1', 'choice 2', 'choice 3'
      ]);
      expect(ctrl.userSelections).toEqual({
        'choice 1': false,
        'choice 2': false,
        'choice 3': false
      });
      expect(ctrl.maxAllowableSelectionCount).toBe(2);
      expect(ctrl.minAllowableSelectionCount).toBe(1);
      expect(ctrl.displayCheckboxes).toBeTrue();
      expect(ctrl.preventAdditionalSelections).toBeFalse();
      expect(ctrl.notEnoughSelections).toBeTrue();
    });

    it('should toggle checkbox when user clicks checkbox', () => {
      ctrl.userSelections = {
        'choice 1': true,
        'choice 2': false,
        'choice 3': false
      };
      expect(ctrl.selectionCount).toBeUndefined();
      expect(ctrl.newQuestion).toBeUndefined();
      expect(ctrl.preventAdditionalSelections).toBeFalse();
      expect(ctrl.notEnoughSelections).toBeTrue();

      ctrl.onToggleCheckbox();

      expect(ctrl.newQuestion).toBe(false);
      expect(ctrl.selectionCount).toBe(1);
      // The preventAdditionalSelections is set to true when the
      // maxAllowableSelectionCount is reached. Therefore we test to
      // ensure preventAdditionalSelections is false because the count has
      // not been reached.
      expect(ctrl.preventAdditionalSelections).toBeFalse();
      expect(ctrl.notEnoughSelections).toBeFalse();
    });

    it('should prevent users from selecting more options when' +
    ' \'maxAllowableSelectionCount\' has been reached', () => {
      ctrl.userSelections = {
        'choice 1': true,
        'choice 2': true,
        'choice 3': false
      };
      expect(ctrl.selectionCount).toBeUndefined();
      expect(ctrl.preventAdditionalSelections).toBeFalse();
      expect(ctrl.notEnoughSelections).toBeTrue();

      ctrl.onToggleCheckbox();

      expect(ctrl.selectionCount).toBe(2);
      expect(ctrl.preventAdditionalSelections).toBeTrue();
      expect(ctrl.notEnoughSelections).toBeFalse();
    });
  });
});
