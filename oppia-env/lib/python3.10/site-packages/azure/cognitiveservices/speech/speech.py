# Copyright (c) Microsoft. All rights reserved.
# See https://aka.ms/csspeech/license for the full license information.
"""
Classes related to recognizing text from speech, synthesizing speech from text, and general classes used in the various recognizers.
"""

import ctypes
from datetime import timedelta
import json

from typing import Optional, Dict, Callable, List

from .interop import (
    _CallbackContext, _Handle, LogLevel, _c_str, _call_bool_fn, _call_hr_fn, _sdk_lib,
    _spx_handle, max_uint32, _call_string_function_and_free, _trace_message, _unpack_context)
from .enums import (
    PropertyId, CancellationErrorCode, CancellationReason, OutputFormat, ProfanityOption,
    ServicePropertyChannel, SpeechSynthesisOutputFormat, NoMatchReason, ResultReason,
    SpeechSynthesisBoundaryType, SynthesisVoiceGender, SynthesisVoiceType, StreamStatus,
    PronunciationAssessmentGradingSystem, PronunciationAssessmentGranularity,
    SpeechSynthesisRequestInputType)
from .properties import PropertyCollection

from . import audio
from . import languageconfig


class SpeechConfig():
    """
    Class that defines configurations for speech / intent recognition and speech synthesis.

    The configuration can be initialized in different ways:

    - from subscription: pass a subscription key and a region
    - from endpoint: pass an endpoint. Subscription key or authorization token are optional.
    - from host: pass a host address. Subscription key or authorization token are optional.
    - from authorization token: pass an authorization token and a region

    :param subscription: The subscription key.
    :param region: The region name (see the `region page <https://aka.ms/csspeech/region>`_).
    :param endpoint: The service endpoint to connect to.
    :param host: The service host to connect to. Standard resource path will be assumed. Format
        is "protocol://host:port" where ":port" is optional.
    :param auth_token: The authorization token.
    :param speech_recognition_language: The input language to the speech recognition. The language
        is specified in BCP-47 format.
    """

    def __init__(self, subscription: Optional[str] = None, region: Optional[str] = None,
                 endpoint: Optional[str] = None, host: Optional[str] = None, auth_token: Optional[str] = None,
                 speech_recognition_language: Optional[str] = None):
        if endpoint is not None or host is not None:
            if region is not None:
                raise ValueError('cannot construct SpeechConfig with both region and endpoint or host information')
            if auth_token is not None:
                raise ValueError('cannot specify both auth_token and endpoint or host when constructing SpeechConfig. '
                                 'Set authorization token separately after creating SpeechConfig.')

        if region is not None and subscription is None and auth_token is None:
            raise ValueError('either subscription key or authorization token must be given along with a region')

        if subscription is not None and endpoint is None and host is None and region is None:
            raise ValueError('either endpoint, host, or region must be given along with a subscription key')

        generic_error_message = 'cannot construct SpeechConfig with the given arguments'
        c_subscription = _c_str(subscription)
        c_region = _c_str(region)
        handle = _spx_handle(0)
        if region is not None and subscription is not None:
            if endpoint is not None or host is not None or auth_token is not None:
                raise ValueError(generic_error_message)
            _call_hr_fn(fn=_sdk_lib.speech_config_from_subscription, *[ctypes.byref(handle), c_subscription, c_region])
        elif region is not None and auth_token is not None:
            if endpoint is not None or host is not None or subscription is not None:
                raise ValueError(generic_error_message)
            c_token = _c_str(auth_token)
            _call_hr_fn(fn=_sdk_lib.speech_config_from_authorization_token, *[ctypes.byref(handle), c_token, c_region])
        elif endpoint is not None:
            c_endpoint = _c_str(endpoint)
            _call_hr_fn(fn=_sdk_lib.speech_config_from_endpoint, *[ctypes.byref(handle), c_endpoint, c_subscription])
        elif host is not None:
            c_host = _c_str(host)
            _call_hr_fn(fn=_sdk_lib.speech_config_from_host, *[ctypes.byref(handle), c_host, c_subscription])
        else:
            raise ValueError(generic_error_message)
        self.__handle = _Handle(handle, _sdk_lib.speech_config_is_handle_valid, _sdk_lib.speech_config_release)
        prop_handle = _spx_handle(0)
        _call_hr_fn(fn=_sdk_lib.speech_config_get_property_bag, *[handle, ctypes.byref(prop_handle)])
        self._properties = PropertyCollection(prop_handle)
        self._properties.set_property_by_name("AZAC-SDK-PROGRAMMING-LANGUAGE", "Python")
        if speech_recognition_language is not None:
            self.speech_recognition_language = speech_recognition_language

    @property
    def _handle(self) -> _spx_handle:
        return self.__handle.get()

    def get_property(self, property_id: PropertyId) -> str:
        """
        Get a property by id.

        :param property_id: The id of the property to be retrieved.
        :returns: The value of the property.
        """
        if not isinstance(property_id, PropertyId):
            raise TypeError('property_id value must be PropertyId instance')
        return self._properties.get_property(property_id)

    def get_property_by_name(self, property_name: str) -> str:
        """
        Get a property by name.

        :param property_name: The name of the property to be retrieved.
        :returns: The value of the property.
        """
        if not isinstance(property_name, str):
            raise TypeError('property_name value must be str instance')
        return self._properties.get_property_by_name(property_name)

    def set_property(self, property_id: PropertyId, value: str):
        """
        Set a property by id.

        :param property_id: The id of the property to be set.
        :param value: The value to be set for the property.
        """
        if not isinstance(property_id, PropertyId):
            raise TypeError('property_id value must be PropertyId instance')
        self._properties.set_property(property_id, value)

    def set_property_by_name(self, property_name: str, value: str):
        """
        Set a property by name.

        :param property_name: The name of the property to be set.
        :param value: The value to be set for the property.
        """
        if not isinstance(property_name, str):
            raise TypeError('property_name value must be str instance')
        self._properties.set_property_by_name(property_name, value)

    def set_properties(self, properties: Dict[PropertyId, str]):
        """
        Set multiple properties by id.

        :param properties: A dict mapping property ids to the values to be set.
        """
        for property_id, value in properties.items():
            if not isinstance(property_id, PropertyId):
                raise TypeError('property_id value must be PropertyId instance')
            self._properties.set_property(property_id, value)

    def set_properties_by_name(self, properties: Dict[str, str]):
        """
        Set multiple properties by name.

        :param properties: A dict mapping property ids to the values to be set.
        """
        for property_name, value in properties.items():
            if not isinstance(property_name, str):
                raise TypeError('property_name value must be str instance')
            self._properties.set_property_by_name(property_name, value)

    @property
    def output_format(self) -> OutputFormat:
        """
        The output format (simple or detailed) of the speech recognition result.
        """
        result = self.get_property(PropertyId.SpeechServiceResponse_RequestDetailedResultTrueFalse)
        return OutputFormat.Detailed if result == "true" else OutputFormat.Simple

    @output_format.setter
    def output_format(self, format: OutputFormat):
        if not isinstance(format, OutputFormat):
            raise TypeError('wrong type, must be OutputFormat')
        value = "true" if format == OutputFormat.Detailed else "false"
        self.set_property(PropertyId.SpeechServiceResponse_RequestDetailedResultTrueFalse, value)

    @property
    def speech_recognition_language(self) -> str:
        """
        The name of spoken language to be recognized in BCP-47 format.
        """
        return self.get_property(PropertyId.SpeechServiceConnection_RecoLanguage)

    @speech_recognition_language.setter
    def speech_recognition_language(self, language: str):
        self.set_property(PropertyId.SpeechServiceConnection_RecoLanguage, language)

    @property
    def endpoint_id(self) -> str:
        """
        The endpoint id.
        """
        return self.get_property(PropertyId.SpeechServiceConnection_EndpointId)

    @endpoint_id.setter
    def endpoint_id(self, endpoint_id: str):
        self.set_property(PropertyId.SpeechServiceConnection_EndpointId, endpoint_id)

    @property
    def authorization_token(self) -> str:
        """
        The authorization token that will be used for connecting to the service.

        .. note::

          The caller needs to ensure that the authorization token is valid. Before the
          authorization token expires, the caller needs to refresh it by calling this setter with a
          new valid token. As configuration values are copied when creating a new recognizer, the
          new token value will not apply to recognizers that have already been created. For
          recognizers that have been created before, you need to set authorization token of the
          corresponding recognizer to refresh the token. Otherwise, the recognizers will encounter
          errors during recognition.
        """
        return self.get_property(PropertyId.SpeechServiceAuthorization_Token)

    @authorization_token.setter
    def authorization_token(self, authorization_token: str) -> None:
        self.set_property(PropertyId.SpeechServiceAuthorization_Token, authorization_token)

    @property
    def subscription_key(self) -> str:
        """
        The subscription key that was used to create the Recognizer.
        """
        return self.get_property(PropertyId.SpeechServiceConnection_Key)

    @property
    def region(self) -> str:
        """
        The region key that was used to create the Recognizer.
        """
        return self.get_property(PropertyId.SpeechServiceConnection_Region)

    def set_proxy(self, hostname: str, port: int, username: Optional[str] = None, password: Optional[str] = None):
        """
        Set proxy information.

        .. note::

            Proxy functionality is not available on macOS. This function will have no effect on
            this platform.

        :param hostname: The host name of the proxy server. Do not add protocol information (http)
            to the hostname.
        :param port: The port number of the proxy server.
        :param username: The user name of the proxy server.
        :param password: The password of the proxy server.
        """
        if hostname is None or len(hostname) == 0:
            raise ValueError("hostname is a required parameter")
        if port <= 0:
            raise ValueError("%d is not a valid port" % port)
        self.set_property(PropertyId.SpeechServiceConnection_ProxyHostName, hostname)
        self.set_property(PropertyId.SpeechServiceConnection_ProxyPort, str(port))
        if username:
            self.set_property(PropertyId.SpeechServiceConnection_ProxyUserName, username)
        if password:
            self.set_property(PropertyId.SpeechServiceConnection_ProxyPassword, password)

    @property
    def speech_synthesis_language(self) -> str:
        """
        Get speech synthesis language.
        """
        return self.get_property(PropertyId.SpeechServiceConnection_SynthLanguage)

    @speech_synthesis_language.setter
    def speech_synthesis_language(self, language: str):
        """
        Set speech synthesis language.

        :param language: The language for speech synthesis (e.g. en-US).
        """
        self.set_property(PropertyId.SpeechServiceConnection_SynthLanguage, language)

    @property
    def speech_synthesis_voice_name(self) -> str:
        """
        Get speech synthesis voice name.
        """
        return self.get_property(PropertyId.SpeechServiceConnection_SynthVoice)

    @speech_synthesis_voice_name.setter
    def speech_synthesis_voice_name(self, voice: str):
        """
        Set speech synthesis voice name.

        :param voice: The name of voice for speech synthesis.
        """
        self.set_property(PropertyId.SpeechServiceConnection_SynthVoice, voice)

    @property
    def speech_synthesis_output_format_string(self) -> str:
        """
        Get speech synthesis output audio format string.
        """
        return self.get_property(PropertyId.SpeechServiceConnection_SynthOutputFormat)

    def set_speech_synthesis_output_format(self, format_id: SpeechSynthesisOutputFormat):
        """
        Set speech synthesis output audio format.

        :param format_id: The audio format id, e.g. Riff16Khz16BitMonoPcm.
        """
        if not isinstance(format_id, SpeechSynthesisOutputFormat):
            raise TypeError('wrong type, must be SpeechSynthesisOutputFormat')
        _call_hr_fn(fn=_sdk_lib.speech_config_set_audio_output_format, *[self._handle, format_id.value])

    def set_service_property(self, name: str, value: str, channel: ServicePropertyChannel):
        """
        Sets a property value that will be passed to service using the specified channel.

        .. note::
          Added in version 1.5.0.

        :param name: The property name.
        :param value: The property value.
        :param channel: The channel used to pass the specified property to service.
        """
        if not isinstance(channel, ServicePropertyChannel):
            raise TypeError('wrong channel, must be ServicePropertyChannel')
        c_name = _c_str(name)
        c_value = _c_str(value)
        _call_hr_fn(fn=_sdk_lib.speech_config_set_service_property, *[self._handle, c_name, c_value, channel.value])

    def set_profanity(self, profanity_option: ProfanityOption) -> None:
        """
        Set the profanity option.

        .. note::
          Added in version 1.5.0.

        :param profanity_option: The profanity level to set.
        """
        if not isinstance(profanity_option, ProfanityOption):
            raise TypeError('bad option, must be ProfanityOption')
        _call_hr_fn(fn=_sdk_lib.speech_config_set_profanity, *[self._handle, profanity_option.value])

    def enable_audio_logging(self):
        """
        Enables audio logging in service.
        Audio and content logs are stored either in Microsoft-owned storage, or in your own storage account linked
        to your Cognitive Services subscription (Bring Your Own Storage (BYOS) enabled Speech resource).

        .. note::
          Added in version 1.5.0.

        """
        self.set_property(PropertyId.SpeechServiceConnection_EnableAudioLogging, "true")

    def request_word_level_timestamps(self):
        """
        Includes word level timestamps in response result.

        .. note::
          Added in version 1.5.0.

        """
        self.set_property(PropertyId.SpeechServiceResponse_RequestWordLevelTimestamps, "true")

    def enable_dictation(self):
        """
        Enables dictation. Only supported in speech continuous recognition.

        .. note::
          Added in version 1.5.0.

        """
        self.set_property(PropertyId.SpeechServiceConnection_RecoMode, "DICTATION")


class CancellationDetails():
    def __init__(self, result: "RecognitionResult"):
        c_reason = ctypes.c_int(0)
        c_code = ctypes.c_int(0)
        _call_hr_fn(fn=_sdk_lib.result_get_reason_canceled, *[result._handle, ctypes.byref(c_reason)])
        _call_hr_fn(fn=_sdk_lib.result_get_canceled_error_code, *[result._handle, ctypes.byref(c_code)])
        self.__reason = CancellationReason(c_reason.value)
        self.__code = CancellationErrorCode(c_code.value)
        self.__error_details = result._propbag.get_property(PropertyId.SpeechServiceResponse_JsonErrorDetails)

    @property
    def reason(self) -> CancellationReason:
        return self.__reason

    @property
    def code(self) -> CancellationErrorCode:
        return self.__code

    @property
    def error_details(self) -> str:
        return self.__error_details

    def __str__(self):
        return u'{}(reason={}, error_details="{}")'.format(type(self).__name__, self.reason, self.error_details)


class NoMatchDetails():
    def __init__(self, result_handle: _spx_handle):
        c_reason = ctypes.c_int(0)
        _call_hr_fn(fn=_sdk_lib.result_get_no_match_reason, *[result_handle, ctypes.byref(c_reason)])
        self.__reason = NoMatchReason(c_reason.value)

    @property
    def reason(self) -> NoMatchReason:
        return self.__reason

    def __str__(self):
        return u'{}(reason={})'.format(type(self).__name__, self.reason)


