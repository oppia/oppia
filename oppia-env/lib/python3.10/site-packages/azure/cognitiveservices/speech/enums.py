# Copyright (c) Microsoft. All rights reserved.
# See https://aka.ms/csspeech/license for the full license information.

from enum import Enum


class PropertyId(Enum):
    """
    Defines speech property ids.
    """

    SpeechServiceConnection_Key = 1000
    """
    The Cognitive Services Speech Service subscription key. If you are using an intent recognizer, you need
    to specify the LUIS endpoint key for your particular LUIS app. Under normal circumstances, you shouldn't
    have to use this property directly.
    """

    SpeechServiceConnection_Endpoint = 1001
    """
    The Cognitive Services Speech Service endpoint (url). Under normal circumstances, you shouldn't
    have to use this property directly.
    NOTE: This endpoint is not the same as the endpoint used to obtain an access token.
    """

    SpeechServiceConnection_Region = 1002
    """
    The Cognitive Services Speech Service region. Under normal circumstances, you shouldn't have to
    use this property directly.
    """

    SpeechServiceAuthorization_Token = 1003
    """
    The Cognitive Services Speech Service authorization token (aka access token). Under normal circumstances,
    you shouldn't have to use this property directly.
    """

    SpeechServiceAuthorization_Type = 1004
    """
    The Cognitive Services Speech Service authorization type. Currently unused.
    """

    SpeechServiceConnection_EndpointId = 1005
    """
    The Cognitive Services Custom Speech or Custom Voice Service endpoint id. Under normal circumstances, you shouldn't
    have to use this property directly.
    NOTE: The endpoint id is available in the Custom Speech Portal, listed under Endpoint Details.
    """

    SpeechServiceConnection_Host = 1006
    """
    The Cognitive Services Speech Service host (url). Under normal circumstances, you shouldn't
    have to use this property directly.
    """

    SpeechServiceConnection_ProxyHostName = 1100
    """
    The host name of the proxy server used to connect to the Cognitive Services Speech Service. Under normal circumstances,
    you shouldn't have to use this property directly.
    """

    SpeechServiceConnection_ProxyPort = 1101
    """
    The port of the proxy server used to connect to the Cognitive Services Speech Service. Under normal circumstances,
    you shouldn't have to use this property directly.
    """

    SpeechServiceConnection_ProxyUserName = 1102
    """
    The user name of the proxy server used to connect to the Cognitive Services Speech Service. Under normal circumstances,
    you shouldn't have to use this property directly.
    """

    SpeechServiceConnection_ProxyPassword = 1103
    """
    The password of the proxy server used to connect to the Cognitive Services Speech Service. Under normal circumstances,
    you shouldn't have to use this property directly.
    """

    SpeechServiceConnection_Url = 1104
    """
    The URL string built from speech configuration.
    This property is intended to be read-only. The SDK is using it internally.
    """

    SpeechServiceConnection_ProxyHostBypass = 1105
    """
    Specifies the list of hosts for which proxies should not be used. This setting overrides all other configurations.
    Hostnames are separated by commas and are matched in a case-insensitive manner. Wildcards are not supported.
    """

    SpeechServiceConnection_TranslationToLanguages = 2000
    """
    The list of comma separated languages used as target translation languages. Under normal circumstances,
    you shouldn't have to use this property directly.
    """

    SpeechServiceConnection_TranslationVoice = 2001
    """
    The name of the Cognitive Service Text to Speech Service voice. Under normal circumstances, you shouldn't have to use this
    property directly.
    NOTE: Valid voice names can be found <a href="https://aka.ms/csspeech/voicenames">here</a>.
    """

    SpeechServiceConnection_TranslationFeatures = 2002
    """
    Translation features. For internal use.
    """

    SpeechServiceConnection_IntentRegion = 2003
    """
    The Language Understanding Service region. Under normal circumstances, you shouldn't have to use this property directly.
    """

    SpeechServiceConnection_RecoMode = 3000
    """
    The Cognitive Services Speech Service recognition mode. Can be "INTERACTIVE", "CONVERSATION", "DICTATION".
    This property is intended to be read-only. The SDK is using it internally.
    """

    SpeechServiceConnection_RecoLanguage = 3001
    """
    The spoken language to be recognized (in BCP-47 format). Under normal circumstances, you shouldn't have to use this property
    directly.
    """

    Speech_SessionId = 3002
    """
    The session id. This id is a universally unique identifier (aka UUID) representing a specific binding of an audio input stream
    and the underlying speech recognition instance to which it is bound. Under normal circumstances, you shouldn't have to use this
    property directly.
    """

    SpeechServiceConnection_UserDefinedQueryParameters = 3003
    """
    The query parameters provided by users. They will be passed to service as URL query parameters.
    """

    SpeechServiceConnection_RecoBackend = 3004
    """
    The string to specify the backend to be used for speech recognition;
    allowed options are online and offline.
    Under normal circumstances, you shouldn't use this property directly.
    Currently the offline option is only valid when EmbeddedSpeechConfig is used.
    """

    SpeechServiceConnection_RecoModelName = 3005
    """
    The name of the model to be used for speech recognition.
    Under normal circumstances, you shouldn't use this property directly.
    Currently this is only valid when EmbeddedSpeechConfig is used.
    """

    SpeechServiceConnection_RecoModelKey = 3006
    """
    This property is deprecated.
    """

    SpeechServiceConnection_RecoModelIniFile = 3007
    """
    The path to the ini file of the model to be used for speech recognition.
    Under normal circumstances, you shouldn't use this property directly.
    Currently this is only valid when EmbeddedSpeechConfig is used.
    """

    SpeechServiceConnection_SynthLanguage = 3100
    """
    The spoken language to be synthesized (e.g. en-US)
    """

    SpeechServiceConnection_SynthVoice = 3101
    """
    The name of the TTS voice to be used for speech synthesis
    """

    SpeechServiceConnection_SynthOutputFormat = 3102
    """
    The string to specify TTS output audio format
    """

    SpeechServiceConnection_SynthEnableCompressedAudioTransmission = 3103
    """
    Indicates if use compressed audio format for speech synthesis audio transmission.
    This property only affects when SpeechServiceConnection_SynthOutputFormat is set to a pcm format.
    If this property is not set and GStreamer is available, SDK will use compressed format for synthesized audio transmission,
    and decode it. You can set this property to "false" to use raw pcm format for transmission on wire.
    """

    SpeechServiceConnection_SynthBackend = 3110
    """
    The string to specify TTS backend; valid options are online and offline.
    Under normal circumstances, you shouldn't have to use this property directly.
    """

    SpeechServiceConnection_SynthOfflineDataPath = 3112
    """
    The data file path(s) for offline synthesis engine; only valid when synthesis backend is offline.
    Under normal circumstances, you shouldn't have to use this property directly.
    """

    SpeechServiceConnection_SynthOfflineVoice = 3113
    """
    The name of the offline TTS voice to be used for speech synthesis
    Under normal circumstances, you shouldn't use this property directly.
    """

    SpeechServiceConnection_SynthModelKey = 3114
    """
    This property is deprecated.
    """

    SpeechServiceConnection_VoicesListEndpoint = 3130
    """
    The Cognitive Services Speech Service voices list api endpoint (url). Under normal circumstances,
    you don't need to specify this property, SDK will construct it based on the region/host/endpoint of SpeechConfig.
    """

    SpeechServiceConnection_InitialSilenceTimeoutMs = 3200
    """
    The initial silence timeout value (in milliseconds) used by the service.
    """

    SpeechServiceConnection_EndSilenceTimeoutMs = 3201
    """
    The end silence timeout value (in milliseconds) used by the service.
    """

    SpeechServiceConnection_EnableAudioLogging = 3202
    """
    A boolean value specifying whether audio logging is enabled in the service or not.
    Audio and content logs are stored either in Microsoft-owned storage, or in your own storage account linked
    to your Cognitive Services subscription (Bring Your Own Storage (BYOS) enabled Speech resource).
    """

    SpeechServiceConnection_LanguageIdMode = 3205
    """
    The speech service connection language identifier mode.
    Can be "AtStart" (the default), or "Continuous".
    See <a href="https://aka.ms/speech/lid?pivots=programming-language-python">Language Identification</a> document.
    Added in 1.25.0
    """

    SpeechServiceConnection_TranslationCategoryId = 3206
    """
    The speech service connection translation categoryId.
    """

    SpeechServiceConnection_AutoDetectSourceLanguages = 3300
    """
    The auto detect source languages
    """

    SpeechServiceConnection_AutoDetectSourceLanguageResult = 3301
    """
    The auto detect source language result
    """

    SpeechServiceResponse_RequestDetailedResultTrueFalse = 4000
    """
    The requested Cognitive Services Speech Service response output format (simple or detailed).
    Under normal circumstances, you shouldn't have to use this property directly.
    """

    SpeechServiceResponse_RequestProfanityFilterTrueFalse = 4001
    """
    The requested Cognitive Services Speech Service response output profanity level. Currently unused.
    """

    SpeechServiceResponse_ProfanityOption = 4002
    """
    The requested Cognitive Services Speech Service response output profanity setting.
    Allowed values are "masked", "removed", and "raw".
    """

    SpeechServiceResponse_PostProcessingOption = 4003
    """
    A string value specifying which post processing option should be used by service.
    Allowed values are "TrueText".
    """

    SpeechServiceResponse_RequestWordLevelTimestamps = 4004
    """
    A boolean value specifying whether to include word-level timestamps in the response result.
    """

    SpeechServiceResponse_StablePartialResultThreshold = 4005
    """
    The number of times a word has to be in partial results to be returned.
    """

    SpeechServiceResponse_OutputFormatOption = 4006
    """
    A string value specifying the output format option in the response result. Internal use only.
    """

    SpeechServiceResponse_RequestSnr = 4007
    """
    A boolean value specifying whether to include SNR (signal to noise ratio) in the response result.
    """

    SpeechServiceResponse_TranslationRequestStablePartialResult = 4100
    """
    A boolean value to request for stabilizing translation partial results by omitting words in the end.
    """

    SpeechServiceResponse_RequestWordBoundary = 4200
    """
    A boolean value specifying whether to request WordBoundary events.
    """

    SpeechServiceResponse_RequestPunctuationBoundary = 4201
    """
    A boolean value specifying whether to request punctuation boundary in WordBoundary Events. Default is true.
    """

    SpeechServiceResponse_RequestSentenceBoundary = 4202
    """
    A boolean value specifying whether to request sentence boundary in WordBoundary Events. Default is false.
    """

    SpeechServiceResponse_SynthesisEventsSyncToAudio = 4210
    """
    A boolean value specifying whether the SDK should synchronize synthesis metadata events,
    (e.g. word boundary, viseme, etc.) to the audio playback. This only takes effect when the audio is played through the SDK.
    Default is true.
    If set to false, the SDK will fire the events as they come from the service, which may be out of sync with the audio playback.
    Added in version 1.31.0.
    """

    SpeechServiceResponse_JsonResult = 5000
    """
    The Cognitive Services Speech Service response output (in JSON format).
    This property is available on recognition result objects only.
    """

    SpeechServiceResponse_JsonErrorDetails = 5001
    """
    The Cognitive Services Speech Service error details (in JSON format). Under normal circumstances, you shouldn't have to
    use this property directly.
    """

    SpeechServiceResponse_RecognitionLatencyMs = 5002
    """
    The recognition latency in milliseconds. Read-only, available on final speech/translation/intent results.
    This measures the latency between when an audio input is received by the SDK, and the moment the final result
    is received from the service.
    The SDK computes the time difference between the last audio fragment from the audio input that is contributing
    to the final result, and the time the final result is received from the speech service.
    """

    SpeechServiceResponse_SynthesisFirstByteLatencyMs = 5010
    """
    The speech synthesis first byte latency in milliseconds. Read-only, available on final speech synthesis results.
    This measures the latency between when the synthesis is started to be processed, and the moment the first byte audio is available.
    """

    SpeechServiceResponse_SynthesisFinishLatencyMs = 5011
    """
    The speech synthesis all bytes latency in milliseconds. Read-only, available on final speech synthesis results.
    This measures the latency between when the synthesis is started to be processed, and the moment the whole audio is synthesized.
    """

    SpeechServiceResponse_SynthesisUnderrunTimeMs = 5012
    """
    The underrun time for speech synthesis in milliseconds. Read-only, available on results in SynthesisCompleted events.
    This measures the total underrun time from PropertyId.AudioConfig_PlaybackBufferLengthInMs is filled to synthesis completed.
    """

    SpeechServiceResponse_SynthesisConnectionLatencyMs = 5013
    """
    The speech synthesis connection latency in milliseconds. Read-only, available on final speech synthesis results.
    This measures the latency between when the synthesis is started to be processed, and the moment the HTTP/WebSocket
    connection is established.
    Added in version 1.26.0.
    """

    SpeechServiceResponse_SynthesisNetworkLatencyMs = 5014
    """
    The speech synthesis network latency in milliseconds. Read-only, available on final speech synthesis results.
    This measures the network round trip time.
    Added in version 1.26.0.
    """

    SpeechServiceResponse_SynthesisServiceLatencyMs = 5015
    """
    The speech synthesis service latency in milliseconds. Read-only, available on final speech synthesis results.
    This measures the service processing time to synthesize the first byte of audio.
    Added in version 1.26.0.
    """

    SpeechServiceResponse_SynthesisBackend = 5020
    """
    Indicates which backend the synthesis is finished by. Read-only, available on speech synthesis results, except for the result in
    SynthesisStarted event
    """

    SpeechServiceResponse_DiarizeIntermediateResults = 5025
    """
    Determines if intermediate results contain speaker identification.
    Allowed values are "true" or "false". If set to "true", the intermediate results will contain speaker identification.
    The default value if unset or set to an invalid value is "false".
    This is currently only supported for scenarios using the ConversationTranscriber".
    Adding in version 1.40.
    """

    CancellationDetails_Reason = 6000
    """
    The cancellation reason. Currently unused.
    """

    CancellationDetails_ReasonText = 6001
    """
    The cancellation text. Currently unused.
    """

    CancellationDetails_ReasonDetailedText = 6002
    """
    The cancellation detailed text. Currently unused.
    """

    LanguageUnderstandingServiceResponse_JsonResult = 7000
    """
    The Language Understanding Service response output (in JSON format). Available via IntentRecognitionResult.Properties.
    """

    AudioConfig_DeviceNameForCapture = 8000
    """
    The device name for audio capture. Under normal circumstances, you shouldn't have to
    use this property directly.
    """

    AudioConfig_NumberOfChannelsForCapture = 8001
    """
    The number of channels for audio capture. Internal use only.
    """

    AudioConfig_SampleRateForCapture = 8002
    """
    The sample rate (in Hz) for audio capture. Internal use only.
    """

    AudioConfig_BitsPerSampleForCapture = 8003
    """
    The number of bits of each sample for audio capture. Internal use only.
    """

    AudioConfig_AudioSource = 8004
    """
    The audio source. Allowed values are "Microphones", "File", and "Stream".
    """

    AudioConfig_DeviceNameForRender = 8005
    """
    The device name for audio render. Under normal circumstances, you shouldn't have to
    use this property directly.
    """

    AudioConfig_PlaybackBufferLengthInMs = 8006
    """
    Playback buffer length in milliseconds, default is 50 milliseconds.
    """

    AudioConfig_AudioProcessingOptions = 8007
    """
    Audio processing options in JSON format.
    """

    Speech_LogFilename = 9001
    """
    The file name to write logs.
    """

    Speech_SegmentationSilenceTimeoutMs = 9002
    """
    A duration of detected silence, measured in milliseconds, after which speech-to-text will determine a spoken
    phrase has ended and generate a final Recognized result. Configuring this timeout may be helpful in situations
    where spoken input is significantly faster or slower than usual and default segmentation behavior consistently
    yields results that are too long or too short. Segmentation timeout values that are inappropriately high or low
    can negatively affect speech-to-text accuracy; this property should be carefully configured and the resulting
    behavior should be thoroughly validated as intended.

    For more information about timeout configuration that includes discussion of default behaviors, please visit
    https://aka.ms/csspeech/timeouts.
    """

    Speech_SegmentationMaximumTimeMs = 9003
    """
    The maximum length of a spoken phrase when using the Time segmentation strategy.
    As the length of a spoken phrase approaches this value, the <see also cref="Speech_SegmentationSilenceTimeoutMs"/>
    will begin being reduced until either the phrase silence timeout is hit or the phrase reaches the maximum length.
    """

    Speech_SegmentationStrategy = 9004
    """
    The strategy used to determine when a spoken phrase has ended and a final recognized result should be generated.
    Allowed values are "Default", "Time", and "Semantic".

    Valid values are:
    - **Default**: Use the default strategy and settings as determined by the Speech Service. Use in most situations.
    - **Time**: Uses a time-based strategy where the amount of silence between speech is used to determine when to
                generate a final result.
    - **Semantic**: Uses an AI model to determine the end of a spoken phrase based on the content of the phrase.

    When using the time strategy, the `Speech_SegmentationSilenceTimeoutMs` property
    can be used to adjust the amount of silence needed to determine the end of a spoken phrase,
    and the `Speech_SegmentationMaximumTimeMs` property can be used to adjust the maximum length of a spoken phrase.

    The semantic strategy has no control properties available.
    """

    Conversation_ApplicationId = 10000
    """
    Identifier used to connect to the backend service.
    """

    Conversation_DialogType = 10001
    """
    Type of dialog backend to connect to.
    """

    Conversation_Initial_Silence_Timeout = 10002
    """
    Silence timeout for listening
    """

    Conversation_From_Id = 10003
    """
    From id to be used on speech recognition activities
    """

    Conversation_Conversation_Id = 10004
    """
    ConversationId for the session.
    """

    Conversation_Custom_Voice_Deployment_Ids = 10005
    """
    Comma separated list of custom voice deployment ids.
    """

    Conversation_Speech_Activity_Template = 10006
    """
    Speech activity template, stamp properties in the template on the activity generated by the service for speech.
    """

    Conversation_ParticipantId = 10007
    """
    Your participant identifier in the current conversation.
    """

    Conversation_Request_Bot_Status_Messages = 10008
    """
    If specified as true, request that the service send MessageStatus payloads via the ActivityReceived event
    handler. These messages communicate the outcome of ITurnContext resolution from the dialog system.
    """

    Conversation_Connection_Id = 10009
    """
    Additional identifying information, such as a Direct Line token, used to authenticate with the backend service.
    """

    DataBuffer_TimeStamp = 11001
    """
    The time stamp associated to data buffer written by client when using Pull/Push audio input streams.
    The time stamp is a 64-bit value with a resolution of 90 kHz. It is the same as the presentation timestamp
    in an MPEG transport stream. See https://en.wikipedia.org/wiki/Presentation_timestamp
    """

    DataBuffer_UserId = 11002
    """
    The user id associated to data buffer written by client when using Pull/Push audio input streams.
    """

    PronunciationAssessment_ReferenceText = 12001
    """
    The reference text of the audio for pronunciation evaluation.
    For this and the following pronunciation assessment parameters, see
    https://docs.microsoft.com/azure/cognitive-services/speech-service/rest-speech-to-text#pronunciation-assessment-parameters
    for details.
    Under normal circumstances, you shouldn't have to use this property directly.
    """

    PronunciationAssessment_GradingSystem = 12002
    """
    The point system for pronunciation score calibration (FivePoint or HundredMark).
    Under normal circumstances, you shouldn't have to use this property directly.
    """

    PronunciationAssessment_Granularity = 12003
    """
    The pronunciation evaluation granularity (Phoneme, Word, or FullText).
    Under normal circumstances, you shouldn't have to use this property directly.
    """

    PronunciationAssessment_EnableMiscue = 12005
    """
    Defines if enable miscue calculation.
    With this enabled, the pronounced words will be compared to the reference text,
    and will be marked with omission/insertion based on the comparison. The default setting is False.
    Under normal circumstances, you shouldn't have to use this property directly.
    """

    PronunciationAssessment_PhonemeAlphabet = 12006
    """
    The pronunciation evaluation phoneme alphabet. The valid values are "SAPI" (default) and "IPA"
    Under normal circumstances, you shouldn't have to use this property directly.
    """

    PronunciationAssessment_NBestPhonemeCount = 12007
    """
    The pronunciation evaluation nbest phoneme count.
    Under normal circumstances, you shouldn't have to use this property directly.
    """

    PronunciationAssessment_EnableProsodyAssessment = 12008
    """
    Whether to enable prosody assessment.
    Under normal circumstances, you shouldn't have to use this property directly.
    Added in version 1.33.0
    """

    PronunciationAssessment_Json = 12009
    """
    The json string of pronunciation assessment parameters
    Under normal circumstances, you shouldn't have to use this property directly.
    """

    PronunciationAssessment_Params = 12010
    """
    Pronunciation assessment parameters.
    This property is intended to be read-only. The SDK is using it internally.
    """

    PronunciationAssessment_ContentTopic = 12020
    """
    The content topic of the pronunciation assessment.
    Under normal circumstances, you shouldn't have to use this property directly.
    Added in version 1.33.0
    """

    SpeakerRecognition_Api_Version = 13001
    """
    Speaker Recognition backend API version.
    This property is added to allow testing and use of previous versions of Speaker Recognition APIs, where applicable.
    """

    SpeechSynthesisRequest_Pitch = 14001
    """
    The pitch of the synthesized speech.
    """

    SpeechSynthesisRequest_Rate = 14002
    """
    The rate of the synthesized speech.
    """

    SpeechSynthesisRequest_Volume = 14003
    """
    The volume of the synthesized speech.
    """


