<script>
  import { onMount } from 'svelte';
  import { ScatterPlot } from './scatter_plot';
  import { initVisualSelection, attachPlot } from './visual_selection'; 
  import randomPoints from './random_points';

  var scatter;
  var select_front;
  var select_back;

  onMount(() => {
    var canvas = document.getElementById('glcanvas');
    select_front = document.getElementById('select-front');
    select_back = document.getElementById('select-back');

    var gl_opts = {
        alpha: true,
        antialias: false,
        premultipliedAlpha: false,
        preserveDrawingBuffer: true
    };

    var gl = canvas.getContext('webgl', gl_opts) || 
      canvas.getContext('experimental-webgl', gl_opts);

    scatter = new ScatterPlot(gl);
    console.log('scatter: ', scatter);

  });

  function loadScatter() {
    scatter.load_data(randomPoints(scatter, 100));
    attachPlot(scatter);
    initVisualSelection(select_front, select_back); 
  }

  function growDots() {
    scatter.view.pointFactor *= 1.1;
    scatter.resize_dots();
    scatter.draw();
  }

  function shrinkDots() {
    scatter.view.pointFactor /= 1.1;
    scatter.resize_dots();
    scatter.draw();
  }

  function syncSelection() {
    scatter.sync_selection();
  }

  function draw() {
    scatter.draw();
  }


</script>


<div>
  <input type="button" id="load_data" value="Initialize Plot and Select" onclick="{loadScatter}"/>
  
  <input type="button" id="grow_dots" value="Grow Dots" onclick="{growDots}" />

  <input type="button" id="shrink_dots" value="Shrink Dots" onclick="{shrinkDots}" />

  <input type="button" id="sync_selection" value="Synch Selection" onclick="{syncSelection}" />

  <input type="button" id="draw" value="Draw" 
                                 onclick="{draw}" />
</div>

<div style="position: relative">
  <!-- <svg id="overlay" width="1000" height="750"> -->
  <!--   <g><text x="200" y="200" text-anchor="end">Some example text</text></g> -->
  <!-- </svg> -->
  <canvas id="select-front" width="1000" height="600" style="position: absolute; left: 0px; top: 0px; z-index: 0"></canvas>
  <canvas id="select-back" width="1000" height="600" style="position: absolute; left: 0px; top: 0px; z-index: -1"></canvas>
  <canvas id="glcanvas" width="1000" height="600" style="position: absolute; left: 0px; top: 0px; z-index: -2"></canvas>
</div>

