<script>
  import { onMount } from 'svelte';
  import SelectionPlot from './selection_plot';
  let mounted = false;
  let point_factor = 4;
  let log10_num_points = "2";
  let num_points = 100;
  let num_points_selected = 0;
  var plot;

  onMount(async () => {
    let canvas = document.getElementById('select'); 
    let gl_canvas = document.getElementById('glcanvas');

    plot = new SelectionPlot(canvas, gl_canvas);
    await plot.scatter_plot.initTextures();
    plot.setPointFactor(point_factor);
    refresh(log10_num_points);
    console.log(plot.scatter_plot.scatter_prog.uniforms);

    mounted = true;

  });

  async function handle(evt) {
    if (evt.type == 'mousedown') {
      plot.mouseDown(evt);
    } else if (evt.type == 'mousemove') {
      plot.mouseMove(evt);
    } else if (evt.type == 'mouseup') {
      plot.mouseUp(evt);
    }
    num_points_selected = await plot.getNumSelected();
  }

  function refresh(log10_num_points) {
    num_points = parseInt(Math.pow(10, parseFloat(log10_num_points)));
    plot.refreshData(num_points);
  }


</script>

<div>
  <div class='wrapper'>
    <canvas class='z2' 
            id="select"
            width="1000" 
            height="600"
            on:mousedown="{handle}"
            on:mousemove="{handle}"
            on:mouseup="{handle}">
    </canvas>
    <canvas class='z1' id="glcanvas" width="1000" height="600"></canvas>
  </div>

  <div class=''>
    <div>Number of Data Points: {num_points}</div>
    <input type=range
           bind:value={log10_num_points}
           on:input="{refresh(log10_num_points)}"
           min=0, max=5 step=0.01>

    <button on:click="{() => refresh(log10_num_points)}">Refresh</button>

    <input type=range
           bind:value={point_factor}
           on:input={() => plot.setPointFactor(point_factor)}
           min=0 max=5 step=0.01>
           <div>Total selected: {num_points_selected}</div>
  </div>

  <div class=''>
    <p>Click and drag in the plot a rectangular or (with Alt held), a freeform
    area.  Hold down Shift to add to your selection.  Note that it is
    responsive even with 100k points.  See 
    <a href="https://github.com/hrbigelow/wij-wemnan">source code</a>
    for more.
    </p>
  </div>
</div>


<style>

  .z1 {
    z-index: 1;
  }

  .z2 {
    z-index: 2;
  }

  .wrapper {
    position: relative;
    height: 600px;
  }

  .wrapper canvas {
    position: absolute;
  }

  canvas {
    border: 1px solid gray;
  }

</style>

