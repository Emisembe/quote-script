# CSS Customization Guide - Add CSS Method

This guide shows you how to customize the Efic Consultancy template using Blogger's **Add CSS** feature.

## How to Add CSS in Blogger

1. Go to **Theme** in left sidebar
2. Click **⋮ (three dots)** → **Customize**
3. Scroll to bottom and find **"Add CSS"** section
4. Paste the CSS code from below
5. Click **Save**

---

## Color Customizations

### Change Brand/Primary Color
```css
/* Change main blue color to green */
a:hover,
.special-icons,
.works-icons,
.scrolling-menu #nav li a:hover,
.scrolling-menu #nav li.current a,
.share-art a,
#menu ul > li:hover > a {
  color: #27ae60 !important;
}

/* Change hover states and accents */
.ias_trigger a:hover,
.displaypageNum a:hover,
.blog-pager-older-link:hover,
.blog-pager-newer-link:hover {
  background: #27ae60 !important;
}
```

### Change Navigation Hover Color
```css
/* Main menu hover color */
.scrolling-menu #nav li a:hover {
  color: #FF5722 !important;
}

.scrolling-menu #nav li.current a {
  color: #FF5722 !important;
}

.scrolling-menu #nav li.current a:before {
  background: #FF5722 !important;
}
```

### Change Section Background Colors
```css
/* Expertise tiles section - change from gray to white */
.sora-special-box {
  background: #ffffff !important;
}

/* Works/Process section - change overlay color */
#header-wrapper:before {
  background: #000000 !important;
  opacity: 0.5 !important;
}

/* About section */
.sora-about-box {
  background: #f0f0f0 !important;
}
```

---

## Typography/Font Customizations

### Change Heading Sizes
```css
/* Make all h1, h2, h3 larger */
h1 {
  font-size: 48px !important;
}

h2 {
  font-size: 32px !important;
}

h3 {
  font-size: 24px !important;
}

/* Change section titles */
.special-title h4,
.works-title h4,
.about-title h4,
.contact-title h4,
.Portfolio-title h4 {
  font-size: 42px !important;
  line-height: 52px !important;
}
```

### Change Font Family
```css
/* Change body font */
body {
  font-family: 'Trebuchet MS', sans-serif !important;
}

/* Change heading font */
h1, h2, h3, h4, h5, h6 {
  font-family: 'Arial Black', sans-serif !important;
}
```

### Change Text Color
```css
/* Main text color */
body {
  color: #333333 !important;
}

/* Headings */
h1, h2, h3, h4, h5, h6 {
  color: #1a1a1a !important;
}

/* Secondary text (gray) */
.works-text,
.special-text,
.about-text {
  color: #666666 !important;
}
```

---

## Navigation Customizations

### Change Navigation Bar Background
```css
/* Scrolling navigation background */
.scroll-header.scrolled-header {
  background-color: rgba(50, 50, 50, 0.95) !important;
}

/* Top navigation height */
#menu {
  height: 70px !important;
}

#menu ul > li > a {
  line-height: 70px !important;
}
```

### Change Navigation Link Colors
```css
/* Navigation links */
#menu ul > li > a {
  color: #ffffff !important;
  font-size: 13px !important;
}

/* Navigation hover */
#menu ul > li:hover > a {
  color: #5DADE2 !important;
}

/* Dropdown menu background */
#menu ul > li > ul {
  background: #f5f5f5 !important;
}

#menu ul > li > ul > li a {
  color: #000000 !important;
}
```

---

## Section-Specific Customizations

### Expertise Tiles
```css
/* Tile background */
.special-tiles {
  background: #ffffff !important;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
}

/* Icon color */
.special-icons {
  color: #5DADE2 !important;
  font-size: 50px !important;
}

/* Title color */
.special-heading {
  color: #2e2e2e !important;
  font-size: 16px !important;
}

/* Description text */
.special-text {
  color: #666666 !important;
  font-size: 14px !important;
}
```

### Works/Process Section
```css
/* Background overlay opacity */
.sora-works-box:before {
  background: rgba(0, 0, 0, 0.4) !important;
}

/* Circle progress indicators */
.works-icons {
  color: #5DADE2 !important;
}

/* Section title */
.works-title h4 {
  color: #ffffff !important;
}
```

### Contact Form
```css
/* Form input styling */
input#ContactForm1_contact-form-name,
#ContactForm1_contact-form-email,
.contact-form-email-message {
  border: 2px solid #5DADE2 !important;
  border-radius: 4px !important;
  padding: 10px !important;
}

/* Submit button */
.contact-form-button-submit {
  background: #5DADE2 !important;
  color: #ffffff !important;
  border: none !important;
}

.contact-form-button-submit:hover {
  background: #2e86c1 !important;
}
```

---

## Blog Post Customizations

### Post Grid Cards
```css
/* Post card background and shadow */
.post {
  background: #ffffff !important;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08) !important;
  border-radius: 4px !important;
}

/* Post title */
.post h1, .post h2 {
  color: #2e2e2e !important;
  font-size: 24px !important;
}

/* Post meta (date, author) */
.post-meta {
  color: #999999 !important;
}
```

