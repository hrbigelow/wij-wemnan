/*
 Constructs an FM-index after Langmead's tutorial paper: Introduction
 to the Burrows-Wheeler Transform and FM Index, Nov 24, 2013 (found
 somewhere on the net).

 Steps:

1. Start with an array of strings in 'items'.  Strings are assumed to
   contain only ASCII values (Unicode values < 128).

2. Construct a concatenated string, appending '\1' (Unicode value = 1)
   to each element of 'items' and then concatenating each element.
   Append a '\0' at the very end.  It is assumed that '\0' and '\1' do
   not appear anywhere in the item elements.  Store this string in a
   Uint8Array 'ucontent'.  This is the 'T' string mentioned in the
   paper.

3. Build a temporary data structure, the Burrows-Wheeler Matrix (BWM).
   With each entry, store the 'first' and 'last' in 'F' and 'L',
   respectively, and also store the offset in T as 'Off', and the
   original item index that this position falls in, in 'Ix'.  Sort the
   elements of the BWM using the indirect sorting function that refers
   to the base array 'ucontent', but sorts the entries of BWM.  Note
   that the '\0' and '\1' codes (0 and 1) naturally precede any ASCII
   values.

   For illustration: 

   l=6
   012345
   abcac$

   $abcac
   c$abca
   ac$abc
   cac$ab
   bcac$a
   abcac$
   
   F     L     Off
   u[5]  u[4]  5
   u[4]  u[3]  4
   u[3]  u[2]  3
   u[2]  u[1]  2
   u[1]  u[0]  1
   u[0]  u[5]  0


4. Sweep through the BWM, storing the 'Off' field and the 'Ix' field
   in 'sa_offsets' and 'item_index' whereever 'Off' % nth_sa == 0.
   Importantly, this optimization differs from Langmead in that we are
   storing every nth, but according to the value of 'Off'.  Not
   according to the index in the BWM.  This will thus guarantee that
   backward stepping in the index is guaranteed to hit a stored offset
   in at most 'nth_sa' steps.  

   Encode the 'bwt' such that the lower 7 bits store the unicode
   codepoint, and the 8th bit is a flag.  1 means, 'the offset and
   index' are stored for this entry, 0 means they are not.

5. rank_all[c][i / nth_rank] gives the number of times code c occurs
   in bwt range [0,i).  Note, this is a half-open interval.  To save
   space, only values where i % nth_rank == 0 are stored.  The
   function get_rank fills in other values of i on-the-fly, by
   traversing the bwt.  Note that it starts with rank_all value at
   position i - (i % nth_rank), then traverses positions [i - (i %
   nth_rank), i).  (Also a half-open interval).  This is consistent
   with the definition of rank_all.

   rank_all is defined this way so that it produces an 'offset' into
   'firsts' that can be used directly, both for ranged traversal and
   for single-element stepping. (functions find_*).  Note also that
   find_range returns a half-open interval [l, r) range of entries in
   the index.

Notes: Unfortunately, sa_offsets and item_index are keyed on an
integer position in the index. They are sparse, holding a more-or-less
random subset of T.length / nth_sa numbers in the [0, T.length) range.
So, lookup is JavaScript hash-based, which is probably O(1) but could be worse.

*/
var item_term_char = '\1';
var global_term_char = '\0';

function FMIndex() {
    this.rank_all = undefined; // map of char => [int, int, ...]
    this.nth_rank = 500;
    this.nth_sa = 4;
    this.content = undefined; // Uint8Array
    this.ucontent = undefined; // Uint8Array
    this.item_index = undefined;
    this.sa_offsets = undefined; 
    this.firsts = undefined; // map of char => [int, int] (small structure)
    this.bwt = undefined // Uint8Array
};

FMIndex.prototype = {
    
    init: function(items) {
        build_offset_string(items, this);
        var bwm = build_bwm(this.ucontent);
        calc_firsts(bwm, this);
        calc_bwt(bwm, this);
        calc_rank_all(bwm, Object.keys(this.firsts), this);
    },
    
    /* finds the range in index that matches the query, in the form
     * [l, r).  call find_item_index(i) for each i in [l, r). */
    find_range: function(query) {
        var c = query.charCodeAt(query.length - 1),
            nr = this.nth_rank;

        if (! c in this.firsts) {
            return [0, 0]; // empty range
        }
        var rng = this.firsts[c];
        var l = rng[0], r = rng[1],
            start,
            i = query.length - 2;

        while (i >= 0 && r > l) {
            c = query.charCodeAt(i);
            if (! c in this.firsts) {
                return [0, 0];
            }
            start = this.firsts[c][0];
            l = start + get_rank(this, l, c, nr);
            r = start + get_rank(this, r, c, nr);

            i--;
        }
        return [l, r];
    },
    
    /* Usage: x = find_item_index(i).  term = items[x]. */
    find_item_index: function(i) {
        var n_item_term = 0, // # of times the item_terminator was crossed
            item_term_code = item_term_char.charCodeAt(0),
            nr = this.nth_rank,
            c;
        while (! (this.bwt[i] & 1<<7)) {
            c = this.bwt[i] & 127;
            i = this.firsts[c][0] + get_rank(this, i, c, nr);
            n_item_term += c == item_term_code ? 1 : 0;
        }

        // this is a sparse array, lookup may not be O(1)...
        return this.item_index[i] + n_item_term;
    },
    
    /* convenience function. return a populated array of items
       matching query */
    query_result: function(items, query) {
        var r = find_range(this, query),
            result = [];
        for (var i = r[0]; i != r[1]; i++) {
            result.push(items[find_item_index(this, i)]);
        }
        return result;
    },

    

};


