/* Instances of this class represent a Google Autocomplete-like text
 * input element. However, all options are loaded once, and indexed
 * client-side. Synopsis:

 var al = new ActiveList(data_url, max_elems, input_node);
 al.load_items();
 al.build_index();
 al.attach();

 The 
*/
function ActiveList(url, max_elems, input_node, container_node) {
    var alist = this;
    this.cfg = {
        url: url,
        max_elems: max_elems
    };
    /* The DOM input node that this class will animate */
    this.input_node = input_node;

    /* The DOM div that contains the input node, which will also
     * contain cur_ul and keep it aligned. */
    this.container_node = container_node;
    
    /* Attach listener */
    this.input_node.oninput = function(evt) {
        alist.update_cur_contents(evt.target.value);
    }

    /* UL element currently in DOM */
    this.cur_ul = build_nodes_aux(max_elems);

    /* UL element in reserve */
    this.bak_ul = build_nodes_aux(max_elems);
    
    this.items = undefined; /* List of phrases */
    this.items_lc = undefined; /* Lower-cased versions of items */
    this.index = undefined; /* Index for the phrases */

};


ActiveList.prototype = {

    /* initializes items and items_lc from url. */
    load_items: function() {
        var al = this;
        $.ajax({
            url: this.cfg.url,
            async: false,
            cache: false,
            dataType: 'json',
            success: function(list) {
                al.items = list;
                al.items_lc = al.items.map(
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

    /* updates the contents of the cur_ul, using bak_ul as a swap
     * space. */
    update_cur_contents: function(query) {
        var i, rng = this.index.find_range(query),
            el = this.bak_ul.firstElementChild,
            tmp_ul;

        console.log('rng = ' + rng[0] + ', ' + rng[1]);
        rng[1] = rng[0] + Math.min(rng[1] - rng[0], this.cfg.max_elems);
        
        for (i = rng[0]; i != rng[1]; ++i) {
            el.innerHTML = this.items[this.index.find_item_index(i)];
            el.style.display = 'block';
            el = el.nextElementSibling;
        }
        /* hide remaining elements */
        while (el != null) {
            el.style.display = 'none';
            el = el.nextElementSibling;
        }

        /* cur_ul resides in the document.  replace cur_ul node with
         * bak_ul node in the document.  set cur_ul to */
        tmp_ul =
            this.container_node.replaceChild(this.bak_ul, this.cur_ul);
        this.cur_ul = this.bak_ul;
        this.bak_ul = tmp_ul;
    },

    /* attach the ul to the DOM */
    attach: function() {
        this.cur_ul.style.position = 'absolute';
        this.cur_ul.style.top =
            find_top_offset(this.input_node, this.container_node)
            + this.input_node.offsetHeight
            + 'px';
        this.container_node.appendChild(this.cur_ul);
    }
};


/* given a node nd and one of its ancestors an, find the offset of nd
 * from the top of an. */
function find_top_offset(node, ancestor) {
    var y = 0;
    while (node != ancestor) {
        y += node.offsetTop;
        node = node.offsetParent;
    }
    return y;
}


/* build an ordered list of nodes, initially hidden */
function build_nodes_aux(n_nodes) {
    var ul = document.createElement('ul'), li;
    for (var i = 0; i != n_nodes; ++i) {
        li = document.createElement('li');
        li.style.display = 'none';
        ul.appendChild(li);
    }
    return ul;
}
