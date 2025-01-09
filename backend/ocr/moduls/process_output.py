def process_markdown(md_file, images_folder, output_pdf, max_width=600):
    import io
    import re
    import os
    import markdown
    import base64
    from weasyprint import HTML
    from PIL import Image

    def image_to_base64(image_path):
        # Convert an image to a base64-encoded string.
        with open(image_path, "rb") as img_file:
            image = Image.open(img_file)
            width, height = image.size
            new_width = int(width * 0.5)
            new_height = int(height * 0.5)
            scaled_image = image.resize((new_width, new_height))
            img_byte_arr = io.BytesIO()
            scaled_image.save(img_byte_arr, format="PNG")
            img_byte_arr.seek(0)
            return base64.b64encode(img_byte_arr.read()).decode("utf-8")


    # open markdown file
    with open(md_file, 'r', encoding='utf-8') as f:
        markdown_content = f.read()
    print(f"Original Markdown Content:\n{markdown_content}\n")

    # search for places where screenshots should be stored
    pattern = r"Information about (ocr/croped_photos/.+?): .+?"
    matches = re.findall(pattern, markdown_content)
    
    print(f"Matches found for image paths: {matches}")
    
    # changing text to images where screenshots should be stored
    for match in matches:
        image_path = os.path.join(images_folder, match)  # keep the original relative path
        print(f"Checking image path: {image_path}")  
        
        if os.path.exists(image_path):
            base64_image = image_to_base64(image_path)  # convert image to base64 string
            
            # update markdown content to embed image
            markdown_image = f'<img src="data:image/png;base64,{base64_image}" width="{max_width}"/>'
            # replace text with image
            markdown_content = markdown_content.replace(f"Information about {match}: This is where screenshots (ss) should be stored", markdown_image + '\n') 
            print(f"Embedded image in Markdown content.")  
        else:
            print(f"Image not found: {image_path}")  
    
    print(f"\nModified Markdown Content with Images:\n{markdown_content}\n")

    # converting Markdown to HTML
    html_content = markdown.markdown(markdown_content)
    
    print(f"Generated HTML Content:\n{html_content}\n")

    # generate PDF
    try:
        HTML(string=html_content).write_pdf(output_pdf)
        print(f"PDF saved as {output_pdf}")
    except Exception as e:
        print(f"Error generating PDF: {e}")


