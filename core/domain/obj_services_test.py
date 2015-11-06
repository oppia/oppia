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

__author__ = 'Sean Lip'

from core.domain import obj_services
from core.tests import test_utils
from extensions.objects.models import objects


class ObjectRegistryUnitTests(test_utils.GenericTestBase):
    """Test the Registry class in obj_services."""

    def test_get_object_class_by_type_method(self):
        """Tests the normal behavior of get_object_class_by_type()."""
        IntClass = obj_services.Registry.get_object_class_by_type('Int')
        assert IntClass.__name__ == 'Int'

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
