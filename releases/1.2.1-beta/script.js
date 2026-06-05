

const mapa = L.map('mapa').setView([9.3047, -75.3978], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(mapa);

/* VARIABLES PARA CADA RUTA + SUS FLECHAS*/
let rutaA_ida, decoA_ida;
let rutaA_retorno, decoA_retorno;
let rutaB_ida, decoB_ida;
let rutaB_retorno, decoB_retorno;

/* FUNCIÓN PARA AGREGAR FLECHAS A UNA POLILÍNEA */
function agregarFlechas(geoJsonLayer, colorFlecha = "white") {
  const grupoDecorador = L.featureGroup().addTo(mapa);

  geoJsonLayer.eachLayer(layer => {
    if (layer instanceof L.Polyline) {
      const deco = L.polylineDecorator(layer, {
        patterns: [{
          offset: 0,
          repeat: 25,
          symbol: L.Symbol.arrowHead({
            pixelSize: 12,
            polygon: false,
            pathOptions: { color: colorFlecha, weight: 2 }
          })
        }]
      });
      deco.addTo(grupoDecorador);
    }
  });

  return grupoDecorador;
}

/* CARGA DE RUTAS + FLECHAS */

// Ruta A ida
fetch('a_ida.json')
  .then(res => res.json())
  .then(data => {
    rutaA_ida = L.geoJSON(data, {
      filter: f => f.geometry.type === "LineString",
      style: { color: 'green', weight: 5, opacity: 0.2 }
    }).addTo(mapa);

    decoA_ida = agregarFlechas(rutaA_ida, "#0b9e0b");
  });

// Ruta A retorno
fetch('a_retorno.json')
  .then(res => res.json())
  .then(data => {
    rutaA_retorno = L.geoJSON(data, {
      filter: f => f.geometry.type === "LineString",
      style: { color: 'orange', weight: 4, opacity: 0.3, dashArray: '6 6' }
    }).addTo(mapa);

    decoA_retorno = agregarFlechas(rutaA_retorno, "#eb7e02");
  });

// Ruta B ida
fetch('b_ida.json')
  .then(res => res.json())
  .then(data => {
    rutaB_ida = L.geoJSON(data, {
      filter: f => f.geometry.type === "LineString",
      style: { color: 'blue', weight: 5, opacity: 0.2 }
    }).addTo(mapa);

    decoB_ida = agregarFlechas(rutaB_ida, "#0099ff");
  });

// Ruta B retorno
fetch('b_retorno.json')
  .then(res => res.json())
  .then(data => {
    rutaB_retorno = L.geoJSON(data, {
      filter: f => f.geometry.type === "LineString",
      style: { color: 'red', weight: 5, opacity: 0.3, dashArray: '9 9' }
    }).addTo(mapa);

    decoB_retorno = agregarFlechas(rutaB_retorno, "#ff0000");

  });

/* CONTROL DE VISIBILIDAD */
function toggleRuta(id, layer, deco) {
  const check = document.getElementById(id);

  check.addEventListener("change", () => {
    if (!layer || !deco) return; // aún no cargada

    if (check.checked) {
      layer.addTo(mapa);
      deco.addTo(mapa);
    } else {
      mapa.removeLayer(layer);
      mapa.removeLayer(deco);
    }
  });
}

setTimeout(() => {
  toggleRuta("a_ida", rutaA_ida, decoA_ida);
  toggleRuta("a_retorno", rutaA_retorno, decoA_retorno);
  toggleRuta("b_ida", rutaB_ida, decoB_ida);
  toggleRuta("b_retorno", rutaB_retorno, decoB_retorno);
}, 1500);


 let marcadorUsuario = null;
  const botonUbicacion = document.getElementById('btnUbicacion');
 let coordenadasUsuario = { lat: null, lon: null };
 
// Obtener dirección desde coordenadas (solo barrio y dirección)
async function obtenerDireccion(lat, lon) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`);
    const data = await res.json();
    const addr = data.address;
    const barrio = addr.suburb || addr.neighbourhood || addr.village || addr.town || "";
    const calle = addr.road || addr.residential || addr.pedestrian || "";
    const numero = addr.house_number ? ` #${addr.house_number}` : "";
    const texto = [barrio, `${calle}${numero}`].filter(Boolean).join(", ");
    return texto || "Ubicación desconocida";
  } catch {
    return "No se pudo obtener la dirección";
  }
}


  // --- Boton Donde estas? ---
  async function mostrarUbicacion(lat, lon) {
    const direccion = await obtenerDireccion(lat, lon);
      verificarDistancia(lat, lon);

    // Si ya hay un marcador, actualizar posición en lugar de eliminar y crear
    if (!marcadorUsuario) {
      marcadorUsuario = L.marker([lat, lon], { draggable: true }).addTo(mapa);
      intentarCalcularRuta();
    } else {
      marcadorUsuario.setLatLng([lat, lon]);
      intentarCalcularRuta();
    }
    if (!estaDentroDelArea(lat, lon)) {
  marcadorUsuario.setOpacity(0.5); // fuera → transparente
} else {
  marcadorUsuario.setOpacity(1);   // dentro → normal
}

    marcadorUsuario.bindPopup(`📍 ${direccion}`).openPopup();
    mapa.setView([lat, lon], 15);

    botonUbicacion.innerText = `📍 ${direccion}`;

    // Eliminar eventos previos y volver a asignar
    marcadorUsuario.off('dragend');
    marcadorUsuario.on('dragend', async (e) => {
      const pos = e.target.getLatLng();
if (estaDentroDelArea(pos.lat, pos.lng)) {
  coordenadasUsuario = { lat: pos.lat, lon: pos.lng };
  marcadorUsuario.setOpacity(1);   // dentro → normal
} else {
  marcadorUsuario.setOpacity(0.5); // fuera → transparente
  coordenadasUsuario = { lat: null, lon: null };
}
      verificarDistancia(pos.lat, pos.lng);
      const nuevaDir = await obtenerDireccion(pos.lat, pos.lng);
      marcadorUsuario.setPopupContent(`${nuevaDir} 📍`).openPopup();
      botonUbicacion.innerText = `${nuevaDir} 📍`;
      intentarCalcularRuta();
    });
  if (estaDentroDelArea(lat, lon)) {
  coordenadasUsuario = { lat, lon };
} else {
  coordenadasUsuario = { lat: null, lon: null };
}
    intentarCalcularRuta();
  }

  // --- Intentar detectar ubicación automáticamente al inicio ---
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => mostrarUbicacion(pos.coords.latitude, pos.coords.longitude),
      () => {
        botonUbicacion.innerText = "Pulsa para detectar ubicación 📍";
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
    intentarCalcularRuta();
  } else {
    botonUbicacion.innerText = "Tu navegador no soporta GPS";
  }

  // --- Botón: siempre repite detección al presionarse ---
  botonUbicacion.addEventListener('click', () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización.');
      return;
    }

    botonUbicacion.innerText = '📡 Detectando ubicación...';

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await mostrarUbicacion(pos.coords.latitude, pos.coords.longitude);
        botonUbicacion.innerText = 'Actualizado...';
        intentarCalcularRuta();
        setTimeout(() => botonUbicacion.innerText = '¿Dónde estás?', 3000);
      },
      () => {
        botonUbicacion.innerText = 'No se pudo detectar ubicación 📍, toca el mapa.';
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
    intentarCalcularRuta();
  });
  
