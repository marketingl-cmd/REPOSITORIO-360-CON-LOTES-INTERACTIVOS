"use strict";

const panorama = document.getElementById("panorama");
const marco = document.getElementById("marco");
const estado = document.getElementById("estado");
const alejar = document.getElementById("alejar");
const acercar = document.getElementById("acercar");
const reiniciar = document.getElementById("reiniciar");
const pantalla = document.getElementById("pantalla");

function mostrarEstado(mensaje) {
  estado.textContent = mensaje;
  estado.hidden = false;
}

function iniciarPanorama() {
  const { Viewer, ImageUrlSource, EquirectGeometry, RectilinearView } = window.Marzipano;
  const vistaInicial = { yaw: 0.27, pitch: -0.03, fov: Math.PI / 2.7 };
  const vista = new RectilinearView(
    vistaInicial,
    RectilinearView.limit.traditional(2048, Math.PI / 2, Math.PI * 0.8)
  );
  const visor = new Viewer(panorama);
  const escena = visor.createScene({
    source: ImageUrlSource.fromString("./pruebaPanorama.jpg"),
    geometry: new EquirectGeometry([{ width: 2048 }]),
    view: vista,
    pinFirstLevel: true
  });

  const texturas = escena.layer().textureStore();
  texturas.addEventListener("textureLoad", () => {
    estado.hidden = true;
    for (const boton of [alejar, acercar, reiniciar, pantalla]) boton.disabled = false;
  });
  texturas.addEventListener("textureError", () => {
    mostrarEstado("No se pudo cargar el panorama. Recarga la página para reintentar.");
  });
  const ancla = document.createElement("div");
  const marcador = document.createElement("button");
  marcador.type = "button";
  marcador.className = "marcador-lote";
  marcador.textContent = "📍 Lote 01";
  marcador.setAttribute("aria-label", "Ver información del lote 01");
  marcador.addEventListener("click", () => window.alert("Lote 01"));
  ancla.appendChild(marcador);
  escena.hotspotContainer().createHotspot(ancla, { yaw: 0.42, pitch: -0.15 });

  escena.switchTo({ transitionDuration: 0 });

  const zoom = (factor) => vista.setFov(vista.fov() * factor);
  alejar.addEventListener("click", () => zoom(1.2));
  acercar.addEventListener("click", () => zoom(1 / 1.2));
  reiniciar.addEventListener("click", () => vista.setParameters(vistaInicial));

  const teclas = {
    ArrowLeft: () => vista.offsetYaw(-0.1),
    ArrowRight: () => vista.offsetYaw(0.1),
    ArrowUp: () => vista.offsetPitch(0.1),
    ArrowDown: () => vista.offsetPitch(-0.1),
    "+": () => zoom(1 / 1.2),
    "-": () => zoom(1.2),
    Home: () => vista.setParameters(vistaInicial)
  };
  panorama.addEventListener("keydown", (evento) => {
    if (!Object.hasOwn(teclas, evento.key)) return;
    evento.preventDefault();
    if (!reiniciar.disabled) teclas[evento.key]();
  });

  if (document.fullscreenEnabled && marco.requestFullscreen) {
    pantalla.hidden = false;
    pantalla.addEventListener("click", async () => {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else await marco.requestFullscreen();
      } catch {
        pantalla.hidden = true;
      }
    });
    document.addEventListener("fullscreenchange", () => {
      const etiqueta = document.fullscreenElement ? "Salir de pantalla completa" : "Pantalla completa";
      pantalla.setAttribute("aria-label", etiqueta);
      pantalla.title = etiqueta;
    });
  }
}

if (!window.Marzipano) {
  mostrarEstado("No se pudo descargar Marzipano. Revisa tu conexión y recarga la página.");
} else {
  try {
    iniciarPanorama();
  } catch (error) {
    console.error("Error al iniciar el visor 360°", error);
    mostrarEstado("No se pudo iniciar el visor 360°. Verifica que tu navegador admita WebGL.");
  }
}