/* populates index.content with concatenated elements of items with
   item_term_char appended to each. */
function build_offset_string(items, index) {
    var p = 0;
    index.content = '';

    items.forEach(function(el, i) {
        index.content += el + item_term_char;
        p += el.length + 1;
    });
    index.content += global_term_char;

    index.ucontent = new Uint8Array(index.content.length);
    for (var i = 0; i != index.content.length; i++) { 
        index.ucontent[i] = index.content.charCodeAt(i);
    }
}


/* the returned sort function sorts the two BWM entries based on their
   offsets in the 'base' string. */
function get_sort(base) {

    // this needs to enclose base
    return function(a, b) {
        var c, ai = a.Off, bi = b.Off;
        do {
            c = base[ai++] - base[bi++];
        } while (c == 0);
        
        return c;
    };
}



/* returns the BWM from string t. */
function build_bwm(t) {
    var item_index = 0, l = t.length, bwm = new Array(l),
        item_term_code = item_term_char.charCodeAt(0);
    for (var i = 1; i != l; i++) { 
        bwm[i] = {F: t[i], L: t[i - 1], Off: i, Ix: item_index };
        item_index += t[i] == item_term_code ? 1 : 0;
    }
    
    bwm[0] = {F: t[0], L: t[l - 1], Off: 0, Ix: 0};
    bwm.sort(get_sort(t));
    return bwm;
}


/* calculate the 'firsts' map.  this is the set of ranges of each
   character, in the form [l, r) (half-open) */
function calc_firsts(bwm, index) {
    var cc = bwm[0].F, l = bwm.length;

    index.firsts = {};
    index.firsts[cc] = [0, 0];
    for (var i = 1; i != l; i++) {
        if (cc != bwm[i].F) {
            index.firsts[cc][1] = i;
            cc = bwm[i].F;
            index.firsts[cc] = [i, 0];
        }
    }
    index.firsts[cc][1] = i;
}


/* rank[c][i] is the number of times character c has been seen in the
   range [0, i) */
function calc_rank_all(bwm, charCodes, index) {
    var ac = {}, code;
    index.rank_all = {};
    
    charCodes.forEach(function (el) { index.rank_all[el] = []; ac[el] = 0; });
    bwm.forEach(function(el, i) {
        if (i % index.nth_rank == 0) {
            for (code in ac) {
                index.rank_all[code].push(ac[code]);
            }
        }
        ac[el.L]++;
    });
}

/* calculates the bwt plus a flag in bit 7.  if offset % nth == 0,
   stores this offset and sets the flag. */
function calc_bwt(bwm, index) {
    index.bwt = new Uint8Array(bwm.length);
    index.sa_offsets = {};
    index.item_index = {};
    var nth = index.nth_sa;
    bwm.forEach(function(el, i) { 
        if (el.Off % nth) {
            index.bwt[i] = el.L;
        }
        else {
            index.bwt[i] = el.L | 1<<7;
            index.sa_offsets[i] = el.Off;
            index.item_index[i] = el.Ix;
        }
    });
}

function get_rank(index, i, code, nth) {
    var b, 
        scan = i % nth,
        rank = index.rank_all[code][(i - scan) / nth];

    for (b = i - scan; b < i; b++) {
        rank += (index.bwt[b] & 127) == code ? 1 : 0;
    }
    return rank;
}




// find the SA Offset that corresponds with row i.  Note that the
// backward searching does not care about nul characters.
function find_sa_offset(index, i) {
    var nstep = 0,
        nr = index.nth_rank,
        c;
    while (! (index.bwt[i] & 1<<7)) {
        c = index.bwt[i] & 127;
        i = index.firsts[c][0] + get_rank(index, i, c, nr);
        nstep++;
    }

    // this is a sparse array, lookup may not be O(1)...
    return index.sa_offsets[i] + nstep;
}


