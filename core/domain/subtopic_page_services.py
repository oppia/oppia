# coding: utf-8
#
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
# limitations under the License.]

"""Commands for operations on subtopic pages, and related models."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import copy
import functools

from core.domain import fs_domain
from core.domain import fs_services
from core.domain import html_validation_service
from core.domain import image_validation_services
from core.domain import state_domain
from core.domain import subtopic_page_domain
from core.platform import models
import feconf

(topic_models,) = models.Registry.import_models([models.NAMES.topic])
datastore_services = models.Registry.import_datastore_services()
memcache_services = models.Registry.import_memcache_services()


def _migrate_page_contents_to_latest_schema(versioned_page_contents):
    """Holds the responsibility of performing a step-by-step, sequential update
    of the page contents structure based on the schema version of the input
    page contents dictionary. If the current page_contents schema changes, a
    new conversion function must be added and some code appended to this
    function to account for that new version.

    Args:
        versioned_page_contents: A dict with two keys:
          - schema_version: int. The schema version for the page_contents dict.
          - page_contents: dict. The dict comprising the page contents.

    Raises:
        Exception: The schema version of the page_contents is outside of what
            is supported at present.
    """
    page_contents_schema_version = versioned_page_contents['schema_version']
    if not (1 <= page_contents_schema_version
            <= feconf.CURRENT_SUBTOPIC_PAGE_CONTENTS_SCHEMA_VERSION):
        raise Exception(
            'Sorry, we can only process v1-v%d page schemas at '
            'present.' % feconf.CURRENT_SUBTOPIC_PAGE_CONTENTS_SCHEMA_VERSION)

    while (page_contents_schema_version <
           feconf.CURRENT_SUBTOPIC_PAGE_CONTENTS_SCHEMA_VERSION):
        subtopic_page_domain.SubtopicPage.update_page_contents_from_model(
            versioned_page_contents, page_contents_schema_version)
        page_contents_schema_version += 1


def get_subtopic_page_from_model(subtopic_page_model):
    """Returns a domain object for an SubtopicPage given a subtopic page model.

    Args:
        subtopic_page_model: SubtopicPageModel.

    Returns:
        SubtopicPage.
    """
    versioned_page_contents = {
        'schema_version': subtopic_page_model.page_contents_schema_version,
        'page_contents': copy.deepcopy(subtopic_page_model.page_contents)
    }
    if (subtopic_page_model.page_contents_schema_version !=
            feconf.CURRENT_SUBTOPIC_PAGE_CONTENTS_SCHEMA_VERSION):
        _migrate_page_contents_to_latest_schema(versioned_page_contents)
    return subtopic_page_domain.SubtopicPage(
        subtopic_page_model.id,
        subtopic_page_model.topic_id,
        subtopic_page_domain.SubtopicPageContents.from_dict(
            versioned_page_contents['page_contents']),
        versioned_page_contents['schema_version'],
        subtopic_page_model.language_code,
        subtopic_page_model.version
    )


def get_batch_of_subtopic_pages_for_latex_svg_generation():
    """Returns a batch of LaTeX strings from subtopic pages which have LaTeX
    strings without SVGs.

    TODO(#10045): Remove this function once all the math-rich text components in
    subtopics have a valid math SVG stored in the datastore.

    Returns:
        dict(str, list(str)). The dict having each key as an subtopic_page ID
        and value as a list of LaTeX string. Each list has all the LaTeX strings
        in that particular subtopic_page ID.
    """

    subtopic_models = topic_models.SubtopicPageModel.get_all()
    number_of_subtopics_in_current_batch = 0;
    latex_strings_mapping = {}

    for subtopic_model in subtopic_models:
        html_in_subtopic_page = ''
        subtopic_page = get_subtopic_page_from_model(subtopic_model)
        html_in_subtopic_page += ''.join(
            subtopic_page.page_contents.written_translations.
            get_all_html_content_strings())
        html_in_subtopic_page += (
            subtopic_page.page_contents.subtitled_html.html)

        latex_strings_without_svg = (
            html_validation_service.get_latex_strings_without_svg_from_html(
                html_in_subtopic_page))
        if len(latex_strings_without_svg) == 0:
            continue
        if number_of_subtopics_in_current_batch <= 10:
            latex_strings_mapping[subtopic_page.id] = latex_strings_without_svg
            number_of_subtopics_in_current_batch += 1
        else:
            break
    return latex_strings_mapping


def update_subtopics_with_math_svgs(subtopic_page_id,
        raw_latex_to_image_data_dict):
    """Saves an SVG for each LaTeX string without an SVG in an exploration
    and updates the exploration. Also the corresponding valid draft changes are
    updated.

    TODO(#10045): Remove this function once all the math-rich text components in
    explorations have a valid math SVG stored in the datastore.

    Args:
        raw_latex_to_image_data_dict: dict(str, LatexStringSvgImageData). The
            dictionary having the key as a LaTeX string and the corresponding
            value as the SVG image data for that LaTeX string.
        subtopic_page_id: str. The ID of the subtopic_page to update.

    Raises:
        Exception: If any of the SVG images provided fail validation.
    """

    html_in_subtopic_page_after_conversion = ''
    change_list = []

    subtopic_page_model = topic_models.SubtopicPageModel.get(subtopic_page_id)
    topic_id = subtopic_page_id.split('-')[0]
    subtopic_id = subtopic_page_id.split('-')[1]
    subtopic_page = get_subtopic_page_from_model(subtopic_page_model)
    add_svg_filenames_for_latex_strings_in_html_string = (
        functools.partial(
            html_validation_service.
            add_svg_filenames_for_latex_strings_in_html_string,
            raw_latex_to_image_data_dict))

    old_subtopic_page_contents_html = (
        subtopic_page.page_contents.subtitled_html)
    latex_strings_without_svg = (
        html_validation_service.get_latex_strings_without_svg_from_html(
            old_subtopic_page_contents_html.html))

    if len(latex_strings_without_svg) > 0:
        new_subtopic_page_contents_html_string = (
            add_svg_filenames_for_latex_strings_in_html_string(
                old_subtopic_page_contents_html.html))
        html_in_subtopic_page_after_conversion += (
            new_subtopic_page_contents_html_string)
        new_subtopic_page_contents_html = (
            state_domain.SubtitledHtml.from_dict(
                {
                    'content_id': 'content',
                    'html': new_subtopic_page_contents_html_string
                }))
        subtopic_page.update_page_contents_html(
            new_subtopic_page_contents_html)
        change_list.extend([subtopic_page_domain.SubtopicPageChange({
            'cmd': subtopic_page_domain.CMD_UPDATE_SUBTOPIC_PAGE_PROPERTY,
            'subtopic_id': subtopic_id,
            'property_name': (
                subtopic_page_domain.SUBTOPIC_PAGE_PROPERTY_PAGE_CONTENTS_HTML),
            'new_value': new_subtopic_page_contents_html,
            'old_value': old_subtopic_page_contents_html
        })])


    old_subtopic_page_contents_written_translations = (
        subtopic_page.page_contents.written_translations)
    old_subtopic_page_contents_written_translations_html_string = ''.join(
        old_subtopic_page_contents_written_translations.
        get_all_html_content_strings())
    latex_strings_without_svg = (
        html_validation_service.get_latex_strings_without_svg_from_html(
            old_subtopic_page_contents_written_translations_html_string))

    if len(latex_strings_without_svg) > 0:
        new_subtopic_page_contents_written_translations_dict = (
            state_domain.WrittenTranslations.
            convert_html_in_written_translations(
                old_subtopic_page_contents_written_translations.to_dict(),
                add_svg_filenames_for_latex_strings_in_html_string))
        new_subtopic_page_contents_written_translations = (
            state_domain.WrittenTranslations.from_dict(
                new_subtopic_page_contents_written_translations_dict))

        html_in_subtopic_page_after_conversion += ''.join(
            new_subtopic_page_contents_written_translations.
            get_all_html_content_strings())

        subtopic_page.update_page_contents_written_translations(
            new_subtopic_page_contents_written_translations_dict)
        change_list.extend([subtopic_page_domain.SubtopicPageChange({
            'cmd': subtopic_page_domain.CMD_UPDATE_SUBTOPIC_PAGE_PROPERTY,
            'subtopic_id': subtopic_id,
            'property_name': (
                subtopic_page_domain.
                SUBTOPIC_PAGE_PROPERTY_PAGE_WRITTEN_TRANSLATIONS),
            'new_value': new_subtopic_page_contents_written_translations,
            'old_value': old_subtopic_page_contents_written_translations
        })])

    filenames_mapping = (
        html_validation_service.
        extract_svg_filename_latex_mapping_in_math_rte_components(
            html_in_subtopic_page_after_conversion))

    for filename, raw_latex in filenames_mapping:
        image_file = raw_latex_to_image_data_dict[raw_latex].raw_image
        image_validation_error_message_suffix = (
            'SVG image provided for latex %s failed validation' % raw_latex)
        if not image_file:
            logging.error(
                'Image not provided for filename %s' % (filename))
            raise Exception(
                'No image data provided for file with name %s. %s'
                % (filename, image_validation_error_message_suffix))
        try:
            file_format = (
                image_validation_services.validate_image_and_filename(
                    image_file, filename))
        except utils.ValidationError as e:
            e = '%s %s' % (e, image_validation_error_message_suffix)
            raise Exception(e)
        image_is_compressible = (
            file_format in feconf.COMPRESSIBLE_IMAGE_FORMATS)
        fs_services.save_original_and_compressed_versions_of_image(
            filename, feconf.ENTITY_TYPE_TOPIC, topic_id, image_file,
            'image', image_is_compressible)

    save_subtopic_page(
        feconf.MIGRATION_BOT_USER_ID, subtopic_page,
        'added SVG images for math tags.', change_list)


def get_subtopic_page_by_id(topic_id, subtopic_id, strict=True):
    """Returns a domain object representing a subtopic page.

    Args:
        topic_id: str. ID of the topic that the subtopic is a part of.
        subtopic_id: int. The id of the subtopic.
        strict: bool. Whether to fail noisily if no subtopic page with the given
            id exists in the datastore.

    Returns:
        SubtopicPage or None. The domain object representing a subtopic page
        with the given id, or None if it does not exist.
    """
    subtopic_page_id = subtopic_page_domain.SubtopicPage.get_subtopic_page_id(
        topic_id, subtopic_id)
    subtopic_page_model = topic_models.SubtopicPageModel.get(
        subtopic_page_id, strict=strict)
    if subtopic_page_model:
        subtopic_page = get_subtopic_page_from_model(subtopic_page_model)
        return subtopic_page
    else:
        return None


def get_subtopic_pages_with_ids(topic_id, subtopic_ids):
    """Returns a list of domain objects with given ids.

    Args:
        topic_id: str. ID of the topic that the subtopics belong to.
        subtopic_ids: list(int). The ids of the subtopics.

    Returns:
        list(SubtopicPage) or None. The list of domain objects representing the
        subtopic pages corresponding to given ids list or None if none exist.
    """
    subtopic_page_ids = []
    for subtopic_id in subtopic_ids:
        subtopic_page_ids.append(
            subtopic_page_domain.SubtopicPage.get_subtopic_page_id(
                topic_id, subtopic_id))
    subtopic_page_models = topic_models.SubtopicPageModel.get_multi(
        subtopic_page_ids)
    subtopic_pages = []
    for subtopic_page_model in subtopic_page_models:
        if subtopic_page_model is None:
            subtopic_pages.append(subtopic_page_model)
        else:
            subtopic_pages.append(
                get_subtopic_page_from_model(subtopic_page_model))
    return subtopic_pages


def get_subtopic_page_contents_by_id(topic_id, subtopic_id, strict=True):
    """Returns the page contents of a subtopic

    Args:
        topic_id: str. ID of the topic that the subtopic belong to.
        subtopic_id: int. The id of the subtopic.
        strict: bool. Whether to fail noisily if no subtopic page with the given
            id exists in the datastore.

    Returns:
        SubtopicPageContents or None: The page contents for a subtopic page,
        or None if subtopic page does not exist.
    """
    subtopic_page = get_subtopic_page_by_id(
        topic_id, subtopic_id, strict=strict)
    if subtopic_page is not None:
        return subtopic_page.page_contents
    else:
        return None


def save_subtopic_page(
        committer_id, subtopic_page, commit_message, change_list):
    """Validates a subtopic page and commits it to persistent storage. If
    successful, increments the version number of the incoming subtopic page
    domain object by 1.

    Args:
        committer_id: str. ID of the given committer.
        subtopic_page: SubtopicPage. The subtopic page domain object to be
            saved.
        commit_message: str. The commit message.
        change_list: list(SubtopicPageChange). List of changes applied to a
            subtopic page.

    Raises:
        Exception: Received invalid change list.
        Exception: The subtopic page model and the incoming subtopic page domain
            object have different version numbers.
    """
    if not change_list:
        raise Exception(
            'Unexpected error: received an invalid change list when trying to '
            'save topic %s: %s' % (subtopic_page.id, change_list))
    subtopic_page.validate()

    subtopic_page_model = topic_models.SubtopicPageModel.get(
        subtopic_page.id, strict=False)
    if subtopic_page_model is None:
        subtopic_page_model = topic_models.SubtopicPageModel(
            id=subtopic_page.id)
    else:
        if subtopic_page.version > subtopic_page_model.version:
            raise Exception(
                'Unexpected error: trying to update version %s of topic '
                'from version %s. Please reload the page and try again.'
                % (subtopic_page_model.version, subtopic_page.version))
        elif subtopic_page.version < subtopic_page_model.version:
            raise Exception(
                'Trying to update version %s of topic from version %s, '
                'which is too old. Please reload the page and try again.'
                % (subtopic_page_model.version, subtopic_page.version))

    subtopic_page_model.topic_id = subtopic_page.topic_id
    subtopic_page_model.page_contents = subtopic_page.page_contents.to_dict()
    subtopic_page_model.language_code = subtopic_page.language_code
    subtopic_page_model.page_contents_schema_version = (
        subtopic_page.page_contents_schema_version)
    change_dicts = [change.to_dict() for change in change_list]
    subtopic_page_model.commit(committer_id, commit_message, change_dicts)
    subtopic_page.version += 1


def delete_subtopic_page(
        committer_id, topic_id, subtopic_id, force_deletion=False):
    """Delete a topic summary model.

    Args:
        committer_id: str. The user who is deleting the subtopic page.
        topic_id: str. The ID of the topic that this subtopic belongs to.
        subtopic_id: int. ID of the subtopic which was removed.
        force_deletion: bool. If true, the subtopic page and its history are
            fully deleted and are unrecoverable. Otherwise, the subtopic page
            and all its history are marked as deleted, but the corresponding
            models are still retained in the datastore. This last option is the
            preferred one.
    """
    subtopic_page_id = subtopic_page_domain.SubtopicPage.get_subtopic_page_id(
        topic_id, subtopic_id)
    topic_models.SubtopicPageModel.get(subtopic_page_id).delete(
        committer_id, feconf.COMMIT_MESSAGE_SUBTOPIC_PAGE_DELETED,
        force_deletion=force_deletion)
