# coding: utf-8
#
# Copyright 2015 The Oppia Authors. All Rights Reserved.
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

"""Domain objects for a collection and its constituents.

Domain objects capture domain-specific logic and are agnostic of how the
objects they represent are stored. All methods and properties in this file
should therefore be independent of the specific storage models used.
"""

from __future__ import annotations

import datetime
import json
import re
import string

from core import feconf
from core import utils
from core.constants import constants
from core.domain import change_domain

from typing import Dict, Final, List, Literal, Optional, TypedDict, cast

# Do not modify the values of these constants. This is to preserve backwards
# compatibility with previous change dicts.
COLLECTION_PROPERTY_TITLE: Final = 'title'
COLLECTION_PROPERTY_CATEGORY: Final = 'category'
COLLECTION_PROPERTY_OBJECTIVE: Final = 'objective'
COLLECTION_PROPERTY_LANGUAGE_CODE: Final = 'language_code'
COLLECTION_PROPERTY_TAGS: Final = 'tags'
COLLECTION_NODE_PROPERTY_PREREQUISITE_SKILL_IDS: Final = (
    'prerequisite_skill_ids')
COLLECTION_NODE_PROPERTY_ACQUIRED_SKILL_IDS: Final = 'acquired_skill_ids'
# These node properties have been deprecated.
COLLECTION_NODE_PROPERTY_PREREQUISITE_SKILLS: Final = 'prerequisite_skills'
COLLECTION_NODE_PROPERTY_ACQUIRED_SKILLS: Final = 'acquired_skills'

# This takes additional 'title' and 'category' parameters.
CMD_CREATE_NEW: Final = 'create_new'
# This takes an additional 'exploration_id' parameter.
CMD_ADD_COLLECTION_NODE: Final = 'add_collection_node'
# This takes an additional 'exploration_id' parameter.
CMD_DELETE_COLLECTION_NODE: Final = 'delete_collection_node'
# This takes 2 parameters corresponding to the node indices to be swapped.
CMD_SWAP_COLLECTION_NODES: Final = 'swap_nodes'
# This takes additional 'property_name' and 'new_value' parameters and,
# optionally, 'old_value'.
CMD_EDIT_COLLECTION_PROPERTY: Final = 'edit_collection_property'
# This takes additional 'property_name' and 'new_value' parameters and,
# optionally, 'old_value'.
# Currently, a node only has exploration_id as its parameter, if more
# parameters are to be added, the following CMD should be used
# for its changelists.
CMD_EDIT_COLLECTION_NODE_PROPERTY: Final = 'edit_collection_node_property'
# This takes additional 'from_version' and 'to_version' parameters for logging.
CMD_MIGRATE_SCHEMA_TO_LATEST_VERSION: Final = 'migrate_schema_to_latest_version'
# This takes an additional 'name' parameter.
CMD_ADD_COLLECTION_SKILL: Final = 'add_collection_skill'
# This takes an additional 'skill_id' parameter.
CMD_DELETE_COLLECTION_SKILL: Final = 'delete_collection_skill'
# This takes additional 'question_id' and 'skill_id' parameters.
CMD_ADD_QUESTION_ID_TO_SKILL: Final = 'add_question_id_to_skill'
# This takes additional 'question_id' and 'skill_id' parameters.
CMD_REMOVE_QUESTION_ID_FROM_SKILL: Final = 'remove_question_id_from_skill'

# Prefix for skill IDs. This should not be changed -- doing so will result in
# backwards-compatibility issues.
_SKILL_ID_PREFIX: Final = 'skill'


