-- ============================================================================
-- Procedimientos almacenados para Sistema Habilitador
-- Base de datos: sisthabpro
-- ============================================================================

USE sisthabpro;

DELIMITER $$

-- ============================================================================
-- Procedimiento: AgregarEditar
-- Descripción: Agregar o editar un empleado (ejemplo - ajustar según necesidad)
-- ============================================================================
DROP PROCEDURE IF EXISTS `AgregarEditar`$$

CREATE PROCEDURE `AgregarEditar` (
  IN _id INT,
  IN _name VARCHAR(45),
  IN _salary INT
)
BEGIN
  IF _id = 0 THEN
    INSERT INTO empleado (name, salary)
    VALUES (_name, _salary);

    SET _id = LAST_INSERT_ID();
  ELSE
    UPDATE empleado
    SET
    name = _name,
    salary = _salary
    WHERE id = _id;
  END IF;

  SELECT _id AS 'id';
END$$

-- ============================================================================
-- Procedimiento: generar_habilitadores
-- Descripción: Generar habilitadores para un squad específico
-- ============================================================================
DROP PROCEDURE IF EXISTS `generar_habilitadores`$$

CREATE PROCEDURE `generar_habilitadores` (
  IN `Id_Iniciativa_` INT(11)
)
BEGIN
  INSERT INTO habilita_squad (
    HabSquad,
    TituloHabSquad,
    NombreHabSquad,
    ImprescindibleSquad,
    EstadoHabSquad,
    IdSquad
  )
  SELECT
    Id,
    Titulo,
    Nombre,
    Imprescindible,
    ParaAdd,
    Id_Iniciativa_
  FROM control_nube;
END$$

DELIMITER ;

-- ============================================================================
-- Fin de procedimientos almacenados
-- ============================================================================
