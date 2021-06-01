# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Provides a seam for datastore services."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import contextlib
import datetime
import functools

from core.platform import models
import python_utils

from google.appengine.api import datastore_types
from google.appengine.datastore import datastore_query
from google.appengine.datastore import datastore_stub_util
from google.appengine.ext import ndb

transaction_services = models.Registry.import_transaction_services()
Model = ndb.Model
Key = ndb.Key
Property = ndb.Property
Query = ndb.Query

BooleanProperty = ndb.BooleanProperty
DateProperty = ndb.DateProperty
ComputedProperty = ndb.ComputedProperty
DateTimeProperty = ndb.DateTimeProperty
FloatProperty = ndb.FloatProperty
IntegerProperty = ndb.IntegerProperty
JsonProperty = ndb.JsonProperty
UserProperty = ndb.UserProperty


@functools.wraps(ndb.StringProperty)
def StringProperty(*args, **kwargs): # pylint: disable=invalid-name
    """Enforces requirement for models to use StringProperty(indexed=True)."""
    if not kwargs.get('indexed', True):
        raise ValueError('StringProperty(indexed=False) is no longer supported')
    return ndb.StringProperty(*args, **kwargs)


@functools.wraps(ndb.TextProperty)
def TextProperty(*args, **kwargs): # pylint: disable=invalid-name
    """Enforces requirement for models to use TextProperty(indexed=False)."""
    if kwargs.get('indexed', False):
        raise ValueError('TextProperty(indexed=True) is no longer supported')
    return ndb.TextProperty(*args, **kwargs)


def get_multi(keys):
    """Fetches models corresponding to a sequence of keys.

    Args:
        keys: list(str). The keys to look up.

    Returns:
        list(datastore_services.Model | None). List whose items are either a
        Model instance or None if the corresponding key wasn't found.
    """
    return ndb.get_multi(keys)


def update_timestamps_multi(entities, update_last_updated_time=True):
    """Update the created_on and last_updated fields of all given entities.

    Args:
        entities: list(datastore_services.Model). List of model instances to
            be stored.
        update_last_updated_time: bool. Whether to update the
            last_updated field of the model.
    """
    for entity in entities:
        entity.update_timestamps(
            update_last_updated_time=update_last_updated_time)


def put_multi(entities):
    """Stores a sequence of Model instances.

    Args:
        entities: list(datastore_services.Model). A list of Model instances.

    Returns:
        list(str). A list with the stored keys.
    """
    return ndb.put_multi(entities)


@transaction_services.run_in_transaction_wrapper
def delete_multi_transactional(keys):
    """Deletes models corresponding to a sequence of keys and runs it through
    a transaction. Either all models are deleted, or none of them in the case
    when the transaction fails.

    Args:
        keys: list(str). A list of keys.

    Returns:
        list(None). A list of Nones, one per deleted model.
    """
    return ndb.delete_multi(keys)


def delete_multi(keys):
    """Deletes models corresponding to a sequence of keys.

    Args:
        keys: list(str). A list of keys.

    Returns:
        list(None). A list of Nones, one per deleted model.
    """
    return ndb.delete_multi(keys)


def transaction(callback):
    """Run a callback in a transaction.

    To pass arguments to a callback function, use a lambda, for example:

    def my_callback(key, inc): do_something()
    transaction(lambda: my_callback(Key(...), 1))

    Args:
        callback: callable. A function or tasklet to be called.

    Returns:
        *. Whatever callback() returns.

    Raises:
        Exception. Whatever callback() raises, or
            datastore_errors.TransactionFailedError when the transaction failed.
    """
    return ndb.transaction(
        callback, xg=True, propagation=ndb.TransactionOptions.ALLOWED)


def query_everything():
    """Returns a query that targets every single entity in the datastore."""
    return ndb.Query()


def all_of(*nodes):
    """Returns a query node which performs a boolean AND on their conditions.

    Args:
        *nodes: datastore_services.Node. The nodes to combine.

    Returns:
        datastore_services.Node. A node combining the conditions using boolean
        AND.
    """
    return ndb.AND(*nodes)


def any_of(*nodes):
    """Returns a query node which performs a boolean OR on their conditions.

    Args:
        *nodes: datastore_services.Node. The nodes to combine.

    Returns:
        datastore_services.Node. A node combining the conditions using boolean
        OR.
    """
    return ndb.OR(*nodes)


