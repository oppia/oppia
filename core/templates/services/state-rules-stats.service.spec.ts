// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for state rules stats service.
 */

import { TestBed, flushMicrotasks, fakeAsync } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { NormalizeWhitespacePipe } from
  'filters/string-utility-filters/normalize-whitespace.pipe';
import { NormalizeWhitespacePunctuationAndCasePipe } from
  // eslint-disable-next-line max-len
  'filters/string-utility-filters/normalize-whitespace-punctuation-and-case.pipe';

import { ContextService } from 'services/context.service';
import { StateRulesStatsService } from 'services/state-rules-stats.service.ts';

describe('StateRulesStatsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        NormalizeWhitespacePipe,
        NormalizeWhitespacePunctuationAndCasePipe,
      ],
    });

    this.contextService = TestBed.get(ContextService);
    this.httpTestingController = TestBed.get(HttpTestingController);
    this.stateRulesStatsService = TestBed.get(StateRulesStatsService);
  });

  afterEach(() => this.httpTestingController.verify());

  beforeEach(() => {
    this.mockState = {
      name: 'Hola',
      interaction: {
        answerGroups: [{
          rules: [{type: 'Equals', inputs: {x: 'hola!'}}],
          outcome: {dest: 'Me Llamo'}
        }, {
          rules: [{type: 'Contains', inputs: {x: 'hola'}}],
          outcome: {dest: 'Me Llamo'}
        }, {
          rules: [{type: 'FuzzyEquals', inputs: {x: 'hola'}}],
          outcome: {dest: 'Hola'}
        }],
        defaultOutcome: {dest: 'Hola'},
        id: 'TextInput'
      }
    };
  });

  describe('.stateSupportsImprovementsOverview', () => {
    it('should return true for states with text-input interactions', () => {
      // Only including properties required to identify supported states.
      this.mockState.interaction.id = 'TextInput';

      expect(
        this.stateRulesStatsService.stateSupportsImprovementsOverview(
          this.mockState)
      ).toBeTrue();
    });
  });

  describe('.computeStateRulesStats', () => {
    beforeEach(() => {
      spyOn(this.contextService, 'getExplorationId').and.returnValue('expid');
    });

    it('should respond with answer frequencies', fakeAsync(() => {
      // Only including properties required for stat computation.
      this.mockState.interaction.id = 'TextInput';

      // Only including properties required for stat computation.
      this.onSuccess = jasmine.createSpy('success');
      this.onFailure = jasmine.createSpy('failure');

      this.stateRulesStatsService.computeStateRulesStats(this.mockState)
        .then(this.onSuccess, this.onFailure);

      const req = this.httpTestingController.expectOne(
        '/createhandler/state_rules_stats/expid/Hola');
      expect(req.request.method).toEqual('GET');
      req.flush({
        visualizations_info: [{
          data: [
            {answer: 'Ni Hao', frequency: 5},
            {answer: 'Aloha', frequency: 3},
            {answer: 'Hola', frequency: 1}
          ]
        }]
      });
      flushMicrotasks();

      expect(this.onSuccess).toHaveBeenCalledWith(jasmine.objectContaining({
        visualizations_info: [jasmine.objectContaining({
          data: [
            {answer: 'Ni Hao', frequency: 5},
            {answer: 'Aloha', frequency: 3},
            {answer: 'Hola', frequency: 1}
          ]
        })]
      }));
      expect(this.onFailure).not.toHaveBeenCalled();
    }));

    it('should handle addressed info for TextInput', fakeAsync(() => {
      this.onSuccess = jasmine.createSpy('success');
      this.onFailure = jasmine.createSpy('failure');

      this.stateRulesStatsService.computeStateRulesStats(this.mockState)
        .then(this.onSuccess, this.onFailure);

      const req = this.httpTestingController.expectOne(
        '/createhandler/state_rules_stats/expid/Hola');
      expect(req.request.method).toEqual('GET');
      req.flush({
        visualizations_info: [{
          data: [{answer: 'Ni Hao'}, {answer: 'Aloha'}, {answer: 'Hola'}],
          addressed_info_is_supported: true
        }]
      });
      flushMicrotasks();

      expect(this.onSuccess).toHaveBeenCalledWith(jasmine.objectContaining({
        visualizations_info: [jasmine.objectContaining({
          data: [
            jasmine.objectContaining({answer: 'Ni Hao', is_addressed: false}),
            jasmine.objectContaining({answer: 'Aloha', is_addressed: false}),
            jasmine.objectContaining({answer: 'Hola', is_addressed: true})
          ]
        })]
      }));
      expect(this.onFailure).not.toHaveBeenCalled();
    }));

    it('should convert FractionInput into readable strings', fakeAsync(() => {
      this.onSuccess = jasmine.createSpy('success');
      this.onFailure = jasmine.createSpy('failure');

      this.stateRulesStatsService.computeStateRulesStats({
        name: 'Fraction', interaction: {id: 'FractionInput'}
      }).then(this.onSuccess, this.onFailure);

      const req = this.httpTestingController.expectOne(
        '/createhandler/state_rules_stats/expid/Fraction');
      expect(req.request.method).toEqual('GET');
      req.flush({
        visualizations_info: [
          {
            data: [
              {
                answer: {
                  isNegative: false,
                  wholeNumber: 0,
                  numerator: 1,
                  denominator: 2
                },
                frequency: 3
              },
              {
                answer: {
                  isNegative: false,
                  wholeNumber: 0,
                  numerator: 0,
                  denominator: 1
                },
                frequency: 5
              }
            ]
          }
        ]
      });
      flushMicrotasks();

      expect(this.onSuccess).toHaveBeenCalledWith(jasmine.objectContaining({
        visualizations_info: [jasmine.objectContaining({
          data: [
            jasmine.objectContaining({ answer: '1/2' }),
            jasmine.objectContaining({ answer: '0' })
          ]
        })]
      }));
    }));
  });
});
