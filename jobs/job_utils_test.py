# coding: utf-8
#
# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for jobs.job_utils."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.platform import models
from core.tests import test_utils
import feconf
from jobs import job_utils
import python_utils

from apache_beam.io.gcp.datastore.v1new import types as beam_datastore_types

(base_models,) = models.Registry.import_models([models.NAMES.base_model])

datastore_services = models.Registry.import_datastore_services()


class FooModel(datastore_services.Model):
    """Simple BaseModel subclass with a 'prop' string property."""

    prop = datastore_services.StringProperty()


class BarModel(datastore_services.Model):
    """Simple BaseModel subclass with a 'prop' integer property."""

    prop = datastore_services.IntegerProperty()


class CoreModel(base_models.BaseModel):
    """Simple BaseModel subclass with a 'prop' float property."""

    prop = datastore_services.FloatProperty()


class CloneTests(test_utils.TestBase):

    def test_clone_model(self):
        model = base_models.BaseModel(id='123', deleted=True)
        clone = job_utils.clone_model(model)

        self.assertEqual(model.id, clone.id)
        self.assertEqual(model, clone)
        self.assertIsNot(model, clone)
        self.assertIsInstance(clone, base_models.BaseModel)

    def test_clone_with_changes(self):
        model = base_models.BaseModel(id='123', deleted=True)
        clone = job_utils.clone_model(model, deleted=False)

        self.assertNotEqual(model, clone)
        self.assertIsNot(model, clone)
        self.assertIsInstance(clone, base_models.BaseModel)
        self.assertTrue(model.deleted)
        self.assertFalse(clone.deleted)

    def test_clone_with_changes_to_id(self):
        model = base_models.BaseModel(id='123')
        clone = job_utils.clone_model(model, id='124')

        self.assertNotEqual(model, clone)
        self.assertIsNot(model, clone)
        self.assertIsInstance(clone, base_models.BaseModel)
        self.assertEqual(model.id, '123')
        self.assertEqual(clone.id, '124')

    def test_clone_sub_class(self):
        model = FooModel(prop='original')
        clone = job_utils.clone_model(model)

        self.assertEqual(model, clone)
        self.assertIsNot(model, clone)
        self.assertIsInstance(clone, FooModel)
        self.assertEqual(model.prop, 'original')
        self.assertEqual(clone.prop, 'original')

    def test_clone_sub_class_with_changes(self):
        model = FooModel(prop='original')
        clone = job_utils.clone_model(model, prop='updated')

        self.assertNotEqual(model, clone)
        self.assertIsNot(model, clone)
        self.assertIsInstance(clone, FooModel)
        self.assertEqual(model.prop, 'original')
        self.assertEqual(clone.prop, 'updated')


class GetModelClassTests(test_utils.TestBase):

    def test_get_from_existing_model(self):
        self.assertIs(
            job_utils.get_model_class('BaseModel'), base_models.BaseModel)

    def test_get_from_non_existing_model(self):
        with self.assertRaisesRegexp(Exception, 'No model class found'):
            job_utils.get_model_class('InvalidModel')


class GetModelKindTests(test_utils.TestBase):

    def test_get_from_datastore_model(self):
        model = base_models.BaseModel()

        self.assertEqual(job_utils.get_model_kind(model), 'BaseModel')

    def test_get_from_datastore_model_class(self):
        self.assertEqual(
            job_utils.get_model_kind(base_models.BaseModel), 'BaseModel')

    def test_get_from_bad_value(self):
        self.assertRaisesRegexp(
            TypeError, 'not a model type',
            lambda: job_utils.get_model_kind(123))


class GetModelPropertyTests(test_utils.TestBase):

    def test_get_id_from_datastore_model(self):
        model = FooModel(id='123')

        self.assertEqual(job_utils.get_model_property(model, 'id'), '123')

    def test_get_key_from_datastore_model(self):
        model = FooModel(id='123')

        self.assertEqual(
            job_utils.get_model_property(model, '__key__'), model.key)

    def test_get_property_from_datastore_model(self):
        model = FooModel(prop='abc')

        self.assertEqual(job_utils.get_model_property(model, 'prop'), 'abc')

    def test_get_missing_property_from_datastore_model(self):
        model = FooModel()

        self.assertEqual(job_utils.get_model_property(model, 'prop'), None)

    def test_get_property_from_bad_value(self):
        with self.assertRaisesRegexp(TypeError, 'not a model instance'):
            job_utils.get_model_property(123, 'prop')