def make_cursor(urlsafe_cursor=None):
    """Makes an immutable cursor that points to a relative position in a query.

    The position denoted by a Cursor is relative to the result of a query, even
    if the result is removed later on. Usually, the position points to whatever
    immediately follows the last result of a batch.

    A cursor should only be used on a query with an identical signature to the
    one that produced it, or on a query with its sort order reversed.

    A Cursor constructed with no arguments points to the first result of any
    query. If such a Cursor is used as an end_cursor, no results will be
    returned.

    Args:
        urlsafe_cursor: str | None. The base64-encoded serialization of a
            cursor. When None, the cursor returned will point to the first
            result of any query.

    Returns:
        datastore_query.Cursor. A cursor into an arbitrary query.
    """
    return datastore_query.Cursor(urlsafe=urlsafe_cursor)


def fetch_multiple_entities_by_ids_and_models(ids_and_models):
    """Fetches the entities from the datastore corresponding to the given ids
    and models.

    Args:
        ids_and_models: list(tuple(str, list(str))). The ids and their
            corresponding model names for which we have to fetch entities.

    Returns:
        list(list(datastore_services.Model)). The model instances corresponding
        to the ids and models. The models corresponding to the same tuple in the
        input are grouped together.
    """
    entity_keys = []
    for (model_name, entity_ids) in ids_and_models:
        # Add the keys to the list of keys whose entities we have to fetch.
        entity_keys = (
            entity_keys +
            [ndb.Key(model_name, entity_id) for entity_id in entity_ids])

    all_models = ndb.get_multi(entity_keys)
    all_models_grouped_by_model_type = []

    start_index = 0
    for (_, entity_ids) in ids_and_models:
        all_models_grouped_by_model_type.append(
            all_models[start_index:start_index + len(entity_ids)])
        start_index = start_index + len(entity_ids)

    return all_models_grouped_by_model_type


def make_instantaneous_global_consistency_policy():
    """Returns a policy that always gives the same sequence of consistency
    decisions.

    Returns:
        datastore_stub_util.PseudoRandomHRConsistencyPolicy. The policy.
    """
    return datastore_stub_util.PseudoRandomHRConsistencyPolicy(probability=1.0)


@contextlib.contextmanager
def mock_datetime_for_datastore(mocked_now):
    """Mocks parts of the datastore to accept a fake datetime type that always
    returns the same value for utcnow.

    Example:
        import datetime
        mocked_now = datetime.datetime.utcnow() - datetime.timedelta(days=1)
        with mock_datetime_for_datastore(mocked_now):
            self.assertEqual(datetime.datetime.utcnow(), mocked_now)
        not_now = datetime.datetime.utcnow() # Returns actual time.

    Args:
        mocked_now: datetime.datetime. The datetime which will be used
            instead of the current UTC datetime.

    Yields:
        None. Empty yield statement.
    """

    if not isinstance(mocked_now, datetime.datetime):
        raise Exception('mocked_now must be datetime, got: %r' % mocked_now)

    old_datetime_type = datetime.datetime

    class MockDatetimeType(type):
        """Pretends to be a datetime.datetime object."""

        def __instancecheck__(cls, other):
            """Validates whether the given instance is a datetime instance."""
            return isinstance(other, old_datetime_type)

    class MockDatetime( # pylint: disable=inherit-non-class
            python_utils.with_metaclass(MockDatetimeType, old_datetime_type)):
        """Always returns mocked_now as the current time."""

        @classmethod
        def utcnow(cls):
            """Returns the mocked datetime."""

            return mocked_now

    setattr(datetime, 'datetime', MockDatetime)
    setattr(ndb.DateTimeProperty, 'data_type', MockDatetime)

    # Updates datastore types for MockDatetime to ensure that validation of ndb
    # datetime properties does not fail.
    datastore_types._VALIDATE_PROPERTY_VALUES[MockDatetime] = ( # pylint: disable=protected-access
        datastore_types.ValidatePropertyNothing)
    datastore_types._PACK_PROPERTY_VALUES[MockDatetime] = ( # pylint: disable=protected-access
        datastore_types.PackDatetime)
    datastore_types._PROPERTY_MEANINGS[MockDatetime] = ( # pylint: disable=protected-access
        datastore_types.entity_pb.Property.GD_WHEN)

    try:
        yield
    finally:
        # Resets the datastore types to forget the mocked types.
        del datastore_types._PROPERTY_MEANINGS[MockDatetime] # pylint: disable=protected-access
        del datastore_types._PACK_PROPERTY_VALUES[MockDatetime] # pylint: disable=protected-access
        del datastore_types._VALIDATE_PROPERTY_VALUES[MockDatetime] # pylint: disable=protected-access
        setattr(ndb.DateTimeProperty, 'data_type', datetime.datetime)
        setattr(datetime, 'datetime', old_datetime_type)
