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

from __future__ import annotations

import builtins
import collections
import contextlib
import copy
import datetime
import functools
import inspect
import itertools
import json
import logging
import math
import os
import random
import re
import string
from types import TracebackType
import unittest

from core import feconf
from core import schema_utils
from core import utils
from core.constants import constants
from core.controllers import base
from core.domain import auth_domain
from core.domain import blog_services
from core.domain import caching_domain
from core.domain import classifier_domain
from core.domain import collection_domain
from core.domain import collection_services
from core.domain import config_domain
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import exp_services
from core.domain import fs_services
from core.domain import interaction_registry
from core.domain import object_registry
from core.domain import param_domain
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
from core.domain import topic_domain
from core.domain import topic_services
from core.domain import user_services
from core.platform import models
from core.platform.search import elastic_search_services
from core.platform.taskqueue import cloud_tasks_emulator
import main
from proto_files import text_classifier_pb2

import elasticsearch
import requests_mock
from typing import (
    IO, Any, Callable, Collection, Dict, Final, Iterable, Iterator, List,
    Literal, Mapping, Optional, OrderedDict, Pattern, Sequence, Set, Tuple,
    Type, TypedDict, Union, cast, overload
)
import webapp2
import webtest


MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import auth_models
    from mypy_imports import base_models
    from mypy_imports import datastore_services
    from mypy_imports import email_services
    from mypy_imports import exp_models
    from mypy_imports import feedback_models
    from mypy_imports import memory_cache_services
    from mypy_imports import platform_auth_services
    from mypy_imports import platform_taskqueue_services
    from mypy_imports import question_models
    from mypy_imports import skill_models
    from mypy_imports import storage_services
    from mypy_imports import story_models
    from mypy_imports import suggestion_models
    from mypy_imports import topic_models

(
    auth_models, base_models, exp_models,
    feedback_models, question_models, skill_models,
    story_models, suggestion_models, topic_models
) = models.Registry.import_models([
    models.Names.AUTH, models.Names.BASE_MODEL, models.Names.EXPLORATION,
    models.Names.FEEDBACK, models.Names.QUESTION, models.Names.SKILL,
    models.Names.STORY, models.Names.SUGGESTION, models.Names.TOPIC
])

datastore_services = models.Registry.import_datastore_services()
storage_services = models.Registry.import_storage_services()
email_services = models.Registry.import_email_services()
memory_cache_services = models.Registry.import_cache_services()
platform_auth_services = models.Registry.import_auth_services()
platform_taskqueue_services = models.Registry.import_taskqueue_services()

# Prefix to append to all lines printed by tests to the console.
# We are using the b' prefix as all the stdouts are in bytes.
LOG_LINE_PREFIX: Final = b'LOG_INFO_TEST: '

# List of model classes that don't have Wipeout or Takeout, related class
# methods defined because they're not used directly but only as
# base classes for the other models.
BASE_MODEL_CLASSES_WITHOUT_DATA_POLICIES: Final = (
    'BaseCommitLogEntryModel',
    'BaseHumanMaintainedModel',
    'BaseMapReduceBatchResultsModel',
    'BaseModel',
    'BaseSnapshotContentModel',
    'BaseSnapshotMetadataModel',
    'VersionedModel',
)


class NewIndexDict(TypedDict):
    """Type for the the newly created index with the given name."""

    index: str
    acknowledged: bool
    shards_acknowledged: bool


class ExistingIndexDict(TypedDict):
    """Type for the dictionary that adds a document to the existing index."""

    _index: str
    _shards: Dict[str, int]
    _seq_no: int
    _primary_term: int
    result: str
    _id: Optional[str]
    _version: int
    _type: str


class DeletedDocumentDict(TypedDict):
    """Type for the dictionary representing documents deleted from an index."""

    took: int
    version_conflicts: int
    noops: int
    throttled_until_millis: int
    failures: List[str]
    throttled_millis: int
    total: int
    batches: int
    requests_per_second: Union[float, int]
    retries: Dict[str, int]
    timed_out: bool
    deleted: int


class SearchDocumentDict(TypedDict):
    """Dictionary representing documents that matches the given query."""

    timed_out: bool
    _shards: Dict[str, int]
    took: int
    hits: Dict[str, List[ResultDocumentDict]]
    total: Dict[str, Union[str, int]]
    max_score: float


class ResultDocumentDict(TypedDict):
    """Type for the result document dictionary that matches the given query."""

    _id: str
    _score: float
    _type: str
    _index: str
    _source: Dict[str, str]


def get_filepath_from_filename(filename: str, rootdir: str) -> Optional[str]:
    """Returns filepath using the filename. Different files are present in
    different subdirectories in the rootdir. So, we walk through the rootdir and
    match the all the filenames with the given filename.  When a match is found
    the function returns the complete path of the filename by using
    os.path.join(root, filename).

    For example exploration-editor-page.mainpage.html is present in
    core/templates/pages/exploration-editor-page and error-page.mainpage.html
    is present in core/templates/pages/error-pages. So we walk through
    core/templates/pages and a match for exploration-editor-page.component.html
    is found in exploration-editor-page subdirectory and a match for
    error-page.directive.html is found in error-pages subdirectory.

    Args:
        filename: str. The name of the file.
        rootdir: str. The directory to search the file in.

    Returns:
        str | None. The path of the file if file is found otherwise
        None.

    Raises:
        Exception. Multiple files found with given file name.
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


def mock_load_template(filename: str) -> str:
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

    Raises:
        Exception. No file exists for the given file name.
    """
    filepath = get_filepath_from_filename(
        filename, os.path.join('core', 'templates', 'pages'))
    if filepath is None:
        raise Exception(
            'No file exists for the given file name.'
        )
    with utils.open_file(filepath, 'r') as f:
        return f.read()


def check_image_png_or_webp(image_string: str) -> bool:
    """Checks if the image is in png or webp format only.

    Args:
        image_string: str. Image url in base64 format.

    Returns:
        bool. Returns true if image is in WebP format.
    """
    return image_string.startswith(('data:image/png', 'data:image/webp'))


def get_storage_model_module_names() -> Iterator[models.Names]:
    """Get all module names in storage."""
    # As models.Names is an enum, it cannot be iterated over. So we use the
    # __dict__ property which can be iterated over.
    for name in models.Names:
        yield name


def get_storage_model_classes() -> Iterator[Type[base_models.BaseModel]]:
    """Get all model classes in storage."""
    for module_name in get_storage_model_module_names():
        (module,) = models.Registry.import_models([module_name])
        for member_name, member_obj in inspect.getmembers(module):
            if inspect.isclass(member_obj):
                clazz: Type[base_models.BaseModel] = getattr(
                    module, member_name
                )
                all_base_classes = [
                    base_class.__name__ for base_class in inspect.getmro(
                        clazz)]
                if 'Model' in all_base_classes:
                    yield clazz


def generate_random_hexa_str() -> str:
    """Generate 32 character random string that looks like hex number.

    Returns:
        str. A random string.
    """
    uppercase = 'ABCDEF'
    lowercase = 'abcdef'
    return ''.join(random.choices(uppercase + lowercase + string.digits, k=32))


