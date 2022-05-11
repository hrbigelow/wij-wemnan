/*
 *
 * Data structures
 *
 * ri : record index
 * fi : field index
 * vi : value index
 * fv : field value
 * lv : filter value
 * fn : field name
 *
 * field[ri][fi] = fv
 *
 * -- the main table of field values.  this is the largest structure
 *
 * fieldIndex[ri][fi] = vi
 *
 * -- the compacted table of field values, carrying the value index of
 *    that field rather than the value itself
 *
 * fieldName[fi] = fn
 *
 * -- the name for this field.  This will be presented in the
 *    collection of filters for that field
 *
 * fieldToIndex[fi][fv] = vi
 *
 * -- defines the mapping of field values to their value indexes.
 *    used to initialize 'fieldIndex' from 'field'
 *
 * indexToField[fi][vi] = fv
 *
 * -- defines the mapping of field indices to their values.  used
 *    together with fieldIndex to graph the data.
 *
 *
 * filterValue[ri][fi] = lv
 *
 *-- keeps track of the filter state of the records in each of their
 *   fields. The any_true() method will determine the record's overall
 *   filter state.
 *
 * filterToRecord[fi][vi][i] = ri
 *
 * -- allows quickly manipulating the affected records' filter state,
 *    based on a particular field and field value.
 *
 */


/*
 * Workflow:
 *
 * 1. populate 'field'
 * 2. from 'field', populate fieldToIndex
 * 3. using 'fieldToIndex' and 'field', populate fieldIndex
 * 4. construct initial state of 'filterValue' (all false)
 * 5. traversing fieldIndex, construct filterToRecord
 */


// instantiate a global object called 'sombrero', to contain all objects
var sombrero = {
    tables: [],
    table_names: []
};



// 0. initialize
function init(tableName) {
    sombrero.table_names.push(tableName);
    var table = {
        field : [],
        fieldIndex : [],
        fieldName : [],
        fieldToIndex : [],
        filterValue : [],
        filterToRecord : []
    };
    sombrero.tables.push(table);
}


// 1. load table data
function loadTableData(table, contentURL) {
    $.ajax({ url: contentURL,
             cache: false,
             dataType: 'json',
             async: false,
             success: function(table_data, status, jqXHR) {
                 table.field = table_data;
             }
           });
}


// 2. load field names
function loadFieldNames(table, metaURL) {
    $.ajax({ url: metaURL,
             cache: false,
             dataType: 'json',
             async: false,
             success: function(record, status, jqXHR) {
                 table.fieldName = record;
             }
           });
}

// 3. initialize fieldToIndex
function initFieldToIndex(table) {

    // allocate the proper number of fields
    var nFields = table.field[0].length;
    table.fieldToIndex = new Array(nFields);
    for (var fi = 0; fi < nFields; fi++) {
        table.fieldToIndex[fi] = {};
    }

    // load all unique field values
    table.field.forEach(function (rec, ri) {
        rec.forEach(function (fv, fi) {
            table.fieldToIndex[fi][fv] = undefined; // dummy value for now
        });
    });

    // order them and assign final value indexes
    table.fieldToIndex.forEach(function (vals, fi) {
        // need a way to sort semantically
        Object.keys(table.fieldToIndex[fi]).sort().forEach(function (fv, i) {
            vals[fv] = i;
        });
    });
}


// 4. initialize indexToField
function initIndexToField(table) {
    var nFields = table.field[0].length;
    table.indexToField = new Array(nFields);
    for (var fi = 0; fi < nFields; fi++) {
        var fti = table.fieldToIndex[fi];
        table.indexToField[fi] = new Array(Object.keys(fti).length);
        var itf = table.indexToField[fi];
        for (var fv in fti) {
            itf[fti[fv]] = fv;
        }
    }
}

// 4. initialize fieldIndex
function initFieldIndex(table) {

    // allocate the proper number of records
    var nRecords = table.field.length;
    var nFields = table.field[0].length;

    for (var i = 0; i < nRecords; i++) {
        table.fieldIndex[i] = new Array(nFields);
    }

    // populate
    table.field.forEach(function(rec, ri) {
        rec.forEach(function(fv, fi) {
            table.fieldIndex[ri][fi] = table.fieldToIndex[fi][fv];
        });
    });
}

// 5. initialize filterValue
function initFilterValue(table) {
    // allocate
    var nRecords = table.field.length;
    var nFields = table.field[0].length;
    table.filterValue = new Array(nRecords);
    for (var ri = 0; ri < nRecords; ri++) {
        table.filterValue[ri] = new Array(nFields);
        for (var fi = 0; fi < nFields; fi++) {
            table.filterValue[ri][fi] = false;
        }
    }
}


// 6. initialize filterToRecord
function initFilterToRecord(table) {
    // allocate
    var nRecords = table.field.length;
    var nFields = table.field[0].length;
    table.filterToRecord = new Array(nFields);
    for (var fi = 0; fi < nFields; fi++){
        var nValues = Object.keys(table.fieldToIndex[fi]).length;
        table.filterToRecord[fi] = new Array(nValues);
        for (var vi = 0; vi < nValues; vi++) {
            table.filterToRecord[fi][vi] = [];
        }
        for (var ri = 0; ri < nRecords; ri++) {
            table.filterToRecord[fi][table.fieldIndex[ri][fi]].push(ri);
        }
    }
}


// 7. iterate through all of the records, access every cell value
function iterateTest(table) {
    var nRecords = table.field.length;
    var nFields = table.field[0].length;
    for (var ri = 0; ri < nRecords; ri++) {
        for (var fi = 0; fi < nFields; fi++) {
            var fv = table.indexToField[fi][table.fieldIndex[ri][fi]];
        }
    }
}

