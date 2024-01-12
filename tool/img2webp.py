import os
import sys
from PIL import Image
from io import BytesIO
import argparse


def convert_to_webp(source_file, compare_mode=False):
    webp_file = os.path.splitext(source_file)[0] + ".webp"
    rel_path = os.path.relpath(webp_file, work_dir)
    source_rel_path = os.path.relpath(source_file, work_dir)

    if os.path.exists(webp_file):
        if compare_mode:
            with Image.open(source_file) as img:
                converted_image_stream = BytesIO()
                img.save(converted_image_stream, "webp")
                converted_image_stream.seek(0)

                with open(webp_file, "rb") as source_f:
                    original_size = len(source_f.read())
                converted_size = len(converted_image_stream.getvalue())

                if converted_size < original_size:
                    with open(webp_file, "wb") as f:
                        f.write(converted_image_stream.getvalue())
                    print(
                        f"\033[34mReplaced\033[0m: {rel_path} with a smaller WebP file."
                    )
                else:
                    print(
                        f"\033[33mSkipped\033[0m: The WebP file is not smaller (\033[31m{converted_size}\033[0m >= \033[32m{original_size}\033[0m) than exists {rel_path}"
                    )
        else:
            print(f"\033[33mSkipped\033[0m: WebP file already exists: {rel_path}")
        return

    try:
        with Image.open(source_file) as img:
            converted_image_stream = BytesIO()
            img.save(converted_image_stream, "webp")
            converted_image_stream.seek(0)

            with open(source_file, "rb") as source_f:
                original_size = len(source_f.read())
            converted_size = len(converted_image_stream.getvalue())

            if converted_size >= original_size:
                print(
                    f"\033[33mSkipped\033[0m: The WebP file is not smaller (\033[31m{converted_size}\033[0m >= \033[32m{original_size}\033[0m) than {source_rel_path}"
                )
            else:
                with open(webp_file, "wb") as f:
                    f.write(converted_image_stream.getvalue())
                print(f"\033[32mConverted\033[0m: {source_file} -> {rel_path}")
    except Exception as e:
        print(f"Error: converting {source_file} occured {e}")


def convert_images_in_directory(directory, compare_mode=False):
    for root, _, files in os.walk(directory):
        for file in files:
            if file.lower().endswith((".jpg", ".jpeg", ".png", ".gif")):
                source_file = os.path.join(root, file)
                convert_to_webp(source_file, compare_mode)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Convert images to WebP format.")
    parser.add_argument(
        "--compare", action="store_true", help="Enable WebP file comparison."
    )
    args = parser.parse_args()

    work_dir = os.path.abspath(os.path.dirname(sys.path[0]))
    convert_images_in_directory(work_dir, args.compare)