// FLECHA DE DIRECCIÓN EN TIEMPO REAL (solo móvil)
const esMovil = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
let flechaDireccion = null;
let ultimoAngulo = 0;

if (esMovil && navigator.geolocation) {

  // --- Crear el icono con el estilo ---
  const iconoFlecha = L.divIcon({
    className: 'icono-rotatorio',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    html: '<div class="flecha-usuario"></div>'
  });

  // --- Rastreo continuo de posición ---
  navigator.geolocation.watchPosition(
    (pos) => {
      const { latitude: lat, longitude: lon } = pos.coords;

      if (!flechaDireccion) {
        flechaDireccion = L.marker([lat, lon], { icon: iconoFlecha, interactive: false }).addTo(mapa);
      } else {
        flechaDireccion.setLatLng([lat, lon]);
      }
    },
    (err) => console.warn("Error de GPS:", err),
    { enableHighAccuracy: true, maximumAge: 1000 }
  );

  // --- Orientación de la flecha (brújula en tiempo real) ---
  if (window.DeviceOrientationEvent) {
    window.addEventListener("deviceorientationabsolute", (event) => {
      const heading = event.alpha;
      if (heading == null || !flechaDireccion || !flechaDireccion._icon) return;

      const rotacion = 360 - heading;
      if (Math.abs(rotacion - ultimoAngulo) > 1) {
        ultimoAngulo = rotacion;
        flechaDireccion._icon.firstChild.style.transform = `rotate(${rotacion}deg)`;
      }
    });
  }
}