class RecognitionResult():
    """
    Detailed information about the result of a recognition operation.
    """

    def __init__(self, handle: _spx_handle):
        """
        Constructor for internal use.
        """
        self.__handle = _Handle(handle, _sdk_lib.recognizer_result_handle_is_valid, _sdk_lib.recognizer_result_handle_release)
        c_offset = ctypes.c_uint64(0)
        _call_hr_fn(fn=_sdk_lib.result_get_offset, *[handle, ctypes.byref(c_offset)])
        self._offset = int(c_offset.value)
        c_duration = ctypes.c_uint64(0)
        _call_hr_fn(fn=_sdk_lib.result_get_duration, *[handle, ctypes.byref(c_duration)])
        self._duration = int(c_duration.value)
        _c_string_buffer = ctypes.create_string_buffer(2048 + 1)
        _call_hr_fn(fn=_sdk_lib.result_get_result_id, *[handle, _c_string_buffer, 2048])
        self._result_id = _c_string_buffer.value.decode(encoding='utf-8')
        c_reason = ctypes.c_int(0)
        _call_hr_fn(fn=_sdk_lib.result_get_reason, *[handle, ctypes.byref(c_reason)])
        self._reason = ResultReason(c_reason.value)
        _call_hr_fn(fn=_sdk_lib.result_get_text, *[handle, _c_string_buffer, 2048])
        self._text = _c_string_buffer.value.decode(encoding='utf-8')
        properties_handle = _spx_handle(0)
        _call_hr_fn(fn=_sdk_lib.result_get_property_bag, *[handle, ctypes.byref(properties_handle)])
        properties = PropertyCollection(properties_handle)
        self._propbag = properties
        self._json = properties.get_property(PropertyId.SpeechServiceResponse_JsonResult)
        self._error_json = properties.get_property(PropertyId.SpeechServiceResponse_JsonErrorDetails)
        self._properties: Dict[PropertyId, str] = {}
        for property_id in PropertyId:
            value = properties.get_property(property_id)
            if value and len(value) > 0:
                self._properties[property_id] = value
        if self.reason == ResultReason.Canceled:
            self._cancellation_details = CancellationDetails(self)
        else:
            self._cancellation_details = None
        if self.reason == ResultReason.NoMatch:
            self._no_match_details = NoMatchDetails(self._handle)
        else:
            self._no_match_details = None

    @property
    def _handle(self) -> _spx_handle:
        return self.__handle.get()

    @property
    def cancellation_details(self) -> "CancellationDetails":
        """
        The reason why recognition was cancelled.

        Returns `None` if there was no cancellation.
        """
        return self._cancellation_details

    @property
    def no_match_details(self) -> "NoMatchDetails":
        """
        Detailed information for NoMatch recognition results.

        Returns `None` if there was a match found.
        """
        return self._no_match_details

    @property
    def offset(self) -> int:
        """
        Offset of the recognized speech in ticks. A single tick represents one hundred nanoseconds
        or one ten-millionth of a second.
        """
        return self._offset

    @property
    def duration(self) -> int:
        """
        Duration of recognized speech in ticks. A single tick represents one hundred
        nanoseconds or one ten-millionth of a second.
        """
        return self._duration

    @property
    def result_id(self) -> str:
        """
        Unique result id.
        """
        return self._result_id

    @property
    def reason(self) -> "ResultReason":
        """
        Recognition reason.
        """
        return self._reason

    @property
    def text(self) -> str:
        """
        Normalized text generated by a speech recognition engine from recognized input.
        """
        return self._text

    @property
    def json(self) -> str:
        """
        The bare JSON representation of the result from the Speech Service.
        """
        return self._json

    @property
    def error_json(self) -> str:
        """
        The bare JSON representation of the error from the Speech Service.
        """
        return self._error_json

    @property
    def properties(self) -> Dict[PropertyId, str]:
        """
        Other properties of the result.

        :returns: `dict` indexed with :py:class:`.PropertyId`, and `str` values.
        """
        return self._properties.copy()

    def __str__(self):
        return u'{}(result_id={}, text="{}", reason={})'.format(
            type(self).__name__, self.result_id, self.text, self.reason)


class SpeechRecognitionResult(RecognitionResult):
    """
    Base class for speech recognition results.
    """

    def __init__(self, handle: _spx_handle):
        """
        Constructor for internal use.
        """
        super().__init__(handle)


class ResultFuture():
    """
    The result of an asynchronous operation.
    """

    def __init__(self, async_handle, get_function: Callable[[_spx_handle], _spx_handle], wrapped_type):
        """
        private constructor
        """
        self._handle = async_handle
        self.__get_function = get_function
        self.__wrapped_type = wrapped_type
        self.__resolved = False

    def get(self):
        """
        Waits until the result is available, and returns it.
        """
        if not self.__resolved:
            result_handle = self.__get_function(self._handle)
            if self.__wrapped_type is not None:
                self.__result = self.__wrapped_type(result_handle)
            self.__resolved = True
        return self.__result if self.__wrapped_type is not None else None


class AutoDetectSourceLanguageResult():
    """
    Represents auto detection source language result.

    The result can be initialized from a speech recognition result.

    :param speechRecognitionResult: The speech recognition result
    """

    def __init__(self, speechRecognitionResult: SpeechRecognitionResult):
        self._language = speechRecognitionResult.properties.get(
            PropertyId.SpeechServiceConnection_AutoDetectSourceLanguageResult)

    @property
    def language(self) -> str:
        """
        The language value
        If this is None, it means the system fails to detect the source language automatically
        """
        return self._language


class EventSignal():
    """
    Clients can connect to the event signal to receive events, or disconnect from
    the event signal to stop receiving events.
    """

    def __init__(self, obj, connection_changed_callback):
        """
        Constructor for internal use.
        """
        self.__connection_callback = connection_changed_callback
        self.__callbacks = list()
        self.__handle = obj._handle
        self.__context = _CallbackContext(obj)
        self.__context_ptr = None

    def __del__(self):
        self.disconnect_all()

    @property
    def _context_ptr(self):
        if self.is_connected():
            if self.__context_ptr is None:
                self.__context_ptr = ctypes.py_object(self.__context)
            return self.__context_ptr
        return None

    def connect(self, callback: Callable):
        """
        Connects given callback function to the event signal, to be invoked when the
        event is signalled.
        """
        self.__callbacks.append(callback)
        if len(self.__callbacks) == 1:
            self.__connection_callback(self, self.__handle)

    def disconnect_all(self):
        """
        Disconnects all registered callbacks.
        """
        empty = len(self.__callbacks) == 0
        self.__callbacks.clear()
        if not empty:
            self.__connection_callback(self, self.__handle)

    def signal(self, payload):
        for cb in self.__callbacks:
            try:
                cb(payload)
            except BaseException as e:
                _trace_message(LogLevel.Error, "Callback raised exception", None, -1, f"Exception: {e}")

    def is_connected(self) -> bool:
        return len(self.__callbacks) > 0


class KeywordRecognitionModel():
    """
    Represents a keyword recognition model.

    :param filename: file name for the keyword recognition model.

    """

    def __init__(self, filename: Optional[str] = None):
        if filename is None:
            raise ValueError('filename needs to be provided')
        handle = _spx_handle(0)
        c_filename = _c_str(filename)
        _call_hr_fn(fn=_sdk_lib.keyword_recognition_model_create_from_file, *[c_filename, ctypes.byref(handle)])
        self.__handle = _Handle(
            handle,
            _sdk_lib.keyword_recognition_model_handle_is_valid,
            _sdk_lib.keyword_recognition_model_handle_release)

    @property
    def _handle(self) -> _spx_handle:
        return self.__handle.get()


class Recognizer():
    """
    Base class for different recognizers
    """

    def __init__(self, handle: _spx_handle):
        self.__handle = _Handle(handle, _sdk_lib.recognizer_handle_is_valid, _sdk_lib.recognizer_handle_release)
        prop_handle = _spx_handle(0)
        _call_hr_fn(fn=_sdk_lib.recognizer_get_property_bag, *[handle, ctypes.byref(prop_handle)])
        self.__properties = PropertyCollection(prop_handle)
        pass

    def __del__(self):
        def clean_signal(signal: EventSignal):
            if signal is not None:
                signal.disconnect_all()
        clean_signal(self.__session_started_signal)
        clean_signal(self.__session_stopped_signal)
        clean_signal(self.__speech_start_detected_signal)
        clean_signal(self.__speech_end_detected_signal)

    @property
    def _handle(self) -> _spx_handle:
        return self.__handle.get()

    @property
    def properties(self) -> PropertyCollection:
        """
        A collection of properties and their values defined for this Recognizer.
        """
        return self.__properties

    @property
    def endpoint_id(self) -> str:
        """
        The endpoint ID of a customized speech model that is used for recognition, or a custom voice model for speech synthesis.
        """
        return self.__properties.get_property(PropertyId.SpeechServiceConnection_EndpointId)

    @property
    def authorization_token(self) -> str:
        """
        The authorization token that will be used for connecting to the service.

        .. note::
          The caller needs to ensure that the authorization token is valid. Before the
          authorization token expires, the caller needs to refresh it by calling this setter with a
          new valid token. Otherwise, the recognizer will encounter errors during recognition.
        """
        return self.__properties.get_property(PropertyId.SpeechServiceAuthorization_Token)

    @authorization_token.setter
    def authorization_token(self, authorization_token: str):
        self.__properties.set_property(PropertyId.SpeechServiceAuthorization_Token, authorization_token)

    def recognize_once(self) -> SpeechRecognitionResult:
        """
        Performs recognition in a blocking (synchronous) mode. Returns after a single utterance is
        recognized. The end of a single utterance is determined by listening for silence at the end
        or until a maximum of about 30 seconds of audio is processed. The task returns the recognition
        text as result. For long-running multi-utterance recognition, use
        :py:meth:`.start_continuous_recognition_async` instead.

        :returns: The result value of the synchronous recognition.
        """
        raise NotImplementedError  # implemented in derived class

    def recognize_once_async(self) -> ResultFuture:
        """
        Performs recognition in a non-blocking (asynchronous) mode. This will recognize a single
        utterance. The end of a single utterance is determined by listening for silence at the end
        or until a maximum of about 30 seconds of audio is processed. For long-running multi-utterance
        recognition, use :py:meth:`.start_continuous_recognition_async` instead.

        :returns: A future containing the result value of the asynchronous recognition.
        """
        raise NotImplementedError  # implemented in derived class

    def start_continuous_recognition_async(self):
        """
        Asynchronously initiates continuous recognition operation. User has to connect to
        EventSignal to receive recognition results. Call
        :py:meth:`.stop_continuous_recognition_async` to stop the recognition.

        :returns: A future that is fulfilled once recognition has been initialized.
        """
        raise NotImplementedError

    def stop_continuous_recognition_async(self):
        """
        Asynchronously terminates ongoing continuous recognition operation.

        :returns: A future that is fulfilled once recognition has been stopped.
        """
        raise NotImplementedError

    def start_continuous_recognition(self):
        """
        Synchronously initiates continuous recognition operation. User has to connect to
        EventSignal to receive recognition results. Call
        :py:meth:`.stop_continuous_recognition_async` to stop the recognition.
        """
        return self.start_continuous_recognition_async().get()

    def stop_continuous_recognition(self):
        """
        Synchronously terminates ongoing continuous recognition operation.
        """
        return self.stop_continuous_recognition_async().get()

    def start_keyword_recognition_async(self, model: KeywordRecognitionModel):
        """
        Asynchronously configures the recognizer with the given keyword model. After calling this method, the recognizer is listening
        for the keyword to start the recognition. Call stop_keyword_recognition_async() to end the keyword initiated recognition.

        :param model: the keyword recognition model that specifies the keyword to be recognized.

        :returns: A future that is fulfilled once recognition has been initialized.
        """
        return NotImplementedError

    def stop_keyword_recognition_async(self):
        """
        Asynchronously ends the keyword initiated recognition.

        :returns: A future that is fulfilled once recognition has been stopped.
        """
        return NotImplementedError

    def start_keyword_recognition(self, model: KeywordRecognitionModel):
        """
        Synchronously configures the recognizer with the given keyword model. After calling this method, the recognizer is listening
        for the keyword to start the recognition. Call stop_keyword_recognition() to end the keyword initiated recognition.

        :param model: the keyword recognition model that specifies the keyword to be recognized.
        """
        return self.start_keyword_recognition_async(model).get()

    def stop_keyword_recognition(self):
        """
        Synchronously ends the keyword initiated recognition.
        """
        return self.stop_keyword_recognition_async().get()

    __session_started_signal = None

    @property
    def session_started(self) -> EventSignal:
        """
        Signal for events indicating the start of a recognition session (operation).

        Callbacks connected to this signal are called with a :class:`.SessionEventArgs` instance as
        the single argument.
        """
        def session_started_connection(signal: EventSignal, handle: _spx_handle):
            callback = Recognizer.__session_started_callback if signal.is_connected() else None
            _sdk_lib.recognizer_session_started_set_callback(handle, callback, signal._context_ptr)
        if self.__session_started_signal is None:
            self.__session_started_signal = EventSignal(self, session_started_connection)
        return self.__session_started_signal

    @ctypes.CFUNCTYPE(None, _spx_handle, _spx_handle, ctypes.c_void_p)
    def __session_started_callback(reco_handle: _spx_handle, event_handle: _spx_handle, context: ctypes.c_void_p):
        event_handle = _spx_handle(event_handle)
        obj = _unpack_context(context)
        if obj is not None:
            event = SessionEventArgs(event_handle)
            obj.__session_started_signal.signal(event)

    __session_stopped_signal = None

    @property
    def session_stopped(self) -> EventSignal:
        """
        Signal for events indicating the end of a recognition session (operation).

        Callbacks connected to this signal are called with a :class:`.SessionEventArgs` instance as
        the single argument.
        """
        def session_stopped_connection(signal: EventSignal, handle: _spx_handle):
            callback = Recognizer.__session_stopped_callback if signal.is_connected() else None
            _sdk_lib.recognizer_session_stopped_set_callback(handle, callback, signal._context_ptr)
        if self.__session_stopped_signal is None:
            self.__session_stopped_signal = EventSignal(self, session_stopped_connection)
        return self.__session_stopped_signal

    @ctypes.CFUNCTYPE(None, _spx_handle, _spx_handle, ctypes.c_void_p)
    def __session_stopped_callback(reco_handle: _spx_handle, event_handle: _spx_handle, context: ctypes.c_void_p):
        event_handle = _spx_handle(event_handle)
        obj = _unpack_context(context)
        if obj is not None:
            event = SessionEventArgs(event_handle)
            obj.__session_stopped_signal.signal(event)

    __speech_start_detected_signal = None

    @property
    def speech_start_detected(self) -> EventSignal:
        """
        Signal for events indicating the start of speech.

        Callbacks connected to this signal are called with a :class:`.RecognitionEventArgs`
        instance as the single argument.
        """
        def speech_start_detected_connection(signal: EventSignal, handle: _spx_handle):
            callback = Recognizer.__speech_start_detected_callback if signal.is_connected() else None
            _sdk_lib.recognizer_speech_start_detected_set_callback(handle, callback, signal._context_ptr)
            pass
        if self.__speech_start_detected_signal is None:
            self.__speech_start_detected_signal = EventSignal(self, speech_start_detected_connection)
        return self.__speech_start_detected_signal

    @ctypes.CFUNCTYPE(None, _spx_handle, _spx_handle, ctypes.c_void_p)
    def __speech_start_detected_callback(reco_handle: _spx_handle, event_handle: _spx_handle, context: ctypes.c_void_p):
        event_handle = _spx_handle(event_handle)
        obj = _unpack_context(context)
        if obj is not None:
            event = RecognitionEventArgs(event_handle)
            obj.__speech_start_detected_signal.signal(event)

    __speech_end_detected_signal = None

    @property
    def speech_end_detected(self) -> EventSignal:
        """
        Signal for events indicating the end of speech.

        Callbacks connected to this signal are called with a :class:`.RecognitionEventArgs`
        instance as the single argument.
        """
        def speech_end_detected_connection(signal: EventSignal, handle: _spx_handle):
            callback = Recognizer.__speech_end_detected_callback if signal.is_connected() else None
            _sdk_lib.recognizer_speech_end_detected_set_callback(handle, callback, signal._context_ptr)
            pass
        if self.__speech_end_detected_signal is None:
            self.__speech_end_detected_signal = EventSignal(self, speech_end_detected_connection)
        return self.__speech_end_detected_signal

    @ctypes.CFUNCTYPE(None, _spx_handle, _spx_handle, ctypes.c_void_p)
    def __speech_end_detected_callback(reco_handle: _spx_handle, event_handle: _spx_handle, context: ctypes.c_void_p):
        event_handle = _spx_handle(event_handle)
        obj = _unpack_context(context)
        if obj is not None:
            event = RecognitionEventArgs(event_handle)
            obj.__speech_end_detected_signal.signal(event)

    @property
    def recognizing(self) -> EventSignal:
        """
        Signal for events containing intermediate recognition results.

        Callbacks connected to this signal are called with a :class:`.SpeechRecognitionEventArgs`,
        :class:`.TranslationRecognitionEventArgs` or :class:`.IntentRecognitionEventArgs` instance
        as the single argument, dependent on the type of recognizer.
        """
        raise NotImplementedError  # implemented in derived class

    @property
    def recognized(self) -> EventSignal:
        """
        Signal for events containing final recognition results (indicating a successful
        recognition attempt).

        Callbacks connected to this signal are called with a :class:`.SpeechRecognitionEventArgs`,
        :class:`.TranslationRecognitionEventArgs` or :class:`.IntentRecognitionEventArgs` instance
        as the single argument, dependent on the type of recognizer.
        """
        raise NotImplementedError  # implemented in derived class

    @property
    def canceled(self) -> EventSignal:
        """
        Signal for events containing canceled recognition results (indicating a recognition attempt
        that was canceled as a result or a direct cancellation request or, alternatively, a
        transport or protocol failure).

        Callbacks connected to this signal are called with a
        :class:`.SpeechRecognitionCanceledEventArgs`,
        :class:`.TranslationRecognitionCanceledEventArgs` or
        :class:`.IntentRecognitionCanceledEventArgs` instance as the single argument, dependent on
        the type of recognizer.
        """
        raise NotImplementedError  # implemented in derived class


