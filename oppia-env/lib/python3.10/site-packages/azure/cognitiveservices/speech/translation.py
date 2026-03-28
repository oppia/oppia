# Copyright (c) Microsoft. All rights reserved.
# See https://aka.ms/csspeech/license for the full license information.
"""
Classes related to translation of speech to other languages.
"""

import ctypes

from .properties import PropertyCollection
from .speech import (SpeechConfig, Recognizer, ResultFuture, RecognitionEventArgs,
                     RecognitionResult, EventSignal, SessionEventArgs, CancellationDetails)
from .enums import CancellationErrorCode, CancellationReason, PropertyId, ResultReason
from .audio import AudioConfig
from . import languageconfig
from .interop import _Handle, _c_str, _spx_handle, _call_hr_fn, _sdk_lib, max_uint32, _unpack_context

from typing import Optional, Iterable, Tuple, Dict
OptionalStr = Optional[str]


class SpeechTranslationConfig(SpeechConfig):
    """
    Class that defines configurations for translation with speech input.

    The configuration can be initialized in different ways:

    - from subscription: pass a subscription key and a region
    - from endpoint: pass a subscription key and an endpoint
    - from host: pass a subscription key and a host address
    - from authorization token: pass an authorization token and a region

    :param subscription: The subscription key.
    :param region: The region name (see the `region page <https://aka.ms/csspeech/region>`_).
    :param endpoint: The service endpoint to connect to.
    :param host: The service host to connect to. Standard resource path will be assumed. Format
        is "protocol://host:port" where ":port" is optional.
    :param auth_token: The authorization token.
    :param speech_recognition_language: The input language to the speech recognition. The language
        is specified in BCP-47 format.
    :param target_languages: The target languages for translation.
    :param voice_name: The voice to use for synthesized output.
    """

    def __init__(self, subscription: OptionalStr = None, region: OptionalStr = None,
                 endpoint: OptionalStr = None, host: OptionalStr = None, auth_token: OptionalStr = None,
                 target_languages: Iterable[str] = [], voice_name: str = '',
                 speech_recognition_language: str = ''):

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
        handle = _spx_handle(0)
        c_subscription = _c_str(subscription)
        c_region = _c_str(region)
        if region is not None and subscription is not None:
            if endpoint is not None or host is not None or auth_token is not None:
                raise ValueError(generic_error_message)
            _call_hr_fn(fn=_sdk_lib.speech_translation_config_from_subscription, *[ctypes.byref(handle), c_subscription, c_region])
        elif region is not None and auth_token is not None:
            if endpoint is not None or host is not None or subscription is not None:
                raise ValueError(generic_error_message)
            c_token = _c_str(auth_token)
            _call_hr_fn(fn=_sdk_lib.speech_translation_config_from_authorization_token, *[ctypes.byref(handle), c_token, c_region])
        elif endpoint is not None:
            c_endpoint = _c_str(endpoint)
            _call_hr_fn(fn=_sdk_lib.speech_translation_config_from_endpoint, *[ctypes.byref(handle), c_endpoint, c_subscription])
        elif host is not None:
            c_host = _c_str(host)
            _call_hr_fn(fn=_sdk_lib.speech_translation_config_from_host, *[ctypes.byref(handle), c_host, c_subscription])
        else:
            raise ValueError(generic_error_message)
        self.__handle = _Handle(handle, _sdk_lib.speech_config_is_handle_valid, _sdk_lib.speech_config_release)
        prop_handle = _spx_handle(0)
        _call_hr_fn(fn=_sdk_lib.speech_config_get_property_bag, *[handle, ctypes.byref(prop_handle)])
        self._properties = PropertyCollection(prop_handle)
        self._properties.set_property_by_name("AZAC-SDK-PROGRAMMING-LANGUAGE", "Python")
        if speech_recognition_language is not None:
            self.speech_recognition_language = speech_recognition_language

        if target_languages:
            for lang in target_languages:
                self.add_target_language(lang)

        self.voice_name = voice_name

    @property
    def _handle(self) -> _spx_handle:
        return self.__handle.get()

    @property
    def voice_name(self) -> str:
        """
        The voice to use for synthesized output.
        """
        return self.get_property(PropertyId.SpeechServiceConnection_TranslationVoice)

    @voice_name.setter
    def voice_name(self, voice_name):
        self.set_property(PropertyId.SpeechServiceConnection_TranslationVoice, voice_name)

    @property
    def target_languages(self) -> Tuple[str]:
        """
        The target languages for translation.
        """
        languages = self.get_property(PropertyId.SpeechServiceConnection_TranslationToLanguages)
        if len(languages) == 0:
            return tuple([])
        return tuple(languages.split(","))

    def add_target_language(self, language: str):
        """
        Add `language` to the list of target languages for translation.

        :param language: The language code to add.
        """
        c_lang = _c_str(language)
        _call_hr_fn(fn=_sdk_lib.speech_translation_config_add_target_language, *[self._handle, c_lang])

    def remove_target_language(self, language: str):
        """
        Remove `language` from the list of target languages for translation.

        .. note::
          Added in version 1.7.0.

        :param language: The language code to remove.
        """
        c_lang = _c_str(language)
        _call_hr_fn(fn=_sdk_lib.speech_translation_config_remove_target_language, *[self._handle, c_lang])

    def set_custom_model_category_id(self, categoryid: str):
        """
        Sets a Category Id that will be passed to service. Category Id is used to find the custom model.

        :param categoryid: the category Id.
        """
        c_categoryid = _c_str(categoryid)
        _call_hr_fn(fn=_sdk_lib.speech_translation_config_set_custom_model_category_id, *[self._handle, c_categoryid])


