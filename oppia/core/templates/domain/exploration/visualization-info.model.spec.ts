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
 * @fileoverview Unit tests for VisualizationInfo.
 */

import {VisualizationInfo} from 'domain/exploration/visualization-info.model';
import {AnswerStats} from 'domain/exploration/answer-stats.model';

describe('Visualization info model', () => {
  it('should correctly convert backend dict in visualization object.', () => {
    let backendDict = {
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
    };

    let answerStatObjects = backendDict.data.map(
      AnswerStats.createFromBackendDict
    );
    let visualizationInfoObject =
      VisualizationInfo.createFromBackendDict(backendDict);

    expect(visualizationInfoObject.addressedInfoIsSupported).toEqual(true);
    expect(visualizationInfoObject.id).toEqual('testId');
    expect(visualizationInfoObject.options).toEqual({});
    expect(visualizationInfoObject.data[0].answer).toEqual(
      answerStatObjects[0].answer
    );
    expect(visualizationInfoObject.data[0].answerHtml).toEqual(
      answerStatObjects[0].answerHtml
    );
    expect(visualizationInfoObject.data[0].frequency).toEqual(
      answerStatObjects[0].frequency
    );
  });
});
