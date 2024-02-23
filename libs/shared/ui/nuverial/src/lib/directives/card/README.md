# Card Directives

The following directives are used by Card components to identify content that maybe displayed within a Card component.

## CardContentDirective

Identifies content elements and content types. Three type are supported

- content
- image
- title

### Usage

```ts
import { NuverialCardContentDirective } from '@dsg/shared/ui/nuverial';
```

```html
<div nuverialCardContentType="content">Content</div>
<img alt="alt text" nuverialCardContentType="image" src="/image.png" />
<div nuverialCardContentType="title">title</div>
```
