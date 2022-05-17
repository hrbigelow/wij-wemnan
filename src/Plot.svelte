<script>
  import { onMount } from 'svelte';
  import SelectionPlot from './selection_plot';
  let mounted = false;
  let point_factor = 2;
  let num_points = "1000";
  var plot;

  onMount(() => {
    let front_canvas = document.getElementById('select-front'); 
    let back_canvas = document.getElementById('select-back'); 
    let gl_canvas = document.getElementById('glcanvas');

    plot = new SelectionPlot(front_canvas, back_canvas, gl_canvas);
    console.log(plot);
    plot.refreshData(parseInt(num_points));

    mounted = true;
  });


  function refresh(num_points) {
    plot.refreshData(parseInt(num_points));
  }
  // $: update(update_sig, scatter);

</script>


<div class='fb-vert'>
  <div class='fi-upper gbox-upper'>
    <div class='framed'>
      <canvas class='z3' id="select-front" width="1000" height="600"
              on:mousedown="{(evt) => {plot.mouseDown(evt)}}"
              on:mousemove="{(evt) => {plot.mouseMove(evt)}}"
              on:mouseup="{(evt) => {plot.mouseUp(evt)}}">
      </canvas>
      <canvas class='z2' id="select-back" width="1000" height="600"></canvas>
      <canvas class='z1' id="glcanvas" width="1000" height="600"></canvas>
    </div>
  </div>


  <div class='fi-lower gbox-lower'>
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
           min=0 max=4 step=0.01>
  </div>

</div>

<style>

  .framed {
    border: 1px solid gray;
  }

  .z1 {
    z-index: 1;
  }

  .z2 {
    z-index: 2;
  }

  .z3 {
    z-index: 3;
  }

  .topcell {
    grid-row: 1;
    grid-column: 1;
  }


  .gbox-upper {
    display: grid;
    grid-template-columns: [figure-start curves-start] auto [curves-end slider-start] min-content [slider-end figure-end];
    grid-template-rows: auto min-content;
    row-gap: 5px;
    column-gap: 10px;
    justify-items: center;
    align-items: end;
  }

  .gbox-lower {
    display: grid;
    /* grid-template-columns: min-content min-content 1fr 1fr 1fr min-content min-content; */
    grid-template-columns: 5% min-content min-content 5% 10% 5% min-content min-content 5%;
    grid-template-rows: 60% repeat(2, min-content);
    row-gap: 5px;
    column-gap: 5px;
    justify-items: center;
    align-items: center;
    justify-content: start;
    align-content: center;
  }

  .fi-upper {
    flex: 4 4 0;
  }

  .fi-lower {
    flex: 2 2 0;
  }

  .screen80 {
    height: 80vh;
  }

</style>

