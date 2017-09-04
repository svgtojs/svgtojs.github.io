# svg2js
A tool that uses canvg and sinonjs to write out the necessary javascript commands to draw an svg with js on a canvas. By creating permanent files, this avoids any problems from canvg spec changes and allows you to avoid the prohibitive size of the library. In this fashion, svg files can be converted to permanent javascript files, which then can be run to produce the same image output.

Note: The resulting javascript is often very easily made smaller. By trimming numbers with floating point errors and removing many redundant ctx.save and ctx.restore function calls yourself, the average javascriptified svg should only be about 2 times larger than its minified original svg counterpart.
