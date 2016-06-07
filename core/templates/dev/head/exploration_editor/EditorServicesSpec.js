// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the services and controllers of the exploration
 *   editor page.
 */

describe('Editor context service', function() {
  beforeEach(module('oppia'));

  describe('editor context service', function() {
    var ecs = null;

    beforeEach(inject(function($injector) {
      ecs = $injector.get('editorContextService');
    }));

    it('should correctly set and get state names', function() {
      ecs.setActiveStateName('A State');
      expect(ecs.getActiveStateName()).toBe('A State');
    });

    it('should not allow invalid state names to be set', function() {
      ecs.setActiveStateName('');
      expect(ecs.getActiveStateName()).toBeNull();

      ecs.setActiveStateName(null);
      expect(ecs.getActiveStateName()).toBeNull();
    });
  });
});

describe('Change list service', function() {
  beforeEach(module('oppia'));

  describe('change list service', function() {
    var cls = null;
    var $httpBackend = null;
    var mockWarningsData;
    var mockExplorationData;

    var autosaveDraftUrl = 'createhandler/autosave_draft/0';
    var validAutosaveResponse = {
      is_version_of_draft_valid: true
    };

    beforeEach(function() {
      mockWarningsData = {
        addWarning: function() {}
      };
      module(function($provide) {
        $provide.value('alertsService', mockWarningsData);
      });
      spyOn(mockWarningsData, 'addWarning');
      mockExplorationData = {
        explorationId: 0,
        autosaveChangeList: function() {},
        discardDraft: function() {}
      };
      module(function($provide) {
        $provide.value('explorationData', mockExplorationData);
      });
      spyOn(mockExplorationData, 'autosaveChangeList');
    });

    beforeEach(inject(function($injector) {
      cls = $injector.get('changeListService');
      $httpBackend = $injector.get('$httpBackend');
    }));

    it('should correctly get and save changes', function() {
      expect(cls.getChangeList()).toEqual([]);
      cls.addState('newState');
      expect(cls.getChangeList()).not.toBe([]);
      expect(mockWarningsData.addWarning).not.toHaveBeenCalled();
      expect(mockExplorationData.autosaveChangeList).toHaveBeenCalled();
      $httpBackend.expectPUT(autosaveDraftUrl).respond(validAutosaveResponse);
    });

    it('should correctly add a new state', function() {
      expect(cls.getChangeList()).toEqual([]);
      cls.addState('newState');
      expect(cls.getChangeList()).toEqual([{
        cmd: 'add_state',
        state_name: 'newState'
      }]);
      expect(mockWarningsData.addWarning).not.toHaveBeenCalled();
      expect(mockExplorationData.autosaveChangeList).toHaveBeenCalled();
      $httpBackend.expectPUT(autosaveDraftUrl).respond(validAutosaveResponse);
    });

    it('should correctly rename a state', function() {
      expect(cls.getChangeList()).toEqual([]);
      cls.renameState('newName', 'oldName');
      expect(cls.getChangeList()).toEqual([{
        cmd: 'rename_state',
        old_state_name: 'oldName',
        new_state_name: 'newName'
      }]);
      expect(mockWarningsData.addWarning).not.toHaveBeenCalled();
      expect(mockExplorationData.autosaveChangeList).toHaveBeenCalled();
      $httpBackend.expectPUT(autosaveDraftUrl).respond(validAutosaveResponse);
    });

    it('should correctly delete a state', function() {
      expect(cls.getChangeList()).toEqual([]);
      cls.deleteState('deletedState');
      expect(cls.getChangeList()).toEqual([{
        cmd: 'delete_state',
        state_name: 'deletedState'
      }]);
      expect(mockWarningsData.addWarning).not.toHaveBeenCalled();
      expect(mockExplorationData.autosaveChangeList).toHaveBeenCalled();
      $httpBackend.expectPUT(autosaveDraftUrl).respond(validAutosaveResponse);
    });

    it('should correctly edit an exploration property', function() {
      expect(cls.getChangeList()).toEqual([]);
      cls.editExplorationProperty('title', 'newTitle', 'oldTitle');
      expect(cls.getChangeList()).toEqual([{
        cmd: 'edit_exploration_property',
        property_name: 'title',
        new_value: 'newTitle',
        old_value: 'oldTitle'
      }]);
      expect(mockWarningsData.addWarning).not.toHaveBeenCalled();
      expect(mockExplorationData.autosaveChangeList).toHaveBeenCalled();
      $httpBackend.expectPUT(autosaveDraftUrl).respond(validAutosaveResponse);
    });

    it('should detect invalid exploration properties', function() {
      expect(cls.getChangeList()).toEqual([]);
      cls.editExplorationProperty('fake_property', 'newThing', 'oldThing');
      expect(mockWarningsData.addWarning).toHaveBeenCalledWith(
        'Invalid exploration property: fake_property');
      expect(mockExplorationData.autosaveChangeList).not.toHaveBeenCalled();
    });

    it('should correctly edit a state property', function() {
      expect(cls.getChangeList()).toEqual([]);
      cls.editStateProperty('stateName', 'content', 'newC', 'oldC');
      expect(cls.getChangeList()).toEqual([{
        cmd: 'edit_state_property',
        state_name: 'stateName',
        property_name: 'content',
        new_value: 'newC',
        old_value: 'oldC'
      }]);
      expect(mockWarningsData.addWarning).not.toHaveBeenCalled();
      expect(mockExplorationData.autosaveChangeList).toHaveBeenCalled();
      $httpBackend.expectPUT(autosaveDraftUrl).respond(validAutosaveResponse);
    });

    it('should detect invalid exploration properties', function() {
      expect(cls.getChangeList()).toEqual([]);
      cls.editStateProperty(
        'stateName', 'fake_property', 'newThing', 'oldThing');
      expect(mockWarningsData.addWarning).toHaveBeenCalledWith(
        'Invalid state property: fake_property');
      expect(mockExplorationData.autosaveChangeList).not.toHaveBeenCalled();
    });

    it('should correctly discard all changes', function() {
      expect(cls.getChangeList()).toEqual([]);
      cls.addState('newState');
      expect(cls.getChangeList()).not.toBe([]);
      cls.discardAllChanges();
      expect(cls.getChangeList()).toEqual([]);
      expect(mockExplorationData.autosaveChangeList).toHaveBeenCalled();
      $httpBackend.expectPUT(autosaveDraftUrl).respond(validAutosaveResponse);
    });

    it('should correctly handle multiple changes in succession', function() {
      expect(cls.getChangeList()).toEqual([]);

      cls.addState('newState1');
      cls.addState('newState2');
      expect(cls.getChangeList()).toEqual([{
        cmd: 'add_state',
        state_name: 'newState1'
      }, {
        cmd: 'add_state',
        state_name: 'newState2'
      }]);
      expect(mockExplorationData.autosaveChangeList).toHaveBeenCalled();
      $httpBackend.expectPUT(autosaveDraftUrl).respond(validAutosaveResponse);
    });

    it('should correctly undo changes', function() {
      expect(cls.getChangeList()).toEqual([]);

      cls.addState('newState1');
      cls.addState('newState2');
      expect(cls.getChangeList()).toEqual([{
        cmd: 'add_state',
        state_name: 'newState1'
      }, {
        cmd: 'add_state',
        state_name: 'newState2'
      }]);

      cls.undoLastChange();
      expect(cls.getChangeList()).toEqual([{
        cmd: 'add_state',
        state_name: 'newState1'
      }]);

      cls.undoLastChange();
      expect(cls.getChangeList()).toEqual([]);
      expect(mockExplorationData.autosaveChangeList).toHaveBeenCalled();
      $httpBackend.expectPUT(autosaveDraftUrl).respond(validAutosaveResponse);
    });

    it('should correctly add a gadget', function() {
      expect(cls.getChangeList()).toEqual([]);
      cls.addState('newState1');
      var gadgetDict = {
        gadget_type: 'TestGadget',
        gadget_name: 'TestGadget 1',
        customization_args: {
          adviceObjects: {
            value: [{
              adviceHtml: '<p>Tips</p>',
              adviceTitle: 'R-Tip'
            }]
          },
          title: {
            value: 'Tips'
          }
        },
        visible_in_states: ['newState1']
      };
      cls.addGadget(gadgetDict);
      expect(cls.getChangeList()).toEqual([{
        cmd: 'add_state',
        state_name: 'newState1'
      }, {
        cmd: 'add_gadget',
        gadget_dict: {
          gadget_type: 'TestGadget',
          gadget_name: 'TestGadget 1',
          customization_args: {
            adviceObjects: {
              value: [{
                adviceHtml: '<p>Tips</p>',
                adviceTitle: 'R-Tip'
              }]
            },
            title: {
              value: 'Tips'
            }
          },
          visible_in_states: ['newState1']
        }
      }]);
      expect(mockExplorationData.autosaveChangeList).toHaveBeenCalled();
      $httpBackend.expectPUT(autosaveDraftUrl).respond(validAutosaveResponse);
    });

    it('should correctly rename a gadget', function() {
      expect(cls.getChangeList()).toEqual([]);
      cls.renameGadget('oldName', 'newName');
      expect(cls.getChangeList()).toEqual([{
        cmd: 'rename_gadget',
        old_gadget_name: 'oldName',
        new_gadget_name: 'newName'
      }]);
      expect(mockWarningsData.addWarning).not.toHaveBeenCalled();
      expect(mockExplorationData.autosaveChangeList).toHaveBeenCalled();
      $httpBackend.expectPUT(autosaveDraftUrl).respond(validAutosaveResponse);
    });

    it('should correctly delete a gadget', function() {
      expect(cls.getChangeList()).toEqual([]);
      cls.deleteGadget('gadgetName');
      expect(cls.getChangeList()).toEqual([{
        cmd: 'delete_gadget',
        gadget_name: 'gadgetName'
      }]);
      expect(mockWarningsData.addWarning).not.toHaveBeenCalled();
      expect(mockExplorationData.autosaveChangeList).toHaveBeenCalled();
      $httpBackend.expectPUT(autosaveDraftUrl).respond(validAutosaveResponse);
    });

    it('should correctly edit gadget customization args', function() {
      expect(cls.getChangeList()).toEqual([]);
      var oldCustomizationArgs = {
        customization_args: {
          adviceObjects: {
            value: [{
              adviceHtml: '<p>Html Data</p>',
              adviceTitle: 'advice tip name'
            }]
          },
          title: {
            value: 'main Title'
          }
        }
      };
      var newCustomizationArgs = {
        customization_args: {
          adviceObjects: {
            value: [{
              adviceHtml: '<p>New Html Data</p>',
              adviceTitle: 'New advice tip name'
            }]
          },
          title: {
            value: 'New main Title'
          }
        }
      };
      cls.editGadgetProperty(
        'gadgetName',
        'gadget_customization_args',
        newCustomizationArgs,
        oldCustomizationArgs
      );
      expect(cls.getChangeList()).toEqual([{
        cmd: 'edit_gadget_property',
        gadget_name: 'gadgetName',
        property_name: 'gadget_customization_args',
        new_value: {
          customization_args: {
            adviceObjects: {
              value: [{
                adviceHtml: '<p>New Html Data</p>',
                adviceTitle: 'New advice tip name'
              }]
            },
            title: {
              value: 'New main Title'
            }
          }
        },
        old_value: {
          customization_args: {
            adviceObjects: {
              value: [{
                adviceHtml: '<p>Html Data</p>',
                adviceTitle: 'advice tip name'
              }]
            },
            title: {
              value: 'main Title'
            }
          }
        }
      }]);
      expect(mockExplorationData.autosaveChangeList).toHaveBeenCalled();
      $httpBackend.expectPUT(autosaveDraftUrl).respond(validAutosaveResponse);
    });

    it('should correctly edit a gadget visibility property', function() {
      expect(cls.getChangeList()).toEqual([]);
      var oldVisibilityProp = ['old_state_name'];
      var newVisibilityProp = ['new state name'];
      cls.editGadgetProperty(
        'gadgetName',
        'gadget_visibility',
        newVisibilityProp,
        oldVisibilityProp
      );
      expect(cls.getChangeList()).toEqual([{
        cmd: 'edit_gadget_property',
        gadget_name: 'gadgetName',
        property_name: 'gadget_visibility',
        new_value: ['new state name'],
        old_value: ['old_state_name']
      }]);
      expect(mockExplorationData.autosaveChangeList).toHaveBeenCalled();
      $httpBackend.expectPUT(autosaveDraftUrl).respond(validAutosaveResponse);
    });
  });
});

