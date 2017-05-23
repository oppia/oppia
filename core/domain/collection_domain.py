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

import copy
import re
import string

import feconf
import utils


# Do not modify the values of these constants. This is to preserve backwards
# compatibility with previous change dicts.
COLLECTION_PROPERTY_TITLE = 'title'
COLLECTION_PROPERTY_CATEGORY = 'category'
COLLECTION_PROPERTY_OBJECTIVE = 'objective'
COLLECTION_PROPERTY_LANGUAGE_CODE = 'language_code'
COLLECTION_PROPERTY_TAGS = 'tags'
COLLECTION_NODE_PROPERTY_PREREQUISITE_SKILLS = 'prerequisite_skills'
COLLECTION_NODE_PROPERTY_ACQUIRED_SKILLS = 'acquired_skills'

# This takes an additional 'exploration_id' parameter.
CMD_ADD_COLLECTION_NODE = 'add_collection_node'
# This takes an additional 'exploration_id' parameter.
CMD_DELETE_COLLECTION_NODE = 'delete_collection_node'
# This takes additional 'property_name' and 'new_value' parameters and,
# optionally, 'old_value'.
CMD_EDIT_COLLECTION_PROPERTY = 'edit_collection_property'
# This takes additional 'property_name' and 'new_value' parameters and,
# optionally, 'old_value'.
CMD_EDIT_COLLECTION_NODE_PROPERTY = 'edit_collection_node_property'
# This takes additional 'from_version' and 'to_version' parameters for logging.
CMD_MIGRATE_SCHEMA_TO_LATEST_VERSION = 'migrate_schema_to_latest_version'


class CollectionChange(object):
    """Domain object class for a change to a collection.

    IMPORTANT: Ensure that all changes to this class (and how these cmds are
    interpreted in general) preserve backward-compatibility with the
    collection snapshots in the datastore. Do not modify the definitions of
    cmd keys that already exist.
    """

    COLLECTION_NODE_PROPERTIES = (
        COLLECTION_NODE_PROPERTY_PREREQUISITE_SKILLS,
        COLLECTION_NODE_PROPERTY_ACQUIRED_SKILLS)

    COLLECTION_PROPERTIES = (
        COLLECTION_PROPERTY_TITLE, COLLECTION_PROPERTY_CATEGORY,
        COLLECTION_PROPERTY_OBJECTIVE, COLLECTION_PROPERTY_LANGUAGE_CODE,
        COLLECTION_PROPERTY_TAGS)

    def __init__(self, change_dict):
        """Initializes an CollectionChange object from a dict.

        Args:
            change_dict: dict. Represents a command. It should have a 'cmd'
                key, and one or more other keys. The keys depend on what the
                value for 'cmd' is. The possible values for 'cmd' are listed
                below, together with the other keys in the dict:
                    - 'add_collection_node' (with exploration_id)
                    - 'delete_collection_node' (with exploration_id)
                    - 'edit_collection_node_property' (with exploration_id,
                        property_name, new_value and, optionally, old_value)
                    - 'edit_collection_property' (with property_name, new_value
                        and, optionally, old_value)
                    - 'migrate_schema' (with from_version and to_version)
            For a collection node, property_name must be one of
            COLLECTION_NODE_PROPERTIES. For a collection, property_name must be
            one of COLLECTION_PROPERTIES.

        Raises:
            Exception: The given change_dict is not valid.
        """
        if 'cmd' not in change_dict:
            raise Exception('Invalid change_dict: %s' % change_dict)
        self.cmd = change_dict['cmd']

        if self.cmd == CMD_ADD_COLLECTION_NODE:
            self.exploration_id = change_dict['exploration_id']
        elif self.cmd == CMD_DELETE_COLLECTION_NODE:
            self.exploration_id = change_dict['exploration_id']
        elif self.cmd == CMD_EDIT_COLLECTION_NODE_PROPERTY:
            if (change_dict['property_name'] not in
                    self.COLLECTION_NODE_PROPERTIES):
                raise Exception('Invalid change_dict: %s' % change_dict)
            self.exploration_id = change_dict['exploration_id']
            self.property_name = change_dict['property_name']
            self.new_value = change_dict['new_value']
            self.old_value = change_dict.get('old_value')
        elif self.cmd == CMD_EDIT_COLLECTION_PROPERTY:
            if (change_dict['property_name'] not in
                    self.COLLECTION_PROPERTIES):
                raise Exception('Invalid change_dict: %s' % change_dict)
            self.property_name = change_dict['property_name']
            self.new_value = change_dict['new_value']
            self.old_value = change_dict.get('old_value')
        elif self.cmd == CMD_MIGRATE_SCHEMA_TO_LATEST_VERSION:
            self.from_version = change_dict['from_version']
            self.to_version = change_dict['to_version']
        else:
            raise Exception('Invalid change_dict: %s' % change_dict)


