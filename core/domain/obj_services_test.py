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

"""Tests for services relating to typed objects."""

from core.domain import interaction_registry
from core.domain import obj_services
from core.tests import test_utils
from extensions.objects.models import objects


class ObjectRegistryUnitTests(test_utils.GenericTestBase):
    """Test the Registry class in obj_services."""

    def test_get_object_class_by_type_method(self):
        """Tests the normal behavior of get_object_class_by_type()."""
        self.assertEqual(
            obj_services.Registry.get_object_class_by_type('Int').__name__,
            'Int')

    def test_fake_class_is_not_gettable(self):
        """Tests that trying to retrieve a fake class raises an error."""
        with self.assertRaisesRegexp(TypeError, 'not a valid object class'):
            obj_services.Registry.get_object_class_by_type('FakeClass')

    def test_base_object_is_not_gettable(self):
        """Tests that BaseObject exists and cannot be set as an obj_type."""
        assert getattr(objects, 'BaseObject')
        with self.assertRaisesRegexp(TypeError, 'not a valid object class'):
            obj_services.Registry.get_object_class_by_type('BaseObject')


class ObjectJsFilenamesUnitTests(test_utils.GenericTestBase):
    """Test that all object JS templates are for the objects themselves.

    The frontend code currently gets the JS template by constructing it from
    the object type. This will lead to errors if an object which is a subclass
    of another object uses the latter's JS template. Hence this test.
    """

    def test_object_js_filenames(self):
        # Show full failure messages for this test (both the system-generated
        # one and the developer-specified one).
        self.longMessage = True

        all_object_classes = obj_services.Registry.get_all_object_classes()
        for obj_type, obj_cls in all_object_classes.iteritems():
            if obj_cls.has_editor_js_template():
                template = obj_cls.get_editor_js_template()
                directive_name = '%sEditor' % obj_type
                normalized_directive_name = (
                    directive_name[0].lower() + directive_name[1:])
                self.assertIn(
                    'oppia.directive(\'%s\'' % normalized_directive_name,
                    template, msg='(%s)' % obj_type)


class ObjectDefaultValuesUnitTests(test_utils.GenericTestBase):
    """Test that the default value of objects recorded in
    extensions/interactions/object_defaults.json correspond to
    the defined default values in objects.py for all objects that
    are used in rules.
    """

    def test_all_rule_input_fields_have_default_values(self):
        """Checks that all rule input fields have a default value, and this
        is provided in get_default_values().
        """
        interactions = interaction_registry.Registry.get_all_interactions()
        object_default_vals = obj_services.get_default_object_values()

        for interaction in interactions:
            for rule_name in interaction.rules_dict:
                param_list = interaction.get_rule_param_list(rule_name)

                for (_, param_obj_type) in param_list:
                    param_obj_type_name = param_obj_type.__name__
                    default_value = param_obj_type.default_value
                    self.assertIsNotNone(
                        default_value, msg=(
                            'No default value specified for object class %s.' %
                            param_obj_type_name))
                    self.assertIn(param_obj_type_name, object_default_vals)
                    self.assertEqual(
                        default_value, object_default_vals[param_obj_type_name])

    def test_get_object_default_values_is_valid(self):
        """Checks that the default values provided by get_default_values()
        correspond to the ones defined in objects.py.
        """
        object_default_vals = obj_services.get_default_object_values()
        all_object_classes = obj_services.Registry.get_all_object_classes()
        for (obj_type, default_value) in object_default_vals.iteritems():
            self.assertIn(obj_type, all_object_classes)
            self.assertEqual(
                default_value, all_object_classes[obj_type].default_value)
