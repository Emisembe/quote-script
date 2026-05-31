# 🎨 Brand & Typography Configuration Guide

Complete guide to customizing your email system with professional fonts, colors, and spacing configurations.

---

## Overview

The EMAIL AUTOMATION SYSTEM now includes a comprehensive **BRAND** configuration section that lets you control:

- **Font Families** - Typography for headers, body text, and footer
- **Font Sizes** - Complete font size control across all elements
- **Color Palettes** - Complete color scheme with text, links, buttons, and status colors
- **Spacing** - Padding, margins, gaps, and layout control
- **Background Colors** - Primary, secondary, light, and accent backgrounds

### Benefits

✅ **Single Source of Truth** - All styling configured in one place  
✅ **Instant Updates** - Change a value, entire email system updates  
✅ **Professional Consistency** - Same fonts/colors across all templates  
✅ **Multi-Brand Support** - Create different brand configs for different companies  
✅ **Easy Customization** - No code editing required  

---

## Default Brand Configuration

The system comes with a professional default brand:

```javascript
BRAND: {
  "default": {
    // Font Families
    fonts: {
      header: "Arial, sans-serif",
      body: "Trebuchet MS, sans-serif",
      footer: "Arial, sans-serif"
    },

    // Font Sizes
    fontSizes: {
      headerTitle: "28px",
      subheading: "18px",
      body: "14px",
      footer: "12px",
      footerSmall: "11px",
      footerLabel: "12px"
    },

    // Complete Color Palette
    colors: {
      primary: "#0066cc",
      secondary: "#004499",
      accent: "#ff6600",

      text: {
        dark: "#333333",
        light: "#666666",
        muted: "#999999",
        light_bg: "#f5f5f5"
      },

      link: "#0066cc",
      linkHover: "#004499",
      button: "#ff6600",
      buttonHover: "#dd5500",

      friendly: "#0066cc",
      urgent: "#ff9900",
      critical: "#cc0000"
    },

    // Spacing & Layout
    spacing: {
      sectionPadding: "20px",
      columnGap: "15px",
      footerRowGap: "8px",
      mailboxWidth: "600px"
    },

    // Background Colors
    backgrounds: {
      primary: "#f9f9f9",
      white: "#ffffff",
      light: "#f5f5f5",
      accent: "#e3f2fd"
    }
  }
}
```

---

## How to Configure Your Brand

### Step 1: Locate the CONFIG Section
Open your Google Apps Script and find the `CONFIG` object at the top. Look for the `BRAND` section.

### Step 2: Update Fonts
Change the font families to match your brand:

```javascript
fonts: {
  header: "Georgia, serif",      // Elegant serif for headers
  body: "Calibri, sans-serif",   // Clean sans-serif for body
  footer: "Arial, sans-serif"    // Professional footer font
}
```

### Step 3: Adjust Font Sizes
Customize text sizes for your preference:

```javascript
fontSizes: {
  headerTitle: "24px",      // Smaller header
  subheading: "16px",       // Smaller subheading
  body: "15px",             // Slightly larger body text
  footer: "11px",           // Smaller footer
  footerSmall: "10px",      // Smaller fine print
  footerLabel: "11px"       // Section labels
}
```

### Step 4: Define Color Palette
Create a cohesive color scheme:

```javascript
colors: {
  primary: "#2c3e50",       // Your main brand color
  secondary: "#34495e",     // Darker shade
  accent: "#e74c3c",        // Call-to-action color
  
  text: {
    dark: "#2c3e50",        // Main text color
    light: "#7f8c8d",       // Secondary text
    muted: "#bdc3c7",       // Light/disabled text
    light_bg: "#ecf0f1"     // Light background
  },
  
  link: "#2c3e50",          // Link color
  linkHover: "#34495e",     // Hover color
  button: "#e74c3c",        // Button background
  buttonHover: "#c0392b",   // Button hover
  
  friendly: "#27ae60",      // Friendly reminder (green)
  urgent: "#f39c12",        // Urgent reminder (orange)
  critical: "#e74c3c"       // Critical reminder (red)
}
```

### Step 5: Adjust Spacing for Concise Footer
Make the footer more compact:

```javascript
spacing: {
  sectionPadding: "16px",      // Reduced from 20px
  columnGap: "12px",           // Reduced from 15px
  footerRowGap: "6px",         // Reduced from 8px
  mailboxWidth: "600px"
}
```

### Step 6: Save and Test
1. Press **Ctrl+S** to save
2. Press **F5** to refresh your Google Sheet
3. Send a test email to see your new brand styling

---

## Brand Configuration Examples

### Example 1: Corporate/Professional Blue

Professional company with elegant styling:

```javascript
"corporate": {
  fonts: {
    header: "Georgia, serif",
    body: "Calibri, sans-serif",
    footer: "Arial, sans-serif"
  },

  fontSizes: {
    headerTitle: "32px",
    subheading: "20px",
    body: "14px",
    footer: "11px",
    footerSmall: "10px",
    footerLabel: "11px"
  },

  colors: {
    primary: "#003366",
    secondary: "#004488",
    accent: "#ff6600",

    text: {
      dark: "#333333",
      light: "#666666",
      muted: "#999999",
      light_bg: "#f0f5fa"
    },

    link: "#003366",
    linkHover: "#004488",
    button: "#ff6600",
    buttonHover: "#dd5500",

    friendly: "#003366",
    urgent: "#ff9900",
    critical: "#cc0000"
  },

  spacing: {
    sectionPadding: "24px",
    columnGap: "18px",
    footerRowGap: "10px",
    mailboxWidth: "600px"
  },

  backgrounds: {
    primary: "#f8f9fa",
    white: "#ffffff",
    light: "#f0f5fa",
    accent: "#e6f2ff"
  }
}
```

### Example 2: Tech Startup - Modern & Vibrant

Energetic, modern company:

```javascript
"tech-startup": {
  fonts: {
    header: "Segoe UI, sans-serif",
    body: "Segoe UI, sans-serif",
    footer: "Segoe UI, sans-serif"
  },

  fontSizes: {
    headerTitle: "24px",
    subheading: "16px",
    body: "13px",
    footer: "11px",
    footerSmall: "10px",
    footerLabel: "11px"
  },

  colors: {
    primary: "#00d4ff",
    secondary: "#0099cc",
    accent: "#ff006e",

    text: {
      dark: "#1a1a1a",
      light: "#555555",
      muted: "#999999",
      light_bg: "#f5f7fa"
    },

    link: "#00d4ff",
    linkHover: "#0099cc",
    button: "#ff006e",
    buttonHover: "#e60066",

    friendly: "#00d4ff",
    urgent: "#ffaa00",
    critical: "#ff006e"
  },

  spacing: {
    sectionPadding: "16px",
    columnGap: "12px",
    footerRowGap: "6px",
    mailboxWidth: "600px"
  },

  backgrounds: {
    primary: "#f5f7fa",
    white: "#ffffff",
    light: "#f5f7fa",
    accent: "#e0f7ff"
  }
}
```

### Example 3: Nonprofit - Green & Welcoming

Environmental/social organization:

```javascript
"nonprofit": {
  fonts: {
    header: "Trebuchet MS, sans-serif",
    body: "Trebuchet MS, sans-serif",
    footer: "Arial, sans-serif"
  },

  fontSizes: {
    headerTitle: "26px",
    subheading: "18px",
    body: "14px",
    footer: "12px",
    footerSmall: "11px",
    footerLabel: "12px"
  },

  colors: {
    primary: "#2d8a3e",
    secondary: "#1f5d2e",
    accent: "#f7a600",

    text: {
      dark: "#333333",
      light: "#666666",
      muted: "#999999",
      light_bg: "#f5faf7"
    },

    link: "#2d8a3e",
    linkHover: "#1f5d2e",
    button: "#f7a600",
    buttonHover: "#d68900",

    friendly: "#2d8a3e",
    urgent: "#f7a600",
    critical: "#d9534f"
  },

  spacing: {
    sectionPadding: "20px",
    columnGap: "15px",
    footerRowGap: "8px",
    mailboxWidth: "600px"
  },

  backgrounds: {
    primary: "#f5faf7",
    white: "#ffffff",
    light: "#f5faf7",
    accent: "#e8f5e9"
  }
}
```

### Example 4: Luxury Brand - Minimal & Elegant

High-end/luxury company with minimalist style:

```javascript
"luxury": {
  fonts: {
    header: "Georgia, serif",
    body: "Georgia, serif",
    footer: "Georgia, serif"
  },

  fontSizes: {
    headerTitle: "36px",
    subheading: "22px",
    body: "15px",
    footer: "13px",
    footerSmall: "12px",
    footerLabel: "13px"
  },

  colors: {
    primary: "#1a1a1a",
    secondary: "#333333",
    accent: "#c9a961",

    text: {
      dark: "#1a1a1a",
      light: "#666666",
      muted: "#b0b0b0",
      light_bg: "#fafafa"
    },

    link: "#1a1a1a",
    linkHover: "#333333",
    button: "#c9a961",
    buttonHover: "#b89245",

    friendly: "#1a1a1a",
    urgent: "#d4af37",
    critical: "#b8341a"
  },

  spacing: {
    sectionPadding: "24px",
    columnGap: "20px",
    footerRowGap: "12px",
    mailboxWidth: "600px"
  },

  backgrounds: {
    primary: "#fafafa",
    white: "#ffffff",
    light: "#f5f5f5",
    accent: "#fffef8"
  }
}
```

---

## Font Pairing Recommendations

### Professional Combinations

**Corporate + Traditional:**
```javascript
header: "Georgia, serif",
body: "Calibri, sans-serif",
footer: "Arial, sans-serif"
```

**Modern + Clean:**
```javascript
header: "Segoe UI, sans-serif",
body: "Segoe UI, sans-serif",
footer: "Segoe UI, sans-serif"
```

