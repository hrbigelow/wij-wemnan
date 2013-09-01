wij-wemnan
==========

experiments with webgl and widgets

main.html loads a sorted list of ~40,000 names of human genes, and
provides a simple interactive search box to search them.  The first 20
gene names matching the search (prefix, case-insensitive) appear
dynamically as LI items in an OL.

The point of this is to demonstrate good performance in spite of the
substantial size of the word list.

How it works:

In Javascript main memory (not in DOM):

* a 40,000 element array of the gene names (lower-cased)
* a 40,000 element array of LI HTMLElement's (with id=<gene name>, innerText = <gene_name>)

In the DOM:
* a search box with an oninput listener
* an OL element with up to 20 LI elements

Upon input, the O(log2(N)) binary search functions lower_bound and
upper_bound are used to find a [start, end) interval (after C++ STL
algorithm) within the gene names array / LI HTMLElement array.

A DocumentFragment is created, and the sub-set of LI elements in the
array is inserted (appendChild) into it, up to 20 elements.

The OL is cleared (.innerHTML = ''), then appended (appendChild(df))
with the constructed document fragment.

Also, the listener (created with makeUpdateListener) provides a
closure around the arrays of nodes, words, the OL update target, and
the maximum number of LI's to display.