class ElasticSearchStub:
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

    _DB: Dict[str, List[Dict[str, str]]] = {}

    def reset(self) -> None:
        """Helper method that clears the mock database."""
        self._DB.clear()

    def _generate_index_not_found_error(self, index_name: str) -> None:
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

    def mock_create_index(self, index_name: str) -> NewIndexDict:
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

    def mock_index(
        self,
        index_name: str,
        document: Dict[str, str],
        id: Optional[str] = None  # pylint: disable=redefined-builtin
    ) -> ExistingIndexDict:
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
            self._generate_index_not_found_error(index_name)
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

    def mock_exists(self, index_name: str, doc_id: str) -> bool:
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
            self._generate_index_not_found_error(index_name)
        return any(d['id'] == doc_id for d in self._DB[index_name])

    def mock_delete(self, index_name: str, doc_id: str) -> ExistingIndexDict:
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
            self._generate_index_not_found_error(index_name)
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

    def mock_delete_by_query(
        self, index_name: str, query: Dict[str, Dict[str, Dict[str, str]]]
    ) -> DeletedDocumentDict:
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
        assert list(query.keys()) == ['query']
        assert query['query'] == {
            'match_all': {}
        }
        if index_name not in self._DB:
            self._generate_index_not_found_error(index_name)
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

    # Here we use type Any because the argument 'body' can accept dictionaries
    # that can possess different types of values like int, List[...], nested
    # dictionaries and other types too.
    def mock_search(
        self,
        body: Optional[Dict[str, Dict[str, Dict[str, Any]]]] = None,
        index: Optional[str] = None,
        params: Optional[Dict[str, int]] = None
    ) -> SearchDocumentDict:
        """Searches and returns documents that match the given query.

        Args:
            body: dict|None. A dictionary search definition that uses Query DSL.
            index: str|None. The name of the index to search.
            params: dict|None. A dict with two keys: `size` and `from`. The
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
        assert index not in ['_all', '']
        assert index is not None
        assert params is not None
        assert sorted(params.keys()) == ['from', 'size']

        if index not in self._DB:
            self._generate_index_not_found_error(index)

        result_docs = []
        result_doc_ids = set([])
        for doc in self._DB[index]:
            if not doc['id'] in result_doc_ids:
                result_docs.append(doc)
                result_doc_ids.add(doc['id'])

        filters = body['query']['bool']['filter']
        terms = body['query']['bool']['must']

        for f in filters:
            # For processing 'doc[k] in v', doc[k] can only be of type string if
            # v is a string.
            if index == blog_services.SEARCH_INDEX_BLOG_POSTS:
                for k, v in f['match'].items():
                    # Tags field in 'doc' in blog post search index is
                    # of type list(str) under which the blog post can be
                    # classified. 'v' is a single tag which if present in the
                    # tags field list, the 'doc' should be returned. Therefore,
                    # we check using 'v in doc[k]'.
                    result_docs = [doc for doc in result_docs if v in doc[k]]
            else:
                for k, v in f['match'].items():
                    # In explorations and collections, 'doc[k]' is a single
                    # language or category to which the exploration or
                    # collection belongs, 'v' is a string of all the languages
                    # or categories (separated by space eg. 'en hi') in which if
                    # doc[k] is present, the 'doc' should be returned.
                    # Therefore, we check using 'doc[k] in v'.
                    result_docs = [doc for doc in result_docs if doc[k] in v]

        if terms:
            filtered_docs = []
            for term in terms:
                for _, v in term.items():
                    values = v['query'].split(' ')
                    for doc in result_docs:
                        strs = [
                            val for val in doc.values() if isinstance(val, str)
                        ]
                        words = []
                        for s in strs:
                            words += s.split(' ')
                        if all(value in words for value in values):
                            filtered_docs.append(doc)
            result_docs = filtered_docs

        formatted_result_docs: List[ResultDocumentDict] = [{
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


class AuthServicesStub:
    """Test-only implementation of the public API in core.platform.auth."""

    class AuthUser:
        """Authentication user with ID and deletion status."""

        def __init__(
            self, user_id: str, deleted: bool = False
        ) -> None:
            self.id = user_id
            self.deleted = deleted

        def mark_as_deleted(self) -> None:
            """Marks the user as deleted."""
            self.deleted = True

    def __init__(self) -> None:
        """Initializes a new instance that emulates an empty auth server."""
        self._user_id_by_auth_id: Dict[str, AuthServicesStub.AuthUser] = {}
        self._external_user_id_associations: Set[str] = set()

    @classmethod
    def install_stub(cls, test: GenericTestBase) -> Callable[..., None]:
        """Installs a new instance of the stub onto the given test instance.

        Args:
            test: GenericTestBase. The test instance to install the stub on.

        Returns:
            callable. A function that will uninstall the stub when called.
        """
        with contextlib.ExitStack() as stack:
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
            close = stack.pop_all().close
        return close

    @classmethod
    def establish_auth_session(
        cls, _: webapp2.Request, __: webapp2.Response
    ) -> None:
        """Sets login cookies to maintain a user's sign-in session.

        Args:
            _: webapp2.Request. Unused because os.environ handles
                sessions.
            __: webapp2.Response. Unused because os.environ handles
                sessions.
        """
        pass

    @classmethod
    def destroy_auth_session(cls, _: webapp2.Response) -> None:
        """Clears login cookies from the given response headers.

        Args:
            _: webapp2.Response. Unused because os.environ handles
                sessions.
        """
        pass

    @classmethod
    def get_auth_claims_from_request(
        cls, _: webapp2.Request
    ) -> Optional[auth_domain.AuthClaims]:
        """Authenticates the request and returns claims about its authorizer.

        This stub obtains authorization information from os.environ. To make the
        operation more authentic, this method also creates a new "external"
        association for the user to simulate a genuine "provided" value.

        Args:
            _: webapp2.Request. The HTTP request to authenticate.
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

    def mark_user_for_deletion(self, user_id: str) -> None:
        """Marks the user, and all of their auth associations, as deleted.

        Since the stub does not use models, this operation actually deletes the
        user's association. The "external" associations, however, are not
        deleted yet.

        Args:
            user_id: str. The unique ID of the user whose associations should be
                deleted.
        """
        for user in self._user_id_by_auth_id.values():
            if user.id == user_id:
                user.mark_as_deleted()

    def delete_external_auth_associations(self, user_id: str) -> None:
        """Deletes all associations that refer to the user outside of Oppia.

        Args:
            user_id: str. The unique ID of the user whose associations should be
                deleted.
        """
        self._external_user_id_associations.discard(user_id)

    def verify_external_auth_associations_are_deleted(
        self, user_id: str
    ) -> bool:
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

    def get_auth_id_from_user_id(self, user_id: str) -> Optional[str]:
        """Returns the auth ID associated with the given user ID.

        Args:
            user_id: str. The user ID.

        Returns:
            str|None. The auth ID associated with the given user ID, or None if
            no association exists.
        """
        return next((
            auth_id for auth_id, user in self._user_id_by_auth_id.items()
            if user.id == user_id and not user.deleted
        ), None)

    def get_user_id_from_auth_id(
        self, auth_id: str, include_deleted: bool = False
    ) -> Optional[str]:
        """Returns the user ID associated with the given auth ID.

        Args:
            auth_id: str. The auth ID.
            include_deleted: bool. Whether to return the ID of models marked for
                deletion.

        Returns:
            str|None. The user ID associated with the given auth ID, or None if
            no association exists.
        """
        user = self._user_id_by_auth_id.get(auth_id, None)
        if user is None:
            return None

        if include_deleted or not user.deleted:
            return user.id

        return None

    def get_multi_user_ids_from_auth_ids(
        self, auth_ids: List[str]
    ) -> List[Optional[str]]:
        """Returns the user IDs associated with the given auth IDs.

        Args:
            auth_ids: list(str). The auth IDs.

        Returns:
            list(str|None). The user IDs associated with each of the given auth
            IDs, or None for associations which don't exist.
        """
        return [self.get_user_id_from_auth_id(auth_id) for auth_id in auth_ids]

    def get_multi_auth_ids_from_user_ids(
        self, user_ids: List[str]
    ) -> List[Optional[str]]:
        """Returns the auth IDs associated with the given user IDs.

        Args:
            user_ids: list(str). The user IDs.

        Returns:
            list(str|None). The auth IDs associated with each of the given user
            IDs, or None for associations which don't exist.
        """
        auth_id_by_user_id = {
            user.id: auth_id
            for auth_id, user in self._user_id_by_auth_id.items()
        }
        return [auth_id_by_user_id.get(user_id, None) for user_id in user_ids]

    def associate_auth_id_with_user_id(
        self, auth_id_user_id_pair: auth_domain.AuthIdUserIdPair
    ) -> None:
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
                    auth_id, self._user_id_by_auth_id[auth_id].id))
        auth_models.UserAuthDetailsModel(
            id=user_id, firebase_auth_id=auth_id).put()
        self._external_user_id_associations.add(user_id)
        self._user_id_by_auth_id[auth_id] = AuthServicesStub.AuthUser(user_id)

    def associate_multi_auth_ids_with_user_ids(
        self, auth_id_user_id_pairs: List[auth_domain.AuthIdUserIdPair]
    ) -> None:
        """Commits the associations between auth IDs and user IDs.

        This method also adds the users to the "external" set of associations.

        Args:
            auth_id_user_id_pairs: list(auth_domain.AuthIdUserIdPair). The
                associations to commit.

        Raises:
            Exception. One or more auth associations already exist.
        """
        collisions = ', '.join(
            '{auth_id=%r: user_id=%r}' % (a, self._user_id_by_auth_id[a].id)
            for a, _ in auth_id_user_id_pairs if a in self._user_id_by_auth_id)
        if collisions:
            raise Exception('already associated: %s' % collisions)
        datastore_services.put_multi(
            [auth_models.UserAuthDetailsModel(
                id=user_id, firebase_auth_id=auth_id)
             for auth_id, user_id in auth_id_user_id_pairs])
        external_user_ids: Set[str] = {u for _, u in auth_id_user_id_pairs}
        self._external_user_id_associations.update(external_user_ids)
        auth_id_user_id_pairs_with_deletion = {
            auth_id: AuthServicesStub.AuthUser(user_id)
            for auth_id, user_id in auth_id_user_id_pairs
        }
        self._user_id_by_auth_id.update(auth_id_user_id_pairs_with_deletion)


class TaskqueueServicesStub:
    """The stub class that mocks the API functionality offered by the platform
    layer, namely the platform.taskqueue taskqueue services API.
    """

    def __init__(self, test_base: GenericTestBase) -> None:
        """Initializes a taskqueue services stub that replaces the API
        functionality of core.platform.taskqueue.

        Args:
            test_base: GenericTestBase. The current test base.
        """
        self._test_base = test_base
        self._client = cloud_tasks_emulator.Emulator(
            task_handler=self._task_handler, automatic_task_handling=False)

    def _task_handler(
        self,
        url: str,
        payload: Dict[str, str],
        queue_name: str,
        task_name: Optional[str] = None
    ) -> None:
        """Makes a POST request to the task URL in the test app.

        Args:
            url: str. URL of the handler function.
            payload: dict(str : *). Payload to pass to the request. Defaults
                to None if no payload is required.
            queue_name: str. The name of the queue to add the task to.
            task_name: str|None. Optional. The name of the task.
        """
        # Header values need to be bytes, thus we encode our strings to bytes.
        headers = {
            'X-AppEngine-Fake-Is-Admin': b'1',
            'X-Appengine-QueueName': queue_name.encode('utf-8'),
            # Maps empty strings to None so the output can become 'None'.
            'X-Appengine-TaskName': (
                task_name.encode('utf-8') if task_name else b'None')
        }
        csrf_token = self._test_base.get_new_csrf_token()
        self._test_base.post_task(url, payload, headers, csrf_token=csrf_token)

    def create_http_task(
        self,
        queue_name: str,
        url: str,
        payload: Optional[Dict[str, str]] = None,
        scheduled_for: Optional[datetime.datetime] = None,
        task_name: Optional[str] = None
    ) -> None:
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
        scheduled_for = None
        self._client.create_task(
            queue_name, url, payload, scheduled_for=scheduled_for,
            task_name=task_name)

    def count_jobs_in_taskqueue(self, queue_name: Optional[str] = None) -> int:
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

    def process_and_flush_tasks(self, queue_name: Optional[str] = None) -> None:
        """Executes all of the tasks in a single queue if a queue name is
        specified or all of the tasks in the taskqueue if no queue name is
        specified.

        Args:
            queue_name: str|None. Name of the queue. Pass in None if no specific
                queue is designated.
        """
        self._client.process_and_flush_tasks(queue_name=queue_name)

    def get_pending_tasks(
        self, queue_name: Optional[str] = None
    ) -> List[cloud_tasks_emulator.Task]:
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


class MemoryCacheServicesStub:
    """The stub class that mocks the API functionality offered by the platform
    layer, namely the platform.cache cache services API.
    """

    _CACHE_DICT: Dict[str, str] = {}

    def get_memory_cache_stats(self) -> caching_domain.MemoryCacheStats:
        """Returns a mock profile of the cache dictionary. This mock does not
        have the functionality to test for peak memory usage and total memory
        usage so the values for those attributes will be 0.

        Returns:
            MemoryCacheStats. MemoryCacheStats object containing the total
            number of keys in the cache dictionary.
        """
        return caching_domain.MemoryCacheStats(0, 0, len(self._CACHE_DICT))

    def flush_caches(self) -> None:
        """Wipes the cache dictionary clean."""
        self._CACHE_DICT.clear()

    def get_multi(self, keys: List[str]) -> List[Optional[str]]:
        """Looks up a list of keys in cache dictionary.

        Args:
            keys: list(str). A list of keys (strings) to look up.

        Returns:
            list(str). A list of values in the cache dictionary corresponding to
            the keys that are passed in.
        """
        assert isinstance(keys, list)
        return [self._CACHE_DICT.get(key, None) for key in keys]

    def set_multi(self, key_value_mapping: Dict[str, str]) -> bool:
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

    def delete_multi(self, keys: List[str]) -> int:
        """Deletes multiple keys in the cache dictionary.

        Args:
            keys: list(str). The keys to delete.

        Returns:
            int. Number of successfully deleted keys.
        """
        assert all(isinstance(key, str) for key in keys)
        keys_to_delete = [key for key in keys if key in self._CACHE_DICT]
        for key in keys_to_delete:
            del self._CACHE_DICT[key]
        return len(keys_to_delete)


