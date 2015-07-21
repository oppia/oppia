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

__author__ = 'Ben Henning'

import copy

import feconf
import utils


# Do not modify the values of these constants. This is to preserve backwards
# compatibility with previous change dicts.
LINKED_EXPLORATION_PROPERTY_PREREQUISITE_SKILLS = 'prerequisite_skills'
LINKED_EXPLORATION_PROPERTY_ACQUIRED_SKILLS = 'acquired_skills'

# This takes an additional 'exploration_id' parameter.
CMD_ADD_EXPLORATION = 'add_exploration'
# This takes an additional 'exploration_id' parameter.
CMD_DELETE_EXPLORATION = 'delete_exploration'
# This takes additional 'property_name' and 'new_value' parameters.
CMD_EDIT_LINKED_EXPLORATION_PROPERTY = 'edit_linked_exploration_property'
# This takes additional 'property_name' and 'new_value' parameters.
CMD_EDIT_COLLECTION_PROPERTY = 'edit_collection_property'
# This takes additional 'from_version' and 'to_version' parameters for logging.
CMD_MIGRATE_SCHEMA_TO_LATEST_VERSION = 'migrate_schema_to_latest_version'


class CollectionChange(object):
    """Domain object class for a change to a collection.

    IMPORTANT: Ensure that all changes to this class (and how these cmds are
    interpreted in general) preserve backward-compatibility with the
    collection snapshots in the datastore. Do not modify the definitions of
    cmd keys that already exist.
    """

    LINKED_EXPLORATION_PROPERTIES = (
        LINKED_EXPLORATION_PROPERTY_PREREQUISITE_SKILLS,
        LINKED_EXPLORATION_PROPERTY_ACQUIRED_SKILLS)

    COLLECTION_PROPERTIES = ('title', 'category', 'objective')

    def __init__(self, change_dict):
        """Initializes an CollectionChange object from a dict.

        change_dict represents a command. It should have a 'cmd' key, and one
        or more other keys. The keys depend on what the value for 'cmd' is.

        The possible values for 'cmd' are listed below, together with the other
        keys in the dict:
        - 'add_exploration' (with exploration_id)
        - 'delete_exploration' (with exploration_id)
        - 'edit_linked_exploration_property' (with exploration_id,
            property_name, new_value and, optionally, old_value)
        - 'edit_collection_property' (with property_name, new_value and,
            optionally, old_value)
        - 'migrate_schema' (with from_version and to_version)

        For a linked exploration, property_name must be one of
        LINKED_EXPLORATION_PROPERTIES. For a collection, property_name must be
        one of COLLECTION_PROPERTIES.
        """
        if 'cmd' not in change_dict:
            raise Exception('Invalid change_dict: %s' % change_dict)
        self.cmd = change_dict['cmd']

        if self.cmd == CMD_ADD_EXPLORATION:
            self.exploration_id = change_dict['exploration_id']
        elif self.cmd == CMD_DELETE_EXPLORATION:
            self.exploration_id = change_dict['exploration_id']
        elif self.cmd == CMD_EDIT_LINKED_EXPLORATION_PROPERTY:
            if (change_dict['property_name'] not in
                    self.LINKED_EXPLORATION_PROPERTIES):
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
        """This omits created_on, user_id and (for now) commit_cmds."""
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