class SpeechRecognizer(Recognizer):
    """
    A speech recognizer.
    If you need to specify source language information, please only specify one of these three parameters,
    language, source_language_config or auto_detect_source_language_config.

    :param speech_config: The config for the speech recognizer
    :param audio_config: The config for the audio input
    :param language: The source language
    :param source_language_config: The source language config
    :param auto_detect_source_language_config: The auto detection source language config
    """

    def __init__(self,
                 speech_config: SpeechConfig,
                 audio_config: Optional[audio.AudioConfig] = None,
                 language: Optional[str] = None,
                 source_language_config: Optional[languageconfig.SourceLanguageConfig] = None,
                 auto_detect_source_language_config: Optional[languageconfig.AutoDetectSourceLanguageConfig] = None):
        if not isinstance(speech_config, SpeechConfig):
            raise ValueError('speech_config must be a SpeechConfig instance')
        languageConfigNum = 0
        if language is not None:
            if language == "":
                raise ValueError('language cannot be an empty string')
            languageConfigNum = languageConfigNum + 1
        if source_language_config is not None:
            languageConfigNum = languageConfigNum + 1
        if auto_detect_source_language_config is not None:
            languageConfigNum = languageConfigNum + 1
        if languageConfigNum > 1:
            raise ValueError('cannot construct SpeechRecognizer with more than one language configurations, '
                             'please only specify one of these three parameters: language, '
                             'source_language_config or auto_detect_source_language_config')
        handle = _spx_handle(0)
        audio_config_handle = audio_config._handle if audio_config is not None else None
        if language is None and source_language_config is None and auto_detect_source_language_config is None:
            _call_hr_fn(
                fn=_sdk_lib.recognizer_create_speech_recognizer_from_config,
                *[ctypes.byref(handle), speech_config._handle, audio_config_handle])
        elif language is not None:
            source_language_config = languageconfig.SourceLanguageConfig(language)
            _call_hr_fn(
                fn=_sdk_lib.recognizer_create_speech_recognizer_from_source_lang_config,
                *[ctypes.byref(handle), speech_config._handle, source_language_config._handle, audio_config_handle])
        elif source_language_config is not None:
            _call_hr_fn(
                fn=_sdk_lib.recognizer_create_speech_recognizer_from_source_lang_config,
                *[ctypes.byref(handle), speech_config._handle, source_language_config._handle, audio_config_handle])
        else:
            # auto_detect_source_language_config must not be None if we arrive this code
            _call_hr_fn(
                fn=_sdk_lib.recognizer_create_speech_recognizer_from_auto_detect_source_lang_config,
                *[ctypes.byref(handle), speech_config._handle, auto_detect_source_language_config._handle, audio_config_handle])
        super().__init__(handle)

    def __del__(self):
        def clean_signal(signal: EventSignal):
            if signal is not None:
                signal.disconnect_all()
        clean_signal(self.__recognizing_signal)
        clean_signal(self.__recognized_signal)
        clean_signal(self.__canceled_signal)
        super(type(self), self).__del__()

    def recognize_once(self) -> SpeechRecognitionResult:
        """
        Performs recognition in a blocking (synchronous) mode. Returns after a single utterance is
        recognized. The end of a single utterance is determined by listening for silence at the end
        or until a maximum of about 30 seconds of audio is processed. The task returns the recognition
        text as result. For long-running multi-utterance recognition, use
        :py:meth:`.start_continuous_recognition_async` instead.

        :returns: The result value of the synchronous recognition.
        """
        return self.recognize_once_async().get()

    def recognize_once_async(self) -> ResultFuture:
        """
        Performs recognition in a non-blocking (asynchronous) mode. This will recognize a single
        utterance. The end of a single utterance is determined by listening for silence at the end
        or until a maximum of about 30 seconds of audio is processed. For long-running multi-utterance
        recognition, use :py:meth:`.start_continuous_recognition_async` instead.

        :returns: A future containing the result value of the asynchronous recognition.
        """
        async_handle = _spx_handle(0)
        _call_hr_fn(fn=_sdk_lib.recognizer_recognize_once_async, *[self._handle, ctypes.byref(async_handle)])

        def resolve_future(handle: _spx_handle):
            result_handle = _spx_handle(0)
            _call_hr_fn(fn=_sdk_lib.recognizer_recognize_once_async_wait_for, *[handle, max_uint32, ctypes.byref(result_handle)])
            _sdk_lib.recognizer_async_handle_release(handle)
            return result_handle
        return ResultFuture(async_handle, resolve_future, SpeechRecognitionResult)

    def start_continuous_recognition_async(self) -> ResultFuture:
        """
        Asynchronously initiates continuous recognition operation. User has to connect to
        EventSignal to receive recognition results. Call
        :py:meth:`.stop_continuous_recognition_async` to stop the recognition.

        :returns: A future that is fulfilled once recognition has been initialized.
        """
        async_handle = _spx_handle(0)
        _call_hr_fn(fn=_sdk_lib.recognizer_start_continuous_recognition_async, *[self._handle, ctypes.byref(async_handle)])

        def resolve_future(handle: _spx_handle):
            _call_hr_fn(fn=_sdk_lib.recognizer_start_continuous_recognition_async_wait_for, *[handle, max_uint32])
            _sdk_lib.recognizer_async_handle_release(handle)
            return None
        return ResultFuture(async_handle, resolve_future, None)

    def stop_continuous_recognition_async(self):
        """
        Asynchronously terminates ongoing continuous recognition operation.

        :returns: A future that is fulfilled once recognition has been stopped.
        """
        async_handle = _spx_handle(0)
        _call_hr_fn(fn=_sdk_lib.recognizer_stop_continuous_recognition_async, *[self._handle, ctypes.byref(async_handle)])

        def resolve_future(handle: _spx_handle):
            _call_hr_fn(fn=_sdk_lib.recognizer_stop_continuous_recognition_async_wait_for, *[handle, max_uint32])
            _sdk_lib.recognizer_async_handle_release(handle)
            return None
        return ResultFuture(async_handle, resolve_future, None)

    def start_keyword_recognition_async(self, model: KeywordRecognitionModel) -> ResultFuture:
        """
        Asynchronously configures the recognizer with the given keyword model. After calling this method, the recognizer is listening
        for the keyword to start the recognition. Call stop_keyword_recognition_async() to end the keyword initiated recognition.

        :param model: the keyword recognition model that specifies the keyword to be recognized.

        :returns: A future that is fulfilled once recognition has been initialized.
        """
        async_handle = _spx_handle(0)
        _call_hr_fn(fn=_sdk_lib.recognizer_start_keyword_recognition_async, *[self._handle, model._handle, ctypes.byref(async_handle)])

        def resolve_future(handle: _spx_handle):
            _call_hr_fn(fn=_sdk_lib.recognizer_start_keyword_recognition_async_wait_for, *[handle, max_uint32])
            _sdk_lib.recognizer_async_handle_release(handle)
            return None
        return ResultFuture(async_handle, resolve_future, None)

    def stop_keyword_recognition_async(self):
        """
        Asynchronously ends the keyword initiated recognition.

        :returns: A future that is fulfilled once recognition has been stopped.
        """
        async_handle = _spx_handle(0)
        _call_hr_fn(fn=_sdk_lib.recognizer_stop_keyword_recognition_async, *[self._handle, ctypes.byref(async_handle)])

        def resolve_future(handle: _spx_handle):
            _call_hr_fn(fn=_sdk_lib.recognizer_stop_keyword_recognition_async_wait_for, *[handle, max_uint32])
            _sdk_lib.recognizer_async_handle_release(handle)
            return None
        return ResultFuture(async_handle, resolve_future, None)

    __recognizing_signal = None

    @property
    def recognizing(self) -> EventSignal:
        """
        Signal for events containing intermediate recognition results.

        Callbacks connected to this signal are called with a :class:`.SpeechRecognitionEventArgs`
        instance as the single argument.
        """
        def recognizing_connection(signal: EventSignal, handle: _spx_handle):
            callback = SpeechRecognizer.__recognizing_callback if signal.is_connected() else None
            _sdk_lib.recognizer_recognizing_set_callback(handle, callback, signal._context_ptr)
        if self.__recognizing_signal is None:
            self.__recognizing_signal = EventSignal(self, recognizing_connection)
        return self.__recognizing_signal

    @ctypes.CFUNCTYPE(None, _spx_handle, _spx_handle, ctypes.c_void_p)
    def __recognizing_callback(reco_handle: _spx_handle, event_handle: _spx_handle, context: ctypes.c_void_p):
        event_handle = _spx_handle(event_handle)
        obj = _unpack_context(context)
        if obj is not None:
            event = SpeechRecognitionEventArgs(event_handle)
            obj.__recognizing_signal.signal(event)

    __recognized_signal = None

    @property
    def recognized(self) -> EventSignal:
        """
        Signal for events containing final recognition results (indicating a successful
        recognition attempt).

        Callbacks connected to this signal are called with a :class:`.SpeechRecognitionEventArgs`
        instance as the single argument, dependent on the type of recognizer.
        """
        def recognized_connection(signal: EventSignal, handle: _spx_handle):
            callback = SpeechRecognizer.__recognized_callback if signal.is_connected() else None
            _sdk_lib.recognizer_recognized_set_callback(handle, callback, signal._context_ptr)
        if self.__recognized_signal is None:
            self.__recognized_signal = EventSignal(self, recognized_connection)
        return self.__recognized_signal

    @ctypes.CFUNCTYPE(None, _spx_handle, _spx_handle, ctypes.c_void_p)
    def __recognized_callback(reco_handle: _spx_handle, event_handle: _spx_handle, context: ctypes.c_void_p):
        event_handle = _spx_handle(event_handle)
        obj = _unpack_context(context)
        if obj is not None:
            event = SpeechRecognitionEventArgs(event_handle)
            obj.__recognized_signal.signal(event)

    __canceled_signal = None

    @property
    def canceled(self) -> EventSignal:
        """
        Signal for events containing canceled recognition results (indicating a recognition attempt
        that was canceled as a result or a direct cancellation request or, alternatively, a
        transport or protocol failure).

        Callbacks connected to this signal are called with a
        :class:`.SpeechRecognitionCanceledEventArgs`, instance as the single argument.
        """
        def canceled_connection(signal: EventSignal, handle: _spx_handle):
            callback = SpeechRecognizer.__canceled_callback if signal.is_connected() else None
            _sdk_lib.recognizer_canceled_set_callback(handle, callback, signal._context_ptr)
        if self.__canceled_signal is None:
            self.__canceled_signal = EventSignal(self, canceled_connection)
        return self.__canceled_signal

    @ctypes.CFUNCTYPE(None, _spx_handle, _spx_handle, ctypes.c_void_p)
    def __canceled_callback(reco_handle: _spx_handle, event_handle: _spx_handle, context: ctypes.c_void_p):
        event_handle = _spx_handle(event_handle)
        obj = _unpack_context(context)
        if obj is not None:
            event = SpeechRecognitionCanceledEventArgs(event_handle)
            obj.__canceled_signal.signal(event)


class SessionEventArgs():
    """
    Base class for session event arguments.
    """

    def __init__(self, handle: _spx_handle):
        """
        Constructor for internal use.
        """
        self.__handle = _Handle(handle, _sdk_lib.recognizer_event_handle_is_valid, _sdk_lib.recognizer_event_handle_release)
        string_buffer = ctypes.create_string_buffer(37)
        _call_hr_fn(fn=_sdk_lib.recognizer_session_event_get_session_id, *[self._handle, string_buffer, ctypes.c_uint32(37)])
        self._session_id = string_buffer.value.decode(encoding='utf-8')

    @property
    def _handle(self):
        return self.__handle.get()

    @property
    def session_id(self) -> str:
        """
        Session identifier (a GUID in string format).
        """
        return self._session_id

    def __str__(self):
        return u'{}(session_id={})'.format(type(self).__name__, self.session_id)


class ConnectionEventArgs(SessionEventArgs):
    """
    Provides data for the ConnectionEvent.

    .. note::
      Added in version 1.2.0
    """

    def __init__(self, handle: _spx_handle):
        """
        Constructor for internal use.
        """
        super().__init__(handle)


class RecognitionEventArgs(SessionEventArgs):
    """
    Provides data for the RecognitionEvent.
    """

    def __init__(self, handle: _spx_handle):
        """
        Constructor for internal use.
        """
        super().__init__(handle)
        c_offset = ctypes.c_uint64(0)
        _call_hr_fn(fn=_sdk_lib.recognizer_recognition_event_get_offset, *[self._handle, ctypes.byref(c_offset)])
        self._offset = int(c_offset.value)

    @property
    def offset(self) -> int:
        """
        The offset of the recognition event in ticks. A single tick represents one hundred
        nanoseconds or one ten-millionth of a second.
        """
        return self._offset


class SpeechRecognitionEventArgs(RecognitionEventArgs):
    """
    Class for speech recognition event arguments.
    """

    def __init__(self, handle: _spx_handle):
        """
        Constructor for internal use.
        """
        super().__init__(handle)
        result_handle = _spx_handle(0)
        _call_hr_fn(fn=_sdk_lib.recognizer_recognition_event_get_result, *[self._handle, ctypes.byref(result_handle)])
        self._result = SpeechRecognitionResult(result_handle)

    @property
    def result(self) -> SpeechRecognitionResult:
        """
        Speech recognition event result.
        """
        return self._result

    def __str__(self):
        return u'{}(session_id={}, result={})'.format(type(self).__name__, self.session_id, self.result)


class SpeechRecognitionCanceledEventArgs(SpeechRecognitionEventArgs):
    """
    Class for speech recognition canceled event arguments.
    """

    def __init__(self, handle: _spx_handle):
        """
        Constructor for internal use.
        """
        super().__init__(handle)
        self._cancellation_details = CancellationDetails(self.result)

    @property
    def cancellation_details(self) -> CancellationDetails:
        """
        The reason why recognition was cancelled.

        Returns `None` if there was no cancellation.
        """
        return self._cancellation_details


class GrammarPhrase():
    """
    Represents a phrase that may be spoken by the user.
    """

    def __init__(self, text: str):
        """
        Creates a grammar phrase using the specified phrase text.

        :param text: The text representing a phrase that may be spoken by the user.
        """
        handle = _spx_handle(0)
        c_text = _c_str(text)
        _call_hr_fn(fn=_sdk_lib.grammar_phrase_create_from_text, *[ctypes.byref(handle), c_text])
        self.__handle = _Handle(handle, _sdk_lib.grammar_phrase_handle_is_valid, _sdk_lib.grammar_phrase_handle_release)

    @property
    def _handle(self):
        return self.__handle.get()


