        function saveSheet(viewName) {
            var file = {
                worksheets: [{}], // worksheets has one empty worksheet.
                creator: 'GAUPROC',
                created: new Date(),
                lastModifiedBy: 'GAUPROC',
                modified: new Date(),
                activeWorksheet: 0
            },
                w = file.worksheets[0],
                startTime;

            w.name = viewName;
            w.data = [];

            startTime = Date.now();
            initColumnNames(viewName);
            console.log('Fetched column names in ' + (Date.now() - startTime));

            startTime = Date.now();
            initData(viewName);
            console.log('Fetched records in ' + (Date.now() - startTime));

            // load the column Names
            var d = w.data;
            var r = d.push([]) - 1;
            d[r] = columnNames.map(function(c) { return { value: c } });

            // load the records
            startTime = Date.now();
            records.forEach(function(record) {
                r = d.push([]) - 1;
                d[r] = record.map(function(c, i) {
                           if (c === null) {
                               c = '';
                           }
                           if (typeof c === 'string') {
                               c = c.replace(/[^A-Za-z0-9 !@#$%^&*();:'"{}\\[\\]]/g,'');
                           }
                           if (r < 30) {
                               console.log(columnNames[i] + ' record ' + r + ' is a ' + (typeof c) + ': ' + c);
                           }
                           // if (typeof c === 'string' &&
                           //     c.search('\n') > -1) {
                           //     console.log('Found a newline in row ' + r + ' of ' +
                           //                 columnNames[i] + ' column: ' + c);
                           // }
                           return { value: c }
                       });
            });
            console.log('Initialized file object in ' + (Date.now() - startTime));

            window.location = xlsx(file).href();
        };


        function saveTabularFile(viewName) {
            var lines = '';
            $.ajax(
                {
                    async: false,
                    dataType: 'json',
                    url: serviceURI + 'meta/' + schema + '.' + viewName,
                    success: function (cols) { lines += cols.join('\t') + '\n'; }
                }
            );
            $.ajax(
                {
                    async: false,
                    dataType: 'json',
                    url: serviceURI + 'view/' + schema + '.' + viewName,
                    success: function (records) {
                        records.forEach(function (record) {
                            lines += record.join('\t') + '\n';
                        });
                    }
                }
            );

        };




// build an N-deep prefix-based index, with the structure
// this isn't really necessary.  just use equal_range, lower_bound, upper_bound
function buildIndex(words, maxLeaves) {

    var pIndex = {};
    var len = words.length;

    var growAux = function (lbound, ubound, depth) {
        var lb = lbound, ub = lbound, curPrefix;

        while (lb !== ubound) {
            curPrefix = words[lb].slice(0, depth).toLowerCase();
            // find the upper bound in the array -- the lowest index that has a different prefix
            for (ub = lb + 1; ub !== ubound &&
                 words[ub].slice(0, depth).toLowerCase() === curPrefix; ub += 1) { }

            if (ub > lb) {
                pIndex[curPrefix] = [lb, ub];
            }
            if (ub - lb > maxLeaves) {
                // recurse to longer prefix.
                // by the ordering definition, all words that are of equal length to the prefix
                // should be excluded from the recursive search.  These words, if they exist,
                // are guaranteed to reside at the beginning of the [lb, ub) interval
                while (lb !== ub && words[lb].length === depth) { lb += 1 }
                growAux(lb, ub, depth + 1);
            }
            lb = ub;
        }
    }
    growAux(0, len, 1);
    return pIndex;
}
