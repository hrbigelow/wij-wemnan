/* Instances of this class represent a Google Autocomplete-like text
 * input element. However, all options are loaded once, and indexed
 * client-side. */
function ActiveList(url, max_elems, input_node) {
    this.cfg = {
        url: url;
        max_elems: max_elems;
    };
    /* The DOM input node that this class will animate */
    this.input_node = input_node;

    /* Attach listener */
    this.input_node.oninput = function(evt) {
        this.update_cur_contents(evt.target.value);
    }

    /* OL element currently in DOM */
    this.cur_ol = build_nodes_aux(max_elems);

    /* OL element in reserve */
    this.bak_ol = build_nodes_aux(max_elems);
    
    this.items = undefined; /* List of phrases */
    this.items_lc = undefined; /* Lower-cased versions of items */
    this.index = undefined; /* Index for the phrases */
};

ActiveList.prototype = {

    /* initializes items and items_lc from url. */
    load_items: function() {
        $.ajax({
            url: this.cfg.url,
            async: false,
            cache: false,
            dataType: 'json',
            success: function(list) {
                this.items = items;
                this.items_lc = items.map(
                    function(w) { return w.toLowerCase(); }
                );
            }
        });
    },

    /* call after load_items.  builds the index. */
    build_index: function() {
        this.index = new FMIndex();
        this.index.init(this.items);
    },

    /* updates the contents of the cur_ol, using bak_ol as a swap
     * space. */
    update_cur_contents: function(query) {
        var i, rng = this.index.find_range(query),
            el = this.bak_ol.firstElementChild(),
            tmp_ol;

        rng.r = rng.l + Math.min(rng.r - rng.l, this.cfg.max_elems);
        
        for (var i = rng.l; i != rng.r; ++i) {
            el.innerHTML = this.items[this.index.find_item_index(i)];
            el = el.nextElementSibling();
        }
        /* Should hide any remaining items */
        tmp_ol = this.cur_ol;
        this.cur_ol = this.bak_ol;
        this.bak_ol = tmp_ol;
    }
    
};


function build_nodes_aux(n_nodes) {
    var ol = document.createElement('ol');
    for (i = 0; i != n_nodes; ++i) {
        ol.appendChild(document.createElement('li'));
    }
    return ol;
}



function wordCmp (a, b) {
    return a.localeCompare(b);
}


/* return a structure of [start, end) bounds for a given <query> on a
   sorted list of <words> */
function find_bounds_noncased(words, query) {
    var queryLc = query.toLowerCase(),
    queryLast = queryLc + String.fromCharCode(255),
    lower = lower_bound(words, 0, words.length, queryLc, wordCmp),
    upper = upper_bound(words, lower, words.length, queryLast, wordCmp);
    return { start: lower, end: upper };
}


/* populate the DOM OL <node> with the range [<start>, <end>) of IL
   nodes from <nodes> */
/* OBSOLETE
function set_search_choices(target_node, nodes, start, end, maxNodes){
    var container = document.createDocumentFragment(),
    i,
    usedEnd = Math.min(end, start + maxNodes);
    
    for (i = start; i != usedEnd; i += 1) {
        container.appendChild(nodes[i]);
    }
    target_node.innerHTML = '';
    target_node.appendChild(container);
}
*/