class OutputFormat(Enum):
    """
    Output format.
    """
    Simple = 0
    Detailed = 1


class ProfanityOption(Enum):
    """
    Removes profanity (swearing), or replaces letters of profane words with stars.
    """

    Masked = 0
    """
    Replaces letters in profane words with star characters.
    """

    Removed = 1
    """
    Removes profane words.
    """

    Raw = 2
    """
    Does nothing to profane words.
    """


class ResultReason(Enum):
    """
    Specifies the possible reasons a recognition result might be generated.
    """

    NoMatch = 0
    """
    Indicates speech could not be recognized. More details can be found in the NoMatchDetails object.
    """

    Canceled = 1
    """
    Indicates that the recognition was canceled. More details can be found using the CancellationDetails object.
    """

    RecognizingSpeech = 2
    """
    Indicates the speech result contains hypothesis text.
    """

    RecognizedSpeech = 3
    """
    Indicates the speech result contains final text that has been recognized.
    Speech Recognition is now complete for this phrase.
    """

    RecognizingIntent = 4
    """
    Indicates the intent result contains hypothesis text and intent.
    """

    RecognizedIntent = 5
    """
    Indicates the intent result contains final text and intent.
    Speech Recognition and Intent determination are now complete for this phrase.
    """

    TranslatingSpeech = 6
    """
    Indicates the translation result contains hypothesis text and its translation(s).
    """

    TranslatedSpeech = 7
    """
    Indicates the translation result contains final text and corresponding translation(s).
    Speech Recognition and Translation are now complete for this phrase.
    """

    SynthesizingAudio = 8
    """
    Indicates the synthesized audio result contains a non-zero amount of audio data
    """

    SynthesizingAudioCompleted = 9
    """
    Indicates the synthesized audio is now complete for this phrase.
    """

    RecognizingKeyword = 10
    """
    Indicates the speech result contains (unverified) keyword text.
    """

    RecognizedKeyword = 11
    """
    Indicates that keyword recognition completed recognizing the given keyword.
    """

    SynthesizingAudioStarted = 12
    """
    Indicates the speech synthesis is now started
    """

    TranslatingParticipantSpeech = 13
    """
    Indicates the transcription result contains hypothesis text and its translation(s) for
    other participants in the conversation.
    """

    TranslatedParticipantSpeech = 14
    """
    Indicates the transcription result contains final text and corresponding translation(s)
    for other participants in the conversation. Speech Recognition and Translation are now
    complete for this phrase.
    """

    TranslatedInstantMessage = 15
    """
    Indicates the transcription result contains the instant message and corresponding
    translation(s).
    """

    TranslatedParticipantInstantMessage = 16
    """
    Indicates the transcription result contains the instant message for other participants
    in the conversation and corresponding translation(s).
    """

    EnrollingVoiceProfile = 17
    """
    Indicates the voice profile is being enrolling and customers need to send more audio to create a voice profile.
    """

    EnrolledVoiceProfile = 18
    """
    The voice profile has been enrolled.
    """

    RecognizedSpeakers = 19
    """
    Indicates successful identification of some speakers.
    """

    RecognizedSpeaker = 20
    """
    Indicates successfully verified one speaker.
    """

    ResetVoiceProfile = 21
    """
    Indicates a voice profile has been reset successfully.
    """

    DeletedVoiceProfile = 22
    """
    Indicates a voice profile has been deleted successfully.
    """

    VoicesListRetrieved = 23
    """
    Indicates the voices list has been retrieved successfully.
    """


