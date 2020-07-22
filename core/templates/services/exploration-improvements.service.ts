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
 * @fileoverview Service responsible for coordinating the retrieval and storage
 * of data related to exploration improvement tasks.
 */

import { ExplorationImprovementsConfig } from
  'domain/improvements/exploration-improvements-config-object.factory';

require('services/exploration-improvements-backend-api.service.ts');

angular.module('oppia').factory('ExplorationImprovementsService', [
  'ExplorationImprovementsBackendApiService',
  function(ExplorationImprovementsBackendApiService) {
    /** @private */
    let initializationHasStarted: boolean = false;
    /** @private */
    let resolveInitPromise: () => void;
    /** @private */
    let rejectInitPromise: (_) => void;
    /** @private */
    const initPromise: Promise<void> = new Promise((resolve, reject) => {
      resolveInitPromise = resolve;
      rejectInitPromise = reject;
    });
    /** @private */
    let config: ExplorationImprovementsConfig;

    return {
      async initAsync(explorationId: string): Promise<void> {
        if (!initializationHasStarted) {
          initializationHasStarted = true;
          try {
            config = (
              await ExplorationImprovementsBackendApiService.getConfigAsync(
                explorationId));
            resolveInitPromise();
          } catch (error) {
            rejectInitPromise(error);
          }
        }
        return initPromise;
      },

      async isImprovementsTabEnabledAsync(): Promise<boolean> {
        await initPromise;
        return config.isImprovementsTabEnabled;
      },
    };
  },
]);
