<script>
    import { onMount } from 'svelte';
    import SelectionPlot from './selection_plot';
    let mounted = false;
    let show_help = true;
    let canvas, gl_canvas;
    let point_factor = 4;
    let log10_num_points = 2;
    let num_points = 100;
    let num_points_selected = 0;
    let point_size_incr = 0.1;
    let num_points_incr = 0.05;
    var plot;

    onMount(async () => {
        canvas = document.getElementById('select'); 
        gl_canvas = document.getElementById('glcanvas');

        plot = new SelectionPlot(canvas, gl_canvas);
        await plot.scatter_plot.initTextures();
        plot.setPointFactor(point_factor);
        refresh(log10_num_points);

        mounted = true;
        onResize();

    });

    function onResize() {
        if (! mounted) { return; }
        // console.log(`dims: ${divw},${divh}`);
        canvas.width = window.innerWidth;
        gl_canvas.width = window.innerWidth;

        canvas.height = window.innerHeight;
        gl_canvas.height = window.innerHeight;
        plot.resizeCanvas();
    }

    async function handleMouse(evt) {
        if (evt.type == 'mousedown') {
            plot.mouseDown(evt);
        } else if (evt.type == 'mousemove') {
            plot.mouseMove(evt);
            num_points_selected = await plot.getNumSelected();
        } else if (evt.type == 'mouseup') {
            plot.mouseUp(evt);
        }
    }

    function handleKeydown(evt) {
        let key = evt.key,
            code = evt.keyCode;

        if (key == 'a') {
            plot.clearSelection();
            num_points_selected = 0;
        } else if (key == 'd') {
            point_factor -= point_size_incr;
            plot.setPointFactor(point_factor);
        } else if (key == 'f') {
            point_factor += point_size_incr;
            plot.setPointFactor(point_factor);
        } else if (key == 'h') {
            show_help = ! show_help;
        } else if (key == 'j') {
            log10_num_points -= num_points_incr;
        } else if (key == 'k') {
            log10_num_points += num_points_incr;
        } else if (code == 32) { // space
            plot.resetZoom();
        } else if (code == 13) { // enter
            plot.refreshData(num_points);
        }
    }

    $: num_points = parseInt(Math.pow(10, log10_num_points));

    function refresh(log10_num_points) {
        plot.refreshData(num_points);
    }

</script>

<svelte:window on:keydown={handleKeydown} on:resize={onResize}/>


<canvas class='abs z2' 
        id="select"
        on:mousedown="{handleMouse}"
        on:mousemove="{handleMouse}"
        on:mouseup="{handleMouse}">
</canvas>
<canvas class='abs z1' id="glcanvas"></canvas>

<div class='abs gray z2 upper-right'>
    <div># Points: {num_points}</div>
    <div># Selected: {num_points_selected}</div>
</div>

{#if show_help}
    <div class='abs gray z2 lower-right'>
        <pre style="text-align: left;">
 h:       toggle help
 a:       clear select
 d,f:     point size
 j,k:     num points
 [space]: reset zoom
 [enter]: reload data
 
 drag:     rect select
 Alt-drag: freeform select
 +[shift]: add to select
 two-fingers: zoom in/out
        </pre>
         <a href="https://github.com/hrbigelow/wij-wemnan"> source code</a>
    </div>
{/if}

<style>

    .upper-right {
        top: 10px;
        right: 10px;
    }

    .gray {
        background-color: rgba(200, 200, 200, 0.5);
    }

    .lower-right {
        text-align: center;
        bottom: 10px;
        right: 10px;
    }

    .abs {
        position: absolute;
    }

    .z1 {
        z-index: 1;
    }

    .z2 {
        z-index: 2;
    }

</style>