class TranslationRecognitionEventArgs(RecognitionEventArgs):
    """
    Defines payload that is sent with the event Recognizing or Recognized.
    """

    def __init__(self, handle: _spx_handle):
        """
        Constructor for internal use.
        """
        super().__init__(handle)
        result_handle = _spx_handle(0)
        _call_hr_fn(fn=_sdk_lib.recognizer_recognition_event_get_result, *[self._handle, ctypes.byref(result_handle)])
        self._result = TranslationRecognitionResult(result_handle)

    @property
    def result(self) -> "TranslationRecognitionResult":
        """
        Contains the translation recognition result.
        """
        return self._result

    def __str__(self):
        return u'{}(session_id={}, result={})'.format(type(self).__name__, self.session_id, self.result)


class TranslationRecognitionCanceledEventArgs(TranslationRecognitionEventArgs):
    """
    Class for translation recognition canceled event arguments.
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

    @property
    def reason(self) -> CancellationReason:
        """
        The reason the result was canceled.
        """
        return self.cancellation_details.reason

    @property
    def error_code(self) -> CancellationErrorCode:
        """
        The error code in case of an unsuccessful recognition (Reason is set to Error).
        If Reason is not Error, ErrorCode is set to NoError.
        """
        return self.cancellation_details.code

    @property
    def error_details(self) -> str:
        """
        The error message in case of an unsuccessful recognition (Reason is set to Error).
        """
        return self.cancellation_details.error_details


class TranslationSynthesisEventArgs(SessionEventArgs):
    """
    Defines payload that is sent with the event
    :py:attr:`azure.cognitiveservices.speech.translation.TranslationRecognizer.synthesizing`.
    """

    def __init__(self, handle: _spx_handle):
        """
        Constructor for internal use.
        """
        super().__init__(handle)
        result_handle = _spx_handle(0)
        _call_hr_fn(fn=_sdk_lib.recognizer_recognition_event_get_result, *[self._handle, ctypes.byref(result_handle)])
        self._result = TranslationSynthesisResult(result_handle)

    @property
    def result(self) -> "TranslationSynthesisResult":
        """
        Contains the translation synthesis result.
        """
        return self._result

    def __str__(self):
        return '{}(session_id={}, result={})'.format(
            type(self).__name__, self.session_id, self.result)


class TranslationRecognitionResult(RecognitionResult):
    """
    Defines the translation text result.
    """

    def __init__(self, handle: _spx_handle):
        """
        Constructor for internal use.
        """
        super().__init__(handle)
        translation_count = ctypes.c_size_t(0)
        _call_hr_fn(fn=_sdk_lib.translation_text_result_get_translation_count, *[handle, ctypes.byref(translation_count)])
        translations = dict()
        for i in range(translation_count.value):
            c_i = ctypes.c_size_t(i)
            c_lang_size = ctypes.c_size_t(0)
            c_text_size = ctypes.c_size_t(0)
            _call_hr_fn(
                fn=_sdk_lib.translation_text_result_get_translation,
                *[handle, c_i, None, None, ctypes.byref(c_lang_size), ctypes.byref(c_text_size)])
            c_lang = ctypes.create_string_buffer(c_lang_size.value)
            c_text = ctypes.create_string_buffer(c_text_size.value)
            _call_hr_fn(
                fn=_sdk_lib.translation_text_result_get_translation,
                *[handle, c_i, c_lang, c_text, ctypes.byref(c_lang_size), ctypes.byref(c_text_size)])
            lang = c_lang.value.decode(encoding='utf-8')
            text = c_text.value.decode(encoding='utf-8')
            translations[lang] = text
        self._translations = translations

    @property
    def translations(self) -> Dict[str, str]:
        """
        Presents the translation results. Each item in the map is a key value pair, where key is
        the language tag of the translated text, and value is the translation text in that
        language.
        """
        return self._translations

    def __str__(self):
        return u'{}(result_id={}, translations={}, reason={})'.format(
               type(self).__name__, self.result_id, dict(self.translations), self.reason)


class TranslationSynthesisResult():
    """
    Defines the translation synthesis result, i.e. the voice output of the translated text in the
    target language.
    """

    def __init__(self, handle: _spx_handle):
        """
        Constructor for internal use.
        """
        self.__handle = _Handle(handle, _sdk_lib.recognizer_result_handle_is_valid, _sdk_lib.recognizer_result_handle_release)
        c_reason = ctypes.c_int(0)
        _call_hr_fn(fn=_sdk_lib.result_get_reason, *[handle, ctypes.byref(c_reason)])
        self._reason = ResultReason(c_reason.value)
        c_size = ctypes.c_size_t(0)
        _sdk_lib.translation_synthesis_result_get_audio_data(handle, None, ctypes.byref(c_size))
        c_buff = ctypes.create_string_buffer(c_size.value)
        _call_hr_fn(fn=_sdk_lib.translation_synthesis_result_get_audio_data, *[handle, c_buff, ctypes.byref(c_size)])
        self._audio = c_buff.raw

    @property
    def _handle(self):
        return self.__handle.get()

    @property
    def audio(self) -> bytes:
        """
        The voice output of the translated text in the target language.
        """
        return self._audio

    @property
    def reason(self) -> "ResultReason":
        """
        Recognition reason.
        """
        return self._reason

    def __str__(self):
        return '{}(audio=<{} bytes of audio>, reason={})'.format(
            type(self).__name__, len(self.audio), self.reason)


class TranslationRecognizer(Recognizer):
    """
    Performs translation on the speech input.

    :param translation_config: The config for the translation recognizer.
    :param auto_detect_source_language_config: The auto detection source language config
    :param audio_config: The config for the audio input.
    """

    def __init__(self, translation_config: SpeechTranslationConfig,
                 auto_detect_source_language_config: Optional[languageconfig.AutoDetectSourceLanguageConfig] = None,
                 audio_config: Optional[AudioConfig] = None):
        if not isinstance(translation_config, SpeechTranslationConfig):
            raise ValueError('translation_config must be a SpeechTranslationConfig instance')
        audio_config_handle = audio_config._handle if audio_config is not None else None
        handle = _spx_handle(0)
        if auto_detect_source_language_config is None:
            _call_hr_fn(
                fn=_sdk_lib.recognizer_create_translation_recognizer_from_config,
                *[ctypes.byref(handle), translation_config._handle, audio_config_handle])
        else:
            _call_hr_fn(
                fn=_sdk_lib.recognizer_create_translation_recognizer_from_auto_detect_source_lang_config,
                *[ctypes.byref(handle), translation_config._handle, auto_detect_source_language_config._handle, audio_config_handle])
        super().__init__(handle)

    def __del__(self):
        def clean_signal(signal: EventSignal):
            if signal is not None:
                signal.disconnect_all()
        clean_signal(self.__synthesizing_signal)
        clean_signal(self.__recognizing_signal)
        clean_signal(self.__recognized_signal)
        clean_signal(self.__canceled_signal)
        super(type(self), self).__del__()

    def recognize_once(self) -> TranslationRecognitionResult:
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
        return ResultFuture(async_handle, resolve_future, TranslationRecognitionResult)

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

    __synthesizing_signal = None

    @property
    def synthesizing(self) -> EventSignal:
        """
        The event signals that a translation synthesis result is received.

        Callbacks connected to this signal are called with a
        :class:`.TranslationSynthesisEventArgs` instance as the single argument.
        """
        def synthesizing_connection(signal: EventSignal, handle: _spx_handle):
            callback = TranslationRecognizer.__synthesizing_callback if signal.is_connected() else None
            _sdk_lib.translator_synthesizing_audio_set_callback(handle, callback, signal._context_ptr)
        if self.__synthesizing_signal is None:
            self.__synthesizing_signal = EventSignal(self, synthesizing_connection)
        return self.__synthesizing_signal

    @ctypes.CFUNCTYPE(None, _spx_handle, _spx_handle, ctypes.c_void_p)
    def __synthesizing_callback(reco_handle: _spx_handle, event_handle: _spx_handle, context: ctypes.c_void_p):
        event_handle = _spx_handle(event_handle)
        obj = _unpack_context(context)
        if obj is not None:
            event = TranslationSynthesisEventArgs(event_handle)
            obj.__synthesizing_signal.signal(event)

    __recognizing_signal = None

    @property
    def recognizing(self) -> EventSignal:
        """
        Signal for events containing intermediate recognition results.

        Callbacks connected to this signal are called with a
        :class:`.TranslationRecognitionEventArgs`, instance as the single argument.
        """
        def recognizing_connection(signal: EventSignal, handle: _spx_handle):
            callback = TranslationRecognizer.__recognizing_callback if signal.is_connected() else None
            _sdk_lib.recognizer_recognizing_set_callback(handle, callback, signal._context_ptr)
        if self.__recognizing_signal is None:
            self.__recognizing_signal = EventSignal(self, recognizing_connection)
        return self.__recognizing_signal

    @ctypes.CFUNCTYPE(None, _spx_handle, _spx_handle, ctypes.c_void_p)
    def __recognizing_callback(reco_handle: _spx_handle, event_handle: _spx_handle, context: ctypes.c_void_p):
        event_handle = _spx_handle(event_handle)
        obj = _unpack_context(context)
        if obj is not None:
            event = TranslationRecognitionEventArgs(event_handle)
            obj.__recognizing_signal.signal(event)

    __recognized_signal = None

    @property
    def recognized(self) -> EventSignal:
        """
        Signal for events containing final recognition results (indicating a successful
        recognition attempt).

        Callbacks connected to this signal are called with a
        :class:`.TranslationRecognitionEventArgs`, instance as the single argument, dependent on
        the type of recognizer.
        """
        def recognized_connection(signal: EventSignal, handle: _spx_handle):
            callback = TranslationRecognizer.__recognized_callback if signal.is_connected() else None
            _sdk_lib.recognizer_recognized_set_callback(handle, callback, signal._context_ptr)
        if self.__recognized_signal is None:
            self.__recognized_signal = EventSignal(self, recognized_connection)
        return self.__recognized_signal

    @ctypes.CFUNCTYPE(None, _spx_handle, _spx_handle, ctypes.c_void_p)
    def __recognized_callback(reco_handle: _spx_handle, event_handle: _spx_handle, context: ctypes.c_void_p):
        event_handle = _spx_handle(event_handle)
        obj = _unpack_context(context)
        if obj is not None:
            event = TranslationRecognitionEventArgs(event_handle)
            obj.__recognized_signal.signal(event)

    __canceled_signal = None

    @property
    def canceled(self) -> EventSignal:
        """
        Signal for events containing canceled recognition results (indicating a recognition attempt
        that was canceled as a result or a direct cancellation request or, alternatively, a
        transport or protocol failure).

        Callbacks connected to this signal are called with a
        :class:`.TranslationRecognitionCanceledEventArgs`, instance as the single argument.
        """
        def canceled_connection(signal: EventSignal, handle: _spx_handle):
            callback = TranslationRecognizer.__canceled_callback if signal.is_connected() else None
            _sdk_lib.recognizer_canceled_set_callback(handle, callback, signal._context_ptr)
        if self.__canceled_signal is None:
            self.__canceled_signal = EventSignal(self, canceled_connection)
        return self.__canceled_signal

    @ctypes.CFUNCTYPE(None, _spx_handle, _spx_handle, ctypes.c_void_p)
    def __canceled_callback(reco_handle: _spx_handle, event_handle: _spx_handle, context: ctypes.c_void_p):
        event_handle = _spx_handle(event_handle)
        obj = _unpack_context(context)
        if obj is not None:
            event = TranslationRecognitionCanceledEventArgs(event_handle)
            obj.__canceled_signal.signal(event)

    @property
    def target_languages(self) -> Tuple[str]:
        """
        The target languages for translation.

        .. note::
          Added in version 1.7.0.
        """
        languages = self.properties.get_property(PropertyId.SpeechServiceConnection_TranslationToLanguages)
        return languages.split(",")

    def add_target_language(self, language: str):
        """
        Add `language` to the list of target languages for translation.

        .. note::
          Added in version 1.7.0.

        :param language: The language code to add.
        """
        c_lang = _c_str(language)
        _call_hr_fn(fn=_sdk_lib.translator_add_target_language, *[self._handle, c_lang])

    def remove_target_language(self, language: str):
        """
        Remove `language` from the list of target languages for translation.

        .. note::
          Added in version 1.7.0.

        :param language: The language code to remove.
        """
        c_lang = _c_str(language)
        _call_hr_fn(fn=_sdk_lib.translator_remove_target_language, *[self._handle, c_lang])