class CollectionCommitLogEntry(object):
    """Value object representing a commit to an collection."""

    def __init__(
            self, created_on, last_updated, user_id, username, collection_id,
            commit_type, commit_message, commit_cmds, version,
            post_commit_status, post_commit_community_owned,
            post_commit_is_private):
        """Initializes a CollectionCommitLogEntry domain object.

        Args:
            created_on: datetime.datetime. Date and time when the collection
                commits was created.
            last_updated: datetime.datetime. Date and time when the collection
                commits was last updated.
            user_id: str. User id of the user who has made the commit.
            username: str. Username of the user who has made the commit.
            collection_id: str. Id of the collection.
            commit_type: str. The type of commit.
            commit_message: str. A description of changes made to the
                collection.
            commit_cmds: list(dict). A list of change commands made to the
                given collection.
            version: int. The version of the collection.
            post_commit_status: str. The new collection status after the
                commit.
            post_commit_community_owned: bool. Whether the collection is
                community-owned after the edit event.
            post_commit_is_private: bool. Whether the collection is private
                after the edit event.
        """
        self.created_on = created_on
        self.last_updated = last_updated
        self.user_id = user_id
        self.username = username
        self.collection_id = collection_id
        self.commit_type = commit_type
        self.commit_message = commit_message
        self.commit_cmds = commit_cmds
        self.version = version
        self.post_commit_status = post_commit_status
        self.post_commit_community_owned = post_commit_community_owned
        self.post_commit_is_private = post_commit_is_private

    def to_dict(self):
        """Returns a dict representing this CollectionCommitLogEntry domain
            object. This omits created_on, user_id and (for now) commit_cmds.

        Returns:
            A dict, mapping all fields of CollectionCommitLogEntry instance,
            except created_on, user_id and (for now) commit_cmds field.
        """
        return {
            'last_updated': utils.get_time_in_millisecs(self.last_updated),
            'username': self.username,
            'collection_id': self.collection_id,
            'commit_type': self.commit_type,
            'commit_message': self.commit_message,
            'version': self.version,
            'post_commit_status': self.post_commit_status,
            'post_commit_community_owned': self.post_commit_community_owned,
            'post_commit_is_private': self.post_commit_is_private,
        }