class GetModelIdTests(test_utils.TestBase):

    def test_get_id_from_datastore_model(self):
        model = FooModel(id='123')

        self.assertEqual(job_utils.get_model_id(model), '123')

    def test_get_id_from_bad_value(self):
        with self.assertRaisesRegexp(TypeError, 'not a model instance'):
            job_utils.get_model_id(123)


class GetModelKeyTests(test_utils.TestBase):

    def test_get_key_from_datastore_model(self):
        model = FooModel(id='123')

        self.assertEqual(job_utils.get_model_key(model), model.key)

    def test_get_key_from_bad_value(self):
        with self.assertRaisesRegexp(TypeError, 'not a model instance'):
            job_utils.get_model_key(123)


class BeamEntityToAndFromModelTests(test_utils.TestBase):

    def test_get_beam_entity_from_model(self):
        model = FooModel(id='abc', app=feconf.OPPIA_PROJECT_ID, prop='123')

        beam_entity = job_utils.get_beam_entity_from_ndb_model(model)

        self.assertEqual(beam_entity.key.path_elements, ('FooModel', 'abc'))
        self.assertEqual(beam_entity.key.project, feconf.OPPIA_PROJECT_ID)
        self.assertEqual(beam_entity.properties, {'prop': '123'})

    def test_get_model_from_beam_entity(self):
        beam_entity = beam_datastore_types.Entity(
            beam_datastore_types.Key(
                ('FooModel', 'abc'), project=feconf.OPPIA_PROJECT_ID))
        beam_entity.set_properties({'prop': '123'})

        self.assertEqual(
            FooModel(id='abc', app=feconf.OPPIA_PROJECT_ID, prop='123'),
            job_utils.get_ndb_model_from_beam_entity(beam_entity))

    def test_from_and_then_to_model(self):
        model = FooModel(id='abc', app=feconf.OPPIA_PROJECT_ID, prop='123')

        self.assertEqual(
            model,
            job_utils.get_ndb_model_from_beam_entity(
                job_utils.get_beam_entity_from_ndb_model(model)))

    def test_from_and_then_to_beam_entity(self):
        beam_entity = beam_datastore_types.Entity(
            beam_datastore_types.Key(
                ('FooModel', 'abc'), project=feconf.OPPIA_PROJECT_ID))
        beam_entity.set_properties({'prop': '123'})

        self.assertEqual(
            beam_entity,
            job_utils.get_beam_entity_from_ndb_model(
                job_utils.get_ndb_model_from_beam_entity(beam_entity)))