class LinkedExploration(object):
    """Domain object for an exploration which is part of a collection."""

    def __init__(self, exploration_id, prerequisite_skills, acquired_skills):
        self.exploration_id = exploration_id
        self.prerequisite_skills = prerequisite_skills
        self.acquired_skills = acquired_skills

    def to_dict(self):
        return {
            'prerequisite_skills': self.prerequisite_skills,
            'acquired_skills': self.acquired_skills
        }

    @classmethod
    def from_dict(cls, exploration_id, linked_exploration_dict):
        return cls(
            exploration_id,
            copy.deepcopy(linked_exploration_dict['prerequisite_skills']),
            copy.deepcopy(linked_exploration_dict['acquired_skills']))

    @property
    def exploration(self):
        from core.domain import exp_services
        return exp_services.get_exploration_by_id(self.exploration_id)

    @property
    def skills(self):
        """The skills of a linked exploration is a unique set of both the
        prerequisite and acquired skills of this exploration, within the
        context of a collection.
        """
        return set(self.prerequisite_skills) | set(self.acquired_skills)

    def update_prerequisite_skills(self, prerequisite_skills):
        prerequiste_and_acquired_skills = (
          set(prerequisite_skills) & set(self.acquired_skills))
        if prerequiste_and_acquired_skills:
            raise utils.ValueError(
                'No prerequisite skills may also be acquired skills: %s' %
                prerequisite_skills)

        self.prerequisite_skills = copy.deepcopy(prerequisite_skills)

    def update_acquired_skills(self, acquired_skills):
        prerequiste_and_acquired_skills = (
          set(self.prerequisite_skills) & set(acquired_skills))
        if prerequiste_and_acquired_skills:
            raise utils.ValueError(
                'No acquired skills may also be prerequisite skills: %s' %
                acquired_skills)

        self.acquired_skills = copy.deepcopy(acquired_skills)

    def validate(self, strict, validate_exploration):
        """Validates the exploration linked by this domain object as well as
        the skill lists.
        """
        if validate_exploration:
            try:
                self.exploration.validate(strict=strict)
            except utils.ValidationError as validation_error:
                raise validation_error
            except Exception:
                raise utils.ValidationError(
                    'Error loading exploration: %s' % self.exploration_id)

        if not isinstance(self.prerequisite_skills, list):
            raise utils.ValidationError(
                'Expected prerequisite_skills to be a list, received %s' %
                self.prerequisite_skills)

        if len(set(self.prerequisite_skills)) != len(self.prerequisite_skills):
            raise utils.ValidationError(
                'The prerequisite_skills list has duplicate entries: %s' %
                self.prerequisite_skills)

        if not isinstance(self.acquired_skills, list):
            raise utils.ValidationError(
                'Expected acquired_skills to be a list, received %s' %
                self.acquired_skills)

        if len(set(self.acquired_skills)) != len(self.acquired_skills):
            raise utils.ValidationError(
                'The acquired_skills list has duplicate entries: %s' %
                self.acquired_skills)

        prerequiste_and_acquired_skills = (
          set(self.prerequisite_skills) & set(self.acquired_skills))
        if prerequiste_and_acquired_skills:
            raise utils.ValidationError(
                'There are some skills which are both required for this '
                'exploration and acquired after playing it: %s' %
                prerequiste_and_acquired_skills)

    @classmethod
    def create_default_linked_exploration(cls, exploration_id):
        return cls(exploration_id, [], [])


