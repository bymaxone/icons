# R1, group 1: octopus, gift, globe, brush, crop, lock

The drawings of this group were not understood at a glance at 24 px on the dark page. Each item was drawn again in two or three variants, shown beside the drawing it replaces in [`group-1-variants-a.png`](./group-1-variants-a.png) and [`group-1-variants-b.png`](./group-1-variants-b.png), and the delegated auditor chose one. [`group-1.png`](./group-1.png) shows the chosen drawings: the line drawing at 48, at 24 and 16 px 1x, the 16 px master, the filled drawing, the light page and the blur.

## What each drawing fixes

| Icon      | Was read as           | Now                                                                                                                           |
| --------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `octopus` | a skull with roots    | a bulb-shaped mantle with small, low eyes, and four arms in S-curves that open like a skirt, the outer two curling at the tip |
| `gift`    | a stack, a burger     | a box with its lid lifted by the cut, a ribbon down the box and a bow                                                         |
| `globe`   | the letter θ          | two curved meridians and a tilted equator, which form no letter                                                               |
| `brush`   | a capsule and a stick | one outline: a pointed tuft of bristles, the ferrule band and a tapering handle                                               |
| `crop`    | a "4", a flag         | the two crop corners, one passing under the other through the cut                                                             |
| `lock`    | an open padlock       | the shackle seated in the body, a keyhole                                                                                     |

## Construction

- **`crop`.** The usual two crossing corners measure d = 0.02 against Tabler's `crop`: drawn plainly, they are the same drawing. One corner here runs whole and the other passes under it, interrupted by the cut on both sides of each crossing, its ends still reaching past the frame.
- **`octopus` at 16 px.** Two eyes need about 13.5 units of mantle at their height to keep a clear pixel between each other and the walls, against about 10 in the line drawing, so the master widens the mantle into a dome. What makes it read as an octopus at 16 px is the arms: the outer two splay outward and the inner two are short, kicking outward, as the skirt of the line drawing opens. Straight arms under the same dome read as a jellyfish, and the outer arms' curl fuses with the inner arms at 16 px. Its strokes sit on odd multiples of 0.75, symmetric about 12.
- **`octopus` filled** is drawn from its geometry: the mantle's outline offset by 0.75, each arm a band 1.5 wide with a round end (the outer arms subdivided once), and the eyes knocked out as discs of r 1.25, wider than the stroke so that they read at 24 px. Against resvg's own stroker it differs by at most 23 of 255 at 24 px and 14 at 16 px, 16x supersampled. Skia's outline, unioned and written at two decimals, measured 1111 bytes brotli, over the component budget, and is itself 0.19 units off on the curve under the mantle.
- **`lock`.** The filled drawing keeps the body solid, the keyhole knocked out and the shackle as a stroke. At 16 px the keyhole becomes a slot, and the master keeps the tall proportion of the line drawing.

## Measures

The cut is the smallest distance between two parts that do not touch, measured on the line drawing at 240 px. G and the ink are those of the 16 px masters ([`../b4c/masters.md`](../b4c/masters.md)); d is the nearest drawing of Lucide, Tabler, Phosphor and Heroicons.

| Icon      | Cut  | Ink at 24 | 16 px master: ink, ratio, G | Nearest (d)                         |
| --------- | ---- | --------- | --------------------------- | ----------------------------------- |
| `octopus` | 1.6  | 16.9%     | 23.0%, 1.36, 0.25           | line 1.02, filled 0.73, master 1.15 |
| `gift`    | 1.6  | 23.0%     | none                        | 0.57                                |
| `globe`   | none | 23.2%     | none                        | 0.68                                |
| `brush`   | none | 13.0%     | none                        | 0.39                                |
| `crop`    | 1.6  | 12.0%     | none                        | 1.13                                |
| `lock`    | 2.1  | 17.0%     | 23.7%, 1.39, 0.13           | line 0.48, filled 0.44, master 0.52 |