class GetBeamQueryFromNdbQueryTests(test_utils.TestBase):

    def test_query_everything(self):
        query = datastore_services.query_everything()

        beam_query = job_utils.get_beam_query_from_ndb_query(query)

        self.assertIsNone(beam_query.kind)
        self.assertEqual(beam_query.order, ('__key__',))

    def test_query_with_kind(self):
        query = base_models.BaseModel.query()

        beam_query = job_utils.get_beam_query_from_ndb_query(query)

        self.assertEqual(beam_query.kind, 'BaseModel')

    def test_query_with_namespace(self):
        query = datastore_services.Query(namespace='abc')

        beam_query = job_utils.get_beam_query_from_ndb_query(query)

        self.assertEqual(beam_query.namespace, 'abc')

    def test_query_with_project(self):
        query = datastore_services.Query(app='foo-project')

        beam_query = job_utils.get_beam_query_from_ndb_query(query)

        self.assertEqual(beam_query.project, 'foo-project')

    def test_query_with_filter(self):
        query = datastore_services.Query(filters=BarModel.prop >= 3)

        beam_query = job_utils.get_beam_query_from_ndb_query(query)

        self.assertEqual(beam_query.filters, [('prop', '>=', 3)])

    def test_query_with_range_like_filter(self):
        query = datastore_services.Query(filters=datastore_services.all_of(
            BarModel.prop >= 3, BarModel.prop < 6))

        beam_query = job_utils.get_beam_query_from_ndb_query(query)

        self.assertEqual(
            beam_query.filters, [('prop', '>=', 3), ('prop', '<', 6)])

    def test_query_with_or_filter_raises_type_error(self):
        query = datastore_services.Query(filters=datastore_services.any_of(
            BarModel.prop == 1, BarModel.prop == 2))

        with self.assertRaisesRegexp(TypeError, 'forbidden filter'):
            job_utils.get_beam_query_from_ndb_query(query)

    def test_query_with_in_filter_raises_type_error(self):
        query = datastore_services.Query(filters=BarModel.prop.IN([1, 2, 3]))

        with self.assertRaisesRegexp(TypeError, 'forbidden filter'):
            job_utils.get_beam_query_from_ndb_query(query)

    def test_query_with_not_equal_filter_raises_type_error(self):
        query = datastore_services.Query(filters=BarModel.prop != 1)

        with self.assertRaisesRegexp(TypeError, 'forbidden filter'):
            job_utils.get_beam_query_from_ndb_query(query)

    def test_query_with_order(self):
        query = BarModel.query().order(BarModel.prop)

        beam_query = job_utils.get_beam_query_from_ndb_query(query)

        self.assertEqual(beam_query.order, ('prop',))

    def test_query_with_multiple_orders(self):
        query = BarModel.query().order(BarModel.prop, BarModel.prop)

        beam_query = job_utils.get_beam_query_from_ndb_query(query)

        self.assertEqual(beam_query.order, ('prop', 'prop'))

    def test_query_with_descending_order(self):
        query = BarModel.query().order(-BarModel.prop)

        beam_query = job_utils.get_beam_query_from_ndb_query(query)

        self.assertEqual(beam_query.order, ('-prop',))