class CollectionChange(change_domain.BaseChange):
    """Domain object class for a change to a collection.

    IMPORTANT: Ensure that all changes to this class (and how these cmds are
    interpreted in general) preserve backward-compatibility with the
    collection snapshots in the datastore. Do not modify the definitions of
    cmd keys that already exist.

    The allowed commands, together with the attributes:
        - 'add_collection_node' (with exploration_id)
        - 'delete_collection_node' (with exploration_id)
        - 'edit_collection_node_property' (with exploration_id,
            property_name, new_value and, optionally, old_value)
        - 'edit_collection_property' (with property_name, new_value
            and, optionally, old_value)
        - 'migrate_schema' (with from_version and to_version)
    For a collection, property_name must be one of
    COLLECTION_PROPERTIES.
    """

    # The allowed list of collection properties which can be used in
    # edit_collection_property command.
    COLLECTION_PROPERTIES: List[str] = [
        COLLECTION_PROPERTY_TITLE, COLLECTION_PROPERTY_CATEGORY,
        COLLECTION_PROPERTY_OBJECTIVE, COLLECTION_PROPERTY_LANGUAGE_CODE,
        COLLECTION_PROPERTY_TAGS]

    ALLOWED_COMMANDS: List[feconf.ValidCmdDict] = [{
        'name': CMD_CREATE_NEW,
        'required_attribute_names': ['category', 'title'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }, {
        'name': CMD_ADD_COLLECTION_NODE,
        'required_attribute_names': ['exploration_id'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }, {
        'name': CMD_DELETE_COLLECTION_NODE,
        'required_attribute_names': ['exploration_id'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }, {
        'name': CMD_SWAP_COLLECTION_NODES,
        'required_attribute_names': ['first_index', 'second_index'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }, {
        'name': CMD_EDIT_COLLECTION_PROPERTY,
        'required_attribute_names': ['property_name', 'new_value'],
        'optional_attribute_names': ['old_value'],
        'user_id_attribute_names': [],
        'allowed_values': {'property_name': COLLECTION_PROPERTIES},
        'deprecated_values': {}
    }, {
        'name': CMD_EDIT_COLLECTION_NODE_PROPERTY,
        'required_attribute_names': [
            'exploration_id', 'property_name', 'new_value'],
        'optional_attribute_names': ['old_value'],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }, {
        'name': CMD_MIGRATE_SCHEMA_TO_LATEST_VERSION,
        'required_attribute_names': ['from_version', 'to_version'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }, {
        'name': CMD_ADD_COLLECTION_SKILL,
        'required_attribute_names': ['name'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }, {
        'name': CMD_DELETE_COLLECTION_SKILL,
        'required_attribute_names': ['skill_id'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }, {
        'name': CMD_ADD_QUESTION_ID_TO_SKILL,
        'required_attribute_names': ['question_id', 'skill_id'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }, {
        'name': CMD_REMOVE_QUESTION_ID_FROM_SKILL,
        'required_attribute_names': ['question_id', 'skill_id'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }]


class CreateNewCollectionCmd(CollectionChange):
    """Class representing the CollectionChange's
    CMD_CREATE_NEW command.
    """

    category: str
    title: str


class AddCollectionNodeCmd(CollectionChange):
    """Class representing the CollectionChange's
    CMD_ADD_COLLECTION_NODE command.
    """

    exploration_id: str


class DeleteCollectionNodeCmd(CollectionChange):
    """Class representing the CollectionChange's
    CMD_DELETE_COLLECTION_NODE command.
    """

    exploration_id: str


class SwapCollectionNodesCmd(CollectionChange):
    """Class representing the CollectionChange's
    CMD_SWAP_COLLECTION_NODES command.
    """

    first_index: int
    second_index: int


class EditCollectionPropertyTitleCmd(CollectionChange):
    """Class representing the CollectionChange's
    CMD_EDIT_COLLECTION_PROPERTY command with
    COLLECTION_PROPERTY_TITLE as allowed value.
    """

    property_name: Literal['title']
    new_value: str
    old_value: str


class EditCollectionPropertyCategoryCmd(CollectionChange):
    """Class representing the CollectionChange's
    CMD_EDIT_COLLECTION_PROPERTY command with
    COLLECTION_PROPERTY_CATEGORY as allowed value.
    """

    property_name: Literal['category']
    new_value: str
    old_value: str


class EditCollectionPropertyObjectiveCmd(CollectionChange):
    """Class representing the CollectionChange's
    CMD_EDIT_COLLECTION_PROPERTY command with
    COLLECTION_PROPERTY_OBJECTIVE as allowed value.
    """

    property_name: Literal['objective']
    new_value: str
    old_value: str


class EditCollectionPropertyLanguageCodeCmd(CollectionChange):
    """Class representing the CollectionChange's
    CMD_EDIT_COLLECTION_PROPERTY command with
    COLLECTION_PROPERTY_LANGUAGE_CODE as allowed value.
    """

    property_name: Literal['language_code']
    new_value: str
    old_value: str


class EditCollectionPropertyTagsCmd(CollectionChange):
    """Class representing the CollectionChange's
    CMD_EDIT_COLLECTION_PROPERTY command with
    COLLECTION_PROPERTY_TAGS as allowed value.
    """

    property_name: Literal['tags']
    new_value: List[str]
    old_value: List[str]


class EditCollectionNodePropertyCmd(CollectionChange):
    """Class representing the CollectionChange's
    CMD_EDIT_COLLECTION_NODE_PROPERTY command.
    """

    exploration_id: str
    property_name: str
    new_value: str
    old_value: str


class MigrateSchemaToLatestVersionCmd(CollectionChange):
    """Class representing the CollectionChange's
    CMD_MIGRATE_SCHEMA_TO_LATEST_VERSION command.
    """

    from_version: int
    to_version: int


class AddCollectionSkillCmd(CollectionChange):
    """Class representing the CollectionChange's
    CMD_ADD_COLLECTION_SKILL command.
    """

    name: str


class DeleteCollectionSkillCmd(CollectionChange):
    """Class representing the CollectionChange's
    CMD_DELETE_COLLECTION_SKILL command.
    """

    skill_id: str


class AddQuestionIdToSkillCmd(CollectionChange):
    """Class representing the CollectionChange's
    CMD_ADD_QUESTION_ID_TO_SKILL command.
    """

    question_id: str
    skill_id: str


class RemoveQuestionIdFromSkillCmd(CollectionChange):
    """Class representing the CollectionChange's
    CMD_ADD_QUESTION_ID_TO_SKILL command.
    """

    question_id: str
    skill_id: str


class CollectionNodeDict(TypedDict):
    """Dictionary representing the CollectionNode object."""

    exploration_id: str


class CollectionNode:
    """Domain object describing a node in the exploration graph of a
    collection. The node contains the reference to
    its exploration (its ID).
    """

    def __init__(self, exploration_id: str) -> None:
        """Initializes a CollectionNode domain object.

        Args:
            exploration_id: str. A valid ID of an exploration referenced by
                this node.
        """
        self.exploration_id = exploration_id

    def to_dict(self) -> CollectionNodeDict:
        """Returns a dict representing this CollectionNode domain object.

        Returns:
            dict. A dict, mapping all fields (exploration_id,
            prerequisite_skill_ids, acquired_skill_ids) of CollectionNode
            instance.
        """
        return {
            'exploration_id': self.exploration_id
        }

    @classmethod
    def from_dict(
        cls, node_dict: CollectionNodeDict
    ) -> CollectionNode:
        """Return a CollectionNode domain object from a dict.

        Args:
            node_dict: dict. The dict representation of CollectionNode object.

        Returns:
            CollectionNode. The corresponding CollectionNode domain object.
        """
        return cls(node_dict['exploration_id'])

    def validate(self) -> None:
        """Validates various properties of the collection node.

        Raises:
            ValidationError. One or more attributes of the collection node are
                invalid.
        """
        if not isinstance(self.exploration_id, str):
            raise utils.ValidationError(
                'Expected exploration ID to be a string, received %s' %
                self.exploration_id)

    @classmethod
    def create_default_node(cls, exploration_id: str) -> CollectionNode:
        """Returns a CollectionNode domain object with default values.

        Args:
            exploration_id: str. The id of the exploration.

        Returns:
            CollectionNode. The CollectionNode domain object with default
            value.
        """
        return cls(exploration_id)


class CollectionDict(TypedDict):
    """Dictionary representing the Collection object."""

    id: str
    title: str
    category: str
    objective: str
    language_code: str
    tags: List[str]
    schema_version: int
    nodes: List[CollectionNodeDict]


class SerializableCollectionDict(CollectionDict):
    """Dictionary representing the serializable Collection object."""

    version: int
    created_on: str
    last_updated: str


class VersionedCollectionDict(TypedDict):
    """Dictionary representing versioned Collection object."""

    schema_version: int
    collection_contents: CollectionDict


class Collection:
    """Domain object for an Oppia collection."""

    def __init__(
        self,
        collection_id: str,
        title: str,
        category: str,
        objective: str,
        language_code: str,
        tags: List[str],
        schema_version: int,
        nodes: List[CollectionNode],
        version: int,
        created_on: Optional[datetime.datetime] = None,
        last_updated: Optional[datetime.datetime] = None
    ) -> None:
        """Constructs a new collection given all the information necessary to
        represent a collection.

        Note: The schema_version represents the version of any underlying
        dictionary or list structures stored within the collection. In
        particular, the schema for CollectionNodes is represented by this
        version. If the schema for CollectionNode changes, then a migration
        function will need to be added to this class to convert from the
        current schema version to the new one. This function should be called
        in both from_yaml in this class and
        collection_services._migrate_collection_contents_to_latest_schema.
        feconf.CURRENT_COLLECTION_SCHEMA_VERSION should be incremented and the
        new value should be saved in the collection after the migration
        process, ensuring it represents the latest schema version.

        Args:
            collection_id: str. The unique id of the collection.
            title: str. The title of the collection.
            category: str. The category of the collection.
            objective: str. The objective of the collection.
            language_code: str. The language code of the collection (like 'en'
                for English).
            tags: list(str). The list of tags given to the collection.
            schema_version: int. The schema version for the collection.
            nodes: list(CollectionNode). The list of nodes present in the
                collection.
            version: int. The version of the collection.
            created_on: datetime.datetime. Date and time when the collection is
                created.
            last_updated: datetime.datetime. Date and time when the
                collection was last updated.
        """
        self.id = collection_id
        self.title = title
        self.category = category
        self.objective = objective
        self.language_code = language_code
        self.tags = tags
        self.schema_version = schema_version
        self.nodes = nodes
        self.version = version
        self.created_on = created_on
        self.last_updated = last_updated

    def to_dict(self) -> CollectionDict:
        """Returns a dict representing this Collection domain object.

        Returns:
            dict. A dict, mapping all fields of Collection instance.
        """
        return {
            'id': self.id,
            'title': self.title,
            'category': self.category,
            'objective': self.objective,
            'language_code': self.language_code,
            'tags': self.tags,
            'schema_version': self.schema_version,
            'nodes': [
                node.to_dict() for node in self.nodes
            ]
        }

    @classmethod
    def create_default_collection(
        cls,
        collection_id: str,
        title: str = feconf.DEFAULT_COLLECTION_TITLE,
        category: str = feconf.DEFAULT_COLLECTION_CATEGORY,
        objective: str = feconf.DEFAULT_COLLECTION_OBJECTIVE,
        language_code: str = constants.DEFAULT_LANGUAGE_CODE
    ) -> Collection:
        """Returns a Collection domain object with default values.

        Args:
            collection_id: str. The unique id of the collection.
            title: str. The title of the collection.
            category: str. The category of the collection.
            objective: str. The objective of the collection.
            language_code: str. The language code of the collection (like 'en'
                for English).

        Returns:
            Collection. The Collection domain object with the default
            values.
        """
        return cls(
            collection_id, title, category, objective, language_code, [],
            feconf.CURRENT_COLLECTION_SCHEMA_VERSION, [], 0)

    @classmethod
    def from_dict(
        cls,
        collection_dict: CollectionDict,
        collection_version: int = 0,
        collection_created_on: Optional[datetime.datetime] = None,
        collection_last_updated: Optional[datetime.datetime] = None
    ) -> Collection:
        """Return a Collection domain object from a dict.

        Args:
            collection_dict: dict. The dictionary representation of the
                collection.
            collection_version: int. The version of the collection.
            collection_created_on: datetime.datetime. Date and time when the
                collection is created.
            collection_last_updated: datetime.datetime. Date and time when
                the collection is updated last time.

        Returns:
            Collection. The corresponding Collection domain object.
        """
        collection = cls(
            collection_dict['id'], collection_dict['title'],
            collection_dict['category'], collection_dict['objective'],
            collection_dict['language_code'], collection_dict['tags'],
            collection_dict['schema_version'],
            [
                CollectionNode.from_dict(node_dict)
                for node_dict in collection_dict['nodes']
            ], collection_version,
            collection_created_on, collection_last_updated)

        return collection

    @classmethod
    def deserialize(cls, json_string: str) -> Collection:
        """Returns a Collection domain object decoded from a JSON string.

        Args:
            json_string: str. A JSON-encoded string that can be
                decoded into a dictionary representing a Collection.
                Only call on strings that were created using serialize().

        Returns:
            Collection. The corresponding Collection domain object.
        """
        collection_dict = json.loads(json_string)

        created_on = (
            utils.convert_string_to_naive_datetime_object(
                collection_dict['created_on'])
            if 'created_on' in collection_dict else None)
        last_updated = (
            utils.convert_string_to_naive_datetime_object(
                collection_dict['last_updated'])
            if 'last_updated' in collection_dict else None)
        collection = cls.from_dict(
            collection_dict,
            collection_version=collection_dict['version'],
            collection_created_on=created_on,
            collection_last_updated=last_updated)

        return collection

    def serialize(self) -> str:
        """Returns the object serialized as a JSON string.

        Returns:
            str. JSON-encoded str encoding all of the information composing
            the object.
        """
        # Here we use MyPy ignore because to_dict() method returns a general
        # dictionary representation of domain object (CollectionDict) which
        # does not contain properties like created_on and last_updated but
        # MyPy expects collection_dict, a dictionary which contains all the
        # properties of domain object. That's why we are explicitly changing
        # the type of collection_dict here, which causes MyPy to throw an error.
        # Thus, to silence the error, we added an ignore here.
        collection_dict: SerializableCollectionDict = self.to_dict() # type: ignore[assignment]
        # The only reason we add the version parameter separately is that our
        # yaml encoding/decoding of this object does not handle the version
        # parameter.
        # NOTE: If this changes in the future (i.e the version parameter is
        # added as part of the yaml representation of this object), all YAML
        # files must add a version parameter to their files with the correct
        # version of this object. The line below must then be moved to
        # to_dict().
        collection_dict['version'] = self.version

        if self.created_on:
            collection_dict['created_on'] = (
                utils.convert_naive_datetime_to_string(self.created_on))

        if self.last_updated:
            collection_dict['last_updated'] = (
                utils.convert_naive_datetime_to_string(self.last_updated))

        return json.dumps(collection_dict)

    def to_yaml(self) -> str:
        """Convert the Collection domain object into YAML.

        Returns:
            str. The YAML representation of this Collection.
        """
        collection_dict = self.to_dict()

        # The ID is the only property which should not be stored within the
        # YAML representation.
        # Here we use MyPy ignore because MyPy doesn't allow key deletion
        # from TypedDict. Also, we cannot use dict comprehension here to
        # remove the 'id' key from collection_dict because TypeDicts are
        # not compatible with dict comprehensions.
        # Reference:
        # https://mypy-play.net/?mypy=latest&python=3.10&flags=strict%2Cdisallow-any-expr&gist=3b3315d29c3269b172f29d39052591d7
        del collection_dict['id'] # type: ignore[misc]

        return utils.yaml_from_dict(collection_dict)

    @classmethod
    def _convert_v1_dict_to_v2_dict(
        cls, collection_dict: CollectionDict
    ) -> CollectionDict:
        """Converts a v1 collection dict into a v2 collection dict.

        Adds a language code, and tags.

        Args:
            collection_dict: dict. The dict representation of a collection with
                schema version v1.

        Returns:
            dict. The dict representation of the Collection domain object,
            following schema version v2.
        """
        collection_dict['schema_version'] = 2
        collection_dict['language_code'] = constants.DEFAULT_LANGUAGE_CODE
        collection_dict['tags'] = []
        return collection_dict

    @classmethod
    def _convert_v2_dict_to_v3_dict(
        cls, collection_dict: CollectionDict
    ) -> CollectionDict:
        """Converts a v2 collection dict into a v3 collection dict.

        This function does nothing as the collection structure is changed in
        collection_services.get_collection_from_model.

        Args:
            collection_dict: dict. The dict representation of a collection with
                schema version v2.

        Returns:
            dict. The dict representation of the Collection domain object,
            following schema version v3.
        """
        collection_dict['schema_version'] = 3
        return collection_dict

    @classmethod
    def _convert_v3_dict_to_v4_dict(
        cls, collection_dict: CollectionDict
    ) -> CollectionDict:
        """Converts a v3 collection dict into a v4 collection dict.

        This migrates the structure of skills, see the docstring in
        _convert_collection_contents_v3_dict_to_v4_dict.
        """
        new_collection_dict = (
            cls._convert_collection_contents_v3_dict_to_v4_dict(
                collection_dict))
        # Here we use MyPy ignore because CollectionDict is defined to match
        # the current version of Collection domain object and here in _convert_*
        # functions, we can ignore some MyPy errors as we work with the previous
        # versions of the domain objects.
        collection_dict['skills'] = new_collection_dict['skills'] # type: ignore[misc]
        # Here we use MyPy ignore because 'next_skill_id' key is
        # deprecated from the latest domain object and while accessing
        # this key MyPy throws an error.
        collection_dict['next_skill_id'] = ( # type: ignore[misc]
            # Here we use MyPy ignore because 'next_skill_id' key is
            # deprecated from the latest domain object and while accessing
            # this key MyPy throws an error.
            new_collection_dict['next_skill_id']) # type: ignore[misc]

        collection_dict['schema_version'] = 4
        return collection_dict

    @classmethod
    def _convert_v4_dict_to_v5_dict(
        cls, collection_dict: CollectionDict
    ) -> CollectionDict:
        """Converts a v4 collection dict into a v5 collection dict.

        This changes the field name of next_skill_id to next_skill_index.
        """
        cls._convert_collection_contents_v4_dict_to_v5_dict(
            collection_dict)

        collection_dict['schema_version'] = 5
        return collection_dict

    @classmethod
    def _convert_v5_dict_to_v6_dict(
        cls, collection_dict: CollectionDict
    ) -> CollectionDict:
        """Converts a v5 collection dict into a v6 collection dict.

        This changes the structure of each node to not include skills as well
        as remove skills from the Collection model itself.
        """

        # Here we use MyPy ignore because MyPy doesn't allow key deletion
        # from TypedDict.
        del collection_dict['skills'] # type: ignore[misc]
        # Here we use MyPy ignore because MyPy doesn't allow key deletion
        # from TypedDict.
        del collection_dict['next_skill_index'] # type: ignore[misc]

        collection_dict['schema_version'] = 6
        return collection_dict

    @classmethod
    def _migrate_to_latest_yaml_version(
        cls, yaml_content: str
    ) -> CollectionDict:
        """Return the YAML content of the collection in the latest schema
        format.

        Args:
            yaml_content: str. The YAML representation of the collection.

        Returns:
            Dict. The dictionary representation of the collection in which
            the latest YAML representation of the collection and latest
            schema format is used.

        Raises:
            InvalidInputException. The 'yaml_content' or the schema version
                is not specified.
            Exception. The collection schema version is not valid.
        """
        try:
            # Here we use cast because here we are narrowing down the type from
            # Dict[str, Any] to CollectionDict.
            collection_dict = cast(
                CollectionDict, utils.dict_from_yaml(yaml_content)
            )
        except utils.InvalidInputException as e:
            raise utils.InvalidInputException(
                'Please ensure that you are uploading a YAML text file, not '
                'a zip file. The YAML parser returned the following error: %s'
                % e)

        collection_schema_version = collection_dict.get('schema_version')
        if collection_schema_version is None:
            raise utils.InvalidInputException(
                'Invalid YAML file: no schema version specified.')
        if not (1 <= collection_schema_version
                <= feconf.CURRENT_COLLECTION_SCHEMA_VERSION):
            raise Exception(
                'Sorry, we can only process v1 to v%s collection YAML files at '
                'present.' % feconf.CURRENT_COLLECTION_SCHEMA_VERSION)

        while (collection_schema_version <
               feconf.CURRENT_COLLECTION_SCHEMA_VERSION):
            conversion_fn = getattr(
                cls, '_convert_v%s_dict_to_v%s_dict' % (
                    collection_schema_version, collection_schema_version + 1))
            collection_dict = conversion_fn(collection_dict)
            collection_schema_version += 1

        return collection_dict

    @classmethod
    def from_yaml(
        cls, collection_id: str, yaml_content: str
    ) -> Collection:
        """Converts a YAML string to a Collection domain object.

        Args:
            collection_id: str. The id of the collection.
            yaml_content: str. The YAML representation of the collection.

        Returns:
            Collection. The corresponding collection domain object.
        """
        collection_dict = cls._migrate_to_latest_yaml_version(yaml_content)

        collection_dict['id'] = collection_id
        return Collection.from_dict(collection_dict)

    @classmethod
    def _convert_collection_contents_v1_dict_to_v2_dict(
        cls, collection_contents: CollectionDict
    ) -> CollectionDict:
        """Converts from version 1 to 2. Does nothing since this migration only
        changes the language code.

        Args:
            collection_contents: dict. A dict representing the collection
                contents object to convert.

        Returns:
            dict. The updated collection_contents dict.
        """
        return collection_contents

    @classmethod
    def _convert_collection_contents_v2_dict_to_v3_dict(
        cls, collection_contents: CollectionDict
    ) -> CollectionDict:
        """Converts from version 2 to 3. Does nothing since the changes are
        handled while loading the collection.

        Args:
            collection_contents: dict. A dict representing the collection
                contents object to convert.

        Returns:
            dict. The updated collection_contents dict.
        """
        return collection_contents

    @classmethod
    def _convert_collection_contents_v3_dict_to_v4_dict(
        cls, collection_contents: CollectionDict
    ) -> CollectionDict:
        """Converts from version 3 to 4.

        Adds a skills dict and skill id counter. Migrates prerequisite_skills
        and acquired_skills to prerequistite_skill_ids and acquired_skill_ids.
        Then, gets skills in prerequisite_skill_ids and acquired_skill_ids in
        nodes, and assigns them IDs.

        Args:
            collection_contents: dict. A dict representing the collection
                contents object to convert.

        Returns:
            dict. The updated collection_contents dict.
        """

        skill_names = set()
        for node in collection_contents['nodes']:
            # Here we use MyPy ignore because CollectionNodeDict is defined
            # to match the current version of CollectionNode domain object
            # and here in _convert_* functions, we can ignore some MyPy errors
            # as we work with the previous versions of the domain objects.
            skill_names.update(node['acquired_skills']) # type: ignore[misc]
            # Here we use MyPy ignore because 'prerequisite_skills' key is
            # deprecated from the latest domain object and while accessing
            # this key MyPy throw an error.
            skill_names.update(node['prerequisite_skills']) # type: ignore[misc]
        skill_names_to_ids = {
            name: '%s%s' % (_SKILL_ID_PREFIX, str(index))
            for index, name in enumerate(sorted(skill_names))
        }
        # Here we use MyPy ignore because collection_contents['nodes']
        # can accept list of CollectionNodeDicts, but here we are providing
        # a list of older version dict of CollectionNode domain object instead
        # of CollectionNodeDict, which causes MyPy to throw an error. Thus to
        # avoid the error, we used ignore here.
        collection_contents['nodes'] = [{ # type: ignore[typeddict-item]
            'exploration_id': node['exploration_id'],
            'prerequisite_skill_ids': [
                skill_names_to_ids[prerequisite_skill_name]
                for prerequisite_skill_name in node['prerequisite_skills']],
            'acquired_skill_ids': [
                skill_names_to_ids[acquired_skill_name]
                for acquired_skill_name in node['acquired_skills']]
        } for node in collection_contents['nodes']]

        # Here we use MyPy ignore because CollectionDict is defined to match
        # the current version of Collection domain object and here in _convert_*
        # functions, we can ignore some MyPy errors as we work with the previous
        # versions of the domain objects.
        collection_contents['skills'] = { # type: ignore[misc]
            skill_id: {
                'name': skill_name,
                'question_ids': []
            }
            for skill_name, skill_id in skill_names_to_ids.items()
        }

        # Here we use MyPy ignore because 'next_skill_id' key is
        # deprecated from the latest domain object and while accessing
        # this key MyPy throw an error.
        collection_contents['next_skill_id'] = len(skill_names) # type: ignore[misc]

        return collection_contents

    @classmethod
    def _convert_collection_contents_v4_dict_to_v5_dict(
        cls, collection_contents: CollectionDict
    ) -> CollectionDict:
        """Converts from version 4 to 5.

        Converts next_skill_id to next_skill_index, since next_skill_id isn't
        actually a skill ID.

        Args:
            collection_contents: dict. A dict representing the collection
                contents object to convert.

        Returns:
            dict. The updated collection_contents dict.
        """
        # Here we use MyPy ignore because 'next_skill_index' key is
        # deprecated from the latest domain object and while accessing
        # this key MyPy throw an error.
        collection_contents['next_skill_index'] = collection_contents[ # type: ignore[misc]
            # Here we use MyPy ignore because 'next_skill_id' key is
            # deprecated from the latest domain object and while accessing
            # this key MyPy throw an error.
            'next_skill_id'] # type: ignore[misc]

        # Here we use MyPy ignore because MyPy doesn't allow key deletion
        # from TypedDict.
        del collection_contents['next_skill_id'] # type: ignore[misc]

        return collection_contents

    @classmethod
    def _convert_collection_contents_v5_dict_to_v6_dict(
        cls, collection_contents: CollectionDict
    ) -> CollectionDict:
        """Converts from version 5 to 6.

        Removes skills from collection node.

        Args:
            collection_contents: dict. A dict representing the collection
                contents object to convert.

        Returns:
            dict. The updated collection_contents dict.
        """
        for node in collection_contents['nodes']:
            # Here we use MyPy ignore because MyPy doesn't allow key deletion
            # from TypedDict.
            del node['prerequisite_skill_ids'] # type: ignore[misc]
            # Here we use MyPy ignore because MyPy doesn't allow key deletion
            # from TypedDict.
            del node['acquired_skill_ids'] # type: ignore[misc]

        return collection_contents

    @classmethod
    def update_collection_contents_from_model(
        cls,
        versioned_collection_contents: VersionedCollectionDict,
        current_version: int,
    ) -> None:
        """Converts the states blob contained in the given
        versioned_collection_contents dict from current_version to
        current_version + 1. Note that the versioned_collection_contents being
        passed in is modified in-place.

        Args:
            versioned_collection_contents: dict. A dict with two keys:
                - schema_version: int. The schema version for the collection.
                - collection_contents: dict. The dict comprising the collection
                    contents.
            current_version: int. The current collection schema version.

        Raises:
            Exception. The value of the key 'schema_version' in
                versioned_collection_contents is not valid.
        """
        if (versioned_collection_contents['schema_version'] + 1 >
                feconf.CURRENT_COLLECTION_SCHEMA_VERSION):
            raise Exception(
                'Collection is version %d but current collection'
                ' schema version is %d' % (
                    versioned_collection_contents['schema_version'],
                    feconf.CURRENT_COLLECTION_SCHEMA_VERSION))

        versioned_collection_contents['schema_version'] = (
            current_version + 1)

        conversion_fn = getattr(
            cls, '_convert_collection_contents_v%s_dict_to_v%s_dict' % (
                current_version, current_version + 1))
        versioned_collection_contents['collection_contents'] = conversion_fn(
            versioned_collection_contents['collection_contents'])

    @property
    def exploration_ids(self) -> List[str]:
        """Returns a list of all the exploration IDs that are part of this
        collection.

        Returns:
            list(str). List of exploration IDs.
        """
        return [node.exploration_id for node in self.nodes]

    @property
    def first_exploration_id(self) -> Optional[str]:
        """Returns the first element in the node list of the collection, which
           corresponds to the first node that the user would encounter, or if
           the collection is empty, returns None.

        Returns:
            str|None. The exploration ID of the first node, or None if the
            collection is empty.
        """
        if len(self.nodes) > 0:
            return self.nodes[0].exploration_id
        else:
            return None

    def get_next_exploration_id(
        self, completed_exp_ids: List[str]
    ) -> Optional[str]:
        """Returns the first exploration id in the collection that has not yet
           been completed by the learner, or if the collection is completed,
           returns None.

        Args:
            completed_exp_ids: list(str). List of completed exploration
                ids.

        Returns:
            str|None. The exploration ID of the next node,
            or None if the collection is completed.
        """
        for exp_id in self.exploration_ids:
            if exp_id not in completed_exp_ids:
                return exp_id
        return None

    def get_next_exploration_id_in_sequence(
        self, current_exploration_id: str
    ) -> Optional[str]:
        """Returns the exploration ID of the node just after the node
           corresponding to the current exploration id. If the user is on the
           last node, None is returned.

        Args:
            current_exploration_id: str. The id of exploration currently
                completed.

        Returns:
            str|None. The exploration ID of the next node,
            or None if the passed id is the last one in the collection.
        """
        exploration_just_unlocked = None

        for index in range(len(self.nodes) - 1):
            if self.nodes[index].exploration_id == current_exploration_id:
                exploration_just_unlocked = self.nodes[index + 1].exploration_id
                break

        return exploration_just_unlocked

    @classmethod
    def is_demo_collection_id(cls, collection_id: str) -> bool:
        """Whether the collection id is that of a demo collection.

        Args:
            collection_id: str. The id of the collection.

        Returns:
            bool. True if the collection is a demo else False.
        """
        return collection_id in feconf.DEMO_COLLECTIONS

    @property
    def is_demo(self) -> bool:
        """Whether the collection is one of the demo collections.

        Returs:
            bool. True if the collection is a demo else False.
        """
        return self.is_demo_collection_id(self.id)

    def update_title(self, title: str) -> None:
        """Updates the title of the collection.

        Args:
            title: str. The new title of the collection.
        """
        self.title = title

    def update_category(self, category: str) -> None:
        """Updates the category of the collection.

        Args:
            category: str. The new category of the collection.
        """
        self.category = category

    def update_objective(self, objective: str) -> None:
        """Updates the objective of the collection.

        Args:
            objective: str. The new objective of the collection.
        """
        self.objective = objective

    def update_language_code(self, language_code: str) -> None:
        """Updates the language code of the collection.

        Args:
            language_code: str. The new language code of the collection.
        """
        self.language_code = language_code

    def update_tags(self, tags: List[str]) -> None:
        """Updates the tags of the collection.

        Args:
            tags: list(str). The new tags of the collection.
        """
        self.tags = tags

    def _find_node(self, exploration_id: str) -> Optional[int]:
        """Returns the index of the collection node with the given exploration
        id, or None if the exploration id is not in the nodes list.

        Args:
            exploration_id: str. The id of the exploration.

        Returns:
            int or None. The index of the corresponding node, or None if there
            is no such node.
        """
        for ind, node in enumerate(self.nodes):
            if node.exploration_id == exploration_id:
                return ind
        return None

    def get_node(self, exploration_id: str) -> Optional[CollectionNode]:
        """Retrieves a collection node from the collection based on an
        exploration ID.

        Args:
            exploration_id: str. The id of the exploration.

        Returns:
            CollectionNode or None. If the list of nodes contains the given
            exploration then it will return the corresponding node, else None.
        """
        for node in self.nodes:
            if node.exploration_id == exploration_id:
                return node
        return None

    def add_node(self, exploration_id: str) -> None:
        """Adds a new node to the collection; the new node represents the given
        exploration_id.

        Args:
            exploration_id: str. The id of the exploration.

        Raises:
            ValueError. The exploration is already part of the colletion.
        """
        if self.get_node(exploration_id) is not None:
            raise ValueError(
                'Exploration is already part of this collection: %s' %
                exploration_id)
        self.nodes.append(CollectionNode.create_default_node(exploration_id))

    def swap_nodes(
        self, first_index: int, second_index: int
    ) -> None:
        """Swaps the values of 2 nodes in the collection.

        Args:
            first_index: int. Index of one of the nodes to be swapped.
            second_index: int. Index of the other node to be swapped.

        Raises:
            ValueError. Both indices are the same number.
        """
        if first_index == second_index:
            raise ValueError(
                'Both indices point to the same collection node.'
            )
        temp = self.nodes[first_index]
        self.nodes[first_index] = self.nodes[second_index]
        self.nodes[second_index] = temp

    def delete_node(self, exploration_id: str) -> None:
        """Deletes the node corresponding to the given exploration from the
        collection.

        Args:
            exploration_id: str. The id of the exploration.

        Raises:
            ValueError. The exploration is not part of the collection.
        """
        node_index = self._find_node(exploration_id)
        if node_index is None:
            raise ValueError(
                'Exploration is not part of this collection: %s' %
                exploration_id)
        del self.nodes[node_index]

    def validate(self, strict: bool = True) -> None:
        """Validates all properties of this collection and its constituents.

        Raises:
            ValidationError. One or more attributes of the Collection are not
                valid.
        """

        # NOTE TO DEVELOPERS: Please ensure that this validation logic is the
        # same as that in the frontend CollectionValidatorService.

        if not isinstance(self.title, str):
            raise utils.ValidationError(
                'Expected title to be a string, received %s' % self.title)
        utils.require_valid_name(
            self.title, 'the collection title', allow_empty=True)

        if not isinstance(self.category, str):
            raise utils.ValidationError(
                'Expected category to be a string, received %s'
                % self.category)
        utils.require_valid_name(
            self.category, 'the collection category', allow_empty=True)

        if not isinstance(self.objective, str):
            raise utils.ValidationError(
                'Expected objective to be a string, received %s' %
                self.objective)

        if not isinstance(self.language_code, str):
            raise utils.ValidationError(
                'Expected language code to be a string, received %s' %
                self.language_code)

        if not self.language_code:
            raise utils.ValidationError(
                'A language must be specified (in the \'Settings\' tab).')

        if not utils.is_valid_language_code(self.language_code):
            raise utils.ValidationError(
                'Invalid language code: %s' % self.language_code)

        if not isinstance(self.tags, list):
            raise utils.ValidationError(
                'Expected tags to be a list, received %s' % self.tags)

        if len(set(self.tags)) < len(self.tags):
            raise utils.ValidationError(
                'Expected tags to be unique, but found duplicates')

        for tag in self.tags:
            if not isinstance(tag, str):
                raise utils.ValidationError(
                    'Expected each tag to be a string, received \'%s\'' % tag)

            if not tag:
                raise utils.ValidationError('Tags should be non-empty.')

            if not re.match(constants.TAG_REGEX, tag):
                raise utils.ValidationError(
                    'Tags should only contain lowercase letters and spaces, '
                    'received \'%s\'' % tag)

            if (tag[0] not in string.ascii_lowercase or
                    tag[-1] not in string.ascii_lowercase):
                raise utils.ValidationError(
                    'Tags should not start or end with whitespace, received '
                    ' \'%s\'' % tag)

            if re.search(r'\s\s+', tag):
                raise utils.ValidationError(
                    'Adjacent whitespace in tags should be collapsed, '
                    'received \'%s\'' % tag)

        if not isinstance(self.schema_version, int):
            raise utils.ValidationError(
                'Expected schema version to be an integer, received %s' %
                self.schema_version)

        if self.schema_version != feconf.CURRENT_COLLECTION_SCHEMA_VERSION:
            raise utils.ValidationError(
                'Expected schema version to be %s, received %s' % (
                    feconf.CURRENT_COLLECTION_SCHEMA_VERSION,
                    self.schema_version))

        if not isinstance(self.nodes, list):
            raise utils.ValidationError(
                'Expected nodes to be a list, received %s' % self.nodes)

        all_exp_ids = self.exploration_ids
        if len(set(all_exp_ids)) != len(all_exp_ids):
            raise utils.ValidationError(
                'There are explorations referenced in the collection more '
                'than once.')

        # Validate all collection nodes.
        for node in self.nodes:
            node.validate()

        if strict:
            if not self.title:
                raise utils.ValidationError(
                    'A title must be specified for the collection.')

            if not self.objective:
                raise utils.ValidationError(
                    'An objective must be specified for the collection.')

            if not self.category:
                raise utils.ValidationError(
                    'A category must be specified for the collection.')

            if not self.nodes:
                raise utils.ValidationError(
                    'Expected to have at least 1 exploration in the '
                    'collection.')


class CollectionSummaryDict(TypedDict):
    """Dictionary representing the CollectionSummary object."""

    id: str
    title: str
    category: str
    objective: str
    language_code: str
    tags: List[str]
    status: str
    community_owned: bool
    owner_ids: List[str]
    editor_ids: List[str]
    viewer_ids: List[str]
    contributor_ids: List[str]
    contributors_summary: Dict[str, int]
    version: int
    collection_model_created_on: datetime.datetime
    collection_model_last_updated: datetime.datetime


class CollectionSummary:
    """Domain object for an Oppia collection summary."""

    def __init__(
        self,
        collection_id: str,
        title: str,
        category: str,
        objective: str,
        language_code: str,
        tags: List[str],
        status: str,
        community_owned: bool,
        owner_ids: List[str],
        editor_ids: List[str],
        viewer_ids: List[str],
        contributor_ids: List[str],
        contributors_summary: Dict[str, int],
        version: int,
        node_count: int,
        collection_model_created_on: datetime.datetime,
        collection_model_last_updated: datetime.datetime
    ) -> None:
        """Constructs a CollectionSummary domain object.

        Args:
            collection_id: str. The unique id of the collection.
            title: str. The title of the collection.
            category: str. The category of the collection.
            objective: str. The objective of the collection.
            language_code: str. The language code of the collection.
            tags: list(str). The tags given to the collection.
            status: str. The status of the collection.
            community_owned: bool. Whether the collection is community-owned.
            owner_ids: list(str). List of the user ids who are the owner of
                this collection.
            editor_ids: list(str). List of the user ids of the users who have
                access to edit this collection.
            viewer_ids: list(str). List of the user ids of the users who have
                view this collection.
            contributor_ids: list(str). List of the user ids of the user who
                have contributed to  this collection.
            contributors_summary: dict. The summary given by the contributors
                to the collection, user id as the key and summary as value.
            version: int. The version of the collection.
            node_count: int. The number of nodes present in the collection.
            collection_model_created_on: datetime.datetime. Date and time when
                the collection model is created.
            collection_model_last_updated: datetime.datetime. Date and time
                when the collection model was last updated.
        """
        self.id = collection_id
        self.title = title
        self.category = category
        self.objective = objective
        self.language_code = language_code
        self.tags = tags
        self.status = status
        self.community_owned = community_owned
        self.owner_ids = owner_ids
        self.editor_ids = editor_ids
        self.viewer_ids = viewer_ids
        self.contributor_ids = contributor_ids
        self.contributors_summary = contributors_summary
        self.version = version
        self.node_count = node_count
        self.collection_model_created_on = collection_model_created_on
        self.collection_model_last_updated = collection_model_last_updated

    def to_dict(self) -> CollectionSummaryDict:
        """Returns a dict representing this CollectionSummary domain object.

        Returns:
            dict. A dict, mapping all fields of CollectionSummary instance.
        """
        return {
            'id': self.id,
            'title': self.title,
            'category': self.category,
            'objective': self.objective,
            'language_code': self.language_code,
            'tags': self.tags,
            'status': self.status,
            'community_owned': self.community_owned,
            'owner_ids': self.owner_ids,
            'editor_ids': self.editor_ids,
            'viewer_ids': self.viewer_ids,
            'contributor_ids': self.contributor_ids,
            'contributors_summary': self.contributors_summary,
            'version': self.version,
            'collection_model_created_on': self.collection_model_created_on,
            'collection_model_last_updated': self.collection_model_last_updated
        }

    def validate(self) -> None:
        """Validates various properties of the CollectionSummary.

        Raises:
            ValidationError. One or more attributes of the CollectionSummary
                are invalid.
        """
        utils.require_valid_name(
            self.title, 'the collection title', allow_empty=True)

        utils.require_valid_name(
            self.category, 'the collection category', allow_empty=True)

        if not utils.is_valid_language_code(self.language_code):
            raise utils.ValidationError(
                'Invalid language code: %s' % self.language_code)

        for tag in self.tags:

            if not tag:
                raise utils.ValidationError('Tags should be non-empty.')

            if not re.match(constants.TAG_REGEX, tag):
                raise utils.ValidationError(
                    'Tags should only contain lowercase letters and spaces, '
                    'received \'%s\'' % tag)

            if (tag[0] not in string.ascii_lowercase or
                    tag[-1] not in string.ascii_lowercase):
                raise utils.ValidationError(
                    'Tags should not start or end with whitespace, received '
                    '\'%s\'' % tag)

            if re.search(r'\s\s+', tag):
                raise utils.ValidationError(
                    'Adjacent whitespace in tags should be collapsed, '
                    'received \'%s\'' % tag)

        if len(set(self.tags)) < len(self.tags):
            raise utils.ValidationError(
                'Expected tags to be unique, but found duplicates')

    def is_editable_by(self, user_id: str) -> bool:
        """Checks if a given user may edit the collection.

        Args:
            user_id: str. User id of the user.

        Returns:
            bool. Whether the given user may edit the collection.
        """
        return (
            user_id in self.editor_ids
            or user_id in self.owner_ids
            or self.community_owned
        )

    def is_private(self) -> bool:
        """Checks whether the collection is private.

        Returns:
            bool. Whether the collection is private.
        """
        # Here mypy evaluates constants.ACTIVITY_STATUS_PRIVATE to be Any
        # and due to this, the == is returning Any. So, in order to
        # return bool, we explicitly convert the operation to bool.
        return bool(self.status == constants.ACTIVITY_STATUS_PRIVATE)

    def is_solely_owned_by_user(self, user_id: str) -> bool:
        """Checks whether the collection is solely owned by the user.

        Args:
            user_id: str. The id of the user.

        Returns:
            bool. Whether the collection is solely owned by the user.
        """
        return user_id in self.owner_ids and len(self.owner_ids) == 1

    def does_user_have_any_role(self, user_id: str) -> bool:
        """Checks if a given user has any role within the collection.

        Args:
            user_id: str. User id of the user.

        Returns:
            bool. Whether the given user has any role in the collection.
        """
        return (
            user_id in self.owner_ids or
            user_id in self.editor_ids or
            user_id in self.viewer_ids
        )

    def add_contribution_by_user(self, contributor_id: str) -> None:
        """Add a new contributor to the contributors summary.

        Args:
            contributor_id: str. ID of the contributor to be added.
        """
        # We don't want to record the contributions of system users.
        if contributor_id not in constants.SYSTEM_USER_IDS:
            self.contributors_summary[contributor_id] = (
                self.contributors_summary.get(contributor_id, 0) + 1)

        self.contributor_ids = list(self.contributors_summary.keys())
