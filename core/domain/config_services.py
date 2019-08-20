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

"""Services for configuration properties."""

from core.domain import config_domain
from core.platform import models

(config_models,) = models.Registry.import_models([models.NAMES.config])
memcache_services = models.Registry.import_memcache_services()

CMD_CHANGE_PROPERTY_VALUE = 'change_property_value'


def set_property(committer_id, name, value):
    """Sets a property value. The property must already be registered.
    Args:
        committer_id: str. The user ID of the committer.
        name: str. The name of the property.
        value: str. The value of the property.
    Raises:
        Exception: No config property with the specified name is found.
    """

    config_property = config_domain.Registry.get_config_property(name)
    if config_property is None:
        raise Exception('No config property with name %s found.' % name)

    config_property.set_value(committer_id, value)


def revert_property(committer_id, name):
    """Reverts a property value to the default value.
    Args:
        committer_id: str. The user ID of the committer.
        name: str. The name of the property.
    Raises:
        Exception: No config property with the specified name is found.
    """

    config_property = config_domain.Registry.get_config_property(name)
    if config_property is None:
        raise Exception('No config property with name %s found.' % name)

    set_property(committer_id, name, config_property.default_value)
