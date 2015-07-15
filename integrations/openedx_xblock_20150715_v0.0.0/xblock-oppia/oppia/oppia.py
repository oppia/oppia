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

"""This XBlock embeds an instance of Oppia in the OpenEdX platform."""

import pkg_resources

from xblock.core import XBlock
from xblock.fields import Scope, Integer, String
from xblock.fragment import Fragment


class OppiaXBlock(XBlock):
    """
    An XBlock providing an embedded Oppia exploration.
    """

    # Note: These fields are defined on the class, and can be accessed in the
    # code as self.<fieldname>.

    oppiaid = String(
        help="ID of the Oppia exploration to embed",
        default=None,
        scope=Scope.content)
    src = String(
        help="Source URL of the site",
        default="https://www.oppia.org",
        scope=Scope.content)
    width = Integer(
        help="Width of the embedded exploration",
        default=700,
        scope=Scope.content)
    height = Integer(
        help="Height of the embedded exploration",
        default=500,
        scope=Scope.content)

    def resource_string(self, path):
        """Handy helper for getting resources from our kit."""
        data = pkg_resources.resource_string(__name__, path)
        return data.decode("utf8")

    def student_view(self, context=None):
        """
        The primary view of the OppiaXBlock, shown to students
        when viewing courses.
        """
        html = self.resource_string("static/html/oppia.html")
        frag = Fragment(html.format(self=self))
        frag.add_javascript_url(
            "//cdn.jsdelivr.net/oppia/0.0.1/oppia-player.min.js")
        frag.add_javascript(self.resource_string("static/js/oppia.js"))
        frag.initialize_js('OppiaXBlock')
        return frag

    def _log(self, message):
        """
        Logger for load, state transition and completion events.
        """
        pass

    @XBlock.json_handler
    def on_exploration_loaded(self, data, suffix=''):
        """Called when an exploration has loaded."""
        self._log('Exploration %s was loaded.' % self.oppiaid)

    @XBlock.json_handler
    def on_state_transition(self, data, suffix=''):
        """Called when a state transition in the exploration has occurred."""
        self._log(
            "Recording the following state transition for exploration %s: "
            "'%s' to '%s'" % (
                self.oppiaid, data['oldStateName'], data['newStateName']))

    @XBlock.json_handler
    def on_exploration_completed(self, data, suffix=''):
        """Called when the exploration has been completed."""
        self._log('Exploration %s has been completed.' % self.oppiaid)

    def studio_view(self, context):
        """
        Create a fragment used to display the edit view in the Studio.
        """
        html_str = pkg_resources.resource_string(
            __name__, "static/html/oppia_edit.html")
        oppiaid = self.oppiaid or ''
        frag = Fragment(unicode(html_str).format(
            oppiaid=oppiaid, src=self.src, width=self.width,
            height=self.height))

        js_str = pkg_resources.resource_string(
            __name__, "static/js/oppia_edit.js")
        frag.add_javascript(unicode(js_str))
        frag.initialize_js('OppiaXBlockEditor')

        return frag

    @XBlock.json_handler
    def studio_submit(self, data, suffix=''):
        """
        Called when submitting the form in Studio.
        """
        self.oppiaid = data.get('oppiaid')
        self.src = data.get('src')
        self.width = data.get('width')
        self.height = data.get('height')

        return {'result': 'success'}

    @staticmethod
    def workbench_scenarios():
        """A canned scenario for display in the workbench."""
        return [
            ("Oppia Embedding",
             """<vertical_demo>
                <oppia oppiaid="0" src="https://www.oppia.org" width="700" />
                </vertical_demo>
             """),
        ]
