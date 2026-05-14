const { ActionLog } = require("../../../../core/db/db.associations");
const createCrudRepository = require("../../../shared/repository/createCrudRepository");

module.exports = createCrudRepository({
  Model: ActionLog,
  entity: "action_log",
  primaryKeys: ["id_action"],
});