class CancellationReason(Enum):
    """
    Defines the possible reasons a recognition result might be canceled.
    """

    Error = 1
    """
    Indicates that an error occurred during speech recognition.
    """

    EndOfStream = 2
    """
    Indicates that the end of the audio stream was reached.
    """

    CancelledByUser = 3
    """
    Indicates that request was cancelled by the user.
    """


class CancellationErrorCode(Enum):
    """
    Defines error code in case that CancellationReason is Error.
    """

    NoError = 0
    """
    No error.
    If CancellationReason is EndOfStream, CancellationErrorCode
    is set to NoError.
    """

    AuthenticationFailure = 1
    """
    Indicates an authentication error.
    An authentication error occurs if subscription key or authorization token is invalid, expired,
    or does not match the region being used.
    """

    BadRequest = 2
    """
    Indicates that one or more recognition parameters are invalid or the audio format is not supported.
    """

    TooManyRequests = 3
    """
    Indicates that the number of parallel requests exceeded the number of allowed concurrent transcriptions for the subscription.
    """

    Forbidden = 4
    """
    Indicates that the free subscription used by the request ran out of quota.
    """

    ConnectionFailure = 5
    """
    Indicates a connection error.
    """

    ServiceTimeout = 6
    """
    Indicates a time-out error when waiting for response from service.
    """

    ServiceError = 7
    """
    Indicates that an error is returned by the service.
    """

    ServiceUnavailable = 8
    """
    Indicates that the service is currently unavailable.
    """

    RuntimeError = 9
    """
    Indicates an unexpected runtime error.
    """

    ServiceRedirectTemporary = 10
    """
    Indicates the Speech Service is temporarily requesting a reconnect to a different endpoint.
    (Used internally)
    """

    ServiceRedirectPermanent = 11
    """
    Indicates the Speech Service is permanently requesting a reconnect to a different endpoint.
    (Used internally)
    """

    EmbeddedModelError = 12
    """
    Indicates the embedded speech (SR or TTS) model is not available or corrupted.
    """