class Collection(object):
    """Domain object for an Oppia collection."""

    def __init__(self, collection_id, title, category, objective,
                 schema_version, linked_explorations, version,
                 created_on=None, last_updated=None):
        self.id = collection_id
        self.title = title
        self.category = category
        self.objective = objective
        self.schema_version = schema_version
        self.linked_explorations = linked_explorations
        self.version = version
        self.created_on = created_on
        self.last_updated = last_updated

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'category': self.category,
            'objective': self.objective,
            'schema_version': self.schema_version,
            'linked_explorations': {
                exp_id: linked_exp.to_dict()
                for (exp_id, linked_exp) in (
                    self.linked_explorations.iteritems())
            }
        }

    @classmethod
    def create_default_collection(
            cls, collection_id, title, category, objective=''):
        return cls(
            collection_id, title, category, objective,
            feconf.CURRENT_COLLECTION_SCHEMA_VERSION, {}, 0)

    @classmethod
    def create_collection_from_dict(
            cls, collection_dict, collection_version=0,
            collection_created_on=None, collection_last_updated=None):
        collection = cls(
            collection_dict['id'], collection_dict['title'],
            collection_dict['category'], collection_dict['objective'],
            collection_dict['schema_version'], {}, collection_version,
            collection_created_on, collection_last_updated)

        for (exp_id, linked_exp_dict) in (
                collection_dict['linked_explorations'].iteritems()):
            collection.linked_explorations[exp_id] = (
                LinkedExploration.from_dict(exp_id, linked_exp_dict))

        return collection

    def to_yaml(self):
        collection_dict = self.to_dict()

        # Properties which are not needed to be stored within the YAML
        # representation.
        del collection_dict['id']
        del collection_dict['title']
        del collection_dict['category']

        return utils.yaml_from_dict(collection_dict)

    @classmethod
    def from_yaml(cls, collection_id, title, category, yaml_content):
        try:
            collection_dict = utils.dict_from_yaml(yaml_content)
        except Exception as e:
            raise Exception(
                'Please ensure that you are uploading a YAML text file, not '
                'a zip file. The YAML parser returned the following error: %s'
                % e)

        collection_dict['id'] = collection_id
        collection_dict['title'] = title
        collection_dict['category'] = category

        return Collection.create_collection_from_dict(collection_dict)

    @property
    def skills(self):
        """The skills of a collection are made up of all prerequisites and
        acquired skills of each exploration part of this collection.
        """
        unique_skills = set()
        for exp_id in self.linked_explorations:
            unique_skills.update(self.linked_explorations[exp_id].skills)
        return list(unique_skills)

    @property
    def init_exploration_ids(self):
        """Returns a list of explorations IDs that could be initially started
        for this collection (ie, they require no prior skills to complete).
        """
        init_exp_ids = []
        for (exp_id, linked_exp) in self.linked_explorations.iteritems():
            if len(linked_exp.prerequisite_skills) == 0:
                init_exp_ids.append(exp_id)
        return init_exp_ids

    @property
    def init_explorations(self):
        """Returns a list of explorations that could be initially started for
        this collection (ie, they require no prior skills to complete).
        """
        return [
            self.linked_explorations[exp_id].exploration
            for exp_id in self.init_exploration_ids]

    def get_next_exploration_ids(self, completed_exploration_ids):
        """Returns a list of exploration IDs for which the prerequisite skills
        are satisfied. These are the next explorations to complete for a user.
        If the list returned is empty and the collection is valid, then all
        skills have been acquired and the collection is completed. If the input
        list is empty, then the initial explorations are returned.
        """
        acquired_skills = set()
        for completed_exp_id in completed_exploration_ids:
            acquired_skills.update(set(
                self.linked_explorations[completed_exp_id].acquired_skills))

        next_exp_ids = []
        for (exp_id, linked_exp) in self.linked_explorations.iteritems():
            prereq_skills = set(linked_exp.prerequisite_skills)
            remaining_skills = prereq_skills - acquired_skills
            if len(remaining_skills) == 0:
                next_exp_ids.append(exp_id)
        return list(set(next_exp_ids) - set(completed_exploration_ids))

    def get_next_explorations(self, completed_exploration_ids):
        """Returns a list of explorations for which the prerequisite skills are
        satisfied. See get_next_exploration_ids for more information.
        """
        return [
            self.linked_explorations[exp_id].exploration
            for exp_id in self.get_next_exploration_ids(
                completed_exploration_ids)]

    @classmethod
    def is_demo_collection_id(cls, collection_id):
        """Whether the collection id is that of a demo collection."""
        return collection_id.isdigit() and (
            0 <= int(collection_id) < len(feconf.DEMO_COLLECTIONS))

    @property
    def is_demo(self):
        """Whether the collection is one of the demo collections."""
        return self.is_demo_collection_id(self.id)

    def update_title(self, title):
        self.title = title

    def update_category(self, category):
        self.category = category

    def update_objective(self, objective):
        self.objective = objective

    def add_exploration(self, exploration_id):
        if exploration_id in self.linked_explorations:
            raise ValueError(
                'Exploration is already part of this collection: %s' %
                exploration_id)
        self.linked_explorations[exploration_id] = (
            LinkedExploration.create_default_linked_exploration(
                exploration_id))

    def delete_exploration(self, exploration_id):
        if exploration_id not in self.linked_explorations:
            raise ValueError(
                'Exploration is not part of this collection: %s' %
                exploration_id)

        del self.linked_explorations[exploration_id]

    def validate(self, strict=True, validate_explorations=True):
        """Verifies all properties of this collection and its constituents are
        in a valid and correct state.
        """
        if not isinstance(self.title, basestring):
            raise utils.ValidationError(
                'Expected title to be a string, received %s' % self.title)
        utils.require_valid_name(self.title, 'the collection title')

        if not isinstance(self.category, basestring):
            raise utils.ValidationError(
                'Expected category to be a string, received %s'
                % self.category)
        utils.require_valid_name(self.category, 'the collection category')

        if not isinstance(self.objective, basestring):
            raise utils.ValidationError(
                'Expected objective to be a string, received %s' %
                self.objective)

        if not isinstance(self.schema_version, int):
            raise utils.ValidationError(
                'Expected schema version to be an integer, received %s' %
                self.schema_version)

        if not isinstance(self.linked_explorations, dict):
            raise utils.ValidationError(
                'Expected linked explorations to be a dict, received %s' %
                self.linked_explorations)

        # Ensure the skills graph has no cycles. This is done two-fold: first,
        # the prerequisite and acquired skill lists cannot contain similar
        # elements (validated in LinkedExploration). This ensure no
        # explorations may recommend themselves/cycle back right away. Second,
        # every exploration in the collection must be reachable when starting
        # from the initial explorations and playing through all recommended
        # explorations. Cycles can only exist in a disconnected graph.
        if strict:
            # Ensure the collection may be started.
            if len(self.init_exploration_ids) == 0:
                raise utils.ValidationError(
                    'Expected to have at least 1 exploration with no '
                    'prerequisite skills.')

            if not self.objective:
                raise utils.ValidationError(
                    'An objective must be specified (in the '
                        '\'Settings\' tab).')

            # Ensure the collection can be completed.
            completed_exp_ids = set(self.init_exploration_ids)
            next_exp_ids = self.get_next_exploration_ids(
                list(completed_exp_ids))
            while next_exp_ids:
                completed_exp_ids.update(set(next_exp_ids))
                next_exp_ids = self.get_next_exploration_ids(
                    list(completed_exp_ids))

            if len(completed_exp_ids) != len(self.linked_explorations):
                all_exp_ids = set([
                    exp_id for exp_id in self.linked_explorations])
                unreachable_ids = all_exp_ids - completed_exp_ids
                raise utils.ValidationError(
                    'Some explorations are unreachable from the initial '
                    'explorations: %s' % unreachable_ids)

        # Validate all linked explorations.
        for exp_id in self.linked_explorations:
            self.linked_explorations[exp_id].validate(
                strict, validate_explorations)


class CollectionSummary(object):
    """Domain object for an Oppia collection summary."""

    def __init__(self, collection_id, title, category, objective,
                 status, community_owned, owner_ids, editor_ids,
                 viewer_ids, version, collection_model_created_on,
                 collection_model_last_updated):
        self.id = collection_id
        self.title = title
        self.category = category
        self.objective = objective
        self.status = status
        self.community_owned = community_owned
        self.owner_ids = owner_ids
        self.editor_ids = editor_ids
        self.viewer_ids = viewer_ids
        self.version = version
        self.collection_model_created_on = collection_model_created_on
        self.collection_model_last_updated = collection_model_last_updated

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'category': self.category,
            'objective': self.objective,
            'status': self.status,
            'community_owned': self.community_owned,
            'owner_ids': self.owner_ids,
            'editor_ids': self.editor_ids,
            'viewer_ids': self.viewer_ids,
            'version': self.version,
            'collection_model_created_on': self.collection_model_created_on,
            'collection_model_last_updated': self.collection_model_last_updated
        }
