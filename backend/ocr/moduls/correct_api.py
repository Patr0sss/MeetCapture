def correct_text(text):
    import logging
    import os
    from groq import Groq
    from dotenv import load_dotenv
    load_dotenv()

    logger = logging.getLogger('CORRECT_API')
    logger.setLevel(logging.DEBUG)
    console_handler = logging.StreamHandler()
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    prompt=os.environ.get("CORRECT_TEXT_PROMPT")

    try:
        client = Groq(
            api_key=os.environ.get("GROQ_API_KEY"),
        )
        logger.info("Properly loaded API key")
    except:
        logger.error("Failed to load client and API key")

    chat_completion = client.chat.completions.create(
        messages=[
            {
                "role": "user",
                "content": f"{prompt}: {text}"

            }
        ],
        model="llama-3.3-70b-versatile",
        temperature=1,
        max_tokens=1024,
        top_p=1,
        stream=False,
        stop=None,
    )
    logger.debug("Loaded function correct_text")
    return chat_completion.choices[0].message.content