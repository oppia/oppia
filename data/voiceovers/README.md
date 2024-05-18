This folder contains two JSON files: - language_accent_master_list.json stores a dict with language codes as keys and nested dicts as values.
Each nested dict contains language accent codes as keys, and their descriptions as values.
This is an exhaustive list of language accent pairs that Oppia may support for voiceovers (manual and auto). - autogeneratable_language_accent_list.json stores a dict with language accent codes as keys and nested dicts as values.
Each nested dictionary includes 'service' and 'voice_code' keys with their corresponding field values.
The 'service' field denotes the third-party service utilized by Oppia for voiceover generation,
while 'voice_code' signifies the desired voice type. For the complete list of voice types,
please consult: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=tts.
This is an exhaustive list of language accent pairs that Oppia may support for automatic voiceovers, and
this should be a subset of the language accent master list.
