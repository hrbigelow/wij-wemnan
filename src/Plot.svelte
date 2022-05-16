<script>
  import { onMount } from 'svelte';
  import { mouseDown, mouseMove, mouseUp, initVisualSelection, attachPlot } from './visual_selection'; 
  import { ScatterPlot } from './scatter_plot';
  import randomPoints from './random_points';
  let mounted = false, select_front, select_back;
  let point_factor = 1;
  var scatter;

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
    mounted = true;
    update();
    // loadScatter();
    console.log('scatter: ', scatter);
  });

  function update() {
    if (! mounted) return;
    initVisualSelection(select_front, select_back); 
    attachPlot(scatter)
  }

  // $: update(update_sig, scatter);

  function loadScatter() {
    scatter.load_data(randomPoints(scatter, 10000));
    update();
    scatter.draw();
  }

  function dotSize() {
    scatter.userState.pointFactor = point_factor;
    scatter.resize_dots();
    scatter.draw();
  }

  function syncSelection() {
    scatter.sync_selection();
  }

  function draw() {
    scatter.draw();
  }

  function lucky() {
    scatter.zoom();
  }

</script>


<div>
  <input type="button" 
         value="Initialize Plot and Select" on:click="{loadScatter}"/>
  
  <input type="button" 
         value="Synch Selection" on:click="{syncSelection}" />

  <input type="button" 
         value="Draw" on:click="{draw}" />

  <input type="button" 
         value="Lucky" on:click="{lucky}" />

  <input type=range
         bind:value={point_factor}
         on:input={dotSize}
         min=0 max=4 step=0.01>
</div>

<div style="position: relative">
  <!-- <svg id="overlay" width="1000" height="750"> -->
  <!--   <g><text x="200" y="200" text-anchor="end">Some example text</text></g> -->
  <!-- </svg> -->
  <canvas id="select-front"
          width="1000" 
          height="600"
          on:mousedown="{mouseDown}"
          on:mousemove="{mouseMove}"
          on:mouseup="{mouseUp}"
          style="position: absolute; left: 0px; top: 0px; z-index: 0">
  </canvas>
  <canvas id="select-back" 
          width="1000" 
          height="600"
          on:mousedown="{mouseDown}"
          on:mousemove="{mouseMove}"
          on:mouseup="{mouseUp}"
          style="position: absolute; left: 0px; top: 0px; z-index: -1">
  </canvas>
  <canvas id="glcanvas"
          width="1000" 
          height="600" 
          style="position: absolute; left: 0px; top: 0px; z-index: -2">
  </canvas>
</div>


