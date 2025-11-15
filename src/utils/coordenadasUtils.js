// src/utils/coordenadasUtils.js

/**
 * Convierte coordenadas de formato DMS (gg°mm'ss.ss'') a decimal
 * @param {string} dms - Coordenada en formato "12°34'56.78''"
 * @returns {number} - Coordenada en formato decimal
 */
export function DMSToDecimal(dms) {
  const regex = /^(-?\d{1,3})°(\d{1,2})'([\d.]{1,5})''$/;
  const match = dms.match(regex);
  
  if (!match) {
    throw new Error('Formato DMS inválido. Debe ser gg°mm\'ss.ss\'\'');
  }
  
  const [, grados, minutos, segundos] = match;
  const gradosNum = parseInt(grados);
  const minutosNum = parseInt(minutos);
  const segundosNum = parseFloat(segundos);
  
  let decimal = Math.abs(gradosNum) + minutosNum/60 + segundosNum/3600;
  
  if (gradosNum < 0) decimal *= -1;
  
  return decimal;
}

/**
 * Convierte coordenadas de formato decimal a DMS
 * @param {number} decimal - Coordenada en formato decimal
 * @returns {string} - Coordenada en formato "gg°mm'ss.ss''"
 */
export function decimalToDMS(decimal) {
  const absolute = Math.abs(decimal);
  const grados = Math.floor(absolute);
  const minutosFloat = (absolute - grados) * 60;
  const minutos = Math.floor(minutosFloat);
  const segundos = ((minutosFloat - minutos) * 60).toFixed(2);
  
  const signo = decimal < 0 ? '-' : '';
  
  return `${signo}${grados}°${minutos}'${segundos}''`;
}

/**
 * Valida que una coordenada esté en formato DMS correcto
 * @param {string} coordenada - Coordenada a validar
 * @returns {boolean} - true si es válida
 */
export function validarFormatoDMS(coordenada) {
  const regex = /^-?\d{1,3}°\d{1,2}'\d{1,2}(\.\d{1,2})?''$/;
  return regex.test(coordenada);
}

/**
 * Valida que una coordenada esté dentro de los límites de Colombia
 * @param {string} latitud - Latitud en formato DMS
 * @param {string} longitud - Longitud en formato DMS
 * @returns {{valido: boolean, error?: string}}
 */
export function validarCoordenadasColombia(latitud, longitud) {
  try {
    const lat = DMSToDecimal(latitud);
    const lon = DMSToDecimal(longitud);
    
    const COLOMBIA_BOUNDS = {
      latMin: -4.23,
      latMax: 12.47,
      lonMin: -79.02,
      lonMax: -66.85
    };
    
    if (lat < COLOMBIA_BOUNDS.latMin || lat > COLOMBIA_BOUNDS.latMax) {
      return { valido: false, error: 'Latitud fuera de Colombia' };
    }
    
    if (lon < COLOMBIA_BOUNDS.lonMin || lon > COLOMBIA_BOUNDS.lonMax) {
      return { valido: false, error: 'Longitud fuera de Colombia' };
    }
    
    return { valido: true };
  } catch (error) {
    return { valido: false, error: error.message };
  }
}

/**
 * Calcula la distancia entre dos puntos (Haversine)
 * @param {string} lat1 - Latitud punto 1 en DMS
 * @param {string} lon1 - Longitud punto 1 en DMS
 * @param {string} lat2 - Latitud punto 2 en DMS
 * @param {string} lon2 - Longitud punto 2 en DMS
 * @returns {number} - Distancia en metros
 */
export function calcularDistancia(lat1, lon1, lat2, lon2) {
  const lat1Dec = DMSToDecimal(lat1);
  const lon1Dec = DMSToDecimal(lon1);
  const lat2Dec = DMSToDecimal(lat2);
  const lon2Dec = DMSToDecimal(lon2);
  
  const R = 6371000; // Radio de la Tierra en metros
  const φ1 = lat1Dec * Math.PI / 180;
  const φ2 = lat2Dec * Math.PI / 180;
  const Δφ = (lat2Dec - lat1Dec) * Math.PI / 180;
  const Δλ = (lon2Dec - lon1Dec) * Math.PI / 180;
  
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return R * c;
}