# Security Policy

`@bymax-one/icons` ships icon drawings as React components, raw SVG files, an SVG
sprite and typed metadata. An icon set is markup that consumers render inside their
own pages, so its hard security contract is that nothing it ships can carry
executable content: the components build their elements from data, never from an
HTML string, and the SVG outputs hold only the drawing elements the set allows. We
take vulnerability reports seriously and triage them ahead of feature work.

## Supported versions

The package has not published a release yet; the first published version will be
`1.0.0`. From then on, security patches are issued only for the latest minor
release.

| Version | Status                                      |
| ------- | ------------------------------------------- |
| `1.x`   | Latest minor receives security fixes        |
| `< 1.0` | Never published; development snapshots only |

Earlier minors receive no fixes and no backports. If you are on one, upgrade to the
latest `1.x` release.

## Reporting a vulnerability

**Do not report security issues through public GitHub Issues, Discussions, or
pull requests.** Public reports give attackers a window between disclosure and
patch deployment.

Use GitHub Private Vulnerability Reporting, which is enabled on this repository:

[Open a private security advisory](https://github.com/bymaxone/icons/security/advisories/new)

If you cannot use the GitHub form (for example, you do not have an account),
email **support@bymax.one** with `[security] @bymax-one/icons` in the subject
line.

### What to include

A useful report contains:

- A clear description of the vulnerability and its impact (confidentiality,
  integrity, availability)
- Step-by-step reproduction against the latest release, or against `main` before
  the first release
- The affected output: a subpath (`.` or `./meta`), a raw SVG file, the sprite or
  the merged metadata file
- A suggested fix or mitigation, if you have one
- Whether you would like to be credited in the published advisory, and how
  (name, handle, affiliation)

### Response timeline

| Phase                                  | Target                            |
| -------------------------------------- | --------------------------------- |
| Acknowledgement of receipt             | within 72 hours                   |
| Initial assessment and severity rating | within 7 days                     |
| Coordinated fix for Critical / High    | within 90 days of acknowledgement |
| Coordinated fix for Medium / Low       | best effort, tracked in advisory  |

We follow [coordinated vulnerability disclosure](https://en.wikipedia.org/wiki/Coordinated_vulnerability_disclosure)
and publish the advisory only after a fixed version is on npm, unless active
exploitation forces an earlier publication.

Reporters are credited in the GitHub Security Advisory and CHANGELOG entry
unless they request anonymity.

## In-scope vulnerabilities

The following classes are explicitly in scope:

- **SVG injection** - any shipped output (component, raw SVG file, sprite symbol)
  that carries a `<script>`, a `<foreignObject>`, an event-handler attribute, a
  `javascript:` or external URL reference, or any other element or attribute
  outside the allow-list of the SVG code rules; and any component prop path that
  turns consumer input into markup instead of text or a plain attribute value,
  such as an accessible `title` rendered as HTML
- **Malicious path data** - drawing data crafted to break out of its attribute,
  to reference another document, or to exhaust a renderer (extreme coordinates,
  pathological command counts) in a consumer's page or build
- **Supply chain** - compromised dependency, malicious typosquat, a build or
  generator step that alters the shipped modules, tampered release artifact, or a
  pull-request workflow that runs untrusted code with repository credentials
- **CodeQL `security-extended` alerts** - anything the automated scan surfaces
  in the Security tab

## Out of scope

These are not vulnerabilities in `@bymax-one/icons` itself:

- Issues only reproducible in versions older than the latest `1.x` minor
- Markup a consuming application builds itself around an icon, including SVG it
  inlines from another source
- Issues in the `react` peer dependency when the upstream maintainer has already
  accepted them or when the dependency is not exercised by the library
- Trademark questions about brand marks, which are covered by
  [`TRADEMARKS.md`](./TRADEMARKS.md) rather than by this policy
- Self-XSS, social engineering, denial of service via legitimate load
- Theoretical attacks without a practical demonstration

## Security best practices for consumers

Pin the package to an exact version in production, verify the publish
provenance (`npm audit signatures`), and subscribe to the repository's
security advisories so you receive notifications when a CVE is published.

## Acknowledgements

We are grateful to the security community and to every reporter who takes the
time to investigate and disclose responsibly.
