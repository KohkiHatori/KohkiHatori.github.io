const url = "http://127.0.0.1:3000/image";
const width = $(window).width();
const height = $(window).height();
const origin = [0, height];
const DT = 0.001;
const margin_factor = 0.9;
const pause_start = ["PAUSE", "START"]
const path_colour = "cyan";
const vector_colour = "white";
const circle_colour = "white";
var interval = 10;
var num_vec = 150;
var factor = 0;
var sets_of_coeffs = [];
var show_circle = true;
var show_vector = true;
var pause = true;
var quit = false;
var config = [];

async function upload() {
  let formData = new FormData();
  formData.append("file", fileupload.files[0]);
  await fetch(url, { method: "POST", body: formData })
    .then((response) => {
      return response.json().then((data) => {
        const drawing_data = JSON.parse(data);
        if (response.ok) {
          initialize(drawing_data);
        }
        return data;
      })
    })
}

function initialize(drawing_data) {
  init_html();
  const xlim = drawing_data["lim"]["x"];
  const ylim = drawing_data["lim"]["y"];
  factor = get_zoom_factor(xlim, ylim);
  var [canvas1, ctx1, ctx2] = init_canvas();
  sets_of_coeffs = drawing_data["sets_of_coeffs"];
  var sets_of_previous = Array(Object.keys(sets_of_coeffs).length);
  config.push(ctx1, ctx2, sets_of_previous, 0, canvas1);
  draw(ctx1, ctx2, sets_of_previous, 0);
}

function init_html() {
  document.getElementsByClassName("animation-wrapper")[0].style.display = "block";
  document.getElementsByClassName("image-post")[0].style.display = "none";
  document.getElementById("toggle-animation").innerText = pause_start[+pause];
}

function init_canvas() {
  const canvas1 = document.getElementById("anim");
  canvas1.width = width;
  canvas1.height = height;
  const ctx1 = canvas1.getContext("2d");
  const canvas2 = document.getElementById("path");
  canvas2.width = width;
  canvas2.height = height;
  const ctx2 = canvas2.getContext("2d");
  return [canvas1, ctx1, ctx2];
}

function quit_animation() {
  quit = !quit;
  exit();
}

function exit() {
  location.reload();
}

function toggle_animation() {
  var btn = document.getElementById("toggle-animation");
  pause = !pause;
  btn.innerText = pause_start[+pause];
  if (!pause) {
    animate();
  }
}

function toggle_circle() {
  show_circle = !show_circle;
  update_canvas();
}

function toggle_vector() {
  show_vector = !show_vector;
  update_canvas();
}

function update_canvas() {
  config[0].clearRect(0, 0, config[4].width, config[4].height);
  config[2] = draw(config[0], config[1], config[2], config[3]);
}

async function animate() {
  var [ctx1, ctx2, sets_of_previous, t, canvas1] = config;
  while (!(pause | quit)) {
    ctx1.clearRect(0, 0, canvas1.width, canvas1.height);
    sets_of_previous = draw(ctx1, ctx2, sets_of_previous, t);
    config = [ctx1, ctx2, sets_of_previous, t, canvas1];
    await new Promise(r => setTimeout(r, interval));
    t += DT;
  }
}


function get_zoom_factor(xlim, ylim) {
  return Math.min(width / xlim[1], height / ylim[1]) * margin_factor;
}

function transform_y(y_coordinate) {
  return - y_coordinate + height;
}


function draw_vector(ctx, previous_real, previous_imag, current_real, current_imag, colour) {
  ctx.beginPath();
  ctx.strokeStyle = colour;
  ctx.moveTo(previous_real, previous_imag);
  ctx.lineTo(current_real, current_imag);
  ctx.stroke();
}

function draw_circle(ctx, current_real, current_imag, mag) {
  ctx.beginPath();
  ctx.strokeStyle = circle_colour;
  ctx.arc(current_real, current_imag, mag, 0, Math.PI * 2);
  ctx.moveTo(current_real, current_imag);
  ctx.stroke();
}

function draw_path(ctx, current_real, current_imag, previous) {
  if (previous != undefined && previous.length == 2) {
    draw_vector(ctx, previous[0], previous[1], current_real, current_imag, path_colour)
  }
}

function erase_path() {
  config[1].clearRect(0, 0, width, height);
}

function change_num_vec() {
  num_vec = document.getElementById("num-vec-slider").value;
  document.getElementById("num-vec").innerText = num_vec;
}

function change_speed() {
  let speed = document.getElementById("speed-slider").value;
  interval = 11 - speed;
  if (speed != 11) {
    document.getElementById("speed").innerText = speed;
  } else {
    document.getElementById("speed").innerText = "max";
  }
}


function get_vector(coeff, n, t) {
  let coeff_real = coeff[0];
  let coeff_imag = coeff[1];
  let e_real = Math.cos(2 * Math.PI * n * t);
  let e_imag = Math.sin(2 * Math.PI * n * t);
  let vector_real = coeff_real * e_real - coeff_imag * e_imag;
  let vector_imag = coeff_imag * e_real + coeff_real * e_imag;
  return [vector_real, vector_imag];
}

function abs(vector) {
  return Math.sqrt(vector[0] ** 2 + vector[1] ** 2);
}

function draw(ctx1, ctx2, sets_of_previous, t) {
  var index = 0;
  for (let coeffs of sets_of_coeffs) {
    ctx1.moveTo(origin[0], origin[1]);
    var current_real = 0;
    var current_imag = 0;
    var n = 0;
    for (let i = 0; i < num_vec; i++) {
      let vector = get_vector(coeffs[n], n, t);
      let real = vector[0] * factor;
      let imag = vector[1] * factor;
      let mag = abs(vector) * factor;
      if (show_circle) {
        draw_circle(ctx1, current_real, transform_y(current_imag), mag);
      }
      previous_real = current_real
      previous_imag = current_imag
      current_real += real;
      current_imag += imag;
      if (show_vector) {
        draw_vector(ctx1, previous_real, transform_y(previous_imag), current_real, transform_y(current_imag), vector_colour);
      }
      if (i % 2 == 0) {
        n += i + 1;
      } else {
        n *= -1;
      }
    }
    draw_path(ctx2, current_real, transform_y(current_imag), sets_of_previous[index]);
    sets_of_previous[index] = [current_real, transform_y(current_imag)];
    index++;
  }
  return sets_of_previous;
}
