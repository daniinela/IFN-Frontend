// src/services/geocodingService.js
import axios from 'axios';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiZGFuaWluZWxhIiwiYSI6ImNtZ2g2cWtseDByZHMybHB6MXk4ZWRpeDEifQ.R8aCNafjpaNkurR7yeCySQ';

/**
 * Obtiene información geográfica (departamento, municipio, región) 
 * a partir de coordenadas usando Mapbox Geocoding API
 * 
 * @param {number} longitud - Longitud (ej: -74.08175)
 * @param {number} latitud - Latitud (ej: 4.60971)
 * @returns {Promise<Object>} Información de la ubicación
 */
export const obtenerUbicacionPorCoordenadas = async (longitud, latitud) => {
  try {
    console.log('🌍 Consultando ubicación para:', { latitud, longitud });

    // Mapbox Geocoding API (Reverse Geocoding)
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitud},${latitud}.json`;
    
    const response = await axios.get(url, {
      params: {
        access_token: MAPBOX_TOKEN,
        types: 'place,region,country', // Municipio, Departamento, País
        language: 'es', // Respuestas en español
        limit: 1
      }
    });

    if (!response.data.features || response.data.features.length === 0) {
      throw new Error('No se encontró información para estas coordenadas');
    }

    const features = response.data.features;
    console.log('✅ Respuesta de Mapbox:', features);

    // Extraer información
    let municipio = null;
    let departamento = null;
    let pais = null;

    features.forEach(feature => {
      const placeType = feature.place_type[0];
      
      if (placeType === 'place') {
        // Municipio
        municipio = feature.text;
      } else if (placeType === 'region') {
        // Departamento/Estado
        departamento = feature.text;
      } else if (placeType === 'country') {
        // País
        pais = feature.text;
      }

      // También buscar en el contexto
      if (feature.context) {
        feature.context.forEach(ctx => {
          if (ctx.id.startsWith('place.')) {
            municipio = ctx.text;
          } else if (ctx.id.startsWith('region.')) {
            departamento = ctx.text;
          } else if (ctx.id.startsWith('country.')) {
            pais = ctx.text;
          }
        });
      }
    });

    const resultado = {
      municipio: municipio || 'No encontrado',
      departamento: departamento || 'No encontrado',
      pais: pais || 'Colombia',
      coordenadas: { latitud, longitud },
      lugar_completo: features[0]?.place_name || 'Ubicación desconocida'
    };

    console.log('📍 Ubicación identificada:', resultado);
    return resultado;

  } catch (error) {
    console.error('❌ Error en geocoding:', error);
    throw new Error('No se pudo obtener la ubicación: ' + error.message);
  }
};

/**
 * Servicio completo para geocoding
 */
export const geocodingService = {
  /**
   * Reverse geocoding - De coordenadas a dirección
   */
  reverseGeocode: obtenerUbicacionPorCoordenadas,

  /**
   * Forward geocoding - De dirección a coordenadas
   */
  forwardGeocode: async (query) => {
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`;
      
      const response = await axios.get(url, {
        params: {
          access_token: MAPBOX_TOKEN,
          country: 'CO', // Solo Colombia
          language: 'es',
          limit: 5
        }
      });

      return response.data.features.map(feature => ({
        lugar: feature.place_name,
        coordenadas: {
          longitud: feature.center[0],
          latitud: feature.center[1]
        }
      }));
    } catch (error) {
      console.error('Error en forward geocoding:', error);
      throw error;
    }
  }
};