class ApplyQueryToModelsTests(test_utils.TestBase):

    def make_query(
            self, kind=None, namespace=None, project=None, filters=None,
            order=None, limit=None):
        """Returns a new beam_datastore_types.Query object.

        Args:
            kind: str|None. The kind to query. If None, all kinds are eligible.
            namespace: str|None. Namespace to restrict results to.
            project: str|None. Project associated with query.
            filters: list(tuple(str,str,str))|None. Property filters applied
                by this query. The sequence is:
                `(property_name, operator, value)`.
            order: list(str)|None. Field names used to order query results.
                Prepend `-` to a field name to sort it in descending order.
            limit: int|None. Maximum amount of results to return.

        Returns:
            beam_datastore_types.Query. The Query object.
        """
        if kind is None and order is None:
            order = ('__key__',)
        return beam_datastore_types.Query(
            kind=kind, namespace=namespace, project=project, filters=filters,
            order=order, limit=limit)

    def test_query_by_kind(self):
        foo_model = FooModel()
        bar_model = BarModel()
        model_list = [foo_model, bar_model]

        job_utils.apply_query_to_models(
            self.make_query(kind='FooModel'), model_list)

        self.assertEqual(model_list, [foo_model])

    def test_query_by_namespace(self):
        namespace_a_model = FooModel(namespace='a')
        namespace_b_model = FooModel(namespace='b')
        model_list = [namespace_a_model, namespace_b_model]

        job_utils.apply_query_to_models(
            self.make_query(namespace='a'), model_list)

        self.assertEqual(model_list, [namespace_a_model])

    def test_query_by_project(self):
        project_a_model = FooModel(app='a')
        project_b_model = FooModel(app='b')
        model_list = [project_a_model, project_b_model]

        job_utils.apply_query_to_models(
            self.make_query(project='a'), model_list)

        self.assertEqual(model_list, [project_a_model])

    def test_query_with_filter(self):
        model_list = [BarModel(prop=i) for i in python_utils.RANGE(1, 10)]

        job_utils.apply_query_to_models(
            self.make_query(filters=[('prop', '>=', 3), ('prop', '<', 6)]),
            model_list)

        self.assertEqual(
            model_list, [BarModel(prop=i) for i in python_utils.RANGE(3, 6)])

    def test_query_with_order(self):
        model_a = FooModel(prop='a')
        model_b = FooModel(prop='b')
        model_c = FooModel(prop='c')
        model_list = [model_c, model_a, model_b]

        job_utils.apply_query_to_models(
            self.make_query(kind='FooModel', order=('prop',)), model_list)

        self.assertEqual(model_list, [model_a, model_b, model_c])

    def test_query_with_limit(self):
        model_list = [BarModel(prop=i) for i in python_utils.RANGE(10)]

        job_utils.apply_query_to_models(self.make_query(limit=3), model_list)

        self.assertEqual(
            model_list, [BarModel(prop=i) for i in python_utils.RANGE(3)])

    def test_query_with_no_kind_and_wrong_order_raises_value_error(self):
        self.assertRaisesRegexp(
            ValueError,
            r'Query\(kind=None\) must also have order=\(\'__key__\',\)',
            lambda: job_utils.apply_query_to_models(
                self.make_query(kind=None, order=('prop',)), []))

    def test_query_filter_with_less_than_operator(self):
        model_list = [BarModel(prop=1), BarModel(prop=2), BarModel(prop=3)]

        job_utils.apply_query_to_models(
            self.make_query(filters=[('prop', '<', 2)]), model_list)

        self.assertEqual(model_list, [BarModel(prop=1)])

    def test_query_filter_with_less_than_or_equal_operator(self):
        model_list = [BarModel(prop=1), BarModel(prop=2), BarModel(prop=3)]

        job_utils.apply_query_to_models(
            self.make_query(filters=[('prop', '<=', 2)]), model_list)

        self.assertEqual(model_list, [BarModel(prop=1), BarModel(prop=2)])

    def test_query_filter_with_equal_operator(self):
        model_list = [BarModel(prop=1), BarModel(prop=2), BarModel(prop=3)]

        job_utils.apply_query_to_models(
            self.make_query(filters=[('prop', '=', 2)]), model_list)

        self.assertEqual(model_list, [BarModel(prop=2)])

    def test_query_filter_with_greater_than_or_equal_operator(self):
        model_list = [BarModel(prop=1), BarModel(prop=2), BarModel(prop=3)]

        job_utils.apply_query_to_models(
            self.make_query(filters=[('prop', '>=', 2)]), model_list)

        self.assertEqual(model_list, [BarModel(prop=2), BarModel(prop=3)])

    def test_query_filter_with_greater_than_operator(self):
        model_list = [BarModel(prop=1), BarModel(prop=2), BarModel(prop=3)]

        job_utils.apply_query_to_models(
            self.make_query(filters=[('prop', '>', 2)]), model_list)

        self.assertEqual(model_list, [BarModel(prop=3)])

    def test_query_filter_with_unsupported_operator_raises_value_error(self):
        model_list = [BarModel(prop=1), BarModel(prop=2), BarModel(prop=3)]

        with self.assertRaisesRegexp(ValueError, 'Unsupported comparison'):
            job_utils.apply_query_to_models(
                self.make_query(filters=[('prop', '!=', 2)]), model_list)

    def test_query_with_order_by_property_ascending(self):
        model_a = FooModel(prop='a')
        model_b = FooModel(prop='b')
        model_c = FooModel(prop='c')
        model_list = [model_c, model_a, model_b]

        job_utils.apply_query_to_models(
            self.make_query(kind='FooModel', order=('prop',)), model_list)

        self.assertEqual(model_list, [model_a, model_b, model_c])

    def test_query_with_order_by_property_descending(self):
        model_a = FooModel(prop='a')
        model_b = FooModel(prop='b')
        model_c = FooModel(prop='c')
        model_list = [model_c, model_a, model_b]

        job_utils.apply_query_to_models(
            self.make_query(kind='FooModel', order=('-prop',)), model_list)

        self.assertEqual(model_list, [model_c, model_b, model_a])
