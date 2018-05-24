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

"""Commands that can be used to operate on stories.

All functions here should be agnostic of how StoryModel objects are
stored in the database. In particular, the various query methods should
delegate to the Story model class. This will enable the story
storage model to be changed without affecting this module and others above it.
"""

import copy

from core.domain import story_domain
from core.platform import models
import feconf

(story_models,) = models.Registry.import_models([models.NAMES.story])
datastore_services = models.Registry.import_datastore_services()
memcache_services = models.Registry.import_memcache_services()


def _migrate_story_contents_to_latest_schema(versioned_story_contents):
    """Holds the responsibility of performing a step-by-step, sequential update
    of the story structure based on the schema version of the input
    story dictionary. If the current story_contents schemas
    change, a new conversion function must be added and some code appended to
    this function to account for that new version.

    Args:
        versioned_story_contents: A dict with two keys:
          - schema_version: str. The schema version for the story_contents dict.
          - story_contents: dict. The dict comprising the story
              contents.

    Raises:
        Exception: The schema version of the story_contents is outside of what
        is supported at present.
    """
    story_schema_version = versioned_story_contents['schema_version']
    if not (1 <= story_schema_version
            <= feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION):
        raise Exception(
            'Sorry, we can only process v1-v%d story schemas at '
            'present.' % feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION)

    while (story_schema_version <
           feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION):
        story_domain.Story.update_story_contents_from_model(
            versioned_story_contents, story_schema_version)
        story_schema_version += 1


# Repository GET methods.
def _get_story_memcache_key(story_id, version=None):
    """Returns a memcache key for the story.

    Args:
        story_id: str. ID of the story.
        version: str. Schema version of the story.

    Returns:
        str. The memcache key of the story.
    """
    if version:
        return 'story-version:%s:%s' % (story_id, version)
    else:
        return 'story:%s' % story_id


def get_story_from_model(story_model, run_conversion=True):
    """Returns a story domain object given a story model loaded
    from the datastore.

    Args:
        story_model: StoryModel. The story model loaded from the
            datastore.
        run_conversion: bool. If true, the the story's schema version will
            be checked against the current schema version. If they do not match,
            the story will be automatically updated to the latest schema
            version.

    Returns:
        story. A Story domain object corresponding to the given
        story model.
    """

    # Ensure the original story model does not get altered.
    versioned_story_contents = {
        'schema_version': story_model.schema_version,
        'story_contents': copy.deepcopy(
            story_model.story_contents)
    }

    # Migrate the story if it is not using the latest schema version.
    if (run_conversion and story_model.schema_version !=
            feconf.CURRENT_STORY_CONTENTS_SCHEMA_VERSION):
        _migrate_story_contents_to_latest_schema(
            versioned_story_contents)

    return story_domain.Story(
        story_model.id, story_model.title,
        story_model.description, story_model.notes,
        story_domain.StoryContents.from_dict(
            versioned_story_contents['story_contents']),
        versioned_story_contents['schema_version'],
        story_model.language_code,
        story_model.version, story_model.created_on,
        story_model.last_updated)


def get_story_summary_from_model(story_summary_model):
    """Returns a domain object for an Oppia story summary given a
    story summary model.

    Args:
        story_summary_model: StorySummaryModel.

    Returns:
        StorySummary.
    """
    return story_domain.StorySummary(
        story_summary_model.id, story_summary_model.title,
        story_summary_model.language_code,
        story_summary_model.version,
        story_summary_model.node_count,
        story_summary_model.story_model_created_on,
        story_summary_model.story_model_last_updated
    )


def get_story_by_id(story_id, strict=True, version=None):
    """Returns a domain object representing a story.

    Args:
        story_id: str. ID of the story.
        strict: bool. Whether to fail noisily if no story with the given
            id exists in the datastore.
        version: str or None. The version number of the story to be
            retrieved. If it is None, the latest version will be retrieved.

    Returns:
        Story or None. The domain object representing a story with the
        given id, or None if it does not exist.
    """
    story_memcache_key = _get_story_memcache_key(
        story_id, version=version)
    memcached_story = memcache_services.get_multi(
        [story_memcache_key]).get(story_memcache_key)

    if memcached_story is not None:
        return memcached_story
    else:
        story_model = story_models.StoryModel.get(
            story_id, strict=strict, version=version)
        if story_model:
            story = get_story_from_model(story_model)
            memcache_services.set_multi({story_memcache_key: story})
            return story
        else:
            return None


def get_story_summary_by_id(story_id):
    """Returns a domain object representing a story summary.

    Args:
        story_id: str. ID of the story summary.

    Returns:
        StorySummary. The story summary domain object corresponding to
        a story with the given story_id.
    """
    story_summary_model = story_models.StorySummaryModel.get(
        story_id)
    if story_summary_model:
        story_summary = get_story_summary_from_model(
            story_summary_model)
        return story_summary
    else:
        return None


def get_new_story_id():
    """Returns a new story id.

    Returns:
        str. A new story id.
    """
    return story_models.StoryModel.get_new_id('')


def _create_story(committer_id, story, commit_message, commit_cmds):
    """Creates a new story.

    Args:
        committer_id: str. ID of the committer.
        story: Story. The story domain object.
        commit_message: str. A description of changes made to the story.
        commit_cmds: list(dict). A list of change commands made to the given
            story.
    """
    model = story_models.StoryModel(
        id=story.id,
        description=story.description,
        title=story.title,
        language_code=story.language_code,
        schema_version=story.schema_version,
        notes=story.notes,
        story_contents=story.story_contents.to_dict()
    )
    model.commit(committer_id, commit_message, commit_cmds)
    story.version += 1
    create_story_summary(story.id)


def save_new_story(committer_id, story):
    """Saves a new story.

    Args:
        committer_id: str. ID of the committer.
        story: Story. Story to be saved.
    """
    commit_message = (
        'New story created with title \'%s\'.' % story.title)
    _create_story(
        committer_id, story, commit_message, [{
            'cmd': story_domain.CMD_CREATE_NEW,
            'title': story.title
        }])


def compute_summary_of_story(story):
    """Create a StorySummary domain object for a given Story domain
    object and return it.

    Args:
        story_id: str. ID of the story.

    Returns:
        StorySummary. The computed summary for the given story.
    """
    story_model_node_count = len(story.story_contents.nodes)
    story_summary = story_domain.StorySummary(
        story.id, story.title, story.language_code,
        story.version, story_model_node_count,
        story.created_on, story.last_updated
    )

    return story_summary


def create_story_summary(story_id):
    """Creates and stores a summary of the given story.

    Args:
        story_id: str. ID of the story.
    """
    story = get_story_by_id(story_id)
    story_summary = compute_summary_of_story(story)
    save_story_summary(story_summary)


def save_story_summary(story_summary):
    """Save a story summary domain object as a StorySummaryModel
    entity in the datastore.

    Args:
        story_summary: The story summary object to be saved in the
            datastore.
    """
    story_summary_model = story_models.StorySummaryModel(
        id=story_summary.id,
        title=story_summary.title,
        language_code=story_summary.language_code,
        version=story_summary.version,
        node_count=story_summary.node_count,
        story_model_last_updated=(
            story_summary.story_model_last_updated),
        story_model_created_on=(
            story_summary.story_model_created_on)
    )

    story_summary_model.put()