class CollectionNode(object):
    """Domain object describing a node in the exploration graph of a
    collection. The node contains various information, including a reference to
    an exploration (its ID), prerequisite skills in order to be qualified to
    play the exploration, and acquired skills attained once the exploration is
    completed.
    """

    def __init__(self, exploration_id, prerequisite_skills, acquired_skills):
        """Initializes a CollectionNode domain object.

        Args:
            exploration_id: str. A valid ID of an exploration referenced by
                this node.
            prerequisite_skills: list(str). A list of prerequisite skills.
            acquired_skills: list(str). A list of acquired skills once the
                exploration is completed.
        """
        self.exploration_id = exploration_id
        self.prerequisite_skills = prerequisite_skills
        self.acquired_skills = acquired_skills

    def to_dict(self):
        """Returns a dict representing this CollectionNode domain object.

        Returns:
            A dict, mapping all fields (exploration_id, prerequisite_skills,
            acquired_skills) of CollectionNode instance.
        """
        return {
            'exploration_id': self.exploration_id,
            'prerequisite_skills': self.prerequisite_skills,
            'acquired_skills': self.acquired_skills
        }

    @classmethod
    def from_dict(cls, node_dict):
        """Return a CollectionNode domain object from a dict.

        Args:
            node_dict: dict. The dict representation of CollectionNode object.

        Returns:
            CollectionNode. The corresponding CollectionNode domain object.
        """
        return cls(
            copy.deepcopy(node_dict['exploration_id']),
            copy.deepcopy(node_dict['prerequisite_skills']),
            copy.deepcopy(node_dict['acquired_skills']))

    @property
    def skills(self):
        """Returns a set of skills.

        Returns:
            set(str). The union of the prerequisite and acquired skills. Each
            skill is represented at most once.
        """
        return set(self.prerequisite_skills) | set(self.acquired_skills)

    def update_prerequisite_skills(self, prerequisite_skills):
        """Update the prerequise skills.

        Args:
            prerequisite_skills: list(str). The new list of prerequisite
                skills to set.
        """
        self.prerequisite_skills = copy.deepcopy(prerequisite_skills)

    def update_acquired_skills(self, acquired_skills):
        """Update the acquired skills.

        Args:
            acquired_skills: list(str). The new list of acquired skills to set.
        """
        self.acquired_skills = copy.deepcopy(acquired_skills)

    def validate(self):
        """Validates various properties of the collection node.

        Raises:
            ValidationError: One or more attributes of the collection node are
            invalid.
        """
        if not isinstance(self.exploration_id, basestring):
            raise utils.ValidationError(
                'Expected exploration ID to be a string, received %s' %
                self.exploration_id)

        if not isinstance(self.prerequisite_skills, list):
            raise utils.ValidationError(
                'Expected prerequisite_skills to be a list, received %s' %
                self.prerequisite_skills)

        if len(set(self.prerequisite_skills)) != len(self.prerequisite_skills):
            raise utils.ValidationError(
                'The prerequisite_skills list has duplicate entries: %s' %
                self.prerequisite_skills)

        for prerequisite_skill in self.prerequisite_skills:
            if not isinstance(prerequisite_skill, basestring):
                raise utils.ValidationError(
                    'Expected all prerequisite skills to be strings, '
                    'received %s' % prerequisite_skill)

        if not isinstance(self.acquired_skills, list):
            raise utils.ValidationError(
                'Expected acquired_skills to be a list, received %s' %
                self.acquired_skills)

        if len(set(self.acquired_skills)) != len(self.acquired_skills):
            raise utils.ValidationError(
                'The acquired_skills list has duplicate entries: %s' %
                self.acquired_skills)

        for acquired_skill in self.acquired_skills:
            if not isinstance(acquired_skill, basestring):
                raise utils.ValidationError(
                    'Expected all acquired skills to be strings, received %s' %
                    acquired_skill)

        redundant_skills = (
            set(self.prerequisite_skills) & set(self.acquired_skills))
        if redundant_skills:
            raise utils.ValidationError(
                'There are some skills which are both required for '
                'exploration %s and acquired after playing it: %s' %
                (self.exploration_id, redundant_skills))

    @classmethod
    def create_default_node(cls, exploration_id):
        """Returns a CollectionNode domain object with default values.

        Args:
            exploration_id: str. The id of the exploration.

        Returns:
            CollectionNode. The CollectionNode domain object with default
            value. The prerequisite and acquired skills lists are empty.
        """
        return cls(exploration_id, [], [])