class PhraseListGrammar():
    """
    Class that allows runtime addition of phrase hints to aid in speech recognition.

    Phrases added to the recognizer are effective at the start of the next recognition, or the next
    time the speech recognizer must reconnect to the speech service.

    .. note::
        Added in version 1.5.0.

    """

    @classmethod
    def from_recognizer(cls, recognizer: Recognizer) -> 'PhraseListGrammar':
        """
        Gets the :class:`.PhraseListGrammar` instance from the specified recognizer.
        """
        return cls(recognizer)

    def __init__(self, recognizer: Recognizer):
        """
        Constructor for internal use.
        """
        handle = _spx_handle(0)
        _call_hr_fn(fn=_sdk_lib.phrase_list_grammar_from_recognizer_by_name, *[ctypes.byref(handle), recognizer._handle, b""])
        self.__handle = _Handle(handle, _sdk_lib.grammar_handle_is_valid, _sdk_lib.grammar_handle_release)

    @property
    def _handle(self):
        return self.__handle.get()

    def addPhrase(self, phrase: str):
        """
        Adds a single phrase to the current recognizer.
        """
        grammar_phrase = GrammarPhrase(phrase)
        _call_hr_fn(fn=_sdk_lib.phrase_list_grammar_add_phrase, *[self._handle, grammar_phrase._handle])

    def clear(self):
        """
        Clears all phrases from the current recognizer.
        """
        _call_hr_fn(fn=_sdk_lib.phrase_list_grammar_clear, *[self._handle])


class SpeechSynthesisCancellationDetails():
    """
    Contains detailed information about why a result was canceled.
    """

    def __init__(self, result: Optional["SpeechSynthesisResult"] = None, stream: Optional["AudioDataStream"] = None):
        if result is not None and stream is not None:
            raise ValueError("Can't build with both a result and a stream.")
        if result is None and stream is None:
            raise ValueError("Need to provide a result or a stream.")
        if result is not None:
            out_enum = ctypes.c_int(0)
            _call_hr_fn(fn=_sdk_lib.synth_result_get_reason_canceled, *[result._handle, ctypes.byref(out_enum)])
            self.__reason = CancellationReason(out_enum.value)
            _call_hr_fn(fn=_sdk_lib.synth_result_get_canceled_error_code, *[result._handle, ctypes.byref(out_enum)])
            self.__error_code = CancellationErrorCode(out_enum.value)
            self.__error_details = result.properties.get_property(PropertyId.CancellationDetails_ReasonDetailedText)
        else:
            out_enum = ctypes.c_int(0)
            _call_hr_fn(fn=_sdk_lib.audio_data_stream_get_reason_canceled, *[stream._handle, ctypes.byref(out_enum)])
            self.__reason = CancellationReason(out_enum.value)
            _call_hr_fn(fn=_sdk_lib.audio_data_stream_get_canceled_error_code, *[stream._handle, ctypes.byref(out_enum)])
            self.__error_code = CancellationErrorCode(out_enum.value)
            self.__error_details = stream.properties.get_property(PropertyId.CancellationDetails_ReasonDetailedText)

    @property
    def reason(self) -> CancellationReason:
        """
        The reason the result was canceled.
        """
        return self.__reason

    @property
    def error_code(self) -> CancellationErrorCode:
        """
        The error code in case of an unsuccessful speech synthesis (Reason is set to Error).
        If Reason is not Error, ErrorCode is set to NoError.
        """
        return self.__error_code

    @property
    def error_details(self) -> str:
        """
        The error message in case of an unsuccessful speech synthesis (Reason is set to Error)
        """
        return self.__error_details


class SpeechSynthesisResult():
    """
    Result of a speech synthesis operation.
    """

    def __init__(self, handle: _spx_handle):
        """
        Constructor for internal use.
        """
        self.__handle = _Handle(handle, _sdk_lib.synthesizer_result_handle_is_valid, _sdk_lib.synthesizer_result_handle_release)
        _c_string_buffer = ctypes.create_string_buffer(1024 + 1)
        _call_hr_fn(fn=_sdk_lib.synth_result_get_result_id, *[handle, _c_string_buffer, 1024])
        self._result_id = _c_string_buffer.value.decode(encoding='utf-8')
        enum_out = ctypes.c_int(0)
        _call_hr_fn(fn=_sdk_lib.synth_result_get_reason, *[handle, ctypes.byref(enum_out)])
        self._reason = ResultReason(enum_out.value)
        c_duration = ctypes.c_uint64(0)
        c_length = ctypes.c_uint32(0)
        _call_hr_fn(fn=_sdk_lib.synth_result_get_audio_length_duration, *[handle, ctypes.byref(c_length), ctypes.byref(c_duration)])
        self._audio_duration_milliseconds = timedelta(milliseconds=c_duration.value)
        buffer = bytes(c_length.value)
        filled_size = ctypes.c_uint32(0)
        _call_hr_fn(fn=_sdk_lib.synth_result_get_audio_data, *[handle, buffer, c_length, ctypes.byref(filled_size)])
        self._audio_data = buffer
        properties_handle = _spx_handle(0)
        _call_hr_fn(fn=_sdk_lib.synth_result_get_property_bag, *[handle, ctypes.byref(properties_handle)])
        self._properties = PropertyCollection(properties_handle)
        self._cancellation_details = SpeechSynthesisCancellationDetails(result=self) if self._reason == ResultReason.Canceled else None

    @property
    def _handle(self):
        return self.__handle.get()

    @property
    def cancellation_details(self) -> SpeechSynthesisCancellationDetails:
        """
        The reason why speech synthesis was cancelled.

        Returns `None` if there was no cancellation.
        """
        return self._cancellation_details

    @property
    def result_id(self) -> str:
        """
        Synthesis result unique ID.
        """
        return self._result_id

    @property
    def reason(self) -> "ResultReason":
        """
        Synthesis reason.
        """
        return self._reason

    @property
    def audio_data(self) -> bytes:
        """
        The output audio data from the TTS.
        """
        return self._audio_data

    @property
    def audio_duration(self) -> timedelta:
        """
        The time duration of the synthesized audio.

        .. note::
          Added in version 1.21.0.
        """
        return self._audio_duration_milliseconds

    @property
    def properties(self) -> PropertyCollection:
        """
        A collection of properties and their values defined for this SpeechSynthesisResult.

        .. note::
          Added in version 1.17.0.
        """
        return self._properties

    def __str__(self):
        return u'{}(result_id={}, reason={}, audio_length={})'.format(
            type(self).__name__, self._result_id, self._reason, len(self._audio_data))


class SpeechSynthesisEventArgs:
    """
    Class for speech synthesis event arguments.
    """

    def __init__(self, handle: _spx_handle):
        """
        Constructor for internal use.
        """
        self.__handle = _Handle(handle, _sdk_lib.synthesizer_event_handle_is_valid, _sdk_lib.synthesizer_event_handle_release)
        result_handle = _spx_handle(0)
        _call_hr_fn(fn=_sdk_lib.synthesizer_synthesis_event_get_result, *[handle, ctypes.byref(result_handle)])
        self._result = SpeechSynthesisResult(result_handle)

    @property
    def _handle(self):
        return self.__handle.get()

    @property
    def result(self) -> SpeechSynthesisResult:
        """
        Speech synthesis event result.
        """
        return self._result

    def __str__(self):
        return u'{}(result=[{}])'.format(type(self).__name__, self._result.__str__())


class SpeechSynthesisWordBoundaryEventArgs:
    """
    Class for speech synthesis word boundary event arguments.

    .. note::
      Updated in version 1.21.0.
    """

    def __init__(self, handle: _spx_handle):
        """
        Constructor for internal use.
        """
        self.__handle = _Handle(handle, _sdk_lib.synthesizer_event_handle_is_valid, _sdk_lib.synthesizer_event_handle_release)
        _c_string_buffer = ctypes.create_string_buffer(256 + 1)
        _call_hr_fn(fn=_sdk_lib.synthesizer_event_get_result_id, *[handle, _c_string_buffer, 256])
        self._result_id = _c_string_buffer.value.decode(encoding='utf-8')
        c_offset = ctypes.c_uint64(0)
        c_duration = ctypes.c_uint64(0)
        c_text_offset = ctypes.c_uint32(0)
        c_word_length = ctypes.c_uint32(0)
        c_boundary_type = ctypes.c_int(0)
        _call_hr_fn(
            fn=_sdk_lib.synthesizer_word_boundary_event_get_values,
            *[handle, ctypes.byref(c_offset), ctypes.byref(c_duration), ctypes.byref(c_text_offset),
              ctypes.byref(c_word_length), ctypes.byref(c_boundary_type)])
        self._audio_offset = int(c_offset.value)
        self._duration_milliseconds = timedelta(milliseconds=(c_duration.value / 10000))
        self._text_offset = c_text_offset.value if c_text_offset.value < 2 ** 31 else -1
        self._word_length = c_word_length.value
        self._boundary_type = SpeechSynthesisBoundaryType(c_boundary_type.value)
        self._text = _call_string_function_and_free(fn=_sdk_lib.synthesizer_event_get_text, *[handle])

    @property
    def _handle(self):
        return self.__handle.get()

    @property
    def result_id(self) -> str:
        """
        Synthesis result unique ID.

        .. note::
          Added in version 1.25.0.
        """
        return self._result_id

    @property
    def audio_offset(self) -> int:
        """
        Word boundary audio offset in ticks. A single tick represents one hundred
        nanoseconds or one ten-millionth of a second.
        """
        return self._audio_offset

    @property
    def duration(self) -> timedelta:
        """
        Time duration of the audio.

        .. note::
          Added in version 1.21.0.
        """
        return self._duration_milliseconds

    @property
    def text_offset(self) -> int:
        """
        Word boundary text offset in characters.
        """
        return self._text_offset

    @property
    def word_length(self) -> int:
        """
        Word boundary word length in characters.
        """
        return self._word_length

    @property
    def text(self) -> str:
        """
        The text.

        .. note::
          Added in version 1.21.0.
        """
        return self._text

    @property
    def boundary_type(self) -> SpeechSynthesisBoundaryType:
        """
        Word boundary type.

        .. note::
          Added in version 1.21.0.
        """
        return self._boundary_type

    def __str__(self):
        return f'{type(self).__name__}(audio_offset={self._audio_offset}, duration={self.duration}, ' \
               f'text_offset={self._text_offset}, word_length={self._word_length})'


class SpeechSynthesisVisemeEventArgs:
    """
    Class for speech synthesis viseme event arguments.

    .. note::
        Added in version 1.16.0.
    """

    def __init__(self, handle: _spx_handle):
        """
        Constructor for internal use.
        """
        self.__handle = _Handle(handle, _sdk_lib.synthesizer_event_handle_is_valid, _sdk_lib.synthesizer_event_handle_release)
        _c_string_buffer = ctypes.create_string_buffer(256 + 1)
        _call_hr_fn(fn=_sdk_lib.synthesizer_event_get_result_id, *[handle, _c_string_buffer, 256])
        self._result_id = _c_string_buffer.value.decode(encoding='utf-8')
        c_offset = ctypes.c_uint64(0)
        c_viseme_id = ctypes.c_uint32(0)
        _call_hr_fn(fn=_sdk_lib.synthesizer_viseme_event_get_values, *[handle, ctypes.byref(c_offset), ctypes.byref(c_viseme_id)])
        self._audio_offset = int(c_offset.value)
        self._viseme_id = int(c_viseme_id.value)
        self._animation = _call_string_function_and_free(fn=_sdk_lib.synthesizer_viseme_event_get_animation, *[handle])

    def _handle(self):
        return self.__handle.get()

    @property
    def result_id(self) -> str:
        """
        Synthesis result unique ID.

        .. note::
          Added in version 1.25.0.
        """
        return self._result_id

    @property
    def audio_offset(self) -> int:
        """
        Audio offset in ticks. A single tick represents one hundred
        nanoseconds or one ten-millionth of a second.
        """
        return self._audio_offset

    @property
    def viseme_id(self) -> int:
        """
        Viseme id.
        """
        return self._viseme_id

    @property
    def animation(self) -> str:
        """
        Animation, could be in svg or other format.
        """
        return self._animation

    def __str__(self):
        return u'{}(audio_offset={}, viseme_id={})'.format(
            type(self).__name__, self._audio_offset, self._viseme_id)


class SpeechSynthesisBookmarkEventArgs:
    """
    Class for speech synthesis bookmark event arguments.

    .. note::
        Added in version 1.16.0.
    """

    def __init__(self, handle: _spx_handle):
        """
        Constructor for internal use.
        """
        self.__handle = _Handle(handle, _sdk_lib.synthesizer_event_handle_is_valid, _sdk_lib.synthesizer_event_handle_release)
        _c_string_buffer = ctypes.create_string_buffer(256 + 1)
        _call_hr_fn(fn=_sdk_lib.synthesizer_event_get_result_id, *[handle, _c_string_buffer, 256])
        self._result_id = _c_string_buffer.value.decode(encoding='utf-8')
        c_offset = ctypes.c_uint64(0)
        _call_hr_fn(fn=_sdk_lib.synthesizer_bookmark_event_get_values, *[handle, ctypes.byref(c_offset)])
        self._audio_offset = int(c_offset.value)
        self._text = _call_string_function_and_free(fn=_sdk_lib.synthesizer_event_get_text, *[handle])

    @property
    def _handle(self):
        return self.__handle.get()

    @property
    def result_id(self) -> str:
        """
        Synthesis result unique ID.

        .. note::
          Added in version 1.25.0.
        """
        return self._result_id

    @property
    def audio_offset(self) -> int:
        """
        Audio offset in ticks. A single tick represents one hundred
        nanoseconds or one ten-millionth of a second.
        """
        return self._audio_offset

    @property
    def text(self) -> str:
        """
        Bookmark text.
        """
        return self._text

    def __str__(self):
        return u'{}(audio_offset={}, text={})'.format(
            type(self).__name__, self._audio_offset, self._text)


class VoiceInfo():
    """
    Contains detailed information about the synthesis voice information.

    .. note::
      Updated in version 1.17.0.
    """

    def __init__(self, handle: _spx_handle):
        """
        Constructor for internal use.
        """
        self.__handle = _Handle(handle, None, _sdk_lib.voice_info_handle_release)
        self._name = _call_string_function_and_free(
            fn=_sdk_lib.voice_info_get_name,
            *[handle])
        self._locale = _call_string_function_and_free(
            fn=_sdk_lib.voice_info_get_locale,
            *[handle])
        self._short_name = _call_string_function_and_free(
            fn=_sdk_lib.voice_info_get_short_name,
            *[handle])
        self._local_name = _call_string_function_and_free(
            fn=_sdk_lib.voice_info_get_local_name,
            *[handle])
        styles = _call_string_function_and_free(
            fn=_sdk_lib.voice_info_get_style_list,
            *[handle])
        self._style_list = list(styles.split("|"))
        c_enum = ctypes.c_int(0)
        _call_hr_fn(fn=_sdk_lib.voice_info_get_voice_type, *[handle, ctypes.byref(c_enum)])
        self._voice_type = SynthesisVoiceType(c_enum.value)
        self._voice_path = _call_string_function_and_free(fn=_sdk_lib.voice_info_get_voice_path, *[handle])
        properties_handle = _spx_handle(0)
        _call_hr_fn(fn=_sdk_lib.voice_info_get_property_bag, *[handle, ctypes.byref(properties_handle)])
        self._properties = PropertyCollection(properties_handle)
        gender_string = self._properties.get_property_by_name("Gender").lower()

        def select_gender(gender_string: str):
            if gender_string == "female":
                return SynthesisVoiceGender.Female
            elif gender_string == "male":
                return SynthesisVoiceGender.Male
            return SynthesisVoiceGender.Unknown
        self._gender = select_gender(gender_string)

    @property
    def _handle(self):
        return self.__handle.get()

    @property
    def name(self) -> str:
        """
        The voice name.
        """
        return self._name

    @property
    def locale(self) -> str:
        """
        The locale of the voice.
        """
        return self._locale

    @property
    def short_name(self) -> str:
        """
        The short name of the voice.
        """
        return self._short_name

    @property
    def local_name(self) -> str:
        """
        The local name of the voice.
        """
        return self._local_name

    @property
    def gender(self) -> "SynthesisVoiceGender":
        """
        The voice gender.

        .. note::
          Added in version 1.17.0.
        """
        return self._gender

    @property
    def voice_type(self) -> "SynthesisVoiceType":
        """
        The voice type.
        """
        return self._voice_type

    @property
    def style_list(self) -> List[str]:
        """
        The style list.
        """
        return self._style_list

    @property
    def voice_path(self) -> str:
        """
        The voice path, only valid for offline voices.
        """
        return self._voice_path


