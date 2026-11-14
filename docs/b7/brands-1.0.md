# The brand marks of 1.0

The package holds 110 brand marks, in the owners' geometry from Simple Icons 16.37.0. A brand is in only if Simple Icons has its path, the owner's own guidelines page was opened and is about the use of the logo or brand (the page, its owner and the day are in [`../brands/guidelines-evidence.md`](../brands/guidelines-evidence.md)), and the licence of the mark can be shipped. The decision to take this selection over a larger list is the founder's, 2026-11-14, and a brand that fails any of the three is left out with the reason rather than with a guessed address.

## Counts

Measured on the files of `icons/brands` when the batches closed:

| Folder         | Files |
| -------------- | ----- |
| `icons/brands` | 110   |

The first 14 came with B4a. B7 added 96 in three batches: developer and cloud tools, AI providers and design tools (53); social networks, messaging and streaming (22); and payments, operating systems, browsers and stores (21). `mysql`, `go`, `nextdoor`, `zoom`, `hbo`, `kakaotalk`, `line-messenger`, `ios`, `macos`, `visa`, `ebay`, `samsungpay`, `apple-pay` and `google-pay` are wordmarks, tagged so, meant for sizes larger than 24 px.

## What was left out, and why

The 89 names below were considered and are not in the package, grouped by the reason. None is a promise, and none is a judgement of the brand.

### Not in Simple Icons 16.37.0

The pinned package has no mark for them, by slug or by title. The reason is proven only for `microsoft` and `linkedin`, which Simple Icons removed at their owners' request.

`microsoft`, `slack`, `bumble`, `linkedin`, `skype`, `microsoftteams`, `heroku`, `wechatpay`, `openai`, `adobe`, `canva`, `invision`, `zeplin`, `affinity`, `microsoftedge`, `tor`, `windows`, `amazon`, `walmart`, `mercadolibre`, `xbox`, `nintendo`, `disneyplus`, `primevideo`, `hulu`.

### The licence is not one the package can ship

`vuedotjs` and `sass` are CC BY-NC-SA, whose non-commercial term does not fit a package under MIT; `webpack` and `fedora` are under a custom licence with a trademark policy of its own; `rust`, `php`, `ruby`, `jenkins` and `debian` are CC BY-SA, whose share-alike term may reach the file and is a question for the founder, deferred; `deno` and `bootstrap` carry an MIT licence in Simple Icons that the owner's own page does not state for the logo, and Bootstrap's page says "Do not modify our logos in any way".

`vuedotjs`, `sass`, `webpack`, `fedora`, `rust`, `php`, `ruby`, `jenkins`, `debian`, `deno`, `bootstrap`.

### The owner could not be confirmed, or the page is not on the owner's domain

`react` moved to the React Foundation, hosted by the Linux Foundation, and no page states who holds the trademark today; `svelte` keeps its guidelines in a repository on `github.com`.

`react`, `svelte`.

### The owner's page states no rules for the logo

The page exists and offers the files, or a press kit, but says nothing about how to use them.

`huggingface`, `sketch`, `twitch`, `cashapp`, `tinder`, `render`, `rumble`, `paypal`.

### The page is about another subject

`googlechrome` has only the page on Google trademarks for Chrome Web Store extensions, and `alipay` only a page marked deprecated.

`googlechrome`, `alipay`.

### The page could not be opened

The address exists by a search result, but a bot check, a login or a script-only page kept it from being read, so nothing from it is recorded.

`blender`, `crunchyroll`, `etsy`, `flickr`, `imgur`, `mastercard`, `medium`, `notion`, `quora`, `revolut`, `tidal`, `venmo`, `unrealengine`, `youtubemusic`, `express`, `vk`, `deezer`, `wise`, `epicgames`.

### No page found

Searches on the owner's own site and the web found no page about the use of the logo.

`aliexpress`, `americanexpress`, `behance`, `deviantart`, `fastapi`, `flask`, `googlecloud`, `googlemeet`, `javascript`, `jest`, `kick`, `miro`, `nestjs`, `ollama`, `playstation`, `prettier`, `railway`, `sinaweibo`, `sqlite`, `vite`, `vitest`, `yarn`.

## After 1.0

A brand returns when its blocker lifts: the owner publishes a guidelines page, a page that could not be read is read, a licence is settled or the owner of a mark is confirmed. Each return carries its own evidence row.

Known item: the formatter of the sources (`pnpm generate`) is not idempotent on a raw file, which takes up to three passes to reach the form `pnpm check:generated` accepts. A committed tree is at that fixed point, so no gate fails; the import of the marks runs `pnpm generate` until it prints nothing. Making the formatter idempotent is a change for after 1.0. `google-color` waits for an official solid-colour asset, as spec section 5 records.
