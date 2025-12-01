from core.controllers import base
import webapp2

class ChatbotHandler(base.BaseHandler):
    REQUIRE_PAYLOAD_CSRF_CHECK = False

    def post(self):
        user_msg = self.payload.get('message', '').lower()

        if 'hello' in user_msg:
            reply = 'Hello! How can I assist you?'
        elif 'help' in user_msg:
            reply = 'Ask me anything about this lesson!'
        else:
            reply = 'I am still learning. Please try asking something else!'

        self.render_json({'reply': reply})
