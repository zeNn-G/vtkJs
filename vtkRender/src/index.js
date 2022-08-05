import "@kitware/vtk.js/favicon";

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import "@kitware/vtk.js/Rendering/Profiles/Volume";

// Force DataAccessHelper to have access to various data source
import "@kitware/vtk.js/IO/Core/DataAccessHelper/HtmlDataAccessHelper";
import "@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper";
import "@kitware/vtk.js/IO/Core/DataAccessHelper/JSZipDataAccessHelper";

import vtkColorTransferFunction from "@kitware/vtk.js/Rendering/Core/ColorTransferFunction";
import vtkFullScreenRenderWindow from "@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow";
import vtkHttpDataSetReader from "@kitware/vtk.js/IO/Core/HttpDataSetReader";
import vtkPiecewiseFunction from "@kitware/vtk.js/Common/DataModel/PiecewiseFunction";
import vtkVolume from "@kitware/vtk.js/Rendering/Core/Volume";
import vtkVolumeMapper from "@kitware/vtk.js/Rendering/Core/VolumeMapper";
import vtkPlane from "@kitware/vtk.js/Common/DataModel/Plane";
import vtkMatrixBuilder from "@kitware/vtk.js/Common/Core/MatrixBuilder";

// controlPanel from './controlPanel.html';
const controlPanel =
  '<table> <tbody><tr> <td><b>Clip Plane 1</b></td> </tr><tr> <td> Position <input class="plane1Position" type="range" min="-201.60000000000002" max="201.60000000000002" step="1" value="50.400000000000006"> </td> <td> Rotation <input class="plane1Rotation" type="range" min="0" max="180" step="1" value="0"> </td> </tr>  <tr> <td><b>Clip Plane 2</b></td> </tr><tr> <td> Position <input class="plane2Position" type="range" min="-201.60000000000002" max="201.60000000000002" step="1" value="100.80000000000001"> </td> <td> Rotation <input class="plane2Rotation" type="range" min="0" max="180" step="1" value="0"> </td> </tr>  </tbody></table>';

// vtk file load
const htmlLoad = `<input class="fileUpload" type="file" accept=".vtk">`;

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

fullScreenRenderer.addController(controlPanel);
fullScreenRenderer.addController(htmlLoad);
// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------
// Server is not sending the .gz and with the compress header
// Need to fetch the true file name and uncompress it locally
// ----------------------------------------------------------------------------

const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });

const actor = vtkVolume.newInstance();
const mapper = vtkVolumeMapper.newInstance();
mapper.setSampleDistance(1.1);
actor.setMapper(mapper);

const clipPlane1 = vtkPlane.newInstance();
const clipPlane2 = vtkPlane.newInstance();
let clipPlane1Position = 0;
let clipPlane2Position = 0;
let clipPlane1RotationAngle = 0;
let clipPlane2RotationAngle = 0;
const clipPlane1Normal = [-1, 1, 0];
const clipPlane2Normal = [0, 0, 1];
const rotationNormal = [0, 1, 0];

// create color and opacity transfer functions
const ctfun = vtkColorTransferFunction.newInstance();
ctfun.addRGBPoint(0, 85 / 255.0, 0, 0);
ctfun.addRGBPoint(95, 1.0, 1.0, 1.0);
ctfun.addRGBPoint(225, 0.66, 0.66, 0.5);
ctfun.addRGBPoint(255, 0.3, 1.0, 0.5);
const ofun = vtkPiecewiseFunction.newInstance();
ofun.addPoint(0.0, 0.0);
ofun.addPoint(255.0, 1.0);
actor.getProperty().setRGBTransferFunction(0, ctfun);
actor.getProperty().setScalarOpacity(0, ofun);
actor.getProperty().setScalarOpacityUnitDistance(0, 3.0);
actor.getProperty().setInterpolationTypeToLinear();
actor.getProperty().setUseGradientOpacity(0, true);
actor.getProperty().setGradientOpacityMinimumValue(0, 2);
actor.getProperty().setGradientOpacityMinimumOpacity(0, 0.0);
actor.getProperty().setGradientOpacityMaximumValue(0, 20);
actor.getProperty().setGradientOpacityMaximumOpacity(0, 1.0);
actor.getProperty().setShade(true);
actor.getProperty().setAmbient(0.2);
actor.getProperty().setDiffuse(0.7);
actor.getProperty().setSpecular(0.3);
actor.getProperty().setSpecularPower(8.0);

mapper.setInputConnection(reader.getOutputPort());

// vtk  file input event
document.querySelector(".fileUpload").addEventListener("input", (e) => {
  const Fakefilepath = e.target.value;
  const file = Fakefilepath.substring(Fakefilepath.indexOf("h") + 2);
  console.log(file);
});