// Script para que funcione el menú

const btnDestino = document.getElementById("btnDestino");
const menuDestino = document.getElementById("menuDestino");
const overlayDestino = document.getElementById("overlayDestino");

// Abrir menú
btnDestino.addEventListener("click", () => {
  // 🔄 REINICIAR MAPA A ESTADO NORMAL
mostrarRutasBase();          // vuelve a mostrar todas las busetas
capaRutaSugerida.clearLayers(); // borra la ruta de Turf

   // --- REINICIAR TODO ---
  // Ocultar buscador y sugerencias
  const contBuscador = document.getElementById("buscador-container");
  const listaSugerencias = document.getElementById("sugerencias");
  contBuscador.style.display = "none";
  listaSugerencias.style.display = "none";

  // Reiniciar modo selección destino
  modoSeleccionDestino = false;
  destinoSeleccionado = false;
  coordenadasDestino = null;

  // Eliminar marcador de destino si existe
  if (marcadorDestino) {
    mapa.removeLayer(marcadorDestino);
    marcadorDestino = null;
  }

  // --- ABRIR MENÚ ---
  const menu = document.getElementById("menuDestino");
  const overlay = document.getElementById("overlayDestino");
  overlay.style.display = "block";
  menu.classList.add("activo");
  overlayDestino.style.display = "block";
  menuDestino.classList.add("activo");
});

/* 1. VARIABLES GLOBALES */

let marcadorDestino = null;
let destinoSeleccionado = false;
let modoSeleccionDestino = false;
let coordenadasDestino = null;

const botonDestino = document.getElementById("btnDestino");

/* 2. ÍCONO DEL DESTINO */
const iconoDestino = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -38]
});

/* 3. MENÚ EMERGENTE (ABRIR/CERRAR) */
botonDestino.addEventListener("click", () => {
  const menu = document.getElementById("menuDestino");

  // Mostrar / Ocultar menú
  if (menu.style.display === "none" || menu.style.display === "") {
    menu.style.display = "block";
  } else {
    menu.style.display = "none";
  }
});

/* 4. OPCIÓN “ SELECCIONAR EN EL MAPA” */
 
document.getElementById("opMapa").addEventListener("click", () => {
  document.getElementById("menuDestino").style.display = "none";

  modoSeleccionDestino = true;
  botonDestino.textContent = "📍 Seleccione un lugar en el mapa...";
  intentarCalcularRuta();
});