class Collection(object):
    """Domain object for an Oppia collection."""

    def __init__(self, collection_id, title, category, objective,
                 language_code, tags, schema_version, nodes, version,
                 created_on=None, last_updated=None):
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

    def to_dict(self):
        """Returns a dict representing this Collection domain object.

        Returns:
            A dict, mapping all fields of Collection instance.
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
            cls, collection_id, title=feconf.DEFAULT_COLLECTION_TITLE,
            category=feconf.DEFAULT_COLLECTION_CATEGORY,
            objective=feconf.DEFAULT_COLLECTION_OBJECTIVE,
            language_code=feconf.DEFAULT_LANGUAGE_CODE):
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
            cls, collection_dict, collection_version=0,
            collection_created_on=None, collection_last_updated=None):
        """Return a Collection domain object from a dict.

        Args:
            collection_dict: dict. The dictionary representation of  the
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
            collection_dict['schema_version'], [], collection_version,
            collection_created_on, collection_last_updated)

        for node_dict in collection_dict['nodes']:
            collection.nodes.append(
                CollectionNode.from_dict(node_dict))

        return collection

    def to_yaml(self):
        """Convert the Collection domain object into YAML.

        Returns:
            str. The YAML representation of this Collection.
        """
        collection_dict = self.to_dict()

        # The ID is the only property which should not be stored within the
        # YAML representation.
        del collection_dict['id']

        return utils.yaml_from_dict(collection_dict)

    @classmethod
    def _convert_v1_dict_to_v2_dict(cls, collection_dict):
        """Converts a v1 collection dict into a v2 collection dict.

        Args:
            collection_dict: dict. The dict representation of a collection with
                schema version v1.

        Returns:
            dict. The dict representation of the Collection domain object,
            following schema version v2.
        """
        collection_dict['schema_version'] = 2
        collection_dict['language_code'] = feconf.DEFAULT_LANGUAGE_CODE
        collection_dict['tags'] = []
        return collection_dict

    @classmethod
    def _convert_v2_dict_to_v3_dict(cls, collection_dict):
        """Converts a v2 collection dict into a v3 collection dict.

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
    def _migrate_to_latest_yaml_version(cls, yaml_content):
        """Return the YAML content of the collection in the latest schema
        format.

        Args:
            yaml_content: str. The YAML representation of the collection.

        Returns:
            str. The YAML representation of the collection, in the latest
                schema format.

        Raises:
            Exception: 'yaml_content' or the collection schema version is not
            valid.
        """
        try:
            collection_dict = utils.dict_from_yaml(yaml_content)
        except Exception as e:
            raise Exception(
                'Please ensure that you are uploading a YAML text file, not '
                'a zip file. The YAML parser returned the following error: %s'
                % e)

        collection_schema_version = collection_dict.get('schema_version')
        if collection_schema_version is None:
            raise Exception('Invalid YAML file: no schema version specified.')
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
    def from_yaml(cls, collection_id, yaml_content):
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
            cls, collection_contents):
        """Converts from version 1 to 2. Does nothing since this migration only
        changes the language code.

        Args:
            collection_contents: Collection. The Collection domain object to
                convert.

        Returns:
            Collection. The new Collection domain object.
        """
        return collection_contents

    @classmethod
    def _convert_collection_contents_v2_dict_to_v3_dict(
            cls, collection_contents):
        """Converts from version 2 to 3. Does nothing since the changes are
        handled while loading the collection.

        Args:
            collection_contents: Collection. The Collection domain object to
                convert.

        Returns:
            Collection. The new Collection domain object.
        """
        return collection_contents

    @classmethod
    def update_collection_contents_from_model(
            cls, versioned_collection_contents, current_version):
        """Converts the states blob contained in the given
        versioned_collection_contents dict from current_version to
        current_version + 1. Note that the versioned_collection_contents being
        passed in is modified in-place.

        Args:
            versioned_collection_contents: dict. A dict with two keys:
                - schema_version: str. The schema version for the collection.
                - collection_contents: dict. The dict comprising the collection
                    contents.
            current_version: int. The current collection schema version.

        Raises:
            Exception: The value of the key 'schema_version' in
            versioned_collection_contents is not valid.
        """
        if (versioned_collection_contents['schema_version'] + 1 >
                feconf.CURRENT_COLLECTION_SCHEMA_VERSION):
            raise Exception('Collection is version %d but current collection'
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
    def skills(self):
        """The skills of a collection are made up of all prerequisite and
        acquired skills of each exploration that is part of this collection.

        Returns:
            list(str). A sorted list of all the skills of the collection.
        """
        unique_skills = set()
        for node in self.nodes:
            unique_skills.update(node.skills)
        return sorted(unique_skills)

    @property
    def exploration_ids(self):
        """Returns a list of all the exploration IDs that are part of this
        collection.

        Returns:
            list(str). List of exploration IDs.
        """
        return [node.exploration_id for node in self.nodes]

    @property
    def init_exploration_ids(self):
        """Returns a list of exploration IDs that are starting points for this
        collection (ie, they require no prior skills to complete). The order
        of these IDs is given by the order each respective exploration was
        added to the collection.

        Returns:
            list(str). List of exploration IDs.
        """
        init_exp_ids = []
        for node in self.nodes:
            if not node.prerequisite_skills:
                init_exp_ids.append(node.exploration_id)
        return init_exp_ids

    def get_next_exploration_ids(self, completed_exploration_ids):
        """Returns a list of exploration IDs for which the prerequisite skills
        are satisfied. These are the next explorations to complete for a user.
        If the list returned is empty and the collection is valid, then all
        skills have been acquired and the collection is completed. If the input
        list is empty, then only explorations with no prerequisite skills are
        returned. The order of the exploration IDs is given by the order in
        which each exploration was added to the collection.

        Args:
            completed_exploration_ids: list(str). List of completed exploration
                ids.

        Returns:
            list(str). A list of exploration IDs for which the prerequisite
            skills are satisfied.
        """
        acquired_skills = set()
        for completed_exp_id in completed_exploration_ids:
            collection_node = self.get_node(completed_exp_id)
            if collection_node:
                acquired_skills.update(collection_node.acquired_skills)

        next_exp_ids = []
        for node in self.nodes:
            if node.exploration_id in completed_exploration_ids:
                continue
            prereq_skills = set(node.prerequisite_skills)
            if prereq_skills <= acquired_skills:
                next_exp_ids.append(node.exploration_id)
        return next_exp_ids

    def get_next_exploration_ids_in_sequence(self, current_exploration_id):
        """Returns a list of exploration IDs that a logged-out user should
        complete next based on the prerequisite skills they must have attained
        by the time they completed the current exploration.  This recursively
        compiles a list of 'learned skills' then, depending on the
        'learned skills' and the current exploration's acquired skills,
        returns either a list of exploration ids that have either just
        unlocked or the user is qualified to explore.  If neither of these
        lists can be generated a blank list is returned instead.

        Args:
            current_exploration_id: str. The id of exploration currently
                completed.

        Returns:
            list(str). List of exploration IDs that a logged-out user should
            complete next.
        """
        skills_learned_by_exp_id = {}

        def _recursively_find_learned_skills(node):
            """Given a node, returns the skills that the user must have
            acquired by the time they've completed it.

            Arg:
                node: CollectionNode. A node in the exploration graph of a
                    collection.

            Returns:
                list(str). A list of acquired skills by user.
            """
            if node.exploration_id in skills_learned_by_exp_id:
                return skills_learned_by_exp_id[node.exploration_id]

            skills_learned = set(node.acquired_skills)
            for other_node in self.nodes:
                if other_node.exploration_id not in skills_learned_by_exp_id:
                    for skill in node.prerequisite_skills:
                        if skill in other_node.acquired_skills:
                            skills_learned = skills_learned.union(
                                _recursively_find_learned_skills(other_node))

            skills_learned_by_exp_id[node.exploration_id] = skills_learned
            return skills_learned

        explorations_just_unlocked = []
        explorations_qualified_for = []

        collection_node = self.get_node(current_exploration_id)
        collected_skills = _recursively_find_learned_skills(collection_node)

        for node in self.nodes:
            if node.exploration_id in skills_learned_by_exp_id:
                continue

            if set(node.prerequisite_skills).issubset(set(collected_skills)):
                if (any([
                        skill in collection_node.acquired_skills
                        for skill in node.prerequisite_skills])):
                    explorations_just_unlocked.append(node.exploration_id)
                else:
                    explorations_qualified_for.append(node.exploration_id)

        if explorations_just_unlocked:
            return explorations_just_unlocked
        elif explorations_qualified_for:
            return explorations_qualified_for
        else:
            return []

    @classmethod
    def is_demo_collection_id(cls, collection_id):
        """Whether the collection id is that of a demo collection.

        Args:
            collection_id: str. The id of the collection.

        Returs:
            bool. True if the collection is a demo else False.
        """
        return collection_id in feconf.DEMO_COLLECTIONS

    @property
    def is_demo(self):
        """Whether the collection is one of the demo collections.

        Returs:
            bool. True if the collection is a demo else False.
        """
        return self.is_demo_collection_id(self.id)

    def update_title(self, title):
        """Updates the title of the collection.

        Args:
            title: str. The new title of the collection.
        """
        self.title = title

    def update_category(self, category):
        """Updates the category of the collection.

        Args:
            category: str. The new category of the collection.
        """
        self.category = category

    def update_objective(self, objective):
        """Updates the objective of the collection.

        Args:
            objective: str. The new objective of the collection.
        """
        self.objective = objective

    def update_language_code(self, language_code):
        """Updates the language code of the collection.

        Args:
            language_code: str. The new language code of the collection.
        """
        self.language_code = language_code

    def update_tags(self, tags):
        """Updates the tags of the collection.

        Args:
            tags: list(str). The new tags of the collection.
        """
        self.tags = tags

    def _find_node(self, exploration_id):
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

    def get_node(self, exploration_id):
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

    def add_node(self, exploration_id):
        """Adds a new node to the collection; the new node represents the given
        exploration_id.

        Args:
            exploration_id: str. The id of the exploration.

        Raises:
            ValueError: The exploration is alredy part of the colletion.
        """
        if self.get_node(exploration_id) is not None:
            raise ValueError(
                'Exploration is already part of this collection: %s' %
                exploration_id)
        self.nodes.append(CollectionNode.create_default_node(exploration_id))

    def delete_node(self, exploration_id):
        """Deletes the node corresponding to the given exploration from the
        collection.

        Args:
            exploration_id: str. The id of the exploration.

        Raises:
            ValueError: The exploration is not part of the collection.
        """
        node_index = self._find_node(exploration_id)
        if node_index is None:
            raise ValueError(
                'Exploration is not part of this collection: %s' %
                exploration_id)
        del self.nodes[node_index]

    def validate(self, strict=True):
        """Validates all properties of this collection and its constituents.

        Raises:
            ValidationError: One or more attributes of the Collection are not
            valid.
        """

        # NOTE TO DEVELOPERS: Please ensure that this validation logic is the
        # same as that in the frontend CollectionValidatorService.

        if not isinstance(self.title, basestring):
            raise utils.ValidationError(
                'Expected title to be a string, received %s' % self.title)
        utils.require_valid_name(
            self.title, 'the collection title', allow_empty=True)

        if not isinstance(self.category, basestring):
            raise utils.ValidationError(
                'Expected category to be a string, received %s'
                % self.category)
        utils.require_valid_name(
            self.category, 'the collection category', allow_empty=True)

        if not isinstance(self.objective, basestring):
            raise utils.ValidationError(
                'Expected objective to be a string, received %s' %
                self.objective)

        if not isinstance(self.language_code, basestring):
            raise utils.ValidationError(
                'Expected language code to be a string, received %s' %
                self.language_code)

        if not self.language_code:
            raise utils.ValidationError(
                'A language must be specified (in the \'Settings\' tab).')

        if not any([self.language_code == lc['code']
                    for lc in feconf.ALL_LANGUAGE_CODES]):
            raise utils.ValidationError(
                'Invalid language code: %s' % self.language_code)

        if not isinstance(self.tags, list):
            raise utils.ValidationError(
                'Expected tags to be a list, received %s' % self.tags)

        if len(set(self.tags)) < len(self.tags):
            raise utils.ValidationError(
                'Expected tags to be unique, but found duplicates')

        for tag in self.tags:
            if not isinstance(tag, basestring):
                raise utils.ValidationError(
                    'Expected each tag to be a string, received \'%s\'' % tag)

            if not tag:
                raise utils.ValidationError('Tags should be non-empty.')

            if not re.match(feconf.TAG_REGEX, tag):
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

            # Ensure the collection may be started.
            if not self.init_exploration_ids:
                raise utils.ValidationError(
                    'Expected to have at least 1 exploration with no '
                    'prerequisite skills.')

            # Ensure the collection can be completed. This is done in two
            # steps: first, no exploration may grant a skill that it
            # simultaneously lists as a prerequisite. Second, every exploration
            # in the collection must be reachable when starting from the
            # explorations with no prerequisite skills and playing through all
            # subsequent explorations provided by get_next_exploration_ids.
            completed_exp_ids = set(self.init_exploration_ids)
            next_exp_ids = self.get_next_exploration_ids(
                list(completed_exp_ids))
            while next_exp_ids:
                completed_exp_ids.update(set(next_exp_ids))
                next_exp_ids = self.get_next_exploration_ids(
                    list(completed_exp_ids))

            if len(completed_exp_ids) != len(self.nodes):
                unreachable_ids = set(all_exp_ids) - completed_exp_ids
                raise utils.ValidationError(
                    'Some explorations are unreachable from the initial '
                    'explorations: %s' % unreachable_ids)


class CollectionSummary(object):
    """Domain object for an Oppia collection summary."""

    def __init__(self, collection_id, title, category, objective, language_code,
                 tags, status, community_owned, owner_ids, editor_ids,
                 viewer_ids, contributor_ids, contributors_summary, version,
                 node_count, collection_model_created_on,
                 collection_model_last_updated):
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
            viewer_ids: lsit(str). List of the user ids of the users who have
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

    def to_dict(self):
        """Returns a dict representing this CollectionSummary domain object.

        Returns:
            A dict, mapping all fields of CollectionSummary instance.
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

    def is_editable_by(self, user_id=None):
        """Checks if a given user may edit the collection.

        Args:
            user_id: str. User id of the user.

        Returns:
            bool. Whether the given user may edit the collection.
        """
        return user_id is not None and (
            user_id in self.editor_ids
            or user_id in self.owner_ids
            or self.community_owned)
