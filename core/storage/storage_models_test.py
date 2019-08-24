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

    def _get_model_module_names(self):
        all_model_module_names = []

        # As models.NAMES is an enum, it cannot be iterated. So we use the
        # __dict__ property which can be iterated.
        for name in models.NAMES.__dict__:
            if '__' not in name:
                all_model_module_names.append(name)
        return all_model_module_names

    def _get_model_classes(self):
        model_subclasses = []
        for module_name in self._get_model_module_names():
            (module,) = models.Registry.import_models([module_name])
            for member_name, member_obj in inspect.getmembers(module):
                if inspect.isclass(member_obj):
                    clazz = getattr(module, member_name)
                    all_base_classes = [
                        base_class.__name__ for base_class in inspect.getmro(
                            clazz)]
                    if 'Model' in all_base_classes:
                        model_subclasses.append(clazz)
        return model_subclasses

    def test_all_model_module_names_unique(self):
        names_of_ndb_model_subclasses = [
            clazz.__name__ for clazz in  self._get_model_classes()]

        self.assertEqual(
            len(set(names_of_ndb_model_subclasses)),
            len(names_of_ndb_model_subclasses))

    def test_all_models_have_get_deletion_policy(self):
        model_subclasses = self._get_model_classes()

        for clazz in model_subclasses:
            base_classes = [base.__name__ for base in inspect.getmro(clazz)]
            if 'BaseSnapshotMetadataModel' in base_classes:
                continue
            if 'BaseSnapshotContentModel' in base_classes:
                continue
            if 'BaseCommitLogEntryModel' in base_classes:
                continue
            try:
                clazz.get_deletion_policy()
            except NotImplementedError:
                print(clazz.__name__)

        self.assertTrue(False)