**Elegant + Sophisticated:**
```javascript
header: "Garamond, serif",
body: "Trebuchet MS, sans-serif",
footer: "Arial, sans-serif"
```

### Web-Safe Font Families
(Always use as fallbacks)

```javascript
// Sans-serif (clean, modern)
"Arial, sans-serif"
"Helvetica, sans-serif"
"Trebuchet MS, sans-serif"
"Segoe UI, sans-serif"
"Calibri, sans-serif"
"Verdana, sans-serif"

// Serif (elegant, traditional)
"Georgia, serif"
"Garamond, serif"
"Times New Roman, serif"

// Monospace (code, technical)
"Courier New, monospace"
"Courier, monospace"
```

---

## Color Psychology Guide

### Primary Color Selection

- **Blue** (#0066cc) - Trust, professionalism, corporate
- **Green** (#2d8a3e) - Growth, health, environmental
- **Purple** (#7733dd) - Creativity, luxury, innovation
- **Red** (#cc0000) - Energy, urgency, passion
- **Orange** (#ff9900) - Enthusiasm, creativity, warmth
- **Black** (#1a1a1a) - Luxury, elegance, sophistication

### Action Button Colors

- **Contrast with Primary** - Use accent color for CTAs
- **Friendly Reminder** - Blue or Green
- **Urgent Reminder** - Orange or Yellow
- **Critical/Final Notice** - Red

---

## Spacing Guide

### Footer Spacing

**Standard (More Spacious):**
```javascript
spacing: {
  sectionPadding: "20px",
  columnGap: "15px",
  footerRowGap: "8px"
}
```

**Compact (Reduced Height):**
```javascript
spacing: {
  sectionPadding: "16px",    // Reduced
  columnGap: "12px",         // Reduced
  footerRowGap: "6px"        // Reduced
}
```

**Minimal (Very Tight):**
```javascript
spacing: {
  sectionPadding: "12px",
  columnGap: "10px",
  footerRowGap: "4px"
}
```

---

## Using Multiple Brands

Create multiple brand configurations in CONFIG:

```javascript
BRAND: {
  "default": { /* ... */ },
  
  "brand-a": {
    fonts: { /* ... */ },
    colors: { /* ... */ },
    // ...
  },
  
  "brand-b": {
    fonts: { /* ... */ },
    colors: { /* ... */ },
    // ...
  }
}
```

Then select which brand when sending emails via the Business dropdown.

---

## Configuration Checklist

Before deploying your brand:

```
FONTS:
□ Header font selected and tested
□ Body font selected and tested
□ Footer font selected and tested

FONT SIZES:
□ Header title size appropriate
□ Subheading size readable
□ Body text size comfortable
□ Footer text small but readable

COLORS:
□ Primary color matches brand
□ Secondary color is darker shade
□ Accent color contrasts well
□ Text colors have sufficient contrast
□ Link colors are distinct

STATUS COLORS:
□ Friendly reminder color (blue/green)
□ Urgent reminder color (orange)
□ Critical color (red)

SPACING:
□ Footer is concise but readable
□ Sections have good separation
□ Column gaps look proportional
□ Overall appearance is professional

TESTING:
□ Sent test email in Gmail
□ Sent test email in Outlook
□ Sent test email on mobile device
□ Payment reminder colors are distinct
□ All links are clickable
```

---

## Testing Your Brand

1. **Desktop Email Client** (Gmail, Outlook)
   - Fonts render correctly
   - Colors appear as expected
   - Layout is properly spaced
   - All links work

2. **Mobile Device** (Gmail app, Mail app)
   - Text is readable
   - Footer doesn't take up too much space
   - Buttons are tappable
   - Colors look good on mobile

3. **Different Recipient Clients**
   - Yahoo Mail
   - Outlook Web
   - Apple Mail
   - Gmail web

4. **Accessibility**
   - Color contrast is sufficient
   - Text size is readable
   - Links are clearly distinguished

---

## Quick Reference

### Common Configuration Changes

**Make Footer More Compact:**
```javascript
spacing: {
  sectionPadding: "16px",    // was 20px
  columnGap: "12px",         // was 15px
  footerRowGap: "6px"        // was 8px
}
```

**Increase Font Sizes for Readability:**
```javascript
fontSizes: {
  body: "15px",              // was 14px
  footer: "13px",            // was 12px
  footerSmall: "12px"        // was 11px
}
```

**Change Brand Colors:**
```javascript
colors: {
  primary: "#your-color",
  secondary: "#darker-shade",
  accent: "#cta-color"
}
```

**Switch to All Serif Fonts:**
```javascript
fonts: {
  header: "Georgia, serif",
  body: "Georgia, serif",
  footer: "Georgia, serif"
}
```

---

## Support

For more information:
- See **CONFIGURATION-GUIDE.md** for business info setup
- See **EMAIL-DESIGN-IMPROVEMENTS.md** for footer content
- See **TESTING-GUIDE.md** for testing procedures
- Check **SYSTEM-STATUS.md** for system overview

---

**You now have complete control over your email brand appearance!** 🎨

