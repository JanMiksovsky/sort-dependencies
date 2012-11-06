The sort-dependencies package is a build tool helper that resolves simple
dependencies using a simple file naming convention. This is delivered as a Node
package, and intended for use within a build tool like Grunt
(https://github.com/gruntjs/grunt).

Background
==========

When building web projects, care must often be taken in combining certain files
types, such as JavaScript files and CSS, where the order of declarations is
signficant. A common solution is to define build steps that manually spell out
the order in which processing should occur. This can be tedious, as the build
file must be updated every time a new source file is added. Using wildcards in a
build script will automatically pick up all files of the relevant type, but at
the risk of ordering the files incorrectly.

Suppose you have a JavaScript class Foo and a subclass Bar, where these classes
are defined using any of the common prototype-based solutions for JavaScript.
Following common practice, you might declare these classes in files Foo.js and
Bar.js, respectively. If you are a build tool like Grunt, you might try to
combine these files with a directive like:

```
grunt.initConfig({
    concat: {
        src: "*.js",
        dest: "combined.js"
    }
});
```

the resulting combined.js will fail to load. The problem is that the *.js
wildcard will alphabetically sort Bar.js before Foo.js, and at runtime the
JavaScript engine will complain that Bar depends on Foo, which hasn't been
defined yet. One could try to simple file name sorting tricks, like naming
Foo.js something that like "0Foo.js", but such tricks have clear limits.

As a general solution, the sort-dependencies package relies on a simple source
file naming convention in which the source file name indicates both the class
being defined *and* the name of the base class being subclassed. In this
example, we would create a file Foo.js to hold the base class, and define the
subclass Bar in a file called Bar.Foo.js. This information is sufficient to
let the sort-dependencies package correctly sort Bar after Foo in the combined
file.

How to use
==========

1. Install the sort-dependencies Node package with:

    ```
    npm install sort-dependencies
    ```

2. If any JavaScript (or CSS, etc.) file depends on another, rename that file to
include the name of the dependent file. If Bar.js depends on Foo.js, rename the
first file to Bar.Foo.js. Files with no dependencies can be left as is.

3. Load the sort-dependencies package in your build file (e.g., grunt.js), then
use the sortFiles() function to sort the file names such that no file appears
before a dependent file:

    ```
    var sortDependencies = require( "sort-dependencies" );

    grunt.initConfig({
        concat: {
            src: sortDependencies.sortFiles( "*.js" ),
            dest: "combined.js"
        }
    });
    ```

The sortFiles() function takes an array (and/or a list of parameters) that can
include wildcards, and returns a sorted array with the names of all files in
order such that no subclass appears before its required base class.

Assuming the directory contains Bar.Foo.js and Foo.js, the sortFiles() call
will return the array [ "Foo.js", "Bar.Foo.js" ], because Bar depends on Foo.
This ensures that the combined files defines Foo and Bar in that order,
regardless of the alphabetic sorting relationship of their class names. So
the combined.js output will now look like:

```
/* Contents of Foo.js */
var Foo = ...

/* Contents of Bar.Foo.js */
var Bar = ...
```

This approach can also be applied to any situation where a given file is
dependent upon a specific other file being loaded first. E.g., if the JavaScript
files Bar.Foo.js and Foo.js have corresponding CSS (or LESS, etc.) files, then
those CSS files can be named Bar.Foo.css and Foo.css. This ensures that CSS
rules will be applied in the correct order.