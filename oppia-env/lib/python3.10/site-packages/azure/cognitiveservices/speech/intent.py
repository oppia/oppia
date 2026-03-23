# Copyright (c) Microsoft. All rights reserved.
# See https://aka.ms/csspeech/license for the full license information.
"""
Classes related to intent recognition from speech.
"""

import ctypes

from .enums import PropertyId
from .speech import (SpeechConfig, Recognizer, ResultFuture, EventSignal,
                     RecognitionEventArgs, RecognitionResult, CancellationDetails)
from .audio import AudioConfig
from .interop import _Handle, _c_str, _sdk_lib, _spx_handle, _call_hr_fn, max_uint32, _unpack_context

from typing import Optional, Union, Tuple, Iterable
OptionalStr = Optional[str]


class LanguageUnderstandingModel():
    """
    Represents language understanding model used for intent recognition.

    The model can be initialized in different ways:

    - from subscription: pass a subscription key, an app_id, and a region
    - from endpoint: pass an endpoint URL.
      (see `<https://docs.microsoft.com/azure/cognitive-services/speech-service/quickstarts/intent-recognition>` for more details).
    - from app id: pass an app_id

    :param subscription: The subscription key.
    :param region: The region name (see the `region page <https://aka.ms/csspeech/region>`_).
    :param app_id: The app id to use for the model.
    :param auth_token: The authorization token.
    """

    def __init__(self, subscription: OptionalStr = None, region: OptionalStr = None,
                 app_id: OptionalStr = None, endpoint: OptionalStr = None):
        bad_params_error_message = "bad arguments: either pass just an endpoint id, or pass an app " \
                                   "id (with optional subscription and region)"
        handle = _spx_handle(0)
        if subscription is None and region is None and app_id is None and endpoint is None:
            raise ValueError(bad_params_error_message)

        if (sum(val is not None for val in (subscription, region)) == 1 or (
                app_id is None and subscription is not None and region is not None)):
            raise ValueError("all of subscription key, api id and region must be given to "
                             "initialize from subscription")
        if app_id is not None and endpoint is not None:
            raise ValueError(bad_params_error_message)
        c_app_id = _c_str(app_id)
        c_subscription = _c_str(subscription)
        c_region = _c_str(region)
        c_endpoint = _c_str(endpoint)
        if app_id is not None:
            _call_hr_fn(fn=_sdk_lib.language_understanding_model_create_from_app_id, *[ctypes.byref(handle), c_app_id])
        elif app_id is not None and subscription is not None and region is not None:
            _call_hr_fn(
                fn=_sdk_lib.language_understanding_model_create_from_subscription,
                *[ctypes.byref(handle), c_subscription, c_app_id, c_region])
        elif endpoint is not None:
            _call_hr_fn(fn=_sdk_lib.language_understanding_model_create_from_uri, *[ctypes.byref(handle), c_endpoint])
        else:
            raise ValueError('cannot construct LanguageUnderstandingModel')
        self.__handle = _Handle(
            handle,
            _sdk_lib.language_understanding_model_handle_is_valid,
            _sdk_lib.language_understanding_model__handle_release)

    @property
    def _handle(self):
        return self.__handle.get()


class IntentRecognitionResult(RecognitionResult):
    """
    Represents the result of an intent recognition.
    """

    def __init__(self, handle: _spx_handle):
        """
        Constructor for internal use.
        """
        super().__init__(handle)
        _c_string = ctypes.create_string_buffer(1024 + 1)
        _call_hr_fn(fn=_sdk_lib.intent_result_get_intent_id, *[self._handle, _c_string, 1024])
        self._intent_id = _c_string.value.decode(encoding='utf-8')
        self._intent_json = self._propbag.get_property(PropertyId.LanguageUnderstandingServiceResponse_JsonResult)

    @property
    def intent_id(self) -> str:
        """
        Unique intent id.
        """
        return self._intent_id

    @property
    def intent_json(self) -> str:
        """
        The bare JSON representation of the result from the Language Understanding service.
        """
        return self._intent_json

    def __str__(self):
        return u'{}(result_id={}, text="{}", intent_id={}, reason={})'.format(
               type(self).__name__, self.result_id, self.text, self.intent_id, self.reason)


class IntentRecognitionEventArgs(RecognitionEventArgs):
    """
    Class for intent recognition event arguments.
    """

    def __init__(self, handle: _spx_handle):
        """
        Constructor for internal use.
        """
        super().__init__(handle)
        result_handle = _spx_handle(0)
        _call_hr_fn(fn=_sdk_lib.recognizer_recognition_event_get_result, *[handle, ctypes.byref(result_handle)])
        self._result = IntentRecognitionResult(result_handle)

    @property
    def result(self) -> IntentRecognitionResult:
        """
        Intent recognition event result.
        """
        return self._result

    def __str__(self):
        return u'{}(session_id={}, result={})'.format(type(self).__name__, self.session_id, self.result)


