import "@kitware/vtk.js/favicon";

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import "@kitware/vtk.js/Rendering/Profiles/Geometry";

import vtkActor from "@kitware/vtk.js/Rendering/Core/Actor";
import vtkFullScreenRenderWindow from "@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow";
import vtkMapper from "@kitware/vtk.js/Rendering/Core/Mapper";
import vtkPolyDataReader from "@kitware/vtk.js/IO/Legacy/PolyDataReader";

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

const resetCamera = renderer.resetCamera;
const render = renderWindow.render;

const url = "http://localhost:3000/upload";
// get request  for vtk file in the server.
const xhr = new XMLHttpRequest();
xhr.open("GET", url);
xhr.send();
xhr.responseType = "blob";
xhr.onload = (e) => {
  var blob = e.currentTarget.response;
  console.log(blob);

  var file = new File([blob], "sphere.vtk", {
    type: "legacy/vtk",
    lastModified: new Date().getTime(),
  });
  const fileName = "";
  console.log(file);

  console.log(xhr.response);

  const reader = vtkPolyDataReader.newInstance();
  reader.setUrl("http://localhost:3000/upload").then(() => {
    const polydata = reader.getOutputData(0);
    const mapper = vtkMapper.newInstance();
    const actor = vtkActor.newInstance();

    actor.setMapper(mapper);
    mapper.setInputData(polydata);

    renderer.addActor(actor);

    resetCamera();
    render();
  });

  // -----------------------------------------------------------
  // Make some variables global so that you can inspect and
  // modify objects in your browser's developer console:
  // -----------------------------------------------------------

  global.reader = reader;
  global.fullScreenRenderer = fullScreenRenderer;
};