/* 5. OPCIÓN “BUSCAR DESTINO" */
document.getElementById("opBuscar").addEventListener("click", () => {
  document.getElementById("menuDestino").style.display = "none";

  const cont = document.getElementById("buscador-container");
  cont.style.display = "block";

  const inp = document.getElementById("buscadorDestino");
  inp.value = "";
  inp.focus();

  const sug = document.getElementById("sugerencias");
  sug.innerHTML = "";
  sug.style.display = "none";
  intentarCalcularRuta();
});

/* 6. BASE DE DATOS LOCAL DE LOS PUTOS PUNTOS DE INTERÉS. */
const puntosInteres = [
  {nombre: "Estadio de Beisbol 20 de Enero Y Estadio Arturo Cumplido", lat: 9.27903432041196, lon: -75.40934890508653},
  {nombre: "I.E 20 de Enero", lat: 9.281726422708974, lon: -75.41184872388841},
  {nombre: "Cancha el Cortijo y Iglesia El Cortijo", lat: 9.284336445120793, lon: -75.40722191333771 },
  {nombre: "Olimpica Argelia", lat: 9.286260860961855, lon: -75.4010796546936},
  {nombre: "Iglesia de Jesucristo Santos de los Dltimos Dias", lat: 9.285501154732717, lon: -75.40167242288591},
  {nombre: "Polideportivo Las Delicias", lat: 9.284442327972732, lon: -75.40011942386629},
  {nombre: "Distrito Militar #11", lat: 9.283298791479082, lon: -75.39886951446535},
  {nombre: "I.E Simon Araujo", lat: 9.285781743287899, lon: -75.39449751377107},
  {nombre: "Ministerio de Transporte", lat: 9.283780559623334, lon: -75.397367477417},
  {nombre: "I.E Vicente de Paul", lat: 9.287788209615755, lon: -75.39538800716402},
  {nombre: "I.E Berthel", lat: 9.292240512060065, lon: -75.39473891258241},
  {nombre: "Plaza Majagual", lat: 9.296014043453892, lon: -75.39515674886702},
  {nombre: "Guacari (Entrada Princial)", lat: 9.302716968423338, lon: -75.38351117681228},
  {nombre: "Exito", lat: 9.303024012477207, lon: -75.388918510199},
  {nombre: "CECAR", lat: 9.307684184763506, lon: -75.36779409717586},
  {nombre: "Universidad AJS", lat: 9.299923402154736, lon: -75.39249187784847},
  {nombre: "Gran Centro El Parque", lat: 9.303862047315468, lon: -75.39444452602017},
  {nombre: "Terminal de Transporte", lat: 9.295391787784352, lon: -75.38337236714865},
  {nombre: "Hotel Malibu", lat: 9.302824451542511, lon: -75.37918812104033},
  {nombre: "Guacari (Entrada Trasera)", lat: 9.30015104011222, lon: -75.38202053383266},
  {nombre: "Gobernacion de Sucre", lat: 9.302535935876223, lon: -75.38505143002136},
  {nombre: "Confasucre", lat: 9.300248977345811, lon: -75.3853089220915},
  {nombre: "Terminal Transporte Since", lat: 9.299650593057088, lon: -75.38586610177897},
  {nombre: "Terminal Transporte Corozal", lat: 9.30133141239898, lon: -75.38745556410525},
  {nombre: "Muebles Jamar", lat: 9.29803475386084, lon: -75.38579426167142},
  {nombre: "Cancha Sintetica La #10", lat: 9.2971603660902, lon: -75.38465978667739},
  {nombre: "Inter Rapidisimo", lat: 9.298334585633445, lon: -75.39062251540942},
  {nombre: "Monumento Las Vacas", lat: 9.298068724957888, lon: -75.39308303901244},
  {nombre: "Teatro Municipal", lat: 9.302080245831101, lon: -75.39213115760856},
  {nombre: "Cementerio Central", lat: 9.305722477893097, lon: -75.38911985988378},
  {nombre: "Clinica La Concepcion", lat: 9.307175815377105, lon: -75.36971105813566},
  {nombre: "Universidad de Sucre", lat: 9.315201286184745, lon: -75.38961654970893},
  {nombre: "Mercado Nuevo", lat: 9.295884127171137, lon: -75.38669830628714},
  {nombre: "Clinica Santa Maria", lat: 9.306586554546177, lon: -75.39374879171422},
  {nombre: "Clinica Salud Social", lat: 9.295996436493944, lon: -75.39700336102523},
  {nombre: "Clinica Corposucre", lat: 9.299058409022345, lon: -75.3923653628782},
];


 /* 7. SISTEMA DE BUSCADOR + SUGERENCIAS */
 
