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

import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';

/**
 * @fileoverview Unit tests for Review Material Editor Component.
 */

describe('Review Material Editor Component', () => {
  let ctrl = null;
  let $scope = null;
  let $rootScope = null;

  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();

    ctrl = $componentController('reviewMaterialEditor', {
      $scope: $scope
    }, {
      getBindableDict: () => {
        return {
          displayedConceptCardExplanation: 'Explanation'
        };
      },
      onSaveExplanation: () => {}
    });
  }));

  it('should set component properties on initialization', () => {
    expect(ctrl.HTML_SCHEMA).toEqual(undefined);
    expect(ctrl.editableExplanation).toBe(undefined);
    expect(ctrl.conceptCardExplanationEditorIsShown).toBe(undefined);

    ctrl.$onInit();

    expect(ctrl.HTML_SCHEMA).toEqual({
      type: 'html'
    });
    expect(ctrl.editableExplanation).toBe('Explanation');
    expect(ctrl.conceptCardExplanationEditorIsShown).toBe(false);
  });

  it('should open concept card explanation editor when user' +
    ' clicks to edit concept card', () => {
    ctrl.conceptCardExplanationEditorIsShown = false;

    expect(ctrl.editableExplanation).toBe(undefined);

    ctrl.openConceptCardExplanationEditor();

    expect(ctrl.editableExplanation).toBe('Explanation');
    expect(ctrl.conceptCardExplanationEditorIsShown).toBe(true);
  });

  it('should close concept card explanation editor when user' +
    ' clicks on close', () => {
    ctrl.conceptCardExplanationEditorIsShown = true;

    ctrl.closeConceptCardExplanationEditor();

    expect(ctrl.conceptCardExplanationEditorIsShown).toBe(false);
  });

  it('should save concept card explanation when user clicks on save', () => {
    spyOn(ctrl, 'onSaveExplanation');
    ctrl.editableExplanation = 'Explanation';

    ctrl.saveConceptCardExplanation();

    expect(ctrl.onSaveExplanation)
      .toHaveBeenCalledWith(SubtitledHtml.createDefault(
        ctrl.editableExplanation, 'explanation'));
  });
});
