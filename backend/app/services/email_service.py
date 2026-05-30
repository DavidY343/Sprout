import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM, FRONTEND_URL


async def _send_email(to: str, subject: str, html_body: str):
    """Send an email via SMTP. Fails silently if SMTP is not configured."""
    if not SMTP_HOST:
        return

    msg = MIMEMultipart("alternative")
    msg["From"] = SMTP_FROM
    msg["To"] = to
    msg["Subject"] = subject
    msg.attach(MIMEText(html_body, "html"))

    await aiosmtplib.send(
        msg,
        hostname=SMTP_HOST,
        port=SMTP_PORT,
        username=SMTP_USER,
        password=SMTP_PASSWORD,
        start_tls=True,
    )


async def send_verification_email(to: str, token: str):
    link = f"{FRONTEND_URL}/verify-email?token={token}"
    html = f"""
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #2C2C2C;">Verifica tu cuenta en Sprout</h2>
        <p style="color: #5A5549;">Haz clic en el botón para confirmar tu dirección de email:</p>
        <a href="{link}" style="display: inline-block; padding: 12px 24px; background: #2C2C2C; color: #FAF7F0; text-decoration: none; border-radius: 8px; font-weight: 500;">
            Verificar email
        </a>
        <p style="color: #8B8578; font-size: 12px; margin-top: 24px;">
            Si no creaste esta cuenta, ignora este mensaje. El enlace expira en 24 horas.
        </p>
    </div>
    """
    await _send_email(to, "Verifica tu cuenta — Sprout", html)


async def send_password_reset_email(to: str, token: str):
    link = f"{FRONTEND_URL}/reset-password?token={token}"
    html = f"""
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #2C2C2C;">Restablecer contraseña</h2>
        <p style="color: #5A5549;">Has solicitado restablecer tu contraseña. Haz clic en el botón:</p>
        <a href="{link}" style="display: inline-block; padding: 12px 24px; background: #2C2C2C; color: #FAF7F0; text-decoration: none; border-radius: 8px; font-weight: 500;">
            Restablecer contraseña
        </a>
        <p style="color: #8B8578; font-size: 12px; margin-top: 24px;">
            Si no solicitaste esto, ignora este mensaje. El enlace expira en 1 hora.
        </p>
    </div>
    """
    await _send_email(to, "Restablecer contraseña — Sprout", html)