const inputDestino = document.getElementById("buscadorDestino");
inputDestino.setAttribute("autocomplete", "off");
const listaSugerencias = document.getElementById("sugerencias");

let timeoutBusqueda = null;

//  Cuando escribe
inputDestino.addEventListener("input", () => {
  clearTimeout(timeoutBusqueda);

  const texto = inputDestino.value.trim().toLowerCase();

  if (texto.length === 0) {
    listaSugerencias.style.display = "none";
    return;
  }

  // Sugerencias mientras escribe
  mostrarSugerencias(filtrarPOI(texto));

  // Después de 3 seg → búsqueda precisa
  timeoutBusqueda = setTimeout(() => {
    mostrarSugerencias(filtrarPOI(texto, true));
  }, 500);
});

//  Filtro de POI
function filtrarPOI(texto, preciso = false) {
  return puntosInteres.filter(p =>
    preciso
      ? p.nombre.toLowerCase().includes(texto)
      : p.nombre.toLowerCase().startsWith(texto)
  );
}

//  Mostrar sugerencias
function mostrarSugerencias(lista) {
  listaSugerencias.innerHTML = "";
  listaSugerencias.style.display = lista.length ? "block" : "none";
  listaSugerencias.style.animation = "none";
  listaSugerencias.offsetHeight;
  listaSugerencias.style.animation = "sugerenciasEntrar .25s ease";

  lista.forEach(poi => {
    const item = document.createElement("div");
    item.className = "sugerencia-item";
    item.style.padding = "10px";
    item.style.cursor = "pointer";
    item.style.borderBottom = "1px solid #333";

    item.textContent = poi.nombre;

    item.addEventListener("click", () => {
      seleccionarDestinoPOI(poi);
    });

    listaSugerencias.appendChild(item);
  });
}

// 📍 Cuando selecciona un POI
function seleccionarDestinoPOI(poi) {
inputDestino.classList.remove("seleccionado");
void inputDestino.offsetWidth;
inputDestino.classList.add("seleccionado");
if (!estaDentroDelArea(poi.lat, poi.lon)) {
  mostrarAvisoDestino();
  return;
}
  ocultarAvisoDestino();
  listaSugerencias.style.display = "none";
  document.getElementById("buscador-container").style.display = "none";
  coordenadasDestino = { lat: poi.lat, lng: poi.lon };

  // Eliminar marcador anterior
  if (marcadorDestino) mapa.removeLayer(marcadorDestino);

  marcadorDestino = L.marker([poi.lat, poi.lon], { icon: iconoDestino }).addTo(mapa);
  marcadorDestino.bindPopup(`<b>${poi.nombre}</b> 📍`).openPopup();

  mapa.flyTo([poi.lat, poi.lon], 16);

  botonDestino.textContent = poi.nombre + " 📍";

  destinoSeleccionado = true;
  modoSeleccionDestino = false;
  intentarCalcularRuta();
}

 /* 8. SELECCIONAR DESTINO HACIENDO CLIC EN EL MAPA */
 
