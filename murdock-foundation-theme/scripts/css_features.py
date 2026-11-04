"""CSS features used by a Blogger skin: properties, functions, pseudo-classes,
at-rules and global keywords. Shared by extract_reference.py and check.py."""
import re


def skin_of(theme_text):
    m = re.search(r'<b:skin[^>]*><!\[CDATA\[(.*?)\]\]></b:skin>', theme_text, re.S)
    return m.group(1) if m else ''


def css_features(css):
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    feats = set()
    for block in re.findall(r'\{([^{}]*)\}', css):
        feats |= {'property ' + p for p in re.findall(r'(?:^|;)\s*([a-z-]+)\s*:', block)}
        feats |= {'keyword ' + k for k in re.findall(r':\s*(inherit|initial|unset|revert)\b', block)}
    feats |= {'function ' + f + '()' for f in re.findall(r'([a-z-]+)\(', css) if f not in ('url',)}
    selectors = re.sub(r'\{[^{}]*\}', '{}', css)
    feats |= {'selector ' + p for p in re.findall(r'(::?[a-z-]+)', selectors)}
    feats |= {'at-rule ' + a for a in re.findall(r'(@[a-z-]+)', css)}
    return feats
