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
 * @fileoverview unit tests for the Continue button interaction.
 */

import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {OppiaInteractiveContinue} from './oppia-interactive-continue.component';
import {InteractionAttributesExtractorService} from 'interactions/interaction-attributes-extractor.service';
import {ContextService} from 'services/context.service';
import {CurrentInteractionService} from 'pages/exploration-player-page/services/current-interaction.service';
import {ContinueRulesService} from './continue-rules.service';
import {InteractionSpecsKey} from 'pages/interaction-specs.constants';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';

class MockI18nLanguageCodeService {
  isCurrentLanguageRTL() {
    return true;
  }
}

describe('OppiaInteractiveContinue', () => {
  let component: OppiaInteractiveContinue;
  let fixture: ComponentFixture<OppiaInteractiveContinue>;
  let contextService: ContextService;

  class mockInteractionAttributesExtractorService {
    getValuesFromAttributes(
      interactionId: InteractionSpecsKey,
      attributes: Record<string, string>
    ) {
      return {
        buttonText: {
          value: {
            unicode: attributes.buttonTextWithValue,
          },
        },
      };
    }
  }

  // Functions calls such as onSubmit and registerCurrentInteraction cannot be
  // tested if they were called, since they are private variables.

  describe('default Continue button text', () => {
    let mockCurrentInteractionService = {
      onSubmit: (answer: string, rulesService: CurrentInteractionService) => {
        // Since the function calls are unable to be tested the value
        // passed is tested here.
        expect(answer).toBe('Please continue.');
      },
      registerCurrentInteraction: (
        submitAnswerFn: Function,
        validateExpressionFn: Function
      ) => {
        submitAnswerFn();
        expect(validateExpressionFn).toBeNull();
      },
    };

    // This cannot be taken outside and made common since it results in
    // karma coverage reporting that lines are not covered.
    beforeEach(async(() => {
      TestBed.configureTestingModule({
        declarations: [OppiaInteractiveContinue],
        providers: [
          ContinueRulesService,
          {
            provide: InteractionAttributesExtractorService,
            useClass: mockInteractionAttributesExtractorService,
          },
          {
            provide: CurrentInteractionService,
            useValue: mockCurrentInteractionService,
          },
          {
            provide: I18nLanguageCodeService,
            useClass: MockI18nLanguageCodeService,
          },
        ],
      }).compileComponents();
    }));

    beforeEach(() => {
      // The component needs to be created twice since each time a different
      // mockCurrentInteractionService is used.
      contextService = TestBed.get(ContextService);
      fixture = TestBed.createComponent(OppiaInteractiveContinue);
      component = fixture.componentInstance;
      component.buttonTextWithValue = 'Continue';
    });

    it('should get RTL language status correctly', () => {
      expect(component.isLanguageRTL()).toBeTrue();
    });

    it(
      'should initialise component when component is played' +
        ' in the exploration player',
      () => {
        component.ngOnInit();

        expect(component.isInEditorMode).toBe(false);
        expect(component.buttonText).toBe('Continue');
      }
    );
  });

  describe('custom Continue button text', () => {
    let mockCurrentInteractionService = {
      onSubmit: (answer: string, rulesService: CurrentInteractionService) => {
        // Since the function calls are unable to be tested the value
        // passed is tested here.
        expect(answer).toBe('Continue button');
      },
      registerCurrentInteraction: (
        submitAnswerFn: Function,
        validateExpressionFn: Function
      ) => {
        submitAnswerFn();
      },
    };

    // This cannot be taken outside and made common since it results in
    // karma coverage reporting that lines are not covered.
    beforeEach(async(() => {
      TestBed.configureTestingModule({
        declarations: [OppiaInteractiveContinue],
        providers: [
          ContinueRulesService,
          {
            provide: InteractionAttributesExtractorService,
            useClass: mockInteractionAttributesExtractorService,
          },
          {
            provide: CurrentInteractionService,
            useValue: mockCurrentInteractionService,
          },
        ],
      }).compileComponents();
    }));

    beforeEach(() => {
      // The component needs to be created twice since each time a different
      // mockCurrentInteractionService is used.
      contextService = TestBed.get(ContextService);
      fixture = TestBed.createComponent(OppiaInteractiveContinue);
      component = fixture.componentInstance;
      component.buttonTextWithValue = 'Continue button';
    });

    it(
      'should initialise component when component is played' +
        ' in the exploration player',
      () => {
        component.ngOnInit();

        expect(component.isInEditorMode).toBe(false);
        expect(component.buttonText).toBe('Continue button');
      }
    );

    it('should set isInEditorMode to true when in exploration editor', () => {
      spyOn(contextService, 'isInExplorationEditorMode').and.returnValue(true);
      expect(component.isInEditorMode).toBe(false);

      component.ngOnInit();

      expect(component.isInEditorMode).toBe(true);
      expect(component.buttonText).toBe('Continue button');
    });
  });
});
