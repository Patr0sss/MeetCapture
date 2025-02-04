def process_image(input_image,timestamp):
    from dotenv import load_dotenv
    from .correct_api import correct_text
    from .is_graph_api import is_graph
    from llama_parse import LlamaParse
    from llama_index.core import SimpleDirectoryReader
    import logging

    logger = logging.getLogger('PROCESS_IMAGE')
    logger.setLevel(logging.DEBUG)
    console_handler = logging.StreamHandler()
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    load_dotenv()

    parser = LlamaParse(
        result_type="markdown",
        # premium_mode="true"
        )
    file_extractor = {".png": parser}

    documents = SimpleDirectoryReader(input_files=[input_image], file_extractor=file_extractor).load_data()
    # ocr from model
    text = documents[0].to_embedchain_format()['data']['content']
    logger.debug(f"Original OCR: {text}")
    # improving text from ocr
    result_after_correction = correct_text(text)
    logger.debug(f"OCR result: {result_after_correction}")
    # checking if screenshot should be presented as image
    is_graph_result = is_graph(input_image)
    logger.debug(f"Graphicall result: {is_graph_result}")
    logger.debug(f"Should screenshot be saved? : {is_graph_result}")

    text = ""
    with open('notes.md', 'a') as f:
        if is_graph_result == 'True':
            # f.write(f"\nInformation about {input_image}: This is where screenshots (ss) should be stored.\n")
            text = f"\nInformation about {input_image}: This is where screenshots (ss) should be stored.\n"
        else:
            # f.write(f"\n{result_after_correction}\n")
            text = f"\n{result_after_correction}\n"
    
    return is_graph_result,text