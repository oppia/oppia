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

"""Services for configuration properties."""

__author__ = 'Sean Lip'


from core.domain import config_domain
from core.platform import models
(config_models,) = models.Registry.import_models([models.NAMES.config])
memcache_services = models.Registry.import_memcache_services()


def set_property(name, value):
    """Sets a property value. The property must already exist."""

    config_property = config_domain.Registry.get_config_property(name)
    if config_property is None:
        raise Exception('No config property with name %s found.')

    try:
        value = config_property.value_type(value)
    except Exception:
        raise Exception('Cannot cast value of %s to %s (expected type %s)'
                        % (config_property.name, value,
                           config_property.value_type))

    # Set value in datastore.
    datastore_item = config_models.ConfigPropertyModel.get(
        config_property.name, strict=False)
    if datastore_item is None:
        datastore_item = config_models.ConfigPropertyModel(
            id=config_property.name)
    datastore_item.value = value
    datastore_item.put()

    # Set value in memcache.
    memcache_services.set_multi({
        datastore_item.id: datastore_item.value})
