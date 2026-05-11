import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

logger = logging.getLogger(__name__)


def send_email(host: str, port: int, user: str, password: str,
               from_addr: str, to_addr: str,
               subject: str, html: str, text: str) -> None:
    """
    Send a multipart HTML/plain email via Gmail SMTP (STARTTLS on port 587).
    Raises on any failure — callers must catch and log.
    """
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = from_addr
    msg["To"] = to_addr
    msg.attach(MIMEText(text, "plain", "utf-8"))
    msg.attach(MIMEText(html, "html", "utf-8"))

    with smtplib.SMTP(host, port, timeout=30) as smtp:
        smtp.ehlo()
        smtp.starttls()
        smtp.ehlo()
        smtp.login(user, password)
        smtp.sendmail(from_addr, [to_addr], msg.as_string())

    logger.info("Email sent to=%s subject=%r", to_addr, subject)