describe('Exploration title service', function() {
  beforeEach(module('oppia'));

  describe('exploration title service', function() {
    var ets = null;
    var $httpBackend = null;
    var mockExplorationData;

    var autosaveDraftUrl = 'createhandler/autosave_draft/0';
    var validAutosaveResponse = {
      is_version_of_draft_valid: true
    };

    beforeEach(function() {
      mockExplorationData = {
        explorationId: 0,
        autosaveChangeList: function() {}
      };
      module(function($provide) {
        $provide.value('explorationData', mockExplorationData);
      });
      spyOn(mockExplorationData, 'autosaveChangeList');
    });

    beforeEach(inject(function($injector) {
      ets = $injector.get('explorationTitleService');
      $httpBackend = $injector.get('$httpBackend');
    }));

    it('correctly initializes the service', function() {
      expect(ets.displayed).toBeUndefined();
      expect(ets.savedMemento).toBeUndefined();
      ets.init('A title');
      expect(ets.displayed).toEqual('A title');
      expect(ets.savedMemento).toEqual('A title');
    });

    it('updates only the title and not the memento', function() {
      ets.init('A title');
      ets.displayed = 'New title';
      expect(ets.displayed).toEqual('New title');
      expect(ets.savedMemento).toEqual('A title');
      expect(mockExplorationData.autosaveChangeList).not.toHaveBeenCalled();
    });

    it('restores correctly from the memento', function() {
      ets.init('A title');
      ets.displayed = 'New title';
      ets.restoreFromMemento();
      expect(ets.displayed).toEqual('A title');
      expect(ets.savedMemento).toEqual('A title');
    });

    it('updates the memento with the displayed title', function() {
      ets.init('A title');
      ets.displayed = 'New title';
      expect(ets.savedMemento).toEqual('A title');
      ets.saveDisplayedValue();
      expect(ets.savedMemento).toEqual('New title');
      expect(mockExplorationData.autosaveChangeList).toHaveBeenCalled();
      $httpBackend.expectPUT(autosaveDraftUrl).respond(validAutosaveResponse);
    });

    it('reports whether the title has changed since it was saved', function() {
      ets.init('A title');
      expect(ets.hasChanged()).toBe(false);
      ets.displayed = 'A title';
      expect(ets.hasChanged()).toBe(false);
      ets.displayed = 'New title';
      expect(ets.hasChanged()).toBe(true);
      ets.displayed = 'A title';
      expect(ets.hasChanged()).toBe(false);

      ets.saveDisplayedValue();
      expect(mockExplorationData.autosaveChangeList).not.toHaveBeenCalled();
      expect(ets.hasChanged()).toBe(false);
    });
  });
});

