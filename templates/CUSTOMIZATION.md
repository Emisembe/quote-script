# Customization Guide - Efic Consultancy Blogger Template

This guide shows you how to customize the template to match your brand and needs.

## Color Customization

The template uses CSS custom properties (variables) for easy color changes.

### Changing the Brand Color

1. **Access Template HTML**
   - Theme > Edit HTML
   - Look for `:root {` section (around line 200-220)

2. **Update Variables**
   ```css
   :root {
     --brand:       #5DADE2;        /* Main brand color */
     --brand-dark:  #2e86c1;        /* Darker shade for hovers */
     --dark:        #0f172a;        /* Dark background */
     --text:        #2e2e2e;        /* Main text color */
     --text-muted:  #606060;        /* Secondary text */
     --light-bg:    #f8f9fb;        /* Light backgrounds */
     --white:       #ffffff;        /* White */
   }
   ```

3. **Example - Change to Green Theme**
   ```css
   --brand:       #27ae60;        /* Green */
   --brand-dark:  #1e8449;        /* Dark green */
   ```

### Color Palette Reference

| Use Case | Variable | Default | Purpose |
|----------|----------|---------|---------|
| Buttons, Links, Hover | `--brand` | #5DADE2 (Blue) | Primary brand color |
| Button Hover, Dark Mode | `--brand-dark` | #2e86c1 | Darker shade |
| Navigation Bar | `--dark` | #0f172a | Dark navy |
| Body Text | `--text` | #2e2e2e | Main text |
| Secondary Text | `--text-muted` | #606060 | Lighter text |
| Section Backgrounds | `--light-bg` | #f8f9fb | Light gray |

## Typography Customization

### Changing Fonts

1. **Find the Font Import** (around line 50)
   ```html
   <link href='https://fonts.googleapis.com/css2?family=Dosis:wght@400;600;700&...'/>
   ```

