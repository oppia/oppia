# Copyright 2018 The Oppia Authors. All Rights Reserved.
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

"""Testing Services for configuration properties."""

import collections

from core.domain import config_domain
from core.domain import config_services
from core.tests import test_utils


class ConfigServicesDomainUnitTests(test_utils.GenericTestBase):

    def setUp(self):
        super(ConfigServicesDomainUnitTests, self).setUp()
        ConfigObj = collections.namedtuple(
            'ConfigObj', 'name new_config_value')
        self.committer_id = u'configServicesCommitterID'
        self.config_obj = ConfigObj(
            name='propertyName', new_config_value='propertyValue')
        self.invalid_property_name = u'_no_such_property_name'
        self.property_dummy_value = u'TEST_VALUE'
        self.schema_unicode = 'unicode'
        self.cfg_schemas = config_domain.Registry.get_config_property_schemas()
        # Get first property name, with unicode as schema type.
        self.property_name = next(
            x for x in self.cfg_schemas if
            self.cfg_schemas[x]['schema']['type'] == self.schema_unicode)

    def test_set_property(self):
        with self.assertRaisesRegexp(
            Exception, 'No config property with name.+'):

            config_services.set_property(
                self.committer_id, self.invalid_property_name,
                self.property_dummy_value)

        config_services.set_property(
            self.committer_id, self.property_name,
            self.property_dummy_value)

    def test_revert_property(self):
        with self.assertRaisesRegexp(
            Exception, 'No config property with name.+'):

            config_services.revert_property(
                self.committer_id, self.invalid_property_name)

        config_services.revert_property(self.committer_id, self.property_name)
        updated_schemas = config_domain.Registry.get_config_property_schemas()
        updated_property_config = updated_schemas[self.property_name]
        self.assertEqual(
            updated_property_config, self.cfg_schemas[self.property_name])
