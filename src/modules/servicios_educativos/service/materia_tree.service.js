const MateriaTreeRepository = require("../repository/materia_tree.repository");
const createCrudService = require("../../../shared/service/createCrudService");

module.exports = createCrudService({
  Repository: MateriaTreeRepository,
  entityName: "materia_tree",
  serviceName: "MateriaTreeService",
});
