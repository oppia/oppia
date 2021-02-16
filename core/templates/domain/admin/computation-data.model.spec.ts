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
 * @fileoverview Unit tests for ComputationData.
 */

import { ComputationData } from 'domain/admin/computation-data.model';

describe('Computation Data Model', () => {
  it('should correctly convert backend dict to Computation Data Object.',
    () => {
      let backendDict = {
        is_stoppable: false,
        is_startable: true,
        active_realtime_layer_index: '',
        computation_type: 'FeedbackAnalyticsAggregator',
        status_code: 'never_started',
        last_started_msec: 0,
        last_finished_msec: 0,
        last_stopped_msec: 0
      };

      let computationData = ComputationData.createFromBackendDict(
        backendDict);

      expect(computationData.isStoppable).toEqual(false);
      expect(computationData.isStartable).toEqual(true);
      expect(computationData.activeRealtimeLayerIndex).toEqual('');
      expect(computationData.computationType).toEqual(
        'FeedbackAnalyticsAggregator');
      expect(computationData.statusCode).toEqual('never_started');
      expect(computationData.lastStartedMsec).toEqual(0);
      expect(computationData.lastFinishedMsec).toEqual(0);
      expect(computationData.lastStoppedMsec).toEqual(0);
    });
});
