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
import { InteractionSpecsConstants } from 'pages/interaction-specs.constants';

describe('InteractionSpecsService', () => {
  beforeEach(() => {
    this.interactionSpecsService = TestBed.get(InteractionSpecsService);
  });

  describe('checking whether an interaction can be trained with ML', () => {
    it('should throw an error when interaction does not exist.', () => {
      expect(() => this.interactionSpecsService.isInteractionTrainable('Fake'))
        .toThrowError('Fake is not a valid interaction id');
    });

    it('should return false for ImageClickInput', () => {
      expect(
        this.interactionSpecsService.isInteractionTrainable('ImageClickInput')
      ).toBeFalse();
    });

    it('should return false for NumberWithUnits', () => {
      expect(
        this.interactionSpecsService.isInteractionTrainable('NumberWithUnits')
      ).toBeFalse();
    });

    it('should return false for NumericInput', () => {
      expect(
        this.interactionSpecsService.isInteractionTrainable('NumericInput')
      ).toBeFalse();
    });

    it('should return false for DragAndDropSortInput', () => {
      expect(
        this.interactionSpecsService.isInteractionTrainable(
          'DragAndDropSortInput')
      ).toBeFalse();
    });

    it('should return false for ItemSelectionInput', () => {
      expect(
        this.interactionSpecsService.isInteractionTrainable(
          'ItemSelectionInput')
      ).toBeFalse();
    });

    it('should return false for Continue', () => {
      expect(this.interactionSpecsService.isInteractionTrainable('Continue'))
        .toBeFalse();
    });

    it('should return false for GraphInput', () => {
      expect(this.interactionSpecsService.isInteractionTrainable('GraphInput'))
        .toBeFalse();
    });

    it('should return false for EndExploration', () => {
      expect(
        this.interactionSpecsService.isInteractionTrainable('EndExploration')
      ).toBeFalse();
    });

    it('should return false for SetInput', () => {
      expect(this.interactionSpecsService.isInteractionTrainable('SetInput'))
        .toBeFalse();
    });

    it('should return true for CodeRepl', () => {
      expect(this.interactionSpecsService.isInteractionTrainable('CodeRepl'))
        .toBeTrue();
    });

    it('should return false for LogicProof', () => {
      expect(this.interactionSpecsService.isInteractionTrainable('LogicProof'))
        .toBeFalse();
    });

    it('should return false for MultipleChoiceInput', () => {
      expect(
        this.interactionSpecsService.isInteractionTrainable(
          'MultipleChoiceInput')
      ).toBeFalse();
    });

    it('should return false for PencilCodeEditor', () => {
      expect(
        this.interactionSpecsService.isInteractionTrainable('PencilCodeEditor')
      ).toBeFalse();
    });

    it('should return true for TextInput', () => {
      expect(this.interactionSpecsService.isInteractionTrainable('TextInput'))
        .toBeTrue();
    });

    it('should return false for InteractiveMap', () => {
      expect(
        this.interactionSpecsService.isInteractionTrainable('InteractiveMap')
      ).toBeFalse();
    });

    it('should return false for MusicNotesInput', () => {
      expect(
        this.interactionSpecsService.isInteractionTrainable('MusicNotesInput')
      ).toBeFalse();
    });

    it('should return false for MathExpressionInput', () => {
      expect(
        this.interactionSpecsService.isInteractionTrainable(
          'MathExpressionInput')
      ).toBeFalse();
    });

    it('should return false for FractionInput', () => {
      expect(
        this.interactionSpecsService.isInteractionTrainable('FractionInput')
      ).toBeFalse();
    });
  });
});
