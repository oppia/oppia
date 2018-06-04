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

"""Tests for Oppia storage models."""
import inspect

from core.platform import models
from core.tests import test_utils


class StorageModelsTest(test_utils.GenericTestBase):
    """Tests for Oppia storage models."""

    def test_all_model_names_unique(self):
        all_model_names = []
        for name in models.NAMES.__dict__:
            if '__' not in name:
                all_model_names.append(name)

        names_of_ndb_model_subclasses = []
        for name in all_model_names:
            (module, ) = models.Registry.import_models([name])
            for member_name, member_obj in inspect.getmembers(module):
                if inspect.isclass(member_obj):
                    clazz = getattr(module, member_name)
                    ancestor_names = [
                        base_class.__name__ for base_class in clazz.__bases__]
                    if (
                            'ndb.Model' in ancestor_names or
                            'BaseModel' in ancestor_names or
                            'VersionedModel' in ancestor_names):
                        names_of_ndb_model_subclasses.append(clazz.__name__)

        self.assertEqual(
            len(set(names_of_ndb_model_subclasses)),
            len(names_of_ndb_model_subclasses))