class NoMatchReason(Enum):
    """
    Defines the possible reasons a recognition result might not be recognized.
    """

    NotRecognized = 1
    """
    Indicates that speech was detected, but not recognized.
    """

    InitialSilenceTimeout = 2
    """
    Indicates that the start of the audio stream contained only silence, and the service timed out waiting for speech.
    """

    InitialBabbleTimeout = 3
    """
    Indicates that the start of the audio stream contained only noise, and the service timed out waiting for speech.
    """

    KeywordNotRecognized = 4
    """
    Indicates that the spotted keyword has been rejected by the keyword verification service.
    """

    EndSilenceTimeout = 5
    """
    Indicates that the audio stream contained only silence after the last recognized phrase.
    """


class ActivityJSONType(Enum):
    """
    Defines the possible types for an activity json value.
    """

    Null = 0
    Object = 1
    Array = 2
    String = 3
    Double = 4
    UInt = 5
    Int = 6
    Boolean = 7


class SpeechSynthesisOutputFormat(Enum):
    """
    Defines the possible speech synthesis output audio formats.
    """

    Raw8Khz8BitMonoMULaw = 1
    """
    raw-8khz-8bit-mono-mulaw
    """

    Riff16Khz16KbpsMonoSiren = 2
    """
    riff-16khz-16kbps-mono-siren
    Unsupported by the service. Do not use this value.
    """

    Audio16Khz16KbpsMonoSiren = 3
    """
    audio-16khz-16kbps-mono-siren
    Unsupported by the service. Do not use this value.
    """

    Audio16Khz32KBitRateMonoMp3 = 4
    """
    audio-16khz-32kbitrate-mono-mp3
    """

    Audio16Khz128KBitRateMonoMp3 = 5
    """
    audio-16khz-128kbitrate-mono-mp3
    """

    Audio16Khz64KBitRateMonoMp3 = 6
    """
    audio-16khz-64kbitrate-mono-mp3
    """

    Audio24Khz48KBitRateMonoMp3 = 7
    """
    audio-24khz-48kbitrate-mono-mp3
    """

    Audio24Khz96KBitRateMonoMp3 = 8
    """
    audio-24khz-96kbitrate-mono-mp3
    """

    Audio24Khz160KBitRateMonoMp3 = 9
    """
    audio-24khz-160kbitrate-mono-mp3
    """

    Raw16Khz16BitMonoTrueSilk = 10
    """
    raw-16khz-16bit-mono-truesilk
    """

    Riff16Khz16BitMonoPcm = 11
    """
    riff-16khz-16bit-mono-pcm
    """

    Riff8Khz16BitMonoPcm = 12
    """
    riff-8khz-16bit-mono-pcm
    """

    Riff24Khz16BitMonoPcm = 13
    """
    riff-24khz-16bit-mono-pcm
    """

    Riff8Khz8BitMonoMULaw = 14
    """
    riff-8khz-8bit-mono-mulaw
    """

    Raw16Khz16BitMonoPcm = 15
    """
    raw-16khz-16bit-mono-pcm
    """

    Raw24Khz16BitMonoPcm = 16
    """
    raw-24khz-16bit-mono-pcm
    """

    Raw8Khz16BitMonoPcm = 17
    """
    raw-8khz-16bit-mono-pcm
    """

    Ogg16Khz16BitMonoOpus = 18
    """
    ogg-16khz-16bit-mono-opus
    """

    Ogg24Khz16BitMonoOpus = 19
    """
    ogg-24khz-16bit-mono-opus
    """

    Raw48Khz16BitMonoPcm = 20
    """
    raw-48khz-16bit-mono-pcm
    """

    Riff48Khz16BitMonoPcm = 21
    """
    riff-48khz-16bit-mono-pcm
    """

    Audio48Khz96KBitRateMonoMp3 = 22
    """
    audio-48khz-96kbitrate-mono-mp3
    """

    Audio48Khz192KBitRateMonoMp3 = 23
    """
    audio-48khz-192kbitrate-mono-mp3
    """

    Ogg48Khz16BitMonoOpus = 24
    """
    ogg-48khz-16bit-mono-opus
    """

    Webm16Khz16BitMonoOpus = 25
    """
    webm-16khz-16bit-mono-opus
    """

    Webm24Khz16BitMonoOpus = 26
    """
    webm-24khz-16bit-mono-opus
    """

    Raw24Khz16BitMonoTrueSilk = 27
    """
    raw-24khz-16bit-mono-truesilk
    """

    Raw8Khz8BitMonoALaw = 28
    """
    raw-8khz-8bit-mono-alaw
    """

    Riff8Khz8BitMonoALaw = 29
    """
    riff-8khz-8bit-mono-alaw
    """

    Webm24Khz16Bit24KbpsMonoOpus = 30
    """
    webm-24khz-16bit-24kbps-mono-opus
    Audio compressed by OPUS codec in a WebM container, with bitrate of 24kbps, optimized for IoT scenario.
    """

    Audio16Khz16Bit32KbpsMonoOpus = 31
    """
    audio-16khz-16bit-32kbps-mono-opus
    Audio compressed by OPUS codec without container, with bitrate of 32kbps.
    """

    Audio24Khz16Bit48KbpsMonoOpus = 32
    """
    audio-24khz-16bit-48kbps-mono-opus
    Audio compressed by OPUS codec without container, with bitrate of 48kbps.
    """

    Audio24Khz16Bit24KbpsMonoOpus = 33
    """
    audio-24khz-16bit-24kbps-mono-opus
    Audio compressed by OPUS codec without container, with bitrate of 24kbps.
    """

    Raw22050Hz16BitMonoPcm = 34
    """
    raw-22050hz-16bit-mono-pcm
    Raw PCM audio at 22050Hz sampling rate and 16-bit depth.
    """

    Riff22050Hz16BitMonoPcm = 35
    """
    riff-22050hz-16bit-mono-pcm
    PCM audio at 22050Hz sampling rate and 16-bit depth, with RIFF header.
    """

    Raw44100Hz16BitMonoPcm = 36
    """
    raw-44100hz-16bit-mono-pcm
    Raw PCM audio at 44100Hz sampling rate and 16-bit depth.
    """

    Riff44100Hz16BitMonoPcm = 37
    """
    riff-44100hz-16bit-mono-pcm
    PCM audio at 44100Hz sampling rate and 16-bit depth, with RIFF header.
    """

    AmrWb16000Hz = 38
    """
    amr-wb-16000hz
    AMR-WB audio at 16kHz sampling rate.
    """

    G72216Khz64Kbps = 39
    """
    g722-16khz-64kbps
    G.722 audio at 16kHz sampling rate and 64kbps bitrate.
    """