class SynthesisVoicesResult():
    """
    Contains detailed information about the retrieved synthesis voices list.

    .. note::
      Added in version 1.16.0.
    """

    def __init__(self, handle: _spx_handle):
        """
        Constructor for internal use.
        """
        self.__handle = _Handle(handle, _sdk_lib.synthesizer_result_handle_is_valid, _sdk_lib.synthesizer_result_handle_release)
        properties_handle = _spx_handle(0)
        _call_hr_fn(fn=_sdk_lib.synthesis_voices_result_get_property_bag, *[handle, ctypes.byref(properties_handle)])
        self.__properties = PropertyCollection(properties_handle)
        _c_string_buffer = ctypes.create_string_buffer(1024 + 1)
        _call_hr_fn(fn=_sdk_lib.synthesis_voices_result_get_result_id, *[handle, _c_string_buffer, 1024])
        self._result_id = _c_string_buffer.value.decode(encoding='utf-8')
        c_reason = ctypes.c_int(0)
        _call_hr_fn(fn=_sdk_lib.synthesis_voices_result_get_reason, *[handle, ctypes.byref(c_reason)])
        self._reason = ResultReason(c_reason.value)
        voice_num = ctypes.c_uint32(0)
        _call_hr_fn(fn=_sdk_lib.synthesis_voices_result_get_voice_num, *[handle, ctypes.byref(voice_num)])
        self._voices = list()
        for i in range(voice_num.value):
            voice_handle = _spx_handle(0)
            _call_hr_fn(fn=_sdk_lib.synthesis_voices_result_get_voice_info, *[handle, i, ctypes.byref(voice_handle)])
            self._voices.append(VoiceInfo(voice_handle))
        self._error_details = self.__properties.get_property(PropertyId.CancellationDetails_ReasonDetailedText)

    @property
    def _handle(self):
        return self.__handle.get()

    @property
    def error_details(self) -> str:
        """
        The error details of the result.
        """
        return self._error_details

    @property
    def result_id(self) -> str:
        """
        Unique ID.
        """
        return self._result_id

    @property
    def reason(self) -> "ResultReason":
        """
        Result reason.
        """
        return self._reason

    @property
    def voices(self) -> List[VoiceInfo]:
        """
        The retrieved voices list.
        """
        return self._voices

    @property
    def properties(self) -> PropertyCollection:
        """
        A collection of properties and their values defined for this SynthesisVoicesResult.

        .. note::
          Added in version 1.17.0.
        """
        return self.__properties

    def __str__(self):
        return u'{}(result_id={}, reason={}, voices_number={})'.format(
            type(self).__name__, self._result_id, self._reason, len(self.voices))


class AudioDataStream():
    """
    Represents audio data stream used for operating audio data as a stream.

    Generates an audio data stream from a speech synthesis result (type SpeechSynthesisResult)
    or a keyword recognition result (type KeywordRecognitionResult).

    :param result: The speech synthesis or keyword recognition result.
    """

    def __init__(self, result=None):
        if result is None:
            raise ValueError('result must be provided')
        handle = _spx_handle(0)
        if isinstance(result, SpeechSynthesisResult):
            _call_hr_fn(fn=_sdk_lib.audio_data_stream_create_from_result, *[ctypes.byref(handle), result._handle])
        elif isinstance(result, KeywordRecognitionResult):
            _call_hr_fn(fn=_sdk_lib.audio_data_stream_create_from_keyword_result, *[ctypes.byref(handle), result._handle])
        else:
            raise ValueError(
                'result must be a SpeechSynthesisResult or KeywordRecognitionResult, is "{}"'.format(result))
        self.__handle = _Handle(handle, _sdk_lib.audio_stream_is_handle_valid, _sdk_lib.audio_data_stream_release)
        self.__cancellation_details = None
        prop_handle = _spx_handle(0)
        _call_hr_fn(fn=_sdk_lib.audio_data_stream_get_property_bag, *[handle, ctypes.byref(prop_handle)])
        self.__properties = PropertyCollection(prop_handle)

    @property
    def _handle(self) -> _spx_handle:
        return self.__handle.get()

    def __del__(self):
        self.detach_input()

    @property
    def status(self) -> StreamStatus:
        """
        Current status of the audio data stream.
        """
        c_status = ctypes.c_int(0)
        _call_hr_fn(fn=_sdk_lib.audio_data_stream_get_status, *[self._handle, ctypes.byref(c_status)])
        return StreamStatus(c_status.value)

    @property
    def cancellation_details(self) -> SpeechSynthesisCancellationDetails:
        """
        The reason why speech synthesis was cancelled.

        Returns `None` if there was no cancellation.
        """
        if self.__cancellation_details is None and self.status == StreamStatus.Canceled:
            self.__cancellation_details = SpeechSynthesisCancellationDetails(stream=self)
        return self.__cancellation_details

    def can_read_data(self, requested_bytes: int, pos: Optional[int] = None) -> bool:
        """
        Check whether the stream has enough data to be read,
        starting from the specified position (if specified).

        :param requested_bytes: The requested data size in bytes.
        :param pos: The position to start with.
            Will start from current position if this param is not given.
        :returns: A bool indicating the result
        """
        c_requested_bytes = ctypes.c_uint32(requested_bytes)
        if pos is None:
            return _call_bool_fn(fn=_sdk_lib.audio_data_stream_can_read_data, *[self._handle, c_requested_bytes])
        elif isinstance(pos, int):
            c_pos = ctypes.c_uint32(pos)
            return _call_bool_fn(fn=_sdk_lib.audio_data_stream_can_read_data_from_position, *[self._handle, c_requested_bytes, c_pos])
        else:
            raise ValueError('pos must be an int, is "{}"'.format(pos))

    def read_data(self, audio_buffer: bytes, pos: Optional[int] = None) -> int:
        """
        Reads the audio data from the audio data stream,
        starting from the specified position (if specified).
        The maximal number of bytes to be read is determined by the size of audio_buffer.
        If there is no data immediately available, read_data() blocks until
        the next data becomes available.

        :param audio_buffer: The buffer to receive the audio data.
        :param pos: The position to start with.
            Will start from current position if this param is not given.
        :returns: The number of bytes filled, or 0 in case the stream hits its end and
            there is no more data available.
        """
        if audio_buffer is None:
            raise ValueError('audio_buffer must be provided')

        if not isinstance(audio_buffer, bytes):
            raise ValueError('audio_buffer must be a bytes, is "{}"'.format(audio_buffer))

        filled_size = ctypes.c_uint32(0)
        buffer_size = ctypes.c_uint32(len(audio_buffer))
        if pos is None:
            _call_hr_fn(fn=_sdk_lib.audio_data_stream_read, *[self._handle, audio_buffer, buffer_size, ctypes.byref(filled_size)])
        elif isinstance(pos, int):
            c_pos = ctypes.c_uint32(pos)
            _call_hr_fn(
                fn=_sdk_lib.audio_data_stream_read_from_position,
                *[self._handle, audio_buffer, buffer_size, c_pos, ctypes.byref(filled_size)])
        else:
            raise ValueError('pos must be an int, is "{}"'.format(pos))
        return filled_size.value

    def save_to_wav_file(self, file_name: str):
        """
        Save the audio data to a file, synchronously.

        :param file_name: Name of the file to be saved to
        """
        if not file_name:
            raise ValueError('file_name must be provided')

        if not isinstance(file_name, str):
            raise ValueError('file_name must be a str, is "{}"'.format(file_name))
        c_file = _c_str(file_name)
        _call_hr_fn(fn=_sdk_lib.audio_data_stream_save_to_wave_file, *[self._handle, c_file])

    def save_to_wav_file_async(self, file_name: str):
        """
        Save the audio data to a file, asynchronously.

        :param file_name: Name of the file to be saved to
        :returns: An asynchronous operation representing the saving.
        """
        raise NotImplementedError

    def detach_input(self):
        """
        Stop any more data from getting to the stream.
        """
        _call_hr_fn(fn=_sdk_lib.audio_data_stream_detach_input, *[self._handle])

    @property
    def position(self) -> int:
        """
        Current position of the audio data stream.
        """
        pos = ctypes.c_uint32(0)
        _call_hr_fn(fn=_sdk_lib.audio_data_stream_get_position, *[self._handle, ctypes.byref(pos)])
        return int(pos.value)

    @position.setter
    def position(self, pos: int):
        if pos is None:
            raise ValueError('pos must be provided')

        if not isinstance(pos, int):
            raise ValueError('pos must be an int, is "{}"'.format(pos))
        c_pos = ctypes.c_uint32(pos)
        _call_hr_fn(fn=_sdk_lib.audio_data_stream_set_position, *[self._handle, c_pos])

    @property
    def properties(self) -> PropertyCollection:
        """
        A collection of properties and their values defined for this AudioDataStream.
        """
        return self.__properties


class SpeechSynthesisRequest:
    """
    Represents a speech synthesis request.
    Note: This class is in preview and may be subject to change in future versions.
    Added in version 1.37.0
    """

    def __init__(self, input_type: SpeechSynthesisRequestInputType):
        """
        Creates a speech synthesis request using the specified text.

        :param input_type: The input type for the speech synthesis request.
        """
        if input_type == SpeechSynthesisRequestInputType.TextStream:
            handle = _spx_handle(0)
            _call_hr_fn(fn=_sdk_lib.speech_synthesis_request_create, *[
                ctypes.c_bool(True), ctypes.c_bool(False), _c_str(""), ctypes.c_uint32(0), ctypes.byref(handle)
            ])
            self.__handle = _Handle(
                handle, _sdk_lib.speech_synthesis_request_handle_is_valid, _sdk_lib.speech_synthesis_request_release)
            self.__input_stream = self.InputStream(self)
            prop_handle = _spx_handle(0)
            _call_hr_fn(fn=_sdk_lib.speech_synthesis_request_get_property_bag, *[handle, ctypes.byref(prop_handle)])
            self.__properties = PropertyCollection(prop_handle)
        else:
            raise NotImplementedError("Only text streaming is supported in this version.")

    def pitch(self, value: str):
        """
        The pitch of the voice.
        """
        self.__properties.set_property(PropertyId.SpeechSynthesisRequest_Pitch, value)

    def rate(self, value: str):
        """
        The speaking rate of the voice.
        """
        self.__properties.set_property(PropertyId.SpeechSynthesisRequest_Rate, value)

    def volume(self, value: str):
        """
        The volume of the voice.
        """
        self.__properties.set_property(PropertyId.SpeechSynthesisRequest_Volume, value)

    pitch = property(None, pitch)
    rate = property(None, rate)
    volume = property(None, volume)

    class InputStream:
        """
        Represents an input stream for speech synthesis request.
        Note: This class is in preview and may be subject to change in future versions.
        Added in version 1.37.0
        """

        def __init__(self, parent: "SpeechSynthesisRequest"):
            """
            Constructor for internal use.
            """
            self.__parent = parent

        def write(self, text: str):
            """
            Writes the specified text to the input stream.

            :param text: The text to be written to the input stream.
            """
            c_text = _c_str(text)
            text_length = ctypes.c_uint32(len(c_text))
            _call_hr_fn(fn=_sdk_lib.speech_synthesis_request_send_text_piece, *[self.__parent._handle, c_text, text_length])

        def close(self):
            """
            Closes the input stream.
            """
            _call_hr_fn(fn=_sdk_lib.speech_synthesis_request_finish, *[self.__parent._handle])

    @property
    def _handle(self) -> _spx_handle:
        return self.__handle.get()

    @property
    def input_stream(self) -> InputStream:
        """
        The input stream for the speech synthesis request.
        """
        return self.__input_stream

    @property
    def properties(self) -> PropertyCollection:
        """
        A collection of properties and their values defined for this SpeechSynthesisRequest.
        """
        return self.__properties


class PersonalVoiceSynthesisRequest(SpeechSynthesisRequest):
    """
    Represents a speech synthesis request for personal voice (aka.ms/azureai/personal-voice).
    Note: This class is in preview and may be subject to change in future versions.
    Added in version 1.39.0
    """

    def __init__(self, input_type: SpeechSynthesisRequestInputType, personal_voice_name: str, model_name: str):
        """
        Creates a speech synthesis request using the specified text.

        :param input_type: The input type for the personal voice synthesis request.
        :param personal_voice_name: The personal voice name.
        :param model_name: The model name, e.g., "DragonLatestNeural" or "PhoenixLatestNeural".
        """
        super().__init__(input_type)
        c_personal_voice_name = _c_str(personal_voice_name)
        c_model_name = _c_str(model_name)
        _call_hr_fn(fn=_sdk_lib.speech_synthesis_request_set_voice, *[self._handle, _c_str(""), c_personal_voice_name, c_model_name])


