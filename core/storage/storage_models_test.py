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
import os
import pkgutil

from core.platform import models
from core.tests import test_utils

class StorageModelsTest(test_utils.GenericTestBase):
    """Tests for Oppia storage models"""

    def test_all_model_names_unique(self):
        all_model_file_paths = [
            os.path.join('core', 'storage', name)
            for name in vars(models.NAMES)]
        all_models = []
        for path in all_model_file_paths:
            for loader, name, _ in pkgutil.iter_modules(path=[path]):
                module = loader.find_module(name).load_module(name)
                if '_test' in module.__file__: continue
                #print module.__file__, dir(module)
                for var in dir(module):
                    if 'Model' in var:
                        clazz = getattr(module, var)
                        ancestor_names = [
                            base_class.__name__ for base_class in clazz.__bases__]
                        if (
                            'ndb.Model' in ancestor_names or
                            'BaseModel' in ancestor_names or
                            'VersionedModel' in ancestor_names):
                            #print module.__file__, clazz.__name__
                            all_models.append(clazz.__name__)
        print dir(module)
        frequency_of_model_names = {}
        for model in all_models:
            if model in frequency_of_model_names:
                frequency_of_model_names[model] += 1
            else:
                frequency_of_model_names[model] = 1
        print frequency_of_model_names
        for model in frequency_of_model_names:
            print model, frequency_of_model_names[model]
            self.assertEqual(frequency_of_model_names[model], 1)

