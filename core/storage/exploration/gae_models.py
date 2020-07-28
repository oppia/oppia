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

"""Model for an Oppia exploration."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime

from constants import constants
import core.storage.base_model.gae_models as base_models
import feconf
import python_utils

from google.appengine.ext import ndb


class ExplorationSnapshotMetadataModel(base_models.BaseSnapshotMetadataModel):
    """Storage model for the metadata for an exploration snapshot."""

    pass


class ExplorationSnapshotContentModel(base_models.BaseSnapshotContentModel):
    """Storage model for the content of an exploration snapshot."""

    pass


class ExplorationModel(base_models.VersionedModel):
    """Versioned storage model for an Oppia exploration.

    This class should only be imported by the exploration services file
    and the exploration model test file.
    """

    SNAPSHOT_METADATA_CLASS = ExplorationSnapshotMetadataModel
    SNAPSHOT_CONTENT_CLASS = ExplorationSnapshotContentModel
    ALLOW_REVERT = True

    # What this exploration is called.
    title = ndb.StringProperty(required=True)
    # The category this exploration belongs to.
    category = ndb.StringProperty(required=True, indexed=True)
    # The objective of this exploration.
    objective = ndb.TextProperty(default='', indexed=False)
    # The ISO 639-1 code for the language this exploration is written in.
    language_code = ndb.StringProperty(
        default=constants.DEFAULT_LANGUAGE_CODE, indexed=True)
    # Tags (topics, skills, concepts, etc.) associated with this
    # exploration.
    tags = ndb.StringProperty(repeated=True, indexed=True)
    # A blurb for this exploration.
    blurb = ndb.TextProperty(default='', indexed=False)
    # 'Author notes' for this exploration.
    author_notes = ndb.TextProperty(default='', indexed=False)

    # The version of the states blob schema.
    states_schema_version = ndb.IntegerProperty(
        required=True, default=0, indexed=True)
    # The name of the initial state of this exploration.
    init_state_name = ndb.StringProperty(required=True, indexed=False)
    # A dict representing the states of this exploration. This dict should
    # not be empty.
    states = ndb.JsonProperty(default={}, indexed=False)
    # The dict of parameter specifications associated with this exploration.
    # Each specification is a dict whose keys are param names and whose values
    # are each dicts with a single key, 'obj_type', whose value is a string.
    param_specs = ndb.JsonProperty(default={}, indexed=False)
    # The list of parameter changes to be performed once at the start of a
    # reader's encounter with an exploration.
    param_changes = ndb.JsonProperty(repeated=True, indexed=False)
    # A boolean indicating whether automatic text-to-speech is enabled in
    # this exploration.
    auto_tts_enabled = ndb.BooleanProperty(default=True, indexed=True)
    # A boolean indicating whether correctness feedback is enabled in this
    # exploration.
    correctness_feedback_enabled = ndb.BooleanProperty(
        default=False, indexed=True)

    # DEPRECATED in v2.0.0.rc.2. Do not use. Retaining it here because deletion
    # caused GAE to raise an error on fetching a specific version of the
    # exploration model.
    # TODO(sll): Fix this error and remove this property.
    skill_tags = ndb.StringProperty(repeated=True, indexed=True)
    # DEPRECATED in v2.0.1. Do not use.
    # TODO(sll): Remove this property from the model.
    default_skin = ndb.StringProperty(default='conversation_v1')
    # DEPRECATED in v2.5.4. Do not use.
    skin_customizations = ndb.JsonProperty(indexed=False)

    @staticmethod
    def get_deletion_policy():
        """Exploration is deleted only if it is not public."""
        return base_models.DELETION_POLICY.KEEP_IF_PUBLIC

    @staticmethod
    def get_export_policy():
        """Model does not contain user data."""
        return base_models.EXPORT_POLICY.NOT_APPLICABLE

    @classmethod
    def has_reference_to_user_id(cls, user_id):
        """Check whether ExplorationModel or its snapshots references the given
        user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether any models refer to the given user ID.
        """
        return cls.SNAPSHOT_METADATA_CLASS.exists_for_user_id(user_id)

    @classmethod
    def get_exploration_count(cls):
        """Returns the total number of explorations."""
        return cls.get_all().count()

    def _trusted_commit(
            self, committer_id, commit_type, commit_message, commit_cmds):
        """Record the event to the commit log after the model commit.

        Note that this extends the superclass method.

        Args:
            committer_id: str. The user_id of the user who committed the
                change.
            commit_type: str. The type of commit. Possible values are in
                core.storage.base_models.COMMIT_TYPE_CHOICES.
            commit_message: str. The commit description message.
            commit_cmds: list(dict). A list of commands, describing changes
                made in this model, which should give sufficient information to
                reconstruct the commit. Each dict always contains:
                    cmd: str. Unique command.
                and then additional arguments for that command.
        """
        super(ExplorationModel, self)._trusted_commit(
            committer_id, commit_type, commit_message, commit_cmds)

        exp_rights = ExplorationRightsModel.get_by_id(self.id)

        # TODO(msl): Test if put_async() leads to any problems (make
        # sure summary dicts get updated correctly when explorations
        # are changed).
        exploration_commit_log = ExplorationCommitLogEntryModel.create(
            self.id, self.version, committer_id, commit_type, commit_message,
            commit_cmds, exp_rights.status, exp_rights.community_owned
        )
        exploration_commit_log.exploration_id = self.id
        exploration_commit_log.put()

    @classmethod
    def delete_multi(
            cls, entity_ids, committer_id, commit_message,
            force_deletion=False):
        """Deletes the given cls instances with the given entity_ids.

        Note that this extends the superclass method.

        Args:
            entity_ids: list(str). Ids of entities to delete.
            committer_id: str. The user_id of the user who committed the change.
            commit_message: str. The commit description message.
            force_deletion: bool. If True these models are deleted completely
                from storage, otherwise there are only marked as deleted.
                Default is False.
        """
        super(ExplorationModel, cls).delete_multi(
            entity_ids, committer_id,
            commit_message, force_deletion=force_deletion)

        if not force_deletion:
            commit_log_models = []
            exp_rights_models = ExplorationRightsModel.get_multi(
                entity_ids, include_deleted=True)
            versioned_models = cls.get_multi(entity_ids, include_deleted=True)

            versioned_and_exp_rights_models = python_utils.ZIP(
                versioned_models, exp_rights_models)
            for model, rights_model in versioned_and_exp_rights_models:
                exploration_commit_log = ExplorationCommitLogEntryModel.create(
                    model.id, model.version, committer_id,
                    cls._COMMIT_TYPE_DELETE,
                    commit_message, [{'cmd': cls.CMD_DELETE_COMMIT}],
                    rights_model.status, rights_model.community_owned
                )
                exploration_commit_log.exploration_id = model.id
                commit_log_models.append(exploration_commit_log)
            ndb.put_multi_async(commit_log_models)


class ExplorationContextModel(base_models.BaseModel):
    """Model for storing Exploration context.

    The ID of instances of this class is the ID of the exploration itself.
    """

    # The ID of the story that the exploration is a part of.
    story_id = ndb.StringProperty(required=True, indexed=True)

    @staticmethod
    def get_deletion_policy():
        """Exploration context should be kept if the story and exploration are
        published.
        """
        return base_models.DELETION_POLICY.KEEP_IF_PUBLIC

    @staticmethod
    def get_export_policy():
        """Model does not contain user data."""
        return base_models.EXPORT_POLICY.NOT_APPLICABLE

    @classmethod
    def has_reference_to_user_id(cls, unused_user_id):
        """Check whether ExplorationContextModel references the given user.

        Args:
            unused_user_id: str. The (unused) ID of the user whose data should
                be checked.

        Returns:
            bool. Whether any models refer to the given user ID.
        """
        return False


class ExplorationMathRichTextInfoModel(base_models.BaseModel):
    """Temporary Storage model for storing information useful while
    generating images for math rich-text components in explorations.

    TODO(#9952): This model needs to removed once we generate SVG images for
    all the math rich text componets in old explorations.

    The id of each instance is the id of the corresponding exploration.
    """

    # A boolean which indicates whether the exploration requires images to be
    # generated and saved for the math rich-text components. If this field is
    # False, we will need to generate math rich-text component images for the
    # exploration. The field will be true only if for each math rich-text
    # components there is a valid image stored in the datastore.
    math_images_generation_required = ndb.BooleanProperty(
        indexed=True, required=True)
    # Approximate maximum size of Math rich-text components SVG images that
    # would be generated for the exploration according to the length of
    # raw_latex string.
    estimated_max_size_of_images_in_bytes = ndb.IntegerProperty(
        indexed=True, required=True)
    # List of unique LaTeX strings without an SVG saved from all the math-rich
    # text components of the exploration.
    latex_strings_without_svg = ndb.StringProperty(repeated=True)

    @staticmethod
    def get_deletion_policy():
        """ExplorationMathRichTextInfoModel are temporary model that will be
        deleted after user migration.
        """
        return base_models.DELETION_POLICY.DELETE

    @staticmethod
    def get_export_policy():
        """Model does not contain user data."""
        return base_models.EXPORT_POLICY.NOT_APPLICABLE

    @classmethod
    def has_reference_to_user_id(cls, unused_user_id):
        """Check whether ExplorationMathRichTextInfoModel references the given
        user.

        Args:
            unused_user_id: str. The (unused) ID of the user whose data should
                be checked.

        Returns:
            bool. Whether any models refer to the given user ID.
        """
        return False


class ExplorationRightsSnapshotMetadataModel(
        base_models.BaseSnapshotMetadataModel):
    """Storage model for the metadata for an exploration rights snapshot."""

    pass


class ExplorationRightsSnapshotContentModel(
        base_models.BaseSnapshotContentModel):
    """Storage model for the content of an exploration rights snapshot."""

    pass


class ExplorationRightsModel(base_models.VersionedModel):
    """Storage model for rights related to an exploration.

    The id of each instance is the id of the corresponding exploration.
    """

    SNAPSHOT_METADATA_CLASS = ExplorationRightsSnapshotMetadataModel
    SNAPSHOT_CONTENT_CLASS = ExplorationRightsSnapshotContentModel
    ALLOW_REVERT = False

    # The user_ids of owners of this exploration.
    owner_ids = ndb.StringProperty(indexed=True, repeated=True)
    # The user_ids of users who are allowed to edit this exploration.
    editor_ids = ndb.StringProperty(indexed=True, repeated=True)
    # The user_ids of users who are allowed to voiceover this exploration.
    voice_artist_ids = ndb.StringProperty(indexed=True, repeated=True)
    # The user_ids of users who are allowed to view this exploration.
    viewer_ids = ndb.StringProperty(indexed=True, repeated=True)

    # Whether this exploration is owned by the community.
    community_owned = ndb.BooleanProperty(indexed=True, default=False)
    # The exploration id which this exploration was cloned from. If None, this
    # exploration was created from scratch.
    cloned_from = ndb.StringProperty()
    # For private explorations, whether this exploration can be viewed
    # by anyone who has the URL. If the exploration is not private, this
    # setting is ignored.
    viewable_if_private = ndb.BooleanProperty(indexed=True, default=False)
    # Time, in milliseconds, when the exploration was first published.
    first_published_msec = ndb.FloatProperty(indexed=True, default=None)

    # The publication status of this exploration.
    status = ndb.StringProperty(
        default=constants.ACTIVITY_STATUS_PRIVATE, indexed=True,
        choices=[
            constants.ACTIVITY_STATUS_PRIVATE,
            constants.ACTIVITY_STATUS_PUBLIC
        ]
    )
    # DEPRECATED in v2.8.3. Do not use.
    translator_ids = ndb.StringProperty(indexed=True, repeated=True)

    @staticmethod
    def get_deletion_policy():
        """Exploration rights are deleted only if the corresponding exploration
        is not public.
        """
        return base_models.DELETION_POLICY.KEEP_IF_PUBLIC

    @staticmethod
    def get_export_policy():
        """Model contains user data."""
        return base_models.EXPORT_POLICY.CONTAINS_USER_DATA

    @staticmethod
    def convert_to_valid_dict(model_dict):
        """Replace invalid fields and values in the ExplorationRightsModel dict.

        Some old ExplorationRightsSnapshotContentModels can contain fields
        and field values that are no longer supported and would cause
        an exception when we try to reconstitute a ExplorationRightsModel from
        them. We need to remove or replace these fields and values.

        Args:
            model_dict: dict. The content of the model. Some fields and field
                values might no longer exist in the ExplorationRightsModel
                schema.

        Returns:
            dict. The content of the model. Only valid fields and values are
            present.
        """
        # The all_viewer_ids field was previously used in some versions of the
        # model, we need to remove it.
        if 'all_viewer_ids' in model_dict:
            del model_dict['all_viewer_ids']
        # The status field could historically take the value 'publicized', this
        # value is now equivalent to 'public'.
        if model_dict['status'] == 'publicized':
            model_dict['status'] = constants.ACTIVITY_STATUS_PUBLIC
        # The voice_artist_ids field was previously named translator_ids. We
        # need to move the values from translator_ids field to voice_artist_ids
        # and delete translator_ids.
        if 'translator_ids' in model_dict and model_dict['translator_ids']:
            model_dict['voice_artist_ids'] = model_dict['translator_ids']
            model_dict['translator_ids'] = []
        return model_dict

    @classmethod
    def has_reference_to_user_id(cls, user_id):
        """Check whether ExplorationRightsModel reference user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether any models refer to the given user ID.
        """
        return (
            cls.query(ndb.OR(
                cls.owner_ids == user_id,
                cls.editor_ids == user_id,
                cls.voice_artist_ids == user_id,
                cls.viewer_ids == user_id
            )).get(keys_only=True) is not None
            or cls.SNAPSHOT_METADATA_CLASS.exists_for_user_id(user_id))

    def save(self, committer_id, commit_message, commit_cmds):
        """Saves a new version of the exploration, updating the Exploration
        datastore model.

        Args:
            committer_id: str. The user_id of the user who committed the
                change.
            commit_message: str. The commit description message.
            commit_cmds: list(dict). A list of commands, describing changes
                made in this model, which should give sufficient information to
                reconstruct the commit. Each dict always contains:
                    cmd: str. The type of the command. A full list of command
                        types can be found in core/domain/exp_domain.py.
                and then additional arguments for that command. For example:

                {'cmd': 'AUTO_revert_version_number',
                 'version_number': 4}
        """
        super(ExplorationRightsModel, self).commit(
            committer_id, commit_message, commit_cmds)

    def _trusted_commit(
            self, committer_id, commit_type, commit_message, commit_cmds):
        """Record the event to the commit log after the model commit.

        Note that this extends the superclass method.

        Args:
            committer_id: str. The user_id of the user who committed the
                change.
            commit_type: str. The type of commit. Possible values are in
                core.storage.base_models.COMMIT_TYPE_CHOICES.
            commit_message: str. The commit description message.
            commit_cmds: list(dict). A list of commands, describing changes
                made in this model, should give sufficient information to
                reconstruct the commit. Each dict always contains:
                    cmd: str. Unique command.
                and then additional arguments for that command.
        """

        super(ExplorationRightsModel, self)._trusted_commit(
            committer_id, commit_type, commit_message, commit_cmds)

        # Create and delete events will already be recorded in the
        # ExplorationModel.
        if commit_type not in ['create', 'delete']:
            # TODO(msl): Test if put_async() leads to any problems (make
            # sure summary dicts get updated correctly when explorations
            # are changed).
            ExplorationCommitLogEntryModel(
                id=('rights-%s-%s' % (self.id, self.version)),
                user_id=committer_id,
                exploration_id=self.id,
                commit_type=commit_type,
                commit_message=commit_message,
                commit_cmds=commit_cmds,
                version=None,
                post_commit_status=self.status,
                post_commit_community_owned=self.community_owned,
                post_commit_is_private=(
                    self.status == constants.ACTIVITY_STATUS_PRIVATE)
            ).put_async()

    @classmethod
    def export_data(cls, user_id):
        """(Takeout) Export user-relevant properties of ExplorationRightsModel.

        Args:
            user_id: str. The user_id denotes which user's data to extract.

        Returns:
            dict or None. The user-relevant properties of ExplorationRightsModel
            in a python dict format. In this case, we are returning all the
            ids of explorations that the user is connected to, so they either
            own, edit, voice, or have permission to view.
        """
        owned_explorations = cls.get_all().filter(cls.owner_ids == user_id)
        editable_explorations = cls.get_all().filter(cls.editor_ids == user_id)
        voiced_explorations = (
            cls.get_all().filter(cls.voice_artist_ids == user_id))
        viewable_explorations = cls.get_all().filter(cls.viewer_ids == user_id)

        owned_exploration_ids = [exp.key.id() for exp in owned_explorations]
        editable_exploration_ids = (
            [exp.key.id() for exp in editable_explorations])
        voiced_exploration_ids = [exp.key.id() for exp in voiced_explorations]
        viewable_exploration_ids = (
            [exp.key.id() for exp in viewable_explorations])

        return {
            'owned_exploration_ids': owned_exploration_ids,
            'editable_exploration_ids': editable_exploration_ids,
            'voiced_exploration_ids': voiced_exploration_ids,
            'viewable_exploration_ids': viewable_exploration_ids
        }


class ExplorationCommitLogEntryModel(base_models.BaseCommitLogEntryModel):
    """Log of commits to explorations.

    A new instance of this model is created and saved every time a commit to
    ExplorationModel or ExplorationRightsModel occurs.

    The id for this model is of the form
    'exploration-[exploration_id]-[version]'.
    """

    # The id of the exploration being edited.
    exploration_id = ndb.StringProperty(indexed=True, required=True)

    @staticmethod
    def get_deletion_policy():
        """Exploration commit log is deleted only if the corresponding
        exploration is not public.
        """
        return base_models.DELETION_POLICY.KEEP_IF_PUBLIC

    @staticmethod
    def get_export_policy():
        """This model is only stored for archive purposes. The commit log of
        entities is not related to personal user data.
        """
        return base_models.EXPORT_POLICY.NOT_APPLICABLE

    @classmethod
    def get_multi(cls, exp_id, exp_versions):
        """Gets the ExplorationCommitLogEntryModels for the given exploration
        id and exploration versions.

        Args:
            exp_id: str. The id of the exploration.
            exp_versions: list(int). The versions of the exploration.

        Returns:
            list(ExplorationCommitLogEntryModel). The list of
            ExplorationCommitLogEntryModel instances which matches the given
            exp_id and exp_versions.
        """
        instance_ids = [cls._get_instance_id(exp_id, exp_version)
                        for exp_version in exp_versions]

        return super(ExplorationCommitLogEntryModel, cls).get_multi(
            instance_ids)

    @classmethod
    def _get_instance_id(cls, exp_id, exp_version):
        """Returns ID of the exploration commit log entry model.

        Args:
            exp_id: str. The exploration id whose states are mapped.
            exp_version: int. The version of the exploration.

        Returns:
            str. A string containing exploration ID and
            exploration version.
        """
        return 'exploration-%s-%s' % (exp_id, exp_version)

    @classmethod
    def get_all_non_private_commits(
            cls, page_size, urlsafe_start_cursor, max_age=None):
        """Fetches a list of all the non-private commits sorted by their
        last updated attribute.

        Args:
            page_size: int. The maximum number of entities to be returned.
            urlsafe_start_cursor: str or None. If provided, the list of
                returned entities starts from this datastore cursor.
                Otherwise, the returned entities start from the beginning
                of the full list of entities.
            max_age: datetime.timedelta. The maximum time duration within which
                commits are needed.

        Returns:
            3-tuple of (results, cursor, more). Created no earlier than the
            max_age before the current time where:
                results: List of query results.
                cursor: str or None. A query cursor pointing to the next
                    batch of results. If there are no more results, this will
                    be None.
                more: bool. If True, there are (probably) more results after
                    this batch. If False, there are no further results after
                    this batch.
        """

        if not isinstance(max_age, datetime.timedelta) and max_age is not None:
            raise ValueError(
                'max_age must be a datetime.timedelta instance or None.')

        query = cls.query(cls.post_commit_is_private == False)  # pylint: disable=singleton-comparison
        if max_age:
            query = query.filter(
                cls.last_updated >= datetime.datetime.utcnow() - max_age)
        return cls._fetch_page_sorted_by_last_updated(
            query, page_size, urlsafe_start_cursor)


class ExpSummaryModel(base_models.BaseModel):
    """Summary model for an Oppia exploration.

    This should be used whenever the content blob of the exploration is not
    needed (e.g. in search results, etc).

    A ExpSummaryModel instance stores the following information:

        id, title, category, objective, language_code, tags,
        last_updated, created_on, status (private, public),
        community_owned, owner_ids, editor_ids,
        viewer_ids, version.

    The key of each instance is the exploration id.
    """

    # What this exploration is called.
    title = ndb.StringProperty(required=True)
    # The category this exploration belongs to.
    category = ndb.StringProperty(required=True, indexed=True)
    # The objective of this exploration.
    objective = ndb.TextProperty(required=True, indexed=False)
    # The ISO 639-1 code for the language this exploration is written in.
    language_code = ndb.StringProperty(required=True, indexed=True)
    # Tags associated with this exploration.
    tags = ndb.StringProperty(repeated=True, indexed=True)

    # Aggregate user-assigned ratings of the exploration.
    ratings = ndb.JsonProperty(default=None, indexed=False)

    # Scaled average rating for the exploration.
    scaled_average_rating = ndb.FloatProperty(indexed=True)

    # Time when the exploration model was last updated (not to be
    # confused with last_updated, which is the time when the
    # exploration *summary* model was last updated).
    exploration_model_last_updated = ndb.DateTimeProperty(indexed=True)
    # Time when the exploration model was created (not to be confused
    # with created_on, which is the time when the exploration *summary*
    # model was created).
    exploration_model_created_on = ndb.DateTimeProperty(indexed=True)
    # Time when the exploration was first published.
    first_published_msec = ndb.FloatProperty(indexed=True)

    # The publication status of this exploration.
    status = ndb.StringProperty(
        default=constants.ACTIVITY_STATUS_PRIVATE, indexed=True,
        choices=[
            constants.ACTIVITY_STATUS_PRIVATE,
            constants.ACTIVITY_STATUS_PUBLIC
        ]
    )

    # Whether this exploration is owned by the community.
    community_owned = ndb.BooleanProperty(required=True, indexed=True)

    # The user_ids of owners of this exploration.
    owner_ids = ndb.StringProperty(indexed=True, repeated=True)
    # The user_ids of users who are allowed to edit this exploration.
    editor_ids = ndb.StringProperty(indexed=True, repeated=True)
    # The user_ids of users who are allowed to voiceover this exploration.
    voice_artist_ids = ndb.StringProperty(indexed=True, repeated=True)
    # The user_ids of users who are allowed to view this exploration.
    viewer_ids = ndb.StringProperty(indexed=True, repeated=True)
    # The user_ids of users who have contributed (humans who have made a
    # positive (not just a revert) change to the exploration's content).
    # NOTE TO DEVELOPERS: contributor_ids and contributors_summary need to be
    # synchronized, meaning that the keys in contributors_summary need be
    # equal to the contributor_ids list.
    contributor_ids = ndb.StringProperty(indexed=True, repeated=True)
    # A dict representing the contributors of non-trivial commits to this
    # exploration. Each key of this dict is a user_id, and the corresponding
    # value is the number of non-trivial commits that the user has made.
    contributors_summary = ndb.JsonProperty(default={}, indexed=False)
    # The version number of the exploration after this commit. Only populated
    # for commits to an exploration (as opposed to its rights, etc.).
    version = ndb.IntegerProperty()

    # DEPRECATED in v2.8.3. Do not use.
    translator_ids = ndb.StringProperty(indexed=True, repeated=True)

    @staticmethod
    def get_deletion_policy():
        """Exploration summary is deleted only if the corresponding exploration
        is not public.
        """
        return base_models.DELETION_POLICY.KEEP_IF_PUBLIC

    @classmethod
    def has_reference_to_user_id(cls, user_id):
        """Check whether ExpSummaryModel references user.

        Args:
            user_id: str. The ID of the user whose data should be checked.

        Returns:
            bool. Whether any models refer to the given user ID.
        """
        return cls.query(ndb.OR(
            cls.owner_ids == user_id,
            cls.editor_ids == user_id,
            cls.voice_artist_ids == user_id,
            cls.viewer_ids == user_id,
            cls.contributor_ids == user_id
        )).get(keys_only=True) is not None

    @classmethod
    def get_non_private(cls):
        """Returns an iterable with non-private ExpSummary models.

        Returns:
            iterable. An iterable with non-private ExpSummary models.
        """
        return ExpSummaryModel.query().filter(
            ExpSummaryModel.status != constants.ACTIVITY_STATUS_PRIVATE
        ).filter(
            ExpSummaryModel.deleted == False  # pylint: disable=singleton-comparison
        ).fetch(feconf.DEFAULT_QUERY_LIMIT)

    @classmethod
    def get_top_rated(cls, limit):
        """Fetches the top-rated exp summaries that are public in descending
        order of scaled_average_rating.

        Args:
            limit: int. The maximum number of results to return.

        Returns:
            iterable. An iterable with the top rated exp summaries that are
            public in descending order of scaled_average_rating.
        """
        return ExpSummaryModel.query().filter(
            ExpSummaryModel.status == constants.ACTIVITY_STATUS_PUBLIC
        ).filter(
            ExpSummaryModel.deleted == False  # pylint: disable=singleton-comparison
        ).order(
            -ExpSummaryModel.scaled_average_rating
        ).fetch(limit)

    @classmethod
    def get_private_at_least_viewable(cls, user_id):
        """Fetches private exp summaries that are at least viewable by the
        given user.

        Args:
            user_id: The id of the given user.

        Returns:
            iterable. An iterable with private exp summaries that are at least
            viewable by the given user.
        """
        return ExpSummaryModel.query().filter(
            ExpSummaryModel.status == constants.ACTIVITY_STATUS_PRIVATE
        ).filter(
            ndb.OR(
                ExpSummaryModel.owner_ids == user_id,
                ExpSummaryModel.editor_ids == user_id,
                ExpSummaryModel.voice_artist_ids == user_id,
                ExpSummaryModel.viewer_ids == user_id)
        ).filter(
            ExpSummaryModel.deleted == False  # pylint: disable=singleton-comparison
        ).fetch(feconf.DEFAULT_QUERY_LIMIT)

    @classmethod
    def get_at_least_editable(cls, user_id):
        """Fetches exp summaries that are at least editable by the given user.

        Args:
            user_id: The id of the given user.

        Returns:
            iterable. An iterable with exp summaries that are at least
            editable by the given user.
        """
        return ExpSummaryModel.query().filter(
            ndb.OR(
                ExpSummaryModel.owner_ids == user_id,
                ExpSummaryModel.editor_ids == user_id)
        ).filter(
            ExpSummaryModel.deleted == False  # pylint: disable=singleton-comparison
        ).fetch(feconf.DEFAULT_QUERY_LIMIT)

    @classmethod
    def get_recently_published(cls, limit):
        """Fetches exp summaries that are recently published.

        Args:
            limit: int. The maximum number of results to return.

        Returns:
            iterable. An iterable with exp summaries that are
            recently published. The returned list is sorted by the time of
            publication with latest being first in the list.
        """
        return ExpSummaryModel.query().filter(
            ExpSummaryModel.status == constants.ACTIVITY_STATUS_PUBLIC
        ).filter(
            ExpSummaryModel.deleted == False  # pylint: disable=singleton-comparison
        ).order(
            -ExpSummaryModel.first_published_msec
        ).fetch(limit)

    @staticmethod
    def get_export_policy():
        """Model data has already been exported as a part of the
        ExplorationModel and thus does not need a separate export_data
        function.
        """
        return base_models.EXPORT_POLICY.NOT_APPLICABLE
