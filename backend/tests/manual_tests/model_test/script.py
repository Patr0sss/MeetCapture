import os
from PIL import Image, ImageTk
import tkinter as tk
from tkinter import messagebox
from crop_based_model import crop_based_on_model  

class ImageComparisonApp:
    def __init__(self, root, input_folder, output_folder):
        self.root = root
        self.root.title("Image Crop Prediction")
        
        self.input_folder = input_folder
        self.output_folder = output_folder
        self.file_names = os.listdir(self.input_folder)
        self.file_names = [f for f in self.file_names if os.path.isfile(os.path.join(self.input_folder, f))]
        self.total = 0
        self.predicted_correctly = 0
        self.original_label = tk.Label(root, text="Original Image:")
        self.original_label.grid(row=0, column=0, padx=10, pady=10)

        self.cropped_label = tk.Label(root, text="Cropped Image:")
        self.cropped_label.grid(row=0, column=1, padx=10, pady=10)

        self.original_img_label = tk.Label(root)
        self.original_img_label.grid(row=1, column=0, padx=10, pady=10)

        self.cropped_img_label = tk.Label(root)
        self.cropped_img_label.grid(row=1, column=1, padx=10, pady=10)

        self.label = tk.Label(root, text="Is the cropped image correct?")
        self.label.grid(row=2, column=0, columnspan=2, pady=10)

        self.correct_button = tk.Button(root, text="Yes", command=self.on_correct)
        self.correct_button.grid(row=3, column=0, padx=20)

        self.incorrect_button = tk.Button(root, text="No", command=self.on_incorrect)
        self.incorrect_button.grid(row=3, column=1, padx=20)

        self.result_label = tk.Label(root, text="")
        self.result_label.grid(row=4, column=0, columnspan=2, pady=10)
        self.next_image()

    def show_images(self, original_path, cropped_path):
        """Display the original and cropped images side by side."""
        original_image = Image.open(original_path)
        cropped_image = Image.open(cropped_path)

        original_image.thumbnail((400, 400))
        cropped_image.thumbnail((400, 400))
        original_img = ImageTk.PhotoImage(original_image)
        cropped_img = ImageTk.PhotoImage(cropped_image)
        self.original_img_label.config(image=original_img)
        self.original_img_label.image = original_img

        self.cropped_img_label.config(image=cropped_img)
        self.cropped_img_label.image = cropped_img

    def on_correct(self):
        """Handle when the prediction is correct."""
        self.predicted_correctly += 1
        self.total += 1
        self.next_image()

    def on_incorrect(self):
        """Handle when the prediction is incorrect."""
        self.total += 1
        self.next_image()

    def next_image(self):
        """Load the next pair of images for comparison."""
        if self.file_names:
            file_name = self.file_names.pop(0)
            input_image_path = os.path.join(self.input_folder, file_name)
            cropped_image_path = os.path.join(self.output_folder, f"cropped_{file_name}")
            os.makedirs(self.output_folder, exist_ok=True)
            try:
                crop_based_on_model(self.input_folder, self.output_folder, file_name)
            except Exception as e:
                messagebox.showerror("Error", f"Error processing {file_name}: {e}")
                return
            self.show_images(input_image_path, cropped_image_path)
            self.label.config(text=f"Is the cropped image correct for {file_name}?")
        else:
            self.label.config(text="All images processed!")
            self.result_label.config(
                text=f"Predicted Accuracy: {(self.predicted_correctly / self.total) * 100:.2f}%"
            )
            messagebox.showinfo("Done", "All images have been processed!")

if __name__ == "__main__":
    input_folder_path = "./test_input_screenshots/"
    output_folder_path = "./test_output_screenshots/"
    root = tk.Tk()
    app = ImageComparisonApp(root, input_folder_path, output_folder_path)
    root.mainloop()