class IntentRecognitionCanceledEventArgs(IntentRecognitionEventArgs):
    """
    Class for intent recognition canceled event arguments.
    """

    def __init__(self, handle: _spx_handle):
        """
        Constructor for internal use.
        """
        super().__init__(handle)
        self._cancellation_details = CancellationDetails(self.result)

    @property
    def cancellation_details(self) -> "CancellationDetails":
        """
        The reason why recognition was cancelled.

        Returns `None` if there was no cancellation.
        """
        return self._cancellation_details


class IntentTrigger():
    """
    Represents an intent trigger.
    """

    def __init__(self, simple_phrase: Optional[str] = None, model: Optional[LanguageUnderstandingModel] = None,
                 intent_name: Optional[str] = None):
        if simple_phrase is None and model is None:
            raise ValueError("Need to provide one of simple_phrase or model.")
        if simple_phrase is not None and model is not None:
            raise ValueError("Need to provide either a simple phrase or a model, not both.")
        if simple_phrase is not None and intent_name is not None:
            raise ValueError("Intent name cannot be used with simple phrase.")
        handle = _spx_handle(0)
        if simple_phrase is not None:
            c_phrase = _c_str(simple_phrase)
            _call_hr_fn(fn=_sdk_lib.intent_trigger_create_from_phrase, *[ctypes.byref(handle), c_phrase])
        else:
            c_name = _c_str(intent_name) if intent_name is not None else None
            _call_hr_fn(
                fn=_sdk_lib.intent_trigger_create_from_language_understanding_model,
                *[ctypes.byref(handle), model._handle, c_name])
        self.__handle = _Handle(handle, _sdk_lib.intent_trigger_handle_is_valid, _sdk_lib.intent_trigger_handle_release)

    @property
    def _handle(self):
        return self.__handle.get()


