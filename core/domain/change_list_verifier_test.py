# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Unit tests for core.domain.change_list_verifier."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import exp_services_test
from core.domain import rights_manager
from core.tests import test_utils
import feconf

class ExplorationChangesMergeabilityUnitTests(
        exp_services_test.ExplorationServicesUnitTests,
        test_utils.EmailTestBase):
    """Test methods related to exploration changes mergeability."""

    def test_changes_are_mergeable_when_content_changes_do_not_conflict(self):
        self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, end_state_name='End')

        rights_manager.publish_exploration(self.owner, self.EXP_0_ID)

        change_list = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_EDIT_EXPLORATION_PROPERTY,
            'property_name': 'title',
            'new_value': 'First title'
        })]
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list, 'Changed title.')

        # Making changes to properties except content.
        change_list_2 = [exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'property_name': 'widget_id',
            'new_value': None,
            'old_value': 'TextInput'
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'property_name': 'widget_customization_args',
            'new_value': {},
            'old_value': {
                'placeholder': {
                    'value': {
                        'content_id': 'ca_placeholder_0',
                        'unicode_str': ''
                    }
                },
                'rows': {
                    'value': 1
                }
            }
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index',
            'new_value': 2,
            'old_value': 1
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'property_name': 'widget_id',
            'new_value': 'Continue',
            'old_value': None
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'property_name': 'widget_customization_args',
            'new_value': {
                'buttonText': {
                    'value': {
                        'content_id': 'ca_buttonText_1',
                        'unicode_str': 'Continue'
                    }
                }
            },
            'old_value': {}
        })]
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list_2, 'Changed Interaction.')

        # Changing content of second state.
        change_list_3 = [exp_domain.ExplorationChange({
            'property_name': 'content',
            'state_name': 'End',
            'cmd': 'edit_state_property',
            'old_value': {
                'html': '',
                'content_id': 'content'
            },
            'new_value': {
                'html': '<p>Congratulations, you have finished!</p>',
                'content_id': 'content'
            }
        })]

        # Checking that the changes can be applied when
        # changing to same version.
        changes_are_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 3, change_list_3)
        self.assertEqual(changes_are_mergeable, True)

        changes_are_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 2, change_list_3)
        self.assertEqual(changes_are_mergeable, True)

        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list_3,
            'Changed content of End state.')

        # Changing content of first state.
        change_list_4 = [exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_RENAME_STATE,
            'old_state_name': 'Introduction',
            'new_state_name': 'Renamed state'
        }), exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_RENAME_STATE,
            'old_state_name': 'Renamed state',
            'new_state_name': 'Renamed state again'
        }), exp_domain.ExplorationChange({
            'cmd': exp_domain.CMD_RENAME_STATE,
            'old_state_name': 'Renamed state again',
            'new_state_name': 'Introduction'
        }), exp_domain.ExplorationChange({
            'property_name': 'content',
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'old_value': {
                'html': '',
                'content_id': 'content'
            },
            'new_value': {
                'html': '<p>Hello</p>',
                'content_id': 'content'
            }
        })]

        # Checking for the mergability of the fourth change list.
        changes_are_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 2, change_list_4)
        self.assertEqual(changes_are_mergeable, True)

        # Checking for the mergability when working on latest version.
        changes_are_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 3, change_list_4)
        self.assertEqual(changes_are_mergeable, True)

    def test_changes_are_not_mergeable_when_content_changes_conflict(self):
        self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, end_state_name='End')

        rights_manager.publish_exploration(self.owner, self.EXP_0_ID)

        # Making changes to content of the first state.
        change_list = [exp_domain.ExplorationChange({
            'property_name': 'content',
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'old_value': {
                'html': '',
                'content_id': 'content'
            },
            'new_value': {
                'html': '<p>Content 1.</p>',
                'content_id': 'content'
            }
        })]
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list, 'Changed Content.')

        # Changing content of the same state to check that
        # changes are not mergeable.
        change_list_2 = [exp_domain.ExplorationChange({
            'property_name': 'content',
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'old_value': {
                'html': '',
                'content_id': 'content'
            },
            'new_value': {
                'html': '<p>Content 2.</p>',
                'content_id': 'content'
            }
        })]

        # Checking for the mergability of the second change list.
        changes_are_not_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 1, change_list_2)
        self.assertEqual(changes_are_not_mergeable, False)

    def test_changes_are_mergeable_when_interaction_id_changes_do_not_conflict(self): # pylint: disable=line-too-long
        self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, end_state_name='End')

        rights_manager.publish_exploration(self.owner, self.EXP_0_ID)

        # Making changes in the properties which are
        # not related to the interaction id.
        change_list_2 = [exp_domain.ExplorationChange({
            'new_value': {
                'content_id': 'content',
                'html': '<p>This is the first state.</p>'
            },
            'state_name': 'Introduction',
            'old_value': {
                'content_id': 'content',
                'html': ''
            },
            'cmd': 'edit_state_property',
            'property_name': 'content'
        }), exp_domain.ExplorationChange({
            'new_value': [{
                'hint_content': {
                    'content_id': 'hint_1',
                    'html': '<p>This is a first hint.</p>'
                }
            }],
            'state_name': 'Introduction',
            'old_value': [],
            'cmd': 'edit_state_property',
            'property_name': 'hints'
        }), exp_domain.ExplorationChange({
            'new_value': 2,
            'state_name': 'Introduction',
            'old_value': 1,
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index'
        }), exp_domain.ExplorationChange({
            'new_value': [{
                'hint_content': {
                    'content_id': 'hint_1',
                    'html': '<p>This is a first hint.</p>'
                }
            }, {
                'hint_content': {
                    'content_id': 'hint_2',
                    'html': '<p>This is the second hint.</p>'
                }
            }],
            'state_name': 'Introduction',
            'old_value': [{
                'hint_content': {
                    'content_id': 'hint_1',
                    'html': '<p>This is a first hint.</p>'
                }
            }],
            'cmd': 'edit_state_property',
            'property_name': 'hints'
        }), exp_domain.ExplorationChange({
            'new_value': {
                'content_id': 'content',
                'html': '<p>Congratulations, you have finished!</p>'
            },
            'state_name': 'End',
            'old_value': {
                'content_id': 'content',
                'html': ''
            },
            'cmd': 'edit_state_property',
            'property_name': 'content'
        })]
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list_2,
            'Changed Contents and Hint')

        # Changes to the properties affected by or affecting
        # interaction id and in interaction_id itself.
        change_list_3 = [exp_domain.ExplorationChange({
            'new_value': None,
            'state_name': 'Introduction',
            'old_value': 'TextInput',
            'cmd': 'edit_state_property',
            'property_name': 'widget_id'
        }), exp_domain.ExplorationChange({
            'new_value': {},
            'state_name': 'Introduction',
            'old_value': {
                'rows': {
                    'value': 1
                },
                'placeholder': {
                    'value': {
                        'content_id': 'ca_placeholder_0',
                        'unicode_str': ''
                    }
                }
            },
            'cmd': 'edit_state_property',
            'property_name': 'widget_customization_args'
        }), exp_domain.ExplorationChange({
            'new_value': 2,
            'state_name': 'Introduction',
            'old_value': 1,
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index'
        }), exp_domain.ExplorationChange({
            'new_value': 'Continue',
            'state_name': 'Introduction',
            'old_value': None,
            'cmd': 'edit_state_property',
            'property_name': 'widget_id'
        }), exp_domain.ExplorationChange({
            'new_value': {
                'buttonText': {
                    'value': {
                        'content_id': 'ca_buttonText_1',
                        'unicode_str': 'Continue'
                    }
                }
            },
            'state_name': 'Introduction',
            'old_value': {},
            'cmd': 'edit_state_property',
            'property_name': 'widget_customization_args'
        })]

        changes_are_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 1, change_list_3)
        self.assertEqual(changes_are_mergeable, True)

        # Creating second exploration to test the scenario
        # when changes to same properties are made in two
        # different states.
        self.save_new_valid_exploration(
            self.EXP_1_ID, self.owner_id, end_state_name='End')

        rights_manager.publish_exploration(self.owner, self.EXP_1_ID)

        # Using the old change_list_3 here because they already covers
        # the changes related to interaction in first state.
        exp_services.update_exploration(
            self.owner_id, self.EXP_1_ID, change_list_3, 'Changed Interaction')

        # Changes related to interaction in the second state
        # to check for mergeability.
        change_list_4 = [exp_domain.ExplorationChange({
            'state_name': 'End',
            'cmd': 'edit_state_property',
            'new_value': None,
            'old_value': 'EndExploration',
            'property_name': 'widget_id'
        }), exp_domain.ExplorationChange({
            'state_name': 'End',
            'cmd': 'edit_state_property',
            'new_value': {},
            'old_value': {
                'recommendedExplorationIds': {
                    'value': []
                }
            },
            'property_name': 'widget_customization_args'
        }), exp_domain.ExplorationChange({
            'state_name': 'End',
            'cmd': 'edit_state_property',
            'new_value': 'NumericInput',
            'old_value': None,
            'property_name': 'widget_id'
        }), exp_domain.ExplorationChange({
            'state_name': 'End',
            'cmd': 'edit_state_property',
            'new_value': {
                'refresher_exploration_id': None,
                'missing_prerequisite_skill_id': None,
                'dest': 'End',
                'labelled_as_correct': False,
                'param_changes': [],
                'feedback': {
                    'html': '',
                    'content_id': 'default_outcome'
                }
            },
            'old_value': None,
            'property_name': 'default_outcome'
        }), exp_domain.ExplorationChange({
            'state_name': 'End',
            'cmd': 'edit_state_property',
            'new_value': 1,
            'old_value': 0,
            'property_name': 'next_content_id_index'
        }), exp_domain.ExplorationChange({
            'state_name': 'End',
            'cmd': 'edit_state_property',
            'new_value': [{
                'outcome': {
                    'refresher_exploration_id': None,
                    'missing_prerequisite_skill_id': None,
                    'dest': 'End',
                    'labelled_as_correct': False,
                    'param_changes': [],
                    'feedback': {
                        'html': '<p>Feedback</p>',
                        'content_id': 'feedback_0'
                    }
                },
                'rule_specs': [{
                    'inputs': {
                        'x': 60
                    },
                    'rule_type': 'IsLessThanOrEqualTo'
                }],
                'tagged_skill_misconception_id': None,
                'training_data': []
            }],
            'old_value': [],
            'property_name': 'answer_groups'
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'state_name': 'End',
            'property_name': 'solicit_answer_details',
            'new_value': True
        })]
        changes_are_mergeable_1 = exp_services.are_changes_mergeable(
            self.EXP_1_ID, 1, change_list_4)
        self.assertEqual(changes_are_mergeable_1, True)

    def test_changes_are_not_mergeable_when_interaction_id_changes_conflict(self): # pylint: disable=line-too-long
        self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, end_state_name='End')

        rights_manager.publish_exploration(self.owner, self.EXP_0_ID)

        # Changes to the properties affected by or affecting
        # interaction id and in interaction_id itself.
        change_list_2 = [exp_domain.ExplorationChange({
            'new_value': None,
            'state_name': 'Introduction',
            'old_value': 'TextInput',
            'cmd': 'edit_state_property',
            'property_name': 'widget_id'
        }), exp_domain.ExplorationChange({
            'new_value': {},
            'state_name': 'Introduction',
            'old_value': {
                'rows': {
                    'value': 1
                },
                'placeholder': {
                    'value': {
                        'content_id': 'ca_placeholder_0',
                        'unicode_str': ''
                    }
                }
            },
            'cmd': 'edit_state_property',
            'property_name': 'widget_customization_args'
        }), exp_domain.ExplorationChange({
            'new_value': 2,
            'state_name': 'Introduction',
            'old_value': 1,
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index'
        }), exp_domain.ExplorationChange({
            'new_value': 'Continue',
            'state_name': 'Introduction',
            'old_value': None,
            'cmd': 'edit_state_property',
            'property_name': 'widget_id'
        }), exp_domain.ExplorationChange({
            'new_value': {
                'buttonText': {
                    'value': {
                        'content_id': 'ca_buttonText_1',
                        'unicode_str': 'Continue'
                    }
                }
            },
            'state_name': 'Introduction',
            'old_value': {},
            'cmd': 'edit_state_property',
            'property_name': 'widget_customization_args'
        })]
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list_2,
            'Changed Contents and Hint')

        # Changes to the properties affected by or affecting
        # interaction id and in interaction_id itself again
        # to check that changes are not mergeable.
        change_list_3 = [exp_domain.ExplorationChange({
            'new_value': None,
            'state_name': 'Introduction',
            'old_value': 'TextInput',
            'cmd': 'edit_state_property',
            'property_name': 'widget_id'
        }), exp_domain.ExplorationChange({
            'new_value': {},
            'state_name': 'Introduction',
            'old_value': {
                'rows': {
                    'value': 1
                },
                'placeholder': {
                    'value': {
                        'content_id': 'ca_placeholder_0',
                        'unicode_str': ''
                    }
                }
            },
            'cmd': 'edit_state_property',
            'property_name': 'widget_customization_args'
        }), exp_domain.ExplorationChange({
            'new_value': 2,
            'state_name': 'Introduction',
            'old_value': 1,
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index'
        }), exp_domain.ExplorationChange({
            'new_value': 'Continue',
            'state_name': 'Introduction',
            'old_value': None,
            'cmd': 'edit_state_property',
            'property_name': 'widget_id'
        }), exp_domain.ExplorationChange({
            'new_value': {
                'buttonText': {
                    'value': {
                        'content_id': 'ca_buttonText_1',
                        'unicode_str': 'Continue'
                    }
                }
            },
            'state_name': 'Introduction',
            'old_value': {},
            'cmd': 'edit_state_property',
            'property_name': 'widget_customization_args'
        })]

        changes_are_not_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 1, change_list_3)
        self.assertEqual(changes_are_not_mergeable, False)

    def test_changes_are_mergeable_when_customization_args_changes_do_not_conflict(self): # pylint: disable=line-too-long
        self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, end_state_name='End')

        rights_manager.publish_exploration(self.owner, self.EXP_0_ID)

        # Changes in the properties which aren't affected by
        # customization args or doesn't affects customization_args.
        change_list = [exp_domain.ExplorationChange({
            'new_value': {
                'content_id': 'content',
                'html': '<p>This is the first state.</p>'
            },
            'state_name': 'Introduction',
            'old_value': {
                'content_id': 'content',
                'html': ''
            },
            'cmd': 'edit_state_property',
            'property_name': 'content'
        }), exp_domain.ExplorationChange({
            'new_value': [{
                'hint_content': {
                    'content_id': 'hint_1',
                    'html': '<p>This is a first hint.</p>'
                }
            }],
            'state_name': 'Introduction',
            'old_value': [],
            'cmd': 'edit_state_property',
            'property_name': 'hints'
        }), exp_domain.ExplorationChange({
            'new_value': 2,
            'state_name': 'Introduction',
            'old_value': 1,
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index'
        }), exp_domain.ExplorationChange({
            'new_value': [{
                'hint_content': {
                    'content_id': 'hint_1',
                    'html': '<p>This is a first hint.</p>'
                }
            }, {
                'hint_content': {
                    'content_id': 'hint_2',
                    'html': '<p>This is the second hint.</p>'
                }
            }],
            'state_name': 'Introduction',
            'old_value': [{
                'hint_content': {
                    'content_id': 'hint_1',
                    'html': '<p>This is a first hint.</p>'
                }
            }],
            'cmd': 'edit_state_property',
            'property_name': 'hints'
        }), exp_domain.ExplorationChange({
            'new_value': 3,
            'state_name': 'Introduction',
            'old_value': 2,
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index'
        }), exp_domain.ExplorationChange({
            'new_value': {
                'content_id': 'content',
                'html': '<p>Congratulations, you have finished!</p>'
            },
            'state_name': 'End',
            'old_value': {
                'content_id': 'content',
                'html': ''
            },
            'cmd': 'edit_state_property',
            'property_name': 'content'
        })]
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list,
            'Changed Contents and Hints')

        # Changes to the properties affecting customization_args
        # or are affected by customization_args in the same state.
        # This includes changes related to renaming a state in
        # order to check that changes are applied even if states
        # are renamed.
        change_list_2 = [exp_domain.ExplorationChange({
            'cmd': 'rename_state',
            'new_state_name': 'Intro-rename',
            'old_state_name': 'Introduction'
        }), exp_domain.ExplorationChange({
            'old_value': 'Introduction',
            'property_name': 'init_state_name',
            'new_value': 'Intro-rename',
            'cmd': 'edit_exploration_property'
        }), exp_domain.ExplorationChange({
            'state_name': 'Intro-rename',
            'old_value': {
                'placeholder':
                {
                    'value':
                    {
                        'content_id': 'ca_placeholder_0',
                        'unicode_str': ''
                    }
                },
                'rows': {
                    'value': 1
                }
            },
            'property_name': 'widget_customization_args',
            'new_value':
            {
                'placeholder':
                {
                    'value':
                    {
                        'content_id': 'ca_placeholder_0',
                        'unicode_str': 'Placeholder text'
                    }
                },
                'rows':
                {
                    'value': 2
                }
            },
            'cmd': 'edit_state_property'
        }), exp_domain.ExplorationChange({
            'state_name': 'Intro-rename',
            'old_value': 'TextInput',
            'property_name': 'widget_id',
            'new_value': None,
            'cmd': 'edit_state_property'
        }), exp_domain.ExplorationChange({
            'state_name': 'Intro-rename',
            'old_value':
            {
                'placeholder':
                {
                    'value':
                    {
                        'content_id': 'ca_placeholder_0',
                        'unicode_str': 'Placeholder text'
                    }
                },
                'rows':
                {
                    'value': 2
                }
            },
            'property_name': 'widget_customization_args',
            'new_value': {},
            'cmd': 'edit_state_property'
        }), exp_domain.ExplorationChange({
            'state_name': 'Intro-rename',
            'old_value': 1,
            'property_name': 'next_content_id_index',
            'new_value': 3,
            'cmd': 'edit_state_property'
        }), exp_domain.ExplorationChange({
            'state_name': 'Intro-rename',
            'old_value': None,
            'property_name': 'widget_id',
            'new_value': 'NumericInput',
            'cmd': 'edit_state_property'
        }), exp_domain.ExplorationChange({
            'state_name': 'Intro-rename',
            'old_value': 3,
            'property_name': 'next_content_id_index',
            'new_value': 4,
            'cmd': 'edit_state_property'
        }), exp_domain.ExplorationChange({
            'state_name': 'Intro-rename',
            'old_value': [],
            'property_name': 'answer_groups',
            'new_value':
            [
                {
                    'rule_specs':
                    [
                        {
                            'inputs':
                            {
                                'x': 50
                            },
                            'rule_type': 'IsLessThanOrEqualTo'
                        }
                    ],
                    'training_data': [],
                    'tagged_skill_misconception_id': None,
                    'outcome':
                    {
                        'feedback':
                        {
                            'content_id': 'feedback_3',
                            'html': '<p>Next</p>'
                        },
                        'param_changes': [],
                        'refresher_exploration_id': None,
                        'dest': 'End',
                        'missing_prerequisite_skill_id': None,
                        'labelled_as_correct': False
                    }
                }
            ],
            'cmd': 'edit_state_property'
        })]

        changes_are_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 1, change_list_2)
        self.assertEqual(changes_are_mergeable, True)

        # Creating second exploration to test the scenario
        # when changes to same properties are made in two
        # different states.
        self.save_new_valid_exploration(
            self.EXP_1_ID, self.owner_id, end_state_name='End')

        rights_manager.publish_exploration(self.owner, self.EXP_1_ID)

        # Using the old change_list_2 here because they already covers
        # the changes related to customization args in first state.
        exp_services.update_exploration(
            self.owner_id, self.EXP_1_ID, change_list_2,
            'Changed Interactions and Customization_args in One State')

        # Changes to the properties related to the customization args
        # in the second state to check for mergeability.
        change_list_3 = [exp_domain.ExplorationChange({
            'old_value': 'EndExploration',
            'state_name': 'End',
            'property_name': 'widget_id',
            'cmd': 'edit_state_property',
            'new_value': None
        }), exp_domain.ExplorationChange({
            'old_value': {
                'recommendedExplorationIds': {
                    'value': []
                }
            },
            'state_name': 'End',
            'property_name': 'widget_customization_args',
            'cmd': 'edit_state_property',
            'new_value': {}
        }), exp_domain.ExplorationChange({
            'old_value': 0,
            'state_name': 'End',
            'property_name': 'next_content_id_index',
            'cmd': 'edit_state_property',
            'new_value': 4
        }), exp_domain.ExplorationChange({
            'old_value': None,
            'state_name': 'End',
            'property_name': 'widget_id',
            'cmd': 'edit_state_property',
            'new_value': 'ItemSelectionInput'
        }), exp_domain.ExplorationChange({
            'old_value': {},
            'state_name': 'End',
            'property_name': 'widget_customization_args',
            'cmd': 'edit_state_property',
            'new_value': {
                'minAllowableSelectionCount': {
                    'value': 1
                },
                'choices': {
                    'value': [{
                        'html': '<p>A</p>',
                        'content_id': 'ca_choices_0'
                    }, {
                        'html': '<p>B</p>',
                        'content_id': 'ca_choices_1'
                    }, {
                        'html': '<p>C</p>',
                        'content_id': 'ca_choices_2'
                    }, {
                        'html': '<p>D</p>',
                        'content_id': 'ca_choices_3'
                    }]
                },
                'maxAllowableSelectionCount': {
                    'value': 1
                }
            }
        }), exp_domain.ExplorationChange({
            'old_value': None,
            'state_name': 'End',
            'property_name': 'default_outcome',
            'cmd': 'edit_state_property',
            'new_value': {
                'refresher_exploration_id': None,
                'dest': 'End',
                'missing_prerequisite_skill_id': None,
                'feedback': {
                    'html': '',
                    'content_id': 'default_outcome'
                },
                'param_changes': [],
                'labelled_as_correct': False
            }
        }), exp_domain.ExplorationChange({
            'old_value': 4,
            'state_name': 'End',
            'property_name': 'next_content_id_index',
            'cmd': 'edit_state_property',
            'new_value': 5
        }), exp_domain.ExplorationChange({
            'old_value': [],
            'state_name': 'End',
            'property_name': 'answer_groups',
            'cmd': 'edit_state_property',
            'new_value':
            [
                {
                    'training_data': [],
                    'tagged_skill_misconception_id': None,
                    'outcome':
                    {
                        'refresher_exploration_id': None,
                        'dest': 'End',
                        'missing_prerequisite_skill_id': None,
                        'feedback':
                        {
                            'html': '<p>Good</p>',
                            'content_id': 'feedback_4'
                        },
                        'param_changes': [],
                        'labelled_as_correct': False
                    },
                    'rule_specs':
                    [
                        {
                            'rule_type': 'Equals',
                            'inputs':
                            {
                                'x':
                                [
                                    'ca_choices_1'
                                ]
                            }
                        }
                    ]
                }
            ]
        })]

        changes_are_mergeable_1 = exp_services.are_changes_mergeable(
            self.EXP_1_ID, 1, change_list_3)
        self.assertEqual(changes_are_mergeable_1, True)

    def test_changes_are_not_mergeable_when_customization_args_changes_conflict(self): # pylint: disable=line-too-long
        self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, end_state_name='End')

        rights_manager.publish_exploration(self.owner, self.EXP_0_ID)

        # Changes in the properties which affected by or affecting
        # customization_args.
        change_list = [exp_domain.ExplorationChange({
            'cmd': 'rename_state',
            'new_state_name': 'Intro-rename',
            'old_state_name': 'Introduction'
        }), exp_domain.ExplorationChange({
            'old_value': 'Introduction',
            'property_name': 'init_state_name',
            'new_value': 'Intro-rename',
            'cmd': 'edit_exploration_property'
        }), exp_domain.ExplorationChange({
            'state_name': 'Intro-rename',
            'old_value': {
                'placeholder':
                {
                    'value':
                    {
                        'content_id': 'ca_placeholder_0',
                        'unicode_str': ''
                    }
                },
                'rows': {
                    'value': 1
                }
            },
            'property_name': 'widget_customization_args',
            'new_value':
            {
                'placeholder':
                {
                    'value':
                    {
                        'content_id': 'ca_placeholder_0',
                        'unicode_str': 'Placeholder text'
                    }
                },
                'rows':
                {
                    'value': 2
                }
            },
            'cmd': 'edit_state_property'
        }), exp_domain.ExplorationChange({
            'state_name': 'Intro-rename',
            'old_value': 'TextInput',
            'property_name': 'widget_id',
            'new_value': None,
            'cmd': 'edit_state_property'
        }), exp_domain.ExplorationChange({
            'state_name': 'Intro-rename',
            'old_value':
            {
                'placeholder':
                {
                    'value':
                    {
                        'content_id': 'ca_placeholder_0',
                        'unicode_str': 'Placeholder text'
                    }
                },
                'rows':
                {
                    'value': 2
                }
            },
            'property_name': 'widget_customization_args',
            'new_value': {},
            'cmd': 'edit_state_property'
        }), exp_domain.ExplorationChange({
            'state_name': 'Intro-rename',
            'old_value': 1,
            'property_name': 'next_content_id_index',
            'new_value': 3,
            'cmd': 'edit_state_property'
        }), exp_domain.ExplorationChange({
            'state_name': 'Intro-rename',
            'old_value': None,
            'property_name': 'widget_id',
            'new_value': 'NumericInput',
            'cmd': 'edit_state_property'
        }), exp_domain.ExplorationChange({
            'state_name': 'Intro-rename',
            'old_value': 3,
            'property_name': 'next_content_id_index',
            'new_value': 4,
            'cmd': 'edit_state_property'
        }), exp_domain.ExplorationChange({
            'state_name': 'Intro-rename',
            'old_value': [],
            'property_name': 'answer_groups',
            'new_value':
            [
                {
                    'rule_specs':
                    [
                        {
                            'inputs':
                            {
                                'x': 50
                            },
                            'rule_type': 'IsLessThanOrEqualTo'
                        }
                    ],
                    'training_data': [],
                    'tagged_skill_misconception_id': None,
                    'outcome':
                    {
                        'feedback':
                        {
                            'content_id': 'feedback_3',
                            'html': '<p>Next</p>'
                        },
                        'param_changes': [],
                        'refresher_exploration_id': None,
                        'dest': 'End',
                        'missing_prerequisite_skill_id': None,
                        'labelled_as_correct': False
                    }
                }
            ],
            'cmd': 'edit_state_property'
        })]
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list,
            'Changed Customization Args and related properties again')

        # Changes to the customization_args in same
        # state again to check that changes are not mergeable.
        change_list_2 = [exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'old_value': {
                'placeholder':
                {
                    'value':
                    {
                        'content_id': 'ca_placeholder_0',
                        'unicode_str': ''
                    }
                },
                'rows': {
                    'value': 1
                }
            },
            'property_name': 'widget_customization_args',
            'new_value':
            {
                'placeholder':
                {
                    'value':
                    {
                        'content_id': 'ca_placeholder_0',
                        'unicode_str': 'Placeholder text 2.'
                    }
                },
                'rows':
                {
                    'value': 2
                }
            },
            'cmd': 'edit_state_property'
        })]

        changes_are_not_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 1, change_list_2)
        self.assertEqual(changes_are_not_mergeable, False)

    def test_changes_are_mergeable_when_answer_groups_changes_do_not_conflict(self): # pylint: disable=line-too-long
        self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, end_state_name='End')

        rights_manager.publish_exploration(self.owner, self.EXP_0_ID)

        # Adding answer_groups and solutions to the existing state.
        change_list = [exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index',
            'old_value': 1,
            'state_name': 'Introduction',
            'new_value': 3
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'property_name': 'answer_groups',
            'old_value': [],
            'state_name': 'Introduction',
            'new_value': [{
                'rule_specs': [{
                    'rule_type': 'StartsWith',
                    'inputs': {
                        'x': {
                            'contentId': 'rule_input_2',
                            'normalizedStrSet': ['Hello', 'Hola']
                        }
                    }
                }],
                'tagged_skill_misconception_id': None,
                'outcome': {
                    'labelled_as_correct': False,
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': '<p>Feedback</p>'
                    },
                    'missing_prerequisite_skill_id': None,
                    'dest': 'End',
                    'param_changes': [],
                    'refresher_exploration_id': None
                },
                'training_data': []
            }]
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'property_name': 'hints',
            'old_value': [],
            'state_name': 'Introduction',
            'new_value': [{
                'hint_content': {
                    'content_id': 'hint_3',
                    'html': '<p>Hint 1.</p>'
                }
            }]
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index',
            'old_value': 3,
            'state_name': 'Introduction',
            'new_value': 4
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'property_name': 'solution',
            'old_value': None,
            'state_name': 'Introduction',
            'new_value': {
                'correct_answer': 'Hello Aryaman!',
                'explanation': {
                    'content_id': 'solution',
                    'html': '<p>Explanation.</p>'
                },
                'answer_is_exclusive': False
            }
        })]

        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list,
            'Added answer groups and solution')

        # Changes to the properties that are not related to
        # the answer_groups. These changes are done to check
        # when the changes are made in unrelated properties,
        # they can be merged easily.
        change_list_2 = [exp_domain.ExplorationChange({
            'new_value': {
                'content_id': 'content',
                'html': '<p>This is the first state.</p>'
            },
            'state_name': 'Introduction',
            'old_value': {
                'content_id': 'content',
                'html': ''
            },
            'cmd': 'edit_state_property',
            'property_name': 'content'
        }), exp_domain.ExplorationChange({
            'new_value': [{
                'hint_content': {
                    'content_id': 'hint_3',
                    'html': '<p>Hint 1.</p>'
                }
            }, {
                'hint_content': {
                    'content_id': 'hint_4',
                    'html': '<p>This is a first hint.</p>'
                }
            }],
            'state_name': 'Introduction',
            'old_value': [{
                'hint_content': {
                    'content_id': 'hint_3',
                    'html': '<p>Hint 1.</p>'
                }
            }],
            'cmd': 'edit_state_property',
            'property_name': 'hints'
        }), exp_domain.ExplorationChange({
            'new_value': 5,
            'state_name': 'Introduction',
            'old_value': 4,
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index'
        }), exp_domain.ExplorationChange({
            'new_value': {
                'content_id': 'content',
                'html': '<p>Congratulations, you have finished!</p>'
            },
            'state_name': 'End',
            'old_value': {
                'content_id': 'content',
                'html': ''
            },
            'cmd': 'edit_state_property',
            'property_name': 'content'
        })]
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list_2,
            'Changed Contents and Hint')

        change_list_3 = [exp_domain.ExplorationChange({
            'property_name': 'default_outcome',
            'old_value': {
                'labelled_as_correct': False,
                'missing_prerequisite_skill_id': None,
                'refresher_exploration_id': None,
                'feedback': {
                    'content_id': 'default_outcome',
                    'html': ''
                },
                'param_changes': [

                ],
                'dest': 'End'
            },
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'new_value': {
                'labelled_as_correct': False,
                'missing_prerequisite_skill_id': None,
                'refresher_exploration_id': None,
                'feedback': {
                    'content_id': 'default_outcome',
                    'html': '<p>Feedback 1.</p>'
                },
                'param_changes': [

                ],
                'dest': 'End'
            }
        })]
        changes_are_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 2, change_list_3)
        self.assertEqual(changes_are_mergeable, True)

        # Changes to the answer_groups and the properties that
        # affects or are affected by answer_groups.
        change_list_4 = [exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': [{
                'outcome': {
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': '<p>Feedback</p>'
                    },
                    'missing_prerequisite_skill_id': None,
                    'dest': 'End',
                    'param_changes': [],
                    'labelled_as_correct': False,
                    'refresher_exploration_id': None
                },
                'training_data': [],
                'rule_specs': [{
                    'inputs': {
                        'x': {
                            'normalizedStrSet': [
                                'Hello',
                                'Hola',
                                'Hi'],
                            'contentId': 'rule_input_2'
                        }
                    },
                    'rule_type': 'StartsWith'
                }],
                'tagged_skill_misconception_id': None
            }],
            'cmd': 'edit_state_property',
            'property_name': 'answer_groups',
            'old_value': [{
                'outcome': {
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': '<p>Feedback</p>'
                    },
                    'missing_prerequisite_skill_id': None,
                    'dest': 'End',
                    'param_changes': [],
                    'labelled_as_correct': False,
                    'refresher_exploration_id': None
                },
                'training_data': [],
                'rule_specs': [{
                    'inputs': {
                        'x': {
                            'normalizedStrSet': ['Hello', 'Hola'],
                            'contentId': 'rule_input_2'
                        }
                    },
                    'rule_type': 'StartsWith'
                }],
                'tagged_skill_misconception_id': None
            }]
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': {
                'answer_is_exclusive': False,
                'correct_answer': 'Hi Aryaman!',
                'explanation': {
                    'content_id': 'solution',
                    'html': '<p>Explanation.</p>'
                }
            },
            'cmd': 'edit_state_property',
            'property_name': 'solution',
            'old_value': {
                'answer_is_exclusive': False,
                'correct_answer': 'Hello Aryaman!',
                'explanation': {
                    'content_id': 'solution',
                    'html': '<p>Explanation.</p>'
                }
            }
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': 6,
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index',
            'old_value': 4
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': [{
                'outcome': {
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': '<p>Feedback</p>'
                    },
                    'missing_prerequisite_skill_id': None,
                    'dest': 'End',
                    'param_changes': [],
                    'labelled_as_correct': False,
                    'refresher_exploration_id': None
                },
                'training_data': [],
                'rule_specs': [{
                    'inputs': {
                        'x': {
                            'normalizedStrSet': ['Hello', 'Hola', 'Hi'],
                            'contentId': 'rule_input_2'
                        }
                    },
                    'rule_type': 'StartsWith'
                }],
                'tagged_skill_misconception_id': None
            }, {
                'outcome': {
                    'feedback': {
                        'content_id': 'feedback_4',
                        'html': ''
                    },
                    'missing_prerequisite_skill_id': None,
                    'dest': 'End',
                    'param_changes': [],
                    'labelled_as_correct': False,
                    'refresher_exploration_id': None
                },
                'training_data': [],
                'rule_specs': [{
                    'inputs': {
                        'x': {
                            'normalizedStrSet': ['Oppia', 'GSoC'],
                            'contentId': 'rule_input_5'
                        }
                    },
                    'rule_type': 'Contains'
                }],
                'tagged_skill_misconception_id': None
            }],
            'cmd': 'edit_state_property',
            'property_name': 'answer_groups',
            'old_value': [{
                'outcome': {
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': '<p>Feedback</p>'
                    },
                    'missing_prerequisite_skill_id': None,
                    'dest': 'End',
                    'param_changes': [],
                    'labelled_as_correct': False,
                    'refresher_exploration_id': None
                },
                'training_data': [],
                'rule_specs': [{
                    'inputs': {
                        'x': {
                            'normalizedStrSet': ['Hello', 'Hola', 'Hi'],
                            'contentId': 'rule_input_2'
                        }
                    },
                    'rule_type': 'StartsWith'
                }],
                'tagged_skill_misconception_id': None
            }]
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': {
                'answer_is_exclusive': False,
                'correct_answer': 'Oppia is selected for GSoC.',
                'explanation': {
                    'content_id': 'solution',
                    'html': '<p>Explanation.</p>'
                }
            },
            'cmd': 'edit_state_property',
            'property_name': 'solution',
            'old_value': {
                'answer_is_exclusive': False,
                'correct_answer': 'Hi Aryaman!',
                'explanation': {
                    'content_id': 'solution',
                    'html': '<p>Explanation.</p>'
                }
            }
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'state_name': 'Introduction',
            'property_name': 'solicit_answer_details',
            'new_value': True
        })]

        changes_are_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 2, change_list_4)
        self.assertEqual(changes_are_mergeable, True)

        # Creating second exploration to test the scenario
        # when changes to same properties are made in two
        # different states.
        self.save_new_valid_exploration(
            self.EXP_1_ID, self.owner_id, end_state_name='End')

        rights_manager.publish_exploration(self.owner, self.EXP_1_ID)

        # Using the old change_list_2 and change_list_3 here
        # because they already covers the changes related to
        # the answer_groups in the first state.
        exp_services.update_exploration(
            self.owner_id, self.EXP_1_ID, change_list_2,
            'Added Answer Group and Solution in One state')

        exp_services.update_exploration(
            self.owner_id, self.EXP_1_ID, change_list_3,
            'Changed Answer Groups and Solutions in One State')

        # Changes to the properties related to the answer_groups
        # in the second state to check for mergeability.
        change_list_5 = [exp_domain.ExplorationChange({
            'old_value': 'EndExploration',
            'state_name': 'End',
            'property_name': 'widget_id',
            'cmd': 'edit_state_property',
            'new_value': None
        }), exp_domain.ExplorationChange({
            'old_value': {
                'recommendedExplorationIds': {
                    'value': []
                }
            },
            'state_name': 'End',
            'property_name': 'widget_customization_args',
            'cmd': 'edit_state_property',
            'new_value': {}
        }), exp_domain.ExplorationChange({
            'old_value': 0,
            'state_name': 'End',
            'property_name': 'next_content_id_index',
            'cmd': 'edit_state_property',
            'new_value': 4
        }), exp_domain.ExplorationChange({
            'old_value': None,
            'state_name': 'End',
            'property_name': 'widget_id',
            'cmd': 'edit_state_property',
            'new_value': 'ItemSelectionInput'
        }), exp_domain.ExplorationChange({
            'old_value': {},
            'state_name': 'End',
            'property_name': 'widget_customization_args',
            'cmd': 'edit_state_property',
            'new_value': {
                'minAllowableSelectionCount': {
                    'value': 1
                },
                'choices': {
                    'value': [{
                        'html': '<p>A</p>',
                        'content_id': 'ca_choices_0'
                    }, {
                        'html': '<p>B</p>',
                        'content_id': 'ca_choices_1'
                    }, {
                        'html': '<p>C</p>',
                        'content_id': 'ca_choices_2'
                    }, {
                        'html': '<p>D</p>',
                        'content_id': 'ca_choices_3'
                    }]
                },
                'maxAllowableSelectionCount': {
                    'value': 1
                }
            }
        }), exp_domain.ExplorationChange({
            'old_value': None,
            'state_name': 'End',
            'property_name': 'default_outcome',
            'cmd': 'edit_state_property',
            'new_value': {
                'refresher_exploration_id': None,
                'dest': 'End',
                'missing_prerequisite_skill_id': None,
                'feedback': {
                    'html': '',
                    'content_id': 'default_outcome'
                },
                'param_changes': [],
                'labelled_as_correct': False
            }
        }), exp_domain.ExplorationChange({
            'old_value': 4,
            'state_name': 'End',
            'property_name': 'next_content_id_index',
            'cmd': 'edit_state_property',
            'new_value': 5
        }), exp_domain.ExplorationChange({
            'old_value': [],
            'state_name': 'End',
            'property_name': 'answer_groups',
            'cmd': 'edit_state_property',
            'new_value': [{
                'training_data': [],
                'tagged_skill_misconception_id': None,
                'outcome': {
                    'refresher_exploration_id': None,
                    'dest': 'End',
                    'missing_prerequisite_skill_id': None,
                    'feedback': {
                        'html': '<p>Good</p>',
                        'content_id': 'feedback_4'
                    },
                    'param_changes': [],
                    'labelled_as_correct': False
                },
                'rule_specs': [{
                    'rule_type': 'Equals',
                    'inputs': {
                        'x': ['ca_choices_1']
                    }
                }]
            }]
        })]

        changes_are_mergeable_1 = exp_services.are_changes_mergeable(
            self.EXP_1_ID, 2, change_list_5)
        self.assertEqual(changes_are_mergeable_1, True)

    def test_changes_are_not_mergeable_when_answer_groups_changes_conflict(self): # pylint: disable=line-too-long
        self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, end_state_name='End')

        rights_manager.publish_exploration(self.owner, self.EXP_0_ID)

        # Adding answer_groups and solutions to the existing state.
        change_list = [exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index',
            'old_value': 1,
            'state_name': 'Introduction',
            'new_value': 3
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'property_name': 'answer_groups',
            'old_value': [],
            'state_name': 'Introduction',
            'new_value': [{
                'rule_specs': [{
                    'rule_type': 'StartsWith',
                    'inputs': {
                        'x': {
                            'contentId': 'rule_input_2',
                            'normalizedStrSet': ['Hello', 'Hola']
                        }
                    }
                }],
                'tagged_skill_misconception_id': None,
                'outcome': {
                    'labelled_as_correct': False,
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': '<p>Feedback</p>'
                    },
                    'missing_prerequisite_skill_id': None,
                    'dest': 'End',
                    'param_changes': [],
                    'refresher_exploration_id': None
                },
                'training_data': []
            }]
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'property_name': 'hints',
            'old_value': [],
            'state_name': 'Introduction',
            'new_value': [{
                'hint_content': {
                    'content_id': 'hint_3',
                    'html': '<p>Hint 1.</p>'
                }
            }]
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index',
            'old_value': 3,
            'state_name': 'Introduction',
            'new_value': 4
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'property_name': 'solution',
            'old_value': None,
            'state_name': 'Introduction',
            'new_value': {
                'correct_answer': 'Hello Aryaman!',
                'explanation': {
                    'content_id': 'solution',
                    'html': '<p>Explanation.</p>'
                },
                'answer_is_exclusive': False
            }
        })]

        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list,
            'Added answer groups and solution')

        # Changes to the answer_groups and the properties that
        # affects or are affected by answer_groups.
        change_list_2 = [exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': [{
                'outcome': {
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': '<p>Feedback</p>'
                    },
                    'missing_prerequisite_skill_id': None,
                    'dest': 'End',
                    'param_changes': [],
                    'labelled_as_correct': False,
                    'refresher_exploration_id': None
                },
                'training_data': [],
                'rule_specs': [{
                    'inputs': {
                        'x': {
                            'normalizedStrSet': [
                                'Hello',
                                'Hola',
                                'Hi'],
                            'contentId': 'rule_input_2'
                        }
                    },
                    'rule_type': 'StartsWith'
                }],
                'tagged_skill_misconception_id': None
            }],
            'cmd': 'edit_state_property',
            'property_name': 'answer_groups',
            'old_value': [{
                'outcome': {
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': '<p>Feedback</p>'
                    },
                    'missing_prerequisite_skill_id': None,
                    'dest': 'End',
                    'param_changes': [],
                    'labelled_as_correct': False,
                    'refresher_exploration_id': None
                },
                'training_data': [],
                'rule_specs': [{
                    'inputs': {
                        'x': {
                            'normalizedStrSet': ['Hello', 'Hola'],
                            'contentId': 'rule_input_2'
                        }
                    },
                    'rule_type': 'StartsWith'
                }],
                'tagged_skill_misconception_id': None
            }]
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': {
                'answer_is_exclusive': False,
                'correct_answer': 'Hi Aryaman!',
                'explanation': {
                    'content_id': 'solution',
                    'html': '<p>Explanation.</p>'
                }
            },
            'cmd': 'edit_state_property',
            'property_name': 'solution',
            'old_value': {
                'answer_is_exclusive': False,
                'correct_answer': 'Hello Aryaman!',
                'explanation': {
                    'content_id': 'solution',
                    'html': '<p>Explanation.</p>'
                }
            }
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': 6,
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index',
            'old_value': 4
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': [{
                'outcome': {
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': '<p>Feedback</p>'
                    },
                    'missing_prerequisite_skill_id': None,
                    'dest': 'End',
                    'param_changes': [],
                    'labelled_as_correct': False,
                    'refresher_exploration_id': None
                },
                'training_data': [],
                'rule_specs': [{
                    'inputs': {
                        'x': {
                            'normalizedStrSet': ['Hello', 'Hola', 'Hi'],
                            'contentId': 'rule_input_2'
                        }
                    },
                    'rule_type': 'StartsWith'
                }],
                'tagged_skill_misconception_id': None
            }, {
                'outcome': {
                    'feedback': {
                        'content_id': 'feedback_4',
                        'html': ''
                    },
                    'missing_prerequisite_skill_id': None,
                    'dest': 'End',
                    'param_changes': [],
                    'labelled_as_correct': False,
                    'refresher_exploration_id': None
                },
                'training_data': [],
                'rule_specs': [{
                    'inputs': {
                        'x': {
                            'normalizedStrSet': ['Oppia', 'GSoC'],
                            'contentId': 'rule_input_5'
                        }
                    },
                    'rule_type': 'Contains'
                }],
                'tagged_skill_misconception_id': None
            }],
            'cmd': 'edit_state_property',
            'property_name': 'answer_groups',
            'old_value': [{
                'outcome': {
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': '<p>Feedback</p>'
                    },
                    'missing_prerequisite_skill_id': None,
                    'dest': 'End',
                    'param_changes': [],
                    'labelled_as_correct': False,
                    'refresher_exploration_id': None
                },
                'training_data': [],
                'rule_specs': [{
                    'inputs': {
                        'x': {
                            'normalizedStrSet': ['Hello', 'Hola', 'Hi'],
                            'contentId': 'rule_input_2'
                        }
                    },
                    'rule_type': 'StartsWith'
                }],
                'tagged_skill_misconception_id': None
            }]
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': {
                'answer_is_exclusive': False,
                'correct_answer': 'Oppia is selected for GSoC.',
                'explanation': {
                    'content_id': 'solution',
                    'html': '<p>Explanation.</p>'
                }
            },
            'cmd': 'edit_state_property',
            'property_name': 'solution',
            'old_value': {
                'answer_is_exclusive': False,
                'correct_answer': 'Hi Aryaman!',
                'explanation': {
                    'content_id': 'solution',
                    'html': '<p>Explanation.</p>'
                }
            }
        })]
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list_2,
            'Changed Answer Groups and related properties')

        # Changes to the answer group in same state again
        # to check that changes are not mergeable.
        change_list_3 = [exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': [{
                'outcome': {
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': '<p>Feedback</p>'
                    },
                    'missing_prerequisite_skill_id': None,
                    'dest': 'End',
                    'param_changes': [],
                    'labelled_as_correct': False,
                    'refresher_exploration_id': None
                },
                'training_data': [],
                'rule_specs': [{
                    'inputs': {
                        'x': {
                            'normalizedStrSet': [
                                'Hello',
                                'Hola',
                                'Hey'],
                            'contentId': 'rule_input_2'
                        }
                    },
                    'rule_type': 'StartsWith'
                }],
                'tagged_skill_misconception_id': None
            }],
            'cmd': 'edit_state_property',
            'property_name': 'answer_groups',
            'old_value': [{
                'outcome': {
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': '<p>Feedback</p>'
                    },
                    'missing_prerequisite_skill_id': None,
                    'dest': 'End',
                    'param_changes': [],
                    'labelled_as_correct': False,
                    'refresher_exploration_id': None
                },
                'training_data': [],
                'rule_specs': [{
                    'inputs': {
                        'x': {
                            'normalizedStrSet': ['Hello', 'Hola'],
                            'contentId': 'rule_input_2'
                        }
                    },
                    'rule_type': 'StartsWith'
                }],
                'tagged_skill_misconception_id': None
            }]
        })]
        changes_are_not_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 2, change_list_3)
        self.assertEqual(changes_are_not_mergeable, False)

    def test_changes_are_mergeable_when_solutions_changes_do_not_conflict(self):
        self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, end_state_name='End')

        rights_manager.publish_exploration(self.owner, self.EXP_0_ID)

        # Adding new answer_groups and solutions.
        change_list = [exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index',
            'old_value': 1,
            'state_name': 'Introduction',
            'new_value': 3
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'property_name': 'answer_groups',
            'old_value': [],
            'state_name': 'Introduction',
            'new_value': [{
                'rule_specs': [{
                    'rule_type': 'StartsWith',
                    'inputs': {
                        'x': {
                            'contentId': 'rule_input_2',
                            'normalizedStrSet': [
                                'Hello',
                                'Hola'
                            ]
                        }
                    }
                }],
                'tagged_skill_misconception_id': None,
                'outcome': {
                    'labelled_as_correct': False,
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': '<p>Feedback</p>'
                    },
                    'missing_prerequisite_skill_id': None,
                    'dest': 'End',
                    'param_changes': [],
                    'refresher_exploration_id': None
                },
                'training_data': []
            }]
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'property_name': 'hints',
            'old_value': [],
            'state_name': 'Introduction',
            'new_value': [{
                'hint_content': {
                    'content_id': 'hint_3',
                    'html': '<p>Hint 1.</p>'
                }
            }]
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index',
            'old_value': 3,
            'state_name': 'Introduction',
            'new_value': 4
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'property_name': 'solution',
            'old_value': None,
            'state_name': 'Introduction',
            'new_value': {
                'correct_answer': 'Hello Aryaman!',
                'explanation': {
                    'content_id': 'solution',
                    'html': '<p>Explanation.</p>'
                },
                'answer_is_exclusive': False
            }
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'state_name': 'Introduction',
            'property_name': 'solicit_answer_details',
            'new_value': True
        })]

        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list,
            'Added answer groups and solution')

        # Changes to the properties unrelated to the solutions.
        change_list_2 = [exp_domain.ExplorationChange({
            'new_value': {
                'content_id': 'content',
                'html': '<p>This is the first state.</p>'
            },
            'state_name': 'Introduction',
            'old_value': {
                'content_id': 'content',
                'html': ''
            },
            'cmd': 'edit_state_property',
            'property_name': 'content'
        }), exp_domain.ExplorationChange({
            'new_value': [{
                'hint_content': {
                    'content_id': 'hint_3',
                    'html': '<p>Hint 1.</p>'
                }
            }, {
                'hint_content': {
                    'content_id': 'hint_4',
                    'html': '<p>This is a first hint.</p>'
                }
            }],
            'state_name': 'Introduction',
            'old_value': [{
                'hint_content': {
                    'content_id': 'hint_3',
                    'html': '<p>Hint 1.</p>'
                }
            }],
            'cmd': 'edit_state_property',
            'property_name': 'hints'
        }), exp_domain.ExplorationChange({
            'new_value': 5,
            'state_name': 'Introduction',
            'old_value': 4,
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index'
        }), exp_domain.ExplorationChange({
            'new_value': {
                'content_id': 'content',
                'html': '<p>Congratulations, you have finished!</p>'
            },
            'state_name': 'End',
            'old_value': {
                'content_id': 'content',
                'html': ''
            },
            'cmd': 'edit_state_property',
            'property_name': 'content'
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'state_name': 'Introduction',
            'property_name': 'solicit_answer_details',
            'new_value': True
        })]
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list_2,
            'Changed Contents and Hint')

        # Changes to the solutions and the properties that affects
        # solutions to check for mergeability.
        change_list_3 = [exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': [{
                'outcome': {
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': '<p>Feedback</p>'
                    },
                    'missing_prerequisite_skill_id': None,
                    'dest': 'End',
                    'param_changes': [],
                    'labelled_as_correct': False,
                    'refresher_exploration_id': None
                },
                'training_data': [],
                'rule_specs': [{
                    'inputs': {
                        'x': {
                            'normalizedStrSet': ['Hello', 'Hola', 'Hi'],
                            'contentId': 'rule_input_2'
                        }
                    },
                    'rule_type': 'StartsWith'
                }],
                'tagged_skill_misconception_id': None
            }],
            'cmd': 'edit_state_property',
            'property_name': 'answer_groups',
            'old_value': [{
                'outcome': {
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': '<p>Feedback</p>'
                    },
                    'missing_prerequisite_skill_id': None,
                    'dest': 'End',
                    'param_changes': [],
                    'labelled_as_correct': False,
                    'refresher_exploration_id': None
                },
                'training_data': [],
                'rule_specs': [{
                    'inputs': {
                        'x': {
                            'normalizedStrSet': ['Hello', 'Hola'],
                            'contentId': 'rule_input_2'
                        }
                    },
                    'rule_type': 'StartsWith'
                }],
                'tagged_skill_misconception_id': None
            }]
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': {
                'answer_is_exclusive': False,
                'correct_answer': 'Hi Aryaman!',
                'explanation': {
                    'content_id': 'solution',
                    'html': '<p>Explanation.</p>'
                }
            },
            'cmd': 'edit_state_property',
            'property_name': 'solution',
            'old_value': {
                'answer_is_exclusive': False,
                'correct_answer': 'Hello Aryaman!',
                'explanation': {
                    'content_id': 'solution',
                    'html': '<p>Explanation.</p>'
                }
            }
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': 6,
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index',
            'old_value': 4
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': [{
                'outcome': {
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': '<p>Feedback</p>'
                    },
                    'missing_prerequisite_skill_id': None,
                    'dest': 'End',
                    'param_changes': [],
                    'labelled_as_correct': False,
                    'refresher_exploration_id': None
                },
                'training_data': [],
                'rule_specs': [{
                    'inputs': {
                        'x': {
                            'normalizedStrSet': ['Hello', 'Hola', 'Hi'],
                            'contentId': 'rule_input_2'
                        }
                    },
                    'rule_type': 'StartsWith'
                }],
                'tagged_skill_misconception_id': None
            }, {
                'outcome': {
                    'feedback': {
                        'content_id': 'feedback_4',
                        'html': ''
                    },
                    'missing_prerequisite_skill_id': None,
                    'dest': 'End',
                    'param_changes': [],
                    'labelled_as_correct': False,
                    'refresher_exploration_id': None
                },
                'training_data': [],
                'rule_specs': [{
                    'inputs': {
                        'x': {
                            'normalizedStrSet': ['Oppia', 'GSoC'],
                            'contentId': 'rule_input_5'
                        }
                    },
                    'rule_type': 'Contains'
                }],
                'tagged_skill_misconception_id': None
            }],
            'cmd': 'edit_state_property',
            'property_name': 'answer_groups',
            'old_value': [{
                'outcome': {
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': '<p>Feedback</p>'
                    },
                    'missing_prerequisite_skill_id': None,
                    'dest': 'End',
                    'param_changes': [],
                    'labelled_as_correct': False,
                    'refresher_exploration_id': None
                },
                'training_data': [],
                'rule_specs': [{
                    'inputs': {
                        'x': {
                            'normalizedStrSet': ['Hello', 'Hola', 'Hi'],
                            'contentId': 'rule_input_2'
                        }
                    },
                    'rule_type': 'StartsWith'
                }],
                'tagged_skill_misconception_id': None
            }]
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': {
                'answer_is_exclusive': False,
                'correct_answer': 'Oppia is selected for GSoC.',
                'explanation': {
                    'content_id': 'solution',
                    'html': '<p>Explanation.</p>'
                }
            },
            'cmd': 'edit_state_property',
            'property_name': 'solution',
            'old_value': {
                'answer_is_exclusive': False,
                'correct_answer': 'Hi Aryaman!',
                'explanation': {
                    'content_id': 'solution',
                    'html': '<p>Explanation.</p>'
                }
            }
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'state_name': 'Introduction',
            'property_name': 'solicit_answer_details',
            'new_value': False
        })]

        changes_are_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 2, change_list_3)
        self.assertEqual(changes_are_mergeable, True)

        # Creating second exploration to test the scenario
        # when changes to same properties are made in two
        # different states.
        self.save_new_valid_exploration(
            self.EXP_1_ID, self.owner_id, end_state_name='End')

        rights_manager.publish_exploration(self.owner, self.EXP_1_ID)

        # Using the old change_list_2 and change_list_3 here
        # because they already covers the changes related to
        # the solutions in the first state.
        exp_services.update_exploration(
            self.owner_id, self.EXP_1_ID, change_list_2,
            'Added Answer Group and Solution in One state')

        exp_services.update_exploration(
            self.owner_id, self.EXP_1_ID, change_list_3,
            'Changed Answer Groups and Solutions in One State')

        # Changes to the properties related to the solutions
        # in the second state to check for mergeability.
        change_list_4 = [exp_domain.ExplorationChange({
            'old_value': 'EndExploration',
            'new_value': None,
            'cmd': 'edit_state_property',
            'property_name': 'widget_id',
            'state_name': 'End'
        }), exp_domain.ExplorationChange({
            'old_value': {
                'recommendedExplorationIds': {
                    'value': []
                }
            },
            'new_value': {},
            'cmd': 'edit_state_property',
            'property_name': 'widget_customization_args',
            'state_name': 'End'
        }), exp_domain.ExplorationChange({
            'old_value': None,
            'new_value': 'NumericInput',
            'cmd': 'edit_state_property',
            'property_name': 'widget_id',
            'state_name': 'End'
        }), exp_domain.ExplorationChange({
            'old_value': None,
            'new_value': {
                'dest': 'End',
                'missing_prerequisite_skill_id': None,
                'param_changes': [],
                'labelled_as_correct': False,
                'refresher_exploration_id': None,
                'feedback': {
                    'html': '',
                    'content_id': 'default_outcome'
                }
            },
            'cmd': 'edit_state_property',
            'property_name': 'default_outcome',
            'state_name': 'End'
        }), exp_domain.ExplorationChange({
            'old_value': 0,
            'new_value': 1,
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index',
            'state_name': 'End'
        }), exp_domain.ExplorationChange({
            'old_value': [],
            'new_value': [{
                'outcome': {
                    'dest': 'End',
                    'missing_prerequisite_skill_id': None,
                    'param_changes': [],
                    'labelled_as_correct': False,
                    'refresher_exploration_id': None,
                    'feedback': {
                        'html': '<p>Good</p>',
                        'content_id': 'feedback_0'
                    }
                },
                'training_data': [],
                'tagged_skill_misconception_id': None,
                'rule_specs': [{
                    'rule_type': 'IsGreaterThanOrEqualTo',
                    'inputs': {
                        'x': 20
                    }
                }]
            }],
            'cmd': 'edit_state_property',
            'property_name': 'answer_groups',
            'state_name': 'End'
        }), exp_domain.ExplorationChange({
            'old_value': [],
            'new_value': [{
                'hint_content': {
                    'html': '<p>Hint 1. State 2.</p>',
                    'content_id': 'hint_1'
                }
            }],
            'cmd': 'edit_state_property',
            'property_name': 'hints',
            'state_name': 'End'
        }), exp_domain.ExplorationChange({
            'old_value': 1,
            'new_value': 2,
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index',
            'state_name': 'End'
        }), exp_domain.ExplorationChange({
            'old_value': None,
            'new_value': {
                'correct_answer': 30,
                'explanation': {
                    'html': '<p>Explanation.</p>',
                    'content_id': 'solution'
                },
                'answer_is_exclusive': False
            },
            'cmd': 'edit_state_property',
            'property_name': 'solution',
            'state_name': 'End'
        }), exp_domain.ExplorationChange({
            'old_value': {
                'correct_answer': 30,
                'explanation': {
                    'html': '<p>Explanation.</p>',
                    'content_id': 'solution'
                },
                'answer_is_exclusive': False
            },
            'new_value': {
                'correct_answer': 10,
                'explanation': {
                    'html': '<p>Explanation.</p>',
                    'content_id': 'solution'
                },
                'answer_is_exclusive': False
            },
            'cmd': 'edit_state_property',
            'property_name': 'solution',
            'state_name': 'End'
        })]

        changes_are_mergeable_1 = exp_services.are_changes_mergeable(
            self.EXP_1_ID, 2, change_list_4)
        self.assertEqual(changes_are_mergeable_1, True)

    def test_changes_are_not_mergeable_when_solutions_changes_conflict(self):
        self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, end_state_name='End')

        rights_manager.publish_exploration(self.owner, self.EXP_0_ID)

        # Adding new answer_groups and solutions.
        change_list = [exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index',
            'old_value': 1,
            'state_name': 'Introduction',
            'new_value': 3
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'property_name': 'answer_groups',
            'old_value': [],
            'state_name': 'Introduction',
            'new_value': [{
                'rule_specs': [{
                    'rule_type': 'StartsWith',
                    'inputs': {
                        'x': {
                            'contentId': 'rule_input_2',
                            'normalizedStrSet': [
                                'Hello',
                                'Hola'
                            ]
                        }
                    }
                }],
                'tagged_skill_misconception_id': None,
                'outcome': {
                    'labelled_as_correct': False,
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': '<p>Feedback</p>'
                    },
                    'missing_prerequisite_skill_id': None,
                    'dest': 'End',
                    'param_changes': [],
                    'refresher_exploration_id': None
                },
                'training_data': []
            }]
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'property_name': 'hints',
            'old_value': [],
            'state_name': 'Introduction',
            'new_value': [{
                'hint_content': {
                    'content_id': 'hint_3',
                    'html': '<p>Hint 1.</p>'
                }
            }]
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index',
            'old_value': 3,
            'state_name': 'Introduction',
            'new_value': 4
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'property_name': 'solution',
            'old_value': None,
            'state_name': 'Introduction',
            'new_value': {
                'correct_answer': 'Hello Aryaman!',
                'explanation': {
                    'content_id': 'solution',
                    'html': '<p>Explanation.</p>'
                },
                'answer_is_exclusive': False
            }
        })]

        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list,
            'Added answer groups and solution')

        # Changes to the solutions and the properties that affects
        # solutions to check for mergeability.
        change_list_2 = [exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': [{
                'outcome': {
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': '<p>Feedback</p>'
                    },
                    'missing_prerequisite_skill_id': None,
                    'dest': 'End',
                    'param_changes': [],
                    'labelled_as_correct': False,
                    'refresher_exploration_id': None
                },
                'training_data': [],
                'rule_specs': [{
                    'inputs': {
                        'x': {
                            'normalizedStrSet': ['Hello', 'Hola', 'Hi'],
                            'contentId': 'rule_input_2'
                        }
                    },
                    'rule_type': 'StartsWith'
                }],
                'tagged_skill_misconception_id': None
            }],
            'cmd': 'edit_state_property',
            'property_name': 'answer_groups',
            'old_value': [{
                'outcome': {
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': '<p>Feedback</p>'
                    },
                    'missing_prerequisite_skill_id': None,
                    'dest': 'End',
                    'param_changes': [],
                    'labelled_as_correct': False,
                    'refresher_exploration_id': None
                },
                'training_data': [],
                'rule_specs': [{
                    'inputs': {
                        'x': {
                            'normalizedStrSet': ['Hello', 'Hola'],
                            'contentId': 'rule_input_2'
                        }
                    },
                    'rule_type': 'StartsWith'
                }],
                'tagged_skill_misconception_id': None
            }]
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': {
                'answer_is_exclusive': False,
                'correct_answer': 'Hi Aryaman!',
                'explanation': {
                    'content_id': 'solution',
                    'html': '<p>Explanation.</p>'
                }
            },
            'cmd': 'edit_state_property',
            'property_name': 'solution',
            'old_value': {
                'answer_is_exclusive': False,
                'correct_answer': 'Hello Aryaman!',
                'explanation': {
                    'content_id': 'solution',
                    'html': '<p>Explanation.</p>'
                }
            }
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': 6,
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index',
            'old_value': 4
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': [{
                'outcome': {
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': '<p>Feedback</p>'
                    },
                    'missing_prerequisite_skill_id': None,
                    'dest': 'End',
                    'param_changes': [],
                    'labelled_as_correct': False,
                    'refresher_exploration_id': None
                },
                'training_data': [],
                'rule_specs': [{
                    'inputs': {
                        'x': {
                            'normalizedStrSet': ['Hello', 'Hola', 'Hi'],
                            'contentId': 'rule_input_2'
                        }
                    },
                    'rule_type': 'StartsWith'
                }],
                'tagged_skill_misconception_id': None
            }, {
                'outcome': {
                    'feedback': {
                        'content_id': 'feedback_4',
                        'html': ''
                    },
                    'missing_prerequisite_skill_id': None,
                    'dest': 'End',
                    'param_changes': [],
                    'labelled_as_correct': False,
                    'refresher_exploration_id': None
                },
                'training_data': [],
                'rule_specs': [{
                    'inputs': {
                        'x': {
                            'normalizedStrSet': ['Oppia', 'GSoC'],
                            'contentId': 'rule_input_5'
                        }
                    },
                    'rule_type': 'Contains'
                }],
                'tagged_skill_misconception_id': None
            }],
            'cmd': 'edit_state_property',
            'property_name': 'answer_groups',
            'old_value': [{
                'outcome': {
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': '<p>Feedback</p>'
                    },
                    'missing_prerequisite_skill_id': None,
                    'dest': 'End',
                    'param_changes': [],
                    'labelled_as_correct': False,
                    'refresher_exploration_id': None
                },
                'training_data': [],
                'rule_specs': [{
                    'inputs': {
                        'x': {
                            'normalizedStrSet': ['Hello', 'Hola', 'Hi'],
                            'contentId': 'rule_input_2'
                        }
                    },
                    'rule_type': 'StartsWith'
                }],
                'tagged_skill_misconception_id': None
            }]
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': {
                'answer_is_exclusive': False,
                'correct_answer': 'Oppia is selected for GSoC.',
                'explanation': {
                    'content_id': 'solution',
                    'html': '<p>Explanation.</p>'
                }
            },
            'cmd': 'edit_state_property',
            'property_name': 'solution',
            'old_value': {
                'answer_is_exclusive': False,
                'correct_answer': 'Hi Aryaman!',
                'explanation': {
                    'content_id': 'solution',
                    'html': '<p>Explanation.</p>'
                }
            }
        })]
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list_2,
            'Changed Solutions and affected properties')

        # Change to the solution of same state again
        # to check that changes are not mergeable.
        change_list_3 = [exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': {
                'answer_is_exclusive': False,
                'correct_answer': 'Hello Aryaman!',
                'explanation': {
                    'content_id': 'solution',
                    'html': '<p>Explanation.</p>'
                }
            },
            'cmd': 'edit_state_property',
            'property_name': 'solution',
            'old_value': {
                'answer_is_exclusive': False,
                'correct_answer': 'Hello Aryaman!',
                'explanation': {
                    'content_id': 'solution',
                    'html': '<p>Changed Explanation.</p>'
                }
            }
        })]

        changes_are_not_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 2, change_list_3)
        self.assertEqual(changes_are_not_mergeable, False)

    def test_changes_are_mergeable_when_hints_changes_do_not_conflict(self):
        self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, end_state_name='End')

        # Adding hints to the existing state.
        rights_manager.publish_exploration(self.owner, self.EXP_0_ID)
        change_list = [exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': [{
                'hint_content': {
                    'html': '<p>Hint 1.</p>',
                    'content_id': 'hint_1'
                }
            }],
            'property_name': 'hints',
            'cmd': 'edit_state_property',
            'old_value': []
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': 2,
            'property_name': 'next_content_id_index',
            'cmd': 'edit_state_property',
            'old_value': 1
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': {
                'answer_is_exclusive': False,
                'explanation': {
                    'html': '<p>Explanation</p>',
                    'content_id': 'solution'
                },
                'correct_answer': 'Hello'
            },
            'property_name': 'solution',
            'cmd': 'edit_state_property',
            'old_value': None
        })]

        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list,
            'Added Hint and Solution in Introduction state')

        # Changes to all state propeties other than the hints.
        change_list_2 = [exp_domain.ExplorationChange({
            'property_name': 'content',
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'old_value': {
                'html': '',
                'content_id': 'content'
            },
            'new_value': {
                'html': '<p>Content in Introduction.</p>',
                'content_id': 'content'
            }
        }), exp_domain.ExplorationChange({
            'property_name': 'solution',
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'old_value': {
                'explanation': {
                    'html': '<p>Explanation</p>',
                    'content_id': 'solution'
                },
                'answer_is_exclusive': False,
                'correct_answer': 'Hello'
            },
            'new_value': {
                'explanation': {
                    'html': '<p>Explanation</p>',
                    'content_id': 'solution'
                },
                'answer_is_exclusive': False,
                'correct_answer': 'Hello Aryaman'
            }
        }), exp_domain.ExplorationChange({
            'property_name': 'widget_id',
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'old_value': 'TextInput',
            'new_value': None
        }), exp_domain.ExplorationChange({
            'property_name': 'widget_customization_args',
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'old_value': {
                'placeholder': {
                    'value': {
                        'content_id': 'ca_placeholder_0',
                        'unicode_str': ''
                    }
                },
                'rows': {
                    'value': 1
                }
            },
            'new_value': {}
        }), exp_domain.ExplorationChange({
            'property_name': 'solution',
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'old_value': {
                'explanation': {
                    'html': '<p>Explanation</p>',
                    'content_id': 'solution'
                },
                'answer_is_exclusive': False,
                'correct_answer': 'Hello Aryaman'
            },
            'new_value': None
        }), exp_domain.ExplorationChange({
            'property_name': 'widget_id',
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'old_value': None,
            'new_value': 'NumericInput'
        }), exp_domain.ExplorationChange({
            'property_name': 'next_content_id_index',
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'old_value': 2,
            'new_value': 3
        }), exp_domain.ExplorationChange({
            'property_name': 'answer_groups',
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'old_value': [],
            'new_value': [{
                'rule_specs': [{
                    'inputs': {
                        'x': 46
                    },
                    'rule_type': 'IsLessThanOrEqualTo'
                }],
                'training_data': [],
                'tagged_skill_misconception_id': None,
                'outcome': {
                    'labelled_as_correct': False,
                    'refresher_exploration_id': None,
                    'missing_prerequisite_skill_id': None,
                    'dest': 'End',
                    'feedback': {
                        'html': '',
                        'content_id': 'feedback_2'
                    },
                    'param_changes': []
                }
            }]
        }), exp_domain.ExplorationChange({
            'property_name': 'solution',
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'old_value': None,
            'new_value': {
                'explanation': {
                    'html': '<p>Explanation</p>',
                    'content_id': 'solution'
                },
                'answer_is_exclusive': False,
                'correct_answer': 42
            }
        }), exp_domain.ExplorationChange({
            'property_name': 'content',
            'state_name': 'End',
            'cmd': 'edit_state_property',
            'old_value': {
                'html': '',
                'content_id': 'content'
            },
            'new_value': {
                'html': '<p>Congratulations, you have finished!</p>',
                'content_id': 'content'
            }
        }), exp_domain.ExplorationChange({
            'property_name': 'title',
            'cmd': 'edit_exploration_property',
            'old_value': 'A title',
            'new_value': 'First Title'
        }), exp_domain.ExplorationChange({
            'property_name': 'solution',
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'old_value': {
                'explanation': {
                    'html': '<p>Explanation</p>',
                    'content_id': 'solution'
                },
                'answer_is_exclusive': False,
                'correct_answer': 42
            },
            'new_value': {
                'explanation': {
                    'html': '<p>Explanation</p>',
                    'content_id': 'solution'
                },
                'answer_is_exclusive': False,
                'correct_answer': 40
            }
        })]

        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list_2,
            'Made changes in interaction, contents, solutions, answer_groups in both states') # pylint: disable=line-too-long

        # Changes to the old hints and also deleted and added
        # new hints to take all the cases to check for mergeability.
        change_list_3 = [exp_domain.ExplorationChange({
            'old_value': [{
                'hint_content': {
                    'html': '<p>Hint 1.</p>',
                    'content_id': 'hint_1'
                }
            }],
            'cmd': 'edit_state_property',
            'property_name': 'hints',
            'new_value': [{
                'hint_content': {
                    'html': '<p>Hint 1.</p>',
                    'content_id': 'hint_1'
                }
            }, {
                'hint_content': {
                    'html': '<p>Hint 2.</p>',
                    'content_id': 'hint_2'
                }
            }],
            'state_name': 'Introduction'
        }), exp_domain.ExplorationChange({
            'old_value': 2,
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index',
            'new_value': 3,
            'state_name': 'Introduction'
        }), exp_domain.ExplorationChange({
            'old_value': [{
                'hint_content': {
                    'html': '<p>Hint 1.</p>',
                    'content_id': 'hint_1'
                }
            }, {
                'hint_content': {
                    'html': '<p>Hint 2.</p>',
                    'content_id': 'hint_2'
                }
            }],
            'cmd': 'edit_state_property',
            'property_name': 'hints',
            'new_value': [{
                'hint_content': {
                    'html': '<p>Changed hint 1.</p>',
                    'content_id': 'hint_1'
                }
            }, {
                'hint_content': {
                    'html': '<p>Hint 2.</p>',
                    'content_id': 'hint_2'
                }
            }],
            'state_name': 'Introduction'
        }), exp_domain.ExplorationChange({
            'old_value': [{
                'hint_content': {
                    'html': '<p>Changed hint 1.</p>',
                    'content_id': 'hint_1'
                }
            }, {
                'hint_content': {
                    'html': '<p>Hint 2.</p>',
                    'content_id': 'hint_2'
                }
            }],
            'cmd': 'edit_state_property',
            'property_name': 'hints',
            'new_value': [
                {
                    'hint_content': {
                        'html': '<p>Hint 2.</p>',
                        'content_id': 'hint_2'
                    }
                }, {
                    'hint_content': {
                        'html': '<p>Changed hint 1.</p>',
                        'content_id': 'hint_1'
                    }
                }
            ],
            'state_name': 'Introduction'
        })]

        changes_are_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 2, change_list_3)
        self.assertEqual(changes_are_mergeable, True)

    def test_changes_are_not_mergeable_when_hints_changes_conflict(self):
        self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, end_state_name='End')

        # Adding hints to the existing state.
        rights_manager.publish_exploration(self.owner, self.EXP_0_ID)
        change_list = [exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': [{
                'hint_content': {
                    'html': '<p>Hint 1.</p>',
                    'content_id': 'hint_1'
                }
            }],
            'property_name': 'hints',
            'cmd': 'edit_state_property',
            'old_value': []
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': 2,
            'property_name': 'next_content_id_index',
            'cmd': 'edit_state_property',
            'old_value': 1
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': {
                'answer_is_exclusive': False,
                'explanation': {
                    'html': '<p>Explanation</p>',
                    'content_id': 'solution'
                },
                'correct_answer': 'Hello'
            },
            'property_name': 'solution',
            'cmd': 'edit_state_property',
            'old_value': None
        })]

        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list,
            'Added Hint and Solution in Introduction state')

        # Changes to the old hints and also deleted and added
        # new hints to take all the cases to check for mergeability.
        change_list_2 = [exp_domain.ExplorationChange({
            'old_value': [{
                'hint_content': {
                    'html': '<p>Hint 1.</p>',
                    'content_id': 'hint_1'
                }
            }],
            'cmd': 'edit_state_property',
            'property_name': 'hints',
            'new_value': [{
                'hint_content': {
                    'html': '<p>Hint 1.</p>',
                    'content_id': 'hint_1'
                }
            }, {
                'hint_content': {
                    'html': '<p>Hint 2.</p>',
                    'content_id': 'hint_2'
                }
            }],
            'state_name': 'Introduction'
        }), exp_domain.ExplorationChange({
            'old_value': 2,
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index',
            'new_value': 3,
            'state_name': 'Introduction'
        }), exp_domain.ExplorationChange({
            'old_value': [{
                'hint_content': {
                    'html': '<p>Hint 1.</p>',
                    'content_id': 'hint_1'
                }
            }, {
                'hint_content': {
                    'html': '<p>Hint 2.</p>',
                    'content_id': 'hint_2'
                }
            }],
            'cmd': 'edit_state_property',
            'property_name': 'hints',
            'new_value': [{
                'hint_content': {
                    'html': '<p>Changed hint 1.</p>',
                    'content_id': 'hint_1'
                }
            }, {
                'hint_content': {
                    'html': '<p>Hint 2.</p>',
                    'content_id': 'hint_2'
                }
            }],
            'state_name': 'Introduction'
        }), exp_domain.ExplorationChange({
            'old_value': [{
                'hint_content': {
                    'html': '<p>Changed hint 1.</p>',
                    'content_id': 'hint_1'
                }
            }, {
                'hint_content': {
                    'html': '<p>Hint 2.</p>',
                    'content_id': 'hint_2'
                }
            }],
            'cmd': 'edit_state_property',
            'property_name': 'hints',
            'new_value': [
                {
                    'hint_content': {
                        'html': '<p>Hint 2.</p>',
                        'content_id': 'hint_2'
                    }
                }, {
                    'hint_content': {
                        'html': '<p>Changed hint 1.</p>',
                        'content_id': 'hint_1'
                    }
                }
            ],
            'state_name': 'Introduction'
        })]
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list_2,
            'Changes in the hints again.')

        change_list_3 = [exp_domain.ExplorationChange({
            'old_value': [{
                'hint_content': {
                    'html': '<p>Hint 1.</p>',
                    'content_id': 'hint_1'
                }
            }],
            'cmd': 'edit_state_property',
            'property_name': 'hints',
            'new_value': [{
                'hint_content': {
                    'html': '<p>Changed Hint 1.</p>',
                    'content_id': 'hint_1'
                }
            }],
            'state_name': 'Introduction'
        })]

        changes_are_not_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 2, change_list_3)
        self.assertEqual(changes_are_not_mergeable, False)

    def test_changes_are_mergeable_when_exploration_properties_changes_do_not_conflict(self): # pylint: disable=line-too-long
        self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, end_state_name='End')

        rights_manager.publish_exploration(self.owner, self.EXP_0_ID)

        # Changes to all the properties of both states other than
        # exploration properties i.e. title, category, objective etc.
        # Also included rename states changes to check that
        # renaming states doesn't affect anything.
        change_list = [exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': {
                'html': '<p>Content</p>',
                'content_id': 'content'
            },
            'cmd': 'edit_state_property',
            'property_name': 'content',
            'old_value': {
                'html': '',
                'content_id': 'content'
            }
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': [
                {
                    'hint_content': {
                        'html': '<p>Hint 1.</p>',
                        'content_id': 'hint_1'
                    }
                }
            ],
            'cmd': 'edit_state_property',
            'property_name': 'hints',
            'old_value': [

            ]
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': 2,
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index',
            'old_value': 1
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': None,
            'cmd': 'edit_state_property',
            'property_name': 'widget_id',
            'old_value': 'TextInput'
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': {},
            'cmd': 'edit_state_property',
            'property_name': 'widget_customization_args',
            'old_value': {
                'rows': {
                    'value': 1
                },
                'placeholder': {
                    'value': {
                        'unicode_str': '',
                        'content_id': 'ca_placeholder_0'
                    }
                }
            }
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': 'NumericInput',
            'cmd': 'edit_state_property',
            'property_name': 'widget_id',
            'old_value': None
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': 3,
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index',
            'old_value': 2
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': [
                {
                    'outcome': {
                        'refresher_exploration_id': None,
                        'feedback': {
                            'html': '<p>Good.</p>',
                            'content_id': 'feedback_2'
                        },
                        'missing_prerequisite_skill_id': None,
                        'labelled_as_correct': False,
                        'dest': 'End',
                        'param_changes': []
                    },
                    'training_data': [],
                    'rule_specs': [
                        {
                            'inputs': {
                                'x': 50
                            },
                            'rule_type': 'IsLessThanOrEqualTo'
                        }
                    ],
                    'tagged_skill_misconception_id': None
                }
            ],
            'cmd': 'edit_state_property',
            'property_name': 'answer_groups',
            'old_value': [

            ]
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': {
                'refresher_exploration_id': None,
                'feedback': {
                    'html': '<p>Try Again.</p>',
                    'content_id': 'default_outcome'
                },
                'missing_prerequisite_skill_id': None,
                'labelled_as_correct': False,
                'dest': 'End',
                'param_changes': []
            },
            'cmd': 'edit_state_property',
            'property_name': 'default_outcome',
            'old_value': {
                'refresher_exploration_id': None,
                'feedback': {
                    'html': '',
                    'content_id': 'default_outcome'
                },
                'missing_prerequisite_skill_id': None,
                'labelled_as_correct': False,
                'dest': 'End',
                'param_changes': [

                ]
            }
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': {
                'refresher_exploration_id': None,
                'feedback': {
                    'html': '<p>Try Again.</p>',
                    'content_id': 'default_outcome'
                },
                'missing_prerequisite_skill_id': None,
                'labelled_as_correct': False,
                'dest': 'Introduction',
                'param_changes': [

                ]
            },
            'cmd': 'edit_state_property',
            'property_name': 'default_outcome',
            'old_value': {
                'refresher_exploration_id': None,
                'feedback': {
                    'html': '<p>Try Again.</p>',
                    'content_id': 'default_outcome'
                },
                'missing_prerequisite_skill_id': None,
                'labelled_as_correct': False,
                'dest': 'End',
                'param_changes': [

                ]
            }
        })]
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list,
            'Made changes in interaction, contents, solutions, answer_groups in introduction state.') # pylint: disable=line-too-long

        # Changes to properties of second state.
        change_list_2 = [exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': {
                'answer_is_exclusive': False,
                'correct_answer': 25,
                'explanation': {
                    'html': '<p>Explanation.</p>',
                    'content_id': 'solution'
                }
            },
            'cmd': 'edit_state_property',
            'property_name': 'solution',
            'old_value': None
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': [
                {
                    'hint_content': {
                        'html': '<p>Hint 1.</p>',
                        'content_id': 'hint_1'
                    }
                },
                {
                    'hint_content': {
                        'html': '<p>Hint 2.</p>',
                        'content_id': 'hint_3'
                    }
                }
            ],
            'cmd': 'edit_state_property',
            'property_name': 'hints',
            'old_value': [{
                'hint_content': {
                    'html': '<p>Hint 1.</p>',
                    'content_id': 'hint_1'
                }
            }]
        }), exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'new_value': 4,
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index',
            'old_value': 3
        }), exp_domain.ExplorationChange({
            'state_name': 'End',
            'new_value': {
                'html': '<p>Congratulations, you have finished!</p>',
                'content_id': 'content'
            },
            'cmd': 'edit_state_property',
            'property_name': 'content',
            'old_value': {
                'html': '',
                'content_id': 'content'
            }
        }), exp_domain.ExplorationChange({
            'new_state_name': 'End-State',
            'cmd': 'rename_state',
            'old_state_name': 'End'
        })]

        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list_2,
            'Made changes in solutions in introduction state and content, state_name in end state.') # pylint: disable=line-too-long

        # Changes to the exploration properties to check
        # for mergeability.
        change_list_3 = [exp_domain.ExplorationChange({
            'property_name': 'title',
            'cmd': 'edit_exploration_property',
            'old_value': 'A title',
            'new_value': 'A changed title.'
        }), exp_domain.ExplorationChange({
            'property_name': 'objective',
            'cmd': 'edit_exploration_property',
            'old_value': 'An objective',
            'new_value': 'A changed objective.'
        }), exp_domain.ExplorationChange({
            'property_name': 'category',
            'cmd': 'edit_exploration_property',
            'old_value': 'A category',
            'new_value': 'A changed category'
        }), exp_domain.ExplorationChange({
            'property_name': 'auto_tts_enabled',
            'cmd': 'edit_exploration_property',
            'old_value': True,
            'new_value': False
        }), exp_domain.ExplorationChange({
            'property_name': 'tags',
            'cmd': 'edit_exploration_property',
            'old_value': [

            ],
            'new_value': [
                'new'
            ]
        }), exp_domain.ExplorationChange({
            'property_name': 'tags',
            'cmd': 'edit_exploration_property',
            'old_value': [
                'new'
            ],
            'new_value': [
                'new',
                'skill'
            ]
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_exploration_property',
            'property_name': 'language_code',
            'new_value': 'bn',
            'old_value': 'en'
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_exploration_property',
            'property_name': 'author_notes',
            'new_value': 'author_notes'
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_exploration_property',
            'property_name': 'blurb',
            'new_value': 'blurb'
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_exploration_property',
            'property_name': 'init_state_name',
            'new_value': 'End',
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_exploration_property',
            'property_name': 'init_state_name',
            'new_value': 'Introduction',
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_exploration_property',
            'property_name': 'auto_tts_enabled',
            'new_value': False
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_exploration_property',
            'property_name': 'correctness_feedback_enabled',
            'new_value': True
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'property_name': 'confirmed_unclassified_answers',
            'state_name': 'Introduction',
            'new_value': ['test']
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'state_name': 'Introduction',
            'property_name': 'linked_skill_id',
            'new_value': 'string_1'
        }), exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'state_name': 'Introduction',
            'property_name': 'card_is_checkpoint',
            'new_value': True
        })]
        changes_are_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 1, change_list_3)
        self.assertEqual(changes_are_mergeable, True)

    def test_changes_are_not_mergeable_when_exploration_properties_changes_conflict(self): # pylint: disable=line-too-long
        self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, end_state_name='End')

        rights_manager.publish_exploration(self.owner, self.EXP_0_ID)

        # Changes to the exploration properties to check
        # for mergeability.
        change_list = [exp_domain.ExplorationChange({
            'property_name': 'title',
            'cmd': 'edit_exploration_property',
            'old_value': 'A title',
            'new_value': 'A changed title.'
        }), exp_domain.ExplorationChange({
            'property_name': 'objective',
            'cmd': 'edit_exploration_property',
            'old_value': 'An objective',
            'new_value': 'A changed objective.'
        }), exp_domain.ExplorationChange({
            'property_name': 'category',
            'cmd': 'edit_exploration_property',
            'old_value': 'A category',
            'new_value': 'A changed category'
        }), exp_domain.ExplorationChange({
            'property_name': 'auto_tts_enabled',
            'cmd': 'edit_exploration_property',
            'old_value': True,
            'new_value': False
        }), exp_domain.ExplorationChange({
            'property_name': 'tags',
            'cmd': 'edit_exploration_property',
            'old_value': [

            ],
            'new_value': [
                'new'
            ]
        }), exp_domain.ExplorationChange({
            'property_name': 'tags',
            'cmd': 'edit_exploration_property',
            'old_value': [
                'new'
            ],
            'new_value': [
                'new',
                'skill'
            ]
        })]

        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list,
            'Changes in the Exploration Properties.')

        change_list_2 = [exp_domain.ExplorationChange({
            'property_name': 'title',
            'cmd': 'edit_exploration_property',
            'old_value': 'A title',
            'new_value': 'A new title.'
        }), exp_domain.ExplorationChange({
            'property_name': 'objective',
            'cmd': 'edit_exploration_property',
            'old_value': 'An objective',
            'new_value': 'A new objective.'
        }), exp_domain.ExplorationChange({
            'property_name': 'category',
            'cmd': 'edit_exploration_property',
            'old_value': 'A category',
            'new_value': 'A new category'
        }), exp_domain.ExplorationChange({
            'property_name': 'auto_tts_enabled',
            'cmd': 'edit_exploration_property',
            'old_value': True,
            'new_value': False
        }), exp_domain.ExplorationChange({
            'property_name': 'tags',
            'cmd': 'edit_exploration_property',
            'old_value': [

            ],
            'new_value': [
                'new'
            ]
        }), exp_domain.ExplorationChange({
            'property_name': 'tags',
            'cmd': 'edit_exploration_property',
            'old_value': [
                'new'
            ],
            'new_value': [
                'new',
                'skill'
            ]
        })]

        changes_are_not_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 1, change_list_2)
        self.assertEqual(changes_are_not_mergeable, False)

    def test_changes_are_mergeable_when_translations_changes_do_not_conflict(self): # pylint: disable=line-too-long
        self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, end_state_name='End')

        rights_manager.publish_exploration(self.owner, self.EXP_0_ID)

        # Adding content, feedbacks, solutions so that
        # translations can be added later on.
        change_list = [exp_domain.ExplorationChange({
            'property_name': 'content',
            'old_value': {
                'content_id': 'content',
                'html': ''
            },
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'new_value': {
                'content_id': 'content',
                'html': '<p>First State Content.</p>'
            }
        }), exp_domain.ExplorationChange({
            'property_name': 'widget_customization_args',
            'old_value': {
                'placeholder': {
                    'value': {
                        'unicode_str': '',
                        'content_id': 'ca_placeholder_0'
                    }
                },
                'rows': {
                    'value': 1
                }
            },
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'new_value': {
                'placeholder': {
                    'value': {
                        'unicode_str': 'Placeholder',
                        'content_id': 'ca_placeholder_0'
                    }
                },
                'rows': {
                    'value': 1
                }
            }
        }), exp_domain.ExplorationChange({
            'property_name': 'default_outcome',
            'old_value': {
                'labelled_as_correct': False,
                'missing_prerequisite_skill_id': None,
                'refresher_exploration_id': None,
                'feedback': {
                    'content_id': 'default_outcome',
                    'html': ''
                },
                'param_changes': [

                ],
                'dest': 'End'
            },
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'new_value': {
                'labelled_as_correct': False,
                'missing_prerequisite_skill_id': None,
                'refresher_exploration_id': None,
                'feedback': {
                    'content_id': 'default_outcome',
                    'html': '<p>Feedback 1.</p>'
                },
                'param_changes': [

                ],
                'dest': 'End'
            }
        }), exp_domain.ExplorationChange({
            'property_name': 'hints',
            'old_value': [

            ],
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'new_value': [
                {
                    'hint_content': {
                        'content_id': 'hint_1',
                        'html': '<p>Hint 1.</p>'
                    }
                }
            ]
        }), exp_domain.ExplorationChange({
            'property_name': 'next_content_id_index',
            'old_value': 1,
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'new_value': 2
        }), exp_domain.ExplorationChange({
            'property_name': 'solution',
            'old_value': None,
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'new_value': {
                'answer_is_exclusive': False,
                'explanation': {
                    'content_id': 'solution',
                    'html': '<p>Explanation.</p>'
                },
                'correct_answer': 'Solution'
            }
        }), exp_domain.ExplorationChange({
            'property_name': 'content',
            'old_value': {
                'content_id': 'content',
                'html': ''
            },
            'state_name': 'End',
            'cmd': 'edit_state_property',
            'new_value': {
                'content_id': 'content',
                'html': '<p>Second State Content.</p>'
            }
        })]
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list,
            'Added various contents.')

        change_list_2 = [exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'property_name': 'answer_groups',
            'old_value': [],
            'state_name': 'Introduction',
            'new_value': [{
                'rule_specs': [{
                    'rule_type': 'StartsWith',
                    'inputs': {
                        'x': {
                            'contentId': 'rule_input_2',
                            'normalizedStrSet': [
                                'Hello',
                                'Hola'
                            ]
                        }
                    }
                }],
                'tagged_skill_misconception_id': None,
                'outcome': {
                    'labelled_as_correct': False,
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': '<p>Feedback</p>'
                    },
                    'missing_prerequisite_skill_id': None,
                    'dest': 'End',
                    'param_changes': [],
                    'refresher_exploration_id': None
                },
                'training_data': []
            }]
        })]
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list_2,
            'Added answer group.')

        # Adding some translations to the first state.
        change_list_3 = [exp_domain.ExplorationChange({
            'language_code': 'de',
            'data_format': 'html',
            'cmd': 'add_written_translation',
            'content_id': 'content',
            'translation_html': '<p>Translation Content.</p>',
            'state_name': 'Introduction',
            'content_html': 'N/A'
        }), exp_domain.ExplorationChange({
            'language_code': 'de',
            'data_format': 'html',
            'cmd': 'add_written_translation',
            'content_id': 'default_outcome',
            'translation_html': '<p>Translation Feedback 1.</p>',
            'state_name': 'Introduction',
            'content_html': 'N/A'
        }), exp_domain.ExplorationChange({
            'cmd': 'mark_written_translations_as_needing_update',
            'state_name': 'Introduction',
            'content_id': 'default_outcome'
        })]

        changes_are_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 2, change_list_3)
        self.assertEqual(changes_are_mergeable, True)
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list_3,
            'Added some translations.')

        # Adding translations again to the different contents
        # of same state to check that they can be merged.
        change_list_4 = [exp_domain.ExplorationChange({
            'new_state_name': 'Intro-Rename',
            'cmd': 'rename_state',
            'old_state_name': 'Introduction'
        }), exp_domain.ExplorationChange({
            'content_html': 'N/A',
            'translation_html': 'Placeholder Translation.',
            'state_name': 'Intro-Rename',
            'language_code': 'de',
            'content_id': 'ca_placeholder_0',
            'cmd': 'add_written_translation',
            'data_format': 'unicode'
        }), exp_domain.ExplorationChange({
            'content_html': 'N/A',
            'translation_html': '<p>Hints Translation.</p>',
            'state_name': 'Intro-Rename',
            'language_code': 'de',
            'content_id': 'hint_1',
            'cmd': 'add_written_translation',
            'data_format': 'html'
        }), exp_domain.ExplorationChange({
            'language_code': 'de',
            'data_format': 'html',
            'cmd': 'add_written_translation',
            'content_id': 'rule_input_2',
            'translation_html': '<p>Translation Rule Input.</p>',
            'state_name': 'Intro-Rename',
            'content_html': 'N/A'
        }), exp_domain.ExplorationChange({
            'language_code': 'de',
            'data_format': 'html',
            'cmd': 'add_written_translation',
            'content_id': 'feedback_1',
            'translation_html': '<p>Translation Feedback.</p>',
            'state_name': 'Intro-Rename',
            'content_html': 'N/A'
        }), exp_domain.ExplorationChange({
            'language_code': 'de',
            'data_format': 'html',
            'cmd': 'add_written_translation',
            'content_id': 'solution',
            'translation_html': '<p>Translation Solution.</p>',
            'state_name': 'Intro-Rename',
            'content_html': 'N/A'
        }), exp_domain.ExplorationChange({
            'new_state_name': 'Introduction',
            'cmd': 'rename_state',
            'old_state_name': 'Intro-Rename'
        })]

        changes_are_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 3, change_list_4)
        self.assertEqual(changes_are_mergeable, True)

        # Adding translations to the second state to check
        # that they can be merged even in the same property.
        change_list_5 = [exp_domain.ExplorationChange({
            'content_html': 'N/A',
            'translation_html': '<p>State 2 Content Translation.</p>',
            'state_name': 'End',
            'language_code': 'de',
            'content_id': 'content',
            'cmd': 'add_written_translation',
            'data_format': 'html'
        })]

        changes_are_mergeable_1 = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 3, change_list_5)
        self.assertEqual(changes_are_mergeable_1, True)

        # Add changes to the different content of first state to
        # check that translation changes to some properties doesn't
        # affects the changes of content of other properties.
        change_list_6 = [exp_domain.ExplorationChange({
            'old_value': {
                'rows': {
                    'value': 1
                },
                'placeholder': {
                    'value': {
                        'unicode_str': 'Placeholder',
                        'content_id': 'ca_placeholder_0'
                    }
                }
            },
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'property_name': 'widget_customization_args',
            'new_value': {
                'rows': {
                    'value': 1
                },
                'placeholder': {
                    'value': {
                        'unicode_str': 'Placeholder Changed.',
                        'content_id': 'ca_placeholder_0'
                    }
                }
            }
        }), exp_domain.ExplorationChange({
            'property_name': 'default_outcome',
            'old_value': {
                'labelled_as_correct': False,
                'missing_prerequisite_skill_id': None,
                'refresher_exploration_id': None,
                'feedback': {
                    'content_id': 'default_outcome',
                    'html': 'Feedback 1.'
                },
                'param_changes': [

                ],
                'dest': 'End'
            },
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'new_value': {
                'labelled_as_correct': False,
                'missing_prerequisite_skill_id': None,
                'refresher_exploration_id': None,
                'feedback': {
                    'content_id': 'default_outcome',
                    'html': '<p>Feedback 2.</p>'
                },
                'param_changes': [

                ],
                'dest': 'End'
            }
        })]

        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list_6,
            'Changing Customization Args Placeholder in First State.')
        changes_are_mergeable_3 = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 4, change_list_5)
        self.assertEqual(changes_are_mergeable_3, True)

    def test_changes_are_not_mergeable_when_translations_changes_conflict(self): # pylint: disable=line-too-long
        self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, end_state_name='End')

        rights_manager.publish_exploration(self.owner, self.EXP_0_ID)

        # Adding content, feedbacks, solutions so that
        # translations can be added later on.
        change_list = [exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'property_name': 'answer_groups',
            'old_value': [],
            'state_name': 'Introduction',
            'new_value': [{
                'rule_specs': [{
                    'rule_type': 'StartsWith',
                    'inputs': {
                        'x': {
                            'contentId': 'rule_input_2',
                            'normalizedStrSet': [
                                'Hello',
                                'Hola'
                            ]
                        }
                    }
                }],
                'tagged_skill_misconception_id': None,
                'outcome': {
                    'labelled_as_correct': False,
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': '<p>Feedback</p>'
                    },
                    'missing_prerequisite_skill_id': None,
                    'dest': 'End',
                    'param_changes': [],
                    'refresher_exploration_id': None
                },
                'training_data': []
            }]
        }), exp_domain.ExplorationChange({
            'property_name': 'content',
            'old_value': {
                'content_id': 'content',
                'html': ''
            },
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'new_value': {
                'content_id': 'content',
                'html': '<p>First State Content.</p>'
            }
        }), exp_domain.ExplorationChange({
            'property_name': 'widget_customization_args',
            'old_value': {
                'placeholder': {
                    'value': {
                        'unicode_str': '',
                        'content_id': 'ca_placeholder_0'
                    }
                },
                'rows': {
                    'value': 1
                }
            },
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'new_value': {
                'placeholder': {
                    'value': {
                        'unicode_str': 'Placeholder',
                        'content_id': 'ca_placeholder_0'
                    }
                },
                'rows': {
                    'value': 1
                }
            }
        }), exp_domain.ExplorationChange({
            'property_name': 'default_outcome',
            'old_value': {
                'labelled_as_correct': False,
                'missing_prerequisite_skill_id': None,
                'refresher_exploration_id': None,
                'feedback': {
                    'content_id': 'default_outcome',
                    'html': ''
                },
                'param_changes': [

                ],
                'dest': 'End'
            },
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'new_value': {
                'labelled_as_correct': False,
                'missing_prerequisite_skill_id': None,
                'refresher_exploration_id': None,
                'feedback': {
                    'content_id': 'default_outcome',
                    'html': '<p>Feedback 1.</p>'
                },
                'param_changes': [

                ],
                'dest': 'End'
            }
        }), exp_domain.ExplorationChange({
            'property_name': 'hints',
            'old_value': [

            ],
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'new_value': [
                {
                    'hint_content': {
                        'content_id': 'hint_1',
                        'html': '<p>Hint 1.</p>'
                    }
                }
            ]
        }), exp_domain.ExplorationChange({
            'property_name': 'next_content_id_index',
            'old_value': 1,
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'new_value': 2
        }), exp_domain.ExplorationChange({
            'property_name': 'solution',
            'old_value': None,
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'new_value': {
                'answer_is_exclusive': False,
                'explanation': {
                    'content_id': 'solution',
                    'html': '<p>Explanation.</p>'
                },
                'correct_answer': 'Solution'
            }
        }), exp_domain.ExplorationChange({
            'property_name': 'content',
            'old_value': {
                'content_id': 'content',
                'html': ''
            },
            'state_name': 'End',
            'cmd': 'edit_state_property',
            'new_value': {
                'content_id': 'content',
                'html': '<p>Second State Content.</p>'
            }
        })]
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list,
            'Added various contents.')

        # Adding some translations to the first state.
        change_list_2 = [exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'old_value': {
                'content_id': 'content',
                'html': '<p>First State Content.</p>'
            },
            'new_value': {
                'content_id': 'content',
                'html': '<p>Changed First State Content.</p>'
            },
            'property_name': 'content',
            'cmd': 'edit_state_property'
        }), exp_domain.ExplorationChange({
            'language_code': 'de',
            'data_format': 'html',
            'cmd': 'add_written_translation',
            'content_id': 'content',
            'translation_html': '<p>Translation Content.</p>',
            'state_name': 'Introduction',
            'content_html': 'N/A'
        }), exp_domain.ExplorationChange({
            'language_code': 'de',
            'data_format': 'html',
            'cmd': 'add_written_translation',
            'content_id': 'default_outcome',
            'translation_html': '<p>Translation Feedback 1.</p>',
            'state_name': 'Introduction',
            'content_html': 'N/A'
        }), exp_domain.ExplorationChange({
            'language_code': 'de',
            'data_format': 'html',
            'cmd': 'add_written_translation',
            'content_id': 'ca_placeholder_0',
            'translation_html': '<p>Translation Placeholder.</p>',
            'state_name': 'Introduction',
            'content_html': 'N/A'
        }), exp_domain.ExplorationChange({
            'language_code': 'de',
            'data_format': 'html',
            'cmd': 'add_written_translation',
            'content_id': 'hint_1',
            'translation_html': '<p>Translation Hint.</p>',
            'state_name': 'Introduction',
            'content_html': 'N/A'
        }), exp_domain.ExplorationChange({
            'language_code': 'de',
            'data_format': 'html',
            'cmd': 'add_written_translation',
            'content_id': 'solution',
            'translation_html': '<p>Translation Solution.</p>',
            'state_name': 'Introduction',
            'content_html': 'N/A'
        }), exp_domain.ExplorationChange({
            'language_code': 'de',
            'data_format': 'html',
            'cmd': 'add_written_translation',
            'content_id': 'rule_input_2',
            'translation_html': '<p>Translation Rule Input.</p>',
            'state_name': 'Introduction',
            'content_html': 'N/A'
        }), exp_domain.ExplorationChange({
            'new_state_name': 'Intro-Rename',
            'cmd': 'rename_state',
            'old_state_name': 'Introduction'
        }), exp_domain.ExplorationChange({
            'language_code': 'de',
            'data_format': 'html',
            'cmd': 'add_written_translation',
            'content_id': 'feedback_1',
            'translation_html': '<p>Translation Feedback.</p>',
            'state_name': 'Intro-Rename',
            'content_html': 'N/A'
        }), exp_domain.ExplorationChange({
            'new_state_name': 'Introduction',
            'cmd': 'rename_state',
            'old_state_name': 'Intro-Rename'
        })]

        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list_2,
            'Added some translations.')

        # Adding translations again to the same contents
        # of same state to check that they can not be
        # merged.
        change_list_3 = [exp_domain.ExplorationChange({
            'language_code': 'bn',
            'data_format': 'html',
            'cmd': 'add_written_translation',
            'content_id': 'content',
            'translation_html': '<p>Translation Content.</p>',
            'state_name': 'Introduction',
            'content_html': 'N/A'
        }), exp_domain.ExplorationChange({
            'language_code': 'bn',
            'data_format': 'html',
            'cmd': 'add_written_translation',
            'content_id': 'default_outcome',
            'translation_html': '<p>Translation Feedback 1.</p>',
            'state_name': 'Introduction',
            'content_html': 'N/A'
        })]

        changes_are_not_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 2, change_list_3)
        self.assertEqual(changes_are_not_mergeable, False)

        # Changes to the content of second state to check that
        # the changes to the translations can not be made in
        # same state if the property which can be translated is
        # changed.
        change_list_3 = [exp_domain.ExplorationChange({
            'state_name': 'End',
            'old_value': {
                'content_id': 'content',
                'html': '<p>Second State Content.</p>'
            },
            'new_value': {
                'content_id': 'content',
                'html': '<p>Changed Second State Content.</p>'
            },
            'property_name': 'content',
            'cmd': 'edit_state_property'
        })]
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list_3,
            'Changing Content in Second State.')

        # Adding translations to the same property in
        # second state to check that they can not be merged.
        change_list_4 = [exp_domain.ExplorationChange({
            'content_html': 'N/A',
            'translation_html': '<p>State 2 Content Translation.</p>',
            'state_name': 'End',
            'language_code': 'de',
            'content_id': 'content',
            'cmd': 'add_written_translation',
            'data_format': 'html'
        })]
        changes_are_not_mergeable_1 = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 3, change_list_4)
        self.assertEqual(changes_are_not_mergeable_1, False)

    def test_changes_are_mergeable_when_voiceovers_changes_do_not_conflict(self): # pylint: disable=line-too-long
        self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, end_state_name='End')

        rights_manager.publish_exploration(self.owner, self.EXP_0_ID)

        # Adding content, feedbacks, solutions so that
        # voiceovers can be added later on.
        change_list = [exp_domain.ExplorationChange({
            'property_name': 'content',
            'old_value': {
                'content_id': 'content',
                'html': ''
            },
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'new_value': {
                'content_id': 'content',
                'html': '<p>First State Content.</p>'
            }
        }), exp_domain.ExplorationChange({
            'property_name': 'widget_customization_args',
            'old_value': {
                'placeholder': {
                    'value': {
                        'unicode_str': '',
                        'content_id': 'ca_placeholder_0'
                    }
                },
                'rows': {
                    'value': 1
                }
            },
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'new_value': {
                'placeholder': {
                    'value': {
                        'unicode_str': 'Placeholder',
                        'content_id': 'ca_placeholder_0'
                    }
                },
                'rows': {
                    'value': 1
                }
            }
        }), exp_domain.ExplorationChange({
            'property_name': 'default_outcome',
            'old_value': {
                'labelled_as_correct': False,
                'missing_prerequisite_skill_id': None,
                'refresher_exploration_id': None,
                'feedback': {
                    'content_id': 'default_outcome',
                    'html': ''
                },
                'param_changes': [

                ],
                'dest': 'End'
            },
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'new_value': {
                'labelled_as_correct': False,
                'missing_prerequisite_skill_id': None,
                'refresher_exploration_id': None,
                'feedback': {
                    'content_id': 'default_outcome',
                    'html': '<p>Feedback 1.</p>'
                },
                'param_changes': [

                ],
                'dest': 'End'
            }
        }), exp_domain.ExplorationChange({
            'property_name': 'hints',
            'old_value': [],
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'new_value': [
                {
                    'hint_content': {
                        'content_id': 'hint_1',
                        'html': '<p>Hint 1.</p>'
                    }
                }
            ]
        }), exp_domain.ExplorationChange({
            'property_name': 'next_content_id_index',
            'old_value': 1,
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'new_value': 2
        }), exp_domain.ExplorationChange({
            'property_name': 'solution',
            'old_value': None,
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'new_value': {
                'answer_is_exclusive': False,
                'explanation': {
                    'content_id': 'solution',
                    'html': '<p>Explanation.</p>'
                },
                'correct_answer': 'Solution'
            }
        }), exp_domain.ExplorationChange({
            'property_name': 'content',
            'old_value': {
                'content_id': 'content',
                'html': ''
            },
            'state_name': 'End',
            'cmd': 'edit_state_property',
            'new_value': {
                'content_id': 'content',
                'html': '<p>Second State Content.</p>'
            }
        })]
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list,
            'Added various contents.')

        # Adding change to the field which is neither
        # affected by nor affects voiceovers.
        change_list_2 = [exp_domain.ExplorationChange({
            'cmd': 'edit_state_property',
            'state_name': 'Introduction',
            'property_name': 'card_is_checkpoint',
            'new_value': True
        })]
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list_2,
            'Added single unrelated change.')

        # Adding some voiceovers to the first state.
        change_list_3 = [exp_domain.ExplorationChange({
            'property_name': 'recorded_voiceovers',
            'old_value': {
                'voiceovers_mapping': {
                    'hint_1': {},
                    'default_outcome': {},
                    'solution': {},
                    'ca_placeholder_0': {},
                    'content': {}
                }
            },
            'state_name': 'Introduction',
            'new_value': {
                'voiceovers_mapping': {
                    'hint_1': {},
                    'default_outcome': {},
                    'solution': {},
                    'ca_placeholder_0': {},
                    'content': {
                        'en': {
                            'needs_update': False,
                            'filename': 'content-en-xrss3z3nso.mp3',
                            'file_size_bytes': 114938,
                            'duration_secs': 7.183625
                        }
                    }
                }
            },
            'cmd': 'edit_state_property'
        }), exp_domain.ExplorationChange({
            'property_name': 'recorded_voiceovers',
            'old_value': {
                'voiceovers_mapping': {
                    'hint_1': {},
                    'default_outcome': {},
                    'solution': {},
                    'ca_placeholder_0': {},
                    'content': {
                        'en': {
                            'needs_update': False,
                            'filename': 'content-en-xrss3z3nso.mp3',
                            'file_size_bytes': 114938,
                            'duration_secs': 7.183625
                        }
                    }
                }
            },
            'state_name': 'Introduction',
            'new_value': {
                'voiceovers_mapping': {
                    'hint_1': {},
                    'default_outcome': {},
                    'solution': {},
                    'ca_placeholder_0': {
                        'en': {
                            'needs_update': False,
                            'filename': 'ca_placeholder_0-en-mfy5l6logg.mp3',
                            'file_size_bytes': 175542,
                            'duration_secs': 10.971375
                        }
                    },
                    'content': {
                        'en': {
                            'needs_update': False,
                            'filename': 'content-en-xrss3z3nso.mp3',
                            'file_size_bytes': 114938,
                            'duration_secs': 7.183625
                        }
                    }
                }
            },
            'cmd': 'edit_state_property'
        })]
        changes_are_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 2, change_list_3)
        self.assertEqual(changes_are_mergeable, True)

        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list_3,
            'Added some voiceovers.')

        # Adding voiceovers again to the same first state
        # to check if they can be applied. They will not
        # be mergeable as the changes are in the same property
        # i.e. recorded_voiceovers.
        change_list_4 = [exp_domain.ExplorationChange({
            'property_name': 'recorded_voiceovers',
            'cmd': 'edit_state_property',
            'old_value': {
                'voiceovers_mapping': {
                    'default_outcome': {},
                    'solution': {},
                    'content': {},
                    'ca_placeholder_0': {},
                    'hint_1': {}
                }
            },
            'new_value': {
                'voiceovers_mapping': {
                    'default_outcome': {},
                    'solution': {},
                    'content': {},
                    'ca_placeholder_0': {},
                    'hint_1': {
                        'en': {
                            'needs_update': False,
                            'duration_secs': 30.0669375,
                            'filename': 'hint_1-en-ajclkw0cnz.mp3',
                            'file_size_bytes': 481071
                        }
                    }
                }
            },
            'state_name': 'Introduction'
        })]

        changes_are_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 3, change_list_4)
        self.assertEqual(changes_are_mergeable, False)

        # Adding voiceovers to the second state to check
        # if they can be applied. They can be mergead as
        # the changes are in the different states.
        change_list_5 = [exp_domain.ExplorationChange({
            'old_value': {
                'voiceovers_mapping': {
                    'content': {}
                }
            },
            'property_name': 'recorded_voiceovers',
            'cmd': 'edit_state_property',
            'new_value': {
                'voiceovers_mapping': {
                    'content': {
                        'en': {
                            'duration_secs': 10.3183125,
                            'filename': 'content-en-ar9zhd7edl.mp3',
                            'file_size_bytes': 165093,
                            'needs_update': False
                        }
                    }
                }
            },
            'state_name': 'End'
        })]

        changes_are_mergeable_1 = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 3, change_list_5)
        self.assertEqual(changes_are_mergeable_1, True)

        # Changes to the content of first state to check
        # that the changes in the contents of first state
        # doesn't affects the changes to the voiceovers in
        # second state.
        change_list_6 = [exp_domain.ExplorationChange({
            'state_name': 'Introduction',
            'old_value': {
                'content_id': 'content',
                'html': '<p>First State Content.</p>'
            },
            'new_value': {
                'content_id': 'content',
                'html': '<p>Changed First State Content.</p>'
            },
            'property_name': 'content',
            'cmd': 'edit_state_property'
        })]

        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list_6,
            'Changing Content in First State.')
        changes_are_mergeable_3 = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 4, change_list_5)
        self.assertEqual(changes_are_mergeable_3, True)

        # Changes to the content of second state to check that
        # the changes to the voiceovers can not be made in
        # same state if the property which can be recorded is
        # changed.
        change_list_6 = [exp_domain.ExplorationChange({
            'state_name': 'End',
            'old_value': {
                'content_id': 'content',
                'html': '<p>Second State Content.</p>'
            },
            'new_value': {
                'content_id': 'content',
                'html': '<p>Changed Second State Content.</p>'
            },
            'property_name': 'content',
            'cmd': 'edit_state_property'
        })]

        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list_6,
            'Changing Content in Second State.')

        changes_are_not_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 4, change_list_4)
        self.assertEqual(changes_are_not_mergeable, False)

    def test_changes_are_not_mergeable_when_voiceovers_changes_conflict(self):
        self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, end_state_name='End')

        rights_manager.publish_exploration(self.owner, self.EXP_0_ID)

        # Adding content, feedbacks, solutions so that
        # voiceovers can be added later on.
        change_list = [exp_domain.ExplorationChange({
            'property_name': 'content',
            'old_value': {
                'content_id': 'content',
                'html': ''
            },
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'new_value': {
                'content_id': 'content',
                'html': '<p>First State Content.</p>'
            }
        }), exp_domain.ExplorationChange({
            'property_name': 'widget_customization_args',
            'old_value': {
                'placeholder': {
                    'value': {
                        'unicode_str': '',
                        'content_id': 'ca_placeholder_0'
                    }
                },
                'rows': {
                    'value': 1
                }
            },
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'new_value': {
                'placeholder': {
                    'value': {
                        'unicode_str': 'Placeholder',
                        'content_id': 'ca_placeholder_0'
                    }
                },
                'rows': {
                    'value': 1
                }
            }
        }), exp_domain.ExplorationChange({
            'property_name': 'default_outcome',
            'old_value': {
                'labelled_as_correct': False,
                'missing_prerequisite_skill_id': None,
                'refresher_exploration_id': None,
                'feedback': {
                    'content_id': 'default_outcome',
                    'html': ''
                },
                'param_changes': [

                ],
                'dest': 'End'
            },
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'new_value': {
                'labelled_as_correct': False,
                'missing_prerequisite_skill_id': None,
                'refresher_exploration_id': None,
                'feedback': {
                    'content_id': 'default_outcome',
                    'html': '<p>Feedback 1.</p>'
                },
                'param_changes': [

                ],
                'dest': 'End'
            }
        }), exp_domain.ExplorationChange({
            'property_name': 'hints',
            'old_value': [],
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'new_value': [
                {
                    'hint_content': {
                        'content_id': 'hint_1',
                        'html': '<p>Hint 1.</p>'
                    }
                }
            ]
        }), exp_domain.ExplorationChange({
            'property_name': 'next_content_id_index',
            'old_value': 1,
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'new_value': 2
        }), exp_domain.ExplorationChange({
            'property_name': 'solution',
            'old_value': None,
            'state_name': 'Introduction',
            'cmd': 'edit_state_property',
            'new_value': {
                'answer_is_exclusive': False,
                'explanation': {
                    'content_id': 'solution',
                    'html': '<p>Explanation.</p>'
                },
                'correct_answer': 'Solution'
            }
        }), exp_domain.ExplorationChange({
            'property_name': 'content',
            'old_value': {
                'content_id': 'content',
                'html': ''
            },
            'state_name': 'End',
            'cmd': 'edit_state_property',
            'new_value': {
                'content_id': 'content',
                'html': '<p>Second State Content.</p>'
            }
        })]
        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list,
            'Added various contents.')

        # Adding some voiceovers to the first state.
        change_list_2 = [exp_domain.ExplorationChange({
            'property_name': 'recorded_voiceovers',
            'old_value': {
                'voiceovers_mapping': {
                    'hint_1': {},
                    'default_outcome': {},
                    'solution': {},
                    'ca_placeholder_0': {},
                    'content': {}
                }
            },
            'state_name': 'Introduction',
            'new_value': {
                'voiceovers_mapping': {
                    'hint_1': {},
                    'default_outcome': {},
                    'solution': {},
                    'ca_placeholder_0': {},
                    'content': {
                        'en': {
                            'needs_update': False,
                            'filename': 'content-en-xrss3z3nso.mp3',
                            'file_size_bytes': 114938,
                            'duration_secs': 7.183625
                        }
                    }
                }
            },
            'cmd': 'edit_state_property'
        }), exp_domain.ExplorationChange({
            'property_name': 'recorded_voiceovers',
            'old_value': {
                'voiceovers_mapping': {
                    'hint_1': {},
                    'default_outcome': {},
                    'solution': {},
                    'ca_placeholder_0': {},
                    'content': {
                        'en': {
                            'needs_update': False,
                            'filename': 'content-en-xrss3z3nso.mp3',
                            'file_size_bytes': 114938,
                            'duration_secs': 7.183625
                        }
                    }
                }
            },
            'state_name': 'Introduction',
            'new_value': {
                'voiceovers_mapping': {
                    'hint_1': {},
                    'default_outcome': {},
                    'solution': {},
                    'ca_placeholder_0': {
                        'en': {
                            'needs_update': False,
                            'filename': 'ca_placeholder_0-en-mfy5l6logg.mp3',
                            'file_size_bytes': 175542,
                            'duration_secs': 10.971375
                        }
                    },
                    'content': {
                        'en': {
                            'needs_update': False,
                            'filename': 'content-en-xrss3z3nso.mp3',
                            'file_size_bytes': 114938,
                            'duration_secs': 7.183625
                        }
                    }
                }
            },
            'cmd': 'edit_state_property'
        })]

        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list_2,
            'Added some voiceovers.')

        # Adding voiceovers again to the same first state
        # to check if they can be applied. They will not
        # be mergeable as the changes are in the same property
        # i.e. recorded_voiceovers.
        change_list_3 = [exp_domain.ExplorationChange({
            'property_name': 'recorded_voiceovers',
            'cmd': 'edit_state_property',
            'old_value': {
                'voiceovers_mapping': {
                    'default_outcome': {},
                    'solution': {},
                    'content': {},
                    'ca_placeholder_0': {},
                    'hint_1': {}
                }
            },
            'new_value': {
                'voiceovers_mapping': {
                    'default_outcome': {},
                    'solution': {},
                    'content': {},
                    'ca_placeholder_0': {},
                    'hint_1': {
                        'en': {
                            'needs_update': False,
                            'duration_secs': 30.0669375,
                            'filename': 'hint_1-en-ajclkw0cnz.mp3',
                            'file_size_bytes': 481071
                        }
                    }
                }
            },
            'state_name': 'Introduction'
        })]

        changes_are_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 2, change_list_3)
        self.assertEqual(changes_are_mergeable, False)

    def test_changes_are_not_mergeable_when_state_added_or_deleted(self):
        self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, end_state_name='End')

        rights_manager.publish_exploration(self.owner, self.EXP_0_ID)

        # Changes to the various properties of the first and
        # second state.
        change_list = [exp_domain.ExplorationChange({
            'old_value': 'TextInput',
            'cmd': 'edit_state_property',
            'property_name': 'widget_id',
            'new_value': None,
            'state_name': 'Introduction'
        }), exp_domain.ExplorationChange({
            'old_value': {
                'placeholder': {
                    'value': {
                        'content_id': 'ca_placeholder_0',
                        'unicode_str': ''
                    }
                },
                'rows': {
                    'value': 1
                }
            },
            'cmd': 'edit_state_property',
            'property_name': 'widget_customization_args',
            'new_value': {},
            'state_name': 'Introduction'
        }), exp_domain.ExplorationChange({
            'old_value': None,
            'cmd': 'edit_state_property',
            'property_name': 'widget_id',
            'new_value': 'NumericInput',
            'state_name': 'Introduction'
        }), exp_domain.ExplorationChange({
            'old_value': 1,
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index',
            'new_value': 2,
            'state_name': 'Introduction'
        }), exp_domain.ExplorationChange({
            'old_value': [],
            'cmd': 'edit_state_property',
            'property_name': 'answer_groups',
            'new_value': [
                {
                    'tagged_skill_misconception_id': None,
                    'rule_specs': [
                        {
                            'rule_type': 'IsLessThanOrEqualTo',
                            'inputs': {
                                'x': 50
                            }
                        }
                    ],
                    'training_data': [],
                    'outcome': {
                        'param_changes': [],
                        'dest': 'End',
                        'missing_prerequisite_skill_id': None,
                        'feedback': {
                            'content_id': 'feedback_1',
                            'html': ''
                        },
                        'labelled_as_correct': False,
                        'refresher_exploration_id': None
                    }
                }
            ],
            'state_name': 'Introduction'
        }), exp_domain.ExplorationChange({
            'old_value': [],
            'cmd': 'edit_state_property',
            'property_name': 'hints',
            'new_value': [
                {
                    'hint_content': {
                        'content_id': 'hint_2',
                        'html': '<p>Hint.</p>'
                    }
                }
            ],
            'state_name': 'Introduction'
        }), exp_domain.ExplorationChange({
            'old_value': 2,
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index',
            'new_value': 3,
            'state_name': 'Introduction'
        }), exp_domain.ExplorationChange({
            'old_value': {
                'content_id': 'content',
                'html': 'Congratulations, you have finished!'
            },
            'cmd': 'edit_state_property',
            'property_name': 'content',
            'new_value': {
                'content_id': 'content',
                'html': '<p>2Congratulations, you have finished!</p>'
            },
            'state_name': 'End'
        })]

        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list,
            'Changed various properties in both states.')

        # Change to the unrelated property to check that
        # it can be merged.
        change_list_2 = [exp_domain.ExplorationChange({
            'old_value': {
                'html': '',
                'content_id': 'content'
            },
            'new_value': {
                'html': '<p>Hello Aryaman!</p>',
                'content_id': 'content'
            },
            'state_name': 'Introduction',
            'property_name': 'content',
            'cmd': 'edit_state_property'
        })]

        changes_are_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 1, change_list_2)
        self.assertEqual(changes_are_mergeable, True)

        # Deleting and Adding states to check that when any
        # state is deleted or added, then the changes can not be
        # merged.
        change_list_3 = [exp_domain.ExplorationChange({
            'new_state_name': 'End-State',
            'cmd': 'rename_state',
            'old_state_name': 'End'
        }), exp_domain.ExplorationChange({
            'cmd': 'delete_state',
            'state_name': 'End-State'
        }), exp_domain.ExplorationChange({
            'cmd': 'add_state',
            'state_name': 'End'
        }), exp_domain.ExplorationChange({
            'cmd': 'delete_state',
            'state_name': 'End'
        }), exp_domain.ExplorationChange({
            'cmd': 'add_state',
            'state_name': 'End'
        }), exp_domain.ExplorationChange({
            'new_state_name': 'End-State',
            'cmd': 'rename_state',
            'old_state_name': 'End'
        }), exp_domain.ExplorationChange({
            'new_state_name': 'End',
            'cmd': 'rename_state',
            'old_state_name': 'End-State'
        }), exp_domain.ExplorationChange({
            'old_value': [{
                'tagged_skill_misconception_id': None,
                'rule_specs': [{
                    'rule_type': 'IsLessThanOrEqualTo',
                    'inputs': {
                        'x': 50
                    }
                }],
                'training_data': [],
                'outcome': {
                    'param_changes': [],
                    'dest': 'Introduction',
                    'missing_prerequisite_skill_id': None,
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': ''
                    },
                    'labelled_as_correct': False,
                    'refresher_exploration_id': None
                }
            }],
            'cmd': 'edit_state_property',
            'property_name': 'answer_groups',
            'new_value': [{
                'tagged_skill_misconception_id': None,
                'rule_specs': [{
                    'rule_type': 'IsLessThanOrEqualTo',
                    'inputs': {
                        'x': 50
                    }
                }],
                'training_data': [],
                'outcome': {
                    'param_changes': [],
                    'dest': 'End',
                    'missing_prerequisite_skill_id': None,
                    'feedback': {
                        'content_id': 'feedback_1',
                        'html': ''
                    },
                    'labelled_as_correct': False,
                    'refresher_exploration_id': None
                }
            }],
            'state_name': 'Introduction'
        }), exp_domain.ExplorationChange({
            'old_value': {
                'param_changes': [],
                'dest': 'Introduction',
                'missing_prerequisite_skill_id': None,
                'feedback': {
                    'content_id': 'default_outcome',
                    'html': ''
                },
                'labelled_as_correct': False,
                'refresher_exploration_id': None
            },
            'cmd': 'edit_state_property',
            'property_name': 'default_outcome',
            'new_value': {
                'param_changes': [],
                'dest': 'End',
                'missing_prerequisite_skill_id': None,
                'feedback': {
                    'content_id': 'default_outcome',
                    'html': ''
                },
                'labelled_as_correct': False,
                'refresher_exploration_id': None
            },
            'state_name': 'Introduction'
        }), exp_domain.ExplorationChange({
            'old_value': {
                'content_id': 'content',
                'html': ''
            },
            'cmd': 'edit_state_property',
            'property_name': 'content',
            'new_value': {
                'content_id': 'content',
                'html': 'Congratulations, you have finished!'
            },
            'state_name': 'End'
        }), exp_domain.ExplorationChange({
            'old_value': None,
            'cmd': 'edit_state_property',
            'property_name': 'widget_id',
            'new_value': 'EndExploration',
            'state_name': 'End'
        }), exp_domain.ExplorationChange({
            'old_value': {},
            'cmd': 'edit_state_property',
            'property_name': 'widget_customization_args',
            'new_value': {
                'recommendedExplorationIds': {
                    'value': []
                }
            },
            'state_name': 'End'
        }), exp_domain.ExplorationChange({
            'old_value': {
                'param_changes': [],
                'dest': 'End',
                'missing_prerequisite_skill_id': None,
                'feedback': {
                    'content_id': 'default_outcome',
                    'html': ''
                },
                'labelled_as_correct': False,
                'refresher_exploration_id': None
            },
            'cmd': 'edit_state_property',
            'property_name': 'default_outcome',
            'new_value': None,
            'state_name': 'End'
        })]

        exp_services.update_exploration(
            self.owner_id, self.EXP_0_ID, change_list_3,
            'Added and deleted states.')

        # Checking that old changes that could be
        # merged previously can not be merged after
        # addition or deletion of state.
        changes_are_not_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 1, change_list_2)
        self.assertEqual(changes_are_not_mergeable, False)

    def test_changes_are_not_mergeable_when_frontend_version_exceeds_backend_version(self): # pylint: disable=line-too-long
        self.save_new_valid_exploration(
            self.EXP_0_ID, self.owner_id, end_state_name='End')

        rights_manager.publish_exploration(self.owner, self.EXP_0_ID)

        # Changes to the various properties of the first and
        # second state.
        change_list = [exp_domain.ExplorationChange({
            'old_value': 'TextInput',
            'cmd': 'edit_state_property',
            'property_name': 'widget_id',
            'new_value': None,
            'state_name': 'Introduction'
        }), exp_domain.ExplorationChange({
            'old_value': {
                'placeholder': {
                    'value': {
                        'content_id': 'ca_placeholder_0',
                        'unicode_str': ''
                    }
                },
                'rows': {
                    'value': 1
                }
            },
            'cmd': 'edit_state_property',
            'property_name': 'widget_customization_args',
            'new_value': {},
            'state_name': 'Introduction'
        }), exp_domain.ExplorationChange({
            'old_value': None,
            'cmd': 'edit_state_property',
            'property_name': 'widget_id',
            'new_value': 'NumericInput',
            'state_name': 'Introduction'
        }), exp_domain.ExplorationChange({
            'old_value': 1,
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index',
            'new_value': 2,
            'state_name': 'Introduction'
        }), exp_domain.ExplorationChange({
            'old_value': [],
            'cmd': 'edit_state_property',
            'property_name': 'answer_groups',
            'new_value': [
                {
                    'tagged_skill_misconception_id': None,
                    'rule_specs': [
                        {
                            'rule_type': 'IsLessThanOrEqualTo',
                            'inputs': {
                                'x': 50
                            }
                        }
                    ],
                    'training_data': [],
                    'outcome': {
                        'param_changes': [],
                        'dest': 'End',
                        'missing_prerequisite_skill_id': None,
                        'feedback': {
                            'content_id': 'feedback_1',
                            'html': ''
                        },
                        'labelled_as_correct': False,
                        'refresher_exploration_id': None
                    }
                }
            ],
            'state_name': 'Introduction'
        }), exp_domain.ExplorationChange({
            'old_value': [],
            'cmd': 'edit_state_property',
            'property_name': 'hints',
            'new_value': [
                {
                    'hint_content': {
                        'content_id': 'hint_2',
                        'html': '<p>Hint.</p>'
                    }
                }
            ],
            'state_name': 'Introduction'
        }), exp_domain.ExplorationChange({
            'old_value': 2,
            'cmd': 'edit_state_property',
            'property_name': 'next_content_id_index',
            'new_value': 3,
            'state_name': 'Introduction'
        }), exp_domain.ExplorationChange({
            'old_value': {
                'content_id': 'content',
                'html': 'Congratulations, you have finished!'
            },
            'cmd': 'edit_state_property',
            'property_name': 'content',
            'new_value': {
                'content_id': 'content',
                'html': '<p>2Congratulations, you have finished!</p>'
            },
            'state_name': 'End'
        })]

        # Changes are mergeable when updating the same version.
        changes_are_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 1, change_list)
        self.assertEqual(changes_are_mergeable, True)

        # Changes are not mergeable when updating from version
        # more than that on the backend.
        changes_are_not_mergeable = exp_services.are_changes_mergeable(
            self.EXP_0_ID, 3, change_list)
        self.assertEqual(changes_are_not_mergeable, False)

    def test_email_is_sent_to_admin_in_case_of_adding_deleting_state_changes(
            self):
        self.login(self.OWNER_EMAIL)
        with self.swap(feconf, 'CAN_SEND_EMAILS', True):
            messages = self._get_sent_email_messages(
                self.ADMIN_EMAIL)
            self.assertEqual(len(messages), 0)
            self.save_new_valid_exploration(
                self.EXP_0_ID, self.owner_id, end_state_name='End')

            rights_manager.publish_exploration(self.owner, self.EXP_0_ID)

            # Changes to the various properties of the first and
            # second state.
            change_list = [exp_domain.ExplorationChange({
                'old_value': 'TextInput',
                'cmd': 'edit_state_property',
                'property_name': 'widget_id',
                'new_value': None,
                'state_name': 'Introduction'
            }), exp_domain.ExplorationChange({
                'old_value': {
                    'placeholder': {
                        'value': {
                            'content_id': 'ca_placeholder_0',
                            'unicode_str': ''
                        }
                    },
                    'rows': {
                        'value': 1
                    }
                },
                'cmd': 'edit_state_property',
                'property_name': 'widget_customization_args',
                'new_value': {},
                'state_name': 'Introduction'
            }), exp_domain.ExplorationChange({
                'old_value': None,
                'cmd': 'edit_state_property',
                'property_name': 'widget_id',
                'new_value': 'NumericInput',
                'state_name': 'Introduction'
            }), exp_domain.ExplorationChange({
                'old_value': 1,
                'cmd': 'edit_state_property',
                'property_name': 'next_content_id_index',
                'new_value': 2,
                'state_name': 'Introduction'
            }), exp_domain.ExplorationChange({
                'old_value': [],
                'cmd': 'edit_state_property',
                'property_name': 'answer_groups',
                'new_value': [
                    {
                        'tagged_skill_misconception_id': None,
                        'rule_specs': [
                            {
                                'rule_type': 'IsLessThanOrEqualTo',
                                'inputs': {
                                    'x': 50
                                }
                            }
                        ],
                        'training_data': [],
                        'outcome': {
                            'param_changes': [],
                            'dest': 'End',
                            'missing_prerequisite_skill_id': None,
                            'feedback': {
                                'content_id': 'feedback_1',
                                'html': ''
                            },
                            'labelled_as_correct': False,
                            'refresher_exploration_id': None
                        }
                    }
                ],
                'state_name': 'Introduction'
            }), exp_domain.ExplorationChange({
                'old_value': [],
                'cmd': 'edit_state_property',
                'property_name': 'hints',
                'new_value': [
                    {
                        'hint_content': {
                            'content_id': 'hint_2',
                            'html': '<p>Hint.</p>'
                        }
                    }
                ],
                'state_name': 'Introduction'
            }), exp_domain.ExplorationChange({
                'old_value': 2,
                'cmd': 'edit_state_property',
                'property_name': 'next_content_id_index',
                'new_value': 3,
                'state_name': 'Introduction'
            }), exp_domain.ExplorationChange({
                'old_value': {
                    'content_id': 'content',
                    'html': 'Congratulations, you have finished!'
                },
                'cmd': 'edit_state_property',
                'property_name': 'content',
                'new_value': {
                    'content_id': 'content',
                    'html': '<p>2Congratulations, you have finished!</p>'
                },
                'state_name': 'End'
            })]

            exp_services.update_exploration(
                self.owner_id, self.EXP_0_ID, change_list,
                'Changed various properties in both states.')

            change_list_2 = [exp_domain.ExplorationChange({
                'new_state_name': 'End-State',
                'cmd': 'rename_state',
                'old_state_name': 'End'
            }), exp_domain.ExplorationChange({
                'cmd': 'delete_state',
                'state_name': 'End-State'
            }), exp_domain.ExplorationChange({
                'cmd': 'add_state',
                'state_name': 'End'
            }), exp_domain.ExplorationChange({
                'cmd': 'delete_state',
                'state_name': 'End'
            }), exp_domain.ExplorationChange({
                'cmd': 'add_state',
                'state_name': 'End'
            }), exp_domain.ExplorationChange({
                'new_state_name': 'End-State',
                'cmd': 'rename_state',
                'old_state_name': 'End'
            }), exp_domain.ExplorationChange({
                'new_state_name': 'End',
                'cmd': 'rename_state',
                'old_state_name': 'End-State'
            }), exp_domain.ExplorationChange({
                'old_value': [{
                    'tagged_skill_misconception_id': None,
                    'rule_specs': [{
                        'rule_type': 'IsLessThanOrEqualTo',
                        'inputs': {
                            'x': 50
                        }
                    }],
                    'training_data': [],
                    'outcome': {
                        'param_changes': [],
                        'dest': 'Introduction',
                        'missing_prerequisite_skill_id': None,
                        'feedback': {
                            'content_id': 'feedback_1',
                            'html': ''
                        },
                        'labelled_as_correct': False,
                        'refresher_exploration_id': None
                    }
                }],
                'cmd': 'edit_state_property',
                'property_name': 'answer_groups',
                'new_value': [{
                    'tagged_skill_misconception_id': None,
                    'rule_specs': [{
                        'rule_type': 'IsLessThanOrEqualTo',
                        'inputs': {
                            'x': 50
                        }
                    }],
                    'training_data': [],
                    'outcome': {
                        'param_changes': [],
                        'dest': 'End',
                        'missing_prerequisite_skill_id': None,
                        'feedback': {
                            'content_id': 'feedback_1',
                            'html': ''
                        },
                        'labelled_as_correct': False,
                        'refresher_exploration_id': None
                    }
                }],
                'state_name': 'Introduction'
            }), exp_domain.ExplorationChange({
                'old_value': {
                    'param_changes': [],
                    'dest': 'Introduction',
                    'missing_prerequisite_skill_id': None,
                    'feedback': {
                        'content_id': 'default_outcome',
                        'html': ''
                    },
                    'labelled_as_correct': False,
                    'refresher_exploration_id': None
                },
                'cmd': 'edit_state_property',
                'property_name': 'default_outcome',
                'new_value': {
                    'param_changes': [],
                    'dest': 'End',
                    'missing_prerequisite_skill_id': None,
                    'feedback': {
                        'content_id': 'default_outcome',
                        'html': ''
                    },
                    'labelled_as_correct': False,
                    'refresher_exploration_id': None
                },
                'state_name': 'Introduction'
            }), exp_domain.ExplorationChange({
                'old_value': {
                    'content_id': 'content',
                    'html': ''
                },
                'cmd': 'edit_state_property',
                'property_name': 'content',
                'new_value': {
                    'content_id': 'content',
                    'html': 'Congratulations, you have finished!'
                },
                'state_name': 'End'
            }), exp_domain.ExplorationChange({
                'old_value': None,
                'cmd': 'edit_state_property',
                'property_name': 'widget_id',
                'new_value': 'EndExploration',
                'state_name': 'End'
            }), exp_domain.ExplorationChange({
                'old_value': {},
                'cmd': 'edit_state_property',
                'property_name': 'widget_customization_args',
                'new_value': {
                    'recommendedExplorationIds': {
                        'value': []
                    }
                },
                'state_name': 'End'
            }), exp_domain.ExplorationChange({
                'old_value': {
                    'param_changes': [],
                    'dest': 'End',
                    'missing_prerequisite_skill_id': None,
                    'feedback': {
                        'content_id': 'default_outcome',
                        'html': ''
                    },
                    'labelled_as_correct': False,
                    'refresher_exploration_id': None
                },
                'cmd': 'edit_state_property',
                'property_name': 'default_outcome',
                'new_value': None,
                'state_name': 'End'
            })]

            exp_services.update_exploration(
                self.owner_id, self.EXP_0_ID, change_list_2,
                'Added and deleted states.')
            change_list_3 = [exp_domain.ExplorationChange({
                'old_value': {
                    'html': '',
                    'content_id': 'content'
                },
                'new_value': {
                    'html': '<p>Hello Aryaman!</p>',
                    'content_id': 'content'
                },
                'state_name': 'Introduction',
                'property_name': 'content',
                'cmd': 'edit_state_property'
            })]
            changes_are_not_mergeable = exp_services.are_changes_mergeable(
                self.EXP_0_ID, 1, change_list_3)
            self.assertEqual(changes_are_not_mergeable, False)

            change_list_3_dict = [{
                'old_value': {
                    'html': '',
                    'content_id': 'content'
                },
                'new_value': {
                    'html': '<p>Hello Aryaman!</p>',
                    'content_id': 'content'
                },
                'state_name': 'Introduction',
                'property_name': 'content',
                'cmd': 'edit_state_property'
            }]
            expected_email_html_body = (
                '(Sent from dummy-cloudsdk-project-id)<br/><br/>'
                'Hi Admin,<br><br>'
                'Some draft changes were rejected in exploration %s because '
                'the changes were conflicting and could not be saved. Please '
                'see the rejected change list below:<br>'
                'Discarded change list: %s <br><br>'
                'Frontend Version: %s<br>'
                'Backend Version: %s<br><br>'
                'Thanks!' % (self.EXP_0_ID, change_list_3_dict, 1, 3))
            messages = self._get_sent_email_messages(
                feconf.ADMIN_EMAIL_ADDRESS)
            self.assertEqual(len(messages), 1)
            self.assertEqual(
                expected_email_html_body,
                messages[0].html.decode())

    def test_email_is_sent_to_admin_in_case_of_state_renames_changes_conflict(
            self):
        self.login(self.OWNER_EMAIL)
        with self.swap(feconf, 'CAN_SEND_EMAILS', True):
            messages = self._get_sent_email_messages(
                self.ADMIN_EMAIL)
            self.assertEqual(len(messages), 0)
            self.save_new_valid_exploration(
                self.EXP_0_ID, self.owner_id, end_state_name='End')

            rights_manager.publish_exploration(self.owner, self.EXP_0_ID)
            change_list = [exp_domain.ExplorationChange({
                'old_value': {
                    'html': '',
                    'content_id': 'content'
                },
                'new_value': {
                    'html': '<p>End State</p>',
                    'content_id': 'content'
                },
                'state_name': 'End',
                'property_name': 'content',
                'cmd': 'edit_state_property'
            })]
            exp_services.update_exploration(
                self.owner_id, self.EXP_0_ID, change_list,
                'Changed various properties in both states.')

            # State name changed.
            change_list_2 = [exp_domain.ExplorationChange({
                'new_state_name': 'End-State',
                'cmd': 'rename_state',
                'old_state_name': 'End'
            })]

            exp_services.update_exploration(
                self.owner_id, self.EXP_0_ID, change_list_2,
                'Changed various properties in both states.')

            change_list_3 = [exp_domain.ExplorationChange({
                'old_value': {
                    'html': 'End State',
                    'content_id': 'content'
                },
                'new_value': {
                    'html': '<p>End State Changed</p>',
                    'content_id': 'content'
                },
                'state_name': 'End',
                'property_name': 'content',
                'cmd': 'edit_state_property'
            })]
            changes_are_not_mergeable = exp_services.are_changes_mergeable(
                self.EXP_0_ID, 2, change_list_3)
            self.assertEqual(changes_are_not_mergeable, False)

            change_list_3_dict = [{
                'old_value': {
                    'html': 'End State',
                    'content_id': 'content'
                },
                'new_value': {
                    'html': '<p>End State Changed</p>',
                    'content_id': 'content'
                },
                'state_name': 'End',
                'property_name': 'content',
                'cmd': 'edit_state_property'
            }]
            expected_email_html_body = (
                '(Sent from dummy-cloudsdk-project-id)<br/><br/>'
                'Hi Admin,<br><br>'
                'Some draft changes were rejected in exploration %s because '
                'the changes were conflicting and could not be saved. Please '
                'see the rejected change list below:<br>'
                'Discarded change list: %s <br><br>'
                'Frontend Version: %s<br>'
                'Backend Version: %s<br><br>'
                'Thanks!' % (self.EXP_0_ID, change_list_3_dict, 2, 3))
            messages = self._get_sent_email_messages(
                feconf.ADMIN_EMAIL_ADDRESS)
            self.assertEqual(len(messages), 1)
            self.assertEqual(
                expected_email_html_body,
                messages[0].html.decode())

            # Add a translation after state renames.
            change_list_4 = [exp_domain.ExplorationChange({
                'content_html': 'N/A',
                'translation_html': '<p>State 2 Content Translation.</p>',
                'state_name': 'End',
                'language_code': 'de',
                'content_id': 'content',
                'cmd': 'add_written_translation',
                'data_format': 'html'
            })]
            changes_are_not_mergeable_2 = exp_services.are_changes_mergeable(
                self.EXP_0_ID, 2, change_list_4)
            self.assertEqual(changes_are_not_mergeable_2, False)

            change_list_4_dict = [{
                'cmd': 'add_written_translation',
                'state_name': 'End',
                'translation_html': '<p>State 2 Content Translation.</p>',
                'data_format': 'html',
                'language_code': 'de',
                'content_id': 'content',
                'content_html': 'N/A'}]
            expected_email_html_body_2 = (
                '(Sent from dummy-cloudsdk-project-id)<br/><br/>'
                'Hi Admin,<br><br>'
                'Some draft changes were rejected in exploration %s because '
                'the changes were conflicting and could not be saved. Please '
                'see the rejected change list below:<br>'
                'Discarded change list: %s <br><br>'
                'Frontend Version: %s<br>'
                'Backend Version: %s<br><br>'
                'Thanks!' % (self.EXP_0_ID, change_list_4_dict, 2, 3))
            messages = self._get_sent_email_messages(
                feconf.ADMIN_EMAIL_ADDRESS)
            self.assertEqual(len(messages), 2)
            self.assertEqual(
                expected_email_html_body_2,
                messages[1].html.decode())
