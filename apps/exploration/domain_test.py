# coding: utf-8
#
# Copyright 2013 Google Inc. All Rights Reserved.
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

__author__ = 'Jeremy Emerson'

import test_utils

from apps.exploration.domain import Exploration
from apps.exploration.models import ExplorationModel
import apps.exploration.services as exp_services
from apps.widget.models import InteractiveWidget


class ExplorationDomainUnitTests(test_utils.AppEngineTestBase):
    """Test the exploration domain object."""

    def setUp(self):
        """Loads the default widgets."""
        super(ExplorationDomainUnitTests, self).setUp()
        InteractiveWidget.load_default_widgets()

    def tearDown(self):
        """Deletes all widgets and explorations."""
        InteractiveWidget.delete_all_widgets()
        explorations = exp_services.get_all_explorations()
        for exploration in explorations:
            exploration.delete()
        super(ExplorationDomainUnitTests, self).tearDown()

    def test_validation(self):
        """Test validation of explorations."""
        # TODO(sll): This should mock the __init__ method and not depend on
        # ExplorationModel.
        exploration = Exploration(
            ExplorationModel(
                id='i', title='t', category='c', state_ids=[], parameters=[],
                is_public=False, image_id='i', editor_ids=[]
            )
        )

        # The 'state_ids property must be a non-empty list of strings
        # representing State ids.
        with self.assertRaises(Exploration.ObjectValidationError):
            exploration.state_ids = ['A string']
            exploration.put()

        # There must be at least one editor id.
        with self.assertRaises(Exploration.ObjectValidationError):
            exploration.put()

    def test_init_state_property(self):
        """Test the init_state property."""
        # TODO(sll): This should mock the __init__ method and not depend on
        # ExplorationModel.
        exploration = Exploration.get(exp_services.create_new(
            'uid', 'title', 'category', init_state_name='a'
        ))
        self.assertEqual(exploration.init_state.name, 'a')

        exploration.add_state('b')
        exploration.put()
        self.assertEqual(exploration.init_state.name, 'a')

    def test_is_demo_property(self):
        """Test the is_demo property."""
        def get_exploration_object(id):
            exploration_model = ExplorationModel(id=id, title='T', category='C')
            exploration_model.put()
            return Exploration(exploration_model)

        demo = get_exploration_object('0')
        self.assertEqual(demo.is_demo, True)
        notdemo1 = get_exploration_object('a')
        self.assertEqual(notdemo1.is_demo, False)
        notdemo2 = get_exploration_object('abcd')
        self.assertEqual(notdemo2.is_demo, False)

    def test_is_owned_by(self):
        """Test the is_owned_by() method."""
        self.owner_id = 'owner@example.com'
        self.editor_id = 'editor@example.com'
        self.viewer_id = 'viewer@example.com'

        exploration = Exploration.get(exp_services.create_new(
            self.owner_id, 'A title', 'A category', 'A exploration_id'))
        exploration.add_editor(self.editor_id)
        exploration.put()

        self.assertTrue(exploration.is_owned_by(self.owner_id))
        self.assertFalse(exploration.is_owned_by(self.editor_id))
        self.assertFalse(exploration.is_owned_by(self.viewer_id))
        self.assertFalse(exploration.is_owned_by(None))

    def test_is_editable_by(self):
        """Test the is_editable_by() method."""
        self.owner_id = 'owner@example.com'
        self.editor_id = 'editor@example.com'
        self.viewer_id = 'viewer@example.com'

        exploration = Exploration.get(exp_services.create_new(
            self.owner_id, 'A title', 'A category', 'A exploration_id'))
        exploration.add_editor(self.editor_id)
        exploration.put()

        self.assertTrue(exploration.is_editable_by(self.owner_id))
        self.assertTrue(exploration.is_editable_by(self.editor_id))
        self.assertFalse(exploration.is_editable_by(self.viewer_id))
        self.assertFalse(exploration.is_editable_by(None))
