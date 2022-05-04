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
 * @fileoverview Unit tests for ParameterMetadataService.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { StateBackendDict, StateObjectFactory } from 'domain/state/StateObjectFactory';
import { ExplorationParamChangesService } from './exploration-param-changes.service';
import { ExplorationStatesService } from './exploration-states.service';
import { GraphDataService } from './graph-data.service';
import { ParameterMetadataService } from './parameter-metadata.service';

class MockGraphDataService {
  getGraphData() {
    return {
      links: [{
        source: 'Hola',
        target: 'Hola'
      }, {
        source: 'State2',
        target: 'State3'
      }, {
        source: 'State',
        target: 'State'
      }, {
        source: 'State3',
        target: 'State'
      }]
    };
  }
}

class MockExplorationParamChangesService {
  savedMemento = [{
    customizationArgs: {
      parse_with_jinja: false,
      value: '5'
    },
    generatorId: 'Copier',
    name: 'ParamChange1'
  }, {
    customizationArgs: {
      parse_with_jinja: true,
      value: '{{ParamChange2}}'
    },
    generatorId: 'Copier',
  }, {
    customizationArgs: {
      parse_with_jinja: true,
      value: '5'
    },
    generatorId: 'RandomSelector',
    name: 'ParamChange3'
  }];
}

describe('Parameter Metadata Service', () => {
  let parameterMetadataService: ParameterMetadataService;
  let stateObjectFactory: StateObjectFactory;

  class MockExplorationStatesService {
    getStates() {
      return stateObjectFactory.createFromBackendDict('', {
        Hola: {
          content: {
            content_id: 'content',
            html: '{{HtmlValue}}'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {},
              default_outcome: {},
            },
          },
          param_changes: [],
          interaction: {
            id: null,
            answer_groups: [{
              rule_specs: [],
              outcome: {
                dest: '',
                feedback: {
                  content_id: 'feedback_1',
                  html: '{{FeedbackValue}}'
                },
              },
            }],
            default_outcome: {
              dest: 'Hola',
              feedback: {
                content_id: '',
                html: '',
              },
            },
            hints: [],
          },
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {},
            },
          },
        },
        State: {
          content: {
            content_id: 'content',
            html: 'content'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {},
              default_outcome: {},
            }
          },
          param_changes: [],
          interaction: {
            id: null,
            answer_groups: [{
              rule_specs: [],
              outcome: {
                dest: '',
                feedback: {
                  content_id: 'feedback_1',
                  html: '{{StateFeedbackValue}}'
                },
              },
            }],
            default_outcome: {
              dest: 'State',
              feedback: {
                content_id: 'default_outcome',
                html: ''
              },
            },
            hints: []
          },
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {},
            }
          }
        },
        State2: {
          content: {
            content_id: 'content',
            html: 'content'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {},
              default_outcome: {},
            }
          },
          param_changes: [],
          interaction: {
            id: null,
            answer_groups: [{
              rule_specs: [],
              outcome: {
                dest: '',
                feedback: {
                  content_id: '',
                  html: ''
                }
              }
            }],
            default_outcome: {
              dest: 'State2',
              feedback: {
                content_id: 'default_outcome',
                html: ''
              },
            },
            hints: []
          },
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {},
            }
          }
        },
        State3: {
          content: {
            content_id: 'content',
            html: 'content'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {},
              default_outcome: {},
            }
          },
          param_changes: [],
          interaction: {
            id: null,
            answer_groups: [{
              rule_specs: [],
              outcome: {
                dest: '',
                feedback: {
                  content_id: '',
                  html: ''
                }
              }
            }],
            default_outcome: {
              dest: 'State2',
              feedback: {
                content_id: '',
                html: ''
              },
            },
            hints: []
          },
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {},
            }
          }
        }
      } as unknown as StateBackendDict);
    }
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: ExplorationParamChangesService,
          useClass: MockExplorationParamChangesService
        },
        {
          provide: GraphDataService,
          useClass: MockGraphDataService
        },
        {
          provide: ExplorationStatesService,
          useClass: MockExplorationStatesService
        }
      ]
    });

    beforeEach(() => {
      parameterMetadataService = TestBed.inject(ParameterMetadataService);
      stateObjectFactory = TestBed.inject(StateObjectFactory);
    });

    it('should get unset parameters info', () => {
      expect(parameterMetadataService.getUnsetParametersInfo(
        ['Hola', 'State2']))
        .toEqual([{
          paramName: 'ParamChange2',
          stateName: null
        }, {
          paramName: 'HtmlValue',
          stateName: 'Hola',
        }, {
          paramName: 'FeedbackValue',
          stateName: 'Hola'
        }, {
          paramName: 'StateFeedbackValue',
          stateName: 'State'
        }]);

      expect(parameterMetadataService.getUnsetParametersInfo(
        ['State', 'State3']))
        .toEqual([{
          paramName: 'ParamChange2',
          stateName: null
        }, {
          paramName: 'StateFeedbackValue',
          stateName: 'State'
        }]);
    });
  });
});
