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
import sys
import inspect

from core.platform import models

(
    base_model, collection_models, email_models, exploration_models, feedback_models,
    suggestion_models, user_models) = models.Registry.import_models([
        models.NAMES.base_model, models.NAMES.collection, models.NAMES.email, \
        models.NAMES.exploration, models.NAMES.feedback, models.NAMES.suggestion, 
        models.NAMES.user])


def export_data_for_user(user_id):
    """Exports selected models according to model defined export_data functions.

    Args:
        user_id: str. The user_id of the user whose data is being exported.

    Returns:
        dict. Dictionary containing all user data in the following format:
        {
            <MODEL_NAME>_data: <dict of data in format as specified by
                                model export policy>
        }
    """
    all_models = []
    model_names_list = [model_name for model_name in dir(models.NAMES) if not model_name.startswith('__') and not model_name == 'base_model']
    model_modules = models.Registry.import_models(model_names_list)
    for model_module in model_modules:
        for name, obj in inspect.getmembers(model_module):
            if inspect.isclass(obj):
                all_models.append(obj)

    # # Exclude the BaseModel.
    # print(all_models)
    # all_models.remove(base_model)

    exported_data = dict()
    for model in all_models:
        # Split the model name by uppercase characters.
        split_name = re.findall('[A-Z][^A-Z]*', model.__name__)[:-1]
        # Join the split name with underscores and add _data for final name.
        final_name = ('_').join([x.lower() for x in split_name]) + '_data'
        export_result = model.export_data(user_id)
        if export_result != None:
            exported_data[final_name] = model.export_data(user_id)

    # Combine the data into a single dictionary.
    return exported_data
