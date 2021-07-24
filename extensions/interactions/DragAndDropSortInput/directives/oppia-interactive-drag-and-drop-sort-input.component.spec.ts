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
 * @fileoverview Unit tests for the DragAndDropSortInput interaction.
 */

require(
  'interactions/DragAndDropSortInput/directives/' +
  'oppia-interactive-drag-and-drop-sort-input.component.ts');

describe('oppiaInteractiveDragAndDropSortInput', () => {
  let ctrl = null;

  let mockCurrentInteractionService = {
    onSubmit: function(answer, rulesService) {},
    registerCurrentInteraction: function(submitAnswerFn, isAnswerValid) {
      submitAnswerFn();
    }
  };
  let mockDragAndDropSortInputRulesService = {};
  let mockInteractionAttributesExtractorService = {
    getValuesFromAttributes: function(interactionId, attrs) {
      return attrs;
    }
  };

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value(
      'CurrentInteractionService', mockCurrentInteractionService);
    $provide.value(
      'DragAndDropSortInputRulesService',
      mockDragAndDropSortInputRulesService);
    $provide.value(
      'InteractionAttributesExtractorService',
      mockInteractionAttributesExtractorService);
  }));

  describe('when multiple items in the same position are allowed', () => {
    beforeEach(angular.mock.module('oppia', function($provide) {
      $provide.value('$attrs', {
        choices: [
          {
            html: '<p>choice 1</p>',
            contentId: 'ca_choices_1'
          },
          {
            html: '<p>choice 2</p>',
            contentId: 'ca_choices_2'
          },
          {
            html: '<p>choice 3</p>',
            contentId: 'ca_choices_3'
          },
          {
            html: '<p>choice 4</p>',
            contentId: 'ca_choices_4'
          }
        ],
        allowMultipleItemsInSamePosition: true
      });
    }));

    beforeEach(angular.mock.inject(function($injector, $componentController) {
      ctrl = $componentController('oppiaInteractiveDragAndDropSortInput');

      ctrl.savedSolution = [
        [
          'ca_choices_1'
        ],
        [
          'ca_choices_2',
          'ca_choices_3'
        ],
        [
          'ca_choices_4'
        ]
      ];
    }));

    it('should initialise component when user adds interaction', () => {
      ctrl.$onInit();

      expect(ctrl.dataMaxDepth).toBe(2);
      expect(ctrl.allowMultipleItemsInSamePosition).toBe(true);
      expect(ctrl.list).toEqual([{
        title: '<p>choice 1</p>',
        items: []
      },
      {
        title: '<p>choice 2</p>',
        items: [
          {title: '<p>choice 3</p>', items: []}
        ]
      },
      {
        title: '<p>choice 4</p>',
        items: []
      }]);
      expect(ctrl.choices).toEqual([
        '<p>choice 1</p>',
        '<p>choice 2</p>',
        '<p>choice 3</p>',
        '<p>choice 4</p>'
      ]);
    });

    it('should make a default list of dicts when user did not save a solution',
      () => {
        ctrl.savedSolution = undefined;
        ctrl.$onInit();

        expect(ctrl.dataMaxDepth).toBe(2);
        expect(ctrl.allowMultipleItemsInSamePosition).toBe(true);
        expect(ctrl.list).toEqual([{
          title: '<p>choice 1</p>',
          items: []
        },
        {
          title: '<p>choice 2</p>',
          items: []
        },
        {
          title: '<p>choice 3</p>',
          items: []},
        {
          title: '<p>choice 4</p>',
          items: []
        }]);
        expect(ctrl.choices).toEqual([
          '<p>choice 1</p>',
          '<p>choice 2</p>',
          '<p>choice 3</p>',
          '<p>choice 4</p>'
        ]);
      });

    it('should show black dashed box when user drags item', () => {
      let e = {
        dest: {
          nodesScope: {
            $childNodesScope: undefined
          }
        },
        elements: {
          placeholder: [
            {
              style: {
                borderColor: null
              }
            }
          ]
        }
      };
      ctrl.$onInit();

      ctrl.treeOptions.dragMove(e);

      expect(e.elements.placeholder[0].style.borderColor).toBe('#000000');
    });

    it('should show blue dashed box when user selects item', () => {
      let e = {
        dest: {
          nodesScope: {
            $childNodesScope: {}
          }
        },
        elements: {
          placeholder: [
            {
              style: {
                borderColor: null
              }
            }
          ]
        }
      };
      ctrl.$onInit();

      ctrl.treeOptions.dragMove(e);

      expect(e.elements.placeholder[0].style.borderColor).toBe('#add8e6');
    });
  });

  describe('when multiple items in the same position are not allowed', () => {
    beforeEach(angular.mock.module('oppia', function($provide) {
      $provide.value('$attrs', {
        choices: [
          {
            html: '<p>choice 1</p>',
            contentId: 'ca_choices_1'
          },
          {
            html: '<p>choice 2</p>',
            contentId: 'ca_choices_2'
          },
          {
            html: '<p>choice 3</p>',
            contentId: 'ca_choices_3'
          }
        ],
        allowMultipleItemsInSamePosition: false
      });
    }));

    beforeEach(angular.mock.inject(function($injector, $componentController) {
      ctrl = $componentController('oppiaInteractiveDragAndDropSortInput');

      ctrl.savedSolution = [
        [
          'ca_choices_1'
        ],
        [
          'ca_choices_2'
        ],
        [
          'ca_choices_3'
        ]
      ];
    }));

    it('should initialise component when user adds interaction', () => {
      ctrl.$onInit();

      expect(ctrl.dataMaxDepth).toBe(1);
      expect(ctrl.allowMultipleItemsInSamePosition).toBe(false);
      expect(ctrl.list).toEqual([{
        title: '<p>choice 1</p>',
        items: []
      },
      {
        title: '<p>choice 2</p>',
        items: []
      },
      {
        title: '<p>choice 3</p>',
        items: []
      }]);
      expect(ctrl.choices).toEqual([
        '<p>choice 1</p>',
        '<p>choice 2</p>',
        '<p>choice 3</p>'
      ]);
    });
  });
});
