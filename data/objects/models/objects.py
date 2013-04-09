# Copyright 2013 Google Inc. All Rights Reserved.
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

"""Classes for interpreting typed objects in Oppia."""

__author__ = 'Sean Lip'

import feconf


class BaseObject(object):
    """Base object class.

    This is the superclass for typed object specifications in Oppia. Subclasses
    are named by concatenating the CamelCased object type and the string
    'Object'. Examples of valid names include VideoObject, ImageObject and
    Coord2DObject.

    Typed objects are initialized from a raw Python object which is expected to
    be derived from a JSON object. They are validated and normalized to basic
    Python objects (primitive types combined via lists and dicts).

    The object can be rendered in view mode and in edit mode. This is done using
    the render_view() and render_edit() methods, respectively. These methods can
    be overridden in subclasses.
    """

    # These values should be overridden in subclasses.
    description = ''
    icon_filename = ''
    view_html_filename = None
    edit_html_filename = None

    @classmethod
    def normalize(cls, raw):
        """Validates and normalizes a raw Python object.

        Returns:
          a normalized Python object describing the Object specified by this
          class.

        Raises:
          TypeError: if the Python object cannot be normalized.
        """
        raise NotImplementedError('Not implemented.')

    @classmethod
    def render_view(cls, data):
        """Renders a view-only version of the Object.

        The default implementation uses takes the Jinja template supplied in the
        class and renders against it. This template has autoescape=True turned
        on, so strings that are passed in will be escaped. The default
        implementation can be overwritten by subclasses -- but they are then
        responsible for ensuring that autoescaping takes place.

        Args:
          data: the normalized Python representation of the Object.
        """
        assert cls.view_html_filename, 'No view template specified.'
        return feconf.OBJECT_JINJA_ENV.get_template(
            '%s.html' % cls.view_html_filename).render({'data': data})

    @classmethod
    def render_edit(cls, frontend_name, data=None):
        """Renders an editable version of the Object.

        The default implementation assumes that there is an AngularJS variable
        named frontend_name with the same internal format as the normalized
        Python representation. In the implementation, a new variable named
        temp_[frontend_name] will be created.

        WARNING: IT IS THE CLIENT'S RESPONSIBILITY TO ENSURE THAT THERE IS NO
        VARIABLE CALLED temp_[frontend_name] IN THE FRONTEND. Usually, such a
        variable will not exist, by virtue of the standard JavaScript naming
        conventions.

        The default implementation is rendered using a template that enables
        autoescaping. If it is overwritten by a subclass, the subclass is
        responsible for ensuring that autoescaping takes place.

        Args:
          frontend_name: the name used for the data variable in the frontend.
          data: the normalized Python representation of the existing object.
              If it is None, an empty object is used.
        """
        # TODO(sll): Implement this (generically).
        raise NotImplementedError('Not implemented yet.')


class Int(BaseObject):
    """Integer object class."""

    description = 'An integer.'
    icon_filename = ''
    view_html_filename = 'int_view'
    edit_html_filename = None

    @classmethod
    def normalize(cls, raw):
        """Validates and normalizes a raw Python object."""
        try:
            return int(raw)
        except Exception:
            raise TypeError('Cannot convert to int: %s' % raw)

    @classmethod
    def render_edit(cls, frontend_name, data=None):
        """Renders an editable version of the Object."""
        # TODO(sll): Implement this.
        raise NotImplementedError('Not implemented yet.')
