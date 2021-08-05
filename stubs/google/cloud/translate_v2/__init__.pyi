from typing import Dict, List, Optional, Text, Union

class Client(object):
    def translate(
        self,
        values: Union[Text, List[Text]],
        target_language: Optional[Text] = ...,
        format_: Optional[Text] = ...,
        source_language: Optional[Text] = ...,
        customization_ids: Union[Text, List[Text], None] = ...,
        model: Optional[Text] = ...,
    ) -> Union[Dict[Text, Text], List[Dict[Text, Text]]]: ...
