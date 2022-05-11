<script>
  import { onMount } from 'svelte';
  import scatter_plot from './scatter_plot';
  import * as visual_selection from 'visual_selection'; 
  import random_points from 'random_points';

  onMount(() => {
    var can = document.getElementById('glcanvas');
    var gl_opts = {
        alpha: true,
        antialias: false,
        premultipliedAlpha: false,
        preserveDrawingBuffer: true
    };

    var gl = can.getContext('webgl', gl_opts) || 
      can.getContext('experimental-webgl', gl_opts);

    var scatter = new scatter_plot.ScatterPlot(gl);
  });

</script>


<div>
  <input type="button" id="load_data" value="Initialize Plot and Select" 
         onclick="scatter.load_data(random_points.randomPoints(scatter, 100));
                  selection.attachPlot(scatter);
                  selection.init($('#select-front')[0], $('#select-back')[0]);" />
  
  <input type="button" id="grow_dots" value="Grow Dots" 
         onclick="scatter.view.pointFactor *= 1.1;
                  scatter.resize_dots();
                  scatter.draw();" />

  <input type="button" id="shrink_dots" value="Shrink Dots" 
         onclick="scatter.view.pointFactor /= 1.1;
                  scatter.resize_dots();
                  scatter.draw();" />

  <input type="button" id="sync_selection" value="Synch Selection" 
         onclick="scatter.sync_selection();
                  " />

  <input type="button" id="draw" value="Draw" onclick="scatter.draw()" />
</div>
<img src="img/circle.svg">
<div style="position: relative">
  <!-- <svg id="overlay" width="1000" height="750"> -->
  <!--   <g><text x="200" y="200" text-anchor="end">Some example text</text></g> -->
  <!-- </svg> -->
  <canvas id="select-front" width="1000" height="600" style="position: absolute; left: 0px; top: 0px; z-index: 0"></canvas>
  <canvas id="select-back" width="1000" height="600" style="position: absolute; left: 0px; top: 0px; z-index: -1"></canvas>
  <canvas id="glcanvas" width="1000" height="600" style="position: absolute; left: 0px; top: 0px; z-index: -2"></canvas>
</div>