describe('Exploration rights service', function() {
  beforeEach(module('oppia'));

  describe('exploration rights service', function() {
    var ers = null;

    beforeEach(inject(function($injector) {
      ers = $injector.get('explorationRightsService');

      GLOBALS.ACTIVITY_STATUS_PRIVATE = 'private';
      GLOBALS.ACTIVITY_STATUS_PUBLIC = 'public';
      GLOBALS.ACTIVITY_STATUS_PUBLICIZED = 'publicized';
    }));

    it('correctly initializes the service', function() {
      expect(ers.ownerNames).toBeUndefined();
      expect(ers.editorNames).toBeUndefined();
      expect(ers.viewerNames).toBeUndefined();
      expect(ers._status).toBeUndefined();
      expect(ers._clonedFrom).toBeUndefined();
      expect(ers._isCommunityOwned).toBeUndefined();
      expect(ers._viewableIfPrivate).toBeUndefined();

      ers.init(['abc'], [], [], 'private', 'e1234', true, true);

      expect(ers.ownerNames).toEqual(['abc']);
      expect(ers.editorNames).toEqual([]);
      expect(ers.viewerNames).toEqual([]);
      expect(ers._status).toEqual('private');
      expect(ers._clonedFrom).toEqual('e1234');
      expect(ers._isCommunityOwned).toBe(true);
      expect(ers._viewableIfPrivate).toBe(true);
    });

    it('reports the correct derived statuses', function() {
      ers.init(['abc'], [], [], 'private', 'e1234', true);
      expect(ers.isPrivate()).toBe(true);
      expect(ers.isPublic()).toBe(false);
      expect(ers.isPublicized()).toBe(false);

      ers.init(['abc'], [], [], 'public', 'e1234', true);
      expect(ers.isPrivate()).toBe(false);
      expect(ers.isPublic()).toBe(true);
      expect(ers.isPublicized()).toBe(false);

      ers.init(['abc'], [], [], 'publicized', 'e1234', true);
      expect(ers.isPrivate()).toBe(false);
      expect(ers.isPublic()).toBe(false);
      expect(ers.isPublicized()).toBe(true);
    });

    it('reports the correct cloning status', function() {
      ers.init(['abc'], [], [], 'publicized', '1234', true);
      expect(ers.isCloned()).toBe(true);
      expect(ers.clonedFrom()).toEqual('1234');

      ers.init(['abc'], [], [], 'publicized', null, true);
      expect(ers.isCloned()).toBe(false);
      expect(ers.clonedFrom()).toBeNull();
    });

    it('reports the correct community-owned status', function() {
      ers.init(['abc'], [], [], 'publicized', '1234', false);
      expect(ers.isCommunityOwned()).toBe(false);

      ers.init(['abc'], [], [], 'publicized', '1234', true);
      expect(ers.isCommunityOwned()).toBe(true);
    });
  });
});