class SpeechSynthesizer:
    """
    A speech synthesizer.

    :param speech_config: The config for the speech synthesizer
    :param audio_config: The config for the audio output.
        This parameter is optional.
        If it is not provided, the default speaker device will be used for audio output.
        If it is None, the output audio will be dropped.
        None can be used for scenarios like performance test.
    :param auto_detect_source_language_config: The auto detection source language config
    """

    def __init__(self, speech_config: SpeechConfig,
                 audio_config: Optional[audio.AudioOutputConfig] = audio.AudioOutputConfig(use_default_speaker=True),
                 auto_detect_source_language_config: Optional[languageconfig.AutoDetectSourceLanguageConfig] = None):
        handle = _spx_handle(0)
        # keep audio config alive, it may contain stream, callback, etc.
        self.__audio_config_keep_alive = audio_config
        audio_config_handle = audio_config._handle if audio_config is not None else None
        if auto_detect_source_language_config is not None:
            _call_hr_fn(fn=_sdk_lib.synthesizer_create_speech_synthesizer_from_auto_detect_source_lang_config, *[
                ctypes.byref(handle),
                speech_config._handle, auto_detect_source_language_config._handle, audio_config_handle
            ])
        else:
            _call_hr_fn(fn=_sdk_lib.synthesizer_create_speech_synthesizer_from_config, *[
                ctypes.byref(handle),
                speech_config._handle, audio_config_handle
            ])
        self.__handle = _Handle(handle, _sdk_lib.synthesizer_handle_is_valid, _sdk_lib.synthesizer_handle_release)
        prop_handle = _spx_handle(0)
        _call_hr_fn(fn=_sdk_lib.synthesizer_get_property_bag, *[handle, ctypes.byref(prop_handle)])
        self.__properties = PropertyCollection(prop_handle)

    def __del__(self):
        def clean_signal(signal: EventSignal):
            if signal is not None:
                signal.disconnect_all()
        clean_signal(self.__synthesis_started_signal)
        clean_signal(self.__synthesizing_signal)
        clean_signal(self.__synthesis_completed_signal)
        clean_signal(self.__synthesis_canceled_signal)
        clean_signal(self.__synthesis_word_boundary_signal)
        clean_signal(self.__viseme_received_signal)
        clean_signal(self.__bookmark_reached_signal)

    @property
    def _handle(self) -> _spx_handle:
        return self.__handle.get()

    def speak_text(self, text: str) -> SpeechSynthesisResult:
        """
        Performs synthesis on plain text in a blocking (synchronous) mode.

        :returns: A SpeechSynthesisResult.
        """
        return self.speak_text_async(text).get()

    def speak_ssml(self, ssml: str) -> SpeechSynthesisResult:
        """
        Performs synthesis on ssml in a blocking (synchronous) mode.

        :returns: A SpeechSynthesisResult.
        """
        return self.speak_ssml_async(ssml).get()

    def speak(self, request: SpeechSynthesisRequest) -> SpeechSynthesisResult:
        """
        Performs synthesis on a speech synthesis request in a blocking (synchronous) mode.

        This method is in preview and may be subject to change in future versions.
        Added in version 1.37.0.

        :param request: The speech synthesis request.
        :returns: A SpeechSynthesisResult.
        """
        return self.speak_async(request).get()

    def speak_text_async(self, text: str) -> ResultFuture:
        """
        Performs synthesis on plain text in a non-blocking (asynchronous) mode.

        :returns: A future with SpeechSynthesisResult.
        """
        async_handle = _spx_handle(0)
        c_text = _c_str(text)
        text_length = ctypes.c_uint32(len(c_text))
        _call_hr_fn(fn=_sdk_lib.synthesizer_speak_text_async, *[self._handle, c_text, text_length, ctypes.byref(async_handle)])

        def resolve_future(handle: _spx_handle):
            result_handle = _spx_handle(0)
            _call_hr_fn(fn=_sdk_lib.synthesizer_speak_async_wait_for, *[handle, max_uint32, ctypes.byref(result_handle)])
            _sdk_lib.synthesizer_async_handle_release(handle)
            return result_handle
        return ResultFuture(async_handle, resolve_future, SpeechSynthesisResult)

    def speak_ssml_async(self, ssml: str) -> ResultFuture:
        """
        Performs synthesis on ssml in a non-blocking (asynchronous) mode.

        :returns: A future with SpeechSynthesisResult.
        """
        async_handle = _spx_handle(0)
        c_ssml = _c_str(ssml)
        ssml_length = ctypes.c_uint32(len(c_ssml))
        _call_hr_fn(fn=_sdk_lib.synthesizer_speak_ssml_async, *[self._handle, c_ssml, ssml_length, ctypes.byref(async_handle)])

        def resolve_future(handle: _spx_handle):
            result_handle = _spx_handle(0)
            _call_hr_fn(fn=_sdk_lib.synthesizer_speak_async_wait_for, *[handle, max_uint32, ctypes.byref(result_handle)])
            _sdk_lib.synthesizer_async_handle_release(handle)
            return result_handle
        return ResultFuture(async_handle, resolve_future, SpeechSynthesisResult)

    def speak_async(self, request: SpeechSynthesisRequest) -> ResultFuture:
        """
        Performs synthesis on a speech synthesis request in a non-blocking (asynchronous) mode.

        This method is in preview and may be subject to change in future versions.
        Added in version 1.37.0.

        :param request: The speech synthesis request.
        :returns: A future with SpeechSynthesisResult.
        """
        async_handle = _spx_handle(0)
        _call_hr_fn(fn=_sdk_lib.synthesizer_speak_request_async, *[self._handle, request._handle, ctypes.byref(async_handle)])

        def resolve_future(handle: _spx_handle):
            result_handle = _spx_handle(0)
            _call_hr_fn(fn=_sdk_lib.synthesizer_speak_async_wait_for, *[handle, max_uint32, ctypes.byref(result_handle)])
            _sdk_lib.synthesizer_async_handle_release(handle)
            return result_handle
        return ResultFuture(async_handle, resolve_future, SpeechSynthesisResult)

    def start_speaking_text(self, text: str) -> SpeechSynthesisResult:
        """
        Starts synthesis on plain text in a blocking (synchronous) mode.

        :returns: A SpeechSynthesisResult.
        """
        return self.start_speaking_text_async(text).get()

    def start_speaking_ssml(self, ssml: str) -> SpeechSynthesisResult:
        """
        Starts synthesis on ssml in a blocking (synchronous) mode.

        :returns: A SpeechSynthesisResult.
        """
        return self.start_speaking_ssml_async(ssml).get()

    def start_speaking(self, request: SpeechSynthesisRequest) -> SpeechSynthesisResult:
        """
        Starts synthesis on a speech synthesis request in a blocking (synchronous) mode.

        This method is in preview and may be subject to change in future versions.
        Added in version 1.37.0.

        :param request: The speech synthesis request.
        :returns: A SpeechSynthesisResult.
        """
        result_handle = _spx_handle(0)
        _call_hr_fn(fn=_sdk_lib.synthesizer_start_speaking_request, *[self._handle, request._handle, ctypes.byref(result_handle)])
        return SpeechSynthesisResult(result_handle)

    def start_speaking_text_async(self, text: str) -> ResultFuture:
        """
        Starts synthesis on plain text in a non-blocking (asynchronous) mode.

        :returns: A future with SpeechSynthesisResult.
        """
        async_handle = _spx_handle(0)
        c_text = _c_str(text)
        c_length = ctypes.c_uint32(len(c_text))
        _call_hr_fn(fn=_sdk_lib.synthesizer_start_speaking_text_async, *[self._handle, c_text, c_length, ctypes.byref(async_handle)])

        def resolve_future(handle: _spx_handle):
            result_handle = _spx_handle(0)
            _call_hr_fn(fn=_sdk_lib.synthesizer_speak_async_wait_for, *[handle, max_uint32, ctypes.byref(result_handle)])
            _sdk_lib.synthesizer_async_handle_release(handle)
            return result_handle
        return ResultFuture(async_handle, resolve_future, SpeechSynthesisResult)

    def start_speaking_ssml_async(self, ssml: str) -> ResultFuture:
        """
        Starts synthesis on ssml in a non-blocking (asynchronous) mode.

        :returns: A future with SpeechSynthesisResult.
        """
        async_handle = _spx_handle(0)
        c_ssml = _c_str(ssml)
        c_length = ctypes.c_uint32(len(c_ssml))
        _call_hr_fn(fn=_sdk_lib.synthesizer_start_speaking_ssml_async, *[self._handle, c_ssml, c_length, ctypes.byref(async_handle)])

        def resolve_future(handle: _spx_handle):
            result_handle = _spx_handle(0)
            _call_hr_fn(fn=_sdk_lib.synthesizer_speak_async_wait_for, *[handle, max_uint32, ctypes.byref(result_handle)])
            _sdk_lib.synthesizer_async_handle_release(handle)
            return result_handle
        return ResultFuture(async_handle, resolve_future, SpeechSynthesisResult)

    def stop_speaking_async(self) -> ResultFuture:
        """
        Asynchronously terminates ongoing synthesis operation.
        This method will stop playback and clear unread data in PullAudioOutputStream.

        :returns: A future that is fulfilled once synthesis has been stopped.
        """
        async_handle = _spx_handle(0)
        _call_hr_fn(fn=_sdk_lib.synthesizer_stop_speaking_async, *[self._handle, ctypes.byref(async_handle)])

        def resolve_future(handle: _spx_handle):
            _call_hr_fn(fn=_sdk_lib.synthesizer_stop_speaking_async_wait_for, *[handle, max_uint32])
            _sdk_lib.synthesizer_async_handle_release(handle)
            return None
        return ResultFuture(async_handle, resolve_future, None)

    def stop_speaking(self) -> None:
        """
        Synchronously terminates ongoing synthesis operation.
        This method will stop playback and clear unread data in PullAudioOutputStream.
        """
        return self.stop_speaking_async().get()

    def get_voices_async(self, locale: str = "") -> ResultFuture:
        """
        Get the available voices, asynchronously.

        :param locale: Specify the locale of voices, in BCP-47 format; or leave it empty to get all available voices.
        :returns: A task representing the asynchronous operation that gets the voices.
        """
        async_handle = _spx_handle(0)
        c_locale = _c_str(locale)
        _call_hr_fn(fn=_sdk_lib.synthesizer_get_voices_list_async, *[self._handle, c_locale, ctypes.byref(async_handle)])

        def resolve_future(handle: _spx_handle):
            result_handle = _spx_handle(0)
            _call_hr_fn(fn=_sdk_lib.synthesizer_get_voices_list_async_wait_for, *[handle, max_uint32, ctypes.byref(result_handle)])
            _sdk_lib.synthesizer_async_handle_release(handle)
            return result_handle
        return ResultFuture(async_handle, resolve_future, SynthesisVoicesResult)

    @property
    def properties(self) -> PropertyCollection:
        """
        A collection of properties and their values defined for this SpeechSynthesizer.
        """
        return self.__properties

    @property
    def authorization_token(self) -> str:
        """
        The authorization token that will be used for connecting to the service.

        .. note::
          The caller needs to ensure that the authorization token is valid. Before the
          authorization token expires, the caller needs to refresh it by calling this setter with a
          new valid token. Otherwise, the synthesizer will encounter errors while speech synthesis.
        """
        return self.properties.get_property(PropertyId.SpeechServiceAuthorization_Token)

    @authorization_token.setter
    def authorization_token(self, authorization_token: str):
        self.properties.set_property(PropertyId.SpeechServiceAuthorization_Token, authorization_token)

    __synthesis_started_signal = None

    @property
    def synthesis_started(self) -> EventSignal:
        """
        Signal for events indicating synthesis has started.

        Callbacks connected to this signal are called with a :class:`.SpeechSynthesisEventArgs`
        instance as the single argument.
        """
        def synthesis_started_connection(signal: EventSignal, handle: _spx_handle):
            callback = SpeechSynthesizer.__synthesis_started_callback if signal.is_connected() else None
            _sdk_lib.synthesizer_started_set_callback(handle, callback, signal._context_ptr)
        if self.__synthesis_started_signal is None:
            self.__synthesis_started_signal = EventSignal(self, synthesis_started_connection)
        return self.__synthesis_started_signal

    @ctypes.CFUNCTYPE(None, _spx_handle, _spx_handle, ctypes.c_void_p)
    def __synthesis_started_callback(reco_handle: _spx_handle, event_handle: _spx_handle, context: ctypes.c_void_p):
        event_handle = _spx_handle(event_handle)
        obj = _unpack_context(context)
        if obj is not None:
            event = SpeechSynthesisEventArgs(event_handle)
            obj.__synthesis_started_signal.signal(event)

    __synthesizing_signal = None

    @property
    def synthesizing(self) -> EventSignal:
        """
        Signal for events indicating synthesis is ongoing.

        Callbacks connected to this signal are called with a :class:`.SpeechSynthesisEventArgs`
        instance as the single argument.
        """
        def synthesizing_connection(signal: EventSignal, handle: _spx_handle):
            callback = SpeechSynthesizer.__synthesizing_callback if signal.is_connected() else None
            _sdk_lib.synthesizer_synthesizing_set_callback(handle, callback, signal._context_ptr)
        if self.__synthesizing_signal is None:
            self.__synthesizing_signal = EventSignal(self, synthesizing_connection)
        return self.__synthesizing_signal

    @ctypes.CFUNCTYPE(None, _spx_handle, _spx_handle, ctypes.c_void_p)
    def __synthesizing_callback(reco_handle: _spx_handle, event_handle: _spx_handle, context: ctypes.c_void_p):
        event_handle = _spx_handle(event_handle)
        obj = _unpack_context(context)
        if obj is not None:
            event = SpeechSynthesisEventArgs(event_handle)
            obj.__synthesizing_signal.signal(event)

    __synthesis_completed_signal = None

    @property
    def synthesis_completed(self) -> EventSignal:
        """
        Signal for events indicating synthesis has completed.

        Callbacks connected to this signal are called with a :class:`.SpeechSynthesisEventArgs`
        instance as the single argument.
        """
        def synthesis_completed_connection(signal: EventSignal, handle: _spx_handle):
            callback = SpeechSynthesizer.__synthesis_completed_callback if signal.is_connected() else None
            _sdk_lib.synthesizer_completed_set_callback(handle, callback, signal._context_ptr)
        if self.__synthesis_completed_signal is None:
            self.__synthesis_completed_signal = EventSignal(self, synthesis_completed_connection)
        return self.__synthesis_completed_signal

    @ctypes.CFUNCTYPE(None, _spx_handle, _spx_handle, ctypes.c_void_p)
    def __synthesis_completed_callback(reco_handle: _spx_handle, event_handle: _spx_handle, context: ctypes.c_void_p):
        event_handle = _spx_handle(event_handle)
        obj = _unpack_context(context)
        if obj is not None:
            event = SpeechSynthesisEventArgs(event_handle)
            obj.__synthesis_completed_signal.signal(event)

    __synthesis_canceled_signal = None

    @property
    def synthesis_canceled(self) -> EventSignal:
        """
        Signal for events indicating synthesis has been canceled.

        Callbacks connected to this signal are called with a :class:`.SpeechSynthesisEventArgs`
        instance as the single argument.
        """
        def synthesis_canceled_connection(signal: EventSignal, handle: _spx_handle):
            callback = SpeechSynthesizer.__synthesis_canceled_callback if signal.is_connected() else None
            _sdk_lib.synthesizer_canceled_set_callback(handle, callback, signal._context_ptr)
        if self.__synthesis_canceled_signal is None:
            self.__synthesis_canceled_signal = EventSignal(self, synthesis_canceled_connection)
        return self.__synthesis_canceled_signal

    @ctypes.CFUNCTYPE(None, _spx_handle, _spx_handle, ctypes.c_void_p)
    def __synthesis_canceled_callback(reco_handle: _spx_handle, event_handle: _spx_handle, context: ctypes.c_void_p):
        event_handle = _spx_handle(event_handle)
        obj = _unpack_context(context)
        if obj is not None:
            event = SpeechSynthesisEventArgs(event_handle)
            obj.__synthesis_canceled_signal.signal(event)

    __synthesis_word_boundary_signal = None

    @property
    def synthesis_word_boundary(self) -> EventSignal:
        """
        Signal for events indicating a word boundary.

        Callbacks connected to this signal are called with a :class:`.SpeechSynthesisWordBoundaryEventArgs`
        instance as the single argument.
        """
        def synthesis_word_boundary_connection(signal: EventSignal, handle: _spx_handle):
            callback = SpeechSynthesizer.__synthesis_word_boundary_callback if signal.is_connected() else None
            _sdk_lib.synthesizer_word_boundary_set_callback(handle, callback, signal._context_ptr)
        if self.__synthesis_word_boundary_signal is None:
            self.__synthesis_word_boundary_signal = EventSignal(self, synthesis_word_boundary_connection)
        return self.__synthesis_word_boundary_signal

    @ctypes.CFUNCTYPE(None, _spx_handle, _spx_handle, ctypes.c_void_p)
    def __synthesis_word_boundary_callback(reco_handle: _spx_handle, event_handle: _spx_handle, context: ctypes.c_void_p):
        event_handle = _spx_handle(event_handle)
        obj = _unpack_context(context)
        if obj is not None:
            event = SpeechSynthesisWordBoundaryEventArgs(event_handle)
            obj.__synthesis_word_boundary_signal.signal(event)

    __viseme_received_signal = None

    @property
    def viseme_received(self) -> EventSignal:
        """
        Signal for events indicating a viseme is received.

        Callbacks connected to this signal are called with a :class:`.SpeechSynthesisVisemeEventArgs`
        instance as the single argument.

        .. note::
            Added in version 1.16.0.
        """
        def viseme_received_connection(signal: EventSignal, handle: _spx_handle):
            callback = SpeechSynthesizer.__viseme_received_callback if signal.is_connected() else None
            _sdk_lib.synthesizer_viseme_received_set_callback(handle, callback, signal._context_ptr)
        if self.__viseme_received_signal is None:
            self.__viseme_received_signal = EventSignal(self, viseme_received_connection)
        return self.__viseme_received_signal

    @ctypes.CFUNCTYPE(None, _spx_handle, _spx_handle, ctypes.c_void_p)
    def __viseme_received_callback(reco_handle: _spx_handle, event_handle: _spx_handle, context: ctypes.c_void_p):
        event_handle = _spx_handle(event_handle)
        obj = _unpack_context(context)
        if obj is not None:
            event = SpeechSynthesisVisemeEventArgs(event_handle)
            obj.__viseme_received_signal.signal(event)

    __bookmark_reached_signal = None

    @property
    def bookmark_reached(self) -> EventSignal:
        """
        Signal for events indicating a bookmark is reached.

        Callbacks connected to this signal are called with a :class:`.SpeechSynthesisBookmarkEventArgs`
        instance as the single argument.

        .. note::
            Added in version 1.16.0.
        """
        def bookmark_reached_connection(signal: EventSignal, handle: _spx_handle):
            callback = SpeechSynthesizer.__bookmark_reached_callback if signal.is_connected() else None
            _sdk_lib.synthesizer_bookmark_reached_set_callback(handle, callback, signal._context_ptr)
        if self.__bookmark_reached_signal is None:
            self.__bookmark_reached_signal = EventSignal(self, bookmark_reached_connection)
        return self.__bookmark_reached_signal

    @ctypes.CFUNCTYPE(None, _spx_handle, _spx_handle, ctypes.c_void_p)
    def __bookmark_reached_callback(reco_handle: _spx_handle, event_handle: _spx_handle, context: ctypes.c_void_p):
        event_handle = _spx_handle(event_handle)
        obj = _unpack_context(context)
        if obj is not None:
            event = SpeechSynthesisBookmarkEventArgs(event_handle)
            obj.__bookmark_reached_signal.signal(event)