const url = "http://localhost:3000/upload";
var fileUrl = "";

async function getUrl(url) {
  const response = await fetch(url);

  const data = response.json();
	console.log(response);
  console.log(data);

  if (response) {
    fileUrl = data.path;
  }

  reader.setUrl(fileUrl).then(() => {
    reader.loadData().then(() => {
      const data = reader.getOutputData();
      const extent = data.getExtent();
      const spacing = data.getSpacing();
      const sizeX = extent[1] * spacing[0];
      const sizeY = extent[3] * spacing[1];

      clipPlane1Position = sizeX / 4;
      clipPlane2Position = sizeY / 2;
      const clipPlane1Origin = [
        clipPlane1Position * clipPlane1Normal[0],
        clipPlane1Position * clipPlane1Normal[1],
        clipPlane1Position * clipPlane1Normal[2],
      ];
      const clipPlane2Origin = [
        clipPlane2Position * clipPlane2Normal[0],
        clipPlane2Position * clipPlane2Normal[1],
        clipPlane2Position * clipPlane2Normal[2],
      ];

      clipPlane1.setNormal(clipPlane1Normal);
      clipPlane1.setOrigin(clipPlane1Origin);
      clipPlane2.setNormal(clipPlane2Normal);
      clipPlane2.setOrigin(clipPlane2Origin);
      mapper.addClippingPlane(clipPlane1);
      mapper.addClippingPlane(clipPlane2);

      renderer.addVolume(actor);
      const interactor = renderWindow.getInteractor();
      interactor.setDesiredUpdateRate(15.0);
      renderer.resetCamera();
      renderer.getActiveCamera().elevation(70);
      renderWindow.render();

      let el = document.querySelector(".plane1Position");
      el.setAttribute("min", -sizeX);
      el.setAttribute("max", sizeX);
      el.setAttribute("value", clipPlane1Position);

      el = document.querySelector(".plane2Position");
      el.setAttribute("min", -sizeY);
      el.setAttribute("max", sizeY);
      el.setAttribute("value", clipPlane2Position);

      el = document.querySelector(".plane1Rotation");
      el.setAttribute("min", 0);
      el.setAttribute("max", 180);
      el.setAttribute("value", clipPlane1RotationAngle);

      el = document.querySelector(".plane2Rotation");
      el.setAttribute("min", 0);
      el.setAttribute("max", 180);
      el.setAttribute("value", clipPlane2RotationAngle);
    });
  });
}

// call async getUrl function
getUrl(url);

document.querySelector(".plane1Position").addEventListener("input", (e) => {
  clipPlane1Position = Number(e.target.value);
  const clipPlane1Origin = [
    clipPlane1Position * clipPlane1Normal[0],
    clipPlane1Position * clipPlane1Normal[1],
    clipPlane1Position * clipPlane1Normal[2],
  ];
  clipPlane1.setOrigin(clipPlane1Origin);
  renderWindow.render();
});

document.querySelector(".plane1Rotation").addEventListener("input", (e) => {
  const changedDegree = Number(e.target.value) - clipPlane1RotationAngle;
  clipPlane1RotationAngle = Number(e.target.value);
  vtkMatrixBuilder
    .buildFromDegree()
    .rotate(changedDegree, rotationNormal)
    .apply(clipPlane1Normal);
  clipPlane1.setNormal(clipPlane1Normal);
  renderWindow.render();
});

document.querySelector(".plane2Position").addEventListener("input", (e) => {
  clipPlane2Position = Number(e.target.value);
  const clipPlane2Origin = [
    clipPlane2Position * clipPlane2Normal[0],
    clipPlane2Position * clipPlane2Normal[1],
    clipPlane2Position * clipPlane2Normal[2],
  ];
  clipPlane2.setOrigin(clipPlane2Origin);
  renderWindow.render();
});

document.querySelector(".plane2Rotation").addEventListener("input", (e) => {
  const changedDegree = Number(e.target.value) - clipPlane2RotationAngle;
  clipPlane2RotationAngle = Number(e.target.value);
  vtkMatrixBuilder
    .buildFromDegree()
    .rotate(changedDegree, rotationNormal)
    .apply(clipPlane2Normal);
  clipPlane2.setNormal(clipPlane2Normal);
  renderWindow.render();
});

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.source = reader;
global.mapper = mapper;
global.actor = actor;
global.ctfun = ctfun;
global.ofun = ofun;
global.renderer = renderer;
global.renderWindow = renderWindow;
global.clipPlane1 = clipPlane1;
global.clipPlane2 = clipPlane2;
