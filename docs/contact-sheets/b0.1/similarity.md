# Similarity report

A drawing is flagged when a third-party icon lies within a chamfer distance of 0.25 px of it on the normalised canvas (d). The overlap of the dilated ink masks (iou) and the cosine of the blurred coverage (cos) are reported beside it. A flag asks for a human review; it is not a verdict of copying.

| Drawing          | Verdict                       | Nearest                                                                                                                                      |
| ---------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| check (line)     | flagged, primitive (expected) | lucide/check d=0.14 iou=0.85 cos=0.97<br>phosphor/check d=0.23 iou=0.82 cos=0.97<br>tabler/check d=0.32 iou=0.69 cos=0.90                    |
| close (line)     | flagged, primitive (expected) | lucide/x d=0.00 iou=1.00 cos=1.00<br>tabler/x d=0.00 iou=1.00 cos=1.00<br>heroicons/x-mark d=0.00 iou=1.00 cos=1.00                          |
| file (line)      | clear                         | tabler/file d=0.31 iou=0.73 cos=0.88<br>heroicons/document d=0.36 iou=0.72 cos=0.89<br>tabler/invoice d=0.49 iou=0.65 cos=0.84               |
| folder (line)    | clear                         | heroicons/folder d=0.68 iou=0.71 cos=0.85<br>heroicons/folder-open d=0.68 iou=0.58 cos=0.73<br>lucide/folder-closed d=0.70 iou=0.68 cos=0.82 |
| home (line)      | clear                         | phosphor/house d=0.44 iou=0.71 cos=0.85<br>lucide/home d=0.51 iou=0.68 cos=0.87<br>lucide/house d=0.51 iou=0.68 cos=0.87                     |
| lightning (line) | clear                         | tabler/clef d=0.94 iou=0.55 cos=0.68<br>phosphor/lightning d=0.99 iou=0.48 cos=0.63<br>lucide/git-commit-vertical d=1.08 iou=0.51 cos=0.67   |
| play (line)      | clear                         | phosphor/play d=0.51 iou=0.66 cos=0.85<br>tabler/player-play d=0.62 iou=0.55 cos=0.73<br>lucide/play d=0.83 iou=0.55 cos=0.67                |
| plus (line)      | flagged, primitive (expected) | lucide/plus d=0.00 iou=1.00 cos=1.00<br>tabler/plus d=0.00 iou=1.00 cos=1.00<br>heroicons/plus-small d=0.00 iou=1.00 cos=1.00                |
| scene (line)     | clear                         | phosphor/film-slate d=0.54 iou=0.70 cos=0.84<br>lucide/clapperboard d=0.60 iou=0.61 cos=0.78<br>lucide/salad d=0.87 iou=0.53 cos=0.66        |
| search (line)    | clear                         | tabler/search d=0.85 iou=0.52 cos=0.66<br>tabler/zoom d=0.85 iou=0.52 cos=0.66<br>tabler/zoom-reset d=1.07 iou=0.45 cos=0.61                 |
| settings (line)  | clear                         | tabler/nut d=0.52 iou=0.65 cos=0.80<br>phosphor/crosshair d=0.55 iou=0.64 cos=0.80<br>lucide/shield-cog d=0.55 iou=0.63 cos=0.82             |
| user (line)      | clear                         | heroicons/user d=0.64 iou=0.61 cos=0.75<br>lucide/flask-conical d=0.83 iou=0.54 cos=0.71<br>lucide/joystick d=0.91 iou=0.52 cos=0.66         |
