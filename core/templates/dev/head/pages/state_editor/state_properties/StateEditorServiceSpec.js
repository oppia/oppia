// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit test for the Editor state service.
 */

describe('Editor state service', function() {
  beforeEach(module('oppia'));

  describe('editor state service', function() {
    var ecs = null;

    beforeEach(inject(function($injector) {
      ecs = $injector.get('StateEditorService');
    }));

    it('should correctly set and get state names', function() {
      ecs.setActiveStateName('A State');
      expect(ecs.getActiveStateName()).toBe('A State');
    });

    it('should not allow invalid state names to be set', function() {
      ecs.setActiveStateName('');
      expect(ecs.getActiveStateName()).toBeNull();

      ecs.setActiveStateName(null);
      expect(ecs.getActiveStateName()).toBeNull();
    });

    it('should correctly return answer choices for interaction', function() {
      var customizationArgs = {
        choices: {
          value: [
            'Choice 1',
            'Choice 2'
          ]
        }
      };
      expect(
        ecs.getAnswerChoices('MultipleChoiceInput', customizationArgs)
      ).toEqual([{
        val: 0,
        label: 'Choice 1',
      }, {
        val: 1,
        label: 'Choice 2',
      }]);

      customizationArgs = {
        imageAndRegions: {
          value: {
            labeledRegions: [{
              label: 'Label 1'
            }, {
              label: 'Label 2'
            }]
          }
        }
      };
      expect(
        ecs.getAnswerChoices('ImageClickInput', customizationArgs)
      ).toEqual([{
        val: 'Label 1',
        label: 'Label 1',
      }, {
        val: 'Label 2',
        label: 'Label 2',
      }]);

      customizationArgs = {
        choices: {
          value: [
            'Choice 1',
            'Choice 2'
          ]
        }
      };
      expect(
        ecs.getAnswerChoices('ItemSelectionInput', customizationArgs)
      ).toEqual([{
        val: 'Choice 1',
        label: 'Choice 1',
      }, {
        val: 'Choice 2',
        label: 'Choice 2',
      }]);
      expect(
        ecs.getAnswerChoices('DragAndDropSortInput', customizationArgs)
      ).toEqual([{
        val: 'Choice 1',
        label: 'Choice 1',
      }, {
        val: 'Choice 2',
        label: 'Choice 2',
      }]);
    });
  });
});