2. **Add New Fonts**
   - Visit [Google Fonts](https://fonts.google.com)
   - Select your fonts
   - Copy the import link
   - Replace in template

3. **Update CSS References**
   - Find `h1, h2, h3, h4, h5, h6` in CSS
   - Change `font-family: 'Dosis', sans-serif;`
   - Change `body { font-family: 'Open Sans', sans-serif; }`

### Example - Change to Modern Fonts

```html
<!-- New import -->
<link href='https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Playfair+Display:wght@700&display=swap' rel='stylesheet'/>

<!-- In CSS -->
h1, h2, h3, h4, h5, h6 {
  font-family: 'Playfair Display', serif;
}
body {
  font-family: 'Inter', sans-serif;
}
```

## Hero Section Customization

### Change Hero Background Image

1. Find `#header-wrapper` in CSS (around line 700)
2. Locate the `background:` property
3. Replace the image URL:
   ```css
   background: url(YOUR-NEW-IMAGE-URL) no-repeat center center;
   ```

### Change Hero Overlay Opacity

Find the `#header-wrapper::before` section:
```css
#header-wrapper::before {
  opacity: 0.55;  /* Change this number (0-1) */
}
```
- Lower opacity = lighter overlay
- Higher opacity = darker overlay

### Change Hero Title Size

Find `#header h1`:
```css
font-size: clamp(42px, 7vw, 77px);
/* 42px minimum, 7% of viewport width preferred, 77px maximum */
```

## Section Customization

### Expertise Tiles Section (6 boxes)

**Change section background:**
Find `.sora-special-box`:
```css
background: var(--light-bg);  /* Change this */
```

**Change tile background:**
Find `.special-tiles`:
```css
background: var(--white);  /* Change this */
```

### Process Section (4 steps)

**Change background:**
Find `.sora-works-box`:
```css
background: linear-gradient(...), url(BACKGROUND-URL);
```

**Adjust overlay darkness:**
Modify the `rgba(15,23,42,0.72)` value (last number is opacity)

### About/Videos Section

**Change grid columns:**
Find `.about-tiles-link`:
```css
width: 33.333%;  /* Change to 50% for 2 columns or 100% for 1 column */
```

## Navigation Customization

### Menu Items (Blogger Widget)

1. Layout > Main Menu widget
2. Add items with structure:
   - `Item Name` - Top level
   - `_Sub Item` - Dropdown (starts with underscore)

### Navigation Colors

Find `.nav-links > li > a`:
```css
color: rgba(255,255,255,0.88);  /* Text color */
```

Find `.nav-links > li > a::after`:
```css
background: var(--brand);  /* Underline color on hover */
```

## Sidebar Customization

### Sidebar Width

Find `.item #sidebar-wrapper`:
```css
width: 30%;  /* Change this percentage */
```

### Widget Title Styling

Find `#sidebar-wrapper h2`:
```css
border-bottom: 2px solid var(--brand);  /* Underline color */
```

## Contact Form Customization

### Form Button Color

Find `.contact-form-button-submit`:
```css
background: var(--brand);  /* Button color */
```

### Form Input Focus Color

Find `#ContactForm1_contact-form-name:focus`:
```css
border-color: var(--brand) !important;  /* Border color */
box-shadow: 0 0 0 3px rgba(93,173,226,0.15) !important;  /* Glow color */
```

## Footer Customization

### Footer Background

Find `#jugas_footer`:
```css
background: var(--dark);  /* Footer color */
```

### Social Icons

Find `.foot-social #social a`:
```css
color: rgba(255,255,255,0.5);  /* Icon color */
border: 1px solid rgba(255,255,255,0.15);  /* Icon border */
```

## Responsive Breakpoints

Customize how the design looks on different screen sizes:

Find the `@media` sections at the bottom of the CSS.

### Example - Adjust tablet breakpoint

```css
@media (max-width: 900px) {
  .special-tiles-link { width: 50%; }  /* 3 columns → 2 columns */
}
```

### Common Breakpoints

- **Desktop:** > 1024px
- **Tablet:** 600px - 1024px
- **Mobile:** < 600px

## Advanced Customization

### Change Spacing

Find `.row`:
```css
padding: 0 24px;  /* Left/right padding */
```

### Change Border Radius

Find `:root`:
```css
--radius: 6px;  /* Corner roundness */
```

### Change Shadow Depth

Find `:root`:
```css
--shadow: 0 4px 24px rgba(0,0,0,0.10);
```

## SEO Metadata

### Update Meta Tags

Find the `<head>` section and update:

```html
<!-- Basic SEO -->
<meta content='Your description here' name='description'/>
<meta content='your, keywords, here' name='keywords'/>

<!-- Open Graph -->
<meta content='YOUR-LOGO-IMAGE.png' property='og:image'/>

<!-- Organization Schema -->
"name": "Your Company Name",
"url": "https://yourblog.blogspot.com",
"logo": "https://your-logo-url.png"
```

## Testing Your Changes

After customizing:

1. **Save the template** - Theme > Edit HTML > Save theme
2. **Clear cache** - Ctrl+Shift+Delete (or Cmd+Shift+Delete on Mac)
3. **Refresh blog** - View your blog and refresh (Ctrl+R)
4. **Test responsive** - F12 to open DevTools, toggle mobile view
5. **Check all sections** - Scroll through your blog homepage

## Common Customization Tasks

### Make Navigation Transparent on Scroll
Find `#site-nav`:
```css
background: transparent;  /* Start transparent */
```

### Remove Hero Image Overlay
Find `#header-wrapper::before`:
```css
opacity: 0;  /* Make invisible */
```

### Change Contact Form Placeholder Text
Locate form fields in the template and update placeholder attributes

### Adjust Section Padding
Find `.sora-special-box` and modify:
```css
padding: 60px 0;  /* Change these values */
```

## Need Help?

If you encounter issues:
1. Check the [INSTALLATION.md](./INSTALLATION.md) troubleshooting section
2. Verify CSS syntax (check for missing semicolons or brackets)
3. Clear browser cache and refresh
4. Try changes in smaller increments to identify conflicts

## Backup Before Major Changes

Before extensive customization:
1. Theme > Edit HTML
2. Select all (Ctrl+A)
3. Copy to text file
4. Save as backup: `template-backup.xml`

This way you can easily revert if needed!