class Connection():
    """
    Proxy class for managing the connection to the speech service of the specified
    :class:`.Recognizer`.

    By default, a :class:`.Recognizer` autonomously manages connection to service when needed. The
    :class:`.Connection` class provides additional methods for users to explicitly open or close a
    connection and to subscribe to connection status changes. The use of :class:`.Connection` is
    optional. It is intended for scenarios where fine tuning of application behavior based on connection
    status is needed. Users can optionally call :meth:`.open()` to manually initiate a service connection
    before starting recognition on the :class:`.Recognizer` associated with this :class:`.Connection`.
    After starting a recognition, calling :meth:`.open()` or :meth:`close()` might fail. This will not impact
    the Recognizer or the ongoing recognition. Connection might drop for various reasons, the Recognizer will
    always try to reinstitute the connection as required to guarantee ongoing operations. In all these cases
    :obj:`.connected`/:obj:`.disconnected` events will indicate the change of the connection status.

    .. note::
      Updated in version 1.17.0.
    """

    def __init__(self, handle: _spx_handle):
        """
        Constructor for internal use.
        """
        self.__handle = _Handle(handle, _sdk_lib.connection_handle_is_valid, _sdk_lib.connection_handle_release)

    def __del__(self):
        def clean_signal(signal: EventSignal):
            if signal is not None:
                signal.disconnect_all()
        clean_signal(self.__connected_signal)
        clean_signal(self.__disconnected_signal)

    @property
    def _handle(self):
        return self.__handle.get()

    @classmethod
    def from_recognizer(cls, recognizer: Recognizer) -> 'Connection':
        """
        Gets the :class:`.Connection` instance from the specified recognizer.
        """
        handle = _spx_handle(0)
        _call_hr_fn(fn=_sdk_lib.connection_from_recognizer, *[recognizer._handle, ctypes.byref(handle)])
        return cls(handle)

    @classmethod
    def from_speech_synthesizer(cls, speech_synthesizer: SpeechSynthesizer) -> 'Connection':
        """
        Gets the :class:`.Connection` instance from the specified speech synthesizer.

        .. note::
          Added in version 1.17.0.
        """
        handle = _spx_handle(0)
        _call_hr_fn(fn=_sdk_lib.connection_from_speech_synthesizer, *[speech_synthesizer._handle, ctypes.byref(handle)])
        return cls(handle)

    # Import of DialogServiceConnector is done here in order to avoid circular import issue during initialization.
    from .dialog import DialogServiceConnector

    @classmethod
    def from_dialog_service_connector(cls, dialog_service_connector: DialogServiceConnector) -> 'Connection':
        """
        Gets the :class:`.Connection` instance from the specified dialog service connector.

        """
        handle = _spx_handle(0)
        _call_hr_fn(fn=_sdk_lib.connection_from_dialog_service_connector, *[dialog_service_connector._handle, ctypes.byref(handle)])
        return cls(handle)

    def open(self, for_continuous_recognition: bool):
        """
        Starts to set up connection to the service. Users can optionally call :meth:`.open()` to
        manually set up a connection in advance before starting recognition on the
        :class:`.Recognizer` associated with this :class:`.Connection`. After starting recognition,
        calling :meth:`.open()`) might fail, depending on the process state of the
        :class:`.Recognizer`. But the failure does not affect the state of the associated
        :class:`.Recognizer`.

        :param forContinuousRecognition: indicates whether the connection is used for continuous
          recognition or single-shot recognition. It takes no effect if the connection is from SpeechSynthsizer.

        .. note:: On return, the connection might not be ready yet. Please subscribe to the
          `connected` event to be notified when the connection is established.
        """
        _call_hr_fn(fn=_sdk_lib.connection_open, *[self._handle, for_continuous_recognition])

    def close(self):
        """
        Closes the connection the service. Users can optionally call :meth:`close()` to manually
        shutdown the connection of the associated :class:`.Recognizer`. The call might fail,
        depending on the process state of the :class:`.Recognizer`. But the failure does not affect
        the state of the associated :class:`.Recognizer`.
        """
        _call_hr_fn(fn=_sdk_lib.connection_close, *[self._handle])

    __connected_signal = None

    @property
    def connected(self) -> EventSignal:
        """
        The Connected event to indicate that the recognizer is connected to service.

        """
        def connected_connection(signal: EventSignal, handle: _spx_handle):
            callback = Connection.__connected_callback if signal.is_connected() else None
            _sdk_lib.connection_connected_set_callback(handle, callback, signal._context_ptr)
        if self.__connected_signal is None:
            self.__connected_signal = EventSignal(self, connected_connection)
        return self.__connected_signal

    @ctypes.CFUNCTYPE(None, _spx_handle, ctypes.c_void_p)
    def __connected_callback(event_handle: _spx_handle, context: ctypes.c_void_p):
        event_handle = _spx_handle(event_handle)
        obj = _unpack_context(context)
        if obj is not None:
            event = ConnectionEventArgs(event_handle)
            obj.__connected_signal.signal(event)

    __disconnected_signal = None

    @property
    def disconnected(self) -> EventSignal:
        """
        The Disconnected event to indicate that the recognizer is disconnected from service.

        """
        def disconnected_connection(signal: EventSignal, handle: _spx_handle):
            callback = Connection.__disconnected_callback if signal.is_connected() else None
            _sdk_lib.connection_disconnected_set_callback(handle, callback, signal._context_ptr)
        if self.__disconnected_signal is None:
            self.__disconnected_signal = EventSignal(self, disconnected_connection)
        return self.__disconnected_signal

    @ctypes.CFUNCTYPE(None, _spx_handle, ctypes.c_void_p)
    def __disconnected_callback(event_handle: _spx_handle, context: ctypes.c_void_p):
        event_handle = _spx_handle(event_handle)
        obj = _unpack_context(context)
        if obj is not None:
            event = ConnectionEventArgs(event_handle)
            obj.__disconnected_signal.signal(event)

    def send_message_async(self, path: str, payload: str) -> ResultFuture:
        """
        Sends a message to the service.

        :param path: The message path.
        :param payload: The message payload.

        :returns: A future that is fulfilled once the message is sent.
        """
        async_handle = _spx_handle(0)
        c_path = _c_str(path)
        c_payload = _c_str(payload)
        _call_hr_fn(fn=_sdk_lib.connection_send_message_async, *[self._handle, c_path, c_payload, ctypes.byref(async_handle)])

        def resolve_future(handle: _spx_handle):
            _call_hr_fn(fn=_sdk_lib.connection_send_message_wait_for, *[handle, max_uint32])
            _sdk_lib.connection_async_handle_release(handle)
            return None
        return ResultFuture(async_handle, resolve_future, None)

    def set_message_property(self, path: str, property_name: str, property_value: str):
        """
        Appends a parameter in a message to service.

        :param path: The message path.
        :param property_name: The property name that you want to set.
        :param property_value: The value of the property that you want to set.
        """
        c_path = _c_str(path)
        c_name = _c_str(property_name)
        c_value = _c_str(property_value)
        _call_hr_fn(fn=_sdk_lib.connection_set_message_property, *[self._handle, c_path, c_name, c_value])


class KeywordRecognitionResult(RecognitionResult):
    """
    Result of a keyword recognition operation.
    """

    def __init__(self, handle: _spx_handle):
        """
        Constructor for internal use.
        """
        super().__init__(handle)

    def __str__(self):
        return u'{}(result_id={}, text="{}", reason={})'.format(type(self).__name__, self.result_id, self.text,
                                                                self.reason)


class KeywordRecognitionEventArgs(RecognitionEventArgs):
    """
    Class for keyword recognition event arguments.
    """

    def __init__(self, handle: _spx_handle):
        """
        Constructor for internal use.
        """
        super().__init__(handle)
        result_handle = _spx_handle(0)
        _call_hr_fn(fn=_sdk_lib.recognizer_recognition_event_get_result, *[self._handle, ctypes.byref(result_handle)])
        self._result = KeywordRecognitionResult(result_handle)

    @property
    def result(self) -> KeywordRecognitionResult:
        """
        Keyword recognition event result.
        """
        return self._result

    def __str__(self):
        return u'{}(result=[{}])'.format(type(self).__name__, self._result.__str__())


class KeywordRecognizer:
    """
    A keyword recognizer.

    :param audio_config: The config for audio input.
        This parameter is optional.
        If it is None or not provided, the default microphone device will be used for audio input.
    """

    def __init__(self, audio_config: Optional[audio.AudioConfig] = None):
        handle = _spx_handle(0)
        audio_handle = audio_config._handle if audio_config is not None else None
        _call_hr_fn(fn=_sdk_lib.recognizer_create_keyword_recognizer_from_audio_config, *[ctypes.byref(handle), audio_handle])
        self.__handle = _Handle(handle, _sdk_lib.recognizer_handle_is_valid, _sdk_lib.recognizer_handle_release)
        prop_handle = _spx_handle(0)
        _call_hr_fn(fn=_sdk_lib.recognizer_get_property_bag, *[handle, ctypes.byref(prop_handle)])
        self.__properties = PropertyCollection(prop_handle)

    def __del__(self):
        def clean_signal(signal: EventSignal):
            if signal is not None:
                signal.disconnect_all()
        clean_signal(self.__recognized_signal)
        clean_signal(self.__canceled_signal)

    @property
    def _handle(self):
        return self.__handle.get()

    def recognize_once_async(self, model: KeywordRecognitionModel) -> ResultFuture:
        """
        Asynchronously initiates keyword recognition operation.

        :param model: The keyword recognition model that specifies the keyword to be recognized.

        :returns: A future that is fulfilled once recognition has been initialized.
        """
        async_handle = _spx_handle(0)
        _call_hr_fn(fn=_sdk_lib.recognizer_recognize_keyword_once_async, *[self._handle, model._handle, ctypes.byref(async_handle)])

        def resolve_future(handle: _spx_handle):
            result_handle = _spx_handle(0)
            _call_hr_fn(
                fn=_sdk_lib.recognizer_recognize_keyword_once_async_wait_for,
                *[handle, max_uint32, ctypes.byref(result_handle)])
            _sdk_lib.recognizer_async_handle_release(handle)
            return result_handle
        return ResultFuture(async_handle, resolve_future, KeywordRecognitionResult)

    def stop_recognition_async(self):
        """
        Asynchronously terminates ongoing keyword recognition operation.

        :returns: A future that is fulfilled once recognition has been stopped.
        """
        async_handle = _spx_handle(0)
        _call_hr_fn(fn=_sdk_lib.recognizer_stop_keyword_recognition_async, *[self._handle, ctypes.byref(async_handle)])

        def resolve_future(handle: _spx_handle):
            _call_hr_fn(fn=_sdk_lib.recognizer_stop_keyword_recognition_async_wait_for, *[handle, max_uint32])
            _sdk_lib.recognizer_async_handle_release(handle)
            return None
        return ResultFuture(async_handle, resolve_future, None)

    @property
    def properties(self) -> PropertyCollection:
        """
        A collection of properties and their values defined for this KeywordRecognizer.
        """
        return self.__properties

    __recognized_signal = None

    @property
    def recognized(self) -> EventSignal:
        """
        Signal for events containing final keyword recognition results (indicating a successful
        recognition attempt).

        Callbacks connected to this signal are called with a
        :class:`.KeywordRecognitionEventArgs` instance as the single argument.
        """
        def recognized_connection(signal: EventSignal, handle: _spx_handle):
            callback = KeywordRecognizer.__recognized_callback if signal.is_connected() else None
            _sdk_lib.recognizer_recognized_set_callback(handle, callback, signal._context_ptr)
        if self.__recognized_signal is None:
            self.__recognized_signal = EventSignal(self, recognized_connection)
        return self.__recognized_signal

    @ctypes.CFUNCTYPE(None, _spx_handle, _spx_handle, ctypes.c_void_p)
    def __recognized_callback(handle: _spx_handle, event_handle: _spx_handle, context: ctypes.c_void_p):
        event_handle = _spx_handle(event_handle)
        obj = _unpack_context(context)
        if obj is not None:
            event = KeywordRecognitionEventArgs(event_handle)
            obj.__recognized_signal.signal(event)

    __canceled_signal = None

    @property
    def canceled(self) -> EventSignal:
        """
        Signal for events containing canceled keyword recognition results.

        Callbacks connected to this signal are called with a
        :class:`.SpeechRecognitionCanceledEventArgs` instance as the single argument.
        """
        def canceled_connection(signal: EventSignal, handle: _spx_handle):
            callback = KeywordRecognizer.__canceled_callback if signal.is_connected() else None
            _sdk_lib.recognizer_canceled_set_callback(handle, callback, signal._context_ptr)
        if self.__canceled_signal is None:
            self.__canceled_signal = EventSignal(self, canceled_connection)
        return self.__canceled_signal

    @ctypes.CFUNCTYPE(None, _spx_handle, _spx_handle, ctypes.c_void_p)
    def __canceled_callback(handle: _spx_handle, event_handle: _spx_handle, context: ctypes.c_void_p):
        event_handle = _spx_handle(event_handle)
        obj = _unpack_context(context)
        if obj is not None:
            event = SpeechRecognitionCanceledEventArgs(event_handle)
            obj.__canceled_signal.signal(event)


class PronunciationAssessmentConfig:
    """
    Represents pronunciation assessment configuration

    .. note::
      Added in version 1.14.0.

    The configuration can be initialized in two ways:

    - from parameters: pass reference text, grading system, granularity, enable miscue and scenario id.
    - from json: pass a json string

    For the parameters details, see
    https://docs.microsoft.com/azure/cognitive-services/speech-service/rest-speech-to-text#pronunciation-assessment-parameters

    :param reference_text: The reference text for pronunciation assessment
    :param grading_system: The point system for score calibration
    :param granularity: The evaluation granularity
    :param enable_miscue: If enables miscue calculation
    :param json_string: A json string representing pronunciation assessment parameters
    """

    def __init__(self, reference_text: Optional[str] = None,
                 grading_system: PronunciationAssessmentGradingSystem = PronunciationAssessmentGradingSystem.FivePoint,
                 granularity: PronunciationAssessmentGranularity = PronunciationAssessmentGranularity.Phoneme,
                 enable_miscue: bool = False,
                 json_string: Optional[str] = None):
        if reference_text is not None and json_string is not None:
            raise ValueError(
                "reference text and json string cannot be both specified to create PronunciationAssessmentConfig")
        handle = _spx_handle(0)
        if json_string is not None:
            c_json = _c_str(json_string)
            _call_hr_fn(fn=_sdk_lib.create_pronunciation_assessment_config_from_json, *[ctypes.byref(handle), c_json])
        else:
            ref_text = "" if reference_text is None else reference_text
            c_ref = _c_str(ref_text)
            _call_hr_fn(
                fn=_sdk_lib.create_pronunciation_assessment_config,
                *[ctypes.byref(handle), c_ref, grading_system.value, granularity.value, enable_miscue])
        self.__handle = _Handle(
            handle,
            _sdk_lib.pronunciation_assessment_config_is_handle_valid,
            _sdk_lib.pronunciation_assessment_config_release)
        prop_handle = _spx_handle(0)
        _call_hr_fn(fn=_sdk_lib.pronunciation_assessment_config_get_property_bag, *[handle, ctypes.byref(prop_handle)])
        self.__properties = PropertyCollection(prop_handle)

    @property
    def _handle(self):
        return self.__handle.get()

    def to_json(self) -> str:
        """
        Gets to json string of pronunciation assessment parameters.

        :returns: the json string.
        """
        return _call_string_function_and_free(
            fn=_sdk_lib.pronunciation_assessment_config_to_json,
            *[self._handle]
        )

    def apply_to(self, recognizer: Recognizer) -> None:
        """
        Apply the settings in this config to a recognizer.

        :param recognizer: the target recognizer.
        """
        _call_hr_fn(fn=_sdk_lib.pronunciation_assessment_config_apply_to_recognizer, *[self._handle, recognizer._handle])

    @property
    def reference_text(self) -> str:
        """
        The reference text.
        """
        return self.__properties.get_property(PropertyId.PronunciationAssessment_ReferenceText)

    @reference_text.setter
    def reference_text(self, text: str) -> None:
        self.__properties.set_property(PropertyId.PronunciationAssessment_ReferenceText, text)

    @property
    def phoneme_alphabet(self) -> str:
        raise NotImplementedError("Phoneme alphabet getter is not supported.")

    @phoneme_alphabet.setter
    def phoneme_alphabet(self, alphabet: str) -> None:
        """
        The phoneme alphabet.
        """
        self.__properties.set_property(PropertyId.PronunciationAssessment_PhonemeAlphabet, alphabet)

    @property
    def nbest_phoneme_count(self) -> int:
        raise NotImplementedError("NBest phoneme count getter is not supported.")

    @nbest_phoneme_count.setter
    def nbest_phoneme_count(self, count: int):
        """
        The number of nbest phonemes.
        """
        count_str = str(count)
        self.__properties.set_property(PropertyId.PronunciationAssessment_NBestPhonemeCount, count_str)

    def enable_prosody_assessment(self) -> None:
        """
        Enable prosody assessment.
        """
        self.__properties.set_property(PropertyId.PronunciationAssessment_EnableProsodyAssessment, "true")

    def enable_content_assessment_with_topic(self, topic: str) -> None:
        """
        Enable content assessment with topic.

        :param topic: the topic.
        """
        self.__properties.set_property(PropertyId.PronunciationAssessment_ContentTopic, topic)


