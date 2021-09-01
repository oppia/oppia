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
 * @fileoverview Unit tests for the interaction specs service.
 */

import { TestBed } from '@angular/core/testing';

import { InteractionSpecsService } from 'services/interaction-specs.service';

describe('InteractionSpecsService', () => {
  let interactionSpecsService: InteractionSpecsService;

  beforeEach(() => {
    interactionSpecsService = TestBed.get(InteractionSpecsService);
  });

  describe('checking whether an interaction can be trained with ML', () => {
    it('should throw an error when interaction does not exist.', () => {
      expect(() => interactionSpecsService.isInteractionTrainable('Fake'))
        .toThrowError('Fake is not a valid interaction id');
    });

    it('should return false for ImageClickInput', () => {
      expect(
        interactionSpecsService.isInteractionTrainable('ImageClickInput')
      ).toBeFalse();
    });

    it('should return false for NumberWithUnits', () => {
      expect(
        interactionSpecsService.isInteractionTrainable('NumberWithUnits')
      ).toBeFalse();
    });

    it('should return false for NumericInput', () => {
      expect(
        interactionSpecsService.isInteractionTrainable('NumericInput')
      ).toBeFalse();
    });

    it('should return false for DragAndDropSortInput', () => {
      expect(
        interactionSpecsService.isInteractionTrainable(
          'DragAndDropSortInput')
      ).toBeFalse();
    });

    it('should return false for ItemSelectionInput', () => {
      expect(
        interactionSpecsService.isInteractionTrainable(
          'ItemSelectionInput')
      ).toBeFalse();
    });

    it('should return false for Continue', () => {
      expect(interactionSpecsService.isInteractionTrainable('Continue'))
        .toBeFalse();
    });

    it('should return false for GraphInput', () => {
      expect(interactionSpecsService.isInteractionTrainable('GraphInput'))
        .toBeFalse();
    });

    it('should return false for EndExploration', () => {
      expect(
        interactionSpecsService.isInteractionTrainable('EndExploration')
      ).toBeFalse();
    });

    it('should return false for SetInput', () => {
      expect(interactionSpecsService.isInteractionTrainable('SetInput'))
        .toBeFalse();
    });

    it('should return true for CodeRepl', () => {
      expect(interactionSpecsService.isInteractionTrainable('CodeRepl'))
        .toBeTrue();
    });

    it('should return false for MultipleChoiceInput', () => {
      expect(
        interactionSpecsService.isInteractionTrainable(
          'MultipleChoiceInput')
      ).toBeFalse();
    });

    it('should return false for PencilCodeEditor', () => {
      expect(
        interactionSpecsService.isInteractionTrainable('PencilCodeEditor')
      ).toBeFalse();
    });

    it('should return true for TextInput', () => {
      expect(interactionSpecsService.isInteractionTrainable('TextInput'))
        .toBeTrue();
    });

    it('should return false for InteractiveMap', () => {
      expect(
        interactionSpecsService.isInteractionTrainable('InteractiveMap')
      ).toBeFalse();
    });

    it('should return false for MusicNotesInput', () => {
      expect(
        interactionSpecsService.isInteractionTrainable('MusicNotesInput')
      ).toBeFalse();
    });

    it('should return false for FractionInput', () => {
      expect(
        interactionSpecsService.isInteractionTrainable('FractionInput')
      ).toBeFalse();
    });
  });
});
