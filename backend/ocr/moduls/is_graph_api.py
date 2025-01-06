def is_graph(text):
    import os
    import logging
    from groq import Groq
    from dotenv import load_dotenv
    load_dotenv()

    logger = logging.getLogger('IS_GRAPH_API')
    logger.setLevel(logging.DEBUG)
    console_handler = logging.StreamHandler()
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    prompt=os.environ.get("GRAPHICAL_PROMPT")

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
        model="llama3-8b-8192",
    )
    logger.debug("Loaded function is_graph")
    return chat_completion.choices[0].message.content