class StreamStatus(Enum):
    """
    Defines the possible status of audio data stream.
    """

    Unknown = 0
    """
    The audio data stream status is unknown
    """

    NoData = 1
    """
    The audio data stream contains no data
    """

    PartialData = 2
    """
    The audio data stream contains partial data of a speak request
    """

    AllData = 3
    """
    The audio data stream contains all data of a speak request
    """

    Canceled = 4
    """
    The audio data stream was canceled
    """


class ServicePropertyChannel(Enum):
    """
    Defines channels used to pass property settings to service.
    """

    UriQueryParameter = 0
    """
    Uses URI query parameter to pass property settings to service.
    """

    HttpHeader = 1
    """
    Uses HttpHeader to set a key/value in a HTTP header.
    """


class Transcription:
    class ParticipantChangedReason(Enum):
        """
        Why the participant changed event was raised
        """

        JoinedConversation = 0
        """
        Participant has joined the conversation
        """

        LeftConversation = 1
        """
        Participant has left the conversation. This could be voluntary, or involuntary
        (e.g. they are experiencing networking issues)
        """

        Updated = 2
        """
        The participants' state has changed (e.g. they became muted, changed their nickname)
        """


class Intent:
    class EntityType(Enum):
        """
        Used to define the type of entity used for intent recognition.
        """

        Any = 0
        """
        This will match any text that fills the slot.
        """

        List = 1
        """
        This will match text that is contained within the list or any text if the mode is set to "fuzzy".
        """

        PrebuiltInteger = 2
        """
        This will match cardinal and ordinal integers.
        """

    class EntityMatchMode(Enum):
        """
        Used to define the type of entity used for intent recognition.
        """

        Basic = 0
        """
        This is the basic or default mode of matching based on the EntityType
        """

        Strict = 1
        """
        This will match only exact matches within the entities phrases.
        """

        Fuzzy = 2
        """
        This will match text within the slot the entity is in, but not require anything from that text.
        """

    class EntityGreed(Enum):
        """
        Used to define the greediness of the entity.
        """

        Lazy = 0
        """
        Lazy will match as little as possible.
        """

        Greedy = 1
        """
        Greedy will match as much as possible.
        """


