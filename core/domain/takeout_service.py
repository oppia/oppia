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

"""Functions to export the data of all user related models from a given
user_id.
"""

from __future__ import absolute_import   # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import re

from core.domain import takeout_domain
from core.domain import user_services
from core.platform import models
import feconf

(
    base_models, collection_models, email_models,
    exploration_models, feedback_models, topic_models,
    suggestion_models, user_models) = models.Registry.import_models(
        [models.NAMES.base_model, models.NAMES.collection, models.NAMES.email,
         models.NAMES.exploration, models.NAMES.feedback, models.NAMES.topic,
         models.NAMES.suggestion, models.NAMES.user])


def get_models_which_should_be_exported():
    """Returns list of models to export.

    Returns:
        list(datastore_services.Model). List of models whose data should be
        exported.
    """
    return [model_class for model_class in
            models.Registry.get_all_storage_model_classes()
            if base_models.EXPORT_POLICY.EXPORTED in
            model_class.get_export_policy().values()]


def export_data_for_user(user_id):
    """Exports selected models according to model defined export_data functions.

    Args:
        user_id: str. The user_id of the user whose data is being exported.

    Returns:
        dict. Dictionary containing all user data in the following format:
        {
            <MODEL_NAME>_data: <dict of data in format as specified by
                                model export policy>
        }.
    """
    user_settings = user_services.get_user_settings(user_id)
    if user_settings is not None and (
            user_settings.role == feconf.ROLE_ID_LEARNER):
        raise NotImplementedError(
            'Takeout for profile users is not yet supported.')
    exported_data = dict()
    models_to_export = get_models_which_should_be_exported()
    for model in models_to_export:
        split_name = re.findall('[A-Z][^A-Z]*', model.__name__)[:-1]
        # Join the split name with underscores and add _data for final name.
        final_name = ('_').join([x.lower() for x in split_name])
        exported_data[final_name] = model.export_data(user_id)

    # Separate out images. We store the images that need to be separated here
    # as a dictionary mapping tuples to strings. The tuple value indicates the
    # "path" to take to the image in the user's data dictionary, and the string
    # indicates the filename that the exported image will be saved to.
    replacement_instructions = [
        takeout_domain.TakeoutImageReplacementInstruction(
            ('user_settings', 'profile_picture_data_url'),
            'user_settings_profile_picture.png',
            'profile_picture_filename'
        )
    ]
    takeout_image_files = []
    for replacement_instruction in replacement_instructions:
        dictionary_path = replacement_instruction.dictionary_path
        replacement_filename = replacement_instruction.export_filename
        replacement_key = replacement_instruction.new_key

        # Move pointer to the position indicated by the tuple.
        pointer = exported_data
        for key in dictionary_path[:-1]:
            pointer = pointer[key]

        # Swap out data with replacement filename.
        image_key = dictionary_path[-1]
        image_data = pointer[image_key]
        if image_data is not None:
            takeout_image_files.append(
                takeout_domain.TakeoutImage(image_data, replacement_filename))
            pointer[image_key] = replacement_filename

        # Rename the key.
        pointer[replacement_key] = pointer.pop(image_key)

    return takeout_domain.TakeoutData(exported_data, takeout_image_files)
