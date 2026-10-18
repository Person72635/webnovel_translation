def remove_empty_lines(input_file, output_file=None):
    """
    Remove empty lines from a text file.
    
    Args:
        input_file (str): Path to the input text file
        output_file (str): Path to the output file (optional). If not provided, prints to console.
    """
    with open(input_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Filter out empty lines (lines that are only whitespace or empty)
    non_empty_lines = [line for line in lines if line.strip()]
    
    if output_file:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.writelines(non_empty_lines)
        print(f"File saved to {output_file}")
    else:
        print(''.join(non_empty_lines))

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python remove_empty_lines.py <input_file> [output_file]")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    remove_empty_lines(input_file, output_file)