class VoiceProfileType(Enum):
    """
    Defines voice profile types
    """

    TextIndependentIdentification = 1
    """
    Text independent speaker identification.
    """

    TextDependentVerification = 2
    """
    Text dependent speaker verification.
    """

    TextIndependentVerification = 3
    """
    Text independent verification.
    """


class RecognitionFactorScope(Enum):
    """
    Defines the scope that a Recognition Factor is applied to.
    """

    PartialPhrase = 1
    """
    A Recognition Factor will apply to grammars that can be referenced as individual partial phrases.
    (Currently only applies to PhraseListGrammars)
    """


class PronunciationAssessmentGradingSystem(Enum):
    """
    Defines the point system for pronunciation score calibration; default value is FivePoint.
    """

    FivePoint = 1
    """
    Five point calibration
    """

    HundredMark = 2
    """
    Hundred mark
    """


class PronunciationAssessmentGranularity(Enum):
    """
    Defines the pronunciation evaluation granularity; default value is Phoneme.
    """

    Phoneme = 1
    """
    Shows the score on the full text, word and phoneme level
    """

    Word = 2
    """
    Shows the score on the full text and word level
    """

    FullText = 3
    """
    Shows the score on the full text level only
    """


class SynthesisVoiceType(Enum):
    """
    Defines the type of synthesis voices
    """

    OnlineNeural = 1
    """
    Online neural voice
    """

    OnlineStandard = 2
    """
    Online standard voice
    """

    OfflineNeural = 3
    """
    Offline neural voice
    """

    OfflineStandard = 4
    """
    Offline standard voice
    """


class SynthesisVoiceGender(Enum):
    """
    Defines the gender of synthesis voices
    """

    Unknown = 0
    """
    Gender unknown.
    """

    Female = 1
    """
    Female voice
    """

    Male = 2
    """
    Male voice
    """


class SpeechSynthesisBoundaryType(Enum):
    """
    Defines the boundary type of speech synthesis boundary event
    """

    Word = 0
    """
    Word boundary
    """

    Punctuation = 1
    """
    Punctuation boundary
    """

    Sentence = 2
    """
    Sentence boundary
    """


class SpeechSynthesisRequestInputType(Enum):
    """
    Defines the input type of speech synthesis request
    """

    NoneInput = 0

    Text = 1
    """
    Plain text input
    """

    SSML = 2
    """
    SSML (Speech Synthesis Markup Language) input
    """

    TextStream = 3
    """
    Text stream input
    """