class TestBase(unittest.TestCase):
    """Base class for all tests."""

    maxDiff: int = 2500

    # A test unicode string.
    UNICODE_TEST_STRING: Final = 'unicode ¡马!'

    @property
    def namespace(self) -> str:
        """Returns a namespace for isolating the NDB operations of each test.

        Returns:
            str. The namespace.
        """
        return self.id()[-100:]

    def run(self, result: Optional[unittest.TestResult] = None) -> None:
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

        with datastore_services.get_ndb_context(namespace=self.namespace):
            super().run(result=result)

    def _get_unicode_test_string(self, suffix: str) -> str:
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

    # Here we use type Any because the argument 'item' can accept any kind of
    # object to validate.
    def _assert_validation_error(
        self, item: Any, error_substring: str
    ) -> None:
        """Checks that the given item passes default validation."""
        with self.assertRaisesRegex(utils.ValidationError, error_substring):
            item.validate()

    def log_line(self, line: str) -> None:
        """Print the line with a prefix that can be identified by the script
        that calls the test.
        """
        # We are using the b' prefix as all the stdouts are in bytes.
        print(b'%s%s' % (LOG_LINE_PREFIX, line.encode()))

    def shortDescription(self) -> None:
        """Additional information logged during unit test invocation."""
        # Suppress default logging of docstrings.
        return None

    def get_updated_param_dict(
        self,
        param_dict: Dict[str, str],
        param_changes: List[param_domain.ParamChange],
        exp_param_specs: Dict[str, param_domain.ParamSpec]
    ) -> Dict[str, str]:
        """Updates a param dict using the given list of param_changes.

        Note that the list of parameter changes is ordered. Parameter changes
        later in the list may depend on parameter changes that have been set
        earlier in the same list.
        """
        new_param_dict = copy.deepcopy(param_dict)
        for param_change in param_changes:
            try:
                obj_type = exp_param_specs[param_change.name].obj_type
            except Exception as e:
                raise Exception(
                    'Parameter %s not found' % param_change.name) from e

            raw_value = param_change.get_value(new_param_dict)
            new_param_dict[param_change.name] = (
                object_registry.Registry.get_object_class_by_type(
                    obj_type).normalize(raw_value))
        return new_param_dict

    def get_static_asset_filepath(self) -> str:
        """Returns filepath to the static files on disk ('' or 'build/')."""
        return '' if constants.DEV_MODE else os.path.join('build')

    def get_static_asset_url(self, asset_suffix: str) -> str:
        """Returns the relative path for the asset, appending it to the
        corresponding cache slug. asset_suffix should have a leading slash.
        """
        return '/assets%s%s' % (utils.get_asset_dir_prefix(), asset_suffix)

    @contextlib.contextmanager
    def capture_logging(
        self, min_level: int = logging.NOTSET
    ) -> Iterator[List[str]]:
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
        captured_logs: List[str] = []

        class ListStream(IO[str]):
            """Stream-like object that appends writes to the captured logs."""

            # Here we use MyPy ignore because the signature of this
            # method doesn't match with IO's write().
            def write(self, msg: str) -> None:  # type: ignore[override]
                """Appends stripped messages to captured logs."""
                captured_logs.append(msg.strip())

            def flush(self) -> None:
                """Does nothing."""
                pass

            # Here, class ListStream inherits from IO and making an instance
            # below but due to the absence of some methods MyPy throws an error
            # that 'Cannot instantiate abstract class 'ListStream' with abstract
            # attributes'. So, to suppress the error, we defined all the methods
            # that was present in super class.
            @property
            def mode(self) -> str:
                pass

            @property
            def name(self) -> str:
                pass

            def close(self) -> None:
                pass

            @property
            def closed(self) -> bool:
                pass

            def fileno(self) -> int:
                pass

            def isatty(self) -> bool:
                pass

            def read(self, n: int = -1) -> str:
                pass

            def readable(self) -> bool:
                pass

            def readline(self, limit: int = -1) -> str:
                pass

            def readlines(self, hint: int = -1) -> List[str]:
                pass

            def seek(self, offset: int, whence: int = 0) -> int:
                pass

            def seekable(self) -> bool:
                pass

            def tell(self) -> int:
                pass

            def truncate(self, size: Optional[int] = None) -> int:
                pass

            def writable(self) -> bool:
                pass

            def writelines(self, lines: Iterable[str]) -> None:
                pass

            def __enter__(self) -> IO[str]:
                pass

            def __exit__(
                self,
                type: Optional[Type[BaseException]], # pylint: disable=redefined-builtin
                value: Optional[BaseException],
                traceback: Optional[TracebackType]
            ) -> None:
                pass

            def __iter__(self) -> Iterator[str]:
                pass

            def __next__(self) -> str:
                pass

        list_stream_handler = logging.StreamHandler(ListStream())

        logger = logging.getLogger()
        old_level = logger.level
        logger.addHandler(list_stream_handler)
        logger.setLevel(min_level)
        try:
            yield captured_logs
        finally:
            logger.setLevel(old_level)
            logger.removeHandler(list_stream_handler)

    # Here we use type Any because argument 'obj' can accept any kind
    # of object on which attribute needs to be replaced, and argument
    # 'newvalue' can accept any type of value to replace it with the
    # old value.
    @contextlib.contextmanager
    def swap(self, obj: Any, attr: str, newvalue: Any) -> Iterator[None]:
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

    # Here we use type Any because argument 'obj' can accept any kind
    # of object on which attribute needs to be replaced, and argument
    # 'value' can accept any type of value to replace it with the old
    # value.
    @contextlib.contextmanager
    def swap_to_always_return(
        self, obj: Any, attr: str, value: Optional[Any] = None
    ) -> Iterator[None]:
        """Swap obj.attr with a function that always returns the given value."""
        # Here we use type Any because this function returns the newly
        # replaced return value, and that value can be of any type.
        def function_that_always_returns(*_: str, **__: str) -> Any:
            """Returns the input value."""
            return value
        with self.swap(obj, attr, function_that_always_returns):
            yield

    # Here we use type Any because the argument 'obj' can accept any
    # kind of object on which attribute needs to be replaced.
    @contextlib.contextmanager
    def swap_to_always_raise(
        self,
        obj: Any,
        attr: str,
        error: Union[Exception, Type[Exception]] = Exception
    ) -> Iterator[None]:
        """Swap obj.attr with a function that always raises the given error."""
        def function_that_always_raises(*_: str, **__: str) -> None:
            """Raises the input exception."""
            raise error
        with self.swap(obj, attr, function_that_always_raises):
            yield

    # Here we use type Any because argument 'obj' can accept any kind
    # of object on which attribute needs to be replaced, and argument
    # 'returns' can accept any type of value to replace it with the old
    # function's return value.
    @contextlib.contextmanager
    def swap_with_call_counter(
        self,
        obj: Any,
        attr: str,
        raises: Optional[Exception] = None,
        returns: Any = None,
        call_through: bool = False
    ) -> Iterator[CallCounter]:
        """Swap obj.attr with a CallCounter instance.

        Args:
            obj: *. The Python object whose attribute you want to swap.
            attr: str. The name of the function to be swapped.
            raises: Exception|None. The exception raised by the swapped
                function. If None, then no exception is raised.
            returns: *. The return value of the swapped function.
            call_through: bool. Whether to call through to the real function,
                rather than use a stub implementation. If True, the `raises` and
                `returns` arguments will be ignored.

        Yields:
            CallCounter. A CallCounter instance that's installed as obj.attr's
            implementation while within the context manager returned.
        """
        if call_through:
            impl = obj.attr
        else:
            # Here we use type Any because this method returns the return value
            # of the swapped function, and that value can be of any type.
            def impl(*_: str, **__: str) -> Any:
                """Behaves according to the given values."""
                if raises is not None:
                    # Pylint thinks we're trying to raise `None` even though
                    # we've explicitly checked for it above.
                    raise raises # pylint: disable=raising-bad-type
                return returns
        call_counter = CallCounter(impl)
        with self.swap(obj, attr, call_counter):
            yield call_counter

    # Here we use type Any because the argument 'obj' can accept any
    # kind of object on which attribute needs to be replaced.
    @contextlib.contextmanager
    def swap_with_checks(
        self,
        obj: Any,
        attr: str,
        new_function: Callable[..., Any],
        expected_args: Optional[Sequence[Tuple[Any, ...]]] = None,
        expected_kwargs: Optional[Sequence[Dict[str, Any]]] = None,
        called: bool = True
    ) -> Iterator[None]:
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
            new_function: function. The new function you want to use.
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
        original_function = getattr(obj, attr)
        original_long_message_value = self.longMessage
        msg = '%s.%s() failed the expectations of swap_with_checks()' % (
            obj.__name__, attr)

        expected_args_iter = iter(expected_args or ())
        expected_kwargs_iter = iter(expected_kwargs or ())

        # Here we use type Any because args and kwargs are the arguments of the
        # swapped functions and swapped functions can have an arbitrary number
        # of arguments with different types.
        @functools.wraps(original_function)
        def new_function_with_checks(*args: Any, **kwargs: Any) -> Any:
            """Wrapper function for the new value which keeps track of how many
            times this function is invoked.

            Args:
                *args: list(*). The args passed into `attr` function.
                **kwargs: dict. The key word args passed into `attr` function.

            Returns:
                *. Result of `new_function`.
            """
            # Here we use MyPy ignore because we are defining a new attribute
            # 'call_num' on a function and MyPy does not allow the addition of
            # new attributes on a function ( or a function class ). So, because
            # of this, MyPy throws a '"Callable" has no attribute "call_num"'
            # error. Thus to avoid the error, we used ignore here.
            new_function_with_checks.call_num += 1  # type: ignore[attr-defined]

            # Includes assertion error information in addition to the message.
            self.longMessage = True

            # Here we use MyPy ignore because we are accessing the 'call_num'
            # attribute on a function which is of type 'callable' and functions
            # of type 'callable' do not contain a 'call_num' attribute. So,
            # because of this, MyPy throws a '"Callable" has no attribute
            # "call_num"' error. Thus to avoid the error, we used ignore here.
            if expected_args:
                next_args = next(expected_args_iter, None)
                self.assertEqual(
                    args, next_args, msg='*args to call #%d of %s' % (
                        new_function_with_checks.call_num, msg))  # type: ignore[attr-defined]

            # Here we use MyPy ignore because we are accessing the 'call_num'
            # attribute on a function which is of type 'callable' and functions
            # of type 'callable' do not contain a 'call_num' attribute. So,
            # because of this, MyPy throws a '"Callable" has no attribute
            # "call_num"' error. Thus to avoid the error, we used ignore here.
            if expected_kwargs:
                next_kwargs = next(expected_kwargs_iter, None)
                self.assertEqual(
                    kwargs, next_kwargs, msg='**kwargs to call #%d of %s' % (
                        new_function_with_checks.call_num, msg))  # type: ignore[attr-defined]

            # Reset self.longMessage just in case `new_function()` raises.
            self.longMessage = original_long_message_value

            return new_function(*args, **kwargs)

        # Here we use MyPy ignore because we are accessing the 'call_num'
        # attribute on a function which is of type 'callable' and functions
        # of type 'callable' do not contain a 'call_num' attribute. So,
        # because of this, MyPy throws a '"Callable" has no attribute
        # "call_num"' error. Thus to avoid the error, we used ignore here.
        new_function_with_checks.call_num = 0  # type: ignore[attr-defined]
        setattr(obj, attr, new_function_with_checks)

        try:
            yield
            # Includes assertion error information in addition to the message.
            self.longMessage = True
            # Here we use MyPy ignore because we are accessing the 'call_num'
            # attribute on a function which is of type 'callable' and functions
            # of type 'callable' do not contain a 'call_num' attribute. So,
            # because of this, MyPy throws a '"Callable" has no attribute
            # "call_num"' error. Thus to avoid the error, we used ignore here.
            self.assertEqual(
                new_function_with_checks.call_num > 0, called, msg=msg)  # type: ignore[attr-defined]
            pretty_unused_args = [
                ', '.join(itertools.chain(
                    (repr(a) for a in args),
                    ('%s=%r' % kwarg for kwarg in kwargs.items())))
                for args, kwargs in itertools.zip_longest(
                    expected_args_iter, expected_kwargs_iter, fillvalue={})
            ]

            # Here we use MyPy ignore because we are accessing the 'call_num'
            # attribute on a function which is of type 'callable' and functions
            # of type 'callable' do not contain a 'call_num' attribute. So,
            # because of this, MyPy throws a '"Callable" has no attribute
            # "call_num"' error. Thus to avoid the error, we used ignore here.
            if pretty_unused_args:
                num_expected_calls = (
                    new_function_with_checks.call_num + len(pretty_unused_args))  # type: ignore[attr-defined]
                missing_call_summary = '\n'.join(
                    '\tCall %d of %d: %s(%s)' % (
                        i, num_expected_calls, attr, call_args)
                    # Here we use MyPy ignore because we are accessing the
                    # 'call_num' attribute on a function which is of type
                    # 'callable' and functions of type 'callable' do not
                    # contain a 'call_num' attribute. So, because of this,
                    # MyPy throws a '"Callable" has no attribute "call_num"'
                    # error. Thus to avoid the error, we used ignore here.
                    for i, call_args in enumerate(
                        pretty_unused_args,
                        start=new_function_with_checks.call_num + 1))  # type: ignore[attr-defined]
                # Here we use MyPy ignore because we are accessing the
                # 'call_num' attribute on a function which is of type
                # 'callable' and functions of type 'callable' do not
                # contain a 'call_num' attribute. So, because of this,
                # MyPy throws a '"Callable" has no attribute "call_num"'
                # error. Thus to avoid the error, we used ignore here.
                self.fail(
                    msg='Only %d of the %d expected calls were made.\n'
                    '\n'
                    'Missing:\n'
                    '%s : %s' % (
                        new_function_with_checks.call_num, num_expected_calls,  # type: ignore[attr-defined]
                        missing_call_summary, msg))
        finally:
            self.longMessage = original_long_message_value
            setattr(obj, attr, original_function)

    # Here we use MyPy ignore because the signature of this method
    # doesn't match with TestCase's assertRaises().
    # Here we use type Any because args and kwargs can have an arbitrary number
    # of arguments with different types of values.
    def assertRaises(self, *args: Any, **kwargs: Any) -> None:  # type: ignore[override]
        raise NotImplementedError(
            'self.assertRaises should not be used in these tests. Please use '
            'self.assertRaisesRegex instead.')

    # Here we use MyPy ignore because the signature of this method
    # doesn't match with TestCase's assertRaisesRegex().
    def assertRaisesRegex(  # type: ignore[override]
        self,
        expected_exception: Union[
            Type[BaseException],
            Tuple[Type[BaseException], ...]
        ],
        expected_regex: Union[str, Pattern[str]],
    ) -> unittest.case._AssertRaisesContext[BaseException]:
        """Asserts that the message in a raised exception matches a regex.
        This is a wrapper around assertRaisesRegex in unittest that enforces
        strong regex.

        Args:
            expected_exception: Exception. Exception class expected
                to be raised.
            expected_regex: re.Pattern|str. Regex expected to be found in
                error message.

        Returns:
            bool. Whether the code raised exception in the expected format.

        Raises:
            Exception. No Regex given.
        """
        if not expected_regex:
            raise Exception(
                'Please provide a sufficiently strong regexp string to '
                'validate that the correct error is being raised.')

        return super().assertRaisesRegex(
            expected_exception, expected_regex)

    # Here we use type Any because, in Oppia codebase TypedDict is used to
    # define strict dictionaries and those strict dictionaries are not
    # compatible with Dict[str, Any] type because of the invariant property of
    # Dict type. Also, here value of Mapping is annotated as Any because this
    # method can accept any kind of dictionaries for testing purposes. So, to
    # make this method generalized for all test cases, we used Any here.
    def assertDictEqual(
        self,
        dict_one: Mapping[str, Any],
        dict_two: Mapping[str, Any],
        msg: Optional[str] = None
    ) -> None:
        """Checks whether the given two dictionaries are populated with same
        key-value pairs or not. If any difference occurred then the Assertion
        error is raised.

        Args:
            dict_one: Mapping[Any, Any]. A dictionary which we have to check
                against.
            dict_two: Mapping[Any, Any]. A dictionary which we have to check
                for.
            msg: Optional[str]. Message displayed when test fails.

        Raises:
            AssertionError. When dictionaries doesn't match.
        """
        # Here we use MyPy ignore because, assertDictEqual's argument can only
        # accept Dict[Any, Any] type but to allow both Dict and TypedDict type
        # we used Mapping here which causes MyPy to throw `incompatible argument
        # type` error. Thus to avoid the error, we used ignore here.
        super().assertDictEqual(dict_one, dict_two, msg=msg)  # type: ignore[arg-type]

    # Here we use type Any because the method 'assertItemsEqual' can accept any
    # kind of iterables to compare them against each other, and these iterables
    # can be of type List, Dict, Tuple, etc.
    def assertItemsEqual(  # pylint: disable=invalid-name
        self, *args: Iterable[Any], **kwargs: Iterable[Any]
    ) -> None:
        """Compares unordered sequences if they contain the same elements,
        regardless of order. If the same element occurs more than once,
        it verifies that the elements occur the same number of times.

        Returns:
            bool. Whether the items are equal.
        """
        return super().assertCountEqual(*args, **kwargs)

    def assert_matches_regexps(
        self,
        items: List[str],
        regexps: Sequence[Union[str, Pattern[str]]],
        full_match: bool = False
    ) -> None:
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
            for i, (regexp, item) in enumerate(zip(regexps, items))
            if get_match(regexp, item, flags=re.DOTALL) is None
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
    AUTH_DOMAIN: Final = 'example.com'
    HTTP_HOST: Final = 'localhost'
    SERVER_NAME: Final = 'localhost'
    SERVER_PORT: Final = '8080'
    DEFAULT_VERSION_HOSTNAME: Final = '%s:%s' % (HTTP_HOST, SERVER_PORT)

    # Here we use type Any because in subclasses derived from this class we
    # can provide an arbitrary number of arguments with different types. So,
    # to allow every type of argument we used Any here.
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        # Defined outside of setUp() because we access it from methods, but can
        # only install it during the run() method. Defining it in __init__
        # satisfies pylint's attribute-defined-outside-init warning.
        # TODO(#15922): Here we use cast because TaskqueueServicesStub can only
        # accept 'GenericTestBase' class but here we are providing super class
        # (AppEngineTestBase) which causes MyPy to throw `incompatible argument
        # type` error. Thus, to avoid the error, we used cast here.
        self._platform_taskqueue_services_stub = TaskqueueServicesStub(
            cast(GenericTestBase, self)
        )

    def setUp(self) -> None:
        super().setUp()
        # Initialize namespace for the storage emulator.
        storage_services.CLIENT.namespace = self.id()
        # Set up apps for testing.
        self.testapp = webtest.TestApp(main.app_without_context)

    def tearDown(self) -> None:
        datastore_services.delete_multi(
            list(datastore_services.query_everything().iter(keys_only=True)))
        storage_services.CLIENT.reset()
        super().tearDown()

    def run(self, result: Optional[unittest.TestResult] = None) -> None:
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
            super().run(result=result)

    def count_jobs_in_taskqueue(self, queue_name: Optional[str]) -> int:
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

    def process_and_flush_pending_tasks(
        self, queue_name: Optional[str] = None
    ) -> None:
        """Executes all of the tasks in a single queue if a queue name is
        specified or all of the tasks in the taskqueue if no queue name is
        specified.

        Args:
            queue_name: str|None. Name of the queue. Pass in None if no specific
                queue is designated.
        """
        self._platform_taskqueue_services_stub.process_and_flush_tasks(
            queue_name=queue_name)

    def get_pending_tasks(
        self, queue_name: Optional[str] = None
    ) -> List[cloud_tasks_emulator.Task]:
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


