def is_graph(input_image):
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

    try:
        completion = client.chat.completions.create(
            model="llama-3.2-90b-vision-preview",
            messages=[
                {
                    "role": "user",
                    "content": f"Should this content be represented graphically? Please answer only 'True' or 'False'. Image URL: {input_image}"
                }
            ],
            temperature=1,
            max_completion_tokens=1024,
            top_p=1,
            stream=False,
            stop=None,
        )
        logger.info("API request successful.")
    except Exception as e:
        logger.error(f"Error during API request: {e}")
        return None
    return completion.choices[0].message.content
