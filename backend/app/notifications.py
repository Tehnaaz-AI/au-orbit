import os
import logging
import urllib.request
import urllib.parse
import base64
import json
from .config import TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM, DEMO_WHATSAPP_TO, TWILIO_CONTENT_SID

logger = logging.getLogger("auorbit.notifications")

def send_whatsapp_alert(message_body: str, to_number: str = None, use_content_template: bool = False) -> bool:
    """
    Sends a WhatsApp message via Twilio API.
    Non-blocking / safe: Never raises an unhandled exception or interrupts the core state machine.
    """
    if os.getenv("TESTING") == "1":
        return True

    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN:
        logger.debug("Twilio credentials not configured; skipping WhatsApp notification.")
        return False

    target = to_number or DEMO_WHATSAPP_TO
    if not target:
        return False

    if not target.startswith("whatsapp:"):
        target = f"whatsapp:{target}"

    try:
        url = f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_ACCOUNT_SID}/Messages.json"
        auth_header = "Basic " + base64.b64encode(f"{TWILIO_ACCOUNT_SID}:{TWILIO_AUTH_TOKEN}".encode("utf-8")).decode("utf-8")
        
        post_data = {
            "To": target,
            "From": TWILIO_WHATSAPP_FROM,
        }
        
        # When sending to Twilio WhatsApp business sender, ContentSid is required
        if TWILIO_CONTENT_SID:
            post_data["ContentSid"] = TWILIO_CONTENT_SID
        else:
            post_data["Body"] = message_body

        encoded_data = urllib.parse.urlencode(post_data).encode("utf-8")
        req = urllib.request.Request(url, data=encoded_data, headers={"Authorization": auth_header})
        with urllib.request.urlopen(req, timeout=5) as response:
            res_body = response.read().decode("utf-8")
            logger.info(f"WhatsApp alert sent successfully to {target}: {res_body}")
            return True
    except Exception as e:
        logger.warning(f"Failed to send WhatsApp alert to {target}: {e}")
        return False
