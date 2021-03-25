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

"""Common utilities for test classes."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import ast
import collections
import contextlib
import copy
import inspect
import itertools
import json
import logging
import os
import re
import unittest

from constants import constants
from core.controllers import base
from core.domain import auth_domain
from core.domain import caching_domain
from core.domain import collection_domain
from core.domain import collection_services
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import fs_domain
from core.domain import fs_services
from core.domain import interaction_registry
from core.domain import question_domain
from core.domain import question_services
from core.domain import rights_manager
from core.domain import skill_domain
from core.domain import skill_services
from core.domain import state_domain
from core.domain import story_domain
from core.domain import story_services
from core.domain import subtopic_page_domain
from core.domain import subtopic_page_services
from core.domain import taskqueue_services
from core.domain import topic_domain
from core.domain import topic_services
from core.domain import user_services
from core.platform import models
from core.platform.search import elastic_search_services
from core.platform.taskqueue import cloud_tasks_emulator
import feconf
import main
import main_mail
import main_taskqueue
from proto import text_classifier_pb2
import python_utils
import schema_utils
import utils

import contextlib2
import elasticsearch
from google.appengine.api import mail
from google.appengine.ext import deferred
from google.appengine.ext import testbed
import requests_mock
import webtest

(
    auth_models, exp_models, feedback_models, question_models, skill_models,
    story_models, suggestion_models, topic_models,) = (
        models.Registry.import_models([
            models.NAMES.auth, models.NAMES.exploration, models.NAMES.feedback,
            models.NAMES.question, models.NAMES.skill, models.NAMES.story,
            models.NAMES.suggestion, models.NAMES.topic]))

current_user_services = models.Registry.import_current_user_services()
datastore_services = models.Registry.import_datastore_services()
email_services = models.Registry.import_email_services()
memory_cache_services = models.Registry.import_cache_services()
platform_auth_services = models.Registry.import_auth_services()
platform_taskqueue_services = models.Registry.import_taskqueue_services()

# Prefix to append to all lines printed by tests to the console.
# We are using the b' prefix as all the stdouts are in bytes.
LOG_LINE_PREFIX = b'LOG_INFO_TEST: '

# List of model classes that don't have Wipeout or Takeout, related class
# methods defined because they're not used directly but only as
# base classes for the other models.
BASE_MODEL_CLASSES_WITHOUT_DATA_POLICIES = (
    'BaseCommitLogEntryModel',
    'BaseHumanMaintainedModel',
    'BaseMapReduceBatchResultsModel',
    'BaseModel',
    'BaseSnapshotContentModel',
    'BaseSnapshotMetadataModel',
    'VersionedModel',
)


def get_filepath_from_filename(filename, rootdir):
    """Returns filepath using the filename. Different files are present in
    different subdirectories in the rootdir. So, we walk through the rootdir and
    match the all the filenames with the given filename.  When a match is found
    the function returns the complete path of the filename by using
    os.path.join(root, filename).

    For example signup-page.mainpage.html is present in
    core/templates/pages/signup-page and error-page.mainpage.html is present in
    core/templates/pages/error-pages. So we walk through core/templates/pages
    and a match for signup-page.component.html is found in signup-page
    subdirectory and a match for error-page.directive.html is found in
    error-pages subdirectory.

    Args:
        filename: str. The name of the file.
        rootdir: str. The directory to search the file in.

    Returns:
        str | None. The path of the file if file is found otherwise
        None.
    """
    # This is required since error files are served according to error status
    # code. The file served is error-page.mainpage.html but it is compiled and
    # stored as error-page-{status_code}.mainpage.html.  So, we need to swap the
    # name here to obtain the correct filepath.
    if filename.startswith('error-page'):
        filename = 'error-page.mainpage.html'
    matches = list(itertools.chain.from_iterable(
        (os.path.join(subdir, f) for f in filenames if f == filename)
        for subdir, _, filenames in os.walk(rootdir)))
    if len(matches) > 1:
        raise Exception('Multiple files found with name: %s' % filename)
    return matches[0] if matches else None


def mock_load_template(filename):
    """Mock for load_template function. This mock is required for backend tests
    since we do not have webpack compilation before backend tests. The folder to
    search templates is webpack_bundles which is generated after webpack
    compilation. Since this folder will be missing, load_template function will
    return an error. So, we use a mock for load_template which returns the html
    file from the source directory instead.

    Args:
        filename: str. The name of the file for which template is to be
            returned.

    Returns:
        str. The contents of the given file.
    """
    filepath = get_filepath_from_filename(
        filename, os.path.join('core', 'templates', 'pages'))
    with python_utils.open_file(filepath, 'r') as f:
        return f.read()


def check_image_png_or_webp(image_string):
    """Checks if the image is in png or webp format only.

    Args:
        image_string: str. Image url in base64 format.

    Returns:
        bool. Returns true if image is in WebP format.
    """
    return image_string.startswith(('data:image/png', 'data:image/webp'))


def get_storage_model_module_names():
    """Get all module names in storage."""
    # As models.NAMES is an enum, it cannot be iterated over. So we use the
    # __dict__ property which can be iterated over.
    for name in models.NAMES.__dict__:
        if '__' not in name:
            yield name


def get_storage_model_classes():
    """Get all model classes in storage."""
    for module_name in get_storage_model_module_names():
        (module,) = models.Registry.import_models([module_name])
        for member_name, member_obj in inspect.getmembers(module):
            if inspect.isclass(member_obj):
                clazz = getattr(module, member_name)
                all_base_classes = [
                    base_class.__name__ for base_class in inspect.getmro(
                        clazz)]
                if 'Model' in all_base_classes:
                    yield clazz


class ElasticSearchStub(python_utils.OBJECT):
    """This stub class mocks the functionality of ES in
    elastic_search_services.py.

    IMPORTANT NOTE TO DEVELOPERS: These mock functions are NOT guaranteed to
    be exact implementations of elasticsearch functionality. If the results of
    this mock and the local dev elasticsearch instance differ, the mock
    functions should be updated so that their behaviour matches what a local
    dev instance would return. (For example, this mock always has a 'version'
    of 1 in the return dict and an arbitrary '_seq_no', although the version
    number increments with every PUT in the elasticsearch Python client
    library and the '_seq_no' increments with every operation.)
    """

    _DB = {}

    def reset(self):
        """Helper method that clears the mock database."""
        self._DB.clear()

    def _generate_index_not_found_error(self, index_name):
        """Helper method that generates an elasticsearch 'index not found' 404
        error.

        Args:
            index_name: str. The index that was not found.

        Returns:
            elasticsearch.NotFoundError. A manually-constructed error
            indicating that the index was not found.
        """
        raise elasticsearch.NotFoundError(
            404, 'index_not_found_exception', {
                'status': 404,
                'error': {
                    'reason': 'no such index [%s]' % index_name,
                    'root_cause': [{
                        'reason': 'no such index [%s]' % index_name,
                        'index': index_name,
                        'index_uuid': '_na_',
                        'type': 'index_not_found_exception',
                        'resource.type': 'index_or_alias',
                        'resource.id': index_name
                    }],
                    'index': index_name,
                    'index_uuid': '_na_',
                    'type': 'index_not_found_exception',
                    'resource.type': 'index_or_alias',
                    'resource.id': index_name
                }
            }
        )

    def mock_create_index(self, index_name):
        """Creates an index with the given name.

        Args:
            index_name: str. The name of the index to create.

        Returns:
            dict. A dict representing the ElasticSearch API response.

        Raises:
            elasticsearch.RequestError. An index with the given name already
                exists.
        """
        if index_name in self._DB:
            raise elasticsearch.RequestError(
                400, 'resource_already_exists_exception',
                'index [%s/RaNdOmStRiNgOfAlPhAs] already exists' % index_name)
        self._DB[index_name] = []
        return {
            'index': index_name,
            'acknowledged': True,
            'shards_acknowledged': True
        }

    def mock_index(self, index_name, document, id=None):  # pylint: disable=redefined-builtin
        """Adds a document with the given ID to the index.

        Note that, unfortunately, we have to keep the name of "id" for the
        last kwarg, although it conflicts with a Python builtin. This is
        because the name is an existing part of the API defined at
        https://elasticsearch-py.readthedocs.io/en/v7.10.1/api.html

        Args:
            index_name: str. The name of the index to create.
            document: dict. The document to store.
            id: str. The unique identifier of the document.

        Returns:
            dict. A dict representing the ElasticSearch API response.

        Raises:
            elasticsearch.RequestError. An index with the given name already
                exists.
        """
        if index_name not in self._DB:
            raise self._generate_index_not_found_error(index_name)
        self._DB[index_name] = [
            d for d in self._DB[index_name] if d['id'] != id]
        self._DB[index_name].append(document)
        return {
            '_index': index_name,
            '_shards': {
                'total': 2,
                'successful': 1,
                'failed': 0,
            },
            '_seq_no': 96,
            '_primary_term': 1,
            'result': 'created',
            '_id': id,
            '_version': 1,
            '_type': '_doc',
        }

    def mock_exists(self, index_name, doc_id):
        """Checks whether a document with the given ID exists in the mock
        database.

        Args:
            index_name: str. The name of the index to check.
            doc_id: str. The document id to check.

        Returns:
            bool. Whether the document exists in the index.

        Raises:
            elasticsearch.NotFoundError: The given index name was not found.
        """
        if index_name not in self._DB:
            raise self._generate_index_not_found_error(index_name)
        return any([d['id'] == doc_id for d in self._DB[index_name]])

    def mock_delete(self, index_name, doc_id):
        """Deletes a document from an index in the mock database. Does nothing
        if the document is not in the index.

        Args:
            index_name: str. The name of the index to delete the document from.
            doc_id: str. The document id to be deleted from the index.

        Returns:
            dict. A dict representing the ElasticSearch API response.

        Raises:
            Exception. The document does not exist in the index.
            elasticsearch.NotFoundError. The given index name was not found, or
                the given doc_id was not found in the given index.
        """
        if index_name not in self._DB:
            raise self._generate_index_not_found_error(index_name)
        docs = [d for d in self._DB[index_name] if d['id'] != doc_id]
        if len(self._DB[index_name]) != len(docs):
            self._DB[index_name] = docs
            return {
                '_type': '_doc',
                '_seq_no': 99,
                '_shards': {
                    'total': 2,
                    'successful': 1,
                    'failed': 0
                },
                'result': 'deleted',
                '_primary_term': 1,
                '_index': index_name,
                '_version': 4,
                '_id': '0'
            }

        raise elasticsearch.NotFoundError(
            404, {
                '_index': index_name,
                '_type': '_doc',
                '_id': doc_id,
                '_version': 1,
                'result': 'not_found',
                '_shards': {
                    'total': 2,
                    'successful': 1,
                    'failed': 0
                },
                '_seq_no': 103,
                '_primary_term': 1
            })

    def mock_delete_by_query(self, index_name, query):
        """Deletes documents from an index based on the given query.

        Note that this mock only supports a specific for the query, i.e. the
        one which clears the entire index. It asserts that all calls to this
        function use that query format.

        Args:
            index_name: str. The name of the index to delete the documents from.
            query: dict. The query that defines which documents to delete.

        Returns:
            dict. A dict representing the ElasticSearch response.

        Raises:
            AssertionError. The query is not in the correct form.
            elasticsearch.NotFoundError. The given index name was not found.
        """
        assert query.keys() == ['query']
        assert query['query'] == {
            'match_all': {}
        }
        if index_name not in self._DB:
            raise self._generate_index_not_found_error(index_name)
        index_size = len(self._DB[index_name])
        del self._DB[index_name][:]
        return {
            'took': 72,
            'version_conflicts': 0,
            'noops': 0,
            'throttled_until_millis': 0,
            'failures': [],
            'throttled_millis': 0,
            'total': index_size,
            'batches': 1,
            'requests_per_second': -1.0,
            'retries': {u'search': 0, u'bulk': 0},
            'timed_out': False,
            'deleted': index_size
        }

    def mock_search(self, body=None, index=None, params=None):
        """Searches and returns documents that match the given query.

        Args:
            body: dict. A dictionary search definition that uses Query DSL.
            index: str. The name of the index to search.
            params: dict. A dict with two keys: `size` and `from`. The
                corresponding values are ints which represent the number of
                results to fetch, and the offset from which to fetch them,
                respectively.

        Returns:
            dict. A dict representing the ElasticSearch response.

        Raises:
            AssertionError. The given arguments are not supported by this mock.
            elasticsearch.NotFoundError. The given index name was not found.
        """
        assert body is not None
        # "_all" and "" are special index names that are used to search across
        # all indexes. We do not allow their use.
        assert index not in ['_all', '', None]
        assert sorted(params.keys()) == ['from', 'size']

        if index not in self._DB:
            raise self._generate_index_not_found_error(index)

        result_docs = []
        result_doc_ids = set([])
        for doc in self._DB[index]:
            if not doc['id'] in result_doc_ids:
                result_docs.append(doc)
                result_doc_ids.add(doc['id'])

        filters = body['query']['bool']['filter']
        terms = body['query']['bool']['must']

        for f in filters:
            for k, v in f['match'].items():
                result_docs = [doc for doc in result_docs if doc[k] in v]

        if terms:
            filtered_docs = []
            for term in terms:
                for _, v in term.items():
                    values = v['query'].split(' ')
                    for doc in result_docs:
                        strs = [val for val in doc.values() if isinstance(
                            val, python_utils.BASESTRING)]
                        words = []
                        for s in strs:
                            words += s.split(' ')
                        if all([value in words for value in values]):
                            filtered_docs.append(doc)
            result_docs = filtered_docs

        formatted_result_docs = [{
            '_id': doc['id'],
            '_score': 0.0,
            '_type': '_doc',
            '_index': index,
            '_source': doc
        } for doc in result_docs[
            params['from']: params['from'] + params['size']
        ]]

        return {
            'timed_out': False,
            '_shards': {
                'failed': 0,
                'total': 1,
                'successful': 1,
                'skipped': 0
            },
            'took': 4,
            'hits': {
                'hits': formatted_result_docs
            },
            'total': {
                'value': len(formatted_result_docs),
                'relation': 'eq'
            },
            'max_score': max(
                [0.0] + [d['_score'] for d in formatted_result_docs]),
        }


class AuthServicesStub(python_utils.OBJECT):
    """Test-only implementation of the public API in core.platform.auth."""

    def __init__(self):
        """Initializes a new instance that emulates an empty auth server."""
        self._user_id_by_auth_id = {}
        self._external_user_id_associations = set()

    @classmethod
    def install_stub(cls, test):
        """Installs a new instance of the stub onto the given test instance.

        Args:
            test: GenericTestBase. The test instance to install the stub on.

        Returns:
            callable. A function that will uninstall the stub when called.
        """
        with contextlib2.ExitStack() as stack:
            stub = cls()

            stack.enter_context(test.swap(
                platform_auth_services, 'establish_auth_session',
                stub.establish_auth_session))
            stack.enter_context(test.swap(
                platform_auth_services, 'destroy_auth_session',
                stub.destroy_auth_session))
            stack.enter_context(test.swap(
                platform_auth_services, 'get_auth_claims_from_request',
                stub.get_auth_claims_from_request))
            stack.enter_context(test.swap(
                platform_auth_services, 'mark_user_for_deletion',
                stub.mark_user_for_deletion))
            stack.enter_context(test.swap(
                platform_auth_services, 'delete_external_auth_associations',
                stub.delete_external_auth_associations))
            stack.enter_context(test.swap(
                platform_auth_services,
                'verify_external_auth_associations_are_deleted',
                stub.verify_external_auth_associations_are_deleted))
            stack.enter_context(test.swap(
                platform_auth_services, 'get_auth_id_from_user_id',
                stub.get_auth_id_from_user_id))
            stack.enter_context(test.swap(
                platform_auth_services, 'get_user_id_from_auth_id',
                stub.get_user_id_from_auth_id))
            stack.enter_context(test.swap(
                platform_auth_services, 'get_multi_user_ids_from_auth_ids',
                stub.get_multi_user_ids_from_auth_ids))
            stack.enter_context(test.swap(
                platform_auth_services, 'get_multi_auth_ids_from_user_ids',
                stub.get_multi_auth_ids_from_user_ids))
            stack.enter_context(test.swap(
                platform_auth_services, 'associate_auth_id_with_user_id',
                stub.associate_auth_id_with_user_id))
            stack.enter_context(test.swap(
                platform_auth_services,
                'associate_multi_auth_ids_with_user_ids',
                stub.associate_multi_auth_ids_with_user_ids))

            # Standard usage of ExitStack: enter a bunch of context managers
            # from the safety of an ExitStack's context. Once they've all been
            # opened, pop_all() of them off of the original context so they can
            # *stay* open. Calling the function returned will exit all of them
            # in reverse order.
            # https://docs.python.org/3/library/contextlib.html#cleaning-up-in-an-enter-implementation
            return stack.pop_all().close

    @classmethod
    def establish_auth_session(cls, unused_request, unused_response):
        """Sets login cookies to maintain a user's sign-in session.

        Args:
            unused_request: webapp2.Request. Unused because os.environ handles
                sessions.
            unused_response: webapp2.Response. Unused because os.environ handles
                sessions.
        """
        pass

    @classmethod
    def destroy_auth_session(cls, unused_response):
        """Clears login cookies from the given response headers.

        Args:
            unused_response: webapp2.Response. Unused because os.environ handles
                sessions.
        """
        pass

    @classmethod
    def get_auth_claims_from_request(cls, unused_request):
        """Authenticates the request and returns claims about its authorizer.

        This stub obtains authorization information from os.environ. To make the
        operation more authentic, this method also creates a new "external"
        association for the user to simulate a genuine "provided" value.

        Args:
            unused_request: webapp2.Request. The HTTP request to authenticate.
                Unused because auth-details are extracted from environment
                variables.

        Returns:
            AuthClaims|None. Claims about the currently signed in user. If no
            user is signed in, then returns None.
        """
        auth_id = os.environ.get('USER_ID', '')
        email = os.environ.get('USER_EMAIL', '')
        role_is_super_admin = os.environ.get('USER_IS_ADMIN', '0') == '1'
        if auth_id:
            return auth_domain.AuthClaims(auth_id, email, role_is_super_admin)
        return None

    def mark_user_for_deletion(self, user_id):
        """Marks the user, and all of their auth associations, as deleted.

        Since the stub does not use models, this operation actually deletes the
        user's association. The "external" associations, however, are not
        deleted yet.

        Args:
            user_id: str. The unique ID of the user whose associations should be
                deleted.
        """
        self._user_id_by_auth_id = {
            a: u for a, u in self._user_id_by_auth_id.items() if u != user_id
        }

    def delete_external_auth_associations(self, user_id):
        """Deletes all associations that refer to the user outside of Oppia.

        Args:
            user_id: str. The unique ID of the user whose associations should be
                deleted.
        """
        self._external_user_id_associations.discard(user_id)

    def verify_external_auth_associations_are_deleted(self, user_id):
        """Returns true if and only if we have successfully verified that all
        external associations have been deleted.

        Args:
            user_id: str. The unique ID of the user whose associations should be
                checked.

        Returns:
            bool. True if and only if we have successfully verified that all
            external associations have been deleted.
        """
        return user_id not in self._external_user_id_associations

    def get_auth_id_from_user_id(self, user_id):
        """Returns the auth ID associated with the given user ID.

        Args:
            user_id: str. The user ID.

        Returns:
            str|None. The auth ID associated with the given user ID, or None if
            no association exists.
        """
        return python_utils.NEXT(
            (a for a, u in self._user_id_by_auth_id.items() if u == user_id),
            None)

    def get_user_id_from_auth_id(self, auth_id):
        """Returns the user ID associated with the given auth ID.

        Args:
            auth_id: str. The auth ID.

        Returns:
            str|None. The user ID associated with the given auth ID, or None if
            no association exists.
        """
        return self._user_id_by_auth_id.get(auth_id, None)

    def get_multi_user_ids_from_auth_ids(self, auth_ids):
        """Returns the user IDs associated with the given auth IDs.

        Args:
            auth_ids: list(str). The auth IDs.

        Returns:
            list(str|None). The user IDs associated with each of the given auth
            IDs, or None for associations which don't exist.
        """
        return [self._user_id_by_auth_id.get(a, None) for a in auth_ids]

    def get_multi_auth_ids_from_user_ids(self, user_ids):
        """Returns the auth IDs associated with the given user IDs.

        Args:
            user_ids: list(str). The user IDs.

        Returns:
            list(str|None). The auth IDs associated with each of the given user
            IDs, or None for associations which don't exist.
        """
        auth_id_by_user_id = {u: a for a, u in self._user_id_by_auth_id.items()}
        return [auth_id_by_user_id.get(u, None) for u in user_ids]

    def associate_auth_id_with_user_id(self, auth_id_user_id_pair):
        """Commits the association between auth ID and user ID.

        This method also adds the user to the "external" set of associations.

        Args:
            auth_id_user_id_pair: auth_domain.AuthIdUserIdPair. The association
                to commit.

        Raises:
            Exception. The IDs are already associated with a value.
        """
        auth_id, user_id = auth_id_user_id_pair
        if auth_id in self._user_id_by_auth_id:
            raise Exception(
                'auth_id=%r is already associated with user_id=%r' % (
                    auth_id, self._user_id_by_auth_id[auth_id]))
        auth_models.UserAuthDetailsModel(
            id=user_id, firebase_auth_id=auth_id).put()
        self._external_user_id_associations.add(user_id)
        self._user_id_by_auth_id[auth_id] = user_id

    def associate_multi_auth_ids_with_user_ids(self, auth_id_user_id_pairs):
        """Commits the associations between auth IDs and user IDs.

        This method also adds the users to the "external" set of associations.

        Args:
            auth_id_user_id_pairs: list(auth_domain.AuthIdUserIdPair). The
                associations to commit.

        Raises:
            Exception. One or more auth associations already exist.
        """
        collisions = ', '.join(
            '{auth_id=%r: user_id=%r}' % (a, self._user_id_by_auth_id[a])
            for a, _ in auth_id_user_id_pairs if a in self._user_id_by_auth_id)
        if collisions:
            raise Exception('already associated: %s' % collisions)
        datastore_services.put_multi(
            [auth_models.UserAuthDetailsModel(
                id=user_id, firebase_auth_id=auth_id)
             for auth_id, user_id in auth_id_user_id_pairs])
        self._external_user_id_associations.add(
            u for _, u in auth_id_user_id_pairs)
        self._user_id_by_auth_id.update(auth_id_user_id_pairs)


class TaskqueueServicesStub(python_utils.OBJECT):
    """The stub class that mocks the API functionality offered by the platform
    layer, namely the platform.taskqueue taskqueue services API.
    """

    def __init__(self, test_base):
        """Initializes a taskqueue services stub that replaces the API
        functionality of core.platform.taskqueue.

        Args:
            test_base: GenericTestBase. The current test base.
        """
        self._test_base = test_base
        self._client = cloud_tasks_emulator.Emulator(
            task_handler=self._task_handler, automatic_task_handling=False)

    def _task_handler(self, url, payload, queue_name, task_name=None):
        """Makes a POST request to the task URL in the test app.

        Args:
            url: str. URL of the handler function.
            payload: dict(str : *). Payload to pass to the request. Defaults
                to None if no payload is required.
            queue_name: str. The name of the queue to add the task to.
            task_name: str|None. Optional. The name of the task.
        """
        headers = {
            'X-Appengine-QueueName': python_utils.convert_to_bytes(queue_name),
            'X-Appengine-TaskName': (
                # Maps empty strings to None so the output can become 'None'.
                python_utils.convert_to_bytes(task_name or None)),
            'X-AppEngine-Fake-Is-Admin': python_utils.convert_to_bytes(1),
        }
        csrf_token = self._test_base.get_new_csrf_token()
        self._test_base.post_task(url, payload, headers, csrf_token=csrf_token)

    def create_http_task(
            self, queue_name, url, payload=None, scheduled_for=None,
            task_name=None):
        """Creates a Task in the corresponding queue that will be executed when
        the 'scheduled_for' countdown expires using the cloud tasks emulator.

        Args:
            queue_name: str. The name of the queue to add the task to.
            url: str. URL of the handler function.
            payload: dict(str : *). Payload to pass to the request. Defaults to
                None if no payload is required.
            scheduled_for: datetime|None. The naive datetime object for the time
                to execute the task. Ignored by this stub.
            task_name: str|None. Optional. The name of the task.
        """
        # Causes the task to execute immediately by setting the scheduled_for
        # time to 0. If we allow scheduled_for to be non-zero, then tests that
        # rely on the actions made by the task will become unreliable.
        scheduled_for = 0
        self._client.create_task(
            queue_name, url, payload, scheduled_for=scheduled_for,
            task_name=task_name)

    def count_jobs_in_taskqueue(self, queue_name=None):
        """Returns the total number of tasks in a single queue if a queue name
        is specified or the entire taskqueue if no queue name is specified.

        Args:
            queue_name: str|None. Name of the queue. Pass in None if no specific
                queue is designated.

        Returns:
            int. The total number of tasks in a single queue or in the entire
            taskqueue.
        """
        return self._client.get_number_of_tasks(queue_name=queue_name)

    def process_and_flush_tasks(self, queue_name=None):
        """Executes all of the tasks in a single queue if a queue name is
        specified or all of the tasks in the taskqueue if no queue name is
        specified.

        Args:
            queue_name: str|None. Name of the queue. Pass in None if no specific
                queue is designated.
        """
        self._client.process_and_flush_tasks(queue_name=queue_name)

    def get_pending_tasks(self, queue_name=None):
        """Returns a list of the tasks in a single queue if a queue name is
        specified or a list of all of the tasks in the taskqueue if no queue
        name is specified.

        Args:
            queue_name: str|None. Name of the queue. Pass in None if no specific
                queue is designated.

        Returns:
            list(Task). List of tasks in a single queue or in the entire
            taskqueue.
        """
        return self._client.get_tasks(queue_name=queue_name)


class MemoryCacheServicesStub(python_utils.OBJECT):
    """The stub class that mocks the API functionality offered by the platform
    layer, namely the platform.cache cache services API.
    """

    _CACHE_DICT = {}

    def get_memory_cache_stats(self):
        """Returns a mock profile of the cache dictionary. This mock does not
        have the functionality to test for peak memory usage and total memory
        usage so the values for those attributes will be 0.

        Returns:
            MemoryCacheStats. MemoryCacheStats object containing the total
            number of keys in the cache dictionary.
        """
        return caching_domain.MemoryCacheStats(0, 0, len(self._CACHE_DICT))

    def flush_cache(self):
        """Wipes the cache dictionary clean."""
        self._CACHE_DICT.clear()

    def get_multi(self, keys):
        """Looks up a list of keys in cache dictionary.

        Args:
            keys: list(str). A list of keys (strings) to look up.

        Returns:
            list(str). A list of values in the cache dictionary corresponding to
            the keys that are passed in.
        """
        assert isinstance(keys, list)
        return [self._CACHE_DICT.get(key, None) for key in keys]

    def set_multi(self, key_value_mapping):
        """Sets multiple keys' values at once in the cache dictionary.

        Args:
            key_value_mapping: dict(str, str). Both the key and value are
                strings. The value can either be a primitive binary-safe string
                or the JSON-encoded string version of the object.

        Returns:
            bool. Whether the set action succeeded.
        """
        assert isinstance(key_value_mapping, dict)
        self._CACHE_DICT.update(key_value_mapping)
        return True

    def delete_multi(self, keys):
        """Deletes multiple keys in the cache dictionary.

        Args:
            keys: list(str). The keys to delete.

        Returns:
            int. Number of successfully deleted keys.
        """
        assert all(isinstance(key, python_utils.BASESTRING) for key in keys)
        keys_to_delete = [key for key in keys if key in self._CACHE_DICT]
        for key in keys_to_delete:
            del self._CACHE_DICT[key]
        return len(keys_to_delete)


class TestBase(unittest.TestCase):
    """Base class for all tests."""

    maxDiff = 2500

    # A test unicode string.
    UNICODE_TEST_STRING = 'unicode ¡马!'

    def _get_unicode_test_string(self, suffix):
        """Returns a string that contains unicode characters and ends with the
        given suffix. This is used to test that functions behave correctly when
        handling strings with unicode characters.

        Args:
            suffix: str. The suffix to append to the UNICODE_TEST_STRING.

        Returns:
            str. A string that contains unicode characters and ends with the
            given suffix.
        """
        return '%s%s' % (self.UNICODE_TEST_STRING, suffix)

    def _assert_validation_error(self, item, error_substring):
        """Checks that the given item passes default validation."""
        with self.assertRaisesRegexp(utils.ValidationError, error_substring):
            item.validate()

    def log_line(self, line):
        """Print the line with a prefix that can be identified by the script
        that calls the test.
        """
        # We are using the b' prefix as all the stdouts are in bytes.
        python_utils.PRINT(
            b'%s%s' % (LOG_LINE_PREFIX, python_utils.convert_to_bytes(line)))

    def shortDescription(self):
        """Additional information logged during unit test invocation."""
        # Suppress default logging of docstrings.
        return None

    def get_updated_param_dict(
            self, param_dict, param_changes, exp_param_specs):
        """Updates a param dict using the given list of param_changes.

        Note that the list of parameter changes is ordered. Parameter changes
        later in the list may depend on parameter changes that have been set
        earlier in the same list.
        """
        new_param_dict = copy.deepcopy(param_dict)
        for param_change in param_changes:
            try:
                obj_type = exp_param_specs[param_change.name].obj_type
            except:
                raise Exception('Parameter %s not found' % param_change.name)
            new_param_dict[param_change.name] = (
                param_change.get_normalized_value(obj_type, new_param_dict))
        return new_param_dict

    def get_static_asset_filepath(self):
        """Returns filepath to the static files on disk ('' or 'build/')."""
        return '' if constants.DEV_MODE else os.path.join('build')

    def get_static_asset_url(self, asset_suffix):
        """Returns the relative path for the asset, appending it to the
        corresponding cache slug. asset_suffix should have a leading slash.
        """
        return '/assets%s%s' % (utils.get_asset_dir_prefix(), asset_suffix)

    @contextlib.contextmanager
    def capture_logging(self, min_level=logging.NOTSET):
        """Context manager that captures logs into a list.

        Strips whitespace from messages for convenience.

        https://docs.python.org/3/howto/logging-cookbook.html#using-a-context-manager-for-selective-logging

        Args:
            min_level: int. The minimum logging level captured by the context
                manager. By default, all logging levels are captured. Values
                should be one of the following values from the logging module:
                NOTSET, DEBUG, INFO, WARNING, ERROR, CRITICAL.

        Yields:
            list(str). A live-feed of the logging messages captured so-far.
        """
        captured_logs = []

        class ListStream(python_utils.OBJECT):
            """Stream-like object that appends writes to the captured logs."""

            def write(self, msg):
                """Appends stripped messages to captured logs."""
                captured_logs.append(msg.strip())

            def flush(self):
                """Does nothing."""
                pass

        list_stream_handler = logging.StreamHandler(stream=ListStream())

        logger = logging.getLogger()
        old_level = logger.level
        logger.addHandler(list_stream_handler)
        logger.setLevel(min_level)
        try:
            yield captured_logs
        finally:
            logger.setLevel(old_level)
            logger.removeHandler(list_stream_handler)

    @contextlib.contextmanager
    def swap(self, obj, attr, newvalue):
        """Swap an object's attribute value within the context of a 'with'
        statement. The object can be anything that supports getattr and setattr,
        such as class instances, modules, etc.

        Example usage:

            import math
            with self.swap(math, 'sqrt', lambda x: 42):
                print math.sqrt(16.0) # prints 42
            print math.sqrt(16.0) # prints 4 as expected.

        To mock class methods, pass the function to the classmethod decorator
        first, for example:

            import types
            with self.swap(
                SomePythonClass, 'some_classmethod',
                classmethod(new_classmethod)):

        NOTE: self.swap and other context managers that are created using
        contextlib.contextmanager use generators that yield exactly once. This
        means that you can only use them once after construction, otherwise,
        the generator will immediately raise StopIteration, and contextlib will
        raise a RuntimeError.
        """
        original = getattr(obj, attr)
        setattr(obj, attr, newvalue)
        try:
            yield
        finally:
            setattr(obj, attr, original)

    @contextlib.contextmanager
    def swap_to_always_return(self, obj, attr, value=None):
        """Swap obj.attr with a function that always returns the given value."""
        def function_that_always_returns(*unused_args, **unused_kwargs):
            """Returns the input value."""
            return value
        with self.swap(obj, attr, function_that_always_returns):
            yield

    @contextlib.contextmanager
    def swap_to_always_raise(self, obj, attr, error=Exception):
        """Swap obj.attr with a function that always raises the given error."""
        def function_that_always_raises(*unused_args, **unused_kwargs):
            """Raises the input exception."""
            raise error
        with self.swap(obj, attr, function_that_always_raises):
            yield

    @contextlib.contextmanager
    def swap_with_checks(
            self, obj, attr, new_value, expected_args=None,
            expected_kwargs=None, called=True):
        """Swap an object's function value within the context of a 'with'
        statement. The object can be anything that supports getattr and setattr,
        such as class instances, modules, etc.

        Examples:
            If you want to check subprocess.Popen is invoked twice like
            `subprocess.Popen(['python'], shell=True)` and
            `subprocess.Popen(['python2], shell=False), you can first define the
            mock function, then the swap, and just run the target function in
            context, as follows:

                def mock_popen(command, shell):
                    return

                popen_swap = self.swap_with_checks(
                    subprocess, 'Popen', mock_popen,
                    expected_args=[(['python'],), (['python2'],)],
                    expected_kwargs=[{'shell': True}, {'shell': False}])
                with popen_swap:
                    function_that_invokes_popen()

        Args:
            obj: *. The Python object whose attribute you want to swap.
            attr: str. The name of the function to be swapped.
            new_value: function. The new function you want to use.
            expected_args: None|list(tuple). The expected args that you want
                this function to be invoked with. When its value is None, args
                will not be checked. If the value type is list, the function
                will check whether the called args is the first element in the
                list. If matched, this tuple will be removed from the list.
            expected_kwargs: None|list(dict). The expected keyword args you want
                this function to be invoked with. Similar to expected_args.
            called: bool. Whether the function is expected to be invoked. This
                will always be checked.

        Yields:
            context. The context with function replaced.
        """
        original = getattr(obj, attr)
        # The actual error message will also include detail assert error message
        # via the `self.longMessage` below.
        msg = 'Expected checks failed when swapping out in %s.%s tests.' % (
            obj.__name__, attr)

        def wrapper(*args, **kwargs):
            """Wrapper function for the new value. This function will do the
            check before the wrapped function is invoked. After the function
            finished, the wrapper will update how many times this function is
            invoked.

            Args:
                *args: list(*). The args passed into `attr` function.
                **kwargs: dict. The key word args passed into `attr` function.

            Returns:
                *. Result of `new_value`.
            """
            wrapper.called = True
            if expected_args is not None:
                self.assertEqual(args, expected_args[0], msg=msg)
                expected_args.pop(0)
            if expected_kwargs is not None:
                self.assertEqual(kwargs, expected_kwargs[0], msg=msg)
                expected_kwargs.pop(0)
            result = new_value(*args, **kwargs)
            return result

        wrapper.called = False
        setattr(obj, attr, wrapper)
        error_occurred = False
        try:
            # This will show the detailed assert message.
            self.longMessage = True
            yield
        except Exception:
            error_occurred = True
            # Raise issues thrown by the called function or assert error.
            raise
        finally:
            setattr(obj, attr, original)
            if not error_occurred:
                self.assertEqual(wrapper.called, called, msg=msg)
                self.assertFalse(expected_args, msg=msg)
                self.assertFalse(expected_kwargs, msg=msg)
            self.longMessage = False

    def assertRaises(self, *args, **kwargs):
        raise NotImplementedError(
            'self.assertRaises should not be used in these tests. Please use '
            'self.assertRaisesRegexp instead.')

    def assertRaisesRegexp(  # pylint: disable=keyword-arg-before-vararg
            self, expected_exception, expected_regexp, callable_obj=None,
            *args, **kwargs):
        if not expected_regexp:
            raise Exception(
                'Please provide a sufficiently strong regexp string to '
                'validate that the correct error is being raised.')

        return super(TestBase, self).assertRaisesRegexp(
            expected_exception, expected_regexp,
            callable_obj=callable_obj, *args, **kwargs)

    def assert_matches_regexps(self, items, regexps, full_match=False):
        """Asserts that each item matches the corresponding regexp.

        If there are any missing or extra items that do not correspond to a
        regexp element, then the assertion fails.

        Args:
            items: list(str). The string elements being matched.
            regexps: list(str|RegexObject). The patterns that each item is
                expected to match.
            full_match: bool. Whether to require items to match exactly with the
                corresponding pattern.

        Raises:
            AssertionError. At least one item does not match its corresponding
                pattern, or the number of items does not match the number of
                regexp patterns.
        """
        get_match = re.match if full_match else re.search
        differences = [
            '~ [i=%d]:\t%r does not match: %r' % (i, item, regexp)
            for i, (regexp, item) in enumerate(python_utils.ZIP(regexps, items))
            if get_match(regexp, item, re.DOTALL) is None
        ]
        if len(items) < len(regexps):
            extra_regexps = regexps[len(items):]
            differences.extend(
                '- [i=%d]:\tmissing item expected to match: %r' % (i, regexp)
                for i, regexp in enumerate(extra_regexps, start=len(items)))
        if len(regexps) < len(items):
            extra_items = items[len(regexps):]
            differences.extend(
                '+ [i=%d]:\textra item %r' % (i, item)
                for i, item in enumerate(extra_items, start=len(regexps)))

        if differences:
            error_message = 'Lists differ:\n\t%s' % '\n\t'.join(differences)
            raise AssertionError(error_message)


class AppEngineTestBase(TestBase):
    """Minimal base class for tests that need Google App Engine functionality.

    This class is primarily designed for unit tests in core.platform, where we
    write adapters around Oppia's third-party dependencies. Generally, our unit
    tests depend on stub implementations of these adapters to protect them from
    platform-specific behavior. Such stubs are installed in the
    GenericTestBase.run() method.

    Most of the unit tests in our code base do, and should, inherit from
    `GenericTestBase` to stay platform-agnostic. The platform layer itself,
    however, can _not_ mock out platform-specific behavior. Those unit tests
    need to interact with a real implementation. This base class provides the
    bare-minimum functionality and stubs necessary to do so.
    """

    # Environment values that our tests depend on.
    AUTH_DOMAIN = 'example.com'
    HTTP_HOST = 'localhost'
    SERVER_NAME = 'localhost'
    SERVER_PORT = '8080'
    DEFAULT_VERSION_HOSTNAME = '%s:%s' % (HTTP_HOST, SERVER_PORT)

    def __init__(self, *args, **kwargs):
        super(AppEngineTestBase, self).__init__(*args, **kwargs)
        # Defined outside of setUp() because we access it from methods, but can
        # only install it during the run() method. Defining it in __init__
        # satisfies pylint's attribute-defined-outside-init warning.
        self._platform_taskqueue_services_stub = TaskqueueServicesStub(self)

    def setUp(self):
        super(AppEngineTestBase, self).setUp()
        self.testbed = testbed.Testbed()
        self.testbed.activate()

        self.testbed.setup_env(
            overwrite=True,
            auth_domain=self.AUTH_DOMAIN, http_host=self.HTTP_HOST,
            server_name=self.SERVER_NAME, server_port=self.SERVER_PORT,
            default_version_hostname=self.DEFAULT_VERSION_HOSTNAME)

        # Google App Engine service stubs.
        self.testbed.init_app_identity_stub()
        self.testbed.init_blobstore_stub()
        self.testbed.init_files_stub()
        self.testbed.init_memcache_stub()
        self.testbed.init_search_stub()
        self.testbed.init_urlfetch_stub()
        self.testbed.init_user_stub()

        policy = (
            datastore_services.make_instantaneous_global_consistency_policy())
        self.testbed.init_datastore_v3_stub(consistency_policy=policy)

        # The root path tells the testbed where to find the queue.yaml file.
        self.testbed.init_taskqueue_stub(root_path=os.getcwd())
        self._testbed_taskqueue_stub = (
            self.testbed.get_stub(testbed.TASKQUEUE_SERVICE_NAME))

        # Set up apps for testing.
        self.testapp = webtest.TestApp(main.app)
        self.taskqueue_testapp = webtest.TestApp(main_taskqueue.app)
        self.mail_testapp = webtest.TestApp(main_mail.app)

    def tearDown(self):
        self.testbed.deactivate()
        super(AppEngineTestBase, self).tearDown()

    def run(self, result=None):
        """Run the test, collecting the result into the specified TestResult.

        Reference URL:
        https://docs.python.org/3/library/unittest.html#unittest.TestCase.run

        AppEngineTestBase's override of run() wraps super().run() in "swap"
        contexts which stub out the platform taskqueue services.

        Args:
            result: TestResult | None. Holds onto the results of each test. If
                None, a temporary result object is created (by calling the
                defaultTestResult() method) and used instead.
        """
        platform_taskqueue_services_swap = self.swap(
            platform_taskqueue_services, 'create_http_task',
            self._platform_taskqueue_services_stub.create_http_task)
        with platform_taskqueue_services_swap:
            super(AppEngineTestBase, self).run(result=result)

    def _get_all_queue_names(self):
        """Returns a list of all queue names."""
        return [q['name'] for q in self._testbed_taskqueue_stub.GetQueues()]

    def count_jobs_in_taskqueue(self, queue_name):
        """Returns the total number of tasks in a single queue if a queue name
        is specified or the entire taskqueue if no queue name is specified.

        Args:
            queue_name: str|None. Name of the queue. Pass in None if no specific
                queue is designated.

        Returns:
            int. The total number of tasks in a single queue or in the entire
            taskqueue.
        """
        return self._platform_taskqueue_services_stub.count_jobs_in_taskqueue(
            queue_name=queue_name)

    def process_and_flush_pending_tasks(self, queue_name=None):
        """Executes all of the tasks in a single queue if a queue name is
        specified or all of the tasks in the taskqueue if no queue name is
        specified.

        Args:
            queue_name: str|None. Name of the queue. Pass in None if no specific
                queue is designated.
        """
        self._platform_taskqueue_services_stub.process_and_flush_tasks(
            queue_name=queue_name)

    def get_pending_tasks(self, queue_name=None):
        """Returns a list of the tasks in a single queue if a queue name is
        specified or a list of all of the tasks in the taskqueue if no queue
        name is specified.

        Args:
            queue_name: str|None. Name of the queue. Pass in None if no specific
                queue is designated.

        Returns:
            list(Task). List of tasks in a single queue or in the entire
            taskqueue.
        """
        return self._platform_taskqueue_services_stub.get_pending_tasks(
            queue_name=queue_name)

    def count_jobs_in_mapreduce_taskqueue(self, queue_name):
        """Counts the jobs in the given MapReduce taskqueue."""
        return len(self.get_pending_mapreduce_tasks(queue_name=queue_name))

    def get_pending_mapreduce_tasks(self, queue_name=None):
        """Returns the jobs in the given MapReduce taskqueue. If queue_name is
        None, defaults to returning the jobs in all available queues.
        """
        queue_names = None if queue_name is None else [queue_name]
        return self._testbed_taskqueue_stub.get_filtered_tasks(
            queue_names=queue_names)

    def _execute_mapreduce_tasks(self, tasks):
        """Execute MapReduce queued tasks.

        Args:
            tasks: list(google.appengine.api.taskqueue.taskqueue.Task). The
                queued tasks.
        """
        for task in tasks:
            if task.url == '/_ah/queue/deferred':
                deferred.run(task.payload)
            else:
                # All other tasks will be for MapReduce or taskqueue.
                params = task.payload or ''
                headers = {
                    'Content-Length': python_utils.convert_to_bytes(len(params))
                }
                headers.update(
                    (key, python_utils.convert_to_bytes(val))
                    for key, val in task.headers.items())

                app = (
                    self.taskqueue_testapp if task.url.startswith('/task') else
                    self.testapp)
                response = app.post(
                    task.url, params=params, headers=headers,
                    expect_errors=True)

                if response.status_code != 200:
                    raise RuntimeError('MapReduce task failed: %r' % task)

    def process_and_flush_pending_mapreduce_tasks(self, queue_name=None):
        """Runs and flushes pending MapReduce tasks. If queue_name is None, does
        so for all queues; otherwise, this only runs and flushes tasks for the
        specified queue.

        For more information on taskqueue_stub, see:
        https://code.google.com/p/googleappengine/source/browse/trunk/python/google/appengine/api/taskqueue/taskqueue_stub.py
        """
        queue_names = (
            self._get_all_queue_names() if queue_name is None else [queue_name])

        get_enqueued_tasks = lambda: list(
            self._testbed_taskqueue_stub.get_filtered_tasks(
                queue_names=queue_names))

        # Loops until get_enqueued_tasks() returns an empty list.
        for tasks in iter(get_enqueued_tasks, []):
            for queue in queue_names:
                self._testbed_taskqueue_stub.FlushQueue(queue)
            self._execute_mapreduce_tasks(tasks)

    def run_but_do_not_flush_pending_mapreduce_tasks(self):
        """"Runs, but does not flush, the pending MapReduce tasks."""
        queue_names = self._get_all_queue_names()
        tasks = self._testbed_taskqueue_stub.get_filtered_tasks(
            queue_names=queue_names)

        for queue in queue_names:
            self._testbed_taskqueue_stub.FlushQueue(queue)

        self._execute_mapreduce_tasks(tasks)


class GenericTestBase(AppEngineTestBase):
    """Base test class with common/generic helper methods.

    Unless a class is testing for "platform"-specific behavior (e.g., testing
    third-party library code or database model implementations), always inherit
    from this base class. Otherwise, inherit from unittest.TestCase (preferred)
    or AppEngineTestBase if Google App Engine services/behavior is needed.

    TODO(#12135): Split this enormous test base into smaller, focused pieces.
    """

    # NOTE: For tests that do not/can not use the default super-admin, authors
    # can override the following class-level constant.
    AUTO_CREATE_DEFAULT_SUPERADMIN_USER = True

    # This is the value that gets returned by default when
    # app_identity.get_application_id() is called during tests.
    EXPECTED_TEST_APP_ID = 'dummy-cloudsdk-project-id'

    SUPER_ADMIN_EMAIL = 'tmpsuperadmin@example.com'
    SUPER_ADMIN_USERNAME = 'tmpsuperadm1n'

    # Dummy strings representing user attributes. Note that it is up to the
    # individual test to actually register these users as editors, admins, etc.
    ADMIN_EMAIL = 'admin@example.com'
    # Usernames containing the string 'admin' are reserved, so we use 'adm'
    # instead.
    ADMIN_USERNAME = 'adm'
    MODERATOR_EMAIL = 'moderator@example.com'
    MODERATOR_USERNAME = 'moderator'
    OWNER_EMAIL = 'owner@example.com'
    OWNER_USERNAME = 'owner'
    EDITOR_EMAIL = 'editor@example.com'
    EDITOR_USERNAME = 'editor'
    TOPIC_MANAGER_EMAIL = 'topicmanager@example.com'
    TOPIC_MANAGER_USERNAME = 'topicmanager'
    VOICE_ARTIST_EMAIL = 'voiceartist@example.com'
    VOICE_ARTIST_USERNAME = 'voiceartist'
    VIEWER_EMAIL = 'viewer@example.com'
    VIEWER_USERNAME = 'viewer'
    NEW_USER_EMAIL = 'new.user@example.com'
    NEW_USER_USERNAME = 'newuser'
    DEFAULT_END_STATE_NAME = 'End'

    PSEUDONYMOUS_ID = 'pid_%s' % ('a' * 32)

    VERSION_0_STATES_DICT = {
        feconf.DEFAULT_INIT_STATE_NAME: {
            'content': [{'type': 'text', 'value': ''}],
            'param_changes': [],
            'interaction': {
                'customization_args': {},
                'id': 'Continue',
                'handlers': [{
                    'name': 'submit',
                    'rule_specs': [{
                        'dest': 'END',
                        'feedback': [],
                        'param_changes': [],
                        'definition': {'rule_type': 'default'},
                    }],
                }],
            },
        },
    }

    VERSION_27_STATE_DICT = {
        'content': {'content_id': 'content', 'html': ''},
        'param_changes': [],
        'content_ids_to_audio_translations': {
            'content': {},
            'default_outcome': {},
            'hint_1': {},
            'solution': {},
        },
        'written_translations': {
            'translations_mapping': {
                'content': {},
                'default_outcome': {},
                'hint_1': {},
                'solution': {},
            },
        },
        'interaction': {
            'solution': {
                'correct_answer': 'Solution',
                'explanation': {
                    'content_id': 'solution',
                    'html': '<p>Solution explanation</p>',
                },
                'answer_is_exclusive': False,
            },
            'answer_groups': [],
            'default_outcome': {
                'param_changes': [],
                'feedback': {
                    'content_id': 'default_outcome',
                    'html': '',
                },
                'dest': None,
                'refresher_exploration_id': None,
                'missing_prerequisite_skill_id': None,
                'labelled_as_correct': True,
            },
            'customization_args': {
                'rows': {'value': 1},
                'placeholder': {'value': 'Enter text here'},
            },
            'confirmed_unclassified_answers': [],
            'id': 'TextInput',
            'hints': [{
                'hint_content': {
                    'content_id': 'hint_1',
                    'html': '<p>Hint 1</p>',
                },
            }],
        },
        'classifier_model_id': None,
    }

    VERSION_1_STORY_CONTENTS_DICT = {
        'nodes': [{
            'outline': (
                '<p>Value</p>'
                '<oppia-noninteractive-math '
                'raw_latex-with-value="&amp;quot;+,-,-,+&amp;quot;">'
                '</oppia-noninteractive-math>'),
            'exploration_id': None,
            'destination_node_ids': [],
            'outline_is_finalized': False,
            'acquired_skill_ids': [],
            'id': 'node_1',
            'title': 'Chapter 1',
            'prerequisite_skill_ids': [],
        }],
        'initial_node_id': 'node_1',
        'next_node_id': 'node_2',
    }

    VERSION_2_STORY_CONTENTS_DICT = {
        'nodes': [{
            'outline': (
                '<p>Value</p>'
                '<oppia-noninteractive-math '
                'raw_latex-with-value="&amp;quot;+,-,-,+&amp;quot;">'
                '</oppia-noninteractive-math>'),
            'exploration_id': None,
            'destination_node_ids': [],
            'outline_is_finalized': False,
            'acquired_skill_ids': [],
            'id': 'node_1',
            'title': 'Chapter 1',
            'prerequisite_skill_ids': [],
            'thumbnail_filename': None,
            'thumbnail_bg_color': None,
        }],
        'initial_node_id': 'node_1',
        'next_node_id': 'node_2',
    }

    VERSION_3_STORY_CONTENTS_DICT = {
        'nodes': [{
            'outline': (
                '<p>Value</p>'
                '<oppia-noninteractive-math '
                'raw_latex-with-value="&amp;quot;+,-,-,+&amp;quot;">'
                '</oppia-noninteractive-math>'),
            'exploration_id': None,
            'destination_node_ids': [],
            'outline_is_finalized': False,
            'acquired_skill_ids': [],
            'id': 'node_1',
            'title': 'Chapter 1',
            'description': '',
            'prerequisite_skill_ids': [],
            'thumbnail_filename': None,
            'thumbnail_bg_color': None,
        }],
        'initial_node_id': 'node_1',
        'next_node_id': 'node_2',
    }

    VERSION_4_STORY_CONTENTS_DICT = {
        'nodes': [{
            'outline': (
                '<p>Value</p>'
                '<oppia-noninteractive-math math_content-with-value="{'
                '&amp;quot;raw_latex&amp;quot;: &amp;quot;+,-,-,+&amp;quot;, '
                '&amp;quot;svg_filename&amp;quot;: &amp;quot;&amp;quot;'
                '}">'
                '</oppia-noninteractive-math>'),
            'exploration_id': None,
            'destination_node_ids': [],
            'outline_is_finalized': False,
            'acquired_skill_ids': [],
            'id': 'node_1',
            'title': 'Chapter 1',
            'description': '',
            'prerequisite_skill_ids': [],
            'thumbnail_filename': None,
            'thumbnail_bg_color': None,
        }],
        'initial_node_id': 'node_1',
        'next_node_id': 'node_2',
    }

    VERSION_1_SUBTOPIC_DICT = {
        'skill_ids': ['skill_1'],
        'id': 1,
        'title': 'A subtitle',
    }

    # Dictionary-like data structures within sample YAML must be formatted
    # alphabetically to match string equivalence with YAML generation tests. The
    # indentations are also important, since it is used to define nesting (just
    # like Python).
    #
    # If evaluating differences in YAML, conversion to dict form via
    # utils.dict_from_yaml can isolate differences quickly.

    SAMPLE_YAML_CONTENT = (
        """author_notes: ''
auto_tts_enabled: true
blurb: ''
category: Category
correctness_feedback_enabled: false
init_state_name: %s
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: %d
states:
  %s:
    classifier_model_id: null
    content:
      content_id: content
      html: ''
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args: {}
      default_outcome:
        dest: %s
        feedback:
          content_id: default_outcome
          html: ''
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: null
      solution: null
    next_content_id_index: 0
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        content: {}
        default_outcome: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        content: {}
        default_outcome: {}
  New state:
    classifier_model_id: null
    content:
      content_id: content
      html: ''
    interaction:
      answer_groups: []
      confirmed_unclassified_answers: []
      customization_args: {}
      default_outcome:
        dest: New state
        feedback:
          content_id: default_outcome
          html: ''
        labelled_as_correct: false
        missing_prerequisite_skill_id: null
        param_changes: []
        refresher_exploration_id: null
      hints: []
      id: null
      solution: null
    next_content_id_index: 0
    param_changes: []
    recorded_voiceovers:
      voiceovers_mapping:
        content: {}
        default_outcome: {}
    solicit_answer_details: false
    written_translations:
      translations_mapping:
        content: {}
        default_outcome: {}
states_schema_version: %d
tags: []
title: Title
""") % (
    feconf.DEFAULT_INIT_STATE_NAME,
    exp_domain.Exploration.CURRENT_EXP_SCHEMA_VERSION,
    feconf.DEFAULT_INIT_STATE_NAME, feconf.DEFAULT_INIT_STATE_NAME,
    feconf.CURRENT_STATE_SCHEMA_VERSION)

    def run(self, result=None):
        """Run the test, collecting the result into the specified TestResult.

        Reference URL:
        https://docs.python.org/3/library/unittest.html#unittest.TestCase.run

        GenericTestBase's override of run() wraps super().run() in swap
        contexts to mock out the cache and taskqueue services.

        Args:
            result: TestResult | None. Holds onto the results of each test. If
                None, a temporary result object is created (by calling the
                defaultTestResult() method) and used instead.
        """
        memory_cache_services_stub = MemoryCacheServicesStub()
        memory_cache_services_stub.flush_cache()
        es_stub = ElasticSearchStub()
        es_stub.reset()

        with contextlib2.ExitStack() as stack:
            stack.callback(AuthServicesStub.install_stub(self))
            stack.enter_context(self.swap(
                elastic_search_services.ES.indices, 'create',
                es_stub.mock_create_index))
            stack.enter_context(self.swap(
                elastic_search_services.ES, 'index',
                es_stub.mock_index))
            stack.enter_context(self.swap(
                elastic_search_services.ES, 'exists',
                es_stub.mock_exists))
            stack.enter_context(self.swap(
                elastic_search_services.ES, 'delete',
                es_stub.mock_delete))
            stack.enter_context(self.swap(
                elastic_search_services.ES, 'delete_by_query',
                es_stub.mock_delete_by_query))
            stack.enter_context(self.swap(
                elastic_search_services.ES, 'search',
                es_stub.mock_search))
            stack.enter_context(self.swap(
                memory_cache_services, 'flush_cache',
                memory_cache_services_stub.flush_cache))
            stack.enter_context(self.swap(
                memory_cache_services, 'get_multi',
                memory_cache_services_stub.get_multi))
            stack.enter_context(self.swap(
                memory_cache_services, 'set_multi',
                memory_cache_services_stub.set_multi))
            stack.enter_context(self.swap(
                memory_cache_services, 'get_memory_cache_stats',
                memory_cache_services_stub.get_memory_cache_stats))
            stack.enter_context(self.swap(
                memory_cache_services, 'delete_multi',
                memory_cache_services_stub.delete_multi))

            super(GenericTestBase, self).run(result=result)

    def setUp(self):
        super(GenericTestBase, self).setUp()
        if self.AUTO_CREATE_DEFAULT_SUPERADMIN_USER:
            self.signup_superadmin_user()

    def tearDown(self):
        datastore_services.delete_multi(
            datastore_services.query_everything().iter(keys_only=True))
        super(GenericTestBase, self).tearDown()

    def login(self, email, is_super_admin=False):
        """Sets the environment variables to simulate a login.

        Args:
            email: str. The email of the user who is to be logged in.
            is_super_admin: bool. Whether the user is a super admin.
        """
        self.testbed.setup_env(
            overwrite=True,
            user_email=email, user_id=self.get_auth_id_from_email(email),
            user_is_admin=('1' if is_super_admin else '0'))

    def logout(self):
        """Simulates a logout by resetting the environment variables."""
        self.testbed.setup_env(
            overwrite=True, user_email='', user_id='', user_is_admin='0')

    @contextlib.contextmanager
    def mock_datetime_utcnow(self, mocked_datetime):
        """Mocks response from datetime.datetime.utcnow method.

        Example usage:
            import datetime
            mocked_datetime_utcnow = (
                datetime.datetime.utcnow() - datetime.timedelta(days=1))
            with self.mock_datetime_utcnow(mocked_datetime_utcnow):
                print datetime.datetime.utcnow() # prints time reduced by 1 day
            print datetime.datetime.utcnow() # prints current time.

        Args:
            mocked_datetime: datetime.datetime. The datetime which will be used
                instead of the current UTC datetime.

        Yields:
            None. Empty yield statement.
        """
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            yield

    @contextlib.contextmanager
    def login_context(self, email, is_super_admin=False):
        """Log in with the given email under the context of a 'with' statement.

        Args:
            email: str. An email associated with a user account.
            is_super_admin: bool. Whether the user is a super admin.

        Yields:
            str. The id of the user associated with the given email, who is now
            'logged in'.
        """
        self.login(email, is_super_admin=is_super_admin)
        try:
            yield self.get_user_id_from_email(email)
        finally:
            self.logout()

    @contextlib.contextmanager
    def super_admin_context(self):
        """Log in as a global admin under the context of a 'with' statement.

        Yields:
            str. The id of the user associated with the given email, who is now
            'logged in'.
        """
        email = self.SUPER_ADMIN_EMAIL
        with self.login_context(email, is_super_admin=True) as user_id:
            yield user_id

    def signup(self, email, username):
        """Complete the signup process for the user with the given username.

        Args:
            email: str. Email of the given user.
            username: str. Username of the given user.
        """
        user_services.create_new_user(self.get_auth_id_from_email(email), email)

        with self.login_context(email), requests_mock.Mocker() as m:
            # We mock out all HTTP requests while trying to signup to avoid
            # calling out to real backend services.
            m.request(requests_mock.ANY, requests_mock.ANY)

            response = self.get_html_response(feconf.SIGNUP_URL)
            self.assertEqual(response.status_int, 200)

            response = self.testapp.post(feconf.SIGNUP_DATA_URL, params={
                'csrf_token': self.get_new_csrf_token(),
                'payload': json.dumps(
                    {'username': username, 'agreed_to_terms': True}),
            })
            self.assertEqual(response.status_int, 200)

    def signup_superadmin_user(self):
        """Signs up a superadmin user. Must be called at the end of setUp()."""
        self.signup(self.SUPER_ADMIN_EMAIL, self.SUPER_ADMIN_USERNAME)

    def set_config_property(self, config_obj, new_config_value):
        """Sets a given configuration object's value to the new value specified
        using a POST request.
        """
        with self.super_admin_context():
            self.post_json('/adminhandler', {
                'action': 'save_config_properties',
                'new_config_property_values': {
                    config_obj.name: new_config_value,
                },
            }, csrf_token=self.get_new_csrf_token())

    def set_user_role(self, username, user_role):
        """Sets the given role for this user.

        Args:
            username: str. Username of the given user.
            user_role: str. Role of the given user.
        """
        with self.super_admin_context():
            self.post_json('/adminrolehandler', {
                'username': username,
                'role': user_role,
            }, csrf_token=self.get_new_csrf_token())

    def set_admins(self, admin_usernames):
        """Sets role of given users as ADMIN.

        Args:
            admin_usernames: list(str). List of usernames.
        """
        for name in admin_usernames:
            self.set_user_role(name, feconf.ROLE_ID_ADMIN)

    def set_topic_managers(self, topic_manager_usernames):
        """Sets role of given users as TOPIC_MANAGER.

        Args:
            topic_manager_usernames: list(str). List of usernames.
        """
        for name in topic_manager_usernames:
            self.set_user_role(name, feconf.ROLE_ID_TOPIC_MANAGER)

    def set_moderators(self, moderator_usernames):
        """Sets role of given users as MODERATOR.

        Args:
            moderator_usernames: list(str). List of usernames.
        """
        for name in moderator_usernames:
            self.set_user_role(name, feconf.ROLE_ID_MODERATOR)

    def set_banned_users(self, banned_usernames):
        """Sets role of given users as BANNED_USER.

        Args:
            banned_usernames: list(str). List of usernames.
        """
        for name in banned_usernames:
            self.set_user_role(name, feconf.ROLE_ID_BANNED_USER)

    def set_collection_editors(self, collection_editor_usernames):
        """Sets role of given users as COLLECTION_EDITOR.

        Args:
            collection_editor_usernames: list(str). List of usernames.
        """
        for name in collection_editor_usernames:
            self.set_user_role(name, feconf.ROLE_ID_COLLECTION_EDITOR)

    def get_user_id_from_email(self, email):
        """Gets the user ID corresponding to the given email.

        Args:
            email: str. A valid email stored in the App Engine database.

        Returns:
            str|None. ID of the user possessing the given email, or None if
            the user does not exist.
        """
        user_settings = user_services.get_user_settings_by_auth_id(
            self.get_auth_id_from_email(email))
        return user_settings and user_settings.user_id

    @classmethod
    def get_auth_id_from_email(cls, email):
        """Returns a mock auth ID corresponding to the given email.

        This method can use any algorithm to produce results as long as, during
        the runtime of each test case/method, it is:
        1.  Pure (same input always returns the same output).
        2.  One-to-one (no two distinct inputs return the same output).
        3.  An integer byte-string (integers are always valid in auth IDs).

        Args:
            email: str. The email address of the user.

        Returns:
            bytes. The mock auth ID of a user possessing the given email.
        """
        # Although the hash function doesn't guarantee a one-to-one mapping, in
        # practice it is sufficient for our tests. We make it a positive integer
        # because those are always valid auth IDs.
        return python_utils.convert_to_bytes(abs(hash(email)))

    def _get_response(
            self, url, expected_content_type, params=None,
            expected_status_int=200):
        """Get a response, transformed to a Python object.

        Args:
            url: str. The URL to fetch the response.
            expected_content_type: str. The content type to expect.
            params: dict. A dictionary that will be encoded into a query string.
            expected_status_int: int. The integer status code to expect. Will be
                200 if not specified.

        Returns:
            webtest.TestResponse. The test response.
        """
        if params is not None:
            self.assertIsInstance(params, dict)

        expect_errors = expected_status_int >= 400

        # This swap is required to ensure that the templates are fetched from
        # source directory instead of webpack_bundles since webpack_bundles is
        # only produced after webpack compilation which is not performed during
        # backend tests.
        with self.swap(base, 'load_template', mock_load_template):
            response = self.testapp.get(
                url, params=params, expect_errors=expect_errors,
                status=expected_status_int)

        if expect_errors:
            self.assertTrue(response.status_int >= 400)
        else:
            self.assertTrue(200 <= response.status_int < 400)

        # Testapp takes in a status parameter which is the expected status of
        # the response. However this expected status is verified only when
        # expect_errors=False. For other situations we need to explicitly check
        # the status.
        #
        # Reference URL:
        # https://github.com/Pylons/webtest/blob/bf77326420b628c9ea5431432c7e171f88c5d874/webtest/app.py#L1119
        self.assertEqual(response.status_int, expected_status_int)

        self.assertEqual(response.content_type, expected_content_type)

        return response

    def get_html_response(self, url, params=None, expected_status_int=200):
        """Get a HTML response, transformed to a Python object.

        Args:
            url: str. The URL to fetch the response.
            params: dict. A dictionary that will be encoded into a query string.
            expected_status_int: int. The integer status code to expect. Will
                be 200 if not specified.

        Returns:
            webtest.TestResponse. The test response.
        """
        return self._get_response(
            url, 'text/html', params=params,
            expected_status_int=expected_status_int)

    def get_custom_response(
            self, url, expected_content_type, params=None,
            expected_status_int=200):
        """Get a response other than HTML or JSON as a Python object.

        Args:
            url: str. The URL to fetch the response.
            expected_content_type: str. The content type to expect.
            params: dict. A dictionary that will be encoded into a query string.
            expected_status_int: int. The integer status code to expect. Will be
                200 if not specified.

        Returns:
            webtest.TestResponse. The test response.
        """
        self.assertNotIn(
            expected_content_type, ['text/html', 'application/json'])

        return self._get_response(
            url, expected_content_type, params=params,
            expected_status_int=expected_status_int)

    def get_response_without_checking_for_errors(
            self, url, expected_status_int_list, params=None):
        """Get a response, transformed to a Python object and checks for a list
        of status codes.

        Args:
            url: str. The URL to fetch the response.
            expected_status_int_list: list(int). A list of integer status code
                to expect.
            params: dict. A dictionary that will be encoded into a query string.

        Returns:
            webtest.TestResponse. The test response.
        """
        if params is not None:
            self.assertIsInstance(
                params, dict,
                msg='Expected params to be a dict, received %s' % params)

        # This swap is required to ensure that the templates are fetched from
        # source directory instead of webpack_bundles since webpack_bundles is
        # only produced after webpack compilation which is not performed during
        # backend tests.
        with self.swap(base, 'load_template', mock_load_template):
            response = self.testapp.get(url, params=params, expect_errors=True)

        self.assertIn(response.status_int, expected_status_int_list)

        return response

    def _parse_json_response(self, json_response, expect_errors):
        """Convert a JSON server response to an object (such as a dict)."""
        if expect_errors:
            self.assertTrue(json_response.status_int >= 400)
        else:
            self.assertTrue(200 <= json_response.status_int < 400)

        self.assertEqual(json_response.content_type, 'application/json')
        self.assertTrue(json_response.body.startswith(feconf.XSSI_PREFIX))

        return json.loads(json_response.body[len(feconf.XSSI_PREFIX):])

    def get_json(self, url, params=None, expected_status_int=200):
        """Get a JSON response, transformed to a Python object."""
        if params is not None:
            self.assertIsInstance(params, dict)

        expect_errors = expected_status_int >= 400

        json_response = self.testapp.get(
            url, params=params, expect_errors=expect_errors,
            status=expected_status_int)

        # Testapp takes in a status parameter which is the expected status of
        # the response. However this expected status is verified only when
        # expect_errors=False. For other situations we need to explicitly check
        # the status.
        #
        # Reference URL:
        # https://github.com/Pylons/webtest/blob/bf77326420b628c9ea5431432c7e171f88c5d874/webtest/app.py#L1119
        self.assertEqual(json_response.status_int, expected_status_int)

        return self._parse_json_response(json_response, expect_errors)

    def post_json(
            self, url, payload, csrf_token=None, expected_status_int=200,
            upload_files=None):
        """Post an object to the server by JSON; return the received object."""
        data = {'payload': json.dumps(payload)}
        if csrf_token:
            data['csrf_token'] = csrf_token

        expect_errors = expected_status_int >= 400

        json_response = self._send_post_request(
            self.testapp, url, data, expect_errors,
            expected_status_int=expected_status_int, upload_files=upload_files)

        # Testapp takes in a status parameter which is the expected status of
        # the response. However this expected status is verified only when
        # expect_errors=False. For other situations we need to explicitly check
        # the status.
        #
        # Reference URL:
        # https://github.com/Pylons/webtest/blob/bf77326420b628c9ea5431432c7e171f88c5d874/webtest/app.py#L1119
        self.assertEqual(json_response.status_int, expected_status_int)

        return self._parse_json_response(json_response, expect_errors)

    def delete_json(self, url, params='', expected_status_int=200):
        """Delete object on the server using a JSON call."""
        if params:
            self.assertIsInstance(
                params, dict,
                msg='Expected params to be a dict, received %s' % params)

        expect_errors = expected_status_int >= 400
        json_response = self.testapp.delete(
            url, params=params, expect_errors=expect_errors,
            status=expected_status_int)

        # Testapp takes in a status parameter which is the expected status of
        # the response. However this expected status is verified only when
        # expect_errors=False. For other situations we need to explicitly check
        # the status.
        #
        # Reference URL:
        # https://github.com/Pylons/webtest/blob/bf77326420b628c9ea5431432c7e171f88c5d874/webtest/app.py#L1119
        self.assertEqual(json_response.status_int, expected_status_int)

        return self._parse_json_response(json_response, expect_errors)

    def _send_post_request(
            self, app, url, data, expect_errors, expected_status_int=200,
            upload_files=None, headers=None):
        """Sends a post request with the data provided to the url specified.

        Args:
            app: TestApp. The WSGI application which receives the request and
                produces response.
            url: str. The URL to send the POST request to.
            data: *. To be put in the body of the request. If params is an
                iterator, it will be urlencoded. If it is a string, it will not
                be encoded, but placed in the body directly. Can be a
                collections.OrderedDict with webtest.forms.Upload fields
                included.
            expect_errors: bool. Whether errors are expected.
            expected_status_int: int. The expected status code.
            upload_files: list(tuple). List of
                (fieldname, filename, file_content) tuples. Can also provide
                just (fieldname, filename) to have the file contents will be
                read from disk.
            headers: dict(str, *). Extra headers to send.

        Returns:
            webtest.TestResponse. The response of the POST request.
        """
        # Convert the files to bytes.
        if upload_files is not None:
            upload_files = tuple(
                tuple(python_utils.convert_to_bytes(f) for f in upload_file)
                for upload_file in upload_files)

        return app.post(
            url, params=data, headers=headers, status=expected_status_int,
            upload_files=upload_files, expect_errors=expect_errors)

    def post_email(
            self, recipient_email, sender_email, subject, body, html_body=None,
            expect_errors=False, expected_status_int=200):
        """Post an email from the sender to the recipient.

        Args:
            recipient_email: str. The email of the recipient.
            sender_email: str. The email of the sender.
            subject: str. The subject of the email.
            body: str. The body of the email.
            html_body: str. The HTML body of the email.
            expect_errors: bool. Whether errors are expected.
            expected_status_int: int. The expected status code of the JSON
                response.

        Returns:
            json. A JSON response generated by _send_post_request function.
        """
        email = mail.EmailMessage(
            sender=sender_email, to=recipient_email, subject=subject, body=body)
        if html_body is not None:
            email.html = html_body

        mime_email = email.to_mime_message()
        headers = {
            'Content-Type': mime_email.get_content_type(),
        }
        data = mime_email.as_string()
        incoming_email_url = '/_ah/mail/%s' % recipient_email

        return self._send_post_request(
            self.mail_testapp, incoming_email_url, data, expect_errors,
            headers=headers, expected_status_int=expected_status_int)

    def post_task(
            self, url, payload, headers, csrf_token=None, expect_errors=False,
            expected_status_int=200):
        """Posts an object to the server by JSON with the specific headers
        specified; return the received object.
        """
        if csrf_token:
            payload['csrf_token'] = csrf_token
        return self.taskqueue_testapp.post(
            url, params=json.dumps(payload), headers=headers,
            status=expected_status_int, expect_errors=expect_errors,
            content_type='application/json')

    def put_json(self, url, payload, csrf_token=None, expected_status_int=200):
        """PUT an object to the server with JSON and return the response."""
        params = {'payload': json.dumps(payload)}
        if csrf_token:
            params['csrf_token'] = csrf_token

        expect_errors = expected_status_int >= 400

        json_response = self.testapp.put(
            url, params=params, expect_errors=expect_errors)

        # Testapp takes in a status parameter which is the expected status of
        # the response. However this expected status is verified only when
        # expect_errors=False. For other situations we need to explicitly check
        # the status.
        #
        # Reference URL:
        # https://github.com/Pylons/webtest/blob/bf77326420b628c9ea5431432c7e171f88c5d874/webtest/app.py#L1119
        self.assertEqual(json_response.status_int, expected_status_int)

        return self._parse_json_response(json_response, expect_errors)

    def get_new_csrf_token(self):
        """Generates CSRF token for test."""
        response = self.get_json('/csrfhandler')
        return response['token']

    def save_new_default_exploration(
            self, exploration_id, owner_id, title='A title'):
        """Saves a new default exploration written by owner_id.

        Args:
            exploration_id: str. The id of the new validated exploration.
            owner_id: str. The user_id of the creator of the exploration.
            title: str. The title of the exploration.

        Returns:
            Exploration. The exploration domain object.
        """
        exploration = exp_domain.Exploration.create_default_exploration(
            exploration_id, title=title, category='Algebra')
        exp_services.save_new_exploration(owner_id, exploration)
        return exploration

    def set_interaction_for_state(self, state, interaction_id):
        """Sets the interaction_id, sets the fully populated default interaction
        customization arguments, and increments next_content_id_index as needed.

        Args:
            state: State. The state domain object to set the interaction for.
            interaction_id: str. The interaction id to set. Also sets the
                default customization args for the given interaction id.
        """

        # We wrap next_content_id_index in a dict so that modifying it in the
        # inner function modifies the value.
        next_content_id_index_dict = {'value': state.next_content_id_index}

        def traverse_schema_and_assign_content_ids(value, schema, contentId):
            """Generates content_id from recursively traversing the schema, and
            assigning to the current value.

            Args:
                value: *. The current traversed value in customization
                    arguments.
                schema: dict. The current traversed schema.
                contentId: str. The content_id generated so far.
            """
            is_subtitled_html_spec = (
                schema['type'] == schema_utils.SCHEMA_TYPE_CUSTOM and
                schema['obj_type'] ==
                schema_utils.SCHEMA_OBJ_TYPE_SUBTITLED_HTML)
            is_subtitled_unicode_spec = (
                schema['type'] == schema_utils.SCHEMA_TYPE_CUSTOM and
                schema['obj_type'] ==
                schema_utils.SCHEMA_OBJ_TYPE_SUBTITLED_UNICODE)

            if is_subtitled_html_spec or is_subtitled_unicode_spec:
                value['content_id'] = '%s_%i' % (
                    contentId, next_content_id_index_dict['value'])
                next_content_id_index_dict['value'] += 1
            elif schema['type'] == schema_utils.SCHEMA_TYPE_LIST:
                for x in value:
                    traverse_schema_and_assign_content_ids(
                        x, schema['items'], contentId)
            elif schema['type'] == schema_utils.SCHEMA_TYPE_DICT:
                for schema_property in schema['properties']:
                    traverse_schema_and_assign_content_ids(
                        x[schema_property.name],
                        schema_property['schema'],
                        '%s_%s' % (contentId, schema_property.name))

        interaction = (
            interaction_registry.Registry.get_interaction_by_id(interaction_id))
        ca_specs = interaction.customization_arg_specs
        customization_args = {}

        for ca_spec in ca_specs:
            ca_name = ca_spec.name
            ca_value = ca_spec.default_value
            traverse_schema_and_assign_content_ids(
                ca_value, ca_spec.schema, 'ca_%s' % ca_name)
            customization_args[ca_name] = {'value': ca_value}

        state.update_interaction_id(interaction_id)
        state.update_interaction_customization_args(customization_args)
        state.update_next_content_id_index(next_content_id_index_dict['value'])

    def save_new_valid_exploration(
            self, exploration_id, owner_id, title='A title',
            category='A category', objective='An objective',
            language_code=constants.DEFAULT_LANGUAGE_CODE, end_state_name=None,
            interaction_id='TextInput', correctness_feedback_enabled=False):
        """Saves a new strictly-validated exploration.

        Args:
            exploration_id: str. The id of the new validated exploration.
            owner_id: str. The user_id of the creator of the exploration.
            title: str. The title of the exploration.
            category: str. The category this exploration belongs to.
            objective: str. The objective of this exploration.
            language_code: str. The language_code of this exploration.
            end_state_name: str. The name of the end state for the exploration.
            interaction_id: str. The id of the interaction.
            correctness_feedback_enabled: bool. Whether correctness feedback is
                enabled for the exploration.

        Returns:
            Exploration. The exploration domain object.
        """
        exploration = exp_domain.Exploration.create_default_exploration(
            exploration_id, title=title, category=category,
            language_code=language_code)
        self.set_interaction_for_state(
            exploration.states[exploration.init_state_name], interaction_id)

        exploration.objective = objective
        exploration.correctness_feedback_enabled = correctness_feedback_enabled

        # If an end state name is provided, add terminal node with that name.
        if end_state_name is not None:
            exploration.add_states([end_state_name])
            end_state = exploration.states[end_state_name]
            self.set_interaction_for_state(end_state, 'EndExploration')
            end_state.update_interaction_default_outcome(None)

            # Link first state to ending state (to maintain validity).
            init_state = exploration.states[exploration.init_state_name]
            init_interaction = init_state.interaction
            init_interaction.default_outcome.dest = end_state_name
            if correctness_feedback_enabled:
                init_interaction.default_outcome.labelled_as_correct = True

        exp_services.save_new_exploration(owner_id, exploration)
        return exploration

    def save_new_linear_exp_with_state_names_and_interactions(
            self, exploration_id, owner_id, state_names, interaction_ids,
            title='A title', category='A category', objective='An objective',
            language_code=constants.DEFAULT_LANGUAGE_CODE):
        """Saves a new strictly-validated exploration with a sequence of states.

        Args:
            exploration_id: str. The id of the new validated exploration.
            owner_id: str. The user_id of the creator of the exploration.
            state_names: list(str). The names of states to be linked
                sequentially in the exploration. Must be a non-empty list and
                contain no duplicates.
            interaction_ids: list(str). The names of the interaction ids to be
                assigned to each state. Values will be cycled, so it doesn't
                need to be the same size as state_names, but it must be
                non-empty.
            title: str. The title of the exploration.
            category: str. The category this exploration belongs to.
            objective: str. The objective of this exploration.
            language_code: str. The language_code of this exploration.

        Returns:
            Exploration. The exploration domain object.
        """
        if not state_names:
            raise ValueError('must provide at least one state name')
        if not interaction_ids:
            raise ValueError('must provide at least one interaction type')
        interaction_ids = itertools.cycle(interaction_ids)

        exploration = exp_domain.Exploration.create_default_exploration(
            exploration_id, title=title, init_state_name=state_names[0],
            category=category, objective=objective, language_code=language_code)

        exploration.add_states(state_names[1:])
        for from_state_name, dest_state_name in (
                python_utils.ZIP(state_names[:-1], state_names[1:])):
            from_state = exploration.states[from_state_name]
            self.set_interaction_for_state(
                from_state, python_utils.NEXT(interaction_ids))
            from_state.interaction.default_outcome.dest = dest_state_name
        end_state = exploration.states[state_names[-1]]
        self.set_interaction_for_state(end_state, 'EndExploration')
        end_state.update_interaction_default_outcome(None)

        exp_services.save_new_exploration(owner_id, exploration)
        return exploration

    def save_new_exp_with_custom_states_schema_version(
            self, exp_id, user_id, states_dict, version):
        """Saves a new default exploration with the given version of state dict.

        This function should only be used for creating explorations in tests
        involving migration of datastore explorations that use an old states
        schema version.

        Note that it makes an explicit commit to the datastore instead of using
        the usual functions for updating and creating explorations. This is
        because the latter approach would result in an exploration with the
        *current* states schema version.

        Args:
            exp_id: str. The exploration ID.
            user_id: str. The user_id of the creator.
            states_dict: dict. The dict representation of all the states.
            version: int. Custom states schema version.
        """
        exp_model = exp_models.ExplorationModel(
            id=exp_id, category='category', title='title',
            objective='Old objective', language_code='en', tags=[], blurb='',
            author_notes='', states_schema_version=version,
            init_state_name=feconf.DEFAULT_INIT_STATE_NAME, states=states_dict,
            param_specs={}, param_changes=[])
        rights_manager.create_new_exploration_rights(exp_id, user_id)

        commit_message = 'New exploration created with title \'title\'.'
        exp_model.commit(user_id, commit_message, [{
            'cmd': 'create_new',
            'title': 'title',
            'category': 'category',
        }])
        exp_rights = exp_models.ExplorationRightsModel.get_by_id(exp_id)
        exp_summary_model = exp_models.ExpSummaryModel(
            id=exp_id, title='title', category='category',
            objective='Old objective', language_code='en', tags=[],
            ratings=feconf.get_empty_ratings(),
            scaled_average_rating=feconf.EMPTY_SCALED_AVERAGE_RATING,
            status=exp_rights.status,
            community_owned=exp_rights.community_owned,
            owner_ids=exp_rights.owner_ids, contributor_ids=[],
            contributors_summary={})
        exp_summary_model.update_timestamps()
        exp_summary_model.put()

    def publish_exploration(self, owner_id, exploration_id):
        """Publish the exploration with the given exploration_id.

        Args:
            owner_id: str. The user_id of the owner of the exploration.
            exploration_id: str. The ID of the new exploration.
        """
        committer = user_services.get_user_actions_info(owner_id)
        rights_manager.publish_exploration(committer, exploration_id)

    def save_new_default_collection(
            self, collection_id, owner_id, title='A title',
            category='A category', objective='An objective',
            language_code=constants.DEFAULT_LANGUAGE_CODE):
        """Saves a new default collection written by owner_id.

        Args:
            collection_id: str. The id of the new default collection.
            owner_id: str. The user_id of the creator of the collection.
            title: str. The title of the collection.
            category: str. The category this collection belongs to.
            objective: str. The objective of this collection.
            language_code: str. The language_code of this collection.

        Returns:
            Collection. The collection domain object.
        """
        collection = collection_domain.Collection.create_default_collection(
            collection_id, title=title, category=category, objective=objective,
            language_code=language_code)
        collection_services.save_new_collection(owner_id, collection)
        return collection

    def save_new_valid_collection(
            self, collection_id, owner_id, title='A title',
            category='A category', objective='An objective',
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            exploration_id='an_exploration_id',
            end_state_name=DEFAULT_END_STATE_NAME):
        """Creates an Oppia collection and adds a node saving the exploration
        details.

        Args:
            collection_id: str. ID for the collection to be created.
            owner_id: str. The user_id of the creator of the collection.
            title: str. Title for the collection.
            category: str. The category of the exploration.
            objective: str. Objective for the exploration.
            language_code: str. The language code for the exploration.
            exploration_id: str. The exploration_id for the Oppia exploration.
            end_state_name: str. The name of the end state for the exploration.

        Returns:
            Collection. A newly-created collection containing the corresponding
            exploration details.
        """
        collection = collection_domain.Collection.create_default_collection(
            collection_id, title=title, category=category, objective=objective,
            language_code=language_code)

        # Check whether exploration with given exploration_id exists or not.
        exploration = (
            exp_fetchers.get_exploration_by_id(exploration_id, strict=False))
        if exploration is None:
            exploration = self.save_new_valid_exploration(
                exploration_id, owner_id, title=title, category=category,
                objective=objective, end_state_name=end_state_name)
        collection.add_node(exploration.id)

        collection_services.save_new_collection(owner_id, collection)
        return collection

    def publish_collection(self, owner_id, collection_id):
        """Publish the collection with the given collection_id.

        Args:
            owner_id: str. The user_id of the owner of the collection.
            collection_id: str. ID of the collection to be published.
        """
        committer = user_services.get_user_actions_info(owner_id)
        rights_manager.publish_collection(committer, collection_id)

    def save_new_story(
            self, story_id, owner_id, corresponding_topic_id,
            title='Title', description='Description', notes='Notes',
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            url_fragment='title', meta_tag_content='story meta tag content'):
        """Creates an Oppia Story and saves it.

        NOTE: Callers are responsible for ensuring that the
        'corresponding_topic_id' provided is valid, unless a test explicitly
        requires it to be invalid.

        Args:
            story_id: str. ID for the story to be created.
            owner_id: str. The user_id of the creator of the story.
            title: str. The title of the story.
            description: str. The high level description of the story.
            notes: str. A set of notes, that describe the characters,
                main storyline, and setting.
            corresponding_topic_id: str. The id of the topic to which the story
                belongs.
            language_code: str. The ISO 639-1 code for the language this story
                is written in.
            url_fragment: str. The url fragment of the story.
            meta_tag_content: str. The meta tag content of the story.

        Returns:
            Story. A newly-created story.
        """
        story = story_domain.Story.create_default_story(
            story_id, title, description, corresponding_topic_id, url_fragment)
        story.title = title
        story.description = description
        story.notes = notes
        story.language_code = language_code
        story.url_fragment = url_fragment
        story.meta_tag_content = meta_tag_content
        story_services.save_new_story(owner_id, story)
        return story

    def save_new_story_with_story_contents_schema_v1(
            self, story_id, thumbnail_filename, thumbnail_bg_color,
            owner_id, title, description, notes, corresponding_topic_id,
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            url_fragment='story-frag',
            meta_tag_content='story meta tag content'):
        """Saves a new story with a default version 1 story contents data dict.

        This function should only be used for creating stories in tests
        involving migration of datastore stories that use an old story contents
        schema version.

        Note that it makes an explicit commit to the datastore instead of using
        the usual functions for updating and creating stories. This is because
        the latter approach would result in a story with the *current* story
        contents schema version.

        Args:
            story_id: str. ID for the story to be created.
            thumbnail_filename: str|None. Thumbnail filename for the story.
            thumbnail_bg_color: str|None. Thumbnail background color for the
                story.
            owner_id: str. The user_id of the creator of the story.
            title: str. The title of the story.
            description: str. The high level description of the story.
            notes: str. A set of notes, that describe the characters, main
                storyline, and setting.
            corresponding_topic_id: str. The id of the topic to which the story
                belongs.
            language_code: str. The ISO 639-1 code for the language this story
                is written in.
            url_fragment: str. The URL fragment for the story.
            meta_tag_content: str. The meta tag content of the story.
        """
        story_model = story_models.StoryModel(
            id=story_id, thumbnail_filename=thumbnail_filename,
            thumbnail_bg_color=thumbnail_bg_color, description=description,
            title=title, language_code=language_code,
            story_contents_schema_version=1, notes=notes,
            corresponding_topic_id=corresponding_topic_id,
            story_contents=self.VERSION_1_STORY_CONTENTS_DICT,
            url_fragment=url_fragment, meta_tag_content=meta_tag_content)
        commit_message = 'New story created with title \'%s\'.' % title
        story_model.commit(
            owner_id, commit_message,
            [{'cmd': story_domain.CMD_CREATE_NEW, 'title': title}])

    def save_new_subtopic(self, subtopic_id, owner_id, topic_id):
        """Creates an Oppia subtopic and saves it.

        Args:
            subtopic_id: str. ID for the subtopic to be created.
            owner_id: str. The user_id of the creator of the topic.
            topic_id: str. ID for the topic that the subtopic belongs to.

        Returns:
            SubtopicPage. A newly-created subtopic.
        """
        subtopic_page = (
            subtopic_page_domain.SubtopicPage.create_default_subtopic_page(
                subtopic_id, topic_id))
        subtopic_changes = [
            subtopic_page_domain.SubtopicPageChange({
                'cmd': subtopic_page_domain.CMD_CREATE_NEW,
                'topic_id': topic_id,
                'subtopic_id': subtopic_id,
            })
        ]
        subtopic_page_services.save_subtopic_page(
            owner_id, subtopic_page, 'Create new subtopic', subtopic_changes)
        return subtopic_page

    def save_new_topic(
            self, topic_id, owner_id, name='topic', abbreviated_name='topic',
            url_fragment='topic',
            thumbnail_filename='topic.svg',
            thumbnail_bg_color=(
                constants.ALLOWED_THUMBNAIL_BG_COLORS['topic'][0]),
            description='description', canonical_story_ids=None,
            additional_story_ids=None, uncategorized_skill_ids=None,
            subtopics=None, next_subtopic_id=0,
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            meta_tag_content='topic meta tag content',
            practice_tab_is_displayed=False,
            page_title_fragment_for_web='topic page title'):
        """Creates an Oppia Topic and saves it.

        Args:
            topic_id: str. ID for the topic to be created.
            owner_id: str. The user_id of the creator of the topic.
            name: str. The name of the topic.
            abbreviated_name: str. The abbreviated name of the topic.
            url_fragment: str. The url fragment of the topic.
            thumbnail_filename: str|None. The thumbnail filename of the topic.
            thumbnail_bg_color: str|None. The thumbnail background color of the
                topic.
            description: str. The description of the topic.
            canonical_story_ids: list(str). The list of ids of canonical stories
                that are part of the topic.
            additional_story_ids: list(str). The list of ids of additional
                stories that are part of the topic.
            uncategorized_skill_ids: list(str). The list of ids of skills that
                are not part of any subtopic.
            subtopics: list(Subtopic). The different subtopics that are part of
                this topic.
            next_subtopic_id: int. The id for the next subtopic.
            language_code: str. The ISO 639-1 code for the language this topic
                is written in.
            meta_tag_content: str. The meta tag content for the topic.
            practice_tab_is_displayed: bool. Whether the practice tab should be
                displayed.
            page_title_fragment_for_web: str. The page title fragment for the
                topic.

        Returns:
            Topic. A newly-created topic.
        """
        canonical_story_references = [
            topic_domain.StoryReference.create_default_story_reference(story_id)
            for story_id in (canonical_story_ids or [])
        ]
        additional_story_references = [
            topic_domain.StoryReference.create_default_story_reference(story_id)
            for story_id in (additional_story_ids or [])
        ]
        uncategorized_skill_ids = uncategorized_skill_ids or []
        subtopics = subtopics or []
        topic = topic_domain.Topic(
            topic_id, name, abbreviated_name, url_fragment, thumbnail_filename,
            thumbnail_bg_color, description, canonical_story_references,
            additional_story_references, uncategorized_skill_ids, subtopics,
            feconf.CURRENT_SUBTOPIC_SCHEMA_VERSION, next_subtopic_id,
            language_code, 0, feconf.CURRENT_STORY_REFERENCE_SCHEMA_VERSION,
            meta_tag_content, practice_tab_is_displayed,
            page_title_fragment_for_web)
        topic_services.save_new_topic(owner_id, topic)
        return topic

    def save_new_topic_with_subtopic_schema_v1(
            self, topic_id, owner_id, name, abbreviated_name, url_fragment,
            canonical_name, description, thumbnail_filename, thumbnail_bg_color,
            canonical_story_references, additional_story_references,
            uncategorized_skill_ids, next_subtopic_id,
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            meta_tag_content='topic meta tag content',
            practice_tab_is_displayed=False,
            page_title_fragment_for_web='topic page title'):
        """Saves a new topic with a default version 1 subtopic data dict.

        This function should only be used for creating topics in tests involving
        migration of datastore topics that use an old subtopic schema version.

        Note that it makes an explicit commit to the datastore instead of using
        the usual functions for updating and creating topics. This is because
        the latter approach would result in a topic with the *current* subtopic
        schema version.

        Args:
            topic_id: str. ID for the topic to be created.
            owner_id: str. The user_id of the creator of the topic.
            name: str. The name of the topic.
            abbreviated_name: str. The abbreviated name of the topic.
            url_fragment: str. The url fragment of the topic.
            canonical_name: str. The canonical name (lowercase) of the topic.
            description: str. The description of the topic.
            thumbnail_filename: str. The thumbnail file name of the topic.
            thumbnail_bg_color: str. The thumbnail background color of the
                topic.
            canonical_story_references: list(StoryReference). A set of story
                reference objects representing the canonical stories that are
                part of this topic.
            additional_story_references: list(StoryReference). A set of story
                reference object representing the additional stories that are
                part of this topic.
            uncategorized_skill_ids: list(str). The list of ids of skills that
                are not part of any subtopic.
            next_subtopic_id: int. The id for the next subtopic.
            language_code: str. The ISO 639-1 code for the language this topic
                is written in.
            meta_tag_content: str. The meta tag content for the topic.
            practice_tab_is_displayed: bool. Whether the practice tab should be
                displayed.
            page_title_fragment_for_web: str. The page title fragment for the
                topic.
        """
        topic_rights_model = topic_models.TopicRightsModel(
            id=topic_id, manager_ids=[], topic_is_published=True)
        topic_model = topic_models.TopicModel(
            id=topic_id, name=name, abbreviated_name=abbreviated_name,
            url_fragment=url_fragment, thumbnail_filename=thumbnail_filename,
            thumbnail_bg_color=thumbnail_bg_color,
            canonical_name=canonical_name, description=description,
            language_code=language_code,
            canonical_story_references=canonical_story_references,
            additional_story_references=additional_story_references,
            uncategorized_skill_ids=uncategorized_skill_ids,
            subtopic_schema_version=1,
            story_reference_schema_version=(
                feconf.CURRENT_STORY_REFERENCE_SCHEMA_VERSION),
            next_subtopic_id=next_subtopic_id,
            subtopics=[self.VERSION_1_SUBTOPIC_DICT],
            meta_tag_content=meta_tag_content,
            practice_tab_is_displayed=practice_tab_is_displayed,
            page_title_fragment_for_web=page_title_fragment_for_web)
        commit_message = 'New topic created with name \'%s\'.' % name
        topic_rights_model.commit(
            committer_id=owner_id,
            commit_message='Created new topic rights',
            commit_cmds=[{'cmd': topic_domain.CMD_CREATE_NEW}])
        topic_model.commit(
            owner_id, commit_message,
            [{'cmd': topic_domain.CMD_CREATE_NEW, 'name': name}])

    def save_new_question(
            self, question_id, owner_id, question_state_data,
            linked_skill_ids, inapplicable_skill_misconception_ids=None,
            language_code=constants.DEFAULT_LANGUAGE_CODE):
        """Creates an Oppia Question and saves it.

        Args:
            question_id: str. ID for the question to be created.
            owner_id: str. The id of the user creating the question.
            question_state_data: State. The state data for the question.
            linked_skill_ids: list(str). List of skill IDs linked to the
                question.
            inapplicable_skill_misconception_ids: list(str). List of skill
                misconceptions ids that are not applicable to the question.
            language_code: str. The ISO 639-1 code for the language this
                question is written in.

        Returns:
            Question. A newly-created question.
        """
        # This needs to be done because default arguments can not be of list
        # type.
        question = question_domain.Question(
            question_id, question_state_data,
            feconf.CURRENT_STATE_SCHEMA_VERSION, language_code, 0,
            linked_skill_ids, inapplicable_skill_misconception_ids or [])
        question_services.add_question(owner_id, question)
        return question

    def save_new_question_with_state_data_schema_v27(
            self, question_id, owner_id, linked_skill_ids,
            inapplicable_skill_misconception_ids=None,
            language_code=constants.DEFAULT_LANGUAGE_CODE):
        """Saves a new default question with a default version 27 state data
        dict.

        This function should only be used for creating questions in tests
        involving migration of datastore questions that use an old state data
        schema version.

        Note that it makes an explicit commit to the datastore instead of using
        the usual functions for updating and creating questions. This is because
        the latter approach would result in an question with the *current* state
        data schema version.

        Args:
            question_id: str. ID for the question to be created.
            owner_id: str. The id of the user creating the question.
            linked_skill_ids: list(str). The skill IDs linked to the question.
            inapplicable_skill_misconception_ids: list(str). List of skill
                misconceptions ids that are not applicable to the question.
            language_code: str. The ISO 639-1 code for the language this
                question is written in.
        """
        # This needs to be done because default arguments can not be of list
        # type.
        question_model = question_models.QuestionModel(
            id=question_id, question_state_data=self.VERSION_27_STATE_DICT,
            language_code=language_code, version=1,
            question_state_data_schema_version=27,
            linked_skill_ids=linked_skill_ids,
            inapplicable_skill_misconception_ids=(
                inapplicable_skill_misconception_ids or []))
        question_model.commit(
            owner_id, 'New question created',
            [{'cmd': question_domain.CMD_CREATE_NEW}])

    def save_new_question_suggestion_with_state_data_schema_v27(
            self, author_id, skill_id, suggestion_id=None,
            language_code=constants.DEFAULT_LANGUAGE_CODE):
        """Saves a new question suggestion with a default version 27 state data
        dict.

        This function should only be used for creating question suggestion in
        tests involving migration of datastore question suggestions that use an
        old state data schema version.

        Note that it makes an explicit commit to the datastore instead of using
        the usual functions for updating and creating questions. This is because
        the latter approach would result in an question with the *current* state
        data schema version.
        """
        score_category = (
            suggestion_models.SCORE_TYPE_QUESTION +
            suggestion_models.SCORE_CATEGORY_DELIMITER + skill_id)
        change = {
            'cmd': (
                question_domain
                .CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION),
            'question_dict': {
                'question_state_data': self.VERSION_27_STATE_DICT,
                'question_state_data_schema_version': 27,
                'language_code': language_code,
                'linked_skill_ids': [skill_id],
                'inapplicable_skill_misconception_ids': []
            },
            'skill_id': skill_id,
            'skill_difficulty': 0.3
        }
        if suggestion_id is None:
            suggestion_id = (
                feedback_models.GeneralFeedbackThreadModel.
                generate_new_thread_id(
                    feconf.ENTITY_TYPE_SKILL, skill_id))
        suggestion_models.GeneralSuggestionModel.create(
            feconf.SUGGESTION_TYPE_ADD_QUESTION,
            feconf.ENTITY_TYPE_SKILL, skill_id, 1,
            suggestion_models.STATUS_IN_REVIEW, author_id, None, change,
            score_category, suggestion_id, language_code)

        return suggestion_id

    def save_new_skill(
            self, skill_id, owner_id, description='description',
            misconceptions=None, rubrics=None, skill_contents=None,
            language_code=constants.DEFAULT_LANGUAGE_CODE,
            prerequisite_skill_ids=None):
        """Creates an Oppia Skill and saves it.

        Args:
            skill_id: str. ID for the skill to be created.
            owner_id: str. The user_id of the creator of the skill.
            description: str. The description of the skill.
            misconceptions: list(Misconception)|None. A list of Misconception
                objects that contains the various misconceptions of the skill.
            rubrics: list(Rubric)|None. A list of Rubric objects that contain
                the rubric for each difficulty of the skill.
            skill_contents: SkillContents|None. A SkillContents object
                containing the explanation and examples of the skill.
            language_code: str. The ISO 639-1 code for the language this skill
                is written in.
            prerequisite_skill_ids: list(str)|None. The prerequisite skill IDs
                for the skill.

        Returns:
            Skill. A newly-created skill.
        """
        skill = (
            skill_domain.Skill.create_default_skill(skill_id, description, []))
        if misconceptions is not None:
            skill.misconceptions = misconceptions
            skill.next_misconception_id = len(misconceptions) + 1
        if skill_contents is not None:
            skill.skill_contents = skill_contents
        if prerequisite_skill_ids is not None:
            skill.prerequisite_skill_ids = prerequisite_skill_ids
        if rubrics is not None:
            skill.rubrics = rubrics
        else:
            skill.rubrics = [
                skill_domain.Rubric(
                    constants.SKILL_DIFFICULTIES[0], ['Explanation 1']),
                skill_domain.Rubric(
                    constants.SKILL_DIFFICULTIES[1], ['Explanation 2']),
                skill_domain.Rubric(
                    constants.SKILL_DIFFICULTIES[2], ['Explanation 3']),
            ]
        skill.language_code = language_code
        skill.version = 0
        skill_services.save_new_skill(owner_id, skill)
        return skill

    def save_new_skill_with_defined_schema_versions(
            self, skill_id, owner_id, description, next_misconception_id,
            misconceptions=None, rubrics=None, skill_contents=None,
            misconceptions_schema_version=1, rubric_schema_version=1,
            skill_contents_schema_version=1,
            language_code=constants.DEFAULT_LANGUAGE_CODE):
        """Saves a new default skill with the given versions for misconceptions
        and skill contents.

        This function should only be used for creating skills in tests involving
        migration of datastore skills that use an old schema version.

        Note that it makes an explicit commit to the datastore instead of using
        the usual functions for updating and creating skills. This is because
        the latter approach would result in a skill with the *current* schema
        version.

        Args:
            skill_id: str. ID for the skill to be created.
            owner_id: str. The user_id of the creator of the skill.
            description: str. The description of the skill.
            next_misconception_id: int. The misconception id to be used by the
                next misconception added.
            misconceptions: list(Misconception.to_dict()). The list of
                misconception dicts associated with the skill.
            rubrics: list(Rubric.to_dict()). The list of rubric dicts associated
                with the skill.
            skill_contents: SkillContents.to_dict(). A SkillContents dict
                containing the explanation and examples of the skill.
            misconceptions_schema_version: int. The schema version for the
                misconceptions object.
            rubric_schema_version: int. The schema version for the rubric
                object.
            skill_contents_schema_version: int. The schema version for the
                skill_contents object.
            language_code: str. The ISO 639-1 code for the language this skill
                is written in.
        """
        skill_model = skill_models.SkillModel(
            id=skill_id, description=description, language_code=language_code,
            misconceptions=misconceptions, rubrics=rubrics,
            skill_contents=skill_contents,
            next_misconception_id=next_misconception_id,
            misconceptions_schema_version=misconceptions_schema_version,
            rubric_schema_version=rubric_schema_version,
            skill_contents_schema_version=skill_contents_schema_version,
            superseding_skill_id=None, all_questions_merged=False)
        skill_model.commit(
            owner_id, 'New skill created.',
            [{'cmd': skill_domain.CMD_CREATE_NEW}])

    def _create_valid_question_data(self, default_dest_state_name):
        """Creates a valid question_data dict.

        Args:
            default_dest_state_name: str. The default destination state.

        Returns:
            dict. The default question_data dict.
        """
        state = state_domain.State.create_default_state(
            default_dest_state_name, is_initial_state=True)
        state.update_interaction_id('TextInput')
        solution_dict = {
            'answer_is_exclusive': False,
            'correct_answer': 'Solution',
            'explanation': {
                'content_id': 'solution',
                'html': '<p>This is a solution.</p>',
            },
        }
        hints_list = [
            state_domain.Hint(
                state_domain.SubtitledHtml('hint_1', '<p>This is a hint.</p>')),
        ]
        solution = state_domain.Solution.from_dict(
            state.interaction.id, solution_dict)
        state.update_interaction_solution(solution)
        state.update_interaction_hints(hints_list)
        state.update_interaction_customization_args({
            'placeholder': {
                'value': {
                    'content_id': 'ca_placeholder',
                    'unicode_str': 'Enter text here',
                },
            },
            'rows': {'value': 1},
        })
        state.update_next_content_id_index(2)
        state.interaction.default_outcome.labelled_as_correct = True
        state.interaction.default_outcome.dest = None
        return state


class LinterTestBase(GenericTestBase):
    """Base class for linter tests."""

    def setUp(self):
        super(LinterTestBase, self).setUp()
        self.linter_stdout = []

        def mock_print(*args):
            """Mock for python_utils.PRINT. Append the values to print to
            linter_stdout list.

            Args:
                *args: list(*). Variable length argument list of values to print
                    in the same line of output.
            """
            self.linter_stdout.append(
                ' '.join(python_utils.UNICODE(arg) for arg in args))

        self.print_swap = self.swap(python_utils, 'PRINT', mock_print)

    def assert_same_list_elements(self, phrases, stdout):
        """Checks to see if all of the phrases appear in at least one of the
        stdout outputs.

        Args:
            phrases: list(str). A list of phrases we are trying to find in one
                of the stdout outputs. For example, python linting outputs a
                success string that includes data we don't have easy access to,
                like how long the test took, so we may want to search for a
                substring of that success string in stdout.
            stdout: list(str). A list of the output results from the method's
                execution.
        """
        self.assertTrue(
            any(all(p in output for p in phrases) for output in stdout))

    def assert_failed_messages_count(self, stdout, expected_failed_count):
        """Assert number of expected failed checks to actual number of failed
        checks.

        Args:
            stdout: list(str). A list of linter output messages.
            expected_failed_count: int. Expected number of failed messages.
        """
        failed_count = sum(msg.startswith('FAILED') for msg in stdout)
        self.assertEqual(failed_count, expected_failed_count)


class AuditJobsTestBase(GenericTestBase):
    """Base class for audit jobs tests."""

    def run_job_and_check_output(
            self, expected_output, sort=False, literal_eval=False):
        """Helper function to run job and compare output.

        Args:
            expected_output: list(*). The expected result of the job.
            sort: bool. Whether to sort the outputs before comparison.
            literal_eval: bool. Whether to use ast.literal_eval before
                comparison.
        """
        self.process_and_flush_pending_tasks()
        job_id = self.job_class.create_new()
        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 0)
        self.job_class.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_mapreduce_tasks()
        self.process_and_flush_pending_tasks()
        actual_output = self.job_class.get_output(job_id)

        if literal_eval:
            actual_output_dict = {}
            expected_output_dict = {}

            for item in (ast.literal_eval(value) for value in actual_output):
                value = item[1]
                if isinstance(value, list):
                    value = sorted(value)
                actual_output_dict[item[0]] = value

            for item in (ast.literal_eval(value) for value in expected_output):
                value = item[1]
                if isinstance(value, list):
                    value = sorted(value)
                expected_output_dict[item[0]] = value

            self.assertItemsEqual(actual_output_dict, expected_output_dict)

            for key in actual_output_dict:
                self.assertEqual(
                    actual_output_dict[key], expected_output_dict[key])
        elif sort:
            self.assertEqual(sorted(actual_output), sorted(expected_output))
        else:
            self.assertEqual(actual_output, expected_output)


class EmailMessageMock(python_utils.OBJECT):
    """Mock for core.platform.models email services messages."""

    def __init__(
            self, sender_email, recipient_email, subject, plaintext_body,
            html_body, bcc=None, reply_to=None, recipient_variables=None):
        """Inits a mock email message with all the necessary data.

        Args:
            sender_email: str. The email address of the sender. This should be
                in the form 'SENDER_NAME <SENDER_EMAIL_ADDRESS>' or
                'SENDER_EMAIL_ADDRESS'. Must be utf-8.
            recipient_email: str. The email address of the recipient. Must be
                utf-8.
            subject: str. The subject line of the email, Must be utf-8.
            plaintext_body: str. The plaintext body of the email. Must be utf-8.
            html_body: str. The HTML body of the email. Must fit in a datastore
                entity. Must be utf-8.
            bcc: list(str)|None. Optional argument. List of bcc emails. Emails
                must be utf-8.
            reply_to: str|None. Optional argument. Reply address formatted like
                “reply+<reply_id>@<incoming_email_domain_name> reply_id is the
                unique id of the sender.
            recipient_variables: dict|None. Optional argument. If batch sending
                requires differentiating each email based on the recipient, we
                assign a unique id to each recipient, including info relevant to
                that recipient so that we can reference it when composing the
                email like so:
                    recipient_variables = {
                        'bob@example.com': {'first': 'Bob', 'id': 1},
                        'alice@example.com': {'first': 'Alice', 'id': 2},
                    }
                    subject = 'Hey, %recipient.first%'
                For more information about this format, see:
                https://documentation.mailgun.com/en/latest/user_manual.html#batch-sending
        """
        self.sender = sender_email
        self.to = recipient_email
        self.subject = subject
        self.body = plaintext_body
        self.html = html_body
        self.bcc = bcc
        self.reply_to = reply_to
        self.recipient_variables = recipient_variables


class GenericEmailTestBase(GenericTestBase):
    """Base class for tests requiring email services."""

    emails_dict = collections.defaultdict(list)

    def run(self, result=None):
        """Adds a context swap on top of the test_utils.run() method so that
        test classes extending GenericEmailTestBase will automatically have a
        mailgun api key, mailgun domain name and mocked version of
        send_email_to_recipients().
        """
        with self.swap(
            email_services, 'send_email_to_recipients',
            self._send_email_to_recipients):
            super(EmailTestBase, self).run(result=result)

    def setUp(self):
        super(GenericEmailTestBase, self).setUp()
        self._wipe_emails_dict()

    def _wipe_emails_dict(self):
        """Reset email dictionary for a new test."""
        self.emails_dict = collections.defaultdict(list)

    def _send_email_to_recipients(
            self, sender_email, recipient_emails, subject, plaintext_body,
            html_body, bcc=None, reply_to=None, recipient_variables=None):
        """Mocks sending an email to each email in recipient_emails.

        Args:
            sender_email: str. The email address of the sender. This should be
                in the form 'SENDER_NAME <SENDER_EMAIL_ADDRESS>' or
                'SENDER_EMAIL_ADDRESS'. Must be utf-8.
            recipient_emails: list(str). The email addresses of the recipients.
                Must be utf-8.
            subject: str. The subject line of the email, Must be utf-8.
            plaintext_body: str. The plaintext body of the email. Must be utf-8.
            html_body: str. The HTML body of the email. Must fit in a datastore
                entity. Must be utf-8.
            bcc: list(str)|None. Optional argument. List of bcc emails. Must be
                utf-8.
            reply_to: str|None. Optional Argument. Reply address formatted like
                “reply+<reply_id>@<incoming_email_domain_name> reply_id is the
                unique id of the sender.
            recipient_variables: dict|None. Optional Argument. If batch sending
                requires differentiating each email based on the recipient, we
                assign a unique id to each recipient, including info relevant to
                that recipient so that we can reference it when composing the
                email like so:
                    recipient_variables = {
                        'bob@example.com': {'first': 'Bob', 'id': 1},
                        'alice@example.com': {'first': 'Alice', 'id': 2},
                    }
                    subject = 'Hey, %recipient.first%'
                For more information about this format, see:
                https://documentation.mailgun.com/en/latest/user_manual.html#batch-sending

        Returns:
            bool. Whether the emails are sent successfully.
        """
        bcc_emails = None
        if bcc:
            bcc_emails = bcc[0] if len(bcc) == 1 else bcc

        new_email = EmailMessageMock(
            sender_email, recipient_emails, subject, plaintext_body, html_body,
            bcc=bcc_emails, reply_to=(reply_to if reply_to else None),
            recipient_variables=(
                recipient_variables if recipient_variables else None))
        for recipient_email in recipient_emails:
            self.emails_dict[recipient_email].append(new_email)
        return True

    def _get_sent_email_messages(self, to):
        """Gets messages to a single recipient email.

        Args:
            to: str. The recipient email address.

        Returns:
            list(EmailMessageMock). The list of email messages corresponding to
            that recipient email.
        """
        return self.emails_dict[to] if to in self.emails_dict else []

    def _get_all_sent_email_messages(self):
        """Gets the entire messages dictionary.

        Returns:
            dict(str, list(EmailMessageMock)). The dict keyed by recipient
            email. Each value contains a list of EmailMessageMock objects
            corresponding to that recipient email; in other words, all
            individual emails sent to that specific recipient email.
        """
        return self.emails_dict


EmailTestBase = GenericEmailTestBase


class ClassifierTestBase(GenericEmailTestBase):
    """Base class for classifier test classes that need common functions
    for related to reading classifier data and mocking the flow of the
    storing the trained models through post request.

    This class is derived from GenericEmailTestBase because the
    TrainedClassifierHandlerTests test suite requires email services test
    functions in addition to the classifier functions defined below.
    """

    def post_blob(self, url, payload, expected_status_int=200):
        """Post a BLOB object to the server; return the received object.

        Note that this method should only be used for
        classifier.TrainedClassifierHandler handler and for no one else. The
        reason being, we don't have any general mechanism for security for
        transferring binary data. TrainedClassifierHandler implements a
        specific mechanism which is restricted to the handler.

        Args:
            url: str. The URL to which BLOB object in payload should be sent
                through a post request.
            payload: bytes. Binary data which needs to be sent.
            expected_status_int: int. The status expected as a response of post
                request.

        Returns:
            dict. Parsed JSON response received upon invoking the post request.
        """
        data = payload

        expect_errors = False
        if expected_status_int >= 400:
            expect_errors = True
        response = self._send_post_request(
            self.testapp, url, data,
            expect_errors, expected_status_int=expected_status_int,
            headers={b'content-type': b'application/octet-stream'})
        # Testapp takes in a status parameter which is the expected status of
        # the response. However this expected status is verified only when
        # expect_errors=False. For other situations we need to explicitly check
        # the status.
        # Reference URL:
        # https://github.com/Pylons/webtest/blob/
        # bf77326420b628c9ea5431432c7e171f88c5d874/webtest/app.py#L1119 .

        self.assertEqual(response.status_int, expected_status_int)
        return self._parse_json_response(response, expect_errors)

    def _get_classifier_data_from_classifier_training_job(
            self, classifier_training_job):
        """Retrieves classifier training job from GCS using metadata stored in
        classifier_training_job.

        Args:
            classifier_training_job: ClassifierTrainingJob. Domain object
                containing metadata of the training job which is used to
                retrieve the trained model.

        Returns:
            FrozenModel. Protobuf object containing classifier data.
        """
        filename = classifier_training_job.classifier_data_filename
        file_system_class = fs_services.get_entity_file_system_class()
        fs = fs_domain.AbstractFileSystem(file_system_class(
            feconf.ENTITY_TYPE_EXPLORATION, classifier_training_job.exp_id))
        classifier_data = utils.decompress_from_zlib(fs.get(filename))
        classifier_data_proto = text_classifier_pb2.TextClassifierFrozenModel()
        classifier_data_proto.ParseFromString(classifier_data)
        return classifier_data_proto


class FunctionWrapper(python_utils.OBJECT):
    """A utility for making function wrappers. Create a subclass and override
    any or both of the pre_call_hook and post_call_hook methods. See these
    methods for more info.
    """

    def __init__(self, func):
        """Creates a new FunctionWrapper instance.

        Args:
            func: a callable, or data descriptor. If it's a descriptor, then
                __get__ should return a bound method. For example, func can be
                a function, a method, a static or class method, but not a
                @property.
        """
        self._func = func
        self._instance = None

    def __call__(self, *args, **kwargs):
        """Overrides the call method for the function to call pre_call_hook
        method which would be called before the function is executed and
        post_call_hook which would be called after the function is executed.
        """
        if self._instance is not None:
            args = [self._instance] + list(args)

        args_dict = inspect.getcallargs(self._func, *args, **kwargs)

        self.pre_call_hook(args_dict)

        result = self._func(*args, **kwargs)

        self.post_call_hook(args_dict, result)

        return result

    def __get__(self, instance, owner):
        # We have to implement __get__ because otherwise, we don't have a chance
        # to bind to the instance self._func was bound to. See the following SO
        # answer: https://stackoverflow.com/a/22555978/675311
        self._instance = instance
        return self

    def pre_call_hook(self, args):
        """Override this to do tasks that should be executed before the actual
        function call.

        Args:
            args: list(*). Set of arguments that the function accepts.
        """
        pass

    def post_call_hook(self, args, result):
        """Override this to do tasks that should be executed after the actual
        function call.

        Args:
            args: list(*). Set of arguments that the function accepts.
            result: *. Result returned from the function.
        """
        pass


class CallCounter(FunctionWrapper):
    """A function wrapper that keeps track of how often the function is called.
    Note that the counter is incremented before each call, so it is also
    increased when the function raises an exception.
    """

    def __init__(self, f):
        """Counts the number of times the given function has been called. See
        FunctionWrapper for arguments.
        """
        super(CallCounter, self).__init__(f)
        self._times_called = 0

    @property
    def times_called(self):
        """Property that returns the number of times the wrapped function has
        been called.

        Returns:
            int. The number of times the wrapped function has been called.
        """
        return self._times_called

    def pre_call_hook(self, args):
        """Method that is called before each function call to increment the
        counter tracking the number of times a function is called. This will
        also be called even when the function raises an exception.

        Args:
            args: list(*). Set of arguments that the function accepts.
        """
        self._times_called += 1


class FailingFunction(FunctionWrapper):
    """A function wrapper that makes a function fail, raising a given exception.
    It can be set to succeed after a given number of calls.
    """

    INFINITY = 'infinity'

    def __init__(self, f, exception, num_tries_before_success):
        """Create a new Failing function.

        Args:
            f: func. See FunctionWrapper.
            exception: Exception. The exception to be raised.
            num_tries_before_success: int. The number of times to raise an
                exception, before a call succeeds. If this is 0, all calls will
                succeed, if it is FailingFunction. INFINITY, all calls will
                fail.
        """
        super(FailingFunction, self).__init__(f)
        self._exception = exception
        self._num_tries_before_success = num_tries_before_success
        self._always_fail = (
            self._num_tries_before_success == FailingFunction.INFINITY)
        self._times_called = 0

        if not (self._num_tries_before_success >= 0 or self._always_fail):
            raise ValueError(
                'num_tries_before_success should either be an '
                'integer greater than or equal to 0, '
                'or FailingFunction.INFINITY')

    def pre_call_hook(self, args):
        """Method that is called each time before the actual function call to
        check if the exception is to be raised based on the number of tries
        before success.

        Args:
            args: list(*). Set of arguments this function accepts.
        """
        self._times_called += 1
        call_should_fail = (
            self._num_tries_before_success >= self._times_called)
        if call_should_fail or self._always_fail:
            raise self._exception