describe('Exploration gadgets service', function() {
  beforeEach(module('oppia'));

  describe('exploration gadgets service', function() {
    var egs = null;
    var $httpBackend = null;
    var mockWarningsData;
    var mockExplorationData;
    var TEST_GADGET_NAME = 'TestGadget1';

    var autosaveDraftUrl = 'createhandler/autosave_draft/0';
    var validAutosaveResponse = {
      is_version_of_draft_valid: true
    };

    var GADGET_SPECS = {
      ScoreBar: {
        type: 'ScoreBar',
        width_px: 250,
        panel: 'bottom',
        customization_arg_specs: [{
          name: 'title',
          description: 'Optional title for the score bar (e.g. \'Score\')',
          schema: {
            type: 'unicode'
          },
          default_value: 'Score'
        }, {
          name: 'maxValue',
          description: 'Maximum value (bar fills as a % of this value)',
          schema: {
            type: 'int'
          },
          default_value: 100
        }, {
          name: 'paramName',
          description: 'The parameter name this score bar follows.',
          schema: {
            type: 'unicode'
          },
          default_value: ''
        }],
        height_px: 100,
        description: 'A visual score bar.',
        name: 'ScoreBar'
      },
      TestGadget: {
        type: 'TestGadget',
        width_px: 100,
        panel: 'bottom',
        customization_arg_specs: [{
          name: 'title',
          description: 'Optional title for the advice bar (e.g. \'Tips\')',
          schema: {
            type: 'unicode'
          },
          default_value: ''
        }, {
          name: 'adviceObjects',
          description: 'Title and content for each tip.',
          schema: {
            type: 'list',
            validators: [{
              id: 'has_length_at_least',
              min_value: 1
            }, {
              id: 'has_length_at_most',
              max_value: 3
            }],
            items: {
              properties: [{
                name: 'adviceTitle',
                description: 'Tip title (visible on advice bar)',
                schema: {
                  type: 'unicode',
                  validators: [{
                    id: 'is_nonempty'
                  }]
                }
              }, {
                name: 'adviceHtml',
                description: 'Advice content (visible upon click)',
                schema: {
                  type: 'html'
                }
              }],
              type: 'dict'
            }
          },
          default_value: [{
            adviceTitle: 'Tip title',
            adviceHtml: ''
          }]
        }],
        height_px: 300,
        description: 'Allows learners to receive advice.',
        name: 'TestGadget'
      }
    };
    var skinCustomizationsData = {
      panels_contents: {
        bottom: [{
          gadget_name: TEST_GADGET_NAME,
          visible_in_states: [
            'Example1',
            'Example2'
          ],
          customization_args: {
            title: {
              value: 'TIP1'
            },
            adviceObjects: {
              value: [{
                adviceTitle: 'title1',
                adviceHtml: 'content1'
              }]
            }
          },
          gadget_type: 'TestGadget'
        }]
      }
    };
    var gadgetData = {
      gadget_type: 'TestGadget',
      gadget_name: 'NewTestGadget',
      panel: 'bottom',
      customization_args: {
        title: {
          value: 'TIP3'
        },
        adviceObjects: {
          value: [{
            adviceTitle: 'title3',
            adviceHtml: 'content3'
          }]
        }
      },
      visible_in_states: ['state1']
    };

    beforeEach(function() {
      mockWarningsData = {
        addWarning: function() {}
      };
      module(function($provide) {
        $provide.value('alertsService', mockWarningsData);
        $provide.constant('GADGET_SPECS', GADGET_SPECS);
      });
      spyOn(mockWarningsData, 'addWarning');
      mockExplorationData = {
        explorationId: 0,
        autosaveChangeList: function() {}
      };
      module(function($provide) {
        $provide.value('explorationData', mockExplorationData);
      });
      spyOn(mockExplorationData, 'autosaveChangeList');
    });

    beforeEach(inject(function($injector) {
      egs = $injector.get('explorationGadgetsService');
      $httpBackend = $injector.get('$httpBackend');
      GLOBALS.PANEL_SPECS = {
        bottom: {
          stackable_axis: 'horizontal',
          pixels_between_gadgets: 80,
          max_gadgets: 1,
          width: 350,
          height: 100
        }
      };
    }));

    it('Update gadgets data when state is deleted', function() {
      egs.init(skinCustomizationsData);
      egs.handleStateDeletion('Example1');

      expect(egs.getGadgets()[TEST_GADGET_NAME].visible_in_states).toEqual(
        ['Example2']
      );
      expect(mockExplorationData.autosaveChangeList).toHaveBeenCalled();
      $httpBackend.expectPUT(autosaveDraftUrl).respond(validAutosaveResponse);
    });

    it('Update gadgets data when state is renamed', function() {
      egs.init(skinCustomizationsData);
      egs.handleStateRenaming('Example2', 'newStateName');

      expect(egs.getGadgets()[TEST_GADGET_NAME].visible_in_states).toEqual(
        ['Example1', 'newStateName']
      );
      expect(mockExplorationData.autosaveChangeList).toHaveBeenCalled();
      $httpBackend.expectPUT(autosaveDraftUrl).respond(validAutosaveResponse);
    });

    it('should detect invalid data passed for initialization', function() {
      egs.init({
        wrongObjectKey: 'value'
      });
      expect(mockWarningsData.addWarning).toHaveBeenCalledWith(
        'Gadget Initialization failed. Panel contents were not provided');
    });

    it('init on valid data', function() {
      egs.init(skinCustomizationsData);
      expect(egs.getPanels()).toEqual({
        bottom: [TEST_GADGET_NAME]
      });
    });

    it('add a new gadget with valid data', function() {
      egs.init(skinCustomizationsData);
      egs.addGadget(gadgetData, 'bottom');
      expect(egs.getPanels()).toEqual({
        bottom: [TEST_GADGET_NAME, 'NewTestGadget']
      });
    });

    it('should detect non existent panel when adding gadget', function() {
      egs.init(skinCustomizationsData);
      gadgetData.panel = 'unknown_panel';
      egs.addGadget(gadgetData);
      expect(mockWarningsData.addWarning).toHaveBeenCalledWith(
        'Attempted add to a non-existent panel: unknown_panel');
    });

    it('should detect same gadget name before adding gadget', function() {
      egs.init(skinCustomizationsData);
      gadgetData.gadget_name = TEST_GADGET_NAME;
      gadgetData.panel = 'bottom';
      egs.addGadget(gadgetData);
      expect(mockWarningsData.addWarning).toHaveBeenCalledWith(
        'A gadget with this name already exists.');
    });

    it('should detect unknown gadget name before updating gadget', function() {
      egs.init(skinCustomizationsData);
      egs.updateGadget('unknownGadgetName', {}, []);
      expect(mockWarningsData.addWarning).toHaveBeenCalledWith(
        'Attempted to update a non-existent gadget: unknownGadgetName');
    });

    it('should detect if gadget is not visible in any state.', function() {
      egs.init(skinCustomizationsData);
      egs.updateGadget(TEST_GADGET_NAME, gadgetData[TEST_GADGET_NAME], []);
      expect(mockWarningsData.addWarning).toHaveBeenCalledWith(
        'This gadget is not visible in any states.');
    });

    // TODO(vjoisar/sll): Add the test case when we delete the only state that
    // contains the gadget.
    // Also ensure right confirmation boxes show up in various cases.
  });
});

