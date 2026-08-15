# Third-party assets

## react-body-highlighter

`src/lib/bodySvg.js` contains the anatomical polygon coordinates for the front
and back body views. They are derived from the `anteriorData` / `posteriorData`
assets in [react-body-highlighter](https://github.com/giavinh79/react-body-highlighter).

Only the geometry was taken. The library itself is not a dependency: it paints
discrete colour steps chosen from a `highlightedColors` array, whereas this app
animates a continuous `fillOpacity` ramp per muscle group and takes its fills
from CSS custom properties so both themes work. Vendoring the coordinates keeps
that rendering model intact.

The muscle-to-group mapping in `bodySvg.js` (23 anatomical regions collapsed
onto the 7 groups in `bodyGroups.js`) is this project's own.

```
MIT License

Copyright (c) 2020 GV79

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
