/*
 * Build task helper which sorts a list of class file names so that they can
 * be combined or processed in order of least dependencies.
 *
 * In many situations, it's desirable to sort a list of files by their
 * dependencies so that no file comes before another file it's dependent on.
 * E.g., suppose a JavaScript project has two prototypal classes Foo and Bar,
 * where Bar drives from (i.e., is dependent on) Foo. If these files are
 * defined in separate files Foo.js and Bar.js, and are combined using a
 * process that relies on a simple alphabetic sort, Bar.js will end up before
 * Foo.js. The attempt to define class Bar (based on Foo) will fail, because
 * Foo hasn't been defined before Bar.
 *
 * The solution here relies on a naming convention: a file named Bar.Foo.js
 * indicates a class (or other collection of code) Bar which is dependent on
 * a class (or other collection of code) Foo.
 * 
 * Examples:
 * sortFiles([ "Bar.Foo.js", "Foo.js" ]) returns [ "Foo.js", "Bar.Foo.js" ]
 * sortFiles([ "Bar.js", "Foo.js" ]) returns [ "Bar.js", "Foo.js" ]
 *
 * This can also be used in other situations (e.g., CSS files) where multiple
 * files are combined, and the order in which they're combined matters.
 */

var glob = require( "glob-whatev" );
var path = require( "path" );

/*
 * Sort an array of file names (or paths).
 *
 * The names/paths can include wildcards: e.g., "src/*.js" will sort the
 * names of the JavaScript files in the "src" directory.
 */
exports.sortFiles = function() {

    var patterns = flatten( arguments );

    var classFileNames = [];
    for ( var i in patterns ) {
        var fileNames = glob.glob( patterns[i] );
        var sortedFileNames = fileNames.sort();
        classFileNames = classFileNames.concat( sortedFileNames );
    }

    var dependencies = [];
    for ( var i = 0; i < classFileNames.length; i++ ) {
        var classFileName = classFileNames[i];
        var basename = path.basename( classFileName );
        var parts = basename.split( "." );
        var className = parts[0];
        var baseClassName = ( parts.length === 2 )
            ? baseClassName = null
            : parts[1];
        var dependency = [ className, baseClassName, classFileName ];
        dependencies.push( dependency );
    }

    var map = sortDependencies( dependencies );

    var sortedFileNames = [];
    for ( var i = 0; i < map.length; i++ ) {
        sortedFileNames.push( map[i][2] );
    }

    return sortedFileNames;
};

/*
 * Sort an array representing a set of dependencies, such that each item
 * in the result comes after any items its dependent upon.
 * 
 * The dependency map is represented as an array with tuple values.
 * Each tuple takes the form (key, dependsOn, [data...]), where dependsOn can
 * refer to the key of an item that entry depends on. E.g., if the
 * map looks like:
 * 
 * [
 *     ("Bar", "Foo", "Goodbye"),  # Bar depends on Foo
 *     ("Foo", None, "Hello")      # Foo has no dependencies
 * ]
 * 
 * Sorting these dependencies will return the array with the "Foo"
 * tuple first, followed by the "Bar" tuple, because Bar depends on Foo.
 */
function sortDependencies( dependencies ) {

    // Build the list of keys.
    var keys = [];
    for ( var i = 0; i < dependencies.length; i++ ) {
        keys.push( dependencies[i][0] );
    }

    var unsorted = dependencies.slice();    // Entries not yet sorted.
    var sorted_keys = [];                   // Keys already sorted.
    var sorted = [];                        // Entries already sorted.

    // Each pass through the map should sort at least one item.
    // This gives us a maximum number of passes as n*(n+1) / 2.
    var max_pass = ( dependencies.length * ( dependencies.length + 1 ) ) / 2;
    for ( var i = 0; i < max_pass; i++ ) {
        // On each pass, we pull out anything that has no dependencies,
        // is depend on an item which has already been sorted, or is
        // dependent on something not in this map.
        var dependency = unsorted.shift();
        var key = dependency[0];
        var dependsOn = dependency[1];
        if ( dependsOn === null
            || sorted_keys.indexOf( dependsOn ) >= 0
            || keys.indexOf( dependsOn ) < 0 ) {
            
            sorted_keys.push( key );
            sorted.push( dependency );
            if ( unsorted.length === 0 ) {
                // Done
                break;
            }
        } else {
            unsorted.push( dependency ); // Defer sorting for a later pass.
        }
    }

    if ( unsorted.length > 0 ) {
        throw "Dependency map contains a circular reference.";
    }

    return sorted;
}

/* Flatten the given array. */
function flatten( a ) {
    var results;
    var isArray = ( a.length !== undefined && typeof a !== "string" );
    if ( isArray ) {
        results = []
        for ( var i = 0; i < a.length; i++ ) {
            var result = flatten( a[i] );
            results = results.concat( result );
        }
    } else {
        results = [ a ];
    }
    return results;
}
