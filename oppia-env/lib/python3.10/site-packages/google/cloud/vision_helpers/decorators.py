# Copyright 2017, Google LLC All rights reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from __future__ import absolute_import


def add_single_feature_methods(cls):
    """Custom decorator intended for :class:`~vision.helpers.VisionHelpers`.

    This metaclass adds a `{feature}` method for every feature
    defined on the Feature enum.
    """
    # Sanity check: This only makes sense if we are building the GAPIC
    # subclass and have Feature enums already attached.
    if not hasattr(cls, "Feature"):
        return cls

    # Add each single-feature method to the class.
    for feature in cls.Feature.Type:
        # Sanity check: Do not make a method for the falsy feature.
        if feature.name == "TYPE_UNSPECIFIED":
            continue

        # Assign the appropriate metadata to the function.
        detect = _create_single_feature_method(feature)

        # Assign a qualified name to the function, and perform module
        # replacement on the docstring.
        detect.__qualname__ = "{cls}.{name}".format(
            cls=cls.__name__, name=detect.__name__
        )
        detect.__doc__ = detect.__doc__.format(module=cls.__module__)

        # Place the function on the class being created.
        setattr(cls, detect.__name__, detect)

    # Done; return the class.
    return cls


def _create_single_feature_method(feature):
    """Return a function that will detect a single feature.

    Args:
        feature (enum): A specific feature defined as a member of
            :class:`~Feature.Type`.

    Returns:
        function: A helper function to detect just that feature.
    """
    # Define the function properties.
    fx_name = feature.name.lower()
    if "detection" in fx_name:
        fx_doc = "Perform {0}.".format(fx_name.replace("_", " "))
    else:
        fx_doc = "Return {desc} information.".format(desc=fx_name.replace("_", " "))

    # Provide a complete docstring with argument and return value
    # information.
    fx_doc += """

    Args:
        image (:class:`~.{module}.Image`): The image to analyze.
        max_results (int):
            Number of results to return, does not apply for
            TEXT_DETECTION, DOCUMENT_TEXT_DETECTION, or CROP_HINTS.
        retry (int): Number of retries to do before giving up.
        timeout (int): Number of seconds before timing out.
        metadata (Sequence[Tuple[str, str]]): Strings which should be
            sent along with the request as metadata.
        kwargs (dict): Additional properties to be set on the
            :class:`~.{module}.types.AnnotateImageRequest`.

    Returns:
        :class:`~.{module}.AnnotateImageResponse`: The API response.
    """

    # Get the actual feature value to send.
    feature_value = {"type_": feature}

    # Define the function to be returned.
    def inner(
        self,
        image,
        *,
        max_results=None,
        retry=None,
        timeout=None,
        metadata=(),
        **kwargs
    ):
        """Return a single feature annotation for the given image.

        Intended for use with functools.partial, to create the particular
        single-feature methods.
        """
        copied_features = feature_value.copy()
        if max_results is not None:
            copied_features["max_results"] = max_results
        request = dict(image=image, features=[copied_features], **kwargs)
        response = self.annotate_image(
            request, retry=retry, timeout=timeout, metadata=metadata
        )
        return response

    # Set the appropriate function metadata.
    inner.__name__ = fx_name
    inner.__doc__ = fx_doc

    # Return the final function.
    return inner
