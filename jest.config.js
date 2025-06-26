export default {
  transform: {},
  moduleNameMapper: {
    '^(/./..?/.*).(js|mjs)$': '$1'
  },
  testEnvironment: 'node',
  testTimeout: 30000 // Aumentar el timeout a 30 segundos
}
