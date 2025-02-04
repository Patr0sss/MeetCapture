def create_email(to_emails, subject, body, file_path):
    from email import encoders
    from email.mime.base import MIMEBase
    from email.mime.multipart import MIMEMultipart
    from email.mime.text import MIMEText
    import os
    message = MIMEMultipart()
    message['to'] = ', '.join(to_emails)
    message['subject'] = subject

    # Attach body
    message.attach(MIMEText(body, 'plain'))

    # Attach file (if provided)
    if file_path:
        with open(file_path, 'rb') as file:
            part = MIMEBase('application', 'octet-stream')
            part.set_payload(file.read())
            encoders.encode_base64(part)
            part.add_header('Content-Disposition', f'attachment; filename="{os.path.basename(file_path)}"')
            message.attach(part)

    return message