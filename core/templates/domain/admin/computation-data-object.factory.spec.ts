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
 * @fileoverview Unit tests for ComputationDataObjectFactory.ts.
 */

import { ComputationDataObjectFactory } from
  'domain/admin/computation-data-object.factory';

describe('Computation Data Object Factory', () => {
  let cdof: ComputationDataObjectFactory;

  beforeEach(() => {
    cdof = new ComputationDataObjectFactory();
  });

  it('should correctly convert backend dict to Computation Data Object.',
    () => {
      let backendDict = {
        is_stoppable: false,
        is_startable: true,
        active_realtime_layer_index: null,
        computation_type: 'FeedbackAnalyticsAggregator',
        status_code: 'never_started',
        last_started_msec: null,
        last_finished_msec: null,
        last_stopped_msec: null
      };

      let computationDataObject = cdof.createFromBackendDict(backendDict);

      expect(computationDataObject.isStoppable).toEqual(false);
      expect(computationDataObject.isStartable).toEqual(true);
      expect(computationDataObject.activeRealtimeLayerIndex).toEqual(null);
      expect(computationDataObject.computationType).toEqual(
        'FeedbackAnalyticsAggregator');
      expect(computationDataObject.statusCode).toEqual('never_started');
      expect(computationDataObject.lastStartedMsec).toEqual(null);
      expect(computationDataObject.lastFinishedMsec).toEqual(null);
      expect(computationDataObject.lastStoppedMsec).toEqual(null);
    });
});