mapa.on("click", async (e) => {
  if (!modoSeleccionDestino) return;

  const { lat, lng } = e.latlng;
if (!estaDentroDelArea(lat, lng)) {
  mostrarAvisoDestino();
  return;
}
ocultarAvisoDestino();
  coordenadasDestino = { lat, lng };

  if (marcadorDestino) mapa.removeLayer(marcadorDestino);

  marcadorDestino = L.marker([lat, lng], { icon: iconoDestino }).addTo(mapa);

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`
    );
    const data = await res.json();

    const addr = data.address;
    const barrio = addr.suburb || addr.neighbourhood || addr.village || addr.town || "";
    const calle = addr.road || addr.residential || addr.pedestrian || "";
    const numero = addr.house_number ? ` #${addr.house_number}` : "";
    const direccion = [barrio, `${calle}${numero}`].filter(Boolean).join(", ") || "Destino sin dirección";

    marcadorDestino.bindPopup(`<b>Destino:</b><br>${direccion} 📍`).openPopup();
    botonDestino.textContent = direccion + " 📍";

  } catch {
    botonDestino.textContent = "Destino seleccionado 📍";
  }

  mapa.flyTo([lat, lng], 16);
  modoSeleccionDestino = false;
  destinoSeleccionado = true;
  intentarCalcularRuta();
});

// VERIFICAR SI EL USUARIO ESTÁ DENTRO DE UN RADIO DE 4.5 KM 

// Centro de Sincelejo
const centroSincelejo = { lat: 9.303834061949027, lon: -75.39591846078204 };
const radioMaximoMetros = 4500; // 4.5 km

// Función para calcular distancia Haversine
function distanciaEnMetros(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}
// VENTANA EMERGENTE HTML PARA DESTINO FUERA DEL MAPA

let avisoDestinoVisible = false;

function mostrarAvisoDestino() {
  if (avisoDestinoVisible) return;

  const div = document.getElementById("avisoDestinoFuera");
  div.style.display = "flex";
  avisoDestinoVisible = true;
}

function ocultarAvisoDestino() {
  const div = document.getElementById("avisoDestinoFuera");
  if (!div) return;

  div.style.display = "none";
  avisoDestinoVisible = false;
}

//  VENTANA EMERGENTE HTML 
let avisoFueraVisible = false;

// Crear la ventana (solo una vez)
function crearVentanaFuera() {
  if (document.getElementById("avisoFuera")) return;

  const div = document.createElement("div");
  div.id = "avisoFuera";
  div.innerHTML = `
    <div class="aviso-contenido">
      <button class="cerrar-aviso" onclick="ocultarAvisoFuera()">✖</button>
      <h3>⚠ Fuera del área</h3>
      <p>Estás fuera del rango de las busetas (Fuera de Sincelejo)</p>
    </div>
  `;
  document.body.appendChild(div);
}

function mostrarAvisoFuera() {
  if (avisoFueraVisible) return;
  crearVentanaFuera();
  document.getElementById("avisoFuera").style.display = "flex";
  avisoFueraVisible = true;
}

function ocultarAvisoFuera() {
  const div = document.getElementById("avisoFuera");
  if (!div) return;
  div.style.display = "none";
  avisoFueraVisible = false;
}

// Verificar distancia pa no poner since.
function verificarDistancia(lat, lon) {
  const d = distanciaEnMetros(lat, lon, centroSincelejo.lat, centroSincelejo.lon);

  if (d > radioMaximoMetros) {
    mostrarAvisoFuera();
  } else {
    ocultarAvisoFuera();
  }
}
// Verificar distancia destino pa no poner since.
function estaDentroDelArea(lat, lon) {
  const d = distanciaEnMetros(lat, lon, centroSincelejo.lat, centroSincelejo.lon);
  return d <= radioMaximoMetros;
}

/* ===========================================================
   SISTEMA AUTOMÁTICO DE RUTA SUGERIDA
   =========================================================== */

// Capa donde dibujaremos la línea del bus sugerido
let capaRutaSugerida = L.layerGroup().addTo(mapa);

// Ocultar rutas

