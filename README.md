# Richislac

Independent Richislac brand homepage for 5 Fingers Dairy.

- Website: https://fingers-v3-richislac.pages.dev/
- Repository: https://github.com/HaseebFASTian/fingers-v3-richislac
- Source folder: `richislac` alongside the existing brand projects.

## Run locally

Requires Node.js. The application has no runtime package dependencies.

```sh
npm run dev
```

Open http://127.0.0.1:5178/. Run `npm run check` for syntax, catalogue, asset and anchor checks. Run `npm run build` to create `dist/`.

## Homepage

The reference screenshot and video informed the oversized typography, bottle entrance, separate milk-splash layer, scalloped chapter edges and product-led composition. Richislac's blue, cream, yellow and green palette replaces the reference's red and pink.

Sections: animated hero; circular product previews; full product line-up; everyday uses; annotated milk bottle; sharing banner; everyday moments; Richislac brand story and family links; business enquiries and catalogue; five FAQs; saved products and enquiry form; company locations; footer.

The everyday section pairs a static breakfast photograph with three pack-specific links. It uses three columns on desktop, a two-plus-one layout on tablets and compact stacked cards on phones.

The approved **CATALOGUE 5 FINGERS.pdf**, page 3, and the corporate site's product data agree on three products. All are displayed without pagination:

| Product                     | Pack       |
| --------------------------- | ---------- |
| Full Cream Milk Bottle      | 1 L bottle |
| Full Cream Milk — Gable Top | 1 L carton |
| Whey Protein Drink          | 250 ml can |

`src/products.js` is the single data source for product cards, details and saved selections. The full approved catalogue is available in `public/downloads/`.

## Interaction and motion

- Native Web Animations API handles the bottle entrance, splash and headline reveal.
- CSS handles gentle floating; scroll transforms use a single requestAnimationFrame callback and never intercept scrolling.
- Pause motion is persistent. Reduced-motion preferences disable animation. Background tabs stop decorative animation.
- Mobile includes a drawer, bottom navigation, product bottom sheets, safe-area padding and 44px touch targets.
- Mobile layouts use a compact bottle hero, two-column product cards, readable pack information, a shorter brand/business story and card-based FAQs and locations. Responsive rules live in `src/mobile.css`; desktop styling stays separate. Mobile entrance and reveal effects run in 260–300 ms and honour the existing motion controls.
- Saved product IDs persist locally. Form details are kept in the current page only.
- The enquiry form validates, previews and downloads a text file. **It does not send a message, create an order or take payment.** Connect the approved business contact service in a future integration.

## Files

- `index.html`: semantic content and section structure.
- `src/styles.css`: responsive visual system and interactive components.
- `src/brand-sections.css`: brand story and locations.
- `src/mobile.css`: phone/tablet layouts, app navigation and mobile interaction styling.
- `src/main.js`: product details, saved items, navigation and enquiry preview.
- `src/motion.js`: entrance choreography, scroll motion and accessibility controls.
- `public/assets/`: local brand artwork and optimized WebP images.
- `docs/image-prompts.md`: image specifications and provenance.

Local Outfit and Anton font files include their OFL licences in `public/fonts/`.

## Publish

This is a separate Cloudflare Pages **Direct Upload** project; a Git push by itself does not deploy it.

```sh
npm run check
npx wrangler@4.45.0 whoami
npm run deploy
```

Production project: `fingers-v3-richislac`, branch `main`, output `dist`. Authenticate using the existing Cloudflare account with Pages permissions. Credentials and `.env` files must never be committed. Other websites have independent folders and repositories.

Wrangler is pinned to 4.45.0 to use the Pages deployment commands directly; newer CLI versions may delegate new-project setup to Workers.