class GenericTestBase(AppEngineTestBase):
    """Base test class with common/generic helper methods.

    Unless a class is testing for "platform"-specific behavior (e.g., testing
    third-party library code or database model implementations), always inherit
    from this base class. Otherwise, inherit from unittest.TestCase (preferred)
    or AppEngineTestBase if Google App Engine services/behavior is needed.

    TODO(#12135): Split this enormous test base into smaller, focused pieces.
    """

    # NOTE: For tests that do not/can not use the default super admin, authors
    # can override the following class-level constant.
    AUTO_CREATE_DEFAULT_SUPERADMIN_USER: bool = True

    SUPER_ADMIN_EMAIL: Final = 'tmpsuperadmin@example.com'
    SUPER_ADMIN_USERNAME: Final = 'tmpsuperadm1n'

    # Dummy strings representing user attributes. Note that it is up to the
    # individual test to actually register these users as editors, admins, etc.
    CURRICULUM_ADMIN_EMAIL: Final = 'admin@example.com'
    # Usernames containing the string 'admin' are reserved, so we use 'adm'
    # instead.
    CURRICULUM_ADMIN_USERNAME: Final = 'adm'
    BLOG_ADMIN_EMAIL: Final = 'blogadmin@example.com'
    BLOG_ADMIN_USERNAME: Final = 'blogadm'
    BLOG_EDITOR_EMAIL: Final = 'blogeditor@example.com'
    BLOG_EDITOR_USERNAME: Final = 'blogeditor'
    MODERATOR_EMAIL: Final = 'moderator@example.com'
    MODERATOR_USERNAME: Final = 'moderator'
    RELEASE_COORDINATOR_EMAIL: Final = 'releasecoordinator@example.com'
    RELEASE_COORDINATOR_USERNAME: Final = 'releasecoordinator'
    OWNER_EMAIL: Final = 'owner@example.com'
    OWNER_USERNAME: Final = 'owner'
    EDITOR_EMAIL: Final = 'editor@example.com'
    EDITOR_USERNAME: Final = 'editor'
    TOPIC_MANAGER_EMAIL: Final = 'topicmanager@example.com'
    TOPIC_MANAGER_USERNAME: Final = 'topicmanager'
    VOICE_ARTIST_EMAIL: Final = 'voiceartist@example.com'
    VOICE_ARTIST_USERNAME: Final = 'voiceartist'
    VOICEOVER_ADMIN_EMAIL: Final = 'voiceoveradm@example.com'
    VOICEOVER_ADMIN_USERNAME: Final = 'voiceoveradm'
    VIEWER_EMAIL: Final = 'viewer@example.com'
    VIEWER_USERNAME: Final = 'viewer'
    NEW_USER_EMAIL: Final = 'new.user@example.com'
    NEW_USER_USERNAME: Final = 'newuser'
    DEFAULT_END_STATE_NAME: Final = 'End'

    PSEUDONYMOUS_ID: Final = 'pid_%s' % ('a' * 32)

    VERSION_0_STATES_DICT: Final = {
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

    # Here we use MyPy ignore because we are defining an older version
    # dictionary of State which does contain 'content_ids_to_audio_translations'
    # key but we are assigning this dict to the latest version of State
    # which does not contain the 'content_ids_to_audio_translations' key
    # because we only maintain the types of the latest domain objects. So,
    # that's why we have to assign the old version dict to the latest dict
    # type, and because of this MyPy throws an error. Thus, to avoid the error,
    # we used ignore here.
    VERSION_27_STATE_DICT: state_domain.StateDict = {  # type: ignore[typeddict-item]
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
                'dest_if_really_stuck': None,
                'refresher_exploration_id': None,
                'missing_prerequisite_skill_id': None,
                'labelled_as_correct': True,
            },
            'customization_args': {
                'rows': {'value': 1},
                'placeholder': {'value': 'Enter text here'}
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

    VERSION_1_STORY_CONTENTS_DICT: Final = {
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

    VERSION_2_STORY_CONTENTS_DICT: Final = {
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

    VERSION_3_STORY_CONTENTS_DICT: Final = {
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

    VERSION_4_STORY_CONTENTS_DICT: Final = {
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

    VERSION_5_STORY_CONTENTS_DICT: Final = {
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
            'thumbnail_size_in_bytes': None,
        }],
        'initial_node_id': 'node_1',
        'next_node_id': 'node_2',
    }

    VERSION_1_SUBTOPIC_DICT: Final = {
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

    SAMPLE_YAML_CONTENT: str = (
        """author_notes: ''
auto_tts_enabled: false
blurb: ''
category: Category
correctness_feedback_enabled: true
edits_allowed: true
init_state_name: %s
language_code: en
objective: ''
param_changes: []
param_specs: {}
schema_version: %d
states:
  %s:
    card_is_checkpoint: true
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
        dest_if_really_stuck: null
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
    linked_skill_id: null
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
    card_is_checkpoint: false
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
        dest_if_really_stuck: null
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
    linked_skill_id: null
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

    def run(self, result: Optional[unittest.TestResult] = None) -> None:
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
        memory_cache_services_stub.flush_caches()
        es_stub = ElasticSearchStub()
        es_stub.reset()

        with contextlib.ExitStack() as stack:
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
                memory_cache_services, 'flush_caches',
                memory_cache_services_stub.flush_caches))
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

            super().run(result=result)

    def setUp(self) -> None:
        super().setUp()
        if self.AUTO_CREATE_DEFAULT_SUPERADMIN_USER:
            self.signup_superadmin_user()

    def login(self, email: str, is_super_admin: Optional[bool] = False) -> None:
        """Sets the environment variables to simulate a login.

        Args:
            email: str. The email of the user who is to be logged in.
            is_super_admin: bool. Whether the user is a super admin.
        """
        os.environ['USER_ID'] = self.get_auth_id_from_email(email)
        os.environ['USER_EMAIL'] = email
        os.environ['USER_IS_ADMIN'] = ('1' if is_super_admin else '0')

    def logout(self) -> None:
        """Simulates a logout by resetting the environment variables."""
        os.environ['USER_ID'] = ''
        os.environ['USER_EMAIL'] = ''
        os.environ['USER_IS_ADMIN'] = '0'

    @contextlib.contextmanager
    def mock_datetime_utcnow(
        self, mocked_now: datetime.datetime
    ) -> Iterator[None]:
        """Mocks parts of the datastore to accept a fake datetime type that
        always returns the same value for utcnow.

        Example:
            import datetime
            mocked_now = datetime.datetime.utcnow() - datetime.timedelta(days=1)
            with mock_datetime_utcnow(mocked_now):
                self.assertEqual(datetime.datetime.utcnow(), mocked_now)
            actual_now = datetime.datetime.utcnow() # Returns actual time.

        Args:
            mocked_now: datetime.datetime. The datetime which will be used
                instead of the current UTC datetime.

        Yields:
            None. Empty yield statement.

        Raises:
            Exception. Given argument is not a datetime.
        """
        if not isinstance(mocked_now, datetime.datetime):
            raise Exception('mocked_now must be datetime, got: %r' % mocked_now)

        old_datetime = datetime.datetime

        class MockDatetimeType(type):
            """Overrides isinstance() behavior."""

            @classmethod
            def __instancecheck__(cls, instance: datetime.datetime) -> bool:
                return isinstance(instance, old_datetime)

        class MockDatetime(datetime.datetime, metaclass=MockDatetimeType):
            """Always returns mocked_now as the current UTC time."""

            # Here we use MyPy ignore because the signature of this
            # method doesn't match with datetime.datetime's utcnow().
            @classmethod
            def utcnow(cls) -> datetime.datetime:  # type: ignore[override]
                """Returns the mocked datetime."""
                return mocked_now

        setattr(datetime, 'datetime', MockDatetime)
        try:
            yield
        finally:
            setattr(datetime, 'datetime', old_datetime)

    @contextlib.contextmanager
    def login_context(
        self, email: str, is_super_admin: bool = False
    ) -> Iterator[Optional[str]]:
        """Log in with the given email under the context of a 'with' statement.

        Args:
            email: str. An email associated with a user account.
            is_super_admin: bool. Whether the user is a super admin.

        Yields:
            str. The id of the user associated with the given email, who is now
            'logged in', or None if no user_id exists.
        """
        self.login(email, is_super_admin=is_super_admin)
        try:
            yield self.get_user_id_from_email(email, strict=False)
        finally:
            self.logout()

    @contextlib.contextmanager
    def super_admin_context(self) -> Iterator[Optional[str]]:
        """Log in as a global admin under the context of a 'with' statement.

        Yields:
            str. The id of the user associated with the given email, who is now
            'logged in'.
        """
        email = self.SUPER_ADMIN_EMAIL
        with self.login_context(email, is_super_admin=True) as user_id:
            yield user_id

    def signup(
        self,
        email: str,
        username: str,
        is_super_admin: bool = False
    ) -> None:
        """Complete the signup process for the user with the given username.

        Args:
            email: str. Email of the given user.
            username: str. Username of the given user.
            is_super_admin: bool. Whether the user is a super admin.
        """
        user_services.create_new_user(self.get_auth_id_from_email(email), email)

        login_context = self.login_context(email, is_super_admin=is_super_admin)

        with login_context, requests_mock.Mocker() as m:
            # We mock out all HTTP requests while trying to signup to avoid
            # calling out to real backend services.
            m.request(requests_mock.ANY, requests_mock.ANY)

            response = self.get_html_response(feconf.SIGNUP_URL)
            self.assertEqual(response.status_int, 200)
            self.assertNotIn('<oppia-maintenance-page>', response)

            response = self.testapp.post(feconf.SIGNUP_DATA_URL, params={
                'csrf_token': self.get_new_csrf_token(),
                'payload': json.dumps({
                    'username': username,
                    'agreed_to_terms': True,
                    'default_dashboard': constants.DASHBOARD_TYPE_LEARNER
                    }),
                })
            self.assertEqual(response.status_int, 200)

    def signup_superadmin_user(self) -> None:
        """Signs up a superadmin user. Must be called at the end of setUp()."""
        self.signup(self.SUPER_ADMIN_EMAIL, self.SUPER_ADMIN_USERNAME)

    def set_config_property(
        self, config_obj: config_domain.ConfigProperty, new_config_value: str
    ) -> None:
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

    def add_user_role(self, username: str, user_role: str) -> None:
        """Adds the given role to the user account with the given username.

        Args:
            username: str. Username of the given user.
            user_role: str. Role of the given user.
        """
        with self.super_admin_context():
            self.put_json('/adminrolehandler', {
                'username': username,
                'role': user_role
            }, csrf_token=self.get_new_csrf_token())

    def set_curriculum_admins(
        self, curriculum_admin_usernames: List[str]
    ) -> None:
        """Sets role of given users as CURRICULUM_ADMIN.

        Args:
            curriculum_admin_usernames: list(str). List of usernames.
        """
        for name in curriculum_admin_usernames:
            self.add_user_role(name, feconf.ROLE_ID_CURRICULUM_ADMIN)

    def set_topic_managers(
        self, topic_manager_usernames: List[str], topic_id: str
    ) -> None:
        """Sets role of given users as TOPIC_MANAGER.

        Args:
            topic_manager_usernames: list(str). List of usernames.
            topic_id: str. The topic Id.
        """
        with self.super_admin_context():
            for username in topic_manager_usernames:
                self.put_json('/topicmanagerrolehandler', {
                    'username': username,
                    'action': 'assign',
                    'topic_id': topic_id
                }, csrf_token=self.get_new_csrf_token())

    def set_moderators(self, moderator_usernames: List[str]) -> None:
        """Sets role of given users as MODERATOR.

        Args:
            moderator_usernames: list(str). List of usernames.
        """
        for name in moderator_usernames:
            self.add_user_role(name, feconf.ROLE_ID_MODERATOR)

    def set_voiceover_admin(self, voiceover_admin_username: List[str]) -> None:
        """Sets role of given users as VOICEOVER ADMIN.

        Args:
            voiceover_admin_username: list(str). List of usernames.
        """
        for name in voiceover_admin_username:
            self.add_user_role(name, feconf.ROLE_ID_VOICEOVER_ADMIN)

    def mark_user_banned(self, username: str) -> None:
        """Marks a user banned.

        Args:
            username: str. The username of the user to ban.
        """
        with self.super_admin_context():
            self.put_json('/bannedusershandler', {
                'username': username
            }, csrf_token=self.get_new_csrf_token())

    def set_collection_editors(
        self, collection_editor_usernames: List[str]
    ) -> None:
        """Sets role of given users as COLLECTION_EDITOR.

        Args:
            collection_editor_usernames: list(str). List of usernames.
        """
        for name in collection_editor_usernames:
            self.add_user_role(name, feconf.ROLE_ID_COLLECTION_EDITOR)

    @overload
    def get_user_id_from_email(self, email: str) -> str: ...

    @overload
    def get_user_id_from_email(
        self, email: str, *, strict: Literal[True]
    ) -> str: ...

    @overload
    def get_user_id_from_email(
        self, email: str, *, strict: Literal[False]
    ) -> Optional[str]: ...

    def get_user_id_from_email(
        self, email: str, strict: bool = True
    ) -> Optional[str]:
        """Gets the user ID corresponding to the given email.

        Args:
            email: str. A valid email stored in the App Engine database.
            strict: bool. Whether to fail noisily if no user ID corresponding
                to the given email exists in the datastore.

        Returns:
            str|None. ID of the user possessing the given email, or None if
            the user does not exist.

        Raises:
            Exception. No user_id found for the given email address.
        """
        user_settings = user_services.get_user_settings_by_auth_id(
            self.get_auth_id_from_email(email))
        if user_settings is None:
            if not strict:
                return None
            raise Exception(
                'No user_id found for the given email address: %s' % email
            )

        return user_settings.user_id

    @classmethod
    def get_auth_id_from_email(cls, email: str) -> str:
        """Returns a mock auth ID corresponding to the given email.

        This method can use any algorithm to produce results as long as, during
        the runtime of each test case/method, it is:
        1.  Pure (same input always returns the same output).
        2.  One-to-one (no two distinct inputs return the same output).
        3.  An integer byte-string (integers are always valid in auth IDs).

        Args:
            email: str. The email address of the user.

        Returns:
            str. The mock auth ID of a user possessing the given email.
        """
        # Although the hash function doesn't guarantee a one-to-one mapping, in
        # practice it is sufficient for our tests. We make it a positive integer
        # because those are always valid auth IDs.
        return str(abs(hash(email)))

    def get_all_python_files(self) -> List[str]:
        """Recursively collects all Python files in the core/ and extensions/
        directory.

        Returns:
            list(str). A list of Python files.
        """
        current_dir = os.getcwd()
        files_in_directory = []
        for _dir, _, files in os.walk(current_dir):
            for file_name in files:
                filepath = os.path.relpath(
                    os.path.join(_dir, file_name), start=current_dir)
                if (
                        filepath.endswith('.py') and
                        filepath.startswith(('core/', 'extensions/')) and
                        not filepath.startswith('core/tests')
                ):
                    module = filepath[:-3].replace('/', '.')
                    files_in_directory.append(module)
        return files_in_directory

    def _get_response(
        self,
        url: str,
        expected_content_type: str,
        params: Optional[Dict[str, str]] = None,
        expected_status_int: int = 200
    ) -> webtest.TestResponse:
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
                url,
                params=params,
                expect_errors=expect_errors,
                status=expected_status_int
            )

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

    def get_html_response(
        self, url: str,
        params: Optional[Dict[str, str]] = None,
        expected_status_int: int = 200
    ) -> webtest.TestResponse:
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
        self,
        url: str,
        expected_content_type: str,
        params: Optional[Dict[str, str]] = None,
        expected_status_int: int = 200
    ) -> webtest.TestResponse:
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
        self,
        url: str,
        expected_status_int_list: List[int],
        params: Optional[Dict[str, str]] = None
    ) -> webtest.TestResponse:
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

    # Here we use type Any because this method can return any python object
    # that was parsed from json response.
    def _parse_json_response(
        self, json_response: webtest.TestResponse, expect_errors: bool
    ) -> Any:
        """Convert a JSON server response to an object (such as a dict)."""
        if expect_errors:
            self.assertTrue(json_response.status_int >= 400)
        else:
            self.assertTrue(200 <= json_response.status_int < 400)

        self.assertEqual(json_response.content_type, 'application/json')
        self.assertTrue(json_response.body.startswith(feconf.XSSI_PREFIX))

        return json.loads(json_response.body[len(feconf.XSSI_PREFIX):])

    # Here we use type Any because this method can return JSON response Dict
    # whose values can contain any type of values, like int, bool, str and
    # other types too.
    def get_json(
        self,
        url: str,
        params: Optional[Dict[str, str]] = None,
        expected_status_int: int = 200,
        headers: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """Get a JSON response, transformed to a Python object."""
        if params is not None:
            self.assertIsInstance(params, dict)

        expect_errors = expected_status_int >= 400

        json_response = self.testapp.get(
            url, params=params, expect_errors=expect_errors,
            status=expected_status_int, headers=headers
        )

        # Testapp takes in a status parameter which is the expected status of
        # the response. However this expected status is verified only when
        # expect_errors=False. For other situations we need to explicitly check
        # the status.
        #
        # Reference URL:
        # https://github.com/Pylons/webtest/blob/bf77326420b628c9ea5431432c7e171f88c5d874/webtest/app.py#L1119
        self.assertEqual(json_response.status_int, expected_status_int)

        # Here we use type Any because response is a JSON response dict
        # which can contain different types of values. So, to allow every
        # type of value we used Any here.
        response: Dict[str, Any] = self._parse_json_response(
            json_response,
            expect_errors
        )
        return response

    # Here we use type Any because this method can return JSON response Dict
    # whose values can contain different types of values, like int, bool,
    # str and other types too.
    def post_json(
        self,
        url: str,
        data: Dict[str, Any],
        headers: Optional[Dict[str, str]] = None,
        csrf_token: Optional[str] = None,
        expected_status_int: int = 200,
        upload_files: Optional[List[Tuple[str, ...]]] = None,
        use_payload: bool = True,
        source: Optional[str] = None
    ) -> Dict[str, Any]:
        """Post an object to the server by JSON; return the received object.

        Args:
            url: str. The URL to send the POST request to.
            data: dict. The dictionary that acts as the body of the request.
            headers: dict. The headers set in the request.
            csrf_token: str. The csrf token to identify the user.
            expected_status_int: int. Expected return status of the POST
                request.
            upload_files: list(tuple). List of
                (fieldname, filename, file_content) tuples. Can also provide
                just (fieldname, filename) to have the file contents be
                read from disk.
            use_payload: bool. If true, a new dict is created (which is sent as
                the body of the POST request) with one key - 'payload' - and the
                dict passed in 'data' is used as the value for that key. If
                false, the dict in 'data' is directly passed as the body of the
                request. For all requests called from the frontend, this should
                be set to 'true'.
            source: unicode. The url from which the post call is requested.

        Returns:
            dict. The JSON response for the request in dict form.
        """
        if use_payload:
            data = {'payload': json.dumps(data)}
        if csrf_token:
            data['csrf_token'] = csrf_token
        if source:
            data['source'] = source

        expect_errors = expected_status_int >= 400

        json_response = self._send_post_request(
            self.testapp, url, data, expect_errors,
            expected_status_int=expected_status_int, upload_files=upload_files,
            headers=headers)

        # Testapp takes in a status parameter which is the expected status of
        # the response. However this expected status is verified only when
        # expect_errors=False. For other situations we need to explicitly check
        # the status.
        #
        # Reference URL:
        # https://github.com/Pylons/webtest/blob/bf77326420b628c9ea5431432c7e171f88c5d874/webtest/app.py#L1119
        self.assertEqual(json_response.status_int, expected_status_int)

        # Here we use type Any because response is a JSON response dict
        # which can contain different types of values. So, to allow every
        # type of value we used Any here.
        response: Dict[str, Any] = self._parse_json_response(
            json_response,
            expect_errors
        )
        return response

    # Here we use type Any because this method can return JSON response Dict
    # whose values can contain different types of values, like int, bool,
    # str and other types too.
    def delete_json(
        self,
        url: str,
        params: str = '',
        expected_status_int: int = 200
    ) -> Dict[str, Any]:
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

        # Here we use type Any because response is a JSON response dict
        # which can contain different types of values. So, to allow every
        # type of value we used Any here.
        response: Dict[str, Any] = self._parse_json_response(
            json_response,
            expect_errors
        )
        return response

    def _send_post_request(
        self,
        app: webtest.TestApp,
        url: str,
        data: Union[Dict[str, str], bytes],
        expect_errors: bool,
        expected_status_int: int = 200,
        upload_files: Optional[
            Union[List[Tuple[str, ...]],
            Tuple[Tuple[bytes, ...], ...]]
        ] = None,
        headers: Optional[Dict[str, str]] = None
    ) -> webtest.TestResponse:
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
                tuple(
                    f.encode('utf-8') if isinstance(f, str) else f
                    for f in upload_file
                ) for upload_file in upload_files
            )

        return app.post(
            url, params=data, headers=headers, status=expected_status_int,
            upload_files=upload_files, expect_errors=expect_errors)

    def post_task(
        self,
        url: str,
        payload: Dict[str, str],
        headers: Dict[str, bytes],
        csrf_token: Optional[str] = None,
        expect_errors: bool = False,
        expected_status_int: int = 200
    ) -> webtest.TestApp:
        """Posts an object to the server by JSON with the specific headers
        specified; return the received object.
        """
        if csrf_token:
            payload['csrf_token'] = csrf_token
        return self.testapp.post(
            url, params=json.dumps(payload), headers=headers,
            status=expected_status_int, expect_errors=expect_errors,
            content_type='application/json')

    # Here we use type Any because this method can return JSON response Dict
    # whose values can contain different types of values, like int, bool,
    # str and other types too.
    def put_json(
        self,
        url: str,
        payload: Mapping[str, Union[str, int]],
        csrf_token: Optional[str] = None,
        expected_status_int: int = 200
    ) -> Dict[str, Any]:
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

        # Here we use type Any because the 'response' is a JSON response dict
        # that can contain different types of values. So, to allow every type
        # of value we used Any here.
        response: Dict[str, Any] = self._parse_json_response(
            json_response,
            expect_errors
        )
        return response

    def get_new_csrf_token(self) -> str:
        """Generates CSRF token for test."""
        response: Dict[str, str] = self.get_json('/csrfhandler')
        return response['token']

    def save_new_default_exploration(
        self,
        exploration_id: str,
        owner_id: str,
        title: str = 'A title'
    ) -> exp_domain.Exploration:
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

    def set_interaction_for_state(
        self, state: state_domain.State, interaction_id: str
    ) -> None:
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

        # Here we use type Any because, argument 'value' can accept values of
        # customization args and customization args can have int, str, bool and
        # other types too. Also, Any is used for schema because values in schema
        # dictionary can be of type str, List, Dict and other types too.
        def traverse_schema_and_assign_content_ids(
            value: Any, schema: Dict[str, Any], contentId: str
        ) -> None:
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
                        schema['properties'][schema_property.name],
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
        self,
        exploration_id: str,
        owner_id: str,
        title: str = 'A title',
        category: str = 'Algebra',
        objective: str = 'An objective',
        language_code: str = constants.DEFAULT_LANGUAGE_CODE,
        end_state_name: Optional[str] = None,
        interaction_id: str = 'TextInput',
        correctness_feedback_enabled: bool = False
    ) -> exp_domain.Exploration:
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
            # Here, init_interaction is a InteractionInstance domain object
            # and it is created using 'create_default_interaction' method.
            # So, 'init_interaction' is a default_interaction and it is always
            # going to contain a default_outcome. Thus to narrow down the type
            # from Optional[Outcome] to Outcome for default_outcome, we used
            # assert here.
            assert init_interaction.default_outcome is not None
            init_interaction.default_outcome.dest = end_state_name
            if correctness_feedback_enabled:
                init_interaction.default_outcome.labelled_as_correct = True

        exp_services.save_new_exploration(owner_id, exploration)
        return exploration

    def save_new_linear_exp_with_state_names_and_interactions(
        self,
        exploration_id: str,
        owner_id: str,
        state_names: List[str],
        interaction_ids: List[str],
        title: str = 'A title',
        category: str = 'A category',
        objective: str = 'An objective',
        language_code: str = constants.DEFAULT_LANGUAGE_CODE,
        correctness_feedback_enabled: bool = False
    ) -> exp_domain.Exploration:
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
            correctness_feedback_enabled: bool. Whether the correctness feedback
                is enabled or not for the exploration.

        Returns:
            Exploration. The exploration domain object.

        Raises:
            ValueError. Given list of state names is empty.
            ValueError. Given list of interaction ids is empty.
        """
        if not state_names:
            raise ValueError('must provide at least one state name')
        if not interaction_ids:
            raise ValueError('must provide at least one interaction type')
        iterable_interaction_ids = itertools.cycle(interaction_ids)

        exploration = exp_domain.Exploration.create_default_exploration(
            exploration_id, title=title, init_state_name=state_names[0],
            category=category, objective=objective, language_code=language_code)

        exploration.correctness_feedback_enabled = correctness_feedback_enabled
        exploration.add_states(state_names[1:])
        for from_state_name, dest_state_name in (
                zip(state_names[:-1], state_names[1:])):
            from_state = exploration.states[from_state_name]
            self.set_interaction_for_state(
                from_state, next(iterable_interaction_ids))
            # Here, from_state is a State domain object and it is created using
            # 'create_default_state' method. So, 'from_state' is a default_state
            # and it is always going to contain a default_outcome. Thus to
            # narrow down the type from Optional[Outcome] to Outcome for
            # default_outcome, we used assert here.
            assert from_state.interaction.default_outcome is not None
            from_state.interaction.default_outcome.dest = dest_state_name
            if correctness_feedback_enabled:
                from_state.interaction.default_outcome.labelled_as_correct = (
                    True)
        end_state = exploration.states[state_names[-1]]
        self.set_interaction_for_state(end_state, 'EndExploration')
        end_state.update_interaction_default_outcome(None)

        exp_services.save_new_exploration(owner_id, exploration)
        return exploration

    def save_new_exp_with_custom_states_schema_version(
        self,
        exp_id: str,
        user_id: str,
        states_dict: state_domain.StateDict,
        version: int
    ) -> None:
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

    def publish_exploration(self, owner_id: str, exploration_id: str) -> None:
        """Publish the exploration with the given exploration_id.

        Args:
            owner_id: str. The user_id of the owner of the exploration.
            exploration_id: str. The ID of the new exploration.
        """
        committer = user_services.get_user_actions_info(owner_id)
        rights_manager.publish_exploration(committer, exploration_id)

    def save_new_default_collection(
        self,
        collection_id: str,
        owner_id: str,
        title: str = 'A title',
        category: str = 'A category',
        objective: str = 'An objective',
        language_code: str = constants.DEFAULT_LANGUAGE_CODE
    ) -> collection_domain.Collection:
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
        self,
        collection_id: str,
        owner_id: str,
        title: str = 'A title',
        category: str = 'A category',
        objective: str = 'An objective',
        language_code: str = constants.DEFAULT_LANGUAGE_CODE,
        exploration_id: str = 'an_exploration_id',
        end_state_name: str = DEFAULT_END_STATE_NAME
    ) -> collection_domain.Collection:
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

    def publish_collection(self, owner_id: str, collection_id: str) -> None:
        """Publish the collection with the given collection_id.

        Args:
            owner_id: str. The user_id of the owner of the collection.
            collection_id: str. ID of the collection to be published.
        """
        committer = user_services.get_user_actions_info(owner_id)
        rights_manager.publish_collection(committer, collection_id)

    def create_story_for_translation_opportunity(
        self,
        owner_id: str,
        admin_id: str,
        story_id: str,
        topic_id: str,
        exploration_id: str
    ) -> None:
        """Creates a story and links it to the supplied topic and exploration.

        Args:
            owner_id: str. User ID of the story owner.
            admin_id: str. User ID of the admin that will publish the story.
            story_id: str. The ID of new story.
            topic_id: str. The ID of the topic for which to link the story.
            exploration_id: str. The ID of the exploration that will be added
                as a node to the story.
        """
        story = story_domain.Story.create_default_story(
            story_id,
            'title %s' % story_id,
            'description',
            topic_id,
            'url-fragment')

        story.language_code = 'en'
        story_services.save_new_story(owner_id, story)
        topic_services.add_canonical_story(
            owner_id, topic_id, story.id)
        topic_services.publish_story(
            topic_id, story.id, admin_id)
        story_services.update_story(
            owner_id, story.id, [story_domain.StoryChange({
                'cmd': 'add_story_node',
                'node_id': 'node_1',
                'title': 'Node1',
            }), story_domain.StoryChange({
                'cmd': 'update_story_node_property',
                'property_name': 'exploration_id',
                'node_id': 'node_1',
                'old_value': None,
                'new_value': exploration_id
            })], 'Changes.')

    def save_new_story(
        self,
        story_id: str,
        owner_id: str,
        corresponding_topic_id: str,
        title: str = 'Title',
        description: str = 'Description',
        notes: str = 'Notes',
        language_code: str = constants.DEFAULT_LANGUAGE_CODE,
        url_fragment: str = 'title',
        meta_tag_content: str = 'story meta tag content'
    ) -> story_domain.Story:
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
        self,
        story_id: str,
        thumbnail_filename: Optional[str],
        thumbnail_bg_color: Optional[str],
        thumbnail_size_in_bytes: Optional[int],
        owner_id: str,
        title: str,
        description: str,
        notes: str,
        corresponding_topic_id: str,
        language_code: str = constants.DEFAULT_LANGUAGE_CODE,
        url_fragment: str = 'story-frag',
        meta_tag_content: str = 'story meta tag content'
    ) -> None:
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
            thumbnail_size_in_bytes: int|None. The thumbnail size in bytes of
                the story.
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
            thumbnail_bg_color=thumbnail_bg_color,
            thumbnail_size_in_bytes=thumbnail_size_in_bytes,
            description=description, title=title,
            language_code=language_code,
            story_contents_schema_version=1, notes=notes,
            corresponding_topic_id=corresponding_topic_id,
            story_contents=self.VERSION_1_STORY_CONTENTS_DICT,
            url_fragment=url_fragment, meta_tag_content=meta_tag_content)
        commit_message = 'New story created with title \'%s\'.' % title
        story_model.commit(
            owner_id, commit_message,
            [{'cmd': story_domain.CMD_CREATE_NEW, 'title': title}])

    def save_new_story_with_story_contents_schema_v5(
        self,
        story_id: str,
        thumbnail_filename: Optional[str],
        thumbnail_bg_color: Optional[str],
        thumbnail_size_in_bytes: Optional[int],
        owner_id: str,
        title: str,
        description: str,
        notes: str,
        corresponding_topic_id: str,
        language_code: str = constants.DEFAULT_LANGUAGE_CODE,
        url_fragment: str = 'story-frag',
        meta_tag_content: str = 'story meta tag content'
    ) -> None:
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
            thumbnail_size_in_bytes: int|None. The thumbnail size in bytes of
                the story.
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
        story_content_v5 = {
            'nodes': [{
                'outline': (
                    '<p>Value</p>'
                    '<oppia-noninteractive-math math_content-with-value="{'
                    '&amp;quot;raw_latex&amp;quot;: &amp;quot;+,-,-,+&amp;quot;, ' # pylint: disable=line-too-long
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
                'thumbnail_filename': 'image.svg',
                'thumbnail_bg_color': None,
                'thumbnail_size_in_bytes': 21131,
            }],
            'initial_node_id': 'node_1',
            'next_node_id': 'node_2',
        }
        story_model = story_models.StoryModel(
            id=story_id, thumbnail_filename=thumbnail_filename,
            thumbnail_bg_color=thumbnail_bg_color,
            thumbnail_size_in_bytes=thumbnail_size_in_bytes,
            description=description, title=title,
            language_code=language_code,
            story_contents_schema_version=5, notes=notes,
            corresponding_topic_id=corresponding_topic_id,
            story_contents=story_content_v5,
            url_fragment=url_fragment, meta_tag_content=meta_tag_content)
        commit_message = 'New story created with title \'%s\'.' % title
        story_model.commit(
            owner_id, commit_message,
            [{'cmd': story_domain.CMD_CREATE_NEW, 'title': title}])
        story_services.create_story_summary(story_id)

    def save_new_subtopic(
        self, subtopic_id: int, owner_id: str, topic_id: str
    ) -> subtopic_page_domain.SubtopicPage:
        """Creates an Oppia subtopic and saves it.

        Args:
            subtopic_id: int. ID for the subtopic to be created.
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
        self,
        topic_id: str,
        owner_id: str,
        name: str = 'topic',
        abbreviated_name: str = 'topic',
        url_fragment: str = 'topic',
        thumbnail_filename: Optional[str] = 'topic.svg',
        thumbnail_bg_color: Optional[str] = (
            constants.ALLOWED_THUMBNAIL_BG_COLORS['topic'][0]),
        thumbnail_size_in_bytes: Optional[int] = 21131,
        description: str = 'description',
        canonical_story_ids: Optional[List[str]] = None,
        additional_story_ids: Optional[List[str]] = None,
        uncategorized_skill_ids: Optional[List[str]] = None,
        subtopics: Optional[List[topic_domain.Subtopic]] = None,
        next_subtopic_id: int = 0,
        language_code: str = constants.DEFAULT_LANGUAGE_CODE,
        meta_tag_content: str = 'topic meta tag content',
        practice_tab_is_displayed: bool = False,
        page_title_fragment_for_web: str = 'topic page title'
    ) -> topic_domain.Topic:
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
            thumbnail_size_in_bytes: int|None. The thumbnail size in bytes of
                the topic.
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
        skill_ids_for_diagnostic_test = []
        for subtopic in subtopics:
            skill_ids_for_diagnostic_test.extend(subtopic.skill_ids)

        topic = topic_domain.Topic(
            topic_id, name, abbreviated_name, url_fragment, thumbnail_filename,
            thumbnail_bg_color, thumbnail_size_in_bytes, description,
            canonical_story_references, additional_story_references,
            uncategorized_skill_ids, subtopics,
            feconf.CURRENT_SUBTOPIC_SCHEMA_VERSION, next_subtopic_id,
            language_code, 0, feconf.CURRENT_STORY_REFERENCE_SCHEMA_VERSION,
            meta_tag_content, practice_tab_is_displayed,
            page_title_fragment_for_web, skill_ids_for_diagnostic_test)
        topic_services.save_new_topic(owner_id, topic)
        return topic

    def save_new_topic_with_subtopic_schema_v1(
        self,
        topic_id: str,
        owner_id: str,
        name: str,
        abbreviated_name: str,
        url_fragment: str,
        canonical_name: str,
        description: str,
        thumbnail_filename: str,
        thumbnail_bg_color: str,
        canonical_story_references: List[topic_domain.StoryReference],
        additional_story_references: List[topic_domain.StoryReference],
        uncategorized_skill_ids: List[str],
        next_subtopic_id: int,
        language_code: str = constants.DEFAULT_LANGUAGE_CODE,
        meta_tag_content: str = 'topic meta tag content',
        practice_tab_is_displayed: bool = False,
        page_title_fragment_for_web: str = 'topic page title'
    ) -> None:
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
        self,
        question_id: str,
        owner_id: str,
        question_state_data: state_domain.State,
        linked_skill_ids: List[str],
        inapplicable_skill_misconception_ids: Optional[List[str]] = None,
        language_code: str = constants.DEFAULT_LANGUAGE_CODE
    ) -> question_domain.Question:
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
        self,
        question_id: str,
        owner_id: str,
        linked_skill_ids: List[str],
        inapplicable_skill_misconception_ids: Optional[List[str]] = None,
        language_code: str = constants.DEFAULT_LANGUAGE_CODE
    ) -> None:
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
        self,
        author_id: str,
        skill_id: str,
        suggestion_id: Optional[str] = None,
        language_code: str = constants.DEFAULT_LANGUAGE_CODE
    ) -> Optional[str]:
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
        change: Dict[
            str,
            Union[str, float, Dict[str, Union[Optional[Collection[str]], int]]]
        ] = {
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
        self,
        skill_id: str,
        owner_id: str,
        description: str = 'description',
        misconceptions: Optional[List[skill_domain.Misconception]] = None,
        rubrics: Optional[List[skill_domain.Rubric]] = None,
        skill_contents: Optional[skill_domain.SkillContents] = None,
        language_code: str = constants.DEFAULT_LANGUAGE_CODE,
        prerequisite_skill_ids: Optional[List[str]] = None
    ) -> skill_domain.Skill:
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
        self,
        skill_id: str,
        owner_id: str,
        description: str,
        next_misconception_id: int,
        misconceptions: Optional[List[skill_domain.Misconception]] = None,
        rubrics: Optional[List[skill_domain.Rubric]] = None,
        skill_contents: Optional[skill_domain.SkillContents] = None,
        misconceptions_schema_version: int = 1,
        rubric_schema_version: int = 1,
        skill_contents_schema_version: int = 1,
        language_code: str = constants.DEFAULT_LANGUAGE_CODE
    ) -> None:
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

    def _create_valid_question_data(
        self, default_dest_state_name: str
    ) -> state_domain.State:
        """Creates a valid question_data dict.

        Args:
            default_dest_state_name: str. The default destination state.

        Returns:
            dict. The default question_data dict.
        """
        state = state_domain.State.create_default_state(
            default_dest_state_name, is_initial_state=True)
        state.update_interaction_id('TextInput')
        solution_dict: state_domain.SolutionDict = {
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
        # Ruling out the possibility of None for mypy type checking, because
        # we above we are already updating the value of interaction_id.
        assert state.interaction.id is not None
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
            'rows': {'value': 1}
        })
        state.update_next_content_id_index(2)
        # Here, state is a State domain object and it is created using
        # 'create_default_state' method. So, 'state' is a default_state
        # and it is always going to contain a default_outcome. Thus to
        # narrow down the type from Optional[Outcome] to Outcome for
        # default_outcome, we used assert here.
        assert state.interaction.default_outcome is not None
        state.interaction.default_outcome.labelled_as_correct = True
        state.interaction.default_outcome.dest = None
        return state


class LinterTestBase(GenericTestBase):
    """Base class for linter tests."""

    def setUp(self) -> None:
        super().setUp()
        self.linter_stdout: List[str] = []

        def mock_print(*args: str) -> None:
            """Mock for print. Append the values to print to
            linter_stdout list.

            Args:
                *args: list(*). Variable length argument list of values to print
                    in the same line of output.
            """
            self.linter_stdout.append(' '.join(str(arg) for arg in args))

        self.print_swap = self.swap(builtins, 'print', mock_print)

    def assert_same_list_elements(
        self, phrases: List[str], stdout: List[str]
    ) -> None:
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

    def assert_failed_messages_count(
        self, stdout: List[str], expected_failed_count: int
    ) -> None:
        """Assert number of expected failed checks to actual number of failed
        checks.

        Args:
            stdout: list(str). A list of linter output messages.
            expected_failed_count: int. Expected number of failed messages.
        """
        failed_count = sum(msg.startswith('FAILED') for msg in stdout)
        self.assertEqual(failed_count, expected_failed_count)


class EmailMessageMock:
    """Mock for core.platform.models email services messages."""

    def __init__(
        self,
        sender_email: str,
        recipient_email: List[str],
        subject: str,
        plaintext_body: str,
        html_body: str,
        bcc: Optional[Sequence[str]] = None,
        reply_to: Optional[str] = None,
        recipient_variables: Optional[
            Dict[str, Dict[str, Union[str, int]]]
        ] = None
    ) -> None:
        """Inits a mock email message with all the necessary data.

        Args:
            sender_email: str. The email address of the sender. This should be
                in the form 'SENDER_NAME <SENDER_EMAIL_ADDRESS>' or
                'SENDER_EMAIL_ADDRESS'. Must be utf-8.
            recipient_email: list(str). The email addresses of the recipients.
                Must be utf-8.
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

    emails_dict: Dict[
        str, List[EmailMessageMock]
    ] = collections.defaultdict(list)

    def run(self, result: Optional[unittest.TestResult] = None) -> None:
        """Adds a context swap on top of the test_utils.run() method so that
        test classes extending GenericEmailTestBase will automatically have a
        mailgun api key, mailgun domain name and mocked version of
        send_email_to_recipients().
        """
        with self.swap(
            email_services, 'send_email_to_recipients',
            self._send_email_to_recipients):
            super().run(result=result)

    def setUp(self) -> None:
        super().setUp()
        self._wipe_emails_dict()

    def _wipe_emails_dict(self) -> None:
        """Reset email dictionary for a new test."""
        self.emails_dict = collections.defaultdict(list)

    def _send_email_to_recipients(
        self,
        sender_email: str,
        recipient_emails: List[str],
        subject: str,
        plaintext_body: str,
        html_body: str,
        bcc: Optional[List[str]] = None,
        reply_to: Optional[str] = None,
        recipient_variables: Optional[
            Dict[str, Dict[str, Union[str, int]]]
        ] = None
    ) -> bool:
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

    def _get_sent_email_messages(self, to: str) -> List[EmailMessageMock]:
        """Gets messages to a single recipient email.

        Args:
            to: str. The recipient email address.

        Returns:
            list(EmailMessageMock). The list of email messages corresponding to
            that recipient email.
        """
        return self.emails_dict[to] if to in self.emails_dict else []

    def _get_all_sent_email_messages(self) -> Dict[str, List[EmailMessageMock]]:
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

    # Here we use type Any because method 'post_blob' can return a JSON
    # dict which can contain different types of values. So, to allow every
    # type of value we used Any here.
    def post_blob(
        self, url: str, payload: bytes, expected_status_int: int = 200
    ) -> Dict[str, Any]:
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
            headers={'content-type': 'application/octet-stream'})
        # Testapp takes in a status parameter which is the expected status of
        # the response. However this expected status is verified only when
        # expect_errors=False. For other situations we need to explicitly check
        # the status.
        # Reference URL:
        # https://github.com/Pylons/webtest/blob/
        # bf77326420b628c9ea5431432c7e171f88c5d874/webtest/app.py#L1119 .

        self.assertEqual(response.status_int, expected_status_int)
        # Here we use type Any because the 'result' is a JSON result dict
        # that can contain different types of values. So, to allow every type
        # of value we used Any here.
        result: Dict[str, Any] = self._parse_json_response(
            response,
            expect_errors
        )
        return result

    # TODO(#15451): Here we use type Any because currently, the stubs of
    # protobuf in typeshed are not fully type annotated yet and because of
    # this MyPy is not able to fetch the return type of this method and
    # assuming it as Any type.
    def _get_classifier_data_from_classifier_training_job(
        self, classifier_training_job: classifier_domain.ClassifierTrainingJob
    ) -> Any:
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
        fs = fs_services.GcsFileSystem(
            feconf.ENTITY_TYPE_EXPLORATION, classifier_training_job.exp_id)
        classifier_data = utils.decompress_from_zlib(fs.get(filename))
        classifier_data_proto = text_classifier_pb2.TextClassifierFrozenModel()
        classifier_data_proto.ParseFromString(classifier_data)
        return classifier_data_proto


class FunctionWrapper:
    """A utility for making function wrappers. Create a subclass and override
    any or both of the pre_call_hook and post_call_hook methods. See these
    methods for more info.
    """

    # Here we use type Any because argument 'func' can accept any kind of
    # function signature. So, to allow every function signature we used
    # Callable[..., Any] type here.
    def __init__(self, func: Callable[..., Any]) -> None:
        """Creates a new FunctionWrapper instance.

        Args:
            func: a callable, or data descriptor. If it's a descriptor, then
                __get__ should return a bound method. For example, func can be
                a function, a method, a static or class method, but not a
                @property.
        """
        self._func = func
        # Here we use object because '_instance' can be a object of any class.
        self._instance: Optional[object] = None

    # Here we use type Any because this method can accept arguments of the
    # wrapped function, and the wrapped function can have an arbitrary number
    # of arguments with different types.
    def __call__(self, *args: Any, **kwargs: Any) -> Any:
        """Overrides the call method for the function to call pre_call_hook
        method which would be called before the function is executed and
        post_call_hook which would be called after the function is executed.
        """
        if self._instance is not None:
            args = tuple([self._instance] + list(args))

        # Creates a mapping from positional and keyword arguments to parameters
        # and binds them to the call signature of the method. Serves as a
        # replacement for inspect.getcallargs() in python versions >= 3.5.
        sig = inspect.signature(self._func)
        args_dict = sig.bind_partial(*args, **kwargs).arguments

        self.pre_call_hook(args_dict)

        result = self._func(*args, **kwargs)

        self.post_call_hook(args_dict, result)

        return result

    # Here we use object because this method can accept object of any class.
    def __get__(self, instance: object, owner: str) -> FunctionWrapper:
        # We have to implement __get__ because otherwise, we don't have a chance
        # to bind to the instance self._func was bound to. See the following SO
        # answer: https://stackoverflow.com/a/22555978/675311
        self._instance = instance
        return self

    # Here we use type Any because argument 'args' can accept arbitrary number
    # of function's arguments and these arguments can be of any type.
    def pre_call_hook(self, args: OrderedDict[str, Any]) -> None:
        """Override this to do tasks that should be executed before the actual
        function call.

        Args:
            args: OrderedDict. Set of arguments that the function accepts.
        """
        pass

    # Here we use type Any because argument 'args' can accept arbitrary number
    # of function's arguments and these arguments can be of any type.
    def post_call_hook(self, args: OrderedDict[str, Any], result: str) -> None:
        """Override this to do tasks that should be executed after the actual
        function call.

        Args:
            args: OrderedDict. Set of arguments that the function accepts.
            result: *. Result returned from the function.
        """
        pass


class CallCounter(FunctionWrapper):
    """A function wrapper that keeps track of how often the function is called.
    Note that the counter is incremented before each call, so it is also
    increased when the function raises an exception.
    """

    # Here we use type Any because argument 'f' can accept any kind of
    # function signature. So, to allow every function signature we used
    # Callable[..., Any] type here.
    def __init__(self, f: Callable[..., Any]) -> None:
        """Counts the number of times the given function has been called. See
        FunctionWrapper for arguments.
        """
        super().__init__(f)
        self._times_called = 0

    @property
    def times_called(self) -> int:
        """Property that returns the number of times the wrapped function has
        been called.

        Returns:
            int. The number of times the wrapped function has been called.
        """
        return self._times_called

    # Here we use type Any because argument 'args' can accept arbitrary number
    # of function's arguments and these arguments can be of any type.
    def pre_call_hook(self, args: OrderedDict[str, Any]) -> None:
        """Method that is called before each function call to increment the
        counter tracking the number of times a function is called. This will
        also be called even when the function raises an exception.

        Args:
            args: OrderedDict. Set of arguments that the function accepts.
        """
        self._times_called += 1


class FailingFunction(FunctionWrapper):
    """A function wrapper that makes a function fail, raising a given exception.
    It can be set to succeed after a given number of calls.
    """

    INFINITY: Final = math.inf

    # Here we use type Any because argument 'f' can accept any kind of
    # function signature. So, to allow every function signature we used
    # Callable[..., Any] type here.
    def __init__(
        self,
        f: Callable[..., Any],
        exception: Union[Type[BaseException], BaseException],
        num_tries_before_success: float
    ) -> None:
        """Create a new Failing function.

        Args:
            f: func. See FunctionWrapper.
            exception: Exception. The exception to be raised.
            num_tries_before_success: float. The number of times to raise an
                exception, before a call succeeds. If this is 0, all calls will
                succeed, if it is FailingFunction. INFINITY, all calls will
                fail.

        Raises:
            ValueError. The number of times to raise an exception before a call
                succeeds should be a non-negative interger or INFINITY.
        """
        super().__init__(f)
        self._exception = exception
        self._num_tries_before_success = num_tries_before_success
        self._always_fail = (
            self._num_tries_before_success == FailingFunction.INFINITY)
        self._times_called = 0

        if not self._always_fail and self._num_tries_before_success < 0:
            raise ValueError(
                'num_tries_before_success should either be an '
                'integer greater than or equal to 0, '
                'or FailingFunction.INFINITY')

    # Here we use type Any because argument 'args' can accept arbitrary number
    # of function's arguments and these arguments can be of any type.
    def pre_call_hook(self, args: OrderedDict[str, Any]) -> None:
        """Method that is called each time before the actual function call to
        check if the exception is to be raised based on the number of tries
        before success.

        Args:
            args: OrderedDict. Set of arguments that the function accepts.
        """
        self._times_called += 1
        call_should_fail = (
            self._always_fail or
            self._num_tries_before_success >= self._times_called)
        if call_should_fail:
            raise self._exception
