# B8: the 250 country flags

Each flag is a file of `country-flag-icons` 1.6.20 (MIT), formatted without rewriting its path data: its view box, its shapes in paint order and the geometry of each, path data included, equal the source's, which `src/flags/provenance.spec.ts` checks for every flag. The formatter flattens groups onto their children, writes colours as lower-case `#rrggbb` and drops a stray `class` and `clip-rule`. The table compares the source file and the committed file rendered by resvg at 480, 72 and 24 px wide: the largest difference of any channel of any pixel (0 to 255).

Over the 250 flags the largest difference is 0 at every size: the committed flag renders byte for byte as its source. [`page-1.png`](./page-1.png) to [`page-8.png`](./page-8.png) show every flag 48 and 24 px high on the dark and the light page, 32 a page.

| Flag      | Region                                 | View box             | Shapes | At 480 px | At 72 px | At 24 px |
| --------- | -------------------------------------- | -------------------- | ------ | --------- | -------- | -------- |
| `ad-flag` | Andorra                                | 0 0 513 342          | 9      | 0         | 0        | 0        |
| `ae-flag` | United Arab Emirates                   | 0 0 513 342          | 4      | 0         | 0        | 0        |
| `af-flag` | Afghanistan                            | 0 0 513 342          | 5      | 0         | 0        | 0        |
| `ag-flag` | Antigua & Barbuda                      | 0 0 513 342          | 6      | 0         | 0        | 0        |
| `ai-flag` | Anguilla                               | 0 0 513 342          | 11     | 0         | 0        | 0        |
| `al-flag` | Albania                                | 0 0 90 60            | 5      | 0         | 0        | 0        |
| `am-flag` | Armenia                                | 0 0 513 342          | 3      | 0         | 0        | 0        |
| `ao-flag` | Angola                                 | 0 0 513 342          | 6      | 0         | 0        | 0        |
| `aq-flag` | Antarctica                             | 0 0 744 496          | 2      | 0         | 0        | 0        |
| `ar-flag` | Argentina                              | 0 0 513 342          | 3      | 0         | 0        | 0        |
| `as-flag` | American Samoa                         | 0 0 513 342          | 5      | 0         | 0        | 0        |
| `at-flag` | Austria                                | 0 0 513 342          | 2      | 0         | 0        | 0        |
| `au-flag` | Australia                              | 0 0 513 342          | 7      | 0         | 0        | 0        |
| `aw-flag` | Aruba                                  | 0 0 363 242          | 4      | 0         | 0        | 0        |
| `ax-flag` | Åland Islands                          | 0 0 513 342          | 3      | 0         | 0        | 0        |
| `az-flag` | Azerbaijan                             | 0 0 513 342          | 5      | 0         | 0        | 0        |
| `ba-flag` | Bosnia & Herzegovina                   | 0 0 513 342          | 11     | 0         | 0        | 0        |
| `bb-flag` | Barbados                               | 0 0 513 342          | 3      | 0         | 0        | 0        |
| `bd-flag` | Bangladesh                             | 0 85.333 513 342     | 2      | 0         | 0        | 0        |
| `be-flag` | Belgium                                | 0 0 513 342          | 3      | 0         | 0        | 0        |
| `bf-flag` | Burkina Faso                           | 0 0 513 342          | 3      | 0         | 0        | 0        |
| `bg-flag` | Bulgaria                               | 0 0 513 342          | 3      | 0         | 0        | 0        |
| `bh-flag` | Bahrain                                | 0 0 513 342          | 2      | 0         | 0        | 0        |
| `bi-flag` | Burundi                                | 0 0 513 342          | 6      | 0         | 0        | 0        |
| `bj-flag` | Benin                                  | 0 0 513 342          | 3      | 0         | 0        | 0        |
| `bl-flag` | St. Barthélemy                         | 0 0 513 342          | 9      | 0         | 0        | 0        |
| `bm-flag` | Bermuda                                | 0 0 513 342          | 12     | 0         | 0        | 0        |
| `bn-flag` | Brunei                                 | 0 0 513 342          | 5      | 0         | 0        | 0        |
| `bo-flag` | Bolivia                                | 0 0 513 342          | 3      | 0         | 0        | 0        |
| `bq-flag` | Caribbean Netherlands                  | 0 0 513 342          | 5      | 0         | 0        | 0        |
| `br-flag` | Brazil                                 | 0 0 513 342          | 4      | 0         | 0        | 0        |
| `bs-flag` | Bahamas                                | 0 0 513 342          | 3      | 0         | 0        | 0        |
| `bt-flag` | Bhutan                                 | 0 0 513 342          | 3      | 0         | 0        | 0        |
| `bv-flag` | Bouvet Island                          | 0 0 513 342          | 5      | 0         | 0        | 0        |
| `bw-flag` | Botswana                               | 0 0 513 342          | 3      | 0         | 0        | 0        |
| `by-flag` | Belarus                                | 0 0 513 342          | 5      | 0         | 0        | 0        |
| `bz-flag` | Belize                                 | 0 0 513 342          | 6      | 0         | 0        | 0        |
| `ca-flag` | Canada                                 | 0 0 513 342          | 2      | 0         | 0        | 0        |
| `cc-flag` | Cocos (Keeling) Islands                | 0 0 513 342          | 4      | 0         | 0        | 0        |
| `cd-flag` | Congo - Kinshasa                       | 0 0 513 342          | 4      | 0         | 0        | 0        |
| `cf-flag` | Central African Republic               | 0 0 513 342          | 5      | 0         | 0        | 0        |
| `cg-flag` | Congo - Brazzaville                    | 0 0 900 600          | 3      | 0         | 0        | 0        |
| `ch-flag` | Switzerland                            | 0 0 768 512          | 2      | 0         | 0        | 0        |
| `ci-flag` | Côte d’Ivoire                          | 0 0 513 342          | 3      | 0         | 0        | 0        |
| `ck-flag` | Cook Islands                           | 0 0 513 342          | 7      | 0         | 0        | 0        |
| `cl-flag` | Chile                                  | 0 0 513 342          | 4      | 0         | 0        | 0        |
| `cm-flag` | Cameroon                               | 0 0 513 342          | 3      | 0         | 0        | 0        |
| `cn-flag` | China                                  | 0 0 513 342          | 2      | 0         | 0        | 0        |
| `co-flag` | Colombia                               | 0 0 513 342          | 3      | 0         | 0        | 0        |
| `cr-flag` | Costa Rica                             | 0 0 513 342          | 3      | 0         | 0        | 0        |
| `cu-flag` | Cuba                                   | 0 0 513 342          | 5      | 0         | 0        | 0        |
| `cv-flag` | Cape Verde                             | 0 0 513 342          | 4      | 0         | 0        | 0        |
| `cw-flag` | Curaçao                                | 0 0 513 342          | 3      | 0         | 0        | 0        |
| `cx-flag` | Christmas Island                       | 0 0 513 342          | 6      | 0         | 0        | 0        |
| `cy-flag` | Cyprus                                 | 0 0 513 342          | 5      | 0         | 0        | 0        |
| `cz-flag` | Czechia                                | 0 0 513 342          | 3      | 0         | 0        | 0        |
| `de-flag` | Germany                                | 0 0 513 342          | 3      | 0         | 0        | 0        |
| `dj-flag` | Djibouti                               | 0 0 513 342          | 4      | 0         | 0        | 0        |
| `dk-flag` | Denmark                                | 0 0 513 342          | 2      | 0         | 0        | 0        |
| `dm-flag` | Dominica                               | 0 0 513 342          | 10     | 0         | 0        | 0        |
| `do-flag` | Dominican Republic                     | 0 0 513 342          | 9      | 0         | 0        | 0        |
| `dz-flag` | Algeria                                | 0 0 513 342          | 4      | 0         | 0        | 0        |
| `ec-flag` | Ecuador                                | 0 0 513 342          | 7      | 0         | 0        | 0        |
| `ee-flag` | Estonia                                | 0 0 513 342          | 3      | 0         | 0        | 0        |
| `eg-flag` | Egypt                                  | 0 0 513 342          | 4      | 0         | 0        | 0        |
| `eh-flag` | Western Sahara                         | 0 0 513 342          | 5      | 0         | 0        | 0        |
| `er-flag` | Eritrea                                | 0 0 513 342          | 11     | 0         | 0        | 0        |
| `es-flag` | Spain                                  | 0 0 22.5 15          | 6      | 0         | 0        | 0        |
| `et-flag` | Ethiopia                               | 0 0 22.5 15          | 6      | 0         | 0        | 0        |
| `eu-flag` | European Union                         | 0 0 810 540          | 2      | 0         | 0        | 0        |
| `fi-flag` | Finland                                | 0 0 513 342          | 2      | 0         | 0        | 0        |
| `fj-flag` | Fiji                                   | 0 0 513 342          | 8      | 0         | 0        | 0        |
| `fk-flag` | Falkland Islands                       | 0 0 513 342          | 11     | 0         | 0        | 0        |
| `fm-flag` | Micronesia                             | 0 0 513 342          | 2      | 0         | 0        | 0        |
| `fo-flag` | Faroe Islands                          | 0 0 513 342          | 3      | 0         | 0        | 0        |
| `fr-flag` | France                                 | 0 0 513 342          | 3      | 0         | 0        | 0        |
| `ga-flag` | Gabon                                  | 0 0 513 342          | 3      | 0         | 0        | 0        |
| `gb-flag` | United Kingdom                         | 0 0 513 342          | 5      | 0         | 0        | 0        |
| `gd-flag` | Grenada                                | 0 0 513 342          | 8      | 0         | 0        | 0        |
| `ge-flag` | Georgia                                | 0 0 22.5 15          | 3      | 0         | 0        | 0        |
| `gf-flag` | French Guiana                          | 0 0 90 60            | 3      | 0         | 0        | 0        |
| `gg-flag` | Guernsey                               | 0 0 513 342          | 3      | 0         | 0        | 0        |
| `gh-flag` | Ghana                                  | 0 0 513 342          | 4      | 0         | 0        | 0        |
| `gi-flag` | Gibraltar                              | 0 0 513 342          | 6      | 0         | 0        | 0        |
| `gl-flag` | Greenland                              | 0 0 513 342          | 4      | 0         | 0        | 0        |
| `gm-flag` | Gambia                                 | 0 0 513 342          | 4      | 0         | 0        | 0        |
| `gn-flag` | Guinea                                 | 0 0 513 342          | 3      | 0         | 0        | 0        |
| `gp-flag` | Guadeloupe                             | 0 0 513 342          | 3      | 0         | 0        | 0        |
| `gq-flag` | Equatorial Guinea                      | 0 0 513 342          | 8      | 0         | 0        | 0        |
| `gr-flag` | Greece                                 | 0 0 513 342          | 5      | 0         | 0        | 0        |
| `gs-flag` | South Georgia & South Sandwich Islands | 0 0 513 342          | 22     | 0         | 0        | 0        |
| `gt-flag` | Guatemala                              | 0 0 513 342          | 4      | 0         | 0        | 0        |
| `gu-flag` | Guam                                   | 0 0 513 342          | 9      | 0         | 0        | 0        |
| `gw-flag` | Guinea-Bissau                          | 0 0 513 342          | 4      | 0         | 0        | 0        |
| `gy-flag` | Guyana                                 | 0 0 900 600          | 5      | 0         | 0        | 0        |
| `hk-flag` | Hong Kong SAR China                    | 0 0 21 14            | 3      | 0         | 0        | 0        |
| `hm-flag` | Heard & McDonald Islands               | 0 0 513 342          | 7      | 0         | 0        | 0        |
| `hn-flag` | Honduras                               | 0 0 513 342          | 2      | 0         | 0        | 0        |
| `hr-flag` | Croatia                                | 0 0 513 342          | 7      | 0         | 0        | 0        |
| `ht-flag` | Haiti                                  | 0 0 513 342          | 8      | 0         | 0        | 0        |
| `hu-flag` | Hungary                                | 0 0 513 342          | 3      | 0         | 0        | 0        |
| `id-flag` | Indonesia                              | 0 0 513 342          | 2      | 0         | 0        | 0        |
| `ie-flag` | Ireland                                | 0 0 513 342          | 3      | 0         | 0        | 0        |
| `il-flag` | Israel                                 | 0 0 513 342          | 2      | 0         | 0        | 0        |
| `im-flag` | Isle of Man                            | 0 0 513 342          | 3      | 0         | 0        | 0        |
| `in-flag` | India                                  | 0 0 513 342          | 5      | 0         | 0        | 0        |
| `io-flag` | British Indian Ocean Territory         | 0 0 513 342          | 10     | 0         | 0        | 0        |
| `iq-flag` | Iraq                                   | 0 0 513 342          | 4      | 0         | 0        | 0        |
| `ir-flag` | Iran                                   | 0 0 513 342          | 4      | 0         | 0        | 0        |
| `is-flag` | Iceland                                | 0 0 513 342          | 3      | 0         | 0        | 0        |
| `it-flag` | Italy                                  | 0 0 513 342          | 3      | 0         | 0        | 0        |
| `je-flag` | Jersey                                 | 0 0 513 342          | 4      | 0         | 0        | 0        |
| `jm-flag` | Jamaica                                | 0 0 513 342          | 4      | 0         | 0        | 0        |
| `jo-flag` | Jordan                                 | 0 0 513 342          | 5      | 0         | 0        | 0        |
| `jp-flag` | Japan                                  | 0 0 513 342          | 2      | 0         | 0        | 0        |
| `ke-flag` | Kenya                                  | 0 0 513 342          | 8      | 0         | 0        | 0        |
| `kg-flag` | Kyrgyzstan                             | 0 0 513 342          | 5      | 0         | 0        | 0        |
| `kh-flag` | Cambodia                               | 0 0 513 342          | 3      | 0         | 0        | 0        |
| `ki-flag` | Kiribati                               | 0 0 450 300          | 6      | 0         | 0        | 0        |
| `km-flag` | Comoros                                | 0 0 513 342          | 8      | 0         | 0        | 0        |
| `kn-flag` | St. Kitts & Nevis                      | 0 0 513 342          | 5      | 0         | 0        | 0        |
| `kp-flag` | North Korea                            | 0 0 513 342          | 6      | 0         | 0        | 0        |
| `kr-flag` | South Korea                            | 0 0 513 342          | 5      | 0         | 0        | 0        |
| `kw-flag` | Kuwait                                 | 0 0 513 342          | 4      | 0         | 0        | 0        |
| `ky-flag` | Cayman Islands                         | 0 0 513 342          | 11     | 0         | 0        | 0        |
| `kz-flag` | Kazakhstan                             | 0 0 513 342          | 3      | 0         | 0        | 0        |
| `la-flag` | Laos                                   | 0 0 513 342          | 3      | 0         | 0        | 0        |
| `lb-flag` | Lebanon                                | 0 0 513 342          | 4      | 0         | 0        | 0        |
| `lc-flag` | St. Lucia                              | 0 0 513 342          | 4      | 0         | 0        | 0        |
| `li-flag` | Liechtenstein                          | 0 0 513 342          | 3      | 0         | 0        | 0        |
| `lk-flag` | Sri Lanka                              | 0 0 513 342          | 8      | 0         | 0        | 0        |
| `lr-flag` | Liberia                                | 0 0 513 342          | 4      | 0         | 0        | 0        |
| `ls-flag` | Lesotho                                | 0 0 513 342          | 5      | 0         | 0        | 0        |
| `lt-flag` | Lithuania                              | 0 0 513 342          | 3      | 0         | 0        | 0        |
| `lu-flag` | Luxembourg                             | 0 0 513 342          | 3      | 0         | 0        | 0        |
| `lv-flag` | Latvia                                 | 0 0 513 342          | 2      | 0         | 0        | 0        |
| `ly-flag` | Libya                                  | 0 0 513 342          | 5      | 0         | 0        | 0        |
| `ma-flag` | Morocco                                | 0 0 513 342          | 2      | 0         | 0        | 0        |
| `mc-flag` | Monaco                                 | 0 0 513 342          | 2      | 0         | 0        | 0        |
| `md-flag` | Moldova                                | 0 0 513 342          | 4      | 0         | 0        | 0        |
| `me-flag` | Montenegro                             | 0 0 513 342          | 6      | 0         | 0        | 0        |
| `mf-flag` | St. Martin                             | 0 0 108 72           | 5      | 0         | 0        | 0        |
| `mg-flag` | Madagascar                             | 0 0 513 342          | 3      | 0         | 0        | 0        |
| `mh-flag` | Marshall Islands                       | 0 0 513 342          | 4      | 0         | 0        | 0        |
| `mk-flag` | North Macedonia                        | 0 0 513 342          | 5      | 0         | 0        | 0        |
| `ml-flag` | Mali                                   | 0 0 513 342          | 3      | 0         | 0        | 0        |
| `mm-flag` | Myanmar (Burma)                        | 0 0 513 342          | 4      | 0         | 0        | 0        |
| `mn-flag` | Mongolia                               | 0 0 513 342          | 7      | 0         | 0        | 0        |
| `mo-flag` | Macao SAR China                        | 0 0 513 342          | 3      | 0         | 0        | 0        |
| `mp-flag` | Northern Mariana Islands               | 0 0 750 500          | 5      | 0         | 0        | 0        |
| `mq-flag` | Martinique                             | 0 0 900 600          | 3      | 0         | 0        | 0        |
| `mr-flag` | Mauritania                             | 0 0 513 342          | 4      | 0         | 0        | 0        |
| `ms-flag` | Montserrat                             | 0 0 513 342          | 9      | 0         | 0        | 0        |
| `mt-flag` | Malta                                  | 0 0 513 342          | 6      | 0         | 0        | 0        |
| `mu-flag` | Mauritius                              | 0 0 513 342          | 4      | 0         | 0        | 0        |
| `mv-flag` | Maldives                               | 0 0 720 480          | 3      | 0         | 0        | 0        |
| `mw-flag` | Malawi                                 | 0 0 513 342          | 5      | 0         | 0        | 0        |
| `mx-flag` | Mexico                                 | 0 0 513 342          | 5      | 0         | 0        | 0        |
| `my-flag` | Malaysia                               | 0 0 513 342          | 4      | 0         | 0        | 0        |
| `mz-flag` | Mozambique                             | 0 0 513 342          | 6      | 0         | 0        | 0        |
| `na-flag` | Namibia                                | 0 0 513 342          | 5      | 0         | 0        | 0        |
| `nc-flag` | New Caledonia                          | 0 0 513 342          | 12     | 0         | 0        | 0        |
| `ne-flag` | Niger                                  | 0 0 513 342          | 4      | 0         | 0        | 0        |
| `nf-flag` | Norfolk Island                         | 0 0 513 342          | 2      | 0         | 0        | 0        |
| `ng-flag` | Nigeria                                | 0 0 513 342          | 2      | 0         | 0        | 0        |
| `ni-flag` | Nicaragua                              | 0 0 513 342          | 7      | 0         | 0        | 0        |
| `nl-flag` | Netherlands                            | 0 0 513 342          | 3      | 0         | 0        | 0        |
| `no-flag` | Norway                                 | 0 0 513 342          | 3      | 0         | 0        | 0        |
| `np-flag` | Nepal                                  | 0 0 513 342          | 5      | 0         | 0        | 0        |
| `nr-flag` | Nauru                                  | 0 0 513 342          | 3      | 0         | 0        | 0        |
| `nu-flag` | Niue                                   | 0 0 513 342          | 8      | 0         | 0        | 0        |
| `nz-flag` | New Zealand                            | 0 0 513 342          | 7      | 0         | 0        | 0        |
| `om-flag` | Oman                                   | 0 0 513 342          | 5      | 0         | 0        | 0        |
| `pa-flag` | Panama                                 | 0 0 513 342          | 4      | 0         | 0        | 0        |
| `pe-flag` | Peru                                   | 0 0 513 342          | 12     | 0         | 0        | 0        |
| `pf-flag` | French Polynesia                       | 0 0 513 342          | 7      | 0         | 0        | 0        |
| `pg-flag` | Papua New Guinea                       | 0 0 513 342          | 5      | 0         | 0        | 0        |
| `ph-flag` | Philippines                            | 0 0 513 342          | 6      | 0         | 0        | 0        |
| `pk-flag` | Pakistan                               | 0 0 900 600          | 5      | 0         | 0        | 0        |
| `pl-flag` | Poland                                 | 0 0 513 342          | 2      | 0         | 0        | 0        |
| `pm-flag` | St. Pierre & Miquelon                  | 0 0 513 342          | 3      | 0         | 0        | 0        |
| `pn-flag` | Pitcairn Islands                       | 0 0 513 342          | 11     | 0         | 0        | 0        |
| `pr-flag` | Puerto Rico                            | 0 0 513 342          | 4      | 0         | 0        | 0        |
| `ps-flag` | Palestinian Territories                | 0 0 513 342          | 4      | 0         | 0        | 0        |
| `pt-flag` | Portugal                               | 0 0 513 342          | 5      | 0         | 0        | 0        |
| `pw-flag` | Palau                                  | 0 0 513 342          | 2      | 0         | 0        | 0        |
| `py-flag` | Paraguay                               | 0 0 513 342          | 6      | 0         | 0        | 0        |
| `qa-flag` | Qatar                                  | 0 0 513 342          | 2      | 0         | 0        | 0        |
| `re-flag` | Réunion                                | 0 0 513 342          | 3      | 0         | 0        | 0        |
| `ro-flag` | Romania                                | 0 0 513 342          | 3      | 0         | 0        | 0        |
| `rs-flag` | Serbia                                 | 0 0 513 342          | 6      | 0         | 0        | 0        |
| `ru-flag` | Russia                                 | 0 0 513 342          | 3      | 0         | 0        | 0        |
| `rw-flag` | Rwanda                                 | 0 0 513 342          | 5      | 0         | 0        | 0        |
| `sa-flag` | Saudi Arabia                           | 0 0 513 342          | 3      | 0         | 0        | 0        |
| `sb-flag` | Solomon Islands                        | 0 0 513 342          | 4      | 0         | 0        | 0        |
| `sc-flag` | Seychelles                             | 0 0 513 342          | 5      | 0         | 0        | 0        |
| `sd-flag` | Sudan                                  | 0 0 513 342          | 4      | 0         | 0        | 0        |
| `se-flag` | Sweden                                 | 0 0 513 342          | 2      | 0         | 0        | 0        |
| `sg-flag` | Singapore                              | 0 0 900 600          | 4      | 0         | 0        | 0        |
| `sh-flag` | St. Helena                             | 0 0 513 342          | 10     | 0         | 0        | 0        |
| `si-flag` | Slovenia                               | 0 0 240 160          | 9      | 0         | 0        | 0        |
| `sj-flag` | Svalbard & Jan Mayen                   | 0 0 513 342          | 3      | 0         | 0        | 0        |
| `sk-flag` | Slovakia                               | 0 85.333 512 341.333 | 7      | 0         | 0        | 0        |
| `sl-flag` | Sierra Leone                           | 0 85.333 512 341.333 | 3      | 0         | 0        | 0        |
| `sm-flag` | San Marino                             | 0 85.333 512 341.333 | 7      | 0         | 0        | 0        |
| `sn-flag` | Senegal                                | 0 85.333 512 341.333 | 3      | 0         | 0        | 0        |
| `so-flag` | Somalia                                | 0 85.333 512 341.333 | 2      | 0         | 0        | 0        |
| `sr-flag` | Suriname                               | 0 85.333 512 341.333 | 4      | 0         | 0        | 0        |
| `ss-flag` | South Sudan                            | 0 85.333 512 341.333 | 6      | 0         | 0        | 0        |
| `st-flag` | São Tomé & Príncipe                    | 0 85.333 512 341.333 | 4      | 0         | 0        | 0        |
| `sv-flag` | El Salvador                            | 0 85.333 512 341.333 | 5      | 0         | 0        | 0        |
| `sx-flag` | Sint Maarten                           | 0 85.333 512 341.333 | 8      | 0         | 0        | 0        |
| `sy-flag` | Syria                                  | 0 0 900 600          | 4      | 0         | 0        | 0        |
| `sz-flag` | Eswatini                               | 0 0 900 600          | 7      | 0         | 0        | 0        |
| `tc-flag` | Turks & Caicos Islands                 | 0 0 513 342          | 11     | 0         | 0        | 0        |
| `td-flag` | Chad                                   | 0 85.333 512 341.333 | 3      | 0         | 0        | 0        |
| `tf-flag` | French Southern Territories            | 0 0 22.5 15          | 6      | 0         | 0        | 0        |
| `tg-flag` | Togo                                   | 0 85.333 512 341.333 | 4      | 0         | 0        | 0        |
| `th-flag` | Thailand                               | 0 85.333 512 341.333 | 3      | 0         | 0        | 0        |
| `tj-flag` | Tajikistan                             | 0 85.333 512 341.333 | 4      | 0         | 0        | 0        |
| `tk-flag` | Tokelau                                | 0 85.333 512 341.333 | 3      | 0         | 0        | 0        |
| `tl-flag` | Timor-Leste                            | 0 85.333 512 341.333 | 4      | 0         | 0        | 0        |
| `tm-flag` | Turkmenistan                           | 0 85.333 512 341.333 | 12     | 0         | 0        | 0        |
| `tn-flag` | Tunisia                                | 0 85.333 512 341.333 | 4      | 0         | 0        | 0        |
| `to-flag` | Tonga                                  | 0 85.333 512 341.333 | 3      | 0         | 0        | 0        |
| `tr-flag` | Türkiye                                | 0 0 513 342          | 2      | 0         | 0        | 0        |
| `tt-flag` | Trinidad & Tobago                      | 0 85.333 512 341.333 | 3      | 0         | 0        | 0        |
| `tv-flag` | Tuvalu                                 | 0 0 513 342          | 7      | 0         | 0        | 0        |
| `tw-flag` | Taiwan                                 | 0 85.333 512 341.333 | 5      | 0         | 0        | 0        |
| `tz-flag` | Tanzania                               | 0 85.333 512 341.333 | 4      | 0         | 0        | 0        |
| `ua-flag` | Ukraine                                | 0 85.333 512 341.333 | 2      | 0         | 0        | 0        |
| `ug-flag` | Uganda                                 | 0 0 512 341.3        | 7      | 0         | 0        | 0        |
| `um-flag` | U.S. Outlying Islands                  | 0 0 513 342          | 4      | 0         | 0        | 0        |
| `us-flag` | United States                          | 0 0 513 342          | 4      | 0         | 0        | 0        |
| `uy-flag` | Uruguay                                | 0 0 513 342          | 4      | 0         | 0        | 0        |
| `uz-flag` | Uzbekistan                             | 0 0 513 342          | 6      | 0         | 0        | 0        |
| `va-flag` | Vatican City                           | 0 85.333 512 341.333 | 4      | 0         | 0        | 0        |
| `vc-flag` | St. Vincent & Grenadines               | 0 85.333 512 341.333 | 3      | 0         | 0        | 0        |
| `ve-flag` | Venezuela                              | 0 0 22.5 15          | 4      | 0         | 0        | 0        |
| `vg-flag` | British Virgin Islands                 | 0 0 513 342          | 11     | 0         | 0        | 0        |
| `vi-flag` | U.S. Virgin Islands                    | 0 0 512 341.3        | 11     | 0         | 0        | 0        |
| `vn-flag` | Vietnam                                | 0 85.333 512 341.333 | 2      | 0         | 0        | 0        |
| `vu-flag` | Vanuatu                                | 0 85.333 512 341.333 | 6      | 0         | 0        | 0        |
| `wf-flag` | Wallis & Futuna                        | 0 0 150 100          | 5      | 0         | 0        | 0        |
| `ws-flag` | Samoa                                  | 0 85.333 512 341.333 | 3      | 0         | 0        | 0        |
| `ye-flag` | Yemen                                  | 0 85.333 512 341.333 | 3      | 0         | 0        | 0        |
| `yt-flag` | Mayotte                                | 0 0 90 60            | 7      | 0         | 0        | 0        |
| `za-flag` | South Africa                           | 0 85.333 512 341.333 | 6      | 0         | 0        | 0        |
| `zm-flag` | Zambia                                 | 0 85.333 512 341.333 | 5      | 0         | 0        | 0        |
| `zw-flag` | Zimbabwe                               | 0 85.333 512 341.333 | 9      | 0         | 0        | 0        |
