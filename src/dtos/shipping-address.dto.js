/**
 * DTO para ShippingAddress
 * Convierte el formato de base de datos (snake_case) al formato esperado por el frontend (camelCase)
 */

/**
 * Crear un DTO para una dirección de envío individual
 * @param {Object} address - Dirección de envío desde la base de datos 
 * @returns {Object} - DTO con transformaciones para el frontend
 */
export const createShippingAddressDTO = (address) => {
  if (!address) return null

  return {
    id: address._id ? address._id.toString() : address.id,
    state: address.state,
    street: address.street,
    postalCode: address.postal_code, // Convertir snake_case a camelCase
    country: address.country,
    apt: address.apt || null,
    locality: address.locality,
    isDefault: address.is_default, // Convertir snake_case a camelCase
    details: address.details || '',
    createdAt: address.createdAt,
    updatedAt: address.updatedAt
  }
}

/**
 * Crear un array de DTOs para múltiples direcciones de envío
 * @param {Array} addresses - Array de direcciones de envío
 * @returns {Array} - Array de DTOs
 */
export const createShippingAddressesDTO = (addresses) => {
  if (!addresses || !Array.isArray(addresses)) return []
  return addresses.map(address => createShippingAddressDTO(address))
}

/**
 * Convertir un DTO de dirección de envío de regreso al formato de base de datos
 * @param {Object} addressDTO - Dirección de envío desde el frontend
 * @returns {Object} - Formato para guardar en la base de datos
 */
export const fromShippingAddressDTO = (addressDTO) => {
  if (!addressDTO) return null

  return {
    state: addressDTO.state,
    street: addressDTO.street,
    postal_code: addressDTO.postalCode, // Convertir camelCase a snake_case
    country: addressDTO.country,
    apt: addressDTO.apt,
    locality: addressDTO.locality,
    is_default: addressDTO.isDefault !== undefined ? addressDTO.isDefault : true, // Convertir camelCase a snake_case
    details: addressDTO.details
  }
}
