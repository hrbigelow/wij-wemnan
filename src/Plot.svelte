<script>
  import { onMount } from 'svelte';
  import SelectionPlot from './selection_plot';
  let mounted = false;
  let point_factor = 4;
  let num_points = "1000";
  var plot;

  onMount(async () => {
    let front_canvas = document.getElementById('select-front'); 
    let back_canvas = document.getElementById('select-back'); 
    let gl_canvas = document.getElementById('glcanvas');

    plot = new SelectionPlot(front_canvas, back_canvas, gl_canvas);
    await plot.scatter_plot.initTextures();
    plot.setPointFactor(point_factor);
    plot.refreshData(parseInt(num_points));
    console.log(plot.scatter_plot.scatter_prog.uniforms);

    mounted = true;

  });


  function refresh(num_points) {
    plot.refreshData(parseInt(num_points));
  }

</script>

<div>
  <div class='wrapper'>
    <canvas class='z3' 
            id="select-front"
            width="1000" 
            height="600"
            on:mousedown="{(evt) => {plot.mouseDown(evt)}}"
            on:mousemove="{(evt) => {plot.mouseMove(evt)}}"
            on:mouseup="{(evt) => {plot.mouseUp(evt)}}">
    </canvas>
    <canvas class='z2' id="select-back" width="1000" height="600"></canvas>
    <canvas class='z1' id="glcanvas" width="1000" height="600"></canvas>
  </div>

  <div class=''>
    <select bind:value={num_points} 
            on:change="{refresh(num_points)}">
      <option value="10">10</option>
      <option value="100">100</option>
      <option value="1000">1000</option>
      <option value="10000">10000</option>
      <option value="100000">100000</option>
    </select>

    <button on:click="{() => refresh(num_points)}">Refresh</button>

    <input type=range
           bind:value={point_factor}
           on:input={() => plot.setPointFactor(point_factor)}
           min=0 max=5 step=0.01>
  </div>
</div>


<style>

  .z1 {
    z-index: 1;
  }

  .z2 {
    z-index: 2;
  }

  .z3 {
    z-index: 3;
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

