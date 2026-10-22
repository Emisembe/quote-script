"""Mimic Blogger's page editor: every non-ASCII character becomes &#NNN; on save."""
import sys
src = open(sys.argv[1], encoding='utf-8').read()
open(sys.argv[2], 'w', encoding='ascii').write(''.join(c if ord(c) < 128 else f'&#{ord(c)};' for c in src))