class IntentRecognizer(Recognizer):
    """
    In addition to performing speech-to-text recognition, the IntentRecognizer extracts structured
    information about the intent of the speaker.

    :param speech_config: The config for the speech recognizer.
    :param audio_config: The config for the audio input.
    :param intents: Intents from an iterable over pairs of (model, intent_id) or (simple_phrase,
        intent_id) to be recognized.
    """

    IntentsIter = Iterable[Tuple[Union[str, LanguageUnderstandingModel], str]]

    def __init__(self, speech_config: SpeechConfig, audio_config: Optional[AudioConfig] = None,
                 intents: Optional[IntentsIter] = None):

        if not isinstance(speech_config, SpeechConfig):
            raise ValueError('speech_config must be a SpeechConfig instance')
        audio_config_handle = audio_config._handle if audio_config is not None else None
        handle = _spx_handle(0)
        _call_hr_fn(
            fn=_sdk_lib.recognizer_create_intent_recognizer_from_config,
            *[ctypes.byref(handle), speech_config._handle, audio_config_handle])
        super().__init__(handle)
        if intents:
            self.add_intents(intents)

    def __del__(self):
        def clean_signal(signal: EventSignal):
            if signal is not None:
                signal.disconnect_all()
        clean_signal(self.__recognizing_signal)
        clean_signal(self.__recognized_signal)
        clean_signal(self.__canceled_signal)
        super(type(self), self).__del__()

    def add_intents(self, intents_iter: IntentsIter):
        """
        Add intents from an iterable over pairs of (model, intent_id) or (simple_phrase,
        intent_id).

        :param intents: Intents from an iterable over pairs of (model, intent_id) or (simple_phrase,
            intent_id) to be recognized.
        """
        for key, value in intents_iter:
            self.add_intent(key, value)

    def add_all_intents(self, model: LanguageUnderstandingModel):
        """
        Adds all intents from the specified Language Understanding Model.
        """
        trigger = IntentTrigger(model=model)
        self.add_intent(trigger)

    def add_intent(self, *args):
        """
        Add an intent to the recognizer. There are different ways to do this:

        - `add_intent(simple_phrase)`: Adds a simple phrase that may be spoken by the user,
          indicating a specific user intent.
        - `add_intent(simple_phrase, intent_id)`: Adds a simple phrase that may be spoken by the
          user, indicating a specific user intent. Once recognized, the result's intent id will
          match the id supplied here.
        - `add_intent(model, intent_name)`: Adds a single intent by name from the specified
          :class:`.LanguageUnderstandingModel`.
        - `add_intent(model, intent_name, intent_id)`: Adds a single intent by name from the
          specified :class:`.LanguageUnderstandingModel`.
        - `add_intent(trigger, intent_id)`: Adds the IntentTrigger specified.
          :class:`.IntentTrigger`.

        :param model: The language understanding model containing the intent.
        :param intent_name: The name of the single intent to be included from the language
            understanding model.
        :param simple_phrase: The phrase corresponding to the intent.
        :param intent_id: A custom id string to be returned in the
          :class:`.IntentRecognitionResult`'s `intent_id` property.
        :param trigger: The IntentTrigger corresponding to the intent.
        """
        intent = args[0]
        intent_id = None
        if isinstance(intent, LanguageUnderstandingModel):
            name = args[1] if isinstance(args[1], str) else None
            trigger = IntentTrigger(model=intent, intent_name=name)
            if len(args) == 3:
                intent_id = args[2]
        elif isinstance(intent, str):
            trigger = IntentTrigger(simple_phrase=intent)
            if len(args) == 2:
                intent_id = args[1]
        elif isinstance(intent, IntentTrigger):
            trigger = intent
            if len(args) == 2:
                intent_id = args[1]
        else:
            raise ValueError("Invalid parameters")

        c_intent_id = _c_str(intent_id)
        _call_hr_fn(fn=_sdk_lib.intent_recognizer_add_intent, *[self._handle, c_intent_id, trigger._handle])

    def recognize_once(self) -> IntentRecognitionResult:
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
        return ResultFuture(async_handle, resolve_future, IntentRecognitionResult)

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

    __recognizing_signal = None

    @property
    def recognizing(self) -> EventSignal:
        """
        Signal for events containing intermediate recognition results.

        Callbacks connected to this signal are called with a :class:`.IntentRecognitionEventArgs`
        instance as the single argument.
        """
        def recognizing_connection(signal: EventSignal, handle: _spx_handle):
            callback = IntentRecognizer.__recognizing_callback if signal.is_connected() else None
            _sdk_lib.recognizer_recognizing_set_callback(handle, callback, signal._context_ptr)
        if self.__recognizing_signal is None:
            self.__recognizing_signal = EventSignal(self, recognizing_connection)
        return self.__recognizing_signal

    @ctypes.CFUNCTYPE(None, _spx_handle, _spx_handle, ctypes.c_void_p)
    def __recognizing_callback(reco_handle: _spx_handle, event_handle: _spx_handle, context: ctypes.c_void_p):
        event_handle = _spx_handle(event_handle)
        obj = _unpack_context(context)
        if obj is not None:
            event = IntentRecognitionEventArgs(event_handle)
            obj.__recognizing_signal.signal(event)

    __recognized_signal = None

    @property
    def recognized(self) -> EventSignal:
        """
        Signal for events containing final recognition results (indicating a successful
        recognition attempt).

        Callbacks connected to this signal are called with a :class:`.IntentRecognitionEventArgs`
        instance as the single argument, dependent on the type of recognizer.
        """
        def recognized_connection(signal: EventSignal, handle: _spx_handle):
            callback = IntentRecognizer.__recognized_callback if signal.is_connected() else None
            _sdk_lib.recognizer_recognized_set_callback(handle, callback, signal._context_ptr)
        if self.__recognized_signal is None:
            self.__recognized_signal = EventSignal(self, recognized_connection)
        return self.__recognized_signal

    @ctypes.CFUNCTYPE(None, _spx_handle, _spx_handle, ctypes.c_void_p)
    def __recognized_callback(reco_handle: _spx_handle, event_handle: _spx_handle, context: ctypes.c_void_p):
        event_handle = _spx_handle(event_handle)
        obj = _unpack_context(context)
        if obj is not None:
            event = IntentRecognitionEventArgs(event_handle)
            obj.__recognized_signal.signal(event)

    __canceled_signal = None

    @property
    def canceled(self) -> EventSignal:
        """
        Signal for events containing canceled recognition results (indicating a recognition attempt
        that was canceled as a result or a direct cancellation request or, alternatively, a
        transport or protocol failure).

        Callbacks connected to this signal are called with a
        :class:`.IntentRecognitionCanceledEventArgs`, instance as the single argument.
        """
        def canceled_connection(signal: EventSignal, handle: _spx_handle):
            callback = IntentRecognizer.__canceled_callback if signal.is_connected() else None
            _sdk_lib.recognizer_canceled_set_callback(handle, callback, signal._context_ptr)
        if self.__canceled_signal is None:
            self.__canceled_signal = EventSignal(self, canceled_connection)
        return self.__canceled_signal

    @ctypes.CFUNCTYPE(None, _spx_handle, _spx_handle, ctypes.c_void_p)
    def __canceled_callback(reco_handle: _spx_handle, event_handle: _spx_handle, context: ctypes.c_void_p):
        event_handle = _spx_handle(event_handle)
        obj = _unpack_context(context)
        if obj is not None:
            event = IntentRecognitionCanceledEventArgs(event_handle)
            obj.__canceled_signal.signal(event)
