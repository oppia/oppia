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
 * @fileoverview Unit tests for StateInteractionStatsBackendApiService.
 */

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {TestBed, fakeAsync, flushMicrotasks} from '@angular/core/testing';

import {StateInteractionStatsBackendApiService} from 'domain/exploration/state-interaction-stats-backend-api.service';
import {VisualizationInfo} from 'domain/exploration/visualization-info.model';

describe('State interaction stats backend api service', () => {
  let sisbas: StateInteractionStatsBackendApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    sisbas = TestBed.get(StateInteractionStatsBackendApiService);
    httpTestingController = TestBed.get(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should correctly fetch stats', fakeAsync(() => {
    let backendResposne = {
      visualizations_info: [
        {
          addressed_info_is_supported: true,
          data: [
            {
              answer: 'hello',
              frequency: 0,
              is_addressed: false,
            },
          ],
          id: 'testId',
          options: {},
        },
      ],
    };

    let expectedObjects = backendResposne.visualizations_info.map(
      VisualizationInfo.createFromBackendDict
    );

    sisbas.getStatsAsync('expId', 'Intro').then(vizInfo => {
      expect(vizInfo).toEqual(expectedObjects);
    });

    let req = httpTestingController.expectOne(
      '/createhandler/state_interaction_stats/expId/Intro'
    );
    expect(req.request.method).toEqual('GET');
    req.flush(backendResposne);

    flushMicrotasks();
  }));

  it('should use the rejection handler if the backend request failed.', fakeAsync(() => {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    sisbas.getStatsAsync('expId', 'Intro').then(successHandler, failHandler);

    var req = httpTestingController.expectOne(
      '/createhandler/state_interaction_stats/expId/Intro'
    );
    expect(req.request.method).toEqual('GET');
    req.flush(
      {
        error: 'Some error in the backend.',
      },
      {
        status: 500,
        statusText: 'Internal Server Error',
      }
    );

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith('Some error in the backend.');
  }));
});