class PronunciationAssessmentNBestPhoneme:
    """
    Contains nbest phoneme information.

    .. note::
      Added in version 1.20.0.
    """

    def __init__(self, _json):
        self._phoneme = _json['Phoneme']
        self._score = _json['Score']

    @property
    def phoneme(self) -> str:
        """
        The phoneme.
        """
        return self._phoneme

    @property
    def score(self) -> float:
        """
        The score.
        """
        return self._score


class PronunciationAssessmentPhonemeResult:
    """
    Contains phoneme level pronunciation assessment result

    .. note::
      Added in version 1.14.0.
    """

    def __init__(self, _json):
        self._phoneme = _json['Phoneme']
        self._accuracy_score = _json['PronunciationAssessment']['AccuracyScore']
        if 'NBestPhonemes' in _json['PronunciationAssessment']:
            self._nbest_phonemes = [PronunciationAssessmentNBestPhoneme(x) for x in
                                    _json['PronunciationAssessment']['NBestPhonemes']]
        else:
            self._nbest_phonemes = None

    @property
    def phoneme(self) -> str:
        """
        The phoneme text.
        """
        return self._phoneme

    @property
    def accuracy_score(self) -> float:
        """
        The score indicating the pronunciation accuracy of the given speech, which indicates
        how closely the phonemes match a native speaker's pronunciation
        """
        return self._accuracy_score

    @property
    def nbest_phonemes(self) -> List[PronunciationAssessmentNBestPhoneme]:
        """
        The list of nbest phonemes.
        """
        return self._nbest_phonemes


class SyllableLevelTimingResult:
    """
    Contains syllable level timing result

    .. note::
      Added in version 1.20.0.
    """

    def __init__(self, _json):
        self._syllable = _json['Syllable']
        self._grapheme = _json.get('Grapheme')
        self._duration = _json['Duration']
        self._offset = _json['Offset']
        self._accuracy_score = _json['PronunciationAssessment']['AccuracyScore']

    @property
    def syllable(self) -> str:
        """
        The syllable.
        """
        return self._syllable

    @property
    def grapheme(self) -> str:
        """
        The grapheme.
        """
        return self._grapheme

    @property
    def duration(self) -> int:
        """
        The duration of the syllable, in ticks (100 nanoseconds).
        """
        return self._duration

    @property
    def offset(self) -> int:
        """
        The offset of the syllable, in ticks (100 nanoseconds).
        """
        return self._offset

    @property
    def accuracy_score(self) -> float:
        """
        The score indicating the pronunciation accuracy of the given speech, which indicates
        how closely the phonemes match a native speaker's pronunciation
        """
        return self._accuracy_score


class PronunciationAssessmentWordResult:
    """
    Contains word level pronunciation assessment result

    .. note::
      Added in version 1.14.0.
    """

    def __init__(self, _json):
        self._word = _json['Word']
        if 'PronunciationAssessment' in _json:
            self._accuracy_score = _json['PronunciationAssessment'].get('AccuracyScore', 0)
            self._error_type = _json['PronunciationAssessment']['ErrorType']
        if 'Phonemes' in _json:
            self._phonemes = [PronunciationAssessmentPhonemeResult(p) for p in _json['Phonemes']]
        if 'Syllables' in _json:
            self._syllables = [SyllableLevelTimingResult(s) for s in _json['Syllables']]

    @property
    def word(self) -> str:
        """
        The word text.
        """
        return self._word

    @property
    def accuracy_score(self) -> float:
        """
        The score indicating the pronunciation accuracy of the given speech, which indicates
        how closely the phonemes match a native speaker's pronunciation.
        Note: The accuracy score is invalid if the error_type of this word is "Omission"
        """
        return self._accuracy_score

    @property
    def error_type(self) -> str:
        """
        This value indicates whether a word is omitted, inserted or badly pronounced, compared to ReferenceText.
        Possible values are None (meaning no error on this word), Omission, Insertion and Mispronunciation.
        """
        return self._error_type

    @property
    def phonemes(self) -> List[PronunciationAssessmentPhonemeResult]:
        """
        Phoneme level pronunciation assessment result
        """
        return self._phonemes

    @property
    def syllables(self) -> List[SyllableLevelTimingResult]:
        """
        Syllable level timing result
        Added in version 1.20.0
        """
        return self._syllables


class ContentAssessmentResult:
    """
    Represents content assessment result.
    """

    def __init__(self, _json):
        self._grammar_score = _json.get('GrammarScore')
        self._vocabulary_score = _json.get('VocabularyScore')
        self._topic_score = _json.get('TopicScore')

    @property
    def grammar_score(self) -> float:
        """
        The grammar score.
        """
        return self._grammar_score

    @property
    def vocabulary_score(self) -> float:
        """
        The vocabulary score.
        """
        return self._vocabulary_score

    @property
    def topic_score(self) -> float:
        """
        The topic score.
        """
        return self._topic_score


class PronunciationAssessmentResult:
    """
    Represents pronunciation assessment result.

    .. note::
      Added in version 1.14.0.

    The result can be initialized from a speech recognition result.

    :param result: The speech recognition result
    """

    def __init__(self, result: SpeechRecognitionResult):
        json_result = result.properties.get(PropertyId.SpeechServiceResponse_JsonResult)
        if json_result is not None and ('PronunciationAssessment' in json_result or 'ContentAssessment' in json_result):
            jo = json.loads(json_result)
            nb = jo['NBest'][0]
            if 'PronunciationAssessment' in nb:
                self._accuracy_score = nb['PronunciationAssessment']['AccuracyScore']
                self._pronunciation_score = nb['PronunciationAssessment']['PronScore']
                self._completeness_score = nb['PronunciationAssessment']['CompletenessScore']
                self._fluency_score = nb['PronunciationAssessment']['FluencyScore']
                self._prosody_score = nb['PronunciationAssessment'].get('ProsodyScore', None)
            if 'ContentAssessment' in nb:
                self._content_assessment_result = ContentAssessmentResult(nb['ContentAssessment'])
            else:
                self._content_assessment_result = None
            if 'Words' in nb:
                self._words = [PronunciationAssessmentWordResult(w) for w in nb['Words']]

    @property
    def accuracy_score(self) -> float:
        """
        The score indicating the pronunciation accuracy of the given speech, which indicates
        how closely the phonemes match a native speaker's pronunciation
        """
        return self._accuracy_score

    @property
    def pronunciation_score(self) -> float:
        """
        The overall score indicating the pronunciation quality of the given speech.
        This is calculated from AccuracyScore, FluencyScore and CompletenessScore with weight.
        """
        return self._pronunciation_score

    @property
    def completeness_score(self) -> float:
        """
        The score indicating the completeness of the given speech by calculating the ratio of
        pronounced words towards entire input.
        """
        return self._completeness_score

    @property
    def fluency_score(self) -> float:
        """
        The score indicating the fluency of the given speech.
        """
        return self._fluency_score

    @property
    def prosody_score(self) -> Optional[float]:
        """
        The score indicating the prosody of the given speech.
        """
        return self._prosody_score

    @property
    def content_assessment_result(self) -> Optional[ContentAssessmentResult]:
        """
        Content assessment result.
        """
        return self._content_assessment_result

    @property
    def words(self) -> List[PronunciationAssessmentWordResult]:
        """
        Word level pronunciation assessment result.
        """
        return self._words


class SourceLanguageRecognizer(Recognizer):
    """
    A source language recognizer - standalone language recognizer, can be used for single language or continuous language detection.

    .. note::
      Added in version 1.18.0.

    :param speech_config: The config for the speech recognizer
    :param auto_detect_source_language_config: The auto detection source language config
    :param audio_config: The config for the audio input
    """

    def __init__(self, speech_config: SpeechConfig,
                 auto_detect_source_language_config: Optional[languageconfig.AutoDetectSourceLanguageConfig] = None,
                 audio_config: Optional[audio.AudioConfig] = None):
        if not isinstance(speech_config, SpeechConfig):
            raise ValueError('speech_config must be a SpeechConfig instance')
        if auto_detect_source_language_config is None:
            raise ValueError(
                'cannot construct SourceLanguageRecognizer, please only specify auto_detect_source_language_config')
        audio_handle = audio_config._handle if audio_config is not None else None
        handle = _spx_handle(0)
        # auto_detect_source_language_config must not be None if we arrive this code
        _call_hr_fn(fn=_sdk_lib.recognizer_create_source_language_recognizer_from_auto_detect_source_lang_config, *[
            ctypes.byref(handle),
            speech_config._handle, auto_detect_source_language_config._handle, audio_handle
        ])
        super().__init__(handle)

    def __del__(self):
        def clean_signal(signal: EventSignal):
            if signal is not None:
                signal.disconnect_all()
        clean_signal(self.__recognized_signal)
        clean_signal(self.__canceled_signal)
        super(type(self), self).__del__()

    def recognize_once(self) -> SpeechRecognitionResult:
        """
        Performs detection in a blocking (synchronous) mode. Returns after a single utterance is
        detected. The task returns the recognition
        text as result. For long-running multi-utterance recognition, use
        :py:meth:`.start_continuous_recognition_async` instead.

        :returns: The result value of the synchronous recognition.
        """
        return self.recognize_once_async().get()

    def recognize_once_async(self) -> ResultFuture:
        """
        Performs detection in a non-blocking (asynchronous) mode. This will detect a single
        utterance. For long-running multi-utterance
        recognition, use :py:meth:`.start_continuous_recognition_async` instead.

        :returns: A future containing the result value of the asynchronous recognition.
        """
        async_handle = _spx_handle(0)
        _call_hr_fn(fn=_sdk_lib.recognizer_recognize_once_async, *[self._handle, ctypes.byref(async_handle)])

        def resolve_future(handle: _spx_handle):
            result_handle = _spx_handle(0)
            _call_hr_fn(fn=_sdk_lib.recognizer_recognize_once_async_wait_for, *[handle, max_uint32, ctypes.byref(result_handle)])
            _sdk_lib.recognizer_async_handle_release(handle)
            return result_handle
        return ResultFuture(async_handle, resolve_future, SpeechRecognitionResult)

    def start_continuous_recognition_async(self) -> ResultFuture:
        """
        Asynchronously initiates continuous recognition operation. User has to connect to
        EventSignal to receive recognition results. Call
        :py:meth:`.stop_continuous_recognition_async` to stop the recognition.

        :returns: A future that is fulfilled once recognition has been initialized.
        """
        async_handle = _spx_handle(0)
        _call_hr_fn(fn=_sdk_lib.recognizer_start_continuous_recognition_async, *[self._handle, ctypes.byref(async_handle)])

        def resolve_future(handle: _spx_handle):
            _call_hr_fn(fn=_sdk_lib.recognizer_start_continuous_recognition_async_wait_for, *[handle, max_uint32])
            _sdk_lib.recognizer_async_handle_release(handle)
            return None
        return ResultFuture(async_handle, resolve_future, None)

    def stop_continuous_recognition_async(self):
        """
        Asynchronously terminates ongoing continuous recognition operation.

        :returns: A future that is fulfilled once recognition has been stopped.
        """
        async_handle = _spx_handle(0)
        _call_hr_fn(fn=_sdk_lib.recognizer_stop_continuous_recognition_async, *[self._handle, ctypes.byref(async_handle)])

        def resolve_future(handle: _spx_handle):
            _call_hr_fn(fn=_sdk_lib.recognizer_stop_continuous_recognition_async_wait_for, *[handle, max_uint32])
            _sdk_lib.recognizer_async_handle_release(handle)
            return None
        return ResultFuture(async_handle, resolve_future, None)

    @property
    def recognizing(self) -> EventSignal:
        """
        Signal for events containing intermediate recognition results.

        Callbacks connected to this signal are called with a :class:`.SpeechRecognitionEventArgs`
        instance as the single argument.
        """
        return None

    __recognized_signal = None

    @property
    def recognized(self) -> EventSignal:
        """
        Signal for events containing final recognition results (indicating a successful
        recognition attempt).

        Callbacks connected to this signal are called with a :class:`.SpeechRecognitionEventArgs`
        instance as the single argument, dependent on the type of recognizer.
        """
        def recognized_connection(signal: EventSignal, handle: _spx_handle):
            callback = SourceLanguageRecognizer.__recognized_callback if signal.is_connected() else None
            _sdk_lib.recognizer_recognized_set_callback(handle, callback, signal._context_ptr)
        if self.__recognized_signal is None:
            self.__recognized_signal = EventSignal(self, recognized_connection)
        return self.__recognized_signal

    @ctypes.CFUNCTYPE(None, _spx_handle, _spx_handle, ctypes.c_void_p)
    def __recognized_callback(reco_handle: _spx_handle, event_handle: _spx_handle, context: ctypes.c_void_p):
        event_handle = _spx_handle(event_handle)
        obj = _unpack_context(context)
        if obj is not None:
            event = SpeechRecognitionEventArgs(event_handle)
            obj.__recognized_signal.signal(event)

    __canceled_signal = None

    @property
    def canceled(self) -> EventSignal:
        """
        Signal for events containing canceled recognition results (indicating a recognition attempt
        that was canceled as a result or a direct cancellation request or, alternatively, a
        transport or protocol failure).

        Callbacks connected to this signal are called with a
        :class:`.SpeechRecognitionCanceledEventArgs`, instance as the single argument.
        """
        def canceled_connection(signal: EventSignal, handle: _spx_handle):
            callback = SourceLanguageRecognizer.__canceled_callback if signal.is_connected() else None
            _sdk_lib.recognizer_canceled_set_callback(handle, callback, signal._context_ptr)
        if self.__canceled_signal is None:
            self.__canceled_signal = EventSignal(self, canceled_connection)
        return self.__canceled_signal

    @ctypes.CFUNCTYPE(None, _spx_handle, _spx_handle, ctypes.c_void_p)
    def __canceled_callback(reco_handle: _spx_handle, event_handle: _spx_handle, context: ctypes.c_void_p):
        event_handle = _spx_handle(event_handle)
        obj = _unpack_context(context)
        if obj is not None:
            event = SpeechRecognitionCanceledEventArgs(event_handle)
            obj.__canceled_signal.signal(event)