function ocultarRutasBase() {
  [
    rutaA_ida, decoA_ida,
    rutaA_retorno, decoA_retorno,
    rutaB_ida, decoB_ida,
    rutaB_retorno, decoB_retorno
  ].forEach(l => {
    if (l && mapa.hasLayer(l)) mapa.removeLayer(l);
  });
}

function mostrarRutasBase() {
  [
    rutaA_ida, decoA_ida,
    rutaA_retorno, decoA_retorno,
    rutaB_ida, decoB_ida,
    rutaB_retorno, decoB_retorno
  ].forEach(l => {
    if (l && !mapa.hasLayer(l)) mapa.addLayer(l);
  });
}


// Función principal que se activa automáticamente
function intentarCalcularRuta() {

    // 1. Validar si tenemos ambos datos
    if (!coordenadasUsuario.lat || !coordenadasDestino) {
        return; // Falta alguno, no hacemos nada aún
    }

    console.log("Datos completos. Calculando ruta...");
    capaRutaSugerida.clearLayers(); // Borrar rutas anteriores

    // 2. Preparar puntos para Turf.js
    const ptInicio = turf.point([coordenadasUsuario.lon, coordenadasUsuario.lat]);
    const ptFin = turf.point([coordenadasDestino.lng, coordenadasDestino.lat]);

    // Si el destino está muy cerca, no recomendar bus
const distanciaDirecta =
    turf.distance(ptInicio, ptFin, { units: "kilometers" }) * 1000;

if (distanciaDirecta < 900) {
    capaRutaSugerida.clearLayers();
    mostrarRutasBase();

    const btnInfo = document.getElementById('btnDestino');
    btnInfo.innerHTML = "🚶 Es más rápido caminar";

L.polyline([
    [coordenadasUsuario.lat, coordenadasUsuario.lon],
    [coordenadasDestino.lat, coordenadasDestino.lng]
], {
    color: "green",
    dashArray: "10,5",
    weight: 5
}).addTo(capaRutaSugerida);

    return;
}

    // 3. Definir las rutas disponibles (asegúrate que las variables rutaA_ida, etc. ya cargaron)
    const rutasDisponibles = [
        { id: "A (Ida)", layer: rutaA_ida, color: "green" },
        { id: "A (Retorno)", layer: rutaA_retorno, color: "orange" },
        { id: "B (Ida)", layer: rutaB_ida, color: "blue" },
        { id: "B (Retorno)", layer: rutaB_retorno, color: "red" }
    ];

    let mejorOpcion = null;
    let menorDistanciaTotal = Infinity;

    // 4. Analizar cuál ruta sirve
    rutasDisponibles.forEach(r => {
        if (!r.layer) return; // Si el JSON no ha cargado, saltar

        const geojson = r.layer.toGeoJSON();
        // Aplanar features por si viene como Collection o Array
        const features = geojson.features ? geojson.features : [geojson];

        features.forEach(feature => {
            if (feature.geometry.type === 'LineString') {
                const linea = feature;

                // Buscar el punto de la línea más cercano al usuario y al destino
                const snapInicio = turf.nearestPointOnLine(linea, ptInicio);
                const snapFin = turf.nearestPointOnLine(linea, ptFin);
                // IMPORTANTE: Validar sentido de la ruta
                // 'location' es la distancia recorrida en la línea. 
                // Si inicio < fin, el bus va en la dirección correcta.
if (snapInicio.properties.location < snapFin.properties.location) {

    // Distancia recorrida por la buseta
    const distanciaBus =
        snapFin.properties.location -
        snapInicio.properties.location;

    // Si la buseta recorrería menos de 800 m,
    // es mejor caminar.
    if (distanciaBus < 0.8) {
        return;
    }

    // Calcular cuánto tiene que caminar el usuario
    const distCaminata1 = turf.distance(ptInicio, snapInicio);
    const distCaminata2 = turf.distance(ptFin, snapFin);
    const totalCaminata = distCaminata1 + distCaminata2;

    if (totalCaminata < menorDistanciaTotal) {
        menorDistanciaTotal = totalCaminata;
        mejorOpcion = {
            ruta: r,
            puntoSubida: snapInicio,
            puntoBajada: snapFin,
            lineaCompleta: linea
        };
    }
}
            }
        });
    });

    // 5. Dibujar el resultado
    dibujarResultado(mejorOpcion, ptInicio, ptFin);
}

