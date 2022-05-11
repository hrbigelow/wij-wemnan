/* Implements equal_range, a function that returns a lower, upper bound
   pair for a given query range on a sorted array with a value function.
   the value function 

   ary: sorted array of things

   qval: query value, with the same structure as the things in the
   array

   ordering_func(a, b) returns -1, 0, 1 if a is less than, equal, or
   greater than b. a and b are of the same structure as the things in
   ary

*/


function equal_range(ary, qval, ordering_func) {
    var len = ary.length, half, left, right, 
    middle, first = 0, last = ary.length;

    var cmp;
    while (len > 0) {
        half = Math.floor(len / 2);
        middle = first + half;
        cmp = ordering_func(ary[middle], qval);
        if (cmp < 0) {
            first = middle + 1;
            len -= (half + 1);
        }
        else if (cmp > 0) {
            len = half;
        }
        else {
            left = lower_bound(ary, first, middle, qval, ordering_func);
            first += len;
            middle += 1;
            right = upper_bound(ary, middle, first, qval, ordering_func);
            return { left: left, right: right };
        }
    }
    return { left: first, right: first };
}


function lower_bound(ary, first, last, qval, ordering_func) {
    var len = last - first, half, middle, cmp;
    while (len > 0) {
        half = Math.floor(len / 2);
        middle = first + half;
        cmp = ordering_func(ary[middle], qval);

        // console.log('half: ' + half + ', middle: ' + middle);

        if (cmp < 0) {
            first = middle + 1;
            len -= (half + 1);
        }
        else {
            len = half;
        }
    }
    return first;
}


function upper_bound(ary, first, last, qval, ordering_func) {
    var len = last - first, half, middle, cmp;
    while (len > 0) {
        half = Math.floor(len / 2);
        middle = first + half;
        cmp = ordering_func(qval, ary[middle]);
        if (cmp < 0) {
            len = half;
        }
        else {
            first = middle + 1;
            len -= (half + 1);
        }
    }
    return first;
}