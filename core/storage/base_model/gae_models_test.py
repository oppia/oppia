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

__author__ = 'Sean Lip'

from core.platform import models
(base_models,) = models.Registry.import_models([models.NAMES.base_model])
from core.tests import test_utils


class BaseModelUnitTests(test_utils.GenericTestBase):
    """Test the generic base model."""

    def tearDown(self):
        """Deletes all model entities."""
        for entity in base_models.BaseModel.get_all():
            entity.delete()

        super(BaseModelUnitTests, self).tearDown()

    def test_error_cases_for_get_method(self):
        with self.assertRaises(base_models.BaseModel.EntityNotFoundError):
            base_models.BaseModel.get('Invalid id')
        with self.assertRaises(base_models.BaseModel.EntityNotFoundError):
            base_models.BaseModel.get('Invalid id', strict=True)

        self.assertIsNone(
            base_models.BaseModel.get('Invalid id', strict=False))

    def test_generic_query_put_get_and_delete_operations(self):
        model = base_models.BaseModel()

        all_models = [m for m in base_models.BaseModel.get_all()]
        self.assertEqual(len(all_models), 0)

        model.put()
        all_models = [m for m in base_models.BaseModel.get_all()]
        self.assertEqual(len(all_models), 1)
        self.assertEqual(all_models[0], model)

        model_id = all_models[0].id
        self.assertEqual(model, base_models.BaseModel.get(model_id))

        model.delete()
        all_models = [m for m in base_models.BaseModel.get_all()]
        self.assertEqual(len(all_models), 0)
        with self.assertRaises(base_models.BaseModel.EntityNotFoundError):
            model.get(model_id)

    def test_get_multi(self):
        model1 = base_models.BaseModel()
        model2 = base_models.BaseModel()
        model2.deleted = True

        model1.put()
        model2.put()

        model1_id = model1.id
        model2_id = model2.id

        result = base_models.BaseModel.get_multi([model1_id, model2_id, 'none'])

        self.assertEqual(result, [model1, None, None])

    def test_get_new_id_method_returns_unique_ids(self):
        ids = set([])
        for _ in range(100):
            new_id = base_models.BaseModel.get_new_id('')
            self.assertNotIn(new_id, ids)

            base_models.BaseModel(id=new_id).put()
            ids.add(new_id)

    def test_get_new_id_method_does_not_fail_with_bad_names(self):
        base_models.BaseModel.get_new_id(None)
        base_models.BaseModel.get_new_id('¡Hola!')
        base_models.BaseModel.get_new_id(12345)
        base_models.BaseModel.get_new_id({'a': 'b'})
