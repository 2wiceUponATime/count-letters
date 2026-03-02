## created by @thirtyseven
# python
from typing import Optional


#funcs were ai, because im lazy and tired
def int_to_excel_column(n: int) -> str:
    """
    Excel-style column name (1-based): 1 -> 'A', 26 -> 'Z', 27 -> 'AA'.
    Raises ValueError for n < 1.
    """
    if n < 1:
        raise ValueError("Excel-style columns require n >= 1")
    letters = []
    while n > 0:
        n -= 1
        n, rem = divmod(n, 26)
        letters.append(chr(ord("A") + rem))
    return "".join(reversed(letters))
def excel_column_to_int(col: str) -> int:
    """
    Convert an Excel-style column name to an integer.
    Examples: 'A' -> 1, 'Z' -> 26, 'AA' -> 27.
    Raises ValueError for empty or non-letter input.
    """
    if not isinstance(col, str):
        raise ValueError("Column must be a string")
    s = col.strip().upper()
    if not s:
        raise ValueError("Column string is empty")
    value = 0
    for ch in s:
        if not ('A' <= ch <= 'Z'):
            raise ValueError(f"Invalid character {ch!r} in column name")
        value = value * 26 + (ord(ch) - ord('A') + 1)
    return value

number = input("Number/letter(s) to be converted: ")

try:
    print(int_to_excel_column(int(number)))
except ValueError as e:
    print(excel_column_to_int(number))