function dibujarResultado(opcion, ptInicio, ptFin) {
    if (!opcion) {
        alert("Es más rápido caminar hasta el destino o no se encontró una ruta adecuada.");
        return;
    }

    // Para ocultar las rutas base y destacar la sugerida

    ocultarRutasBase();

    // A. Línea punteada: Usuario -> Parada
    const caminata1 = [
        [ptInicio.geometry.coordinates[1], ptInicio.geometry.coordinates[0]],
        [opcion.puntoSubida.geometry.coordinates[1], opcion.puntoSubida.geometry.coordinates[0]]
    ];
    L.polyline(caminata1, { color: 'black', dashArray: '5, 10', weight: 4 }).addTo(capaRutaSugerida);

    // B. Tramo del Bus (Solo la parte que usará)
    const tramoBus = turf.lineSlice(opcion.puntoSubida, opcion.puntoBajada, opcion.lineaCompleta);
    L.geoJSON(tramoBus, {
        style: { color: opcion.ruta.color, weight: 8, opacity: 0.9 }
    }).addTo(capaRutaSugerida)
    .bindPopup(`🚌 <b>Toma la ruta ${opcion.ruta.id} </b>`).openPopup();

    // C. Línea punteada: Parada -> Destino
    const caminata2 = [
        [opcion.puntoBajada.geometry.coordinates[1], opcion.puntoBajada.geometry.coordinates[0]],
        [ptFin.geometry.coordinates[1], ptFin.geometry.coordinates[0]]
    ];
    L.polyline(caminata2, { color: 'black', dashArray: '5, 10', weight: 4 }).addTo(capaRutaSugerida);

    // Ajustar vista para ver toda la ruta
    const bounds = L.latLngBounds(caminata1[0], caminata2[1]);
    mapa.flyToBounds(bounds, { padding: [50, 50] });
    
    // Feedback visual en el botón inferior
    const btnInfo = document.getElementById('btnDestino');
    btnInfo.innerHTML = `Ruta sugerida: <b>${opcion.ruta.id}</b> 🚌`;
}

const menu = document.querySelector(".menu");
const btn = document.getElementById("toggleMenu");

function cerrarMenu() {
  menu.classList.remove("activo");
  btn.innerHTML = "Menu";
  btn.classList.remove("activo");
}

function abrirMenu() {
  menu.classList.add("activo");
  btn.innerHTML = "❮";
  btn.classList.add("activo");
}

btn.addEventListener("click", (e) => {
  e.stopPropagation();

  if (menu.classList.contains("activo")) {
    cerrarMenu();
  } else {
    abrirMenu();
  }
});

/* 🔥 CLICK AFUERA */
document.addEventListener("click", (e) => {
  if (!menu.contains(e.target) && !btn.contains(e.target)) {
    cerrarMenu();
  }
});

//JS para eliminarlo del DOM después de mostrarlo (para optimizar recursos)

setTimeout(() => {
  const intro = document.getElementById("intro");
  if (intro) intro.remove();
}, 8500);

/* Función para cerrar la bienvenida ventana de actualizacion(la usaremos en el botón "Entendido")
function cerrarBienvenida() {
  const modal = document.getElementById("modalBienvenida");
  modal.style.opacity = "0";
  setTimeout(() => {
    modal.style.display = "none";
  }, 300); // Pequeño delay para la transición
} */ //solo usar para la ventana de bienvenida

