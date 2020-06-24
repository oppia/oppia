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
 * @fileoverview Unit tests for state interaction stats service.
 */

import { TestBed, flushMicrotasks, fakeAsync } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';

import { ContextService } from 'services/context.service';
import { NormalizeWhitespacePipe } from
  'filters/string-utility-filters/normalize-whitespace.pipe';
import { NormalizeWhitespacePunctuationAndCasePipe } from
  // eslint-disable-next-line max-len
  'filters/string-utility-filters/normalize-whitespace-punctuation-and-case.pipe';
import { IStateInteractionStats, StateInteractionStatsService } from
  'services/state-interaction-stats.service';

describe('State Interaction Stats Service', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
      ],
      providers: [
        NormalizeWhitespacePipe,
        NormalizeWhitespacePunctuationAndCasePipe,
      ],
    });

    this.joC = jasmine.objectContaining;
    this.contextService = TestBed.get(ContextService);
    this.httpTestingController = TestBed.get(HttpTestingController);
    this.stateInteractionStatsService = (
      TestBed.get(StateInteractionStatsService));
  });

  afterEach(() => this.httpTestingController.verify());

  beforeEach(() => {
    this.mockState = {
      name: 'Hola',
      interaction: {
        id: 'TextInput',
        answerGroups: [
          {
            rules: [{type: 'Equals', inputs: {x: 'hola!'}}],
            outcome: {dest: 'Me Llamo'}
          },
          {
            rules: [{type: 'Contains', inputs: {x: 'hola'}}],
            outcome: {dest: 'Me Llamo'}
          },
          {
            rules: [{type: 'FuzzyEquals', inputs: {x: 'hola'}}],
            outcome: {dest: 'Hola'}
          }
        ],
        defaultOutcome: {dest: 'Hola'}
      }
    };
  });

  it('should support improvements overview for states with text-input', () => {
    expect(
      this.stateInteractionStatsService.stateSupportsImprovementsOverview(
        this.mockState)
    ).toBeTrue();
  });

  describe('when gathering stats from the backend', () => {
    beforeEach(() => {
      spyOn(this.contextService, 'getExplorationId').and.returnValue('expid');
    });

    it('should provide cached results after first call', fakeAsync(() => {
      this.statsCaptured = [];
      const captureStats = (stats: IStateInteractionStats) => {
        expect(stats).toBeDefined();
        this.statsCaptured.push(stats);
      };

      this.stateInteractionStatsService.computeStats(this.mockState)
        .then(captureStats);
      const req = this.httpTestingController.expectOne(
        '/createhandler/state_interaction_stats/expid/Hola');
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

      this.stateInteractionStatsService.computeStats(this.mockState)
        .then(captureStats);
      this.httpTestingController.expectNone(
        '/createhandler/state_interaction_stats/expid/Hola');
      flushMicrotasks();

      expect(this.statsCaptured.length).toEqual(2);
      const [statsFromFirstFetch, statsFromSecondFetch] = this.statsCaptured;
      expect(statsFromSecondFetch).toBe(statsFromFirstFetch);
    }));

    it('should have separate caches for different states', fakeAsync(() => {
      this.statsCaptured = [];
      const captureStats = (stats: IStateInteractionStats) => {
        expect(stats).toBeDefined();
        this.statsCaptured.push(stats);
      };

      this.stateInteractionStatsService.computeStats(this.mockState)
        .then(captureStats);
      const holaReq = this.httpTestingController.expectOne(
        '/createhandler/state_interaction_stats/expid/Hola');
      expect(holaReq.request.method).toEqual('GET');
      holaReq.flush({
        visualizations_info: [{
          data: [
            {answer: 'Ni Hao', frequency: 5},
            {answer: 'Aloha', frequency: 3},
            {answer: 'Hola', frequency: 1}
          ]
        }]
      });
      flushMicrotasks();

      this.mockState.name = 'Adios';
      this.stateInteractionStatsService.computeStats(this.mockState)
        .then(captureStats);
      const adiosReq = this.httpTestingController.expectOne(
        '/createhandler/state_interaction_stats/expid/Adios');
      expect(adiosReq.request.method).toEqual('GET');
      adiosReq.flush({
        visualizations_info: [{
          data: [
            {answer: 'Zai Jian', frequency: 5},
            {answer: 'Aloha', frequency: 3},
            {answer: 'Adios', frequency: 1}
          ]
        }]
      });
      flushMicrotasks();

      expect(this.statsCaptured.length).toEqual(2);
      const [statsFromFirstFetch, statsFromSecondFetch] = this.statsCaptured;
      expect(statsFromSecondFetch).not.toBe(statsFromFirstFetch);
    }));

    it('should include answer frequencies in the response', fakeAsync(() => {
      this.onSuccess = jasmine.createSpy('success');
      this.onFailure = jasmine.createSpy('failure');

      this.stateInteractionStatsService.computeStats(this.mockState)
        .then(this.onSuccess, this.onFailure);

      const req = this.httpTestingController.expectOne(
        '/createhandler/state_interaction_stats/expid/Hola');
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

      expect(this.onSuccess).toHaveBeenCalledWith(this.joC({
        visualizations_info: [this.joC({
          data: [
            this.joC({answer: 'Ni Hao', frequency: 5}),
            this.joC({answer: 'Aloha', frequency: 3}),
            this.joC({answer: 'Hola', frequency: 1})
          ]
        })]
      }));
      expect(this.onFailure).not.toHaveBeenCalled();
    }));

    it(
      'should determine whether TextInput answers are addressed explicitly',
      fakeAsync(() => {
        this.onSuccess = jasmine.createSpy('success');
        this.onFailure = jasmine.createSpy('failure');

        this.stateInteractionStatsService.computeStats(this.mockState)
          .then(this.onSuccess, this.onFailure);

        const req = this.httpTestingController.expectOne(
          '/createhandler/state_interaction_stats/expid/Hola');
        expect(req.request.method).toEqual('GET');
        req.flush({
          visualizations_info: [{
            data: [{answer: 'Ni Hao'}, {answer: 'Aloha'}, {answer: 'Hola'}],
            addressed_info_is_supported: true
          }]
        });
        flushMicrotasks();

        expect(this.onSuccess).toHaveBeenCalledWith(this.joC({
          visualizations_info: [this.joC({
            data: [
              this.joC({answer: 'Ni Hao', is_addressed: false}),
              this.joC({answer: 'Aloha', is_addressed: false}),
              this.joC({answer: 'Hola', is_addressed: true})
            ]
          })]
        }));
        expect(this.onFailure).not.toHaveBeenCalled();
      }));

    it(
      'should return FractionInput answers as readable strings',
      fakeAsync(() => {
        this.onSuccess = jasmine.createSpy('success');
        this.onFailure = jasmine.createSpy('failure');

        this.stateInteractionStatsService.computeStats({
          name: 'Fraction', interaction: {id: 'FractionInput'}
        }).then(this.onSuccess, this.onFailure);

        const req = this.httpTestingController.expectOne(
          '/createhandler/state_interaction_stats/expid/Fraction');
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

        expect(this.onSuccess).toHaveBeenCalledWith(this.joC({
          visualizations_info: [this.joC({
            data: [
              this.joC({ answer: '1/2' }),
              this.joC({ answer: '0' })
            ]
          })]
        }));
      }));
  });
});
