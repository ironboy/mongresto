module.exports = function ngMethods(){
  // Define ngResource methods
  return {
    get: { method: 'GET', isArray: true },
    getById: { method: 'GET', isArray: false },
    create: { method: 'POST', isArray: true},
    update: { method: 'PUT' },
    remove: { method: 'DELETE' }
  };
};