describe('New state template service', function() {
  beforeEach(module('oppia'));

  describe('new state template service', function() {
    var nsts = null;
    var NEW_STATE_NAME = 'new state name';

    beforeEach(inject(function($injector) {
      // TODO(sll): Find a way to have this and the backend dict read from the
      // same single source of truth.
      GLOBALS.NEW_STATE_TEMPLATE = {
        content: [{
          type: 'text',
          value: ''
        }],
        interaction: {
          customization_args: {
            rows: {
              value: 1
            },
            placeholder: {
              value: 'Type your answer here.'
            }
          },
          default_outcome: {
            dest: '(untitled state)',
            feedback: [],
            param_changes: []
          },
          id: 'TextInput'
        },
        param_changes: [],
        unresolved_answers: {}
      };
      nsts = $injector.get('newStateTemplateService');
    }));

    it('should make a new state template given a state name', function() {
      expect(nsts.getNewStateTemplate(NEW_STATE_NAME)).toEqual({
        content: [{
          type: 'text',
          value: ''
        }],
        interaction: {
          customization_args: {
            rows: {
              value: 1
            },
            placeholder: {
              value: 'Type your answer here.'
            }
          },
          default_outcome: {
            dest: NEW_STATE_NAME,
            feedback: [],
            param_changes: []
          },
          id: 'TextInput'
        },
        param_changes: [],
        unresolved_answers: {}
      });
    });
  });
});
