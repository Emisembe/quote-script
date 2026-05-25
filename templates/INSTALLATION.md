# Installation Guide - Efic Consultancy Blogger Template

Follow these steps to install the template on your Blogger blog.

## Prerequisites

- Active Blogger blog
- Administrator access to your blog
- Basic understanding of Blogger dashboard

## Installation Steps

### Step 1: Access Your Blogger Dashboard

1. Go to [blogger.com](https://www.blogger.com)
2. Sign in with your Google account
3. Select your blog from the list

### Step 2: Access Theme Settings

1. In the left sidebar, click **Theme**
2. Click the **⋮ (three dots)** icon in the top right
3. Select **Edit HTML**

⚠️ **IMPORTANT:** Before proceeding, click **Download theme** to backup your current template.

### Step 3: Replace the Template

1. Select ALL the HTML code in the editor (Ctrl+A or Cmd+A)
2. Delete the selected code
3. Copy the entire contents of `efic-consultancy-blogger-template.xml`
4. Paste it into the editor
5. Click **Save theme**

### Step 4: Configure Your Blog

After saving, you need to configure the template:

#### Logo & Title
1. Go to **Layout** in the left sidebar
2. Find the **Nav Logo** widget
3. Edit it to add your logo image URL
4. Find the **Logo Description** widget
5. Add your tagline/description

#### Main Menu
1. In **Layout**, find the **Main Menu** widget
2. Click **Edit** on the LinkList widget
3. Add your menu items:
   - Regular items appear at the top level
   - Items starting with `_` (underscore) become dropdown sub-items
4. Example structure:
   ```
   Home (no underscore)
   _Sub Item 1 (starts with underscore)
   _Sub Item 2 (starts with underscore)
   Services (no underscore)
   _Service A (starts with underscore)
   _Service B (starts with underscore)
   ```

#### Footer Logo
1. In **Layout**, find the **Footer Logo** widget
2. Edit it to add your logo for the footer

#### Contact Information
1. Find the **Get in Touch** section in Layout
2. Update the contact details:
   - Email address
   - Phone number
   - Address

#### Social Media Icons
1. Find **Header Social Widget** and **Footer Social Widget**
2. Edit the LinkList widgets
3. Add your social media profile URLs:
   - Facebook
   - Twitter
   - LinkedIn
   - Instagram
   - YouTube
   - Pinterest
   - WhatsApp

### Step 5: Customize SEO Metadata

Edit the SEO tags in the template:

1. Go back to **Theme > Edit HTML**
2. Find the `<head>` section (near the top)
3. Look for the SEO metadata section
4. Update:
   - Blog description
   - Keywords
   - Social media handles
   - Logo image URL (appears multiple times)

## Common Customizations

### Change Brand Color
1. Theme > Edit HTML
2. Find `:root` CSS section (starts around line 200)
3. Change `--brand: #5DADE2;` to your color
4. Change `--brand-dark` to a darker shade
5. Save

### Change Fonts
1. Look for Google Fonts import line
2. Modify the font families
3. Update CSS variable `--font-heading` and `--font-body`

### Hero Image
1. Find `#header-wrapper` in CSS
2. Update the `background` URL
3. Replace with your hero image URL

## Testing Your Template

After installation:

1. **View Your Blog** - Click the blog title to see the live site
2. **Test Navigation** - Check desktop and mobile menu
3. **Test Responsive Design** - Resize your browser window
4. **Check Contact Form** - Ensure it's functional
5. **Test Links** - Verify all navigation links work

## Mobile Preview

To see how your blog looks on mobile:

1. Visit your blog in a browser
2. Press F12 to open Developer Tools
3. Click the mobile device icon (top left of DevTools)
4. Select different device types to preview

## Troubleshooting

### Template Won't Save
- Check for unclosed HTML tags
- Ensure all quotes are properly closed
- Try in a different browser
- Clear browser cache

### Navigation Not Showing
- Ensure you've added menu items in the Main Menu widget
- Check that items are properly configured
- Refresh the page (Ctrl+Shift+R)

### Logo Not Appearing
- Check the image URL is correct
- Ensure the image is publicly accessible
- Try a different image format (PNG or JPG)

### Contact Form Not Working
- Verify you have email notifications enabled
- Check your Blogger settings for form handling
- Ensure form fields have unique names

### Mobile Menu Not Working
- Clear browser cache
- Try in Incognito/Private mode
- Check if JavaScript is enabled

## Support & Next Steps

For more customization options, see [CUSTOMIZATION.md](./CUSTOMIZATION.md)

If you encounter issues:
1. Check the troubleshooting section above
2. Refer to [CUSTOMIZATION.md](./CUSTOMIZATION.md)
3. Ensure you're using the latest version of the template
