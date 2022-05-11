// initialize all auxiliary structures needed for fast updating
// an index is created for each column

filters = {};
/* filters[table_name][column_name][column_value] = [record1, record2, ...]

   filter: set of filter_items for a data table
   filter_item: one data column
   filter_elem: one value of a filter_item's content
   
  a filter represents a single data table column, and consists of the
  set of filter items.  Each filter item represents one of the
  possible values for the column for the filter.  The filter item's
  state can be either 'filtered' or 'not filtered'.  The collection of
  all filters in a data table govern the total set of records that are
  filtered.  it maps each individual field value to the array of data
  table records that match the field value

  A filter_elem is what contains the references to individual data
  table records.  It should also contain a flag that states whether
  it is in the 'filtered' state or not.

*/

// populates the filters structure for one table
// initializes the records to the unfiltered state
function init_filter_indexes(table_name, records, record_def) {
    var filter = {};
    record_def.forEach(function (field_name, fi) {
        var filter_item = {};
        records.forEach(function(rec, ri) {
            var cell_value = rec.data[fi];
            filter_item[cell_value] || 
                (filter_item[cell_value] = { 
                    recs : [], 
                    filtered : false,
                    num_total_records : 0,
                    num_unfiltered_records : 0
                });
            var filter_elem = filter_item[cell_value];
            filter_elem.recs.push(rec);
            filter_elem.num_total_records++;
            filter_elem.num_unfiltered_records++;
        });
        
        filter[field_name] = filter_item;
    });
    filters[table_name] = filter;

}


// auxiliary function for updating a single filter element
function update_filter_element_aux(filter_elem, do_filter) {
    // if the element already agrees with the target value, do nothing
    if (filter_elem.filtered == do_filter) return;

    // otherwise, assume we are toggling every one of the records
    filter_elem.filtered = do_filter;
    filter_elem.num_unfiltered_records = 
        (do_filter ? 0 : filter_elem.num_total_records);

    filter_elem.recs.forEach(function(rec, i) {
        rec.filter_state.set(filter_elem.column_index, do_filter);
    });
}

// updates a given filter element's state
function update_filter_element(table_name, column_name, column_value, 
                               do_filter) {
    var filter_elem = filters[table_name][column_name][column_value];

    update_filter_element_aux(filter_elem, do_filter);

    var table1 = table_name;
    var col1 = column_name;

    // iterate through all tables related to the first table,
    // and update relevant records' filter state.
    for (table2 in table_relations[table1]) {
        for (rel in table_relations[table1][table2]) {
            if (rel.table1_col == col1) {
                // the filtered column from table1 is connected to
                // a column for table2.
                var filter_elem2 = 
                    filters[table2][rel.table2_col][column_value];
                update_filter_element_aux(filter_elem2, do_filter);
            }
        }
    }
}



// return the total count of records referenced by filter_elem and its
// related elements.  the relation is defined at the filter_item
// level.
function count_related_unfiltered_records(table_name, column_name, 
                                          column_value) {

    var filter_elem = filters[table_name][column_name][column_value];
    var self_count = filter_elem.num_unfiltered_records;
    var total_count = self_count;
    
    for (target_table in table_relations[table_name]) {
        table_relations[table_name][target_table].forEach(
            function(el, i) {
                if (el.table1_col == column_name) {
                    var filter_item2 = 
                        filters[target_table][el.table2_col][column_value];
                    total_count += filter_elem2.num_unfiltered_records;
                }
            });
    }
    return total_count;
}
