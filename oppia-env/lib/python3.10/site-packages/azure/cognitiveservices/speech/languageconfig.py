# Copyright (c) Microsoft. All rights reserved.
# See https://aka.ms/csspeech/license for the full license information.
"""
Classes that are concerned with the handling of language configurations
"""

import ctypes
from typing import List, Optional

from .interop import _Handle, _c_str, _call_hr_fn, _sdk_lib, _spx_handle


class SourceLanguageConfig():
    """
    Represents source language configuration, allowing specifying the source language and customized endpoint

    The configuration can be initialized in different ways:

    - from language: pass a language.
    - from language and custom endpoint: pass a language and an endpoint.

    :param language: The source language. The language is specified in BCP-47 format
    :param endpoint_id: The custom endpoint id
    """
    def __init__(self, language: str, endpoint_id: Optional[str] = None):
        handle = _spx_handle(0)
        if not language or language == "":
            raise ValueError("language cannot be an empty string")
        c_language = _c_str(language)
        if endpoint_id is None:
            _call_hr_fn(fn=_sdk_lib.source_lang_config_from_language, *[ctypes.byref(handle), c_language])
        else:
            if endpoint_id == "":
                raise ValueError("endpointId cannot be an empty string")
            c_endpoint = _c_str(endpoint_id)
            _call_hr_fn(fn=_sdk_lib.source_lang_config_from_language_and_endpointId, *[ctypes.byref(handle), c_language, c_endpoint])
        self.__handle = _Handle(handle, _sdk_lib.source_lang_config_is_handle_valid, _sdk_lib.source_lang_config_release)

    @property
    def _handle(self):
        return self.__handle.get()


class AutoDetectSourceLanguageConfig():
    """
    Represents auto detection source language configuration, allowing open range,
    specifying the potential source languages and corresponding customized endpoint

    The configuration can be initialized in different ways:

    - from open range: pass nothing, for source language auto detection in synthesis and multilingual translation.
    - from languages: pass a list of potential source languages, for source language auto detection in recognition.
    - from sourceLanguageConfigs: pass a list of source language configurations, for source language auto detection in recognition.

    :param languages: The list of potential source languages. The language is specified in BCP-47 format
    :param sourceLanguageConfigs: The list of source language configurations
    """
    def __init__(self, languages: Optional[List[str]] = None, sourceLanguageConfigs: Optional[List[SourceLanguageConfig]] = None):
        handle = _spx_handle(0)
        if languages is not None and sourceLanguageConfigs is not None:
            raise ValueError("languages and sourceLanguageConfigs cannot be both specified to create AutoDetectSourceLanguageConfig")
        if languages is not None:
            if len(languages) == 0:
                raise ValueError("languages list cannot be empty")
            languages_string = ",".join(languages)
            c_languages = _c_str(languages_string)
            _call_hr_fn(fn=_sdk_lib.create_auto_detect_source_lang_config_from_languages, *[ctypes.byref(handle), c_languages])
        elif sourceLanguageConfigs is not None:
            if len(sourceLanguageConfigs) == 0:
                raise ValueError("source language config list cannot be empty")
            first = True
            for config in sourceLanguageConfigs:
                if first:
                    first = False
                    _call_hr_fn(
                        fn=_sdk_lib.create_auto_detect_source_lang_config_from_source_lang_config,
                        *[ctypes.byref(handle), config._handle])
                else:
                    _call_hr_fn(
                        fn=_sdk_lib.add_source_lang_config_to_auto_detect_source_lang_config,
                        *[handle, config._handle])
        else:
            _call_hr_fn(fn=_sdk_lib.create_auto_detect_source_lang_config_from_open_range, *[ctypes.byref(handle)])
        self.__handle = _Handle(
            handle,
            _sdk_lib.auto_detect_source_lang_config_is_handle_valid,
            _sdk_lib.auto_detect_source_lang_config_release)

    @property
    def _handle(self):
        return self.__handle.get()
