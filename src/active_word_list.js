// load the initial wordlist
var words;
var wordsLower;
var wordNodes;

// i *think* this needs to be loaded asynchronously?
function loadWords() {
    $.ajax({
        url: './data/hugo_genes.json',
        async: false,
        cache: false,
        dataType: 'json',
        success: function(list) {
            words = list;
            wordsLower = words.map(function (w) { return w.toLowerCase() })
        }
    });
}


function initWordNodes() {
    wordNodes = 
        words.map(function (w) {
            var li = document.createElement('li');
            li.setAttribute('id', w);
            li.innerText = w;
            return li;
        });
}




function wordCmp (a, b) {
    return a.localeCompare(b);
}


// return a structure of [start, end) bounds for a given
// <query> on a sorted list of <words>
function findBoundsNoncased(words, query) {
    var queryLc = query.toLowerCase(),
    queryLast = queryLc + String.fromCharCode(255),
    lower = lower_bound(words, 0, words.length, queryLc, wordCmp),
    upper = upper_bound(words, lower, words.length, queryLast, wordCmp);
    return { start: lower, end: upper }
}


// populate the DOM OL <node> with the 
// range [<start>, <end>) of IL nodes from <nodes>
function setSearchChoices(targetNode, nodes, start, end, maxNodes){
    var container = document.createDocumentFragment(),
    i,
    usedEnd = Math.min(end, start + maxNodes);
    
    for (i = start; i != usedEnd; i += 1) {
        container.appendChild(nodes[i]);
    }
    targetNode.innerHTML = '';
    targetNode.appendChild(container);
}


// create a function for updating the OL
// this function should store in its closure:
// the OL node
// the list of IL nodes to choose from
// the appropriate word list to choose from
// a pre-set max value
// 
function makeUpdateListener(updateTarget, nodes, words, maxNodes) {
    return function(evt) {
        var searchbox = evt.target,
        query = searchbox.value;
        b = findBoundsNoncased(words, query);
        setSearchChoices(updateTarget, nodes, b.start, b.end, maxNodes);
    }
}
