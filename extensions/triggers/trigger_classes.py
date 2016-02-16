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

"""Base class for defining triggers.

Although this module is in extensions/, it is not provided as an extension
framework for third-party developers. This is because reacting to triggers
involves changes to core code.
"""

from extensions import domain


class BaseTrigger(object):
    """Base trigger definition class.

    This class is not meant to be user-editable. The only methods on it should
    be get()-type methods.
    """
    # Customization arg specifications for the trigger, including their
    # descriptions, schemas and default values. Overridden in subclasses.
    _customization_arg_specs = []

    @classmethod
    def get_trigger_type(cls):
        return cls.__name__

    @property
    def customization_arg_specs(self):
        return [
            domain.CustomizationArgSpec(**cas)
            for cas in self._customization_arg_specs]


class NthResubmission(BaseTrigger):
    """This trigger is invoked when an answer is submitted to the same state
    for the nth time in succession, and the destination that would result due
    to normal evaluation would cause a further loop-around to the same state.
    """
    _customization_arg_specs = [{
        'name': 'num_submits',
        'description': (
            'The number of submissions after which to react, if the last '
            'submission would result in a further loop-around'),
        'schema': {
            'type': 'int'
        },
        'default_value': 3,
    }]


class ClickButton(BaseTrigger):
    """The presence of this trigger adds a button to the UI. The trigger is
    invoked when the learner clicks this button.
    """
    _customization_arg_specs = [{
        'name': 'button_text',
        'description': 'The text of the button',
        'schema': {
            'type': 'unicode',
        },
        'default_value': 'Help, I\'m stuck',
    }]