### Post Image Hover Effect
```css
/* Image zoom on hover */
.block-image img {
  transition: transform 0.4s ease-out !important;
}

.block-image:hover img {
  transform: scale(1.05) !important;
}
```

### Related Posts
```css
/* Related post cards */
.related-thumb {
  border-radius: 8px !important;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
}

.related-title a {
  font-size: 16px !important;
  color: #ffffff !important;
}
```

---

## Hover Effects

### Add Smooth Transitions
```css
/* Smooth color transitions */
a, button, .special-tiles, .post {
  transition: all 0.3s ease-out !important;
}

/* Tile hover effect */
.special-tiles:hover {
  box-shadow: 0 8px 20px rgba(0,0,0,0.15) !important;
  transform: translateY(-2px) !important;
}

/* Post hover effect */
.post:hover {
  box-shadow: 0 8px 20px rgba(0,0,0,0.12) !important;
}
```

---

## Responsive/Mobile Customizations

### Mobile Menu Colors
```css
/* Mobile hamburger menu */
.slicknav_menu {
  background: #ffffff !important;
}

.slicknav_nav {
  background: #f5f5f5 !important;
}

.slicknav_nav a {
  color: #2e2e2e !important;
}

.slicknav_nav a:hover {
  color: #5DADE2 !important;
  background: #eeeeee !important;
}
```

### Mobile Hero Text
```css
/* Make hero smaller on mobile */
@media (max-width: 600px) {
  #header h1 {
    font-size: 32px !important;
  }
}
```

---

## Advanced Customizations

### Change Border Radius (Roundness)
```css
/* Make everything more rounded */
.post,
.special-tiles,
.about-tiles,
input,
button {
  border-radius: 8px !important;
}

/* Make more square */
* {
  border-radius: 0px !important;
}
```

### Change Shadows (Depth)
```css
/* Add more shadow (deeper) */
.post,
.special-tiles {
  box-shadow: 0 8px 24px rgba(0,0,0,0.15) !important;
}

/* Remove all shadows */
* {
  box-shadow: none !important;
}
```

### Dark Mode (Advanced)
```css
/* Dark background */
body {
  background: #1a1a1a !important;
  color: #ffffff !important;
}

/* Dark cards */
.post,
.special-tiles {
  background: #2a2a2a !important;
  color: #ffffff !important;
}

/* Light text */
h1, h2, h3, h4, h5, h6 {
  color: #ffffff !important;
}
```

---

## Common Changes You Can Make

### 1. Change ALL colors at once
Replace `#5DADE2` (blue) with your color everywhere:
```css
/* Change blue to purple */
* {
  color: #7b2cbf !important;
}

a:hover,
.special-icons,
.works-icons {
  color: #7b2cbf !important;
}
```

### 2. Make text bigger
```css
body {
  font-size: 16px !important;
  line-height: 1.8 !important;
}

h1, h2, h3, h4, h5, h6 {
  font-size: 120% !important;
}
```

### 3. Change link colors
```css
a {
  color: #2e86c1 !important;
}

a:hover {
  color: #5DADE2 !important;
}

.post-body a {
  color: #5DADE2 !important;
}
```

### 4. Make sections full-width
```css
.row {
  max-width: 100% !important;
}

.special-tiles,
.works-tiles,
.about-tiles {
  width: 50% !important; /* 2 columns instead of 3 */
}
```

---

## Tips

- **Always use `!important`** to override template styles
- **Test in mobile view** (F12 → Toggle Device Toolbar)
- **Use color tools** like [ColorHexa.com](https://www.colorhexa.com) to find colors
- **Check browser console** (F12 → Console) for errors
- **Save after each change** to see results
- **Right-click + Inspect** on elements to find class names for targeting

---

## Example: Complete Customization

Here's a complete example that changes colors, fonts, and adds hover effects:

```css
/* Colors */
:root {
  --brand: #27ae60;
  --brand-dark: #1e8449;
}

a:hover,
.special-icons,
.works-icons,
#menu ul > li:hover > a,
#menu ul > li.current a {
  color: #27ae60 !important;
}

/* Fonts */
body {
  font-size: 15px !important;
  line-height: 1.8 !important;
}

h1, h2, h3, h4, h5, h6 {
  font-size: 120% !important;
}

/* Hover Effects */
.special-tiles:hover,
.post:hover {
  box-shadow: 0 8px 20px rgba(0,0,0,0.15) !important;
  transform: translateY(-3px) !important;
}

/* Transitions */
* {
  transition: all 0.3s ease-out !important;
}
```

---

## Need More Help?

- Check your browser's **Inspector** (F12) to find element class names
- Look for `.post`, `.special-tiles`, `.works-icons` to target specific elements
- Use color codes like `#5DADE2` or `rgb(93, 173, 226)`
- Test changes one at a time

**Happy customizing!** 🎨
