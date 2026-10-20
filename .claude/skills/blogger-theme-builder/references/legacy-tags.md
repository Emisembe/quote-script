# Legacy-engine quick reference

Tags and settings seen in real Blogger-generated legacy themes (`b:version='2'`, version-1 widgets). Always confirm against the project's own `reference/proven.json`; this list is a starting point, not proof.

## Page-level globals (usable anywhere, including inside widgets)
`data:blog.title`, `data:blog.homepageUrl`, `data:blog.url`, `data:blog.canonicalUrl`, `data:blog.pageType` (`index`, `item`, `static_page`, `archive`, `error_page`), `data:blog.pageName` (label name or archive range on list pages; post title on posts), `data:blog.pageTitle`, `data:blog.searchQuery`, `data:blog.languageDirection`, `data:blog.mobileClass`, `data:blog.metaDescription`, `data:blog.postImageUrl`.

Common conditions:
```xml
<b:if cond='data:blog.url == data:blog.homepageUrl'>            homepage
<b:if cond='data:blog.canonicalUrl == data:blog.homepageUrl'>   homepage even with ?fbclid= / ?m=1
<b:if cond='data:blog.pageType == &quot;item&quot;'>           single post
<b:if cond='data:blog.pageType == &quot;error_page&quot;'>     404
```

## Blog widget (`Blog1`, version 1)
- **Loop:** `<b:loop values='data:posts' var='post'>`. Count: `data:numPosts`.
- **Post:** `data:post.url`, `data:post.title`, `data:post.body`, `data:post.id`, `data:post.author`, `data:post.authorProfileUrl`, `data:post.timestamp`, `data:post.timestampISO8601`, `data:post.firstImageUrl` (full size), `data:post.thumbnailUrl` (72px `s72-c`), `data:post.numComments`, `data:post.allowComments`, `data:post.editUrl`, `data:post.labels`.
- **Labels:** `<b:loop index='x' values='data:post.labels' var='label'>` with `data:label.url`, `data:label.name`, `data:label.isLast`. First label only: `<b:if cond='data:x == 0'>`.
- **Pagination:** `data:newerPageUrl`, `data:olderPageUrl`. On posts, also `data:newerPageTitle` / `data:olderPageTitle`.
- **Comments:** `<b:include data='post' name='comment_picker'/>`, plus copy the comment includables from the reference verbatim.
- **Admin edit link:** `<b:include data='post' name='postQuickEdit'/>` (copy the includable).
- **Settings seen:** `showDateHeader`, `showShareButtons`, `authorLabel`, `showCommentLink`, `showAuthor`, `style.unittype`, `reactionsLabel` (blank OK), `showAuthorProfile`, `style.layout`, `showLabels`, `showLocation`, `showTimestamp`, `postsPerAd`, `showBacklinks`, `showInlineAds`, `showReactions`.

## Header (`Header1`, version 1)
`data:title`, `data:description`, `data:useImage`, `data:sourceUrl`, `data:imagePlacement` (`REPLACE`, `BEHIND`, `BEFORE_DESCRIPTION`), `data:width`, `data:height`. Settings: `displayUrl`, `displayHeight`, `displayWidth`, `sectionWidth`, `useImage`, `shrinkToFit`, `imagePlacement`. It's safest to omit Header settings so the blog keeps its own.

## HTML / JavaScript gadget (`HTMLn`, no version)
`data:title`, `data:content`. Setting: `content` (put the HTML in CDATA). The safest gadget for editable links, buttons and text.

## Label (`Labeln`, version 1)
`data:labels` loop with `data:label.url`, `data:label.name`, `data:label.count`, `data:label.cssSize`; `data:display`, `data:showFreqNumbers`. Settings: `sorting` (`ALPHA`), `display` (`LIST` proven; check `CLOUD` against the reference), `selectedLabelsList` (blank OK), `showType` (`ALL`), `showFreqNumbers`.

## PopularPosts (`PopularPostsn`, version 1)
`data:posts` with `data:post.href`, `data:post.title`, `data:post.thumbnail`, `data:post.snippet`; `data:showThumbnails`, `data:showSnippets`, `data:thumbnailSize`. Settings: `numItemsToShow`, `showThumbnails`, `showSnippets`, `timeRange` (`LAST_YEAR` proven).

## Attribution (`Attribution1`, no version)
`data:attribution`. Setting: `copyright` (blank OK).

## Built-in includes
`<b:include name='quickedit'/>` (admin wrench). `<b:include data='blog' name='all-head-content'/>` in `<head>`.

## Skin variables (legacy format, inside the skin's opening comment)
```
<Variable name="accent.color" description="Accent" type="color" default="#00C0A8" value="#00C0A8"/>
```
Use them as `$(accent.color)`, inside `<b:skin>` only.
