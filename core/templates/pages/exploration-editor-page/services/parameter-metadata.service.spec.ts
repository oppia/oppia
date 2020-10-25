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

import { importAllAngularServices } from 'tests/unit-test-utils';

require('pages/exploration-editor-page/services/parameter-metadata.service');
require('expressions/expression-interpolation.service.ts');
require(
  'pages/exploration-editor-page/services/' +
  'exploration-param-changes.service.ts');
require('pages/exploration-editor-page/services/exploration-states.service.ts');
require('pages/exploration-editor-page/services/graph-data.service.ts');

require(
  'pages/exploration-editor-page/exploration-editor-page.constants.ajs.ts');

describe('Parameter Metadata Service', function() {
  var ParameterMetadataService = null;
  var StatesObjectFactory = null;

  beforeEach(angular.mock.module('oppia'));

  importAllAngularServices();

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('ExplorationParamChangesService', {
      savedMemento: [{
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
      }]
    });
    $provide.value('ExplorationStatesService', {
      getStates: function() {
        return StatesObjectFactory.createFromBackendDict({
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
        });
      }
    });
    $provide.value('GraphDataService', {
      getGraphData: function() {
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
    });
  }));
  beforeEach(angular.mock.inject(function($injector) {
    ParameterMetadataService = $injector.get(
      'ParameterMetadataService');
    StatesObjectFactory = $injector.get('StatesObjectFactory');
  }));

  it('should get unset parameters info', function() {
    expect(ParameterMetadataService.getUnsetParametersInfo(
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

    expect(ParameterMetadataService.getUnsetParametersInfo(
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
